import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatIQD,
  formatArabicDate,
  getPaymentStatusArabic,
  getPaymentStatusBadgeClass,
} from '../services/storage';
import {
  searchStudentPaymentByName,
  getStudentPaymentById,
  StudentLookupCandidate,
  canManageFinances,
} from '../services/studentManagement';
import { AnimatedEcgWaveform } from '../components/MedicalIllustrations';
import {
  CreditCard,
  Sparkles,
  GraduationCap,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  UserCheck,
  AlertTriangle,
  Link2,
  RefreshCw,
} from 'lucide-react';

export const PaymentsPage: React.FC = () => {
  const {
    currentUser,
    firebaseUser,
    payments,
    scrubStudents,
    studentPayments,
    openReceipt,
    navigateTo,
  } = useApp();

  const [activeSection, setActiveSection] = useState<'lookup' | 'scrub' | 'grad' | 'summary'>('lookup');

  // Simple Student Payment Lookup State
  const [lookupQueryName, setLookupQueryName] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [matchedStudent, setMatchedStudent] = useState<{
    id: string;
    fullName: string;
    paidAmountIQD: number;
  } | null>(null);
  const [multipleCandidates, setMultipleCandidates] = useState<StudentLookupCandidate[]>([]);

  const isFinanceAdmin = canManageFinances(currentUser, firebaseUser);

  // Find verified linked ScrubStudent record for this authenticated student
  const myLinkedScrubStudent = currentUser
    ? scrubStudents.find(
        (s) =>
          s.status === 'active' &&
          s.isLinkedToAccount &&
          (s.linkedUserId === currentUser.id || s.id === currentUser.linkedScrubStudentId)
      )
    : undefined;

  // Convert linked StudentPayment records into PaymentTransaction format for unified receipt display
  const myLinkedScrubStudentPayments = myLinkedScrubStudent
    ? studentPayments
        .filter(
          (sp) =>
            sp.studentId === myLinkedScrubStudent.id &&
            sp.verificationStatus !== 'voided'
        )
        .map((sp) => ({
          id: sp.id,
          receiptNumber: sp.receiptNumber,
          graduateId: currentUser!.id,
          graduateName: sp.studentName,
          eventTarget: 'scrub_night' as const,
          amountIQD: sp.amountIQD,
          paymentStatus:
            sp.paymentType === 'final_settlement'
              ? ('completed' as const)
              : sp.paymentType === 'initial_deposit'
              ? ('deposit' as const)
              : ('partial' as const),
          isLinked: true,
          date: sp.date,
          time: sp.time,
          method: sp.paymentMethod,
          notes: sp.notes,
          recordedBy: sp.recordedBy,
          isVerified: sp.isVerified,
          referenceCode: sp.referenceCode,
        }))
    : [];

  // Filter payments for this specific graduate
  const myPayments = currentUser
    ? payments.filter((p) => p.graduateId === currentUser.id)
    : [];

  const scrubPayments = [
    ...myLinkedScrubStudentPayments,
    ...myPayments.filter(
      (p) =>
        p.eventTarget === 'scrub_night' &&
        !myLinkedScrubStudentPayments.some((sp) => sp.receiptNumber === p.receiptNumber)
    ),
  ];
  const gradPayments = myPayments.filter((p) => p.eventTarget === 'official_grad');

  const scrubPaid = myLinkedScrubStudent
    ? myLinkedScrubStudent.verifiedPaidIQD
    : currentUser?.scrubPaidIQD ?? 0;
  const scrubRemaining = myLinkedScrubStudent
    ? myLinkedScrubStudent.remainingBalanceIQD
    : currentUser?.scrubBalanceIQD ?? 0;
  const scrubStatus = myLinkedScrubStudent
    ? myLinkedScrubStudent.paymentStatus
    : currentUser?.scrubStatus ?? 'unpaid';

  const gradPaid = currentUser?.gradPaidIQD ?? 0;
  const gradRemaining = currentUser?.gradBalanceIQD ?? 0;
  const gradStatus = currentUser?.gradStatus ?? 'unpaid';

  const totalPaid = scrubPaid + gradPaid;
  const totalRemaining = scrubRemaining + gradRemaining;

  const handleSearchStudentName = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setMatchedStudent(null);
    setMultipleCandidates([]);

    const trimmed = lookupQueryName.trim();
    if (!trimmed) {
      setLookupError('ما لكينا بيانات مطابقة لهذا الاسم، تأكد من كتابة الاسم بصورة صحيحة.');
      return;
    }

    const result = searchStudentPaymentByName(trimmed, scrubStudents, studentPayments);

    if (result.status === 'not_found') {
      setLookupError('ما لكينا بيانات مطابقة لهذا الاسم، تأكد من كتابة الاسم بصورة صحيحة.');
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

  return (
    <div className="py-6 sm:py-10 space-y-6 sm:space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-right">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2.5">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#142638] border border-[#35D6C5]/35 text-xs font-bold text-white">
          <ShieldCheck className="w-3.5 h-3.5 text-[#35D6C5]" />
          <span>معهد التمريض — دفعة 2026 | التخرج 2027</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white">
          استعلام المبلغ المدفوع للطالب
        </h1>

        {currentUser?.isAdvanceLinked && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1C354A] border border-[#35D6C5]/40 text-[#A6F0DF] text-xs font-bold shadow-lg">
            <Link2 className="w-4 h-4 text-[#35D6C5]" />
            <span>تم ربط وتوثيق سندات الدفع بحسابك بنجاح</span>
          </div>
        )}

        {/* Show personal account tabs only if a graduate/admin is signed in */}
        {currentUser && (
          <div className="p-1.5 rounded-2xl bg-[#142638] border border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-1.5 max-w-2xl mx-auto mt-4 shadow-xl">
            <button
              onClick={() => setActiveSection('lookup')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                activeSection === 'lookup'
                  ? 'bg-gradient-to-r from-[#35D6C5] to-[#A6F0DF] text-[#10151C] shadow-lg shadow-[#35D6C5]/25'
                  : 'text-[#E8EEF2]/75 hover:text-white'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span className="truncate">البحث بالاسم</span>
            </button>

            <button
              onClick={() => setActiveSection('scrub')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                activeSection === 'scrub'
                  ? 'bg-[#1C354A] text-[#35D6C5] border border-[#35D6C5]/40 shadow-lg'
                  : 'text-[#E8EEF2]/75 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D6B777]" />
              <span className="truncate">دفعات السكراب</span>
            </button>

            <button
              onClick={() => setActiveSection('grad')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                activeSection === 'grad'
                  ? 'bg-[#1C354A] text-[#A6F0DF] border border-[#A6F0DF]/40 shadow-lg'
                  : 'text-[#E8EEF2]/75 hover:text-white'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-[#35D6C5]" />
              <span className="truncate">دفعات التخرج الرسمي</span>
            </button>

            <button
              onClick={() => setActiveSection('summary')}
              className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-1.5 ${
                activeSection === 'summary'
                  ? 'bg-gradient-to-r from-[#D6B777] to-[#c4a25e] text-[#10151C] shadow-lg font-black'
                  : 'text-[#E8EEF2]/75 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="truncate">الملخص المالي</span>
            </button>
          </div>
        )}

        <AnimatedEcgWaveform color="#35D6C5" opacity="opacity-20" className="w-full h-8 pt-1" />
      </div>

      {/* ===================================================================== */}
      {/* SECTION 0: SIMPLE STUDENT PAYMENT LOOKUP BY NAME ONLY                 */}
      {/* ===================================================================== */}
      {activeSection === 'lookup' && (
        <div className="max-w-xl mx-auto space-y-5 animate-in fade-in duration-300">
          <div className="rounded-3xl glass-panel-turquoise p-5 sm:p-8 border border-[#35D6C5]/35 shadow-2xl space-y-6">
            {/* Single Input Form */}
            <form onSubmit={handleSearchStudentName} className="space-y-4">
              <div className="space-y-2.5">
                <label
                  htmlFor="student-name-lookup"
                  className="block text-sm sm:text-base font-black text-white"
                >
                  اكتب اسمك الثنائي أو الثلاثي
                </label>
                <input
                  id="student-name-lookup"
                  type="text"
                  value={lookupQueryName}
                  onChange={(e) => {
                    setLookupQueryName(e.target.value);
                    if (lookupError) setLookupError(null);
                  }}
                  placeholder="مثال: حسين علاء كاظم أو علي محمد"
                  autoComplete="off"
                  className="w-full rounded-2xl bg-[#10151C]/95 border border-white/20 focus:border-[#35D6C5] px-4 py-3.5 sm:py-4 text-sm sm:text-base font-bold text-white placeholder-[#E8EEF2]/40 outline-none transition-all shadow-inner"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 sm:py-4 px-6 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#A6F0DF] hover:opacity-95 active:scale-[0.99] text-[#10151C] font-black text-sm sm:text-base shadow-lg shadow-[#35D6C5]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Search className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>عرض المبلغ المدفوع</span>
              </button>
            </form>

            {/* Error Message when No Match Found */}
            {lookupError && (
              <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-100 text-xs sm:text-sm font-extrabold flex items-center gap-3 animate-in fade-in duration-200">
                <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}

            {/* Disambiguation List when Multiple Students Match (No Payment Amounts Shown Yet) */}
            {multipleCandidates.length > 1 && !matchedStudent && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#10151C]/90 border border-[#D6B777]/40 space-y-3.5 animate-in fade-in duration-200">
                <div className="space-y-1">
                  <h3 className="text-xs sm:text-sm font-black text-[#D6B777]">
                    توجد عدة أسماء مطابقة أو مشابهة، اختر اسمك الصحيح:
                  </h3>
                  <p className="text-[11px] sm:text-xs text-[#E8EEF2]/75">
                    اضغط على اسمك الكامل لعرض المبلغ المدفوع الخاص بك:
                  </p>
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
                        اختيار
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Immediate Payment Result Display */}
            {matchedStudent && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[#10151C]/95 border-2 border-[#35D6C5]/50 shadow-xl space-y-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#35D6C5]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>بيانات الدفع المسجلة</span>
                  </span>
                  <button
                    type="button"
                    onClick={resetLookup}
                    className="text-xs text-[#E8EEF2]/70 hover:text-white flex items-center gap-1 font-bold"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>بحث جديد</span>
                  </button>
                </div>

                <div className="space-y-3 text-sm sm:text-base">
                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#142638]/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-[#E8EEF2]/80 font-bold">اسم الطالب:</span>
                    <span className="text-base sm:text-lg font-black text-white">
                      {matchedStudent.fullName}
                    </span>
                  </div>

                  <div className="p-3.5 sm:p-4 rounded-xl bg-[#142638]/90 border border-[#35D6C5]/35 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <span className="text-[#A6F0DF] font-bold">المبلغ المدفوع:</span>
                    <span className="text-lg sm:text-xl font-black text-[#35D6C5]">
                      {matchedStudent.paidAmountIQD.toLocaleString('en-US')} دينار عراقي
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION A: SCRUB NIGHT PAYMENTS (دفعات السكراب — بدون الرسوم الكلية) */}
      {/* ===================================================================== */}
      {activeSection === 'scrub' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl glass-panel p-5 border border-[#35D6C5]/30 space-y-2">
              <span className="text-xs text-[#A6F0DF] font-bold">المبلغ المدفوع</span>
              <div className="text-2xl font-black text-[#35D6C5] font-mono">
                {formatIQD(scrubPaid)}
              </div>
              <p className="text-[11px] text-[#E8EEF2]/70">
                حفلة السكراب • مسرح تفاحة المصور
              </p>
            </div>

            <div className="rounded-2xl glass-panel p-5 border border-[#D6B777]/30 space-y-2">
              <span className="text-xs text-[#D6B777] font-bold">المبلغ المتبقي</span>
              <div
                className={`text-2xl font-black font-mono ${
                  scrubRemaining === 0 && scrubPaid > 0 ? 'text-emerald-400' : 'text-[#D6B777]'
                }`}
              >
                {formatIQD(scrubRemaining)}
              </div>
              <p className="text-[11px] text-[#E8EEF2]/70">
                {scrubRemaining === 0 && scrubPaid > 0
                  ? '✓ تم تسديد المبلغ بالكامل'
                  : 'يسدد للجنة المالية المعتمدة'}
              </p>
            </div>

            <div className="rounded-2xl glass-panel p-5 border border-white/15 space-y-2">
              <span className="text-xs text-white font-bold">حالة الدفعة</span>
              <div>
                <span
                  className={`inline-flex px-3 py-1 rounded-xl text-xs font-black ${getPaymentStatusBadgeClass(
                    scrubStatus
                  )}`}
                >
                  {getPaymentStatusArabic(scrubStatus)}
                </span>
              </div>
              <p className="text-[11px] text-[#E8EEF2]/70">
                {scrubPaid > 0 ? 'دفعات موثقة رسمياً' : 'لا توجد دفعات مسجلة حالياً'}
              </p>
            </div>
          </div>

          {/* Scrub Payments History Table / Cards */}
          <div className="rounded-3xl glass-panel border border-[#35D6C5]/25 p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#35D6C5]" />
                <span>سجل الدفعات — حفلة السكراب</span>
              </h3>
              <span className="text-xs text-[#A6F0DF] font-bold">
                عدد الدفعات: {scrubPayments.length}
              </span>
            </div>

            {scrubPayments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#10151C]/80 border border-dashed border-white/10 space-y-2">
                <Clock className="w-8 h-8 text-[#35D6C5] mx-auto opacity-60" />
                <p className="text-sm font-bold text-white">لا توجد دفعات مسجلة حالياً</p>
                <p className="text-xs text-[#E8EEF2]/70">
                  يمكنك استخدام تبويب «استعلام عن حسابي» أعلاه للتحقق من سجلك المالي وتأكيد هويتك.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {scrubPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#10151C]/85 border border-[#35D6C5]/25 hover:border-[#35D6C5]/50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {p.receiptNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#35D6C5]/20 text-[#35D6C5]">
                          {p.paymentStatus === 'deposit'
                            ? 'عربون نقدي'
                            : p.paymentStatus === 'completed'
                            ? 'تسديد كامل'
                            : 'دفعة جزئية'}
                        </span>
                        <span className="text-[11px] text-[#D6B777] font-mono">
                          [{p.referenceCode}]
                        </span>
                      </div>
                      <p className="text-xs text-[#E8EEF2]/75">
                        التاريخ: {formatArabicDate(p.date)} - {p.time} • الطريقة:{' '}
                        {p.method === 'cash' ? 'نقدي (كاش)' : 'تحويل بنكي'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-white/10 pt-3 sm:pt-0">
                      <span className="text-lg font-black text-[#35D6C5] font-mono">
                        {formatIQD(p.amountIQD)}
                      </span>
                      <button
                        onClick={() => openReceipt(p)}
                        className="px-3.5 py-2 rounded-xl bg-[#35D6C5] hover:opacity-95 text-[#10151C] font-black text-xs flex items-center gap-1.5 shadow-md"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة الوصل</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION B: OFFICIAL GRADUATION PAYMENTS (بدون الرسوم الكلية)          */}
      {/* ===================================================================== */}
      {activeSection === 'grad' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl glass-panel p-5 border border-[#35D6C5]/30 space-y-2">
              <span className="text-xs text-[#A6F0DF] font-bold">المبلغ المدفوع</span>
              <div className="text-2xl font-black text-[#35D6C5] font-mono">
                {formatIQD(gradPaid)}
              </div>
              <p className="text-[11px] text-[#E8EEF2]/70">
                حفل التخرج الرسمي • وشاح التمريض التركوازي
              </p>
            </div>

            <div className="rounded-2xl glass-panel p-5 border border-[#D6B777]/30 space-y-2">
              <span className="text-xs text-[#D6B777] font-bold">المبلغ المتبقي</span>
              <div
                className={`text-2xl font-black font-mono ${
                  gradRemaining === 0 && gradPaid > 0 ? 'text-emerald-400' : 'text-[#D6B777]'
                }`}
              >
                {formatIQD(gradRemaining)}
              </div>
              <p className="text-[11px] text-[#E8EEF2]/70">
                {gradRemaining === 0 && gradPaid > 0
                  ? '✓ براءة ذمة تخرج مكتملة'
                  : 'الرصيد المتبقي لحفل التخرج'}
              </p>
            </div>

            <div className="rounded-2xl glass-panel p-5 border border-white/15 space-y-2">
              <span className="text-xs text-white font-bold">حالة الدفعة</span>
              <div>
                <span
                  className={`inline-flex px-3 py-1 rounded-xl text-xs font-black ${getPaymentStatusBadgeClass(
                    gradStatus
                  )}`}
                >
                  {getPaymentStatusArabic(gradStatus)}
                </span>
              </div>
              <p className="text-[11px] text-[#E8EEF2]/70">
                {gradPaid > 0 ? 'دفعات موثقة رسمياً' : 'لا توجد دفعات مسجلة حالياً'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl glass-panel border border-[#35D6C5]/25 p-5 sm:p-7 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#35D6C5]" />
                <span>سجل الدفعات — حفل التخرج الرسمي</span>
              </h3>
              <span className="text-xs text-[#35D6C5] font-bold">
                عدد الدفعات: {gradPayments.length}
              </span>
            </div>

            {gradPayments.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-[#10151C]/80 border border-dashed border-white/10 space-y-2">
                <GraduationCap className="w-8 h-8 text-[#35D6C5] mx-auto opacity-50" />
                <p className="text-sm font-bold text-white">لا توجد دفعات مسجلة حالياً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {gradPayments.map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl bg-[#10151C]/85 border border-[#35D6C5]/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-white text-sm">
                          {p.receiptNumber}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-[#35D6C5]/20 text-[#35D6C5] text-[10px] font-bold">
                          حفل التخرج الرسمي
                        </span>
                        <span className="text-[11px] text-[#D6B777] font-mono">
                          [{p.referenceCode}]
                        </span>
                      </div>
                      <p className="text-xs text-[#E8EEF2]/75">
                        التاريخ: {formatArabicDate(p.date)} - {p.time} • الطريقة:{' '}
                        {p.method === 'cash' ? 'نقدي (كاش)' : 'تحويل بنكي'}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-white/10 pt-3 sm:pt-0">
                      <span className="text-lg font-black text-[#35D6C5] font-mono">
                        {formatIQD(p.amountIQD)}
                      </span>
                      <button
                        onClick={() => openReceipt(p)}
                        className="px-3.5 py-2 rounded-xl bg-[#35D6C5] text-[#10151C] font-extrabold text-xs flex items-center gap-1.5"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>معاينة الوصل</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* SECTION C: COMBINED FINANCIAL SUMMARY (بدون الرسوم الكلية)            */}
      {/* ===================================================================== */}
      {activeSection === 'summary' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="rounded-3xl glass-panel-gold p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">الملخص المالي المعتمد للطالب</h3>
                <p className="text-xs text-[#E8EEF2]/75">
                  معهد التمريض — دفعة 2026 | التخرج 2027
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#D6B777]/20 text-[#D6B777] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#10151C]/85 border border-[#35D6C5]/25 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#35D6C5]" />
                  <span className="font-bold text-white">حفلة السكراب:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono">
                  <span className="text-[#35D6C5] font-bold">
                    المبلغ المدفوع: {formatIQD(scrubPaid)}
                  </span>
                  <span className={scrubRemaining === 0 && scrubPaid > 0 ? 'text-emerald-400' : 'text-[#D6B777]'}>
                    المبلغ المتبقي: {formatIQD(scrubRemaining)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-sans font-bold ${getPaymentStatusBadgeClass(scrubStatus)}`}>
                    حالة الدفعة: {getPaymentStatusArabic(scrubStatus)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#10151C]/85 border border-[#A6F0DF]/25 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A6F0DF]" />
                  <span className="font-bold text-white">حفل التخرج الرسمي:</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 font-mono">
                  <span className="text-[#A6F0DF] font-bold">
                    المبلغ المدفوع: {formatIQD(gradPaid)}
                  </span>
                  <span className={gradRemaining === 0 && gradPaid > 0 ? 'text-emerald-400' : 'text-[#D6B777]'}>
                    المبلغ المتبقي: {formatIQD(gradRemaining)}
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-sans font-bold ${getPaymentStatusBadgeClass(gradStatus)}`}>
                    حالة الدفعة: {getPaymentStatusArabic(gradStatus)}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-[#10151C] border border-[#D6B777]/35 text-sm font-bold">
                <span className="text-[#D6B777]">إجمالي الحساب:</span>
                <div className="flex items-center gap-4 font-mono">
                  <span className="text-white">المبلغ المدفوع: {formatIQD(totalPaid)}</span>
                  <span className={totalRemaining === 0 && totalPaid > 0 ? 'text-emerald-400' : 'text-[#D6B777]'}>
                    المبلغ المتبقي: {formatIQD(totalRemaining)}
                  </span>
                </div>
              </div>
            </div>

            {isFinanceAdmin && (
              <div className="pt-3 border-t border-white/10 flex justify-end">
                <button
                  onClick={() => navigateTo('admin_dashboard')}
                  className="px-5 py-2.5 rounded-xl bg-[#35D6C5] text-[#10151C] font-extrabold text-xs shadow-md"
                >
                  الدخول للوحة الإدارة المالية الخاصة
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
