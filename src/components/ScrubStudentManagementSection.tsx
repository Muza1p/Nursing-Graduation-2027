import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  ScrubStudent,
  StudentPayment,
  PaymentMethod,
  PaymentStatus,
} from '../types';
import {
  formatIQD,
  formatArabicDate,
  getPaymentStatusArabic,
  getPaymentStatusBadgeClass,
} from '../services/storage';
import {
  normalizeArabicName,
  getNextSequentialStudentNumber,
  exportScrubStudentsCSV,
  exportScrubFullBackupJSON,
  ImportReport,
} from '../services/studentManagement';
import {
  Users,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Trash2,
  Edit2,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Link2,
  Unlink,
  Archive,
  RotateCcw,
  Eye,
  ShieldAlert,
  FileSpreadsheet,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Banknote,
  Receipt,
  XCircle,
  Clock,
  Sparkles,
  UserCheck,
  Lock,
  Info,
} from 'lucide-react';

export const ScrubStudentManagementSection: React.FC = () => {
  const {
    scrubStudents,
    studentPayments,
    graduates,
    pendingRegistrationRequests,
    isSuperAdmin,
    canManageFinances,
    importOfficial46List,
    importCustomStudentsList,
    addScrubStudent,
    updateScrubStudent,
    archiveSingleScrubStudent,
    restoreSingleScrubStudent,
    deleteEntireStudentListSuperAdmin,
    restoreEntireStudentListSuperAdmin,
    addStudentPayment,
    verifyStudentPayment,
    voidStudentPayment,
    linkStudentToAccount,
    unlinkStudentFromAccount,
    resolveStudentReviewFlag,
    openReceipt,
  } = useApp();

  // View Mode: active vs archived
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  // Search, Filter, Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'deposit' | 'partial' | 'completed' | 'unpaid' | 'needs_review' | 'linked'
  >('all');
  const [sortBy, setSortBy] = useState<
    'number_asc' | 'number_desc' | 'name_asc' | 'paid_desc' | 'remaining_desc'
  >('number_asc');
  const [pageSize, setPageSize] = useState<number>(50);
  const [currentPageIndex, setCurrentPageIndex] = useState<number>(1);

  // Action Banner Feedback
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // 1. Add Student Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newTitle, setNewTitle] = useState<'nurse_m' | 'nurse_f'>('nurse_m');
  const [newInitialDeposit, setNewInitialDeposit] = useState<number>(2000);
  const [newTotalFee, setNewTotalFee] = useState<number>(35000);
  const [newPhone, setNewPhone] = useState('');
  const [newInstId, setNewInstId] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // 2. Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<ScrubStudent | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editTitle, setEditTitle] = useState<'nurse_m' | 'nurse_f'>('nurse_m');
  const [editTotalFee, setEditTotalFee] = useState<number>(35000);
  const [editPhone, setEditPhone] = useState('');
  const [editInstId, setEditInstId] = useState('');
  const [editNotes, setEditNotes] = useState('');

  // 3. Single Student Archive Confirmation Modal
  const [archivingStudent, setArchivingStudent] = useState<ScrubStudent | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  // 4. Student Payment History & Record Payment Modal
  const [paymentModalStudentId, setPaymentModalStudentId] = useState<string | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(5000);
  const [payMethodInput, setPayMethodInput] = useState<PaymentMethod>('cash');
  const [payReceiptInput, setPayReceiptInput] = useState('');
  const [payNotesInput, setPayNotesInput] = useState('');
  const [payVerifiedInput, setPayVerifiedInput] = useState<boolean>(true);
  const [payModalFeedback, setPayModalFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [voidingPaymentId, setVoidingPaymentId] = useState<string | null>(null);
  const [voidReasonInput, setVoidReasonInput] = useState('');

  // 5. Verified Account Linking Modal
  const [linkingStudent, setLinkingStudent] = useState<ScrubStudent | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [customLinkUid, setCustomLinkUid] = useState('');
  const [customLinkEmail, setCustomLinkEmail] = useState('');
  const [customLinkName, setCustomLinkName] = useState('');

  // 6. Import Student List Modal
  const [showImportModal, setShowImportModal] = useState(false);
  const [importTextLines, setImportTextLines] = useState('');
  const [defaultImportDeposit, setDefaultImportDeposit] = useState<number>(2000);
  const [lastImportReport, setLastImportReport] = useState<ImportReport | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 7. Super-Admin-Only "Delete Entire Student List" 2-Step Modal (Requirement 4)
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
  const [backupDownloadedBeforeDelete, setBackupDownloadedBeforeDelete] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  // Active & Archived Lists
  const activeStudents = useMemo(
    () => scrubStudents.filter((s) => s.status === 'active'),
    [scrubStudents]
  );
  const archivedStudents = useMemo(
    () => scrubStudents.filter((s) => s.status === 'archived'),
    [scrubStudents]
  );

  // Summary Financial Statistics for Active Students (Requirement 3 & 5)
  const summaryStats = useMemo(() => {
    const totalStudents = activeStudents.length;
    const totalFeeIQD = activeStudents.reduce((sum, s) => sum + s.totalFeeIQD, 0);
    const totalVerifiedPaidIQD = activeStudents.reduce(
      (sum, s) => sum + s.verifiedPaidIQD,
      0
    );
    const totalPendingPaidIQD = activeStudents.reduce(
      (sum, s) => sum + (s.pendingPaidIQD || 0),
      0
    );
    const totalRemainingIQD = activeStudents.reduce(
      (sum, s) => sum + s.remainingBalanceIQD,
      0
    );
    const depositCount = activeStudents.filter(
      (s) => s.paymentStatus === 'deposit'
    ).length;
    const partialCount = activeStudents.filter(
      (s) => s.paymentStatus === 'partial'
    ).length;
    const completedCount = activeStudents.filter(
      (s) => s.paymentStatus === 'completed'
    ).length;
    const unpaidCount = activeStudents.filter(
      (s) => s.paymentStatus === 'unpaid'
    ).length;
    const linkedCount = activeStudents.filter((s) => s.isLinkedToAccount).length;
    const reviewCount = activeStudents.filter((s) => s.needsReview).length;

    return {
      totalStudents,
      totalFeeIQD,
      totalVerifiedPaidIQD,
      totalPendingPaidIQD,
      totalRemainingIQD,
      depositCount,
      partialCount,
      completedCount,
      unpaidCount,
      linkedCount,
      reviewCount,
    };
  }, [activeStudents]);

  // Filtered & Sorted Students
  const filteredAndSortedStudents = useMemo(() => {
    const baseList = viewMode === 'active' ? activeStudents : archivedStudents;
    const cleanQuery = searchQuery.trim();
    const normQuery = normalizeArabicName(cleanQuery);

    const filtered = baseList.filter((stu) => {
      // Search by Arabic name (exact or normalized) or studentNumber or ID or phone
      let matchesSearch = true;
      if (cleanQuery) {
        const numMatch = String(stu.studentNumber) === cleanQuery;
        const nameMatch =
          stu.fullName.includes(cleanQuery) ||
          stu.normalizedName.includes(normQuery);
        const phoneMatch = stu.phone ? stu.phone.includes(cleanQuery) : false;
        const idMatch = stu.id.toLowerCase().includes(cleanQuery.toLowerCase());
        matchesSearch = numMatch || nameMatch || phoneMatch || idMatch;
      }

      // Filter by status
      let matchesStatus = true;
      if (statusFilter === 'deposit') {
        matchesStatus = stu.paymentStatus === 'deposit';
      } else if (statusFilter === 'partial') {
        matchesStatus = stu.paymentStatus === 'partial';
      } else if (statusFilter === 'completed') {
        matchesStatus = stu.paymentStatus === 'completed';
      } else if (statusFilter === 'unpaid') {
        matchesStatus = stu.paymentStatus === 'unpaid';
      } else if (statusFilter === 'needs_review') {
        matchesStatus = Boolean(stu.needsReview);
      } else if (statusFilter === 'linked') {
        matchesStatus = Boolean(stu.isLinkedToAccount);
      }

      return matchesSearch && matchesStatus;
    });

    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'number_asc':
          return a.studentNumber - b.studentNumber;
        case 'number_desc':
          return b.studentNumber - a.studentNumber;
        case 'name_asc':
          return a.fullName.localeCompare(b.fullName, 'ar');
        case 'paid_desc':
          return b.verifiedPaidIQD - a.verifiedPaidIQD;
        case 'remaining_desc':
          return b.remainingBalanceIQD - a.remainingBalanceIQD;
        default:
          return a.studentNumber - b.studentNumber;
      }
    });
  }, [
    viewMode,
    activeStudents,
    archivedStudents,
    searchQuery,
    statusFilter,
    sortBy,
  ]);

  // Pagination slice
  const totalPages = Math.max(
    1,
    Math.ceil(filteredAndSortedStudents.length / pageSize)
  );
  const safePageIndex = Math.min(currentPageIndex, totalPages);
  const paginatedStudents = useMemo(() => {
    const start = (safePageIndex - 1) * pageSize;
    return filteredAndSortedStudents.slice(start, start + pageSize);
  }, [filteredAndSortedStudents, safePageIndex, pageSize]);

  // Active Student in Payment Modal
  const activePaymentStudent = useMemo(
    () => scrubStudents.find((s) => s.id === paymentModalStudentId) || null,
    [scrubStudents, paymentModalStudentId]
  );
  const activeStudentPaymentsList = useMemo(
    () =>
      studentPayments
        .filter((p) => p.studentId === paymentModalStudentId)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
    [studentPayments, paymentModalStudentId]
  );

  // Next sequential student number preview for Add Modal
  const nextAutoNumber = useMemo(
    () => getNextSequentialStudentNumber(scrubStudents),
    [scrubStudents]
  );

  // Export CSV helper
  const handleDownloadCSV = (includeArchived = false) => {
    const csv = exportScrubStudentsCSV(scrubStudents, includeArchived);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scrub_Party_Students_2026_Grad_2027_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Full JSON Backup helper
  const handleDownloadBackupJSON = () => {
    const json = exportScrubFullBackupJSON(scrubStudents, studentPayments);
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Scrub_Party_Full_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Handle Add New Student Submit
  const handleAddStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingAdd(true);
    setFeedbackBanner(null);

    const res = await addScrubStudent({
      fullName: newFullName,
      preferredTitle: newTitle,
      initialDepositIQD: newInitialDeposit,
      totalFeeIQD: newTotalFee,
      phone: newPhone,
      institutionalStudentId: newInstId,
      notes: newNotes,
      isDepositVerified: true,
    });

    setIsSubmittingAdd(false);
    if (res.success) {
      setFeedbackBanner({ type: 'success', text: res.message });
      setShowAddModal(false);
      setNewFullName('');
      setNewPhone('');
      setNewInstId('');
      setNewNotes('');
      setNewInitialDeposit(2000);
      setNewTotalFee(35000);
    } else {
      setFeedbackBanner({ type: 'error', text: res.message });
    }
  };

  // Handle Edit Student Submit
  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    const res = await updateScrubStudent(editingStudent.id, {
      fullName: editFullName,
      preferredTitle: editTitle,
      totalFeeIQD: editTotalFee,
      phone: editPhone,
      institutionalStudentId: editInstId,
      notes: editNotes,
    });

    if (res.success) {
      setFeedbackBanner({ type: 'success', text: res.message });
      setEditingStudent(null);
    } else {
      setFeedbackBanner({ type: 'error', text: res.message });
    }
  };

  // Handle Add Payment Submit
  const handleAddPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePaymentStudent) return;
    setPayModalFeedback(null);

    const res = await addStudentPayment({
      studentId: activePaymentStudent.id,
      amountIQD: payAmountInput,
      paymentMethod: payMethodInput,
      receiptNumber: payReceiptInput.trim() || undefined,
      notes: payNotesInput.trim() || undefined,
      isVerified: payVerifiedInput,
    });

    if (res.success) {
      setPayModalFeedback({ type: 'success', text: res.message });
      setPayReceiptInput('');
      setPayNotesInput('');
      // Default next amount to remaining balance or 5000
      const newRem = Math.max(
        0,
        activePaymentStudent.remainingBalanceIQD -
          (payVerifiedInput ? payAmountInput : 0)
      );
      setPayAmountInput(newRem > 0 ? Math.min(5000, newRem) : 0);
    } else {
      setPayModalFeedback({ type: 'error', text: res.message });
    }
  };

  // Convert StudentPayment to PaymentTransaction for printable ReceiptModal
  const handlePreviewStudentReceipt = (pay: StudentPayment) => {
    openReceipt({
      id: pay.id,
      receiptNumber: pay.receiptNumber,
      graduateId: pay.studentId,
      graduateName: pay.studentName,
      eventTarget: 'scrub_night',
      amountIQD: pay.amountIQD,
      paymentStatus:
        pay.paymentType === 'final_settlement'
          ? 'completed'
          : pay.paymentType === 'initial_deposit'
          ? 'deposit'
          : 'partial',
      date: pay.date,
      time: pay.time,
      method: pay.paymentMethod,
      notes: pay.notes,
      recordedBy: pay.recordedBy,
      isVerified: pay.isVerified,
      referenceCode: pay.referenceCode,
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Header Card */}
      <div className="rounded-3xl bg-gradient-to-br from-[#101B2C] via-[#17253B] to-[#0A0D12] border border-[#35D6C2]/30 p-6 sm:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#35D6C2]/15 border border-[#35D6C2]/30 text-[#35D6C2] text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>نظام إدارة طلبة حفلة السكراب • معهد التمريض (دفعة 2026 | التخرج 2027)</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F4F8FC]">
              سجل طلبة حفلة السكراب والحسابات المالية الموثقة
            </h2>
            <p className="text-xs text-[#E8EEF2]/80 leading-relaxed max-w-3xl">
              إدارة شاملة لقائمة الطلاب بالتسلسل التلقائي (<span className="text-[#35D6C5] font-bold">ت: 1 – {activeStudents.length}</span>)، تتبع المبلغ المدفوع، المبلغ المتبقي، حالة الدفعة، والربط الآمن بحسابات الطلاب.
            </p>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {canManageFinances && (
              <>
                <button
                  onClick={() => {
                    setFeedbackBanner(null);
                    setShowAddModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#35D6C2] to-[#22b8a5] hover:opacity-95 text-[#0A0D12] font-extrabold text-xs shadow-lg shadow-[#35D6C2]/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طالب جديد (ت: {nextAutoNumber})</span>
                </button>

                <button
                  onClick={() => {
                    setLastImportReport(null);
                    setShowImportModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-[#342A78] hover:bg-[#3f3391] text-[#F4F8FC] font-bold text-xs border border-indigo-400/40 flex items-center gap-1.5 shadow-md"
                >
                  <Upload className="w-4 h-4 text-[#35D6C2]" />
                  <span>استيراد / فحص القائمة (46 طالب)</span>
                </button>
              </>
            )}

            <button
              onClick={() => handleDownloadCSV(false)}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4F8FC] font-bold text-xs border border-white/10 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#D7B875]" />
              <span>تصدير إكسل (CSV)</span>
            </button>

            {/* Super-Admin-Only Delete Entire Student List Button (Requirement 8) */}
            {isSuperAdmin ? (
              <button
                onClick={() => {
                  setDeleteStep(1);
                  setDeleteConfirmPhrase('');
                  setBackupDownloadedBeforeDelete(false);
                  setDeleteModalError(null);
                  setShowDeleteAllModal(true);
                }}
                disabled={activeStudents.length === 0}
                className="px-4 py-2.5 rounded-xl bg-[#E85D65]/15 hover:bg-[#E85D65]/25 disabled:opacity-40 text-[#E85D65] font-extrabold text-xs border border-[#E85D65]/40 flex items-center gap-1.5 transition-all"
                title="صلاحية حصرية للمدير الأعلى للنظام (Super Admin)"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف قائمة الطلاب بالكامل</span>
              </button>
            ) : (
              <div
                className="px-3.5 py-2 rounded-xl bg-white/5 text-slate-400 text-[11px] border border-white/10 flex items-center gap-1.5"
                title="حذف قائمة الطلاب بالكامل متاح فقط للمدير الأعلى (Super Admin)"
              >
                <Lock className="w-3.5 h-3.5 text-[#D6B777]" />
                <span>حذف قائمة الطلاب بالكامل (Super Admin)</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Financial Cards Grid (Requirement 3 & 5) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-[#35D6C2]/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#35D6C2]">
                إجمالي طلبة السكراب النشطين
              </span>
              <Users className="w-4 h-4 text-[#35D6C2]" />
            </div>
            <div className="text-2xl font-black text-[#F4F8FC] font-mono">
              {summaryStats.totalStudents} طالب/طالبة
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>مرتبط بحساب: {summaryStats.linkedCount}</span>
              <span>في الأرشيف: {archivedStudents.length}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#10151C]/90 border border-[#35D6C5]/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A6F0DF]">
                توزيع حالات الدفعة للطلاب
              </span>
              <FileSpreadsheet className="w-4 h-4 text-[#35D6C5]" />
            </div>
            <div className="text-lg font-black text-white font-mono">
              عربون: {summaryStats.depositCount} • جزئي: {summaryStats.partialCount}
            </div>
            <div className="text-[11px] text-[#A6F0DF]">
              مكتمل: {summaryStats.completedCount} • غير مدفوع: {summaryStats.unpaidCount}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#10151C]/90 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                إجمالي المبلغ المدفوع الموثق
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatIQD(summaryStats.totalVerifiedPaidIQD)}
            </div>
            <div className="text-[11px] text-[#E8EEF2]/70 flex items-center justify-between">
              <span>دافع عربون: {summaryStats.depositCount}</span>
              <span>مكتمل: {summaryStats.completedCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#10151C]/90 border border-[#D6B777]/35 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D6B777]">
                إجمالي المبلغ المتبقي بذمة الطلاب
              </span>
              <Banknote className="w-4 h-4 text-[#D6B777]" />
            </div>
            <div className="text-2xl font-black text-[#D6B777] font-mono">
              {formatIQD(summaryStats.totalRemainingIQD)}
            </div>
            <div className="text-[11px] text-[#E8EEF2]/70">
              45 طالب (المتبقي 33,000 د.ع) • عباس محمد شيال (المتبقي 34,000 د.ع)
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedbackBanner && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              : feedbackBanner.type === 'error'
              ? 'bg-[#E85D65]/15 border-[#E85D65]/40 text-[#E85D65]'
              : 'bg-[#35D6C2]/15 border-[#35D6C2]/30 text-[#35D6C2]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedbackBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{feedbackBanner.text}</span>
          </div>
          <button
            onClick={() => setFeedbackBanner(null)}
            className="text-xs underline opacity-80 hover:opacity-100"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* Review Alert Banner if any student is flagged for duplicate/similarity review */}
      {summaryStats.reviewCount > 0 && viewMode === 'active' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-300 block">
                تنبيه تدقيق الأسماء المتشابهة ({summaryStats.reviewCount} سجل بحاجة لمراجعة):
              </span>
              <span className="text-slate-300">
                تم رصد تشابه بين بعض الأسماء المستوردة وسجلات خريجين موجودة مسبقاً. التزاماً بقواعد الأمان، لم يتم دمجها أو ربطها تلقائياً؛ يمكنك مراجعتها وتأكيدها أو ربطها يدوياً بعد التحقق.
              </span>
            </div>
          </div>
          <button
            onClick={() =>
              setStatusFilter(
                statusFilter === 'needs_review' ? 'all' : 'needs_review'
              )
            }
            className="px-3.5 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold border border-amber-400/30 shrink-0"
          >
            {statusFilter === 'needs_review'
              ? 'عرض جميع الطلبة'
              : `عرض السجلات المعلقة للمراجعة (${summaryStats.reviewCount})`}
          </button>
        </div>
      )}

      {/* Search, Filter, Sort & Active/Archive Switcher Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-[#101B2C] border border-white/10 space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Active vs Archived Segmented Toggle */}
          <div className="flex items-center gap-2 bg-[#0A0D12] p-1.5 rounded-2xl border border-white/10">
            <button
              onClick={() => {
                setViewMode('active');
                setCurrentPageIndex(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === 'active'
                  ? 'bg-[#35D6C2] text-[#0A0D12] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>القائمة النشطة ({activeStudents.length})</span>
            </button>

            <button
              onClick={() => {
                setViewMode('archived');
                setCurrentPageIndex(1);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
                viewMode === 'archived'
                  ? 'bg-[#D7B875] text-[#0A0D12] shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Archive className="w-3.5 h-3.5" />
              <span>الأرشيف والمحذوفات ({archivedStudents.length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPageIndex(1);
              }}
              placeholder="ابحث بالاسم العربي (مثال: عباس محمد شيال) أو رقم الطالب (ت: 1 - 46)..."
              className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-xs text-[#F4F8FC] pl-9 focus:outline-none focus:border-[#35D6C2]"
            />
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          </div>

          {/* Filter & Sort Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 bg-[#0A0D12] px-3 py-2 rounded-xl border border-white/10">
              <Filter className="w-3.5 h-3.5 text-[#35D6C2]" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as any);
                  setCurrentPageIndex(1);
                }}
                className="bg-transparent text-xs text-[#F4F8FC] font-bold focus:outline-none"
              >
                <option value="all" className="bg-[#0A0D12]">
                  كل حالات الدفع ({viewMode === 'active' ? activeStudents.length : archivedStudents.length})
                </option>
                <option value="deposit" className="bg-[#0A0D12]">
                  دافع عربون ({summaryStats.depositCount})
                </option>
                <option value="partial" className="bg-[#0A0D12]">
                  مدفوع جزئياً ({summaryStats.partialCount})
                </option>
                <option value="completed" className="bg-[#0A0D12]">
                  مكتمل الدفع ({summaryStats.completedCount})
                </option>
                <option value="unpaid" className="bg-[#0A0D12]">
                  غير مدفوع ({summaryStats.unpaidCount})
                </option>
                <option value="linked" className="bg-[#0A0D12]">
                  مرتبط بحساب مستخدم ({summaryStats.linkedCount})
                </option>
                <option value="needs_review" className="bg-[#0A0D12]">
                  بحاجة لمراجعة تطابق ({summaryStats.reviewCount})
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0A0D12] px-3 py-2 rounded-xl border border-white/10">
              <ArrowUpDown className="w-3.5 h-3.5 text-[#D7B875]" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent text-xs text-[#F4F8FC] font-bold focus:outline-none"
              >
                <option value="number_asc" className="bg-[#0A0D12]">
                  الترتيب: رقم الطالب (1 ← 46)
                </option>
                <option value="number_desc" className="bg-[#0A0D12]">
                  الترتيب: رقم الطالب (46 ← 1)
                </option>
                <option value="name_asc" className="bg-[#0A0D12]">
                  الترتيب: الاسم الأبجدي (أ ← ي)
                </option>
                <option value="paid_desc" className="bg-[#0A0D12]">
                  الترتيب: الأعلى تسديداً
                </option>
                <option value="remaining_desc" className="bg-[#0A0D12]">
                  الترتيب: الأعلى متبقياً
                </option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-[#0A0D12] px-3 py-2 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-400">عرض:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPageIndex(1);
                }}
                className="bg-transparent text-xs text-[#F4F8FC] font-bold focus:outline-none"
              >
                <option value={15} className="bg-[#0A0D12]">
                  15 طالب
                </option>
                <option value={25} className="bg-[#0A0D12]">
                  25 طالب
                </option>
                <option value={50} className="bg-[#0A0D12]">
                  50 طالب (الكل)
                </option>
                <option value={100} className="bg-[#0A0D12]">
                  100 طالب
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* If viewing Archived mode and Super Admin wants to restore all */}
        {viewMode === 'archived' && archivedStudents.length > 0 && (
          <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <p className="text-xs text-[#D7B875]">
              تعرض هذه الشاشة الطلبة المؤرشفين أو الذين تم حذف قائمتهم. جميع السجلات المالية والوصولات محفوظة بالكامل ويمكن استعادتها.
            </p>
            {isSuperAdmin && (
              <button
                onClick={async () => {
                  const res = await restoreEntireStudentListSuperAdmin();
                  if (res.success) {
                    setFeedbackBanner({ type: 'success', text: res.message });
                    setViewMode('active');
                  } else {
                    setFeedbackBanner({ type: 'error', text: res.message });
                  }
                }}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0A0D12] font-extrabold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <RotateCcw className="w-4 h-4" />
                <span>استعادة القائمة المؤرشفة بالكامل ({archivedStudents.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {filteredAndSortedStudents.length === 0 ? (
        <div className="rounded-3xl bg-[#101B2C] border border-white/10 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-[#35D6C2]/10 text-[#35D6C2] flex items-center justify-center mx-auto">
            <Users className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-[#F4F8FC]">
            {viewMode === 'active'
              ? 'لا توجد سجلات طلبة مطابقة لمعايير البحث الحالية'
              : 'الأرشيف فارغ حالياً'}
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            {viewMode === 'active' && activeStudents.length === 0
              ? 'يمكنك استعادة القائمة المؤرشفة من تبويب الأرشيف أو إعادة استيراد قائمة الـ 46 طالباً الرسمية.'
              : 'جرب تغيير كلمات البحث أو إعادة ضبط فلتر الحالة لعرض كافة الطلبة.'}
          </p>
          {viewMode === 'active' && activeStudents.length === 0 && (
            <div className="flex flex-wrap justify-center gap-3 pt-2">
              {archivedStudents.length > 0 && isSuperAdmin && (
                <button
                  onClick={async () => {
                    const res = await restoreEntireStudentListSuperAdmin();
                    setFeedbackBanner({
                      type: res.success ? 'success' : 'error',
                      text: res.message,
                    });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-emerald-500 text-[#0A0D12] font-extrabold text-xs flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>استعادة القائمة المؤرشفة ({archivedStudents.length} طالب)</span>
                </button>
              )}
              <button
                onClick={async () => {
                  const rep = await importOfficial46List();
                  setFeedbackBanner({
                    type: 'success',
                    text: `تم فحص واستيراد القائمة الرسمية (${rep.importedCount} جديد، إجمالي النشطين: ${rep.totalActiveStudents}).`,
                  });
                }}
                className="px-5 py-2.5 rounded-xl bg-[#35D6C2] text-[#0A0D12] font-extrabold text-xs flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>استيراد القائمة الرسمية (46 طالب)</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW */}
          <div className="hidden md:block rounded-3xl bg-[#101B2C] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#10151C] text-[#E8EEF2] border-b border-white/10">
                  <tr>
                    <th className="p-3.5 w-16 text-center font-black text-[#35D6C5]">
                      ت (No.)
                    </th>
                    <th className="p-3.5">الاسم الكامل واللقب</th>
                    <th className="p-3.5">المبلغ المدفوع</th>
                    <th className="p-3.5">المبلغ المتبقي</th>
                    <th className="p-3.5">حالة الدفعة</th>
                    <th className="p-3.5">ربط الحساب والخصوصية</th>
                    <th className="p-3.5 text-center">الإجراءات المالية والإدارية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F4F8FC]">
                  {paginatedStudents.map((stu) => {
                    const stuPaysCount = studentPayments.filter(
                      (p) =>
                        p.studentId === stu.id &&
                        p.verificationStatus !== 'voided'
                    ).length;

                    return (
                      <tr
                        key={stu.id}
                        className={`hover:bg-white/[0.04] transition-colors ${
                          stu.needsReview ? 'bg-amber-500/[0.04]' : ''
                        }`}
                      >
                        {/* Automatic Sequential Number (ت) */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#342A78]/60 border border-[#35D6C2]/30 text-[#35D6C2] font-mono font-black text-xs shadow-sm">
                            {stu.studentNumber}
                          </span>
                        </td>

                        {/* Arabic Full Name & Permanent ID */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-[#F4F8FC]">
                              {stu.fullName}
                            </span>
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-300 border border-white/10">
                              {stu.preferredTitle === 'nurse_f'
                                ? 'الممرضة'
                                : 'الممرض'}
                            </span>
                            {stu.needsReview && (
                              <span
                                className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold flex items-center gap-1"
                                title={stu.reviewNote}
                              >
                                <AlertTriangle className="w-3 h-3" />
                                <span>مراجعة تشابه</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>ID: {stu.id}</span>
                            {stu.phone && <span>• هاتف: {stu.phone}</span>}
                          </div>
                          {stu.needsReview && stu.reviewNote && (
                            <div className="mt-1.5 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[10px] text-amber-200 flex items-center justify-between gap-2">
                              <span>{stu.reviewNote}</span>
                              {canManageFinances && (
                                <button
                                  onClick={async () => {
                                    const res = await resolveStudentReviewFlag(
                                      stu.id,
                                      'تم تدقيق الاسم وتأكيد استقلالية السجل'
                                    );
                                    setFeedbackBanner({
                                      type: res.success ? 'success' : 'error',
                                      text: res.message,
                                    });
                                  }}
                                  className="px-2 py-0.5 rounded bg-amber-400 text-[#0A0D12] font-bold shrink-0"
                                >
                                  تأكيد السجل
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Verified Deposit / Paid */}
                        <td className="p-3.5">
                          <div className="font-mono font-black text-emerald-400 text-sm">
                            {formatIQD(stu.verifiedPaidIQD)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stuPaysCount} سند موثق
                            {stu.pendingPaidIQD > 0 && (
                              <span className="text-amber-300 mr-1">
                                (+{formatIQD(stu.pendingPaidIQD)} قيد التدقيق)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Remaining Balance */}
                        <td className="p-3.5">
                          <div
                            className={`font-mono font-black text-sm ${
                              stu.remainingBalanceIQD === 0
                                ? 'text-emerald-400'
                                : 'text-[#D7B875]'
                            }`}
                          >
                            {formatIQD(stu.remainingBalanceIQD)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stu.remainingBalanceIQD === 0
                              ? 'مسدد بالكامل'
                              : 'متبقي بذمة الطالب'}
                          </div>
                        </td>

                        {/* Payment Status Badge */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${getPaymentStatusBadgeClass(
                              stu.paymentStatus
                            )}`}
                          >
                            {stu.paymentStatus === 'deposit'
                              ? 'دافع عربون'
                              : getPaymentStatusArabic(stu.paymentStatus)}
                          </span>
                        </td>

                        {/* Account Link Status */}
                        <td className="p-3.5">
                          {stu.isLinkedToAccount ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                                <UserCheck className="w-3 h-3" />
                                <span>مرتبط موثق</span>
                              </span>
                              <div
                                className="text-[10px] text-slate-300 font-mono truncate max-w-[140px]"
                                title={stu.linkedUserEmail || stu.linkedUserId}
                              >
                                {stu.linkedUserEmail || stu.linkedUserId}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10 text-[10px]">
                              <span>غير مرتبط بحساب</span>
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                setPaymentModalStudentId(stu.id);
                                setPayAmountInput(
                                  stu.remainingBalanceIQD > 0
                                    ? Math.min(5000, stu.remainingBalanceIQD)
                                    : 0
                                );
                                setPayModalFeedback(null);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#35D6C2]/15 hover:bg-[#35D6C2]/25 text-[#35D6C2] border border-[#35D6C2]/30 font-bold text-[11px] flex items-center gap-1"
                              title="عرض سجل الدفعات أو إضافة دفعة جديدة"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>الدفعات ({stuPaysCount})</span>
                            </button>

                            {viewMode === 'active' && canManageFinances && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingStudent(stu);
                                    setEditFullName(stu.fullName);
                                    setEditTitle(stu.preferredTitle);
                                    setEditTotalFee(stu.totalFeeIQD);
                                    setEditPhone(stu.phone || '');
                                    setEditInstId(
                                      stu.institutionalStudentId || ''
                                    );
                                    setEditNotes(stu.notes || '');
                                  }}
                                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10"
                                  title="تعديل بيانات الطالب"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setLinkingStudent(stu);
                                    setSelectedAccountId(
                                      stu.linkedUserId || ''
                                    );
                                    setCustomLinkUid('');
                                    setCustomLinkEmail('');
                                    setCustomLinkName(stu.fullName);
                                  }}
                                  className="p-1.5 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30"
                                  title="ربط أو فك ارتباط بحساب مستخدم"
                                >
                                  <Link2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => {
                                    setArchivingStudent(stu);
                                    setArchiveReason('');
                                  }}
                                  className="p-1.5 rounded-xl bg-[#E85D65]/10 hover:bg-[#E85D65]/20 text-[#E85D65] border border-[#E85D65]/30"
                                  title="أرشفة / حذف سجل الطالب"
                                >
                                  <Archive className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {viewMode === 'archived' && canManageFinances && (
                              <button
                                onClick={async () => {
                                  const res = await restoreSingleScrubStudent(
                                    stu.id
                                  );
                                  setFeedbackBanner({
                                    type: res.success ? 'success' : 'error',
                                    text: res.message,
                                  });
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#0A0D12] font-bold text-[11px] flex items-center gap-1"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>استعادة</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE CARDS VIEW (Touch-Friendly Responsive RTL) */}
          <div className="md:hidden space-y-3">
            {paginatedStudents.map((stu) => {
              const stuPaysCount = studentPayments.filter(
                (p) =>
                  p.studentId === stu.id && p.verificationStatus !== 'voided'
              ).length;

              return (
                <div
                  key={stu.id}
                  className="rounded-2xl bg-[#101B2C] border border-white/10 p-4 space-y-3 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-9 h-9 rounded-xl bg-[#342A78] border border-[#35D6C2]/40 text-[#35D6C2] font-mono font-black text-xs flex items-center justify-center shrink-0">
                        {stu.studentNumber}
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-[#F4F8FC]">
                          {stu.fullName}
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">
                          ID: {stu.id}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${getPaymentStatusBadgeClass(
                        stu.paymentStatus
                      )}`}
                    >
                      {stu.paymentStatus === 'deposit'
                        ? 'دافع عربون'
                        : getPaymentStatusArabic(stu.paymentStatus)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-center bg-[#10151C] p-2.5 rounded-xl border border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] text-[#E8EEF2]/70 block">
                        المبلغ المدفوع
                      </span>
                      <span className="font-mono font-black text-[#35D6C5]">
                        {formatIQD(stu.verifiedPaidIQD)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#E8EEF2]/70 block">
                        المبلغ المتبقي
                      </span>
                      <span className="font-mono font-black text-[#D6B777]">
                        {formatIQD(stu.remainingBalanceIQD)}
                      </span>
                    </div>
                  </div>

                  {stu.needsReview && stu.reviewNote && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-200 space-y-1.5">
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>مراجعة تشابه الاسم:</span>
                      </div>
                      <p>{stu.reviewNote}</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => {
                        setPaymentModalStudentId(stu.id);
                        setPayAmountInput(
                          stu.remainingBalanceIQD > 0
                            ? Math.min(5000, stu.remainingBalanceIQD)
                            : 0
                        );
                        setPayModalFeedback(null);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#35D6C2]/15 text-[#35D6C2] border border-[#35D6C2]/30 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>سجل الدفعات ({stuPaysCount})</span>
                    </button>

                    {viewMode === 'active' && canManageFinances && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setEditingStudent(stu);
                            setEditFullName(stu.fullName);
                            setEditTitle(stu.preferredTitle);
                            setEditTotalFee(stu.totalFeeIQD);
                            setEditPhone(stu.phone || '');
                            setEditInstId(stu.institutionalStudentId || '');
                            setEditNotes(stu.notes || '');
                          }}
                          className="p-2 rounded-xl bg-white/5 text-white border border-white/10"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setLinkingStudent(stu);
                            setSelectedAccountId(stu.linkedUserId || '');
                            setCustomLinkName(stu.fullName);
                          }}
                          className="p-2 rounded-xl bg-indigo-500/15 text-indigo-300 border border-indigo-500/30"
                        >
                          <Link2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setArchivingStudent(stu);
                            setArchiveReason('');
                          }}
                          className="p-2 rounded-xl bg-[#E85D65]/15 text-[#E85D65] border border-[#E85D65]/30"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      </div>
                    )}

                    {viewMode === 'archived' && canManageFinances && (
                      <button
                        onClick={async () => {
                          const res = await restoreSingleScrubStudent(stu.id);
                          setFeedbackBanner({
                            type: res.success ? 'success' : 'error',
                            text: res.message,
                          });
                        }}
                        className="px-4 py-2 rounded-xl bg-emerald-500 text-[#0A0D12] font-bold text-xs"
                      >
                        استعادة
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 rounded-2xl bg-[#101B2C] border border-white/10 text-xs">
              <span className="text-slate-300">
                صفحة <strong className="text-[#35D6C2]">{safePageIndex}</strong> من{' '}
                <strong>{totalPages}</strong> (إجمالي السجلات المعروضة:{' '}
                {filteredAndSortedStudents.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  disabled={safePageIndex <= 1}
                  onClick={() => setCurrentPageIndex((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-bold flex items-center gap-1"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>السابق</span>
                </button>
                <button
                  disabled={safePageIndex >= totalPages}
                  onClick={() =>
                    setCurrentPageIndex((p) => Math.min(totalPages, p + 1))
                  }
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-40 text-white font-bold flex items-center gap-1"
                >
                  <span>التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: ADD NEW STUDENT (Automatic Sequential Numbering)           */}
      {/* =================================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#101B2C] border border-[#35D6C2]/30 p-6 shadow-2xl space-y-4 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-9 h-9 rounded-xl bg-[#35D6C2]/20 text-[#35D6C2] font-mono font-black text-sm flex items-center justify-center">
                  {nextAutoNumber}
                </span>
                <div>
                  <h3 className="text-base font-black text-[#F4F8FC]">
                    إضافة طالب جديد إلى قائمة حفلة السكراب
                  </h3>
                  <p className="text-[11px] text-[#35D6C2]">
                    الرقم التسلسلي التلقائي المخصص: (ت = {nextAutoNumber})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddStudentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-white font-bold mb-1.5">
                  الاسم الكامل باللغة العربية: *
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="مثال: أحمد علي كاظم"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white focus:outline-none focus:border-[#35D6C2]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1.5">
                    اللقب المهني:
                  </label>
                  <select
                    value={newTitle}
                    onChange={(e) =>
                      setNewTitle(e.target.value as 'nurse_m' | 'nurse_f')
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10151C] border border-white/10 text-white"
                  >
                    <option value="nurse_m">الممرض (طالب)</option>
                    <option value="nurse_f">الممرضة (طالبة)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-1.5">
                    المبلغ المدفوع الأولي (د.ع):
                  </label>
                  <input
                    type="number"
                    step={500}
                    min={0}
                    max={newTotalFee}
                    value={newInitialDeposit}
                    onChange={(e) =>
                      setNewInitialDeposit(Number(e.target.value))
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10151C] border border-white/10 text-[#35D6C5] font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-1.5">
                    المبلغ المتبقي التلقائي (د.ع):
                  </label>
                  <div className="w-full px-3 py-2.5 rounded-xl bg-[#10151C]/60 border border-white/10 text-[#D6B777] font-mono font-black">
                    {formatIQD(Math.max(0, newTotalFee - newInitialDeposit))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1.5">
                    رقم الهاتف (اختياري):
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="077XXXXXXXX"
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-1.5">
                    رقم القيد (اختياري):
                  </label>
                  <input
                    type="text"
                    value={newInstId}
                    onChange={(e) => setNewInstId(e.target.value)}
                    placeholder="NUR-2026-..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1.5">
                  ملاحظات إدارية (اختياري):
                </label>
                <input
                  type="text"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="مثال: تم استلام العربون نقداً..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdd}
                  className="px-5 py-2 rounded-xl bg-[#35D6C2] text-[#0A0D12] font-extrabold shadow-lg"
                >
                  {isSubmittingAdd
                    ? 'جاري الحفظ...'
                    : `حفظ وإدراج بالرقم (${nextAutoNumber})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: EDIT STUDENT DETAILS                                       */}
      {/* =================================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#101B2C] border border-white/15 p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-black text-[#F4F8FC]">
                تعديل بيانات الطالب رقم ({editingStudent.studentNumber}) —{' '}
                {editingStudent.fullName}
              </h3>
              <button
                onClick={() => setEditingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditStudentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-white font-bold mb-1">
                  الاسم الكامل باللغة العربية:
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-white font-bold mb-1">
                  اللقب المهني:
                </label>
                <select
                  value={editTitle}
                  onChange={(e) =>
                    setEditTitle(e.target.value as 'nurse_m' | 'nurse_f')
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-[#10151C] border border-white/10 text-white"
                >
                  <option value="nurse_m">الممرض</option>
                  <option value="nurse_f">الممرضة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">
                    رقم الهاتف:
                  </label>
                  <input
                    type="tel"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-1">
                    رقم القيد:
                  </label>
                  <input
                    type="text"
                    value={editInstId}
                    onChange={(e) => setEditInstId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">
                  ملاحظات إدارية:
                </label>
                <input
                  type="text"
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#35D6C2] text-[#0A0D12] font-extrabold"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: SINGLE STUDENT ARCHIVE / SOFT DELETE                       */}
      {/* =================================================================== */}
      {archivingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#101B2C] border border-[#E85D65]/40 p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center gap-2.5 text-[#E85D65]">
              <Archive className="w-5 h-5" />
              <h3 className="text-base font-black text-white">
                تأكيد أرشفة سجل الطالب ({archivingStudent.fullName})
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              سيتم نقل الطالب رقم ({archivingStudent.studentNumber}) إلى الأرشيف مع الاحتفاظ الكامل بوصولاته المالية ({formatIQD(archivingStudent.verifiedPaidIQD)}) لأغراض التدقيق المالي، ويمكن استعادته في أي وقت.
            </p>
            <input
              type="text"
              value={archiveReason}
              onChange={(e) => setArchiveReason(e.target.value)}
              placeholder="سبب الأرشفة (اختياري)..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-xs text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setArchivingStudent(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold"
              >
                إلغاء
              </button>
              <button
                onClick={async () => {
                  const res = await archiveSingleScrubStudent(
                    archivingStudent.id,
                    archiveReason
                  );
                  setArchivingStudent(null);
                  setFeedbackBanner({
                    type: res.success ? 'success' : 'error',
                    text: res.message,
                  });
                }}
                className="px-5 py-2 rounded-xl bg-[#E85D65] text-white text-xs font-extrabold"
              >
                تأكيد الأرشفة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: STUDENT PAYMENT HISTORY & NEW PAYMENT RECORDING            */}
      {/* =================================================================== */}
      {activePaymentStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-2xl rounded-3xl bg-[#101B2C] border border-[#35D6C2]/30 p-6 shadow-2xl space-y-5 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-lg bg-[#342A78] text-[#35D6C2] font-mono font-black text-xs">
                    ت: {activePaymentStudent.studentNumber}
                  </span>
                  <h3 className="text-lg font-black text-[#F4F8FC]">
                    السجل المالي والوصولات — {activePaymentStudent.fullName}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  المعرف الدائم: {activePaymentStudent.id}
                </p>
              </div>
              <button
                onClick={() => setPaymentModalStudentId(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            {/* Balance Calculation Summary Bar (Paid & Remaining Only) */}
            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-[#10151C] border border-white/10 text-center">
              <div>
                <span className="text-[11px] text-[#35D6C5] block font-bold">
                  المبلغ المدفوع
                </span>
                <span className="text-base sm:text-lg font-black text-[#35D6C5] font-mono">
                  {formatIQD(activePaymentStudent.verifiedPaidIQD)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#D6B777] block font-bold">
                  المبلغ المتبقي
                </span>
                <span className="text-base sm:text-lg font-black text-[#D6B777] font-mono">
                  {formatIQD(activePaymentStudent.remainingBalanceIQD)}
                </span>
              </div>
            </div>

            {payModalFeedback && (
              <div
                className={`p-3.5 rounded-xl border text-xs font-bold ${
                  payModalFeedback.type === 'success'
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                    : 'bg-[#E85D65]/15 border-[#E85D65]/40 text-[#E85D65]'
                }`}
              >
                {payModalFeedback.text}
              </div>
            )}

            {/* Add New Payment Form (Only if remaining balance > 0 and canManageFinances) */}
            {canManageFinances && activePaymentStudent.remainingBalanceIQD > 0 && (
              <form
                onSubmit={handleAddPaymentSubmit}
                className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-[#35D6C2]/25 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-black text-[#35D6C2] flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>تسجيل دفعة جديدة للطالب</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setPayAmountInput(activePaymentStudent.remainingBalanceIQD)
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#D7B875]/15 text-[#D7B875] border border-[#D7B875]/30 text-[11px] font-bold"
                  >
                    تسديد كامل المتبقي ({formatIQD(activePaymentStudent.remainingBalanceIQD)})
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      المبلغ المقبوض (د.ع): *
                    </label>
                    <input
                      type="number"
                      step={500}
                      min={250}
                      max={activePaymentStudent.remainingBalanceIQD}
                      required
                      value={payAmountInput}
                      onChange={(e) => setPayAmountInput(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-white/10 text-white font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      طريقة الدفع:
                    </label>
                    <select
                      value={payMethodInput}
                      onChange={(e) =>
                        setPayMethodInput(e.target.value as PaymentMethod)
                      }
                      className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-white/10 text-white"
                    >
                      <option value="cash">نقدي (كاش باليد)</option>
                      <option value="bank_transfer">تحويل مالي / إلكتروني</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      رقم الوصل (تلقائي إن تُرك فارغاً):
                    </label>
                    <input
                      type="text"
                      value={payReceiptInput}
                      onChange={(e) => setPayReceiptInput(e.target.value)}
                      placeholder="SCRUB-REC-..."
                      className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                  <input
                    type="text"
                    value={payNotesInput}
                    onChange={(e) => setPayNotesInput(e.target.value)}
                    placeholder="ملاحظات الدفعة (اختياري)..."
                    className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-white/10 text-white"
                  />

                  <label className="flex items-center gap-2 cursor-pointer text-slate-200 font-bold">
                    <input
                      type="checkbox"
                      checked={payVerifiedInput}
                      onChange={(e) => setPayVerifiedInput(e.target.checked)}
                      className="w-4 h-4 accent-[#35D6C2] rounded"
                    />
                    <span>دفعة موثقة ومؤكدة فوراً (تخصم من المتبقي)</span>
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-[#35D6C2] hover:opacity-95 text-[#0A0D12] font-extrabold text-xs shadow-md"
                  >
                    إصدار الوصل وتثبيت الدفعة
                  </button>
                </div>
              </form>
            )}

            {/* Payment History List */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-black text-slate-300">
                سجل الدفعات والوصولات التاريخي ({activeStudentPaymentsList.length})
              </h4>

              {activeStudentPaymentsList.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-[#0A0D12] border border-white/5 text-xs text-slate-400">
                  لا توجد دفعات مسجلة لهذا الطالب حتى الآن.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeStudentPaymentsList.map((pay) => (
                    <div
                      key={pay.id}
                      className={`p-3.5 rounded-2xl border text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                        pay.verificationStatus === 'voided'
                          ? 'bg-red-950/20 border-red-500/20 opacity-60'
                          : pay.isVerified
                          ? 'bg-[#0A0D12] border-emerald-500/25'
                          : 'bg-[#0A0D12] border-amber-500/30'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-black text-white">
                            {pay.receiptNumber}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              pay.verificationStatus === 'voided'
                                ? 'bg-red-500/20 text-red-300'
                                : pay.isVerified
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-amber-500/20 text-amber-300'
                            }`}
                          >
                            {pay.verificationStatus === 'voided'
                              ? 'سند ملغى'
                              : pay.isVerified
                              ? 'موثق ومعتمد'
                              : 'قيد التدقيق'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            [{pay.referenceCode}]
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          التاريخ: {pay.date} ({pay.time}) • الطريقة:{' '}
                          {pay.paymentMethod === 'cash' ? 'نقداً' : 'تحويل'} •
                          المسؤول: {pay.recordedBy}
                        </div>
                        {pay.notes && (
                          <div className="text-[11px] text-slate-300">
                            {pay.notes}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <span className="text-base font-black text-[#35D6C2] font-mono ml-2">
                          {formatIQD(pay.amountIQD)}
                        </span>

                        {pay.verificationStatus !== 'voided' && (
                          <>
                            <button
                              onClick={() => handlePreviewStudentReceipt(pay)}
                              className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-bold text-[11px] flex items-center gap-1"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#35D6C2]" />
                              <span>الوصل</span>
                            </button>

                            {canManageFinances && (
                              <>
                                <button
                                  onClick={async () => {
                                    const res = await verifyStudentPayment(
                                      pay.id,
                                      !pay.isVerified
                                    );
                                    setPayModalFeedback({
                                      type: res.success ? 'success' : 'error',
                                      text: res.message,
                                    });
                                  }}
                                  className={`px-2.5 py-1.5 rounded-lg font-bold text-[11px] ${
                                    pay.isVerified
                                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                                      : 'bg-emerald-500 text-[#0A0D12]'
                                  }`}
                                >
                                  {pay.isVerified ? 'تعليق التدقيق' : 'اعتماد وتوثيق'}
                                </button>

                                <button
                                  onClick={() => {
                                    setVoidingPaymentId(pay.id);
                                    setVoidReasonInput('');
                                  }}
                                  className="p-1.5 rounded-lg bg-[#E85D65]/15 text-[#E85D65] hover:bg-[#E85D65]/25"
                                  title="إلغاء السند مع حفظ الأثر في التدقيق"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Void Payment Sub-prompt */}
            {voidingPaymentId && (
              <div className="p-4 rounded-2xl bg-red-950/40 border border-[#E85D65]/40 space-y-3 text-xs">
                <div className="font-bold text-[#E85D65]">
                  تأكيد إلغاء السند المالي (يبقى محفوظاً في سجل التدقيق المالي):
                </div>
                <input
                  type="text"
                  value={voidReasonInput}
                  onChange={(e) => setVoidReasonInput(e.target.value)}
                  placeholder="اكتب سبب الإلغاء (مثال: خطأ إدخال أو استرداد)..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/10 text-white"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setVoidingPaymentId(null)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white"
                  >
                    تراجع
                  </button>
                  <button
                    onClick={async () => {
                      const res = await voidStudentPayment(
                        voidingPaymentId,
                        voidReasonInput
                      );
                      setVoidingPaymentId(null);
                      setPayModalFeedback({
                        type: res.success ? 'success' : 'error',
                        text: res.message,
                      });
                    }}
                    className="px-4 py-1.5 rounded-lg bg-[#E85D65] text-white font-bold"
                  >
                    تأكيد إلغاء السند
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 5: VERIFIED ACCOUNT LINKING & PRIVACY (Requirement 6)         */}
      {/* =================================================================== */}
      {linkingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#101B2C] border border-indigo-400/40 p-6 shadow-2xl space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-[#F4F8FC]">
                  الربط الموثق بحساب الطالب — {linkingStudent.fullName}
                </h3>
                <p className="text-[11px] text-indigo-300">
                  رقم الطالب (ت: {linkingStudent.studentNumber}) • المعرف الدائم:{' '}
                  {linkingStudent.id}
                </p>
              </div>
              <button
                onClick={() => setLinkingStudent(null)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0A0D12] border border-indigo-500/20 text-xs text-slate-300 leading-relaxed">
              <strong className="text-[#35D6C2] block mb-1">
                ضمان الخصوصية المالية وأمان الربط:
              </strong>
              لا يتم ربط أي سجل مالي تلقائياً بمجرد تشابه الأسماء. عند ربط هذا السجل بحساب طالب موثق، سيتمكن هذا الطالب فقط (بالإضافة للإدارة المالية) من استعراض عربونه ورصيده المتبقي ({formatIQD(linkingStudent.remainingBalanceIQD)}).
            </div>

            {linkingStudent.isLinkedToAccount ? (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3 text-xs">
                <div className="font-bold text-emerald-300 flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  <span>هذا السجل مرتبط حالياً بحساب موثق:</span>
                </div>
                <div className="space-y-1 text-slate-200 font-mono">
                  <div>البريد: {linkingStudent.linkedUserEmail}</div>
                  <div>معرف الحساب (UID): {linkingStudent.linkedUserId}</div>
                  <div>تم الربط بواسطة: {linkingStudent.linkedBy}</div>
                </div>
                <button
                  onClick={async () => {
                    const res = await unlinkStudentFromAccount(
                      linkingStudent.id
                    );
                    setLinkingStudent(null);
                    setFeedbackBanner({
                      type: res.success ? 'success' : 'error',
                      text: res.message,
                    });
                  }}
                  className="px-4 py-2 rounded-xl bg-[#E85D65]/20 hover:bg-[#E85D65]/30 text-[#E85D65] border border-[#E85D65]/40 font-bold flex items-center gap-1.5"
                >
                  <Unlink className="w-3.5 h-3.5" />
                  <span>إلغاء ربط الحساب (Unlink Account)</span>
                </button>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div>
                  <label className="block text-white font-bold mb-1.5">
                    اختر من حسابات الخريجين أو طلبات التسجيل الموثقة:
                  </label>
                  <select
                    value={selectedAccountId}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSelectedAccountId(val);
                      const g = graduates.find((x) => x.id === val);
                      if (g) {
                        setCustomLinkUid(g.id);
                        setCustomLinkEmail(g.email);
                        setCustomLinkName(g.fullName);
                      } else {
                        const r = pendingRegistrationRequests.find(
                          (x) => x.userId === val
                        );
                        if (r) {
                          setCustomLinkUid(r.userId);
                          setCustomLinkEmail(r.email);
                          setCustomLinkName(r.fullName);
                        }
                      }
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/10 text-white"
                  >
                    <option value="">-- اختر حساب مستخدم مسجل --</option>
                    {graduates
                      .filter((g) => g.id !== 'grad-admin' && g.id !== 'grad-mod')
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          [خريج معتمد] {g.fullName} ({g.email} - {g.phone})
                        </option>
                      ))}
                    {pendingRegistrationRequests.map((r) => (
                      <option key={r.userId} value={r.userId}>
                        [طلب تسجيل] {r.fullName} ({r.email} - {r.phoneNumber})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      المعرف الدائم للحساب (UID):
                    </label>
                    <input
                      type="text"
                      value={customLinkUid}
                      onChange={(e) => setCustomLinkUid(e.target.value)}
                      placeholder="UID..."
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      البريد الإلكتروني للحساب:
                    </label>
                    <input
                      type="email"
                      value={customLinkEmail}
                      onChange={(e) => setCustomLinkEmail(e.target.value)}
                      placeholder="student@gmail.com"
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/10 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setLinkingStudent(null)}
                    className="px-4 py-2 rounded-xl bg-white/5 text-slate-300"
                  >
                    إلغاء
                  </button>
                  <button
                    type="button"
                    disabled={!customLinkUid.trim() || !customLinkEmail.trim()}
                    onClick={async () => {
                      const res = await linkStudentToAccount(
                        linkingStudent.id,
                        {
                          userId: customLinkUid.trim(),
                          email: customLinkEmail.trim(),
                          fullName:
                            customLinkName.trim() || linkingStudent.fullName,
                        }
                      );
                      setLinkingStudent(null);
                      setFeedbackBanner({
                        type: res.success ? 'success' : 'error',
                        text: res.message,
                      });
                    }}
                    className="px-5 py-2 rounded-xl bg-[#35D6C2] disabled:opacity-40 text-[#0A0D12] font-extrabold"
                  >
                    تأكيد التحقق وربط الحساب
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 6: IMPORT STUDENT LIST WITH DUPLICATE DETECTION (Req 1 & 3)   */}
      {/* =================================================================== */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-[#101B2C] border border-[#35D6C2]/30 p-6 shadow-2xl space-y-5 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-[#F4F8FC]">
                  استيراد قائمة طلبة حفلة السكراب ومنع التكرار
                </h3>
                <p className="text-[11px] text-slate-300">
                  يفحص النظام الأسماء العربية تلقائياً لمنع التكرار، ولا يستبدل المدفوعات الموثقة أبداً.
                </p>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Option A: Re-verify / Import Official 46 Students */}
            <div className="p-4 rounded-2xl bg-[#0A0D12] border border-[#35D6C2]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#35D6C2]">
                  1. القائمة الرسمية المعتمدة (46 طالب/طالبة — دفعة 2026)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  آمن لإعادة المحاولة بدون تكرار
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                يتحقق من وجود الـ 46 طالباً الرسميين (بما فيهم إدراج "عباس خضير" مرة واحدة فقط، وعربون "عباس محمد شيال" بقيمة 1,000 د.ع والمتبقي 34,000 د.ع، وبقية الـ 45 طالباً بعربون 2,000 د.ع والمتبقي 33,000 د.ع).
              </p>
              <button
                disabled={isImporting}
                onClick={async () => {
                  setIsImporting(true);
                  const rep = await importOfficial46List();
                  setIsImporting(false);
                  setLastImportReport(rep);
                }}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#35D6C2] to-[#24b8a5] text-[#0A0D12] font-extrabold text-xs shadow-md"
              >
                {isImporting
                  ? 'جاري الفحص والاستيراد...'
                  : 'فحص واستيراد قائمة الـ 46 طالباً الرسمية الآن'}
              </button>
            </div>

            {/* Option B: Import Custom Arabic Names List */}
            <div className="p-4 rounded-2xl bg-[#0A0D12] border border-white/10 space-y-3 text-xs">
              <span className="font-extrabold text-[#D7B875] block">
                2. استيراد أسماء طلبة إضافية (سطر لكل طالب):
              </span>
              <p className="text-[11px] text-slate-400">
                أدخل اسم الطالب في كل سطر، أو بصيغة:{' '}
                <code className="text-white">الاسم الكامل | مبلغ العربون</code>
              </p>
              <textarea
                rows={4}
                value={importTextLines}
                onChange={(e) => setImportTextLines(e.target.value)}
                placeholder={`مثال:\nمنتظر كريم جاسم | 2000\nفاطمة حيدر علي | 5000`}
                className="w-full p-3 rounded-xl bg-[#101B2C] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C2]"
              />
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-slate-300">العربون الافتراضي:</span>
                  <input
                    type="number"
                    step={500}
                    value={defaultImportDeposit}
                    onChange={(e) =>
                      setDefaultImportDeposit(Number(e.target.value))
                    }
                    className="w-28 px-2.5 py-1.5 rounded-lg bg-[#101B2C] border border-white/10 text-white font-mono"
                  />
                </div>
                <button
                  disabled={isImporting || !importTextLines.trim()}
                  onClick={async () => {
                    const lines = importTextLines
                      .split('\n')
                      .map((l) => l.trim())
                      .filter(Boolean);
                    const parsed = lines.map((line) => {
                      const parts = line.split(/[|,،\t]/).map((p) => p.trim());
                      const fullName = parts[0];
                      const dep =
                        parts[1] && !isNaN(Number(parts[1].replace(/,/g, '')))
                          ? Number(parts[1].replace(/,/g, ''))
                          : defaultImportDeposit;
                      return {
                        fullName,
                        initialDepositIQD: dep,
                        totalFeeIQD: 35000,
                      };
                    });
                    setIsImporting(true);
                    const rep = await importCustomStudentsList(parsed);
                    setIsImporting(false);
                    setLastImportReport(rep);
                    setImportTextLines('');
                  }}
                  className="px-4 py-2 rounded-xl bg-[#342A78] hover:bg-[#413596] disabled:opacity-40 text-white font-bold"
                >
                  استيراد الأسماء المضافة
                </button>
              </div>
            </div>

            {/* Import Result Report */}
            {lastImportReport && (
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2 text-xs">
                <div className="font-black text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>نتيجة عملية الفحص والاستيراد:</span>
                </div>
                <ul className="space-y-1 text-slate-200">
                  <li>
                    • سجلات جديدة تمت إضافتها:{' '}
                    <strong className="text-emerald-400">
                      {lastImportReport.importedCount}
                    </strong>
                  </li>
                  <li>
                    • سجلات مكررة تم تخطيها بأمان:{' '}
                    <strong className="text-[#D7B875]">
                      {lastImportReport.skippedDuplicatesCount}
                    </strong>
                  </li>
                  <li>
                    • سجلات مشابهة وُضعت تحت المراجعة:{' '}
                    <strong className="text-amber-300">
                      {lastImportReport.flaggedForReviewCount}
                    </strong>
                  </li>
                  <li>
                    • إجمالي الطلبة النشطين في القائمة الآن:{' '}
                    <strong className="text-[#35D6C2]">
                      {lastImportReport.totalActiveStudents}
                    </strong>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 7: SUPER-ADMIN-ONLY "DELETE ENTIRE STUDENT LIST" (Req 4)      */}
      {/* =================================================================== */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#101B2C] border-2 border-[#E85D65]/60 p-6 sm:p-7 shadow-2xl space-y-5 text-right">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5 text-[#E85D65]">
                <ShieldAlert className="w-6 h-6 shrink-0" />
                <div>
                  <h3 className="text-base sm:text-lg font-black text-white">
                    حذف قائمة الطلاب بالكامل (Delete Entire Student List)
                  </h3>
                  <span className="text-[11px] text-[#E85D65] font-bold">
                    إجراء حساس عالي الخطورة • خطوة التأكيد {deleteStep} من 2
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowDeleteAllModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {deleteStep === 1 ? (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#E85D65]/15 border border-[#E85D65]/40 space-y-2 text-slate-200 leading-relaxed">
                  <div className="font-black text-[#E85D65] text-sm flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>تحذير هام قبل المتابعة:</span>
                  </div>
                  <p>
                    أنت على وشك حذف القائمة النشطة لطلبة حفلة السكراب والبالغ عددها{' '}
                    <strong className="text-white font-mono">
                      ({activeStudents.length})
                    </strong>{' '}
                    سجل طالب، والمرتبطة بـ{' '}
                    <strong className="text-white font-mono">
                      ({studentPayments.length})
                    </strong>{' '}
                    سند مالي بقيمة إجمالية{' '}
                    <strong className="text-emerald-300 font-mono">
                      {formatIQD(summaryStats.totalVerifiedPaidIQD)}
                    </strong>
                    .
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1 pt-1">
                    <li>
                      يستهدف هذا الإجراء <strong>قائمة طلبة حفلة السكراب فقط</strong> ولا يحذف حسابات المستخدمين أو الفعاليات أو الإعلانات أو صور المعرض.
                    </li>
                    <li>
                      يتم تطبيق <strong>الأرشفة الآمنة (Soft Deletion / Archival)</strong> للاحتفاظ بكافة الوصولات والسجلات المالية لأغراض التدقيق المالي وإمكانية الاستعادة.
                    </li>
                    <li>
                      سيتم توثيق العملية فوراً في سجل التدقيق الأمني (Audit Log) باسمك وتوقيت التنفيذ.
                    </li>
                  </ul>
                </div>

                {/* Backup Option Before Deletion */}
                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-white/10 space-y-2.5">
                  <div className="font-bold text-[#D7B875] flex items-center justify-between">
                    <span>نسخة احتياطية قبل الحذف (موصى به):</span>
                    {backupDownloadedBeforeDelete && (
                      <span className="text-emerald-400 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>تم تنزيل النسخة الاحتياطية</span>
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadCSV(true);
                        setBackupDownloadedBeforeDelete(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#35D6C2]" />
                      <span>تصدير القائمة (CSV)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleDownloadBackupJSON();
                        setBackupDownloadedBeforeDelete(true);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold flex items-center justify-center gap-1.5"
                    >
                      <Download className="w-3.5 h-3.5 text-[#D7B875]" />
                      <span>نسخة كاملة (JSON)</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowDeleteAllModal(false)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-bold"
                  >
                    إلغاء وتراجع
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-[#E85D65] hover:bg-red-600 text-white font-extrabold shadow-lg"
                  >
                    المتابعة إلى خطوة التأكيد النهائية (2/2)
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-[#E85D65]/40 space-y-2">
                  <p className="text-slate-200 leading-relaxed">
                    لتأكيد حذف وأرشفة قائمة الطلبة البالغ عددها{' '}
                    <strong className="text-white">
                      ({activeStudents.length} طالب/طالبة)
                    </strong>
                    ، يرجى كتابة عبارة التأكيد الإلزامية التالية بدقة:
                  </p>
                  <div
                    className="p-2.5 rounded-xl bg-[#101B2C] border border-white/10 text-center font-mono font-black text-sm text-[#E85D65] select-all"
                    dir="ltr"
                  >
                    DELETE STUDENT LIST
                  </div>
                </div>

                <div>
                  <label className="block text-white font-bold mb-1.5">
                    اكتب عبارة التأكيد هنا:
                  </label>
                  <input
                    type="text"
                    dir="ltr"
                    value={deleteConfirmPhrase}
                    onChange={(e) => {
                      setDeleteConfirmPhrase(e.target.value);
                      setDeleteModalError(null);
                    }}
                    placeholder="DELETE STUDENT LIST"
                    className="w-full px-4 py-3 rounded-xl bg-[#0A0D12] border border-[#E85D65]/50 text-white font-mono text-center text-sm focus:outline-none focus:border-[#E85D65]"
                  />
                </div>

                {deleteModalError && (
                  <div className="p-3 rounded-xl bg-[#E85D65]/20 border border-[#E85D65]/40 text-[#E85D65] font-bold">
                    {deleteModalError}
                  </div>
                )}

                <div className="flex justify-between items-center gap-2 pt-2 border-t border-white/10">
                  <button
                    type="button"
                    onClick={() => setDeleteStep(1)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-300 font-bold"
                  >
                    العودة للخطوة 1
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDeleteAllModal(false)}
                      className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      disabled={
                        isDeletingAll ||
                        deleteConfirmPhrase !== 'DELETE STUDENT LIST'
                      }
                      onClick={async () => {
                        setIsDeletingAll(true);
                        setDeleteModalError(null);
                        const res = await deleteEntireStudentListSuperAdmin(
                          deleteConfirmPhrase
                        );
                        setIsDeletingAll(false);
                        if (res.success) {
                          setShowDeleteAllModal(false);
                          setFeedbackBanner({
                            type: 'success',
                            text: res.message,
                          });
                        } else {
                          setDeleteModalError(res.message);
                        }
                      }}
                      className="px-5 py-2.5 rounded-xl bg-[#E85D65] hover:bg-red-600 disabled:opacity-35 text-white font-extrabold flex items-center gap-1.5 shadow-xl"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>
                        {isDeletingAll
                          ? 'جاري التنفيذ...'
                          : 'تأكيد حذف قائمة الطلاب بالكامل'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
