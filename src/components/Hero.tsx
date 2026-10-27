import React from 'react';
import { useApp } from '../context/AppContext';
import { CountdownTimer } from './CountdownTimer';
import {
  StethoscopeGradCapIllustration,
  ScrubUniformCoatIllustration,
} from './MedicalIllustrations';
import {
  GraduationCap,
  CalendarDays,
  Instagram,
  User,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';

export const Hero: React.FC = () => {
  const { navigateTo, currentUser, isAdmin, isModerator, eventConfig } = useApp();

  const verifiedSupervisors = eventConfig.organizers.filter(
    (org) =>
      org.id !== 'org-3' &&
      !org.name.includes('حسين عبدالله جاسم') &&
      !org.name.includes('حسين عبد الله جاسم')
  );

  return (
    <section className="relative overflow-hidden pt-4 pb-10 sm:pt-8 sm:pb-14 clinical-grid-bg border-b border-white/10">
      {/* Ambient Medical Luminescence */}
      <div className="absolute top-1/4 right-1/3 translate-x-1/2 -translate-y-1/2 w-[520px] sm:w-[780px] h-[360px] sm:h-[520px] bg-gradient-to-tr from-[#35D6C5]/12 via-[#1C354A]/30 to-[#D6B777]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
        {/* 1. Prominent Top-of-Home-Page Graduation Countdown Timer */}
        <CountdownTimer />

        {/* 2. Main 2-Column Medical Graduation Hero Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          {/* Right Column (RTL Primary Text, CTAs & Social Icons) */}
          <div className="lg:col-span-7 text-center lg:text-right space-y-4 sm:space-y-5">
            {/* Institution & Cohort Subtitle */}
            <div className="inline-flex flex-wrap items-center justify-center lg:justify-start gap-2 px-3.5 py-1.5 rounded-xl bg-[#142638] border border-[#D6B777]/30">
              <span className="text-xs sm:text-sm font-extrabold text-white">معهد التمريض</span>
              <span className="text-white/25">•</span>
              <span className="text-xs sm:text-sm font-black text-[#35D6C5]">دفعة 2027</span>
              <span className="text-white/25">•</span>
              <span className="text-xs sm:text-sm font-mono font-bold text-[#D6B777]">
                Graduation 2027
              </span>
            </div>

            <div className="space-y-2.5 sm:space-y-3">
              <h1 className="text-2xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.28] sm:leading-[1.18]">
                دفعة 2027 — ملائكة الرحمة{' '}
                <span className="block mt-1 bg-gradient-to-l from-[#35D6C5] via-[#A6F0DF] to-[#D6B777] bg-clip-text text-transparent">
                  نحو التخرج الأكاديمي 2027
                </span>
              </h1>
              <p className="text-xs sm:text-lg text-[#E8EEF2]/90 font-medium max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                بكل فخر واعتزاز برسالة التمريض الإنسانية والعلمية، نحتفي بمسيرة التدريب السريري والجهد المتواصل لطلبة{' '}
                <strong className="text-white">معهد التمريض (دفعة 2027)</strong> من حفلة السكراب الصباحية إلى يوم التتويج بوشاح التخرج التركوازي.
              </p>
            </div>

            {/* Primary Navigation CTAs Matching the 4 Core Destinations */}
            <div className="grid grid-cols-1 sm:grid-cols-3 items-center justify-center lg:justify-start gap-2.5 sm:gap-3 pt-1">
              <button
                onClick={() => navigateTo('payments')}
                className="w-full justify-center px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-black text-xs sm:text-sm text-[#10151C] bg-gradient-to-r from-[#35D6C5] to-[#A6F0DF] hover:opacity-95 shadow-lg shadow-[#35D6C5]/20 transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
              >
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span className="truncate">الدفعات والاستعلام</span>
              </button>

              <button
                onClick={() => navigateTo('events')}
                className="w-full justify-center px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-[#E8EEF2] bg-[#142638] hover:bg-[#1C354A] border border-white/15 hover:border-[#35D6C5]/40 transition-all flex items-center gap-2 cursor-pointer"
              >
                <CalendarDays className="w-4 h-4 text-[#35D6C5] shrink-0" />
                <span className="truncate">تفاصيل الحفلات</span>
              </button>

              <button
                onClick={() => {
                  if (currentUser) {
                    navigateTo(
                      isAdmin || isModerator
                        ? 'admin_dashboard'
                        : 'graduate_dashboard'
                    );
                  } else {
                    navigateTo('login');
                  }
                }}
                className="w-full justify-center px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl font-bold text-xs sm:text-sm text-[#D6B777] hover:text-white bg-[#D6B777]/10 hover:bg-[#D6B777]/20 border border-[#D6B777]/35 transition-all flex items-center gap-2 cursor-pointer"
              >
                <User className="w-4 h-4 shrink-0" />
                <span className="truncate">{currentUser ? 'حسابي' : 'الدخول'}</span>
              </button>
            </div>

            {/* Verified Social Media Icons & Links */}
            <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-2.5 text-xs">
              <a
                href={eventConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="حساب دفعة التمريض 2027 على إنستغرام"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-[#101827]/90 hover:bg-[#1C354A] border border-[#D6B777]/35 text-[#F4F8FC] hover:text-[#D6B777] transition-all shadow-md"
              >
                <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shrink-0">
                  <Instagram className="w-3.5 h-3.5" />
                </span>
                <span className="font-bold text-[11px] sm:text-xs">انستغرام الدفعة</span>
                <span className="font-mono text-[11px] text-[#D6B777]" dir="ltr">
                  @uofaon.1
                </span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>

              {verifiedSupervisors.map((sup) => {
                const handle = sup.instagram
                  ? sup.instagram.replace(/\/$/, '').split('/').pop()
                  : '';
                return (
                  <a
                    key={sup.id}
                    href={sup.instagram || eventConfig.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`انستغرام ${sup.name}`}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-[#35D6C5]/15 border border-white/10 hover:border-[#35D6C5]/40 text-xs text-[#E8EEF2] hover:text-[#35D6C5] transition-all"
                  >
                    <Instagram className="w-3.5 h-3.5 text-[#35D6C5]" />
                    <span className="font-bold">{sup.name}</span>
                    {handle && (
                      <span className="font-mono text-[10px] text-slate-400" dir="ltr">
                        @{handle}
                      </span>
                    )}
                  </a>
                );
              })}
            </div>
          </div>

          {/* Left Column: Curated Medical & Graduation Visual Centerpiece */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-md rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-6 border border-[#35D6C5]/30 shadow-2xl overflow-hidden">
              <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2.5 mb-3 text-[10px] sm:text-[11px]">
                <span className="text-[#35D6C5] font-bold truncate flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>الهوية الطبية والتخرج الأكاديمي</span>
                </span>
                <span className="font-mono text-[#D6B777] font-bold shrink-0">COHORT 2027</span>
              </div>

              {/* Stethoscope Intertwined with Graduation Cap Centerpiece */}
              <div className="flex items-center justify-center py-0.5">
                <StethoscopeGradCapIllustration className="w-full max-w-[220px] sm:max-w-[270px] h-auto" />
              </div>

              {/* Bottom Mini Dual-Identity Strip */}
              <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 sm:gap-2.5 text-right">
                <div
                  onClick={() => navigateTo('scrub_night')}
                  className="cursor-pointer p-2.5 rounded-xl bg-[#1C354A]/60 border border-[#35D6C5]/30 hover:border-[#35D6C5] transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 shrink-0">
                    <ScrubUniformCoatIllustration variant="scrub" className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-white truncate">حفلة السكراب</div>
                    <div className="text-[10px] text-[#A6F0DF] truncate">12/12/2026</div>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('official_grad')}
                  className="cursor-pointer p-2.5 rounded-xl bg-[#142638] border border-[#5CE1E6]/30 hover:border-[#5CE1E6] transition-colors flex items-center gap-2"
                >
                  <div className="w-8 h-8 shrink-0">
                    <ScrubUniformCoatIllustration variant="coat" className="w-full h-full" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-extrabold text-white truncate">التخرج الرسمي</div>
                    <div className="text-[10px] text-[#5CE1E6] truncate">الوشاح التركوازي</div>
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
