import React, { useState, useRef } from 'react';
import { Volume2, VolumeX, Play, Pause, Music, Sparkles } from 'lucide-react';

export const AudioPlayerBar: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Royalty-free celebratory classical / ambient graduation anthem track
  const audioSrc = 'https://assets.mixkit.co/music/preview/mixkit-inspiring-cinematic-ambient-1162.mp3';

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.log('Audio autoplay policy prevented playback', e);
      });
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  return (
    <div className="fixed bottom-4 left-4 z-40 no-print">
      <audio
        ref={audioRef}
        src={audioSrc}
        loop
        preload="none"
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex items-center gap-2 px-3 py-2 rounded-2xl bg-[#101827]/90 border border-white/10 shadow-2xl backdrop-blur-xl text-xs">
        <button
          onClick={togglePlay}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
            isPlaying
              ? 'bg-[#21D4C2] text-black shadow-md shadow-[#21D4C2]/30'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
          aria-label={isPlaying ? 'إيقاف الموسيقى' : 'تشغيل الموسيقى الاحتفالية'}
        >
          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
        </button>

        <div className="hidden sm:flex flex-col text-right pr-1">
          <span className="text-[11px] font-bold text-white flex items-center gap-1">
            <Music className="w-3 h-3 text-[#21D4C2]" />
            <span>الموسيقى التذكارية</span>
          </span>
          <span className="text-[9px] text-[#929BAA]">أجواء الاحتفال بالتخرج</span>
        </div>

        {isPlaying && (
          <button
            onClick={toggleMute}
            className="p-1 rounded-lg text-gray-400 hover:text-white transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
};
