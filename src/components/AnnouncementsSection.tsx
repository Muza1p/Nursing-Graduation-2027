import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Announcement } from '../types';
import { formatArabicDate } from '../services/storage';
import { Bell, Calendar, Sparkles, AlertCircle, ArrowLeft, Tag, X, Film, Play, Image as ImageIcon } from 'lucide-react';

export const AnnouncementsSection: React.FC<{ limit?: number }> = ({ limit }) => {
  const { announcements } = useApp();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeModalAnn, setActiveModalAnn] = useState<Announcement | null>(null);

  // Only display published announcements in public view
  const published = announcements
    .filter((a) => a.status === 'published')
    .sort((a, b) => a.displayOrder - b.displayOrder);

  const filtered = selectedCategory === 'all'
    ? published
    : published.filter((a) => a.category === selectedCategory);

  const displayList = limit ? filtered.slice(0, limit) : filtered;

  const categories = [
    { id: 'all', label: 'جميع إعلانات الدفعة' },
    { id: 'scrub_night', label: 'حفلة السكراب (12/12/2026)' },
    { id: 'official_grad', label: 'حفل تخرج 2027' },
    { id: 'urgent', label: 'تنبيهات هامة وعاجلة' },
  ];

  return (
    <section className="py-8 sm:py-14 text-right">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 gap-3 sm:gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs text-[#D7B875] font-bold mb-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#D7B875]" />
              <span>منصة تنظيم شؤون الدفعة — تخرج دفعة التمريض 2027</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-[#F4F8FC]">
              إعلانات وتنبيهات الدفعة وآخر المستجدات
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              متابعة مباشرة لتنبيهات فريق تنظيم دفعة 2027، مواعيد التجهيز، وتحديثات فعاليات التخرج.
            </p>
          </div>

          {/* Filter Buttons (Symmetrical 2x2 grid on Android mobile) */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-1.5 w-full sm:w-auto">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all text-center truncate ${
                  selectedCategory === cat.id
                    ? 'bg-[#35D6C2] text-[#0A0D12] font-extrabold shadow-md shadow-[#35D6C2]/20'
                    : 'bg-[#101B2C] text-slate-300 hover:text-white border border-white/10'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {displayList.length === 0 ? (
          <div className="text-center py-12 rounded-2xl bg-[#101B2C]/60 border border-white/10">
            <Bell className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-50" />
            <h4 className="text-base font-bold text-[#F4F8FC] mb-1">لا توجد بيانات حالياً</h4>
            <p className="text-xs text-slate-400">سيتم نشر التحديثات فور إضافتها من قِبل فريق تنظيم الدفعة.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {displayList.map((ann) => {
              const hasVideo = ann.imageUrl && (ann.imageUrl.includes('video') || ann.imageUrl.endsWith('.mp4'));
              const isUrgent = ann.category === 'urgent';
              return (
                <div
                  key={ann.id}
                  className={`rounded-2xl bg-[#101B2C] border transition-all p-5 flex flex-col justify-between group shadow-xl ${
                    isUrgent
                      ? 'border-[#E85D65]/45 hover:border-[#E85D65]'
                      : ann.category === 'scrub_night'
                      ? 'border-indigo-400/30 hover:border-indigo-400/60'
                      : 'border-white/10 hover:border-[#35D6C2]/50'
                  }`}
                >
                  <div>
                    {/* Media Thumbnail preview if available */}
                    {ann.imageUrl && (
                      <div className="mb-4 rounded-xl overflow-hidden aspect-video bg-[#0A0D12] relative border border-white/5">
                        {hasVideo ? (
                          <div className="w-full h-full flex items-center justify-center bg-[#342A78]/60">
                            <Film className="w-10 h-10 text-[#D7B875] group-hover:scale-110 transition-transform" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
                                <Play className="w-5 h-5 ml-1 fill-white" />
                              </span>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={ann.imageUrl}
                            alt={ann.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="flex items-center gap-1 text-slate-400">
                        <Calendar className="w-3.5 h-3.5 text-[#35D6C2]" />
                        <span>{formatArabicDate(ann.publishedAt)}</span>
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-lg border text-[11px] font-bold ${
                          isUrgent
                            ? 'bg-[#E85D65]/15 border-[#E85D65]/40 text-[#E85D65]'
                            : ann.category === 'scrub_night'
                            ? 'bg-[#342A78]/60 border-indigo-400/40 text-indigo-200'
                            : 'bg-[#35D6C2]/15 border-[#35D6C2]/30 text-[#35D6C2]'
                        }`}
                      >
                        {ann.category === 'scrub_night'
                          ? 'حفلة السكراب'
                          : ann.category === 'official_grad'
                          ? 'حفل تخرج 2027'
                          : ann.category === 'urgent'
                          ? 'تنبيه عاجل'
                          : 'إعلان عام'}
                      </span>
                    </div>

                    <h3 className="text-base font-extrabold text-[#F4F8FC] mb-2 group-hover:text-[#35D6C2] transition-colors leading-snug">
                      {ann.title}
                    </h3>

                    <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed mb-4">
                      {ann.description}
                    </p>
                  </div>

                  <div className="border-t border-white/10 pt-3">
                    <button
                      onClick={() => setActiveModalAnn(ann)}
                      className="w-full flex items-center justify-between text-xs font-extrabold text-[#35D6C2] hover:text-white transition-colors py-1"
                    >
                      <span>قراءة المنشور والتفاصيل</span>
                      <ArrowLeft className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal for viewing announcement in detail */}
        {activeModalAnn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#101827] border border-[#21D4C2]/30 p-6 shadow-2xl text-right max-h-[90vh] overflow-y-auto">
              <button
                onClick={() => setActiveModalAnn(null)}
                className="absolute top-4 left-4 p-1.5 rounded-lg text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#21D4C2]/10 border border-[#21D4C2]/30 text-[#21D4C2] text-xs font-bold mb-3">
                <Bell className="w-3.5 h-3.5" />
                <span>إعلان من فريق تنظيم دفعة 2027</span>
              </div>

              {activeModalAnn.imageUrl && (
                <div className="mb-4 rounded-2xl overflow-hidden max-h-60 bg-black flex items-center justify-center">
                  {activeModalAnn.imageUrl.includes('video') || activeModalAnn.imageUrl.endsWith('.mp4') ? (
                    <video src={activeModalAnn.imageUrl} controls className="max-h-56 w-auto" />
                  ) : (
                    <img src={activeModalAnn.imageUrl} alt={activeModalAnn.title} className="max-h-56 w-auto object-contain" />
                  )}
                </div>
              )}

              <h3 className="text-xl font-black text-white mb-2 leading-snug">
                {activeModalAnn.title}
              </h3>

              <div className="flex items-center gap-2 text-xs text-[#929BAA] mb-4 pb-3 border-b border-white/10">
                <Calendar className="w-3.5 h-3.5 text-[#21D4C2]" />
                <span>تاريخ النشر: {formatArabicDate(activeModalAnn.publishedAt)}</span>
                <span className="text-[#D6B779]">• تخرج طلاب معهد التمريض (دفعة 2027)</span>
              </div>

              <div className="text-sm text-[#F5F7FA]/90 leading-relaxed whitespace-pre-line mb-6 bg-[#090B10]/50 p-4 rounded-xl border border-white/5">
                {activeModalAnn.description}
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setActiveModalAnn(null)}
                  className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
