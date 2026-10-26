import React from 'react';
import { useApp } from '../context/AppContext';
import { GraduationOfficialStatus } from '../types';
import {
  ScrubUniformCoatIllustration,
  AnatomicalHeartMedalIllustration,
  AnimatedEcgWaveform,
} from '../components/MedicalIllustrations';
import {
  GraduationCap,
  Calendar,
  Clock,
  Info,
  Building,
  Award,
  ShieldCheck,
} from 'lucide-react';

export const OfficialGraduationPage: React.FC = () => {
  const { eventConfig, navigateTo } = useApp();

  const getStatusBadge = (status: GraduationOfficialStatus) => {
    switch (status) {
      case 'coming_soon':
        return {
          label: 'قريباً (التفاصيل قيد الاعتماد)',
          color: 'bg-[#D7B875]/20 text-[#D7B875] border-[#D7B875]/40',
          desc: 'المراسيم الرسمية لحفل التخرج الأكاديمي لعام 2027 قيد التنسيق والاعتماد من قبل اللجنة التحضيرية وإدارة المعهد.',
        };
      case 'date_announced':
        return {
          label: 'تم إعلان الموعد الرسمي',
          color: 'bg-[#35D6C2]/20 text-[#35D6C2] border-[#35D6C2]/40',
          desc: 'تم اعتماد الموعد الرسمي لحفل التخرج الأكاديمي لطلبة دفعة 2026 | التخرج 2027.',
        };
      case 'registration_open':
        return {
          label: 'التسجيل وتثبيت الأرواب مفتوح',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          desc: 'بدأ استلام طلبات تأكيد الحضور وتجهيز أرواب التخرج ووشاح التمريض الفيروزي.',
        };
      case 'details_published':
        return {
          label: 'كافة التفاصيل معلنة',
          color: 'bg-sky-500/20 text-sky-300 border-sky-500/40',
          desc: 'تم نشر البرنامج الرسمي والتعليمات الكاملة للمراسيم.',
        };
      case 'completed':
        return {
          label: 'اكتمل الحفل بنجاح',
          color: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
          desc: 'اكتملت المراسيم والتخرج الرسمي بنجاح — مبارك لجميع خريجي معهد التمريض.',
        };
      default:
        return {
          label: 'قريباً',
          color: 'bg-[#D7B875]/20 text-[#D7B875] border-[#D7B875]/40',
          desc: 'قيد التنسيق والاعتماد الرسمي.',
        };
    }
  };

  const statusInfo = getStatusBadge(eventConfig.officialGraduationStatus);

  return (
    <div className="py-8 sm:py-12 space-y-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
      {/* Prestigious Turquoise & Champagne Gold Hero Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0d2a32] via-[#101B2C] to-[#0A0D12] p-6 sm:p-10 border border-[#35D6C2]/40 relative overflow-hidden shadow-2xl clinical-grid-bg">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#35D6C2]/12 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className={`px-3.5 py-1 rounded-xl text-xs font-extrabold border ${statusInfo.color}`}>
                {statusInfo.label}
              </span>
              <span className="text-xs text-[#35D6C2] font-bold bg-[#35D6C2]/10 px-3 py-1 rounded-xl border border-[#35D6C2]/25">
                معهد التمريض — دفعة 2026 | التخرج {eventConfig.officialGraduationYear || 2027}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black text-[#F4F8FC] tracking-tight leading-tight">
              حفل التخرج الرسمي —{' '}
              <span className="text-[#35D6C2]">وشاح التمريض الفيروزي</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {statusInfo.desc} حيث يتوشح خريجو وخريجات <strong className="text-white">معهد التمريض</strong> بالمعطف الطبي الأبيض ووشاح التخرج الفيروزي المذهب، مع ترديد قسم المهنة واستلام شهادات التخرج لعام 2027.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs">
              <div className="px-4 py-2 rounded-xl bg-[#0A0D12]/80 border border-[#D7B875]/35 text-[#D7B875] font-bold flex items-center gap-2">
                <Award className="w-4 h-4" />
                <span>الوشاح المعتمد: التركوازي الطبي المذهب</span>
              </div>
              <div className="px-4 py-2 rounded-xl bg-[#0A0D12]/80 border border-[#35D6C2]/30 text-[#35D6C2] font-bold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>الموعد والقاعة: {eventConfig.officialGraduationDate || 'قريباً'}</span>
              </div>
            </div>
          </div>

          {/* Right/Left Visual: White Coat + Turquoise Sash & Anatomical Heart */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-[#0A0D12]/75 border border-[#35D6C2]/30 text-center flex flex-col items-center justify-between">
              <ScrubUniformCoatIllustration variant="coat" className="w-36 h-36 mx-auto" />
              <div className="mt-2 text-[11px] font-bold text-[#35D6C2]">
                المعطف الأبيض والوشاح الفيروزي
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-[#0A0D12]/75 border border-[#D7B875]/30 text-center flex flex-col items-center justify-between">
              <AnatomicalHeartMedalIllustration className="w-36 h-36 mx-auto" />
              <div className="mt-2 text-[11px] font-bold text-[#D7B875]">
                شهادة التخرج وقسم التمريض
              </div>
            </div>
          </div>
        </div>
      </div>

      <AnimatedEcgWaveform color="#35D6C2" opacity="opacity-25" className="w-full h-10" />

      {/* Official Status Grid (No Fake Countdown until Date is Configured) */}
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-2xl bg-[#101B2C] border border-[#35D6C2]/25 p-6 space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#35D6C2]/15 border border-[#35D6C2]/30 flex items-center justify-center text-[#35D6C2]">
            <Calendar className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-400">التاريخ الرسمي للحفل</span>
          <h3 className="text-lg font-black text-[#F4F8FC]">
            {eventConfig.officialGradDateDisplay || eventConfig.officialGraduationDate || 'قريباً'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {eventConfig.officialGraduationStatus === 'coming_soon'
              ? 'لم يتم تحديد تاريخ افتراضي؛ سيتم إعلانه رسمياً فور اعتماده.'
              : 'الموعد الرسمي المعتمد من اللجنة.'}
          </p>
        </div>

        <div className="rounded-2xl bg-[#101B2C] border border-white/10 p-6 space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#D7B875]/15 border border-[#D7B875]/30 flex items-center justify-center text-[#D7B875]">
            <Building className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-400">مقر وقاعة الاحتفال</span>
          <h3 className="text-lg font-black text-[#F4F8FC]">
            {eventConfig.officialGradVenue || eventConfig.officialGraduationLocation || 'قريباً'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            {eventConfig.officialGraduationStatus === 'coming_soon'
              ? 'تُحدد القاعة الرسمية لاحقاً وتُحدث مباشرة عبر لوحة الإدارة.'
              : 'الموقع الرسمي المعتمد.'}
          </p>
        </div>

        <div className="rounded-2xl bg-[#101B2C] border border-white/10 p-6 space-y-3 shadow-lg">
          <div className="w-10 h-10 rounded-xl bg-[#35D6C2]/15 border border-[#35D6C2]/30 flex items-center justify-center text-[#35D6C2]">
            <Clock className="w-5 h-5" />
          </div>
          <span className="text-xs font-semibold text-slate-400">المنهاج والمراسيم</span>
          <h3 className="text-lg font-black text-[#F4F8FC]">
            {eventConfig.officialGraduationSchedule || 'قريباً'}
          </h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            مسيرة الخريجين، أداء القسم الطبي، وتكريم طلبة دفعة 2026.
          </p>
        </div>
      </div>

      {/* Official Notice Card */}
      <div className="max-w-5xl mx-auto rounded-3xl bg-[#101B2C] border border-white/10 p-6 sm:p-8 space-y-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#35D6C2]/20 text-[#35D6C2] flex items-center justify-center">
            <Info className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-black text-[#F4F8FC]">تنويه تنظيمي لطلبة معهد التمريض</h4>
            <p className="text-xs text-slate-400">تحديث ديناميكي مباشر من لوحة المشرفين</p>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          حرصاً على المصداقية والدقة، لا يتم عرض أي عداد تنازلي أو تاريخ غير مؤكد لحفل التخرج الرسمي 2027 حتى يصدر القرار النهائي. بمجرد اعتماد الموعد والقاعة من قِبل اللجنة، سيتم تفعيلها وإشعار كافة الطلبة المسجلين فوراً.
        </p>

        <div className="pt-2 flex flex-wrap gap-3">
          <button
            onClick={() => navigateTo('scrub_night')}
            className="px-5 py-2.5 rounded-xl bg-[#342A78] hover:bg-[#3f3391] text-white font-bold text-xs border border-indigo-400/30"
          >
            استعراض حفلة السكراب الصباحية (12/12/2026)
          </button>
          <button
            onClick={() => navigateTo('register')}
            className="px-5 py-2.5 rounded-xl bg-[#35D6C2] hover:bg-[#28c0ad] text-[#0A0D12] font-extrabold text-xs"
          >
            تأكيد تسجيلك في الدفعة
          </button>
        </div>
      </div>
    </div>
  );
};
