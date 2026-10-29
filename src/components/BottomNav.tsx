import React from 'react';
import { useApp, PageRoute } from '../context/AppContext';
import {
  Home,
  GraduationCap,
  CalendarDays,
  User,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentPage, navigateTo, currentUser, canManageContent, isAdmin, isModerator } = useApp();

  const navItems = [
    {
      key: 'home',
      label: 'الرئيسية',
      icon: Home,
      isActive: currentPage === 'home',
      onClick: () => {
        navigateTo('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      key: 'cohorts',
      label: 'الدفعات',
      icon: GraduationCap,
      isActive: currentPage === 'payments',
      onClick: () => {
        navigateTo('payments');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      key: 'studio',
      label: 'استوديو AI',
      icon: Sparkles,
      isActive: currentPage === 'ai_trends_studio' || currentPage === 'graduation_studio',
      onClick: () => {
        navigateTo('ai_trends_studio');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      key: 'events',
      label: 'الحفلات',
      icon: CalendarDays,
      isActive:
        currentPage === 'events' ||
        currentPage === 'scrub_night' ||
        currentPage === 'official_grad',
      onClick: () => {
        navigateTo('events');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
    {
      key: 'auth',
      label: currentUser ? 'حسابي' : 'الدخول',
      icon:
        currentUser && (isAdmin || isModerator || canManageContent)
          ? ShieldAlert
          : User,
      isActive:
        currentPage === 'login' ||
        currentPage === 'register' ||
        currentPage === 'graduate_dashboard' ||
        currentPage === 'admin_dashboard',
      onClick: () => {
        navigateTo(
          (currentUser
            ? isAdmin || isModerator || canManageContent
              ? 'admin_dashboard'
              : 'graduate_dashboard'
            : 'login') as PageRoute
        );
        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
    },
  ];

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-50 px-2.5 sm:px-6 pb-2 sm:pb-3.5 pt-1 select-none pointer-events-none no-print"
      style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
    >
      <nav
        aria-label="التنقل السفلي الرئيسي"
        className="pointer-events-auto mx-auto max-w-md sm:max-w-lg md:max-w-xl rounded-3xl p-1.5 sm:p-2 bg-[#0B1320]/85 backdrop-blur-2xl border border-white/15 shadow-[0_14px_44px_rgba(0,0,0,0.85),0_0_25px_rgba(53,214,197,0.14)] transition-all duration-300"
      >
        <div className="grid grid-cols-5 gap-1 sm:gap-2 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;
            return (
              <button
                key={item.key}
                type="button"
                onClick={item.onClick}
                aria-current={active ? 'page' : undefined}
                className={`group relative flex flex-col items-center justify-center py-2.5 px-2 rounded-2xl transition-all duration-300 active:scale-95 cursor-pointer ${
                  active
                    ? 'bg-gradient-to-b from-[#35D6C5]/25 via-[#35D6C5]/12 to-transparent text-[#35D6C5] border border-[#35D6C5]/40 shadow-[0_4px_18px_rgba(53,214,197,0.2)]'
                    : 'text-slate-300/90 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                {active && (
                  <span className="absolute -top-1 w-7 h-1 rounded-full bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] shadow-[0_0_10px_#35D6C5]" />
                )}

                <div
                  className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center transition-transform duration-300 ${
                    active ? 'scale-110 -translate-y-0.5' : 'group-hover:scale-105'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 sm:w-5 sm:h-5 transition-colors ${
                      active ? 'text-[#35D6C5]' : 'text-current'
                    }`}
                  />
                </div>

                <span
                  className={`text-[11px] sm:text-xs tracking-tight mt-1 truncate max-w-full transition-colors ${
                    active ? 'font-black text-white' : 'font-bold text-slate-300/90'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
