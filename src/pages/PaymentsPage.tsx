import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  searchStudentPaymentByName,
  getStudentPaymentById,
  StudentLookupCandidate,
  normalizeArabicName,
} from '../services/studentManagement';
import { AnimatedEcgWaveform } from '../components/MedicalIllustrations';
import {
  Sparkles,
  GraduationCap,
  CheckCircle2,
  Clock,
  Search,
  UserCheck,
  AlertTriangle,
  RefreshCw,
  Database,
} from 'lucide-react';

interface MatchedStudentLookupData {
  id: string;
  fullName: string;
  paidAmountIQD: number;
  gradPaidAmountIQD: number;
  totalFeeIQD: number;
}

export const PaymentsPage: React.FC = () => {
  const {
    eventConfig,
    payments,
    scrubStudents,
    studentPayments,
  } = useApp();

  // Public Student Payment Lookup State (No Login, No Password, No Verification Code)
  const [lookupQueryName, setLookupQueryName] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<MatchedStudentLookupData | null>(null);
  const [multipleCandidates, setMultipleCandidates] = useState<StudentLookupCandidate[]>([]);

  const activeScrubStudents = scrubStudents.filter((s) => s.status === 'active');
  const isDatabaseEmpty = activeScrubStudents.length === 0;

  // Helper to compute any additional Official Graduation payments recorded in the general payments ledger
  const computeTotalOfficialGradPaid = (student: MatchedStudentLookupData): number => {
    const normStudentName = normalizeArabicName(student.fullName);
    const ledgerGradPaid = payments
      .filter(
        (p) =>
          p.eventTarget === 'official_grad' &&
          p.isVerified !== false &&
          (p.studentId === student.id ||
            (p.graduateName && normalizeArabicName(p.graduateName) === normStudentName))
      )
      .reduce((sum, p) => sum + Math.max(0, Number(p.amountIQD) || 0), 0);

    return Math.max(student.gradPaidAmountIQD || 0, ledgerGradPaid);
  };

  const handleSearchStudentName = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setMatchedStudent(null);
    setMultipleCandidates([]);

    if (isDatabaseEmpty) {
      setLookupError('لم تتم إضافة سجلات الطلاب بعد في قاعدة البيانات.');
      return;
    }

    const trimmed = lookupQueryName.trim();
    if (!trimmed) {
      setLookupError('يرجى كتابة اسم الطالب في حقل البحث أولاً.');
      return;
    }

    const result = searchStudentPaymentByName(trimmed, scrubStudents, studentPayments);

    if (result.status === 'empty_database') {
      setLookupError('لم تتم إضافة سجلات الطلاب بعد في قاعدة البيانات.');
      return;
    }

    if (result.status === 'not_found') {
      setLookupError('لم يتم العثور على طالب مطابق لهذا الاسم. يرجى التأكد من كتابة الاسم بصورة صحيحة.');
      return;
    }

    if (result.status === 'multiple_matches' && result.candidates) {
      setMultipleCandidates(result.candidates);
      return;
    }

    if (result.status === 'single_match' && result.student) {
      setMatchedStudent(result.student);
    }
  };

  const handleSelectCandidate = (studentId: string) => {
    const record = getStudentPaymentById(studentId, scrubStudents, studentPayments);
    if (record) {
      setMultipleCandidates([]);
      setLookupError(null);
      setMatchedStudent(record);
    }
  };

  const resetLookup = () => {
    setLookupQueryName('');
    setLookupError(null);
    setMatchedStudent(null);
    setMultipleCandidates([]);
  };

  // Official Scrub Party Price (defaults to 35,000 IQD, or updated by admin)
  const officialScrubPriceIQD =
    matchedStudent?.totalFeeIQD && matchedStudent.totalFeeIQD > 0
      ? matchedStudent.totalFeeIQD
      : eventConfig.scrubFeeIQD > 0
      ? eventConfig.scrubFeeIQD
      : 35000;

  const scrubPaidIQD = matchedStudent ? matchedStudent.paidAmountIQD : 0;
  const scrubRemainingIQD = Math.max(0, officialScrubPriceIQD - scrubPaidIQD);
  const isScrubCompleted = scrubPaidIQD >= officialScrubPriceIQD && officialScrubPriceIQD > 0;

  // Official Graduation Price (defaults to "قريباً — لم يتم تحديد السعر" until confirmed by admin)
  const isOfficialGradPriceConfirmed = Boolean(
    eventConfig.isOfficialGradPriceConfirmed && eventConfig.officialGradFeeIQD > 0
  );
  const officialGradPriceIQD = isOfficialGradPriceConfirmed
    ? eventConfig.officialGradFeeIQD
    : 0;
  const gradPaidIQD = matchedStudent ? computeTotalOfficialGradPaid(matchedStudent) : 0;
  const gradRemainingIQD = isOfficialGradPriceConfirmed
    ? Math.max(0, officialGradPriceIQD - gradPaidIQD)
    : 0;
  const isGradCompleted =
    isOfficialGradPriceConfirmed && gradPaidIQD >= officialGradPriceIQD && officialGradPriceIQD > 0;

  return (
    <div className="py-6 sm:py-10 space-y-6 sm:space-y-8 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
      {/* Page Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#142638] border border-[#35D6C5]/35 text-xs font-bold text-white">
          <GraduationCap className="w-3.5 h-3.5 text-[#35D6C5]" />
          <span>قائمة الطلاب والدفعات — تخرج دفعة التمريض 2027</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          الاستعلام المباشر عن دفعات التخرج
        </h1>
        <p className="text-xs sm:text-sm text-[#E8EEF2]/80">
          اكتب اسمك في حقل البحث واضغط على «بحث» لعرض تفاصيل دفعات حفلة السكراب وحفل تخرج دفعة 2027 مباشرة دون الحاجة لتسجيل الدخول.
        </p>
        <AnimatedEcgWaveform color="#35D6C5" opacity="opacity-20" className="w-full h-8 pt-1" />
      </div>

      {/* Empty Database Notice (if no student records exist yet) */}
      {isDatabaseEmpty ? (
        <div className="max-w-xl mx-auto rounded-3xl glass-panel p-6 sm:p-8 border border-[#D6B777]/40 text-center space-y-3 shadow-2xl">
          <Database className="w-10 h-10 text-[#D6B777] mx-auto" />
          <h2 className="text-base sm:text-lg font-black text-white">
            لم تتم إضافة سجلات الطلاب بعد
          </h2>
          <p className="text-xs sm:text-sm text-[#E8EEF2]/80 leading-relaxed">
            قاعدة بيانات الطلاب فارغة حالياً. ستظهر بيانات الدفعات هنا فور قيام الإدارة بإضافة سجلات طلبة الدفعة.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Search Input Box */}
          <div className="max-w-xl mx-auto rounded-3xl glass-panel-turquoise p-5 sm:p-7 border border-[#35D6C5]/35 shadow-2xl space-y-5">
            <form onSubmit={handleSearchStudentName} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="student-name-lookup"
                  className="block text-sm sm:text-base font-black text-white"
                >
                  اسم الطالب
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <input
                    id="student-name-lookup"
                    type="text"
                    value={lookupQueryName}
                    onChange={(e) => {
                      setLookupQueryName(e.target.value);
                      if (lookupError) setLookupError(null);
                    }}
                    placeholder="اكتب اسمك الثنائي أو الثلاثي (مثال: حسين علاء كاظم)"
                    autoComplete="off"
                    className="flex-1 rounded-2xl bg-[#10151C]/95 border border-white/20 focus:border-[#35D6C5] px-4 py-3.5 text-sm sm:text-base font-bold text-white placeholder-[#E8EEF2]/40 outline-none transition-all shadow-inner"
                  />
                  <button
                    type="submit"
                    className="py-3.5 px-7 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#A6F0DF] hover:opacity-95 active:scale-[0.99] text-[#10151C] font-black text-sm sm:text-base shadow-lg shadow-[#35D6C5]/25 flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
                  >
                    <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span>بحث</span>
                  </button>
                </div>
              </div>
            </form>

            {/* Error Message when No Match Found */}
            {lookupError && (
              <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-100 text-xs sm:text-sm font-extrabold flex items-center gap-3 animate-in fade-in duration-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* Disambiguation List when Multiple Students Match */}
            {multipleCandidates.length > 1 && !matchedStudent && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#10151C]/90 border border-[#D6B777]/40 space-y-3 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-black text-[#D6B777]">
                    توجد عدة أسماء مطابقة، اختر اسمك الكامل لعرض الدفعات:
                  </h3>
                </div>

                <div className="space-y-2">
                  {multipleCandidates.map((candidate) => (
                    <button
                      key={candidate.id}
                      type="button"
                      onClick={() => handleSelectCandidate(candidate.id)}
                      className="w-full text-right p-3.5 rounded-xl bg-[#142638] hover:bg-[#1C354A] border border-white/10 hover:border-[#35D6C5]/50 text-white font-bold text-xs sm:text-sm flex items-center justify-between transition-all cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <UserCheck className="w-4 h-4 text-[#35D6C5] shrink-0" />
                        <span>{candidate.fullName}</span>
                      </span>
                      <span className="text-[11px] text-[#35D6C5] font-extrabold">
                        عرض الدفعات
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* =============================================================== */}
          {/* IMMEDIATE STUDENT PAYMENT RESULTS (CARD 1 & CARD 2)             */}
          {/* =============================================================== */}
          {matchedStudent && (
            <div className="space-y-5 animate-in fade-in duration-300">
              {/* Matched Student Name Banner */}
              <div className="rounded-2xl bg-[#101827]/90 backdrop-blur-xl border border-[#35D6C5]/40 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center font-black">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#A6F0DF] font-bold block">
                      بيانات دفعات التخرج المسجلة للطالب
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-white">
                      {matchedStudent.fullName}
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={resetLookup}
                  className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-[#E8EEF2] font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[#35D6C5]" />
                  <span>بحث عن اسم آخر</span>
                </button>
              </div>

              {/* Two Cards Grid: CARD 1 (Scrub Party) & CARD 2 (Official Graduation) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* CARD 1: حفلة السكراب */}
                <div className="rounded-3xl bg-[#0D1726]/85 backdrop-blur-2xl border border-[#35D6C5]/40 p-5 sm:p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#35D6C5]/15 border border-[#35D6C5]/35 text-[#35D6C5] flex items-center justify-center">
                        <Sparkles className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white">
                          حفلة السكراب
                        </h3>
                        <span className="text-[11px] text-[#A6F0DF] font-semibold">
                          دفعة 2027 — معهد التمريض
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black border ${
                        isScrubCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {isScrubCompleted ? 'مكتمل' : 'غير مكتمل'}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[#E8EEF2]/80 font-bold">مبلغ المساهمة المحدد:</span>
                      <span className="font-black text-white text-sm sm:text-base">
                        {officialScrubPriceIQD.toLocaleString('en-US')} دينار عراقي
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-[#35D6C5]/30 flex items-center justify-between gap-2">
                      <span className="text-[#A6F0DF] font-bold">المبلغ الواصل:</span>
                      <span className="font-black text-[#35D6C5] text-sm sm:text-base">
                        {scrubPaidIQD.toLocaleString('en-US')} دينار عراقي
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-[#D6B777]/30 flex items-center justify-between gap-2">
                      <span className="text-[#D6B777] font-bold">المبلغ المتبقي:</span>
                      <span
                        className={`font-black text-sm sm:text-base ${
                          scrubRemainingIQD === 0 ? 'text-emerald-400' : 'text-[#D6B777]'
                        }`}
                      >
                        {scrubRemainingIQD.toLocaleString('en-US')} دينار عراقي
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[#E8EEF2]/80 font-bold">الحالة:</span>
                      <span
                        className={`font-black text-sm ${
                          isScrubCompleted ? 'text-emerald-400' : 'text-amber-300'
                        }`}
                      >
                        {isScrubCompleted ? 'مكتمل' : 'غير مكتمل'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* CARD 2: حفل تخرج دفعة 2027 */}
                <div className="rounded-3xl bg-[#0D1726]/85 backdrop-blur-2xl border border-[#D6B777]/35 p-5 sm:p-6 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-2xl bg-[#D6B777]/15 border border-[#D6B777]/35 text-[#D6B777] flex items-center justify-center">
                        <GraduationCap className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-base sm:text-lg font-black text-white">
                          حفل تخرج دفعة 2027
                        </h3>
                        <span className="text-[11px] text-[#D6B777] font-semibold">
                          الوشاح التركوازي — دفعة 2027
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-xl text-xs font-black border ${
                        !isOfficialGradPriceConfirmed
                          ? 'bg-slate-500/20 text-slate-200 border-slate-400/30'
                          : isGradCompleted
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {!isOfficialGradPriceConfirmed
                        ? 'بانتظار تحديد السعر'
                        : isGradCompleted
                        ? 'مكتمل'
                        : 'غير مكتمل'}
                    </span>
                  </div>

                  <div className="space-y-3 text-xs sm:text-sm">
                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[#E8EEF2]/80 font-bold">مبلغ المساهمة المحدد:</span>
                      <span className="font-black text-[#D6B777] text-xs sm:text-sm">
                        {isOfficialGradPriceConfirmed
                          ? `${officialGradPriceIQD.toLocaleString('en-US')} دينار عراقي`
                          : 'قريباً — لم يتم تحديد السعر'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-[#35D6C5]/30 flex items-center justify-between gap-2">
                      <span className="text-[#A6F0DF] font-bold">المبلغ الواصل:</span>
                      <span className="font-black text-[#35D6C5] text-sm sm:text-base">
                        {gradPaidIQD.toLocaleString('en-US')} دينار عراقي
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-[#D6B777]/30 flex items-center justify-between gap-2">
                      <span className="text-[#D6B777] font-bold">المبلغ المتبقي:</span>
                      <span className="font-black text-slate-300 text-xs sm:text-sm">
                        {isOfficialGradPriceConfirmed
                          ? `${gradRemainingIQD.toLocaleString('en-US')} دينار عراقي`
                          : 'لم يتم تحديد السعر بعد'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-[#101B2C]/90 border border-white/10 flex items-center justify-between gap-2">
                      <span className="text-[#E8EEF2]/80 font-bold">الحالة:</span>
                      <span className="font-black text-[#D6B777] text-xs sm:text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        <span>
                          {!isOfficialGradPriceConfirmed
                            ? 'بانتظار تحديد السعر'
                            : isGradCompleted
                            ? 'مكتمل'
                            : 'غير مكتمل'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
