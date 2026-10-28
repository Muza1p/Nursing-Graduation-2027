import React, { useState, useRef } from 'react';
import { sendAppNotification } from '../services/notificationService';
import {
  Music,
  Upload,
  Plus,
  Trash2,
  Play,
  Pause,
  Download,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Search,
  ExternalLink,
  Edit2,
  Save,
  X,
  FileAudio,
  ShieldCheck,
  Smartphone,
  HardDrive,
  Cloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useMusic } from '../context/MusicContext';
import { GraduationSong, SongCategory } from '../types';
import {
  extractAudioMetadataFromFile,
  validateAudioFile,
  uploadGraduationSongFile,
  addGraduationSongByUrl,
  updateGraduationSongMetadata,
  deleteGraduationSong,
  downloadGraduationSong,
  formatSongDuration,
  getSongCategoryLabel,
  SONG_CATEGORIES,
  seedOfficialGraduationSongIfEmpty,
} from '../services/musicLibrary';
import { useApp } from '../context/AppContext';

interface StagedFileItem {
  id: string;
  file: File;
  title: string;
  artist: string;
  category: SongCategory;
  durationSeconds: number;
  durationFormatted: string;
  allowDownload: boolean;
  status: 'idle' | 'uploading' | 'success' | 'error';
  progress: number;
  statusMessage?: string;
  error?: string;
}

export const AdminMusicManagementSection: React.FC = () => {
  const { songs, refreshSongs, playSong, currentSong, isPlaying, togglePlayPause } = useMusic();
  const { firebaseUser, currentUser, isAdmin, isModerator } = useApp();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Staged files for batch upload
  const [stagedFiles, setStagedFiles] = useState<StagedFileItem[]>([]);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [isSeedingDefault, setIsSeedingDefault] = useState(false);

  // Direct URL Add Form State
  const [showUrlForm, setShowUrlForm] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [urlTitleInput, setUrlTitleInput] = useState('');
  const [urlArtistInput, setUrlArtistInput] = useState('');
  const [urlCategory, setUrlCategory] = useState<SongCategory>('graduation');
  const [urlAllowDownload, setUrlAllowDownload] = useState(true);
  const [isSubmittingUrl, setIsSubmittingUrl] = useState(false);

  // Feedback notifications
  const [actionFeedback, setActionFeedback] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Search & Filter in Admin Song List
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<SongCategory | 'all'>('all');

  // Inline Song Edit State
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editCategory, setEditCategory] = useState<SongCategory>('graduation');
  const [editAllowDownload, setEditAllowDownload] = useState(true);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // In-app Delete Confirmation State
  const [songToDelete, setSongToDelete] = useState<GraduationSong | null>(null);
  const [isDeletingSong, setIsDeletingSong] = useState(false);

  // Multi-file selection from phone file manager / desktop
  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsParsingFiles(true);
    setActionFeedback(null);

    const newStaged: StagedFileItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const validation = validateAudioFile(file);

      if (!validation.valid) {
        errors.push(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const meta = await extractAudioMetadataFromFile(file);
        newStaged.push({
          id: `stage-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
          file,
          title: meta.title,
          artist: meta.artist === 'اسم غير معروف' ? '' : meta.artist,
          category: meta.suggestedCategory,
          durationSeconds: meta.durationSeconds,
          durationFormatted: meta.durationFormatted,
          allowDownload: true,
          status: 'idle',
          progress: 0,
        });
      } catch (err) {
        errors.push(`فشل قراءة الملف ${file.name}`);
      }
    }

    setIsParsingFiles(false);

    if (newStaged.length > 0) {
      setStagedFiles((prev) => [...prev, ...newStaged]);
      setActionFeedback({
        type: 'info',
        text: `تم اختيار ${newStaged.length} ملف صوتي بنجاح. يمكنك مراجعة وتعديل العناوين ثم الضغط على (بدء الرفع والحفظ).`,
      });
    }

    if (errors.length > 0) {
      setActionFeedback({
        type: 'error',
        text: `بعض الملفات لم تُقبل: ${errors.join(' | ')}`,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove single staged file before upload
  const handleRemoveStaged = (id: string) => {
    setStagedFiles((prev) => prev.filter((item) => item.id !== id));
  };

  // Update staged item metadata
  const handleUpdateStagedField = (
    id: string,
    field: 'title' | 'artist' | 'category' | 'allowDownload',
    value: any
  ) => {
    setStagedFiles((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Batch upload all staged files
  const handleStartBatchUpload = async () => {
    if (stagedFiles.length === 0 || isBatchUploading) return;

    setIsBatchUploading(true);
    setActionFeedback(null);
    let successCount = 0;
    let failCount = 0;
    const errorsList: string[] = [];

    const total = stagedFiles.length;

    for (let i = 0; i < stagedFiles.length; i++) {
      const item = stagedFiles[i];
      if (item.status === 'success') continue;

      setStagedFiles((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, status: 'uploading', progress: 5, statusMessage: 'جارِ بدء المعالجة...' } : s))
      );

      try {
        const uploadRes = await uploadGraduationSongFile({
          file: item.file,
          title: item.title.trim() || item.file.name.replace(/\.[^/.]+$/, ''),
          artist: item.artist.trim() || 'اسم غير معروف',
          category: item.category,
          durationSeconds: item.durationSeconds,
          allowDownload: item.allowDownload,
          sortOrder: songs.length + i,
          uploaderEmail: firebaseUser?.email || currentUser?.email,
          uploaderName: currentUser?.fullName || firebaseUser?.displayName || 'مشرف التخرج',
          onProgress: (step, pct) => {
            setStagedFiles((prev) =>
              prev.map((s) =>
                s.id === item.id ? { ...s, progress: pct, statusMessage: step } : s
              )
            );
          },
        });

        if (uploadRes.success) {
          setStagedFiles((prev) =>
            prev.map((s) => (s.id === item.id ? { ...s, status: 'success', progress: 100, statusMessage: 'تم النشر بنجاح' } : s))
          );
          successCount++;
          await sendAppNotification({
            title: `أغنية تخرج جديدة: ${item.title.trim() || item.file.name}`,
            message: `تمت إضافة أغنية جديدة «${item.title.trim() || item.file.name}» إلى مكتبة أغاني التخرج. استمع إليها الآن!`,
            type: 'song',
            targetAudience: 'all',
            linkRoute: 'music',
          });
        } else {
          failCount++;
          errorsList.push(`${item.title}: ${uploadRes.notice}`);
          setStagedFiles((prev) =>
            prev.map((s) =>
              s.id === item.id ? { ...s, status: 'error', error: uploadRes.notice, statusMessage: 'فشل النشر' } : s
            )
          );
        }
      } catch (err: any) {
        failCount++;
        const errMsg = err?.message || 'تعذر حفظ ملف الصوت';
        errorsList.push(`${item.title}: ${errMsg}`);
        setStagedFiles((prev) =>
          prev.map((s) =>
            s.id === item.id
              ? {
                  ...s,
                  status: 'error',
                  error: errMsg,
                  statusMessage: 'فشل الرفع',
                }
              : s
          )
        );
      }

      setOverallProgress(Math.round(((i + 1) / total) * 100));
    }

    setIsBatchUploading(false);
    await refreshSongs();

    if (failCount === 0 && successCount > 0) {
      setActionFeedback({
        type: 'success',
        text: `تم نشر وحفظ كافة الأغاني بنجاح (${successCount} أغانٍ) في قاعدة البيانات السحابية! وهي متاحة للطلاب الآن.`,
      });
      setTimeout(() => {
        setStagedFiles((prev) => prev.filter((s) => s.status !== 'success'));
        setOverallProgress(0);
      }, 3500);
    } else {
      setActionFeedback({
        type: 'error',
        text: `تم نشر ${successCount} أغانٍ بنجاح، وفشل ${failCount} ملف: ${errorsList.join(' | ')}`,
      });
    }
  };

  // Seed default official graduation song if database is currently empty
  const handleSeedDefaultSong = async () => {
    setIsSeedingDefault(true);
    setActionFeedback(null);
    try {
      const seeded = await seedOfficialGraduationSongIfEmpty();
      if (seeded) {
        setActionFeedback({
          type: 'success',
          text: 'تم نشر الأغنية الرسمية الافتراضية لحفل التخرج 2027 بنجاح في قاعدة بيانات Firestore!',
        });
        await refreshSongs();
      } else {
        setActionFeedback({
          type: 'info',
          text: 'توجد أغاني منشورة بالفعل في قاعدة البيانات السحابية.',
        });
      }
    } catch (e: any) {
      setActionFeedback({
        type: 'error',
        text: `تعذر نشر الأغنية الافتراضية: ${e?.message || e}`,
      });
    } finally {
      setIsSeedingDefault(false);
    }
  };

  // Add song via direct audio URL
  const handleAddSongByUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) {
      setActionFeedback({ type: 'error', text: 'يرجى إدخال رابط الأغنية المباشر.' });
      return;
    }
    if (!urlTitleInput.trim()) {
      setActionFeedback({ type: 'error', text: 'يرجى إدخال عنوان الأغنية.' });
      return;
    }

    setIsSubmittingUrl(true);
    setActionFeedback(null);

    const res = await addGraduationSongByUrl({
      audioUrl: urlInput.trim(),
      title: urlTitleInput.trim(),
      artist: urlArtistInput.trim() || 'اسم غير معروف',
      category: urlCategory,
      allowDownload: urlAllowDownload,
      sortOrder: songs.length,
    });

    setIsSubmittingUrl(false);

    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: `تمت إضافة الأغنية "${urlTitleInput.trim()}" بنجاح إلى المكتبة!`,
      });
      setUrlInput('');
      setUrlTitleInput('');
      setUrlArtistInput('');
      setShowUrlForm(false);
      await refreshSongs();
    } else {
      setActionFeedback({ type: 'error', text: res.notice });
    }
  };

  // Delete song with in-app confirmation modal
  const handleDeleteSong = (song: GraduationSong) => {
    setSongToDelete(song);
  };

  const handleConfirmDeleteSong = async () => {
    if (!songToDelete) return;
    setIsDeletingSong(true);
    const res = await deleteGraduationSong(songToDelete);
    setIsDeletingSong(false);

    if (res.success) {
      setActionFeedback({
        type: 'success',
        text: `تم حذف الأغنية "${songToDelete.title}" بنجاح من المكتبة.`,
      });
      setSongToDelete(null);
      await refreshSongs();
    } else {
      setActionFeedback({ type: 'error', text: res.notice });
    }
  };

  // Start editing song metadata
  const handleStartEdit = (song: GraduationSong) => {
    setEditingSongId(song.id);
    setEditTitle(song.title);
    setEditArtist(song.artist);
    setEditCategory(song.category);
    setEditAllowDownload(song.allowDownload ?? true);
  };

  // Save edited song metadata
  const handleSaveEdit = async (songId: string) => {
    if (!editTitle.trim()) {
      setActionFeedback({ type: 'error', text: 'عنوان الأغنية لا يمكن أن يكون فارغاً.' });
      return;
    }

    setIsSavingEdit(true);
    const res = await updateGraduationSongMetadata(songId, {
      title: editTitle.trim(),
      artist: editArtist.trim() || 'اسم غير معروف',
      category: editCategory,
      allowDownload: editAllowDownload,
    });
    setIsSavingEdit(false);

    if (res.success) {
      setEditingSongId(null);
      setActionFeedback({ type: 'success', text: 'تم تحديث بيانات الأغنية بنجاح.' });
      await refreshSongs();
    } else {
      setActionFeedback({ type: 'error', text: res.notice });
    }
  };

  // Reorder songs up or down
  const handleReorder = async (songIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? songIndex - 1 : songIndex + 1;
    if (targetIndex < 0 || targetIndex >= songs.length) return;

    const currentSongItem = songs[songIndex];
    const targetSongItem = songs[targetIndex];

    await updateGraduationSongMetadata(currentSongItem.id, { sortOrder: targetIndex });
    await updateGraduationSongMetadata(targetSongItem.id, { sortOrder: songIndex });
    await refreshSongs();
  };

  // Filter existing songs
  const filteredExistingSongs = songs.filter((s) => {
    const matchCat = selectedFilterCategory === 'all' || s.category === selectedFilterCategory;
    const matchSearch =
      !searchQuery.trim() ||
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 text-right">
      {/* Header & Overview Card */}
      <div className="rounded-3xl bg-[#0E1826] border border-[#35D6C5]/35 p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#35D6C5]/15 border border-[#35D6C5]/35 text-[#35D6C5] text-xs font-bold">
              <Music className="w-3.5 h-3.5" />
              <span>إدارة مكتبة أغاني التخرج الذكية</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              رفع وإدارة موسيقى تخرج معهد التمريض (دفعة 2027)
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              يمكنك هنا رفع عدة ملفات صوتية دفعة واحدة من هاتفك (Android / iPhone / iPad) أو حاسوبك، مع استخراج اسم الأغنية والفنان والمدة وتعديلها، أو إضافة روابط صوتية سحابية مباشرة.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refreshSongs()}
            className="px-3.5 py-2 rounded-xl bg-[#142638] hover:bg-[#1C354A] border border-white/15 text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#35D6C5]" />
            <span>تحديث القائمة</span>
          </button>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div
            className={`mt-4 p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between gap-2 shadow-lg animate-in fade-in duration-200 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-200'
                : actionFeedback.type === 'error'
                ? 'bg-red-500/15 border-red-400/40 text-red-200'
                : 'bg-cyan-500/15 border-cyan-400/40 text-cyan-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              )}
              <span>{actionFeedback.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setActionFeedback(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Primary Action Buttons: Multi-file Phone Upload & Direct URL Adder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5">
          {/* Multi-File Upload Input (Hidden, triggered via button) */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.m4a,.wav,.aac,.ogg"
            onChange={handleFilesSelected}
            className="hidden"
            id="admin-multi-audio-picker"
          />

          <button
            type="button"
            disabled={isParsingFiles || isBatchUploading}
            onClick={() => fileInputRef.current?.click()}
            className="py-4 px-5 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] hover:opacity-95 text-[#0A0D12] font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 shadow-lg shadow-[#35D6C5]/20 transition-all active:scale-98 cursor-pointer disabled:opacity-60"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>
              {isParsingFiles
                ? 'جارِ قراءة وفحص ملفات الهاتف...'
                : 'اختيار عدة ملفات صوتية من الهاتف / الحاسوب'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowUrlForm((prev) => !prev)}
            className="py-4 px-5 rounded-2xl bg-[#142638] hover:bg-[#1C354A] border border-white/15 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <ExternalLink className="w-4 h-4 text-[#35D6C5]" />
            <span>إضافة أغنية عبر رابط سحابي مباشر (URL)</span>
          </button>
        </div>
      </div>

      {/* Direct URL Form Modal / Drawer */}
      {showUrlForm && (
        <form
          onSubmit={handleAddSongByUrl}
          className="rounded-3xl bg-[#090E17] border border-[#35D6C5]/40 p-5 space-y-4 shadow-xl animate-in fade-in duration-200"
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-[#35D6C5]" />
              <span>إضافة أغنية عبر رابط صوتي مباشر</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowUrlForm(false)}
              className="text-slate-400 hover:text-white p-1 text-xs"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                رابط ملف الصوت المباشر (MP3 / M4A / WAV):
              </label>
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com/audio/grad_song.mp3"
                dir="ltr"
                required
                className="w-full bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم الأغنية:
              </label>
              <input
                type="text"
                value={urlTitleInput}
                onChange={(e) => setUrlTitleInput(e.target.value)}
                placeholder="مثال: يا طير طاير مسيرة التخرج"
                required
                className="w-full bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                اسم الفنان (اختياري):
              </label>
              <input
                type="text"
                value={urlArtistInput}
                onChange={(e) => setUrlArtistInput(e.target.value)}
                placeholder="اسم الفنان إن توفر"
                className="w-full bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                تصنيف الأغنية:
              </label>
              <select
                value={urlCategory}
                onChange={(e) => setUrlCategory(e.target.value as SongCategory)}
                className="w-full bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
              >
                {SONG_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label} ({c.description})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-white/10">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={urlAllowDownload}
                onChange={(e) => setUrlAllowDownload(e.target.checked)}
                className="w-4 h-4 rounded accent-[#35D6C5]"
              />
              <span>السماح بتنزيل هذه الأغنية للطلاب</span>
            </label>

            <button
              type="submit"
              disabled={isSubmittingUrl}
              className="py-2.5 px-6 rounded-xl bg-[#35D6C5] hover:opacity-95 text-[#0A0D12] font-black text-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmittingUrl ? 'جارِ التحقق والإضافة...' : 'حفظ وإضافة الأغنية'}
            </button>
          </div>
        </form>
      )}

      {/* Staging Queue: Display selected phone files before upload */}
      {stagedFiles.length > 0 && (
        <div className="rounded-3xl bg-[#090E17] border border-[#D7B875]/40 p-5 space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-black text-white">
                <FileAudio className="w-4 h-4 text-[#D7B875]" />
                <span>الملفات الصوتية المختارة بانتظار الرفع ({stagedFiles.length} ملف)</span>
              </div>
              <p className="text-[11px] text-slate-300">
                راجع أسماء الأغاني وتصنيفاتها، وعدّلها يدوياً إن أردت، ثم اضغط على (بدء الرفع والحفظ).
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                disabled={isBatchUploading}
                onClick={() => setStagedFiles([])}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-red-300 text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء الكل
              </button>
              <button
                type="button"
                disabled={isBatchUploading}
                onClick={handleStartBatchUpload}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#D7B875] to-[#bf9e5a] hover:opacity-95 text-[#0A0D12] font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-60 flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                <span>
                  {isBatchUploading
                    ? `جارِ الرفع (${overallProgress}%)...`
                    : 'بدء رفع وحفظ كافة الملفات'}
                </span>
              </button>
            </div>
          </div>

          {/* Overall Progress Bar during batch upload */}
          {isBatchUploading && (
            <div className="space-y-1.5 p-3 rounded-2xl bg-[#142638] border border-white/10">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>تقدم الرفع الكلي:</span>
                <span className="font-mono text-[#35D6C5]">{overallProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] transition-all duration-300"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Staged Items List */}
          <div className="divide-y divide-white/10 space-y-3">
            {stagedFiles.map((item, idx) => (
              <div
                key={item.id}
                className="pt-3 first:pt-0 grid grid-cols-1 md:grid-cols-12 gap-3 items-center"
              >
                <div className="md:col-span-1 text-center font-mono text-xs font-bold text-[#D7B875]">
                  #{idx + 1}
                </div>

                <div className="md:col-span-4">
                  <label className="block text-[10px] text-slate-400 mb-0.5">اسم الأغنية:</label>
                  <input
                    type="text"
                    value={item.title}
                    disabled={isBatchUploading}
                    onChange={(e) => handleUpdateStagedField(item.id, 'title', e.target.value)}
                    className="w-full bg-[#101827] border border-white/15 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="block text-[10px] text-slate-400 mb-0.5">الفنان:</label>
                  <input
                    type="text"
                    value={item.artist}
                    disabled={isBatchUploading}
                    placeholder="اسم غير معروف"
                    onChange={(e) => handleUpdateStagedField(item.id, 'artist', e.target.value)}
                    className="w-full bg-[#101827] border border-white/15 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] text-slate-400 mb-0.5">التصنيف:</label>
                  <select
                    value={item.category}
                    disabled={isBatchUploading}
                    onChange={(e) =>
                      handleUpdateStagedField(item.id, 'category', e.target.value as SongCategory)
                    }
                    className="w-full bg-[#101827] border border-white/15 rounded-xl py-2 px-2 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
                  >
                    {SONG_CATEGORIES.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-center justify-between sm:justify-end gap-2">
                  <div className="text-right">
                    <span className="block text-[10px] text-slate-400">المدة:</span>
                    <span className="text-xs font-mono font-bold text-white">
                      {item.durationFormatted}
                    </span>
                  </div>

                  {item.status === 'uploading' ? (
                    <div className="text-right">
                      <span className="text-[11px] font-mono text-[#35D6C5] font-bold block">
                        {item.progress}%
                      </span>
                      <span className="text-[9px] text-[#35D6C5]/80 block">
                        {item.statusMessage || 'جارِ الرفع...'}
                      </span>
                    </div>
                  ) : item.status === 'success' ? (
                    <span className="text-emerald-400 text-xs font-bold">✓ تم النشر</span>
                  ) : item.status === 'error' ? (
                    <span className="text-red-400 text-xs font-bold">فشل النشر</span>
                  ) : (
                    <button
                      type="button"
                      disabled={isBatchUploading}
                      onClick={() => handleRemoveStaged(item.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                      title="إزالة من القائمة"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {item.status === 'error' && item.error && (
                  <div className="col-span-full md:col-span-12 p-2.5 rounded-xl bg-red-950/50 border border-red-500/40 text-[11px] text-red-300 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span className="leading-relaxed">{item.error}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Existing Music Library Table */}
      <div className="rounded-3xl bg-[#0E1826] border border-white/10 p-5 sm:p-7 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <Music className="w-5 h-5 text-[#35D6C5]" />
              <span>أغاني تخرج معهد التمريض المسجلة حالياً ({songs.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              تظهر هذه الأغاني تلقائياً في الخانة الزجاجية فوق شريط التنقل السفلي لجميع الطلاب والزوار.
            </p>
          </div>

          {/* Search & Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث في الأغاني..."
                className="w-full bg-[#101827] border border-white/15 rounded-xl py-2 pl-3 pr-8 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#35D6C5]"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            <select
              value={selectedFilterCategory}
              onChange={(e) => setSelectedFilterCategory(e.target.value as any)}
              className="bg-[#101827] border border-white/15 rounded-xl py-2 px-2.5 text-xs text-white focus:outline-none focus:border-[#35D6C5]"
            >
              <option value="all">كافة التصنيفات</option>
              {SONG_CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Songs List */}
        {filteredExistingSongs.length === 0 ? (
          <div className="py-12 text-center space-y-4">
            <Music className="w-12 h-12 text-[#35D6C5]/40 mx-auto" />
            <h4 className="text-sm font-bold text-white">لا توجد أغانٍ مسجلة حالياً في قاعدة البيانات السحابية</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              اضغط على زر (اختيار عدة ملفات صوتية من الهاتف) بالأعلى لرفع باقة أغاني التخرج دفعة واحدة، أو انقر الزر أدناه لنشر النشيد الرسمي الافتراضي فوراً لتجريبه:
            </p>
            <div>
              <button
                type="button"
                disabled={isSeedingDefault}
                onClick={handleSeedDefaultSong}
                className="py-2.5 px-5 rounded-2xl bg-[#35D6C5] hover:opacity-95 text-[#0A0D12] font-black text-xs inline-flex items-center gap-2 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                <Plus className="w-4 h-4" />
                <span>{isSeedingDefault ? 'جارِ النشر في السحابة...' : 'نشر النشيد الرسمي الافتراضي لحفل التخرج 2027'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5 space-y-2">
            {filteredExistingSongs.map((song, idx) => {
              const isEditing = editingSongId === song.id;
              const isCurrent = currentSong?.id === song.id;

              return (
                <div
                  key={song.id}
                  className="pt-2.5 first:pt-0 p-3 rounded-2xl bg-[#090E17]/60 hover:bg-[#090E17] border border-white/5 transition-all space-y-2"
                >
                  {isEditing ? (
                    /* Inline Edit Mode */
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] text-slate-400 mb-0.5">اسم الأغنية:</label>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="w-full bg-[#101827] border border-[#35D6C5] rounded-xl py-2 px-3 text-xs text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 mb-0.5">الفنان:</label>
                        <input
                          type="text"
                          value={editArtist}
                          onChange={(e) => setEditArtist(e.target.value)}
                          className="w-full bg-[#101827] border border-white/15 rounded-xl py-2 px-3 text-xs text-white"
                        />
                      </div>

                      <div className="sm:col-span-3">
                        <label className="block text-[10px] text-slate-400 mb-0.5">التصنيف:</label>
                        <select
                          value={editCategory}
                          onChange={(e) => setEditCategory(e.target.value as SongCategory)}
                          className="w-full bg-[#101827] border border-white/15 rounded-xl py-2 px-2 text-xs text-white"
                        >
                          {SONG_CATEGORIES.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2 flex items-center justify-end gap-2 pt-2 sm:pt-4">
                        <button
                          type="button"
                          disabled={isSavingEdit}
                          onClick={() => handleSaveEdit(song.id)}
                          className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 text-xs font-bold"
                          title="حفظ التعديلات"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingSongId(null)}
                          className="p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs"
                          title="إلغاء"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Mode */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      {/* Left: Play trigger + Title & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrent) {
                              togglePlayPause();
                            } else {
                              playSong(song);
                            }
                          }}
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-transform active:scale-95 cursor-pointer ${
                            isCurrent && isPlaying
                              ? 'bg-[#35D6C5] text-[#0A0D12]'
                              : 'bg-[#142638] text-[#35D6C5] hover:bg-[#35D6C5]/20 border border-white/10'
                          }`}
                          title={isCurrent && isPlaying ? 'إيقاف مؤقت' : 'تشغيل تجريبي'}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4" />
                          ) : (
                            <Play className="w-4 h-4 ml-0.5" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs sm:text-sm text-white truncate">
                              {song.title}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-[#35D6C5]/10 text-[#35D6C5] text-[10px] font-bold border border-[#35D6C5]/20 shrink-0">
                              {getSongCategoryLabel(song.category)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10.5px] text-slate-400 mt-0.5 truncate">
                            <span>الفنان: {song.artist || 'اسم غير معروف'}</span>
                            <span>•</span>
                            <span className="font-mono">{song.durationFormatted || formatSongDuration(song.durationSeconds)}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {song.storageType === 'firebase_storage' || song.storageType === 'external_url' ? (
                                <span className="text-emerald-400 flex items-center gap-0.5">
                                  <Cloud className="w-3 h-3" /> سحابي
                                </span>
                              ) : (
                                <span className="text-amber-400 flex items-center gap-0.5">
                                  <HardDrive className="w-3 h-3" /> محلي بالجهاز
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center justify-end gap-1.5 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-white/5">
                        {/* Download Test */}
                        {song.allowDownload && (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await downloadGraduationSong(song);
                              setActionFeedback({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                            }}
                            className="p-2 rounded-xl text-slate-300 hover:text-[#35D6C5] hover:bg-white/5 transition-colors cursor-pointer"
                            title="اختبار تنزيل الأغنية"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {/* Reorder Up / Down */}
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleReorder(idx, 'up')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                          title="رفع للأعلى"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          disabled={idx === songs.length - 1}
                          onClick={() => handleReorder(idx, 'down')}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-white disabled:opacity-20 transition-colors cursor-pointer"
                          title="إنزال للأسفل"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit metadata */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(song)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-[#35D6C5] transition-colors cursor-pointer"
                          title="تعديل بيانات الأغنية"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete song */}
                        <button
                          type="button"
                          onClick={() => handleDeleteSong(song)}
                          className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                          title="حذف الأغنية"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* In-app Song Deletion Confirmation Modal */}
      {songToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="max-w-md w-full rounded-3xl bg-[#101827] border border-red-500/40 p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">تأكيد حذف الأغنية</h3>
                <p className="text-xs text-slate-400">«{songToDelete.title}»</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed bg-[#090E17] p-3.5 rounded-2xl border border-white/10">
              هل أنت متأكد من حذف هذه الأغنية نهائياً من مكتبة التخرج السحابية؟ لا يمكن التراجع عن هذه العملية بعد التأكيد.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                disabled={isDeletingSong}
                onClick={handleConfirmDeleteSong}
                className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg shadow-red-500/20 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeletingSong ? 'جاري الحذف...' : 'نعم، حذف نهائي'}
              </button>

              <button
                type="button"
                disabled={isDeletingSong}
                onClick={() => setSongToDelete(null)}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
