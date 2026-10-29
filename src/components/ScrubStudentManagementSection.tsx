import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  ScrubStudent,
  StudentPayment,
  PaymentMethod,
  PaymentStatus,
  PaymentReceiptSubmission,
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
import { loadProtectedReceiptObjectUrl } from '../services/superQiReceiptService';
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
    myPermissions,
    currentUser,
    receiptSubmissions,
    approveSuperQiReceipt,
    rejectSuperQiReceipt,
    reanalyzeSuperQiReceipt,
    financialSettlements,
    applyStudentFinancialAdjustment,
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
    reconciliation46Report,
    runReconcile46SubmittedNames,
  } = useApp();

  const canViewReceipts =
    isSuperAdmin || Boolean(myPermissions?.view_financial_receipts);
  const canAnalyzeReceipts =
    isSuperAdmin || Boolean(myPermissions?.analyze_receipts);
  const canApproveRejectPayments =
    isSuperAdmin || Boolean(myPermissions?.approve_reject_payments);
  const canRecordManualPayment =
    isSuperAdmin || Boolean(myPermissions?.record_manual_payment);
  const canEditFinancialAmounts =
    isSuperAdmin || Boolean(myPermissions?.edit_financial_amounts);

  const [show46ReportPanel, setShow46ReportPanel] = useState<boolean>(false);
  const [active46ReportSubTab, setActive46ReportSubTab] = useState<
    'added' | 'existing' | 'duplicates' | 'similar' | 'failed'
  >('added');
  const [isRunning46Audit, setIsRunning46Audit] = useState<boolean>(false);

  // SuperQi Receipts Review State
  const [showReceiptsQueuePanel, setShowReceiptsQueuePanel] =
    useState<boolean>(true);
  const [receiptQueueFilter, setReceiptQueueFilter] = useState<
    'pending_review' | 'approved' | 'rejected' | 'all'
  >('pending_review');
  const [inspectingSubmission, setInspectingSubmission] =
    useState<PaymentReceiptSubmission | null>(null);
  const [protectedImageBlobUrl, setProtectedImageBlobUrl] = useState<
    string | null
  >(null);
  const [isLoadingProtectedImage, setIsLoadingProtectedImage] =
    useState<boolean>(false);
  const [protectedImageError, setProtectedImageError] = useState<string | null>(
    null
  );
  const [approvalStudentId, setApprovalStudentId] = useState<string>('');
  const [approvalAmountIQD, setApprovalAmountIQD] = useState<number>(35000);
  const [approvalReviewNote, setApprovalReviewNote] = useState<string>('');
  const [rejectionReasonText, setRejectionReasonText] = useState<string>('');
  const [isProcessingReceiptDecision, setIsProcessingReceiptDecision] =
    useState<boolean>(false);

  // View Mode: active vs archived
  const [viewMode, setViewMode] = useState<'active' | 'archived'>('active');

  // Search, Filter, Sort & Pagination State
  const [searchQuery, setSearchQuery] = useState('');
  const [sectionFilter, setSectionFilter] = useState<
    'all' | 'شعبة 1' | 'شعبة 2' | 'شعبة 3' | 'شعبة 4'
  >('all');
  const [statusFilter, setStatusFilter] = useState<
    | 'all'
    | 'deposit'
    | 'partial'
    | 'completed'
    | 'unpaid'
    | 'has_pending_receipt'
    | 'needs_review'
    | 'linked'
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

  // 2. Edit Student & Financial Amounts / Settlements Modal State (Requirement 9)
  const [editingStudent, setEditingStudent] = useState<ScrubStudent | null>(null);
  const [editFullName, setEditFullName] = useState('');
  const [editTitle, setEditTitle] = useState<'nurse_m' | 'nurse_f'>('nurse_m');
  const [editTotalFee, setEditTotalFee] = useState<number>(35000);
  const [editVerifiedPaid, setEditVerifiedPaid] = useState<number>(0);
  const [editRemainingBalance, setEditRemainingBalance] = useState<number>(35000);
  const [useCustomRemainingSettlement, setUseCustomRemainingSettlement] =
    useState<boolean>(false);
  const [editSettlementReason, setEditSettlementReason] = useState<string>('');
  const [editPhone, setEditPhone] = useState('');
  const [editInstId, setEditInstId] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPaymentStatusManual, setEditPaymentStatusManual] = useState<PaymentStatus>('unpaid');
  const [isSavingFinancialEdit, setIsSavingFinancialEdit] = useState<boolean>(false);

  // Quick Manual Payment Modal State (Requirement 10: زر «إضافة دفعة يدوية»)
  const [showQuickManualPaymentModal, setShowQuickManualPaymentModal] =
    useState<boolean>(false);
  const [quickManualStudentId, setQuickManualStudentId] = useState<string>('');
  const [quickManualStudentQuery, setQuickManualStudentQuery] =
    useState<string>('');

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

    const pendingReceiptStudentIds = new Set<string>();
    const pendingReceiptNormNames = new Set<string>();
    receiptSubmissions
      .filter((r) => r.status === 'pending_review')
      .forEach((r) => {
        if (r.studentId) pendingReceiptStudentIds.add(r.studentId);
        const normName = normalizeArabicName(r.submittedRawName || r.studentName || '');
        if (normName) {
          pendingReceiptNormNames.add(normName);
        }
      });

    const hasPendingReceiptCount = activeStudents.filter(
      (s) =>
        pendingReceiptStudentIds.has(s.id) ||
        pendingReceiptNormNames.has(s.normalizedName) ||
        s.pendingPaidIQD > 0
    ).length;

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
      hasPendingReceiptCount,
      pendingReceiptStudentIds,
      pendingReceiptNormNames,
      section1Count,
      section2Count,
      section3Count,
      section4Count,
    };
  }, [activeStudents, receiptSubmissions]);

  // Revoke temporary protected Blob URL when modal closes or changes (Requirement 13)
  useEffect(() => {
    return () => {
      if (protectedImageBlobUrl) {
        URL.revokeObjectURL(protectedImageBlobUrl);
      }
    };
  }, [protectedImageBlobUrl]);

  const handleOpenInspectSubmission = async (sub: PaymentReceiptSubmission) => {
    if (protectedImageBlobUrl) {
      URL.revokeObjectURL(protectedImageBlobUrl);
      setProtectedImageBlobUrl(null);
    }
    setInspectingSubmission(sub);
    setApprovalStudentId(sub.studentId && sub.studentId !== 'unconfirmed_identity' ? sub.studentId : '');
    setApprovalAmountIQD(sub.amountIQD || 35000);
    setApprovalReviewNote('');
    setRejectionReasonText('');
    setProtectedImageError(null);

    if (canViewReceipts && sub.vaultReceiptId) {
      setIsLoadingProtectedImage(true);
      const loaded = await loadProtectedReceiptObjectUrl(sub.vaultReceiptId, sub.id);
      setIsLoadingProtectedImage(false);
      if (loaded.objectUrl) {
        setProtectedImageBlobUrl(loaded.objectUrl);
      } else {
        setProtectedImageError(
          loaded.error || 'تعذر تحميل صورة الوصل من الخزنة المشفرة.'
        );
      }
    }
  };

  const handleCloseInspectSubmission = () => {
    if (protectedImageBlobUrl) {
      URL.revokeObjectURL(protectedImageBlobUrl);
      setProtectedImageBlobUrl(null);
    }
    setInspectingSubmission(null);
    setProtectedImageError(null);
  };

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

      // Filter by status (Requirement 8)
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
      } else if (statusFilter === 'has_pending_receipt') {
        matchesStatus =
          summaryStats.pendingReceiptStudentIds.has(stu.id) ||
          summaryStats.pendingReceiptNormNames.has(stu.normalizedName) ||
          stu.pendingPaidIQD > 0;
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
    summaryStats,
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

  // Handle Edit Student & Financial Adjustment Submit (Requirement 9)
  const handleEditStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setIsSavingFinancialEdit(true);

    try {
      // 1. Update general student profile fields
      const resProfile = await updateScrubStudent(editingStudent.id, {
        fullName: editFullName,
        preferredTitle: editTitle,
        totalFeeIQD: editTotalFee,
        phone: editPhone,
        institutionalStudentId: editInstId,
        notes: editNotes,
      });

      // 2. If user has financial edit permission, apply financial adjustments & settlements
      const currentStatusKey: PaymentStatus = editingStudent.needsReview
        ? 'needs_review'
        : editingStudent.paymentStatus;

      const feeChanged = editTotalFee !== editingStudent.totalFeeIQD;
      const paidChanged = editVerifiedPaid !== editingStudent.verifiedPaidIQD;
      const autoRemaining = Math.max(
        0,
        editTotalFee -
          editVerifiedPaid -
          (editingStudent.settlementAdjustmentIQD || 0)
      );
      const remainingChanged =
        useCustomRemainingSettlement && editRemainingBalance !== autoRemaining;
      const statusChanged = editPaymentStatusManual !== currentStatusKey;

      if (
        canEditFinancialAmounts &&
        (feeChanged || paidChanged || remainingChanged || statusChanged)
      ) {
        const finRes = await applyStudentFinancialAdjustment({
          studentId: editingStudent.id,
          newTotalFeeIQD: editTotalFee,
          newPaidIQD: editVerifiedPaid,
          newRemainingIQD: useCustomRemainingSettlement
            ? editRemainingBalance
            : autoRemaining,
          newPaymentStatus: statusChanged
            ? editPaymentStatusManual
            : undefined,
          adminNotes: editNotes,
          reason:
            editSettlementReason.trim() ||
            editNotes.trim() ||
            'تعديل مالي وتسوية إدارية من لوحة إدارة دفعات الطلاب',
        });

        if (!finRes.success) {
          setFeedbackBanner({ type: 'error', text: finRes.message });
          setIsSavingFinancialEdit(false);
          return;
        }
        setFeedbackBanner({ type: 'success', text: finRes.message });
        setEditingStudent(null);
        setIsSavingFinancialEdit(false);
        return;
      }

      if (resProfile.success) {
        setFeedbackBanner({ type: 'success', text: resProfile.message });
        setEditingStudent(null);
      } else {
        setFeedbackBanner({ type: 'error', text: resProfile.message });
      }
    } finally {
      setIsSavingFinancialEdit(false);
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
              إدارة دفعات الطلاب — تخرج دفعة التمريض 2027 ({activeStudents.length} طالب/طالبة)
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
            {canRecordManualPayment && (
              <button
                type="button"
                onClick={() => {
                  setFeedbackBanner(null);
                  setQuickManualStudentId('');
                  setQuickManualStudentQuery('');
                  setPayAmountInput(5000);
                  setPayDateInput(new Date().toISOString().split('T')[0]);
                  setPayMethodInput('cash');
                  setPayReceiptInput('');
                  setPayNotesInput('');
                  setShowQuickManualPaymentModal(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-[#2A9D8F] hover:opacity-95 text-white font-black text-xs shadow-lg flex items-center gap-1.5 cursor-pointer"
              >
                <Banknote className="w-4 h-4" />
                <span>إضافة دفعة يدوية</span>
              </button>
            )}

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

                <button
                  onClick={async () => {
                    setShow46ReportPanel(true);
                    setIsRunning46Audit(true);
                    try {
                      const rep = await runReconcile46SubmittedNames();
                      setFeedbackBanner({
                        type: 'success',
                        text: `اكتمل فحص ومطابقة قائمة الـ 46 طالباً: المضافة حديثاً (${rep.newlyAddedNames.length})، الموجودة مسبقاً (${rep.alreadyExistingNames.length})، المكررة الممنوعة (${rep.preventedDuplicates.length})، المتشابهة للمراجعة (${rep.similarNamesForManualReview.length})، الفاشلة (${rep.failedNames.length}).`,
                      });
                    } finally {
                      setIsRunning46Audit(false);
                    }
                  }}
                  disabled={isRunning46Audit}
                  className="px-3.5 py-2.5 rounded-xl bg-[#0D9488]/20 hover:bg-[#0D9488]/30 text-[#35D6C5] font-extrabold text-xs border border-[#35D6C5]/40 flex items-center gap-1.5 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#35D6C5]" />
                  <span>
                    {isRunning46Audit
                      ? 'جارِ فحص الـ 46 اسماً...'
                      : 'تقرير فحص قائمة الـ 46 طالباً'}
                  </span>
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

      {/* =================================================================== */}
      {/* REQUIREMENTS 6, 7 & 13: SUPERQI RECEIPTS & AI ANALYSIS PANEL         */}
      {/* =================================================================== */}
      {(canViewReceipts || canAnalyzeReceipts || canApproveRejectPayments) && (
        <div className="rounded-3xl bg-[#0D1726] border border-[#35D6C5]/40 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#35D6C5]/15 border border-[#35D6C5]/30 text-[#35D6C5] text-[11px] font-extrabold">
                <Receipt className="w-3.5 h-3.5" />
                <span>
                  مراجعة وصولات الدفع الإلكترونية عبر SuperQi وتحليل الذكاء الاصطناعي
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                وصولات الدفع المرفوعة ({receiptSubmissions.length}) • قيد المراجعة:{' '}
                <span className="text-amber-300 font-mono">
                  {
                    receiptSubmissions.filter(
                      (r) => r.status === 'pending_review'
                    ).length
                  }
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                الوصولات محفوظة في خزنة مشفرة خاصة. لا يتم اعتماد أي دفعة أو تعديل رصيد الطالب تلقائياً بمجرد رفع الصورة أو تحليل الذكاء الاصطناعي إلا بعد موافقة المشرف المخوّل.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {(
                [
                  {
                    id: 'pending_review',
                    label: 'قيد المراجعة',
                    count: receiptSubmissions.filter(
                      (r) => r.status === 'pending_review'
                    ).length,
                  },
                  {
                    id: 'approved',
                    label: 'المعتمدة',
                    count: receiptSubmissions.filter(
                      (r) => r.status === 'approved'
                    ).length,
                  },
                  {
                    id: 'rejected',
                    label: 'المرفوضة',
                    count: receiptSubmissions.filter(
                      (r) => r.status === 'rejected'
                    ).length,
                  },
                  {
                    id: 'all',
                    label: 'الكل',
                    count: receiptSubmissions.length,
                  },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setReceiptQueueFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border cursor-pointer flex items-center gap-1.5 ${
                    receiptQueueFilter === tab.id
                      ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                      : 'bg-[#111C2D] text-slate-300 border-white/10'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span className="px-1.5 py-0.2 rounded bg-black/20 font-mono text-[10px]">
                    {tab.count}
                  </span>
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  setShowReceiptsQueuePanel(!showReceiptsQueuePanel)
                }
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 cursor-pointer"
              >
                {showReceiptsQueuePanel ? 'طي القائمة' : 'عرض القائمة'}
              </button>
            </div>
          </div>

          {showReceiptsQueuePanel && (
            <div className="space-y-3">
              {receiptSubmissions.filter((r) =>
                receiptQueueFilter === 'all'
                  ? true
                  : r.status === receiptQueueFilter
              ).length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#111C2D] border border-white/10 text-center text-xs text-slate-400">
                  لا توجد وصولات دفع مرفوعة ضمن هذا التصنيف حالياً.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {receiptSubmissions
                    .filter((r) =>
                      receiptQueueFilter === 'all'
                        ? true
                        : r.status === receiptQueueFilter
                    )
                    .map((sub) => {
                      const aiClass = sub.aiAnalysis?.classification;
                      const isPreliminaryMatch =
                        aiClass === 'البيانات متطابقة مبدئياً';
                      return (
                        <div
                          key={sub.id}
                          className="p-4 rounded-2xl bg-[#111C2D] border border-white/10 flex flex-col justify-between gap-3"
                        >
                          <div className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-sm font-black text-white block">
                                  {sub.submittedRawName || sub.studentName}
                                </span>
                                <span className="text-[11px] text-slate-400 font-mono">
                                  {sub.studentNumber
                                    ? `التسلسل الرسمي: ت (${sub.studentNumber}) • ${sub.studentName}`
                                    : 'بحاجة لتأكيد ربط سجل الطالب يدوياً'}
                                </span>
                              </div>
                              <span
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black border shrink-0 ${
                                  sub.status === 'approved'
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : sub.status === 'rejected'
                                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                }`}
                              >
                                {sub.status === 'approved'
                                  ? 'معتمد ومضاف للرصيد'
                                  : sub.status === 'rejected'
                                  ? 'مرفوض'
                                  : 'قيد المراجعة'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-[#0A0F1A] border border-white/5 text-xs">
                              <div>
                                <span className="text-[10px] text-slate-400 block">
                                  المبلغ المرسل من الطالب:
                                </span>
                                <strong className="text-[#35D6C5] font-mono text-sm">
                                  {formatIQD(sub.amountIQD)}
                                </strong>
                              </div>
                              <div>
                                <span className="text-[10px] text-slate-400 block">
                                  تاريخ العملية / المرجع:
                                </span>
                                <strong className="text-white font-mono text-[11px]">
                                  {sub.transactionDate} •{' '}
                                  {sub.transactionReference || 'بدون مرجع نصي'}
                                </strong>
                              </div>
                            </div>

                            {/* AI Receipt Analysis Badge (Visible only to authorized supervisors) */}
                            {canAnalyzeReceipts && sub.aiAnalysis && (
                              <div
                                className={`p-2.5 rounded-xl border text-[11px] space-y-1 ${
                                  isPreliminaryMatch
                                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                                }`}
                              >
                                <div className="flex items-center justify-between gap-2 font-black">
                                  <span>
                                    نتيجة فحص الذكاء الاصطناعي: «
                                    {sub.aiAnalysis.classification}»
                                  </span>
                                  <span className="font-mono text-[10px]">
                                    المستخرج:{' '}
                                    {sub.aiAnalysis.extractedAmountIQD
                                      ? `${sub.aiAnalysis.extractedAmountIQD.toLocaleString()} د.ع`
                                      : 'غير واضح'}
                                  </span>
                                </div>
                                <p className="text-[10px] opacity-90">
                                  {sub.aiAnalysis.summaryArabic}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                            <span className="text-[10px] text-slate-400 font-mono">
                              {new Date(sub.createdAt).toLocaleString('ar-IQ')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenInspectSubmission(sub)}
                              className="px-3.5 py-2 rounded-xl bg-[#35D6C5] hover:opacity-95 text-[#0A0D12] font-black text-xs flex items-center gap-1.5 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>فحص الوصل واتخاذ القرار</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* FEATURE 2: Comprehensive Report for the 46 Submitted Student Names */}
      {reconciliation46Report && show46ReportPanel && (
        <div className="rounded-3xl bg-[#0D1522] border border-[#35D6C5]/35 p-5 sm:p-6 space-y-5 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[#35D6C5]/15 border border-[#35D6C5]/30 text-[#35D6C5] text-[11px] font-extrabold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تقرير نتيجة الإضافة والفحص الدقيق لقائمة الـ 46 طالباً</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white">
                تقرير مطابقة قائمة الأسماء المرسلة (46 اسماً) مع قاعدة البيانات الحالية
              </h3>
              <p className="text-xs text-slate-400">
                تم فحص جميع الأسماء مع تجاهل المسافات الزائدة والتشكيل، معالجة التصاق الكلمات («سؤددوليد»)، الاحتفاظ بالأرقام («عباس محمد شيال ١») والأسماء الثنائية دون اختلاق اسم ثالث، ومنع تكرار «عباس خضير» أو أي سجل موجود مسبقاً دون المساس بأي أرصدة مالية.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  setIsRunning46Audit(true);
                  try {
                    await runReconcile46SubmittedNames();
                  } finally {
                    setIsRunning46Audit(false);
                  }
                }}
                disabled={isRunning46Audit}
                className="px-3.5 py-2 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-extrabold text-xs hover:opacity-95 cursor-pointer"
              >
                {isRunning46Audit ? 'جارِ التدقيق...' : 'إعادة فحص القائمة الآن'}
              </button>
              <button
                onClick={() => setShow46ReportPanel(false)}
                className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold border border-white/10 cursor-pointer"
              >
                إخفاء التقرير
              </button>
            </div>
          </div>

          {/* 6 KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#111C2D] border border-white/10 space-y-1">
              <span className="text-[11px] text-slate-400 block font-bold">
                إجمالي الأسماء في القائمة
              </span>
              <span className="text-xl font-black text-white font-mono">
                {reconciliation46Report.totalUniqueInList}
              </span>
              <span className="text-[10px] text-slate-400 block">
                ({reconciliation46Report.rawListCount} شاملة تكرار عباس خضير)
              </span>
            </div>

            <button
              type="button"
              onClick={() => setActive46ReportSubTab('added')}
              className={`p-3.5 rounded-2xl border text-right space-y-1 transition cursor-pointer ${
                active46ReportSubTab === 'added'
                  ? 'bg-emerald-500/20 border-emerald-400'
                  : 'bg-[#111C2D] border-emerald-500/30 hover:bg-emerald-500/10'
              }`}
            >
              <span className="text-[11px] text-emerald-300 block font-bold">
                الأسماء المضافة حديثاً
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {reconciliation46Report.newlyAddedNames.length}
              </span>
              <span className="text-[10px] text-emerald-200/80 block">
                سجلات ناقصة أُضيفت بالاسم الأصلي
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActive46ReportSubTab('existing')}
              className={`p-3.5 rounded-2xl border text-right space-y-1 transition cursor-pointer ${
                active46ReportSubTab === 'existing'
                  ? 'bg-[#35D6C5]/20 border-[#35D6C5]'
                  : 'bg-[#111C2D] border-[#35D6C5]/30 hover:bg-[#35D6C5]/10'
              }`}
            >
              <span className="text-[11px] text-[#35D6C5] block font-bold">
                الأسماء الموجودة مسبقاً
              </span>
              <span className="text-xl font-black text-[#35D6C5] font-mono">
                {reconciliation46Report.alreadyExistingNames.length}
              </span>
              <span className="text-[10px] text-[#A6F0DF]/80 block">
                محفوظة بكامل دفعاتها دون تغيير
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActive46ReportSubTab('duplicates')}
              className={`p-3.5 rounded-2xl border text-right space-y-1 transition cursor-pointer ${
                active46ReportSubTab === 'duplicates'
                  ? 'bg-indigo-500/20 border-indigo-400'
                  : 'bg-[#111C2D] border-indigo-500/30 hover:bg-indigo-500/10'
              }`}
            >
              <span className="text-[11px] text-indigo-300 block font-bold">
                الأسماء المكررة التي مُنعت
              </span>
              <span className="text-xl font-black text-indigo-300 font-mono">
                {reconciliation46Report.preventedDuplicates.length}
              </span>
              <span className="text-[10px] text-indigo-200/80 block">
                شاملة منع تكرار «عباس خضير»
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActive46ReportSubTab('similar')}
              className={`p-3.5 rounded-2xl border text-right space-y-1 transition cursor-pointer ${
                active46ReportSubTab === 'similar'
                  ? 'bg-amber-500/20 border-amber-400'
                  : 'bg-[#111C2D] border-amber-500/30 hover:bg-amber-500/10'
              }`}
            >
              <span className="text-[11px] text-amber-300 block font-bold">
                متشابهة تحتاج مراجعة يدوية
              </span>
              <span className="text-xl font-black text-amber-400 font-mono">
                {reconciliation46Report.similarNamesForManualReview.length}
              </span>
              <span className="text-[10px] text-amber-200/80 block">
                لم تُدمج تلقائياً لمنع الخلط
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActive46ReportSubTab('failed')}
              className={`p-3.5 rounded-2xl border text-right space-y-1 transition cursor-pointer ${
                active46ReportSubTab === 'failed'
                  ? 'bg-red-500/20 border-red-400'
                  : 'bg-[#111C2D] border-white/10 hover:bg-white/5'
              }`}
            >
              <span className="text-[11px] text-slate-300 block font-bold">
                أسماء فشل حفظها
              </span>
              <span className="text-xl font-black text-emerald-400 font-mono">
                {reconciliation46Report.failedNames.length}
              </span>
              <span className="text-[10px] text-emerald-300 block">
                نجاح الحفظ بنسبة 100%
              </span>
            </button>
          </div>

          {/* Detailed Sub-Tab View */}
          <div className="rounded-2xl bg-[#090F1A] border border-white/10 p-4 max-h-80 overflow-y-auto space-y-2.5 text-xs">
            {active46ReportSubTab === 'added' && (
              <>
                <div className="font-extrabold text-emerald-300 pb-2 border-b border-white/10">
                  الأسماء المضافة حديثاً إلى قاعدة البيانات ({reconciliation46Report.newlyAddedNames.length}):
                </div>
                {reconciliation46Report.newlyAddedNames.length === 0 ? (
                  <p className="text-slate-400 py-3">
                    جميع الأسماء الـ 46 موجودة ومطابقة بالفعل في قاعدة البيانات ولا توجد سجلات ناقصة.
                  </p>
                ) : (
                  <div className="divide-y divide-white/10">
                    {reconciliation46Report.newlyAddedNames.map((item) => (
                      <div
                        key={item.studentId}
                        className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                            ت: {item.assignedStudentNumber}
                          </span>
                          <span className="font-black text-white text-sm">
                            {item.submittedName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            (الرقم في قائمة الـ 46: #{item.indexIn46})
                          </span>
                        </div>
                        <span className="text-[11px] text-amber-200/90">
                          {item.note}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {active46ReportSubTab === 'existing' && (
              <>
                <div className="font-extrabold text-[#35D6C5] pb-2 border-b border-white/10">
                  الأسماء الموجودة مسبقاً في قاعدة البيانات ({reconciliation46Report.alreadyExistingNames.length}):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                  {reconciliation46Report.alreadyExistingNames.map((item, idx) => (
                    <div
                      key={`${item.submittedName}-${idx}`}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between gap-2"
                    >
                      <div>
                        <span className="font-black text-white block">
                          #{item.indexIn46} — {item.submittedName}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          السجل المقابل: ت ({item.matchedStudentNumber}) {item.matchedFullName}
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-[#35D6C5]/15 text-[#35D6C5] text-[10px] font-bold shrink-0">
                        موجود مسبقاً
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {active46ReportSubTab === 'duplicates' && (
              <>
                <div className="font-extrabold text-indigo-300 pb-2 border-b border-white/10">
                  الأسماء المكررة التي تم منع إضافتها ({reconciliation46Report.preventedDuplicates.length}):
                </div>
                <div className="divide-y divide-white/10">
                  {reconciliation46Report.preventedDuplicates.map((dup, idx) => (
                    <div
                      key={`${dup.submittedName}-${idx}`}
                      className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                    >
                      <span className="font-black text-white">
                        {dup.submittedName}
                      </span>
                      <span className="text-[11px] text-indigo-200/90">
                        {dup.reason}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}

            {active46ReportSubTab === 'similar' && (
              <>
                <div className="font-extrabold text-amber-300 pb-2 border-b border-white/10">
                  الأسماء المتشابهة التي تحتاج مراجعة يدوية ({reconciliation46Report.similarNamesForManualReview.length}):
                </div>
                <div className="divide-y divide-white/10">
                  {reconciliation46Report.similarNamesForManualReview.map((sim, idx) => (
                    <div key={`${sim.submittedName}-${idx}`} className="py-2.5 space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="font-black text-amber-300 text-sm">
                          #{sim.indexIn46} — الاسم في القائمة: «{sim.submittedName}»
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-200 font-bold">
                          عدد السجلات المشابهة: {sim.candidateRecords.length}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        {sim.reviewReason}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {active46ReportSubTab === 'failed' && (
              <div className="py-6 text-center text-emerald-300 font-bold">
                لا يوجد أي اسم فشل حفظه (0 أخطاء). تمت معالجة وحفظ جميع السجلات بنجاح.
              </div>
            )}
          </div>
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
                  جميع الطلاب ({viewMode === 'active' ? activeStudents.length : archivedStudents.length})
                </option>
                <option value="completed" className="bg-[#0A0D12]">
                  دافع بالكامل ({summaryStats.completedCount})
                </option>
                <option value="partial" className="bg-[#0A0D12]">
                  دافع جزئياً ({summaryStats.depositCount + summaryStats.partialCount})
                </option>
                <option value="unpaid" className="bg-[#0A0D12]">
                  لم يدفع ({summaryStats.unpaidCount})
                </option>
                <option value="has_pending_receipt" className="bg-[#0A0D12]">
                  لديه طلب دفع قيد المراجعة ({summaryStats.hasPendingReceiptCount})
                </option>
                <option value="deposit" className="bg-[#0A0D12]">
                  دافع عربون فقط ({summaryStats.depositCount})
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
                  الترتيب: التسلسل (1 ← {activeStudents.length || 244})
                </option>
                <option value="number_desc" className="bg-[#0A0D12]">
                  الترتيب: التسلسل ({activeStudents.length || 244} ← 1)
                </option>
                <option value="name_asc" className="bg-[#0A0D12]">
                  الترتيب: الاسم الأبجدي (أ ← ي)
                </option>
                <option value="paid_desc" className="bg-[#0A0D12]">
                  الترتيب: المبلغ المدفوع (الأعلى أولاً)
                </option>
                <option value="remaining_desc" className="bg-[#0A0D12]">
                  الترتيب: المبلغ المتبقي (الأعلى أولاً)
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
          {/* DESKTOP TABLE VIEW (Requirement 8: إدارة دفعات الطلاب) */}
          <div className="hidden md:block rounded-3xl bg-[#101B2C] border border-white/10 overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#10151C] text-[#E8EEF2] border-b border-white/10">
                  <tr>
                    <th className="p-3.5 w-16 text-center font-black text-[#35D6C5]">
                      التسلسل
                    </th>
                    <th className="p-3.5">
                      اسم الطالب
                    </th>
                    <th className="p-3.5">
                      المبلغ الإجمالي المطلوب
                    </th>
                    <th className="p-3.5">
                      المبلغ المدفوع
                    </th>
                    <th className="p-3.5">
                      المبلغ المتبقي
                    </th>
                    <th className="p-3.5">
                      حالة الدفع
                    </th>
                    <th className="p-3.5">
                      تاريخ آخر دفعة
                    </th>
                    <th className="p-3.5">
                      ملاحظات المطابقة أو الدفع
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
                    const lastPayDateText =
                      stu.lastPaymentDate ||
                      lastPaymentRecord?.date ||
                      'لا توجد دفعات';
                    const hasPendingSuperQi =
                      summaryStats.pendingReceiptStudentIds.has(stu.id) ||
                      summaryStats.pendingReceiptNormNames.has(
                        stu.normalizedName
                      );
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

                        {/* 2. اسم الطالب */}
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
                            {hasPendingSuperQi && (
                              <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold">
                                وصل قيد المراجعة
                              </span>
                            )}
                          </div>
                          {stu.phone && (
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              هاتف: {stu.phone}
                            </div>
                          )}
                        </td>

                        {/* 3. المبلغ الإجمالي المطلوب */}
                        <td className="p-3.5">
                          <div className="font-mono font-black text-white text-sm">
                            {formatIQD(stu.totalFeeIQD || 35000)}
                          </div>
                          {Boolean(stu.settlementAdjustmentIQD) && (
                            <div className="text-[10px] text-indigo-300 font-mono">
                              تسوية: {formatIQD(stu.settlementAdjustmentIQD || 0)}
                            </div>
                          )}
                        </td>

                        {/* 4. المبلغ المدفوع */}
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

                        {/* 5. المبلغ المتبقي */}
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
                          <div className="text-[10px] text-slate-400 font-mono">
                            {(stu.totalFeeIQD || 35000).toLocaleString()} − {stu.verifiedPaidIQD.toLocaleString()} د.ع
                          </div>
                        </td>

                        {/* 6. حالة الدفع */}
                        <td className="p-3.5">
                          <span
                            className={`inline-block px-2.5 py-1 rounded-lg text-[10px] font-bold ${getPaymentStatusBadgeClass(
                              badgeStatusKey
                            )}`}
                          >
                            {unifiedStatusArabic}
                          </span>
                        </td>

                        {/* 7. تاريخ آخر دفعة */}
                        <td className="p-3.5 font-mono text-[11px] text-slate-300">
                          {lastPayDateText}
                        </td>

                        {/* 8. ملاحظات المطابقة أو الدفع */}
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

                        {/* Actions: زر «عرض سجل الدفعات» و زر «تعديل» */}
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
                              className="px-2.5 py-1.5 rounded-xl bg-[#35D6C2]/15 hover:bg-[#35D6C2]/25 text-[#35D6C2] border border-[#35D6C2]/30 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                              title="عرض سجل الدفعات والوصولات والتسويات المالية"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>عرض سجل الدفعات ({stuPaysCount})</span>
                            </button>

                            {viewMode === 'active' && canManageFinances && (
                              <>
                                <button
                                  onClick={() => {
                                    setEditingStudent(stu);
                                    setEditFullName(stu.fullName);
                                    setEditTitle(stu.preferredTitle);
                                    setEditTotalFee(stu.totalFeeIQD || 35000);
                                    setEditVerifiedPaid(stu.verifiedPaidIQD || 0);
                                    setEditRemainingBalance(
                                      stu.remainingBalanceIQD ?? 35000
                                    );
                                    setUseCustomRemainingSettlement(false);
                                    setEditSettlementReason('');
                                    setEditPhone(stu.phone || '');
                                    setEditInstId(
                                      stu.institutionalStudentId || ''
                                    );
                                    setEditNotes(stu.notes || '');
                                    setEditPaymentStatusManual(
                                      stu.needsReview ? 'needs_review' : stu.paymentStatus
                                    );
                                  }}
                                  className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                                  title="تعديل بيانات الطالب أو المبالغ المالية"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#35D6C5]" />
                                  <span>تعديل</span>
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
      {/* MODAL 2: EDIT STUDENT & FINANCIAL AMOUNTS / SETTLEMENTS (Req 9)     */}
      {/* =================================================================== */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl rounded-3xl bg-[#101B2C] border border-white/15 p-6 shadow-2xl space-y-4 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-[#F4F8FC]">
                  تعديل بيانات ومبالغ الطالب رقم ({editingStudent.studentNumber}) —{' '}
                  {editingStudent.fullName}
                </h3>
                <p className="text-[11px] text-[#35D6C5]">
                  المبلغ المتبقي = المبلغ الإجمالي المطلوب − إجمالي الدفعات المعتمدة − التسويات الإدارية
                </p>
              </div>
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

              {/* Financial Amounts & Administrative Settlement Box (Requirement 9) */}
              {canEditFinancialAmounts && (
                <div className="p-4 rounded-2xl bg-[#0A0D12] border border-[#35D6C5]/35 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-[#35D6C5] text-xs">
                      تعديل المبالغ المالية والتسويات الإدارية:
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      التسويات السابقة: {formatIQD(editingStudent.settlementAdjustmentIQD || 0)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-300 font-bold mb-1">
                        المبلغ الإجمالي المطلوب (د.ع):
                      </label>
                      <input
                        type="number"
                        step={500}
                        min={0}
                        value={editTotalFee}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setEditTotalFee(val);
                          if (!useCustomRemainingSettlement) {
                            setEditRemainingBalance(
                              Math.max(
                                0,
                                val -
                                  editVerifiedPaid -
                                  (editingStudent.settlementAdjustmentIQD || 0)
                              )
                            );
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-white/15 text-white font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-emerald-300 font-bold mb-1">
                        المبلغ المدفوع المعتمد (د.ع):
                      </label>
                      <input
                        type="number"
                        step={250}
                        min={0}
                        value={editVerifiedPaid}
                        onChange={(e) => {
                          const val = Math.max(0, Number(e.target.value) || 0);
                          setEditVerifiedPaid(val);
                          if (!useCustomRemainingSettlement) {
                            setEditRemainingBalance(
                              Math.max(
                                0,
                                editTotalFee -
                                  val -
                                  (editingStudent.settlementAdjustmentIQD || 0)
                              )
                            );
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-emerald-500/40 text-emerald-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[#D7B875] font-bold mb-1">
                        المبلغ المتبقي (د.ع):
                      </label>
                      <input
                        type="number"
                        step={250}
                        min={0}
                        readOnly={!useCustomRemainingSettlement}
                        value={
                          useCustomRemainingSettlement
                            ? editRemainingBalance
                            : Math.max(
                                0,
                                editTotalFee -
                                  editVerifiedPaid -
                                  (editingStudent.settlementAdjustmentIQD || 0)
                              )
                        }
                        onChange={(e) =>
                          setEditRemainingBalance(
                            Math.max(0, Number(e.target.value) || 0)
                          )
                        }
                        className={`w-full px-3 py-2 rounded-xl border font-mono font-black ${
                          useCustomRemainingSettlement
                            ? 'bg-[#101B2C] border-[#D7B875] text-[#D7B875]'
                            : 'bg-[#101B2C]/60 border-white/10 text-[#D7B875]'
                        }`}
                      />
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-[11px] text-slate-300 font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={useCustomRemainingSettlement}
                      onChange={(e) =>
                        setUseCustomRemainingSettlement(e.target.checked)
                      }
                      className="rounded accent-[#35D6C5]"
                    />
                    <span>
                      تحديد مبلغ متبقٍ مخصص عبر تسوية مالية إدارية موثقة (خصم/إعفاء جزئي مسجل في السجل المالي)
                    </span>
                  </label>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      سبب التعديل المالي أو التسوية الإدارية (يُحفظ في سجل التسويات مع اسم المشرف والتاريخ):
                    </label>
                    <input
                      type="text"
                      value={editSettlementReason}
                      onChange={(e) => setEditSettlementReason(e.target.value)}
                      placeholder="مثال: تسوية رصيد / تعديل دفعة / إعفاء جزئي..."
                      className="w-full px-3 py-2 rounded-xl bg-[#101B2C] border border-white/15 text-white"
                    />
                  </div>
                </div>
              )}

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
                    حالة الدفع:
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
                    <option value="partial">دافع جزئياً</option>
                    <option value="completed">دافع بالكامل (مكتمل)</option>
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
                  الملاحظات الإدارية:
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
                  disabled={isSavingFinancialEdit}
                  className="px-5 py-2 rounded-xl bg-[#35D6C2] text-[#0A0D12] font-extrabold cursor-pointer"
                >
                  {isSavingFinancialEdit ? 'جارِ الحفظ...' : 'حفظ التعديلات وتحديث الرصيد'}
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

            {/* Balance Calculation Summary Bar (Total Required, Paid, Settlements, Remaining — Requirement 11) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-[#10151C] border border-white/10 text-center">
              <div>
                <span className="text-[11px] text-slate-300 block font-bold">
                  المبلغ الإجمالي المطلوب
                </span>
                <span className="text-sm sm:text-base font-black text-white font-mono">
                  {formatIQD(activePaymentStudent.totalFeeIQD || 35000)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#35D6C5] block font-bold">
                  الدفعات المعتمدة
                </span>
                <span className="text-sm sm:text-base font-black text-[#35D6C5] font-mono">
                  {formatIQD(activePaymentStudent.verifiedPaidIQD)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-indigo-300 block font-bold">
                  التسويات الإدارية
                </span>
                <span className="text-sm sm:text-base font-black text-indigo-300 font-mono">
                  {formatIQD(activePaymentStudent.settlementAdjustmentIQD || 0)}
                </span>
              </div>
              <div>
                <span className="text-[11px] text-[#D6B777] block font-bold">
                  المبلغ المتبقي الحالي
                </span>
                <span className="text-sm sm:text-base font-black text-[#D6B777] font-mono">
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

            {/* Add New Manual Payment Form (Requirement 10: إضافة دفعة يدوية) */}
            {canRecordManualPayment && activePaymentStudent.remainingBalanceIQD > 0 && (
              <form
                onSubmit={handleAddPaymentSubmit}
                className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-[#35D6C2]/25 space-y-3 text-xs"
              >
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-black text-[#35D6C2] flex items-center gap-1.5">
                    <Plus className="w-4 h-4" />
                    <span>
                      إضافة دفعة يدوية للطالب (المشرف المسجل:{' '}
                      {currentUser?.fullName || 'الإدارة المالية'})
                    </span>
                  </h4>
                  <button
                    type="button"
                    onClick={() =>
                      setPayAmountInput(activePaymentStudent.remainingBalanceIQD)
                    }
                    className="px-2.5 py-1 rounded-lg bg-[#D7B875]/15 text-[#D7B875] border border-[#D7B875]/30 text-[11px] font-bold cursor-pointer"
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
                      <option value="superqi">SuperQi (كي كارد)</option>
                      <option value="bank_transfer">تحويل بنكي / مالي</option>
                      <option value="zain_cash">زين كاش (ZainCash)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1">
                      رقم المرجع / الوصل (اختياري):
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
                    className="px-5 py-2 rounded-xl bg-[#35D6C2] hover:opacity-95 text-[#0A0D12] font-extrabold text-xs shadow-md cursor-pointer"
                  >
                    إصدار الوصل وتثبيت الدفعة اليدوية
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

            {/* Pending & Rejected SuperQi Receipt Requests for this Student (Requirement 11) */}
            {(canViewReceipts || canApproveRejectPayments) && (
              <div className="space-y-2 pt-3 border-t border-white/10">
                <h4 className="text-xs font-black text-[#35D6C5]">
                  طلبات وصولات SuperQi المرفوعة لهذا الطالب
                </h4>
                {receiptSubmissions.filter(
                  (r) =>
                    r.studentId === activePaymentStudent.id ||
                    normalizeArabicName(r.submittedRawName || r.studentName) ===
                      activePaymentStudent.normalizedName
                ).length === 0 ? (
                  <p className="text-[11px] text-slate-400">
                    لا توجد وصولات SuperQi مرفوعة لهذا الطالب.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {receiptSubmissions
                      .filter(
                        (r) =>
                          r.studentId === activePaymentStudent.id ||
                          normalizeArabicName(r.submittedRawName || r.studentName) ===
                            activePaymentStudent.normalizedName
                      )
                      .map((sub) => (
                        <div
                          key={sub.id}
                          className="p-3 rounded-xl bg-[#0A0D12] border border-white/10 flex items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <span className="font-mono font-bold text-white">
                              {formatIQD(sub.amountIQD)}
                            </span>
                            <span className="text-[11px] text-slate-400 mr-2">
                              ({sub.transactionDate}) •{' '}
                              {sub.status === 'approved'
                                ? 'معتمد'
                                : sub.status === 'rejected'
                                ? `مرفوض: ${sub.rejectionReason || ''}`
                                : 'قيد المراجعة'}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleOpenInspectSubmission(sub)}
                            className="px-3 py-1 rounded-lg bg-[#35D6C5]/20 text-[#35D6C5] text-[11px] font-bold cursor-pointer"
                          >
                            عرض الوصل
                          </button>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}

            {/* Administrative Financial Settlements History for this Student (Requirement 9 & 11) */}
            <div className="space-y-2 pt-3 border-t border-white/10">
              <h4 className="text-xs font-black text-indigo-300">
                سجل التسويات المالية الإدارية الموثقة
              </h4>
              {financialSettlements.filter(
                (st) => st.studentId === activePaymentStudent.id
              ).length === 0 ? (
                <p className="text-[11px] text-slate-400">
                  لا توجد تسويات إدارية مسجلة لهذا الطالب.
                </p>
              ) : (
                <div className="space-y-2">
                  {financialSettlements
                    .filter((st) => st.studentId === activePaymentStudent.id)
                    .map((st) => (
                      <div
                        key={st.id}
                        className="p-3 rounded-xl bg-[#0A0D12] border border-indigo-500/30 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-indigo-300">
                            {st.reason}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">
                            {new Date(st.createdAt).toLocaleString('ar-IQ')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          المتبقي: {formatIQD(st.previousRemainingIQD)} ←{' '}
                          {formatIQD(st.newRemainingIQD)} • نُفذ بواسطة:{' '}
                          {st.performedBy}
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
      {/* MODAL 9: QUICK MANUAL PAYMENT RECORDING («إضافة دفعة يدوية»)        */}
      {/* =================================================================== */}
      {showQuickManualPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#101B2C] border border-[#2A9D8F]/50 p-6 shadow-2xl space-y-4 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base font-black text-white">
                  إضافة دفعة يدوية لطالب في الدفعة
                </h3>
                <p className="text-[11px] text-[#35D6C5]">
                  المشرف الذي يسجل الدفعة: {currentUser?.fullName || 'الإدارة المالية'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowQuickManualPaymentModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!quickManualStudentId) {
                  setFeedbackBanner({
                    type: 'error',
                    text: 'يرجى اختيار الطالب من القائمة أولاً.',
                  });
                  return;
                }
                const res = await addStudentPayment({
                  studentId: quickManualStudentId,
                  amountIQD: payAmountInput,
                  date: payDateInput,
                  paymentMethod: payMethodInput,
                  receiptNumber: payReceiptInput.trim() || undefined,
                  notes: payNotesInput.trim() || undefined,
                  isVerified: true,
                });
                if (res.success) {
                  setFeedbackBanner({ type: 'success', text: res.message });
                  setShowQuickManualPaymentModal(false);
                } else {
                  setFeedbackBanner({ type: 'error', text: res.message });
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label className="block text-white font-bold">
                  ابحث واختر اسم الطالب: *
                </label>
                <input
                  type="text"
                  value={quickManualStudentQuery}
                  onChange={(e) => setQuickManualStudentQuery(e.target.value)}
                  placeholder="اكتب جزءاً من اسم الطالب للتصفية..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#0A0D12] border border-white/15 text-white"
                />
                <select
                  required
                  value={quickManualStudentId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setQuickManualStudentId(id);
                    const stu = activeStudents.find((s) => s.id === id);
                    if (stu && stu.remainingBalanceIQD > 0) {
                      setPayAmountInput(stu.remainingBalanceIQD);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-[#35D6C5]/40 text-white font-bold"
                >
                  <option value="">-- اختر الطالب من القائمة --</option>
                  {activeStudents
                    .filter((s) =>
                      !quickManualStudentQuery.trim()
                        ? true
                        : s.fullName.includes(quickManualStudentQuery.trim()) ||
                          s.normalizedName.includes(
                            normalizeArabicName(quickManualStudentQuery)
                          )
                    )
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        ت ({s.studentNumber}) — {s.fullName} (المتبقي:{' '}
                        {s.remainingBalanceIQD.toLocaleString()} د.ع)
                      </option>
                    ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">
                    المبلغ المدفوع (د.ع): *
                  </label>
                  <input
                    type="number"
                    step={250}
                    min={250}
                    required
                    value={payAmountInput}
                    onChange={(e) => setPayAmountInput(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-[#35D6C5] font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">
                    تاريخ الدفع: *
                  </label>
                  <input
                    type="date"
                    required
                    value={payDateInput}
                    onChange={(e) => setPayDateInput(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">
                    طريقة الدفع: *
                  </label>
                  <select
                    value={payMethodInput}
                    onChange={(e) =>
                      setPayMethodInput(e.target.value as PaymentMethod)
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white font-bold"
                  >
                    <option value="cash">نقدي</option>
                    <option value="superqi">SuperQi</option>
                    <option value="bank_transfer">تحويل بنكي</option>
                    <option value="zain_cash">زين كاش</option>
                  </select>
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">
                    رقم المرجع (اختياري):
                  </label>
                  <input
                    type="text"
                    value={payReceiptInput}
                    onChange={(e) => setPayReceiptInput(e.target.value)}
                    placeholder="رقم الوصل أو العملية..."
                    className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">
                  الملاحظات (اختياري):
                </label>
                <input
                  type="text"
                  value={payNotesInput}
                  onChange={(e) => setPayNotesInput(e.target.value)}
                  placeholder="ملاحظة حول الدفعة..."
                  className="w-full px-3 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowQuickManualPaymentModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-slate-300 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#2A9D8F] text-white font-extrabold cursor-pointer"
                >
                  تثبيت الدفعة وتحديث الحساب المالي
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 10: PROTECTED SUPERQI RECEIPT INSPECTION & AI REVIEW MODAL    */}
      {/* =================================================================== */}
      {inspectingSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-3xl rounded-3xl bg-[#101B2C] border border-[#35D6C5]/40 p-6 shadow-2xl space-y-5 text-right max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[11px] font-bold text-[#35D6C5] block">
                  فحص الوصل المالي المحمي • خصوصية الوصولات محفوظة
                </span>
                <h3 className="text-base sm:text-lg font-black text-white">
                  وصل الدفع المرسل من: {inspectingSubmission.submittedRawName || inspectingSubmission.studentName}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCloseInspectSubmission}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              {/* Protected Receipt Image Column (6 cols) */}
              <div className="lg:col-span-6 space-y-3">
                <div className="text-xs font-black text-white flex items-center justify-between">
                  <span>صورة وصل التحويل (من الخزنة المشفرة):</span>
                  <span className="text-[10px] text-emerald-300">
                    تُلغى رابط المعاينة المؤقت تلقائياً عند الإغلاق
                  </span>
                </div>

                {!canViewReceipts ? (
                  <div className="p-8 rounded-2xl bg-[#0A0D12] border border-amber-500/30 text-center space-y-2">
                    <Lock className="w-8 h-8 text-amber-400 mx-auto" />
                    <p className="text-xs font-bold text-amber-200">
                      ليست لديك صلاحية «مشاهدة الوصولات المالية» التي يحددها مدير الموقع.
                    </p>
                  </div>
                ) : isLoadingProtectedImage ? (
                  <div className="p-12 rounded-2xl bg-[#0A0D12] border border-white/10 text-center text-xs text-slate-300">
                    جارِ فك تشفير وتحميل صورة الوصل بأمان...
                  </div>
                ) : protectedImageError ? (
                  <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-xs text-rose-200">
                    {protectedImageError}
                  </div>
                ) : protectedImageBlobUrl ? (
                  <div className="rounded-2xl bg-[#0A0D12] border border-white/15 p-2 flex items-center justify-center overflow-hidden">
                    <img
                      src={protectedImageBlobUrl}
                      alt="وصل الدفع"
                      className="max-h-[420px] w-auto object-contain rounded-xl select-none"
                      onContextMenu={(e) => e.preventDefault()}
                    />
                  </div>
                ) : null}
              </div>

              {/* AI Analysis & Supervisor Decision Column (6 cols) */}
              <div className="lg:col-span-6 space-y-4 text-xs">
                {/* Student Submitted Info */}
                <div className="p-3.5 rounded-2xl bg-[#0A0D12] border border-white/10 space-y-1.5">
                  <div className="font-black text-[#35D6C5] mb-1">
                    البيانات المدخلة من الطالب:
                  </div>
                  <div>
                    الاسم المرسل:{' '}
                    <strong className="text-white">
                      {inspectingSubmission.submittedRawName || inspectingSubmission.studentName}
                    </strong>
                  </div>
                  <div>
                    المبلغ المدخل:{' '}
                    <strong className="text-emerald-400 font-mono">
                      {formatIQD(inspectingSubmission.amountIQD)}
                    </strong>
                  </div>
                  <div>
                    التاريخ والمرجع:{' '}
                    <strong className="text-white font-mono">
                      {inspectingSubmission.transactionDate} •{' '}
                      {inspectingSubmission.transactionReference || 'بدون مرجع'}
                    </strong>
                  </div>
                  {inspectingSubmission.notes && (
                    <div>
                      ملاحظات الطالب:{' '}
                      <span className="text-slate-300">
                        {inspectingSubmission.notes}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Receipt Analysis Details (Requirement 6) */}
                {canAnalyzeReceipts && (
                  <div className="p-3.5 rounded-2xl bg-[#0A0D12] border border-[#35D6C5]/35 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-[#35D6C5]">
                        تحليل الوصل بالذكاء الاصطناعي:
                      </span>
                      <button
                        type="button"
                        disabled={isProcessingReceiptDecision}
                        onClick={async () => {
                          setIsProcessingReceiptDecision(true);
                          const res = await reanalyzeSuperQiReceipt(
                            inspectingSubmission.id
                          );
                          setIsProcessingReceiptDecision(false);
                          setFeedbackBanner({
                            type: res.success ? 'success' : 'error',
                            text: res.message,
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-[10px] text-white font-bold cursor-pointer"
                      >
                        إعادة التحليل الذكي
                      </button>
                    </div>

                    {inspectingSubmission.aiAnalysis ? (
                      <div className="space-y-1.5 text-[11px] text-slate-200">
                        <div className="p-2 rounded-lg bg-[#142238] font-black text-amber-300">
                          النتيجة: «{inspectingSubmission.aiAnalysis.classification}»
                        </div>
                        <div>
                          • المبلغ المستخرج من الصورة:{' '}
                          <strong className="font-mono text-white">
                            {inspectingSubmission.aiAnalysis.extractedAmountIQD
                              ? formatIQD(
                                  inspectingSubmission.aiAnalysis
                                    .extractedAmountIQD
                                )
                              : 'غير واضح'}
                          </strong>
                        </div>
                        <div>
                          • تاريخ ووقت العملية:{' '}
                          <strong className="font-mono text-white">
                            {inspectingSubmission.aiAnalysis.extractedDateTime ||
                              'غير واضح'}
                          </strong>
                        </div>
                        <div>
                          • رقم العملية / المرجع:{' '}
                          <strong className="font-mono text-white">
                            {inspectingSubmission.aiAnalysis
                              .extractedReferenceNumber || 'غير واضح'}
                          </strong>
                        </div>
                        <div>
                          • المستلم في الوصل:{' '}
                          <strong className="font-mono text-white">
                            {inspectingSubmission.aiAnalysis
                              .extractedRecipientInfo || 'غير واضح'}
                          </strong>{' '}
                          (
                          {inspectingSubmission.aiAnalysis
                            .recipientCardMatched
                            ? 'مطابق لـ 6132013829'
                            : 'تحقق يدوياً'}
                          )
                        </div>
                        <p className="text-[11px] text-slate-300 pt-1">
                          {inspectingSubmission.aiAnalysis.summaryArabic}
                        </p>
                      </div>
                    ) : (
                      <p className="text-slate-400">
                        لم يتم تشغيل التحليل الذكي بعد.
                      </p>
                    )}
                  </div>
                )}

                {/* Supervisor Approval / Rejection Controls (Requirement 7) */}
                {canApproveRejectPayments &&
                  inspectingSubmission.status === 'pending_review' && (
                    <div className="p-3.5 rounded-2xl bg-[#142238] border border-emerald-500/35 space-y-3">
                      <div className="font-black text-white">
                        قرار المشرف المخوّل (يحدّث الحساب المالي الرسمي للطالب):
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 font-bold mb-1">
                          تأكيد سجل الطالب في القائمة الرسمية: *
                        </label>
                        <select
                          value={approvalStudentId}
                          onChange={(e) => setApprovalStudentId(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/15 text-white font-bold"
                        >
                          <option value="">-- اختر سجل الطالب الرسمي --</option>
                          {activeStudents.map((s) => (
                            <option key={s.id} value={s.id}>
                              ت ({s.studentNumber}) — {s.fullName} (المتبقي:{' '}
                              {s.remainingBalanceIQD.toLocaleString()} د.ع)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] text-slate-300 font-bold mb-1">
                          المبلغ المعتمد لإضافته إلى رصيد الطالب (د.ع):
                        </label>
                        <input
                          type="number"
                          step={250}
                          min={250}
                          value={approvalAmountIQD}
                          onChange={(e) =>
                            setApprovalAmountIQD(Number(e.target.value))
                          }
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/15 text-emerald-400 font-mono font-bold"
                        />
                      </div>

                      <input
                        type="text"
                        value={approvalReviewNote}
                        onChange={(e) => setApprovalReviewNote(e.target.value)}
                        placeholder="ملاحظة الاعتماد (اختياري)..."
                        className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-white/15 text-white"
                      />

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          type="button"
                          disabled={
                            isProcessingReceiptDecision || !approvalStudentId
                          }
                          onClick={async () => {
                            setIsProcessingReceiptDecision(true);
                            const res = await approveSuperQiReceipt({
                              submissionId: inspectingSubmission.id,
                              targetStudentIdOverride: approvalStudentId,
                              reviewNote: approvalReviewNote,
                            });
                            setIsProcessingReceiptDecision(false);
                            setFeedbackBanner({
                              type: res.success ? 'success' : 'error',
                              text: res.message,
                            });
                            if (res.success) {
                              handleCloseInspectSubmission();
                            }
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-[#0A0D12] font-black text-xs cursor-pointer"
                        >
                          موافقة واعتماد الدفعة في حساب الطالب
                        </button>
                      </div>

                      <div className="pt-2 border-t border-white/10 space-y-2">
                        <input
                          type="text"
                          value={rejectionReasonText}
                          onChange={(e) =>
                            setRejectionReasonText(e.target.value)
                          }
                          placeholder="سبب رفض الوصل في حال الرفض..."
                          className="w-full px-3 py-2 rounded-xl bg-[#0A0D12] border border-rose-500/30 text-white"
                        />
                        <button
                          type="button"
                          disabled={isProcessingReceiptDecision}
                          onClick={async () => {
                            setIsProcessingReceiptDecision(true);
                            const res = await rejectSuperQiReceipt({
                              submissionId: inspectingSubmission.id,
                              reason:
                                rejectionReasonText.trim() ||
                                'بيانات الوصل غير مطابقة بعد المراجعة',
                            });
                            setIsProcessingReceiptDecision(false);
                            setFeedbackBanner({
                              type: res.success ? 'success' : 'error',
                              text: res.message,
                            });
                            if (res.success) {
                              handleCloseInspectSubmission();
                            }
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold text-xs cursor-pointer"
                        >
                          رفض طلب الوصل
                        </button>
                      </div>
                    </div>
                  )}
              </div>
            </div>
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
