import React, { useState } from 'react';
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
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicContext';
import {
  formatSongDuration,
  getSongCategoryLabel,
  downloadGraduationSong,
} from '../services/musicLibrary';

export const AudioPlayerBar: React.FC = () => {
  const { navigateTo, currentPage } = useApp();
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
    isMiniPlayerVisible,
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
    closeMiniPlayer,
    clearPlaybackError,
  } = useMusic();

  const [downloadFeedback, setDownloadFeedback] = useState<string | null>(null);

  const handleDownloadCurrent = async () => {
    if (!currentSong) return;
    setDownloadFeedback(null);
    const res = await downloadGraduationSong(currentSong);
    setDownloadFeedback(res.message);
    setTimeout(() => setDownloadFeedback(null), 3500);
  };

  const effectiveDuration =
    duration > 0 ? duration : currentSong?.durationSeconds || 0;

  // Compact Floating Trigger when Mini-Player is not yet opened
  if (!isMiniPlayerVisible && !currentSong) {
    return (
      <div className="fixed bottom-20 sm:bottom-24 left-3 sm:left-6 z-40 no-print">
        <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#0B1320]/90 border border-[#35D6C5]/40 shadow-[0_10px_30px_rgba(0,0,0,0.85)] backdrop-blur-2xl text-xs">
          <button
            type="button"
            onClick={() => {
              if (songs.length > 0) {
                togglePlayPause();
              } else {
                navigateTo('music');
              }
            }}
            className="w-9 h-9 rounded-xl bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] border border-[#35D6C5]/35 flex items-center justify-center transition-all cursor-pointer shrink-0"
            aria-label="تشغيل أغاني التخرج"
            title="مكتبة أغاني التخرج"
          >
            <Music className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => navigateTo('music')}
            className="flex flex-col text-right pr-0.5 cursor-pointer"
          >
            <span className="text-[11px] font-black text-white flex items-center gap-1">
              <span>أغاني التخرج</span>
              {songs.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#35D6C5]/20 text-[#35D6C5] text-[9px] font-mono">
                  {songs.length}
                </span>
              )}
            </span>
            <span className="text-[9px] text-[#5CE1E6] font-semibold">
              {songs.length > 0 ? 'اضغط لفتح المشغّل 🎵' : 'فتح مكتبة الأغاني 🎵'}
            </span>
          </button>

          {songs.length > 0 && (
            <button
              type="button"
              onClick={togglePlayPause}
              className="p-1.5 rounded-lg bg-[#35D6C5] text-[#0A0D12] hover:opacity-90 transition-opacity cursor-pointer"
              title="تشغيل سريع"
            >
              <Play className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[4.7rem] sm:bottom-[5.4rem] inset-x-2.5 sm:inset-x-6 z-40 no-print pointer-events-none">
      <div className="max-w-3xl mx-auto pointer-events-auto space-y-2">
        {/* Error / Download Toast Banner */}
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

        {/* Expandable Mini-Playlist Drawer */}
        {isPlaylistOpen && (
          <div className="rounded-3xl bg-[#0B1320]/95 backdrop-blur-2xl border border-[#35D6C5]/40 shadow-[0_16px_50px_rgba(0,0,0,0.92)] overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#101B2C]/80">
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 text-[#35D6C5]" />
                <span className="text-xs sm:text-sm font-black text-white">
                  قائمة تشغيل أغاني التخرج ({songs.length})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {currentPage !== 'music' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaylistOpen(false);
                      navigateTo('music');
                    }}
                    className="px-2.5 py-1 rounded-lg bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] border border-[#35D6C5]/30 text-[11px] font-bold cursor-pointer"
                  >
                    فتح المكتبة الكاملة
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsPlaylistOpen(false)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white cursor-pointer"
                  aria-label="إغلاق قائمة التشغيل"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {songs.length === 0 ? (
              <div className="p-6 text-center space-y-2">
                <Music className="w-8 h-8 text-[#35D6C5]/50 mx-auto" />
                <p className="text-xs font-bold text-white">
                  لا توجد أغاني مضافة في القائمة حالياً
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsPlaylistOpen(false);
                    navigateTo('music');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs cursor-pointer"
                >
                  الانتقال إلى قسم الأغاني
                </button>
              </div>
            ) : (
              <div className="max-h-60 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
                {songs.map((song, idx) => {
                  const isCurrent = currentSong?.id === song.id;
                  return (
                    <button
                      key={song.id}
                      type="button"
                      onClick={() => playSong(song)}
                      className={`w-full text-right p-2.5 rounded-2xl flex items-center justify-between gap-3 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-[#35D6C5]/20 border border-[#35D6C5]/40 text-white'
                          : 'hover:bg-white/5 text-slate-200 border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-[#142638] border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {song.coverUrl ? (
                            <img
                              src={song.coverUrl}
                              alt={song.title}
                              className="w-full h-full object-cover"
                            />
                          ) : isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 text-[#35D6C5]" />
                          ) : (
                            <span className="text-[11px] font-mono font-bold text-[#35D6C5]">
                              {idx + 1}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-black text-white truncate">
                            {song.title}
                          </div>
                          <div className="text-[10px] text-slate-400 truncate flex items-center gap-1.5">
                            <span>{song.artist || 'اسم غير معروف'}</span>
                            <span>•</span>
                            <span className="text-[#5CE1E6]">
                              {getSongCategoryLabel(song.category)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[11px] font-mono text-slate-400">
                          {song.durationFormatted || formatSongDuration(song.durationSeconds)}
                        </span>
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                            isCurrent
                              ? 'bg-[#35D6C5] text-[#0A0D12]'
                              : 'bg-white/5 text-[#35D6C5]'
                          }`}
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-3.5 h-3.5" />
                          ) : (
                            <Play className="w-3.5 h-3.5" />
                          )}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Main Glassmorphic Mini-Player Bar */}
        <div className="rounded-3xl bg-[#0B1320]/90 backdrop-blur-2xl border border-[#35D6C5]/40 shadow-[0_14px_44px_rgba(0,0,0,0.9),0_0_25px_rgba(53,214,197,0.16)] p-3 sm:p-4 space-y-2.5">
          {/* Top Row: Cover, Song Info, Transport Controls, & Actions */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            {/* Song Cover & Metadata */}
            <div
              onClick={() => setIsPlaylistOpen((prev) => !prev)}
              className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 cursor-pointer group"
            >
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr from-[#142638] to-[#1C354A] border border-[#35D6C5]/40 flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                {currentSong?.coverUrl ? (
                  <img
                    src={currentSong.coverUrl}
                    alt={currentSong.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Music
                    className={`w-5 h-5 text-[#35D6C5] ${
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
                    : 'اختر أغنية من قائمة التشغيل'}
                </p>
              </div>
            </div>

            {/* Playback Transport Controls (Prev, Play/Pause, Next) */}
            <div className="flex items-center gap-1 sm:gap-2 shrink-0" dir="ltr">
              {/* Shuffle Button */}
              <button
                type="button"
                onClick={toggleShuffle}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
                  isShuffle
                    ? 'bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
                title="التشغيل العشوائي"
                aria-label="التشغيل العشوائي"
              >
                <Shuffle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </button>

              {/* Previous Track */}
              <button
                type="button"
                onClick={playPrevious}
                disabled={songs.length === 0}
                className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                title="الأغنية السابقة"
                aria-label="الأغنية السابقة"
              >
                <SkipBack className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Play / Pause */}
              <button
                type="button"
                onClick={togglePlayPause}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] shadow-lg shadow-[#35D6C5]/30 flex items-center justify-center hover:opacity-95 active:scale-95 transition-all cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
                aria-label={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5 ml-0.5" />
                )}
              </button>

              {/* Next Track */}
              <button
                type="button"
                onClick={playNext}
                disabled={songs.length === 0}
                className="p-2 rounded-xl text-slate-200 hover:text-white hover:bg-white/10 disabled:opacity-40 transition-colors cursor-pointer"
                title="الأغنية التالية"
                aria-label="الأغنية التالية"
              >
                <SkipForward className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>

              {/* Repeat Mode */}
              <button
                type="button"
                onClick={cycleRepeatMode}
                className={`p-2 rounded-xl transition-colors cursor-pointer ${
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
                  <Repeat1 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <Repeat className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
              </button>
            </div>

            {/* Right-side Utility Controls (Download, Playlist Drawer, Close) */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {currentSong?.allowDownload && (
                <button
                  type="button"
                  onClick={handleDownloadCurrent}
                  className="p-2 rounded-xl bg-white/5 hover:bg-[#35D6C5]/20 text-[#35D6C5] border border-white/10 transition-colors cursor-pointer"
                  title="تنزيل الأغنية"
                  aria-label="تنزيل الأغنية"
                >
                  <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsPlaylistOpen((prev) => !prev)}
                className={`px-2.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                  isPlaylistOpen
                    ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                }`}
                title="فتح قائمة التشغيل المصغّرة"
                aria-label="قائمة التشغيل"
              >
                <ListMusic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden md:inline">القائمة</span>
                <ChevronUp
                  className={`w-3 h-3 transition-transform ${
                    isPlaylistOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={closeMiniPlayer}
                className="p-2 rounded-xl text-slate-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
                title="إغلاق المشغّل المصغّر"
                aria-label="إغلاق المشغّل"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Bottom Row: Interactive Seek Bar + Time Display + Volume Control */}
          <div className="flex items-center gap-3 pt-0.5" dir="ltr">
            <span className="text-[10px] sm:text-[11px] font-mono text-slate-300 w-9 text-right shrink-0">
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

            <span className="text-[10px] sm:text-[11px] font-mono text-slate-400 w-9 shrink-0">
              {formatSongDuration(effectiveDuration)}
            </span>

            {/* Volume Control (Mute Toggle + Slider on Tablet/Desktop) */}
            <div className="flex items-center gap-1.5 pl-1 border-l border-white/10 shrink-0">
              <button
                type="button"
                onClick={toggleMute}
                className="p-1 text-slate-300 hover:text-[#35D6C5] transition-colors cursor-pointer"
                title={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
                aria-label={isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-red-400" />
                ) : (
                  <Volume2 className="w-4 h-4 text-[#35D6C5]" />
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
                className="hidden sm:block w-16 md:w-20 h-1.5 rounded-lg appearance-none bg-white/15 accent-[#35D6C5] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
