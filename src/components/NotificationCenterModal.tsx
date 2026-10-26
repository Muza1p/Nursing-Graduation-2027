import React, { useState, useEffect } from 'react';
import { useApp, PageRoute } from '../context/AppContext';
import {
  Bell,
  X,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Sparkles,
  ExternalLink,
  Trash2,
  Check,
  ShieldCheck,
  Radio,
} from 'lucide-react';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  isRead: boolean;
  type: 'announcement' | 'event' | 'payment' | 'system';
  targetRoute?: PageRoute;
  targetId?: string;
}

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    title: 'تثبيت موعد ومكان حفلة السكراب',
    body: 'تم تحديد موعد حفلة السكراب يوم 12/12/2026 في مسرح تفاحة المصور بعدسة باقر حسن. المساهمة 35,000 د.ع.',
    timestamp: '2026-10-25 10:00',
    isRead: false,
    type: 'event',
    targetRoute: 'scrub_night',
  },
  {
    id: 'notif-2',
    title: 'فتح باب توثيق الوصولات واستلام العربون',
    body: 'يمكن لجميع طلبة معهد التمريض دفعة 2027 تسليم الكاش للمنظمين واستلام الوصل الرسمي برقم تسلسلي موثق.',
    timestamp: '2026-10-24 14:30',
    isRead: false,
    type: 'payment',
    targetRoute: 'payments',
  },
  {
    id: 'notif-3',
    title: 'تحديث هوية حفل التخرج الرسمي 2027',
    body: 'اعتمدت اللجنة اللون التركوازي لوشاح التمريض لحفل التخرج الرسمي لدفعة 2027.',
    timestamp: '2026-10-22 09:15',
    isRead: true,
    type: 'announcement',
    targetRoute: 'official_grad',
  },
];

export const NotificationCenterModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { navigateTo } = useApp();
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const saved = localStorage.getItem('nursing_grad_notifications_v1');
      return saved ? JSON.parse(saved) : DEFAULT_NOTIFICATIONS;
    } catch {
      return DEFAULT_NOTIFICATIONS;
    }
  });

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [permissionBannerDismissed, setPermissionBannerDismissed] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  const saveNotifications = (updated: AppNotification[]) => {
    setNotifications(updated);
    try {
      localStorage.setItem('nursing_grad_notifications_v1', JSON.stringify(updated));
    } catch (e) {
      console.warn('Failed to save notifications to localStorage:', e);
    }
  };

  const handleRequestBrowserPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('متصفحك الحالي لا يدعم إشعارات الويب.');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      if (permission === 'granted') {
        new Notification('معهد التمريض — دفعة 2027', {
          body: 'تم تفعيل التنبيهات بنجاح! ستصلك آخر أخبار حفلة السكراب والتخرج أولاً بأول.',
          icon: '/icon.svg',
        });
      }
    } catch (err) {
      console.warn('Notification permission error:', err);
    }
  };

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
  };

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const handleClearAll = () => {
    saveNotifications([]);
  };

  const handleNotificationClick = (notif: AppNotification) => {
    handleMarkAsRead(notif.id);
    if (notif.targetRoute) {
      navigateTo(notif.targetRoute);
      onClose();
    }
  };

  if (!isOpen) return null;

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const filtered = activeTab === 'unread' ? notifications.filter((n) => !n.isRead) : notifications;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md text-right animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-3xl bg-[#0F141F] border border-white/12 shadow-2xl p-5 sm:p-6 text-white max-h-[90vh] flex flex-col relative">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-[#21D4C2]/15 border border-[#21D4C2]/30 flex items-center justify-center text-[#21D4C2]">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="text-base font-black">مركز التنبيهات والإشعارات</h3>
              <p className="text-xs text-[#929BAA]">
                دفعة 2027 • حفلة السكراب
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Browser Push Permission Banner (if not yet granted) */}
        {browserPermission === 'default' && !permissionBannerDismissed && (
          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border border-indigo-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#21D4C2] animate-pulse shrink-0" />
              <span className="leading-snug">تفعيل إشعارات الهاتف الفورية عند نشر أي قرار أو موعد جديد</span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleRequestBrowserPermission}
                className="px-3 py-1.5 rounded-xl bg-[#21D4C2] hover:bg-[#1bb8a8] text-black font-extrabold text-[11px] transition"
              >
                تفعيل الآن
              </button>
              <button
                onClick={() => setPermissionBannerDismissed(true)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tabs & Bulk Actions */}
        <div className="flex items-center justify-between mt-4 mb-3 text-xs">
          <div className="flex gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'all' ? 'bg-[#21D4C2] text-black' : 'text-[#929BAA] hover:text-white'
              }`}
            >
              الكل ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'unread' ? 'bg-[#21D4C2] text-black' : 'text-[#929BAA] hover:text-white'
              }`}
            >
              غير مقروءة ({unreadCount})
            </button>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[#21D4C2] hover:underline flex items-center gap-1"
              >
                <Check className="w-3 h-3" />
                <span>تحديد الكل كمقروء</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-gray-400 hover:text-red-400 flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                <span>مسح</span>
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 py-1">
          {filtered.length === 0 ? (
            <div className="text-center py-14 space-y-2">
              <Sparkles className="w-10 h-10 text-gray-600 mx-auto" />
              <p className="text-sm font-bold text-gray-400">لا توجد إشعارات جديدة</p>
              <p className="text-xs text-gray-500">أنت على اطلاع بجميع مستجدات الدفعة وحفل السكراب!</p>
            </div>
          ) : (
            filtered.map((notif) => (
              <div
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 relative group ${
                  notif.isRead
                    ? 'bg-white/[0.02] border-white/5 hover:border-white/15'
                    : 'bg-gradient-to-r from-[#101827] to-[#141d2e] border-[#21D4C2]/30 hover:border-[#21D4C2]'
                }`}
              >
                {!notif.isRead && (
                  <span className="w-2 h-2 rounded-full bg-[#21D4C2] absolute top-4 left-4 shadow-[0_0_8px_#21D4C2]" />
                )}

                <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  {notif.type === 'event' ? (
                    <Calendar className="w-4 h-4 text-indigo-400" />
                  ) : notif.type === 'payment' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#D6B779]" />
                  ) : (
                    <Bell className="w-4 h-4 text-[#21D4C2]" />
                  )}
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white group-hover:text-[#21D4C2] transition-colors">
                      {notif.title}
                    </h4>
                  </div>
                  <p className="text-xs text-[#929BAA] leading-relaxed line-clamp-2">
                    {notif.body}
                  </p>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-gray-500">
                    <span>{notif.timestamp}</span>
                    {notif.targetRoute && (
                      <span className="text-[#21D4C2] flex items-center gap-1">
                        <span>عرض التفاصيل</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="border-t border-white/10 pt-3 mt-3 flex items-center justify-between text-xs text-[#929BAA]">
          <span className="flex items-center gap-1 text-[#21D4C2] text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>نظام إشعارات خاص بمعهد التمريض</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold transition"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
