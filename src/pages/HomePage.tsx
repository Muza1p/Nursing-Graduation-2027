import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Hero } from '../components/Hero';
import { OfficialGraduationPoster } from '../components/OfficialGraduationPoster';
import { EventOverview } from '../components/EventOverview';
import { AnnouncementsSection } from '../components/AnnouncementsSection';
import { GallerySection } from '../components/GallerySection';
import { TeamSection } from '../components/TeamSection';
import {
  AppNotification,
  subscribeToNotifications,
} from '../services/notificationService';
import {
  Sparkles,
  Search,
  Link2,
  CreditCard,
  Music,
  Bell,
  ArrowLeft,
  ShieldCheck,
  LogIn,
} from 'lucide-react';

export const HomePage: React.FC = () => {
  const {
    navigateTo,
    currentUser,
    firebaseUser,
    isAdmin,
    isModerator,
    eventConfig,
  } = useApp();

  const [latestNotif, setLatestNotif] = useState<AppNotification | null>(null);
  const currentUid = firebaseUser?.uid || currentUser?.id || 'guest_user';

  useEffect(() => {
    const unsub = subscribeToNotifications(
      currentUid,
      Boolean(isAdmin || isModerator),
      (items) => {
        const unread = items.find((n) => !n.isRead);
        setLatestNotif(unread || items[0] || null);
      }
    );
    return () => unsub();
  }, [currentUid, isAdmin, isModerator]);

  const newFeatures = [
    {
      title: 'استوديو التخرج الذكي (10 قوالب)',
      description:
        'ارفع صورتك الشخصية مع الحفاظ التام على ملامحك الأصلية، واختر من بين 10 قوالب تخرج احترافية بالوشاح التركوازي وقبعة التخرج والسماعة الطبية.',
      badge: 'جديد وحصري',
      icon: Sparkles,
      accent: 'border-[#35D6C5]/40 text-[#35D6C5]',
      actionLabel: 'جرّب استوديو التخرج الآن',
      onClick: () => navigateTo('graduation_studio'),
    },
    {
      title: 'العثور على سجلي المالي وربطه بحسابي',
      description:
        'ابحث عن اسمك الثلاثي ضمن قائمة الـ 244 طالباً وطالبة، واربط سجلك المالي بحسابك الشخصي لعرض دفعاتك المسبقة وإيصالاتك الرسمية بأمان.',
      badge: 'حماية وخصوصية',
      icon: Link2,
      accent: 'border-[#D7B875]/40 text-[#D7B875]',
      actionLabel: currentUser
        ? 'ابحث واربط سجلك المالي'
        : 'سجّل الدخول لربط سجلك',
      onClick: () =>
        navigateTo(currentUser ? 'graduate_dashboard' : 'login'),
    },
    {
      title: 'نظام المدفوعات والإيصالات الرقمية',
      description:
        'تتبع المبلغ المدفوع والمتبقي ونسبة الإنجاز المئوية لحفلة السكراب (35,000 د.ع)، مع إمكانية تقديم طلب تسديد واستعراض الوصولات الموثقة.',
      badge: 'شفافية مالية',
      icon: CreditCard,
      accent: 'border-emerald-500/40 text-emerald-400',
      actionLabel: 'البحث عن اسم الطالب والدفعات',
      onClick: () => navigateTo('payments'),
    },
    {
      title: 'مكتبة أغاني التخرج السحابية',
      description:
        'استمع إلى أناشيد وأغاني تخرج دفعة 2027 بجودة عالية مع مشغل خلفي مستمر ودعم كامل لجميع الهواتف والمتصفحات.',
      badge: 'صوتيات الدفعة',
      icon: Music,
      accent: 'border-sky-500/40 text-sky-400',
      actionLabel: 'فتح مكتبة الأغاني',
      onClick: () => navigateTo('music'),
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-10">
      {/* Top Important Updates Notification Bar when updates exist */}
      {latestNotif && (
        <div className="bg-gradient-to-r from-[#0F2435] via-[#132C3E] to-[#0F2435] border-b border-[#35D6C5]/35 px-4 py-2.5">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 text-white">
              <span className="px-2 py-0.5 rounded-full bg-[#35D6C5] text-[#0A0D12] font-black text-[10px] flex items-center gap-1 shrink-0">
                <Bell className="w-3 h-3" />
                <span>تحديث مهم</span>
              </span>
              <span className="font-extrabold text-[#A6F0DF]">
                {latestNotif.title}:
              </span>
              <span className="text-slate-200 truncate max-w-xl">
                {latestNotif.message}
              </span>
            </div>
            <button
              onClick={() =>
                navigateTo(latestNotif.linkRoute || 'announcements')
              }
              className="text-[#D7B875] hover:text-white font-extrabold flex items-center gap-1 cursor-pointer shrink-0"
            >
              <span>عرض التفاصيل</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Nursing Graduation 2027 Hero & Countdown Timer */}
      <Hero />

      {/* 1.5 Official Graduation Poster with zoom modal */}
      <OfficialGraduationPoster />

      {/* 2. Event Cards (حفلة السكراب 12/12/2026 مسرح تفاحة المصور باقر حسن + حفل التخرج قريباً) */}
      <EventOverview />

      {/* 3. New Platform Features Showcase Section ("قائمة بالمزايا الجديدة") */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-6 text-right">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#35D6C5]/15 border border-[#35D6C5]/35 text-[#35D6C5] text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>تحديث المنصة الشامل • دفعة 2027</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              اكتشف المزايا الرقمية الجديدة لمنصة تخرج التمريض 2027
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              تم تطوير المنصة لتمنح كل طالب في الدفعة حساباً شخصياً متكاملاً، استوديو تصميم احترافي، وربطاً مالياً موثقاً.
            </p>
          </div>

          {!currentUser ? (
            <button
              onClick={() => navigateTo('login')}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#D7B875] text-[#0A0D12] font-black text-xs sm:text-sm shadow-xl shadow-[#35D6C5]/20 flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>تسجيل الدخول واكتشاف جميع المزايا</span>
            </button>
          ) : (
            <button
              onClick={() => navigateTo('graduate_dashboard')}
              className="px-5 py-3 rounded-2xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs sm:text-sm shadow-xl shadow-[#35D6C5]/20 flex items-center gap-2 self-start md:self-auto cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>الانتقال إلى لوحتي الشخصية</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {newFeatures.map((feat, idx) => {
            const Icon = feat.icon;
            return (
              <div
                key={idx}
                className={`rounded-3xl bg-[#101827]/90 border ${feat.accent} p-6 flex flex-col justify-between gap-4 shadow-xl hover:translate-y-[-2px] transition-all`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-bold">
                      {feat.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-white">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {feat.description}
                  </p>
                </div>

                <button
                  onClick={feat.onClick}
                  className="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/15 text-white font-extrabold text-xs flex items-center justify-between cursor-pointer transition"
                >
                  <span>{feat.actionLabel}</span>
                  <ArrowLeft className="w-4 h-4 text-[#35D6C5]" />
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Latest Published Announcements Section ("أحدث الإعلانات المنشورة من المشرفين") */}
      <div className="border-t border-white/10 pt-4">
        <AnnouncementsSection />
      </div>

      {/* 5. Gallery & Photos Section */}
      <div className="border-t border-white/10 pt-2">
        <GallerySection limit={6} />
      </div>

      {/* 6. Verified Graduation Supervisors & Social Media Links */}
      <div className="border-t border-white/10 pt-2">
        <TeamSection />
      </div>
    </div>
  );
};
