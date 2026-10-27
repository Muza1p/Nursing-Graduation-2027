import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  StethoscopeSymbol,
  SyringeSymbol,
  CannulaSymbol,
  MedicalNeedleSymbol,
  IvDripSymbol,
  NurseCapSymbol,
  GraduationCapSymbol,
  DiplomaSymbol,
  NursingScrubsSymbol,
  MedicalCrossSymbol,
} from './AnimatedMedicalBackground';
import {
  Clock,
  Sparkles,
  Calendar,
  MapPin,
} from 'lucide-react';

// Fixed Event Configuration Source of Truth:
// Date: 2026-12-12 | Time: 09:00:00 AM | Iraq Time (UTC+03:00)
const FIXED_EVENT_DATE = '2026-12-12';
const FIXED_EVENT_TIME = '09:00:00';
const FIXED_IRAQ_ISO = '2026-12-12T09:00:00+03:00';
const FIXED_TARGET_TIMESTAMP = new Date(FIXED_IRAQ_ISO).getTime();

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCompleted: boolean;
}

/**
 * Parses a date and time string strictly in Iraq local time (UTC+03:00),
 * falling back to 2026-12-12T09:00:00+03:00 if missing or invalid.
 */
function parseIraqTargetTimestamp(dateInput?: string, timeInput?: string): number {
  const rawDate = (dateInput || FIXED_EVENT_DATE).trim();
  const rawTime = (timeInput || FIXED_EVENT_TIME).trim();

  let year = 2026;
  let month = 12;
  let day = 12;

  const isoDateMatch = rawDate.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  const slashDateMatch = rawDate.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (isoDateMatch) {
    year = Number(isoDateMatch[1]);
    month = Number(isoDateMatch[2]);
    day = Number(isoDateMatch[3]);
  } else if (slashDateMatch) {
    day = Number(slashDateMatch[1]);
    month = Number(slashDateMatch[2]);
    year = Number(slashDateMatch[3]);
  }

  let hours = 9;
  let minutes = 0;
  let seconds = 0;

  const timeMatch = rawTime.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM|am|pm)?$/);
  if (timeMatch) {
    hours = Number(timeMatch[1]);
    minutes = Number(timeMatch[2]);
    seconds = timeMatch[3] ? Number(timeMatch[3]) : 0;
    const meridiem = timeMatch[4]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
  }

  const yyyy = String(year).padStart(4, '0');
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const min = String(minutes).padStart(2, '0');
  const ss = String(seconds).padStart(2, '0');

  // Iraq local time is permanently UTC+03:00 (no DST)
  const iraqIso = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+03:00`;
  const parsedMs = new Date(iraqIso).getTime();

  if (Number.isNaN(parsedMs)) {
    return FIXED_TARGET_TIMESTAMP;
  }
  return parsedMs;
}

/**
 * Calculates remaining days, hours, minutes, and seconds from targetMs - Date.now().
 * Prevents any negative values.
 */
function calculateRemainingTime(targetMs: number): CountdownState {
  const nowMs = Date.now();
  const difference = targetMs - nowMs;

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isCompleted: true,
    };
  }

  const days = Math.max(0, Math.floor(difference / (1000 * 60 * 60 * 24)));
  const hours = Math.max(0, Math.floor((difference / (1000 * 60 * 60)) % 24));
  const minutes = Math.max(0, Math.floor((difference / (1000 * 60)) % 60));
  const seconds = Math.max(0, Math.floor((difference / 1000) % 60));

  return {
    days,
    hours,
    minutes,
    seconds,
    isCompleted: false,
  };
}

export const CountdownTimer: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { eventConfig } = useApp();

  const targetDateStr = eventConfig?.countdownDate || FIXED_EVENT_DATE;
  const targetTimeStr = eventConfig?.countdownTime || FIXED_EVENT_TIME;
  const targetTimestamp = parseIraqTargetTimestamp(targetDateStr, targetTimeStr);

  const [timeLeft, setTimeLeft] = useState<CountdownState>(() =>
    calculateRemainingTime(targetTimestamp)
  );

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(calculateRemainingTime(targetTimestamp));
    };

    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetTimestamp]);

  // Arabic unit labels with individual medical-graduation motif icons
  const timeUnits = [
    {
      label: 'الأيام',
      value: timeLeft.days,
      color: '#35D6C5',
      border: 'border-[#35D6C5]/45',
      glow: 'shadow-[0_0_22px_-6px_rgba(53,214,197,0.4)]',
      Motif: GraduationCapSymbol,
      motifLabel: 'قبعة التخرج',
    },
    {
      label: 'الساعات',
      value: timeLeft.hours,
      color: '#5CE1E6',
      border: 'border-[#5CE1E6]/45',
      glow: 'shadow-[0_0_22px_-6px_rgba(92,225,230,0.4)]',
      Motif: NursingScrubsSymbol,
      motifLabel: 'السكراب الطبي',
    },
    {
      label: 'الدقائق',
      value: timeLeft.minutes,
      color: '#A6F0DF',
      border: 'border-[#A6F0DF]/45',
      glow: 'shadow-[0_0_22px_-6px_rgba(166,240,223,0.35)]',
      Motif: DiplomaSymbol,
      motifLabel: 'شهادة التخرج',
    },
    {
      label: 'الثواني',
      value: timeLeft.seconds,
      color: '#35D6C5',
      border: 'border-[#35D6C5]/55',
      glow: 'shadow-[0_0_24px_-5px_rgba(53,214,197,0.5)]',
      Motif: NurseCapSymbol,
      motifLabel: 'قبعة التمريض',
    },
  ];

  // Compact mode (used inside event sub-headers)
  if (compact) {
    if (timeLeft.isCompleted) {
      return (
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#142638] border border-[#35D6C5]/40 text-sm font-black text-[#35D6C5]">
          <Sparkles className="w-4 h-4" />
          <span>بدأ الحفل</span>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-center gap-2 text-center">
        {timeUnits.map((unit, idx) => (
          <div
            key={idx}
            className="flex flex-col items-center bg-[#142638]/90 border border-[#35D6C5]/30 rounded-xl px-3 py-1.5 min-w-[60px]"
          >
            <span
              className="text-base font-black font-mono leading-none"
              style={{ color: unit.color }}
            >
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-[#E8EEF2] font-bold mt-1">{unit.label}</span>
          </div>
        ))}
      </div>
    );
  }

  const displayTitle = (
    eventConfig?.countdownTitle ||
    'العد التنازلي لحفلة السكراب — معهد التمريض (دفعة 2027)'
  ).replace(/دفعة 2026/g, 'دفعة 2027');

  const displayLocation =
    eventConfig?.countdownLocation ||
    `${eventConfig?.scrubVenue || 'مسرح تفاحة المصور'} — المصور ${eventConfig?.scrubPhotographer || 'باقر حسن'}`;

  // Target reached -> Display "بدأ الحفل" inside the medical frame
  if (timeLeft.isCompleted) {
    return (
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#0E1A2B]/95 via-[#13263B]/95 to-[#0A121E]/95 border-2 border-[#35D6C5]/50 p-6 sm:p-8 text-center shadow-[0_0_45px_-10px_rgba(53,214,197,0.4)]">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#35D6C5]/20 border border-[#35D6C5]/40 text-[#35D6C5] mb-3">
          <Sparkles className="w-7 h-7" />
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">
          بدأ الحفل
        </h2>
        <p className="text-xs sm:text-base text-[#A6F0DF] font-bold max-w-xl mx-auto">
          مبارك لخريجي معهد التمريض (دفعة 2027) — نتمنى لكم يوماً خالداً يليق برسالة التمريض الإنسانية.
        </p>
        <div className="mt-5 grid grid-cols-4 gap-2 sm:gap-3 max-w-md mx-auto">
          {timeUnits.map((unit, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#0A121E]/90 border border-[#35D6C5]/40"
            >
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#35D6C5]">00</span>
              <span className="text-[11px] font-bold text-[#E8EEF2] mt-1">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full Decorated Medical & Graduation Framed Countdown
  return (
    <div className="relative rounded-3xl p-[2px] bg-gradient-to-r from-[#35D6C5]/70 via-[#5CE1E6]/50 to-[#35D6C5]/70 shadow-[0_0_48px_-8px_rgba(53,214,197,0.38)] transition-all">
      {/* Main Inner Framed Container */}
      <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-b from-[#0D1828]/96 via-[#122438]/95 to-[#0A111C]/98 px-3.5 py-5 sm:px-7 sm:py-7">
        {/* Background Ambient Medical Glows */}
        <div className="pointer-events-none absolute -top-16 right-1/4 w-64 h-36 bg-[#35D6C5]/15 rounded-full blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/4 w-64 h-36 bg-[#5CE1E6]/12 rounded-full blur-3xl" />

        {/* ================================================================= */}
        {/* TOP MEDICAL & GRADUATION ORNAMENTAL FRAME BORDER                  */}
        {/* ================================================================= */}
        <div
          className="relative z-10 flex items-center justify-between gap-1.5 sm:gap-3 pb-3.5 mb-4 border-b border-[#35D6C5]/25 select-none pointer-events-none"
          aria-hidden="true"
        >
          {/* Right Corner Cluster (RTL Start): Stethoscope + Cannula + Nurse Cap */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[#35D6C5]">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#35D6C5]/12 border border-[#35D6C5]/35 flex items-center justify-center shadow-sm">
              <StethoscopeSymbol className="w-4 h-4 sm:w-5 sm:h-5 text-[#35D6C5]" />
            </div>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#5CE1E6]/10 border border-[#5CE1E6]/30 flex items-center justify-center">
              <CannulaSymbol className="w-4 h-4 text-[#5CE1E6]" />
            </div>
            <div className="hidden xs:flex w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#A6F0DF]/10 border border-[#A6F0DF]/30 items-center justify-center">
              <NurseCapSymbol className="w-4 h-4 text-[#A6F0DF]" />
            </div>
          </div>

          {/* Center Top Animated ECG Heartbeat Line + Crown Emblem */}
          <div className="flex-1 flex items-center justify-center gap-2 min-w-0">
            <svg viewBox="0 0 180 28" fill="none" className="hidden sm:block w-28 md:w-40 h-5 text-[#35D6C5]">
              <path
                d="M0 14 H55 L63 7 L71 23 L80 4 L89 24 L96 11 L103 14 H180"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="med-ecg-sweep"
              />
            </svg>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#13293D] border border-[#35D6C5]/45 shadow-[0_0_15px_rgba(53,214,197,0.25)] shrink-0">
              <GraduationCapSymbol className="w-4 h-4 sm:w-5 sm:h-5 text-[#35D6C5]" />
              <span className="text-[10px] sm:text-xs font-black tracking-wide text-white">
                إطار التخرج التمريضي • دفعة 2027
              </span>
              <NursingScrubsSymbol className="w-4 h-4 sm:w-5 sm:h-5 text-[#5CE1E6]" />
            </div>

            <svg viewBox="0 0 180 28" fill="none" className="hidden sm:block w-28 md:w-40 h-5 text-[#5CE1E6]">
              <path
                d="M0 14 H77 L84 11 L91 24 L100 4 L109 23 L117 7 L125 14 H180"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="med-ecg-sweep"
              />
            </svg>
          </div>

          {/* Left Corner Cluster (RTL End): Diploma + Syringe + IV Drip */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 text-[#5CE1E6]">
            <div className="hidden xs:flex w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#A6F0DF]/10 border border-[#A6F0DF]/30 items-center justify-center">
              <DiplomaSymbol className="w-4 h-4 text-[#A6F0DF]" />
            </div>
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#5CE1E6]/10 border border-[#5CE1E6]/30 flex items-center justify-center">
              <SyringeSymbol className="w-4 h-4 text-[#5CE1E6]" />
            </div>
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-[#35D6C5]/12 border border-[#35D6C5]/35 flex items-center justify-center shadow-sm">
              <IvDripSymbol className="w-4 h-4 sm:w-5 sm:h-5 text-[#35D6C5]" />
            </div>
          </div>
        </div>

        {/* Left & Right Vertical Medical Frame Accents (Desktop/Tablet) */}
        <div
          className="hidden xl:flex flex-col justify-between items-center absolute inset-y-16 right-2.5 w-6 py-4 text-[#35D6C5]/40 pointer-events-none select-none"
          aria-hidden="true"
        >
          <MedicalNeedleSymbol className="w-4 h-4" />
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#35D6C5]/40 via-[#5CE1E6]/20 to-transparent" />
          <MedicalCrossSymbol className="w-4 h-4" />
        </div>
        <div
          className="hidden xl:flex flex-col justify-between items-center absolute inset-y-16 left-2.5 w-6 py-4 text-[#5CE1E6]/40 pointer-events-none select-none"
          aria-hidden="true"
        >
          <MedicalCrossSymbol className="w-4 h-4" />
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#5CE1E6]/40 via-[#35D6C5]/20 to-transparent" />
          <MedicalNeedleSymbol className="w-4 h-4" />
        </div>

        {/* ================================================================= */}
        {/* MAIN COUNTDOWN CONTENT & 4 DECORATED NUMBER CONTAINERS            */}
        {/* ================================================================= */}
        <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-5 sm:gap-6 text-center lg:text-right xl:px-4">
          {/* Right Side: Event Title, Date & Location */}
          <div className="space-y-2.5 flex-1 w-full">
            <h2 className="text-base sm:text-2xl font-black text-white tracking-tight leading-snug">
              {displayTitle}
            </h2>

            <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-x-4 sm:gap-y-2 text-[11px] sm:text-xs text-[#E8EEF2] pt-0.5">
              <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 font-bold bg-[#0A121E]/80 px-3 py-1.5 rounded-xl border border-[#35D6C5]/25">
                <Calendar className="w-3.5 h-3.5 text-[#35D6C5] shrink-0" />
                <span className="truncate">
                  التاريخ:{' '}
                  <strong className="font-mono text-[#A6F0DF]">
                    {eventConfig?.scrubPartyDateDisplay || '12/12/2026'}
                  </strong>
                </span>
              </span>

              <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 font-bold bg-[#0A121E]/80 px-3 py-1.5 rounded-xl border border-[#5CE1E6]/25">
                <Clock className="w-3.5 h-3.5 text-[#5CE1E6] shrink-0" />
                <span className="truncate">
                  التوقيت:{' '}
                  <strong className="text-[#5CE1E6]">09:00 صباحاً</strong>
                </span>
              </span>

              {displayLocation && (
                <span className="col-span-2 sm:col-span-1 inline-flex items-center justify-center sm:justify-start gap-1.5 font-bold bg-[#0A121E]/80 px-3 py-1.5 rounded-xl border border-white/10">
                  <MapPin className="w-3.5 h-3.5 text-[#35D6C5] shrink-0" />
                  <span className="truncate">{displayLocation}</span>
                </span>
              )}
            </div>
          </div>

          {/* Left Side: 4 Decorated Countdown Number Cards (الأيام | الساعات | الدقائق | الثواني) */}
          <div className="w-full lg:w-auto flex flex-col items-center lg:items-end">
            <div
              className="grid grid-cols-4 gap-2 sm:gap-3.5 w-full sm:w-auto"
              data-testid="graduation-countdown-grid"
            >
              {timeUnits.map((unit, index) => {
                const MotifIcon = unit.Motif;
                return (
                  <div
                    key={index}
                    className={`group relative flex flex-col items-center justify-between pt-3 pb-2.5 px-2 sm:px-4 sm:py-3.5 rounded-2xl bg-gradient-to-b from-[#152C44]/95 via-[#0F2032]/95 to-[#09131F]/95 border ${unit.border} ${unit.glow} min-w-0 sm:min-w-[96px] overflow-hidden transition-transform duration-300 hover:-translate-y-0.5`}
                  >
                    {/* Top Corner Subtle Medical/Graduation Cap/Scrub Motif Badge */}
                    <div className="w-full flex items-center justify-between px-0.5 mb-1 opacity-80">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#35D6C5]" />
                      <MotifIcon className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#5CE1E6]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-[#5CE1E6]" />
                    </div>

                    {/* Watermark Motif inside Number Container */}
                    <div
                      className="pointer-events-none absolute -bottom-2 -left-2 opacity-[0.07] text-[#35D6C5]"
                      aria-hidden="true"
                    >
                      <MotifIcon className="w-12 h-12 sm:w-14 sm:h-14" />
                    </div>

                    {/* Large Clear Countdown Number */}
                    <span
                      data-testid={`countdown-value-${index}`}
                      className="relative z-10 text-2xl sm:text-4xl font-black font-mono tracking-tight leading-none drop-shadow-[0_2px_10px_rgba(53,214,197,0.3)] transition-all duration-300"
                      style={{ color: unit.color }}
                    >
                      {String(unit.value).padStart(2, '0')}
                    </span>

                    {/* Unit Label */}
                    <span className="relative z-10 text-[11px] sm:text-xs text-white font-extrabold mt-1.5 tracking-wide">
                      {unit.label}
                    </span>

                    {/* Bottom Glowing Turquoise Accent Strip */}
                    <div className="w-8 sm:w-12 h-[2px] rounded-full bg-gradient-to-r from-transparent via-[#35D6C5] to-transparent mt-1.5 opacity-75" />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BOTTOM MEDICAL & GRADUATION ORNAMENTAL FRAME BORDER               */}
        {/* ================================================================= */}
        <div
          className="relative z-10 flex items-center justify-between gap-2 pt-3.5 mt-4 border-t border-[#35D6C5]/20 text-[#35D6C5]/75 select-none pointer-events-none"
          aria-hidden="true"
        >
          {/* Right Bottom Corner: Syringe + Medical Needle + Scrubs */}
          <div className="flex items-center gap-2">
            <MedicalNeedleSymbol className="w-4 h-4 text-[#5CE1E6]" />
            <NursingScrubsSymbol className="w-4 h-4 text-[#35D6C5]" />
            <span className="hidden sm:inline text-[10px] font-bold text-[#A6F0DF]/80">
              التمريض السريري • السكراب الطبي
            </span>
          </div>

          {/* Center Continuous ECG Pulse Line */}
          <div className="flex-1 max-w-xs sm:max-w-md mx-auto h-4 flex items-center">
            <svg viewBox="0 0 400 24" fill="none" className="w-full h-full">
              <path
                d="M0 12 H120 L132 6 L142 20 L154 2 L166 22 L176 9 L186 12 H220 L232 6 L242 20 L254 3 L266 21 L276 9 L286 12 H400"
                stroke="#35D6C5"
                strokeOpacity="0.6"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="med-ecg-sweep"
              />
            </svg>
          </div>

          {/* Left Bottom Corner: Graduation Cap + Diploma + Stethoscope */}
          <div className="flex items-center gap-2">
            <span className="hidden sm:inline text-[10px] font-bold text-[#A6F0DF]/80">
              شهادة التخرج • 2027
            </span>
            <DiplomaSymbol className="w-4 h-4 text-[#5CE1E6]" />
            <GraduationCapSymbol className="w-4 h-4 text-[#35D6C5]" />
          </div>
        </div>
      </div>
    </div>
  );
};
