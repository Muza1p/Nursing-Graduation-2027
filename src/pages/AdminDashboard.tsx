import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
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
} from '../types';
import { MediaUploadZone, UploadResult } from '../components/MediaUploadZone';
import { ScrubStudentManagementSection } from '../components/ScrubStudentManagementSection';
import {
  ShieldAlert,
  Users,
  CreditCard,
  Settings,
  Bell,
  Image,
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
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const {
    currentUser,
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
  } = useApp();

  const [activeAdminTab, setActiveAdminTab] = useState<
    | 'scrub_students'
    | 'overview'
    | 'pending_requests'
    | 'graduates'
    | 'payments'
    | 'announcements'
    | 'event_config'
    | 'media'
    | 'audit'
  >(canManageFinances ? 'scrub_students' : 'event_config');

  // Rejection modal state
  const [rejectModalReq, setRejectModalReq] = useState<any | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [reviewActionFeedback, setReviewActionFeedback] = useState<string | null>(null);
  const [isProcessingReview, setIsProcessingReview] = useState(false);

  // Graduate management filters & search
  const [searchQuery, setSearchQuery] = useState('');
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

  const [editOfficialTitle, setEditOfficialTitle] = useState(eventConfig.officialGraduationTitle || 'حفل التخرج الرسمي');
  const [editOfficialStatus, setEditOfficialStatus] = useState<GraduationOfficialStatus>(eventConfig.officialGraduationStatus || 'coming_soon');
  const [editOfficialDate, setEditOfficialDate] = useState(eventConfig.officialGraduationDate || 'قريباً');
  const [editOfficialLocation, setEditOfficialLocation] = useState(eventConfig.officialGraduationLocation || 'قريباً');
  const [editOfficialSashColor, setEditOfficialSashColor] = useState(eventConfig.officialGraduationSashColor || 'تركوازي (وشاح التمريض)');
  const [editOfficialGradCountdownEnabled, setEditOfficialGradCountdownEnabled] = useState(eventConfig.officialGradCountdownEnabled ?? false);
  const [editIsOfficialGradDateConfirmed, setEditIsOfficialGradDateConfirmed] = useState(eventConfig.isOfficialGradDateConfirmed ?? false);

  // Top-of-Home Countdown Timer Master Settings
  const [editCountdownEnabled, setEditCountdownEnabled] = useState(eventConfig.countdownEnabled ?? true);
  const [editCountdownPublished, setEditCountdownPublished] = useState(eventConfig.countdownPublished ?? true);
  const [editCountdownTarget, setEditCountdownTarget] = useState<'scrub_party' | 'official_grad' | 'custom'>(eventConfig.countdownTarget || 'scrub_party');
  const [editCountdownTitle, setEditCountdownTitle] = useState(eventConfig.countdownTitle || 'العد التنازلي لحفلة السكراب — معهد التمريض دفعة 2027');
  const [editCountdownDate, setEditCountdownDate] = useState(eventConfig.countdownDate || '2026-12-12');
  const [editCountdownTime, setEditCountdownTime] = useState(eventConfig.countdownTime || '09:00');
  const [editCountdownTimezone, setEditCountdownTimezone] = useState(eventConfig.countdownTimezone || 'Asia/Baghdad');
  const [editCountdownLocation, setEditCountdownLocation] = useState(eventConfig.countdownLocation || 'مسرح تفاحة المصور');
  const [editCountdownStyle, setEditCountdownStyle] = useState<'medical_glass' | 'gold_ceremonial' | 'compact'>(eventConfig.countdownStyle || 'medical_glass');

  const [configSavedNotice, setConfigSavedNotice] = useState(false);

  // If not admin or moderator, block view
  if (!isAdmin && !isModerator) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <ShieldAlert className="w-14 h-14 text-red-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">منطقة مخصصة للإدارة والمشرفين</h2>
        <p className="text-xs text-[#929BAA] mb-4">
          يجب أن تمتلك صلاحيات مسؤول النظام أو مشرف معتمد في معهد التمريض للدخول للوحة التحكم.
        </p>
        <button
          onClick={() => navigateTo('home')}
          className="px-6 py-2.5 rounded-xl bg-[#21D4C2] text-black font-bold text-xs"
        >
          العودة للرئيسية
        </button>
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
      scrubEventName: editScrubEventName.trim(),
      scrubPartyDate: editScrubDate,
      scrubPartyDateDisplay: editScrubDisplay.trim(),
      scrubVenue: editScrubVenue.trim(),
      scrubPhotographer: editScrubPhotographer.trim(),
      scrubTime: editScrubTime.trim(),
      scrubPartyDressCode: editDressCode.trim(),
      scrubCountdownEnabled: editScrubCountdownEnabled,
      isScrubDateConfirmed: editIsScrubDateConfirmed,

      officialGraduationTitle: editOfficialTitle.trim(),
      officialGraduationStatus: editOfficialStatus,
      officialGraduationDate: editOfficialDate.trim(),
      officialGraduationLocation: editOfficialLocation.trim(),
      officialGraduationSashColor: editOfficialSashColor.trim(),
      officialGradCountdownEnabled: editOfficialGradCountdownEnabled,
      isOfficialGradDateConfirmed: editIsOfficialGradDateConfirmed,

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
                لوحة الإدارة السريرية والمالية — معهد التمريض
              </h1>
              <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                isAdmin
                  ? 'bg-[#D7B875]/20 text-[#D7B875] border-[#D7B875]/35'
                  : 'bg-[#342A78]/60 text-indigo-200 border-indigo-400/40'
              }`}>
                {isAdmin ? 'مدير النظام الأعلى' : 'مشرف معتمد'}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              دفعة 2027 • المنظم المسؤول: <strong className="text-[#35D6C2]">{currentUser?.displayTitle || currentUser?.fullName}</strong>
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
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-[#F4F8FC] font-bold text-xs border border-white/10 flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة خريج يدوياً</span>
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
                            {req.email}
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
                          <div className="text-[10px] text-[#929BAA]">{g.email}</div>
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
              <h3 className="text-lg font-bold text-white">إعدادات ومواعيد الحفلات (تعديل حي بدون كود)</h3>
              <p className="text-xs text-[#929BAA]">
                تعديل تواريخ الفعاليات، القاعات، المصور، الرسوم، وحالة العداد التنازلي التلقائي.
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
