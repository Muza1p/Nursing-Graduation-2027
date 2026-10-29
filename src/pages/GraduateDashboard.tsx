import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatIQD,
  formatArabicDate,
  LocalStorageManager,
  getPaymentStatusBadgeClass,
  getPaymentStatusArabic,
} from '../services/storage';
import {
  GraduatePrivateMedia,
  PaymentTransaction,
  ScrubStudent,
  PaymentMethod,
} from '../types';
import { CardGeneratorModal } from '../components/CardGeneratorModal';
import { MediaUploadZone, UploadResult } from '../components/MediaUploadZone';
import { GraduationStudio } from '../components/GraduationStudio';
import { normalizeArabicName } from '../services/studentManagement';
import {
  AppNotification,
  subscribeToNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/notificationService';
import {
  StethoscopeGradCapIllustration,
  AnimatedEcgWaveform,
} from '../components/MedicalIllustrations';
import {
  User,
  CreditCard,
  FileText,
  Download,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  Clock,
  Trash2,
  ShieldCheck,
  AlertCircle,
  Eye,
  LogOut,
  GraduationCap,
  Search,
  Link2,
  Bell,
  Settings,
  Camera,
  Lock,
  Banknote,
  Wallet,
  XCircle,
} from 'lucide-react';

export const GraduateDashboard: React.FC = () => {
  const {
    currentUser,
    firebaseUser,
    payments,
    scrubStudents,
    studentPayments,
    openReceipt,
    logout,
    navigateTo,
    eventConfig,
    isAdmin,
    isModerator,
    updateMyDisplayName,
    myModeratorRequest,
    submitModeratorRequest,
    financialLinkRequests,
    submitFinancialLinkRequest,
    submitStudentPaymentRequest,
    savedDesigns,
    updateMyProfileSettings,
  } = useApp();

  const [activeTab, setActiveTab] = useState<
    | 'overview'
    | 'find_record'
    | 'payments'
    | 'studio'
    | 'notifications'
    | 'media'
    | 'moderator_request'
    | 'settings'
  >('overview');

  const [showCardModal, setShowCardModal] = useState(false);
  const [privateMedia, setPrivateMedia] = useState<GraduatePrivateMedia[]>([]);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(
    currentUser?.fullName || ''
  );
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  // Financial Record Linking ("العثور على سجلي المالي") state
  const [recordSearchQuery, setRecordSearchQuery] = useState('');
  const [selectedCandidateRecord, setSelectedCandidateRecord] =
    useState<ScrubStudent | null>(null);
  const [linkPhoneInput, setLinkPhoneInput] = useState(
    currentUser?.phone || ''
  );
  const [linkNoteInput, setLinkNoteInput] = useState('');
  const [linkFeedback, setLinkFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSubmittingLink, setIsSubmittingLink] = useState(false);

  // Payment Submission Modal ("تسديد المبلغ") state
  const [showPayModal, setShowPayModal] = useState(false);
  const [payMode, setPayMode] = useState<'committee_cash' | 'iraq_gateway'>(
    'committee_cash'
  );
  const [payAmountInput, setPayAmountInput] = useState<number>(15000);
  const [payMethodInput, setPayMethodInput] = useState<PaymentMethod>('cash');
  const [payRefInput, setPayRefInput] = useState('');
  const [payNoteInput, setPayNoteInput] = useState('');
  const [payIdempotencyKey, setPayIdempotencyKey] = useState<string>('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  const [paySubmitFeedback, setPaySubmitFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Personal Notifications state
  const [myNotifications, setMyNotifications] = useState<AppNotification[]>([]);

  // Account Settings state
  const [settingsName, setSettingsName] = useState(currentUser?.fullName || '');
  const [settingsTitle, setSettingsTitle] = useState<'nurse_m' | 'nurse_f'>(
    currentUser?.preferredTitle || 'nurse_m'
  );
  const [settingsPhone, setSettingsPhone] = useState(currentUser?.phone || '');
  const [settingsAvatar, setSettingsAvatar] = useState(
    currentUser?.avatarUrl || ''
  );
  const [settingsFeedback, setSettingsFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);

  // Moderator request form state
  const [reqFullName, setReqFullName] = useState(currentUser?.fullName || '');
  const [reqPhone, setReqPhone] = useState(currentUser?.phone || '');
  const [reqNote, setReqNote] = useState('');
  const [isSubmittingReq, setIsSubmittingReq] = useState(false);
  const [reqFeedback, setReqFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const currentUid = firebaseUser?.uid || currentUser?.id || '';

  useEffect(() => {
    if (currentUser?.fullName) {
      setDisplayNameInput(currentUser.fullName);
      setSettingsName(currentUser.fullName);
      if (!reqFullName) setReqFullName(currentUser.fullName);
    }
    if (currentUser?.phone) {
      setSettingsPhone(currentUser.phone);
      if (!reqPhone) setReqPhone(currentUser.phone);
      if (!linkPhoneInput) setLinkPhoneInput(currentUser.phone);
    }
    if (currentUser?.preferredTitle) {
      setSettingsTitle(currentUser.preferredTitle);
    }
    if (currentUser?.avatarUrl) {
      setSettingsAvatar(currentUser.avatarUrl);
    }
  }, [currentUser]);

  // Subscribe to real-time notifications for this student
  useEffect(() => {
    if (!currentUid) return;
    const unsub = subscribeToNotifications(
      currentUid,
      isAdmin || isModerator,
      (notifs) => {
        setMyNotifications(notifs);
      }
    );
    return () => unsub();
  }, [currentUid, isAdmin, isModerator]);

  // Find linked ScrubStudent record if linked
  const myLinkedScrubStudent = useMemo(() => {
    if (!currentUser) return undefined;
    return scrubStudents.find(
      (s) =>
        s.status === 'active' &&
        s.isLinkedToAccount &&
        (s.linkedUserId === currentUid ||
          s.id === currentUser.linkedScrubStudentId)
    );
  }, [scrubStudents, currentUser, currentUid]);

  // Find user's financial link requests
  const myLinkRequests = useMemo(() => {
    if (!currentUid) return [];
    return financialLinkRequests.filter((r) => r.userId === currentUid);
  }, [financialLinkRequests, currentUid]);

  const latestLinkRequest = myLinkRequests[0] || null;

  // Search unlinked/all active ScrubStudent records for "العثور على سجلي المالي"
  const matchingRosterCandidates = useMemo(() => {
    const q = normalizeArabicName(recordSearchQuery);
    if (!q || q.length < 2) return [];
    return scrubStudents
      .filter((s) => {
        if (s.status !== 'active') return false;
        const normName = s.normalizedName || normalizeArabicName(s.fullName);
        return (
          normName.includes(q) ||
          String(s.studentNumber) === recordSearchQuery.trim()
        );
      })
      .slice(0, 12);
  }, [scrubStudents, recordSearchQuery]);

  // Load private media for this graduate only
  useEffect(() => {
    if (currentUser) {
      setPrivateMedia(LocalStorageManager.getPrivateMedia(currentUser.id));
    }
  }, [currentUser]);

  if (!currentUser) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <AlertCircle className="w-12 h-12 text-[#D7B875] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">
          يرجى تسجيل الدخول أولاً
        </h2>
        <p className="text-xs text-slate-400 mb-4">
          يجب تسجيل الدخول للوصول إلى لوحة حسابك وبياناتك المالية واستوديو التخرج.
        </p>
        <button
          onClick={() => navigateTo('login')}
          className="px-6 py-2.5 rounded-xl bg-[#35D6C2] text-[#0A0D12] font-bold text-xs cursor-pointer"
        >
          تسجيل الدخول واكتشاف جميع المزايا
        </button>
      </div>
    );
  }

  // Strictly filter payments belonging to this authenticated student (both StudentPayment from linked ScrubStudent and legacy PaymentTransaction)
  const myStudentPayments = studentPayments.filter(
    (sp) =>
      (myLinkedScrubStudent && sp.studentId === myLinkedScrubStudent.id) ||
      (currentUid && sp.linkedUserId === currentUid)
  );

  const myLegacyPayments = payments.filter(
    (p) => p.graduateId === currentUser.id
  );

  // Approved party fee, verified paid, pending paid, and remaining balance
  const approvedScrubFeeIQD =
    myLinkedScrubStudent?.totalFeeIQD || eventConfig.scrubFeeIQD || 35000;
  const verifiedScrubPaidIQD = myLinkedScrubStudent
    ? myLinkedScrubStudent.verifiedPaidIQD
    : currentUser.scrubPaidIQD || 0;
  const pendingScrubPaidIQD = myLinkedScrubStudent
    ? myLinkedScrubStudent.pendingPaidIQD
    : 0;
  const remainingScrubBalanceIQD = myLinkedScrubStudent
    ? myLinkedScrubStudent.remainingBalanceIQD
    : Math.max(0, approvedScrubFeeIQD - verifiedScrubPaidIQD);

  const paymentCompletionPercent = Math.min(
    100,
    Math.round((verifiedScrubPaidIQD / Math.max(1, approvedScrubFeeIQD)) * 100)
  );

  const mySavedStudioDesigns = savedDesigns.filter(
    (d) => d.userId === currentUid
  );
  const unreadNotifsCount = myNotifications.filter((n) => !n.isRead).length;

  const openPaymentModal = () => {
    setPayAmountInput(
      remainingScrubBalanceIQD > 0 ? remainingScrubBalanceIQD : 15000
    );
    setPayIdempotencyKey(
      `pay-idem-${currentUid}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}`
    );
    setPaySubmitFeedback(null);
    setShowPayModal(true);
  };

  const handleOpenStudentPaymentReceipt = (sp: typeof myStudentPayments[0]) => {
    const tx: PaymentTransaction = {
      id: sp.id,
      receiptNumber: sp.receiptNumber,
      graduateId: currentUser.id,
      graduateName: sp.studentName,
      eventTarget: 'scrub_night',
      paymentStatus:
        sp.paymentType === 'final_settlement' ? 'completed' : 'deposit',
      amountIQD: sp.amountIQD,
      method: sp.paymentMethod,
      date: sp.date,
      time: sp.time,
      recordedBy: sp.recordedBy,
      notes: sp.notes,
      isVerified: sp.isVerified,
      referenceCode: sp.referenceCode,
    };
    openReceipt(tx);
  };

  const handleSubmitFinancialLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCandidateRecord) return;
    setIsSubmittingLink(true);
    setLinkFeedback(null);
    const res = await submitFinancialLinkRequest({
      targetScrubStudentId: selectedCandidateRecord.id,
      phone: linkPhoneInput,
      note: linkNoteInput,
    });
    setIsSubmittingLink(false);
    setLinkFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setSelectedCandidateRecord(null);
      setRecordSearchQuery('');
    }
  };

  const handleSubmitPaymentRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingPayment) return;
    setIsSubmittingPayment(true);
    setPaySubmitFeedback(null);
    const res = await submitStudentPaymentRequest({
      amountIQD: payAmountInput,
      paymentMethod: payMethodInput,
      gatewayProvider:
        payMode === 'iraq_gateway' ? 'qicard' : 'cash_committee',
      referenceCode: payRefInput,
      notes: payNoteInput,
      idempotencyKey: payIdempotencyKey,
    });
    setIsSubmittingPayment(false);
    setPaySubmitFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
    if (res.success) {
      setPayRefInput('');
      setPayNoteInput('');
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      if (typeof reader.result === 'string') {
        setSettingsAvatar(reader.result);
        await updateMyProfileSettings({
          fullName: settingsName || currentUser.fullName,
          preferredTitle: settingsTitle,
          phone: settingsPhone,
          avatarUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveAccountSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingSettings(true);
    setSettingsFeedback(null);
    const res = await updateMyProfileSettings({
      fullName: settingsName,
      preferredTitle: settingsTitle,
      phone: settingsPhone,
      avatarUrl: settingsAvatar,
    });
    setIsSavingSettings(false);
    setSettingsFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSubmitModeratorApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqFullName.trim() || reqFullName.trim().length < 3) {
      setReqFeedback({
        type: 'error',
        text: 'يرجى كتابة الاسم الثلاثي كاملاً بشكل صحيح.',
      });
      return;
    }
    setIsSubmittingReq(true);
    setReqFeedback(null);
    const res = await submitModeratorRequest({
      userName: reqFullName.trim(),
      userPhone: reqPhone.trim(),
      note: reqNote.trim(),
    });
    setIsSubmittingReq(false);
    if (res.success) {
      setReqFeedback({ type: 'success', text: res.notice });
    } else {
      setReqFeedback({ type: 'error', text: res.notice });
    }
  };

  const handleDeleteMedia = (mediaId: string) => {
    LocalStorageManager.deletePrivateMedia(currentUser.id, mediaId);
    setPrivateMedia(LocalStorageManager.getPrivateMedia(currentUser.id));
  };

  const handleSaveMyName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayNameInput.trim() || displayNameInput.trim().length < 2) return;
    const res = await updateMyDisplayName(displayNameInput.trim());
    setNameSaveMsg(res.message);
    if (res.success) {
      setEditingName(false);
      setTimeout(() => setNameSaveMsg(null), 3000);
    }
  };

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 text-right">
      {/* 1 & 2. Personal Profile Header + Avatar + Triple Name + Personalized Greeting */}
      <div className="rounded-3xl bg-gradient-to-br from-[#101B2C] via-[#122438] to-[#0A0D12] border border-[#35D6C2]/30 p-5 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl clinical-grid-bg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="relative group shrink-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-[#101B2C] to-[#1d2a40] border-2 border-[#35D6C2]/60 flex items-center justify-center text-3xl font-black text-[#35D6C2] shadow-xl overflow-hidden">
              {currentUser.avatarUrl || settingsAvatar ? (
                <img
                  src={settingsAvatar || currentUser.avatarUrl}
                  alt={currentUser.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser.fullName.charAt(0)}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => avatarFileInputRef.current?.click()}
              className="absolute -bottom-1.5 -left-1.5 p-2 rounded-xl bg-[#35D6C5] text-[#0A0D12] shadow-lg hover:scale-105 transition cursor-pointer"
              title="تغيير الصورة الشخصية"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input
              ref={avatarFileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
            />
          </div>

          <div className="space-y-1.5 flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#35D6C5]/15 border border-[#35D6C5]/30 text-[#35D6C5] text-[11px] font-bold">
              <Sparkles className="w-3 h-3" />
              <span>مرحباً بك في مساحتك الشخصية — دفعة التمريض 2027</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#F4F8FC]">
                أهلاً بك،{' '}
                {currentUser.displayTitle ||
                  (currentUser.preferredTitle === 'nurse_f'
                    ? `الممرضة ${currentUser.fullName}`
                    : `الممرض ${currentUser.fullName}`)}
              </h1>
              <button
                type="button"
                onClick={() => setEditingName(!editingName)}
                className="px-2.5 py-0.5 rounded-lg bg-white/10 text-slate-200 border border-white/15 text-[11px] font-bold hover:bg-white/15 cursor-pointer"
              >
                {editingName ? 'إلغاء' : 'تعديل الاسم'}
              </button>
              {myLinkedScrubStudent ? (
                <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>
                    مرتبط بالسجل المالي #{myLinkedScrubStudent.studentNumber}
                  </span>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveTab('find_record')}
                  className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold hover:bg-amber-500/30 cursor-pointer flex items-center gap-1"
                >
                  <Link2 className="w-3 h-3" />
                  <span>اربط سجلك المالي الآن</span>
                </button>
              )}
            </div>

            {editingName && (
              <form
                onSubmit={handleSaveMyName}
                className="flex flex-wrap items-center gap-2 pt-1 max-w-md"
              >
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="أدخل اسمك الثلاثي..."
                  className="flex-1 bg-[#090E17] border border-[#35D6C5]/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-extrabold text-xs cursor-pointer"
                >
                  حفظ
                </button>
              </form>
            )}

            {nameSaveMsg && (
              <p className="text-xs text-emerald-400 font-bold">{nameSaveMsg}</p>
            )}

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span className="text-[#D7B875] font-extrabold">
                تخرج دفعة التمريض 2027
              </span>
              {myLinkedScrubStudent?.section && (
                <>
                  <span>•</span>
                  <span className="text-[#35D6C5] font-bold">
                    {myLinkedScrubStudent.section}
                  </span>
                </>
              )}
              <span>•</span>
              <span dir="ltr">
                {currentUser.phone || currentUser.email || 'حساب طالب موثق'}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <div className="hidden xl:block w-20 h-14">
            <StethoscopeGradCapIllustration className="w-full h-full" />
          </div>
          {(isAdmin || isModerator) && (
            <button
              onClick={() => navigateTo('admin_dashboard')}
              className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-[#35D6C5]/20 hover:bg-[#35D6C5]/30 text-[#35D6C5] border border-[#35D6C5]/40 font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>لوحة الإدارة</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('studio')}
            className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#35D6C5] to-[#20b5a5] text-[#0A0D12] font-extrabold text-xs shadow-md shadow-[#35D6C5]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>استوديو التخرج</span>
          </button>
          <button
            onClick={openPaymentModal}
            className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D7B875] to-[#bf9e5a] text-[#0A0D12] font-extrabold text-xs shadow-md shadow-[#D7B875]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <CreditCard className="w-4 h-4" />
            <span>تسديد المبلغ</span>
          </button>
          <button
            onClick={logout}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-[#E85D65]/15 text-slate-300 hover:text-[#E85D65] border border-white/10 transition-colors cursor-pointer"
            title="تسجيل الخروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatedEcgWaveform
        color="#35D6C2"
        opacity="opacity-20"
        className="w-full h-6"
      />

      {/* Comprehensive Navigation Tabs covering all 12 required items */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-slate-300 hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>ملخص الحساب والمالية</span>
        </button>

        <button
          onClick={() => setActiveTab('find_record')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'find_record'
              ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-slate-300 hover:text-white'
          }`}
        >
          <Search className="w-4 h-4" />
          <span>العثور على سجلي المالي</span>
          {!myLinkedScrubStudent && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black">
              مهم
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'payments'
              ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-slate-300 hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>
            سجل الدفعات والإيصالات (
            {myStudentPayments.length + myLegacyPayments.length})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('studio')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'studio'
              ? 'bg-[#D7B875] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-[#D7B875] hover:bg-white/10 border border-[#D7B875]/30'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>استوديو التخرج وتصاميمي ({mySavedStudioDesigns.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'notifications'
              ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-slate-300 hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>إشعاراتي الشخصية</span>
          {unreadNotifsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-500 text-white text-[9px] font-black">
              {unreadNotifsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'settings'
              ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-slate-300 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>إعدادات حسابي</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'media'
              ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-slate-300 hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>مجلدي الخاص ({privateMedia.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('moderator_request')}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'moderator_request'
              ? 'bg-[#35D6C5] text-[#0A0D12] shadow-md'
              : 'bg-[#101827] text-slate-300 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>طلب الانضمام للإشراف</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: OVERVIEW & FINANCIAL PROGRESS SUMMARY                        */}
      {/* =================================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Prompt to link financial record if not yet linked */}
          {!myLinkedScrubStudent && (
            <div className="rounded-3xl bg-gradient-to-r from-[#1A160B] via-[#1E1A0E] to-[#101827] border border-[#D7B875]/40 p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 text-xs font-extrabold text-[#D7B875]">
                  <Link2 className="w-4 h-4" />
                  <span>ميزة العثور على سجلك المالي وربطه بحسابك</span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  هل اسمك موجود في قائمة الدفعة (244 طالباً) أو دفعت العربون سابقاً؟
                </h3>
                <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
                  ابحث عن اسمك الثلاثي الآن وأرسل طلب ربط سجلك المالي بحسابك الشخصي لتظهر جميع دفعاتك المسبقة وإيصالاتك الرسمية تلقائياً هنا.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('find_record')}
                className="px-5 py-3 rounded-xl bg-[#D7B875] text-[#0A0D12] font-black text-xs shrink-0 flex items-center gap-2 cursor-pointer shadow-lg shadow-[#D7B875]/20"
              >
                <Search className="w-4 h-4" />
                <span>العثور على سجلي المالي</span>
              </button>
            </div>
          )}

          {/* Scrub Party Financial Card with Approved Fee, Paid, Remaining & Completion % */}
          <div className="rounded-3xl glass-panel border border-[#35D6C5]/35 p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    الملخص المالي لفعالية حفلة السكراب (دفعة 2027)
                  </h3>
                  <p className="text-xs text-[#A6F0DF]">
                    الموعد: {eventConfig.scrubPartyDateDisplay} • المكان:{' '}
                    {eventConfig.scrubVenue} • بعدسة:{' '}
                    {eventConfig.scrubPhotographer}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span
                  className={`px-3 py-1 rounded-xl text-xs font-extrabold ${getPaymentStatusBadgeClass(
                    myLinkedScrubStudent?.paymentStatus ||
                      currentUser.scrubStatus
                  )}`}
                >
                  الحالة:{' '}
                  {getPaymentStatusArabic(
                    myLinkedScrubStudent?.paymentStatus ||
                      currentUser.scrubStatus
                  )}
                </span>
                <button
                  onClick={openPaymentModal}
                  className="px-4 py-2 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>تسديد المبلغ</span>
                </button>
              </div>
            </div>

            {/* 4 Key Metrics Grid: Approved Price, Paid, Remaining, Pending */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-white/10 space-y-1">
                <span className="text-[11px] text-slate-400 font-bold block">
                  السعر المعتمد للحفلة
                </span>
                <span className="text-xl font-black text-white font-mono">
                  {formatIQD(approvedScrubFeeIQD)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-[#35D6C5]/35 space-y-1">
                <span className="text-[11px] text-[#A6F0DF] font-bold block">
                  المبلغ المدفوع (الموثق)
                </span>
                <span className="text-xl font-black text-[#35D6C5] font-mono">
                  {formatIQD(verifiedScrubPaidIQD)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-[#D7B875]/35 space-y-1">
                <span className="text-[11px] text-[#D7B875] font-bold block">
                  المبلغ المتبقي عليك
                </span>
                <span
                  className={`text-xl font-black font-mono ${
                    remainingScrubBalanceIQD === 0
                      ? 'text-emerald-400'
                      : 'text-[#D7B875]'
                  }`}
                >
                  {formatIQD(remainingScrubBalanceIQD)}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#0A0D12]/90 border border-white/10 space-y-1">
                <span className="text-[11px] text-amber-300 font-bold block">
                  دفعات قيد المراجعة
                </span>
                <span className="text-xl font-black text-amber-300 font-mono">
                  {formatIQD(pendingScrubPaidIQD)}
                </span>
              </div>
            </div>

            {/* Payment Completion Progress Bar */}
            <div className="p-4 rounded-2xl bg-[#0A0D12]/80 border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs font-extrabold">
                <span className="text-slate-200">نسبة الإنجاز في التسديد</span>
                <span className="font-mono text-[#35D6C5]">
                  {paymentCompletionPercent}%
                </span>
              </div>
              <div className="w-full h-3 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#35D6C5] to-[#D7B875] transition-all duration-500"
                  style={{ width: `${paymentCompletionPercent}%` }}
                />
              </div>
              <p className="text-[11px] text-slate-400">
                {remainingScrubBalanceIQD === 0
                  ? 'مبارك! لقد أكملت تسديد كامل مبلغ حفلة السكراب بنجاح.'
                  : `تم توثيق ${formatIQD(verifiedScrubPaidIQD)} من أصل ${formatIQD(approvedScrubFeeIQD)}. المتبقي لتسديد كامل الرسوم: ${formatIQD(remainingScrubBalanceIQD)}.`}
              </p>
            </div>
          </div>

          {/* Graduation Studio & Official Graduation Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graduation Studio Promo Box */}
            <div className="rounded-3xl bg-gradient-to-br from-[#101827] via-[#132338] to-[#0B1722] border border-[#35D6C5]/35 p-6 flex flex-col justify-between gap-4 shadow-xl">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#35D6C5]/15 border border-[#35D6C5]/30 text-[#35D6C5] text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>استوديو التخرج الشخصي (10 قوالب)</span>
                </div>
                <h3 className="text-lg font-black text-white">
                  صمّم بطاقة تخرجك وشهادتك التقديرية باسمك وصورتك
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  ارفع صورتك الشخصية مع الحفاظ التام على ملامحك، اختر الوشاح التركوازي أو الملكي، واحفظ تصاميمك بجودة عالية في حسابك.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 pt-2">
                <button
                  onClick={() => setActiveTab('studio')}
                  className="px-5 py-2.5 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>فتح استوديو التخرج</span>
                </button>
                <button
                  onClick={() => setShowCardModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-[#D7B875]" />
                  <span>البطاقة التذكارية السريعة</span>
                </button>
              </div>
            </div>

            {/* Account Information Summary Card */}
            <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <User className="w-4 h-4 text-[#35D6C5]" />
                  <span>بيانات حسابك الشخصي</span>
                </h3>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="text-xs font-bold text-[#35D6C5] hover:underline cursor-pointer"
                >
                  تعديل الإعدادات
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-[#0A0D12] border border-white/10">
                  <span className="text-slate-400 block text-[10px]">
                    الاسم الثلاثي واللقب:
                  </span>
                  <span className="font-bold text-white">
                    {currentUser.preferredTitle === 'nurse_f'
                      ? 'الممرضة'
                      : 'الممرض'}{' '}
                    {currentUser.fullName}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0D12] border border-white/10">
                  <span className="text-slate-400 block text-[10px]">
                    السجل المالي المرتبط:
                  </span>
                  <span className="font-bold text-[#35D6C5]">
                    {myLinkedScrubStudent
                      ? `#${myLinkedScrubStudent.studentNumber} — ${myLinkedScrubStudent.fullName}`
                      : 'غير مرتبط بعد'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0D12] border border-white/10">
                  <span className="text-slate-400 block text-[10px]">
                    البريد الإلكتروني / الهاتف:
                  </span>
                  <span className="font-mono text-white" dir="ltr">
                    {currentUser.email || currentUser.phone || 'مسجل'}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#0A0D12] border border-white/10">
                  <span className="text-slate-400 block text-[10px]">
                    التصاميم والإيصالات المحفوظة:
                  </span>
                  <span className="font-bold text-[#D7B875]">
                    {mySavedStudioDesigns.length} تصميم •{' '}
                    {myStudentPayments.length + myLegacyPayments.length} إيصال
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: FIND MY FINANCIAL RECORD ("العثور على سجلي المالي")           */}
      {/* =================================================================== */}
      {activeTab === 'find_record' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="border-b border-white/10 pb-4 space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#35D6C5]/15 border border-[#35D6C5]/30 text-[#35D6C5] text-xs font-extrabold">
              <Link2 className="w-3.5 h-3.5" />
              <span>ربط الحساب بالسجل المالي الرسمي للدفعة</span>
            </div>
            <h3 className="text-xl font-black text-white">
              العثور على سجلي المالي في قائمة دفعة 2027
            </h3>
            <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
              ابحث عن اسمك الثلاثي أو الرباعي في القائمة الرسمية للدفعة (244 طالباً وطالبة)، ثم أرسل طلب ربط سجلك المالي بحسابك. يقوم المشرفون بالتحقق من الطلب والموافقة عليه دون إنشاء أي سجل مكرر.
            </p>
          </div>

          {linkFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
                linkFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{linkFeedback.text}</span>
            </div>
          )}

          {/* If already linked */}
          {myLinkedScrubStudent ? (
            <div className="p-6 rounded-2xl bg-emerald-950/25 border border-emerald-500/40 space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 shrink-0" />
                <div>
                  <h4 className="text-base font-black text-white">
                    حسابك مرتبط رسمياً بسجلك المالي!
                  </h4>
                  <p className="text-xs text-emerald-200">
                    تم التحقق وربط حسابك بالسجل رقم (#
                    {myLinkedScrubStudent.studentNumber}) باسم «
                    {myLinkedScrubStudent.fullName}» (
                    {myLinkedScrubStudent.section || 'القائمة الرسمية'}).
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2">
                <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-white/10">
                  <span className="text-slate-400 block">السعر المعتمد:</span>
                  <span className="text-base font-black text-white font-mono">
                    {formatIQD(myLinkedScrubStudent.totalFeeIQD)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-emerald-500/30">
                  <span className="text-slate-400 block">المدفوع الموثق:</span>
                  <span className="text-base font-black text-emerald-400 font-mono">
                    {formatIQD(myLinkedScrubStudent.verifiedPaidIQD)}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#0A0D12] border border-[#D7B875]/30">
                  <span className="text-slate-400 block">المتبقي:</span>
                  <span className="text-base font-black text-[#D7B875] font-mono">
                    {formatIQD(myLinkedScrubStudent.remainingBalanceIQD)}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Show existing link request status if any */}
              {latestLinkRequest && (
                <div
                  className={`p-5 rounded-2xl border space-y-2 ${
                    latestLinkRequest.status === 'pending'
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-200'
                      : latestLinkRequest.status === 'approved'
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-200'
                      : 'bg-red-500/10 border-red-500/40 text-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black">
                      حالة طلب الربط الأخير للسجل (#
                      {latestLinkRequest.targetStudentNumber}){' '}
                      {latestLinkRequest.targetStudentName}:
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-black/30 text-[11px] font-bold">
                      {latestLinkRequest.status === 'pending'
                        ? 'قيد مراجعة المشرفين'
                        : latestLinkRequest.status === 'approved'
                        ? 'تمت الموافقة'
                        : 'مرفوض'}
                    </span>
                  </div>
                  {latestLinkRequest.rejectionReason && (
                    <p className="text-xs">
                      ملاحظة المشرف: {latestLinkRequest.rejectionReason}
                    </p>
                  )}
                </div>
              )}

              {/* Search Input */}
              <div className="space-y-3">
                <label className="text-xs font-extrabold text-slate-200 block">
                  ابحث عن اسمك الثلاثي أو رقم التسلسل في القائمة الرسمية:
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-[#35D6C5] absolute right-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={recordSearchQuery}
                    onChange={(e) => setRecordSearchQuery(e.target.value)}
                    placeholder="اكتب اسمك الثلاثي هنا (مثال: مصطفى علي حسون)..."
                    className="w-full pr-11 pl-4 py-3.5 rounded-2xl bg-[#0A0D12] border border-white/15 text-white text-sm font-bold focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>
              </div>

              {/* Search Results (Non-sensitive identifying info only) */}
              {recordSearchQuery.trim().length >= 2 && (
                <div className="space-y-2.5">
                  <div className="text-xs font-bold text-slate-400">
                    نتائج البحث المطابقة ({matchingRosterCandidates.length}):
                  </div>
                  {matchingRosterCandidates.length === 0 ? (
                    <div className="p-6 rounded-2xl bg-[#0A0D12] border border-white/10 text-center text-xs text-slate-400">
                      لم يتم العثور على اسم مطابق. جرب كتابة الاسم الأول واسم الأب بدون همزات.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {matchingRosterCandidates.map((stu) => {
                        const isAlreadyClaimed =
                          stu.isLinkedToAccount &&
                          stu.linkedUserId !== currentUid;
                        const isSelected =
                          selectedCandidateRecord?.id === stu.id;
                        return (
                          <div
                            key={stu.id}
                            className={`p-4 rounded-2xl border transition flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'bg-[#35D6C5]/15 border-[#35D6C5]'
                                : 'bg-[#0A0D12] border-white/10 hover:border-white/25'
                            }`}
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded-md bg-white/10 text-[#D7B875] font-mono text-[11px] font-bold">
                                  #{stu.studentNumber}
                                </span>
                                {stu.section && (
                                  <span className="text-[11px] text-[#35D6C5] font-bold">
                                    {stu.section}
                                  </span>
                                )}
                              </div>
                              <h4 className="text-sm font-black text-white">
                                {stu.fullName}
                              </h4>
                            </div>

                            {isAlreadyClaimed ? (
                              <span className="px-2.5 py-1 rounded-xl bg-red-500/15 text-red-300 border border-red-500/30 text-[10px] font-bold shrink-0 flex items-center gap-1">
                                <Lock className="w-3 h-3" />
                                <span>مرتبط بحساب آخر</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setSelectedCandidateRecord(stu)}
                                className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 cursor-pointer ${
                                  isSelected
                                    ? 'bg-[#35D6C5] text-[#0A0D12]'
                                    : 'bg-white/10 hover:bg-white/15 text-white'
                                }`}
                              >
                                {isSelected ? 'تم الاختيار ✓' : 'اختيار للربط'}
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Confirmation Form to Submit Link Request */}
              {selectedCandidateRecord && (
                <form
                  onSubmit={handleSubmitFinancialLink}
                  className="p-5 sm:p-6 rounded-2xl bg-[#0A0D12] border border-[#35D6C5]/40 space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <div>
                      <span className="text-[11px] text-[#35D6C5] font-bold block">
                        تأكيد طلب ربط السجل المالي المختار:
                      </span>
                      <h4 className="text-base font-black text-white">
                        #{selectedCandidateRecord.studentNumber} —{' '}
                        {selectedCandidateRecord.fullName} (
                        {selectedCandidateRecord.section || 'المرحلة الثانية'})
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCandidateRecord(null)}
                      className="text-xs text-slate-400 hover:text-white"
                    >
                      تغيير السجل
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        رقم الهاتف للتواصل والتأكيد
                      </label>
                      <input
                        type="tel"
                        value={linkPhoneInput}
                        onChange={(e) => setLinkPhoneInput(e.target.value)}
                        placeholder="07XXXXXXXXX"
                        dir="ltr"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101827] border border-white/15 text-white text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        ملاحظة إضافية للمشرفين (اختياري)
                      </label>
                      <input
                        type="text"
                        value={linkNoteInput}
                        onChange={(e) => setLinkNoteInput(e.target.value)}
                        placeholder="مثال: الشعبة أو تأكيد دفع العربون..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#101827] border border-white/15 text-white text-xs"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingLink}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#35D6C5] to-[#20b5a5] text-[#0A0D12] font-black text-xs flex items-center gap-2 cursor-pointer"
                  >
                    <Link2 className="w-4 h-4" />
                    <span>
                      {isSubmittingLink
                        ? 'جارِ إرسال الطلب...'
                        : 'إرسال طلب ربط السجل المالي للمشرفين'}
                    </span>
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: PAYMENTS HISTORY, RECEIPTS & PAY BUTTON                      */}
      {/* =================================================================== */}
      {activeTab === 'payments' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">
                سجل الدفعات والإيصالات المالية الخاصة بك
              </h3>
              <p className="text-xs text-slate-400">
                تظهر هنا جميع الدفعات الموثقة والطلبات قيد المراجعة والإيصالات الرسمية الخاصة بحسابك حصرياً.
              </p>
            </div>
            <button
              onClick={openPaymentModal}
              className="px-5 py-2.5 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <CreditCard className="w-4 h-4" />
              <span>تسديد المبلغ</span>
            </button>
          </div>

          {myStudentPayments.length === 0 && myLegacyPayments.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-[#0A0D12] border border-dashed border-white/10 space-y-3">
              <FileText className="w-12 h-12 text-slate-500 mx-auto opacity-50" />
              <p className="text-sm font-bold text-white">
                لا توجد دفعات أو إيصالات مرتبطة بحسابك حالياً
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                إذا كنت قد دفعت العربون مسبقاً، انتقل إلى تبويب «العثور على سجلي المالي» لربط حسابك بسجلك في قائمة الدفعة.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myStudentPayments.map((sp) => (
                <div
                  key={sp.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0A0D12] border border-white/10 hover:border-[#35D6C5]/35 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {sp.receiptNumber}
                      </span>
                      <span className="text-[11px] text-[#D7B875] font-mono">
                        [{sp.referenceCode}]
                      </span>
                      {sp.verificationStatus === 'verified' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>ناجحة / موثقة</span>
                        </span>
                      ) : sp.verificationStatus === 'pending' ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>قيد الانتظار والتدقيق</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-extrabold flex items-center gap-1">
                          <XCircle className="w-3 h-3" />
                          <span>ملغاة أو مرفوضة</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      التاريخ: {formatArabicDate(sp.date)} - {sp.time} • الطريقة:{' '}
                      {sp.paymentMethod === 'cash' ? 'نقدي (كاش)' : 'تحويل مالي'}
                    </p>
                    {sp.notes && (
                      <p className="text-[11px] text-slate-300">
                        ملاحظات: {sp.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-white/10 pt-3 sm:pt-0">
                    <span className="text-lg font-black text-[#35D6C5] font-mono">
                      {formatIQD(sp.amountIQD)}
                    </span>
                    {sp.verificationStatus === 'verified' && (
                      <button
                        onClick={() => handleOpenStudentPaymentReceipt(sp)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#35D6C5]" />
                        <span>عرض الإيصال</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {myLegacyPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#0A0D12] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {p.receiptNumber}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        ناجحة / موثقة
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      التاريخ: {formatArabicDate(p.date)} - {p.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-black text-[#35D6C5] font-mono">
                      {formatIQD(p.amountIQD)}
                    </span>
                    <button
                      onClick={() => openReceipt(p)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#35D6C5]" />
                      <span>عرض الإيصال</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: GRADUATION STUDIO & SAVED DESIGNS                            */}
      {/* =================================================================== */}
      {activeTab === 'studio' && <GraduationStudio embedded />}

      {/* =================================================================== */}
      {/* TAB 5: PERSONAL NOTIFICATIONS                                       */}
      {/* =================================================================== */}
      {activeTab === 'notifications' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">
                إشعاراتي وتنبيهاتي الشخصية ({myNotifications.length})
              </h3>
              <p className="text-xs text-slate-400">
                تنبيهات حسابك الخاصة، إشعارات الموافقة على ربط السجل المالي، الإيصالات الجديدة، وإعلانات الدفعة.
              </p>
            </div>
            {unreadNotifsCount > 0 && (
              <button
                onClick={() =>
                  markAllNotificationsAsRead(
                    myNotifications.filter((n) => !n.isRead).map((n) => n.id),
                    currentUid
                  )
                }
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-xs font-bold text-[#35D6C5] cursor-pointer"
              >
                تحديد الكل كمقروء
              </button>
            )}
          </div>

          {myNotifications.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-[#0A0D12] border border-white/10 text-xs text-slate-400">
              لا توجد إشعارات جديدة حالياً.
            </div>
          ) : (
            <div className="space-y-3">
              {myNotifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n.id, currentUid)}
                  className={`p-4 rounded-2xl border transition cursor-pointer flex items-start justify-between gap-4 ${
                    n.isRead
                      ? 'bg-[#0A0D12]/70 border-white/10'
                      : 'bg-[#132235] border-[#35D6C5]/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-white">
                        {n.title}
                      </span>
                      {!n.isRead && (
                        <span className="px-2 py-0.5 rounded-full bg-[#35D6C5] text-[#0A0D12] text-[9px] font-black">
                          جديد
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {n.message}
                    </p>
                    <span className="text-[10px] text-slate-500 block">
                      {formatArabicDate(n.createdAt)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 6: ACCOUNT SETTINGS ("إعدادات حسابه")                            */}
      {/* =================================================================== */}
      {activeTab === 'settings' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl max-w-3xl">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-black text-white">
              إعدادات الحساب الشخصي والملف التمريضي
            </h3>
            <p className="text-xs text-slate-400">
              تحكم بصورتك الشخصية، اسمك الثلاثي، اللقب التمريضي المفضل، ورقم الهاتف.
            </p>
          </div>

          {settingsFeedback && (
            <div
              className={`p-4 rounded-2xl border text-xs font-bold ${
                settingsFeedback.type === 'success'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-500/15 border-red-500/40 text-red-300'
              }`}
            >
              {settingsFeedback.text}
            </div>
          )}

          <form onSubmit={handleSaveAccountSettings} className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-[#0A0D12] border border-[#35D6C5]/40 overflow-hidden flex items-center justify-center text-2xl font-black text-[#35D6C5]">
                {settingsAvatar ? (
                  <img
                    src={settingsAvatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{settingsName.charAt(0) || 'ط'}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => avatarFileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#35D6C5]" />
                <span>رفع صورة شخصية جديدة</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  الاسم الثلاثي الكامل
                </label>
                <input
                  type="text"
                  required
                  value={settingsName}
                  onChange={(e) => setSettingsName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white text-xs font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  اللقب التمريضي
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSettingsTitle('nurse_m')}
                    className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      settingsTitle === 'nurse_m'
                        ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                        : 'bg-[#0A0D12] text-slate-300 border-white/10'
                    }`}
                  >
                    الممرض
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettingsTitle('nurse_f')}
                    className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                      settingsTitle === 'nurse_f'
                        ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                        : 'bg-[#0A0D12] text-slate-300 border-white/10'
                    }`}
                  >
                    الممرضة
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                رقم الهاتف الشخصي
              </label>
              <input
                type="tel"
                value={settingsPhone}
                onChange={(e) => setSettingsPhone(e.target.value)}
                dir="ltr"
                placeholder="07XXXXXXXXX"
                className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={isSavingSettings}
              className="px-6 py-3 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs cursor-pointer"
            >
              {isSavingSettings ? 'جارِ الحفظ...' : 'حفظ إعدادات الحساب'}
            </button>
          </form>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 7: PRIVATE MEDIA VAULT                                          */}
      {/* =================================================================== */}
      {activeTab === 'media' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="border-b border-white/10 pb-4">
            <h3 className="text-lg font-bold text-white">
              خزانة الصور والوسائط الخاصة بك
            </h3>
            <p className="text-xs text-[#929BAA]">
              وسائط خاصة تماماً لا تظهر في المعرض العام، خاصة بحسابك فقط لحفظ ذكريات السكراب والتخرج.
            </p>
          </div>

          {uploadSuccess && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
              {uploadSuccess}
            </div>
          )}

          <MediaUploadZone
            destinationLabel="مجلدك الخاص المحمي"
            submitButtonText="إضافة إلى مجلدي الخاص"
            onUploadSuccess={(res: UploadResult) => {
              const newItem: GraduatePrivateMedia = {
                id: 'priv-' + Date.now(),
                graduateId: currentUser.id,
                title: res.title,
                url: res.url,
                uploadedAt: new Date().toISOString().split('T')[0],
                sizeBytes: Math.round(res.sizeMb * 1024 * 1024),
              };
              LocalStorageManager.savePrivateMedia(newItem);
              setPrivateMedia(
                LocalStorageManager.getPrivateMedia(currentUser.id)
              );
              setUploadSuccess(
                'تم رفع وحفظ الملف بنجاح في مجلدك الشخصي الخاص!'
              );
              setTimeout(() => setUploadSuccess(null), 3500);
            }}
          />

          {privateMedia.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-[#090B10] border border-dashed border-white/10">
              <ImageIcon className="w-10 h-10 text-[#929BAA] mx-auto mb-2 opacity-40" />
              <p className="text-xs text-[#929BAA]">
                مجلدك الشخصي فارغ حالياً. يمكنك حفظ صورك التذكارية وبطاقتك هنا بأمان.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {privateMedia.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl bg-[#090B10] border border-white/10 overflow-hidden group shadow-lg"
                >
                  <div className="aspect-video bg-black/50 overflow-hidden relative">
                    <img
                      src={m.url}
                      alt={m.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all"
                      title="حذف من مجلدي"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-bold text-white truncate">
                      {m.title}
                    </h4>
                    <span className="text-[10px] text-[#929BAA]">
                      {m.uploadedAt}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 8: MODERATOR REQUEST                                            */}
      {/* =================================================================== */}
      {activeTab === 'moderator_request' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#35D6C5]/10 border border-[#35D6C5]/30 text-[#35D6C5] text-xs font-bold mb-2">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>فريق تنظيم دفعة 2027</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                طلب الانضمام إلى فريق التنظيم والإشراف
              </h3>
              <p className="text-xs text-[#929BAA] max-w-2xl mt-1">
                تتيح هذه الاستمارة للطلبة الراغبين بالمشاركة في تنظيم شؤون دفعة التمريض 2027 وفعاليات التخرج تقديم طلب انضمام إلى فريق تنظيم الدفعة.
              </p>
            </div>
          </div>

          {reqFeedback && (
            <div
              className={`p-4 rounded-2xl flex items-center gap-2.5 text-xs font-bold ${
                reqFeedback.type === 'success'
                  ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
                  : 'bg-red-500/15 text-red-200 border border-red-500/30'
              }`}
            >
              <span>{reqFeedback.text}</span>
            </div>
          )}

          {isAdmin || isModerator ? (
            <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 text-center space-y-3">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto" />
              <h4 className="text-base font-bold text-white">
                لديك صلاحيات إشرافية نشطة
              </h4>
              <button
                type="button"
                onClick={() => navigateTo('admin_dashboard')}
                className="px-5 py-2.5 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs cursor-pointer"
              >
                الدخول إلى لوحة الإدارة
              </button>
            </div>
          ) : myModeratorRequest?.status === 'pending' ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
              <h4 className="text-sm font-black text-white">
                طلبك قيد المراجعة والتدقيق من قبل المشرف العام
              </h4>
              <p className="text-xs text-amber-200">
                تاريخ تقديم الطلب:{' '}
                {formatArabicDate(myModeratorRequest.requestedAt)}
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmitModeratorApp}
              className="space-y-4 max-w-2xl bg-[#090E17] border border-white/10 p-5 sm:p-6 rounded-2xl"
            >
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  الاسم الثلاثي للطالب *
                </label>
                <input
                  type="text"
                  required
                  value={reqFullName}
                  onChange={(e) => setReqFullName(e.target.value)}
                  className="w-full bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  رقم الهاتف للتواصل
                </label>
                <input
                  type="tel"
                  value={reqPhone}
                  onChange={(e) => setReqPhone(e.target.value)}
                  dir="ltr"
                  className="w-full bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3.5 text-xs text-white"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-200">
                  مجال المساهمة أو الملاحظات
                </label>
                <textarea
                  rows={3}
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  className="w-full bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3.5 text-xs text-white"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmittingReq}
                className="px-6 py-2.5 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs cursor-pointer"
              >
                {isSubmittingReq
                  ? 'جاري الإرسال...'
                  : 'إرسال طلب الانضمام للإشراف'}
              </button>
            </form>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL: STUDENT PAYMENT SUBMISSION ("تسديد المبلغ")                   */}
      {/* =================================================================== */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-xl rounded-3xl bg-[#101827] border border-[#35D6C5]/40 p-6 sm:p-7 space-y-5 text-right shadow-2xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#35D6C5]" />
                  <span>تسديد رسوم حفلة السكراب — دفعة 2027</span>
                </h3>
                <p className="text-xs text-slate-400">
                  السعر المعتمد: {formatIQD(approvedScrubFeeIQD)} • المتبقي عليك:{' '}
                  <strong className="text-[#D7B875]">
                    {formatIQD(remainingScrubBalanceIQD)}
                  </strong>
                </p>
              </div>
              <button
                onClick={() => setShowPayModal(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                إغلاق ✕
              </button>
            </div>

            {!myLinkedScrubStudent ? (
              <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/35 space-y-3">
                <p className="text-xs text-amber-200 font-bold leading-relaxed">
                  يرجى ربط حسابك بسجلك المالي أولاً عبر ميزة «العثور على سجلي المالي» لكي تُسجّل الدفعة على اسمك ورقمك التسلسلي بدقة.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowPayModal(false);
                    setActiveTab('find_record');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#D7B875] text-[#0A0D12] font-black text-xs cursor-pointer"
                >
                  الانتقال إلى العثور على سجلي المالي
                </button>
              </div>
            ) : (
              <>
                {/* Payment Mode Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setPayMode('committee_cash')}
                    className={`p-3.5 rounded-2xl border text-right cursor-pointer transition ${
                      payMode === 'committee_cash'
                        ? 'bg-[#35D6C5]/15 border-[#35D6C5] text-white'
                        : 'bg-[#0A0D12] border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-[#35D6C5]">
                      <Banknote className="w-4 h-4" />
                      <span>طلب تسديد نقدي / تحويل للجنة</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">
                      يُسجل بحالة «قيد الانتظار» ويُوثق فور استلام اللجنة للمبلغ.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayMode('iraq_gateway')}
                    className={`p-3.5 rounded-2xl border text-right cursor-pointer transition ${
                      payMode === 'iraq_gateway'
                        ? 'bg-[#D7B875]/15 border-[#D7B875] text-white'
                        : 'bg-[#0A0D12] border-white/10 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-black text-xs text-[#D7B875]">
                      <Wallet className="w-4 h-4" />
                      <span>بوابة البطاقات العراقية الإلكترونية</span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-1">
                      QiCard / ZainCash / Switch (دفع إلكتروني مشفّر).
                    </p>
                  </button>
                </div>

                {paySubmitFeedback && (
                  <div
                    className={`p-4 rounded-2xl border text-xs font-bold ${
                      paySubmitFeedback.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : 'bg-red-500/15 border-red-500/40 text-red-300'
                    }`}
                  >
                    {paySubmitFeedback.text}
                  </div>
                )}

                {payMode === 'iraq_gateway' &&
                !eventConfig.paymentGatewayConfig?.electronicGatewayEnabled ? (
                  <div className="p-5 rounded-2xl bg-[#0A0D12] border border-[#D7B875]/40 space-y-3">
                    <div className="flex items-center gap-2 text-[#D7B875] font-black text-xs">
                      <Lock className="w-4 h-4" />
                      <span>
                        حالة الربط مع بوابة الدفع الإلكترونية (
                        {eventConfig.paymentGatewayConfig?.gatewayProviderName ||
                          'QiCard / ZainCash / Switch'}
                        )
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      البنية البرمجية لبوابة الدفع العراقية مهيأة ومحمية بالكامل (لا يتم تخزين أرقام البطاقات أو رمز CVV داخل الموقع مطلقاً، ولا تُعتمد أي عملية دفع إلا بتأكيد رسمي Webhook من البوابة).
                    </p>
                    <p className="text-xs text-amber-300 font-bold">
                      تنبيه: لم يقم المشرفون بتفعيل مفاتيح التاجر الحية للبوابة الإلكترونية بعد. يمكنك حالياً تسجيل دفعتك عبر خيار «طلب تسديد نقدي / تحويل للجنة» ليتم اعتمادها من المشرفين.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPayMode('committee_cash')}
                      className="px-4 py-2.5 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs cursor-pointer"
                    >
                      التبديل إلى تسجيل دفعة للجنة التنظيم
                    </button>
                  </div>
                ) : (
                  <form
                    onSubmit={handleSubmitPaymentRequest}
                    className="space-y-4"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-200 block">
                        اختر المبلغ المراد تسديده (د.ع)
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {remainingScrubBalanceIQD > 0 && (
                          <button
                            type="button"
                            onClick={() =>
                              setPayAmountInput(remainingScrubBalanceIQD)
                            }
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                              payAmountInput === remainingScrubBalanceIQD
                                ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                                : 'bg-[#0A0D12] text-slate-300 border-white/10'
                            }`}
                          >
                            كامل المتبقي ({formatIQD(remainingScrubBalanceIQD)})
                          </button>
                        )}
                        {[15000, 20000, 25000]
                          .filter((amt) => amt < remainingScrubBalanceIQD)
                          .map((amt) => (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setPayAmountInput(amt)}
                              className={`px-3.5 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                                payAmountInput === amt
                                  ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                                  : 'bg-[#0A0D12] text-slate-300 border-white/10'
                              }`}
                            >
                              دفعة {formatIQD(amt)}
                            </button>
                          ))}
                      </div>
                      <input
                        type="number"
                        min={5000}
                        max={Math.max(5000, remainingScrubBalanceIQD)}
                        step={1000}
                        value={payAmountInput}
                        onChange={(e) =>
                          setPayAmountInput(parseInt(e.target.value, 10) || 0)
                        }
                        className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white font-mono text-sm font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 block">
                          طريقة التسليم
                        </label>
                        <select
                          value={payMethodInput}
                          onChange={(e) =>
                            setPayMethodInput(e.target.value as PaymentMethod)
                          }
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white text-xs font-bold"
                        >
                          <option value="cash">تسليم نقدي للجنة التنظيم</option>
                          <option value="bank_transfer">
                            تحويل محفظة إلكترونية / بطاقة
                          </option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300 block">
                          رقم الوصل الورقي أو مرجع التحويل (اختياري)
                        </label>
                        <input
                          type="text"
                          value={payRefInput}
                          onChange={(e) => setPayRefInput(e.target.value)}
                          placeholder="مثال: رقم عملية التحويل..."
                          className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300 block">
                        ملاحظات إضافية
                      </label>
                      <input
                        type="text"
                        value={payNoteInput}
                        onChange={(e) => setPayNoteInput(e.target.value)}
                        placeholder="أي توضيح للجنة المالية..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white text-xs"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] text-slate-400">
                      • حماية عدم التكرار مفعّلة: لا يُخصم المبلغ من المتبقي إلا بعد تدقيق وموافقة المشرف المالي على استلام الدفعة.
                    </div>

                    <button
                      type="submit"
                      disabled={
                        isSubmittingPayment || remainingScrubBalanceIQD <= 0
                      }
                      className="w-full py-3.5 rounded-xl bg-gradient-to-r from-[#35D6C5] to-[#20b5a5] text-[#0A0D12] font-black text-xs sm:text-sm cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingPayment
                        ? 'جارِ تسجيل طلب التسديد...'
                        : `تأكيد إرسال طلب تسديد (${formatIQD(payAmountInput)})`}
                    </button>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Graduation Card Modal */}
      {showCardModal && (
        <CardGeneratorModal
          graduate={currentUser}
          onClose={() => setShowCardModal(false)}
        />
      )}
    </div>
  );
};
