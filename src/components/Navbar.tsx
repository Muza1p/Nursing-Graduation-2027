import React, { useState } from 'react';
import { useApp, PageRoute } from '../context/AppContext';
import {
  Menu,
  X,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  User,
  LogOut,
  Calendar,
  CreditCard,
  Image,
  Bell,
  Users,
  Instagram,
  ChevronDown,
  Layers,
} from 'lucide-react';

import { PWAInstallButton } from './PWAInstallButton';
import { NotificationCenterModal } from './NotificationCenterModal';

export const Navbar: React.FC = () => {
  const { currentPage, navigateTo, currentUser, isAdmin, isModerator, logout, eventConfig } = useApp();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [notificationModalOpen, setNotificationModalOpen] = useState(false);

  const navLinks: { id: PageRoute; label: string }[] = [
    { id: 'home', label: 'الرئيسية' },
    { id: 'events', label: 'الحفلات' },
    { id: 'payments', label: 'استعلام عن حسابي' },
    { id: 'gallery', label: 'المعرض' },
    { id: 'announcements', label: 'الإعلانات' },
    { id: 'team', label: 'فريق التنظيم' },
  ];

  const handleNavClick = (page: PageRoute) => {
    navigateTo(page);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#0A0D12]/90 backdrop-blur-xl border-b border-white/10 transition-all">
      {/* Top Banner Notice for Instagram & Countdown */}
      <div className="bg-gradient-to-r from-[#101B2C] via-[#132934] to-[#101B2C] border-b border-[#35D6C2]/20 py-1.5 px-3 sm:px-6 text-[11px] sm:text-xs text-slate-300">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2 truncate">
            <span className="text-[#F4F8FC] font-medium truncate">حفلة السكراب الصباحية:</span>
            <span className="text-[#35D6C2] font-bold font-mono shrink-0">{eventConfig.scrubPartyDateDisplay || '12/12/2026'}</span>
            <span className="hidden sm:inline text-white/30">•</span>
            <span className="hidden sm:inline font-semibold text-[#D7B875]">معهد التمريض — دفعة 2027</span>
          </div>
          <a
            href={eventConfig.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-[#D7B875] hover:text-white transition-colors font-bold bg-[#D7B875]/10 px-2 sm:px-2.5 py-0.5 rounded-lg border border-[#D7B875]/30 shrink-0"
          >
            <Instagram className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#D7B875]" />
            <span dir="ltr">@uofaon.1</span>
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-18 gap-2">
          {/* Logo & Brand */}
          <div
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group min-w-0"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-[#101B2C] to-[#0A0D12] border border-[#35D6C2]/40 flex items-center justify-center shadow-md group-hover:border-[#35D6C2] transition-colors shrink-0">
              <GraduationCap className="w-5 h-5 text-[#35D6C2]" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-extrabold text-xs sm:text-base tracking-wide text-[#F4F8FC] flex items-center gap-1.5 truncate">
                <span>معهد التمريض</span>
                <span className="text-[#35D6C2] font-mono text-[11px] sm:text-sm">2027</span>
              </span>
              <span className="text-[10px] sm:text-xs text-[#D7B875] font-bold tracking-wide truncate">
                دفعة 2027 • حفلة السكراب
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Clean Typography, No Cluttered Icons) */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-1.5">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold transition-all ${
                    isActive
                      ? 'bg-[#35D6C2]/15 text-[#35D6C2] border border-[#35D6C2]/35'
                      : 'text-slate-300 hover:text-[#F4F8FC] hover:bg-white/5'
                  }`}
                >
                  <span>{link.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User & Action Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {currentUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 bg-[#101827] border border-white/10 hover:border-[#21D4C2]/40 rounded-xl px-3 py-1.5 text-right transition-colors"
                >
                  <div className="w-7 h-7 rounded-lg bg-[#21D4C2]/20 border border-[#21D4C2]/30 flex items-center justify-center text-[#21D4C2] font-bold text-xs">
                    {currentUser.fullName.charAt(0)}
                  </div>
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-semibold text-[#F5F7FA] truncate max-w-[120px]">
                      {currentUser.fullName}
                    </span>
                    <span className="text-[10px] text-[#D6B779] font-medium">
                      {currentUser.role === 'admin'
                        ? 'مشرف النظام'
                        : currentUser.role === 'moderator'
                        ? 'منظم الحفل'
                        : currentUser.preferredTitle || 'الممرض(ة)'}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div
                    onMouseLeave={() => setUserDropdownOpen(false)}
                    className="absolute left-0 mt-2 w-56 rounded-xl bg-[#101827] border border-white/10 shadow-2xl p-2 z-50 text-right backdrop-blur-xl"
                  >
                    <div className="px-3 py-2 border-b border-white/10 mb-1">
                      <p className="text-xs font-bold text-white truncate">{currentUser.fullName}</p>
                      <p className="text-[11px] text-[#929BAA] truncate">{currentUser.email}</p>
                    </div>

                    {currentUser.role === 'admin' || currentUser.role === 'moderator' ? (
                      <button
                        onClick={() => {
                          handleNavClick('admin_dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#21D4C2] hover:bg-[#21D4C2]/10 rounded-lg text-right"
                      >
                        <ShieldAlert className="w-4 h-4 text-[#21D4C2]" />
                        <span>لوحة إدارة الفعاليات والمالية</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          handleNavClick('graduate_dashboard');
                          setUserDropdownOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-[#21D4C2] hover:bg-[#21D4C2]/10 rounded-lg text-right"
                      >
                        <User className="w-4 h-4 text-[#21D4C2]" />
                        <span>بوابة خريج التمريض</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        logout();
                        setUserDropdownOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 rounded-lg text-right mt-1 border-t border-white/5"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span>تسجيل الخروج</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#F5F7FA] hover:text-[#21D4C2] hover:bg-white/5 transition-colors"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-black bg-gradient-to-r from-[#21D4C2] to-[#1cb8a9] hover:opacity-90 shadow-sm transition-all"
                >
                  <span>تسجيل خريج</span>
                </button>
              </div>
            )}

            <PWAInstallButton variant="nav" />

            <button
              onClick={() => setNotificationModalOpen(true)}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-[#F5F7FA] border border-white/10 transition-colors"
              title="الإشعارات والتنبيهات"
            >
              <Bell className="w-4 h-4 text-[#21D4C2]" />
            </button>

            {(isAdmin || isModerator) && (
              <button
                onClick={() => navigateTo('admin_dashboard')}
                title="لوحة الإدارة"
                className="px-2.5 py-2 rounded-lg bg-[#D6B777]/15 hover:bg-[#D6B777]/25 text-[#D6B777] border border-[#D6B777]/35 transition-colors text-xs font-bold"
              >
                <span className="text-[11px]">الإدارة</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Toggle & Notification Bell */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setNotificationModalOpen(true)}
              className="p-2 rounded-lg bg-[#101827] text-[#21D4C2] border border-white/10"
              aria-label="التنبيهات"
            >
              <Bell className="w-4 h-4" />
            </button>

            {currentUser && (
              <button
                onClick={() =>
                  handleNavClick(isAdmin ? 'admin_dashboard' : 'graduate_dashboard')
                }
                className="w-9 h-9 rounded-lg bg-[#21D4C2]/20 border border-[#21D4C2]/40 flex items-center justify-center text-[#21D4C2] font-bold text-xs"
              >
                {currentUser.fullName.charAt(0)}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg bg-[#101827] text-[#F5F7FA] hover:text-[#21D4C2] border border-white/10 focus:outline-none"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#090B10]/98 border-b border-white/10 px-4 pt-3 pb-6 space-y-2 backdrop-blur-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="grid grid-cols-2 gap-2 mb-3">
            {navLinks.map((link) => {
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => handleNavClick(link.id)}
                  className={`p-3 rounded-xl text-right text-xs font-bold flex items-center justify-center border transition-all ${
                    isActive
                      ? 'bg-[#21D4C2]/15 text-[#21D4C2] border-[#21D4C2]/40 shadow-sm'
                      : 'bg-[#101827] text-[#929BAA] border-white/5 hover:text-white'
                  }`}
                >
                  <span className="truncate">{link.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-white/10 space-y-2">
            {currentUser ? (
              <>
                <div className="p-3 rounded-xl bg-[#101827] border border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#21D4C2]/20 flex items-center justify-center text-[#21D4C2] font-bold text-xs">
                      {currentUser.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{currentUser.fullName}</p>
                      <p className="text-[10px] text-[#D6B779]">
                        {currentUser.role === 'admin'
                          ? 'مشرف المنصة'
                          : currentUser.role === 'moderator'
                          ? 'منظم الحفل'
                          : currentUser.preferredTitle || 'الممرض(ة)'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                    className="p-1.5 rounded-lg text-red-400 bg-red-500/10 hover:bg-red-500/20 text-xs flex items-center gap-1"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>خروج</span>
                  </button>
                </div>

                {currentUser.role === 'admin' || currentUser.role === 'moderator' ? (
                  <button
                    onClick={() => handleNavClick('admin_dashboard')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#D6B779]/20 to-[#D6B779]/10 border border-[#D6B779]/30 text-[#D6B779] font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <ShieldAlert className="w-4 h-4 text-[#D6B779]" />
                    <span>الدخول للوحة الإدارة والمالية</span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavClick('graduate_dashboard')}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#21D4C2]/20 to-[#21D4C2]/10 border border-[#21D4C2]/30 text-[#21D4C2] font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <User className="w-4 h-4 text-[#21D4C2]" />
                    <span>لوحة حساب الخريج والوصل</span>
                  </button>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleNavClick('login')}
                  className="py-2.5 rounded-xl bg-[#101827] border border-white/10 text-white font-semibold text-xs text-center hover:bg-white/10"
                >
                  تسجيل الدخول
                </button>
                <button
                  onClick={() => handleNavClick('register')}
                  className="py-2.5 rounded-xl bg-[#21D4C2] text-black font-bold text-xs text-center shadow-lg shadow-[#21D4C2]/20"
                >
                  تسجيل خريج جديد
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* Global In-App Notification Center Modal */}
      <NotificationCenterModal
        isOpen={notificationModalOpen}
        onClose={() => setNotificationModalOpen(false)}
      />
    </header>
  );
};
