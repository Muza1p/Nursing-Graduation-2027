import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
  useCallback,
} from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { GraduationSong } from '../types';
import {
  getLocalSongs,
  saveLocalSongs,
  syncSongsFromFirestore,
  resolvePlayableSongUrl,
  updateGraduationSongMetadata,
  formatSongDuration,
  seedOfficialGraduationSongIfEmpty,
} from '../services/musicLibrary';

export type RepeatMode = 'off' | 'all' | 'one';

interface MusicContextType {
  songs: GraduationSong[];
  currentSong: GraduationSong | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  isMiniPlayerVisible: boolean;
  isPlaylistOpen: boolean;
  playbackError: string | null;
  isLoadingSongs: boolean;
  playSong: (song: GraduationSong) => Promise<void>;
  togglePlayPause: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  seekTo: (seconds: number) => void;
  setVolume: (vol: number) => void;
  toggleMute: () => void;
  cycleRepeatMode: () => void;
  toggleShuffle: () => void;
  setIsPlaylistOpen: React.Dispatch<React.SetStateAction<boolean>>;
  closeMiniPlayer: () => void;
  clearPlaybackError: () => void;
  refreshSongs: () => Promise<void>;
  setSongsList: React.Dispatch<React.SetStateAction<GraduationSong[]>>;
}

const MusicContext = createContext<MusicContextType | undefined>(undefined);

export const MusicProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [songs, setSongsList] = useState<GraduationSong[]>(() =>
    getLocalSongs()
  );
  const [currentSong, setCurrentSong] = useState<GraduationSong | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.9);
  const [isMuted, setIsMuted] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('off');
  const [isShuffle, setIsShuffle] = useState(false);
  const [isMiniPlayerVisible, setIsMiniPlayerVisible] = useState(false);
  const [isPlaylistOpen, setIsPlaylistOpen] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [isLoadingSongs, setIsLoadingSongs] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activeSongIdRef = useRef<string | null>(null);

  // Sync songs from Firestore on initial load
  const refreshSongs = useCallback(async () => {
    setIsLoadingSongs(true);
    try {
      const synced = await syncSongsFromFirestore();
      setSongsList(synced);
    } finally {
      setIsLoadingSongs(false);
    }
  }, []);

  // Initial sync & Real-time onSnapshot listener for instant synchronization across all students and devices
  useEffect(() => {
    refreshSongs();

    try {
      const unsub = onSnapshot(
        collection(db, 'graduation_songs'),
        (snapshot) => {
          const cloudSongs = snapshot.docs.map(
            (d) => ({ ...d.data(), id: d.id } as GraduationSong)
          );
          cloudSongs.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          saveLocalSongs(cloudSongs);
          setSongsList(cloudSongs);
        },
        (error) => {
          console.warn('Real-time graduation_songs snapshot warning:', error);
        }
      );

      return () => unsub();
    } catch (err) {
      console.warn('Could not attach onSnapshot to graduation_songs:', err);
    }
  }, [refreshSongs]);

  // Keep currentSong metadata in sync if edited in admin panel
  useEffect(() => {
    if (!currentSong) return;
    const updated = songs.find((s) => s.id === currentSong.id);
    if (updated) {
      setCurrentSong(updated);
    } else {
      // Current song was deleted
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute('src');
      }
      setIsPlaying(false);
      setCurrentSong(null);
      activeSongIdRef.current = null;
    }
  }, [songs]);

  const playSong = useCallback(async (song: GraduationSong) => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    setPlaybackError(null);
    setIsMiniPlayerVisible(true);

    // If tapping the already loaded song, toggle play/pause
    if (activeSongIdRef.current === song.id && audioEl.src) {
      if (audioEl.paused) {
        try {
          await audioEl.play();
          setIsPlaying(true);
        } catch {
          setIsPlaying(false);
          setPlaybackError(
            'يتطلب المتصفح الضغط المباشر لتشغيل الصوت، أو أن صيغة الملف غير مدعومة.'
          );
        }
      } else {
        audioEl.pause();
        setIsPlaying(false);
      }
      return;
    }

    const resolved = await resolvePlayableSongUrl(song);
    if (!resolved.url) {
      setCurrentSong(song);
      setIsPlaying(false);
      setPlaybackError(
        resolved.error || 'تعذر العثور على ملف الصوت المرتبط بهذه الأغنية.'
      );
      return;
    }

    try {
      audioEl.pause();
      audioEl.src = resolved.url;
      audioEl.currentTime = 0;
      audioEl.volume = volume;
      audioEl.muted = isMuted;
      activeSongIdRef.current = song.id;
      setCurrentSong(song);
      setCurrentTime(0);
      setDuration(song.durationSeconds || 0);

      await audioEl.play();
      setIsPlaying(true);
    } catch (err) {
      console.warn('Audio play error:', err);
      setIsPlaying(false);
      setPlaybackError(
        'تعذر تشغيل ملف الصوت. تأكد من صلاحية الملف أو اضغط زر التشغيل مرة أخرى.'
      );
    }
  }, [volume, isMuted]);

  const togglePlayPause = useCallback(async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    setPlaybackError(null);

    if (!currentSong) {
      if (songs.length > 0) {
        await playSong(songs[0]);
      } else {
        setIsMiniPlayerVisible(true);
        setPlaybackError(
          'لا توجد أغاني مضافة في المكتبة حالياً. يمكن للمشرف إضافة أغاني التخرج من قسم «الأغاني».'
        );
      }
      return;
    }

    if (!audioEl.src || activeSongIdRef.current !== currentSong.id) {
      await playSong(currentSong);
      return;
    }

    if (isPlaying) {
      audioEl.pause();
      setIsPlaying(false);
    } else {
      try {
        await audioEl.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
        setPlaybackError('يرجى الضغط مرة أخرى لبدء تشغيل الصوت.');
      }
    }
  }, [currentSong, songs, isPlaying, playSong]);

  const playNext = useCallback(async () => {
    if (songs.length === 0) return;
    if (!currentSong) {
      await playSong(songs[0]);
      return;
    }

    if (isShuffle && songs.length > 1) {
      const others = songs.filter((s) => s.id !== currentSong.id);
      const randomSong = others[Math.floor(Math.random() * others.length)];
      if (randomSong) {
        activeSongIdRef.current = null;
        await playSong(randomSong);
        return;
      }
    }

    const idx = songs.findIndex((s) => s.id === currentSong.id);
    const nextIdx = idx >= 0 && idx + 1 < songs.length ? idx + 1 : 0;
    activeSongIdRef.current = null;
    await playSong(songs[nextIdx]);
  }, [songs, currentSong, isShuffle, playSong]);

  const playPrevious = useCallback(async () => {
    if (songs.length === 0) return;
    const audioEl = audioRef.current;
    if (audioEl && audioEl.currentTime > 4) {
      audioEl.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (!currentSong) {
      await playSong(songs[0]);
      return;
    }

    const idx = songs.findIndex((s) => s.id === currentSong.id);
    const prevIdx = idx > 0 ? idx - 1 : songs.length - 1;
    activeSongIdRef.current = null;
    await playSong(songs[prevIdx]);
  }, [songs, currentSong, playSong]);

  const seekTo = useCallback((seconds: number) => {
    const audioEl = audioRef.current;
    if (!audioEl || !Number.isFinite(seconds)) return;
    const clamped = Math.max(0, Math.min(seconds, audioEl.duration || duration || 0));
    audioEl.currentTime = clamped;
    setCurrentTime(clamped);
  }, [duration]);

  const setVolume = useCallback((vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    if (audioRef.current) {
      audioRef.current.volume = clamped;
      if (clamped > 0 && isMuted) {
        audioRef.current.muted = false;
        setIsMuted(false);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    const next = !isMuted;
    setIsMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  }, [isMuted]);

  const cycleRepeatMode = useCallback(() => {
    setRepeatMode((prev) =>
      prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'
    );
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const closeMiniPlayer = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setIsPlaylistOpen(false);
    setIsMiniPlayerVisible(false);
  }, []);

  const clearPlaybackError = useCallback(() => {
    setPlaybackError(null);
  }, []);

  const handleTrackEnded = async () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;

    if (repeatMode === 'one') {
      audioEl.currentTime = 0;
      try {
        await audioEl.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    if (songs.length > 1) {
      const idx = currentSong ? songs.findIndex((s) => s.id === currentSong.id) : -1;
      const isLast = idx === songs.length - 1;
      if (!isLast || repeatMode === 'all' || isShuffle) {
        await playNext();
        return;
      }
    } else if (repeatMode === 'all' && currentSong) {
      audioEl.currentTime = 0;
      try {
        await audioEl.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
      return;
    }

    setIsPlaying(false);
  };

  const handleLoadedMetadata = () => {
    const audioEl = audioRef.current;
    if (!audioEl) return;
    const realDur = audioEl.duration;
    if (Number.isFinite(realDur) && realDur > 0) {
      const rounded = Math.round(realDur);
      setDuration(rounded);
      // If song had 0 duration (e.g., added via direct URL), update its stored duration automatically
      if (currentSong && (!currentSong.durationSeconds || currentSong.durationSeconds === 0)) {
        updateGraduationSongMetadata(currentSong.id, {
          durationSeconds: rounded,
          durationFormatted: formatSongDuration(rounded),
        }).then((res) => {
          if (res.success && res.song) {
            setSongsList(getLocalSongs());
          }
        });
      }
    }
  };

  return (
    <MusicContext.Provider
      value={{
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
        isLoadingSongs,
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
        refreshSongs,
        setSongsList,
      }}
    >
      {/* Persistent Global HTML5 Audio Element (Never unmounts across page transitions) */}
      <audio
        ref={audioRef}
        preload="metadata"
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleTrackEnded}
        onPause={() => setIsPlaying(false)}
        onPlay={() => setIsPlaying(true)}
        onError={() => {
          setIsPlaying(false);
          if (currentSong) {
            setPlaybackError(
              `تعذر تشغيل الملف الصوتي للأغنية «${currentSong.title}». قد يكون الرابط منتهي الصلاحية أو الصيغة غير مدعومة على هذا المتصفح.`
            );
          }
        }}
      />
      {children}
    </MusicContext.Provider>
  );
};

export const useMusic = (): MusicContextType => {
  const ctx = useContext(MusicContext);
  if (!ctx) {
    throw new Error('useMusic must be used within a MusicProvider');
  }
  return ctx;
};
