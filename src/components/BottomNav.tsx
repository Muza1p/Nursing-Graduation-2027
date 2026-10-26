import React from 'react';
import { useApp, PageRoute } from '../context/AppContext';
import {
  Home,
  CalendarDays,
  CreditCard,
  Image as ImageIcon,
  User,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentPage, navigateTo, currentUser, canManageContent } = useApp();

  // Define the 5 destinations requested
  const navItems = [
    {
      id: 'home' as PageRoute,
      label: 'الرئيسية',
      icon: Home,
      isActive: currentPage === 'home',
    },
    {
      id: 'events' as PageRoute,
      label: 'الحفلات',
      icon: CalendarDays,
      isActive: currentPage === 'events' || currentPage === 'scrub_night' || currentPage === 'official_grad',
    },
    {
      id: 'payments' as PageRoute,
      label: 'الدفعات',
      icon: CreditCard,
      isActive: currentPage === 'payments',
    },
    {
      id: 'gallery' as PageRoute,
      label: 'المعرض',
      icon: ImageIcon,
      isActive: currentPage === 'gallery',
    },
    {
      id: (currentUser ? (canManageContent ? 'admin_dashboard' : 'graduate_dashboard') : 'login') as PageRoute,
      label: 'حسابي',
      icon: currentUser ? (canManageContent ? ShieldAlert : User) : User,
      isActive: currentPage === 'graduate_dashboard' || currentPage === 'admin_dashboard' || currentPage === 'login' || currentPage === 'register',
    },
  ];

  return (
    <div className="fixed bottom-3 inset-x-3 z-50 sm:hidden select-none pointer-events-none no-print">
      <nav
        aria-label="التنقل السفلي"
        className="pointer-events-auto mx-auto max-w-md rounded-2xl p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.9)] border border-[#35D6C2]/20 backdrop-blur-2xl bg-[#0A0D12]/90 transition-all"
      >
        <div className="grid grid-cols-5 gap-1 items-center">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = item.isActive;
            return (
              <button
                key={item.label}
                onClick={() => navigateTo(item.id)}
                className={`group relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-200 active:scale-95 ${
                  active
                    ? 'bg-gradient-to-b from-[#35D6C2]/20 to-transparent text-[#35D6C2]'
                    : 'text-slate-400 hover:text-[#F4F8FC]'
                }`}
              >
                {/* Active glow pip */}
                {active && (
                  <span className="absolute -top-1 w-5 h-1 rounded-full bg-[#35D6C2] shadow-[0_0_8px_#35D6C2]" />
                )}

                <div
                  className={`w-6 h-6 flex items-center justify-center transition-transform ${
                    active ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${active ? 'text-[#35D6C2]' : 'text-current'}`} />
                </div>

                <span
                  className={`text-[10px] tracking-tight mt-1 truncate transition-colors ${
                    active ? 'font-black text-[#F4F8FC]' : 'font-medium'
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
