import React from 'react';
import { useApp } from '../context/AppContext';
import { Users, Instagram, ShieldCheck, HeartHandshake, ExternalLink } from 'lucide-react';

export const TeamSection: React.FC = () => {
  const { eventConfig } = useApp();

  return (
    <section className="py-8 sm:py-14 bg-[#101827]/40 border-y border-white/5">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <div className="inline-flex items-center gap-1.5 text-xs text-[#D6B779] font-semibold mb-1.5">
            <Users className="w-3.5 h-3.5 text-[#D6B779]" />
            <span>لجنة معهد التمريض — دفعة 2026 | التخرج 2027</span>
          </div>
          <h2 className="text-xl sm:text-3xl font-black text-white mb-1.5">
            فريق التنظيم والإشراف
          </h2>
          <p className="text-xs sm:text-sm text-[#929BAA]">
            جهود تطوعية مخلصة من زملاء الدفعة لإخراج حفل التخرج وسكراب نايت بأبهى صورة تليق بنا جميعاً.
          </p>
        </div>

        {/* 3 Organizers Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
          {eventConfig.organizers.map((org) => (
            <div
              key={org.id}
              className="relative rounded-2xl bg-[#101827] border border-white/10 hover:border-[#21D4C2]/40 transition-all duration-300 p-5 sm:p-6 flex flex-col items-center text-center group shadow-xl hover:-translate-y-1"
            >
              <div className="relative mb-3.5">
                <div className="w-18 h-18 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#101827] to-[#1e2c45] border-2 border-[#21D4C2]/30 flex items-center justify-center text-2xl font-black text-[#21D4C2] shadow-lg group-hover:border-[#21D4C2] transition-colors overflow-hidden">
                  {org.photoUrl ? (
                    <img src={org.photoUrl} alt={org.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{org.name.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -left-2 bg-[#D6B779] text-black text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm">
                  عضو منظم
                </div>
              </div>

              <h3 className="text-base sm:text-lg font-bold text-white mb-1 group-hover:text-[#21D4C2] transition-colors">
                {org.name}
              </h3>

              <span className="text-xs font-semibold text-[#D6B779] mb-2.5">
                {org.role}
              </span>

              {org.bio && (
                <p className="text-xs text-[#929BAA] leading-relaxed mb-4 flex-1">
                  {org.bio}
                </p>
              )}

              {/* Exact Instagram handle */}
              <a
                href={org.instagram || eventConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-[#21D4C2]/15 text-[#F5F7FA] hover:text-[#21D4C2] border border-white/8 text-xs font-mono transition-colors"
              >
                <Instagram className="w-3.5 h-3.5 text-[#D6B779]" />
                <span dir="ltr">@{org.instagram ? org.instagram.replace(/\/$/, '').split('/').pop() : 'uofaon.1'}</span>
                <ExternalLink className="w-3 h-3 text-[#929BAA]" />
              </a>
            </div>
          ))}
        </div>

        {/* Official Instagram Channel Showcase */}
        <div className="mt-8 sm:mt-12 max-w-3xl mx-auto rounded-2xl bg-gradient-to-r from-[#101827] via-[#1a1c2b] to-[#101827] border border-[#D6B779]/30 p-5 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 shadow-2xl">
          <div className="flex items-center gap-3.5 sm:gap-4 text-right">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 flex items-center justify-center text-white shadow-lg shrink-0">
              <Instagram className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#D6B779]">القناة الإعلامية الرسمية</span>
              <h4 className="text-base sm:text-lg font-black text-white leading-snug">تابعوا حساب دفعة معهد التمريض (2026/2027) على الإنستغرام</h4>
              <p className="text-xs text-[#929BAA] mt-0.5">
                نشر الكواليس، التصويت على الفقرات، والتعليمات الصادرة أولاً بأول.
              </p>
            </div>
          </div>

          <a
            href={eventConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-[#D6B779] to-[#bf9e5a] text-black font-extrabold text-xs sm:text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg shrink-0"
          >
            <Instagram className="w-4 h-4" />
            <span>متابعة @uofaon.1</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
};
