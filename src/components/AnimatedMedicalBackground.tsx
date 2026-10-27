import React from 'react';

// 1. Stethoscope SVG
export const StethoscopeSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
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
export const MedicalCrossSymbol: React.FC<{ className?: string }> = ({ className = 'w-10 h-10' }) => (
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
export const SyringeSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
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
export const IvDripSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
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
export const NurseCapSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
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

// 6. Peripheral IV Cannula SVG
export const CannulaSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Needle tip */}
    <path d="M8 32H20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    {/* Catheter hub */}
    <path d="M20 27L28 25V39L20 37V27Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
    {/* Butterfly wings */}
    <path d="M26 25L20 14H32L34 25" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08" />
    <path d="M26 39L20 50H32L34 39" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" fill="currentColor" fillOpacity="0.08" />
    {/* Injection port cap (top) */}
    <rect x="31" y="17" width="8" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.15" />
    {/* Main body & Luer lock */}
    <rect x="28" y="25" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.07" />
    <rect x="46" y="27" width="8" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
  </svg>
);

// 7. Medical Needle & Drop SVG
export const MedicalNeedleSymbol: React.FC<{ className?: string }> = ({ className = 'w-11 h-11' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M14 50L38 26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M35 23L41 29L48 22L42 16L35 23Z" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.12" />
    <path d="M45 19L52 12" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    {/* Liquid droplet */}
    <path
      d="M12 53C12 53 8 57 8 59.5C8 61.5 9.8 63 12 63C14.2 63 16 61.5 16 59.5C16 57 12 53 12 53Z"
      stroke="currentColor"
      strokeWidth="1.6"
      fill="currentColor"
      fillOpacity="0.2"
    />
  </svg>
);

// 8. Graduation Cap (Mortarboard) SVG
export const GraduationCapSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M6 26L32 14L58 26L32 38L6 26Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.1"
    />
    <path
      d="M16 31V44C16 48 23.2 52 32 52C40.8 52 48 48 48 44V31"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path d="M54 28V44" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="54" cy="46" r="2.5" fill="currentColor" />
  </svg>
);

// 9. Nursing Scrubs Uniform SVG
export const NursingScrubsSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path
      d="M22 12L32 24L42 12L56 20L50 32L44 29V54H20V29L14 32L8 20L22 12Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      fill="currentColor"
      fillOpacity="0.08"
    />
    {/* V-neck trim */}
    <path d="M25 14L32 23L39 14" stroke="currentColor" strokeWidth="1.6" strokeOpacity="0.7" />
    {/* Pocket & Cross badge */}
    <rect x="35" y="29" width="6" height="7" rx="1" stroke="currentColor" strokeWidth="1.5" />
    <path d="M26 31V35M24 33H28" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 10. Rolled Graduation Diploma Scroll SVG
export const DiplomaSymbol: React.FC<{ className?: string }> = ({ className = 'w-12 h-12' }) => (
  <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect
      x="12"
      y="22"
      width="40"
      height="18"
      rx="5"
      stroke="currentColor"
      strokeWidth="2"
      fill="currentColor"
      fillOpacity="0.08"
    />
    <ellipse cx="16" cy="31" rx="3" ry="9" stroke="currentColor" strokeWidth="1.6" />
    {/* Ribbon tie */}
    <rect x="29" y="21" width="6" height="20" rx="1" stroke="currentColor" strokeWidth="1.8" fill="currentColor" fillOpacity="0.2" />
    <path d="M30 41L26 51L32 48L38 51L34 41" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
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
    top: '9%',
    side: 'right',
    offset: '1.5%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-slow',
    delay: '0s',
    duration: '22s',
    colorClass: 'text-[#35D6C5]/18',
  },
  {
    id: 'stethoscope-top-left',
    Component: StethoscopeSymbol,
    top: '12%',
    side: 'left',
    offset: '1.5%',
    sizeClass: 'w-8 h-8 sm:w-10 sm:h-10',
    animClass: 'med-float-reverse',
    delay: '1.5s',
    duration: '24s',
    colorClass: 'text-[#5CE1E6]/18',
  },
  {
    id: 'grad-cap-upper-right',
    Component: GraduationCapSymbol,
    top: '25%',
    side: 'right',
    offset: '2%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-medium',
    delay: '2.5s',
    duration: '21s',
    colorClass: 'text-[#A6F0DF]/16',
    hideOnSmallMobile: true,
  },
  {
    id: 'syringe-upper-left',
    Component: SyringeSymbol,
    top: '29%',
    side: 'left',
    offset: '1.8%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-slow',
    delay: '3.2s',
    duration: '23s',
    colorClass: 'text-[#35D6C5]/16',
  },
  {
    id: 'cannula-mid-right',
    Component: CannulaSymbol,
    top: '44%',
    side: 'right',
    offset: '1.5%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-reverse',
    delay: '0.8s',
    duration: '20s',
    colorClass: 'text-[#5CE1E6]/16',
  },
  {
    id: 'iv-drip-mid-left',
    Component: IvDripSymbol,
    top: '48%',
    side: 'left',
    offset: '1.5%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-medium',
    delay: '4s',
    duration: '22s',
    colorClass: 'text-[#35D6C5]/16',
    hideOnSmallMobile: true,
  },
  {
    id: 'scrubs-lower-right',
    Component: NursingScrubsSymbol,
    top: '63%',
    side: 'right',
    offset: '2%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-slow',
    delay: '2s',
    duration: '25s',
    colorClass: 'text-[#A6F0DF]/16',
    hideOnSmallMobile: true,
  },
  {
    id: 'needle-lower-left',
    Component: MedicalNeedleSymbol,
    top: '67%',
    side: 'left',
    offset: '1.8%',
    sizeClass: 'w-6 h-6 sm:w-8 sm:h-8',
    animClass: 'med-float-reverse',
    delay: '1.2s',
    duration: '19s',
    colorClass: 'text-[#5CE1E6]/15',
  },
  {
    id: 'diploma-bottom-right',
    Component: DiplomaSymbol,
    top: '82%',
    side: 'right',
    offset: '1.8%',
    sizeClass: 'w-7 h-7 sm:w-9 sm:h-9',
    animClass: 'med-float-medium',
    delay: '3.5s',
    duration: '21s',
    colorClass: 'text-[#35D6C5]/16',
  },
  {
    id: 'medical-cross-bottom-left',
    Component: MedicalCrossSymbol,
    top: '85%',
    side: 'left',
    offset: '2%',
    sizeClass: 'w-7 h-7 sm:w-8 sm:h-8',
    animClass: 'med-float-slow',
    delay: '2.2s',
    duration: '23s',
    colorClass: 'text-[#A6F0DF]/15',
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
  { id: 'p1', top: '14%', left: '4%', size: 'w-1.5 h-1.5', delay: '0s', duration: '9s' },
  { id: 'p2', top: '22%', left: '95%', size: 'w-1.5 h-1.5', delay: '2s', duration: '10s' },
  { id: 'p3', top: '38%', left: '3%', size: 'w-2 h-2', delay: '1.5s', duration: '11s', mobileHidden: true },
  { id: 'p4', top: '52%', left: '96%', size: 'w-1.5 h-1.5', delay: '3.2s', duration: '9.5s', mobileHidden: true },
  { id: 'p5', top: '70%', left: '4%', size: 'w-1.5 h-1.5', delay: '4s', duration: '9.5s' },
  { id: 'p6', top: '84%', left: '94%', size: 'w-2 h-2', delay: '1.2s', duration: '8.5s' },
];

export const AnimatedMedicalBackground: React.FC = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none"
      aria-hidden="true"
    >
      {/* Rich Dark Medical Navy, Turquoise & Cyan Ambient Lighting */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 12% 16%, rgba(53, 214, 197, 0.07) 0%, transparent 42%), radial-gradient(circle at 88% 28%, rgba(92, 225, 230, 0.06) 0%, transparent 45%), radial-gradient(circle at 50% 85%, rgba(16, 27, 44, 0.65) 0%, transparent 60%)',
        }}
      />

      {/* Subtle Left & Right Edge Glowing Medical Frame Rails */}
      <div className="hidden sm:block absolute inset-y-12 left-2 w-[1px] bg-gradient-to-b from-transparent via-[#35D6C5]/20 to-transparent" />
      <div className="hidden sm:block absolute inset-y-12 right-2 w-[1px] bg-gradient-to-b from-transparent via-[#5CE1E6]/20 to-transparent" />

      {/* Upper Animated ECG Heartbeat Line */}
      <div className="absolute inset-x-0 top-[18%] sm:top-[20%] h-16 sm:h-24 opacity-25 sm:opacity-35">
        <svg
          viewBox="0 0 1440 140"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <linearGradient id="ecgLineGradPrimary" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#35D6C5" stopOpacity="0" />
              <stop offset="15%" stopColor="#35D6C5" stopOpacity="0.35" />
              <stop offset="50%" stopColor="#5CE1E6" stopOpacity="0.8" />
              <stop offset="85%" stopColor="#35D6C5" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#35D6C5" stopOpacity="0" />
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

      {/* Lower Subtle Animated ECG Heartbeat Line */}
      <div className="absolute inset-x-0 bottom-[14%] h-14 sm:h-20 opacity-20 sm:opacity-25">
        <svg
          viewBox="0 0 1440 140"
          fill="none"
          preserveAspectRatio="none"
          className="w-full h-full overflow-visible"
        >
          <path
            d="M 0 70 L 310 70 Q 325 56 340 70 L 362 70 L 374 84 L 390 20 L 408 114 L 424 70 Q 445 48 468 70 L 880 70 Q 895 56 910 70 L 932 70 L 944 84 L 960 18 L 978 116 L 994 70 Q 1015 48 1038 70 L 1440 70"
            stroke="url(#ecgLineGradPrimary)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="med-ecg-sweep-delayed"
          />
        </svg>
      </div>

      {/* Subtle Glowing Turquoise Particles Around Edges */}
      {GLOW_PARTICLES.map((p) => (
        <div
          key={p.id}
          style={{
            top: p.top,
            left: p.left,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
          className={`absolute rounded-full bg-[#5CE1E6] shadow-[0_0_10px_2px_rgba(53,214,197,0.45)] med-particle-glow ${
            p.size
          } ${p.mobileHidden ? 'hidden sm:block' : ''}`}
        />
      ))}

      {/* Curated Medical & Graduation Symbols Along Screen Edges */}
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
