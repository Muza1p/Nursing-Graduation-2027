import React, { useState, useMemo } from 'react';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  Music,
  AlertCircle,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Shuffle,
  ListMusic,
  X,
  Download,
  ChevronUp,
  ChevronDown,
  Search,
  Sparkles,
  Edit2,
  Trash2,
  Check,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicContext';
import { GraduationSong, SongCategory } from '../types';
import {
  formatSongDuration,
  getSongCategoryLabel,
  downloadGraduationSong,
  updateGraduationSongMetadata,
  deleteGraduationSong,
  SONG_CATEGORIES,
} from '../services/musicLibrary';

export const AudioPlayerBar: React.FC = () => {
  const { isAdmin, isModerator, navigateTo } = useApp();
  const {
    songs,
    currentSong,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
    isPlaylistOpen,
    playbackError,
    playSong,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    setVolume,
    toggleMute,
    cycleRepeatMode,
    toggleShuffle,
    setIsPlaylistOpen,
    clearPlaybackError,
    refreshSongs,
  } = useMusic();

  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);
  const [playlistSearch, setPlaylistSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<SongCategory | 'all'>('all');

  // Moderator Quick Actions state
  const [editingSongId, setEditingSongId] = useState<string | null>(null);
  const [editSongTitle, setEditSongTitle] = useState('');
  const [isSavingSongTitle, setIsSavingSongTitle] = useState(false);
  const [songToDelete, setSongToDelete] = useState<GraduationSong | null>(null);
  const [isDeletingSong, setIsDeletingSong] = useState(false);
  const [modFeedback, setModFeedback] = useState<string | null>(null);

  const handleDownloadCurrent = async () => {
    if (!currentSong) return;
    setDownloadFeedback(null);
    const res = await downloadGraduationSong(currentSong);
    setDownloadFeedback(res.message);
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const handleStartQuickEdit = (song: GraduationSong, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSongId(song.id);
    setEditSongTitle(song.title);
  };

  const handleSaveQuickEdit = async (songId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!editSongTitle.trim()) return;
    setIsSavingSongTitle(true);
    const res = await updateGraduationSongMetadata(songId, { title: editSongTitle.trim() });
    setIsSavingSongTitle(false);
    if (res.success) {
      setEditingSongId(null);
      await refreshSongs();
      setModFeedback('تم تعديل اسم الأغنية بنجاح.');
      setTimeout(() => setModFeedback(null), 3000);
    }
  };

  const handleConfirmQuickDelete = async () => {
    if (!songToDelete) return;
    setIsDeletingSong(true);
    const res = await deleteGraduationSong(songToDelete);
    setIsDeletingSong(false);
    if (res.success) {
      setSongToDelete(null);
      await refreshSongs();
      setModFeedback('تم حذف الأغنية من المكتبة بنجاح.');
      setTimeout(() => setModFeedback(null), 3000);
    }
  };

  const effectiveDuration =
    duration > 0 ? duration : currentSong?.durationSeconds || 0;

  // Filter songs for the expandable drawer
  const filteredPlaylist = useMemo(() => {
    return songs.filter((s) => {
      const matchCat = selectedCategory === 'all' || s.category === selectedCategory;
      const matchSearch =
        !playlistSearch.trim() ||
        s.title.toLowerCase().includes(playlistSearch.toLowerCase()) ||
        s.artist.toLowerCase().includes(playlistSearch.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [songs, selectedCategory, playlistSearch]);

  return (
    <div className="fixed bottom-[4.2rem] sm:bottom-[4.8rem] inset-x-2.5 sm:inset-x-6 z-40 no-print pointer-events-none select-none">
      <div className="max-w-3xl mx-auto pointer-events-auto space-y-2">
        {/* Error / Toast Feedback Banner */}
        {(playbackError || downloadFeedback) && (
          <div className="px-4 py-2.5 rounded-2xl bg-[#0A0D12]/95 border border-amber-400/40 text-xs text-amber-200 flex items-center justify-between gap-2 shadow-2xl backdrop-blur-xl animate-in fade-in duration-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{playbackError || downloadFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                clearPlaybackError();
                setDownloadFeedback(null);
              }}
              className="text-slate-400 hover:text-white p-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Expandable Mini-Playlist Drawer (Opens smoothly right above the bar) */}
        {isPlaylistOpen && (
          <div className="rounded-3xl bg-[#0B1320]/95 backdrop-blur-2xl border border-[#35D6C5]/40 shadow-[0_16px_50px_rgba(0,0,0,0.92)] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200 text-right">
            {/* Drawer Header */}
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#101B2C]/90">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-[#35D6C5]" />
                <span className="text-xs sm:text-sm font-black text-white">
                  مكتبة أغاني التخرج ({songs.length})
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#35D6C5]/15 text-[#35D6C5] text-[10px] font-bold border border-[#35D6C5]/30">
                  دفعة 2027
                </span>
              </div>
              <div className="flex items-center gap-2">
                {(isAdmin || isModerator) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaylistOpen(false);
                      navigateTo('admin_dashboard');
                    }}
                    className="px-2.5 py-1 rounded-xl bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] border border-[#35D6C5]/30 text-[10.5px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>إدارة ورفع الأغاني</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPlaylistOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1 text-xs"
                  aria-label="إغلاق قائمة التشغيل"
                >
                  <span>إغلاق</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Moderator Action Feedback Banner */}
            {modFeedback && (
              <div className="px-4 py-2 bg-emerald-500/20 border-b border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modFeedback}</span>
              </div>
            )}

            {/* Search and Category Filter Toolbar */}
            <div className="p-3 border-b border-white/10 space-y-2 bg-[#090E17]/60">
              <div className="relative">
                <input
                  type="text"
                  value={playlistSearch}
                  onChange={(e) => setPlaylistSearch(e.target.value)}
                  placeholder="ابحث عن اسم أغنية أو فنان..."
                  className="w-full bg-[#101827] border border-white/15 rounded-xl py-2 pl-3 pr-9 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-[#35D6C5]"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                {playlistSearch && (
                  <button
                    type="button"
                    onClick={() => setPlaylistSearch('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0 transition-all cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-[#35D6C5] text-[#0A0D12] font-black'
                      : 'bg-white/5 text-slate-300 hover:text-white'
                  }`}
                >
                  الكل ({songs.length})
                </button>
                {SONG_CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10.5px] font-bold shrink-0 transition-all cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#35D6C5] text-[#0A0D12] font-black'
                        : 'bg-white/5 text-slate-300 hover:text-white'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Song List Body */}
            {filteredPlaylist.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <Music className="w-8 h-8 text-[#35D6C5]/50 mx-auto" />
                <p className="text-xs font-bold text-white">
                  {songs.length === 0
                    ? 'لم تتم إضافة أغانٍ في المكتبة بعد'
                    : 'لا توجد أغانٍ مطابقة للبحث'}
                </p>
                <p className="text-[11px] text-slate-400">
                  {songs.length === 0
                    ? 'يمكن للمشرف رفع ملفات الأغاني دفعة واحدة من لوحة الإدارة.'
                    : 'جرب البحث باسم آخر أو اختيار تصنيف مختلف.'}
                </p>
              </div>
            ) : (
              <div className="max-h-64 sm:max-h-72 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                {filteredPlaylist.map((song) => {
                  const isCurrent = currentSong?.id === song.id;
                  const isEditingThis = editingSongId === song.id;

                  return (
                    <div
                      key={song.id}
                      className={`w-full p-2.5 rounded-2xl flex items-center justify-between gap-3 transition-all ${
                        isCurrent
                          ? 'bg-[#35D6C5]/20 border border-[#35D6C5]/40 text-white'
                          : 'hover:bg-white/5 text-slate-200 border border-transparent'
                      }`}
                    >
                      {/* Left Side: Play button, artwork, title & artist */}
                      <div
                        onClick={() => {
                          if (!isEditingThis) playSong(song);
                        }}
                        className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                      >
                        <div className="w-9 h-9 rounded-xl bg-[#142638] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden relative">
                          {song.coverUrl ? (
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music className="w-4 h-4 text-[#35D6C5]" />
                          )}
                          {isCurrent && isPlaying && (
                            <div className="absolute inset-0 bg-[#35D6C5]/40 flex items-center justify-center">
                              <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                            </div>
                          )}
                        </div>

                        {isEditingThis ? (
                          <div
                            className="min-w-0 flex-1 flex items-center gap-1.5"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="text"
                              value={editSongTitle}
                              onChange={(e) => setEditSongTitle(e.target.value)}
                              className="bg-[#101827] border border-[#35D6C5] rounded-lg py-1 px-2 text-xs text-white focus:outline-none flex-1"
                              autoFocus
                            />
                            <button
                              type="button"
                              disabled={isSavingSongTitle}
                              onClick={(e) => handleSaveQuickEdit(song.id, e)}
                              className="p-1 rounded bg-[#35D6C5] text-[#0A0D12] hover:opacity-90 cursor-pointer"
                              title="حفظ الاسم"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSongId(null);
                              }}
                              className="p-1 rounded bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                              title="إلغاء"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-black text-white truncate flex items-center gap-1.5">
                              <span className="truncate">{song.title}</span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.2 rounded bg-[#35D6C5] text-[#0A0D12] text-[9px] font-black shrink-0">
                                  تشغيل
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                              <span>{song.artist || 'اسم غير معروف'}</span>
                              <span>•</span>
                              <span className="text-[#5CE1E6]">
                                {getSongCategoryLabel(song.category)}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Right Side: Duration, edit/delete (moderators), download, play toggle */}
                      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                        {(isAdmin || isModerator) && !isEditingThis && (
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => handleStartQuickEdit(song, e)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-[#35D6C5] hover:bg-white/10 transition-colors cursor-pointer"
                              title="تعديل اسم الأغنية"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSongToDelete(song);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="حذف الأغنية"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <span className="text-[10.5px] font-mono text-slate-400">
                          {song.durationFormatted || formatSongDuration(song.durationSeconds)}
                        </span>

                        {song.allowDownload && (
                          <button
                            type="button"
                            onClick={async () => {
                              const res = await downloadGraduationSong(song);
                              setDownloadFeedback(res.message);
                              setTimeout(() => setDownloadFeedback(null), 3000);
                            }}
                            className="p-1.5 rounded-lg text-slate-300 hover:text-[#35D6C5] hover:bg-white/10 transition-colors cursor-pointer"
                            title="تنزيل الأغنية"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (isCurrent) {
                              togglePlayPause();
                            } else {
                              playSong(song);
                            }
                          }}
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform active:scale-90 cursor-pointer ${
                            isCurrent
                              ? 'bg-[#35D6C5] text-[#0A0D12]'
                              : 'bg-white/5 hover:bg-white/15 text-[#35D6C5]'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* In-app Song Deletion Modal */}
        {songToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
            <div className="max-w-sm w-full rounded-3xl bg-[#101827] border border-red-500/40 p-5 space-y-4 shadow-2xl text-right">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white">تأكيد حذف الأغنية</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">«{songToDelete.title}»</p>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed bg-[#090E17] p-3 rounded-xl border border-white/10">
                هل أنت متأكد من حذف هذه الأغنية نهائياً من مكتبة التخرج؟
              </p>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  disabled={isDeletingSong}
                  onClick={handleConfirmQuickDelete}
                  className="flex-1 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isDeletingSong ? 'جاري الحذف...' : 'نعم، حذف نهائي'}
                </button>
                <button
                  type="button"
                  disabled={isDeletingSong}
                  onClick={() => setSongToDelete(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* MAIN PERSISTENT GLASS FLOATING MUSIC BAR ABOVE BOTTOM NAVIGATION */}
        {/* =============================================================== */}
        <div className="rounded-3xl bg-[#0B1320]/90 backdrop-blur-2xl border border-[#35D6C5]/40 shadow-[0_14px_44px_rgba(0,0,0,0.9),0_0_25px_rgba(53,214,197,0.16)] p-2.5 sm:p-3.5 space-y-2">
          {/* Top Row: Track Artwork & Info, Controls, & Drawer Toggle */}
          <div className="flex items-center justify-between gap-2 sm:gap-3">
            {/* Song Cover & Metadata (Tapping opens the drawer) */}
            <div
              onClick={() => setIsPlaylistOpen((prev) => !prev)}
              className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
              title="اضغط لفتح قائمة الأغاني"
            >
              <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-tr from-[#142638] to-[#1C354A] border border-[#35D6C5]/40 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                {currentSong?.coverUrl ? (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music
                    className={`w-4 h-4 sm:w-5 sm:h-5 text-[#35D6C5] ${
                      isPlaying ? 'animate-pulse' : ''
                    }`}
                  />
                )}
              </div>

              <div className="min-w-0 flex-1 text-right">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs sm:text-sm font-black text-white truncate group-hover:text-[#35D6C5] transition-colors">
                    {currentSong ? currentSong.title : 'مكتبة أغاني التخرج 2027'}
                  </h4>
                </div>
                <p className="text-[10px] sm:text-xs text-[#A6F0DF] truncate">
                  {currentSong
                    ? `${currentSong.artist || 'اسم غير معروف'} • ${getSongCategoryLabel(
                        currentSong.category
                      )}`
                    : songs.length > 0
                    ? `اضغط هنا لاختيار أغنية (${songs.length} أغانٍ متاحة)`
                    : 'اضغط لفتح قائمة الأغاني 🎵'}
                </p>
              </div>
            </div>

            {/* Playback Controls (Prev, Play/Pause, Next, Shuffle, Repeat) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0" dir="ltr">
              {/* Shuffle Button (Hidden on very small screens, visible on xs+) */}
              <button
                type="button"
                onClick={toggleShuffle}
                className={`hidden xs:inline-flex p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                  isShuffle
                    ? 'bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="التشغيل العشوائي"
                aria-label="التشغيل العشوائي"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>

              {/* Previous Track */}
              <button
                type="button"
                onClick={playPrevious}
                disabled={songs.length === 0}
                className="p-1.5 sm:p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                title="الأغنية السابقة"
                aria-label="الأغنية السابقة"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause Primary Action */}
              <button
                type="button"
                onClick={togglePlayPause}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] shadow-lg shadow-[#35D6C5]/30 flex items-center justify-center hover:opacity-95 active:scale-95 transition-all cursor-pointer shrink-0"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                type="button"
                onClick={playNext}
                disabled={songs.length === 0}
                className="p-1.5 sm:p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                title="الأغنية التالية"
                aria-label="الأغنية التالية"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              {/* Repeat Button (Hidden on very small screens) */}
              <button
                type="button"
                onClick={cycleRepeatMode}
                className={`hidden xs:inline-flex p-1.5 sm:p-2 rounded-xl transition-colors cursor-pointer ${
                  repeatMode !== 'off'
                    ? 'bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title={
                  repeatMode === 'one'
                    ? 'تكرار الأغنية الحالية'
                    : repeatMode === 'all'
                    ? 'تكرار القائمة بالكامل'
                    : 'تفعيل التكرار'
                }
                aria-label="وضع التكرار"
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-3.5 h-3.5" />
                ) : (
                  <Repeat className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {/* Right-side Playlist Drawer Toggle & Download */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {currentSong?.allowDownload && (
                <button
                  type="button"
                  onClick={handleDownloadCurrent}
                  className="p-1.5 sm:p-2 rounded-xl bg-white/5 hover:bg-[#35D6C5]/20 text-[#35D6C5] border border-white/10 transition-colors cursor-pointer"
                  title="تنزيل الأغنية"
                  aria-label="تنزيل الأغنية"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Playlist Drawer Button with Song Count */}
              <button
                type="button"
                onClick={() => setIsPlaylistOpen((prev) => !prev)}
                className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  isPlaylistOpen
                    ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5] font-black'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
                title="فتح أو إغلاق قائمة الأغاني"
                aria-label="قائمة الأغاني"
              >
                <ListMusic className="w-3.5 h-3.5 text-current" />
                <span className="hidden sm:inline">الأغاني</span>
                {songs.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                      isPlaylistOpen
                        ? 'bg-[#0A0D12] text-[#35D6C5]'
                        : 'bg-[#35D6C5]/20 text-[#35D6C5]'
                    }`}
                  >
                    {songs.length}
                  </span>
                )}
                {isPlaylistOpen ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronUp className="w-3 h-3" />
                )}
              </button>
            </div>
          </div>

          {/* Bottom Row: Interactive Scrubber + Timestamps + Volume */}
          <div className="flex items-center gap-2 sm:gap-3 pt-0.5" dir="ltr">
            <span className="text-[10px] font-mono text-slate-300 w-8 sm:w-9 text-right shrink-0">
              {formatSongDuration(currentTime)}
            </span>

            <input
              type="range"
              min={0}
              max={effectiveDuration > 0 ? effectiveDuration : 100}
              step={1}
              value={Math.min(currentTime, effectiveDuration > 0 ? effectiveDuration : 100)}
              onChange={(e) => seekTo(Number(e.target.value))}
              aria-label="شريط تقدم الأغنية"
              className="flex-1 h-1.5 rounded-lg appearance-none bg-white/15 accent-[#35D6C5] cursor-pointer"
            />

            <span className="text-[10px] font-mono text-slate-400 w-8 sm:w-9 shrink-0">
              {formatSongDuration(effectiveDuration)}
            </span>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/10 shrink-0">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 text-slate-300 hover:text-[#35D6C5] transition-colors cursor-pointer"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-3.5 h-3.5 text-red-400" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-[#35D6C5]" />
                )}
              </button>

              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(Number(e.target.value))}
                aria-label="مستوى الصوت"
                className="hidden md:block w-14 lg:w-18 h-1.5 rounded-lg appearance-none bg-white/15 accent-[#35D6C5] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
