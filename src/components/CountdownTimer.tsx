import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AnimatedEcgWaveform } from './MedicalIllustrations';
import {
  Clock,
  Sparkles,
  Calendar,
  MapPin,
  Stethoscope,
  CheckCircle2,
  Camera,
} from 'lucide-react';

// Fixed Event Configuration Source of Truth:
// Date: 2026-12-12 | Time: 09:00:00 AM | Timezone: Asia/Baghdad (UTC+03:00)
const FIXED_EVENT_DATE = '2026-12-12';
const FIXED_EVENT_TIME = '09:00:00';
const FIXED_EVENT_TIMEZONE = 'Asia/Baghdad';
const FIXED_BAGHDAD_ISO = '2026-12-12T09:00:00+03:00';
const FIXED_TARGET_TIMESTAMP = new Date(FIXED_BAGHDAD_ISO).getTime();

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isCompleted: boolean;
}

/**
 * Parses a date and time string strictly in Asia/Baghdad local time (UTC+03:00),
 * falling back to 2026-12-12T09:00:00+03:00 if missing or invalid.
 */
function parseBaghdadTargetTimestamp(dateInput?: string, timeInput?: string): number {
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

  // Asia/Baghdad is permanently UTC+03:00 (no DST)
  const baghdadIso = `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}+03:00`;
  const parsedMs = new Date(baghdadIso).getTime();

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
  const targetTimestamp = parseBaghdadTargetTimestamp(targetDateStr, targetTimeStr);

  // Initialize countdown state immediately on mount using the fixed Baghdad target timestamp
  const [timeLeft, setTimeLeft] = useState<CountdownState>(() =>
    calculateRemainingTime(targetTimestamp)
  );

  useEffect(() => {
    const updateCountdown = () => {
      setTimeLeft(calculateRemainingTime(targetTimestamp));
    };

    // Run immediately on mount/update, then every second
    updateCountdown();
    const intervalId = window.setInterval(updateCountdown, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [targetTimestamp]);

  // Arabic unit labels: الأيام | الساعات | الدقائق | الثواني
  const timeUnits = [
    { label: 'الأيام', value: timeLeft.days, color: '#35D6C5', border: 'border-[#35D6C5]/35' },
    { label: 'الساعات', value: timeLeft.hours, color: '#A6F0DF', border: 'border-[#A6F0DF]/35' },
    { label: 'الدقائق', value: timeLeft.minutes, color: '#35D6C5', border: 'border-[#35D6C5]/35' },
    { label: 'الثواني', value: timeLeft.seconds, color: '#D6B777', border: 'border-[#D6B777]/35' },
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
            className="flex flex-col items-center bg-[#142638]/90 border border-white/15 rounded-xl px-3 py-1.5 min-w-[60px]"
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

  const styleVariant = eventConfig?.countdownStyle || 'medical_turquoise';
  const containerStyleClass =
    styleVariant === 'champagne_gold'
      ? 'glass-panel-gold border-[#D6B777]/40'
      : styleVariant === 'clinical_navy'
      ? 'glass-panel border-[#35D6C5]/25'
      : 'glass-panel-turquoise border-[#35D6C5]/40';

  // Target reached -> Display "بدأ الحفل"
  if (timeLeft.isCompleted) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl ${containerStyleClass} p-6 sm:p-8 text-center glow-turquoise`}
      >
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
              className="flex flex-col items-center justify-center p-3 rounded-2xl bg-[#10151C]/90 border border-[#35D6C5]/35"
            >
              <span className="text-2xl sm:text-3xl font-black font-mono text-[#35D6C5]">00</span>
              <span className="text-[11px] font-bold text-[#E8EEF2] mt-1">{unit.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Live numeric countdown in the future
  return (
    <div
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl ${containerStyleClass} p-4 sm:p-7 shadow-2xl transition-all`}
    >
      {/* Subtle Medical Glow & ECG Line */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#35D6C5]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-[#D6B777]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-2 inset-x-0 pointer-events-none">
        <AnimatedEcgWaveform color="#35D6C5" opacity="opacity-15" className="w-full h-8" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6 text-center lg:text-right">
        {/* Right Side: Event Identity, Date, Location & Timezone Badge */}
        <div className="space-y-2.5 flex-1 w-full">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-1.5 sm:gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-[#35D6C5]/15 border border-[#35D6C5]/35 text-[#35D6C5] text-[11px] sm:text-xs font-extrabold">
              <Stethoscope className="w-3.5 h-3.5 shrink-0" />
              <span>معهد التمريض • دفعة 2027</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/35 text-[#A6F0DF] text-[11px] sm:text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#35D6C5] shrink-0" />
              <span>التوقيت المعتمد</span>
            </span>
          </div>

          <h2 className="text-base sm:text-2xl font-black text-white tracking-tight leading-snug">
            {displayTitle}
          </h2>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center lg:justify-start gap-2 sm:gap-x-4 sm:gap-y-1.5 text-[11px] sm:text-xs text-[#E8EEF2] pt-0.5">
            <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 font-bold bg-[#10151C]/50 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
              <Calendar className="w-3.5 h-3.5 text-[#35D6C5] shrink-0" />
              <span className="truncate">
                التاريخ:{' '}
                <strong className="font-mono text-[#A6F0DF]">
                  {eventConfig?.scrubPartyDateDisplay || '12/12/2026'}
                </strong>
              </span>
            </span>

            <span className="inline-flex items-center justify-center sm:justify-start gap-1.5 font-bold bg-[#10151C]/50 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
              <Clock className="w-3.5 h-3.5 text-[#D6B777] shrink-0" />
              <span className="truncate">
                التوقيت:{' '}
                <strong className="text-[#D6B777]">09:00 صباحاً (بتوقيت بغداد)</strong>
              </span>
            </span>

            {displayLocation && (
              <span className="col-span-2 sm:col-span-1 inline-flex items-center justify-center sm:justify-start gap-1.5 font-bold bg-[#10151C]/50 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
                <MapPin className="w-3.5 h-3.5 text-[#35D6C5] shrink-0" />
                <span className="truncate">{displayLocation}</span>
              </span>
            )}

            <span className="col-span-2 sm:col-span-1 inline-flex items-center justify-center sm:justify-start gap-1.5 font-bold text-[#A6F0DF] bg-[#10151C]/50 sm:bg-transparent px-2.5 py-1.5 sm:p-0 rounded-xl border border-white/5 sm:border-0">
              <Camera className="w-3.5 h-3.5 text-[#35D6C5] shrink-0" />
              <span>المصور: {eventConfig?.scrubPhotographer || 'باقر حسن'}</span>
            </span>
          </div>
        </div>

        {/* Left Side: 4 Countdown Units (الأيام | الساعات | الدقائق | الثواني) */}
        <div className="w-full lg:w-auto flex flex-col items-center lg:items-end">
          <div className="grid grid-cols-4 gap-2 sm:gap-3 w-full sm:w-auto" data-testid="graduation-countdown-grid">
            {timeUnits.map((unit, index) => (
              <div
                key={index}
                className={`relative flex flex-col items-center justify-center py-2.5 px-2 sm:p-4 rounded-2xl bg-gradient-to-b from-[#142638] to-[#10151C] border ${unit.border} shadow-lg min-w-0 sm:min-w-[88px]`}
              >
                <span
                  data-testid={`countdown-value-${index}`}
                  className="text-xl sm:text-4xl font-black font-mono tracking-tight leading-none"
                  style={{ color: unit.color }}
                >
                  {String(unit.value).padStart(2, '0')}
                </span>
                <span className="text-[10px] sm:text-xs text-[#E8EEF2] font-extrabold mt-1 sm:mt-1.5">
                  {unit.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

