import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useMusic } from '../context/MusicContext';
import {
  formatIQD,
  formatArabicDate,
  LocalStorageManager,
  getPaymentStatusArabic,
  getPaymentStatusBadgeClass,
} from '../services/storage';
import {
  Graduate,
  PaymentMethod,
  GraduationOfficialStatus,
  PaymentEventTarget,
  PaymentStatus,
  MediaItem,
  UserRole,
  ModeratorRequest,
  LoggedInUserAccount,
} from '../types';
import { MediaUploadZone, UploadResult } from '../components/MediaUploadZone';
import { ScrubStudentManagementSection } from '../components/ScrubStudentManagementSection';
import { AdminMusicManagementSection } from '../components/AdminMusicManagementSection';
import {
  ShieldAlert,
  ShieldCheck,
  Users,
  CreditCard,
  Settings,
  Bell,
  Image,
  Music,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Plus,
  Search,
  Filter,
  DollarSign,
  Download,
  Calendar,
  Lock,
  ArrowRight,
  Eye,
  Trash2,
  Edit2,
  RefreshCw,
  ExternalLink,
  Sparkles,
  GraduationCap,
  Camera,
  MapPin,
  Clock,
  Link2,
  Sun,
  Award,
  Banknote,
  UserCheck,
  UserX,
  MessageSquare,
  Info,
  LogOut,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
    firebaseUser,
    firebaseAuthLoading,
    signOutFirebase,
    isAdmin,
    isSuperAdmin,
    isModerator,
    canManageFinances,
    scrubStudents,
    graduates,
    payments,
    announcements,
    media,
    auditLogs,
    eventConfig,
    addGraduateManually,
    deleteGraduate,
    approveGraduate,
    rejectGraduate,
    suspendGraduate,
    updateGraduateRole,
    recordPayment,
    updateEventConfig,
    addAnnouncement,
    deleteAnnouncement,
    addMedia,
    deleteMedia,
    approveMedia,
    rejectMedia,
    openReceipt,
    navigateTo,
    pendingRegistrationRequests,
    approveStudentRegistration,
    rejectStudentRegistration,
    refreshPendingRequests,
    loggedInUsers,
    refreshLoggedInUsers,
    moderatorRequests,
    approveModeratorRequest,
    rejectModeratorRequest,
    promoteUserToModerator,
    revokeModeratorRole,
    supervisors,
    refreshSupervisors,
    refreshModeratorRequests,
    financialLinkRequests,
    approveFinancialLinkRequest,
    rejectFinancialLinkRequest,
    studentPayments,
    verifyStudentPayment,
    voidStudentPayment,
  } = useApp();
  const { songs } = useMusic();

  const [activeAdminTab, setActiveAdminTab] = useState<
    | 'scrub_students'
    | 'financial_link_requests'
    | 'logged_in_users'
    | 'moderator_requests'
    | 'supervisors_management'
    | 'overview'
    | 'pending_requests'
    | 'graduates'
    | 'payments'
    | 'announcements'
    | 'event_config'
    | 'media'
    | 'music_library'
    | 'audit'
  >(canManageFinances ? 'scrub_students' : 'event_config');

  const [finLinkActionFeedback, setFinLinkActionFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Moderator Requests review state
  const [selectedModReq, setSelectedModReq] = useState<ModeratorRequest | null>(null);
  const [modDecision, setModDecision] = useState<'accept' | 'reject' | null>(null);
  const [modRejectReason, setModRejectReason] = useState('');
  const [isProcessingModAction, setIsProcessingModAction] = useState(false);
  const [modActionFeedback, setModActionFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [filterModStatus, setFilterModStatus] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all');
  const [searchModQuery, setSearchModQuery] = useState('');
  const [revokeTargetSup, setRevokeTargetSup] = useState<{ userId: string; fullName: string; email: string } | null>(null);
  const [loggedUsersRoleFilter, setLoggedUsersRoleFilter] = useState<'all' | 'super_admin' | 'moderator' | 'student'>('all');
  const [selectedUserAccount, setSelectedUserAccount] = useState<LoggedInUserAccount | null>(null);
  const [confirmRoleAction, setConfirmRoleAction] = useState<'promote' | 'revoke' | null>(null);
  const [userRoleFeedback, setUserRoleFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isUpdatingUserRole, setIsUpdatingUserRole] = useState(false);

  // Rejection modal state
  const [rejectModalReq, setRejectModalReq] = useState<any | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [reviewActionFeedback, setReviewActionFeedback] = useState<string | null>(null);
  const [isProcessingReview, setIsProcessingReview] = useState(false);

  // Graduate management filters & search
  const [searchQuery, setSearchQuery] = useState('');
  const [loggedUsersSearch, setLoggedUsersSearch] = useState('');
  const [filterRegStatus, setFilterRegStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');

  // New Graduate Modal Form (Method B)
  const [showAddGradModal, setShowAddGradModal] = useState(false);
  const [newGradName, setNewGradName] = useState('');
  const [newGradEmail, setNewGradEmail] = useState('');
  const [newGradPhone, setNewGradPhone] = useState('');
  const [newGradStudentId, setNewGradStudentId] = useState('');
  const [newGradTitle, setNewGradTitle] = useState<'nurse_m' | 'nurse_f'>('nurse_m');

  // Payment Recording Form (Supporting existing students & advance pre-registration cash)
  const [showPayModal, setShowPayModal] = useState(false);
  const [payTargetMode, setPayTargetMode] = useState<'existing' | 'advance'>('existing');
  const [payGradId, setPayGradId] = useState('');
  const [advanceName, setAdvanceName] = useState('');
  const [advancePhone, setAdvancePhone] = useState('');
  const [advanceStudentId, setAdvanceStudentId] = useState('');
  const [payEventTarget, setPayEventTarget] = useState<PaymentEventTarget>('scrub_night');
  const [payStatusType, setPayStatusType] = useState<'deposit' | 'partial' | 'completed'>('deposit');
  const [payAmount, setPayAmount] = useState<number>(eventConfig.scrubFeeIQD || 35000);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('cash');
  const [payNotes, setPayNotes] = useState('');
  const [payFeedback, setPayFeedback] = useState<string | null>(null);

  // Announcement Form
  const [showAnnModal, setShowAnnModal] = useState(false);
  const [annTitle, setAnnTitle] = useState('');
  const [annDesc, setAnnDesc] = useState('');
  const [annCat, setAnnCat] = useState<'urgent' | 'general' | 'scrub_night' | 'official_grad'>('scrub_night');

  // Media Form
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaAlbum, setMediaAlbum] = useState('حفلة السكراب');
  const [mediaCat, setMediaCat] = useState<'scrub_night' | 'official_grad' | 'team' | 'posters' | 'memories'>('scrub_night');

  // Site Identity & "حول الموقع" Editable State
  const [editBrandName, setEditBrandName] = useState(
    eventConfig.brandName || 'تخرج دفعة التمريض 2027'
  );
  const [editBrandSubtitle, setEditBrandSubtitle] = useState(
    eventConfig.brandSubtitle || 'رحلة علم، تعب، وذكريات تجمعنا'
  );
  const [editAboutSiteText, setEditAboutSiteText] = useState(
    eventConfig.aboutSiteText ||
      'منصة خاصة بطلاب دفعة التمريض 2027، مخصصة لتنظيم شؤون الدفعة وفعاليات التخرج وتوثيق الذكريات وتنسيق المعلومات بين الطلاب وفريق التنظيم. الموقع مستقل عن الإدارة الرسمية للمؤسسة التعليمية'
  );

  // Event & Countdown Config Form State
  const [editScrubEventName, setEditScrubEventName] = useState(eventConfig.scrubEventName || 'حفلة السكراب');
  const [editScrubDate, setEditScrubDate] = useState(eventConfig.scrubPartyDate || '2026-12-12T09:00:00');
  const [editScrubDisplay, setEditScrubDisplay] = useState(eventConfig.scrubPartyDateDisplay || '12/12/2026');
  const [editScrubVenue, setEditScrubVenue] = useState(eventConfig.scrubVenue || 'مسرح تفاحة المصور');
  const [editScrubPhotographer, setEditScrubPhotographer] = useState(eventConfig.scrubPhotographer || 'باقر حسن');
  const [editScrubTime, setEditScrubTime] = useState(eventConfig.scrubTime || 'الوقت يُعلن لاحقاً');
  const [editDressCode, setEditDressCode] = useState(eventConfig.scrubPartyDressCode || 'السكراب الطبي المعتمد لحفلة تخرج الممرضين');
  const [editScrubCountdownEnabled, setEditScrubCountdownEnabled] = useState(eventConfig.scrubCountdownEnabled ?? true);
  const [editIsScrubDateConfirmed, setEditIsScrubDateConfirmed] = useState(eventConfig.isScrubDateConfirmed ?? false);
  const [editScrubFeeIQD, setEditScrubFeeIQD] = useState<number>(eventConfig.scrubFeeIQD || 35000);

  const [editOfficialTitle, setEditOfficialTitle] = useState(eventConfig.officialGraduationTitle || 'حفل تخرج دفعة 2027');
  const [editOfficialStatus, setEditOfficialStatus] = useState<GraduationOfficialStatus>(eventConfig.officialGraduationStatus || 'coming_soon');
  const [editOfficialDate, setEditOfficialDate] = useState(eventConfig.officialGraduationDate || 'قريباً');
  const [editOfficialLocation, setEditOfficialLocation] = useState(eventConfig.officialGraduationLocation || 'قريباً');
  const [editOfficialSashColor, setEditOfficialSashColor] = useState(eventConfig.officialGraduationSashColor || 'تركوازي (وشاح التمريض)');
  const [editOfficialGradCountdownEnabled, setEditOfficialGradCountdownEnabled] = useState(eventConfig.officialGradCountdownEnabled ?? false);
  const [editIsOfficialGradDateConfirmed, setEditIsOfficialGradDateConfirmed] = useState(eventConfig.isOfficialGradDateConfirmed ?? false);
  const [editIsOfficialGradPriceConfirmed, setEditIsOfficialGradPriceConfirmed] = useState(eventConfig.isOfficialGradPriceConfirmed ?? false);
  const [editOfficialGradFeeIQD, setEditOfficialGradFeeIQD] = useState<number>(eventConfig.officialGradFeeIQD || 50000);

  // Top-of-Home Countdown Timer Master Settings
  const [editCountdownEnabled, setEditCountdownEnabled] = useState(eventConfig.countdownEnabled ?? true);
  const [editCountdownPublished, setEditCountdownPublished] = useState(eventConfig.countdownPublished ?? true);
  const [editCountdownTarget, setEditCountdownTarget] = useState<'scrub_night' | 'scrub_party' | 'official_grad' | 'custom'>(eventConfig.countdownTarget || 'scrub_party');
  const [editCountdownTitle, setEditCountdownTitle] = useState(eventConfig.countdownTitle || 'العد التنازلي لحفلة السكراب — تخرج دفعة التمريض 2027');
  const [editCountdownDate, setEditCountdownDate] = useState(eventConfig.countdownDate || '2026-12-12');
  const [editCountdownTime, setEditCountdownTime] = useState(eventConfig.countdownTime || '09:00');
  const [editCountdownTimezone, setEditCountdownTimezone] = useState(eventConfig.countdownTimezone || 'Asia/Baghdad');
  const [editCountdownLocation, setEditCountdownLocation] = useState(eventConfig.countdownLocation || 'مسرح تفاحة المصور');
  const [editCountdownStyle, setEditCountdownStyle] = useState<'medical_turquoise' | 'champagne_gold' | 'clinical_navy' | 'medical_glass' | 'gold_ceremonial' | 'compact'>(eventConfig.countdownStyle || 'medical_glass');

  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // Show loading state while Firebase Auth verifies the session and /admins/{uid} role
  if (firebaseAuthLoading) {
    return (
      <div className="py-24 text-center max-w-md mx-auto px-4 space-y-3">
        <Clock className="w-10 h-10 text-[#35D6C5] animate-spin mx-auto" />
        <h2 className="text-lg font-bold text-white">
          جارِ التحقق من صلاحيات الإدارة عبر Firebase...
        </h2>
        <p className="text-xs text-[#929BAA]">يرجى الانتظار لحظة</p>
      </div>
    );
  }

  // Strictly require a real Firebase-authenticated user with verified admin/moderator role in Firestore
  if (!firebaseUser || (!isAdmin && !isModerator)) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4 space-y-4">
        <ShieldAlert className="w-14 h-14 text-red-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">
          منطقة محمية — مخصصة للإدارة والمشرفين المعتمدين
        </h2>
        <p className="text-xs text-[#929BAA] leading-relaxed">
          هذه المنطقة محمية بقواعد أمان Firebase (Firestore Security Rules). يجب تسجيل الدخول بحساب مسؤول معتمد للوصول إلى لوحة الإدارة.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={() => navigateTo('login')}
            className="px-6 py-2.5 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-extrabold text-xs cursor-pointer"
          >
            تسجيل الدخول كمشرف
          </button>
          <button
            onClick={() => navigateTo('home')}
            className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-xs cursor-pointer"
          >
            العودة للرئيسية
          </button>
        </div>
      </div>
    );
  }

  // Live Metrics Calculations
  const totalRegistered = graduates.length;
  const pendingRequests = graduates.filter((g) => g.status === 'pending').length;
  const approvedGraduates = graduates.filter((g) => g.status === 'approved').length;

  const totalScrubCollected = payments
    .filter((p) => p.eventTarget === 'scrub_night')
    .reduce((sum, p) => sum + p.amountIQD, 0);

  const totalGradCollected = payments
    .filter((p) => p.eventTarget === 'official_grad')
    .reduce((sum, p) => sum + p.amountIQD, 0);

  const totalCashCollected = payments.reduce((sum, p) => sum + p.amountIQD, 0);

  // Filter graduates list
  const filteredGraduates = graduates.filter((g) => {
    const matchesSearch =
      g.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.phone.includes(searchQuery) ||
      (g.studentId && g.studentId.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesReg = filterRegStatus === 'all' || g.status === filterRegStatus;

    let matchesPay = true;
    if (filterPaymentStatus === 'paid') {
      matchesPay = g.remainingBalanceIQD === 0;
    } else if (filterPaymentStatus === 'partial') {
      matchesPay = g.totalPaidIQD > 0 && g.remainingBalanceIQD > 0;
    } else if (filterPaymentStatus === 'unpaid') {
      matchesPay = g.totalPaidIQD === 0;
    }

    return matchesSearch && matchesReg && matchesPay;
  });

  // Handle Event Config Save
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    updateEventConfig({
      brandName: editBrandName.trim() || 'تخرج دفعة التمريض 2027',
      brandSubtitle: editBrandSubtitle.trim() || 'رحلة علم، تعب، وذكريات تجمعنا',
      aboutSiteText:
        editAboutSiteText.trim() ||
        'منصة خاصة بطلاب دفعة التمريض 2027، مخصصة لتنظيم شؤون الدفعة وفعاليات التخرج وتوثيق الذكريات وتنسيق المعلومات بين الطلاب وفريق التنظيم. الموقع مستقل عن الإدارة الرسمية للمؤسسة التعليمية',

      scrubEventName: editScrubEventName.trim(),
      scrubPartyDate: editScrubDate,
      scrubPartyDateDisplay: editScrubDisplay.trim(),
      scrubVenue: editScrubVenue.trim(),
      scrubPhotographer: editScrubPhotographer.trim(),
      scrubTime: editScrubTime.trim(),
      scrubPartyDressCode: editDressCode.trim(),
      scrubCountdownEnabled: editScrubCountdownEnabled,
      isScrubDateConfirmed: editIsScrubDateConfirmed,
      scrubFeeIQD: Number(editScrubFeeIQD) > 0 ? Number(editScrubFeeIQD) : 35000,

      officialGraduationTitle: editOfficialTitle.trim(),
      officialGraduationStatus: editOfficialStatus,
      officialGraduationDate: editOfficialDate.trim(),
      officialGraduationLocation: editOfficialLocation.trim(),
      officialGraduationSashColor: editOfficialSashColor.trim(),
      officialGradCountdownEnabled: editOfficialGradCountdownEnabled,
      isOfficialGradDateConfirmed: editIsOfficialGradDateConfirmed,
      isOfficialGradPriceConfirmed: editIsOfficialGradPriceConfirmed,
      officialGradFeeIQD: Number(editOfficialGradFeeIQD) >= 0 ? Number(editOfficialGradFeeIQD) : 0,

      countdownEnabled: editCountdownEnabled,
      countdownPublished: editCountdownPublished,
      countdownTarget: editCountdownTarget,
      countdownTitle: editCountdownTitle.trim(),
      countdownDate: editCountdownDate,
      countdownTime: editCountdownTime,
      countdownTimezone: editCountdownTimezone,
      countdownLocation: editCountdownLocation.trim(),
      countdownStyle: editCountdownStyle,
    });

    setConfigSavedNotice(true);
    setTimeout(() => setConfigSavedNotice(false), 3000);
  };

  // Handle Payment Submit (Handles both registered students & advance pre-registered cash)
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPayFeedback(null);

    if (payAmount <= 0) {
      setPayFeedback('يجب أن يكون المبلغ المسدد أكبر من صفر.');
      return;
    }

    if (payTargetMode === 'existing') {
      if (!payGradId) {
        setPayFeedback('يرجى اختيار الخريج من القائمة.');
        return;
      }

      const res = recordPayment({
        graduateId: payGradId,
        amountIQD: payAmount,
        eventTarget: payEventTarget,
        method: payMethod,
        paymentStatus: payStatusType,
        notes: payNotes,
      });

      if (res.success && res.receipt) {
        setPayFeedback(res.message);
        setTimeout(() => {
          setShowPayModal(false);
          setPayFeedback(null);
          openReceipt(res.receipt!);
        }, 1200);
      } else {
        setPayFeedback(res.message);
      }
    } else {
      // Advance Cash Recording for an offline student before registration
      if (!advanceName.trim() || !advancePhone.trim()) {
        setPayFeedback('يرجى إدخال اسم الطالب ورقم هاتفه الإلزامي للمطابقة التلقائية.');
        return;
      }

      const res = recordPayment({
        graduateId: '', // Unlinked initial transaction
        amountIQD: payAmount,
        eventTarget: payEventTarget,
        method: payMethod,
        paymentStatus: payStatusType,
        matchingPhone: advancePhone.trim(),
        matchingStudentId: advanceStudentId.trim() || undefined,
        notes: `${payNotes ? payNotes + ' • ' : ''}سند قبض كاش/عربون مسجل مسبقاً للطالب (${advanceName.trim()})`,
      });

      if (res.success && res.receipt) {
        setPayFeedback(`تم تسجيل السند بنجاح! سيتم ربطه تلقائياً فور تسجيل الطالب برقم ${advancePhone}.`);
        setTimeout(() => {
          setShowPayModal(false);
          setPayFeedback(null);
          setAdvanceName('');
          setAdvancePhone('');
          setAdvanceStudentId('');
          openReceipt(res.receipt!);
        }, 1500);
      } else {
        setPayFeedback(res.message);
      }
    }
  };

  const pendingMediaSubmissions = media.filter((m) => m.status === 'pending');

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-right">
      {/* Top Healthcare Administration Banner with Officer Details */}
      <div className="rounded-3xl bg-gradient-to-br from-[#101B2C] via-[#162238] to-[#0A0D12] border border-[#35D6C2]/30 p-6 sm:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl clinical-grid-bg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#342A78] to-[#101B2C] border-2 border-[#35D6C2]/40 text-[#35D6C2] flex items-center justify-center text-2xl font-black shadow-lg shrink-0">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#F4F8FC]">
                لوحة إدارة وتنظيم شؤون الدفعة — تخرج دفعة التمريض 2027
              </h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                isSuperAdmin
                  ? 'bg-[#D7B875]/20 text-[#D7B875] border-[#D7B875]/35'
                  : 'bg-[#342A78]/60 text-indigo-200 border-indigo-400/40'
              }`}>
                {isSuperAdmin ? 'مشرف ومنظم المنصة (Super Admin)' : 'مشرف في فريق تنظيم الدفعة'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              تخرج طلاب معهد التمريض — دفعة 2027 • المنظم المسؤول: <strong className="text-[#35D6C2]">{currentUser?.displayTitle || currentUser?.fullName}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => {
              setPayTargetMode('advance');
              setShowPayModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D7B875] to-[#bf9e5a] hover:opacity-95 text-[#0A0D12] font-extrabold text-xs shadow-lg shadow-[#D7B875]/20 flex items-center gap-1.5"
          >
            <Banknote className="w-4 h-4" />
            <span>تسجيل عربون كاش مسبق</span>
          </button>

          <button
            onClick={() => {
              setPayTargetMode('existing');
              setShowPayModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#35D6C2] to-[#24B8A5] hover:opacity-95 text-[#0A0D12] font-extrabold text-xs shadow-lg shadow-[#35D6C2]/20 flex items-center gap-1.5"
          >
            <CreditCard className="w-4 h-4" />
            <span>تسجيل دفعة خريج مسجل</span>
          </button>

          <button
            onClick={() => setShowAddGradModal(true)}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4F8FC] font-bold text-xs border border-white/10 flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خريج يدوياً</span>
          </button>

          <button
            onClick={signOutFirebase}
            className="px-3.5 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 font-bold text-xs border border-red-500/30 flex items-center gap-1.5 cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
            <span>خروج</span>
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto text-xs font-bold no-print">
        {canManageFinances && (
          <button
            onClick={() => setActiveAdminTab('scrub_students')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'scrub_students'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md font-extrabold'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              إدارة طلبة حفلة السكراب (
              {scrubStudents.filter((s) => s.status === 'active').length})
            </span>
          </button>
        )}

        {canManageFinances && (
          <button
            onClick={() => setActiveAdminTab('financial_link_requests')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'financial_link_requests'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md font-extrabold'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <Link2 className="w-3.5 h-3.5" />
            <span>طلبات ربط السجلات والدفعات المعلقة</span>
            {financialLinkRequests.filter((r) => r.status === 'pending').length +
              studentPayments.filter((p) => p.verificationStatus === 'pending').length >
            0 ? (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center animate-pulse">
                {financialLinkRequests.filter((r) => r.status === 'pending').length +
                  studentPayments.filter((p) => p.verificationStatus === 'pending').length}
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center">
                0
              </span>
            )}
          </button>
        )}

        {(isAdmin || isModerator) && (
          <button
            onClick={() => {
              setActiveAdminTab('logged_in_users');
              refreshLoggedInUsers();
            }}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'logged_in_users'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md font-extrabold'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>إحصائيات الطلاب ({loggedInUsers.length})</span>
          </button>
        )}

        {(isAdmin || isModerator) && (
          <button
            onClick={() => {
              setActiveAdminTab('moderator_requests');
              refreshModeratorRequests();
            }}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'moderator_requests'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md font-extrabold'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>طلبات الإشراف</span>
            {moderatorRequests.filter((r) => r.status === 'pending').length > 0 ? (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center animate-pulse">
                {moderatorRequests.filter((r) => r.status === 'pending').length}
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center">
                0
              </span>
            )}
          </button>
        )}

        {(isAdmin || isModerator) && (
          <button
            onClick={() => {
              setActiveAdminTab('supervisors_management');
              refreshSupervisors();
            }}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'supervisors_management'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md font-extrabold'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>إدارة المشرفين ({supervisors.length})</span>
          </button>
        )}

        {canManageFinances && (
          <button
            onClick={() => setActiveAdminTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'overview'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <span>نظرة عامة ومؤشرات</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveAdminTab('pending_requests')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'pending_requests'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md font-bold'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>طلبات التسجيل السحابية المعلقة</span>
            {pendingRegistrationRequests.length > 0 ? (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center animate-pulse">
                {pendingRegistrationRequests.length}
              </span>
            ) : (
              <span className="w-4 h-4 rounded-full bg-white/10 text-white text-[10px] flex items-center justify-center">
                0
              </span>
            )}
          </button>
        )}

        {canManageFinances && (
          <button
            onClick={() => setActiveAdminTab('graduates')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'graduates'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>الخريجون والصلاحيات ({totalRegistered})</span>
            {pendingRequests > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-black text-[10px] font-black flex items-center justify-center">
                {pendingRequests}
              </span>
            )}
          </button>
        )}

        {canManageFinances && (
          <button
            onClick={() => setActiveAdminTab('payments')}
            className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
              activeAdminTab === 'payments'
                ? 'bg-[#35D6C5] text-[#10151C] shadow-md'
                : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>المقبوضات والوصولات ({payments.length})</span>
          </button>
        )}

        <button
          onClick={() => setActiveAdminTab('event_config')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeAdminTab === 'event_config'
              ? 'bg-[#35D6C5] text-[#10151C] shadow-md'
              : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>إعدادات الحفلات والعداد التنازلي</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('media')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeAdminTab === 'media'
              ? 'bg-[#21D4C2] text-black shadow-md'
              : 'bg-[#101827] text-[#929BAA] hover:text-white'
          }`}
        >
          <Image className="w-3.5 h-3.5" />
          <span>المعرض والوسائط</span>
          {pendingMediaSubmissions.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {pendingMediaSubmissions.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveAdminTab('announcements')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeAdminTab === 'announcements'
              ? 'bg-[#21D4C2] text-black shadow-md'
              : 'bg-[#101827] text-[#929BAA] hover:text-white'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>الإعلانات ({announcements.length})</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('music_library')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeAdminTab === 'music_library'
              ? 'bg-[#35D6C5] text-[#10151C] shadow-md font-extrabold'
              : 'bg-[#142638] text-[#E8EEF2] hover:text-white'
          }`}
        >
          <Music className="w-3.5 h-3.5 text-current" />
          <span>مكتبة الأغاني والموسيقى</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('audit')}
          className={`px-4 py-2 rounded-xl transition-all shrink-0 flex items-center gap-1.5 ${
            activeAdminTab === 'audit'
              ? 'bg-[#21D4C2] text-black shadow-md'
              : 'bg-[#101827] text-[#929BAA] hover:text-white'
          }`}
        >
          <span>سجل التدقيق (Audit)</span>
        </button>
      </div>

      {/* TAB: SCRUB PARTY STUDENT MANAGEMENT SYSTEM (46+ ROSTER) */}
      {activeAdminTab === 'scrub_students' && <ScrubStudentManagementSection />}

      {/* TAB: FINANCIAL RECORD LINK REQUESTS & STUDENT PENDING PAYMENTS */}
      {activeAdminTab === 'financial_link_requests' && (
        <div className="space-y-8">
          {finLinkActionFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between ${
                finLinkActionFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/30 text-red-300'
              }`}
            >
              <span>{finLinkActionFeedback.text}</span>
              <button
                onClick={() => setFinLinkActionFeedback(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {/* 1. Financial Record Link Requests */}
          <div className="rounded-3xl bg-[#101827] border border-[#35D6C5]/30 p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-[#35D6C5]" />
                  <span>طلبات ربط الحسابات بالسجلات المالية ({financialLinkRequests.length})</span>
                </h2>
                <p className="text-xs text-[#929BAA]">
                  راجع طلبات الطلاب لربط حساباتهم الشخصية بسجلات حفلة السكراب الرسمية دون إنشاء سجلات مكررة. عند الموافقة تنتقل المبالغ المدفوعة والوصولات فوراً لحساب الطالب ويصله إشعار شخصي.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1.5 rounded-xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  معلقة: {financialLinkRequests.filter((r) => r.status === 'pending').length}
                </span>
                <span className="px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  مقبولة: {financialLinkRequests.filter((r) => r.status === 'approved').length}
                </span>
              </div>
            </div>

            {financialLinkRequests.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0A0D12]/60 border border-white/5 text-center space-y-2">
                <Link2 className="w-8 h-8 text-[#929BAA] mx-auto opacity-50" />
                <p className="text-sm font-bold text-white">لا توجد طلبات ربط سجلات مالية حالياً</p>
                <p className="text-xs text-[#929BAA]">
                  عندما يبحث طالب من حسابه عبر ميزة «العثور على سجلي المالي» ويرسل طلب ربط سيظهر هنا للمراجعة والاعتماد.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {financialLinkRequests.map((req) => (
                  <div
                    key={req.id}
                    className={`p-5 rounded-2xl border transition-all space-y-4 ${
                      req.status === 'pending'
                        ? 'bg-[#142638]/80 border-amber-500/40'
                        : req.status === 'approved'
                        ? 'bg-[#0A0D12]/80 border-emerald-500/30'
                        : 'bg-[#0A0D12]/50 border-red-500/20 opacity-75'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-black px-2.5 py-0.5 rounded-lg bg-[#35D6C5]/15 text-[#35D6C5]">
                            تسلسل السجل #{req.targetStudentNumber}
                          </span>
                          {req.targetStudentSection && (
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-white/10 text-white">
                              {req.targetStudentSection}
                            </span>
                          )}
                          <span
                            className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg ${
                              req.status === 'pending'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : req.status === 'approved'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-300 border border-red-500/30'
                            }`}
                          >
                            {req.status === 'pending'
                              ? 'قيد المراجعة'
                              : req.status === 'approved'
                              ? 'تم الربط والاعتماد'
                              : 'مرفوض'}
                          </span>
                        </div>
                        <h3 className="text-base font-black text-white pt-1">
                          السجل المطلوب: {req.targetStudentName}
                        </h3>
                        <p className="text-xs text-[#929BAA]">
                          مقدم الطلب: <span className="text-white font-bold">{req.userName}</span>
                          {req.userEmail ? ` (${req.userEmail})` : ''}
                        </p>
                      </div>
                      <span className="text-[11px] text-[#929BAA] font-mono">
                        {formatArabicDate(req.requestedAt)}
                      </span>
                    </div>

                    {req.note && (
                      <div className="p-3 rounded-xl bg-black/30 border border-white/5 text-xs text-[#E8EEF2]">
                        ملاحظة الطالب: {req.note}
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={async () => {
                            const res = await approveFinancialLinkRequest(req.id);
                            setFinLinkActionFeedback({
                              type: res.success ? 'success' : 'error',
                              text: res.message,
                            });
                          }}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-[#35D6C5] hover:bg-[#2bc2b2] text-[#0A0D12] font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>موافقة وربط السجل بحساب الطالب</span>
                        </button>
                        <button
                          onClick={async () => {
                            const res = await rejectFinancialLinkRequest(
                              req.id,
                              'يرجى التأكد من مطابقة الاسم الثلاثي مع السجل الرسمي'
                            );
                            setFinLinkActionFeedback({
                              type: res.success ? 'success' : 'error',
                              text: res.message,
                            });
                          }}
                          className="py-2.5 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رفض</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Student-Submitted Pending Payments Verification */}
          <div className="rounded-3xl bg-[#101827] border border-[#D7B875]/30 p-6 space-y-6 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#D7B875]" />
                  <span>
                    الدفعات المرسلة قيد المراجعة ({studentPayments.filter((p) => p.verificationStatus === 'pending').length})
                  </span>
                </h2>
                <p className="text-xs text-[#929BAA]">
                  أي طلب تسديد يرسله الطالب من حسابه يبقى في حالة «قيد الانتظار» ولا يخصم من المتبقي إلا بعد تأكيد استلام المبلغ فعلياً من قِبل الإدارة.
                </p>
              </div>
            </div>

            {studentPayments.filter((p) => p.verificationStatus === 'pending').length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#0A0D12]/60 border border-white/5 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto opacity-60" />
                <p className="text-sm font-bold text-white">لا توجد دفعات معلقة بانتظار المراجعة</p>
                <p className="text-xs text-[#929BAA]">جميع طلبات التسديد تمت مراجعتها واعتمادها.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {studentPayments
                  .filter((p) => p.verificationStatus === 'pending')
                  .map((pay) => (
                    <div
                      key={pay.id}
                      className="p-5 rounded-2xl bg-[#142638]/80 border border-amber-500/40 space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[11px] font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300">
                            دفعة معلقة #{pay.receiptNumber}
                          </span>
                          <h3 className="text-base font-black text-white mt-1">{pay.studentName}</h3>
                          <p className="text-xs text-[#929BAA]">
                            التاريخ: {pay.date} {pay.time || ''} • الطريقة:{' '}
                            {pay.paymentMethod === 'cash' ? 'نقدي للجنة' : 'تحويل / إلكتروني'}
                          </p>
                        </div>
                        <div className="text-left">
                          <div className="text-lg font-black text-[#35D6C5]">
                            {formatIQD(pay.amountIQD)}
                          </div>
                          <span className="text-[10px] text-amber-300 font-bold">بانتظار التأكيد</span>
                        </div>
                      </div>

                      {pay.notes && (
                        <p className="text-xs text-[#E8EEF2] bg-black/30 p-2.5 rounded-xl border border-white/5">
                          {pay.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                        <button
                          onClick={async () => {
                            const res = await verifyStudentPayment(pay.id, true);
                            setFinLinkActionFeedback({
                              type: res.success ? 'success' : 'error',
                              text: res.message,
                            });
                          }}
                          className="flex-1 py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#0A0D12] font-black text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span>تأكيد الاستلام واعتماد الوصل</span>
                        </button>
                        <button
                          onClick={async () => {
                            const res = await voidStudentPayment(pay.id, 'لم يتم تأكيد استلام المبلغ');
                            setFinLinkActionFeedback({
                              type: res.success ? 'success' : 'error',
                              text: res.message,
                            });
                          }}
                          className="py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>رفض / إلغاء</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* 3. Payment Rules & Iraqi Electronic Payment Gateway Readiness */}
          <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Settings className="w-4 h-4 text-[#35D6C5]" />
                  <span>قواعد التسديد وإعدادات بوابات الدفع الإلكترونية (QiCard / ZainCash / Switch)</span>
                </h3>
                <p className="text-xs text-[#929BAA]">
                  تحكم بالحد الأدنى للدفعة وتفعيل طلبات التسديد من حساب الطالب أو ربط بوابة الدفع الرسمية عبر السيرفر.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-[#0A0D12]/80 border border-white/10 space-y-1.5">
                <span className="text-xs text-[#929BAA]">الحد الأدنى للدفعة الواحدة (د.ع)</span>
                <div className="text-lg font-black text-white">
                  {formatIQD(eventConfig.paymentGatewayConfig?.minPaymentAmountIQD || 5000)}
                </div>
                <p className="text-[11px] text-[#35D6C5]">السعر الكامل المعتمد: {formatIQD(35000)}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0D12]/80 border border-white/10 space-y-2">
                <span className="text-xs text-[#929BAA]">طلبات التسديد وإشعارات الدفع للطلاب</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">
                    {eventConfig.paymentGatewayConfig?.allowStudentCashRequest !== false
                      ? 'مفعّل للطلاب المسجلين'
                      : 'متوقف حالياً'}
                  </span>
                  <button
                    onClick={() => {
                      const current = eventConfig.paymentGatewayConfig?.allowStudentCashRequest !== false;
                      updateEventConfig({
                        ...eventConfig,
                        paymentGatewayConfig: {
                          allowStudentCashRequest: !current,
                          allowInstallments: eventConfig.paymentGatewayConfig?.allowInstallments ?? true,
                          minPaymentAmountIQD: eventConfig.paymentGatewayConfig?.minPaymentAmountIQD ?? 5000,
                          electronicGatewayEnabled: eventConfig.paymentGatewayConfig?.electronicGatewayEnabled ?? false,
                          gatewayProviderName:
                            eventConfig.paymentGatewayConfig?.gatewayProviderName ??
                            'QiCard / ZainCash / Switch',
                          gatewayWebhookConfigured:
                            eventConfig.paymentGatewayConfig?.gatewayWebhookConfigured ?? false,
                          committeePaymentInstructions:
                            eventConfig.paymentGatewayConfig?.committeePaymentInstructions ??
                            'يرجى تسليم المبلغ للجنة التنظيم وتدوين رقم الوصل لتأكيد الدفعة في حسابك.',
                        },
                      });
                      setFinLinkActionFeedback({
                        type: 'success',
                        text: 'تم تحديث حالة استقبال طلبات التسديد من حسابات الطلاب',
                      });
                    }}
                    className="px-3 py-1 rounded-lg bg-[#35D6C5]/15 text-[#35D6C5] hover:bg-[#35D6C5]/25 text-xs font-bold"
                  >
                    تبديل الحالة
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0D12]/80 border border-white/10 space-y-2">
                <span className="text-xs text-[#929BAA]">حالة الربط المباشر لبوابة البطاقات</span>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300">
                    {eventConfig.paymentGatewayConfig?.electronicGatewayEnabled
                      ? 'مفعّل عبر المزود'
                      : 'وضع الأمان (تأكيد يدوي للوصولات)'}
                  </span>
                </div>
                <p className="text-[10px] text-[#929BAA]">
                  لا يتم تخزين أي أرقام بطاقات أو رموز CVV داخل المتصفح أو قاعدة البيانات نهائياً.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MUSIC LIBRARY MANAGEMENT (MULTI-FILE PHONE UPLOAD & FIREBASE PERSISTENCE) */}
      {activeAdminTab === 'music_library' && <AdminMusicManagementSection />}

      {/* TAB: STUDENT LOGIN STATISTICS & ACCOUNTS (إحصائيات الطلاب وسجل الدخول) */}
      {activeAdminTab === 'logged_in_users' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#101827] border border-[#35D6C5]/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  إحصائيات الطلاب وسجل الحسابات ({loggedInUsers.length})
                </h2>
              </div>
              <p className="text-xs text-[#929BAA] leading-relaxed max-w-2xl">
                إحصائيات دقيقة ومباشرة لجميع الحسابات والطلبة المسجلين، مع التمييز الواضح بين إجمالي الحسابات والطلبة الذين دخلوا المنصة فعلياً وتوقيت آخر دخول.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={loggedUsersSearch}
                  onChange={(e) => setLoggedUsersSearch(e.target.value)}
                  placeholder="بحث بالاسم أو الإيميل أو الموبايل..."
                  className="w-full bg-[#090E17] border border-white/15 rounded-xl py-2 pr-9 pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
                />
              </div>
              <button
                onClick={() => refreshLoggedInUsers()}
                className="px-3.5 py-2 rounded-xl bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] font-bold text-xs border border-[#35D6C5]/30 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {/* KPI Statistics Summary Cards */}
          {(() => {
            const nowTime = Date.now();
            const sevenDaysAgo = nowTime - 7 * 24 * 60 * 60 * 1000;
            const todayIso = new Date().toISOString().split('T')[0];

            const totalAccounts = loggedInUsers.length;
            const actualLoggedIn = loggedInUsers.filter(
              (u) => Boolean(u.lastLoginAt) || u.hasEverLoggedIn
            ).length;
            const activeRecently = loggedInUsers.filter((u) => {
              if (!u.lastLoginAt) return false;
              const t = new Date(u.lastLoginAt).getTime();
              return !isNaN(t) && t >= sevenDaysAgo;
            }).length;
            const todayLogins = loggedInUsers.filter((u) => {
              if (!u.lastLoginAt) return false;
              return u.lastLoginAt.startsWith(todayIso);
            }).length;

            return (
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
                <div className="p-4 rounded-2xl bg-[#101827] border border-[#35D6C5]/30 shadow-lg space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">إجمالي الحسابات المسجلة</span>
                  <div className="text-xl sm:text-2xl font-black text-white">{totalAccounts}</div>
                  <span className="text-[10px] text-[#35D6C5]">حسابات مسجلة بالمنصة</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101827] border border-emerald-500/30 shadow-lg space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">الطلاب الذين سجلوا الدخول</span>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400">{actualLoggedIn}</div>
                  <span className="text-[10px] text-emerald-300">سجلوا دخولهم فعلياً</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101827] border border-[#D6B777]/30 shadow-lg space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">النشطون مؤخراً (7 أيام)</span>
                  <div className="text-xl sm:text-2xl font-black text-[#D6B777]">{activeRecently}</div>
                  <span className="text-[10px] text-amber-200">نشاط الأسبوع الجاري</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101827] border border-cyan-500/30 shadow-lg space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">تسجيلات الدخول اليوم</span>
                  <div className="text-xl sm:text-2xl font-black text-cyan-400">{todayLogins}</div>
                  <span className="text-[10px] text-cyan-300">نشاط اليوم الفعلي</span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101827] border border-amber-500/30 shadow-lg space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">طلبات الإشراف</span>
                  <div className="text-xl sm:text-2xl font-black text-amber-400">{moderatorRequests.length}</div>
                  <span className="text-[10px] text-amber-300">
                    {moderatorRequests.filter((r) => r.status === 'pending').length} قيد المراجعة
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-[#101827] border border-purple-500/30 shadow-lg space-y-1">
                  <span className="text-[11px] font-bold text-slate-400">الأغاني المرفوعة</span>
                  <div className="text-xl sm:text-2xl font-black text-purple-400">{songs.length}</div>
                  <span className="text-[10px] text-purple-300">في مكتبة التخرج</span>
                </div>
              </div>
            );
          })()}

          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'جميع الحسابات', count: loggedInUsers.length },
              {
                id: 'super_admin',
                label: 'مدير النظام',
                count: loggedInUsers.filter((u) => u.role === 'super_admin' || u.role === 'admin').length,
              },
              {
                id: 'moderator',
                label: 'المشرفون المعتمدون',
                count: loggedInUsers.filter((u) => u.role === 'moderator').length,
              },
              {
                id: 'student',
                label: 'الطلاب',
                count: loggedInUsers.filter((u) => u.role !== 'super_admin' && u.role !== 'admin' && u.role !== 'moderator').length,
              },
            ].map((pill) => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setLoggedUsersRoleFilter(pill.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  loggedUsersRoleFilter === pill.id
                    ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5] font-black'
                    : 'bg-[#101827] text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                <span>{pill.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {pill.count}
                </span>
              </button>
            ))}
          </div>

          {/* Privacy & Historical Data Clarification Notice */}
          <div className="p-4 rounded-2xl bg-[#090E17] border border-white/10 flex items-start gap-3 text-xs text-slate-300">
            <Info className="w-5 h-5 text-[#35D6C5] shrink-0 mt-0.5" />
            <div className="space-y-1 leading-relaxed">
              <span className="font-bold text-white block">ملاحظة أمنية حول تسجيل البيانات:</span>
              <p>
                يتم تسجيل توقيت الدخول تلقائياً وبشكل آمن عند كل عملية دخول. الحسابات القديمة تظهر التواريخ المتاحة بدقة، ولا يمكن اختلاق بيانات سابقة غير متوفرة. تقتصر هذه الإحصائيات على إدارة المنصة فقط لحماية خصوصية الطلبة، ولا يتم عرض كلمات مرور أو بيانات سرية.
              </p>
            </div>
          </div>

          {userRoleFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-center justify-between gap-2.5 text-xs font-bold ${
                userRoleFeedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-200 border border-red-500/30'
              }`}
            >
              <div className="flex items-center gap-2">
                {userRoleFeedback.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                )}
                <span>{userRoleFeedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setUserRoleFeedback(null)}
                className="text-xs underline opacity-80 hover:opacity-100"
              >
                إغلاق
              </button>
            </div>
          )}

          {loggedInUsers.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#101827] border border-white/5 space-y-3">
              <Users className="w-12 h-12 text-[#35D6C5]/40 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد بيانات حالياً</h3>
              <p className="text-xs text-[#929BAA] max-w-md mx-auto">
                ستظهر هنا تلقائياً جميع الحسابات فور تسجيل دخول أي طالب أو زائر عبر Google أو رقم الموبايل.
              </p>
            </div>
          ) : (
            <div className="rounded-3xl bg-[#101827] border border-white/10 overflow-hidden shadow-2xl">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-[#090E17] border-b border-white/10 text-slate-300 font-bold">
                    <tr>
                      <th className="py-3.5 px-4">الاسم الظاهر</th>
                      <th className="py-3.5 px-4">طريقة الدخول</th>
                      <th className="py-3.5 px-4">
                        {isSuperAdmin ? 'البريد الإلكتروني أو رقم الموبايل' : 'رقم الموبايل / خصوصية البريد'}
                      </th>
                      <th className="py-3.5 px-4">الصلاحية</th>
                      <th className="py-3.5 px-4">معرف المستخدم (UID)</th>
                      <th className="py-3.5 px-4">تاريخ التسجيل</th>
                      <th className="py-3.5 px-4">تاريخ ووقت آخر دخول</th>
                      <th className="py-3.5 px-4 text-center">إدارة الصلاحيات / التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loggedInUsers
                      .filter((u) => {
                        const matchRole =
                          loggedUsersRoleFilter === 'all' ||
                          (loggedUsersRoleFilter === 'super_admin' && (u.role === 'super_admin' || u.role === 'admin')) ||
                          (loggedUsersRoleFilter === 'moderator' && u.role === 'moderator') ||
                          (loggedUsersRoleFilter === 'student' && u.role !== 'super_admin' && u.role !== 'admin' && u.role !== 'moderator');
                        if (!matchRole) return false;
                        if (!loggedUsersSearch.trim()) return true;
                        const q = loggedUsersSearch.toLowerCase();
                        return (
                          (u.displayName || '').toLowerCase().includes(q) ||
                          (isSuperAdmin && (u.email || '').toLowerCase().includes(q)) ||
                          (u.phoneNumber || '').includes(q) ||
                          (u.uid || '').toLowerCase().includes(q)
                        );
                      })
                      .map((acc) => (
                        <tr
                          key={acc.uid}
                          onClick={() => {
                            setSelectedUserAccount(acc);
                            setConfirmRoleAction(null);
                          }}
                          className="hover:bg-white/[0.04] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-black text-white">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-[#35D6C5]/15 text-[#35D6C5] flex items-center justify-center font-black shrink-0">
                                {(acc.displayName || 'م').charAt(0)}
                              </div>
                              <div>
                                <span className="hover:text-[#35D6C5] transition-colors block">
                                  {acc.displayName || 'مستخدم مسجل'}
                                </span>
                                <span className="text-[10px] text-slate-400 font-normal">
                                  اضغط لعرض التفاصيل وإدارة الصلاحيات
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
                                acc.loginMethod === 'phone'
                                  ? 'bg-[#5CE1E6]/15 text-[#5CE1E6] border-[#5CE1E6]/30'
                                  : acc.loginMethod === 'email'
                                  ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              }`}
                            >
                              {acc.loginMethod === 'phone'
                                ? 'رقم الموبايل (SMS)'
                                : acc.loginMethod === 'email'
                                ? 'البريد وكلمة المرور'
                                : 'Google'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-200" dir="ltr">
                            {isSuperAdmin ? (
                              acc.phoneNumber || acc.email || '—'
                            ) : (
                              <span
                                className="inline-flex items-center gap-1 text-slate-400 text-[11px] font-sans"
                                dir="rtl"
                              >
                                <Lock className="w-3 h-3 text-[#D6B777]" />
                                <span>
                                  {acc.phoneNumber || 'البريد محجوب (للمشرف الرئيسي فقط)'}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            {acc.role === 'super_admin' || acc.role === 'admin' ? (
                              <span className="px-2 py-0.5 rounded-lg bg-[#D7B875]/20 text-[#D7B875] border border-[#D7B875]/35 text-[10px] font-bold">
                                المشرف العام
                              </span>
                            ) : acc.role === 'moderator' ? (
                              <span className="px-2 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/35 text-[10px] font-bold">
                                مشرف معتمد
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10 text-[10px] font-bold">
                                مستخدم / طالب
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400" dir="ltr">
                            {acc.uid}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]" dir="ltr">
                            {acc.createdAt
                              ? new Date(acc.createdAt).toLocaleString('ar-IQ', {
                                  dateStyle: 'short',
                                })
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-200 font-mono text-[11px]" dir="ltr">
                            {acc.lastLoginAt
                              ? new Date(acc.lastLoginAt).toLocaleString('ar-IQ', {
                                  dateStyle: 'short',
                                  timeStyle: 'short',
                                })
                              : '—'}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedUserAccount(acc);
                                setConfirmRoleAction(null);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] border border-[#35D6C5]/30 text-[11px] font-bold inline-flex items-center gap-1"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>تفاصيل / صلاحيات</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Interactive User Details & Role Promotion/Revocation Modal (Super Admin & Moderator View) */}
          {selectedUserAccount && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
              <div className="max-w-lg w-full rounded-3xl bg-[#101827] border border-[#35D6C5]/40 p-6 space-y-5 shadow-2xl text-right">
                <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#35D6C5]/20 border border-[#35D6C5]/40 text-[#35D6C5] flex items-center justify-center font-black text-lg shrink-0">
                      {(selectedUserAccount.displayName || 'م').charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {selectedUserAccount.displayName || 'مستخدم مسجل'}
                      </h3>
                      <span className="text-xs text-[#35D6C5] font-bold">
                        بطاقة تعريف الحساب وإدارة الصلاحيات (RBAC)
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUserAccount(null);
                      setConfirmRoleAction(null);
                    }}
                    className="text-slate-400 hover:text-white"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                {/* User Details Grid */}
                <div className="p-4 rounded-2xl bg-[#090E17] border border-white/10 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">الاسم الكامل:</span>
                    <span className="font-black text-white">
                      {selectedUserAccount.displayName || 'مستخدم مسجل'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">المعرف الفريد (UID):</span>
                    <span className="font-mono text-slate-200 text-[11px]" dir="ltr">
                      {selectedUserAccount.uid}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">البريد الإلكتروني:</span>
                    {isSuperAdmin ? (
                      <span className="font-mono text-[#35D6C5]" dir="ltr">
                        {selectedUserAccount.email || 'غير متوفر'}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[#D6B777] font-bold">
                        <Lock className="w-3.5 h-3.5" />
                        <span>محجوب (متاح للمشرف الرئيسي فقط)</span>
                      </span>
                    )}
                  </div>
                  {selectedUserAccount.phoneNumber && (
                    <div className="flex items-center justify-between border-b border-white/5 pb-2">
                      <span className="text-slate-400">رقم الهاتف:</span>
                      <span className="font-mono text-white" dir="ltr">
                        {selectedUserAccount.phoneNumber}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">تاريخ التسجيل بالمنصة:</span>
                    <span className="font-mono text-slate-200" dir="ltr">
                      {selectedUserAccount.createdAt
                        ? new Date(selectedUserAccount.createdAt).toLocaleString('ar-IQ')
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-400">حالة الحساب:</span>
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[11px]">
                      {selectedUserAccount.lastLoginAt ? 'نشط — دخل المنصة فعلياً' : 'حساب مسجل نشط'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">حالة الإشراف الحالية:</span>
                    {selectedUserAccount.role === 'super_admin' ||
                    selectedUserAccount.role === 'admin' ||
                    (selectedUserAccount.email &&
                      selectedUserAccount.email.toLowerCase() ===
                        'mustafaaalihassonkazh@gmail.com') ? (
                      <span className="px-2.5 py-0.5 rounded-lg bg-[#D7B875]/20 text-[#D7B875] border border-[#D7B875]/40 font-black text-[11px]">
                        المشرف العام الرئيسي (Super Admin)
                      </span>
                    ) : selectedUserAccount.role === 'moderator' ? (
                      <span className="px-2.5 py-0.5 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-black text-[11px]">
                        مشرف معتمد (Moderator)
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-300 font-bold text-[11px]">
                        طالب / مستخدم عادي (Student)
                      </span>
                    )}
                  </div>
                </div>

                {/* Role Promotion / Revocation Controls (Strictly Super Admin Only) */}
                {isSuperAdmin ? (
                  selectedUserAccount.role === 'super_admin' ||
                  (selectedUserAccount.email &&
                    selectedUserAccount.email.toLowerCase() ===
                      'mustafaaalihassonkazh@gmail.com') ? (
                    <div className="p-3.5 rounded-2xl bg-[#D7B875]/10 border border-[#D7B875]/30 text-xs text-[#D7B875] flex items-center gap-2 font-bold">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>
                        هذا الحساب هو المشرف العام الرئيسي للمنصة وهو محمي بشكل دائم من إلغاء الصلاحيات.
                      </span>
                    </div>
                  ) : confirmRoleAction === 'promote' ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 space-y-3 text-xs">
                      <div className="font-black text-emerald-300">
                        تأكيد ترقية «{selectedUserAccount.displayName}» إلى مشرف معتمد:
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        سيحصل هذا المستخدم على صلاحيات المشرف الكاملة في إدارة الطلبة والدفعات والأغاني والإعلانات (مع بقاء عناوين البريد الإلكتروني للمستخدمين محجوبة عنه).
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdatingUserRole}
                          onClick={async () => {
                            setIsUpdatingUserRole(true);
                            const res = await promoteUserToModerator({
                              uid: selectedUserAccount.uid,
                              displayName:
                                selectedUserAccount.displayName || 'مشرف معتمد',
                              email: selectedUserAccount.email,
                            });
                            setIsUpdatingUserRole(false);
                            setUserRoleFeedback({
                              type: res.success ? 'success' : 'error',
                              text: res.notice,
                            });
                            setConfirmRoleAction(null);
                            setSelectedUserAccount(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-400 to-teal-400 text-[#0A0D12] font-black shadow-lg"
                        >
                          {isUpdatingUserRole
                            ? 'جاري الترقية وتحديث الصلاحيات...'
                            : 'تأكيد الترقية إلى مشرف الآن'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRoleAction(null)}
                          className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold"
                        >
                          تراجع
                        </button>
                      </div>
                    </div>
                  ) : confirmRoleAction === 'revoke' ? (
                    <div className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 space-y-3 text-xs">
                      <div className="font-black text-red-300">
                        تأكيد إلغاء صلاحيات المشرف لـ «{selectedUserAccount.displayName}»:
                      </div>
                      <p className="text-slate-300 leading-relaxed">
                        سيتم سحب صلاحيات الإشراف فوراً من قاعدة البيانات (/admins و /user_accounts) وإعادة الحساب إلى رتبة طالب عادي.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={isUpdatingUserRole}
                          onClick={async () => {
                            setIsUpdatingUserRole(true);
                            const res = await revokeModeratorRole(
                              selectedUserAccount.uid
                            );
                            setIsUpdatingUserRole(false);
                            setUserRoleFeedback({
                              type: res.success ? 'success' : 'error',
                              text: res.notice,
                            });
                            setConfirmRoleAction(null);
                            setSelectedUserAccount(null);
                          }}
                          className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black shadow-lg"
                        >
                          {isUpdatingUserRole
                            ? 'جاري سحب الصلاحيات...'
                            : 'تأكيد إلغاء صلاحيات المشرف'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmRoleAction(null)}
                          className="px-4 py-2.5 rounded-xl bg-white/10 text-white font-bold"
                        >
                          تراجع
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
                      {selectedUserAccount.role !== 'moderator' ? (
                        <button
                          type="button"
                          onClick={() => setConfirmRoleAction('promote')}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#35D6C5] to-[#20B8A8] text-[#0A0D12] font-black text-xs shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>ترقية إلى مشرف</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmRoleAction('revoke')}
                          className="flex-1 py-2.5 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <UserX className="w-4 h-4" />
                          <span>إلغاء صلاحيات المشرف</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setSelectedUserAccount(null)}
                        className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold"
                      >
                        إغلاق
                      </button>
                    </div>
                  )
                ) : (
                  <div className="p-3.5 rounded-2xl bg-[#090E17] border border-[#D7B875]/30 text-xs text-[#D7B875] flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Lock className="w-4 h-4 shrink-0" />
                      <span>
                        صلاحية ترقية المستخدمين إلى مشرفين أو إلغاء صلاحياتهم محصورة بالمشرف العام الرئيسي فقط.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserAccount(null)}
                      className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-bold shrink-0"
                    >
                      إغلاق
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: MODERATOR MEMBERSHIP REQUESTS & APPROVAL (طلبات عضوية المشرفين) */}
      {activeAdminTab === 'moderator_requests' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#101827] border border-[#35D6C5]/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  طلبات عضوية المشرفين ({moderatorRequests.length})
                </h2>
              </div>
              <p className="text-xs text-[#929BAA] leading-relaxed max-w-2xl">
                مراجعة وتدقيق طلبات الطلبة الراغبين بالانضمام إلى فريق الإشراف. الموافقة تمنح صلاحيات المشرف رسمياً في قاعدة البيانات وتحديث دور الحساب، بينما يمنع الرفض أي صلاحيات إدارية.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchModQuery}
                  onChange={(e) => setSearchModQuery(e.target.value)}
                  placeholder="بحث باسم الطالب أو المعرف..."
                  className="w-full bg-[#090E17] border border-white/15 rounded-xl py-2 pr-9 pl-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
                />
              </div>
              <button
                onClick={() => refreshModeratorRequests()}
                className="px-3.5 py-2 rounded-xl bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] font-bold text-xs border border-[#35D6C5]/30 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>تحديث</span>
              </button>
            </div>
          </div>

          {/* Action Feedback Banner */}
          {modActionFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                modActionFeedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-200 border border-red-500/30'
              }`}
            >
              {modActionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{modActionFeedback.text}</span>
            </div>
          )}

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'all', label: 'كافة الطلبات', count: moderatorRequests.length },
              {
                id: 'pending',
                label: 'قيد المراجعة',
                count: moderatorRequests.filter((r) => r.status === 'pending').length,
              },
              {
                id: 'accepted',
                label: 'المقبولة (المشرفون)',
                count: moderatorRequests.filter((r) => r.status === 'accepted').length,
              },
              {
                id: 'rejected',
                label: 'المرفوضة',
                count: moderatorRequests.filter((r) => r.status === 'rejected').length,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterModStatus(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                  filterModStatus === tab.id
                    ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5] font-black'
                    : 'bg-[#101827] text-slate-300 border-white/10 hover:border-white/20'
                }`}
              >
                <span>{tab.label}</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/20">
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Requests Grid */}
          {moderatorRequests.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#101827] border border-white/5 space-y-3">
              <ShieldCheck className="w-12 h-12 text-[#35D6C5]/40 mx-auto" />
              <h3 className="text-base font-bold text-white">لا توجد طلبات إشراف حالياً</h3>
              <p className="text-xs text-[#929BAA] max-w-md mx-auto">
                عند قيام أي طالب بتقديم طلب انضمام لفريق الإشراف من حسابه، سيظهر هنا للتدقيق والموافقة أو الرفض.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {moderatorRequests
                .filter((r) => {
                  const matchStatus = filterModStatus === 'all' || r.status === filterModStatus;
                  const matchQuery =
                    !searchModQuery.trim() ||
                    r.userName.toLowerCase().includes(searchModQuery.toLowerCase()) ||
                    r.userId.toLowerCase().includes(searchModQuery.toLowerCase()) ||
                    (r.userEmail || '').toLowerCase().includes(searchModQuery.toLowerCase()) ||
                    (r.userPhone || '').includes(searchModQuery);
                  return matchStatus && matchQuery;
                })
                .map((req) => (
                  <div
                    key={req.id}
                    className="rounded-2xl bg-[#101827] border border-white/10 p-5 space-y-3.5 shadow-xl hover:border-[#35D6C5]/30 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-[#35D6C5]/15 text-[#35D6C5] flex items-center justify-center font-black text-sm shrink-0">
                            {req.userName.charAt(0)}
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-white">{req.userName}</h3>
                            <span className="text-[10px] font-mono text-slate-400 block" dir="ltr">
                              UID: {req.userId}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 ${
                            req.status === 'accepted'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : req.status === 'rejected'
                              ? 'bg-red-500/15 text-red-300 border-red-500/30'
                              : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          }`}
                        >
                          {req.status === 'accepted'
                            ? 'مقبول (مشرف معتمد)'
                            : req.status === 'rejected'
                            ? 'مرفوض'
                            : 'قيد المراجعة'}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-[#090E17] border border-white/5 space-y-1 text-xs">
                        {req.userPhone && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">الهاتف:</span>
                            <span className="font-mono text-white" dir="ltr">{req.userPhone}</span>
                          </div>
                        )}
                        {isSuperAdmin && req.userEmail && (
                          <div className="flex items-center justify-between text-slate-300">
                            <span className="text-slate-400">البريد:</span>
                            <span className="font-mono text-white" dir="ltr">{req.userEmail}</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">تاريخ الطلب:</span>
                          <span className="text-white">{formatArabicDate(req.requestedAt)}</span>
                        </div>
                      </div>

                      {req.note && (
                        <div className="p-2.5 rounded-xl bg-white/5 text-xs text-slate-200">
                          <span className="text-slate-400 block text-[10.5px] font-bold mb-0.5">سبب الرغبة / مجال المساهمة:</span>
                          <p className="leading-relaxed">{req.note}</p>
                        </div>
                      )}

                      {req.adminNote && (
                        <div className="p-2 rounded-xl bg-red-950/20 border border-red-500/20 text-xs text-red-300">
                          <span className="font-bold block text-[10.5px]">ملاحظة الإدارة:</span>
                          <p>{req.adminNote}</p>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-2">
                      {req.status !== 'accepted' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModReq(req);
                            setModDecision('accept');
                          }}
                          className="flex-1 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-[#0A0D12] font-black text-xs shadow-md shadow-emerald-500/20 hover:opacity-95 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>قبول ومنح صلاحية مشرف</span>
                        </button>
                      )}

                      {req.status !== 'rejected' && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedModReq(req);
                            setModDecision('reject');
                            setModRejectReason('');
                          }}
                          className="px-3 py-2 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>رفض</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* In-app Confirmation Modal for Accept/Reject */}
          {selectedModReq && modDecision && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
              <div className="max-w-md w-full rounded-3xl bg-[#101827] border border-[#35D6C5]/40 p-6 space-y-4 shadow-2xl text-right">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      modDecision === 'accept'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {modDecision === 'accept' ? (
                      <ShieldCheck className="w-6 h-6" />
                    ) : (
                      <UserX className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">
                      {modDecision === 'accept' ? 'تأكيد قبول عضوية المشرف' : 'تأكيد رفض طلب العضوية'}
                    </h3>
                    <p className="text-xs text-slate-400">الطالب: {selectedModReq.userName}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#090E17] border border-white/10 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  {modDecision === 'accept' ? (
                    <>
                      <p className="font-bold text-emerald-400">إجراء أمني وقانوني:</p>
                      <p>
                        سيتم منح الطالب «{selectedModReq.userName}» صلاحية مشرف حفل رسمي وتحديث دوره في قاعدة البيانات السحابية (/admins و /user_accounts).
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-red-400">تأكيد الرفض:</p>
                      <p>
                        لن يتم منح الطالب أي صلاحيات إدارية، وسيبقى حسابه كطالب عادي دون وصول إلى لوحة الإدارة.
                      </p>
                    </>
                  )}
                </div>

                {modDecision === 'reject' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">سبب الرفض (اختياري للعرض للطالب):</label>
                    <input
                      type="text"
                      value={modRejectReason}
                      onChange={(e) => setModRejectReason(e.target.value)}
                      placeholder="مثال: اكتفاء الكادر التنظيمي، شروط غير مستوفاة..."
                      className="w-full bg-[#090E17] border border-white/15 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
                    />
                  </div>
                )}

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isProcessingModAction}
                    onClick={async () => {
                      setIsProcessingModAction(true);
                      setModActionFeedback(null);
                      if (modDecision === 'accept') {
                        const res = await approveModeratorRequest(selectedModReq.id);
                        setModActionFeedback({
                          type: res.success ? 'success' : 'error',
                          text: res.notice,
                        });
                      } else {
                        const res = await rejectModeratorRequest(selectedModReq.id, modRejectReason);
                        setModActionFeedback({
                          type: res.success ? 'success' : 'error',
                          text: res.notice,
                        });
                      }
                      setIsProcessingModAction(false);
                      setSelectedModReq(null);
                      setModDecision(null);
                      await refreshModeratorRequests();
                      await refreshLoggedInUsers();
                    }}
                    className={`flex-1 py-2.5 rounded-xl font-black text-xs text-[#0A0D12] shadow-lg transition-all cursor-pointer ${
                      modDecision === 'accept'
                        ? 'bg-gradient-to-r from-emerald-400 to-teal-400'
                        : 'bg-red-400 hover:bg-red-500 text-white'
                    }`}
                  >
                    {isProcessingModAction ? 'جاري المعالجة...' : 'تأكيد القرار'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModReq(null);
                      setModDecision(null);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB: SUPERVISORS MANAGEMENT (إدارة المشرفين والصلاحيات) */}
      {activeAdminTab === 'supervisors_management' && (
        <div className="space-y-6">
          {/* Cohort Organizing Team List (قائمة الإشراف وفريق تنظيم دفعة 2027) */}
          <div className="rounded-3xl bg-[#101827] border border-[#D7B875]/35 p-6 space-y-4 shadow-xl">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  قائمة الإشراف وفريق تنظيم دفعة 2027
                </h3>
                <p className="text-xs text-[#929BAA]">
                  أعضاء فريق تنظيم الدفعة الظاهرون في صفحة التواصل وقائمة الإشراف
                </p>
              </div>
              <span className="px-3 py-1 rounded-xl bg-[#D7B875]/15 border border-[#D7B875]/35 text-[#D7B875] text-xs font-extrabold">
                {(eventConfig.organizers || []).length} منظمين في القائمة
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(eventConfig.organizers && eventConfig.organizers.length > 0
                ? eventConfig.organizers
                : [
                    {
                      id: 'org-1',
                      name: 'مصطفى علي حسون',
                      role: 'فريق تنظيم دفعة 2027',
                      instagram: 'https://www.instagram.com/mustafaa.hassoun?igsh=MTlvbG9rZjhxcm1kZA==',
                    },
                    {
                      id: 'org-2',
                      name: 'مصطفى أركان ساجت',
                      role: 'فريق تنظيم دفعة 2027',
                      instagram: 'https://www.instagram.com/t__suf?igsh=MWI3N2c1b3FkbXdsdA==',
                    },
                    {
                      id: 'org-4',
                      name: 'علي أكبر حسين عبيد',
                      role: 'فريق تنظيم دفعة 2027',
                      instagram: 'https://www.instagram.com/4hll0_/',
                    },
                  ]
              ).map((org) => (
                <div
                  key={org.id}
                  className="p-4 rounded-2xl bg-[#090E17] border border-white/10 flex flex-col justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#35D6C5]/15 border border-[#35D6C5]/35 text-[#35D6C5] flex items-center justify-center font-black text-sm shrink-0">
                      {org.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white">{org.name}</h4>
                      <span className="text-[11px] text-[#D7B875] font-bold">
                        {org.role || 'فريق تنظيم دفعة 2027'}
                      </span>
                    </div>
                  </div>
                  {org.instagram && (
                    <a
                      href={org.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-2 px-3 rounded-xl bg-white/5 hover:bg-[#35D6C5]/15 text-[#A6F0DF] border border-white/10 hover:border-[#35D6C5]/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#35D6C5]" />
                      <span>حساب الإنستغرام للتواصل</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl bg-[#101827] border border-[#35D6C5]/30 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#D7B875]/20 text-[#D7B875] flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white">
                  حسابات المشرفين وصلاحيات لوحة التحكم ({supervisors.length})
                </h2>
              </div>
              <p className="text-xs text-[#929BAA] leading-relaxed max-w-2xl">
                قائمة حسابات المشرفين المعتمدين في قاعدة البيانات. يحق للمشرف العام مراجعة صلاحيات المشرفين أو إلغاء الإشراف وإعادة الحساب إلى رتبة طالب.
              </p>
            </div>

            <button
              onClick={() => refreshSupervisors()}
              className="px-4 py-2 rounded-xl bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] font-bold text-xs border border-[#35D6C5]/30 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>تحديث القائمة</span>
            </button>
          </div>

          {modActionFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                modActionFeedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-200 border border-red-500/30'
              }`}
            >
              {modActionFeedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{modActionFeedback.text}</span>
            </div>
          )}

          {!isSuperAdmin && (
            <div className="p-4 rounded-2xl bg-[#090E17] border border-[#D7B875]/30 flex items-center gap-3 text-xs text-[#D7B875]">
              <Lock className="w-4 h-4 shrink-0" />
              <span>أنت تتصفح القائمة بصفتك مشرفاً في فريق التنظيم. صلاحية ترقية أو إلغاء إشراف المشرفين الآخرين محصورة بالمشرف العام فقط.</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {supervisors.map((sup) => {
              const isRootAdmin =
                sup.role === 'super_admin' ||
                sup.email.toLowerCase() === 'mustafaaalihassonkazh@gmail.com';
              return (
                <div
                  key={sup.userId}
                  className="rounded-2xl bg-[#101827] border border-white/10 p-5 flex flex-col justify-between gap-4 shadow-xl"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                            isRootAdmin
                              ? 'bg-[#D7B875]/20 text-[#D7B875] border border-[#D7B875]/40'
                              : 'bg-[#35D6C5]/15 text-[#35D6C5] border border-[#35D6C5]/30'
                          }`}
                        >
                          {(sup.fullName || 'م').charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-sm font-black text-white">{sup.fullName}</h3>
                          <span className="text-[11px] font-mono text-slate-400 block" dir="ltr">
                            {isSuperAdmin ? sup.email || sup.userId : `UID: ${sup.userId}`}
                          </span>
                        </div>
                      </div>

                      <span
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border shrink-0 ${
                          isRootAdmin
                            ? 'bg-[#D7B875]/20 text-[#D7B875] border-[#D7B875]/40'
                            : 'bg-[#35D6C5]/15 text-[#35D6C5] border-[#35D6C5]/30'
                        }`}
                      >
                        {isRootAdmin ? 'المشرف العام الأساسي' : 'مشرف معتمد'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[#090E17] border border-white/5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span className="text-slate-400">المعرف (UID):</span>
                        <span className="font-mono text-[11px] text-white" dir="ltr">
                          {sup.userId}
                        </span>
                      </div>
                      {sup.createdAt && (
                        <div className="flex items-center justify-between text-slate-300">
                          <span className="text-slate-400">تاريخ الاعتماد:</span>
                          <span className="text-white">{formatArabicDate(sup.createdAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {isSuperAdmin && !isRootAdmin && (
                    <div className="pt-2 border-t border-white/10 flex justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setRevokeTargetSup({
                            userId: sup.userId,
                            fullName: sup.fullName,
                            email: sup.email,
                          })
                        }
                        className="w-full py-2 px-3 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        <span>إلغاء صلاحية الإشراف</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirmation Modal for Revoking Moderator Role */}
          {revokeTargetSup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
              <div className="max-w-md w-full rounded-3xl bg-[#101827] border border-red-500/40 p-6 space-y-4 shadow-2xl text-right">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                    <UserX className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white">تأكيد إلغاء صلاحية الإشراف</h3>
                    <p className="text-xs text-slate-400">المشرف: {revokeTargetSup.fullName}</p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#090E17] border border-white/10 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                  <p className="font-bold text-red-400">تنبيه أمني:</p>
                  <p>
                    سيتم سحب صلاحيات الإشراف من «{revokeTargetSup.fullName}» فوراً من قاعدة البيانات (/admins) وإعادة حسابه إلى رتبة طالب عادي (student)، مع إرسال إشعار فوري له.
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    disabled={isProcessingModAction}
                    onClick={async () => {
                      setIsProcessingModAction(true);
                      setModActionFeedback(null);
                      const res = await revokeModeratorRole(revokeTargetSup.userId);
                      setModActionFeedback({
                        type: res.success ? 'success' : 'error',
                        text: res.notice,
                      });
                      setIsProcessingModAction(false);
                      setRevokeTargetSup(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg transition-all cursor-pointer"
                  >
                    {isProcessingModAction ? 'جاري التنفيذ...' : 'تأكيد إلغاء الإشراف'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRevokeTargetSup(null)}
                    className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 text-xs font-bold cursor-pointer"
                  >
                    تراجع
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 0: PROTECTED STUDENT REGISTRATION REVIEW SCREEN (REQUIREMENTS 4, 5, 6, 7) */}
      {activeAdminTab === 'pending_requests' && (
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-lg font-black text-white">
                  طلبات التسجيل السحابية المعلقة ({pendingRegistrationRequests.length})
                </h2>
              </div>
              <p className="text-xs text-[#929BAA] mt-1 max-w-2xl leading-relaxed">
                إنفاذاً لقواعد الأمان الصارمة: لا يحصل أي طالب على صلاحيات الخريج أو الوصولات المالية إلا بعد التحقق والاعتماد المباشر من قِبل مسؤول معتمد.
              </p>
            </div>

            <button
              onClick={() => refreshPendingRequests()}
              className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs border border-white/10 flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#21D4C2]" />
              <span>تحديث القائمة من السحابة</span>
            </button>
          </div>

          {reviewActionFeedback && (
            <div className="p-4 rounded-2xl bg-[#21D4C2]/15 border border-[#21D4C2]/30 text-xs text-[#21D4C2] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{reviewActionFeedback}</span>
            </div>
          )}

          {pendingRegistrationRequests.length === 0 ? (
            <div className="text-center py-16 rounded-3xl bg-[#101827] border border-white/5 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white">لا توجد بيانات حالياً</h3>
              <p className="text-xs text-[#929BAA] max-w-md mx-auto">
                لا توجد طلبات تسجيل معلقة حالياً. كافة الطلبات تمت مراجعتها أو لم يقم طلبة جدد بتقديم طلبات بعد.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRegistrationRequests.map((req) => {
                // Find matching advance cash payments by reliable identifier (Student ID or Phone Number - NEVER name alone)
                const matchedCash = payments.filter((p) => {
                  const matchPhone =
                    req.phoneNumber &&
                    p.studentPhone &&
                    p.studentPhone.replace(/[^0-9]/g, '') === req.phoneNumber.replace(/[^0-9]/g, '');
                  const matchId =
                    req.studentId &&
                    p.studentId &&
                    p.studentId.trim().toLowerCase() === req.studentId.trim().toLowerCase();
                  return (matchPhone || matchId) && !p.isLinked;
                });

                const totalMatchedAmount = matchedCash.reduce((sum, p) => sum + p.amountIQD, 0);

                return (
                  <div
                    key={req.userId}
                    className="rounded-3xl bg-[#101827] border border-white/10 hover:border-amber-500/40 transition-all p-6 shadow-xl space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-white/5 pb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-300 font-black text-lg flex items-center justify-center shrink-0">
                          {req.fullName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-base font-black text-white">{req.fullName}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#21D4C2]/15 text-[#21D4C2] border border-[#21D4C2]/30">
                              {req.preferredTitle === 'nurse_f' ? 'الممرضة' : 'الممرض'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                              قيد المراجعة
                            </span>
                          </div>
                          <p className="text-xs text-[#929BAA] mt-0.5" dir="ltr">
                            {isSuperAdmin ? req.email : 'البريد محجوب (للمشرف الرئيسي فقط)'}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-[#929BAA] font-mono">
                        تاريخ التقديم: {new Date(req.createdAt).toLocaleDateString('ar-IQ')}
                      </div>
                    </div>

                    {/* Request Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[#929BAA] block text-[11px]">رقم القيد الجامعي:</span>
                        <span className="text-white font-bold">
                          {req.studentId ? (
                            <span className="text-emerald-400 font-mono">{req.studentId}</span>
                          ) : (
                            <span className="text-gray-400">بدون رقم قيد (مسموح)</span>
                          )}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[#929BAA] block text-[11px]">رقم الهاتف المخزن بالملف:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono font-bold" dir="ltr">
                            {req.phoneNumber}
                          </span>
                          <span className="text-[9px] bg-white/10 text-gray-400 px-1.5 py-0.2 rounded">
                            حقل بالملف (غير موثق بـ OTP)
                          </span>
                        </div>
                      </div>

                      <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                        <span className="text-[#929BAA] block text-[11px]">الدفعة وسنة التخرج:</span>
                        <span className="text-[#D6B779] font-bold">دفعة 2027</span>
                      </div>
                    </div>

                    {/* Advance Cash Matching Result (Requirement 7) */}
                    <div className="p-4 rounded-2xl border text-xs transition-all bg-[#090B10]">
                      {matchedCash.length > 0 ? (
                        <div className="space-y-2 border-emerald-500/30">
                          <div className="flex items-center gap-2 text-emerald-400 font-bold">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>
                              تم العثور على {matchedCash.length} سند قبض كاش مسبق بمطابقة موثقة ({matchedCash[0].studentPhone ? 'رقم الهاتف' : 'رقم القيد'})!
                            </span>
                          </div>
                          <p className="text-[#929BAA] leading-relaxed">
                            المبلغ الإجمالي المسدد مسبقاً: <strong className="text-white">{formatIQD(totalMatchedAmount)}</strong> عبر الوصولات ({matchedCash.map((m) => m.receiptNumber).join(', ')}). سيتم ربط هذه الدفعات وتحديث سجل الخريج المالي فور الضغط على (قبول واعتماد).
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-[#929BAA]">
                          <Info className="w-4 h-4 text-[#D6B777] shrink-0" />
                          <span>
                            لم يتم العثور على سندات كاش مسبقة برقم هذا الهاتف أو رقم القيد. سيبدأ حساب الطالب بدون دفعات مسجلة لحين تسديد الدفعة الأولى.
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Admin Actions: Approve or Reject */}
                    <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-white/5">
                      <button
                        disabled={isProcessingReview}
                        onClick={async () => {
                          setIsProcessingReview(true);
                          setReviewActionFeedback(null);
                          const res = await approveStudentRegistration(req);
                          setIsProcessingReview(false);
                          setReviewActionFeedback(res.message);
                        }}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                      >
                        <UserCheck className="w-4 h-4" />
                        <span>قبول واعتماد حساب الخريج</span>
                      </button>

                      <button
                        disabled={isProcessingReview}
                        onClick={() => {
                          setRejectModalReq(req);
                          setRejectionReasonText('');
                        }}
                        className="px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold text-xs border border-red-500/20 flex items-center gap-1.5 transition-colors"
                      >
                        <UserX className="w-4 h-4" />
                        <span>رفض الطلب مع بيان السبب</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Modal for Rejection Reason */}
      {rejectModalReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#101827] border border-red-500/30 p-6 space-y-4 shadow-2xl text-right">
            <div className="flex items-center gap-2.5 text-red-400">
              <UserX className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">
                تأكيد رفض طلب التسجيل لـ ({rejectModalReq.fullName})
              </h3>
            </div>

            <p className="text-xs text-[#929BAA]">
              يرجى كتابة سبب الرفض الموجه للطالب (اختياري، يظهر للطالب عند محاولة الدخول):
            </p>

            <textarea
              rows={3}
              value={rejectionReasonText}
              onChange={(e) => setRejectionReasonText(e.target.value)}
              placeholder="مثال: الاسم غير مطابق للقوائم الرسمية المعتمدة لدفعة 2027، أو يرجى مراجعة ممثل الدفعة..."
              className="w-full bg-[#090B10] border border-white/10 rounded-xl p-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-red-500"
            />

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalReq(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
              >
                إلغاء
              </button>

              <button
                disabled={isProcessingReview}
                onClick={async () => {
                  setIsProcessingReview(true);
                  const res = await rejectStudentRegistration(
                    rejectModalReq.userId,
                    rejectionReasonText
                  );
                  setIsProcessingReview(false);
                  setRejectModalReq(null);
                  setReviewActionFeedback(res.message);
                }}
                className="px-5 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-red-500/20"
              >
                <UserX className="w-4 h-4" />
                <span>تأكيد الرفض</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: OVERVIEW & FINANCIAL STATS */}
      {activeAdminTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-[#101827] border border-indigo-500/30 space-y-2 shadow-lg">
              <span className="text-xs text-indigo-300 font-bold">مقبوضات حفلة السكراب</span>
              <div className="text-2xl font-black text-white font-mono">
                {formatIQD(totalScrubCollected)}
              </div>
              <p className="text-[11px] text-indigo-200">
                إجمالي المبالغ المدفوعة الموثقة لحفلة السكراب
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#101827] border border-[#35D6C5]/30 space-y-2 shadow-lg">
              <span className="text-xs text-[#35D6C5] font-bold">مقبوضات حفل التخرج الرسمي</span>
              <div className="text-2xl font-black text-white font-mono">
                {formatIQD(totalGradCollected)}
              </div>
              <p className="text-[11px] text-[#35D6C5]">
                إجمالي المبالغ المدفوعة الموثقة لحفل التخرج
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#101827] border border-[#D6B779]/30 space-y-2 shadow-lg">
              <span className="text-xs text-[#D6B779] font-bold">إجمالي الصندوق النقدي (كاش)</span>
              <div className="text-2xl font-black text-[#D6B779] font-mono">
                {formatIQD(totalCashCollected)}
              </div>
              <p className="text-[11px] text-[#929BAA]">
                مجموع ما تم قبضه للفعاليتين معاً
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-[#101827] border border-white/10 space-y-2 shadow-lg">
              <span className="text-xs text-white font-bold">الخريجون المسجلون</span>
              <div className="text-2xl font-black text-white font-mono">
                {totalRegistered}
              </div>
              <p className="text-[11px] text-[#929BAA]">
                {approvedGraduates} معتمد • {pendingRequests} قيد المراجعة
              </p>
            </div>
          </div>

          {/* Backup & Export Bar */}
          <div className="p-5 rounded-3xl bg-[#101827] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div>
              <h3 className="text-sm font-bold text-white">النسخ الاحتياطي وتصدير البيانات</h3>
              <p className="text-xs text-[#929BAA]">
                تصدير كافة قوائم الخريجين والمقبوضات النقدية إلى ملفات إكسل CSV أو نسخة JSON كاملة.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  const csv = LocalStorageManager.exportGraduatesCSV();
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Graduates_Nursing_Cohort_2027.csv`;
                  a.click();
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير الخريجين (CSV)</span>
              </button>
              <button
                onClick={() => {
                  const csv = LocalStorageManager.exportPaymentsCSV();
                  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `Payments_Receipts_Nursing_2027.csv`;
                  a.click();
                }}
                className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold border border-white/10 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>تصدير الوصولات (CSV)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GRADUATES MANAGEMENT */}
      {activeAdminTab === 'graduates' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#101827] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-72">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم، الهاتف، أو رقم القيد..."
                className="w-full px-3.5 py-2 rounded-xl bg-[#090B10] border border-white/10 text-xs text-white pl-9 focus:outline-none focus:border-[#21D4C2]"
              />
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#929BAA]" />
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={filterRegStatus}
                onChange={(e) => setFilterRegStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-xs text-white"
              >
                <option value="all">كل حالات التسجيل</option>
                <option value="pending">قيد المراجعة</option>
                <option value="approved">معتمد</option>
                <option value="rejected">مرفوض</option>
              </select>

              <select
                value={filterPaymentStatus}
                onChange={(e) => setFilterPaymentStatus(e.target.value as any)}
                className="px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-xs text-white"
              >
                <option value="all">كل حالات الدفع</option>
                <option value="paid">مسدد كامل</option>
                <option value="partial">مسدد جزئي / عربون</option>
                <option value="unpaid">غير مسدد</option>
              </select>
            </div>
          </div>

          <div className="rounded-3xl bg-[#101827] border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#090B10] text-[#929BAA] border-b border-white/10">
                  <tr>
                    <th className="p-3.5">اللقب والاسم</th>
                    <th className="p-3.5">رقم القيد والهاتف</th>
                    <th className="p-3.5">المدفوع (السكراب)</th>
                    <th className="p-3.5">المدفوع (التخرج)</th>
                    <th className="p-3.5">المبلغ المتبقي</th>
                    <th className="p-3.5">الحالة والصلاحية</th>
                    <th className="p-3.5 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {filteredGraduates.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-[#929BAA]">
                        <div className="font-bold text-white text-sm mb-1">لا توجد بيانات حالياً</div>
                        <div className="text-xs">لم يتم تسجيل خريجين في هذا القسم بعد. يمكنك إضافة خريج يدوياً من الأعلى.</div>
                      </td>
                    </tr>
                  ) : (
                    filteredGraduates.map((g) => (
                      <tr key={g.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold">{g.displayTitle || g.fullName}</div>
                          <div className="text-[10px] text-[#929BAA]">
                            {isSuperAdmin ? g.email : 'البريد محجوب لحماية الخصوصية'}
                          </div>
                        </td>
                        <td className="p-3.5 font-mono">
                          <div>{g.phone}</div>
                          <div className="text-[10px] text-[#D6B779]">{g.studentId || '-'}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono text-indigo-300 font-bold">{formatIQD(g.scrubPaidIQD)}</div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${getPaymentStatusBadgeClass(g.scrubStatus)}`}>
                            {getPaymentStatusArabic(g.scrubStatus)}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono text-[#21D4C2] font-bold">{formatIQD(g.gradPaidIQD)}</div>
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${getPaymentStatusBadgeClass(g.gradStatus)}`}>
                            {getPaymentStatusArabic(g.gradStatus)}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-[#D6B779]">
                          {formatIQD(g.remainingBalanceIQD)}
                        </td>
                        <td className="p-3.5 space-y-1.5">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            g.status === 'approved'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : g.status === 'pending'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {g.status === 'approved' ? 'معتمد' : g.status === 'pending' ? 'قيد التدقيق' : 'مرفوض'}
                          </span>
                          {isSuperAdmin && (
                            <div>
                              <select
                                value={g.role}
                                onChange={(e) => updateGraduateRole(g.id, e.target.value as UserRole)}
                                className="px-2 py-1 rounded-lg bg-[#10151C] border border-[#35D6C5]/25 text-[10px] text-[#A6F0DF] font-bold"
                                title="تغيير الدور الوظيفي (RBAC)"
                              >
                                <option value="graduate">طالب / خريج (student)</option>
                                <option value="finance_manager">مدير مالي (finance_manager)</option>
                                <option value="event_manager">مدير الحفلات (event_manager)</option>
                                <option value="gallery_moderator">مشرف المعرض (gallery_moderator)</option>
                                <option value="notification_manager">مسؤول الإشعارات (notification_manager)</option>
                                <option value="super_admin">مشرف أعلى (super_admin)</option>
                              </select>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {g.status === 'pending' && (
                              <button
                                onClick={() => approveGraduate(g.id)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-500 text-black font-bold text-[11px]"
                              >
                                اعتماد
                              </button>
                            )}
                            <button
                              onClick={() => {
                                setPayGradId(g.id);
                                setPayTargetMode('existing');
                                setShowPayModal(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[11px]"
                            >
                              قبض كاش
                            </button>
                            <button
                              onClick={() => deleteGraduate(g.id)}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400"
                              title="حذف السجل"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PAYMENTS & RECEIPTS */}
      {activeAdminTab === 'payments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">سجل المقبوضات والوصولات الرسمية</h3>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPayTargetMode('advance');
                  setShowPayModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>تسجيل عربون كاش مسبق</span>
              </button>
              <button
                onClick={() => {
                  setPayTargetMode('existing');
                  setShowPayModal(true);
                }}
                className="px-4 py-2 rounded-xl bg-[#21D4C2] hover:bg-[#1dbfad] text-black font-bold text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>إصدار وصل جديد</span>
              </button>
            </div>
          </div>

          <div className="rounded-3xl bg-[#101827] border border-white/10 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-[#090B10] text-[#929BAA] border-b border-white/10">
                  <tr>
                    <th className="p-3.5">رقم الوصل والمرجع</th>
                    <th className="p-3.5">اسم الخريج / الطالب</th>
                    <th className="p-3.5">الفعالية</th>
                    <th className="p-3.5">المبلغ والنوع</th>
                    <th className="p-3.5">التاريخ والوقت</th>
                    <th className="p-3.5">أمين الصندوق</th>
                    <th className="p-3.5 text-center">الوصل</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-white">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-[#929BAA]">
                        <div className="font-bold text-white text-sm mb-1">لا توجد بيانات حالياً</div>
                        <div className="text-xs">لم يتم إصدار وصولات إضافية في هذا القسم بعد.</div>
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p.id} className="hover:bg-white/5 transition-colors">
                        <td className="p-3.5 font-mono">
                          <div className="font-bold text-white">{p.receiptNumber}</div>
                          <div className="text-[10px] text-[#D6B779]">{p.referenceCode}</div>
                        </td>
                        <td className="p-3.5">
                          <div className="font-bold">{p.graduateName}</div>
                          {p.matchingPhone && (
                            <div className="text-[10px] text-gray-400 font-mono flex items-center gap-1">
                              <Link2 className="w-3 h-3 text-indigo-400" />
                              <span>مطابقة هاتف: {p.matchingPhone}</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.eventTarget === 'scrub_night'
                              ? 'bg-indigo-500/20 text-indigo-300'
                              : 'bg-[#21D4C2]/20 text-[#21D4C2]'
                          }`}>
                            {p.eventTarget === 'scrub_night' ? 'حفلة السكراب' : 'حفل التخرج الرسمي'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-white text-sm">{formatIQD(p.amountIQD)}</div>
                          <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            p.paymentStatus === 'completed'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : 'bg-amber-500/20 text-amber-300'
                          }`}>
                            {p.paymentStatus === 'deposit' ? 'عربون نقدي' : p.paymentStatus === 'completed' ? 'تسديد كامل' : 'دفعة جزئية'}
                          </span>
                        </td>
                        <td className="p-3.5 text-[#929BAA]">
                          <div>{p.date}</div>
                          <div className="text-[10px] font-mono">{p.time}</div>
                        </td>
                        <td className="p-3.5 text-xs text-white font-medium">{p.recordedBy}</td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => openReceipt(p)}
                            className="px-3 py-1 rounded-lg bg-white/5 hover:bg-[#21D4C2]/20 text-[#21D4C2] border border-white/10 font-bold text-xs"
                          >
                            معاينة
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: EVENT CONFIGURATION */}
      {activeAdminTab === 'event_config' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-3 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-white">إعدادات هوية الموقع ومواعيد الحفلات (تعديل حي بدون كود)</h3>
              <p className="text-xs text-[#929BAA]">
                تعديل اسم الموقع، نص «حول الموقع»، وتواريخ الفعاليات والقاعات والمصور والرسوم وحالة العداد التنازلي.
              </p>
            </div>
            {configSavedNotice && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم حفظ التعديلات وتطبيقها حياً!</span>
              </span>
            )}
          </div>

          <form onSubmit={handleSaveConfig} className="space-y-6">
            {/* Section 0: Site Identity & "حول الموقع" (About the Site) */}
            <div className="p-5 rounded-2xl bg-[#10151C] border border-[#D7B875]/35 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D7B875]/20 pb-3">
                <h4 className="text-sm font-black text-[#D7B875] flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>هوية الموقع ونص «حول الموقع» (توضيح طبيعة المنصة)</span>
                </h4>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    عنوان الموقع الرئيسي:
                  </label>
                  <input
                    type="text"
                    value={editBrandName}
                    onChange={(e) => setEditBrandName(e.target.value)}
                    placeholder="تخرج دفعة التمريض 2027"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    العنوان الفرعي أسفله:
                  </label>
                  <input
                    type="text"
                    value={editBrandSubtitle}
                    onChange={(e) => setEditBrandSubtitle(e.target.value)}
                    placeholder="رحلة علم، تعب، وذكريات تجمعنا"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  نص قسم «حول الموقع» (يظهر في الصفحة الرئيسية وأسفل الموقع):
                </label>
                <textarea
                  rows={3}
                  value={editAboutSiteText}
                  onChange={(e) => setEditAboutSiteText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs leading-relaxed focus:outline-none focus:border-[#35D6C5]"
                />
              </div>
            </div>

            {/* Master Top-of-Home Countdown Timer Configuration */}
            <div className="p-5 rounded-2xl bg-[#10151C] border border-[#35D6C5]/35 space-y-4 shadow-lg">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#35D6C5]/20 pb-3">
                <h4 className="text-sm font-black text-[#35D6C5] flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>إعدادات العداد التنازلي الرئيسي في أعلى الصفحة الرئيسية (Home Top Countdown)</span>
                </h4>
                <div className="flex flex-wrap items-center gap-4 text-xs text-white">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCountdownEnabled}
                      onChange={(e) => setEditCountdownEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#35D6C5] rounded"
                    />
                    <span className="font-bold">تفعيل العداد في أعلى الرئيسية</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editCountdownPublished}
                      onChange={(e) => setEditCountdownPublished(e.target.checked)}
                      className="w-4 h-4 accent-[#D6B777] rounded"
                    />
                    <span className="font-bold text-[#D6B777]">نشر العد التنازلي للطلبة (Published)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    الفعالية المرتبطة بالعداد:
                  </label>
                  <select
                    value={editCountdownTarget}
                    onChange={(e) => setEditCountdownTarget(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  >
                    <option value="scrub_party">حفلة السكراب (دفعة 2027)</option>
                    <option value="official_grad">حفل التخرج الرسمي (2027)</option>
                    <option value="custom">مناسبة مخصصة</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    عنوان العداد الظاهر للطلبة:
                  </label>
                  <input
                    type="text"
                    value={editCountdownTitle}
                    onChange={(e) => setEditCountdownTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    نمط العرض البصري (Display Style):
                  </label>
                  <select
                    value={editCountdownStyle}
                    onChange={(e) => setEditCountdownStyle(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  >
                    <option value="medical_glass">زجاجي طبي فاخر (Medical Glass)</option>
                    <option value="gold_ceremonial">ملكي ذهبي احتفالي (Gold Ceremonial)</option>
                    <option value="compact">مدمج (Compact)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    تاريخ الفعالية (YYYY-MM-DD):
                  </label>
                  <input
                    type="date"
                    value={editCountdownDate}
                    onChange={(e) => setEditCountdownDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    الوقت (HH:MM):
                  </label>
                  <input
                    type="time"
                    value={editCountdownTime}
                    onChange={(e) => setEditCountdownTime(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    المنطقة الزمنية (Timezone):
                  </label>
                  <select
                    value={editCountdownTimezone}
                    onChange={(e) => setEditCountdownTimezone(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-[#35D6C5]"
                  >
                    <option value="Asia/Baghdad">توقيت بغداد (+03:00)</option>
                    <option value="UTC">UTC</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    المكان الظاهر في العداد:
                  </label>
                  <input
                    type="text"
                    value={editCountdownLocation}
                    onChange={(e) => setEditCountdownLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>
              </div>
            </div>

            {/* Section 1: Scrub Night Settings */}
            <div className="p-5 rounded-2xl bg-[#10151C] border border-[#35D6C5]/25 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#35D6C5]/15 pb-2">
                <h4 className="text-sm font-bold text-[#A6F0DF] flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  <span>إعدادات حفلة السكراب لمعهد التمريض</span>
                </h4>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={editScrubCountdownEnabled}
                      onChange={(e) => setEditScrubCountdownEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#35D6C5] rounded"
                    />
                    <span>تفعيل عداد السكراب</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D6B777]">
                    <input
                      type="checkbox"
                      checked={editIsScrubDateConfirmed}
                      onChange={(e) => setEditIsScrubDateConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-[#D6B777] rounded"
                    />
                    <span className="font-bold">تأكيد الموعد النهائي رسمياً (إلغاء حالة الموعد المبدئي)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    اسم الفعالية:
                  </label>
                  <input
                    type="text"
                    value={editScrubEventName}
                    onChange={(e) => setEditScrubEventName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    توقيت الحفلة (توقيت العراق):
                  </label>
                  <input
                    type="datetime-local"
                    value={editScrubDate.substring(0, 16)}
                    onChange={(e) => setEditScrubDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    تاريخ الحفلة المكتوب (للعرض على الواجهة):
                  </label>
                  <input
                    type="text"
                    value={editScrubDisplay}
                    onChange={(e) => setEditScrubDisplay(e.target.value)}
                    placeholder="12/12/2026"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    مكان وقاعة السكراب:
                  </label>
                  <input
                    type="text"
                    value={editScrubVenue}
                    onChange={(e) => setEditScrubVenue(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    المصور المعتمد:
                  </label>
                  <input
                    type="text"
                    value={editScrubPhotographer}
                    onChange={(e) => setEditScrubPhotographer(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>
              </div>

              {/* Scrub Time Selection */}
              <div>
                <label className="block text-xs font-bold text-white mb-1.5">
                  توقيت انطلاق الحفل الصباحي:
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => setEditScrubTime('08:00 صباحاً')}
                    className="px-3 py-1.5 rounded-lg bg-[#142638] border border-[#35D6C5]/30 text-xs text-[#A6F0DF] font-bold hover:bg-[#1C354A]"
                  >
                    08:00 صباحاً
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditScrubTime('09:00 صباحاً')}
                    className="px-3 py-1.5 rounded-lg bg-[#142638] border border-[#35D6C5]/30 text-xs text-[#A6F0DF] font-bold hover:bg-[#1C354A]"
                  >
                    09:00 صباحاً
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditScrubTime('الوقت يُعلن لاحقاً')}
                    className="px-3 py-1.5 rounded-lg bg-[#142638] border border-[#35D6C5]/30 text-xs text-[#A6F0DF] font-bold hover:bg-[#1C354A]"
                  >
                    الوقت يُعلن لاحقاً
                  </button>
                </div>
                <input
                  type="text"
                  value={editScrubTime}
                  onChange={(e) => setEditScrubTime(e.target.value)}
                  placeholder="الوقت يُعلن لاحقاً"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#35D6C5] mb-1.5">
                  السعر الرسمي لحفلة السكراب (بالدينار العراقي):
                </label>
                <input
                  type="number"
                  min={0}
                  step={1000}
                  value={editScrubFeeIQD}
                  onChange={(e) => setEditScrubFeeIQD(Number(e.target.value))}
                  className="w-full sm:w-64 px-3.5 py-2.5 rounded-xl bg-[#142638] border border-[#35D6C5]/40 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#35D6C5]"
                />
              </div>
            </div>

            {/* Section 2: Official Graduation 2027 Settings */}
            <div className="p-5 rounded-2xl bg-[#10151C] border border-[#D6B777]/30 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#D6B777]/20 pb-2">
                <h4 className="text-sm font-bold text-[#D6B777] flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  <span>إعدادات حفل التخرج الأكاديمي الرسمي (2027)</span>
                </h4>
                <div className="flex flex-wrap items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                    <input
                      type="checkbox"
                      checked={editOfficialGradCountdownEnabled}
                      onChange={(e) => setEditOfficialGradCountdownEnabled(e.target.checked)}
                      className="w-4 h-4 accent-[#35D6C5] rounded"
                    />
                    <span>تفعيل عداد التخرج الرسمي</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D6B777]">
                    <input
                      type="checkbox"
                      checked={editIsOfficialGradDateConfirmed}
                      onChange={(e) => setEditIsOfficialGradDateConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-[#D6B777] rounded"
                    />
                    <span className="font-bold">تأكيد موعد التخرج الرسمي (بدلاً من «قريباً»)</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    عنوان الحفل الرسمي:
                  </label>
                  <input
                    type="text"
                    value={editOfficialTitle}
                    onChange={(e) => setEditOfficialTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    تاريخ التخرج الرسمي (نص العرض):
                  </label>
                  <input
                    type="text"
                    value={editOfficialDate}
                    onChange={(e) => setEditOfficialDate(e.target.value)}
                    placeholder="قريباً"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    قاعة التخرج الرسمي:
                  </label>
                  <input
                    type="text"
                    value={editOfficialLocation}
                    onChange={(e) => setEditOfficialLocation(e.target.value)}
                    placeholder="قريباً"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                <div>
                  <label className="block text-xs font-bold text-white mb-1.5">
                    لون وشاح التخرج المعتمد:
                  </label>
                  <input
                    type="text"
                    value={editOfficialSashColor}
                    onChange={(e) => setEditOfficialSashColor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-white/10 text-white text-xs focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-[#D6B777] font-bold">
                    <input
                      type="checkbox"
                      checked={editIsOfficialGradPriceConfirmed}
                      onChange={(e) => setEditIsOfficialGradPriceConfirmed(e.target.checked)}
                      className="w-4 h-4 accent-[#D6B777] rounded"
                    />
                    <span>تفعيل السعر الرسمي لحفلة التخرج الرسمي (إلغاء حالة «قريباً — لم يتم تحديد السعر»)</span>
                  </label>
                  {editIsOfficialGradPriceConfirmed && (
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={editOfficialGradFeeIQD}
                      onChange={(e) => setEditOfficialGradFeeIQD(Number(e.target.value))}
                      placeholder="السعر الرسمي بالدينار العراقي"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[#142638] border border-[#D6B777]/40 text-white text-xs font-mono font-bold focus:outline-none focus:border-[#D6B777]"
                    />
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#35D6C5] to-[#20B8A8] text-[#10151C] font-extrabold text-xs sm:text-sm shadow-xl shadow-[#35D6C5]/20"
              >
                حفظ ونشر التعديلات فوراً
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 5: MEDIA & GALLERY MODERATION */}
      {activeAdminTab === 'media' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-base font-bold text-white">إدارة المعرض والوسائط العامة</h3>
              <p className="text-xs text-[#929BAA]">
                مراجعة مشاركات الخريجين، رفع الصور الجديدة، وتنظيم الألبومات العامة.
              </p>
            </div>
            <button
              onClick={() => setShowMediaModal(true)}
              className="px-4 py-2 rounded-xl bg-[#21D4C2] text-black font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صورة للمعرض</span>
            </button>
          </div>

          {/* Pending Submissions from Graduates */}
          {pendingMediaSubmissions.length > 0 && (
            <div className="p-5 rounded-3xl bg-amber-950/40 border border-amber-500/30 space-y-3">
              <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>صور مرسلة من الخريجين بانتظار الاعتماد ({pendingMediaSubmissions.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {pendingMediaSubmissions.map((item) => (
                  <div key={item.id} className="p-3 rounded-2xl bg-[#090B10] border border-amber-500/20 space-y-2">
                    <img src={item.url} alt={item.title} className="w-full h-36 object-cover rounded-xl" />
                    <h5 className="font-bold text-white text-xs">{item.title}</h5>
                    <p className="text-[10px] text-gray-400">بواسطة: {item.submittedByGraduateName}</p>
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => approveMedia(item.id)}
                        className="flex-1 py-1 rounded-lg bg-emerald-500 text-black font-bold text-xs"
                      >
                        موافقة ونشر
                      </button>
                      <button
                        onClick={() => rejectMedia(item.id)}
                        className="flex-1 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-xs"
                      >
                        رفض
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Published Media Grid */}
          {media.filter((m) => m.status !== 'pending').length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-[#101827] border border-white/10 p-6">
              <div className="font-bold text-white text-sm mb-1">لا توجد بيانات حالياً</div>
              <p className="text-xs text-[#929BAA]">لم يتم رفع أي صور أو وسائط في المعرض العام بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {media.filter((m) => m.status !== 'pending').map((item) => (
                <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-[#101827] border border-white/10 shadow-lg">
                  <img src={item.url} alt={item.title} className="w-full h-40 object-cover" />
                  <div className="p-3 text-right">
                    <span className="text-[10px] text-[#21D4C2] block">{item.album || item.category}</span>
                    <h4 className="text-xs font-bold text-white truncate">{item.title}</h4>
                    <button
                      onClick={() => deleteMedia(item.id)}
                      className="mt-2 text-[10px] text-red-400 hover:text-red-300 flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 6: ANNOUNCEMENTS */}
      {activeAdminTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base font-bold text-white">إعلانات وتوجيهات معهد التمريض</h3>
            <button
              onClick={() => setShowAnnModal(true)}
              className="px-4 py-2 rounded-xl bg-[#21D4C2] text-black font-bold text-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>نشر إعلان جديد</span>
            </button>
          </div>

          {announcements.length === 0 ? (
            <div className="text-center py-12 rounded-3xl bg-[#101827] border border-white/10 p-6">
              <div className="font-bold text-white text-sm mb-1">لا توجد بيانات حالياً</div>
              <p className="text-xs text-[#929BAA]">لم يتم نشر أي إعلانات حالياً.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {announcements.map((ann) => (
                <div key={ann.id} className="p-4 rounded-2xl bg-[#101827] border border-white/10 flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{ann.title}</span>
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-[#D6B779]">
                        {ann.category === 'scrub_night' ? 'حفلة السكراب' : ann.category === 'official_grad' ? 'التخرج الرسمي' : 'عام'}
                      </span>
                    </div>
                    <p className="text-xs text-[#929BAA]">{ann.description}</p>
                    <span className="text-[10px] text-gray-500">{ann.publishedAt}</span>
                  </div>
                  <button
                    onClick={() => deleteAnnouncement(ann.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 7: AUDIT LOGS */}
      {activeAdminTab === 'audit' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-5 shadow-xl space-y-4">
          <h3 className="text-base font-bold text-white">سجل تدقيق العمليات والتعديلات (Audit Trail)</h3>
          {auditLogs.length === 0 ? (
            <div className="text-center py-10 text-[#929BAA] text-xs">لا توجد بيانات حالياً</div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3.5 rounded-xl bg-[#090B10] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div>
                    <span className="font-bold text-white ml-2">{log.action}:</span>
                    <span className="text-[#929BAA]">{log.details}</span>
                  </div>
                  <div className="text-[10px] text-[#D6B779] shrink-0 font-mono">
                    {log.performedBy} • {log.timestamp}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: RECORD PAYMENT OR ADVANCE CASH */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-[#101827] border border-white/10 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-black text-white">تسجيل مقبوضات نقدية وإصدار سند قبض</h3>

            {/* Target Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-[#090B10] border border-white/10">
              <button
                type="button"
                onClick={() => setPayTargetMode('existing')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  payTargetMode === 'existing'
                    ? 'bg-[#21D4C2] text-black'
                    : 'text-[#929BAA]'
                }`}
              >
                طالب مسجل في المنظومة
              </button>
              <button
                type="button"
                onClick={() => setPayTargetMode('advance')}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  payTargetMode === 'advance'
                    ? 'bg-amber-500 text-black'
                    : 'text-[#929BAA]'
                }`}
              >
                عربون/كاش مسبق قبل التسجيل
              </button>
            </div>

            {payFeedback && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                {payFeedback}
              </div>
            )}

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              {payTargetMode === 'existing' ? (
                <div>
                  <label className="block text-white font-bold mb-1">اختر الخريج المسجل:</label>
                  <select
                    required
                    value={payGradId}
                    onChange={(e) => setPayGradId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#090B10] border border-white/10 text-white text-xs focus:outline-none focus:border-[#21D4C2]"
                  >
                    <option value="">-- اضغط لاختيار الخريج --</option>
                    {graduates.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.displayTitle || g.fullName} ({g.phone}) - {payEventTarget === 'scrub_night' ? `متبقي السكراب: ${formatIQD(g.scrubBalanceIQD)}` : `متبقي التخرج: ${formatIQD(g.gradBalanceIQD)}`}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 rounded-2xl bg-[#090B10] border border-amber-500/30">
                  <div className="text-[11px] text-amber-300 font-bold">
                    بيانات الطالب الذي دفع نقداً قبل إنشاء حسابه في الموقع (المطابقة برقم الهاتف):
                  </div>
                  <div>
                    <label className="block text-white font-bold mb-1">اسم الطالب الرباعي: *</label>
                    <input
                      type="text"
                      required
                      value={advanceName}
                      onChange={(e) => setAdvanceName(e.target.value)}
                      placeholder="مثال: علي كريم الزيدي"
                      className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white font-bold mb-1">رقم الهاتف (للمطابقة التلقائية): *</label>
                      <input
                        type="tel"
                        required
                        value={advancePhone}
                        onChange={(e) => setAdvancePhone(e.target.value)}
                        placeholder="077XXXXXXXX"
                        className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-white font-bold mb-1">رقم القيد (اختياري):</label>
                      <input
                        type="text"
                        value={advanceStudentId}
                        onChange={(e) => setAdvanceStudentId(e.target.value)}
                        placeholder="NUR-2027-..."
                        className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Event Target Switcher */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">الفعالية المستهدفة:</label>
                  <select
                    value={payEventTarget}
                    onChange={(e) => {
                      const val = e.target.value as PaymentEventTarget;
                      setPayEventTarget(val);
                      if (val === 'scrub_night') {
                        setPayAmount(eventConfig.scrubFeeIQD || 35000);
                      } else {
                        setPayAmount(eventConfig.officialGradFeeIQD || 50000);
                      }
                    }}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#090B10] border border-white/10 text-white"
                  >
                    <option value="scrub_night">حفلة السكراب</option>
                    <option value="official_grad">حفل التخرج الرسمي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white font-bold mb-1">نوع الدفعة:</label>
                  <select
                    value={payStatusType}
                    onChange={(e) => setPayStatusType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#090B10] border border-white/10 text-white"
                  >
                    <option value="deposit">عربون نقدي</option>
                    <option value="partial">دفعة جزئية</option>
                    <option value="completed">تسديد كامل المبلغ</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-white font-bold mb-1">المبلغ المقبوض (د.ع):</label>
                  <input
                    type="number"
                    required
                    step={1000}
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#090B10] border border-white/10 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-white font-bold mb-1">طريقة القبض:</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-2.5 rounded-xl bg-[#090B10] border border-white/10 text-white"
                  >
                    <option value="cash">نقداً (كاش باليد)</option>
                    <option value="bank_transfer">تحويل بنكي مدقق</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-white font-bold mb-1">ملاحظات السند:</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="مثال: تسليم كاش مباشر في المعهد"
                  className="w-full px-3 py-2.5 rounded-xl bg-[#090B10] border border-white/10 text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#21D4C2] text-black font-extrabold"
                >
                  إصدار وتثبيت السند فوراً
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD GRADUATE MANUALLY */}
      {showAddGradModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#101827] border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">إضافة خريج جديد يدوياً</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const scrubDue = eventConfig.scrubFeeIQD || 35000;
                const gradDue = eventConfig.officialGradFeeIQD || 50000;
                const totalDue = scrubDue + gradDue;
                const newGrad: Graduate = {
                  id: 'grad-' + Date.now(),
                  fullName: newGradName.trim(),
                  email: newGradEmail.trim(),
                  phone: newGradPhone.trim(),
                  studentId: newGradStudentId.trim() || `NUR-2027-${Math.floor(100 + Math.random() * 900)}`,
                  role: 'graduate',
                  status: 'approved',
                  preferredTitle: newGradTitle,
                  displayTitle: newGradTitle === 'nurse_f' ? `الممرضة ${newGradName.trim()}` : `الممرض ${newGradName.trim()}`,
                  cohortLabel: 'دفعة 2027',
                  scrubDueIQD: scrubDue,
                  scrubPaidIQD: 0,
                  scrubBalanceIQD: scrubDue,
                  scrubStatus: 'unpaid',
                  gradDueIQD: gradDue,
                  gradPaidIQD: 0,
                  gradBalanceIQD: gradDue,
                  gradStatus: 'unpaid',
                  totalDueIQD: totalDue,
                  totalPaidIQD: 0,
                  remainingBalanceIQD: totalDue,
                  createdAt: new Date().toISOString().split('T')[0],
                  approvedAt: new Date().toISOString().split('T')[0],
                  approvedBy: currentUser?.fullName || 'المشرف',
                };
                addGraduateManually(newGrad);
                setShowAddGradModal(false);
                setNewGradName('');
                setNewGradEmail('');
                setNewGradPhone('');
                setNewGradStudentId('');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-white font-bold mb-1">اللقب الرسمي:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setNewGradTitle('nurse_m')}
                    className={`py-1.5 rounded-lg font-bold border ${newGradTitle === 'nurse_m' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[#090B10] text-gray-400 border-white/10'}`}
                  >
                    الممرض (طالب)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewGradTitle('nurse_f')}
                    className={`py-1.5 rounded-lg font-bold border ${newGradTitle === 'nurse_f' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-[#090B10] text-gray-400 border-white/10'}`}
                  >
                    الممرضة (طالبة)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-white font-bold mb-1">الاسم الرباعي واللقب:</label>
                <input
                  type="text"
                  required
                  value={newGradName}
                  onChange={(e) => setNewGradName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-bold mb-1">البريد الإلكتروني:</label>
                <input
                  type="email"
                  required
                  value={newGradEmail}
                  onChange={(e) => setNewGradEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-white font-bold mb-1">رقم الهاتف:</label>
                  <input
                    type="tel"
                    required
                    value={newGradPhone}
                    onChange={(e) => setNewGradPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-white font-bold mb-1">رقم القيد:</label>
                  <input
                    type="text"
                    value={newGradStudentId}
                    onChange={(e) => setNewGradStudentId(e.target.value)}
                    placeholder="NUR-2027-..."
                    className="w-full px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-white font-mono"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAddGradModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#21D4C2] text-black font-extrabold"
                >
                  إضافة واعتماد
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD ANNOUNCEMENT */}
      {showAnnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-[#101827] border border-white/10 p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">نشر إعلان جديد</h3>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                addAnnouncement({
                  title: annTitle.trim(),
                  description: annDesc.trim(),
                  category: annCat,
                  displayOrder: announcements.length + 1,
                  status: 'published',
                });
                setShowAnnModal(false);
                setAnnTitle('');
                setAnnDesc('');
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block text-white font-bold mb-1">عنوان الإعلان:</label>
                <input
                  type="text"
                  required
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-white"
                />
              </div>
              <div>
                <label className="block text-white font-bold mb-1">التصنيف:</label>
                <select
                  value={annCat}
                  onChange={(e) => setAnnCat(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-white"
                >
                  <option value="scrub_night">حفلة السكراب</option>
                  <option value="official_grad">حفل التخرج الرسمي</option>
                  <option value="urgent">تنويه هام وعاجل</option>
                  <option value="general">إعلان عام</option>
                </select>
              </div>
              <div>
                <label className="block text-white font-bold mb-1">نص وتفاصيل الإعلان:</label>
                <textarea
                  rows={3}
                  required
                  value={annDesc}
                  onChange={(e) => setAnnDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-[#090B10] border border-white/10 text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setShowAnnModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-gray-300"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#21D4C2] text-black font-extrabold"
                >
                  نشر الإعلان
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDIA WITH DIRECT FILE PICKER */}
      {showMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-xl">
            <MediaUploadZone
              destinationLabel="المعرض العام (نشر فوري بواسطة المشرف)"
              submitButtonText="رفع ونشر في المعرض"
              defaultCategory="scrub_night"
              defaultAlbum="حفلة السكراب"
              onUploadSuccess={(res: UploadResult) => {
                addMedia({
                  title: res.title,
                  url: res.url,
                  album: res.album,
                  category: res.category,
                  isPublic: true,
                  sizeMb: res.sizeMb,
                  taggedGraduateName: res.taggedGraduateName,
                });
                setShowMediaModal(false);
              }}
              onCancel={() => setShowMediaModal(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
