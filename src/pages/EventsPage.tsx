import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  ScrubUniformCoatIllustration,
  AnatomicalHeartMedalIllustration,
  AnimatedEcgWaveform,
} from '../components/MedicalIllustrations';
import { formatIQD } from '../services/storage';
import {
  Sparkles,
  Calendar,
  MapPin,
  Shirt,
  CreditCard,
  GraduationCap,
  Award,
  AlertCircle,
  Building,
  ShieldCheck,
  Camera,
  Sun,
} from 'lucide-react';

export const EventsPage: React.FC = () => {
  const { eventConfig, navigateTo, announcements } = useApp();
  const [selectedEvent, setSelectedEvent] = useState<'scrub' | 'grad'>('scrub');

  const scrubAnnouncements = announcements.filter(
    (a) => a.category === 'scrub_night' && a.status === 'published'
  );
  const gradAnnouncements = announcements.filter(
    (a) => a.category === 'official_grad' && a.status === 'published'
  );

  return (
    <div className="py-6 sm:py-10 space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
      {/* Page Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#101B2C] border border-white/10 text-xs font-bold text-[#F4F8FC]">
          <Calendar className="w-3.5 h-3.5 text-[#35D6C2]" />
          <span>معهد التمريض — دفعة 2027</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-[#F4F8FC]">
          الحفلات والمناسبات الرسمية للدفعة
        </h1>
        <p className="text-xs sm:text-sm text-slate-300">
          اختر الفعالية لاستعراض الهوية البصرية، المواعيد، القاعات، والرسوم المقررة لكل مناسبة.
        </p>

        {/* Segmented Event Switcher */}
        <div className="p-1.5 rounded-2xl bg-[#101B2C] border border-white/12 flex max-w-md mx-auto mt-4 shadow-xl">
          <button
            onClick={() => setSelectedEvent('scrub')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              selectedEvent === 'scrub'
                ? 'bg-[#342A78] text-white shadow-lg shadow-[#342A78]/50 border border-indigo-400/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#D7B875]" />
            <span>حفلة السكراب (12/12/2026)</span>
          </button>

          <button
            onClick={() => setSelectedEvent('grad')}
            className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
              selectedEvent === 'grad'
                ? 'bg-gradient-to-r from-[#35D6C2] to-[#24B8A5] text-[#0A0D12] shadow-lg shadow-[#35D6C2]/25 font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>حفل التخرج الرسمي (قريباً)</span>
          </button>
        </div>
      </div>

      {/* 1. SCRUBS GRADUATION CONTENT (#342A78 Midnight Indigo & Medical Scrubs) */}
      {selectedEvent === 'scrub' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#342A78] via-[#151836] to-[#0A0D12] border-2 border-indigo-400/40 p-6 sm:p-10 shadow-2xl clinical-grid-indigo">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-indigo-500/20 text-indigo-200 border border-indigo-400/40 text-xs font-bold">
                  <Sun className="w-3.5 h-3.5 text-[#D7B875]" />
                  <span>حفل صباحي — {eventConfig.scrubEventName || 'حفلة السكراب'}</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#F4F8FC]">
                  حفلة السكراب لمعهد التمريض
                </h2>
                <p className="text-xs sm:text-sm text-indigo-100/85 max-w-xl leading-relaxed">
                  الاحتفالية الصباحية لطلبة معهد التمريض (دفعة 2027) بالزي الطبي والسكراب السريري الموحد، في مسرح تفاحة المصور وبإشراف المصور باقر حسن.
                </p>

                <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
                  <span className="flex items-center gap-1.5 text-white bg-[#0A0D12]/70 px-3 py-1.5 rounded-xl border border-indigo-400/30 font-bold">
                    <Calendar className="w-3.5 h-3.5 text-[#35D6C2]" />
                    <span>الموعد المقرر: {eventConfig.scrubPartyDateDisplay || '12/12/2026'}</span>
                  </span>

                  <span className="flex items-center gap-1.5 text-white bg-[#0A0D12]/70 px-3 py-1.5 rounded-xl border border-indigo-400/30">
                    <MapPin className="w-3.5 h-3.5 text-[#D7B875]" />
                    <span>المكان: {eventConfig.scrubVenue || 'مسرح تفاحة المصور'}</span>
                  </span>

                  <span className="flex items-center gap-1.5 text-white bg-[#0A0D12]/70 px-3 py-1.5 rounded-xl border border-indigo-400/30">
                    <Camera className="w-3.5 h-3.5 text-[#35D6C2]" />
                    <span>المصور: {eventConfig.scrubPhotographer || 'باقر حسن'}</span>
                  </span>

                  <span className="flex items-center gap-1.5 text-[#D6B777] bg-[#10151C]/80 px-3 py-1.5 rounded-xl border border-[#D6B777]/40 font-bold">
                    <CreditCard className="w-3.5 h-3.5 text-[#D6B777]" />
                    <span>نظام دفعات ووصولات موثقة</span>
                  </span>
                </div>
              </div>

              {/* Curated Scrub Illustration Card */}
              <div className="shrink-0 p-5 rounded-2xl bg-[#0A0D12]/80 border border-indigo-400/35 text-center min-w-[220px] space-y-2">
                <ScrubUniformCoatIllustration variant="scrub" className="w-36 h-36 mx-auto" />
                <div className="text-xs text-[#35D6C2] font-bold">الزي الطبي المعتمد</div>
                <div className="text-sm font-black text-white">السكراب الطبي + السماعة</div>
                <div className="pt-2 border-t border-white/10 text-xs">
                  <span className="text-slate-400 block text-[11px]">التوقيت الصباحي:</span>
                  <span className="font-bold text-[#D7B875]">
                    {eventConfig.scrubTime || 'الوقت يُعلن لاحقاً'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Live Countdown */}
          <div className="max-w-4xl mx-auto">
            <CountdownTimer />
          </div>

          {/* Detailed Cards for Scrub Night */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#101B2C] border border-indigo-400/25 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#342A78] text-indigo-200 flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#F4F8FC]">قاعة الحفل المعتمدة</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {eventConfig.scrubVenue || 'مسرح تفاحة المصور'} — مجهز بالكامل لاستقبال خريجي معهد التمريض دفعة 2027.
              </p>
            </div>

            <div className="rounded-2xl bg-[#101B2C] border border-indigo-400/25 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#342A78] text-indigo-200 flex items-center justify-center">
                <Camera className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#F4F8FC]">التوثيق الفوتوغرافي</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                لقطات فردية وجماعية احترافية بالزي الطبي بعدسة المصور {eventConfig.scrubPhotographer || 'باقر حسن'}.
              </p>
            </div>

            <div className="rounded-2xl bg-[#101B2C] border border-indigo-400/25 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#342A78] text-indigo-200 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-white">توثيق الدفعات وإيصال القبض</h4>
              <p className="text-xs text-[#E8EEF2]/80 leading-relaxed">
                يتم توثيق العربون والدفعات عبر اللجنة المالية مع إصدار وصل فوري وإمكانية الاستعلام الخاص عن المبلغ المدفوع والمتبقي.
              </p>
            </div>
          </div>

          {scrubAnnouncements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#F4F8FC] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D7B875]" />
                <span>إعلانات وتحديثات حفلة السكراب</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {scrubAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-[#101B2C] border border-indigo-400/25 space-y-2">
                    <h4 className="text-sm font-bold text-[#F4F8FC]">{ann.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{ann.description}</p>
                    <span className="text-[10px] text-indigo-300 block pt-1">{ann.publishedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => navigateTo('payments')}
              className="px-6 py-3 rounded-xl bg-[#342A78] hover:bg-[#3f3391] border border-indigo-400/40 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-[#342A78]/40 active:scale-95 transition-all"
            >
              الانتقال إلى دفعات السكراب واستعراض وصولاتك
            </button>
            <button
              onClick={() => navigateTo('scrub_night')}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4F8FC] font-bold text-xs border border-white/10"
            >
              عرض الصفحة التفصيلية الكاملة لحفلة السكراب
            </button>
          </div>
        </div>
      )}

      {/* 2. OFFICIAL GRADUATION CONTENT (#35D6C2 Medical Turquoise & White Coat + Sash) */}
      {selectedEvent === 'grad' && (
        <div className="space-y-8 animate-in fade-in duration-300">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d2a32] via-[#101B2C] to-[#0A0D12] border-2 border-[#35D6C2]/35 p-6 sm:p-10 shadow-2xl clinical-grid-bg">
            <div className="absolute top-0 right-0 w-96 h-96 bg-[#35D6C2]/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              <div className="space-y-3 flex-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#35D6C2]/15 text-[#35D6C2] border border-[#35D6C2]/35 text-xs font-bold">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>المراسيم الأكاديمية الرسمية • قريباً</span>
                </div>
                <h2 className="text-2xl sm:text-4xl font-black text-[#F4F8FC]">
                  حفل التخرج الرسمي لمعهد التمريض
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
                  مراسيم تخرج طلبة معهد التمريض (دفعة 2027)، ارتداء روب التخرج والمعطف الأبيض ووشاح التمريض الفيروزي المذهب، وترديد القسم الطبي الرسمي.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <span className="flex items-center gap-1.5 text-[#F4F8FC] bg-[#0A0D12]/80 px-3 py-1.5 rounded-xl border border-[#D7B875]/40 font-bold">
                    <span className="w-2 h-2 rounded-full bg-[#D7B875] animate-pulse" />
                    <span>الموعد والقاعة: قريباً (يتم تحديدهما لاحقاً)</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#35D6C5] bg-[#10151C]/80 px-3 py-1.5 rounded-xl border border-[#35D6C5]/35 font-bold">
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>وشاح التمريض التركوازي وروب التخرج الرسمي</span>
                  </span>
                </div>
              </div>

              {/* White Coat + Turquoise Sash Illustration Card */}
              <div className="shrink-0 p-5 rounded-2xl bg-[#0A0D12]/80 border border-[#35D6C2]/35 text-center min-w-[220px] space-y-2">
                <ScrubUniformCoatIllustration variant="coat" className="w-36 h-36 mx-auto" />
                <div className="text-xs text-[#35D6C2] font-bold">وشاح التمريض المعتمد</div>
                <div className="text-sm font-black text-[#D7B875]">التركوازي الفيروزي المذهب</div>
                <div className="text-[11px] text-slate-400">دفعة 2027</div>
              </div>
            </div>
          </div>

          {/* Official Graduation Countdown Notice */}
          {eventConfig.officialGradCountdownEnabled && eventConfig.officialGradCountdownDate ? (
            <div className="max-w-4xl mx-auto">
              <CountdownTimer />
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-[#101B2C] border border-[#35D6C2]/25 text-center space-y-2">
              <AlertCircle className="w-7 h-7 text-[#D7B875] mx-auto opacity-85" />
              <h4 className="text-sm font-bold text-[#F4F8FC]">موعد وقاعة حفل التخرج الرسمي: قريباً</h4>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                لم يتم تحديد الموعد النهائي والقاعة حتى الآن. ستقوم اللجنة بتثبيت الموعد وتفعيل العداد التنازلي فور اعتماده رسمياً.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-[#101B2C] border border-[#35D6C2]/20 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#35D6C2]/15 text-[#35D6C2] flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#F4F8FC]">تاريخ الحفل</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {eventConfig.officialGraduationDate || 'قريباً'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#101B2C] border border-[#35D6C2]/20 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#35D6C2]/15 text-[#35D6C2] flex items-center justify-center">
                <Building className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#F4F8FC]">مكان الحفل الأكاديمي</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {eventConfig.officialGraduationLocation || 'قريباً (سيتم تحديده فور اعتماده)'}
              </p>
            </div>

            <div className="rounded-2xl bg-[#101B2C] border border-[#35D6C2]/20 p-5 space-y-2">
              <div className="w-9 h-9 rounded-xl bg-[#35D6C2]/15 text-[#35D6C2] flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-bold text-[#F4F8FC]">البروتوكول الرسمي</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                تسليم شهادات التقدير، التقاط صور التخرج بوشاح التمريض الفيروزي، وترديد القسم المهني.
              </p>
            </div>
          </div>

          {gradAnnouncements.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-[#F4F8FC] flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#35D6C2]" />
                <span>إعلانات حفل التخرج الرسمي</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {gradAnnouncements.map((ann) => (
                  <div key={ann.id} className="p-4 rounded-2xl bg-[#101B2C] border border-[#35D6C2]/20 space-y-2">
                    <h4 className="text-sm font-bold text-[#F4F8FC]">{ann.title}</h4>
                    <p className="text-xs text-slate-300 leading-relaxed">{ann.description}</p>
                    <span className="text-[10px] text-[#35D6C2] block pt-1">{ann.publishedAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => navigateTo('payments')}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#35D6C2] to-[#24B8A5] text-[#0A0D12] font-extrabold text-xs sm:text-sm shadow-lg shadow-[#35D6C2]/20 active:scale-95 transition-all"
            >
              الانتقال إلى دفعات حفل التخرج الرسمي
            </button>
            <button
              onClick={() => navigateTo('official_grad')}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4F8FC] font-bold text-xs border border-white/10"
            >
              عرض صفحة المراسيم الرسمية الكاملة
            </button>
          </div>
        </div>
      )}

      <AnimatedEcgWaveform color="#35D6C2" opacity="opacity-20" className="w-full h-10" />
    </div>
  );
};
