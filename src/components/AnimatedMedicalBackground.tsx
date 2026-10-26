import React from 'react';

// 1. Stethoscope SVG
const StethoscopeSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M18 10V24C18 32.8366 25.1634 40 34 40C42.8366 40 50 32.8366 50 24V10"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path d="M14 10H22" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M46 10H54" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    <path
      d="M34 40V48C34 53.5228 38.4772 58 44 58C49.5228 58 54 53.5228 54 48V42"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <circle cx="54" cy="38" r="5" stroke="currentColor" strokeWidth="2.2" fill="currentColor" fillOpacity="0.15" />
    <circle cx="54" cy="38" r="2" fill="currentColor" />
  </svg>
);

// 2. Medical Cross SVG
const MedicalCrossSymbol: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M25 12H39V25H52V39H39V52H25V39H12V25H25V12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.08"
    />
    <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="1.2" strokeDasharray="4 4" strokeOpacity="0.5" />
  </svg>
);

// 3. Syringe SVG
const SyringeSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M44 12L52 20" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M48 16L40 24" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M32 18L46 32" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <rect
      x="35.3137"
      y="21.3137"
      width="12"
      height="28"
      rx="2"
      transform="rotate(45 35.3137 21.3137)"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
    />
    <path d="M27 31L31 35" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M23 35L27 39" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M19 39L23 43" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M17 47L10 54" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 4. IV Drip SVG
const IvDripSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M24 8H40" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M32 8V14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <rect
      x="20"
      y="14"
      width="24"
      height="30"
      rx="6"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
    />
    <path d="M20 28C24 30 28 26 32 28C36 30 40 26 44 28" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.7" />
    <path d="M28 21H36" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.6" />
    <path d="M30 44H34V50H30V44Z" stroke="currentColor" strokeWidth="1.8" />
    <path d="M32 50V58" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 3" />
  </svg>
);

// 5. Nurse Cap SVG
const NurseCapSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M10 26L18 16H46L54 26L46 42H18L10 26Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.09"
    />
    <path d="M14 42H50" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M18 42L14 30" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
    <path d="M46 42L50 30" stroke="currentColor" strokeWidth="1.5" strokeOpacity="0.5" />
    <path d="M32 23V33M27 28H37" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

// 6. Heart with Heartbeat Line SVG
const HeartbeatSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M32 54C32 54 10 40 10 23C10 15.8203 15.8203 10 23 10C27.2 10 30.9 12 32 15C33.1 12 36.8 10 41 10C48.1797 10 54 15.8203 54 23C54 40 32 54 32 54Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.08"
    />
    <path
      d="M14 31H23L26 24L31 39L35 28L38 33H50"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 7. Medical Clipboard SVG
const MedicalClipboardSymbol: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect
      x="16"
      y="14"
      width="32"
      height="42"
      rx="4"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.07"
    />
    <path
      d="M25 14V11C25 9.89543 25.8954 9 27 9H37C38.1046 9 39 9.89543 39 11V14"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path d="M32 22V30M28 26H36" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M23 37H41" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.7" />
    <path d="M23 43H37" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.7" />
    <path d="M23 49H33" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeOpacity="0.5" />
  </svg>
);

// 8. Pulse Oximeter SVG
const PulseOximeterSymbol: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect
      x="14"
      y="16"
      width="36"
      height="32"
      rx="10"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
    />
    <rect x="20" y="22" width="24" height="16" rx="3" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.7" />
    <path
      d="M22 31H26L28 26L31 35L34 29L36 31H42"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="32" cy="43" r="2" fill="currentColor" />
  </svg>
);

// 9. DNA Helix SVG
const DnaHelixSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 10C20 22 44 22 44 32C44 42 20 42 20 54"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M44 10C44 22 20 22 20 32C20 42 44 42 44 54"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeOpacity="0.75"
    />
    <path d="M23 15H41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.55" />
    <path d="M26 21H38" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.55" />
    <path d="M26 43H38" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.55" />
    <path d="M23 49H41" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeOpacity="0.55" />
  </svg>
);

interface FloatingSymbolItem {
  id: string;
  Component: React.FC<{ className?: string }>;
  top: string;
  side: 'left' | 'right';
  offset: string;
  sizeClass: string;
  animClass: string;
  delay: string;
  duration: string;
  colorClass: string;
  hideOnSmallMobile?: boolean;
}

const FLOATING_SYMBOLS: FloatingSymbolItem[] = [
  {
    id: 'nurse-cap-top-right',
    Component: NurseCapSymbol,
    top: '12%',
    side: 'right',
    offset: '2%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-slow',
    delay: '0s',
    duration: '22s',
    colorClass: 'text-[#35D6C2]/15',
  },
  {
    id: 'stethoscope-top-left',
    Component: StethoscopeSymbol,
    top: '16%',
    side: 'left',
    offset: '2%',
    sizeClass: 'w-8 h-8 sm:w-10 sm:h-10',
    animClass: 'med-float-reverse',
    delay: '2s',
    duration: '24s',
    colorClass: 'text-[#5CE1E6]/15',
  },
  {
    id: 'heart-lower-right',
    Component: HeartbeatSymbol,
    top: '68%',
    side: 'right',
    offset: '2.5%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-medium',
    delay: '3s',
    duration: '20s',
    colorClass: 'text-[#35D6C2]/14',
    hideOnSmallMobile: true,
  },
  {
    id: 'medical-cross-lower-left',
    Component: MedicalCrossSymbol,
    top: '74%',
    side: 'left',
    offset: '2.5%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-slow',
    delay: '1.5s',
    duration: '23s',
    colorClass: 'text-[#A6F0DF]/14',
    hideOnSmallMobile: true,
  },
];

interface GlowParticle {
  id: string;
  top: string;
  left: string;
  size: string;
  delay: string;
  duration: string;
  mobileHidden?: boolean;
}

const GLOW_PARTICLES: GlowParticle[] = [
  { id: 'p1', top: '18%', left: '6%', size: 'w-1.5 h-1.5', delay: '0s', duration: '9s' },
  { id: 'p2', top: '26%', left: '93%', size: 'w-1.5 h-1.5', delay: '2s', duration: '10s' },
  { id: 'p3', top: '65%', left: '5%', size: 'w-1.5 h-1.5', delay: '4s', duration: '9.5s', mobileHidden: true },
  { id: 'p4', top: '78%', left: '92%', size: 'w-1.5 h-1.5', delay: '1.2s', duration: '8.5s', mobileHidden: true },
];

export const AnimatedMedicalBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Rich Dark Medical Navy & Turquoise Ambient Lighting */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 15% 18%, rgba(53, 214, 194, 0.06) 0%, transparent 45%), radial-gradient(circle at 85% 32%, rgba(24, 168, 184, 0.05) 0%, transparent 48%), radial-gradient(circle at 50% 82%, rgba(16, 27, 44, 0.6) 0%, transparent 60%)',
        }}
      />

      {/* Primary Animated ECG Heartbeat Line */}
      <div className="absolute inset-x-0 top-[22%] sm:top-[25%] h-20 sm:h-28 opacity-30 sm:opacity-40">
        <svg
          viewBox="0 0 1440 140"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="ecgLineGradPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#35D6C2" stopOpacity="0" />
              <stop offset="15%" stopColor="#35D6C2" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#5CE1E6" stopOpacity="0.75" />
              <stop offset="85%" stopColor="#35D6C2" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#35D6C2" stopOpacity="0" />
            </linearGradient>
            <filter id="ecgCyanGlow" x="-20%" y="-50%" width="140%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M 0 70 L 210 70 Q 225 56 240 70 L 262 70 L 274 84 L 290 16 L 308 118 L 324 70 Q 345 46 368 70 L 660 70 Q 675 56 690 70 L 712 70 L 724 84 L 740 14 L 758 120 L 774 70 Q 795 46 818 70 L 1110 70 Q 1125 56 1140 70 L 1162 70 L 1174 84 L 1190 18 L 1208 116 L 1224 70 Q 1245 46 1268 70 L 1440 70"
            stroke="url(#ecgLineGradPrimary)"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#ecgCyanGlow)"
            className="med-ecg-sweep"
          />
        </svg>
      </div>

      {/* Subtle Glowing Particles Around Edges */}
      {GLOW_PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
          className={`absolute rounded-full bg-[#5CE1E6] shadow-[0_0_10px_1px_rgba(53,214,194,0.5)] med-particle-glow ${
            p.size
          } ${p.mobileHidden ? 'hidden sm:block' : ''}`}
        />
      ))}

      {/* Curated Minimal Medical Symbols Along Screen Corners */}
      {FLOATING_SYMBOLS.map((item) => {
        const {
          id,
          Component,
          top,
          side,
          offset,
          sizeClass,
          animClass,
          delay,
          duration,
          colorClass,
          hideOnSmallMobile,
        } = item;

        return (
          <div
            key={id}
            style={{
              top,
              [side]: offset,
              animationDelay: delay,
              animationDuration: duration,
            }}
            className={`absolute ${colorClass} ${animClass} ${
              hideOnSmallMobile ? 'hidden sm:block' : ''
            }`}
          >
            <Component className={sizeClass} />
          </div>
        );
      })}
    </div>
  );
};
