import React from 'react';
import { useApp } from '../context/AppContext';
import { formatIQD, formatArabicDate } from '../services/storage';
import {
  Printer,
  X,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { activeReceipt, closeReceipt, graduates, scrubStudents, eventConfig } = useApp();

  if (!activeReceipt) return null;

  const graduate = graduates.find((g) => g.id === activeReceipt.graduateId);
  const scrubStu = scrubStudents.find(
    (s) => s.id === activeReceipt.graduateId || s.fullName === activeReceipt.graduateName
  );
  const remainingScrub = scrubStu
    ? scrubStu.remainingBalanceIQD
    : graduate?.scrubBalanceIQD ?? 0;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl rounded-3xl bg-[#10151C] border-2 border-[#D6B777]/45 shadow-2xl p-6 sm:p-8 text-right overflow-y-auto max-h-[90vh]">
        {/* Modal Close Button */}
        <button
          onClick={closeReceipt}
          className="absolute top-4 left-4 p-2 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 no-print"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Printable Official Receipt Area */}
        <div id="printable-receipt" className="space-y-6">
          {/* Header */}
          <div className="text-center border-b border-white/15 pb-5 space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#D6B777]/15 border border-[#D6B777]/30 text-[#D6B777] text-[11px] font-bold mb-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>وصل استلام مساهمة — فريق تنظيم دفعة 2027</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-wider">
              تخرج دفعة التمريض 2027
            </h2>
            <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
              {activeReceipt.eventTarget === 'scrub_night' ? (
                <span className="px-3 py-1 rounded-full bg-[#1C354A] text-[#A6F0DF] border border-[#35D6C5]/35 text-xs font-bold">
                  سند قبض: حفلة السكراب ({eventConfig.scrubVenue || 'مسرح تفاحة المصور'})
                </span>
              ) : (
                <span className="px-3 py-1 rounded-full bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/30 text-xs font-bold">
                  سند قبض: حفل تخرج دفعة 2027 (وشاح التمريض)
                </span>
              )}

              {activeReceipt.paymentStatus && (
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                    activeReceipt.paymentStatus === 'completed'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  }`}
                >
                  حالة الدفعة:{' '}
                  {activeReceipt.paymentStatus === 'deposit'
                    ? 'دافع عربون'
                    : activeReceipt.paymentStatus === 'completed'
                    ? 'مكتمل'
                    : 'مدفوع جزئياً'}
                </span>
              )}
            </div>
            <p className="text-[10px] text-[#E8EEF2]/70 mt-1">
              سند قبض تنظيمي صادر عن فريق تنظيم شؤون تخرج طلاب معهد التمريض — دفعة 2027
            </p>
          </div>

          {/* Key Receipt Meta */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#142638] border border-white/10 text-xs">
            <div>
              <span className="text-[#E8EEF2]/70 block text-[11px]">رقم الوصل:</span>
              <span className="font-mono font-bold text-white text-sm">
                {activeReceipt.receiptNumber}
              </span>
            </div>
            <div>
              <span className="text-[#E8EEF2]/70 block text-[11px]">المرجع المالي:</span>
              <span className="font-mono font-bold text-[#D6B777]">
                {activeReceipt.referenceCode}
              </span>
            </div>
            <div>
              <span className="text-[#E8EEF2]/70 block text-[11px]">تاريخ الدفع:</span>
              <span className="font-bold text-white">{formatArabicDate(activeReceipt.date)}</span>
            </div>
            <div>
              <span className="text-[#E8EEF2]/70 block text-[11px]">وقت السند:</span>
              <span className="font-mono text-white">{activeReceipt.time}</span>
            </div>
          </div>

          {/* Student & Financial Data (No Total Fee Field) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs sm:text-sm">
              <span className="text-[#E8EEF2]/80">اسم الطالب:</span>
              <span className="font-black text-white text-base">{activeReceipt.graduateName}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl text-xs sm:text-sm bg-[#142638] border border-[#35D6C5]/35">
              <span className="text-white font-bold">المبلغ المدفوع:</span>
              <span className="font-black text-xl font-mono text-[#35D6C5]">
                {formatIQD(activeReceipt.amountIQD)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[#E8EEF2]/70 block text-[11px]">طريقة الدفع:</span>
                <span className="font-bold text-white">
                  {activeReceipt.method === 'cash' ? 'نقدي (كاش باليد)' : 'تحويل بنكي يدوي مدقق'}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-[#E8EEF2]/70 block text-[11px]">المبلغ المتبقي:</span>
                <span className="font-bold font-mono text-[#D6B777]">
                  {formatIQD(
                    activeReceipt.eventTarget === 'scrub_night'
                      ? remainingScrub
                      : graduate?.gradBalanceIQD ?? 0
                  )}
                </span>
              </div>
            </div>

            {activeReceipt.notes && (
              <div className="p-3 rounded-xl bg-white/5 text-xs text-[#E8EEF2]/80">
                <span className="font-semibold text-white ml-1">ملاحظات السند:</span>
                {activeReceipt.notes}
              </div>
            )}
          </div>

          {/* Stamp & Authorized Officers Signatures */}
          <div className="border-t border-dashed border-white/20 pt-4 flex items-center justify-between text-xs">
            <div className="space-y-1">
              <span className="text-[11px] text-[#E8EEF2]/70 block">أمين الصندوق والتدقيق:</span>
              <span className="font-bold text-white text-xs">{activeReceipt.recordedBy}</span>
            </div>
            <div className="text-center p-2 rounded-xl bg-[#D6B777]/10 border border-[#D6B777]/30">
              <div className="w-12 h-12 rounded-full border-2 border-[#D6B777] text-[#D6B777] flex flex-col items-center justify-center mx-auto text-[9px] font-black uppercase tracking-tighter">
                <CheckCircle2 className="w-4 h-4 mb-0.5" />
                <span>معتمد</span>
              </div>
              <span className="text-[9px] text-[#D6B777] font-bold mt-1 block">
                اللجنة المنظمة 2027
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons (Excluded in print) */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center justify-end gap-3 no-print">
          <button
            onClick={closeReceipt}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
          >
            إغلاق
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 rounded-xl bg-[#35D6C5] hover:opacity-95 text-[#10151C] font-extrabold text-xs shadow-lg shadow-[#35D6C5]/20 flex items-center gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>طباعة الوصل / حفظ PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
