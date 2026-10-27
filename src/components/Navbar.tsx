import React, { useState } from 'react';
import { useApp, PageRoute } from '../context/AppContext';
import {
  Menu,
  X,
  User,
  LogOut,
  ShieldAlert,
  Instagram,
  Home,
  GraduationCap,
  CalendarDays,
  Image as ImageIcon,
  LogIn,
} from 'lucide-react';
import { StethoscopeGradCapIllustration } from './MedicalIllustrations';

export const Navbar: React.FC = () => {
  const {
    currentPage,
    navigateTo,
    currentUser,
    isAdmin,
    isModerator,
    canManageContent,
    logout,
    eventConfig,
  } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    {
      key: 'home',
      label: 'الرئيسية',
      icon: Home,
      isActive: currentPage === 'home',
      onClick: () => {
        navigateTo('home');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setMobileMenuOpen(false);
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
        setMobileMenuOpen(false);
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
        setMobileMenuOpen(false);
      },
    },
    {
      key: 'gallery',
      label: 'المعرض',
      icon: ImageIcon,
      isActive: currentPage === 'gallery',
      onClick: () => {
        navigateTo('gallery');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setMobileMenuOpen(false);
      },
    },
    {
      key: 'login',
      label: 'الدخول',
      icon: LogIn,
      isActive:
        currentPage === 'login' ||
        currentPage === 'register' ||
        currentPage === 'graduate_dashboard' ||
        currentPage === 'admin_dashboard',
      onClick: () => {
        if (currentUser) {
          navigateTo(
            (isAdmin || isModerator || canManageContent
              ? 'admin_dashboard'
              : 'graduate_dashboard') as PageRoute
          );
        } else {
          navigateTo('login');
        }
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setMobileMenuOpen(false);
      },
    },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-[#0A0F1A]/90 backdrop-blur-xl shadow-lg">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2">
          {/* Logo & Brand Name */}
          <div
            onClick={() => {
              navigateTo('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group min-w-0"
          >
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-[#101B2C] border border-[#35D6C5]/40 flex items-center justify-center shadow-lg shadow-[#35D6C5]/10 group-hover:border-[#35D6C5] transition-all duration-300 shrink-0 overflow-hidden p-1">
              <StethoscopeGradCapIllustration className="w-full h-full" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-sm sm:text-lg tracking-tight text-white group-hover:text-[#35D6C5] transition-colors truncate">
                  معهد التمريض — دفعة 2027
                </span>
                <span className="hidden xs:inline-block px-2 py-0.5 text-[10px] font-bold rounded-full bg-[#D7B875]/15 text-[#D7B875] border border-[#D7B875]/30 shrink-0">
                  2027
                </span>
              </div>
              <span className="text-[11px] sm:text-xs text-[#A6F0DF] font-medium truncate">
                بوابة خريجي التمريض • حفلة السكراب والتخرج الرسمي
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (4 Destinations) */}
          <nav className="hidden lg:flex items-center gap-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={item.onClick}
                  className={`px-3.5 py-2 rounded-xl text-xs xl:text-sm font-extrabold transition-all duration-200 flex items-center gap-1.5 cursor-pointer ${
                    item.isActive
                      ? 'bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40 shadow-sm'
                      : 'text-[#E8EEF2]/80 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Action & Social Links */}
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <a
              href={eventConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2.5 rounded-xl bg-[#101B2C] hover:bg-[#35D6C5]/15 text-[#D7B875] hover:text-[#35D6C5] border border-white/10 transition-colors"
              title="حساب الدفعة على الإنستغرام @uofaon.1"
              aria-label="Instagram @uofaon.1"
            >
              <Instagram className="w-4 h-4" />
            </a>

            {currentUser ? (
              <div className="flex items-center gap-2">
                {(isAdmin || isModerator || canManageContent) && (
                  <button
                    onClick={() => navigateTo('admin_dashboard')}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                      currentPage === 'admin_dashboard'
                        ? 'bg-[#D7B875] text-[#0A0D12] shadow-lg shadow-[#D7B875]/20'
                        : 'bg-[#D7B875]/15 text-[#D7B875] border border-[#D7B875]/35 hover:bg-[#D7B875]/25'
                    }`}
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{isAdmin ? 'لوحة الإدارة' : 'لوحة الإشراف'}</span>
                  </button>
                )}

                <button
                  onClick={() => navigateTo('graduate_dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    currentPage === 'graduate_dashboard'
                      ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5] font-black'
                      : 'bg-[#101B2C] text-white border-white/15 hover:border-[#35D6C5]/50'
                  }`}
                >
                  <User className="w-3.5 h-3.5 text-[#35D6C5]" />
                  <span>{currentUser.fullName.split(' ')[0]}</span>
                </button>

                <button
                  onClick={logout}
                  title="تسجيل الخروج"
                  className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => navigateTo('login')}
                className="px-4 py-2 rounded-xl text-xs font-black text-[#0A0D12] bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] hover:opacity-95 transition-all shadow-md shadow-[#35D6C5]/20 cursor-pointer flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>الدخول</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex lg:hidden items-center gap-1.5">
            <a
              href={eventConfig.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-xl bg-[#101B2C] text-[#D7B875] border border-white/10"
              aria-label="Instagram"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-[#101B2C] border border-white/15 text-white hover:text-[#35D6C5] focus:outline-none"
              aria-label="القائمة الرئيسية"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu (4 Core Destinations) */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#0E1826]/98 border-b border-white/15 px-4 pt-3 pb-5 space-y-2.5 animate-in fade-in slide-in-from-top-3 duration-200">
          <div className="grid grid-cols-2 gap-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.key}
                  onClick={item.onClick}
                  className={`flex items-center gap-2 px-3.5 py-3 rounded-xl text-xs font-extrabold text-right transition-all ${
                    item.isActive
                      ? 'bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40'
                      : 'bg-[#090E17]/80 text-[#E8EEF2] border border-white/5 hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#35D6C5]" />
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10">
            {currentUser ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#090E17] border border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center font-bold text-xs">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">{currentUser.fullName}</div>
                      <div className="text-[10px] text-[#A6F0DF]">{currentUser.studentId}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="text-xs text-red-400 flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      navigateTo('graduate_dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="py-2.5 px-3 rounded-xl text-xs font-black bg-[#35D6C5] text-[#0A0D12] text-center"
                  >
                    بوابة الخريج
                  </button>
                  {(isAdmin || isModerator || canManageContent) && (
                    <button
                      onClick={() => {
                        navigateTo('admin_dashboard');
                        setMobileMenuOpen(false);
                      }}
                      className="py-2.5 px-3 rounded-xl text-xs font-black bg-[#D7B875] text-[#0A0D12] text-center"
                    >
                      {isAdmin ? 'لوحة الإدارة' : 'لوحة الإشراف'}
                    </button>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </header>
  );
};
