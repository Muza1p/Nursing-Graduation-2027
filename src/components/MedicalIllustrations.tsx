import React from 'react';

/**
 * Curated Medical & Nursing Graduation Illustrations
 * Built with clean, anatomically and clinically accurate SVG geometry
 * following the Nursing Institute Graduation (#0A0D12, #101B2C, #342A78, #35D6C2, #D7B875, #F4F8FC) palette.
 */

export const AnimatedEcgWaveform: React.FC<{
  color?: string;
  className?: string;
  opacity?: string;
}> = ({ color = '#35D6C2', className = 'w-full h-14', opacity = 'opacity-35' }) => (
  <div className={`pointer-events-none overflow-hidden select-none ${opacity} ${className}`} aria-hidden="true">
    <svg
      viewBox="0 0 1200 90"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      preserveAspectRatio="none"
    >
      {/* Baseline clinical grid reference */}
      <line x1="0" y1="45" x2="1200" y2="45" stroke={color} strokeOpacity="0.15" strokeDasharray="4 6" />
      {/* Primary ECG P-Q-R-S-T waveform */}
      <path
        d="M0 45 L160 45 C172 45 178 33 190 33 C202 33 208 45 220 45 L245 45 L258 56 L274 10 L290 78 L306 45 L335 45 C350 45 360 28 378 28 C396 28 406 45 422 45 L580 45 C592 45 598 33 610 33 C622 33 628 45 640 45 L665 45 L678 56 L694 10 L710 78 L726 45 L755 45 C770 45 780 28 798 28 C816 28 826 45 842 45 L980 45 L995 56 L1012 12 L1028 76 L1044 45 L1200 45"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="animate-ecg-line"
      />
    </svg>
  </div>
);

/**
 * 1. Hero Centerpiece: Stethoscope Intertwined with a Graduation Cap & Nursing Pin
 */
export const StethoscopeGradCapIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[340px] h-auto',
}) => (
  <svg
    viewBox="0 0 380 310"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    role="img"
    aria-label="سماعة طبية متشابكة مع قبعة التخرج وشعار التمريض"
  >
    <defs>
      <radialGradient id="heroGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#35D6C2" stopOpacity="0.24" />
        <stop offset="60%" stopColor="#342A78" stopOpacity="0.12" />
        <stop offset="100%" stopColor="#0A0D12" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="capTopGrad" x1="60" y1="45" x2="310" y2="140" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#1B2B44" />
        <stop offset="50%" stopColor="#101B2C" />
        <stop offset="100%" stopColor="#0A0D12" />
      </linearGradient>
      <linearGradient id="turquoiseTube" x1="60" y1="120" x2="320" y2="290" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#35D6C2" />
        <stop offset="100%" stopColor="#199B8B" />
      </linearGradient>
      <linearGradient id="goldAccent" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#F3DC99" />
        <stop offset="50%" stopColor="#D7B875" />
        <stop offset="100%" stopColor="#A58443" />
      </linearGradient>
    </defs>

    {/* Ambient halo */}
    <circle cx="190" cy="155" r="145" fill="url(#heroGlow)" />

    {/* Subtle clinical cross and DNA nodes in background */}
    <g opacity="0.22" stroke="#35D6C2" strokeWidth="1.2">
      <path d="M52 60 H68 M60 52 V68" strokeLinecap="round" />
      <path d="M320 75 H336 M328 67 V83" strokeLinecap="round" />
      <circle cx="318" cy="220" r="18" strokeDasharray="3 3" />
    </g>

    {/* Stethoscope Binaural Metal Earpieces (behind cap) */}
    <path
      d="M128 82 C96 95 76 135 88 175"
      stroke="#CBD5E1"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M252 82 C284 95 304 135 292 175"
      stroke="#CBD5E1"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    {/* Eartips */}
    <ellipse cx="132" cy="80" rx="7" ry="5" transform="rotate(-20 132 80)" fill="#F4F8FC" />
    <ellipse cx="248" cy="80" rx="7" ry="5" transform="rotate(20 248 80)" fill="#F4F8FC" />

    {/* Academic Mortarboard Graduation Cap */}
    <g className="animate-float-slow">
      {/* Skullcap base */}
      <path
        d="M126 118 V152 C126 168 155 180 190 180 C225 180 254 168 254 152 V118"
        fill="#101B2C"
        stroke="#35D6C2"
        strokeWidth="2"
      />
      {/* Turquoise Nursing Sash Trim on Cap Base */}
      <path
        d="M126 144 C155 158 225 158 254 144"
        stroke="#35D6C2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      {/* Mortarboard Diamond Top */}
      <polygon
        points="190,48 316,96 190,144 64,96"
        fill="url(#capTopGrad)"
        stroke="url(#goldAccent)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      {/* Inner Gold Line on Mortarboard */}
      <polygon
        points="190,57 296,96 190,135 84,96"
        fill="none"
        stroke="#35D6C2"
        strokeOpacity="0.35"
        strokeWidth="1.2"
      />
      {/* Center Cap Button & Champagne Gold Tassel */}
      <ellipse cx="190" cy="96" rx="9" ry="5" fill="url(#goldAccent)" />
      <path
        d="M190 96 Q242 112 268 154"
        stroke="url(#goldAccent)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      {/* Tassel 2027 Charm */}
      <circle cx="268" cy="154" r="5" fill="#D7B875" />
      <path d="M268 159 L261 182 L275 182 Z" fill="url(#goldAccent)" />
      <text x="282" y="172" fill="#D7B875" fontSize="10" fontWeight="800" fontFamily="monospace">
        2027
      </text>
    </g>

    {/* Stethoscope Flexible Tubing Intertwined */}
    <path
      d="M88 175 C98 212 145 222 190 222 C235 222 282 212 292 175"
      stroke="url(#turquoiseTube)"
      strokeWidth="6.5"
      strokeLinecap="round"
    />
    {/* Y-Connector & Lower Stem */}
    <path
      d="M190 222 C190 258 145 278 190 288 C235 298 282 265 278 232"
      stroke="url(#turquoiseTube)"
      strokeWidth="7"
      strokeLinecap="round"
    />

    {/* Precision Chest Piece (Diaphragm & Bell) */}
    <g transform="translate(278, 224)">
      <circle cx="0" cy="0" r="24" fill="#101B2C" stroke="url(#goldAccent)" strokeWidth="3" />
      <circle cx="0" cy="0" r="17" fill="#1E293B" stroke="#35D6C2" strokeWidth="1.8" />
      <circle cx="0" cy="0" r="6" fill="#D7B875" />
      {/* Medical Cross inside Chest Piece */}
      <path d="M-4 0 H4 M0 -4 V4" stroke="#0A0D12" strokeWidth="1.8" strokeLinecap="round" />
    </g>

    {/* Golden Nursing Caduceus / Lamp Medallion Pin on Left */}
    <g transform="translate(102, 245)">
      <circle cx="0" cy="0" r="22" fill="#101B2C" stroke="url(#goldAccent)" strokeWidth="2.2" />
      <circle cx="0" cy="0" r="17" fill="#342A78" fillOpacity="0.6" stroke="#D7B875" strokeDasharray="2 2" />
      {/* Medical Heart + Pulse inside Pin */}
      <path
        d="M0 9 C-10 2 -12 -6 -6 -10 C-2 -12 0 -8 0 -6 C0 -8 2 -12 6 -10 C12 -6 10 2 0 9 Z"
        fill="#35D6C2"
      />
      <path d="M-8 -1 H-3 L-1 -5 L2 4 L4 -1 H8" stroke="#0A0D12" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </g>
  </svg>
);

/**
 * 2. Medical Scrubs Uniform & White Lab Coat Illustration
 */
export const ScrubUniformCoatIllustration: React.FC<{
  variant?: 'scrub' | 'coat';
  className?: string;
}> = ({ variant = 'scrub', className = 'w-full max-w-[260px] h-auto' }) => {
  const isScrub = variant === 'scrub';
  const primaryFill = isScrub ? '#342A78' : '#E2ECF5';
  const secondaryFill = isScrub ? '#231B59' : '#CBD9E8';
  const trimColor = isScrub ? '#35D6C2' : '#35D6C2';

  return (
    <svg
      viewBox="0 0 280 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`select-none ${className}`}
      role="img"
      aria-label={isScrub ? 'الزي الطبي الموحد لحفلة السكراب' : 'المعطف الطبي الأبيض ووشاح التخرج الفيروزي'}
    >
      <defs>
        <linearGradient id={`uniformGrad-${variant}`} x1="50" y1="30" x2="230" y2="240" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={primaryFill} />
          <stop offset="100%" stopColor={secondaryFill} />
        </linearGradient>
      </defs>

      {/* Soft circular backdrop */}
      <circle
        cx="140"
        cy="135"
        r="108"
        fill={isScrub ? '#342A78' : '#35D6C2'}
        fillOpacity="0.12"
        stroke={trimColor}
        strokeOpacity="0.25"
        strokeDasharray="4 4"
      />

      {/* Uniform Shoulders & Sleeves */}
      <path
        d="M95 52 L45 76 L28 142 L68 154 L78 112 V232 H202 V112 L212 154 L252 142 L235 76 L185 52 L140 94 Z"
        fill={`url(#uniformGrad-${variant})`}
        stroke={isScrub ? '#6366F1' : '#94A3B8'}
        strokeWidth="2"
        strokeLinejoin="round"
      />

      {/* V-Neck Clinical Collar */}
      <path
        d="M95 52 L140 102 L185 52"
        stroke={trimColor}
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Inner Undershirt Neck */}
      <path d="M112 56 L140 85 L168 56 Z" fill="#0A0D12" />

      {/* If Official Graduation variant: Turquoise Graduation Sash & Gold Trim */}
      {!isScrub && (
        <g>
          <path
            d="M98 54 L140 120 L122 225 L86 220 L108 110 L82 62 Z"
            fill="#35D6C2"
            stroke="#D7B875"
            strokeWidth="2"
          />
          <path
            d="M182 54 L140 120 L158 225 L194 220 L172 110 L198 62 Z"
            fill="#35D6C2"
            stroke="#D7B875"
            strokeWidth="2"
          />
          <text x="155" y="185" fill="#0A0D12" fontSize="9" fontWeight="900" transform="rotate(8 155 185)">
            2027
          </text>
        </g>
      )}

      {/* Draping Stethoscope around Neck */}
      <path
        d="M104 60 C92 100 94 140 112 156"
        stroke="#35D6C2"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      <path
        d="M176 60 C188 102 184 138 172 152"
        stroke="#35D6C2"
        strokeWidth="4.5"
        strokeLinecap="round"
      />
      {/* Chest Piece on Right Side */}
      <circle cx="114" cy="160" r="11" fill="#101B2C" stroke="#D7B875" strokeWidth="2.5" />
      <circle cx="114" cy="160" r="4" fill="#35D6C2" />
      {/* Binaural Yoke on Left Side */}
      <path d="M164 146 L172 166 L180 146" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

      {/* Breast Pocket with Clinical Penlight & Nursing Scissors */}
      <g transform="translate(154, 118)">
        {/* Penlight */}
        <rect x="6" y="-14" width="5" height="18" rx="2.5" fill="#D7B875" />
        <circle cx="8.5" cy="-14" r="2" fill="#F4F8FC" />
        {/* Bandage Scissors Handles */}
        <circle cx="20" cy="-10" r="5" stroke="#35D6C2" strokeWidth="2" fill="#0A0D12" />
        <circle cx="29" cy="-8" r="5" stroke="#35D6C2" strokeWidth="2" fill="#0A0D12" />
        <path d="M22 -5 L24 4 M27 -3 L25 4" stroke="#CBD5E1" strokeWidth="2" />
        {/* Pocket Flap */}
        <path
          d="M0 0 H36 V32 C36 36 32 40 28 40 H8 C4 40 0 36 0 32 V0 Z"
          fill={isScrub ? '#1E1848' : '#F4F8FC'}
          stroke={isScrub ? '#6366F1' : '#94A3B8'}
          strokeWidth="1.8"
        />
        {/* Medical Cross on Pocket */}
        <path d="M14 18 H22 M18 14 V22" stroke="#35D6C2" strokeWidth="2.2" strokeLinecap="round" />
      </g>

      {/* Gold Nursing Pin on Right Chest */}
      <circle cx="105" cy="112" r="7" fill="#D7B875" />
      <circle cx="105" cy="112" r="3.5" fill="#0A0D12" />
    </svg>
  );
};

/**
 * 3. Curated IV Cannulas (Color-Coded Gauges) & IV Infusion Stand/Drip Bag
 */
export const IvCannulaSetIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[320px] h-auto',
}) => (
  <svg
    viewBox="0 0 340 230"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    role="img"
    aria-label="الكانولات الوريدية الملونة وجهاز الإعطاء الوريدي"
  >
    {/* Background Card Grid */}
    <rect x="8" y="8" width="324" height="214" rx="22" fill="#0A0D12" fillOpacity="0.65" stroke="#35D6C2" strokeOpacity="0.2" />

    {/* Left: IV Infusion Bag & Drip Chamber */}
    <g transform="translate(28, 24)">
      {/* IV Pole Hook */}
      <path d="M45 0 V14 M32 6 H58" stroke="#94A3B8" strokeWidth="2.2" strokeLinecap="round" />
      {/* Infusion Bag */}
      <rect x="14" y="14" width="62" height="88" rx="14" fill="#101B2C" stroke="#35D6C2" strokeWidth="2" />
      {/* Saline Fluid Level */}
      <path
        d="M16 44 Q45 48 74 44 V88 C74 95 68 100 60 100 H30 C22 100 16 95 16 88 V44 Z"
        fill="#35D6C2"
        fillOpacity="0.22"
      />
      {/* Volume Graduation Marks */}
      <line x1="24" y1="32" x2="36" y2="32" stroke="#F4F8FC" strokeOpacity="0.5" strokeWidth="1.5" />
      <line x1="24" y1="48" x2="40" y2="48" stroke="#35D6C2" strokeWidth="1.5" />
      <line x1="24" y1="64" x2="36" y2="64" stroke="#35D6C2" strokeWidth="1.5" />
      <line x1="24" y1="80" x2="40" y2="80" stroke="#35D6C2" strokeWidth="1.5" />
      <text x="46" y="52" fill="#F4F8FC" fontSize="8" fontFamily="monospace" fontWeight="700">
        0.9%
      </text>
      <text x="46" y="64" fill="#35D6C2" fontSize="7" fontFamily="monospace">
        NaCl
      </text>

      {/* Drip Chamber */}
      <rect x="38" y="102" width="14" height="28" rx="5" fill="#101B2C" stroke="#94A3B8" strokeWidth="1.5" />
      {/* Falling Droplet */}
      <path d="M45 110 C42 115 42 118 45 118 C48 118 48 115 45 110 Z" fill="#35D6C2" />
      {/* IV Line Tubing curving to Cannulas */}
      <path
        d="M45 130 C45 168 85 178 128 165"
        stroke="#35D6C2"
        strokeWidth="2.5"
        strokeDasharray="5 3"
        strokeLinecap="round"
      />
    </g>

    {/* Right: Color-Coded Peripheral IV Cannulas (18G Green, 20G Pink, 22G Blue, 24G Yellow) */}
    <g transform="translate(128, 28)">
      <text x="180" y="12" fill="#D7B875" fontSize="10" fontWeight="800" textAnchor="end">
        الكانولات الوريدية القياسية (IV Cannulas)
      </text>

      {[
        { y: 26, label: '18G', color: '#22C55E', desc: 'Green' },
        { y: 66, label: '20G', color: '#F472B6', desc: 'Pink' },
        { y: 106, label: '22G', color: '#38BDF8', desc: 'Blue' },
        { y: 146, label: '24G', color: '#FACC15', desc: 'Yellow' },
      ].map((cannula) => (
        <g key={cannula.label} transform={`translate(0, ${cannula.y})`}>
          {/* Flexible Catheter Tip & Needle bevel */}
          <line x1="2" y1="12" x2="46" y2="12" stroke="#E2E8F0" strokeWidth="1.8" strokeLinecap="round" />
          <polygon points="0,12 7,9 7,15" fill="#35D6C2" />
          {/* Cone Hub */}
          <polygon points="46,8 66,5 66,19 46,16" fill={cannula.color} fillOpacity="0.85" />
          {/* Fixation Wings */}
          <path
            d="M66 2 L82 -3 L88 5 L88 19 L82 27 L66 22 Z"
            fill={cannula.color}
            stroke="#0A0D12"
            strokeWidth="1"
          />
          {/* Injection Port Cap (Top) */}
          <rect x="72" y="-7" width="12" height="6" rx="2" fill={cannula.color} stroke="#F4F8FC" strokeWidth="1" />
          {/* Flashback Chamber & Luer Lock Plug */}
          <rect x="88" y="6" width="34" height="12" rx="3" fill="#1E293B" stroke="#94A3B8" strokeWidth="1.2" />
          {/* Blood Flashback Drop Indicator */}
          <circle cx="100" cy="12" r="3" fill="#E85D65" />
          <rect x="122" y="4" width="10" height="16" rx="2" fill="#F4F8FC" />

          {/* Gauge Label Badge */}
          <rect x="142" y="2" width="44" height="20" rx="6" fill="#101B2C" stroke={cannula.color} strokeWidth="1.2" />
          <text x="164" y="15" fill={cannula.color} fontSize="10" fontWeight="800" fontFamily="monospace" textAnchor="middle">
            {cannula.label}
          </text>
        </g>
      ))}
    </g>
  </svg>
);

/**
 * 4. Curated Vital Signs & Nursing Assessment Tools
 * (Pulse Oximeter, Digital Thermometer, Blood Pressure Monitor Cuff, Clinical Syringe, Medical Chart)
 */
export const VitalSignsToolsIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[320px] h-auto',
}) => (
  <svg
    viewBox="0 0 340 230"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    role="img"
    aria-label="أدوات الفحص السريري والعلامات الحيوية للتمريض"
  >
    <rect x="8" y="8" width="324" height="214" rx="22" fill="#0A0D12" fillOpacity="0.65" stroke="#D7B875" strokeOpacity="0.22" />

    {/* 1. Pulse Oximeter (SpO2 99% | PR 74) */}
    <g transform="translate(22, 24)">
      <rect x="0" y="0" width="96" height="82" rx="16" fill="#101B2C" stroke="#35D6C2" strokeWidth="2" />
      <rect x="10" y="10" width="76" height="48" rx="8" fill="#0A0D12" stroke="#35D6C2" strokeOpacity="0.4" />
      <text x="20" y="26" fill="#35D6C2" fontSize="9" fontFamily="monospace" fontWeight="700">
        SpO2 %
      </text>
      <text x="20" y="48" fill="#F4F8FC" fontSize="18" fontFamily="monospace" fontWeight="900">
        99
      </text>
      <text x="56" y="26" fill="#D7B875" fontSize="8" fontFamily="monospace" fontWeight="700">
        PR bpm
      </text>
      <text x="58" y="48" fill="#D7B875" fontSize="15" fontFamily="monospace" fontWeight="800">
        74
      </text>
      {/* Power button & plethysmograph bar */}
      <circle cx="48" cy="70" r="5" fill="#35D6C2" />
    </g>

    {/* 2. Blood Pressure Cuff & Aneroid Sphygmomanometer Gauge */}
    <g transform="translate(134, 24)">
      {/* Cuff Wrap */}
      <rect x="0" y="6" width="84" height="58" rx="10" fill="#1E293B" stroke="#6366F1" strokeWidth="1.8" />
      <line x1="14" y1="16" x2="54" y2="16" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="14" y="34" fill="#F4F8FC" fontSize="8" fontFamily="monospace" fontWeight="700">
        120 / 80
      </text>
      <text x="14" y="46" fill="#35D6C2" fontSize="7" fontFamily="monospace">
        mmHg • BP
      </text>
      {/* Manometer Dial */}
      <circle cx="98" cy="36" r="24" fill="#101B2C" stroke="#D7B875" strokeWidth="2.2" />
      <circle cx="98" cy="36" r="18" fill="#0A0D12" />
      {/* Dial ticks & needle */}
      <path d="M98 22 V25 M112 36 H109 M98 50 V47 M84 36 H87" stroke="#94A3B8" strokeWidth="1.5" />
      <line x1="98" y1="36" x2="108" y2="26" stroke="#E85D65" strokeWidth="2" strokeLinecap="round" />
      <circle cx="98" cy="36" r="3" fill="#D7B875" />
      {/* Inflation Bulb */}
      <ellipse cx="158" cy="40" rx="14" ry="22" fill="#1E293B" stroke="#35D6C2" strokeWidth="1.8" />
      <path d="M84 52 C110 74 148 74 158 62" stroke="#35D6C2" strokeWidth="2.5" fill="none" />
    </g>

    {/* 3. Calibrated Clinical Syringe (Bottom Right) */}
    <g transform="translate(124, 128)">
      {/* Plunger Handle */}
      <line x1="0" y1="22" x2="6" y2="42" stroke="#CBD5E1" strokeWidth="3" strokeLinecap="round" />
      <line x1="3" y1="32" x2="38" y2="32" stroke="#CBD5E1" strokeWidth="4" />
      {/* Barrel Flange */}
      <line x1="38" y1="18" x2="38" y2="46" stroke="#94A3B8" strokeWidth="3" strokeLinecap="round" />
      {/* Transparent Calibrated Barrel */}
      <rect x="38" y="22" width="110" height="20" rx="4" fill="#101B2C" stroke="#35D6C2" strokeWidth="1.8" />
      {/* Turquoise Medication Liquid inside */}
      <rect x="78" y="24" width="68" height="16" rx="2" fill="#35D6C2" fillOpacity="0.32" />
      {/* Rubber Stopper */}
      <rect x="72" y="23" width="6" height="18" fill="#0A0D12" />
      {/* Calibration Ticks (1ml - 5ml) */}
      {[52, 66, 80, 94, 108, 122, 136].map((tx) => (
        <line key={tx} x1={tx} y1="22" x2={tx} y2="30" stroke="#F4F8FC" strokeWidth="1.3" />
      ))}
      {/* Needle Hub & Fine Needle */}
      <polygon points="148,27 162,30 162,34 148,37" fill="#35D6C2" />
      <line x1="162" y1="32" x2="192" y2="32" stroke="#E2E8F0" strokeWidth="1.4" strokeLinecap="round" />

      {/* Digital Thermometer below Syringe */}
      <g transform="translate(8, 54)">
        <rect x="0" y="0" width="142" height="16" rx="8" fill="#101B2C" stroke="#D7B875" strokeWidth="1.5" />
        <rect x="36" y="3" width="52" height="10" rx="3" fill="#0A0D12" />
        <text x="62" y="11" fill="#35D6C2" fontSize="8" fontFamily="monospace" fontWeight="800" textAnchor="middle">
          36.8°C
        </text>
        <path d="M142 5 L158 6.5 V9.5 L142 11 Z" fill="#CBD5E1" />
      </g>
    </g>

    {/* 4. Patient Clinical Chart Clipboard (Bottom Left) */}
    <g transform="translate(24, 118)">
      <rect x="0" y="6" width="76" height="90" rx="10" fill="#101B2C" stroke="#94A3B8" strokeWidth="1.8" />
      <rect x="22" y="0" width="32" height="12" rx="4" fill="#D7B875" />
      {/* Medical Cross on Chart */}
      <path d="M34 24 H42 M38 20 V28" stroke="#35D6C2" strokeWidth="2.2" strokeLinecap="round" />
      {/* Chart Lines */}
      <line x1="14" y1="42" x2="62" y2="42" stroke="#F4F8FC" strokeOpacity="0.7" strokeWidth="2" strokeLinecap="round" />
      <line x1="14" y1="54" x2="54" y2="54" stroke="#94A3B8" strokeOpacity="0.6" strokeWidth="2" strokeLinecap="round" />
      {/* Mini ECG wave on chart */}
      <path
        d="M14 74 L28 74 L33 64 L39 82 L44 74 L62 74"
        stroke="#35D6C2"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  </svg>
);

/**
 * 5. Anatomical Heart Line Art, DNA Double Helix & Graduation Scroll
 */
export const AnatomicalHeartMedalIllustration: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[260px] h-auto',
}) => (
  <svg
    viewBox="0 0 260 220"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`select-none ${className}`}
    role="img"
    aria-label="القلب التشريحي واللولب الوراثي وشهادة التخرج"
  >
    {/* Subtle Halo */}
    <circle cx="130" cy="110" r="92" fill="#35D6C2" fillOpacity="0.08" stroke="#D7B875" strokeOpacity="0.25" strokeDasharray="4 4" />

    {/* DNA Double Helix Strand on Right */}
    <g transform="translate(186, 36)" opacity="0.85">
      <path
        d="M0 0 C28 24 0 48 28 72 C56 96 0 120 28 144"
        stroke="#35D6C2"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M28 0 C0 24 28 48 0 72 C-28 96 28 120 0 144"
        stroke="#D7B875"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {[18, 42, 66, 90, 114, 132].map((ry) => (
        <line key={ry} x1="6" y1={ry} x2="22" y2={ry} stroke="#F4F8FC" strokeOpacity="0.45" strokeWidth="1.5" />
      ))}
    </g>

    {/* Refined Line-Art Anatomical Heart Center */}
    <g transform="translate(65, 38)">
      {/* Aorta & Superior Vena Cava Vessels */}
      <path
        d="M36 28 V8 C36 4 42 4 42 8 V24 M48 26 C48 6 72 6 72 26 V32 M22 36 L12 18"
        stroke="#D7B875"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      {/* Heart Chambers Outline */}
      <path
        d="M46 28 C20 24 4 46 8 74 C12 104 42 126 56 134 C70 126 96 98 96 68 C96 42 74 26 46 28 Z"
        fill="#101B2C"
        stroke="#35D6C2"
        strokeWidth="2.5"
      />
      {/* Coronary Vessels */}
      <path
        d="M48 34 C46 64 52 94 56 126 M48 62 L28 78 M50 82 L76 92 M46 50 L72 60"
        stroke="#D7B875"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      {/* Live Pulse Overlay across Heart */}
      <path
        d="M16 74 H36 L44 54 L54 94 L62 66 L68 74 H88"
        stroke="#F4F8FC"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>

    {/* Rolled Graduation Certificate Scroll with Turquoise Ribbon at Bottom */}
    <g transform="translate(46, 168)">
      <rect x="0" y="6" width="142" height="22" rx="11" fill="#F4F8FC" stroke="#D7B875" strokeWidth="2" />
      <ellipse cx="136" cy="17" rx="5" ry="11" fill="#101B2C" stroke="#D7B875" strokeWidth="1.5" />
      {/* Turquoise Ribbon & Gold Seal */}
      <rect x="60" y="4" width="18" height="26" rx="3" fill="#35D6C2" />
      <circle cx="69" cy="17" r="7" fill="#D7B875" />
      <path d="M65 24 L60 38 L69 33 L78 38 L73 24" fill="#35D6C2" />
    </g>
  </svg>
);
