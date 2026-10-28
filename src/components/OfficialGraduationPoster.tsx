import React, { useState, useEffect } from 'react';
import {
  Maximize2,
  X,
  Calendar,
  Sparkles,
  Download,
  Share2,
  Check,
} from 'lucide-react';

const POSTER_IMAGE_PATH = '/assets/aistudio/IMG_20261027_152202_663_a6c34064.jpg';

export const OfficialGraduationPoster: React.FC = () => {
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsZoomOpen(false);
      }
    };
    if (isZoomOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isZoomOpen]);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'بوستر تخرج دفعة التمريض 2027',
          text: 'احفظ التاريخ! موعد حفلة تخرج طلاب معهد التمريض — دفعة 2027.',
          url: window.location.href,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <section className="relative max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6" aria-labelledby="official-poster-title">
      {/* Container with liquid glass styling and refined borders */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-b from-[#142638]/90 via-[#0D1824]/90 to-[#0A0D12]/95 border border-[#35D6C5]/30 shadow-2xl backdrop-blur-xl p-4 sm:p-7">
        {/* Subtle decorative glow */}
        <div className="absolute top-0 right-1/4 w-72 sm:w-96 h-40 bg-[#35D6C5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-72 sm:w-96 h-40 bg-[#D6B777]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 sm:mb-6 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#35D6C5]/10 border border-[#35D6C5]/30 text-[#35D6C5] text-[11px] sm:text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>فعاليات تخرج دفعة 2027</span>
            </div>
            <h2 id="official-poster-title" className="text-xl sm:text-2xl lg:text-3xl font-black text-white flex items-center gap-2.5">
              <span>بوستر تخرج دفعة التمريض 2027</span>
              <span className="text-xs sm:text-sm font-bold text-[#D6B777] bg-[#D6B777]/10 px-2.5 py-0.5 rounded-lg border border-[#D6B777]/30">
                12 • 12 • 2026
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              بوستر حفلة تخرج طلاب معهد التمريض — دفعة 2027 (احفظ التاريخ: 12 / 12 / 2026).
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={handleShare}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="مشاركة رابط البوستر"
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">تم النسخ</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-[#35D6C5]" />
                  <span>مشاركة</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsZoomOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] font-black text-xs shadow-lg shadow-[#35D6C5]/20 flex items-center gap-1.5 hover:opacity-95 active:scale-95 transition-all cursor-pointer"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>تكبير البوستر</span>
            </button>
          </div>
        </div>

        {/* Poster Showcase Card */}
        <div
          onClick={() => setIsZoomOpen(true)}
          className="group relative cursor-pointer rounded-2xl overflow-hidden bg-[#0A0D12] border border-white/10 hover:border-[#35D6C5]/60 transition-all duration-300 shadow-xl flex justify-center items-center max-w-xl mx-auto"
        >
          {/* Preserving image aspect ratio completely with no cropping */}
          <div className="relative w-full flex justify-center bg-[#070A0F] p-2 sm:p-3">
            <img
              src={POSTER_IMAGE_PATH}
              alt="بوستر التخرج الرسمي — معهد التمريض دفعة 2027"
              className="w-full max-h-[580px] sm:max-h-[680px] object-contain rounded-xl transition-transform duration-300 group-hover:scale-[1.01]"
              loading="eager"
            />

            {/* Hover overlay hint */}
            <div className="absolute inset-0 bg-[#0A0D12]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center pointer-events-none rounded-xl">
              <div className="px-4 py-2 rounded-2xl bg-[#0A0D12]/90 border border-[#35D6C5] text-white text-xs sm:text-sm font-bold flex items-center gap-2 shadow-2xl backdrop-blur-md">
                <Maximize2 className="w-4 h-4 text-[#35D6C5]" />
                <span>انقر لعرض البوستر بدقة كاملة</span>
              </div>
            </div>
          </div>
        </div>

        {/* Small subtitle footer */}
        <div className="mt-4 pt-3 border-t border-white/5 flex flex-wrap items-center justify-between gap-2 text-[11px] sm:text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#35D6C5]" />
            <span>موعد الحفل المعتمد: السبت 12 كانون الأول (ديسمبر) 2026</span>
          </div>
          <span className="text-[#D6B777] font-semibold">معهد التمريض — دفعة ملائكة الرحمة</span>
        </div>
      </div>

      {/* Enlarged Modal for full viewing */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIsZoomOpen(false)}
        >
          <div
            className="relative max-w-2xl w-full max-h-[96vh] rounded-3xl bg-[#0D1824] border border-[#35D6C5]/50 shadow-2xl overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Top Bar */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#142638]/95 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#35D6C5]" />
                <h3 className="text-sm sm:text-base font-black text-white">
                  بوستر التخرج الرسمي بدقة كاملة
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href={POSTER_IMAGE_PATH}
                  download="بوستر_تخرج_معهد_التمريض_2027.jpg"
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-[#35D6C5]" />
                  <span className="hidden sm:inline">تحميل البوستر</span>
                </a>

                <button
                  type="button"
                  onClick={() => setIsZoomOpen(false)}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-slate-300 hover:text-red-400 border border-white/10 transition-colors cursor-pointer"
                  title="إغلاق النافذة"
                  aria-label="إغلاق"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Image Area */}
            <div className="p-3 sm:p-4 overflow-y-auto flex justify-center items-center bg-[#070A0F]">
              <img
                src={POSTER_IMAGE_PATH}
                alt="بوستر التخرج الرسمي"
                className="max-h-[82vh] w-auto max-w-full object-contain rounded-xl shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
