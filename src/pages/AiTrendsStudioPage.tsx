import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Sparkles,
  Upload,
  Wand2,
  Camera,
  Download,
  Share2,
  RefreshCw,
  Copy,
  Check,
  Trash2,
  Eye,
  Lock,
  Globe,
  Sliders,
  Layers,
  Stethoscope,
  Heart,
  Plus,
  BarChart3,
  ShieldCheck,
  X,
  Image as ImageIcon,
  Info,
  Zap,
  Star,
  Maximize2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import {
  TREND_CATEGORIES,
  ARTISTIC_STYLES,
  FREE_EXTERNAL_AI_TOOLS,
  RATIO_META,
  AiTrendIdea,
  TrendCategoryId,
  TrendAspectRatio,
  ArtisticStyleId,
  SmartPhotoAnalysisResult,
  CrazyIdeaSuggestion,
  UserAiCreation,
  SharedGalleryItem,
  StudioUsageStats,
  TrendCategoryMeta,
  buildTrendPreviewSvgDataUrl,
  buildReadyToCopyPrompt,
  analyzeStudentPhotoWithAi,
  suggestCreativeTrendIdeaWithAi,
  generateTrendImageViaServer,
  saveUserAiCreation,
  getPrivateUserCreations,
  deleteUserAiCreation,
  shareCreationToPublicGallery,
  fetchPublicSharedGallery,
  deletePublicSharedGalleryItem,
  fetchAllStudioIdeas,
  saveStudioCustomIdea,
  deleteStudioCustomIdea,
  getCustomCategories,
  saveCustomCategory,
  fetchStudioUsageStats,
} from '../services/aiTrendsStudioService';

export const AiTrendsStudioPage: React.FC = () => {
  const { currentUser, firebaseUser, isSuperAdmin, isAdmin } = useApp();
  const isSiteManager = Boolean(isSuperAdmin || isAdmin);
  const activeUserUid = firebaseUser?.uid || currentUser?.id || 'guest';
  const activeUserName =
    currentUser?.fullName || firebaseUser?.displayName || '';

  // Main studio navigation tabs
  const [activeMainTab, setActiveMainTab] = useState<
    'explore' | 'my_designs' | 'shared_gallery' | 'admin_studio'
  >('explore');

  // Category & search filters
  const [selectedCategory, setSelectedCategory] = useState<TrendCategoryId | string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customCategories, setCustomCategories] = useState<TrendCategoryMeta[]>([]);

  // Loaded trend ideas
  const [allIdeas, setAllIdeas] = useState<AiTrendIdea[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(true);

  // Selected trend for studio workspace
  const [selectedIdea, setSelectedIdea] = useState<AiTrendIdea | null>(null);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);

  // Uploaded photos (processed 100% locally in browser memory; never shared publicly)
  const [primaryPhotoDataUrl, setPrimaryPhotoDataUrl] = useState<string>('');
  const [primaryPhotoMime, setPrimaryPhotoMime] = useState<string>('image/jpeg');
  const [primaryPhotoFileName, setPrimaryPhotoFileName] = useState<string>('my-photo.jpg');
  const [secondaryPhotoDataUrl, setSecondaryPhotoDataUrl] = useState<string>('');

  // Customization options
  const [selectedStyle, setSelectedStyle] = useState<ArtisticStyleId>('luxury_studio');
  const [selectedRatio, setSelectedRatio] = useState<TrendAspectRatio>('4:5');
  const [studentName, setStudentName] = useState<string>(activeUserName);
  const [customQuote, setCustomQuote] = useState<string>('');
  const [additionalDescription, setAdditionalDescription] = useState<string>('');

  // Smart Photo Analysis & Crazy Idea Lab states
  const [isAnalyzingPhoto, setIsAnalyzingPhoto] = useState(false);
  const [photoAnalysis, setPhotoAnalysis] = useState<SmartPhotoAnalysisResult | null>(null);
  const [isSuggestingIdea, setIsSuggestingIdea] = useState(false);
  const [suggestedIdeaCard, setSuggestedIdeaCard] = useState<CrazyIdeaSuggestion | null>(null);
  const [previousSuggestedTitles, setPreviousSuggestedTitles] = useState<string[]>([]);

  // Direct Generation Test states (Honest status — never fakes success!)
  const [isTestingDirectGen, setIsTestingDirectGen] = useState(false);
  const [directGenErrorStatus, setDirectGenErrorStatus] = useState<string | null>(null);
  const [generatedResult, setGeneratedResult] = useState<UserAiCreation | null>(null);

  // Private & shared galleries
  const [myCreations, setMyCreations] = useState<UserAiCreation[]>([]);
  const [sharedGallery, setSharedGallery] = useState<SharedGalleryItem[]>([]);
  const [lightboxCreation, setLightboxCreation] = useState<UserAiCreation | SharedGalleryItem | null>(
    null,
  );
  const [copiedPromptId, setCopiedPromptId] = useState<string | null>(null);
  const [workspacePromptCopied, setWorkspacePromptCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Admin states
  const [studioStats, setStudioStats] = useState<StudioUsageStats | null>(null);
  const [editingIdea, setEditingIdea] = useState<Partial<AiTrendIdea> | null>(null);
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [newCategorySubtitle, setNewCategorySubtitle] = useState('');

  const primaryFileInputRef = useRef<HTMLInputElement | null>(null);
  const secondaryFileInputRef = useRef<HTMLInputElement | null>(null);
  const workspaceSectionRef = useRef<HTMLDivElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 4000);
  };

  useEffect(() => {
    if (activeUserName && !studentName) {
      setStudentName(activeUserName);
    }
  }, [activeUserName]);

  const loadInitialStudioData = async () => {
    setLoadingIdeas(true);
    const [ideas, shared] = await Promise.all([
      fetchAllStudioIdeas(),
      fetchPublicSharedGallery(),
    ]);
    setAllIdeas(ideas);
    setSharedGallery(shared);
    setCustomCategories(getCustomCategories());
    setMyCreations(getPrivateUserCreations(activeUserUid));
    if (ideas.length > 0 && !selectedIdea) {
      setSelectedIdea(ideas[0]);
      setSelectedStyle(ideas[0].artisticStyle);
      setSelectedRatio(ideas[0].recommendedRatio);
    }
    setLoadingIdeas(false);
  };

  useEffect(() => {
    loadInitialStudioData();
  }, [activeUserUid]);

  useEffect(() => {
    if (activeMainTab === 'admin_studio' && isSiteManager) {
      fetchStudioUsageStats().then(setStudioStats);
    }
  }, [activeMainTab, isSiteManager]);

  const allCategoryTabs = useMemo(() => {
    return [...TREND_CATEGORIES, ...customCategories];
  }, [customCategories]);

  const enabledIdeas = useMemo(() => {
    return allIdeas.filter((i) => i.isEnabled !== false);
  }, [allIdeas]);

  const filteredIdeas = useMemo(() => {
    return enabledIdeas.filter((idea) => {
      const matchesCat = selectedCategory === 'all' || idea.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        idea.title.toLowerCase().includes(q) ||
        idea.subtitle.toLowerCase().includes(q) ||
        idea.description.toLowerCase().includes(q) ||
        idea.styleTag.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [enabledIdeas, selectedCategory, searchQuery]);

  const newTrendIdeas = useMemo(
    () => enabledIdeas.filter((i) => i.isNewTrend).slice(0, 6),
    [enabledIdeas],
  );
  const mostCreativeIdeas = useMemo(
    () => enabledIdeas.filter((i) => i.isMostCreative).slice(0, 6),
    [enabledIdeas],
  );
  const suggestedForYouIdeas = useMemo(
    () => enabledIdeas.filter((i) => i.isSuggested || i.isFeatured).slice(0, 6),
    [enabledIdeas],
  );

  // Dynamically assembled ready-to-copy prompt for the currently selected idea & user inputs
  const readyPromptText = useMemo(() => {
    const active = selectedIdea || enabledIdeas[0];
    if (!active) return '';
    const effectiveIdea: AiTrendIdea = suggestedIdeaCard
      ? {
          ...active,
          title: suggestedIdeaCard.title,
          description: suggestedIdeaCard.description,
          promptTemplate: suggestedIdeaCard.prompt,
        }
      : active;

    return buildReadyToCopyPrompt({
      idea: effectiveIdea,
      aspectRatio: selectedRatio,
      additionalDescription,
      studentName,
      customQuote,
    });
  }, [
    selectedIdea,
    enabledIdeas,
    suggestedIdeaCard,
    selectedRatio,
    additionalDescription,
    studentName,
    customQuote,
  ]);

  const handleSelectIdea = (idea: AiTrendIdea, scrollToEditor = true) => {
    setSelectedIdea(idea);
    setSuggestedIdeaCard(null);
    setSelectedStyle(idea.artisticStyle);
    setSelectedRatio(idea.recommendedRatio);
    setIsWorkspaceOpen(true);
    setDirectGenErrorStatus(null);
    setGeneratedResult(null);
    if (scrollToEditor) {
      setTimeout(() => {
        workspaceSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handlePhotoUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    isSecondary = false,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('يرجى اختيار ملف صورة صالح (JPG, PNG, WEBP)');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (isSecondary) {
        setSecondaryPhotoDataUrl(dataUrl);
        showToast('تمت معاينة صورة الطفولة الإضافية محلياً داخل متصفحك ✨');
      } else {
        setPrimaryPhotoDataUrl(dataUrl);
        setPrimaryPhotoMime(file.type || 'image/jpeg');
        setPrimaryPhotoFileName(file.name || 'my-graduation-photo.jpg');
        setPhotoAnalysis(null);
        setIsWorkspaceOpen(true);
        showToast('تمت معاينة صورتك بنجاح داخل متصفحك — جاهزة لتجهيز الطلب 📸');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadOriginalPhoto = () => {
    if (!primaryPhotoDataUrl) return;
    const a = document.createElement('a');
    a.href = primaryPhotoDataUrl;
    a.download = primaryPhotoFileName || `original-photo-${Date.now()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم تنزيل صورتك الأصلية على جهازك 📥');
  };

  const handleShareOriginalPhoto = async () => {
    if (!primaryPhotoDataUrl) return;
    try {
      if (navigator.share) {
        const res = await fetch(primaryPhotoDataUrl);
        const blob = await res.blob();
        const file = new File([blob], primaryPhotoFileName || 'photo.jpg', {
          type: primaryPhotoMime || 'image/jpeg',
        });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: selectedIdea?.title || 'استوديو ترندات التخرج AI',
            text: readyPromptText,
            files: [file],
          });
          return;
        }
      }
      handleDownloadOriginalPhoto();
    } catch {
      handleDownloadOriginalPhoto();
    }
  };

  const handleSmartAnalyzePhoto = async () => {
    if (!primaryPhotoDataUrl) {
      showToast('يرجى اختيار صورتك أولاً لتشغيل التحليل البصري');
      primaryFileInputRef.current?.click();
      return;
    }
    setIsAnalyzingPhoto(true);
    try {
      const result = await analyzeStudentPhotoWithAi({
        imageBase64: primaryPhotoDataUrl,
        mimeType: primaryPhotoMime,
        selectedCategory: selectedIdea?.category || String(selectedCategory),
      });
      setPhotoAnalysis(result);
      showToast('اكتمل فحص الإضاءة والزاوية وتحديث النصائح ✨');
    } finally {
      setIsAnalyzingPhoto(false);
    }
  };

  const handleSuggestCrazyIdea = async () => {
    setIsSuggestingIdea(true);
    try {
      const suggestion = await suggestCreativeTrendIdeaWithAi({
        category: selectedCategory === 'all' ? 'crazy_ideas_lab' : String(selectedCategory),
        studentName,
        customStyle: ARTISTIC_STYLES.find((s) => s.id === selectedStyle)?.label,
        previousTitles: previousSuggestedTitles,
      });
      setSuggestedIdeaCard(suggestion);
      setPreviousSuggestedTitles((prev) => [...prev.slice(-8), suggestion.title]);
      setSelectedRatio(suggestion.recommendedAspectRatio || '4:5');
      setIsWorkspaceOpen(true);
      showToast(`فكرة مقترحة جديدة: ${suggestion.title}`);
    } finally {
      setIsSuggestingIdea(false);
    }
  };

  /**
   * Tests direct server-side generation honestly.
   * NEVER fakes a static image or placeholder as an AI result if the server returns an error!
   */
  const handleTestDirectServerGeneration = async () => {
    const activeIdea = selectedIdea || enabledIdeas[0];
    if (!activeIdea) return;

    setIsTestingDirectGen(true);
    setDirectGenErrorStatus(null);
    setGeneratedResult(null);

    try {
      const neuralRes = await generateTrendImageViaServer({
        prompt: readyPromptText,
        imageBase64: primaryPhotoDataUrl || undefined,
        mimeType: primaryPhotoMime,
        aspectRatio: selectedRatio,
        stylePreset: ARTISTIC_STYLES.find((s) => s.id === selectedStyle)?.label,
        category: activeIdea.category,
      });

      if (neuralRes.ok && neuralRes.imageDataUrl) {
        const newCreation: UserAiCreation = {
          id: `ai_cre_${Date.now()}`,
          ownerUid: activeUserUid,
          ownerName: activeUserName || studentName || 'مستخدم الاستوديو',
          studentName: studentName.trim() || undefined,
          customQuote: customQuote.trim() || undefined,
          trendId: activeIdea.id,
          trendTitle: suggestedIdeaCard?.title || activeIdea.title,
          category: activeIdea.category,
          artisticStyle:
            ARTISTIC_STYLES.find((s) => s.id === selectedStyle)?.label || activeIdea.styleTag,
          aspectRatio: selectedRatio,
          promptUsed: readyPromptText,
          imageDataUrl: neuralRes.imageDataUrl,
          generationMode: 'gemini_neural_ai',
          isPublicShared: false,
          createdAt: new Date().toISOString(),
        };
        await saveUserAiCreation(newCreation);
        setGeneratedResult(newCreation);
        setMyCreations(getPrivateUserCreations(activeUserUid));
        showToast('تم توليد الصورة بنجاح ✨');
      } else {
        // Honest failure message — NEVER fake success or show a static image as AI output!
        navigator.clipboard?.writeText(readyPromptText).catch(() => {});
        setWorkspacePromptCopied(true);
        setDirectGenErrorStatus(
          neuralRes.message ||
            'خدمة التوليد المباشر للصور داخل الموقع غير متاحة مجاناً حالياً. تم نسخ وصف الترند المخصص لك تلقائياً إلى الحافظة لتتمكن من تجربته فوراً في إحدى الأدوات الخارجية المجانية أدناه.',
        );
      }
    } catch (err: any) {
      setDirectGenErrorStatus(
        err?.message ||
          'تعذر الاتصال بخدمة التوليد المباشر. يمكنك نسخ الوصف الجاهز واستخدامه في الأدوات الخارجية المجانية.',
      );
    } finally {
      setIsTestingDirectGen(false);
    }
  };

  const handleCopyCardPrompt = (idea: AiTrendIdea) => {
    const promptToCopy = buildReadyToCopyPrompt({
      idea,
      aspectRatio: idea.recommendedRatio,
      additionalDescription,
      studentName,
      customQuote,
    });
    navigator.clipboard.writeText(promptToCopy);
    setCopiedPromptId(idea.id);
    showToast(`تم نسخ وصف «${idea.title}» إلى الحافظة 📋`);
    setTimeout(() => setCopiedPromptId(null), 2200);
  };

  const handleCopyWorkspacePrompt = () => {
    navigator.clipboard.writeText(readyPromptText);
    setWorkspacePromptCopied(true);
    showToast('تم نسخ وصف الترند المخصص بالكامل إلى الحافظة 📋');
    setTimeout(() => setWorkspacePromptCopied(false), 2500);
  };

  const handleDownloadImage = (dataUrl: string, title: string) => {
    const a = document.createElement('a');
    a.href = dataUrl;
    const safeName = title.replace(/\s+/g, '-').slice(0, 32);
    a.download = `nursing-2027-ai-${safeName}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('تم بدء تنزيل الصورة على جهازك 📥');
  };

  const handleOptInPublicShare = async (creation: UserAiCreation) => {
    await shareCreationToPublicGallery(creation);
    const updatedShared = await fetchPublicSharedGallery();
    setSharedGallery(updatedShared);
    showToast('تمت مشاركة تصميمك في معرض الدفعة العام بموافقتك 🌟');
  };

  const handleDeletePrivateCreation = async (id: string) => {
    await deleteUserAiCreation(id);
    setMyCreations(getPrivateUserCreations(activeUserUid));
    if (generatedResult?.id === id) {
      setGeneratedResult(null);
    }
    showToast('تم حذف التصميم من قائمتك الخاصة نهائياً 🗑️');
  };

  // ==================== Site Manager Studio Admin Handlers ====================
  const handleSaveCustomIdea = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingIdea?.title || !editingIdea?.category) {
      showToast('يرجى إدخال عنوان الفكرة وتصنيفها');
      return;
    }

    const ideaToSave: AiTrendIdea = {
      id: editingIdea.id || `custom_${Date.now()}`,
      category: editingIdea.category || 'nursing_graduation',
      title: editingIdea.title,
      subtitle: editingIdea.subtitle || 'فكرة مميزة لدفعة التمريض 2027',
      description: editingIdea.description || editingIdea.subtitle || '',
      promptTemplate:
        editingIdea.promptTemplate ||
        'Luxury nursing graduation 2027 portrait preserving exact facial features.',
      styleTag: editingIdea.styleTag || 'ترند مخصص ✨',
      artisticStyle: (editingIdea.artisticStyle as ArtisticStyleId) || 'luxury_studio',
      recommendedRatio: (editingIdea.recommendedRatio as TrendAspectRatio) || '4:5',
      supportedRatios: ['9:16', '4:5', '1:1'],
      isNewTrend: Boolean(editingIdea.isNewTrend),
      isMostCreative: Boolean(editingIdea.isMostCreative),
      isSuggested: Boolean(editingIdea.isSuggested),
      isFeatured: Boolean(editingIdea.isFeatured),
      isEnabled: editingIdea.isEnabled !== false,
      sortOrder: Number(editingIdea.sortOrder ?? 1),
      sceneTheme: editingIdea.sceneTheme || {
        primaryColor: '#0B1323',
        secondaryColor: '#2DD4BF',
        glowColor: '#38BDF8',
        motif: 'stethoscope_scrub',
        frameStyle: 'editorial',
      },
    };

    await saveStudioCustomIdea(ideaToSave);
    const refreshed = await fetchAllStudioIdeas();
    setAllIdeas(refreshed);
    setEditingIdea(null);
    showToast('تم حفظ الفكرة وتحديث مكتبة الاستوديو بنجاح ✅');
  };

  const handleToggleIdeaFlag = async (
    idea: AiTrendIdea,
    field: 'isEnabled' | 'isFeatured' | 'isNewTrend' | 'isMostCreative',
  ) => {
    const updated: AiTrendIdea = {
      ...idea,
      [field]: !idea[field],
    };
    await saveStudioCustomIdea(updated);
    setAllIdeas(await fetchAllStudioIdeas());
    showToast('تم تحديث إعدادات الفكرة');
  };

  const handleAddCustomCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryTitle.trim()) return;
    const newCat: TrendCategoryMeta = {
      id: `cat_${Date.now()}` as TrendCategoryId,
      title: newCategoryTitle.trim(),
      subtitle: newCategorySubtitle.trim() || 'قسم ترندات مخصص',
      badgeText: 'قسم مخصص',
      accentHex: '#2DD4BF',
      secondaryHex: '#38BDF8',
    };
    saveCustomCategory(newCat);
    setCustomCategories(getCustomCategories());
    setNewCategoryTitle('');
    setNewCategorySubtitle('');
    showToast('تمت إضافة القسم الجديد إلى الاستوديو ✨');
  };

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0B1323] text-slate-100 pb-24 selection:bg-teal-500/30 selection:text-teal-200"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 border border-teal-500/40 text-teal-100 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-xl animate-fade-in">
          <Sparkles className="w-5 h-5 text-teal-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input
        ref={primaryFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePhotoUpload(e, false)}
      />
      <input
        ref={secondaryFileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handlePhotoUpload(e, true)}
      />

      {/* ==================== LUXURY GLASS STUDIO HERO HEADER ==================== */}
      <section className="relative overflow-hidden border-b border-white/10 bg-gradient-to-b from-[#101C35] via-[#0B1323] to-[#0B1323] pt-8 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
            <div className="space-y-4 max-w-3xl">
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl bg-teal-500/10 border border-teal-400/25 text-teal-300 text-xs sm:text-sm font-semibold backdrop-blur-md">
                <Stethoscope className="w-4 h-4 text-teal-400" />
                <span>🎨✨ استوديو ترندات التخرج AI • مجاني وبدون أي اشتراك</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                🎨✨ استوديو ترندات التخرج{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-l from-teal-300 via-cyan-300 to-sky-400">
                  والإبداع بالذكاء الاصطناعي
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
                مكتبة متكاملة تضم أشهر ترندات Instagram وTikTok: صورتي وأنا طفل بملابس التخرج،
                الطفل بالبالطو الطبي، أنا الصغير بجانب صورتي الحالية، صور الأبيض والأسود، بوسترات
                المجلات والسينما، وأفكار إبداعية عامة. اختر صورتك، انسخ الوصف الجاهز، وجرّب الترند
                مجاناً بكل خصوصية وأمان.
              </p>

              {/* Primary CTA Action Bar */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setIsWorkspaceOpen(true);
                    setTimeout(() => {
                      workspaceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }, 80);
                  }}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-l from-teal-400 to-cyan-500 text-slate-950 font-bold text-sm sm:text-base shadow-lg shadow-teal-500/20 hover:brightness-110 transition-all cursor-pointer"
                >
                  <Wand2 className="w-5 h-5" />
                  <span>تجهيز صورتي ووصف الترند</span>
                </button>

                <button
                  onClick={() => primaryFileInputRef.current?.click()}
                  className="inline-flex items-center gap-2.5 px-5 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/15 font-semibold text-sm sm:text-base backdrop-blur-md transition-all cursor-pointer"
                >
                  <Upload className="w-5 h-5 text-teal-400" />
                  <span>{primaryPhotoDataUrl ? 'تغيير صورتك المختارة' : 'اختر صورة من هاتفك'}</span>
                </button>

                <button
                  onClick={handleSuggestCrazyIdea}
                  disabled={isSuggestingIdea}
                  className="inline-flex items-center gap-2 px-4 py-3.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold text-sm transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className={`w-4 h-4 ${isSuggestingIdea ? 'animate-spin' : ''}`} />
                  <span>{isSuggestingIdea ? 'جارٍ ابتكار فكرة...' : '🪄 مختبر الأفكار المبتكرة'}</span>
                </button>
              </div>
            </div>

            {/* Privacy & Transparency Glass Card */}
            <div className="lg:w-88 bg-white/[0.04] border border-white/10 rounded-3xl p-5 space-y-3.5 backdrop-blur-xl shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span className="font-bold text-sm text-white">الخصوصية وطريقة العمل</span>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 font-medium">
                  معالجة محلية آمنة
                </span>
              </div>
              <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
                <li className="flex items-start gap-2">
                  <Lock className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                  <span>
                    تتم معاينة صورتك <strong>محلياً داخل متصفح هاتفك</strong> ولا يتم نشرها في المعرض
                    العام أو مشاركتها مع أي مستخدم آخر إطلاقاً.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Copy className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
                  <span>
                    يجهز لك الاستوديو وصفاً احترافياً دقيقاً (Prompt) لكل ترند مع زر نسخ سريع وربط
                    مع أشهر أدوات الذكاء الاصطناعي الخارجية المجانية.
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    أكثر من {enabledIdeas.length} فكرة في 9 أقسام للتخرج والتمريض والأفكار الإبداعية
                    العامة.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* Main Studio Sub-Navigation */}
          <div className="flex flex-wrap items-center justify-between gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setActiveMainTab('explore')}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeMainTab === 'explore'
                    ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                    : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-white/10'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>مكتبة الترندات والأفكار ({enabledIdeas.length})</span>
              </button>

              <button
                onClick={() => {
                  setIsWorkspaceOpen(true);
                  setTimeout(() => {
                    workspaceSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }, 80);
                }}
                className="px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 bg-white/5 text-teal-300 hover:bg-white/10 border border-teal-400/30"
              >
                <Wand2 className="w-4 h-4" />
                <span>🪄 مختبر كتابة الوصف وتجهيز الطلب</span>
              </button>

              {myCreations.length > 0 && (
                <button
                  onClick={() => setActiveMainTab('my_designs')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeMainTab === 'my_designs'
                      ? 'bg-teal-500 text-slate-950 shadow-md shadow-teal-500/20'
                      : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-white/10'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  <span>محفوظاتي الخاصة ({myCreations.length})</span>
                </button>
              )}

              {isSiteManager && (
                <button
                  onClick={() => setActiveMainTab('admin_studio')}
                  className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 ${
                    activeMainTab === 'admin_studio'
                      ? 'bg-amber-400 text-slate-950 shadow-md'
                      : 'bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30'
                  }`}
                >
                  <Sliders className="w-4 h-4" />
                  <span>إدارة الاستوديو (مدير الموقع)</span>
                </button>
              )}
            </div>

            {/* Search Input */}
            {activeMainTab === 'explore' && (
              <div className="relative w-full sm:w-72">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن ترند (طفل، بالطو، أبيض وأسود، TikTok...)"
                  className="w-full bg-slate-900/90 border border-white/15 focus:border-teal-400 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 outline-none transition-all"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-12">
        {/* ==================== PHOTO UPLOAD, PROMPT PREPARATION & FREE EXTERNAL AI LAUNCHER ==================== */}
        {isWorkspaceOpen && selectedIdea && (
          <section
            ref={workspaceSectionRef}
            className="bg-slate-900/90 backdrop-blur-2xl border border-teal-500/35 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                  <Wand2 className="w-4 h-4" />
                  <span>تجهيز الطلب واختيار المقاس وتجربة الترند مجاناً</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  {suggestedIdeaCard ? suggestedIdeaCard.title : selectedIdea.title}
                </h2>
                <p className="text-sm text-slate-300">
                  {suggestedIdeaCard ? suggestedIdeaCard.description : selectedIdea.description}
                </p>
              </div>

              <button
                onClick={() => setIsWorkspaceOpen(false)}
                className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <X className="w-4 h-4" />
                <span>إغلاق نافذة التجهيز</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Right Column: Step 1 (Upload & Preview Photo) + Step 2 (Aspect Ratio & Custom Description) */}
              <div className="lg:col-span-6 space-y-6">
                {/* Step 1: Upload & Preview Photo Locally */}
                <div className="bg-slate-950/75 border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                      <span className="w-6 h-6 rounded-lg bg-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                        1
                      </span>
                      <span>اختر صورتك من الهاتف وعاينها (اختياري)</span>
                    </h3>
                    {primaryPhotoDataUrl && (
                      <button
                        onClick={handleSmartAnalyzePhoto}
                        disabled={isAnalyzingPhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-500/15 hover:bg-teal-500/25 border border-teal-400/30 text-teal-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles
                          className={`w-3.5 h-3.5 ${isAnalyzingPhoto ? 'animate-spin' : ''}`}
                        />
                        <span>{isAnalyzingPhoto ? 'جارٍ الفحص...' : 'نصائح ذكية للصورة'}</span>
                      </button>
                    )}
                  </div>

                  {/* Privacy reassurance inside upload step */}
                  <div className="text-[11px] text-slate-400 bg-slate-900/80 border border-white/5 rounded-xl px-3 py-2 flex items-center gap-2">
                    <Lock className="w-3.5 h-3.5 text-teal-400 shrink-0" />
                    <span>
                      معاينة الصورة تتم داخل متصفح جهازك فقط، ولا تُحفظ في قاعدة البيانات العامة أو
                      تُعرض لأي مستخدم آخر.
                    </span>
                  </div>

                  {primaryPhotoDataUrl ? (
                    <div className="bg-slate-900/80 border border-teal-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-4">
                      <img
                        src={primaryPhotoDataUrl}
                        alt="معاينة صورتك المختارة"
                        className="w-32 h-32 object-cover rounded-2xl border-2 border-teal-400 shadow-lg shrink-0"
                      />
                      <div className="space-y-3 flex-1 text-center sm:text-right">
                        <div className="text-xs font-bold text-teal-300">
                          تمت معاينة صورتك بنجاح — جاهزة للاستخدام
                        </div>
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadOriginalPhoto}
                            className="px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-200 border border-teal-400/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>تنزيل الصورة الأصلية</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleShareOriginalPhoto}
                            className="px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-400/30 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                            <span>مشاركة الصورة</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => primaryFileInputRef.current?.click()}
                            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white cursor-pointer"
                          >
                            تغيير الصورة
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setPrimaryPhotoDataUrl('');
                              setPhotoAnalysis(null);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-xs font-semibold text-rose-300 cursor-pointer"
                          >
                            إزالة
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => primaryFileInputRef.current?.click()}
                      className="w-full py-7 border-2 border-dashed border-slate-700 hover:border-teal-400/60 rounded-2xl flex flex-col items-center gap-2.5 bg-slate-900/40 hover:bg-slate-900/70 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-teal-500/15 border border-teal-400/30 flex items-center justify-center text-teal-300">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-sm text-white">
                        اضغط لاختيار صورتك من الهاتف أو الكمبيوتر ومعاينتها
                      </span>
                      <span className="text-xs text-slate-400">
                        يمكنك أيضاً نسخ وصف الترند مباشرة حتى بدون رفع صورة هنا
                      </span>
                    </button>
                  )}

                  {photoAnalysis && (
                    <div className="bg-teal-950/30 border border-teal-500/30 rounded-2xl p-3.5 space-y-2 text-xs">
                      <div className="font-bold text-teal-300">
                        ملاحظات فنية على صورتك ({photoAnalysis.lightingQuality}):
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        {photoAnalysis.facePreservationTips}
                      </p>
                    </div>
                  )}
                </div>

                {/* Step 2: Select Aspect Ratio & Write Optional Custom Description */}
                <div className="bg-slate-950/75 border border-white/10 rounded-2xl p-5 space-y-5">
                  <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                    <span className="w-6 h-6 rounded-lg bg-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                      2
                    </span>
                    <span>اختر مقاس الصورة واكتب وصفك الإضافي</span>
                  </h3>

                  {/* Aspect Ratio Selector: Square (1:1), Vertical Post (4:5), Story/Video Cover (9:16) */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-300 block">
                      مقاس الصورة المطلوب:
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      {(['1:1', '4:5', '9:16'] as TrendAspectRatio[]).map((r) => {
                        const info = RATIO_META[r];
                        const active = selectedRatio === r;
                        return (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setSelectedRatio(r)}
                            className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                              active
                                ? 'bg-teal-500 text-slate-950 border-teal-400 font-extrabold shadow-md'
                                : 'bg-slate-900 border-white/10 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            <div className="text-xs sm:text-sm font-bold">{info.label}</div>
                            <div
                              className={`text-[11px] mt-0.5 ${
                                active ? 'text-slate-900 font-medium' : 'text-slate-400'
                              }`}
                            >
                              {info.subtitle}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Optional Student Name & Quote */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        الاسم المطلوب في التصميم (اختياري):
                      </label>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="مثال: الممرض علي حسين — دفعة 2027"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        عبارة قصيرة أو عنوان (اختياري):
                      </label>
                      <input
                        type="text"
                        value={customQuote}
                        onChange={(e) => setCustomQuote(e.target.value)}
                        placeholder="مثال: من حلم الطفولة إلى التخرج"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400"
                      />
                    </div>
                  </div>

                  {/* Custom Additional Description (مختبر الأفكار / وصف إضافي اختياري) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-300">
                        🪄 وصف إضافي اختياري (اكتب أي تفاصيل خاصة تريدها في تصميمك):
                      </label>
                      <button
                        type="button"
                        onClick={handleSuggestCrazyIdea}
                        disabled={isSuggestingIdea}
                        className="text-xs text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>اقترح فكرة جديدة</span>
                      </button>
                    </div>
                    <textarea
                      rows={2}
                      value={additionalDescription}
                      onChange={(e) => setAdditionalDescription(e.target.value)}
                      placeholder="مثال: أريد إضاءة ليلية ذهبية، أو ارتداء نظارة طبية، أو خلفية مكتبة طبية فخمة..."
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs sm:text-sm text-white placeholder-slate-500 outline-none focus:border-teal-400"
                    />
                  </div>
                </div>
              </div>

              {/* Left Column: Step 3 (Ready-Made Prompt Copy + Free External AI Tools Launcher) */}
              <div className="lg:col-span-6 flex flex-col justify-between bg-slate-950/90 border border-white/10 rounded-2xl p-5 space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white flex items-center gap-2 text-sm sm:text-base">
                      <span className="w-6 h-6 rounded-lg bg-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center">
                        3
                      </span>
                      <span>الوصف الجاهز وتجربة الترند مجاناً</span>
                    </h3>
                    <span className="text-xs px-2.5 py-1 rounded-lg bg-teal-500/15 text-teal-300 font-semibold">
                      {RATIO_META[selectedRatio].label}
                    </span>
                  </div>

                  {/* Ready Prompt Box with One-Click Copy */}
                  <div className="bg-slate-900/95 border border-teal-500/30 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-teal-300">
                        وصف الترند الجاهز والمخصص لك (Prompt):
                      </span>
                      <button
                        type="button"
                        onClick={handleCopyWorkspacePrompt}
                        className="px-4 py-2 rounded-xl bg-gradient-to-l from-teal-400 to-cyan-500 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-md hover:brightness-110 transition-all cursor-pointer"
                      >
                        {workspacePromptCopied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>تم نسخ الوصف بنجاح!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>نسخ وصف الترند</span>
                          </>
                        )}
                      </button>
                    </div>

                    <pre
                      dir="auto"
                      className="text-xs text-slate-200 whitespace-pre-wrap font-sans bg-slate-950/90 border border-white/10 rounded-xl p-3 max-h-40 overflow-y-auto leading-relaxed"
                    >
                      {readyPromptText}
                    </pre>
                  </div>

                  {/* Transparent Explanation Banner (Required by User Section 4 & 5) */}
                  <div className="bg-sky-500/10 border border-sky-400/30 rounded-2xl p-4 space-y-2 text-xs text-sky-100 leading-relaxed">
                    <div className="font-extrabold text-sky-300 flex items-center gap-2">
                      <Info className="w-4 h-4 shrink-0" />
                      <span>كيف يتم توليد التصميم مجاناً؟ (توضيح الخصوصية والنقل)</span>
                    </div>
                    <p>
                      • يتم التوليد الفعلي بالذكاء الاصطناعي عبر الأدوات الخارجية المجانية أدناه،
                      وتخضع حدود الاستخدام المجاني اليومية لشروط كل أداة.
                    </p>
                    <p>
                      • عند الضغط على أي أداة بالأسفل، يقوم الموقع{' '}
                      <strong>بنسخ وصف الترند الجاهز تلقائياً</strong> إلى حافظتك، ولكن{' '}
                      <strong>لا تنتقل صورتك الشخصية تلقائياً</strong> إلى الموقع الخارجي حفاظاً على
                      خصوصيتك؛ كل ما عليك بعد فتح الأداة هو إرفاق صورتك من جهازك ثم لصق الوصف المنسوخ
                      (لصق / Paste).
                    </p>
                  </div>

                  {/* Free External AI Tools List */}
                  <div className="space-y-2.5">
                    <div className="text-xs font-bold text-white">
                      جرّب هذا الترند الآن في أداة ذكاء اصطناعي خارجية مجانية:
                    </div>
                    <div className="grid grid-cols-1 gap-2.5">
                      {FREE_EXTERNAL_AI_TOOLS.map((tool) => (
                        <div
                          key={tool.id}
                          className="p-3.5 rounded-2xl bg-slate-900/90 hover:bg-slate-900 border border-white/10 hover:border-teal-400/50 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-white">
                                {tool.name}
                              </span>
                              <span className="text-[10px] px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-300 font-semibold">
                                {tool.badge}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed">
                              {tool.howToUseArabic}
                            </p>
                          </div>

                          <a
                            href={tool.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => {
                              navigator.clipboard?.writeText(readyPromptText).catch(() => {});
                              setWorkspacePromptCopied(true);
                              showToast(
                                `تم نسخ الوصف الجاهز! أرفق صورتك والصق الوصف في ${tool.name}`,
                              );
                            }}
                            className="shrink-0 px-4 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                          >
                            <span>جرّب الترند في الأداة</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Direct In-Site Service Test & Honest Failure Handling */}
                <div className="pt-3 border-t border-white/10 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-400">
                      فحص خدمة التوليد المباشر داخل الموقع:
                    </span>
                    <button
                      type="button"
                      onClick={handleTestDirectServerGeneration}
                      disabled={isTestingDirectGen}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${isTestingDirectGen ? 'animate-spin' : ''}`}
                      />
                      <span>
                        {isTestingDirectGen
                          ? 'جارٍ التحقق من توفر خدمة مجانية مباشرة...'
                          : 'اختبار التوليد المباشر المجاني'}
                      </span>
                    </button>
                  </div>

                  {directGenErrorStatus && (
                    <div className="bg-amber-500/10 border border-amber-400/35 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-200 leading-relaxed">
                      <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block mb-0.5">
                          حالة التوليد المباشر (بدون نجاح وهمي):
                        </span>
                        {directGenErrorStatus}
                      </div>
                    </div>
                  )}

                  {generatedResult && (
                    <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-2xl p-4 space-y-3 text-center">
                      <img
                        src={generatedResult.imageDataUrl}
                        alt={generatedResult.trendTitle}
                        onClick={() => setLightboxCreation(generatedResult)}
                        className="max-h-72 mx-auto rounded-xl border border-teal-400/40 cursor-zoom-in"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleDownloadImage(
                            generatedResult.imageDataUrl,
                            generatedResult.trendTitle,
                          )
                        }
                        className="px-5 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-xs inline-flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        <span>تنزيل النتيجة</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ==================== TAB 1: EXPLORE TRENDS & CATEGORIES ==================== */}
        {activeMainTab === 'explore' && (
          <div className="space-y-12">
            {/* Highlighted Sections When on 'all' and no search query */}
            {selectedCategory === 'all' && !searchQuery.trim() && (
              <div className="space-y-10">
                {/* 1. الترندات الجديدة والأكثر طلباً */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Zap className="w-5 h-5 text-teal-400" />
                      <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                        الترندات الجديدة والأكثر انتشاراً 🔥
                      </h2>
                    </div>
                    <span className="text-xs text-slate-400">
                      انسخ الوصف أو اضغط «جرّب الترند» لتجهيز صورتك
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                    {newTrendIdeas.map((idea) => (
                      <div
                        key={`new_${idea.id}`}
                        className="group bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-teal-400/60 rounded-3xl overflow-hidden transition-all duration-300 flex flex-col justify-between shadow-lg"
                      >
                        <div>
                          <div
                            onClick={() => handleSelectIdea(idea)}
                            className="relative h-56 overflow-hidden bg-slate-950 cursor-pointer"
                          >
                            <img
                              src={buildTrendPreviewSvgDataUrl(idea)}
                              alt={idea.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 right-3 px-3 py-1 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-xs shadow">
                              ترند مميز 🔥
                            </div>
                            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/85 border border-white/15 text-[11px] text-teal-200 font-semibold">
                              المقاس المناسب: {RATIO_META[idea.recommendedRatio].label}
                            </div>
                          </div>

                          <div className="p-5 space-y-2">
                            <span className="text-[11px] text-teal-300 font-semibold bg-teal-500/10 px-2.5 py-1 rounded-lg inline-block">
                              {idea.styleTag}
                            </span>
                            <h3 className="font-extrabold text-base text-white group-hover:text-teal-300 transition-colors">
                              {idea.title}
                            </h3>
                            <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                              {idea.description}
                            </p>
                          </div>
                        </div>

                        <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleSelectIdea(idea)}
                            className="flex-1 py-2.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Wand2 className="w-3.5 h-3.5" />
                            <span>جرّب الترند</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleCopyCardPrompt(idea)}
                            className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {copiedPromptId === idea.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-teal-400" />
                                <span className="text-teal-300">تم النسخ</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-teal-400" />
                                <span>نسخ الوصف</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Category Filter Bar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                  تصنيفات وأفكار استوديو ترندات التخرج AI
                </h2>
                <span className="text-xs text-slate-400">
                  معروض حالياً: {filteredIdeas.length} فكرة
                </span>
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-2 no-scrollbar">
                {allCategoryTabs.map((cat) => {
                  const isActive = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`shrink-0 px-4 py-3 rounded-2xl border text-right transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-l from-teal-500/25 to-cyan-500/15 border-teal-400 text-white shadow-lg'
                          : 'bg-slate-900/80 border-white/10 text-slate-300 hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-xs sm:text-sm">{cat.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-teal-300">
                          {cat.badgeText}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Cards Grid */}
            {loadingIdeas ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div
                    key={n}
                    className="h-80 rounded-3xl bg-slate-900/60 border border-slate-800 animate-pulse"
                  />
                ))}
              </div>
            ) : filteredIdeas.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800 space-y-3">
                <Sparkles className="w-10 h-10 text-teal-400 mx-auto" />
                <p className="text-base font-bold text-white">
                  لم يتم العثور على ترند مطابق لبحثك
                </p>
                <button
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs cursor-pointer"
                >
                  عرض جميع الأفكار
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredIdeas.map((idea) => (
                  <div
                    key={idea.id}
                    className="group bg-white/[0.03] hover:bg-white/[0.06] backdrop-blur-xl border border-white/10 hover:border-teal-400/60 rounded-3xl overflow-hidden flex flex-col justify-between transition-all duration-300 shadow-lg"
                  >
                    <div>
                      <div
                        onClick={() => handleSelectIdea(idea)}
                        className="relative h-56 bg-slate-950 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={buildTrendPreviewSvgDataUrl(idea)}
                          alt={idea.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-950/90 border border-white/15 text-[11px] text-teal-200 font-semibold">
                          المقاس المناسب: {RATIO_META[idea.recommendedRatio].label}
                        </div>
                      </div>

                      <div className="p-5 space-y-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-bold text-teal-400 bg-teal-500/10 px-2.5 py-1 rounded-lg">
                            {idea.styleTag}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {idea.recommendedRatio}
                          </span>
                        </div>

                        <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                          {idea.title}
                        </h3>
                        <p className="text-xs text-slate-300 leading-relaxed">{idea.description}</p>
                      </div>
                    </div>

                    <div className="px-5 pb-5 pt-2 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSelectIdea(idea)}
                        className="flex-1 py-2.5 px-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold text-xs sm:text-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Wand2 className="w-4 h-4" />
                        <span>جرّب الترند</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleCopyCardPrompt(idea)}
                        title="نسخ وصف الترند الجاهز"
                        className="py-2.5 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-white/10 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {copiedPromptId === idea.id ? (
                          <>
                            <Check className="w-4 h-4 text-teal-400" />
                            <span className="text-teal-300">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 text-teal-400" />
                            <span>نسخ الوصف</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ==================== TAB 2: MY PRIVATE DESIGNS («محفوظاتي الخاصة») ==================== */}
        {activeMainTab === 'my_designs' && (
          <section className="space-y-6">
            <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-teal-400 text-xs font-bold">
                  <Lock className="w-4 h-4" />
                  <span>خزنتك الشخصية المحمية</span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">محفوظاتي الخاصة</h2>
                <p className="text-xs sm:text-sm text-slate-300">
                  جميع العناصر المحفوظة هنا خاصة بك وحدك ولا تظهر لأي مستخدم آخر.
                </p>
              </div>
              <button
                onClick={() => setActiveMainTab('explore')}
                className="px-5 py-3 rounded-2xl bg-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm cursor-pointer shrink-0"
              >
                العودة لمكتبة الترندات
              </button>
            </div>

            {myCreations.length === 0 ? (
              <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-3xl space-y-4">
                <ImageIcon className="w-12 h-12 text-slate-500 mx-auto" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">لا توجد عناصر محفوظة بعد</h3>
                  <p className="text-xs sm:text-sm text-slate-400">
                    اختر أي ترند من المكتبة لنسخ وصفه وتجربته مجاناً.
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {myCreations.map((item) => (
                  <div
                    key={item.id}
                    className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div
                        onClick={() => setLightboxCreation(item)}
                        className="relative h-72 bg-slate-950 flex items-center justify-center p-2 cursor-zoom-in overflow-hidden"
                      >
                        <img
                          src={item.imageDataUrl}
                          alt={item.trendTitle}
                          className="max-h-full w-auto object-contain rounded-xl"
                        />
                        <button
                          type="button"
                          className="absolute top-3 left-3 p-2 rounded-xl bg-slate-900/80 text-white hover:bg-slate-800"
                          title="تكبير بالحجم الكامل"
                        >
                          <Maximize2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-teal-300 font-semibold">
                          <span>{item.artisticStyle}</span>
                          <span>{item.aspectRatio}</span>
                        </div>
                        <h3 className="font-extrabold text-base text-white">{item.trendTitle}</h3>
                      </div>
                    </div>

                    <div className="p-5 pt-0 space-y-2.5">
                      <div className="flex items-center justify-between gap-2 pt-1">
                        <button
                          onClick={() => handleDownloadImage(item.imageDataUrl, item.trendTitle)}
                          className="flex-1 py-2 px-3 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>تنزيل</span>
                        </button>
                        <button
                          onClick={() => handleOptInPublicShare(item)}
                          className="py-2 px-3 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-xs font-semibold cursor-pointer"
                        >
                          مشاركة اختيارية
                        </button>
                        <button
                          onClick={() => handleDeletePrivateCreation(item.id)}
                          className="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 cursor-pointer"
                          title="حذف نهائي"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================== TAB 4: SITE MANAGER STUDIO ADMIN ==================== */}
        {activeMainTab === 'admin_studio' && isSiteManager && (
          <section className="space-y-8">
            <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-extrabold text-white flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-400" />
                  <span>إحصائيات استخدام استوديو التخرج AI (إجمالية بدون كشف الصور الخاصة)</span>
                </h2>
                <button
                  onClick={() => fetchStudioUsageStats().then(setStudioStats)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-xs text-slate-200 cursor-pointer"
                >
                  تحديث الإحصائيات
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 block">إجمالي الطلبات</span>
                  <span className="text-2xl font-extrabold text-teal-400">
                    {studioStats?.totalGenerations ?? 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 block">مرات الفحص البصري</span>
                  <span className="text-2xl font-extrabold text-sky-400">
                    {studioStats?.photoAnalysesCount ?? 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 block">الأفكار المقترحة</span>
                  <span className="text-2xl font-extrabold text-amber-400">
                    {studioStats?.ideaSuggestionsCount ?? 0}
                  </span>
                </div>
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4">
                  <span className="text-xs text-slate-400 block">عدد الأفكار الفعالة</span>
                  <span className="text-2xl font-extrabold text-purple-400">
                    {enabledIdeas.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Add / Edit Idea Form + Add Category Form */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveCustomIdea}
                className="lg:col-span-8 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-teal-400" />
                  <span>{editingIdea?.id ? 'تعديل فكرة ترند' : 'إضافة فكرة ترند جديدة'}</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    required
                    value={editingIdea?.title || ''}
                    onChange={(e) =>
                      setEditingIdea((prev) => ({ ...(prev || {}), title: e.target.value }))
                    }
                    placeholder="عنوان الفكرة (مثال: الطفل الممرض في جناح الأطفال)"
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                  <select
                    value={editingIdea?.category || 'nursing_graduation'}
                    onChange={(e) =>
                      setEditingIdea((prev) => ({ ...(prev || {}), category: e.target.value }))
                    }
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  >
                    {allCategoryTabs
                      .filter((c) => c.id !== 'all')
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input
                    type="text"
                    value={editingIdea?.styleTag || ''}
                    onChange={(e) =>
                      setEditingIdea((prev) => ({ ...(prev || {}), styleTag: e.target.value }))
                    }
                    placeholder="وسم الأسلوب (مثال: سينمائي 8K)"
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                  <select
                    value={editingIdea?.recommendedRatio || '4:5'}
                    onChange={(e) =>
                      setEditingIdea((prev) => ({
                        ...(prev || {}),
                        recommendedRatio: e.target.value as TrendAspectRatio,
                      }))
                    }
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  >
                    <option value="9:16">9:16 (Story / TikTok)</option>
                    <option value="4:5">4:5 (منشور عمودي)</option>
                    <option value="1:1">1:1 (مربع)</option>
                  </select>
                  <input
                    type="number"
                    value={editingIdea?.sortOrder ?? 1}
                    onChange={(e) =>
                      setEditingIdea((prev) => ({
                        ...(prev || {}),
                        sortOrder: Number(e.target.value),
                      }))
                    }
                    placeholder="ترتيب الظهور"
                    className="bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                  />
                </div>

                <textarea
                  rows={2}
                  value={editingIdea?.description || ''}
                  onChange={(e) =>
                    setEditingIdea((prev) => ({
                      ...(prev || {}),
                      description: e.target.value,
                      subtitle: e.target.value,
                    }))
                  }
                  placeholder="وصف الفكرة باللغة العربية..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white"
                />

                <textarea
                  rows={2}
                  value={editingIdea?.promptTemplate || ''}
                  onChange={(e) =>
                    setEditingIdea((prev) => ({ ...(prev || {}), promptTemplate: e.target.value }))
                  }
                  placeholder="وصف التوليد الجاهز (Prompt Template)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-teal-500 text-slate-950 font-extrabold text-sm cursor-pointer"
                  >
                    حفظ الفكرة
                  </button>
                  {editingIdea && (
                    <button
                      type="button"
                      onClick={() => setEditingIdea(null)}
                      className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs cursor-pointer"
                    >
                      إلغاء
                    </button>
                  )}
                </div>
              </form>

              <form
                onSubmit={handleAddCustomCategory}
                className="lg:col-span-4 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 space-y-4"
              >
                <h3 className="text-lg font-extrabold text-white">إضافة قسم ترندات جديد</h3>
                <input
                  type="text"
                  value={newCategoryTitle}
                  onChange={(e) => setNewCategoryTitle(e.target.value)}
                  placeholder="اسم القسم الجديد"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
                <input
                  type="text"
                  value={newCategorySubtitle}
                  onChange={(e) => setNewCategorySubtitle(e.target.value)}
                  placeholder="وصف مختصر للقسم..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-amber-400 text-slate-950 font-extrabold text-sm cursor-pointer"
                >
                  + إضافة القسم
                </button>
              </form>
            </div>
          </section>
        )}
      </div>

      {/* ==================== FULL-SIZE LIGHTBOX MODAL ==================== */}
      {lightboxCreation && (
        <div
          onClick={() => setLightboxCreation(null)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4 text-center"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                {lightboxCreation.trendTitle}
              </h3>
              <button
                onClick={() => setLightboxCreation(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <img
              src={lightboxCreation.imageDataUrl}
              alt={lightboxCreation.trendTitle}
              className="max-h-[75vh] w-auto mx-auto rounded-2xl shadow-2xl object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
};
