import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicContext';
import { GraduationSong, SongCategory } from '../types';
import {
  SONG_CATEGORIES,
  getSongCategoryLabel,
  formatSongDuration,
  formatFileSize,
  validateAudioFile,
  extractAudioMetadataFromFile,
  suggestSongCategoryAndKeywords,
  uploadGraduationSongFile,
  addGraduationSongByUrl,
  updateGraduationSongMetadata,
  deleteGraduationSong,
  filterAndSortSongsSmart,
  getSimilarSongs,
  downloadGraduationSong,
  getLocalSongs,
} from '../services/musicLibrary';
import { AnimatedEcgWaveform } from '../components/MedicalIllustrations';
import {
  Music,
  Play,
  Pause,
  Search,
  Sparkles,
  Upload,
  Plus,
  Trash2,
  Edit3,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  X,
  Link2,
  Image as ImageIcon,
  ShieldCheck,
  ListMusic,
  SlidersHorizontal,
  HardDrive,
  Cloud,
} from 'lucide-react';

interface StagedAudioFile {
  tempId: string;
  file: File;
  title: string;
  artist: string;
  category: SongCategory;
  durationSeconds: number;
  durationFormatted: string;
  coverUrl: string;
  allowDownload: boolean;
  error?: string;
}

export const MusicLibraryPage: React.FC = () => {
  const { isAdmin, isSuperAdmin, firebaseUser, navigateTo } = useApp();
  const {
    songs,
    currentSong,
    isPlaying,
    isLoadingSongs,
    playSong,
    setSongsList,
    setIsPlaylistOpen,
  } = useMusic();

  // Only verified Firebase-authenticated admins can manage the library
  const canManageLibrary = Boolean(firebaseUser && (isAdmin || isSuperAdmin));

  // Search, Category, and Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SongCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<'custom' | 'alphabetical' | 'newest' | 'duration'>('custom');

  // Feedback Banner
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'warning' | 'error';
    text: string;
  } | null>(null);

  // Admin Panel State
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [adminAddMode, setAdminAddMode] = useState<'files' | 'url'>('files');

  // Multi-file Staging State
  const [stagedFiles, setStagedFiles] = useState<StagedAudioFile[]>([]);
  const [isExtractingMeta, setIsExtractingMeta] = useState(false);
  const [isUploadingBatch, setIsUploadingBatch] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState('');

  // Direct URL Add Form State
  const [urlTitle, setUrlTitle] = useState('');
  const [urlArtist, setUrlArtist] = useState('');
  const [urlAudioLink, setUrlAudioLink] = useState('');
  const [urlCategory, setUrlCategory] = useState<SongCategory>('graduation');
  const [urlCover, setUrlCover] = useState('');
  const [urlAllowDownload, setUrlAllowDownload] = useState(true);
  const [isAddingUrl, setIsAddingUrl] = useState(false);

  // Edit Song Modal State
  const [editingSong, setEditingSong] = useState<GraduationSong | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editCategory, setEditCategory] = useState<SongCategory>('graduation');
  const [editCoverUrl, setEditCoverUrl] = useState('');
  const [editAllowDownload, setEditAllowDownload] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Filtered & Sorted Songs + Smart Search Intent
  const { results: filteredSongs, detectedSmartIntent } = filterAndSortSongsSmart({
    songs,
    queryText: searchQuery,
    selectedCategory,
    sortBy,
  });

  // Similar Songs Recommendations based on currently playing/selected song
  const similarSongs = getSimilarSongs(currentSong, songs, 4);

  // Handle selecting one or multiple audio files from Android/iOS/Desktop file manager
  const handleSelectAudioFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setActionFeedback(null);
    setIsExtractingMeta(true);

    const filesArray: File[] = Array.from(fileList);
    const newStaged: StagedAudioFile[] = [];

    for (const file of filesArray) {
      const check = validateAudioFile(file);
      if (!check.valid) {
        newStaged.push({
          tempId: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          title: file.name,
          artist: 'اسم غير معروف',
          category: 'graduation',
          durationSeconds: 0,
          durationFormatted: '00:00',
          coverUrl: '',
          allowDownload: true,
          error: check.error,
        });
        continue;
      }

      const meta = await extractAudioMetadataFromFile(file);
      newStaged.push({
        tempId: `staged-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        title: meta.title,
        artist: meta.artist,
        category: meta.suggestedCategory,
        durationSeconds: meta.durationSeconds,
        durationFormatted: meta.durationFormatted,
        coverUrl: '',
        allowDownload: true,
      });
    }

    setStagedFiles((prev) => [...prev, ...newStaged]);
    setIsExtractingMeta(false);
    e.target.value = '';
  };

  const handleUpdateStagedField = (
    tempId: string,
    updates: Partial<StagedAudioFile>
  ) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.tempId === tempId ? { ...item, ...updates } : item))
    );
  };

  const handleRemoveStagedFile = (tempId: string) => {
    setStagedFiles((prev) => prev.filter((item) => item.tempId !== tempId));
  };

  // Convert small cover image file to compressed Data URL
  const handleCoverImageUpload = (
    file: File | undefined,
    onResult: (dataUrl: string) => void
  ) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setActionFeedback({
        type: 'error',
        text: 'يرجى اختيار ملف صورة صالح للغلاف.',
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 240;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          onResult(canvas.toDataURL('image/jpeg', 0.78));
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Upload all staged audio files
  const handleUploadAllStaged = async () => {
    if (!canManageLibrary) return;
    const validStaged = stagedFiles.filter((f) => !f.error);
    if (validStaged.length === 0) {
      setActionFeedback({
        type: 'error',
        text: 'لا توجد ملفات صوتية صالحة للرفع.',
      });
      return;
    }

    setIsUploadingBatch(true);
    setActionFeedback(null);

    let uploadedCount = 0;
    let hadLocalFallback = false;
    let lastNotice = '';
    const baseOrder = songs.length;

    for (let i = 0; i < validStaged.length; i++) {
      const item = validStaged[i];
      setUploadProgressText(
        `جاري رفع وحفظ الأغنية (${i + 1} من ${validStaged.length}): ${item.title}...`
      );

      const res = await uploadGraduationSongFile({
        file: item.file,
        title: item.title,
        artist: item.artist,
        category: item.category,
        durationSeconds: item.durationSeconds,
        coverUrl: item.coverUrl,
        allowDownload: item.allowDownload,
        sortOrder: baseOrder + i + 1,
      });

      if (res.success) {
        uploadedCount++;
        if (res.isLocalFallback) {
          hadLocalFallback = true;
        }
        lastNotice = res.notice;
      } else {
        lastNotice = res.notice;
      }
    }

    setSongsList(getLocalSongs());
    setStagedFiles([]);
    setIsUploadingBatch(false);
    setUploadProgressText('');

    if (uploadedCount > 0) {
      setActionFeedback({
        type: hadLocalFallback ? 'warning' : 'success',
        text:
          uploadedCount > 1
            ? hadLocalFallback
              ? `تمت إضافة ${uploadedCount} أغاني. ${lastNotice}`
              : `تم رفع وحفظ ${uploadedCount} أغاني في المكتبة السحابية بنجاح.`
            : lastNotice,
      });
    } else {
      setActionFeedback({
        type: 'error',
        text: lastNotice || 'تعذر رفع الملفات الصوتية.',
      });
    }
  };

  // Auto-suggest category and title from direct URL
  const handleAutoSuggestFromUrl = () => {
    if (!urlAudioLink.trim()) return;
    const rawFileName = decodeURIComponent(
      urlAudioLink.trim().split('?')[0].split('/').pop() || ''
    )
      .replace(/\.[a-z0-9]{2,4}$/i, '')
      .replace(/[_-]+/g, ' ')
      .trim();

    const nextTitle = urlTitle.trim() || rawFileName || 'اسم غير معروف';
    const nextArtist = urlArtist.trim() || 'اسم غير معروف';
    const suggested = suggestSongCategoryAndKeywords(
      nextTitle,
      nextArtist,
      rawFileName
    );
    if (!urlTitle.trim() && rawFileName) {
      setUrlTitle(rawFileName);
    }
    if (!urlArtist.trim()) {
      setUrlArtist('اسم غير معروف');
    }
    setUrlCategory(suggested.category);
  };

  // Add song via Direct Audio URL
  const handleAddSongByUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canManageLibrary) return;

    setIsAddingUrl(true);
    setActionFeedback(null);

    const res = await addGraduationSongByUrl({
      title: urlTitle.trim() || 'اسم غير معروف',
      artist: urlArtist.trim() || 'اسم غير معروف',
      audioUrl: urlAudioLink.trim(),
      category: urlCategory,
      coverUrl: urlCover.trim(),
      allowDownload: urlAllowDownload,
      sortOrder: songs.length + 1,
    });

    setIsAddingUrl(false);

    if (res.success) {
      setSongsList(getLocalSongs());
      setUrlTitle('');
      setUrlArtist('');
      setUrlAudioLink('');
      setUrlCover('');
      setActionFeedback({ type: 'success', text: res.notice });
    } else {
      setActionFeedback({ type: 'error', text: res.notice });
    }
  };

  // Open Edit Modal for a song
  const openEditSongModal = (song: GraduationSong) => {
    setEditingSong(song);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditCategory(song.category);
    setEditCoverUrl(song.coverUrl || '');
    setEditAllowDownload(song.allowDownload);
  };

  const handleSaveSongEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSong || !canManageLibrary) return;

    setIsSavingEdit(true);
    const res = await updateGraduationSongMetadata(editingSong.id, {
      title: editTitle.trim() || 'اسم غير معروف',
      artist: editArtist.trim() || 'اسم غير معروف',
      category: editCategory,
      coverUrl: editCoverUrl.trim(),
      allowDownload: editAllowDownload,
    });
    setIsSavingEdit(false);

    if (res.success) {
      setSongsList(getLocalSongs());
      setEditingSong(null);
      setActionFeedback({ type: 'success', text: res.notice });
    } else {
      setActionFeedback({ type: 'error', text: res.notice });
    }
  };

  const handleDeleteSong = async (song: GraduationSong) => {
    if (!canManageLibrary) return;
    const res = await deleteGraduationSong(song);
    if (res.success) {
      setSongsList(getLocalSongs());
      setActionFeedback({ type: 'success', text: res.notice });
    }
  };

  const handleMoveSongOrder = async (index: number, direction: 'up' | 'down') => {
    if (!canManageLibrary) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= songs.length) return;

    const currentItem = songs[index];
    const swapItem = songs[targetIdx];

    await Promise.all([
      updateGraduationSongMetadata(currentItem.id, { sortOrder: targetIdx + 1 }),
      updateGraduationSongMetadata(swapItem.id, { sortOrder: index + 1 }),
    ]);

    setSongsList(getLocalSongs());
  };

  const handleDownloadSong = async (song: GraduationSong) => {
    setActionFeedback(null);
    const res = await downloadGraduationSong(song);
    setActionFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  return (
    <div className="py-6 sm:py-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 text-right pb-36">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#142638] border border-[#35D6C5]/35 text-xs font-bold text-white">
          <Music className="w-3.5 h-3.5 text-[#35D6C5]" />
          <span>الأغاني — معهد التمريض دفعة 2027</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-black text-white">
          مكتبة أغاني التخرج الذكية
        </h1>

        <p className="text-xs sm:text-sm text-[#E8EEF2]/80 leading-relaxed">
          استمع إلى أغاني التخرج، حفلة السكراب، والموسيقى الحماسية والهادئة والأناشيد مع مشغّل مصغّر مستمر وقائمة تشغيل متكاملة.
        </p>

        {/* Top Action Bar (Open Playlist + Admin Upload Button for Authorized Admin) */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => setIsPlaylistOpen((prev) => !prev)}
            className="px-4 py-2.5 rounded-2xl bg-[#142638] hover:bg-[#1C354A] border border-[#35D6C5]/40 text-xs font-black text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            <ListMusic className="w-4 h-4 text-[#35D6C5]" />
            <span>فتح قائمة التشغيل المصغّرة ({songs.length})</span>
          </button>

          {canManageLibrary && (
            <button
              type="button"
              onClick={() => setShowAdminPanel((prev) => !prev)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] font-black text-xs flex items-center gap-2 shadow-lg shadow-[#35D6C5]/25 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>
                {showAdminPanel
                  ? 'إخفاء لوحة إدارة الأغاني'
                  : 'إدارة ورفع الأغاني (للمشرف)'}
              </span>
            </button>
          )}
        </div>

        <AnimatedEcgWaveform color="#35D6C5" opacity="opacity-20" className="w-full h-8 pt-1" />
      </div>

      {/* Global Action / Upload Feedback Banner */}
      {actionFeedback && (
        <div
          className={`max-w-3xl mx-auto p-4 rounded-2xl border text-xs sm:text-sm flex items-start justify-between gap-3 shadow-xl animate-in fade-in duration-200 ${
            actionFeedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
              : actionFeedback.type === 'warning'
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-100'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
          }`}
        >
          <div className="flex items-start gap-2.5">
            {actionFeedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed font-bold">{actionFeedback.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionFeedback(null)}
            className="text-slate-300 hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* ADMIN-ONLY MUSIC MANAGEMENT & MULTI-FILE UPLOAD PANEL               */}
      {/* =================================================================== */}
      {canManageLibrary && showAdminPanel && (
        <div className="rounded-3xl bg-[#0D1726]/95 backdrop-blur-2xl border-2 border-[#35D6C5]/45 p-5 sm:p-7 space-y-6 shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-black text-white">
                  لوحة المشرف — إضافة وإدارة أغاني التخرج
                </h2>
                <p className="text-xs text-[#A6F0DF]">
                  يمكنك اختيار أغنية واحدة أو عدة ملفات صوتية (MP3, M4A, WAV) من مدير ملفات هاتفك الأندرويد ورفعها دفعة واحدة.
                </p>
              </div>
            </div>

            {/* Mode Switcher: Multi-File Upload vs Direct URL */}
            <div className="flex rounded-2xl bg-[#090E17] border border-white/10 p-1 text-xs">
              <button
                type="button"
                onClick={() => setAdminAddMode('files')}
                className={`px-3.5 py-2 rounded-xl font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  adminAddMode === 'files'
                    ? 'bg-[#35D6C5] text-[#0A0D12]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>رفع ملفات من الهاتف</span>
              </button>

              <button
                type="button"
                onClick={() => setAdminAddMode('url')}
                className={`px-3.5 py-2 rounded-xl font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                  adminAddMode === 'url'
                    ? 'bg-[#35D6C5] text-[#0A0D12]'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>إضافة برابط صوتي مباشر</span>
              </button>
            </div>
          </div>

          {/* MODE 1: MULTI-FILE UPLOAD FROM ANDROID / PHONE FILE MANAGER */}
          {adminAddMode === 'files' && (
            <div className="space-y-5">
              <label className="block cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept=".mp3,.m4a,.wav,.aac,.ogg,audio/mpeg,audio/mp4,audio/x-m4a,audio/aac,audio/wav,audio/*"
                  onChange={handleSelectAudioFiles}
                  className="hidden"
                />
                <div className="rounded-3xl border-2 border-dashed border-[#35D6C5]/50 hover:border-[#35D6C5] bg-[#101B2C]/60 hover:bg-[#101B2C] p-6 sm:p-8 text-center space-y-2.5 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center mx-auto">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div className="text-sm sm:text-base font-black text-white">
                    اضغط هنا لاختيار أغنية أو عدة ملفات صوتية من الهاتف
                  </div>
                  <p className="text-xs text-slate-300">
                    يدعم صيغ MP3 و M4A و WAV • يستخرج اسم الأغنية والفنان والمدة والتصنيف المقترح تلقائياً
                  </p>
                </div>
              </label>

              {isExtractingMeta && (
                <div className="p-4 rounded-2xl bg-[#101B2C] border border-[#35D6C5]/30 flex items-center justify-center gap-2.5 text-xs font-bold text-[#35D6C5]">
                  <Clock className="w-4 h-4 animate-spin" />
                  <span>جاري قراءة البيانات الوصفية ومدة التشغيل للملفات المحددة...</span>
                </div>
              )}

              {/* Staged Files Review & Edit List before Batch Upload */}
              {stagedFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-black text-white">
                      الملفات المحددة الجاهزة للرفع ({stagedFiles.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setStagedFiles([])}
                      className="text-xs text-red-400 hover:underline font-bold cursor-pointer"
                    >
                      إلغاء جميع الملفات المحددة
                    </button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                    {stagedFiles.map((item) => (
                      <div
                        key={item.tempId}
                        className={`p-4 rounded-2xl border space-y-3 ${
                          item.error
                            ? 'bg-red-950/30 border-red-500/40'
                            : 'bg-[#101B2C]/90 border-white/15'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-mono text-slate-300 truncate" dir="ltr">
                            {item.file.name} ({formatFileSize(item.file.size)}) • {item.durationFormatted}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveStagedFile(item.tempId)}
                            className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                            title="إزالة هذا الملف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {item.error ? (
                          <p className="text-xs text-red-300 font-bold">{item.error}</p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                اسم الأغنية:
                              </label>
                              <input
                                type="text"
                                value={item.title}
                                onChange={(e) =>
                                  handleUpdateStagedField(item.tempId, {
                                    title: e.target.value,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-[#090E17] border border-white/15 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-slate-300 mb-1">
                                اسم الفنان:
                              </label>
                              <input
                                type="text"
                                value={item.artist}
                                onChange={(e) =>
                                  handleUpdateStagedField(item.tempId, {
                                    artist: e.target.value,
                                  })
                                }
                                placeholder="اسم غير معروف"
                                className="w-full px-3 py-2 rounded-xl bg-[#090E17] border border-white/15 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-bold text-[#35D6C5] mb-1 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>التصنيف المقترح:</span>
                              </label>
                              <select
                                value={item.category}
                                onChange={(e) =>
                                  handleUpdateStagedField(item.tempId, {
                                    category: e.target.value as SongCategory,
                                  })
                                }
                                className="w-full px-3 py-2 rounded-xl bg-[#090E17] border border-[#35D6C5]/40 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                              >
                                {SONG_CATEGORIES.map((cat) => (
                                  <option key={cat.id} value={cat.id}>
                                    {cat.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div className="flex flex-col justify-between gap-2">
                              <label className="flex items-center gap-2 text-xs text-white cursor-pointer pt-1">
                                <input
                                  type="checkbox"
                                  checked={item.allowDownload}
                                  onChange={(e) =>
                                    handleUpdateStagedField(item.tempId, {
                                      allowDownload: e.target.checked,
                                    })
                                  }
                                  className="w-4 h-4 accent-[#35D6C5] rounded"
                                />
                                <span>السماح بتنزيل الأغنية</span>
                              </label>

                              <label className="inline-flex items-center gap-1.5 text-[11px] text-[#5CE1E6] hover:underline cursor-pointer">
                                <ImageIcon className="w-3.5 h-3.5" />
                                <span>
                                  {item.coverUrl ? 'تم اختيار غلاف ✓' : 'إضافة صورة غلاف (اختياري)'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    handleCoverImageUpload(
                                      e.target.files?.[0],
                                      (dataUrl) =>
                                        handleUpdateStagedField(item.tempId, {
                                          coverUrl: dataUrl,
                                        })
                                    )
                                  }
                                  className="hidden"
                                />
                              </label>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {uploadProgressText && (
                    <div className="p-3.5 rounded-2xl bg-[#101B2C] border border-[#35D6C5]/40 text-xs font-bold text-[#35D6C5] flex items-center gap-2">
                      <Clock className="w-4 h-4 animate-spin shrink-0" />
                      <span>{uploadProgressText}</span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleUploadAllStaged}
                    disabled={isUploadingBatch}
                    className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] hover:opacity-95 disabled:opacity-50 text-[#0A0D12] font-black text-xs sm:text-sm shadow-xl shadow-[#35D6C5]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Upload className="w-4 h-4" />
                    <span>
                      {isUploadingBatch
                        ? 'جاري رفع وحفظ الأغاني...'
                        : `رفع وحفظ جميع الأغاني المحددة (${
                            stagedFiles.filter((f) => !f.error).length
                          })`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* MODE 2: ADD SONG VIA DIRECT AUDIO URL (100% FREE CLOUD PERSISTENCE) */}
          {adminAddMode === 'url' && (
            <form onSubmit={handleAddSongByUrlSubmit} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#101B2C]/80 border border-[#35D6C5]/30 text-xs text-[#E8EEF2]/90 leading-relaxed">
                يمكنك وضع رابط مباشر لملف صوتي (MP3 / M4A / WAV) ليتم حفظه في قاعدة بيانات{' '}
                <strong className="text-[#35D6C5]">Firestore</strong> مجاناً ويكون متاحاً للتشغيل والتنزيل لجميع الزوار على كافة الأجهزة.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-white mb-1.5">
                    رابط الملف الصوتي المباشر (MP3 / M4A / WAV) *
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      required
                      value={urlAudioLink}
                      onChange={(e) => setUrlAudioLink(e.target.value)}
                      placeholder="https://example.com/song.mp3 أو /song.mp3"
                      dir="ltr"
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs sm:text-sm text-white font-mono focus:outline-none focus:border-[#35D6C5]"
                    />
                    <button
                      type="button"
                      onClick={handleAutoSuggestFromUrl}
                      className="px-4 py-2.5 rounded-xl bg-[#142638] hover:bg-[#1C354A] border border-[#35D6C5]/40 text-xs font-bold text-[#35D6C5] flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>استخراج الاسم والتصنيف تلقائياً</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    اسم الأغنية *
                  </label>
                  <input
                    type="text"
                    required
                    value={urlTitle}
                    onChange={(e) => setUrlTitle(e.target.value)}
                    placeholder="مثال: أنشودة تخرج ملائكة الرحمة"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    اسم الفنان (اتركه فارغاً ليكتب «اسم غير معروف»)
                  </label>
                  <input
                    type="text"
                    value={urlArtist}
                    onChange={(e) => setUrlArtist(e.target.value)}
                    placeholder="اسم غير معروف"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    تصنيف الأغنية
                  </label>
                  <select
                    value={urlCategory}
                    onChange={(e) => setUrlCategory(e.target.value as SongCategory)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#35D6C5]"
                  >
                    {SONG_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    صورة الغلاف (اختياري — رابط أو رفع صورة)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={urlCover}
                      onChange={(e) => setUrlCover(e.target.value)}
                      placeholder="رابط صورة أو اختر من الهاتف"
                      dir="ltr"
                      className="flex-1 px-3 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                    />
                    <label className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#35D6C5] font-bold cursor-pointer shrink-0">
                      <span>صورة</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleCoverImageUpload(e.target.files?.[0], (dataUrl) =>
                            setUrlCover(dataUrl)
                          )
                        }
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer">
                  <input
                    type="checkbox"
                    checked={urlAllowDownload}
                    onChange={(e) => setUrlAllowDownload(e.target.checked)}
                    className="w-4 h-4 accent-[#35D6C5] rounded"
                  />
                  <span>السماح للطلاب والزوار بتنزيل هذه الأغنية</span>
                </label>

                <button
                  type="submit"
                  disabled={isAddingUrl}
                  className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isAddingUrl ? 'جاري الإضافة...' : 'إضافة الأغنية للمكتبة'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* SEARCH BAR, SMART SUGGESTIONS, CATEGORY TABS, & SORTING             */}
      {/* =================================================================== */}
      <div className="rounded-3xl glass-panel p-4 sm:p-6 border border-white/15 shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Smart & Traditional Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#35D6C5] absolute right-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ابحث باسم الأغنية، الفنان، أو اكتب مثلاً: «أغاني تخرج حماسية» أو «موسيقى هادئة للحفل»..."
              className="w-full rounded-2xl bg-[#0A0D12]/90 border border-white/15 focus:border-[#35D6C5] pr-11 pl-9 py-3 text-xs sm:text-sm font-bold text-white placeholder-slate-400 outline-none transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 shrink-0">
            <SlidersHorizontal className="w-4 h-4 text-[#D6B777] shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              aria-label="ترتيب الأغاني"
              className="rounded-2xl bg-[#0A0D12]/90 border border-white/15 focus:border-[#35D6C5] px-3.5 py-3 text-xs sm:text-sm font-bold text-white outline-none cursor-pointer"
            >
              <option value="custom">الترتيب المعتمد</option>
              <option value="alphabetical">الترتيب الأبجدي (أ - ي)</option>
              <option value="newest">الأحدث إضافة</option>
              <option value="duration">حسب مدة التشغيل</option>
            </select>
          </div>
        </div>

        {/* Quick Smart Search Chips */}
        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="text-slate-400 font-bold flex items-center gap-1 ml-1">
            <Sparkles className="w-3.5 h-3.5 text-[#35D6C5]" />
            <span>بحث ذكي سريع:</span>
          </span>
          {[
            'أغاني تخرج حماسية',
            'موسيقى هادئة للحفل',
            'أغاني الحفلات',
            'أناشيد تخرج',
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => {
                setSearchQuery(suggestion);
                setSelectedCategory('all');
              }}
              className={`px-2.5 py-1 rounded-xl border transition-all cursor-pointer ${
                searchQuery === suggestion
                  ? 'bg-[#35D6C5]/20 text-[#35D6C5] border-[#35D6C5]/40 font-black'
                  : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Smart Intent Detection Notice */}
        {detectedSmartIntent && (
          <div className="px-3.5 py-2 rounded-xl bg-[#35D6C5]/10 border border-[#35D6C5]/30 text-xs text-[#A6F0DF] flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#35D6C5] shrink-0" />
            <span className="font-bold">{detectedSmartIntent}</span>
          </div>
        )}

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] shadow-md'
                : 'bg-[#101B2C] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            الكل ({songs.length})
          </button>

          {SONG_CATEGORIES.map((cat) => {
            const count = songs.filter((s) => s.category === cat.id).length;
            const active = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 transition-all cursor-pointer ${
                  active
                    ? 'bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] shadow-md'
                    : 'bg-[#101B2C] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* =================================================================== */}
      {/* SONG LIBRARY CARDS                                                  */}
      {/* =================================================================== */}
      {isLoadingSongs ? (
        <div className="rounded-3xl glass-panel p-12 text-center space-y-3 border border-white/10">
          <Clock className="w-8 h-8 text-[#35D6C5] animate-spin mx-auto" />
          <p className="text-sm font-bold text-white">جاري تحميل مكتبة الأغاني...</p>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="rounded-3xl glass-panel p-8 sm:p-12 text-center space-y-4 border border-white/10 max-w-xl mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-[#35D6C5]/15 border border-[#35D6C5]/30 text-[#35D6C5] flex items-center justify-center mx-auto">
            <Music className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {songs.length === 0
              ? 'لا توجد أغاني مضافة في المكتبة بعد'
              : 'لا توجد أغاني مطابقة لبحثك الحالي'}
          </h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {songs.length === 0
              ? canManageLibrary
                ? 'اضغط على زر «إدارة ورفع الأغاني (للمشرف)» أعلاه لاختيار ملفات صوتية من هاتفك ورفعها دفعة واحدة.'
                : 'لم يقم مشرف الموقع بإضافة ملفات صوتية إلى المكتبة حتى الآن.'
              : 'جرّب تغيير كلمات البحث أو اختيار تصنيف آخر من القائمة.'}
          </p>
          {!canManageLibrary && songs.length === 0 && (
            <button
              type="button"
              onClick={() => navigateTo('login')}
              className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-[#35D6C5] cursor-pointer"
            >
              تسجيل دخول المشرف لإضافة الأغاني
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {filteredSongs.map((song, idx) => {
            const isCurrent = currentSong?.id === song.id;
            const activePlaying = isCurrent && isPlaying;

            return (
              <div
                key={song.id}
                className={`rounded-3xl p-4 sm:p-5 backdrop-blur-2xl border transition-all duration-300 flex flex-col justify-between gap-4 shadow-xl ${
                  isCurrent
                    ? 'bg-[#102336]/95 border-[#35D6C5] shadow-[0_0_30px_rgba(53,214,197,0.2)]'
                    : 'bg-[#0D1726]/85 border-white/12 hover:border-[#35D6C5]/40'
                }`}
              >
                <div className="flex items-start gap-3.5 sm:gap-4">
                  {/* Cover Artwork & Play Trigger */}
                  <button
                    type="button"
                    onClick={() => playSong(song)}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#142638] to-[#1C354A] border border-[#35D6C5]/35 flex items-center justify-center shrink-0 overflow-hidden group cursor-pointer shadow-lg"
                    aria-label={activePlaying ? `إيقاف ${song.title}` : `تشغيل ${song.title}`}
                  >
                    {song.coverUrl ? (
                      <img
                        src={song.coverUrl}
                        alt={song.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <Music className="w-7 h-7 text-[#35D6C5]" />
                    )}
                    <div
                      className={`absolute inset-0 bg-black/45 flex items-center justify-center transition-opacity ${
                        activePlaying ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {activePlaying ? (
                        <Pause className="w-7 h-7 text-[#35D6C5]" />
                      ) : (
                        <Play className="w-7 h-7 text-white" />
                      )}
                    </div>
                  </button>

                  {/* Song Details */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#35D6C5]/15 border border-[#35D6C5]/30 text-[10px] font-extrabold text-[#35D6C5]">
                        {getSongCategoryLabel(song.category)}
                      </span>

                      {song.storageType === 'local_indexeddb' ? (
                        <span
                          className="px-2 py-0.5 rounded-lg bg-amber-500/15 border border-amber-500/30 text-[10px] font-bold text-amber-300 flex items-center gap-1"
                          title="محفوظ في ذاكرة هذا الجهاز فقط"
                        >
                          <HardDrive className="w-3 h-3" />
                          <span>محلي على هذا الجهاز</span>
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-300 flex items-center gap-1"
                          title="محفوظ سحابياً ومتاح لجميع الزوار"
                        >
                          <Cloud className="w-3 h-3" />
                          <span>سحابي</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-white truncate">
                      {song.title}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300">
                      <span>الفنان: {song.artist || 'اسم غير معروف'}</span>
                      <span>•</span>
                      <span className="font-mono text-[#A6F0DF]">
                        المدة: {song.durationFormatted || formatSongDuration(song.durationSeconds)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row: Play, Download (if allowed), & Admin Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => playSong(song)}
                      className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
                        activePlaying
                          ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md shadow-[#35D6C5]/25'
                          : 'bg-[#35D6C5]/20 hover:bg-[#35D6C5]/30 text-[#35D6C5] border border-[#35D6C5]/40'
                      }`}
                    >
                      {activePlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>إيقاف مؤقت</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          <span>تشغيل</span>
                        </>
                      )}
                    </button>

                    {/* Show Download button ONLY if allowDownload is true and audioUrl exists */}
                    {song.allowDownload && Boolean(song.audioUrl) && (
                      <button
                        type="button"
                        onClick={() => handleDownloadSong(song)}
                        className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#E8EEF2] border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-[#35D6C5]" />
                        <span>تنزيل</span>
                      </button>
                    )}
                  </div>

                  {/* Admin Controls: Reorder, Edit, Delete */}
                  {canManageLibrary && (
                    <div className="flex items-center gap-1">
                      {sortBy === 'custom' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleMoveSongOrder(idx, 'up')}
                            disabled={idx === 0}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                            title="تحريك للأعلى"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveSongOrder(idx, 'down')}
                            disabled={idx === filteredSongs.length - 1}
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 disabled:opacity-30 cursor-pointer"
                            title="تحريك للأسفل"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => openEditSongModal(song)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-[#35D6C5]/20 text-[#35D6C5] cursor-pointer"
                        title="تعديل بيانات الأغنية أو الغلاف"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteSong(song)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                        title="حذف الأغنية"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* =================================================================== */}
      {/* SIMILAR SONGS RECOMMENDATIONS (BASED ON CURRENT SONG)               */}
      {/* =================================================================== */}
      {currentSong && similarSongs.length > 0 && (
        <div className="rounded-3xl glass-panel p-5 sm:p-6 border border-[#35D6C5]/30 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#35D6C5]" />
            <h3 className="text-sm sm:text-base font-black text-white">
              أغاني مشابهة مقترحة لـ «{currentSong.title}»
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {similarSongs.map((sim) => (
              <button
                key={sim.id}
                type="button"
                onClick={() => playSong(sim)}
                className="p-3 rounded-2xl bg-[#101B2C]/80 hover:bg-[#142638] border border-white/10 hover:border-[#35D6C5]/40 text-right flex items-center justify-between gap-2 transition-all cursor-pointer"
              >
                <div className="min-w-0">
                  <div className="text-xs font-black text-white truncate">
                    {sim.title}
                  </div>
                  <div className="text-[10px] text-[#A6F0DF] truncate">
                    {sim.artist || 'اسم غير معروف'} • {getSongCategoryLabel(sim.category)}
                  </div>
                </div>
                <Play className="w-4 h-4 text-[#35D6C5] shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EDIT SONG METADATA MODAL (ADMIN ONLY)                               */}
      {/* =================================================================== */}
      {editingSong && canManageLibrary && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#0D1726] border border-[#35D6C5]/40 p-6 space-y-4 shadow-2xl text-right animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-white">
                تعديل بيانات الأغنية
              </h3>
              <button
                type="button"
                onClick={() => setEditingSong(null)}
                className="text-slate-400 hover:text-white p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSongEdit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  اسم الأغنية:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#35D6C5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  اسم الفنان:
                </label>
                <input
                  type="text"
                  value={editArtist}
                  onChange={(e) => setEditArtist(e.target.value)}
                  placeholder="اسم غير معروف"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#35D6C5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  التصنيف:
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value as SongCategory)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090E17] border border-white/15 text-xs sm:text-sm text-white focus:outline-none focus:border-[#35D6C5]"
                >
                  {SONG_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1">
                  صورة الغلاف (رابط أو اختيار صورة من الهاتف):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editCoverUrl}
                    onChange={(e) => setEditCoverUrl(e.target.value)}
                    placeholder="اختياري"
                    dir="ltr"
                    className="flex-1 px-3 py-2 rounded-xl bg-[#090E17] border border-white/15 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                  />
                  <label className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#35D6C5] font-bold cursor-pointer shrink-0">
                    <span>رفع غلاف</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        handleCoverImageUpload(e.target.files?.[0], (dataUrl) =>
                          setEditCoverUrl(dataUrl)
                        )
                      }
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs font-bold text-white cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={editAllowDownload}
                  onChange={(e) => setEditAllowDownload(e.target.checked)}
                  className="w-4 h-4 accent-[#35D6C5] rounded"
                />
                <span>السماح بتنزيل الأغنية</span>
              </label>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingSong(null)}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-slate-300 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2.5 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs cursor-pointer"
                >
                  {isSavingEdit ? 'جاري الحفظ...' : 'حفظ التعديلات'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
