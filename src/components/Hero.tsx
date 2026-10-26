import React from 'react';
import { useApp } from '../context/AppContext';
import { CountdownTimer } from './CountdownTimer';
import {
  StethoscopeGradCapIllustration,
  ScrubUniformCoatIllustration,
  AnimatedEcgWaveform,
} from './MedicalIllustrations';
import {
  Sparkles,
  GraduationCap,
  ShieldCheck,
  HeartPulse,
  Award,
  Instagram,
  Search,
  Stethoscope,
} from 'lucide-react';

export const Hero: React.FC = () => {
  const { navigateTo, currentUser, eventConfig } = useApp();

  return (
    <section className="relative overflow-hidden pt-3 pb-10 sm:pt-8 sm:pb-16 clinical-grid-bg border-b border-white/10">
      {/* Ambient Medical Luminescence (#35D6C5, #1C354A, #D6B777) */}
      <div className="absolute top-1/4 right-1/3 translate-x-1/2 -translate-y-1/2 w-[520px] sm:w-[780px] h-[360px] sm:h-[520px] bg-gradient-to-tr from-[#35D6C5]/15 via-[#1C354A]/35 to-[#D6B777]/12 rounded-full blur-[120px] pointer-events-none" />

      {/* Top Subtle Animated ECG Pulse Line */}
      <div className="absolute top-4 inset-x-0 pointer-events-none">
        <AnimatedEcgWaveform color="#35D6C5" opacity="opacity-20" className="w-full h-12" />
      </div>

      <div className="relative max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-5 sm:space-y-8">
        {/* 1. Prominent Top-of-Home-Page Graduation Countdown Timer (Requirement 2) */}
        <CountdownTimer />

        {/* 2. Top Event Identity Badges */}
        <div className="grid grid-cols-1 sm:flex sm:flex-wrap items-stretch sm:items-center justify-center lg:justify-start gap-2 sm:gap-3">
          <button
            onClick={() => navigateTo('scrub_night')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#1C354A]/85 border border-[#35D6C5]/35 text-[#A6F0DF] text-[11px] sm:text-xs font-bold shadow-sm hover:border-[#35D6C5] transition-all"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D6B777] shrink-0" />
            <span className="truncate">
              حفلة السكراب • {eventConfig.scrubVenue || 'مسرح تفاحة المصور'} •{' '}
              {eventConfig.scrubPartyDateDisplay || '12/12/2026'}{' '}
              {!eventConfig.isScrubDateConfirmed ? '(موعد مبدئي)' : ''}
            </span>
          </button>

          <button
            onClick={() => navigateTo('official_grad')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-xl bg-[#142638] border border-[#D6B777]/35 text-[#D6B777] text-[11px] sm:text-xs font-bold hover:border-[#D6B777] transition-all"
          >
            <Award className="w-3.5 h-3.5 text-[#D6B777] shrink-0" />
            <span className="truncate">حفل التخرج الرسمي (وشاح التمريض التركوازي) • قريباً</span>
          </button>
        </div>

        {/* 3. Main 2-Column Medical Graduation Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Right Column (RTL Primary Text & CTAs) */}
          <div className="lg:col-span-7 text-center lg:text-right space-y-4 sm:space-y-5">
            {/* Institution & Cohort Banner */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2.5 px-3 sm:px-4 py-1.5 rounded-xl bg-[#142638] border border-[#D6B777]/35 shadow-md">
              <HeartPulse className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#35D6C5] shrink-0" />
              <span className="text-[11px] sm:text-sm font-extrabold text-white">معهد التمريض</span>
              <span className="text-white/25">|</span>
              <span className="text-[11px] sm:text-sm font-black text-[#35D6C5]">دفعة 2026</span>
              <span className="text-white/25">|</span>
              <span className="text-[11px] sm:text-sm font-mono font-extrabold text-[#D6B777]">
                Graduation 2027 • التخرج 2027
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.28] sm:leading-[1.18]">
                دفعة 2026 — ملائكة الرحمة{' '}
                <span className="block mt-1 bg-gradient-to-l from-[#35D6C5] via-[#A6F0DF] to-[#D6B777] bg-clip-text text-transparent">
                  نحو التخرج الأكاديمي 2027
                </span>
              </h1>
              <p className="text-xs sm:text-lg text-[#E8EEF2]/90 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                بكل فخر واعتزاز برسالة التمريض الإنسانية والعلمية، نحتفي بمسيرة التدريب السريري والجهد المتواصل لطلبة{' '}
                <strong className="text-white">معهد التمريض (دفعة 2026 | التخرج 2027)</strong> من حفلة السكراب الصباحية إلى يوم التتويج بوشاح التخرج التركوازي.
              </p>
            </div>

            {/* Primary & Secondary Action CTAs (Symmetrical 2x2 Grid on Android Mobile) */}
            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1">
              <button
                onClick={() => navigateTo('payments')}
                className="w-full sm:w-auto justify-center px-3 sm:px-6 py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm text-[#10151C] bg-gradient-to-r from-[#35D6C5] to-[#A6F0DF] hover:opacity-95 shadow-xl shadow-[#35D6C5]/25 transition-all active:scale-95 flex items-center gap-1.5 sm:gap-2"
              >
                <Search className="w-4 h-4 shrink-0" />
                <span className="truncate">استعلام عن حسابي</span>
              </button>

              <button
                onClick={() => navigateTo('register')}
                className="w-full sm:w-auto justify-center px-3 sm:px-5 py-3 sm:py-3.5 rounded-xl font-extrabold text-xs sm:text-sm text-white bg-[#1C354A] hover:bg-[#23435d] border border-[#35D6C5]/40 shadow-lg transition-all flex items-center gap-1.5 sm:gap-2"
              >
                <GraduationCap className="w-4 h-4 text-[#35D6C5] shrink-0" />
                <span className="truncate">تسجيل طالب / خريج بالدفعة</span>
              </button>

              <button
                onClick={() => navigateTo('events')}
                className="w-full sm:w-auto justify-center px-3 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-[#E8EEF2] bg-[#142638] hover:bg-[#1C354A] border border-white/15 hover:border-[#35D6C5]/40 transition-all flex items-center gap-1.5 sm:gap-2"
              >
                <Sparkles className="w-4 h-4 text-[#D6B777] shrink-0" />
                <span className="truncate">تفاصيل الحفلات</span>
              </button>

              <button
                onClick={() => {
                  if (currentUser) {
                    navigateTo(
                      currentUser.role === 'admin' || currentUser.role === 'super_admin'
                        ? 'admin_dashboard'
                        : 'graduate_dashboard'
                    );
                  } else {
                    navigateTo('login');
                  }
                }}
                className="w-full sm:w-auto justify-center px-3 sm:px-4 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-[#D6B777] hover:text-white bg-[#D6B777]/10 hover:bg-[#D6B777]/20 border border-[#D6B777]/35 transition-all flex items-center gap-1.5 sm:gap-2"
              >
                <Stethoscope className="w-4 h-4 text-[#D6B777] shrink-0" />
                <span className="truncate">{currentUser ? 'بوابتي الطبية' : 'دخول الخريجين'}</span>
              </button>
            </div>

            {/* Quick Clinical Trust Bar */}
            <div className="pt-1 flex flex-wrap items-center justify-center lg:justify-start gap-x-3 gap-y-1.5 text-[11px] sm:text-xs text-[#E8EEF2]/75">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#35D6C5] shrink-0" />
                <span>استعلام مالي خاص ومحمي بالتحقق من الهوية</span>
              </span>
              <span className="hidden sm:inline text-white/20">•</span>
              <span>سجل دفعات ووصولات موثقة لكل طالب</span>
              <span className="text-white/20">•</span>
              <a
                href={eventConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[#D6B777] hover:underline font-semibold"
              >
                <Instagram className="w-3.5 h-3.5" />
                <span dir="ltr">@uofaon.1</span>
              </a>
            </div>
          </div>

          {/* Left Column: Curated Medical & Graduation Visual Centerpiece */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-6 border border-[#35D6C5]/30 shadow-2xl overflow-hidden">
              {/* Top Mini Status Header inside Visual Frame */}
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3 text-[10px] sm:text-[11px]">
                <span className="flex items-center gap-1.5 text-[#35D6C5] font-bold truncate">
                  <span className="w-2 h-2 rounded-full bg-[#35D6C5] animate-pulse shrink-0" />
                  <span className="truncate">الهوية الطبية والتخرج الأكاديمي</span>
                </span>
                <span className="font-mono text-[#D6B777] font-bold shrink-0">COHORT 2026 • GRAD 2027</span>
              </div>

              {/* Stethoscope Intertwined with Graduation Cap Centerpiece */}
              <div className="flex items-center justify-center py-0.5">
                <StethoscopeGradCapIllustration className="w-full max-w-[230px] sm:max-w-[290px] h-auto" />
              </div>

              {/* Bottom Mini Dual-Identity Strip (Scrubs vs White Coat + Sash) */}
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 sm:gap-2.5 text-right">
                <div
                  onClick={() => navigateTo('scrub_night')}
                  className="cursor-pointer p-2 sm:p-2.5 rounded-xl bg-[#1C354A]/60 border border-[#35D6C5]/30 hover:border-[#35D6C5] transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                    <ScrubUniformCoatIllustration variant="scrub" className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-white truncate">حفلة السكراب</div>
                    <div className="text-[10px] text-[#A6F0DF] truncate">الزي الطبي • 12/12/2026</div>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('official_grad')}
                  className="cursor-pointer p-2 sm:p-2.5 rounded-xl bg-[#142638] border border-[#D6B777]/30 hover:border-[#D6B777] transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0">
                    <ScrubUniformCoatIllustration variant="coat" className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-white truncate">التخرج الرسمي</div>
                    <div className="text-[10px] text-[#D6B777] truncate">الوشاح التركوازي • قريباً</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
