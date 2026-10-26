import React from 'react';
import { useApp } from '../context/AppContext';
import { GraduationCap, Instagram, HeartPulse, ShieldCheck, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  const { navigateTo, eventConfig } = useApp();

  return (
    <footer className="bg-[#090B10] border-t border-white/10 text-right pt-8 sm:pt-12 pb-24 sm:pb-8">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Brand Info */}
          <div className="space-y-3.5 col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#101827] border border-[#21D4C2]/40 flex items-center justify-center text-[#21D4C2] shrink-0">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-sm sm:text-base text-white tracking-wider">
                  معهد التمريض — دفعة 2027
                </h3>
                <p className="text-xs text-[#D6B779] font-medium">حفلة السكراب • SCRUB NIGHT</p>
              </div>
            </div>

            <p className="text-xs text-[#929BAA] max-w-md leading-relaxed">
              المنصة الرسمية المعتمدة لإدارة وتوثيق فعاليات معهد التمريض (دفعة 2027) وحفلة السكراب. نسعى لتقديم تجربة تليق بعطاء وتضحيات ملائكة الرحمة.
            </p>

            <div className="flex items-center gap-3">
              <a
                href={eventConfig.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/5 hover:bg-[#D6B779]/20 text-[#D6B779] border border-white/10 flex items-center justify-center transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <div className="text-xs text-[#929BAA] flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-[#21D4C2]" />
                <span>دفعة 2027</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D6B779]">
              روابط المنصة
            </h4>
            <ul className="space-y-2 text-xs text-[#929BAA]">
              <li>
                <button
                  onClick={() => navigateTo('home')}
                  className="hover:text-white transition-colors"
                >
                  الرئيسية
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('scrub_night')}
                  className="hover:text-white transition-colors"
                >
                  حفلة السكراب (12/12/2026)
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('official_grad')}
                  className="hover:text-white transition-colors"
                >
                  التخرج الرسمي 2027
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('announcements')}
                  className="hover:text-white transition-colors"
                >
                  الإعلانات والتنبيهات
                </button>
              </li>
              <li>
                <button
                  onClick={() => navigateTo('gallery')}
                  className="hover:text-white transition-colors"
                >
                  معرض الصور والذكريات
                </button>
              </li>
            </ul>
          </div>

          {/* Contact & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D6B779]">
              التواصل والتنسيق
            </h4>
            <div className="space-y-2 text-xs text-[#929BAA]">
              <p className="flex items-center gap-2">
                <Instagram className="w-3.5 h-3.5 text-[#D6B779]" />
                <a
                  href={eventConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline text-white/80"
                >
                  instagram.com/uofaon.1
                </a>
              </p>
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#21D4C2]" />
                <a href="tel:07800088386" dir="ltr" className="hover:text-white transition-colors">
                  07800088386
                </a>
              </p>
              <div className="pt-2 text-[11px] text-[#929BAA] border-t border-white/5">
                <p>اللجنة التحضيرية والتنظيمية:</p>
                <p className="text-white/80">مصطفى علي حسون • مصطفى أركان • حسين عبدالله</p>
              </div>
            </div>
          </div>
        </div>

        {/* Refined Developer Credit mandated in Section 11 */}
        <div className="border-t border-white/8 pt-6 pb-2 text-center">
          <p className="text-xs sm:text-sm text-[#D6B779] font-medium tracking-wide">
            تم صنع الموقع بالكامل بواسطة{' '}
            <a
              href="https://www.instagram.com/mustafaa.hassoun"
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-[#21D4C2] hover:text-white hover:underline transition-colors inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10"
            >
              <span>مصطفى علي حسون</span>
              <Instagram className="w-3.5 h-3.5 text-[#D6B779]" />
            </a>
          </p>
        </div>

        {/* Bottom Copyright */}
        <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row items-center justify-between text-xs text-[#929BAA] gap-3">
          <p className="text-center sm:text-right">
            جميع الحقوق محفوظة — معهد التمريض (دفعة 2027)
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-[#21D4C2]">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>نظام مشفر وآمن</span>
            </span>
            <span>•</span>
            <button onClick={() => navigateTo('login')} className="hover:text-white transition-colors">
              بوابة المشرفين
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
