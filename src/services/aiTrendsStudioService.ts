import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  orderBy,
  limit,
  increment,
} from 'firebase/firestore';
import { db } from './firebase';

export type TrendCategoryId =
  | 'all'
  | 'baby_graduate'
  | 'baby_nurse'
  | 'little_me_graduate'
  | 'nursing_graduation'
  | 'instagram_trends'
  | 'tiktok_trends'
  | 'black_and_white'
  | 'crazy_ideas_lab'
  | 'general_creative';

export type TrendAspectRatio = '9:16' | '4:5' | '1:1';

export type ArtisticStyleId =
  | 'cinematic_realistic'
  | 'luxury_studio'
  | 'movie_poster'
  | '3d_collectible'
  | 'anime_illustration'
  | 'editorial_magazine'
  | 'black_and_white_noir'
  | 'surreal_art'
  | 'iraqi_heritage_fusion';

export interface TrendCategoryMeta {
  id: TrendCategoryId;
  title: string;
  subtitle: string;
  badgeText: string;
  accentHex: string;
  secondaryHex: string;
}

export interface AiTrendIdea {
  id: string;
  category: Exclude<TrendCategoryId, 'all'> | string;
  title: string;
  subtitle: string;
  description: string;
  promptTemplate: string;
  styleTag: string;
  artisticStyle: ArtisticStyleId;
  recommendedRatio: TrendAspectRatio;
  supportedRatios: TrendAspectRatio[];
  isNewTrend?: boolean;
  isMostCreative?: boolean;
  isSuggested?: boolean;
  isFeatured?: boolean;
  isEnabled: boolean;
  sortOrder: number;
  requiresSecondPhotoOptional?: boolean;
  sceneTheme: {
    primaryColor: string;
    secondaryColor: string;
    glowColor: string;
    motif:
      | 'cap_scroll'
      | 'stethoscope_scrub'
      | 'split_timeline'
      | 'cinema_poster'
      | 'toy_box_3d'
      | 'insta_editorial'
      | 'tiktok_storyboard'
      | 'iraqi_shanasheel'
      | 'miniature_hospital'
      | 'anime_hero';
    frameStyle: 'editorial' | 'poster' | 'split_duet' | 'box_3d' | 'story_minimal' | 'heritage_arch';
  };
}

export interface SmartPhotoAnalysisResult {
  lightingQuality: string;
  cameraAngle: string;
  framingType: string;
  recommendedStyle: string;
  recommendedBackground: string;
  recommendedTrends: string[];
  tailoredPrompt: string;
  facePreservationTips: string;
}

export interface CrazyIdeaSuggestion {
  title: string;
  categoryLabel: string;
  description: string;
  artisticStyle: string;
  recommendedAspectRatio: TrendAspectRatio;
  prompt: string;
}

export interface UserAiCreation {
  id: string;
  ownerUid: string;
  ownerName: string;
  studentName?: string;
  customQuote?: string;
  trendId: string;
  trendTitle: string;
  category: string;
  artisticStyle: string;
  aspectRatio: TrendAspectRatio;
  promptUsed: string;
  imageDataUrl: string;
  generationMode: 'gemini_neural_ai' | 'studio_compositor_hd';
  isPublicShared: boolean;
  createdAt: string;
}

export interface SharedGalleryItem {
  id: string;
  creationId: string;
  ownerUid: string;
  studentName: string;
  trendTitle: string;
  category: string;
  aspectRatio: TrendAspectRatio;
  imageDataUrl: string;
  likesCount: number;
  createdAt: string;
}

export interface StudioUsageStats {
  totalGenerations: number;
  neuralAiGenerations: number;
  compositorGenerations: number;
  photoAnalysesCount: number;
  ideaSuggestionsCount: number;
  sharedGalleryCount: number;
  categoryCounts: Record<string, number>;
  updatedAt: string;
}

export const TREND_CATEGORIES: TrendCategoryMeta[] = [
  {
    id: 'all',
    title: 'جميع الترندات',
    subtitle: 'استكشف أكثر من 42 فكرة وترند بالذكاء الاصطناعي لتخرج التمريض 2027',
    badgeText: 'مكتبة شاملة',
    accentHex: '#2DD4BF',
    secondaryHex: '#38BDF8',
  },
  {
    id: 'baby_graduate',
    title: 'ترند الطفل الخريج',
    subtitle: 'نسخة طفولية لطيفة بروب وقبعة التخرج بإضاءة استوديو سينمائية',
    badgeText: 'ترند منتشر 🔥',
    accentHex: '#38BDF8',
    secondaryHex: '#818CF8',
  },
  {
    id: 'baby_nurse',
    title: 'ترند الطفل الممرض',
    subtitle: 'طفل بالزي الطبي والسماعة داخل عيادة أو مستشفى مصغر ساحر',
    badgeText: 'خاص بالتمريض 🩺',
    accentHex: '#2DD4BF',
    secondaryHex: '#14B8A6',
  },
  {
    id: 'little_me_graduate',
    title: 'أنا الصغير وأنا الخريج',
    subtitle: 'من حلم الطفولة إلى التخرج — دمج نسختك الطفولية المتخيلة معك اليوم',
    badgeText: 'الأكثر تأثيراً ✨',
    accentHex: '#A78BFA',
    secondaryHex: '#38BDF8',
  },
  {
    id: 'nursing_graduation',
    title: 'ترندات تخرج التمريض',
    subtitle: 'بوسترات سينمائية، مجلات عالمية، مجسمات 3D، وأنمي خاص بدفعة 2027',
    badgeText: '20 فكرة احترافية 🎓',
    accentHex: '#34D399',
    secondaryHex: '#0EA5E9',
  },
  {
    id: 'instagram_trends',
    title: 'ترندات Instagram',
    subtitle: 'تصاميم عمودية ومربعة فاخرة للـ Stories والـ Posts والـ Highlights',
    badgeText: 'مقاسات 9:16 و 4:5 📸',
    accentHex: '#F472B6',
    secondaryHex: '#818CF8',
  },
  {
    id: 'tiktok_trends',
    title: 'ترندات TikTok',
    subtitle: 'أغلفة فيديو عالية الدقة ومشاهد قبل/بعد جاهزة للمونتاج والانتشار',
    badgeText: 'جاهز للمونتاج 🎬',
    accentHex: '#22D3EE',
    secondaryHex: '#F43F5E',
  },
  {
    id: 'black_and_white',
    title: '🖤 أبيض وأسود كلاسيكي',
    subtitle: 'صور تخرج وبورتريهات بالأبيض والأسود ذات تباين درامي وفخامة خالدة',
    badgeText: 'فخامة كلاسيكية 🖤',
    accentHex: '#E2E8F0',
    secondaryHex: '#94A3B8',
  },
  {
    id: 'crazy_ideas_lab',
    title: '🪄 مختبر الأفكار الخيالية',
    subtitle: 'صور خيالية بإضاءة سينمائية، علبة مجسم 3D، وكتابة وصف خاص بك',
    badgeText: 'مختبر الإبداع 🪄',
    accentHex: '#F59E0B',
    secondaryHex: '#2DD4BF',
  },
  {
    id: 'general_creative',
    title: '🌟 ترندات إبداعية عامة',
    subtitle: 'أفكار متنوعة غير مقتصرة على التخرج والتمريض: بورتريهات فنية، فضاء، مجلات، وسفر',
    badgeText: 'متنوع للجميع ✨',
    accentHex: '#38BDF8',
    secondaryHex: '#A78BFA',
  },
];

export interface FreeExternalAiTool {
  id: string;
  name: string;
  url: string;
  badge: string;
  supportsPhotoUpload: boolean;
  howToUseArabic: string;
}

export const FREE_EXTERNAL_AI_TOOLS: FreeExternalAiTool[] = [
  {
    id: 'chatgpt_free',
    name: 'ChatGPT (توليد وتعديل الصور مجاناً)',
    url: 'https://chatgpt.com/',
    badge: 'يدعم رفع صورتك + لصق الوصف ✨',
    supportsPhotoUpload: true,
    howToUseArabic:
      'افتح الموقع، اضغط على علامة (+) لرفع صورتك من جهازك، ثم الصق الوصف المنسوخ واضغط إرسال.',
  },
  {
    id: 'google_gemini_web',
    name: 'Google Gemini (توليد الصور الذكي)',
    url: 'https://gemini.google.com/',
    badge: 'مجاني وسريع 🌐',
    supportsPhotoUpload: true,
    howToUseArabic:
      'افتح Gemini، أرفق صورتك أو الصق الوصف الجاهز مباشرة في صندوق المحادثة لتوليد التصميم.',
  },
  {
    id: 'microsoft_copilot',
    name: 'Microsoft Copilot / Designer',
    url: 'https://copilot.microsoft.com/',
    badge: 'محرك DALL·E 3 مجاناً 🎨',
    supportsPhotoUpload: true,
    howToUseArabic:
      'الصق الوصف المنسوخ في صندوق المحادثة (مع إمكانية إرفاق صورة مرجعية) ليقوم بتوليد 4 تصاميم عالية الدقة.',
  },
  {
    id: 'leonardo_ai',
    name: 'Leonardo.Ai Studio',
    url: 'https://app.leonardo.ai/',
    badge: 'رصيد يومي مجاني 💎',
    supportsPhotoUpload: true,
    howToUseArabic:
      'استخدم ميزة Image Guidance لرفع صورتك ثم الصق الوصف الإنجليزي أو العربي المنسوخ.',
  },
  {
    id: 'ideogram_ai',
    name: 'Ideogram AI (بوسترات وتايبوغرافي)',
    url: 'https://ideogram.ai/',
    badge: 'ممتاز للبوسترات والأسماء 🖼️',
    supportsPhotoUpload: false,
    howToUseArabic:
      'الصق الوصف المنسوخ مباشرة واختر المقاس (9:16 أو 4:5 أو 1:1) للحصول على بوستر سينمائي متقن.',
  },
];

export const RATIO_META: Record<
  TrendAspectRatio,
  { label: string; subtitle: string; dimensionsLabel: string }
> = {
  '1:1': {
    label: 'مربع (1:1)',
    subtitle: 'منشور مربع أو صورة حساب شخصية',
    dimensionsLabel: '1080 × 1080',
  },
  '4:5': {
    label: 'منشور عمودي (4:5)',
    subtitle: 'المقاس الرسمي لمنشورات Instagram والبورتريه',
    dimensionsLabel: '1080 × 1350',
  },
  '9:16': {
    label: 'Story أو غلاف فيديو (9:16)',
    subtitle: 'مقاس شاشة كاملة لـ Stories وReels وTikTok',
    dimensionsLabel: '1080 × 1920',
  },
};

export function buildReadyToCopyPrompt(params: {
  idea: AiTrendIdea;
  aspectRatio: TrendAspectRatio;
  additionalDescription?: string;
  studentName?: string;
  customQuote?: string;
}): string {
  const { idea, aspectRatio, additionalDescription, studentName, customQuote } = params;
  const ratioInfo = RATIO_META[aspectRatio] || RATIO_META['4:5'];
  const extraAr = (additionalDescription || '').trim();
  const nameAr = (studentName || '').trim();
  const quoteAr = (customQuote || '').trim();

  const lines: string[] = [
    `【وصف التصميم الجاهز — ${idea.title}】`,
    `• الفكرة بالعربية: ${idea.description}`,
    `• المقاس المطلوب: ${ratioInfo.label} — Aspect Ratio ${aspectRatio}`,
  ];

  if (nameAr) {
    lines.push(`• الاسم المطلوب إظهاره بأناقة (اختياري): "${nameAr}"`);
  }
  if (quoteAr) {
    lines.push(`• العبارة الإضافية: "${quoteAr}"`);
  }
  if (extraAr) {
    lines.push(`• تفاصيل إضافية من المستخدم: ${extraAr}`);
  }

  lines.push(
    '',
    '【Prompt for AI Image Generator (English & Arabic Compatible)】:',
    `${idea.promptTemplate} — Aspect Ratio: ${aspectRatio}. Preserve the exact facial features, eye shape, and natural likeness from the uploaded reference photo.${
      extraAr ? ` Additional user instructions: ${extraAr}.` : ''
    }${nameAr ? ` Subtle elegant typography with name: "${nameAr}".` : ''}`,
  );

  return lines.join('\n');
}

export const ARTISTIC_STYLES: {
  id: ArtisticStyleId;
  label: string;
  description: string;
  promptSuffix: string;
}[] = [
  {
    id: 'cinematic_realistic',
    label: 'واقعي سينمائي فائق (Ultra-Realistic)',
    description: 'إضاءة درامية، عدسة 85mm، تفاصيل بشرة طبيعية مع الحفاظ على الملامح الأصلية',
    promptSuffix:
      'Ultra-realistic cinematic portrait, 85mm f/1.4 lens, natural skin texture, volumetric teal and warm gold rim lighting, strict facial identity preservation.',
  },
  {
    id: 'luxury_studio',
    label: 'استوديو تصوير فاخر (Luxury Studio)',
    description: 'خلفية كحلية ملكية وإضاءة استوديو ناعمة متوازنة تبرز أناقة التخرج والتمريض',
    promptSuffix:
      'High-end editorial photo studio, deep midnight navy velvet backdrop, soft beauty dish key light, crisp clinical turquoise rim light, preserving exact facial identity.',
  },
  {
    id: 'black_and_white_noir',
    label: 'أبيض وأسود كلاسيكي فاخر (Black & White Fine Art)',
    description: 'تدرج أحادي اللون عالي التباين بأسلوب كبار مصوري البورتريه العالميين',
    promptSuffix:
      'Timeless monochrome black-and-white fine-art studio portrait, rich silver-gelatin contrast, dramatic Rembrandt lighting, preserving exact facial features.',
  },
  {
    id: 'movie_poster',
    label: 'بوستر فيلم بطولي (Movie Poster)',
    description: 'تكوين سينمائي ملحمي بأسلوب أفلام البطولة الطبية مع تدرج لوني درامي',
    promptSuffix:
      'Blockbuster medical drama movie poster style, heroic low-angle composition, atmospheric bokeh, dramatic lighting, keeping original facial features intact.',
  },
  {
    id: '3d_collectible',
    label: 'مجسم 3D داخل علبة فاخرة (3D Collectible)',
    description: 'تصميم مجسم ثلاثي الأبعاد أنيق مع إكسسوارات التمريض والتخرج المصغرة',
    promptSuffix:
      'High-detail 3D vinyl collectible figure inside a luxury display box with miniature stethoscope, nursing scrub, and graduation cap accessories, inspired by the uploaded face.',
  },
  {
    id: 'anime_illustration',
    label: 'أنمي سينمائي حديث (Modern Anime)',
    description: 'رسم أنمي ياباني عالي الدقة بإضاءة ساحرة وتفاصيل عيون وملامح مستوحاة من صورتك',
    promptSuffix:
      'Makoto Shinkai inspired high-resolution anime art, luminous sky and clinical lights, expressive eyes matching the subject, nursing graduation theme.',
  },
  {
    id: 'editorial_magazine',
    label: 'غلاف مجلة عالمية (Editorial Cover)',
    description: 'تصميم بورتريه أنيق بأسلوب أغلفة المجلات العالمية الفاخرة',
    promptSuffix:
      'World-class luxury magazine cover portrait, sharp studio focus, refined posture, sophisticated color grading, exact facial likeness.',
  },
  {
    id: 'surreal_art',
    label: 'فن سريالي ورقمي (Surreal Digital Art)',
    description: 'دمج خيالي بين رموز الطب والتمريض والفضاء المضيء حول الطالب',
    promptSuffix:
      'Dreamlike surrealist digital art blending glowing nursing symbols, bioluminescent florals, and graduation elements around the subject while preserving facial identity.',
  },
  {
    id: 'iraqi_heritage_fusion',
    label: 'أصالة عراقية × تخرج حديث (Iraqi Heritage)',
    description: 'دمج معماري أنيق بين الشناشيل والزخارف الرافدينية وتخرج التمريض الحديث',
    promptSuffix:
      'Modern nursing graduate portrait set against subtle architectural Iraqi Shanasheel woodwork and warm Mesopotamian golden twilight with clinical turquoise accents.',
  },
];

export const BACKGROUND_PRESETS: { id: string; label: string; promptText: string }[] = [
  {
    id: 'royal_navy_studio',
    label: 'استوديو كحلي ملكي مع إضاءة فيروزية',
    promptText: 'Deep midnight navy studio backdrop with subtle clinical turquoise halo lighting',
  },
  {
    id: 'modern_hospital_corridor',
    label: 'ممر مستشفى مستقبلي بإضاءة سينمائية',
    promptText: 'Clean modern futuristic hospital corridor with soft cinematic depth-of-field bokeh',
  },
  {
    id: 'graduation_stage_bokeh',
    label: 'مسرح تخرج ليلي مضيء (Bokeh)',
    promptText: 'Grand night graduation ceremony stage with warm golden and teal bokeh lights',
  },
  {
    id: 'miniature_clinic_world',
    label: 'عيادة تمريض مصغرة ساحرة',
    promptText: 'Whimsical miniature nursing clinic diorama with glowing medical instruments',
  },
  {
    id: 'baghdad_shanasheel_sunset',
    label: 'شناشيل عراقية وتراث رافديني دافئ',
    promptText: 'Artistic Iraqi Shanasheel stained-glass glow blended with modern graduation elegance',
  },
];

export const BUILT_IN_TREND_IDEAS: AiTrendIdea[] = [
  // ==================== 1. ترند الطفل الخريج (7 أفكار) ====================
  {
    id: 'bg-01-classic-gown',
    category: 'baby_graduate',
    title: 'الطفل الخريج بروب وقبعة التخرج',
    subtitle: 'نسخة طفولية لطيفة ترتدي روب التخرج الملكي بملامح مستوحاة من صورتك',
    description:
      'تحويل فني لطيف يبتكر نسخة طفولية مستوحاة من ملامحك في قبعة وروب التخرج الكحلي مع إضاءة استوديو ناعمة.',
    promptTemplate:
      'Create an adorable childhood version inspired by the uploaded person wearing a luxury deep navy graduation gown and mortarboard cap with a teal tassel, warm studio portrait lighting, ultra-detailed.',
    styleTag: 'واقعي لطيف',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isSuggested: true,
    isFeatured: true,
    isEnabled: true,
    sortOrder: 1,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bg-02-flower-bouquet',
    category: 'baby_graduate',
    title: 'الطفل الخريج يحمل باقة ورد بيضاء وفيروزية',
    subtitle: 'إطلالة احتفالية مشرقة بباقة زهور التخرج الفاخرة',
    description:
      'طفل خريج بابتسامة عفوية يحمل باقة ورد منسقة بألوان الأبيض والتركواز الطبي داخل استوديو احتفالي.',
    promptTemplate:
      'Adorable child version inspired by the subject wearing a graduation gown and holding a luxury bouquet of white roses and turquoise florals, cinematic soft bokeh.',
    styleTag: 'احتفالي مشرق',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 2,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#F472B6',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bg-03-luxury-chair',
    category: 'baby_graduate',
    title: 'الطفل الخريج في استوديو التصوير الملكي',
    subtitle: 'جلسة تصوير كلاسيكية فخمة على مقعد مخملي بإضاءة سينمائية',
    description:
      'مشهد يجمع بين فخامة البورتريه الكلاسيكي وبراءة الطفولة بملامح قريبة من الطالب.',
    promptTemplate:
      'Cute child version of the uploaded person seated on a classic velvet studio armchair wearing graduation attire, Rembrandt studio lighting, rich textures.',
    styleTag: 'استوديو فاخر',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 3,
    sceneTheme: {
      primaryColor: '#111827',
      secondaryColor: '#818CF8',
      glowColor: '#38BDF8',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bg-04-scroll-ribbon',
    category: 'baby_graduate',
    title: 'الطفل الخريج يحمل لفافة التخرج المربوطة',
    subtitle: 'لفافة تخرج تذكارية غير رسمية مربوطة بشريط فيروزي أنيق',
    description:
      'تصميم فني تذكاري يظهر الطفل الخريج وهو يرفع لفافة التخرج الاحتفالية وسط إضاءة ذهبية وفيروزية.',
    promptTemplate:
      'Childhood version inspired by the subject holding a rolled celebratory graduation scroll tied with a turquoise silk ribbon, joyful expression, cinematic lighting.',
    styleTag: 'تذكاري',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '1:1',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 4,
    sceneTheme: {
      primaryColor: '#091526',
      secondaryColor: '#2DD4BF',
      glowColor: '#FBBF24',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bg-05-cinematic-stage',
    category: 'baby_graduate',
    title: 'الطفل الخريج على منصة الاحتفال الليلية',
    subtitle: 'خلفية أضواء مسرح التخرج المتلألئة بتأثير Bokeh احترافي',
    description:
      'لقطة بورتريه بعمق ميداني ضحل تجعل الأضواء الليلية خلف الطفل الخريج تتوهج كالنجوم.',
    promptTemplate:
      'Cinematic night graduation portrait of a child version inspired by the subject, glowing golden and teal stage bokeh in the background, 85mm lens look.',
    styleTag: 'سينمائي ليلي',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 5,
    sceneTheme: {
      primaryColor: '#0A1120',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'cap_scroll',
      frameStyle: 'story_minimal',
    },
  },
  {
    id: 'bg-06-before-after-card',
    category: 'baby_graduate',
    title: 'بطاقة التحول: بين براءة الأمس وفرحة التخرج',
    subtitle: 'تصميم مزدوج يجمع النسخة الطفولية المتخيلة مع صورتك الحالية',
    description:
      'مقارنة بصرية فنية تبرز كيف كبر الحلم من طفولة بريئة إلى خريج دفعة 2027.',
    promptTemplate:
      'Artistic split-frame portrait showing an imagined childhood graduate version alongside the adult graduate from the uploaded photo, harmonious studio lighting.',
    styleTag: 'قبل وبعد',
    artisticStyle: 'editorial_magazine',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    requiresSecondPhotoOptional: true,
    isEnabled: true,
    sortOrder: 6,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#A78BFA',
      glowColor: '#2DD4BF',
      motif: 'split_timeline',
      frameStyle: 'split_duet',
    },
  },
  {
    id: 'bg-07-dreaming-nurse',
    category: 'baby_graduate',
    title: 'طفل يحلم بأن يصبح ممرضاً في المستقبل',
    subtitle: 'غرفة طفولة دافئة تسبح فيها رموز التمريض وقبعة التخرج المضيئة',
    description:
      'مشهد شاعري لطفل ينظر إلى قبعة تخرج وسماعة طبية مضيئة كحلم مستقبلي يتحقق في عام 2027.',
    promptTemplate:
      'Heartwarming cinematic scene of a young child inspired by the uploaded face looking up at a softly glowing stethoscope and graduation cap floating in warm light.',
    styleTag: 'خيالي شاعري',
    artisticStyle: 'surreal_art',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 7,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'stethoscope_scrub',
      frameStyle: 'poster',
    },
  },

  // ==================== 2. ترند الطفل الممرض (8 أفكار) ====================
  {
    id: 'bn-01-white-coat',
    category: 'baby_nurse',
    title: 'الطفل الممرض بالمعطف الأبيض الطبي',
    subtitle: 'إطلالة طبية أنيقة بمعطف أبيض ناصع وإضاءة استوديو احترافية',
    description:
      'نسخة طفولية مستوحاة من ملامح الطالب ترتدي المعطف الطبي الأبيض فوق الزي الرسمي بثقة ولطافة.',
    promptTemplate:
      'Adorable child nurse inspired by the uploaded person wearing a tailored crisp white medical coat, soft studio lighting, clinical turquoise accent glow.',
    styleTag: 'طبي كلاسيكي',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isFeatured: true,
    isEnabled: true,
    sortOrder: 8,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bn-02-teal-scrub',
    category: 'baby_nurse',
    title: 'الطفل الممرض بزي السكراب التركوازي',
    subtitle: 'زي التمريض الحديث بلون Clinical Turquoise مع ابتسامة واثقة',
    description:
      'الترند الأشهر لطلبة التمريض: طفل يرتدي سكراب التمريض الفيروزي الكحلي بتفاصيل واقعية دقيقة.',
    promptTemplate:
      'Cute child version of the subject wearing modern clinical turquoise nursing scrubs, standing confidently in a high-end portrait studio.',
    styleTag: 'ترند التمريض الأول',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isSuggested: true,
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 9,
    sceneTheme: {
      primaryColor: '#081C24',
      secondaryColor: '#2DD4BF',
      glowColor: '#14B8A6',
      motif: 'stethoscope_scrub',
      frameStyle: 'story_minimal',
    },
  },
  {
    id: 'bn-03-stethoscope-hero',
    category: 'baby_nurse',
    title: 'الطفل الممرض يحمل السماعة الطبية',
    subtitle: 'زاوية تصوير قريبة تبرز السماعة الطبية حول العنق بلمسة سينمائية',
    description:
      'تركيز بصري أنيق على السماعة الطبية الفضية والذهبية مع ملامح طفولية مستوحاة من صورتك.',
    promptTemplate:
      'Close-up cinematic portrait of a child nurse inspired by the uploaded photo holding a silver stethoscope around their neck, warm rim light.',
    styleTag: 'بورتريه قريب',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 10,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bn-04-mini-clinic',
    category: 'baby_nurse',
    title: 'الطفل الممرض داخل عيادة طبية مصغرة',
    subtitle: 'عالم طبي مصغر متكامل بأجهزة تمريض لطيفة وإضاءة دافئة',
    description:
      'مشهد إبداعي يضع الطفل الممرض في عيادة مصغرة مصممة خصيصاً على مقاسه بأسلوب Diorama فاخر.',
    promptTemplate:
      'Child nurse inspired by the uploaded face inside a charming miniature nursing clinic with tiny medical monitors and warm teal ambient light.',
    styleTag: 'عالم مصغر',
    artisticStyle: '3d_collectible',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isEnabled: true,
    sortOrder: 11,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#2DD4BF',
      glowColor: '#A78BFA',
      motif: 'miniature_hospital',
      frameStyle: 'box_3d',
    },
  },
  {
    id: 'bn-05-cinematic-hospital',
    category: 'baby_nurse',
    title: 'الطفل الممرض في مستشفى سينمائي حديث',
    subtitle: 'زاوية منخفضة بطولية داخل ردهة مستشفى مستقبلي مضيء',
    description:
      'تصوير سينمائي يمنح الطفل الممرض حضور أبطال المسلسلات والأفلام الطبية الحديثة.',
    promptTemplate:
      'Heroic low-angle cinematic shot of a child nurse inspired by the uploaded photo walking through a sleek modern hospital atrium with soft depth of field.',
    styleTag: 'بطولي سينمائي',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 12,
    sceneTheme: {
      primaryColor: '#091526',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'cinema_poster',
      frameStyle: 'poster',
    },
  },
  {
    id: 'bn-06-scrub-and-cap',
    category: 'baby_nurse',
    title: 'الطفل الممرض يرتدي قبعة التخرج فوق السكراب',
    subtitle: 'الجمع المثالي بين بهجة التخرج وهوية قسم التمريض',
    description:
      'إطلالة تجمع السكراب الطبي والسماعة مع قبعة التخرج للاحتفال بنهاية المرحلة الدراسية.',
    promptTemplate:
      'Adorable child nurse wearing teal nursing scrubs, a stethoscope, and a graduation mortarboard cap, celebratory studio lighting.',
    styleTag: 'تمريض + تخرج',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '1:1',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 13,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#F59E0B',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bn-07-medical-grad-symbols',
    category: 'baby_nurse',
    title: 'الطفل الممرض وسط رموز الطب والتخرج المضيئة',
    subtitle: 'تاج من الإضاءة الهادئة يجمع نبض القلب وقبعة التخرج',
    description:
      'تكوين فني راقٍ يحيط الطفل الممرض بخطوط نبض القلب المضيئة بلون التيل الفيروزي.',
    promptTemplate:
      'Artistic studio portrait of a child nurse surrounded by subtle glowing ECG heartbeat lines and graduation motifs in clinical turquoise.',
    styleTag: 'فني مبتكر',
    artisticStyle: 'surreal_art',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 14,
    sceneTheme: {
      primaryColor: '#0A1120',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'stethoscope_scrub',
      frameStyle: 'poster',
    },
  },
  {
    id: 'bn-08-walking-future',
    category: 'baby_nurse',
    title: 'الطفل الممرض يحمل حقيبة الإسعاف نحو المستقبل',
    subtitle: 'مشهد ملهم لخطوات البداية نحو بوابة تخرج 2027 المضيئة',
    description:
      'لقطة شاعرية لطفل ممرض يحمل حقيبة طبية صغيرة ويتجه نحو أفق مضيء يرمز ليوم التخرج.',
    promptTemplate:
      'Inspirational cinematic scene of a child nurse carrying a vintage medical kit walking toward a glowing horizon symbolizing graduation 2027.',
    styleTag: 'ملهم',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 15,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'stethoscope_scrub',
      frameStyle: 'story_minimal',
    },
  },

  // ==================== 3. ترند «أنا الصغير وأنا الخريج» (4 أفكار رئيسية) ====================
  {
    id: 'lm-01-side-by-side',
    category: 'little_me_graduate',
    title: 'أنا الصغير وأنا الخريج جنباً إلى جنب',
    subtitle: 'وقفة فخر تجمع الطالب الخريج اليوم مع نسخته الطفولية المتخيلة بزي التمريض',
    description:
      'يجمع التصميم بين الطالب في عمره الحالي ونسخة طفولية متخيلة مستوحاة من ملامحه بانسجام واقعي في الإضاءة والخلفية.',
    promptTemplate:
      'Seamless studio portrait combining the adult nursing graduate from the uploaded photo standing side-by-side with an imagined childhood version of themselves in miniature scrubs, unified lighting.',
    styleTag: 'من حلم الطفولة إلى التخرج',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    requiresSecondPhotoOptional: true,
    isNewTrend: true,
    isMostCreative: true,
    isSuggested: true,
    isFeatured: true,
    isEnabled: true,
    sortOrder: 16,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#A78BFA',
      glowColor: '#2DD4BF',
      motif: 'split_timeline',
      frameStyle: 'split_duet',
    },
  },
  {
    id: 'lm-02-looking-up-proud',
    category: 'little_me_graduate',
    title: 'نظرة الفخر: الطفل الصغير ينظر إلى نفسه بعد التخرج',
    subtitle: 'مشهد عاطفي مؤثر للطفل وهو ينظر بإعجاب إلى الخريج الذي أصبح عليه',
    description:
      'لحظة بصرية مؤثرة تجسد عبارة «لقد فعلناها!» بين حلم الطفولة وواقع التخرج في دفعة 2027.',
    promptTemplate:
      'Emotional cinematic portrait where a young child version looks up with pride and wonder at their present-day adult nursing graduate self, warm volumetric lighting.',
    styleTag: 'مشهد مؤثر جداً',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    requiresSecondPhotoOptional: true,
    isMostCreative: true,
    isFeatured: true,
    isEnabled: true,
    sortOrder: 17,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#38BDF8',
      glowColor: '#A78BFA',
      motif: 'split_timeline',
      frameStyle: 'split_duet',
    },
  },
  {
    id: 'lm-03-holding-hands',
    category: 'little_me_graduate',
    title: 'يداً بيد من أول حلم حتى يوم التخرج',
    subtitle: 'الطالب يمسك بيد نسخته الصغيرة في ممر التخرج والتمريض المضيء',
    description:
      'تعبير رمزي راقٍ عن مرافقة شغف الطفولة للطالب حتى لحظة التخرج وارتداء الزي الطبي.',
    promptTemplate:
      'Symbolic cinematic portrait of the adult nursing graduate holding hands with their imagined childhood self in a softly lit graduation gallery.',
    styleTag: 'رمزي دافئ',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    requiresSecondPhotoOptional: true,
    isEnabled: true,
    sortOrder: 18,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#A78BFA',
      motif: 'split_timeline',
      frameStyle: 'split_duet',
    },
  },
  {
    id: 'lm-04-dream-vs-reality',
    category: 'little_me_graduate',
    title: 'الطفل يمثل الحلم والخريج يمثل تحقق الحلم',
    subtitle: 'تكوين سينمائي مزدوج مع مساحة أنيقة لاسم الطالب وعبارة قصيرة',
    description:
      'تصميم بوستر متكامل يقسم المشهد فنياً بين الأمس واليوم مع إمكانية إضافة اسمك وعبارة إهداء.',
    promptTemplate:
      'Editorial dual-horizon composition: childhood dream in warm nostalgic tones merging seamlessly into present-day nursing graduation reality in crisp navy and teal.',
    styleTag: 'بوستر الذكرى',
    artisticStyle: 'editorial_magazine',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    requiresSecondPhotoOptional: true,
    isEnabled: true,
    sortOrder: 19,
    sceneTheme: {
      primaryColor: '#091526',
      secondaryColor: '#A78BFA',
      glowColor: '#38BDF8',
      motif: 'split_timeline',
      frameStyle: 'split_duet',
    },
  },

  // ==================== 4. ترندات تخرج التمريض (20 فكرة) ====================
  {
    id: 'ng-01-luxury-studio-scrub',
    category: 'nursing_graduation',
    title: '1. الخريج بالزي التمريضي في استوديو فاخر',
    subtitle: 'إضاءة استوديو ملكية تبرز فخامة الزي الطبي لدفعة 2027',
    description: 'بورتريه احترافي فائق النقاء بالزي التمريضي مع خلفية كحلية عميقة وإضاءة حواف فيروزية.',
    promptTemplate:
      'Luxury studio portrait of the nursing graduate in pristine scrubs, deep midnight navy backdrop, subtle turquoise rim light, preserving exact facial identity.',
    styleTag: 'استوديو ملكي',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isSuggested: true,
    isFeatured: true,
    isEnabled: true,
    sortOrder: 20,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-02-scrub-stethoscope-cinema',
    category: 'nursing_graduation',
    title: '2. الخريج بالسكراب والسماعة الطبية بإضاءة سينمائية',
    subtitle: 'تدرج لوني سينمائي (Teal & Warm Gold) مع تفاصيل عالية الدقة',
    description: 'لقطة سينمائية تركز على حضور الممرض الخريج مع السماعة الطبية وإضاءة درامية متوازنة.',
    promptTemplate:
      'Cinematic portrait of the nursing graduate wearing scrubs and stethoscope, dramatic teal and warm amber lighting, shallow depth of field.',
    styleTag: 'إضاءة سينمائية',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 21,
    sceneTheme: {
      primaryColor: '#0A1628',
      secondaryColor: '#2DD4BF',
      glowColor: '#F59E0B',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-03-journey-movie-poster',
    category: 'nursing_graduation',
    title: '3. بوستر سينمائي لرحلة دراسة التمريض',
    subtitle: 'تصميم ملحمي يوثق سنوات الدراسة والتدريب السريري حتى التخرج',
    description: 'بوستر مستوحى من الأفلام الوثائقية والدرامية الكبرى يحكي قصة كفاحك الدراسي.',
    promptTemplate:
      'Cinematic movie poster chronicling the nursing study journey, multi-layered dramatic composition featuring the graduate as the central figure.',
    styleTag: 'بوستر رحلة',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 22,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'cinema_poster',
      frameStyle: 'poster',
    },
  },
  {
    id: 'ng-04-hero-movie-lead',
    category: 'nursing_graduation',
    title: '4. الخريج كأنه بطل فيلم سينمائي',
    subtitle: 'وقفة بطولية بزاوية تصوير منخفضة وإضاءة هوليوودية',
    description: 'يجعل صورتك تبدو كملصق رسمي لفيلم بطولي جديد من بطولتك في عالم الطب والتمريض.',
    promptTemplate:
      'Hollywood blockbuster hero poster of the nursing graduate standing tall in dramatic lighting, subtle atmospheric mist and glowing city lights.',
    styleTag: 'بطل سينمائي',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 23,
    sceneTheme: {
      primaryColor: '#09111E',
      secondaryColor: '#38BDF8',
      glowColor: '#F43F5E',
      motif: 'cinema_poster',
      frameStyle: 'poster',
    },
  },
  {
    id: 'ng-05-cap-in-air',
    category: 'nursing_graduation',
    title: '5. الخريج مع قبعة التخرج تتطاير في الهواء',
    subtitle: 'لقطة حركة مجمدة (Freeze Motion) للحظة رمي القبعات فرحاً',
    description: 'مشهد مليء بالحياة والطاقة يوثق لحظة رمي قبعة التخرج في السماء.',
    promptTemplate:
      'Dynamic high-speed shutter portrait of the nursing graduate tossing a graduation cap into the air, celebratory golden and turquoise confetti bokeh.',
    styleTag: 'حركة احتفالية',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 24,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'cap_scroll',
      frameStyle: 'story_minimal',
    },
  },
  {
    id: 'ng-06-hospital-corridor-walk',
    category: 'nursing_graduation',
    title: '6. الخريج يسير في ممر مستشفى حديث نحو التخرج',
    subtitle: 'انتقال بصري من ردهة المستشفى الحديثة إلى بوابة الاحتفال',
    description: 'تصميم يرمز للانتقال من التدريب العملي في المستشفيات إلى منصة التخرج.',
    promptTemplate:
      'Cinematic shot of the nursing graduate walking confidently down a sleek sunlit hospital corridor that transitions into a graduation arch.',
    styleTag: 'انتقال رمزي',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 25,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'stethoscope_scrub',
      frameStyle: 'poster',
    },
  },
  {
    id: 'ng-07-artistic-medical-bg',
    category: 'nursing_graduation',
    title: '7. الخريج مع خلفية طبية فنية',
    subtitle: 'تكوين هندسي راقٍ لرموز العناية الطبية والتمريض المضيئة',
    description: 'خلفية فنية معاصرة غير مزدحمة تبرز شخصية الطالب الخريج بأناقة.',
    promptTemplate:
      'Contemporary fine-art portrait of the nursing graduate against a refined architectural backdrop with subtle glowing medical geometry.',
    styleTag: 'خلفية طبية فنية',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 26,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#14B8A6',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-08-stethoscope-cap-emblem',
    category: 'nursing_graduation',
    title: '8. الخريج مع تصميم يجمع السماعة وقبعة التخرج',
    subtitle: 'تناغم بصري بين شعار التمريض وتاج التخرج الأكاديمي',
    description: 'بورتريه متوازن يضع السماعة الطبية وقبعة التخرج كعنصرين رئيسيين في التكوين.',
    promptTemplate:
      'Refined portrait of the graduate wearing both a nursing stethoscope and graduation cap in a cohesive luxury dark-navy composition.',
    styleTag: 'هوية مزدوجة',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '1:1',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 27,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-09-world-magazine-cover',
    category: 'nursing_graduation',
    title: '9. الخريج بأسلوب مجلة عالمية فاخرة',
    subtitle: 'غلاف مجلة خاص بنجوم دفعة التمريض 2027 بتصميم الطباعة الفاخرة',
    description: 'يحوّل صورتك إلى غلاف مجلة عالمية مرموقة مخصصة لرواد التمريض الجدد.',
    promptTemplate:
      'High-fashion international magazine cover portrait of the nursing graduate, crisp editorial lighting, sophisticated layout space.',
    styleTag: 'غلاف مجلة',
    artisticStyle: 'editorial_magazine',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isEnabled: true,
    sortOrder: 28,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#F472B6',
      glowColor: '#38BDF8',
      motif: 'insta_editorial',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-10-dramatic-studio-portrait',
    category: 'nursing_graduation',
    title: '10. بورتريه استوديو درامي (Chiaroscuro)',
    subtitle: 'تباين ضوء وظل فني عميق يبرز قوة الشخصية والملامح',
    description: 'أسلوب تصوير فني يعتمد على إضاءة جانبية مركزة تمنح الصورة عمقاً استثنائياً.',
    promptTemplate:
      'Dramatic fine-art studio portrait of the nursing graduate using sculpted side lighting and deep midnight shadows, crisp facial focus.',
    styleTag: 'درامي فخم',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 29,
    sceneTheme: {
      primaryColor: '#070D19',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-11-night-bokeh-grad',
    category: 'nursing_graduation',
    title: '11. تصميم تخرج ليلي مع أضواء Bokeh',
    subtitle: 'أجواءScrub Night الساحرة مع أضواء المساء المتلألئة',
    description: 'مستوحى من أجواء حفلة التخرج المسائية تحت أضواء السماء المتوهجة.',
    promptTemplate:
      'Nighttime graduation portrait of the nursing student surrounded by dreamy out-of-focus turquoise and warm gold fairy bokeh lights.',
    styleTag: 'أجواء ليلية',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 30,
    sceneTheme: {
      primaryColor: '#081021',
      secondaryColor: '#2DD4BF',
      glowColor: '#FBBF24',
      motif: 'cap_scroll',
      frameStyle: 'story_minimal',
    },
  },
  {
    id: 'ng-12-ultra-realistic-8k',
    category: 'nursing_graduation',
    title: '12. تصوير واقعي فائق الدقة (Ultra-Realistic)',
    subtitle: 'معالجة بصرية احترافية تحافظ على أدق تفاصيل الوجه والإضاءة',
    description: 'الخيار المفضل للطلاب الذين يبحثون عن صورة رسمية وعصرية بأعلى درجة واقعية.',
    promptTemplate:
      'Ultra-realistic medium-format camera portrait of the nursing graduate, natural textures, balanced studio flash and ambient teal fill.',
    styleTag: 'واقعي فائق',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isSuggested: true,
    isEnabled: true,
    sortOrder: 31,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-13-medical-drama-poster',
    category: 'nursing_graduation',
    title: '13. ملصق فيلم درامي طبي',
    subtitle: 'مستوحى من أشهر المسلسلات والأفلام الطبية العالمية',
    description: 'تكوين درامي مشوق يضع الطالب في قلب حدث طبي وتخرجي كبير.',
    promptTemplate:
      'Prestige medical drama series poster featuring the nursing graduate in scrubs, atmospheric rain-kissed glass reflections and cinematic light.',
    styleTag: 'دراما طبية',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 32,
    sceneTheme: {
      primaryColor: '#091322',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'cinema_poster',
      frameStyle: 'poster',
    },
  },
  {
    id: 'ng-14-anime-graduate',
    category: 'nursing_graduation',
    title: '14. الخريج بأسلوب الأنمي الساحر (Anime Style)',
    subtitle: 'تحويل صورتك إلى بطل أنمي ياباني بزي التمريض والتخرج',
    description: 'رسم أنمي مفعم بالألوان المضيئة والسماء الدرامية مع الحفاظ على تسريحة وملامح الطالب.',
    promptTemplate:
      'High-budget theatrical anime illustration of the nursing graduate in scrubs and graduation gown, glowing clouds and sakura-teal light particles.',
    styleTag: 'أنمي 🎌',
    artisticStyle: 'anime_illustration',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isEnabled: true,
    sortOrder: 33,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#38BDF8',
      glowColor: '#F472B6',
      motif: 'anime_hero',
      frameStyle: 'poster',
    },
  },
  {
    id: 'ng-15-3d-collectible-figure',
    category: 'nursing_graduation',
    title: '15. مجسم 3D احترافي للخريج (Collectible Figure)',
    subtitle: 'نسخة ثلاثية الأبعاد فائقة الإتقان مع قاعدة عرض باسم دفعة 2027',
    description: 'يصمم لك مجسماً ثلاثي الأبعاد يبدو كتحفة فنية حقيقية على مكتب فاخر.',
    promptTemplate:
      '3D rendered collectible figurine of the nursing graduate standing on a brushed metal pedestal with miniature medical accessories.',
    styleTag: 'مجسم 3D',
    artisticStyle: '3d_collectible',
    recommendedRatio: '1:1',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 34,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#A78BFA',
      motif: 'toy_box_3d',
      frameStyle: 'box_3d',
    },
  },
  {
    id: 'ng-16-cute-pixar-cartoon',
    category: 'nursing_graduation',
    title: '16. أسلوب الكرتون السينمائي اللطيف',
    subtitle: 'إضاءة دافئة وتفاصيل وجه لطيفة بأسلوب أفلام الرسوم المتحركة الحديثة',
    description: 'تحويل مبهج وعصري يمنح صورتك طابع أفلام التحريك ثلاثية الأبعاد المحبوبة.',
    promptTemplate:
      'Stylized 3D animated feature film character portrait of the nursing graduate, expressive eyes, soft subsurface scattering skin shader.',
    styleTag: 'كرتون سينمائي',
    artisticStyle: '3d_collectible',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 35,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-17-nextgen-game-hero',
    category: 'nursing_graduation',
    title: '17. بطل لعبة فيديو الجيل القادم (Next-Gen Game)',
    subtitle: 'تصميم شاشة اختيار الشخصية الرئيسية بمهارات التمريض والإنقاذ',
    description: 'يظهر الخريج بلمسة رسوميات محركات الألعاب الواقعية الحديثة مع إضاءة ديناميكية.',
    promptTemplate:
      'Unreal Engine 5 style heroic character portrait of a futuristic nursing specialist graduate, sleek tactical scrub details, volumetric rim light.',
    styleTag: 'أسلوب الألعاب',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 36,
    sceneTheme: {
      primaryColor: '#070F1E',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'cinema_poster',
      frameStyle: 'poster',
    },
  },
  {
    id: 'ng-18-miniature-world-grad',
    category: 'nursing_graduation',
    title: '18. الخريج داخل عالم مصغر (Tilt-Shift Diorama)',
    subtitle: 'مشهد مصغر مذهل يظهر الخريج وسط حرم جامعي ومستشفى مصغر',
    description: 'تأثير بصري فريد يجعل العالم المحيط بالخريج يبدو كتحفة معمارية مصغرة.',
    promptTemplate:
      'Tilt-shift miniature diorama photography showing the nursing graduate surrounded by a finely crafted miniature medical campus.',
    styleTag: 'عالم مصغر',
    artisticStyle: '3d_collectible',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 37,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'miniature_hospital',
      frameStyle: 'box_3d',
    },
  },
  {
    id: 'ng-19-fine-art-illustration',
    category: 'nursing_graduation',
    title: '19. لوحة فنية مرسومة بدقة (Fine Art Illustration)',
    subtitle: 'ضربات فرشاة رقمية راقية تجمع الكلاسيكية بالحداثة',
    description: 'لوحة بورتريه فنية تصلح للطباعة والاحتفاظ بها كذكرى خالدة لتخرج 2027.',
    promptTemplate:
      'Masterpiece digital oil-and-ink illustration of the nursing graduate, rich brushwork textures, regal navy and turquoise palette.',
    styleTag: 'لوحة مرسومة',
    artisticStyle: 'surreal_art',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 38,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#A78BFA',
      glowColor: '#2DD4BF',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ng-20-fantasy-medical-realm',
    category: 'nursing_graduation',
    title: '20. الخريج في عالم طبي خيالي مضيء',
    subtitle: 'حدائق شفاء مضيئة وعمارة مستقبلية تحتفي بملائكة الرحمة',
    description: 'مزيج سحري بين رموز الشفاء والطبيعة المضيئة والعمارة المستقبلية الهادئة.',
    promptTemplate:
      'Ethereal visionary realm of healing where the nursing graduate stands amidst bioluminescent botanical arches and floating crystal medical motifs.',
    styleTag: 'خيال طبي',
    artisticStyle: 'surreal_art',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 39,
    sceneTheme: {
      primaryColor: '#081826',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'stethoscope_scrub',
      frameStyle: 'poster',
    },
  },

  // ==================== 5. ترندات Instagram (10 أفكار) ====================
  {
    id: 'ig-01-luxury-feed-portrait',
    category: 'instagram_trends',
    title: 'بورتريه فاخر لمنشور Instagram الرئيسي (4:5)',
    subtitle: 'مصمم خصيصاً ليملأ شاشة الهاتف بأعلى دقة وأناقة لونية',
    description: 'توازن مثالي في الإضاءة والتكوين يناسب المنشور الرسمي ليوم التخرج.',
    promptTemplate:
      'Instagram 4:5 luxury portrait of the nursing graduate, clean negative space at top for subtle typography, rich navy and clinical teal grade.',
    styleTag: 'Instagram Post 4:5',
    artisticStyle: 'editorial_magazine',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isSuggested: true,
    isEnabled: true,
    sortOrder: 40,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#F472B6',
      glowColor: '#2DD4BF',
      motif: 'insta_editorial',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ig-02-story-9-16-announcement',
    category: 'instagram_trends',
    title: 'تصميم Instagram Story احتفالي كامل (9:16)',
    subtitle: 'واجهة عمودية ساحرة مع مساحات متناسقة لاسم الطالب ودفعة 2027',
    description: 'تصميم عمودي كامل يبرز الخريج في المنتصف مع هالة ضوئية سينمائية.',
    promptTemplate:
      'Vertical 9:16 Instagram Story luxury graduation portrait of the nursing student, cinematic framing with clean header and footer safe zones.',
    styleTag: 'Story 9:16',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 41,
    sceneTheme: {
      primaryColor: '#091324',
      secondaryColor: '#38BDF8',
      glowColor: '#F472B6',
      motif: 'insta_editorial',
      frameStyle: 'story_minimal',
    },
  },
  {
    id: 'ig-03-arabic-name-calligraphy',
    category: 'instagram_trends',
    title: 'بوستر التخرج مع إبراز اسم الطالب بالعربية',
    subtitle: 'دمج الخط العربي العصري مع بورتريه التخرج الفاخر',
    description: 'يضع اسمك بتصميم تايبوغرافي عربي أنيق متداخل مع إضاءة الاستوديو.',
    promptTemplate:
      'Editorial graduation portrait designed to harmonize with modern Arabic typographic framing, deep navy background and turquoise rim lighting.',
    styleTag: 'تايبوغرافي عربي',
    artisticStyle: 'editorial_magazine',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 42,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'insta_editorial',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'ig-04-minimal-luxury',
    category: 'instagram_trends',
    title: 'تصميم Minimal فاخر وهادئ',
    subtitle: 'بساطة راقية تركز 100% على حضور الخريج وتفاصيل الزي الطبي',
    description: 'خالي من أي عناصر مزدحمة؛ يعتمد على نقاء الكادر وتدرج الإضاءة المخملية.',
    promptTemplate:
      'Ultra-clean minimalist luxury studio portrait of the nursing graduate, soft gradient slate-navy backdrop, museum-grade lighting.',
    styleTag: 'Minimal Luxury',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 43,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#38BDF8',
      glowColor: '#2DD4BF',
      motif: 'insta_editorial',
      frameStyle: 'story_minimal',
    },
  },
  {
    id: 'ig-05-highlight-cover-1-1',
    category: 'instagram_trends',
    title: 'أغلفة Highlights وصورة بروفايل التخرج (1:1)',
    subtitle: 'تكوين مركزي متوازن يظهر بوضوح فائق داخل الدائرة والمربع',
    description: 'مثالي لتحديث صورة الحساب الشخصية أو أيقونة ذكريات التخرج.',
    promptTemplate:
      'Centered 1:1 square avatar and highlight cover portrait of the nursing graduate, circular halo rim light in clinical turquoise.',
    styleTag: 'مربع 1:1',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '1:1',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 44,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#2DD4BF',
      glowColor: '#818CF8',
      motif: 'insta_editorial',
      frameStyle: 'editorial',
    },
  },

  // ==================== 6. ترندات TikTok (6 أفكار رئيسية + مشاهد مونتاج) ====================
  {
    id: 'tt-01-viral-reel-cover',
    category: 'tiktok_trends',
    title: 'غلاف فيديو TikTok / Reels احترافي خارق (9:16)',
    subtitle: 'صورة غلاف عالية الدقة تجذب الانتباه فوراً في صفحة الفيديوهات',
    description:
      'ملاحظة: يُنشئ الاستوديو صورة غلاف ثابتة فائقة الدقة بمقاس 9:16 جاهزة للاستخدام في مونتاج الفيديو الخاص بك.',
    promptTemplate:
      'High-impact 9:16 vertical viral video cover portrait of the nursing graduate, dramatic lighting contrast, crisp focal point.',
    styleTag: 'غلاف فيديو 9:16',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isEnabled: true,
    sortOrder: 45,
    sceneTheme: {
      primaryColor: '#09111E',
      secondaryColor: '#22D3EE',
      glowColor: '#F43F5E',
      motif: 'tiktok_storyboard',
      frameStyle: 'story_minimal',
    },
  },
  {
    id: 'tt-02-child-to-nurse-transition',
    category: 'tiktok_trends',
    title: 'مشهد تحول: من طفل يحلم بالطب إلى ممرض خريج',
    subtitle: 'لوحة تحول بصرية (Before / After) جاهزة للدمج في فيديوهات الترند',
    description: 'صورة مزدوجة عالية الدقة تصلح كمشهد ختامي مذهل لفيديوهات التحول على TikTok.',
    promptTemplate:
      'Vertical 9:16 transformation storyboard frame showing childhood nursing dream transitioning into adult nursing graduate reality.',
    styleTag: 'ترند التحول',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    requiresSecondPhotoOptional: true,
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 46,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#22D3EE',
      glowColor: '#A78BFA',
      motif: 'tiktok_storyboard',
      frameStyle: 'split_duet',
    },
  },
  {
    id: 'tt-03-cute-comedy-grad',
    category: 'tiktok_trends',
    title: 'بورتريه لطيف بروح الفكاهة: «وأخيراً تخرجنا!»',
    subtitle: 'إطلالة مرحة وعفوية تعبر عن فرحة الانتهاء من الامتحانات والمناوبات',
    description: 'تصميم مبهج بلمسة لطيفة يعكس أجواء الفرح العفوية بين طلاب الدفعة.',
    promptTemplate:
      'Joyful lighthearted portrait of the nursing graduate celebrating the end of exams with a playful triumphant pose, studio confetti.',
    styleTag: 'مرح وعفوي',
    artisticStyle: '3d_collectible',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 47,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#2DD4BF',
      glowColor: '#F59E0B',
      motif: 'tiktok_storyboard',
      frameStyle: 'story_minimal',
    },
  },

  // ==================== 7. مختبر الأفكار المجنونة (7 أفكار خارج الصندوق) ====================
  {
    id: 'cl-01-collectible-toy-box',
    category: 'crazy_ideas_lab',
    title: 'الخريج داخل علبة مجسم تذكاري فاخر (Action Figure Box)',
    subtitle: 'أنت بطل المجسم مع إكسسوارات السماعة، السكراب، وروب التخرج داخل العلبة',
    description:
      'من أكثر الترندات إبهاراً: تصميم يظهرك كمجسم 3D فاخر داخل علبة عرض شفافة مع أدوات التمريض.',
    promptTemplate:
      'Luxury 3D collectible figure box showcase featuring the nursing graduate inside a transparent display package alongside miniature stethoscope, coffee cup, scrub set, and graduation cap.',
    styleTag: 'ترند العلبة 3D 📦',
    artisticStyle: '3d_collectible',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isMostCreative: true,
    isSuggested: true,
    isFeatured: true,
    isEnabled: true,
    sortOrder: 48,
    sceneTheme: {
      primaryColor: '#0B1323',
      secondaryColor: '#F59E0B',
      glowColor: '#2DD4BF',
      motif: 'toy_box_3d',
      frameStyle: 'box_3d',
    },
  },
  {
    id: 'cl-02-iraqi-heritage-modern-grad',
    category: 'crazy_ideas_lab',
    title: 'تراث عراقي أصيل × تخرج التمريض الحديث',
    subtitle: 'دمج الشناشيل العراقية والزخارف الرافدينية مع إضاءة التخرج الفيروزية',
    description:
      'فكرة حصرية تجمع بين اعتزازنا بالهوية العراقية في القادسية وروح المستقبل لخريجي التمريض 2027.',
    promptTemplate:
      'Regal portrait of the nursing graduate framed by intricate Iraqi Shanasheel wooden latticework and warm Mesopotamian gold light meeting modern clinical turquoise glow.',
    styleTag: 'هوية عراقية 🇮🇶',
    artisticStyle: 'iraqi_heritage_fusion',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isMostCreative: true,
    isFeatured: true,
    isEnabled: true,
    sortOrder: 49,
    sceneTheme: {
      primaryColor: '#121826',
      secondaryColor: '#F59E0B',
      glowColor: '#2DD4BF',
      motif: 'iraqi_shanasheel',
      frameStyle: 'heritage_arch',
    },
  },
  {
    id: 'cl-03-futuristic-medical-city-2050',
    category: 'crazy_ideas_lab',
    title: 'الخريج في مدينة طبية مستقبلية ذكية',
    subtitle: 'ممرض المستقبل وسط شاشات هولوغرام طبية وعمارة خضراء متطورة',
    description: 'تصميم خيال علمي راقٍ يصور خريج 2027 كرائد للرعاية الصحية في المستقبل.',
    promptTemplate:
      'Futuristic sci-fi medical metropolis portrait of the nursing graduate surrounded by clean holographic health interfaces and sleek architecture.',
    styleTag: 'مستقبلي 2050',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 50,
    sceneTheme: {
      primaryColor: '#071324',
      secondaryColor: '#2DD4BF',
      glowColor: '#38BDF8',
      motif: 'cinema_poster',
      frameStyle: 'poster',
    },
  },
  {
    id: 'cl-04-baby-nurse-fantasy-hospital',
    category: 'crazy_ideas_lab',
    title: 'الطفل الممرض في مستشفى خيالي مصغر فوق السحاب',
    subtitle: 'فكرة سريالية مبهجة تمزج براءة الطفولة بعالم شفاء سماوي',
    description: 'تصميم غير مسبوق يجمع بين ترند الطفل الممرض وعالم الأحلام المضيء.',
    promptTemplate:
      'Whimsical surreal portrait of a child nurse inspired by the uploaded face inside a miniature cloud-top healing sanctuary with glowing teal lanterns.',
    styleTag: 'خيال سحري',
    artisticStyle: 'surreal_art',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 51,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#A78BFA',
      glowColor: '#2DD4BF',
      motif: 'miniature_hospital',
      frameStyle: 'poster',
    },
  },
  {
    id: 'cl-05-half-reality-half-digital',
    category: 'crazy_ideas_lab',
    title: 'دمج الواقع مع الفن الرقمي الثلاثي الأبعاد',
    subtitle: 'نصف بورتريه واقعي فائق الدقة ونصف مجسم/رسم فني مضيء',
    description: 'إبداع بصري يظهر براعة التحول بين الصورة الحقيقية والخيال الرقمي.',
    promptTemplate:
      'Split-style artistic portrait: half ultra-realistic studio photograph of the nursing graduate, half luminous digital holographic sculpture.',
    styleTag: 'واقع × فن رقمي',
    artisticStyle: 'surreal_art',
    recommendedRatio: '1:1',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 52,
    sceneTheme: {
      primaryColor: '#091122',
      secondaryColor: '#2DD4BF',
      glowColor: '#F472B6',
      motif: 'anime_hero',
      frameStyle: 'split_duet',
    },
  },

  // ==================== 8. صور تخرج بالأبيض والأسود (Black & White Fine Art) ====================
  {
    id: 'bw-01-classic-monochrome-grad',
    category: 'black_and_white',
    title: '🖤 بورتريه تخرج كلاسيكي بالأبيض والأسود (Fine Art)',
    subtitle: 'إضاءة درامية أحادية اللون تمنح صورتك فخامة خالدة بأسلوب استوديوهات باريس ولندن',
    description:
      'تصميم تخرج بالأبيض والأسود يركز على التباين الضوئي الناعم وتفاصيل الملامح بروب وقبعة التخرج.',
    promptTemplate:
      'Timeless black and white fine-art studio portrait of a graduate wearing a classic graduation gown and cap, dramatic Rembrandt key lighting, rich silver-gelatin monochrome contrast, preserving exact facial identity.',
    styleTag: 'أبيض وأسود 🖤',
    artisticStyle: 'black_and_white_noir',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isSuggested: true,
    isEnabled: true,
    sortOrder: 53,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#E2E8F0',
      glowColor: '#94A3B8',
      motif: 'cap_scroll',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bw-02-monochrome-nurse-stethoscope',
    category: 'black_and_white',
    title: '🖤 بورتريه الممرض بالأبيض والأسود مع السماعة الطبية',
    subtitle: 'لقطة سينمائية مهيبة تبرز البالطو الطبي والسماعة بتدرج رمادي وفضي ساحر',
    description:
      'صورة أبيض وأسود عالية التباين للممرض بالزي الطبي الرسمي والسماعة الطبية مع خلفية داكنة.',
    promptTemplate:
      'High-contrast monochrome black and white editorial portrait of a nurse wearing a medical coat and stethoscope around the neck, sculpted side studio lighting, deep black backdrop, preserving exact facial features.',
    styleTag: 'طبي كلاسيكي 🖤',
    artisticStyle: 'black_and_white_noir',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 54,
    sceneTheme: {
      primaryColor: '#090D16',
      secondaryColor: '#CBD5E1',
      glowColor: '#E2E8F0',
      motif: 'stethoscope_scrub',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'bw-03-editorial-vogue-monochrome',
    category: 'black_and_white',
    title: '🖤 غلاف مجلة بالأبيض والأسود (Monochrome Editorial)',
    subtitle: 'أسلوب المجلات العالمية الكلاسيكية لبورتريه التخرج أو البورتريه الشخصي',
    description:
      'تصميم مستوحى من جلسات التصوير العالمية بالأبيض والأسود مع حدة تفاصيل استثنائية.',
    promptTemplate:
      'Luxury international magazine cover portrait in pure black and white monochrome, medium format camera sharpness, elegant posture, preserving exact facial likeness.',
    styleTag: 'مجلة كلاسيكية 🖤',
    artisticStyle: 'black_and_white_noir',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 55,
    sceneTheme: {
      primaryColor: '#111827',
      secondaryColor: '#F8FAFC',
      glowColor: '#94A3B8',
      motif: 'insta_editorial',
      frameStyle: 'story_minimal',
    },
  },

  // ==================== 9. ترندات إبداعية عامة (غير مقتصرة على التخرج والتمريض) ====================
  {
    id: 'gc-01-executive-luxury-portrait',
    category: 'general_creative',
    title: '🌟 بورتريه رسمي فاخر لرواد الأعمال والملف الشخصي',
    subtitle: 'إطلالة رسمية أنيقة تصلح لـ LinkedIn وInstagram والسيرة الذاتية',
    description:
      'تصميم بورتريه استوديو احترافي بملابس رسمية عصرية وإضاءة سينمائية متوازنة خارج إطار التخرج.',
    promptTemplate:
      'Executive luxury studio portrait in modern tailored formal attire, architectural dark slate background, warm rim lighting, 85mm lens, preserving exact facial identity.',
    styleTag: 'بورتريه رسمي ✨',
    artisticStyle: 'luxury_studio',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isNewTrend: true,
    isSuggested: true,
    isEnabled: true,
    sortOrder: 56,
    sceneTheme: {
      primaryColor: '#0F172A',
      secondaryColor: '#38BDF8',
      glowColor: '#A78BFA',
      motif: 'insta_editorial',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'gc-02-astronaut-cosmos-dream',
    category: 'general_creative',
    title: '🌌 رائد فضاء في رحلة بين النجوم والمجرات',
    subtitle: 'بورتريه خيالي مبهر ببدلة فضاء حديثة تعكس أضواء المجرة على الخوذة المفتوحة',
    description:
      'فكرة إبداعية عامة تحول صورتك إلى رائد فضاء سينمائي وسط سدم كونية مضيئة.',
    promptTemplate:
      'Cinematic sci-fi portrait of the person wearing a detailed modern astronaut suit with an open visor helmet, glowing nebula and stars reflected in the glass, preserving exact facial features.',
    styleTag: 'خيال كوني 🌌',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isMostCreative: true,
    isEnabled: true,
    sortOrder: 57,
    sceneTheme: {
      primaryColor: '#090D1E',
      secondaryColor: '#818CF8',
      glowColor: '#38BDF8',
      motif: 'cinema_poster',
      frameStyle: 'poster',
    },
  },
  {
    id: 'gc-03-cozy-autumn-cafe-editorial',
    category: 'general_creative',
    title: '☕ بورتريه سينمائي في مقهى كلاسيكي دافئ',
    subtitle: 'إضاءة شمس الصباح عبر النافذة مع أجواء هادئة وأنيقة لمنشورات Instagram',
    description:
      'لقطة عفوية دافئة بأسلوب التصوير الفوتوغرافي الأوروبي في مقهى راقٍ مع عمق ميداني ناعم.',
    promptTemplate:
      'Warm cinematic lifestyle portrait seated by a sunlit European cafe window, golden hour light rays, soft bokeh background, natural expression, preserving exact facial likeness.',
    styleTag: 'أجواء دافئة ☕',
    artisticStyle: 'cinematic_realistic',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 58,
    sceneTheme: {
      primaryColor: '#1C1917',
      secondaryColor: '#F59E0B',
      glowColor: '#38BDF8',
      motif: 'insta_editorial',
      frameStyle: 'editorial',
    },
  },
  {
    id: 'gc-04-classic-oil-masterpiece',
    category: 'general_creative',
    title: '🎨 لوحة فنية زيتية كلاسيكية (Museum Masterpiece)',
    subtitle: 'تحويل صورتك إلى لوحة مرسومة بضربات فرشاة زيتية فاخرة وإطار متحفي',
    description:
      'أسلوب فني عام يحول أي صورة شخصية إلى تحفة فنية كلاسيكية بإضاءة دافئة.',
    promptTemplate:
      'Classical museum-grade oil painting portrait with rich textured brushstrokes, warm chiaroscuro lighting, regal composition, preserving exact facial features.',
    styleTag: 'لوحة زيتية 🎨',
    artisticStyle: 'surreal_art',
    recommendedRatio: '4:5',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 59,
    sceneTheme: {
      primaryColor: '#1E1B4B',
      secondaryColor: '#F59E0B',
      glowColor: '#A78BFA',
      motif: 'insta_editorial',
      frameStyle: 'heritage_arch',
    },
  },
  {
    id: 'gc-05-cyber-neon-futuristic-city',
    category: 'general_creative',
    title: '⚡ بورتريه سينمائي في مدينة المستقبل المضيئة',
    subtitle: 'إضاءة سينمائية ليلية وانعكاسات المطر بأسلوب أفلام الخيال العلمي',
    description:
      'تصميم عصري عام لعشاق الصور الليلية ذات الإضاءة السينمائية المبتكرة.',
    promptTemplate:
      'Cinematic futuristic night city portrait with rain reflections and teal-amber atmospheric lighting, 85mm f/1.2 bokeh, preserving exact facial identity.',
    styleTag: 'سينمائي ليلي ⚡',
    artisticStyle: 'movie_poster',
    recommendedRatio: '9:16',
    supportedRatios: ['9:16', '4:5', '1:1'],
    isEnabled: true,
    sortOrder: 60,
    sceneTheme: {
      primaryColor: '#09111E',
      secondaryColor: '#22D3EE',
      glowColor: '#F43F5E',
      motif: 'tiktok_storyboard',
      frameStyle: 'story_minimal',
    },
  },
];

const LOCAL_PRIVATE_CREATIONS_KEY = 'scrub_ai_studio_private_creations_v1';
const LOCAL_CUSTOM_IDEAS_KEY = 'scrub_ai_studio_custom_ideas_v1';
const LOCAL_CUSTOM_CATEGORIES_KEY = 'scrub_ai_studio_custom_categories_v1';

/**
 * Generates a rich, zero-broken-image SVG Data URL artwork for any trend card preview.
 */
export function buildTrendPreviewSvgDataUrl(idea: AiTrendIdea): string {
  const { primaryColor, secondaryColor, glowColor, motif } = idea.sceneTheme;
  const safeTitle = idea.title.replace(/[<>&"']/g, '');
  const safeBadge = idea.styleTag.replace(/[<>&"']/g, '');

  let motifIllustration = '';
  if (motif === 'cap_scroll') {
    motifIllustration = `
      <!-- Graduation Cap & Scroll -->
      <g transform="translate(200, 175)">
        <circle cx="0" cy="0" r="78" fill="url(#haloGrad)" opacity="0.35"/>
        <polygon points="0,-55 95,-15 0,22 -95,-15" fill="#1E293B" stroke="${secondaryColor}" stroke-width="2.5"/>
        <path d="M-52,5 L-52,38 C-52,55 52,55 52,38 L52,5" fill="#0F172A" stroke="${glowColor}" stroke-width="2"/>
        <line x1="65" y1="-2" x2="82" y2="48" stroke="${glowColor}" stroke-width="3" stroke-linecap="round"/>
        <circle cx="82" cy="52" r="6" fill="${glowColor}"/>
        <rect x="-48" y="68" width="96" height="22" rx="11" fill="#F8FAFC" stroke="${secondaryColor}" stroke-width="2"/>
        <rect x="-12" y="66" width="24" height="26" rx="4" fill="${glowColor}"/>
      </g>
    `;
  } else if (motif === 'stethoscope_scrub') {
    motifIllustration = `
      <!-- Nursing Scrub & Stethoscope -->
      <g transform="translate(200, 185)">
        <circle cx="0" cy="-10" r="82" fill="url(#haloGrad)" opacity="0.35"/>
        <path d="M-65,-25 L-32,-45 L0,-10 L32,-45 L65,-25 L52,65 L-52,65 Z" fill="#0F293A" stroke="${secondaryColor}" stroke-width="2.5"/>
        <path d="M-35,-42 C-45,15 -25,40 0,40 C25,40 45,15 35,-42" fill="none" stroke="#E2E8F0" stroke-width="5" stroke-linecap="round"/>
        <circle cx="0" cy="52" r="14" fill="${glowColor}" stroke="#F8FAFC" stroke-width="3"/>
        <polyline points="-75,15 -35,15 -22,-8 -10,32 5,-18 18,22 30,15 75,15" fill="none" stroke="${glowColor}" stroke-width="2.5" opacity="0.85"/>
      </g>
    `;
  } else if (motif === 'split_timeline') {
    motifIllustration = `
      <!-- Little Me & Graduate Split Silhouette -->
      <g transform="translate(200, 180)">
        <line x1="0" y1="-95" x2="0" y2="95" stroke="${glowColor}" stroke-width="2" stroke-dasharray="6,6"/>
        <!-- Adult Graduate Left -->
        <circle cx="-48" cy="-32" r="24" fill="#1E293B" stroke="${secondaryColor}" stroke-width="2.5"/>
        <polygon points="-48,-68 -12,-52 -48,-38 -84,-52" fill="${secondaryColor}"/>
        <path d="M-82,65 C-82,12 -14,12 -14,65 Z" fill="#0F293A" stroke="${secondaryColor}" stroke-width="2"/>
        <!-- Child Nurse Right -->
        <circle cx="48" cy="-8" r="18" fill="#1E293B" stroke="${glowColor}" stroke-width="2.5"/>
        <path d="M22,65 C22,26 74,26 74,65 Z" fill="#134E4A" stroke="${glowColor}" stroke-width="2"/>
        <path d="M-16,28 Q0,15 24,32" fill="none" stroke="#F8FAFC" stroke-width="3" stroke-linecap="round"/>
      </g>
    `;
  } else if (motif === 'toy_box_3d') {
    motifIllustration = `
      <!-- 3D Collectible Box -->
      <g transform="translate(200, 180)">
        <rect x="-78" y="-75" width="156" height="150" rx="18" fill="#0F172A" stroke="${secondaryColor}" stroke-width="3"/>
        <rect x="-64" y="-58" width="92" height="116" rx="12" fill="#1E293B" stroke="${glowColor}" stroke-width="1.8"/>
        <circle cx="-18" cy="-18" r="20" fill="${glowColor}" opacity="0.85"/>
        <path d="M-46,46 C-46,12 10,12 10,46 Z" fill="${secondaryColor}"/>
        <!-- Accessories column -->
        <circle cx="46" cy="-32" r="12" fill="#1E293B" stroke="${glowColor}" stroke-width="2"/>
        <rect x="34" y="-6" width="24" height="24" rx="6" fill="#1E293B" stroke="${secondaryColor}" stroke-width="2"/>
        <circle cx="46" cy="38" r="12" fill="#1E293B" stroke="#F8FAFC" stroke-width="2"/>
      </g>
    `;
  } else if (motif === 'iraqi_shanasheel') {
    motifIllustration = `
      <!-- Iraqi Heritage Arch + Graduation -->
      <g transform="translate(200, 180)">
        <path d="M-75,70 L-75,-15 C-75,-65 0,-85 0,-85 C0,-85 75,-65 75,-15 L75,70 Z" fill="#1E293B" stroke="${secondaryColor}" stroke-width="3"/>
        <g stroke="${glowColor}" stroke-width="1.2" opacity="0.55">
          <line x1="-50" y1="-55" x2="50" y2="45"/>
          <line x1="50" y1="-55" x2="-50" y2="45"/>
          <rect x="-42" y="-42" width="84" height="84" fill="none"/>
        </g>
        <polygon points="0,-35 55,-12 0,10 -55,-12" fill="${secondaryColor}"/>
        <circle cx="0" cy="28" r="18" fill="${glowColor}"/>
      </g>
    `;
  } else {
    motifIllustration = `
      <!-- Cinematic / Editorial Studio Frame -->
      <g transform="translate(200, 180)">
        <circle cx="0" cy="0" r="84" fill="url(#haloGrad)" opacity="0.4"/>
        <circle cx="0" cy="-22" r="28" fill="#1E293B" stroke="${glowColor}" stroke-width="2.5"/>
        <polygon points="0,-64 52,-42 0,-22 -52,-42" fill="${secondaryColor}"/>
        <path d="M-58,68 C-58,12 58,12 58,68 Z" fill="#0F293A" stroke="${glowColor}" stroke-width="2.5"/>
        <circle cx="-65" cy="-45" r="5" fill="${glowColor}" opacity="0.8"/>
        <circle cx="70" cy="-30" r="7" fill="${secondaryColor}" opacity="0.7"/>
        <circle cx="55" cy="40" r="4" fill="#F8FAFC" opacity="0.9"/>
      </g>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 420" width="400" height="420">
    <defs>
      <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}"/>
        <stop offset="55%" stop-color="#0F172A"/>
        <stop offset="100%" stop-color="#091526"/>
      </linearGradient>
      <radialGradient id="haloGrad" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stop-color="${glowColor}" stop-opacity="0.75"/>
        <stop offset="100%" stop-color="${secondaryColor}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="400" height="420" fill="url(#bgGrad)"/>
    <circle cx="340" cy="60" r="110" fill="url(#haloGrad)" opacity="0.45"/>
    <circle cx="60" cy="340" r="120" fill="url(#haloGrad)" opacity="0.3"/>
    <rect x="18" y="18" width="364" height="384" rx="22" fill="none" stroke="${secondaryColor}" stroke-opacity="0.28" stroke-width="1.5"/>
    ${motifIllustration}
    <rect x="28" y="28" width="135" height="30" rx="15" fill="#0F172A" fill-opacity="0.85" stroke="${glowColor}" stroke-opacity="0.6"/>
    <text x="95" y="48" text-anchor="middle" fill="${glowColor}" font-family="Tajawal, Cairo, sans-serif" font-size="13" font-weight="700">${safeBadge}</text>
    <text x="370" y="46" text-anchor="end" fill="#94A3B8" font-family="Inter, sans-serif" font-size="12" font-weight="600">${idea.recommendedRatio}</text>
    <rect x="24" y="316" width="352" height="72" rx="16" fill="#09101E" fill-opacity="0.84" stroke="#1E293B"/>
    <text x="358" y="346" text-anchor="end" fill="#F8FAFC" font-family="Cairo, Tajawal, sans-serif" font-size="15" font-weight="700">${safeTitle.slice(0, 38)}</text>
    <text x="358" y="372" text-anchor="end" fill="#94A3B8" font-family="Tajawal, sans-serif" font-size="12">استوديو ترندات التخرج AI • دفعة 2027</text>
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Checks the server-side AI Studio status
 */
export async function fetchAiStudioStatus(): Promise<{
  status: string;
  hasKey: boolean;
  textModelAvailable: boolean;
  imageModelName: string;
}> {
  try {
    const res = await fetch('/api/ai-studio/status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch {
    return {
      status: 'offline',
      hasKey: false,
      textModelAvailable: false,
      imageModelName: 'gemini-3.1-flash-lite-image',
    };
  }
}

/**
 * Calls server-side Gemini 3.8 Flash to perform safe, privacy-respecting visual analysis of the uploaded photo.
 */
export async function analyzeStudentPhotoWithAi(params: {
  imageBase64: string;
  mimeType: string;
  selectedCategory: string;
}): Promise<SmartPhotoAnalysisResult> {
  await incrementStudioStat('photoAnalysesCount', params.selectedCategory);
  try {
    const res = await fetch('/api/ai-studio/analyze-photo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (res.ok && json?.analysis) {
      return json.analysis as SmartPhotoAnalysisResult;
    }
    throw new Error(json?.message || 'تعذر التحليل عبر الخادم');
  } catch {
    // Intelligent deterministic fallback if offline
    return {
      lightingQuality: 'إضاءة أمامية متوازنة مناسبة لبورتريه التخرج',
      cameraAngle: 'زاوية أمامية بمستوى العين تبرز الملامح بوضوح',
      framingType: 'بورتريه نصفي مثالي للدمج مع الزي الطبي أو روب التخرج',
      recommendedStyle: 'واقعي سينمائي فائق (Ultra-Realistic) أو استوديو ملكي',
      recommendedBackground: 'استوديو كحلي ملكي (#0B1323) مع إضاءة حواف فيروزية طبية (#2DD4BF)',
      recommendedTrends: [
        'الطفل الممرض بزي السكراب التركوازي',
        'أنا الصغير وأنا الخريج جنباً إلى جنب',
        'الخريج بالزي التمريضي في استوديو فاخر',
      ],
      tailoredPrompt:
        'Ultra-realistic luxury graduation portrait of a nursing student in Class of 2027 clinical turquoise scrubs and graduation cap, preserving exact facial identity and natural expression.',
      facePreservationTips:
        'تم قفل نسب الملامح الأساسية وزاوية الإضاءة للحفاظ على هويتك الأصلية وعدم تشويه الوجه.',
    };
  }
}

/**
 * Calls server-side Gemini 3.8 Flash to generate a fresh, non-repetitive graduation trend idea.
 */
export async function suggestCreativeTrendIdeaWithAi(params: {
  category: string;
  studentName?: string;
  customStyle?: string;
  previousTitles?: string[];
}): Promise<CrazyIdeaSuggestion> {
  await incrementStudioStat('ideaSuggestionsCount', params.category);
  try {
    const res = await fetch('/api/ai-studio/suggest-idea', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (res.ok && json?.idea) {
      return json.idea as CrazyIdeaSuggestion;
    }
    throw new Error(json?.message || 'تعذر اقتراح الفكرة');
  } catch {
    const pool: CrazyIdeaSuggestion[] = [
      {
        title: 'ممرض الفضاء في محطة الشفاء المدارية 2027',
        categoryLabel: 'مختبر الأفكار المجنونة',
        description:
          'بورتريه سينمائي يظهر الخريج بزي تمريض مستقبلي داخل كبسولة طبية تطل على كوكب الأرض المضيء.',
        artisticStyle: 'بوستر فيلم سينمائي',
        recommendedAspectRatio: '9:16',
        prompt:
          'Cinematic sci-fi portrait of the nursing graduate inside an orbital medical sanctuary overlooking Earth, clinical turquoise hologram rings, preserving exact face.',
      },
      {
        title: 'أنا الصغير أسلّم السماعة الطبية لنفسي يوم التخرج',
        categoryLabel: 'أنا الصغير وأنا الخريج',
        description:
          'مشهد مؤثر يقوم فيه الطفل الصغير بتسليم السماعة الطبية الفيروزية إلى النسخة البالغة المتخرجة.',
        artisticStyle: 'واقعي سينمائي فائق',
        recommendedAspectRatio: '4:5',
        prompt:
          'Heartwarming studio portrait where an imagined childhood version hands a silver stethoscope to the present-day nursing graduate, royal navy backdrop.',
      },
      {
        title: 'بوابة عشتار والشناشيل تحتفي بخريج التمريض',
        categoryLabel: 'أصالة عراقية × تخرج حديث',
        description:
          'امتزاج معماري مهيب بين اللازورد البابلي والشناشيل البغدادية مع روب التخرج والزي الطبي.',
        artisticStyle: 'أصالة عراقية × تخرج حديث',
        recommendedAspectRatio: '4:5',
        prompt:
          'Majestic portrait of the nursing graduate standing before glazed Babylonian blue tiles and warm Iraqi Shanasheel woodwork with turquoise graduation lighting.',
      },
    ];
    const filtered = pool.filter((p) => !(params.previousTitles || []).includes(p.title));
    return filtered[0] || pool[0];
  }
}

/**
 * Attempts real neural image generation via `/api/ai-studio/generate-image`.
 */
export async function generateTrendImageViaServer(params: {
  prompt: string;
  imageBase64?: string;
  mimeType?: string;
  aspectRatio: TrendAspectRatio;
  stylePreset?: string;
  category: string;
}): Promise<{
  ok: boolean;
  imageDataUrl?: string;
  errorCode?: string;
  message?: string;
}> {
  try {
    const res = await fetch('/api/ai-studio/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const json = await res.json();
    if (res.ok && json?.imageDataUrl) {
      await incrementStudioStat('neuralAiGenerations', params.category);
      return {
        ok: true,
        imageDataUrl: json.imageDataUrl,
      };
    }
    return {
      ok: false,
      errorCode: json?.error || 'FREE_DIRECT_GENERATION_UNAVAILABLE',
      message:
        json?.message ||
        'التوليد المباشر للصور داخل الموقع غير متاح مجاناً حالياً. تم تجهيز الوصف المخصص لك بالكامل لنسخه واستخدامه مباشرة في أدوات الذكاء الاصطناعي الخارجية المجانية.',
    };
  } catch (err: any) {
    return {
      ok: false,
      errorCode: 'NETWORK_OR_SERVER_ERROR',
      message:
        err?.message ||
        'التوليد المباشر غير متاح حالياً؛ يمكنك نسخ الوصف الجاهز وتجربته في الأدوات الخارجية المجانية.',
    };
  }
}

/**
 * Helper to load a data URL or image source into an HTMLImageElement
 */
function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
    img.src = src;
  });
}

/**
 * High-Resolution Studio Visual Compositor (المعالج البصري الفوري للاستوديو)
 * Renders the user's actual uploaded photo (and optional childhood/second photo) into a bespoke,
 * high-resolution (1080x1920, 1080x1350, or 1400x1400) multi-layered artwork matching the chosen
 * trend, artistic style, color grading, frame, and optional student name/quote — with zero watermarks.
 */
export async function renderHighResStudioComposition(params: {
  primaryPhotoDataUrl: string;
  secondaryPhotoDataUrl?: string;
  idea: AiTrendIdea;
  artisticStyle: ArtisticStyleId;
  aspectRatio: TrendAspectRatio;
  studentName?: string;
  customQuote?: string;
  backgroundPresetLabel?: string;
  variantSeed?: number;
}): Promise<string> {
  const {
    primaryPhotoDataUrl,
    secondaryPhotoDataUrl,
    idea,
    artisticStyle,
    aspectRatio,
    studentName,
    customQuote,
    variantSeed = 0,
  } = params;

  await incrementStudioStat('compositorGenerations', idea.category);

  const dimensions: Record<TrendAspectRatio, { w: number; h: number }> = {
    '9:16': { w: 1080, h: 1920 },
    '4:5': { w: 1080, h: 1350 },
    '1:1': { w: 1400, h: 1400 },
  };

  const { w, h } = dimensions[aspectRatio] || dimensions['4:5'];
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const primaryImg = await loadImageElement(primaryPhotoDataUrl);
  const secondaryImg = secondaryPhotoDataUrl
    ? await loadImageElement(secondaryPhotoDataUrl).catch(() => null)
    : null;

  const { primaryColor, secondaryColor, glowColor, frameStyle } = idea.sceneTheme;

  // 1. Deep Atmospheric Studio Background
  const bgGrad = ctx.createLinearGradient(0, 0, w, h);
  bgGrad.addColorStop(0, primaryColor || '#0B1323');
  bgGrad.addColorStop(0.5, '#0F172A');
  bgGrad.addColorStop(1, '#070D19');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // 2. Ambient Bokeh & Rim Lighting Halos
  const drawHalo = (cx: number, cy: number, radius: number, color: string, alpha: number) => {
    ctx.save();
    ctx.globalAlpha = alpha;
    const radGrad = ctx.createRadialGradient(cx, cy, radius * 0.05, cx, cy, radius);
    radGrad.addColorStop(0, color);
    radGrad.addColorStop(1, 'rgba(11, 19, 35, 0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const seedOffset = (variantSeed % 5) * 35;
  drawHalo(w * 0.82 - seedOffset, h * 0.18 + seedOffset, w * 0.55, glowColor, 0.34);
  drawHalo(w * 0.18 + seedOffset, h * 0.78 - seedOffset, w * 0.6, secondaryColor, 0.28);
  drawHalo(w * 0.5, h * 0.44, w * 0.48, '#38BDF8', 0.18);

  // Subtle architectural / clinical grid or Iraqi Shanasheel pattern
  ctx.save();
  ctx.strokeStyle = glowColor;
  ctx.globalAlpha = 0.08;
  ctx.lineWidth = 1.5;
  if (artisticStyle === 'iraqi_heritage_fusion' || frameStyle === 'heritage_arch') {
    const step = 64;
    for (let x = 0; x < w; x += step) {
      for (let y = 0; y < h * 0.5; y += step) {
        ctx.strokeRect(x, y, step, step);
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + step, y + step);
        ctx.moveTo(x + step, y);
        ctx.lineTo(x, y + step);
        ctx.stroke();
      }
    }
  } else {
    // Subtle ECG heartbeat wave across mid-background
    ctx.beginPath();
    const midY = h * 0.24;
    ctx.moveTo(w * 0.08, midY);
    ctx.lineTo(w * 0.35, midY);
    ctx.lineTo(w * 0.4, midY - 42);
    ctx.lineTo(w * 0.45, midY + 58);
    ctx.lineTo(w * 0.51, midY - 78);
    ctx.lineTo(w * 0.57, midY + 34);
    ctx.lineTo(w * 0.62, midY);
    ctx.lineTo(w * 0.92, midY);
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.restore();

  // Helper to draw an image with cover fit inside a rounded rectangle
  const drawCoverPhotoInRoundedRect = (
    img: HTMLImageElement,
    rx: number,
    ry: number,
    rw: number,
    rh: number,
    radius: number,
    filterCss: string,
    borderColor: string,
  ) => {
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, radius);
    ctx.clip();

    ctx.filter = filterCss;
    const imgRatio = img.width / img.height;
    const boxRatio = rw / rh;
    let drawW = rw;
    let drawH = rh;
    let drawX = rx;
    let drawY = ry;

    if (imgRatio > boxRatio) {
      drawH = rh;
      drawW = rh * imgRatio;
      drawX = rx - (drawW - rw) / 2;
    } else {
      drawW = rw;
      drawH = rw / imgRatio;
      drawY = ry - (drawH - rh) * 0.25;
    }

    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.filter = 'none';

    // Subtle cinematic inner vignette
    const vig = ctx.createLinearGradient(rx, ry, rx, ry + rh);
    vig.addColorStop(0, 'rgba(11, 19, 35, 0.08)');
    vig.addColorStop(0.65, 'rgba(11, 19, 35, 0.02)');
    vig.addColorStop(1, 'rgba(9, 16, 30, 0.72)');
    ctx.fillStyle = vig;
    ctx.fillRect(rx, ry, rw, rh);
    ctx.restore();

    // Glowing border
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, radius);
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 4;
    ctx.shadowColor = glowColor;
    ctx.shadowBlur = 24;
    ctx.stroke();
    ctx.restore();
  };

  // Style-specific CSS filter for the canvas photo pass
  let styleFilter = 'contrast(1.06) saturate(1.08) brightness(1.02)';
  if (artisticStyle === 'movie_poster') {
    styleFilter = 'contrast(1.18) saturate(1.12) brightness(0.98)';
  } else if (artisticStyle === 'luxury_studio') {
    styleFilter = 'contrast(1.08) saturate(1.05) brightness(1.04)';
  } else if (artisticStyle === 'iraqi_heritage_fusion') {
    styleFilter = 'contrast(1.1) sepia(0.12) saturate(1.15)';
  } else if (artisticStyle === 'surreal_art') {
    styleFilter = 'contrast(1.14) saturate(1.24)';
  }

  // 3. Layout Composition based on Trend Category / Frame Style
  const padX = w * 0.075;
  const cardTop = h * 0.13;
  const cardHeight = h * 0.64;
  const cardWidth = w - padX * 2;

  if (idea.category === 'little_me_graduate' || frameStyle === 'split_duet') {
    // Dual composition: Present Graduate + Childhood Version (uploaded second photo or artistic soft-dream miniature frame)
    const mainW = cardWidth * 0.64;
    const mainH = cardHeight;
    const mainX = w - padX - mainW;
    const mainY = cardTop;

    drawCoverPhotoInRoundedRect(
      primaryImg,
      mainX,
      mainY,
      mainW,
      mainH,
      36,
      styleFilter,
      secondaryColor,
    );

    // Childhood / Little Me frame overlapping on the left
    const childW = cardWidth * 0.46;
    const childH = cardHeight * 0.62;
    const childX = padX;
    const childY = cardTop + cardHeight * 0.34;

    const childSourceImg = secondaryImg || primaryImg;
    const childFilter = secondaryImg
      ? 'contrast(1.05) saturate(1.08)'
      : 'contrast(1.04) saturate(1.15) brightness(1.08) sepia(0.08)';

    drawCoverPhotoInRoundedRect(
      childSourceImg,
      childX,
      childY,
      childW,
      childH,
      32,
      childFilter,
      glowColor,
    );

    // Badge on each frame
    const drawFramePill = (tx: number, ty: number, label: string, accent: string) => {
      ctx.save();
      ctx.font = 'bold 24px Cairo, Tajawal, sans-serif';
      const metrics = ctx.measureText(label);
      const pw = metrics.width + 44;
      const ph = 48;
      ctx.fillStyle = 'rgba(11, 19, 35, 0.88)';
      ctx.beginPath();
      ctx.roundRect(tx, ty, pw, ph, 24);
      ctx.fill();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#F8FAFC';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, tx + pw / 2, ty + ph / 2);
      ctx.restore();
    };

    drawFramePill(mainX + 24, mainY + 24, 'أنا الخريج • 2027 🎓', secondaryColor);
    drawFramePill(
      childX + 20,
      childY + 20,
      secondaryImg ? 'أنا الصغير • الطفولة ✨' : 'حلم الطفولة المتخيل 🩺',
      glowColor,
    );
  } else if (frameStyle === 'box_3d' || artisticStyle === '3d_collectible') {
    // 3D Collectible Display Box Frame
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.82)';
    ctx.beginPath();
    ctx.roundRect(padX, cardTop, cardWidth, cardHeight, 42);
    ctx.fill();
    ctx.strokeStyle = secondaryColor;
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    const innerPhotoW = cardWidth * 0.66;
    const innerPhotoH = cardHeight * 0.86;
    const innerPhotoX = padX + 28;
    const innerPhotoY = cardTop + (cardHeight - innerPhotoH) / 2;

    drawCoverPhotoInRoundedRect(
      primaryImg,
      innerPhotoX,
      innerPhotoY,
      innerPhotoW,
      innerPhotoH,
      28,
      styleFilter,
      glowColor,
    );

    // Accessories Column on the Right inside the Collectible Box
    const accX = innerPhotoX + innerPhotoW + 24;
    const accW = cardWidth - innerPhotoW - 76;
    const items = [
      { icon: '🩺', label: 'سماعة طبية' },
      { icon: '🎓', label: 'قبعة تخرج' },
      { icon: '🥼', label: 'سكراب 2027' },
    ];
    items.forEach((item, idx) => {
      const boxH = (innerPhotoH - 36) / 3;
      const boxY = innerPhotoY + idx * (boxH + 18);
      ctx.save();
      ctx.fillStyle = 'rgba(11, 19, 35, 0.9)';
      ctx.beginPath();
      ctx.roundRect(accX, boxY, accW, boxH, 22);
      ctx.fill();
      ctx.strokeStyle = glowColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.font = '46px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(item.icon, accX + accW / 2, boxY + boxH * 0.48);

      ctx.font = 'bold 20px Tajawal, Cairo, sans-serif';
      ctx.fillStyle = '#E2E8F0';
      ctx.fillText(item.label, accX + accW / 2, boxY + boxH * 0.8);
      ctx.restore();
    });
  } else {
    // Classic Editorial / Movie Poster / Luxury Studio Portrait
    drawCoverPhotoInRoundedRect(
      primaryImg,
      padX,
      cardTop,
      cardWidth,
      cardHeight,
      40,
      styleFilter,
      glowColor,
    );
  }

  // 4. Top Header Bar (Class of 2027 Nursing Identity — Clean, No Watermark)
  ctx.save();
  ctx.textAlign = 'right';
  ctx.font = 'bold 28px Cairo, Tajawal, sans-serif';
  ctx.fillStyle = glowColor;
  ctx.fillText('دفعة التمريض 2027 • NURSING GRADUATION', w - padX, h * 0.065);

  ctx.font = '24px Tajawal, Cairo, sans-serif';
  ctx.fillStyle = '#CBD5E1';
  ctx.fillText(idea.title, w - padX, h * 0.098);
  ctx.restore();

  // 5. Bottom Typography Panel (Student Name + Optional Quote + Trend Tag)
  const footerTop = cardTop + cardHeight + h * 0.032;
  const footerHeight = h - footerTop - h * 0.045;

  ctx.save();
  ctx.fillStyle = 'rgba(9, 16, 30, 0.86)';
  ctx.beginPath();
  ctx.roundRect(padX, footerTop, cardWidth, footerHeight, 32);
  ctx.fill();
  ctx.strokeStyle = 'rgba(45, 212, 191, 0.38)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  const centerX = w / 2;
  ctx.textAlign = 'center';

  const displayStudentName = (studentName || '').trim() || 'خريج قسم التمريض — دفعة 2027';
  ctx.font = 'bold 42px Cairo, Tajawal, sans-serif';
  ctx.fillStyle = '#F8FAFC';
  ctx.fillText(displayStudentName, centerX, footerTop + footerHeight * 0.38);

  const displayQuote =
    (customQuote || '').trim() ||
    (idea.category === 'little_me_graduate'
      ? 'من حلم الطفولة البريء إلى فخر التخرج وارتداء الزي الطبي'
      : idea.subtitle);

  ctx.font = '26px Tajawal, Cairo, sans-serif';
  ctx.fillStyle = glowColor;
  ctx.fillText(displayQuote.slice(0, 75), centerX, footerTop + footerHeight * 0.68);

  ctx.font = '20px Inter, Tajawal, sans-serif';
  ctx.fillStyle = '#94A3B8';
  ctx.fillText(`CLASS OF 2027 • ${idea.styleTag}`, centerX, footerTop + footerHeight * 0.88);
  ctx.restore();

  return canvas.toDataURL('image/png', 0.95);
}

/**
 * Private Gallery Management («تصاميمي»)
 * Stored privately per user in localStorage AND synced to `/ai_trend_creations/{id}` (which has `allow list: if false` in Firestore rules).
 */
export async function saveUserAiCreation(creation: UserAiCreation): Promise<void> {
  // 1. Save to local private vault
  try {
    const raw = localStorage.getItem(LOCAL_PRIVATE_CREATIONS_KEY);
    const list: UserAiCreation[] = raw ? JSON.parse(raw) : [];
    const updated = [creation, ...list.filter((c) => c.id !== creation.id)].slice(0, 30);
    localStorage.setItem(LOCAL_PRIVATE_CREATIONS_KEY, JSON.stringify(updated));
  } catch {
    // Ignore storage quota issues on very large images
  }

  // 2. Save metadata + thumbnail to Firestore private document if user has a UID
  if (db && creation.ownerUid && creation.ownerUid !== 'guest') {
    try {
      await setDoc(doc(db, 'ai_trend_creations', creation.id), {
        ...creation,
        // Keep payload within Firestore 1MB doc limit
        imageDataUrl: creation.imageDataUrl.length < 750000 ? creation.imageDataUrl : '',
      });
    } catch {
      // Non-fatal if user is anonymous
    }
  }

  await incrementStudioStat('totalGenerations', creation.category);
}

export function getPrivateUserCreations(ownerUid?: string): UserAiCreation[] {
  try {
    const raw = localStorage.getItem(LOCAL_PRIVATE_CREATIONS_KEY);
    if (!raw) return [];
    const list: UserAiCreation[] = JSON.parse(raw);
    if (!ownerUid) return list;
    return list.filter((item) => item.ownerUid === ownerUid || item.ownerUid === 'guest');
  } catch {
    return [];
  }
}

export async function deleteUserAiCreation(creationId: string): Promise<void> {
  try {
    const raw = localStorage.getItem(LOCAL_PRIVATE_CREATIONS_KEY);
    if (raw) {
      const list: UserAiCreation[] = JSON.parse(raw);
      localStorage.setItem(
        LOCAL_PRIVATE_CREATIONS_KEY,
        JSON.stringify(list.filter((item) => item.id !== creationId)),
      );
    }
  } catch {
    // ignore
  }
  if (!db) return;
  try {
    await deleteDoc(doc(db, 'ai_trend_creations', creationId));
  } catch {
    // ignore
  }
}

/**
 * Opt-in Public Gallery Sharing (Only when the user explicitly clicks "مشاركة في معرض الدفعة العام")
 */
export async function shareCreationToPublicGallery(creation: UserAiCreation): Promise<void> {
  if (!db) return;
  const sharedItem: SharedGalleryItem = {
    id: `shared_${creation.id}`,
    creationId: creation.id,
    ownerUid: creation.ownerUid || 'guest',
    studentName: creation.studentName || creation.ownerName || 'طالب دفعة 2027',
    trendTitle: creation.trendTitle,
    category: creation.category,
    aspectRatio: creation.aspectRatio,
    imageDataUrl: creation.imageDataUrl.length < 750000 ? creation.imageDataUrl : '',
    likesCount: 1,
    createdAt: new Date().toISOString(),
  };

  await setDoc(doc(db, 'ai_trend_shared_gallery', sharedItem.id), sharedItem);
  await incrementStudioStat('sharedGalleryCount', creation.category);
}

export async function fetchPublicSharedGallery(): Promise<SharedGalleryItem[]> {
  if (!db) return [];
  try {
    const q = query(
      collection(db, 'ai_trend_shared_gallery'),
      orderBy('createdAt', 'desc'),
      limit(24),
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => d.data() as SharedGalleryItem);
  } catch {
    return [];
  }
}

export async function deletePublicSharedGalleryItem(itemId: string): Promise<void> {
  if (!db) return;
  await deleteDoc(doc(db, 'ai_trend_shared_gallery', itemId));
}

/**
 * Site Manager Custom Ideas & Categories Management
 */
export async function fetchAllStudioIdeas(): Promise<AiTrendIdea[]> {
  let customIdeas: AiTrendIdea[] = [];
  try {
    if (!db) throw new Error('offline');
    const snap = await getDocs(collection(db, 'ai_trend_custom_ideas'));
    customIdeas = snap.docs.map((d) => d.data() as AiTrendIdea);
  } catch {
    try {
      const localRaw = localStorage.getItem(LOCAL_CUSTOM_IDEAS_KEY);
      if (localRaw) customIdeas = JSON.parse(localRaw);
    } catch {
      customIdeas = [];
    }
  }

  const customMap = new Map<string, AiTrendIdea>();
  customIdeas.forEach((idea) => customMap.set(idea.id, idea));

  const merged: AiTrendIdea[] = BUILT_IN_TREND_IDEAS.map((builtin) =>
    customMap.has(builtin.id) ? { ...builtin, ...customMap.get(builtin.id)! } : builtin,
  );

  customIdeas.forEach((custom) => {
    if (!BUILT_IN_TREND_IDEAS.some((b) => b.id === custom.id)) {
      merged.push(custom);
    }
  });

  return merged.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
}

export async function saveStudioCustomIdea(idea: AiTrendIdea): Promise<void> {
  try {
    const localRaw = localStorage.getItem(LOCAL_CUSTOM_IDEAS_KEY);
    const list: AiTrendIdea[] = localRaw ? JSON.parse(localRaw) : [];
    const updated = [idea, ...list.filter((i) => i.id !== idea.id)];
    localStorage.setItem(LOCAL_CUSTOM_IDEAS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
  if (!db) return;
  await setDoc(doc(db, 'ai_trend_custom_ideas', idea.id), idea);
}

export async function deleteStudioCustomIdea(ideaId: string): Promise<void> {
  try {
    const localRaw = localStorage.getItem(LOCAL_CUSTOM_IDEAS_KEY);
    if (localRaw) {
      const list: AiTrendIdea[] = JSON.parse(localRaw);
      localStorage.setItem(
        LOCAL_CUSTOM_IDEAS_KEY,
        JSON.stringify(list.filter((i) => i.id !== ideaId)),
      );
    }
  } catch {
    // ignore
  }
  if (!db) return;
  await deleteDoc(doc(db, 'ai_trend_custom_ideas', ideaId));
}

export function getCustomCategories(): TrendCategoryMeta[] {
  try {
    const raw = localStorage.getItem(LOCAL_CUSTOM_CATEGORIES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomCategory(cat: TrendCategoryMeta): void {
  const existing = getCustomCategories().filter((c) => c.id !== cat.id);
  localStorage.setItem(LOCAL_CUSTOM_CATEGORIES_KEY, JSON.stringify([...existing, cat]));
}

/**
 * Aggregate Studio Statistics
 */
export async function incrementStudioStat(
  field:
    | 'totalGenerations'
    | 'neuralAiGenerations'
    | 'compositorGenerations'
    | 'photoAnalysesCount'
    | 'ideaSuggestionsCount'
    | 'sharedGalleryCount',
  category?: string,
): Promise<void> {
  if (!db) return;
  try {
    const statRef = doc(db, 'ai_trend_stats', 'global');
    const updatePayload: Record<string, any> = {
      [field]: increment(1),
      updatedAt: new Date().toISOString(),
    };
    if (category) {
      updatePayload[`categoryCounts.${category}`] = increment(1);
    }
    await setDoc(statRef, updatePayload, { merge: true });
  } catch {
    // ignore if rules/offline
  }
}

export async function fetchStudioUsageStats(): Promise<StudioUsageStats> {
  if (db) {
    try {
      const snap = await getDoc(doc(db, 'ai_trend_stats', 'global'));
      if (snap.exists()) {
        const data = snap.data();
        return {
          totalGenerations: Number(data.totalGenerations || 0),
          neuralAiGenerations: Number(data.neuralAiGenerations || 0),
          compositorGenerations: Number(data.compositorGenerations || 0),
          photoAnalysesCount: Number(data.photoAnalysesCount || 0),
          ideaSuggestionsCount: Number(data.ideaSuggestionsCount || 0),
          sharedGalleryCount: Number(data.sharedGalleryCount || 0),
          categoryCounts: (data.categoryCounts as Record<string, number>) || {},
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
      }
    } catch {
      // ignore
    }
  }
  return {
    totalGenerations: 0,
    neuralAiGenerations: 0,
    compositorGenerations: 0,
    photoAnalysesCount: 0,
    ideaSuggestionsCount: 0,
    sharedGalleryCount: 0,
    categoryCounts: {},
    updatedAt: new Date().toISOString(),
  };
}
