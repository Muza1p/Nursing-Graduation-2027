import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { MediaItem, GraduatePrivateMedia } from '../types';
import { LocalStorageManager } from '../services/storage';
import { MediaUploadZone, UploadResult } from './MediaUploadZone';
import {
  Image as ImageIcon,
  Sparkles,
  X,
  ZoomIn,
  Eye,
  Tag,
  Lock,
  Globe,
  Upload,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  ShieldCheck,
  Search,
  Filter,
  User,
  FolderOpen,
  Camera,
  Download,
  Film,
  ExternalLink,
} from 'lucide-react';

export const GallerySection: React.FC<{ limit?: number }> = ({ limit }) => {
  const { media, currentUser, isModerator, submitGraduateMedia, addMedia, navigateTo } = useApp();
  const [activeTab, setActiveTab] = useState<'public' | 'private'>('public');

  // Filters for Public Gallery
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedAlbum, setSelectedAlbum] = useState<string>('all');
  const [selectedMediaType, setSelectedMediaType] = useState<'all' | 'photo' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pageSize, setPageSize] = useState<number>(limit || 8);
  const [previewMedia, setPreviewMedia] = useState<MediaItem | GraduatePrivateMedia | null>(null);

  // Upload zones visibility
  const [showPublicUpload, setShowPublicUpload] = useState(false);
  const [showPrivateUpload, setShowPrivateUpload] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Private Media State
  const [privateMediaList, setPrivateMediaList] = useState<GraduatePrivateMedia[]>([]);

  // Load private media for this graduate strictly
  useEffect(() => {
    if (currentUser) {
      setPrivateMediaList(LocalStorageManager.getPrivateMedia(currentUser.id));
    } else {
      setPrivateMediaList([]);
    }
  }, [currentUser]);

  // Public approved media only
  const publicApprovedMedia = media.filter((m) => m.isPublic && m.status !== 'pending' && m.status !== 'rejected');

  // Filter public items
  const filteredPublicMedia = publicApprovedMedia.filter((m) => {
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesAlbum = selectedAlbum === 'all' || m.album === selectedAlbum;
    const isVideo = m.url.includes('video') || m.url.endsWith('.mp4') || m.title.includes('فيديو');
    const matchesType =
      selectedMediaType === 'all' ||
      (selectedMediaType === 'video' && isVideo) ||
      (selectedMediaType === 'photo' && !isVideo);

    const matchesSearch =
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.caption && m.caption.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.album && m.album.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (m.taggedGraduateName && m.taggedGraduateName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCat && matchesAlbum && matchesType && matchesSearch;
  });

  // Unique albums
  const availableAlbums = Array.from(new Set(publicApprovedMedia.map((m) => m.album).filter(Boolean))) as string[];

  const paginatedList = filteredPublicMedia.slice(0, pageSize);
  const hasMore = pageSize < filteredPublicMedia.length;

  const categories = [
    { id: 'all', label: 'كافة الأقسام' },
    { id: 'scrub_night', label: 'حفلة السكراب (12/12/2026)' },
    { id: 'official_grad', label: 'حفل التخرج الرسمي 2027' },
    { id: 'posters', label: 'الهوية والبوسترات' },
    { id: 'memories', label: 'ذكريات المعهد' },
  ];

  // Handle upload for Public Gallery
  const handlePublicUploadSuccess = (item: UploadResult) => {
    if (isModerator) {
      // Direct publishing for admin / moderators
      addMedia({
        title: item.title,
        url: item.url,
        album: item.album,
        category: item.category,
        isPublic: true,
        sizeMb: item.sizeMb,
        taggedGraduateName: item.taggedGraduateName,
      });
      setActionFeedback('تم نشر الصورة في المعرض العام فوراً بواسطة المشرف!');
    } else {
      // Graduate submission pending moderation
      const res = submitGraduateMedia({
        title: item.title,
        url: item.url,
        album: item.album,
        category: item.category,
      });
      setActionFeedback(res.message);
    }

    setTimeout(() => {
      setShowPublicUpload(false);
      setActionFeedback(null);
    }, 2500);
  };

  // Handle upload to Private Locker
  const handlePrivateUploadSuccess = (item: UploadResult) => {
    if (!currentUser) return;

    const newItem: GraduatePrivateMedia = {
      id: 'priv-' + Date.now(),
      graduateId: currentUser.id,
      title: item.title,
      url: item.url,
      uploadedAt: new Date().toISOString().split('T')[0],
      sizeBytes: Math.round(item.sizeMb * 1024 * 1024),
    };

    LocalStorageManager.savePrivateMedia(newItem);
    setPrivateMediaList(LocalStorageManager.getPrivateMedia(currentUser.id));
    setActionFeedback('تم حفظ الملف بأمان في خزانتك الشخصية المشفرة!');
    setTimeout(() => {
      setShowPrivateUpload(false);
      setActionFeedback(null);
    }, 2500);
  };

  const handleDeletePrivate = (id: string) => {
    if (!currentUser) return;
    LocalStorageManager.deletePrivateMedia(currentUser.id, id);
    setPrivateMediaList(LocalStorageManager.getPrivateMedia(currentUser.id));
  };

  const handleDownload = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'nursing-grad-media.jpg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <section className="py-8 sm:py-14 text-right">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-5 sm:space-y-8">
        {/* Header & Destination Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#35D6C2] font-bold mb-1.5">
              <Camera className="w-3.5 h-3.5 text-[#35D6C2]" />
              <span>أرشيف التخرج والذكريات السريرية</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#F4F8FC] leading-snug">
              معرض صور معهد التمريض (دفعة 2027)
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              توثيق حفلة السكراب في مسرح تفاحة المصور بعدسة باقر حسن، وذكريات التدريب والدفعة، ومستودع الصور الخاص بكل خريج.
            </p>
          </div>

          {/* Liquid Glass Destination Switcher */}
          <div className="p-1.5 rounded-2xl bg-[#101B2C] border border-white/10 grid grid-cols-2 sm:flex gap-1 shadow-lg w-full sm:w-auto shrink-0">
            <button
              onClick={() => {
                setActiveTab('public');
                setShowPublicUpload(false);
                setShowPrivateUpload(false);
              }}
              className={`py-2.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'public'
                  ? 'bg-[#342A78] text-white border border-indigo-400/40 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 text-[#35D6C2] shrink-0" />
              <span className="truncate">المعرض العام ({publicApprovedMedia.length})</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('private');
                setShowPublicUpload(false);
                setShowPrivateUpload(false);
              }}
              className={`py-2.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'private'
                  ? 'bg-gradient-to-r from-[#35D6C2] to-[#24B8A5] text-[#0A0D12] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">معرضي الخاص {currentUser && `(${privateMediaList.length})`}</span>
            </button>
          </div>
        </div>

        {/* Informative Privacy & Face-Grouping Clarification Banner */}
        <div className="p-3.5 rounded-2xl bg-[#101B2C] border border-white/10 flex items-start sm:items-center gap-3 text-xs text-slate-300">
          <ShieldCheck className="w-4 h-4 text-[#D7B875] shrink-0 mt-0.5 sm:mt-0" />
          <p className="leading-relaxed">
            <strong className="text-[#F4F8FC] ml-1">تنويه الخصوصية والفرز:</strong>
            التجميع التلقائي بالوجوه معطل لحماية الخصوصية البيومترية للطلبة بدون موافقة خطية مسبقة، ويتم الاعتماد على التصنيف اليدوي الدقيق حسب الألبومات والفعاليات.
          </p>
        </div>

        {/* Global Feedback Alert */}
        {actionFeedback && (
          <div className="p-4 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionFeedback}</span>
          </div>
        )}

        {/* 1. PUBLIC GALLERY DESTINATION */}
        {activeTab === 'public' && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Action Bar & Upload Trigger */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-[#101827] border border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
                {/* Search */}
                <div className="relative col-span-2 sm:w-60">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="بحث في الصور أو أسماء الطلبة..."
                    className="w-full px-3 py-2 sm:py-1.5 rounded-xl bg-[#090B10] border border-white/10 text-xs text-white pl-8 focus:outline-none focus:border-[#21D4C2]"
                  />
                  <Search className="absolute left-2.5 top-2.5 sm:top-2 w-3.5 h-3.5 text-gray-500" />
                </div>

                {/* Album Filter */}
                {availableAlbums.length > 0 && (
                  <select
                    value={selectedAlbum}
                    onChange={(e) => setSelectedAlbum(e.target.value)}
                    className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-[#090B10] border border-white/10 text-xs text-white"
                  >
                    <option value="all">كافة الألبومات ({availableAlbums.length})</option>
                    {availableAlbums.map((alb) => (
                      <option key={alb} value={alb}>
                        {alb}
                      </option>
                    ))}
                  </select>
                )}

                {/* Media Type Filter */}
                <select
                  value={selectedMediaType}
                  onChange={(e) => setSelectedMediaType(e.target.value as any)}
                  className="w-full sm:w-auto px-3 py-2 sm:py-1.5 rounded-xl bg-[#090B10] border border-white/10 text-xs text-white"
                >
                  <option value="all">كل الوسائط</option>
                  <option value="photo">صور فوتوغرافية</option>
                  <option value="video">مقاطع فيديو ترند</option>
                </select>
              </div>

              {/* Upload to Public Gallery Button */}
              <button
                onClick={() => setShowPublicUpload(!showPublicUpload)}
                className="w-full md:w-auto px-4 py-2.5 sm:py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Upload className="w-4 h-4 text-[#D6B779]" />
                <span>{showPublicUpload ? 'إغلاق نافذة الرفع' : 'نشر للكل (تقديم صورة أو فيديو)'}</span>
              </button>
            </div>

            {/* Direct File Upload Zone for Public Gallery */}
            {showPublicUpload && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                <MediaUploadZone
                  destinationLabel="المعرض العام للمراجعة"
                  submitButtonText="نشر للكل (تقديم للإشراف)"
                  onUploadSuccess={handlePublicUploadSuccess}
                  onCancel={() => setShowPublicUpload(false)}
                />
              </div>
            )}

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-[#21D4C2] text-black font-extrabold shadow-md shadow-[#21D4C2]/20'
                      : 'bg-[#101827] text-[#929BAA] hover:text-white border border-white/5'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Public Media Grid */}
            {filteredPublicMedia.length === 0 ? (
              <div className="text-center py-16 rounded-3xl bg-[#101827]/40 border border-white/5 p-6 space-y-2">
                <Camera className="w-12 h-12 text-[#929BAA] mx-auto opacity-50" />
                <h4 className="text-base font-bold text-white">لا توجد بيانات حالياً</h4>
                <p className="text-xs text-[#929BAA]">
                  لم يتم نشر صور في هذا القسم بعد. سيتم عرض الصور فور اعتمادها من قبل اللجنة المنظمة.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                {paginatedList.map((item) => {
                  const isVideo = item.url.includes('video') || item.url.endsWith('.mp4');
                  return (
                    <div
                      key={item.id}
                      onClick={() => setPreviewMedia(item)}
                      className="group relative rounded-2xl overflow-hidden bg-[#101827] border border-white/10 hover:border-[#21D4C2]/50 transition-all duration-300 cursor-pointer shadow-lg hover:-translate-y-1"
                    >
                      <div className="aspect-[4/3] w-full overflow-hidden bg-black/40 relative">
                        {isVideo ? (
                          <div className="w-full h-full flex items-center justify-center bg-indigo-950/40">
                            <Film className="w-10 h-10 text-amber-400 group-hover:scale-110 transition-transform" />
                            <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-black/70 text-[10px] text-amber-300 font-mono">
                              فيديو
                            </span>
                          </div>
                        ) : (
                          <img
                            src={item.url}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}

                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                          <span className="text-[11px] text-[#21D4C2] font-bold flex items-center gap-1">
                            <ZoomIn className="w-3.5 h-3.5" />
                            <span>تكبير وعرض</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-3">
                        <div className="flex items-center justify-between text-[10px] text-[#D6B779] mb-1">
                          <span className="truncate max-w-[120px]">{item.album || 'ألبوم الدفعة'}</span>
                          <span>{item.uploadedAt}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white group-hover:text-[#21D4C2] transition-colors truncate">
                          {item.title}
                        </h4>
                        {item.taggedGraduateName && (
                          <p className="text-[10px] text-gray-400 mt-1 truncate">
                            طالب: {item.taggedGraduateName}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination / Load More Button */}
            {hasMore && (
              <div className="text-center pt-4">
                <button
                  onClick={() => setPageSize((prev) => prev + 8)}
                  className="px-6 py-2.5 rounded-xl bg-[#101827] hover:bg-white/10 text-white border border-white/10 text-xs font-bold transition-all shadow-md active:scale-95"
                >
                  تحميل المزيد من الصور والذكريات ({filteredPublicMedia.length - pageSize} متبقية)
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. MY PRIVATE LOCKER DESTINATION */}
        {activeTab === 'private' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!currentUser ? (
              <div className="text-center py-16 rounded-3xl bg-[#101827] border border-white/10 p-8 space-y-4 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white mx-auto shadow-lg">
                  <Lock className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-black text-white">معرضي الخاص محمي بخاصية التشفير</h3>
                <p className="text-xs text-[#929BAA] leading-relaxed">
                  هذه المساحة مخصصة لكل خريج معتمد لحفظ صوره ومواده التذكارية الخاصة دون أن يراها أحد غيره.
                </p>
                <button
                  onClick={() => navigateTo('login')}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#21D4C2] to-[#1cb8a9] text-black font-extrabold text-xs shadow-lg shadow-[#21D4C2]/20"
                >
                  تسجيل الدخول للوصول لمعرضي الخاص
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Private Locker Controls */}
                <div className="p-4 rounded-2xl bg-[#101827] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#21D4C2]/20 border border-[#21D4C2]/30 flex items-center justify-center text-[#21D4C2]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">
                        خزانة {currentUser.displayTitle || currentUser.fullName} الخاصة
                      </h4>
                      <p className="text-[11px] text-[#929BAA]">
                        الصور المحفوظة هنا لا تظهر للعامة ولا لزملائك الخريجين، ومحمية ببيانات دخولك فقط.
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowPrivateUpload(!showPrivateUpload)}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#21D4C2] to-[#14B8A6] text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#21D4C2]/20 active:scale-95 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{showPrivateUpload ? 'إغلاق نافذة الرفع' : 'إضافة إلى معرضي الخاص'}</span>
                  </button>
                </div>

                {/* Direct File Upload Zone for Private Media */}
                {showPrivateUpload && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <MediaUploadZone
                      destinationLabel="معرضي الخاص"
                      submitButtonText="إضافة إلى معرضي الخاص"
                      onUploadSuccess={handlePrivateUploadSuccess}
                      onCancel={() => setShowPrivateUpload(false)}
                    />
                  </div>
                )}

                {/* Private Media Grid */}
                {privateMediaList.length === 0 ? (
                  <div className="text-center py-16 rounded-3xl bg-[#101827]/40 border border-dashed border-white/10 p-6 space-y-2">
                    <FolderOpen className="w-12 h-12 text-[#929BAA] mx-auto opacity-50" />
                    <h4 className="text-base font-bold text-white">لا توجد بيانات حالياً</h4>
                    <p className="text-xs text-[#929BAA] max-w-sm mx-auto">
                      يمكنك حفظ صورك التذكارية وبطاقات التخرج الخاصة بك هنا لتبقى متاحة لك متى ما سجلت دخولك من هاتفك.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {privateMediaList.map((item) => (
                      <div
                        key={item.id}
                        className="group relative rounded-2xl overflow-hidden bg-[#101827] border border-white/10 shadow-lg"
                      >
                        <div
                          onClick={() => setPreviewMedia(item)}
                          className="aspect-[4/3] w-full overflow-hidden bg-black/40 cursor-pointer"
                        >
                          <img
                            src={item.url}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>

                        <div className="p-3 text-right">
                          <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                          <span className="text-[10px] text-gray-400 block mt-0.5">{item.uploadedAt}</span>
                          <div className="flex items-center justify-between pt-2 border-t border-white/5 mt-2">
                            <button
                              onClick={() => handleDownload(item.url, `${item.title}.jpg`)}
                              className="text-[10px] text-[#21D4C2] hover:underline flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              <span>تحميل</span>
                            </button>
                            <button
                              onClick={() => handleDeletePrivate(item.id)}
                              className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span>حذف</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Global Lightbox / Preview Modal */}
        {previewMedia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 text-right">
            <div className="relative max-w-3xl w-full rounded-3xl bg-[#0F141F] border border-white/15 p-5 shadow-2xl text-white space-y-4">
              <button
                onClick={() => setPreviewMedia(null)}
                className="absolute top-4 left-4 p-2 rounded-full bg-black/70 hover:bg-white/20 text-white z-10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="max-h-[70vh] rounded-2xl overflow-hidden bg-black flex items-center justify-center">
                {previewMedia.url.includes('video') || previewMedia.url.endsWith('.mp4') ? (
                  <video src={previewMedia.url} controls autoPlay className="max-h-[68vh] w-auto mx-auto" />
                ) : (
                  <img src={previewMedia.url} alt={previewMedia.title} className="max-h-[68vh] w-auto object-contain mx-auto" />
                )}
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-white/10 pt-3">
                <div>
                  <h3 className="text-base font-bold text-white">{previewMedia.title}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#929BAA] mt-1">
                    {'album' in previewMedia && previewMedia.album && (
                      <span className="text-[#D6B779] font-medium">ألبوم: {previewMedia.album}</span>
                    )}
                    <span>التاريخ: {previewMedia.uploadedAt}</span>
                    <span className="text-[#21D4C2]">معهد التمريض — دفعة 2027</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownload(previewMedia.url, `${previewMedia.title}.jpg`)}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-[#21D4C2] hover:text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل بجودة كاملة</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
