import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  formatIQD,
  formatArabicDate,
  LocalStorageManager,
  getPaymentStatusBadgeClass,
  getPaymentStatusArabic,
} from '../services/storage';
import { GraduatePrivateMedia } from '../types';
import { CardGeneratorModal } from '../components/CardGeneratorModal';
import { MediaUploadZone, UploadResult } from '../components/MediaUploadZone';
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
  Printer,
  Trash2,
  Upload,
  ShieldCheck,
  AlertCircle,
  Eye,
  LogOut,
  GraduationCap,
} from 'lucide-react';

export const GraduateDashboard: React.FC = () => {
  const {
    currentUser,
    payments,
    openReceipt,
    logout,
    navigateTo,
    eventConfig,
    isAdmin,
    isModerator,
    updateMyDisplayName,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'payments' | 'card' | 'media'>('overview');
  const [showCardModal, setShowCardModal] = useState(false);
  const [privateMedia, setPrivateMedia] = useState<GraduatePrivateMedia[]>([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadUrl, setUploadUrl] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [displayNameInput, setDisplayNameInput] = useState(currentUser?.fullName || '');
  const [nameSaveMsg, setNameSaveMsg] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.fullName) {
      setDisplayNameInput(currentUser.fullName);
    }
  }, [currentUser?.fullName]);

  // If not authenticated or visitor, redirect or show error
  if (!currentUser) {
    return (
      <div className="py-20 text-center max-w-md mx-auto px-4">
        <AlertCircle className="w-12 h-12 text-[#D7B875] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">يرجى تسجيل الدخول أولاً</h2>
        <p className="text-xs text-slate-400 mb-4">
          يجب تسجيل الدخول للوصول إلى لوحة حسابك وبياناتك المالية الخاصة.
        </p>
        <button
          onClick={() => navigateTo('login')}
          className="px-6 py-2.5 rounded-xl bg-[#35D6C2] text-[#0A0D12] font-bold text-xs"
        >
          تسجيل الدخول
        </button>
      </div>
    );
  }

  // Strictly filter payments belonging to this authenticated graduate only (Privacy Rule F)
  const myPayments = payments.filter((p) => p.graduateId === currentUser.id);

  // Load private media for this graduate only
  useEffect(() => {
    if (currentUser) {
      setPrivateMedia(LocalStorageManager.getPrivateMedia(currentUser.id));
    }
  }, [currentUser]);

  const handleUploadMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadUrl.trim()) return;

    const newItem: GraduatePrivateMedia = {
      id: 'priv-' + Date.now(),
      graduateId: currentUser.id,
      title: uploadTitle.trim(),
      url: uploadUrl.trim(),
      uploadedAt: new Date().toISOString().split('T')[0],
      sizeBytes: 1024 * 1024 * 1.5,
    };

    LocalStorageManager.savePrivateMedia(newItem);
    setPrivateMedia(LocalStorageManager.getPrivateMedia(currentUser.id));
    setUploadTitle('');
    setUploadUrl('');
    setUploadSuccess('تم حفظ الصورة بنجاح في خزانتك الشخصية الخاصة!');
    setTimeout(() => setUploadSuccess(null), 3000);
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

  const isFullyPaid = currentUser.remainingBalanceIQD === 0;

  return (
    <div className="py-8 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-right">
      {/* Header Profile Bar with Curated Medical Artwork */}
      <div className="rounded-3xl bg-gradient-to-br from-[#101B2C] via-[#122438] to-[#0A0D12] border border-[#35D6C2]/30 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl clinical-grid-bg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full lg:w-auto">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-[#101B2C] to-[#1d2a40] border-2 border-[#35D6C2]/50 flex items-center justify-center text-2xl font-black text-[#35D6C2] shadow-lg shrink-0">
            {currentUser.avatarUrl ? (
              <img src={currentUser.avatarUrl} alt={currentUser.fullName} className="w-full h-full object-cover rounded-2xl" />
            ) : (
              <span>{currentUser.fullName.charAt(0)}</span>
            )}
          </div>
          <div className="space-y-1.5 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-[#F4F8FC]">
                {currentUser.displayTitle || (currentUser.preferredTitle === 'nurse_f' ? `الممرضة ${currentUser.fullName}` : `الممرض ${currentUser.fullName}`)}
              </h1>
              <button
                type="button"
                onClick={() => setEditingName(!editingName)}
                className="px-2.5 py-0.5 rounded-lg bg-[#35D6C5]/15 text-[#35D6C5] border border-[#35D6C5]/30 text-[11px] font-bold hover:bg-[#35D6C5]/25 cursor-pointer"
              >
                {editingName ? 'إلغاء' : 'تعديل الاسم الظاهر'}
              </button>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                حساب خريج مفعل
              </span>
              {currentUser.isAdvanceLinked && (
                <span className="px-2.5 py-0.5 rounded-lg bg-[#342A78] text-indigo-200 border border-indigo-400/40 text-[11px] font-bold">
                  سندات مسبقة مرتبطة
                </span>
              )}
            </div>

            {editingName && (
              <form onSubmit={handleSaveMyName} className="flex flex-wrap items-center gap-2 pt-1 max-w-md">
                <input
                  type="text"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  placeholder="أدخل اسمك الظاهر في الموقع والبطاقة"
                  className="flex-1 bg-[#090E17] border border-[#35D6C5]/40 rounded-xl py-2 px-3 text-xs text-white focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-extrabold text-xs cursor-pointer"
                >
                  حفظ الاسم
                </button>
              </form>
            )}

            {nameSaveMsg && (
              <p className="text-xs text-emerald-400 font-bold">{nameSaveMsg}</p>
            )}

            <p className="text-xs text-slate-300 flex flex-wrap items-center gap-2">
              <span className="text-[#D7B875] font-extrabold">معهد التمريض — دفعة 2027</span>
              <span>•</span>
              <span dir="ltr">{currentUser.phone || currentUser.email}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="hidden xl:block w-24 h-16">
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
            onClick={() => setShowCardModal(true)}
            className="flex-1 lg:flex-initial px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#D7B875] to-[#bf9e5a] text-[#0A0D12] font-extrabold text-xs shadow-md shadow-[#D7B875]/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>بطاقتي التذكارية</span>
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

      <AnimatedEcgWaveform color="#35D6C2" opacity="opacity-20" className="w-full h-8" />

      {/* Tabs Navigation */}
      <div className="flex gap-2 border-b border-white/10 pb-3 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'bg-[#21D4C2] text-black shadow-md'
              : 'bg-[#101827] text-[#929BAA] hover:text-white'
          }`}
        >
          <User className="w-4 h-4" />
          <span>ملخص الحساب</span>
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'payments'
              ? 'bg-[#21D4C2] text-black shadow-md'
              : 'bg-[#101827] text-[#929BAA] hover:text-white'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>الوصولات والمدفوعات ({myPayments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('media')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
            activeTab === 'media'
              ? 'bg-[#21D4C2] text-black shadow-md'
              : 'bg-[#101827] text-[#929BAA] hover:text-white'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>مجلدي الخاص ({privateMedia.length})</span>
        </button>
      </div>

      {/* Tab 1: Overview & Financial Summary */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Dual Events Financial Breakdown (No Total Fee Field per Requirement 3) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Scrub Night Box */}
            <div className="rounded-3xl glass-panel border border-[#35D6C5]/30 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">حفلة السكراب</h3>
                    <p className="text-[11px] text-[#A6F0DF]">{eventConfig.scrubPartyDateDisplay}</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${getPaymentStatusBadgeClass(currentUser.scrubStatus)}`}>
                  حالة الدفعة: {getPaymentStatusArabic(currentUser.scrubStatus)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#10151C]/80 border border-[#35D6C5]/25">
                  <span className="text-[#E8EEF2]/70 block text-[10px]">المبلغ المدفوع:</span>
                  <span className="text-base font-black text-[#35D6C5] font-mono">
                    {formatIQD(currentUser.scrubPaidIQD)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#10151C]/80 border border-[#D6B777]/25">
                  <span className="text-[#E8EEF2]/70 block text-[10px]">المبلغ المتبقي:</span>
                  <span className={`text-base font-black font-mono ${currentUser.scrubBalanceIQD === 0 ? 'text-emerald-400' : 'text-[#D6B777]'}`}>
                    {formatIQD(currentUser.scrubBalanceIQD)}
                  </span>
                </div>
              </div>
            </div>

            {/* Official Graduation Box */}
            <div className="rounded-3xl glass-panel border border-[#A6F0DF]/30 p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#A6F0DF]/20 text-[#A6F0DF] flex items-center justify-center">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">حفل التخرج الأكاديمي الرسمي</h3>
                    <p className="text-[11px] text-[#A6F0DF]">دفعة 2027 (قريباً)</p>
                  </div>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold ${getPaymentStatusBadgeClass(currentUser.gradStatus)}`}>
                  حالة الدفعة: {getPaymentStatusArabic(currentUser.gradStatus)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-[#10151C]/80 border border-[#35D6C5]/25">
                  <span className="text-[#E8EEF2]/70 block text-[10px]">المبلغ المدفوع:</span>
                  <span className="text-base font-black text-[#35D6C5] font-mono">
                    {formatIQD(currentUser.gradPaidIQD)}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#10151C]/80 border border-[#D6B777]/25">
                  <span className="text-[#E8EEF2]/70 block text-[10px]">المبلغ المتبقي:</span>
                  <span className={`text-base font-black font-mono ${currentUser.gradBalanceIQD === 0 ? 'text-emerald-400' : 'text-[#D6B777]'}`}>
                    {formatIQD(currentUser.gradBalanceIQD)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Totals Bar (Paid & Remaining Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl glass-panel border border-[#35D6C5]/30 p-5 shadow-lg space-y-1">
              <span className="text-xs text-[#A6F0DF] font-semibold">إجمالي المبلغ المدفوع</span>
              <div className="text-xl sm:text-2xl font-black text-[#35D6C5] font-mono">
                {formatIQD(currentUser.totalPaidIQD)}
              </div>
            </div>

            <div className="rounded-2xl glass-panel border border-[#D6B777]/30 p-5 shadow-lg space-y-1">
              <span className="text-xs text-[#D6B777] font-semibold">إجمالي المبلغ المتبقي</span>
              <div className={`text-xl sm:text-2xl font-black font-mono ${isFullyPaid ? 'text-emerald-400' : 'text-[#D6B777]'}`}>
                {formatIQD(currentUser.remainingBalanceIQD)}
              </div>
            </div>
          </div>

          {/* Quick Action & Digital Card Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-[#101827] via-[#152336] to-[#101827] border border-white/10 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D6B779]/15 border border-[#D6B779]/30 text-[#D6B779] text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>بطاقتك الرسمية جاهزة</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-white">
                حمل بطاقة التخرج التذكارية باسمك وصورتك
              </h3>
              <p className="text-xs text-[#929BAA] max-w-lg">
                تم إنشاء تصميم مخصص لدفعة 2027 يحمل أختام ورسومات التمريض الرسمية، جاهز للتنزيل بنقرة واحدة لهاتفك.
              </p>
            </div>

            <button
              onClick={() => setShowCardModal(true)}
              className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#21D4C2] to-[#1cb8a9] text-black font-extrabold text-xs sm:text-sm shadow-xl shadow-[#21D4C2]/20 flex items-center gap-2 shrink-0"
            >
              <Download className="w-4 h-4" />
              <span>معاينة وتنزيل البطاقة</span>
            </button>
          </div>

          {/* Latest Payment Transaction Preview */}
          <div className="rounded-2xl bg-[#101827] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#21D4C2]" />
                <span>آخر وصل استلام مالي</span>
              </h3>
              <button
                onClick={() => setActiveTab('payments')}
                className="text-xs text-[#21D4C2] hover:underline"
              >
                عرض كافة الوصولات
              </button>
            </div>

            {myPayments.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-white/5 border border-white/5 text-xs text-[#929BAA]">
                لم يتم تسجيل أي سند دفع مالي حتى الآن. عند تسليم المبلغ للجنة سيظهر الوصل هنا مباشرة.
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-[#090B10] border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-white text-sm">
                      {myPayments[0].receiptNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                      سند موثق
                    </span>
                  </div>
                  <p className="text-xs text-[#929BAA]">
                    بتاريخ {formatArabicDate(myPayments[0].date)} • طريقة الدفع:{' '}
                    {myPayments[0].method === 'cash' ? 'كاش نقدي' : 'تحويل'}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-lg font-black text-[#21D4C2] font-mono">
                    {formatIQD(myPayments[0].amountIQD)}
                  </span>
                  <button
                    onClick={() => openReceipt(myPayments[0])}
                    className="px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>عرض الوصل</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Payments History & Receipts */}
      {activeTab === 'payments' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">سجل الوصولات والمدفوعات الخاصة بك</h3>
              <p className="text-xs text-[#929BAA]">
                كل دفعة مسجلة تصدر بوصل منظم برقم تسلسلي ومرجع مالي معتمد.
              </p>
            </div>
            <div className="text-xs font-bold text-[#D6B779]">
              إجمالي السندات: {myPayments.length}
            </div>
          </div>

          {myPayments.length === 0 ? (
            <div className="py-12 text-center rounded-2xl bg-[#090B10] border border-dashed border-white/10">
              <FileText className="w-12 h-12 text-[#929BAA] mx-auto mb-2 opacity-50" />
              <p className="text-sm font-bold text-white mb-1">لا توجد وصولات مسجلة حالياً</p>
              <p className="text-xs text-[#929BAA]">
                تواصل مع أحد أعضاء اللجنة المنظمة عند تسليم رسوم الحفل.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myPayments.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 rounded-2xl bg-[#090B10] border border-white/10 hover:border-[#21D4C2]/30 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-right">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {p.receiptNumber}
                      </span>
                      <span className="text-[11px] text-[#D6B779] font-mono">
                        [{p.referenceCode}]
                      </span>
                    </div>
                    <p className="text-xs text-[#929BAA]">
                      تاريخ الاستلام: {formatArabicDate(p.date)} - {p.time} • تم التثبيت بواسطة:{' '}
                      <span className="text-white">{p.recordedBy}</span>
                    </p>
                    {p.notes && <p className="text-[11px] text-gray-400">ملاحظات: {p.notes}</p>}
                  </div>

                  <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-0 border-white/5 pt-3 sm:pt-0">
                    <span className="text-lg font-black text-[#21D4C2] font-mono">
                      {formatIQD(p.amountIQD)}
                    </span>
                    <button
                      onClick={() => openReceipt(p)}
                      className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-[#21D4C2]" />
                      <span>معاينة الوصل والطباعة</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Graduate Private Media */}
      {activeTab === 'media' && (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white">خزانة الصور والوسائط الخاصة بك</h3>
              <p className="text-xs text-[#929BAA]">
                وسائط خاصة تماماً لا تظهر في المعرض العام، خاصة بحسابك فقط لحفظ ذكريات السكراب والتخرج.
              </p>
            </div>
          </div>

          {/* Direct File Upload Zone */}
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
              setPrivateMedia(LocalStorageManager.getPrivateMedia(currentUser.id));
              setUploadSuccess('تم رفع وحفظ الملف بنجاح في مجلدك الشخصي الخاص!');
              setTimeout(() => setUploadSuccess(null), 3500);
            }}
          />

          {/* Grid of private items */}
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
                    <img src={m.url} alt={m.title} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleDeleteMedia(m.id)}
                      className="absolute top-2 left-2 p-1.5 rounded-lg bg-black/70 hover:bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-all"
                      title="حذف من مجلدي"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <h4 className="text-xs font-bold text-white truncate">{m.title}</h4>
                    <span className="text-[10px] text-[#929BAA]">{m.uploadedAt}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
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
