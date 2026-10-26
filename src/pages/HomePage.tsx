import React from 'react';
import { Hero } from '../components/Hero';
import { EventOverview } from '../components/EventOverview';
import { AnnouncementsSection } from '../components/AnnouncementsSection';
import { GallerySection } from '../components/GallerySection';
import { TeamSection } from '../components/TeamSection';
import {
  IvCannulaSetIllustration,
  VitalSignsToolsIllustration,
  AnatomicalHeartMedalIllustration,
  AnimatedEcgWaveform,
} from '../components/MedicalIllustrations';
import { useApp } from '../context/AppContext';
import {
  HelpCircle,
  GraduationCap,
  HeartPulse,
  Stethoscope,
  Award,
  Activity,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const { navigateTo } = useApp();

  const faqs = [
    {
      q: 'ما هو موعد ومكان حفلة السكراب (Scrubs Graduation)؟',
      a: 'الموعد المقرر هو يوم 12/12/2026 في مسرح تفاحة المصور بعدسة المصور باقر حسن. الحفل صباحي وسيتم تثبيت الساعة النهائية (8:00 أو 9:00 صباحاً) عبر المنصة وحساب الإنستغرام الرسمي.',
    },
    {
      q: 'كيف يتم تسديد المساهمة المقررة واستلام الوصل الرسمي؟',
      a: 'يتم تسليم المساهمة نقداً (كاش) لأعضاء اللجنة المالية المعتمدين. فور الاستلام يصدر وصل رسمي برقم تسلسلي وحالة واضحة (عربون / دفعة جزئية / تسديد كامل) يظهر في حساب الطالب مباشرة.',
    },
    {
      q: 'متى سيعلن عن موعد وقاعة حفل التخرج الرسمي 2027؟',
      a: 'حفل التخرج الأكاديمي الرسمي لعام 2027 قيد التنسيق، وتفاصيله حالياً بحالة (قريباً). لن يتم عرض أي تاريخ افتراضي حتى يتم اعتماده رسمياً من اللجنة.',
    },
    {
      q: 'هل يمكنني التسجيل إذا لم أستلم رقم القيد أو الهوية الجامعية بعد؟',
      a: 'نعم بكل تأكيد! حقل رقم القيد اختياري في استمارة التسجيل، ويمكنك التسجيل باسمك الرباعي ورقم هاتفك ليتم تدقيق طلبك واعتماده من قبل المشرف.',
    },
  ];

  return (
    <div className="space-y-0">
      {/* 1. Hero Section */}
      <Hero />

      {/* 2. Event Overview Cards */}
      <EventOverview />

      {/* 3. Dedicated Student Achievement & Nursing Profession Section (Curated Medical Objects) */}
      <section className="py-8 sm:py-14 relative overflow-hidden border-y border-white/5 bg-[#101B2C]/35">
        <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 space-y-6 sm:space-y-10">
          <div className="text-center max-w-3xl mx-auto space-y-2.5 sm:space-y-3">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-xl bg-[#35D6C2]/15 border border-[#35D6C2]/30 text-[#35D6C2] text-[11px] sm:text-xs font-bold">
              <HeartPulse className="w-3.5 h-3.5" />
              <span>إنجاز الدفعة ورسالة التمريض السريرية</span>
            </div>
            <h2 className="text-xl sm:text-4xl font-black text-[#F4F8FC] leading-snug">
              من قاعات التدريب السريري إلى منصة التتويج
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              يجسد خريجو <strong className="text-[#F4F8FC]">معهد التمريض (دفعة 2027)</strong> الدقة العلمية والمهارة السريرية في رعاية المرضى، من إتقان الإجراءات الوريدية ومراقبة العلامات الحيوية إلى حمل أمانة المهنة.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Card 1: Peripheral IV Cannulas & Infusion Therapy */}
            <div className="rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-6 border border-[#35D6C2]/25 flex flex-col justify-between space-y-4 sm:space-y-5 hover:border-[#35D6C2]/60 transition-all">
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-extrabold text-[#35D6C2] bg-[#35D6C2]/10 px-2.5 py-1 rounded-lg border border-[#35D6C2]/25">
                    المهارة السريرية والدقة
                  </span>
                  <Activity className="w-4 h-4 text-[#35D6C2]" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#F4F8FC]">
                  الإجراءات الوريدية والعلاج السريري
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  سنوات من التدريب العملي على اختيار قياسات الكانولات الوريدية (18G – 24G) وتنظيم المحاليل الوريدية بأعلى معايير سلامة المريض.
                </p>
              </div>
              <div className="flex justify-center">
                <IvCannulaSetIllustration className="w-full max-w-[230px] sm:max-w-[300px] h-auto" />
              </div>
            </div>

            {/* Card 2: Vital Signs & Patient Assessment Tools */}
            <div className="rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-6 border border-[#D7B875]/30 flex flex-col justify-between space-y-4 sm:space-y-5 hover:border-[#D7B875]/60 transition-all">
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-extrabold text-[#D7B875] bg-[#D7B875]/10 px-2.5 py-1 rounded-lg border border-[#D7B875]/25">
                    المتابعة الحيوية المستمرة
                  </span>
                  <Stethoscope className="w-4 h-4 text-[#D7B875]" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#F4F8FC]">
                  أدوات التقييم والعلامات الحيوية
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  قياس الأكسجة النبضية (SpO2)، ضغط الدم الشرياني، الحرارة، وتحضير الجرعات الدوائية الدقيقة وتوثيق طبلة المريض.
                </p>
              </div>
              <div className="flex justify-center">
                <VitalSignsToolsIllustration className="w-full max-w-[230px] sm:max-w-[300px] h-auto" />
              </div>
            </div>

            {/* Card 3: Anatomical Heart, DNA & Graduation Honor */}
            <div className="rounded-2xl sm:rounded-3xl glass-panel p-4 sm:p-6 border border-indigo-400/30 flex flex-col justify-between space-y-4 sm:space-y-5 hover:border-indigo-400/60 transition-all">
              <div className="space-y-2 text-right">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] sm:text-xs font-extrabold text-indigo-300 bg-[#342A78]/50 px-2.5 py-1 rounded-lg border border-indigo-400/30">
                    شرف المهنة والتخرج 2027
                  </span>
                  <Award className="w-4 h-4 text-[#D7B875]" />
                </div>
                <h3 className="text-base sm:text-lg font-black text-[#F4F8FC]">
                  نبض الإنسانية واستحقاق التخرج
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  حيث يلتقي العلم الطبي بروح العطاء الإنساني، ليتوج طلبة دفعة 2027 مسيرتهم بشهادة التخرج ووشاح التمريض الفيروزي في 2027.
                </p>
              </div>
              <div className="flex justify-center">
                <AnatomicalHeartMedalIllustration className="w-full max-w-[200px] sm:max-w-[250px] h-auto" />
              </div>
            </div>
          </div>

          <AnimatedEcgWaveform color="#35D6C2" opacity="opacity-25" className="w-full h-8 sm:h-10" />
        </div>
      </section>

      {/* 4. Announcements Section (Latest 3) */}
      <AnnouncementsSection limit={3} />

      {/* 5. Photo Gallery Preview */}
      <GallerySection limit={4} />

      {/* 6. Team Section & Instagram Link */}
      <TeamSection />

      {/* 7. FAQ Section */}
      <section className="py-8 sm:py-14">
        <div className="max-w-4xl mx-auto px-3.5 sm:px-6 lg:px-8">
          <div className="text-center mb-6 sm:mb-10">
            <div className="inline-flex items-center gap-1.5 text-xs text-[#35D6C2] font-bold mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-[#35D6C2]" />
              <span>الأسئلة الشائعة</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#F4F8FC]">
              استفسارات متكررة حول الحفلات والتسجيل
            </h2>
          </div>

          <div className="space-y-3 sm:space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl bg-[#101B2C] border border-white/10 p-4 sm:p-6 transition-all hover:border-[#35D6C2]/35 shadow-md text-right"
              >
                <h3 className="text-sm sm:text-base font-bold text-[#F4F8FC] mb-1.5 sm:mb-2 flex items-start justify-between gap-2">
                  <span>{faq.q}</span>
                  <span className="text-[#35D6C2] font-mono font-bold text-xs sm:text-sm shrink-0">#{index + 1}</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>

          {/* Quick Registration Banner */}
          <div className="mt-8 sm:mt-12 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#101B2C] via-[#132838] to-[#101B2C] border border-[#35D6C2]/35 p-5 sm:p-8 text-center space-y-3.5 sm:space-y-4 shadow-2xl">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#35D6C2]/20 border border-[#35D6C2]/40 text-[#35D6C2] flex items-center justify-center mx-auto">
              <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <h3 className="text-lg sm:text-2xl font-black text-[#F4F8FC] leading-snug">
              هل أنت من طلبة معهد التمريض (دفعة 2027)؟
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
              سجل حسابك الآن لتثبيت اسمك في قائمة خريجي الدفعة، ومتابعة وصولاتك المالية وتحميل بطاقة التخرج الخاصة بك بلقبك المهني (الممرض / الممرضة).
            </p>
            <div className="pt-1 grid grid-cols-2 sm:flex sm:flex-wrap justify-center gap-2.5 sm:gap-3">
              <button
                onClick={() => navigateTo('register')}
                className="w-full sm:w-auto px-4 sm:px-6 py-3 rounded-xl bg-[#35D6C2] hover:bg-[#28c0ad] text-[#0A0D12] font-extrabold text-xs sm:text-sm shadow-lg shadow-[#35D6C2]/20 transition-all"
              >
                إنشاء حساب خريج جديد
              </button>
              <button
                onClick={() => navigateTo('login')}
                className="w-full sm:w-auto px-4 sm:px-5 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-[#F4F8FC] font-bold text-xs sm:text-sm border border-white/10 transition-all"
              >
                لدي حساب بالفعل
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
