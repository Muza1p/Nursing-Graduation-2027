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
  exportScrubStudentsExcelXLS,
  exportScrubFullBackupJSON,
  getUnifiedPaymentStatusArabic,
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
  Printer,
} from 'lucide-react';

export const ScrubStudentManagementSection: React.FC = () => {
  const {
    eventConfig,
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
    editStudentPayment,
    verifyStudentPayment,
    voidStudentPayment,
    linkStudentToAccount,
    unlinkStudentFromAccount,
    resolveStudentReviewFlag,
    confirmStudentReviewDeposit,
    changeStudentPaymentStatusManual,
    openReceipt,
  } = useApp();

  // View Mode: active vs archived
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  // Search, Filter, Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<
    'all' | 'شعبة 1' | 'شعبة 2' | 'شعبة 3' | 'شعبة 4'
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'deposit' | 'partial' | 'completed' | 'unpaid' | 'needs_review' | 'linked'
  >('all');
  const [sortBy, setSortBy] = useState<
    'number_asc' | 'number_desc' | 'name_asc' | 'paid_desc' | 'remaining_desc'
  >('number_asc');
  const [pageSize, setPageSize] = useState<number>(250);
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
  const [editPaymentStatusManual, setEditPaymentStatusManual] = useState<PaymentStatus>('unpaid');

  // 3. Single Student Archive Confirmation Modal
  const [archivingStudent, setArchivingStudent] = useState<ScrubStudent | null>(null);
  const [archiveReason, setArchiveReason] = useState('');

  // 4. Student Payment History & Record/Edit Payment Modal
  const [paymentModalStudentId, setPaymentModalStudentId] = useState<string | null>(null);
  const [payAmountInput, setPayAmountInput] = useState<number>(5000);
  const [payDateInput, setPayDateInput] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
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

  // Inline Edit Payment State inside Modal 4
  const [editingPaymentId, setEditingPaymentId] = useState<string | null>(null);
  const [editPayAmount, setEditPayAmount] = useState<number>(2000);
  const [editPayDate, setEditPayDate] = useState<string>('');
  const [editPayMethod, setEditPayMethod] = useState<PaymentMethod>('cash');
  const [editPayReceipt, setEditPayReceipt] = useState<string>('');
  const [editPayNotes, setEditPayNotes] = useState<string>('');

  // 8. Printable Report Modal ('all' | 'remaining' | null)
  const [printModalMode, setPrintModalMode] = useState<'all' | 'remaining' | null>(null);

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
    const reviewCount = activeStudents.filter(
      (s) => s.needsReview || s.paymentStatus === 'needs_review'
    ).length;
    const unpaidCount = activeStudents.filter(
      (s) => s.paymentStatus === 'unpaid' && !s.needsReview
    ).length;
    const linkedCount = activeStudents.filter((s) => s.isLinkedToAccount).length;

    const section1Count = activeStudents.filter((s) => s.section === 'شعبة 1' || s.sectionNumber === 1).length;
    const section2Count = activeStudents.filter((s) => s.section === 'شعبة 2' || s.sectionNumber === 2).length;
    const section3Count = activeStudents.filter((s) => s.section === 'شعبة 3' || s.sectionNumber === 3).length;
    const section4Count = activeStudents.filter((s) => s.section === 'شعبة 4' || s.sectionNumber === 4).length;

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
      section1Count,
      section2Count,
      section3Count,
      section4Count,
    };
  }, [activeStudents]);

  // Filtered & Sorted Students
  const filteredAndSortedStudents = useMemo(() => {
    const baseList = viewMode === 'active' ? activeStudents : archivedStudents;
    const cleanQuery = searchQuery.trim();
    const normQuery = normalizeArabicName(cleanQuery);

    const filtered = baseList.filter((stu) => {
      // Filter by section
      if (sectionFilter !== 'all') {
        const expectedNum = Number(sectionFilter.replace(/[^0-9]/g, ''));
        const stuSec =
          stu.section ||
          (stu.sectionNumber ? `شعبة ${stu.sectionNumber}` : '');
        if (stuSec !== sectionFilter && stu.sectionNumber !== expectedNum) {
          return false;
        }
      }

      // Search by Arabic name (exact or normalized) or studentNumber or ID or phone
      let matchesSearch = true;
      if (cleanQuery) {
        const numMatch =
          String(stu.studentNumber) === cleanQuery ||
          String(stu.sectionStudentNumber || '') === cleanQuery;
        const nameMatch =
          stu.fullName.includes(cleanQuery) ||
          stu.normalizedName.includes(normQuery);
        const phoneMatch = stu.phone ? stu.phone.includes(cleanQuery) : false;
        const idMatch = stu.id.toLowerCase().includes(cleanQuery.toLowerCase());
        const secMatch = stu.section ? stu.section.includes(cleanQuery) : false;
        matchesSearch = numMatch || nameMatch || phoneMatch || idMatch || secMatch;
      }

      // Filter by status
      let matchesStatus = true;
      if (statusFilter === 'deposit') {
        matchesStatus = stu.paymentStatus === 'deposit';
      } else if (statusFilter === 'partial') {
        matchesStatus =
          stu.paymentStatus === 'partial' || stu.paymentStatus === 'deposit';
      } else if (statusFilter === 'completed') {
        matchesStatus = stu.paymentStatus === 'completed';
      } else if (statusFilter === 'unpaid') {
        matchesStatus = stu.paymentStatus === 'unpaid' && !stu.needsReview;
      } else if (statusFilter === 'needs_review') {
        matchesStatus = Boolean(stu.needsReview || stu.paymentStatus === 'needs_review');
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
    sectionFilter,
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
    const csv = exportScrubStudentsCSV(scrubStudents, studentPayments, includeArchived);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nursing_Graduation_Students_2027_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export Excel (.xls) helper
  const handleDownloadExcelXLS = (includeArchived = false) => {
    const xls = exportScrubStudentsExcelXLS(scrubStudents, studentPayments, includeArchived);
    const blob = new Blob([xls], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Nursing_Graduation_Students_2027_${new Date().toISOString().split('T')[0]}.xls`;
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

    const currentStatusKey: PaymentStatus = editingStudent.needsReview
      ? 'needs_review'
      : editingStudent.paymentStatus;

    if (editPaymentStatusManual !== currentStatusKey) {
      await changeStudentPaymentStatusManual(
        editingStudent.id,
        editPaymentStatusManual,
        editNotes || undefined
      );
    }

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
      date: payDateInput,
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

  // Handle Edit Existing Payment Submit
  const handleEditPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPaymentId) return;
    setPayModalFeedback(null);

    const res = await editStudentPayment({
      paymentId: editingPaymentId,
      amountIQD: editPayAmount,
      date: editPayDate,
      paymentMethod: editPayMethod,
      receiptNumber: editPayReceipt,
      notes: editPayNotes,
    });

    if (res.success) {
      setPayModalFeedback({ type: 'success', text: res.message });
      setEditingPaymentId(null);
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
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-xl bg-[#35D6C2]/15 border border-[#35D6C2]/30 text-[#35D6C2] text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {eventConfig.collegeName || 'تخرج طلاب معهد التمريض'} •{' '}
                {eventConfig.departmentName || 'دفعة 2027'} •{' '}
                {eventConfig.stageName || 'المرحلة الثانية'} ({eventConfig.studyType || 'صباحي'}) •{' '}
                {eventConfig.academicYear || '2026–2027'}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#F4F8FC]">
              قائمة الطلاب والمشاركين وسجل الدفعات — تخرج دفعة التمريض 2027 (244 طالب/طالبة)
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-[#E8EEF2]/90 pt-0.5">
              <span className="px-2.5 py-1 rounded-lg bg-[#0A0D12]/80 border border-white/10">
                مكان الحفلة: <strong className="text-[#35D6C5]">{eventConfig.scrubVenue || 'مسرح تفاحة المصور'}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0A0D12]/80 border border-white/10">
                المصور: <strong className="text-[#D7B875]">{eventConfig.scrubPhotographer || 'باقر حسن'}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0A0D12]/80 border border-white/10">
                التاريخ المقترح: <strong className="text-white font-mono">{eventConfig.scrubPartyDateDisplay || '12/12/2026'}</strong>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0A0D12]/80 border border-[#35D6C2]/30">
                مبلغ الحفلة الكامل لكل طالب: <strong className="text-[#35D6C5] font-mono">35,000 د.ع</strong>
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {canManageFinances && (
              <>
                <button
                  onClick={() => {
                    setFeedbackBanner(null);
                    setShowAddModal(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-[#35D6C2] to-[#22b8a5] hover:opacity-95 text-[#0A0D12] font-extrabold text-xs shadow-lg shadow-[#35D6C2]/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة طالب (ت: {nextAutoNumber})</span>
                </button>

                <button
                  onClick={() => {
                    setLastImportReport(null);
                    setShowImportModal(true);
                  }}
                  className="px-3.5 py-2.5 rounded-xl bg-[#342A78] hover:bg-[#3f3391] text-[#F4F8FC] font-bold text-xs border border-indigo-400/40 flex items-center gap-1.5 shadow-md"
                >
                  <Upload className="w-4 h-4 text-[#35D6C2]" />
                  <span>فحص/دمج القائمة الرسمية (244)</span>
                </button>
              </>
            )}

            <button
              onClick={() => handleDownloadExcelXLS(false)}
              className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 font-extrabold text-xs border border-emerald-500/35 flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>تصدير Excel (.xls)</span>
            </button>

            <button
              onClick={() => handleDownloadCSV(false)}
              className="px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4F8FC] font-bold text-xs border border-white/10 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#D7B875]" />
              <span>تصدير CSV</span>
            </button>

            <button
              onClick={() => setPrintModalMode('all')}
              className="px-3.5 py-2.5 rounded-xl bg-[#35D6C2]/15 hover:bg-[#35D6C2]/25 text-[#35D6C2] font-bold text-xs border border-[#35D6C2]/35 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة قائمة الطلاب</span>
            </button>

            <button
              onClick={() => setPrintModalMode('remaining')}
              className="px-3.5 py-2.5 rounded-xl bg-[#D7B875]/15 hover:bg-[#D7B875]/25 text-[#D7B875] font-bold text-xs border border-[#D7B875]/35 flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>طباعة قائمة المتبقيات</span>
            </button>

            {/* Super-Admin-Only Delete Entire Student List Button */}
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
                className="px-3.5 py-2.5 rounded-xl bg-[#E85D65]/15 hover:bg-[#E85D65]/25 disabled:opacity-40 text-[#E85D65] font-extrabold text-xs border border-[#E85D65]/40 flex items-center gap-1.5 transition-all"
                title="صلاحية حصرية للمدير الأعلى للنظام (Super Admin)"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف القائمة بالكامل</span>
              </button>
            ) : (
              <div
                className="px-3 py-2 rounded-xl bg-white/5 text-slate-400 text-[11px] border border-white/10 flex items-center gap-1.5"
                title="حذف قائمة الطلاب بالكامل متاح فقط للمدير الأعلى (Super Admin)"
              >
                <Lock className="w-3.5 h-3.5 text-[#D6B777]" />
                <span>حذف القائمة (Super Admin)</span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Financial Cards Grid (Live Database Statistics) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-[#35D6C2]/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#35D6C2]">
                عدد الطلاب الكلي (القائمة الرسمية)
              </span>
              <Users className="w-4 h-4 text-[#35D6C2]" />
            </div>
            <div className="text-2xl font-black text-[#F4F8FC] font-mono">
              {summaryStats.totalStudents} طالب/طالبة
            </div>
            <div className="text-[11px] text-slate-400 flex items-center justify-between">
              <span>4 شعب صباحي (61 لكل شعبة)</span>
              <span>مرتبط: {summaryStats.linkedCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#10151C]/90 border border-[#35D6C5]/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#A6F0DF]">
                عدد الذين دفعوا عربوناً / مكتمل
              </span>
              <FileSpreadsheet className="w-4 h-4 text-[#35D6C5]" />
            </div>
            <div className="text-xl font-black text-white font-mono">
              دفع عربون: {summaryStats.depositCount + summaryStats.partialCount}
            </div>
            <div className="text-[11px] text-[#A6F0DF] flex items-center justify-between">
              <span>مكتمل الدفع: {summaryStats.completedCount}</span>
              <span>لم يدفع: {summaryStats.unpaidCount}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#10151C]/90 border border-amber-500/35 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-300">
                سجلات تحتاج إلى مراجعة يدوية
              </span>
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-black text-amber-300 font-mono">
              {summaryStats.reviewCount} طالب مرشح
            </div>
            <div className="text-[11px] text-amber-200/80">
              مرتبطة بـ 7 دفعات قديمة غير محسومة تلقائياً
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#10151C]/90 border border-emerald-500/30 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-400">
                إجمالي المبالغ المستلمة المؤكدة
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {formatIQD(summaryStats.totalVerifiedPaidIQD)}
            </div>
            <div className="text-[11px] text-[#E8EEF2]/70 flex items-center justify-between">
              <span>من {summaryStats.depositCount + summaryStats.partialCount + summaryStats.completedCount} طالب مؤكد</span>
              <span>أرقام صحيحة</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-[#10151C]/90 border border-[#D6B777]/35 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#D6B777]">
                إجمالي المبالغ المتبقية
              </span>
              <Banknote className="w-4 h-4 text-[#D6B777]" />
            </div>
            <div className="text-2xl font-black text-[#D6B777] font-mono">
              {formatIQD(summaryStats.totalRemainingIQD)}
            </div>
            <div className="text-[11px] text-[#E8EEF2]/70">
              من أصل الكلي ({summaryStats.totalStudents} × 35,000): {formatIQD(summaryStats.totalFeeIQD)}
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
              placeholder="ابحث بالاسم الرباعي أو الشعبة أو رقم الطالب (ت: 1 - 244)..."
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
                <option value="unpaid" className="bg-[#0A0D12]">
                  غير مدفوع ({summaryStats.unpaidCount})
                </option>
                <option value="partial" className="bg-[#0A0D12]">
                  مدفوع جزئياً / عربون ({summaryStats.depositCount + summaryStats.partialCount})
                </option>
                <option value="deposit" className="bg-[#0A0D12]">
                  دافع عربون فقط ({summaryStats.depositCount})
                </option>
                <option value="completed" className="bg-[#0A0D12]">
                  مكتمل الدفع ({summaryStats.completedCount})
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
                  الترتيب: رقم الطالب (1 ← {activeStudents.length || 244})
                </option>
                <option value="number_desc" className="bg-[#0A0D12]">
                  الترتيب: رقم الطالب ({activeStudents.length || 244} ← 1)
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
                <option value={30} className="bg-[#0A0D12]">
                  30 طالب
                </option>
                <option value={65} className="bg-[#0A0D12]">
                  65 طالب (شعبة كاملة)
                </option>
                <option value={125} className="bg-[#0A0D12]">
                  125 طالب
                </option>
                <option value={250} className="bg-[#0A0D12]">
                  250 طالب (الكل)
                </option>
              </select>
            </div>
          </div>
        </div>

        {/* Section Filter Pills Bar (الشعب الدراسية الـ 4 - المرحلة الثانية صباحي) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold text-slate-400 ml-1">
              تصفية حسب الشعبة الدراسية:
            </span>
            {[
              { id: 'all', label: 'كل الشعب (المرحلة الثانية صباحي)', count: activeStudents.length },
              { id: 'شعبة 1', label: 'شعبة 1', count: summaryStats.section1Count },
              { id: 'شعبة 2', label: 'شعبة 2', count: summaryStats.section2Count },
              { id: 'شعبة 3', label: 'شعبة 3', count: summaryStats.section3Count },
              { id: 'شعبة 4', label: 'شعبة 4', count: summaryStats.section4Count },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  setSectionFilter(sec.id as any);
                  setCurrentPageIndex(1);
                }}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  sectionFilter === sec.id
                    ? 'bg-[#35D6C2] text-[#0A0D12] border-[#35D6C2] shadow-md'
                    : 'bg-[#0A0D12] text-slate-300 border-white/10 hover:border-[#35D6C2]/40'
                }`}
              >
                <span>{sec.label}</span>
                <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-black/20">
                  {sec.count}
                </span>
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-400 font-mono">
            المعروض حالياً: <strong className="text-[#35D6C2]">{filteredAndSortedStudents.length}</strong> طالب
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
          {/* DESKTOP TABLE VIEW (6 Official Columns + Account & Actions) */}
          <div className="hidden md:block rounded-3xl bg-[#101B2C] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#10151C] text-[#E8EEF2] border-b border-white/10">
                  <tr>
                    <th className="p-3.5 w-16 text-center font-black text-[#35D6C5]">
                      1. التسلسل
                    </th>
                    <th className="p-3.5">
                      2. الاسم الكامل كما ورد في القائمة الرسمية
                    </th>
                    <th className="p-3.5">
                      3. المبلغ المدفوع
                    </th>
                    <th className="p-3.5">
                      4. المبلغ المتبقي
                    </th>
                    <th className="p-3.5">
                      5. حالة الدفع
                    </th>
                    <th className="p-3.5">
                      6. ملاحظات المطابقة أو الدفع
                    </th>
                    <th className="p-3.5 text-center">الإجراءات المالية والإدارية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[#F4F8FC]">
                  {paginatedStudents.map((stu) => {
                    const stuValidPayments = studentPayments
                      .filter(
                        (p) =>
                          p.studentId === stu.id &&
                          p.verificationStatus !== 'voided'
                      )
                      .sort(
                        (a, b) =>
                          new Date(b.createdAt).getTime() -
                          new Date(a.createdAt).getTime()
                      );
                    const stuPaysCount = stuValidPayments.length;
                    const lastPaymentRecord = stuValidPayments[0] || null;
                    const unifiedStatusArabic = getUnifiedPaymentStatusArabic(stu);
                    const badgeStatusKey: PaymentStatus = stu.needsReview
                      ? 'needs_review'
                      : stu.paymentStatus;

                    const displayNotes = [
                      stu.reviewNote,
                      stu.notes,
                      lastPaymentRecord?.notes && lastPaymentRecord.notes !== stu.notes
                        ? lastPaymentRecord.notes
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' • ');

                    return (
                      <tr
                        key={stu.id}
                        className={`hover:bg-white/[0.04] transition-colors ${
                          stu.needsReview ? 'bg-amber-500/[0.05]' : ''
                        }`}
                      >
                        {/* 1. التسلسل */}
                        <td className="p-3.5 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-[#342A78]/60 border border-[#35D6C2]/30 text-[#35D6C2] font-mono font-black text-xs shadow-sm">
                            {stu.studentNumber}
                          </span>
                        </td>

                        {/* 2. الاسم الكامل كما ورد في القائمة الرسمية */}
                        <td className="p-3.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-black text-sm text-[#F4F8FC]">
                              {stu.fullName}
                            </span>
                            {stu.section && (
                              <span className="px-2 py-0.5 rounded-md bg-[#35D6C2]/15 text-[#35D6C2] border border-[#35D6C2]/30 text-[10px] font-bold">
                                {stu.section}
                                {stu.sectionStudentNumber
                                  ? ` (${stu.sectionStudentNumber})`
                                  : ''}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-slate-300 border border-white/10">
                              {stu.preferredTitle === 'nurse_f'
                                ? 'الممرضة'
                                : 'الممرض'}
                            </span>
                            {stu.isLinkedToAccount && (
                              <span
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold"
                                title={
                                  isSuperAdmin
                                    ? stu.linkedUserEmail || stu.linkedUserId
                                    : stu.linkedUserId
                                }
                              >
                                <UserCheck className="w-3 h-3" />
                                <span>حساب مرتبط</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>المبلغ الكامل: {formatIQD(stu.totalFeeIQD || 35000)}</span>
                            {stu.phone && <span>• هاتف: {stu.phone}</span>}
                          </div>
                        </td>

                        {/* 3. المبلغ المدفوع */}
                        <td className="p-3.5">
                          <div className="font-mono font-black text-emerald-400 text-sm">
                            {formatIQD(stu.verifiedPaidIQD)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {stuPaysCount > 0 ? `${stuPaysCount} دفعة مسجلة` : '0 د.ع'}
                            {stu.pendingPaidIQD > 0 && (
                              <span className="text-amber-300 mr-1">
                                (+{formatIQD(stu.pendingPaidIQD)} قيد التدقيق)
                              </span>
                            )}
                          </div>
                        </td>

                        {/* 4. المبلغ المتبقي */}
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
                            35,000 − {stu.verifiedPaidIQD.toLocaleString()} د.ع
                          </div>
                        </td>

                        {/* 5. حالة الدفع */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${getPaymentStatusBadgeClass(
                              badgeStatusKey
                            )}`}
                          >
                            {unifiedStatusArabic}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 font-mono">
                            {lastPaymentRecord
                              ? `آخر دفعة: ${lastPaymentRecord.date}`
                              : 'لا توجد دفعات'}
                          </div>
                        </td>

                        {/* 6. ملاحظات المطابقة أو الدفع */}
                        <td className="p-3.5 max-w-xs">
                          {stu.needsReview ? (
                            <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/35 space-y-2 text-[11px] text-amber-100">
                              <div className="flex items-start gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                                <span className="leading-relaxed">
                                  {stu.reviewNote || 'تحتاج إلى مراجعة مطابقة الاسم مع ملف الدفعات القديم'}
                                </span>
                              </div>
                              {canManageFinances && (
                                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                                  <button
                                    onClick={async () => {
                                      const res = await confirmStudentReviewDeposit(stu.id);
                                      setFeedbackBanner({
                                        type: res.success ? 'success' : 'error',
                                        text: res.message,
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[#0A0D12] font-extrabold text-[10px]"
                                  >
                                    اعتماد العربون ({(stu.pendingReviewAmountIQD || 2000).toLocaleString()} د.ع)
                                  </button>
                                  <button
                                    onClick={async () => {
                                      const res = await resolveStudentReviewFlag(
                                        stu.id,
                                        'تمت المراجعة: الطالب لم يدفع عربوناً'
                                      );
                                      setFeedbackBanner({
                                        type: res.success ? 'success' : 'error',
                                        text: res.message,
                                      });
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 font-bold text-[10px]"
                                  >
                                    لم يدفع (إلغاء الاشتباه)
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : displayNotes ? (
                            <div className="text-[11px] text-slate-300 leading-relaxed">
                              {displayNotes}
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-500">
                              {stu.verifiedPaidIQD > 0
                                ? 'مطابقة مؤكدة مع القائمة الرسمية'
                                : 'لا توجد ملاحظات دفع'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="p-3.5">
                          <div className="flex items-center justify-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                setPaymentModalStudentId(stu.id);
                                setEditingPaymentId(null);
                                setPayAmountInput(
                                  stu.remainingBalanceIQD > 0
                                    ? Math.min(5000, stu.remainingBalanceIQD)
                                    : 0
                                );
                                setPayDateInput(new Date().toISOString().split('T')[0]);
                                setPayModalFeedback(null);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-[#35D6C2]/15 hover:bg-[#35D6C2]/25 text-[#35D6C2] border border-[#35D6C2]/30 font-bold text-[11px] flex items-center gap-1"
                              title="إضافة دفعة جديدة أو تعديل الدفعات السابقة"
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
                                    setEditPaymentStatusManual(
                                      stu.needsReview ? 'needs_review' : stu.paymentStatus
                                    );
                                  }}
                                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10"
                                  title="تعديل بيانات الطالب أو تغيير حالة الدفع"
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
                                  title="أرشفة سجل الطالب"
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
              const stuValidPays = studentPayments
                .filter(
                  (p) =>
                    p.studentId === stu.id && p.verificationStatus !== 'voided'
                )
                .sort(
                  (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
                );
              const stuPaysCount = stuValidPays.length;
              const lastPay = stuValidPays[0] || null;
              const unifiedStatusArabic = getUnifiedPaymentStatusArabic(stu);
              const badgeStatusKey: PaymentStatus = stu.needsReview
                ? 'needs_review'
                : stu.paymentStatus;

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
                        <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                          {stu.section && (
                            <span className="px-1.5 py-0.2 rounded bg-[#35D6C2]/15 text-[#35D6C2] text-[10px] font-bold">
                              {stu.section}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-400 font-mono">
                            ID: {stu.id}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-lg text-[10px] font-bold ${getPaymentStatusBadgeClass(
                          badgeStatusKey
                        )}`}
                      >
                        {unifiedStatusArabic}
                      </span>
                      {lastPay && (
                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                          آخر دفعة: {lastPay.date}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center bg-[#10151C] p-2.5 rounded-xl border border-white/10 text-xs">
                    <div>
                      <span className="text-[10px] text-[#E8EEF2]/70 block">
                        المبلغ الكامل
                      </span>
                      <span className="font-mono font-bold text-slate-200">
                        {formatIQD(stu.totalFeeIQD || 35000)}
                      </span>
                    </div>
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

                  {(stu.needsReview || stu.reviewNote || stu.notes) && (
                    <div
                      className={`p-2.5 rounded-xl border text-[11px] space-y-2 ${
                        stu.needsReview
                          ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                          : 'bg-white/5 border-white/10 text-slate-300'
                      }`}
                    >
                      <div className="font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>ملاحظات المطابقة أو الدفع:</span>
                      </div>
                      <p>{stu.reviewNote || stu.notes}</p>
                      {stu.needsReview && canManageFinances && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <button
                            onClick={async () => {
                              const res = await confirmStudentReviewDeposit(stu.id);
                              setFeedbackBanner({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-[#0A0D12] font-extrabold text-[10px]"
                          >
                            اعتماد العربون ({(stu.pendingReviewAmountIQD || 2000).toLocaleString()} د.ع)
                          </button>
                          <button
                            onClick={async () => {
                              const res = await resolveStudentReviewFlag(
                                stu.id,
                                'تمت المراجعة: الطالب لم يدفع عربوناً'
                              );
                              setFeedbackBanner({
                                type: res.success ? 'success' : 'error',
                                text: res.message,
                              });
                            }}
                            className="px-2.5 py-1 rounded-lg bg-white/10 text-amber-200 font-bold text-[10px]"
                          >
                            لم يدفع (إلغاء الاشتباه)
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      onClick={() => {
                        setPaymentModalStudentId(stu.id);
                        setEditingPaymentId(null);
                        setPayAmountInput(
                          stu.remainingBalanceIQD > 0
                            ? Math.min(5000, stu.remainingBalanceIQD)
                            : 0
                        );
                        setPayDateInput(new Date().toISOString().split('T')[0]);
                        setPayModalFeedback(null);
                      }}
                      className="flex-1 py-2 px-3 rounded-xl bg-[#35D6C2]/15 text-[#35D6C2] border border-[#35D6C2]/30 font-bold text-xs flex items-center justify-center gap-1.5"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>الدفعات ({stuPaysCount})</span>
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
                            setEditPaymentStatusManual(
                              stu.needsReview ? 'needs_review' : stu.paymentStatus
                            );
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-[#35D6C2] font-bold mb-1">
                    تغيير حالة الدفع عند الحاجة:
                  </label>
                  <select
                    value={editPaymentStatusManual}
                    onChange={(e) =>
                      setEditPaymentStatusManual(e.target.value as PaymentStatus)
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#10151C] border border-[#35D6C2]/40 text-white font-bold"
                  >
                    <option value="unpaid">لم يدفع (0 د.ع)</option>
                    <option value="deposit">دفع عربون</option>
                    <option value="completed">مكتمل (35,000 د.ع)</option>
                    <option value="needs_review">تحتاج إلى مراجعة</option>
                  </select>
                </div>
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
                  ملاحظات المطابقة أو الدفع:
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

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      المبلغ المقبوض (د.ع): *
                    </label>
                    <input
                      type="number"
                      step={250}
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
                      تاريخ الدفعة: *
                    </label>
                    <input
                      type="date"
                      required
                      value={payDateInput}
                      onChange={(e) => setPayDateInput(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-white/10 text-white font-mono"
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
                      رقم الوصل (تلقائي):
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

            {/* Inline Edit Existing Payment Form (with Audit Log recording) */}
            {editingPaymentId && canManageFinances && (
              <form
                onSubmit={handleEditPaymentSubmit}
                className="p-4 rounded-2xl bg-[#10151C] border-2 border-[#D7B875]/50 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-black text-[#D7B875] flex items-center gap-1.5">
                    <Edit2 className="w-4 h-4" />
                    <span>تعديل بيانات الدفعة المسجلة (يُوثق في سجل التعديلات Audit Log)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setEditingPaymentId(null)}
                    className="text-slate-400 hover:text-white text-[11px]"
                  >
                    إلغاء التعديل
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      المبلغ المعدل (د.ع): *
                    </label>
                    <input
                      type="number"
                      step={250}
                      min={250}
                      max={35000}
                      required
                      value={editPayAmount}
                      onChange={(e) => setEditPayAmount(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/10 text-[#35D6C5] font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      تاريخ الدفعة: *
                    </label>
                    <input
                      type="date"
                      required
                      value={editPayDate}
                      onChange={(e) => setEditPayDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/10 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      طريقة الدفع:
                    </label>
                    <select
                      value={editPayMethod}
                      onChange={(e) => setEditPayMethod(e.target.value as PaymentMethod)}
                      className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/10 text-white"
                    >
                      <option value="cash">نقدي (كاش)</option>
                      <option value="bank_transfer">تحويل مالي</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    value={editPayNotes}
                    onChange={(e) => setEditPayNotes(e.target.value)}
                    placeholder="تحديث ملاحظة الدفعة..."
                    className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/10 text-white"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setEditingPaymentId(null)}
                      className="px-3.5 py-2 rounded-xl bg-white/10 text-white font-bold"
                    >
                      تراجع
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-[#D7B875] text-[#0A0D12] font-extrabold"
                    >
                      حفظ التعديل وتحديث الرصيد
                    </button>
                  </div>
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

                      <div className="flex items-center gap-1.5 self-end sm:self-center flex-wrap">
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
                                  onClick={() => {
                                    setEditingPaymentId(pay.id);
                                    setEditPayAmount(pay.amountIQD);
                                    setEditPayDate(pay.date);
                                    setEditPayMethod(pay.paymentMethod);
                                    setEditPayReceipt(pay.receiptNumber);
                                    setEditPayNotes(pay.notes || '');
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg bg-[#D7B875]/15 hover:bg-[#D7B875]/25 text-[#D7B875] border border-[#D7B875]/30 font-bold text-[11px] flex items-center gap-1"
                                  title="تعديل مبلغ أو تاريخ أو ملاحظة الدفعة"
                                >
                                  <Edit2 className="w-3 h-3" />
                                  <span>تعديل</span>
                                </button>

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

            {/* Option A: Re-verify / Import Official 244 Students */}
            <div className="p-4 rounded-2xl bg-[#0A0D12] border border-[#35D6C2]/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#35D6C2]">
                  1. القائمة الرسمية المعتمدة (244 طالب/طالبة — 4 شعب صباحي)
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                  آمن لإعادة المحاولة بدون تكرار (Idempotent)
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                يستورد ويدمج قائمة الـ 244 طالباً الرسمية بالأسماء الرباعية الكاملة (شعبة 1، شعبة 2، شعبة 3، شعبة 4 — 61 طالباً لكل شعبة) مع الحفاظ التام على جميع الدفعات الموثقة السابقة وربط الحسابات دون أي حذف أو تكرار.
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
                  : 'فحص واستيراد قائمة الـ 244 طالباً الرسمية الآن'}
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
                  <span>تقرير الاستيراد والتدقيق الرسمي:</span>
                </div>
                <ul className="space-y-1 text-slate-200">
                  <li>
                    • إجمالي الأسماء في الملف الرسمي:{' '}
                    <strong className="text-white font-mono">
                      {lastImportReport.sourceTotalCount ?? 244}
                    </strong>
                  </li>
                  <li>
                    • سجلات جديدة تمت إضافتها:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {lastImportReport.importedCount}
                    </strong>
                  </li>
                  <li>
                    • سجلات مطابقة لحسابات/دفعات موجودة مسبقاً:{' '}
                    <strong className="text-[#35D6C2] font-mono">
                      {lastImportReport.matchedExistingCount ?? 0}
                    </strong>
                  </li>
                  <li>
                    • سجلات مكررة تم تخطيها بأمان:{' '}
                    <strong className="text-[#D7B875] font-mono">
                      {lastImportReport.skippedDuplicatesCount}
                    </strong>
                  </li>
                  <li>
                    • سجلات تحتاج مراجعة يدوية:{' '}
                    <strong className="text-amber-300 font-mono">
                      {lastImportReport.flaggedForReviewCount}
                    </strong>
                  </li>
                  <li>
                    • إجمالي الطلبة النشطين في القائمة الآن:{' '}
                    <strong className="text-[#35D6C2] font-mono">
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

      {/* =================================================================== */}
      {/* MODAL 8: PRINTABLE FULL STUDENT LIST / REMAINING BALANCES LIST      */}
      {/* =================================================================== */}
      {printModalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-5xl rounded-3xl bg-white text-slate-900 p-5 sm:p-8 shadow-2xl space-y-4 text-right max-h-[94vh] overflow-y-auto">
            {/* Non-printed top toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4 print:hidden">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900">
                  {printModalMode === 'all'
                    ? `طباعة القائمة الرسمية الكاملة للطلاب (${activeStudents.length} طالب)`
                    : `طباعة قائمة المتبقيات المالية بذمة الطلاب (${
                        activeStudents.filter((s) => s.remainingBalanceIQD > 0).length
                      } طالب)`}
                </h3>
                <p className="text-xs text-slate-600">
                  معاينة جاهزة للطباعة المباشرة أو الحفظ كملف PDF عبر المتصفح
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setPrintModalMode(
                      printModalMode === 'all' ? 'remaining' : 'all'
                    )
                  }
                  className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs"
                >
                  {printModalMode === 'all'
                    ? 'التبديل إلى قائمة المتبقيات فقط'
                    : 'التبديل إلى القائمة الكاملة (244)'}
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الآن / حفظ PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPrintModalMode(null)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Header */}
            <div className="text-center border-b-2 border-slate-800 pb-4 space-y-1">
              <div className="text-sm font-black text-slate-700">
                {eventConfig.collegeName || 'تخرج طلاب معهد التمريض'} —{' '}
                {eventConfig.departmentName || 'دفعة 2027'} —{' '}
                {eventConfig.stageName || 'المرحلة الثانية'} ({eventConfig.studyType || 'صباحي'}) — العام الدراسي{' '}
                {eventConfig.academicYear || '2026–2027'}
              </div>
              <h2 className="text-lg font-black text-slate-900">
                {printModalMode === 'all'
                  ? 'قائمة الطلاب والمشاركين وسجل الدفعات — تخرج دفعة التمريض 2027'
                  : 'كشف المتبقيات المالية للطلاب — تخرج دفعة التمريض 2027'}
              </h2>
              <div className="text-xs text-slate-600">
                مكان الحفلة: {eventConfig.scrubVenue || 'مسرح تفاحة المصور'} • المصور:{' '}
                {eventConfig.scrubPhotographer || 'باقر حسن'} • التاريخ المقترح:{' '}
                {eventConfig.scrubPartyDateDisplay || '12/12/2026'} • مبلغ الحفلة الكامل للطالب: 35,000 د.ع
              </div>
            </div>

            {/* Printable Summary Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs bg-slate-100 p-3 rounded-xl border border-slate-300">
              <div>
                <span className="text-slate-600 block">عدد الطلاب الكلي</span>
                <strong className="font-mono text-sm text-slate-900">
                  {summaryStats.totalStudents} طالب
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block">دفع عربون / مكتمل</span>
                <strong className="font-mono text-sm text-emerald-700">
                  {summaryStats.depositCount + summaryStats.partialCount} عربون | {summaryStats.completedCount} مكتمل
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block">إجمالي المستلم المؤكد</span>
                <strong className="font-mono text-sm text-emerald-700">
                  {formatIQD(summaryStats.totalVerifiedPaidIQD)}
                </strong>
              </div>
              <div>
                <span className="text-slate-600 block">إجمالي المتبقي الكلي</span>
                <strong className="font-mono text-sm text-amber-800">
                  {formatIQD(summaryStats.totalRemainingIQD)}
                </strong>
              </div>
            </div>

            {/* Printable Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs border-collapse border border-slate-400">
                <thead>
                  <tr className="bg-slate-800 text-white">
                    <th className="p-2 border border-slate-400 text-center w-12">التسلسل</th>
                    <th className="p-2 border border-slate-400">الاسم الكامل كما ورد في القائمة الرسمية</th>
                    <th className="p-2 border border-slate-400 text-center">الشعبة</th>
                    <th className="p-2 border border-slate-400 text-center">المبلغ المدفوع</th>
                    <th className="p-2 border border-slate-400 text-center">المبلغ المتبقي</th>
                    <th className="p-2 border border-slate-400 text-center">حالة الدفع</th>
                    <th className="p-2 border border-slate-400">ملاحظات المطابقة أو الدفع</th>
                  </tr>
                </thead>
                <tbody>
                  {activeStudents
                    .filter((s) =>
                      printModalMode === 'remaining'
                        ? s.remainingBalanceIQD > 0
                        : true
                    )
                    .sort((a, b) => a.studentNumber - b.studentNumber)
                    .map((s) => {
                      const stText = getUnifiedPaymentStatusArabic(s);
                      return (
                        <tr key={s.id} className="border-b border-slate-300">
                          <td className="p-1.5 border border-slate-300 text-center font-mono font-bold">
                            {s.studentNumber}
                          </td>
                          <td className="p-1.5 border border-slate-300 font-bold">
                            {s.fullName}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center">
                            {s.section || '-'}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-emerald-700">
                            {s.verifiedPaidIQD.toLocaleString()} د.ع
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-mono font-bold text-amber-800">
                            {s.remainingBalanceIQD.toLocaleString()} د.ع
                          </td>
                          <td className="p-1.5 border border-slate-300 text-center font-bold">
                            {stText}
                          </td>
                          <td className="p-1.5 border border-slate-300 text-[11px]">
                            {s.reviewNote || s.notes || '-'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
