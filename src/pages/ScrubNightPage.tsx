import React from 'react';
import { useApp } from '../context/AppContext';
import { CountdownTimer } from '../components/CountdownTimer';
import {
  ScrubUniformCoatIllustration,
  AnimatedEcgWaveform,
} from '../components/MedicalIllustrations';
import { formatIQD } from '../services/storage';
import {
  Sparkles,
  Calendar,
  MapPin,
  Shirt,
  CreditCard,
  AlertCircle,
  Clock,
  FileText,
  Camera,
  CheckCircle2,
  Stethoscope,
} from 'lucide-react';

export const ScrubNightPage: React.FC = () => {
  const { eventConfig, navigateTo } = useApp();

  return (
    <div className="py-8 sm:py-12 space-y-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
      {/* Top Indigo Medical Scrub Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#342A78] via-[#17183B] to-[#0A0D12] border border-indigo-400/40 p-6 sm:p-10 shadow-2xl clinical-grid-indigo">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-[#35D6C2]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#0A0D12]/60 border border-indigo-300/40 text-indigo-200 text-xs font-bold shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-[#D7B875]" />
              <span>حفلة السكراب الصباحية • معهد التمريض (دفعة 2026 | التخرج 2027)</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#F4F8FC] tracking-tight">
              حفلة السكراب — <span className="text-[#35D6C2]">SCRUBS GRADUATION</span>
            </h1>

            <p className="text-sm sm:text-base text-indigo-100/85 leading-relaxed max-w-2xl">
              احتفالية صباحية مميزة بالزي الطبي الموحد والسكراب السريري تجمع طلبة{' '}
              <strong className="text-white">معهد التمريض — دفعة 2026</strong> لتوثيق أجمل ذكريات الدراسة والتدريب العملي قبل التخرج الرسمي في 2027.
            </p>

            {/* Clear Distinction between Confirmed & Provisional Details */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                <span>القاعة والمصور: معتمد</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D7B875]/20 border border-[#D7B875]/40 text-[#D7B875] font-bold">
                <Clock className="w-3.5 h-3.5" />
                <span>التاريخ المبدئي: {eventConfig.scrubPartyDateDisplay || '12/12/2026'} (صباحاً)</span>
              </span>
            </div>
          </div>

          {/* Right/Left Visual: Curated Scrub Uniform & Stethoscope Illustration */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center">
            <div className="p-4 rounded-2xl bg-[#0A0D12]/70 border border-indigo-400/30 shadow-xl text-center">
              <ScrubUniformCoatIllustration variant="scrub" className="w-48 h-44 mx-auto" />
              <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-center gap-1.5 text-xs font-bold text-[#35D6C2]">
                <Stethoscope className="w-3.5 h-3.5" />
                <span>السكراب الطبي الموحد + السماعة</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Countdown Module */}
      <div className="max-w-4xl mx-auto">
        <CountdownTimer />
      </div>

      {/* Core Event Fact Sheet Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Date Card */}
        <div className="rounded-2xl bg-[#101B2C] border border-indigo-400/35 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#342A78] text-indigo-200 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
              موعد الحفل
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">تاريخ حفلة السكراب</span>
          <h3 className="text-lg font-black text-[#F4F8FC]">
            {eventConfig.scrubPartyDateDisplay || '12 ديسمبر 2026'}
          </h3>
          <p className="text-xs text-indigo-300 font-mono">12 / 12 / 2026</p>
        </div>

        {/* Location & Venue Card */}
        <div className="rounded-2xl bg-[#101B2C] border border-white/10 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#D7B875]/15 text-[#D7B875] flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              مؤكد
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">المكان والتصوير</span>
          <h3 className="text-base font-black text-[#F4F8FC] leading-snug">
            {eventConfig.scrubVenue || 'مسرح تفاحة المصور'}
          </h3>
          <p className="text-xs text-[#D7B875] flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" />
            <span>المصور المعتمد: {eventConfig.scrubPhotographer || 'باقر حسن'}</span>
          </p>
        </div>

        {/* Time Card (Morning) */}
        <div className="rounded-2xl bg-[#101B2C] border border-white/10 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#35D6C2]/15 text-[#35D6C2] flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#D7B875]/20 text-[#D7B875] border border-[#D7B875]/30">
              صباحي
            </span>
          </div>
          <span className="text-xs text-slate-400 font-semibold">توقيت التجمع والبدء</span>
          <h3 className="text-base font-black text-[#F4F8FC] leading-snug">
            {eventConfig.scrubTime || 'الوقت يُعلن لاحقاً'}
          </h3>
          <p className="text-xs text-[#35D6C2]">صباحاً (8:00 ص أو 9:00 ص حسب اعتماد المشرف)</p>
        </div>

        {/* Private Payment Verification & Receipts */}
        <div className="rounded-2xl glass-panel border border-white/10 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#35D6C5]/15 text-[#35D6C5] flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#35D6C5]/20 text-[#A6F0DF] border border-[#35D6C5]/30">
              وصولات موثقة
            </span>
          </div>
          <span className="text-xs text-[#E8EEF2]/70 font-semibold">الحساب المالي للطالب</span>
          <h3 className="text-base font-black text-white">
            استعلام خاص عن الدفعات
          </h3>
          <p className="text-xs text-[#35D6C5]">متابعة المبلغ المدفوع والمتبقي وسجل الدفعات</p>
        </div>
      </div>

      <AnimatedEcgWaveform color="#6366F1" opacity="opacity-30" className="w-full h-10" />

      {/* Program Schedule & Payment Instructions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Right (RTL): Registration & Payment Instructions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-3xl bg-[#101B2C] border border-white/10 p-6 sm:p-8 space-y-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#35D6C2]/20 text-[#35D6C2] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-black text-[#F4F8FC]">
                  آلية التسديد وتثبيت الحضور في حفلة السكراب
                </h3>
                <p className="text-xs text-slate-400">خطوات واضحة وموثقة لإصدار سندات القبض</p>
              </div>
            </div>

            <div className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#0A0D12]/60 border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#35D6C2] text-[#0A0D12] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="font-bold text-[#F4F8FC] mb-0.5">التسجيل في بوابة معهد التمريض</h4>
                  <p className="text-slate-300 leading-relaxed">
                    سجّل حسابك باسمك الرباعي ورقم هاتفك (ورقم القيد إن وجد) ليتم اعتمادك ضمن قائمة دفعة 2026.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#0A0D12]/60 border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#35D6C2] text-[#0A0D12] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="font-bold text-[#F4F8FC] mb-0.5">تسليم المساهمة أو العربون نقداً</h4>
                  <p className="text-slate-300 leading-relaxed">
                    يُسلّم المبلغ نقداً (كاش) لأعضاء اللجنة المنظمة المعتمدين، مع إمكانية الدفع كعربون أولي أو تسديد كامل.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 rounded-2xl bg-[#0A0D12]/60 border border-white/5">
                <div className="w-6 h-6 rounded-lg bg-[#35D6C2] text-[#0A0D12] font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="font-bold text-[#F4F8FC] mb-0.5">استلام الوصل الإلكتروني الفوري</h4>
                  <p className="text-slate-300 leading-relaxed">
                    يصدر وصل رسمي مرقم ومختوم إلكترونياً يظهر في صفحة دفعاتك، ويمكنك حفظه أو طباعته في أي وقت.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap gap-3">
              <button
                onClick={() => navigateTo('register')}
                className="px-6 py-3 rounded-xl bg-[#35D6C2] hover:bg-[#28c0ad] text-[#0A0D12] font-extrabold text-xs sm:text-sm shadow-lg shadow-[#35D6C2]/20"
              >
                تسجيل طالب جديد الآن
              </button>
              <button
                onClick={() => navigateTo('payments')}
                className="px-5 py-3 rounded-xl bg-[#342A78] hover:bg-[#3f3391] text-white font-bold text-xs sm:text-sm border border-indigo-400/30"
              >
                استعراض دفعات ووصولات السكراب
              </button>
            </div>
          </div>
        </div>

        {/* Left (RTL): Dress Code & Schedule Card */}
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#101B2C] border border-indigo-400/30 p-6 sm:p-8 space-y-5 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D7B875]/20 text-[#D7B875] flex items-center justify-center">
                <Shirt className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-[#F4F8FC]">الزي الطبي والفقرات</h3>
                <span className="text-xs text-[#D7B875] font-semibold">الهوية البصرية لحفلة السكراب</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#0A0D12]/80 border border-white/5 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-[#D7B875] mx-auto opacity-85" />
              <h4 className="text-sm font-bold text-[#F4F8FC]">تفاصيل الفقرات قيد الترتيب النهائي</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                تشمل الحفلة الصباحية فقرات دخول الخريجين بالسكراب الطبي، كلمة دفعة 2026، جلسات التصوير الفردية والجماعية مع المصور باقر حسن، والتكريمات التذكارية.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4 text-xs text-slate-300 space-y-2.5">
              <div className="flex items-center justify-between">
                <span>الزي المعتمد:</span>
                <span className="text-[#35D6C2] font-bold">السكراب الطبي + السماعة</span>
              </div>
              <div className="flex items-center justify-between">
                <span>توقيت الحفل:</span>
                <span className="text-[#F4F8FC] font-bold">
                  {eventConfig.scrubTime || 'صباحي (8:00 ص أو 9:00 ص)'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>القاعة:</span>
                <span className="text-[#D7B875] font-bold">
                  {eventConfig.scrubVenue || 'مسرح تفاحة المصور'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
