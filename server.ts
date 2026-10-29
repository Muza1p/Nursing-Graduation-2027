import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

const PORT = 3000;

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  // =========================================================================
  // API 1: Server-Side AI Receipt Analysis via @google/genai (Requirement 6)
  // =========================================================================
  app.post('/api/receipts/analyze', async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = 'image/jpeg',
        expectedAmountIQD,
        studentName,
        submittedReference = '',
        submittedDate = '',
        expectedRecipientCard = '6132013829',
        existingReferences = [],
        isDuplicateImageHash = false,
      } = req.body || {};

      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({
          error: 'بيانات صورة الوصل غير متوفرة للتحليل.',
        });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const ai = createGeminiClient();

      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message:
            'مفتاح خدمة Gemini API غير مهيأ على الخادم حالياً؛ تم تحويل الوصل إلى المراجعة البشرية المباشرة للمشرف.',
        });
        return;
      }

      const promptText = `أنت مدقق مالي ذكي مختص بفحص وصولات الدفع والتحويل المالي العراقية (وبالأخص تطبيق SuperQi وبطاقات Qi / Mastercard).
قم بتحليل صورة وصل التحويل المرفقة واستخراج البيانات الظاهرة فيها بدقة تامة دون تخمين أي معلومة غير ظاهرة:
1. المبلغ المحوّل بالدينار العراقي (extractedAmountIQD) كرقم صحيح إن ظهر (مثلاً 35000 أو 15000 أو 2000).
2. تاريخ العملية ووقتها الظاهر في الوصل (extractedDateTime).
3. رقم العملية أو الرقم المرجعي (extractedReferenceNumber).
4. اسم المرسل إذا ظهر في الوصل (extractedSenderName).
5. بيانات المستلم أو رقم بطاقة المستلم الظاهر في الوصل (extractedRecipientInfo).
6. هل يظهر رقم بطاقة الاستلام المستهدف (${expectedRecipientCard}) أو جزء متطابق منه أو اسم المستلم بوضوح؟ (recipientCardMatched).
7. حالة العملية الظاهرة في الوصل مثل ناجحة / مكتملة / قيد المعالجة (extractedStatus).
8. هل الصورة واضحة ومقروءة وتمثل وصل تحويل مالي فعلي؟ (isImageClear و isReceiptDocument).

قارن ما يظهر في الصورة مع البيانات التي أدخلها الطالب:
- اسم الطالب المدخل: "${studentName || ''}"
- المبلغ المدخل من الطالب: ${Number(expectedAmountIQD) || 0} دينار عراقي
- رقم العملية المدخل من الطالب: "${submittedReference || 'غير مدخل'}"
- تاريخ العملية المدخل من الطالب: "${submittedDate || 'غير مدخل'}"
- رقم بطاقة الاستلام الرسمي المطلوب: "${expectedRecipientCard}"

أعد النتيجة بصيغة JSON حصراً وفق المخطط المحدد.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: promptText,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              extractedAmountIQD: {
                type: Type.NUMBER,
                description:
                  'المبلغ المحول المستخرج من صورة الوصل بالدينار العراقي كرقم، أو 0 إذا لم يظهر.',
              },
              amountFoundInImage: {
                type: Type.BOOLEAN,
                description: 'هل ظهر مبلغ مالي واضح في الصورة؟',
              },
              extractedDateTime: {
                type: Type.STRING,
                description: 'تاريخ ووقت العملية الظاهر في الوصل أو سلسلة نصية فارغة.',
              },
              extractedReferenceNumber: {
                type: Type.STRING,
                description: 'رقم العملية أو المرجع الظاهر في الوصل أو سلسلة نصية فارغة.',
              },
              extractedSenderName: {
                type: Type.STRING,
                description: 'اسم المرسل الظاهر في الوصل أو سلسلة نصية فارغة.',
              },
              extractedRecipientInfo: {
                type: Type.STRING,
                description: 'بيانات المستلم أو رقم البطاقة الظاهر في الوصل.',
              },
              recipientCardMatched: {
                type: Type.BOOLEAN,
                description:
                  'هل بيانات المستلم أو رقم البطاقة (6132013829) واضح ومتطابق في الوصل؟',
              },
              extractedStatus: {
                type: Type.STRING,
                description: 'حالة العملية الظاهرة في الوصل (مثال: ناجحة / مكتملة).',
              },
              isImageClear: {
                type: Type.BOOLEAN,
                description: 'هل الصورة واضحة ونصوصها مقروءة؟',
              },
              isReceiptDocument: {
                type: Type.BOOLEAN,
                description: 'هل الصورة تمثل إشعار أو وصل تحويل مالي؟',
              },
              discrepancies: {
                type: Type.ARRAY,
                items: {
                  type: Type.STRING,
                },
                description: 'قائمة بأي تناقضات أو ملاحظات بين بيانات الوصل وما أدخله الطالب.',
              },
              summaryArabic: {
                type: Type.STRING,
                description: 'ملخص عربي دقيق للمشرف المالي حول نتيجة فحص الوصل.',
              },
            },
            required: [
              'extractedAmountIQD',
              'amountFoundInImage',
              'extractedDateTime',
              'extractedReferenceNumber',
              'extractedSenderName',
              'extractedRecipientInfo',
              'recipientCardMatched',
              'extractedStatus',
              'isImageClear',
              'isReceiptDocument',
              'discrepancies',
              'summaryArabic',
            ],
          },
        },
      });

      const rawText = (response.text || '{}').trim();
      const parsed = JSON.parse(rawText);

      const extractedRef = String(parsed.extractedReferenceNumber || '').trim();
      const cleanSubmittedRef = String(submittedReference || '').trim();
      const normalizedExistingRefs = new Set(
        (Array.isArray(existingReferences) ? existingReferences : [])
          .map((r: string) => String(r || '').trim().toLowerCase())
          .filter(Boolean)
      );

      const isDuplicateRef =
        (extractedRef.length >= 4 &&
          normalizedExistingRefs.has(extractedRef.toLowerCase())) ||
        (cleanSubmittedRef.length >= 4 &&
          normalizedExistingRefs.has(cleanSubmittedRef.toLowerCase()));

      const extractedAmt =
        parsed.amountFoundInImage && Number(parsed.extractedAmountIQD) > 0
          ? Number(parsed.extractedAmountIQD)
          : null;

      const expectedAmt = Number(expectedAmountIQD) || 0;
      const amountMatches =
        extractedAmt !== null &&
        expectedAmt > 0 &&
        Math.abs(extractedAmt - expectedAmt) === 0;

      // Determine exact classification per Requirement 6:
      // - البيانات متطابقة مبدئياً
      // - المبلغ غير متطابق
      // - رقم العملية مكرر
      // - بيانات المستلم غير واضحة
      // - الصورة غير واضحة
      // - يحتاج إلى مراجعة المشرف
      let classification = 'يحتاج إلى مراجعة المشرف';
      const discrepancies: string[] = Array.isArray(parsed.discrepancies)
        ? [...parsed.discrepancies]
        : [];

      if (isDuplicateRef || isDuplicateImageHash) {
        classification = 'رقم العملية مكرر';
        if (isDuplicateRef) {
          discrepancies.unshift(
            'تحذير أمني: رقم العملية أو المرجع مسجل مسبقاً في عملية أخرى داخل قاعدة البيانات.'
          );
        }
        if (isDuplicateImageHash) {
          discrepancies.unshift(
            'تحذير أمني: صورة الوصل المرفوعة مطابقة بصمياً (SHA-256) لوصل مرفوع سابقاً.'
          );
        }
      } else if (!parsed.isImageClear || !parsed.isReceiptDocument) {
        classification = 'الصورة غير واضحة';
      } else if (extractedAmt !== null && !amountMatches) {
        classification = 'المبلغ غير متطابق';
        discrepancies.unshift(
          `المبلغ الظاهر في الوصل (${extractedAmt.toLocaleString('en-US')} د.ع) يختلف عن المبلغ الذي أدخله الطالب (${expectedAmt.toLocaleString('en-US')} د.ع).`
        );
      } else if (!parsed.recipientCardMatched || !parsed.extractedRecipientInfo) {
        classification = 'بيانات المستلم غير واضحة';
      } else if (
        parsed.isImageClear &&
        parsed.isReceiptDocument &&
        amountMatches &&
        parsed.recipientCardMatched &&
        !isDuplicateRef
      ) {
        classification = 'البيانات متطابقة مبدئياً';
      } else {
        classification = 'يحتاج إلى مراجعة المشرف';
      }

      res.json({
        analyzedAt: new Date().toISOString(),
        analyzedByEngine: 'gemini_ai',
        classification,
        extractedAmountIQD: extractedAmt,
        extractedDateTime: parsed.extractedDateTime || null,
        extractedReferenceNumber: extractedRef || null,
        extractedSenderName: parsed.extractedSenderName || null,
        extractedRecipientInfo: parsed.extractedRecipientInfo || null,
        recipientCardMatched: Boolean(parsed.recipientCardMatched),
        extractedStatus: parsed.extractedStatus || null,
        isImageClear: Boolean(parsed.isImageClear),
        amountMatchesSubmitted: amountMatches,
        isDuplicateReference: isDuplicateRef,
        isDuplicateImageHash: Boolean(isDuplicateImageHash),
        discrepancies,
        summaryArabic:
          parsed.summaryArabic ||
          'تم تحليل صورة الوصل بواسطة الذكاء الاصطناعي. يرجى مراجعة المشرف المخوّل للتأكد الفعلي من وصول المبلغ قبل الاعتماد.',
        requiresHumanSupervisorReview: true,
      });
    } catch (error: any) {
      console.error('[Server /api/receipts/analyze Error]:', error?.message || error);
      res.status(500).json({
        error: 'RECEIPT_AI_ANALYSIS_FAILED',
        message:
          error?.message ||
          'تعذر إكمال التحليل الآلي للصورة؛ تم حفظ الوصل للمراجعة اليدوية المباشرة من قِبل المشرف المخوّل.',
      });
    }
  });

  // =========================================================================
  // API 2: AI Graduation Trends Studio — Service Status & Capabilities
  // =========================================================================
  const recentGenerationTimestamps = new Map<string, number>();

  app.get('/api/ai-studio/status', async (_req, res) => {
    const ai = createGeminiClient();
    const hasApiKey = Boolean(ai);
    res.json({
      configured: hasApiKey,
      hasKey: hasApiKey,
      textModelAvailable: hasApiKey,
      visionAnalysisAvailable: hasApiKey,
      promptSuggestionAvailable: hasApiKey,
      directFreeImageToImageAvailable: false,
      noteArabic:
        'يعمل استوديو ترندات التخرج AI بنظام مكتبة الأوصاف الذكية الجاهزة والربط مع أدوات التوليد الخارجية المجانية بدون الحاجة لأي اشتراك مدفوع.',
    });
  });

  // =========================================================================
  // API 3: Smart Photo Visual Analysis & Trend Recommendation (gemini-3.8-flash)
  // =========================================================================
  app.post('/api/ai-studio/analyze-photo', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg', selectedCategoryId = '' } = req.body || {};
      if (!imageBase64 || typeof imageBase64 !== 'string') {
        res.status(400).json({
          error: 'MISSING_IMAGE',
          message: 'يرجى رفع صورة واضحة أولاً لإجراء التحليل الذكي.',
        });
        return;
      }

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message:
            'خدمة التحليل الذكي عبر الخادم تحتاج إلى تهيئة مفتاح GEMINI_API_KEY في إعدادات الخادم (Settings > Secrets).',
        });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const analysisPrompt = `أنت مخرج فني وخبير تصوير في «استوديو ترندات التخرج AI» لطلاب قسم التمريض دفعة 2027.
حلّل الخصائص البصرية العامة للصورة المرفوعة فقط (زاوية الالتقاط، الإضاءة، الألوان السائدة، نوع اللقطة بورتريه أو كاملة، وضوح الملامح العامة لتركيب المشهد) دون استنتاج أي معلومات شخصية أو حساسة أو ادعاء التعرّف على الهوية الحقيقية للشخص.
الفئة المختارة حالياً من الطالب: "${selectedCategoryId || 'عام'}".
اقترح:
1. ملخصاً بصرياً لطيفاً واحترافياً للصورة باللغة العربية (lightingAndAngleSummary).
2. أفضل 3 أساليب فنية تناسب إضاءة وزاوية هذه الصورة (recommendedStyles).
3. أفضل 3 خلفيات تخرج أو تمريض تناسب الصورة (recommendedBackgrounds).
4. أفضل 3 أفكار ترند من فئات (الطفل الخريج، الطفل الممرض، من حلم الطفولة إلى التخرج، ترندات تخرج التمريض، مختبر الأفكار المجنونة) تناسب هذه اللقطة (recommendedTrendTitles).
5. وصفاً احترافياً مخصصاً لتوليد أو تحويل الصورة مع الحفاظ على الملامح المميزة للوجه قدر الإمكان باللغة العربية (suggestedArabicPrompt) وباللغة الإنجليزية الدقيقة لنماذج توليد الصور (suggestedEnglishPrompt).`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: analysisPrompt,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              lightingAndAngleSummary: {
                type: Type.STRING,
                description: 'تحليل عام ولطيف للإضاءة والزاوية وجودة اللقطة باللغة العربية.',
              },
              framingQuality: {
                type: Type.STRING,
                description: 'تقييم وضوح الزاوية للتحويل الفني (ممتازة / جيدة / تحتاج تقريب).',
              },
              recommendedStyles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 أساليب فنية مقترحة تناسب الصورة.',
              },
              recommendedBackgrounds: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 خلفيات مقترحة تناسب الصورة.',
              },
              recommendedTrendTitles: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 أفكار ترند مقترحة للطالب.',
              },
              suggestedArabicPrompt: {
                type: Type.STRING,
                description: 'وصف عربي متكامل لتوليد التصميم مع الحفاظ على الملامح.',
              },
              suggestedEnglishPrompt: {
                type: Type.STRING,
                description: 'Detailed English image generation/editing prompt preserving facial features.',
              },
            },
            required: [
              'lightingAndAngleSummary',
              'framingQuality',
              'recommendedStyles',
              'recommendedBackgrounds',
              'recommendedTrendTitles',
              'suggestedArabicPrompt',
              'suggestedEnglishPrompt',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({
        success: true,
        analyzedAt: new Date().toISOString(),
        modelUsed: 'gemini-3.8-flash',
        analysis: parsed,
      });
    } catch (error: any) {
      console.error('[Server /api/ai-studio/analyze-photo Error]:', error?.message || error);
      res.status(500).json({
        error: 'PHOTO_ANALYSIS_FAILED',
        message:
          error?.message ||
          'تعذر إكمال التحليل الذكي للصورة في الوقت الحالي؛ يمكنك اختيار الفكرة وتخصيص الوصف مباشرة.',
      });
    }
  });

  // =========================================================================
  // API 4: Non-Repetitive Creative Trend Idea & Prompt Generator (gemini-3.8-flash)
  // =========================================================================
  app.post('/api/ai-studio/suggest-idea', async (req, res) => {
    try {
      const {
        categoryId = 'crazy_ideas_lab',
        categoryLabel = 'مختبر الأفكار المجنونة',
        currentStyle = 'واقعي سينمائي',
        studentName = '',
        previousSuggestions = [],
      } = req.body || {};

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'GEMINI_API_KEY_NOT_CONFIGURED',
          message: 'مفتاح GEMINI_API_KEY غير متوفر على الخادم لتوليد اقتراحات فورية.',
        });
        return;
      }

      const avoidList = Array.isArray(previousSuggestions)
        ? previousSuggestions.slice(-8).join(' | ')
        : '';

      const prompt = `أنت مبتكر ترندات تخرج إبداعية لطلاب قسم التمريض دفعة 2027 على Instagram وTikTok.
ابتكر فكرة ترند جديدة كلياً ومبهرة ضمن فئة: "${categoryLabel}" (${categoryId}) وبالأسلوب الفني: "${currentStyle}".
${studentName ? `اسم الطالب الاختياري للدمج: "${studentName}".` : ''}
${avoidList ? `تجنّب كلياً تكرار أي من هذه الأفكار السابقة: [${avoidList}].` : ''}
اجعل الفكرة تجمع بين هوية التمريض وفرحة التخرج أو التحويل الفني (مثل الطفل الخريج، الطفل الممرض، حلم الطفولة، البوستر السينمائي، المجسمات ثلاثية الأبعاد، أو التراث العراقي العصري) مع التأكيد على الحفاظ على ملامح الوجه المميزة قدر الإمكان.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              ideaTitle: {
                type: Type.STRING,
                description: 'عنوان جذاب ومبتكر للفكرة باللغة العربية.',
              },
              sceneDescriptionArabic: {
                type: Type.STRING,
                description: 'وصف تفصيلي للمشهد باللغة العربية جاهز لوضعه في مربع الوصف.',
              },
              englishGenerationPrompt: {
                type: Type.STRING,
                description: 'Detailed English prompt for image generation/editing preserving facial identity.',
              },
              suggestedCaptionArabic: {
                type: Type.STRING,
                description: 'عبارة قصيرة ملهمة مناسبة للنشر على Instagram أو TikTok.',
              },
              recommendedAspectRatio: {
                type: Type.STRING,
                description: 'المقاس الأنسب: 9:16 أو 4:5 أو 1:1',
              },
            },
            required: [
              'ideaTitle',
              'sceneDescriptionArabic',
              'englishGenerationPrompt',
              'suggestedCaptionArabic',
              'recommendedAspectRatio',
            ],
          },
        },
      });

      const parsed = JSON.parse((response.text || '{}').trim());
      res.json({
        success: true,
        modelUsed: 'gemini-3.8-flash',
        suggestion: parsed,
      });
    } catch (error: any) {
      console.error('[Server /api/ai-studio/suggest-idea Error]:', error?.message || error);
      res.status(500).json({
        error: 'IDEA_SUGGESTION_FAILED',
        message: error?.message || 'تعذر توليد فكرة جديدة حالياً.',
      });
    }
  });

  // =========================================================================
  // API 5: Real AI Image Generation & Face-Preserving Image Editing
  // Uses @google/genai ('gemini-3.1-flash-lite-image') on the server
  // =========================================================================
  app.post('/api/ai-studio/generate-image', async (req, res) => {
    try {
      const {
        imageBase64,
        mimeType = 'image/jpeg',
        promptArabic = '',
        promptEnglish = '',
        transformationType = 'nursing_cinema',
        artStyle = 'cinematic_realistic',
        backgroundSetting = 'luxury_studio',
        aspectRatio = '4:5',
        studentName = '',
        shortCaption = '',
        clientSessionKey = 'anonymous',
      } = req.body || {};

      // Prevent accidental rapid duplicate costly requests (cooldown 4 seconds per session)
      const now = Date.now();
      const lastReq = recentGenerationTimestamps.get(String(clientSessionKey)) || 0;
      if (now - lastReq < 4000) {
        res.status(429).json({
          error: 'RATE_LIMITED_COOLDOWN',
          message: 'يرجى الانتظار بضع ثوانٍ قبل إرسال طلب توليد جديد لمنع الطلبات المكررة.',
        });
        return;
      }
      recentGenerationTimestamps.set(String(clientSessionKey), now);

      const ai = createGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'FREE_DIRECT_API_UNAVAILABLE',
          message:
            'خدمة التوليد المباشر للصور الشخصية داخل الموقع غير متاحة مجاناً بدون واجهة خارجية. يمكنك نسخ الوصف الجاهز المُعدّ لك وتجربته مباشرة في الأدوات الخارجية المجانية بنقرة واحدة.',
        });
        return;
      }

      // Map 4:5 (Instagram vertical) to 3:4 for imageConfig compatibility
      const mappedAspectRatio =
        aspectRatio === '9:16'
          ? '9:16'
          : aspectRatio === '1:1'
          ? '1:1'
          : aspectRatio === '16:9'
          ? '16:9'
          : aspectRatio === '4:3'
          ? '4:3'
          : '3:4';

      const fullInstruction = `Create a high-end, luxury graduation trend portrait for a 2027 Nursing cohort student.
Transformation Concept: ${transformationType}.
Artistic Style: ${artStyle}.
Background / Environment: ${backgroundSetting}.
Detailed Creative Direction: ${promptEnglish || promptArabic}.
User Custom Description (Arabic): ${promptArabic}.
${studentName ? `Include subtle, tasteful visual space for student name "${studentName}".` : ''}
${shortCaption ? `Mood / Theme Quote: "${shortCaption}".` : ''}
CRITICAL IDENTITY & QUALITY RULES:
- Preserve the subject's distinctive facial features, eye shape, smile, head structure, and visual identity from the reference photo as closely as possible.
- Color palette: refined deep navy blue, clinical turquoise/teal, crisp white, and warm cinematic studio lighting.
- Do not add any watermarks or fake official seals.`;

      const parts: any[] = [];
      if (imageBase64 && typeof imageBase64 === 'string') {
        const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }
      parts.push({ text: fullInstruction });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: { parts },
        config: {
          imageConfig: {
            aspectRatio: mappedAspectRatio,
          },
        },
      });

      let generatedImageDataUrl: string | null = null;
      let modelNotes = '';

      for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData?.data) {
          const outMime = part.inlineData.mimeType || 'image/png';
          generatedImageDataUrl = `data:${outMime};base64,${part.inlineData.data}`;
        } else if (part.text) {
          modelNotes += part.text + ' ';
        }
      }

      if (!generatedImageDataUrl) {
        res.status(422).json({
          error: 'NO_IMAGE_RETURNED_FROM_MODEL',
          message:
            'التوليد المباشر داخل الخادم غير متاح مجاناً في هذه اللحظة. تم تجهيز الوصف المخصص لك بالكامل لنسخه واستخدامه في الأدوات الخارجية المجانية.',
          modelNotes: modelNotes.trim(),
        });
        return;
      }

      res.json({
        success: true,
        engine: 'gemini_ai_image',
        modelUsed: 'gemini-3.1-flash-lite-image',
        imageDataUrl: generatedImageDataUrl,
        modelNotes: modelNotes.trim(),
        generatedAt: new Date().toISOString(),
      });
    } catch (error: any) {
      const rawMsg = String(error?.message || error || '');
      console.error('[Server /api/ai-studio/generate-image Error]:', rawMsg);

      res.status(503).json({
        error: 'FREE_DIRECT_GENERATION_UNAVAILABLE',
        technicalReason: rawMsg.slice(0, 200),
        message:
          'التوليد المباشر للصور داخل الموقع غير متاح مجاناً حالياً (لا توجد واجهة API مجانية مفتوحة لتعديل الوجوه مباشرة دون اشتراك). يمكنك نسخ الوصف الجاهز بنقرة واحدة واستخدامه مباشرة في الأدوات الخارجية المجانية المتاحة أدناه.',
      });
    }
  });

  // =========================================================================
  // Vite Middleware (Development) or Static Serving (Production)
  // =========================================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

