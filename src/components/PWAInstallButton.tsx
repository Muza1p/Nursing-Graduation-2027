import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Smartphone, Download, Share2, PlusSquare, X, CheckCircle2 } from 'lucide-react';

export const PWAInstallButton: React.FC<{ variant?: 'nav' | 'hero' | 'banner' }> = ({ variant = 'nav' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showAndroidInfo, setShowAndroidInfo] = useState(false);

  // If already running in standalone PWA mode, don't show prompt
  if (isInstalled) {
    return null;
  }

  // Native Chrome / Edge / Android install prompt available
  if (isInstallable) {
    if (variant === 'hero' || variant === 'banner') {
      return (
        <button
          onClick={install}
          className="inline-flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#21D4C2] to-[#0D9488] text-black font-black text-xs sm:text-sm shadow-[0_0_20px_rgba(33,212,194,0.3)] hover:brightness-110 active:scale-95 transition-all"
        >
          <Smartphone className="w-4 h-4" />
          <span>تثبيت التطبيق على الهاتف</span>
        </button>
      );
    }

    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-[#21D4C2]/20 text-[#21D4C2] border border-[#21D4C2]/30 text-xs font-bold transition-all active:scale-95 shadow-sm"
        title="تثبيت التطبيق على جهازك (PWA)"
      >
        <Download className="w-3.5 h-3.5" />
        <span className="hidden md:inline">تثبيت التطبيق</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/8 hover:bg-white/12 text-[#929BAA] hover:text-white border border-white/10 text-xs font-medium transition-all"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#21D4C2]" />
          <span className="hidden md:inline">تثبيت على iPhone</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-right">
            <div className="w-full max-w-sm rounded-2xl bg-[#0F141F] border border-white/15 p-6 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 rounded-xl bg-[#21D4C2]/20 border border-[#21D4C2]/30 flex items-center justify-center text-[#21D4C2] mb-4">
                <Smartphone className="w-6 h-6" />
              </div>

              <h3 className="text-base font-black mb-2">تثبيت التطبيق على iPhone / iPad</h3>
              <p className="text-xs text-[#929BAA] leading-relaxed mb-4">
                يمكنك إضافة المنصة إلى شاشتك الرئيسية كتطبيق مستقل دون الحاجة لمتجر App Store:
              </p>

              <div className="space-y-3 bg-white/5 rounded-xl p-3 text-xs mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <Share2 className="w-3.5 h-3.5 text-[#21D4C2]" />
                  </div>
                  <span>1. اضغط على أيقونة <strong>المشاركة (Share)</strong> في شريط متصفح Safari.</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                    <PlusSquare className="w-3.5 h-3.5 text-[#D6B779]" />
                  </div>
                  <span>2. مرر للأسفل واختر <strong>إضافة إلى الشاشة الرئيسية (Add to Home Screen)</strong>.</span>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2.5 rounded-xl bg-[#21D4C2] text-black font-extrabold text-xs hover:brightness-110 transition"
              >
                فهمت ذلك
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback info button for other browsers / Android
  return (
    <>
      <button
        onClick={() => setShowAndroidInfo(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 text-xs font-semibold transition-all"
        title="تثبيت التطبيق على هاتفك"
      >
        <Smartphone className="w-3.5 h-3.5 text-[#21D4C2]" />
        <span className="hidden md:inline">تطبيق الهاتف</span>
      </button>

      {showAndroidInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 text-right">
          <div className="w-full max-w-sm rounded-2xl bg-[#0F141F] border border-white/15 p-6 shadow-2xl text-white relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowAndroidInfo(false)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-12 h-12 rounded-xl bg-[#21D4C2]/20 border border-[#21D4C2]/30 flex items-center justify-center text-[#21D4C2] mb-4">
              <Smartphone className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black mb-2">تطبيق الويب التقدمي (PWA) للآندرويد</h3>
            <p className="text-xs text-[#929BAA] leading-relaxed mb-4">
              يعمل هذا الموقع كتطبيق ويب سريع وقابل للتثبيت (PWA) مع دعم كامل لوضع عدم الاتصال والشاشة الكاملة.
            </p>

            <div className="space-y-3 bg-white/5 rounded-xl p-3 text-xs mb-5">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#21D4C2] shrink-0" />
                <span>من متصفح Chrome: اضغط القائمة (⋮) ثم <strong>تثبيت التطبيق (Install app)</strong>.</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[#D6B779] shrink-0" />
                <span>لا يستهلك مساحة تخزين كملفات APK الخارجية ويعمل بأحدث نسخة تلقائياً.</span>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidInfo(false)}
              className="w-full py-2.5 rounded-xl bg-[#21D4C2] text-black font-extrabold text-xs hover:brightness-110 transition"
            >
              حسناً
            </button>
          </div>
        </div>
      )}
    </>
  );
};
