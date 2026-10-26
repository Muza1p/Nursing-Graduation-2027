import React from 'react';
import { useApp } from '../context/AppContext';
import {
  Sparkles,
  Calendar,
  UserCheck,
  Clock,
  Bell,
  ArrowLeft,
  MapPin,
  Stethoscope,
  GraduationCap,
} from 'lucide-react';

export const EventOverview: React.FC = () => {
  const { navigateTo, eventConfig } = useApp();

  const overviewCards = [
    {
      id: 'scrub',
      title: 'حفلة السكراب (Scrubs Graduation)',
      subtitle: 'الاحتفالية الصباحية بالزي الطبي والسكراب الموحد',
      date: eventConfig.scrubPartyDateDisplay || '12/12/2026',
      location: `${eventConfig.scrubVenue || 'مسرح تفاحة المصور'} • المصور ${eventConfig.scrubPhotographer || 'باقر حسن'}`,
      badge: '12 ديسمبر 2026',
      badgeColor: 'bg-[#342A78]/80 text-indigo-200 border-indigo-400/50',
      cardStyle:
        'bg-gradient-to-b from-[#342A78]/45 via-[#101B2C] to-[#0A0D12] border-indigo-400/40 hover:border-indigo-300 glow-indigo',
      icon: <Stethoscope className="w-5 h-5 text-indigo-300" />,
      actionLabel: 'تفاصيل حفلة السكراب والمساهمة',
      onClick: () => navigateTo('scrub_night'),
    },
    {
      id: 'official',
      title: 'حفل التخرج الرسمي (التخرج 2027)',
      subtitle: 'المراسيم الأكاديمية وارتداء وشاح التمريض الفيروزي',
      date: eventConfig.officialGradDateDisplay || eventConfig.officialGraduationDate || 'قريباً',
      location: eventConfig.officialGradVenue || eventConfig.officialGraduationLocation || 'قريباً',
      badge: 'قريباً',
      badgeColor: 'bg-[#35D6C2]/20 text-[#35D6C2] border-[#35D6C2]/40',
      cardStyle:
        'bg-gradient-to-b from-[#0f2e36]/70 via-[#101B2C] to-[#0A0D12] border-[#35D6C2]/40 hover:border-[#35D6C2] glow-turquoise',
      icon: <GraduationCap className="w-5 h-5 text-[#35D6C2]" />,
      actionLabel: 'متابعة حالة التخرج الرسمي',
      onClick: () => navigateTo('official_grad'),
    },
    {
      id: 'reg',
      title: 'بوابة تسجيل واعتماد الطلبة',
      subtitle: 'توثيق حساب الطالب وربط وصولات الكاش والبطاقة الرقمية',
      date: 'متاح الآن لطلبة دفعة 2027',
      location: 'مراجعة واعتماد اللجنة المنظمة',
      badge: 'التسجيل مفتوح',
      badgeColor: 'bg-[#D7B875]/20 text-[#D7B875] border-[#D7B875]/40',
      cardStyle: 'bg-[#101B2C]/90 hover:bg-[#101B2C] border-white/10 hover:border-[#D7B875]/40',
      icon: <UserCheck className="w-5 h-5 text-[#D7B875]" />,
      actionLabel: 'تسجيل طالب / خريج جديد',
      onClick: () => navigateTo('register'),
    },
    {
      id: 'announcements',
      title: 'التبليغات والإعلانات الرسمية',
      subtitle: 'تنبيهات اللجنة التحضيرية للمواعيد والتجهيزات الطبية',
      date: 'تحديث مستمر ومباشر',
      location: 'المنصة الرسمية وحساب @uofaon.1',
      badge: 'تحديثات حية',
      badgeColor: 'bg-[#35D6C2]/15 text-[#35D6C2] border-[#35D6C2]/30',
      cardStyle: 'bg-[#101B2C]/90 hover:bg-[#101B2C] border-white/10 hover:border-[#35D6C2]/35',
      icon: <Bell className="w-5 h-5 text-[#35D6C2]" />,
      actionLabel: 'استعراض التبليغات',
      onClick: () => navigateTo('announcements'),
    },
  ];

  return (
    <section className="py-8 sm:py-14">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-10 gap-2 sm:gap-4 text-right">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#35D6C2] font-bold mb-1.5">
              <span className="w-2 h-2 rounded-full bg-[#35D6C2]" />
              <span>محطات المسيرة الأكاديمية والاحتفالية</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#F4F8FC] leading-snug">
              فعاليات معهد التمريض (دفعة 2027)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
            فصل واضح في الهوية والتنظيم والمالية بين حفلة السكراب الصباحية وحفل التخرج الأكاديمي الرسمي.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-6 text-right">
          {overviewCards.map((card) => (
            <div
              key={card.id}
              onClick={card.onClick}
              className={`group cursor-pointer rounded-2xl p-4 sm:p-6 transition-all duration-300 flex flex-col justify-between border ${card.cardStyle} shadow-xl hover:-translate-y-1`}
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {card.icon}
                  </div>
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border ${card.badgeColor}`}>
                    {card.badge}
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-extrabold text-[#F4F8FC] mb-1 group-hover:text-[#35D6C2] transition-colors">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-3.5">
                  {card.subtitle}
                </p>

                <div className="space-y-1.5 border-t border-white/10 pt-3 text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-[#F4F8FC]">
                    <Clock className="w-3.5 h-3.5 text-[#35D6C2] shrink-0" />
                    <span className="font-bold truncate">{card.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 text-[#D7B875] shrink-0" />
                    <span className="truncate">{card.location}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs font-extrabold text-[#35D6C2] group-hover:text-white transition-colors">
                <span>{card.actionLabel}</span>
                <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform shrink-0" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
