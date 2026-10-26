import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  StethoscopeGradCapIllustration,
  AnimatedEcgWaveform,
} from '../components/MedicalIllustrations';
import {
  GraduationCap,
  Lock,
  Mail,
  User,
  Phone,
  Hash,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
  KeyRound,
  Send,
  Clock,
  XCircle,
  LogOut,
  Info,
  Check,
  Stethoscope,
} from 'lucide-react';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' | 'otp' }> = ({
  initialMode = 'register',
}) => {
  const {
    login,
    registerGraduate,
    quickSwitchUser,
    graduates,
    eventConfig,
    firebaseUser,
    firebaseAuthLoading,
    signInWithGoogle,
    signOutFirebase,
    myRegistrationRequest,
    submitStudentRegistration,
    currentUser,
    isAdmin,
    navigateTo,
  } = useApp();

  const [mode, setMode] = useState<'register' | 'login'>('register');

  // Registration Form State
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [preferredTitle, setPreferredTitle] = useState<'nurse_m' | 'nurse_f'>('nurse_m');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Existing user login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleGoogleAuth = async () => {
    setFormError(null);
    setIsLoggingIn(true);
    const res = await signInWithGoogle();
    setIsLoggingIn(false);
    if (!res.success && res.message) {
      setFormError(res.message);
    }
  };

  const handleStudentRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!fullName.trim() || fullName.trim().length < 3) {
      setFormError('يرجى إدخال الاسم الرباعي واللقب بشكل كامل (3 أحرف على الأقل).');
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setFormError('يرجى إدخال رقم هاتف صحيح للتواصل ومطابقة سندات الكاش.');
      return;
    }

    if (!agreeTerms) {
      setFormError('يرجى تأكيد إقرار الانتماء لمعهد التمريض (دفعة 2026 | التخرج 2027).');
      return;
    }

    setIsSubmitting(true);

    // If student is signed in with Google, submit real pending registration request to backend
    if (firebaseUser) {
      const res = await submitStudentRegistration({
        fullName: fullName.trim(),
        preferredTitle,
        studentId: studentId.trim() || undefined,
        phoneNumber: phoneNumber.trim(),
      });
      setIsSubmitting(false);
      if (res.success) {
        setFormSuccess(res.message);
      } else {
        setFormError(res.message);
      }
    } else {
      // In case user hasn't connected Google yet, prompt them to sign in first
      setIsSubmitting(false);
      setFormError('يرجى تسجيل الدخول بحساب Google أولاً ليتم حفظ طلبك وربطه بهويتك الرسمية.');
    }
  };

  const handleDirectLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    if (!loginIdentifier.trim()) {
      setLoginError('يرجى إدخال البريد أو رقم القيد أو الهاتف المسجل.');
      return;
    }

    const res = login(loginIdentifier);
    if (!res.success) {
      setLoginError(res.message);
    }
  };

  return (
    <div className="py-6 sm:py-12 max-w-2xl mx-auto px-4 sm:px-6">
      {/* Medical Student Portal Brand Header */}
      <div className="rounded-3xl bg-gradient-to-b from-[#101B2C] to-[#0A0D12] border border-[#35D6C2]/30 p-6 mb-6 text-center space-y-3 shadow-2xl relative overflow-hidden clinical-grid-bg">
        <div className="w-36 h-28 mx-auto">
          <StethoscopeGradCapIllustration className="w-full h-full" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#35D6C2]/15 border border-[#35D6C2]/30 text-[#35D6C2] text-xs font-bold">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>البوابة الطبية الأكاديمية الموحدة</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F4F8FC]">
          بوابة طلبة وخريجي معهد التمريض
        </h1>
        <p className="text-xs sm:text-sm text-[#D7B875] font-extrabold">
          دفعة 2026 | التخرج 2027 • Graduation 2027
        </p>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          التسجيل الرسمي لطلبة الدفعة، متابعة حالة الاعتماد، استلام وصولات الكاش، وتوليد بطاقة التخرج الطبية.
        </p>
        <AnimatedEcgWaveform color="#35D6C2" opacity="opacity-25" className="w-full h-8" />
      </div>

      {/* CASE 1: Student is signed in and already approved as a graduate */}
      {currentUser && currentUser.status === 'approved' && (
        <div className="rounded-3xl bg-[#101827] border border-[#21D4C2]/40 p-6 sm:p-8 space-y-5 text-right shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#21D4C2]/20 text-[#21D4C2] flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#21D4C2] bg-[#21D4C2]/10 px-2 py-0.5 rounded-full border border-[#21D4C2]/20">
                حساب خريج معتمد
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                {currentUser.displayTitle || currentUser.fullName}
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-[#929BAA] space-y-2">
            <div className="flex justify-between">
              <span>رقم القيد:</span>
              <span className="text-white font-medium">{currentUser.studentId || 'مسجل بدون قيد'}</span>
            </div>
            <div className="flex justify-between">
              <span>الدفعة:</span>
              <span className="text-white font-medium">دفعة 2026 | التخرج 2027</span>
            </div>
            <div className="flex justify-between">
              <span>حالة السداد:</span>
              <span className="text-[#21D4C2] font-bold">
                {currentUser.remainingBalanceIQD === 0 ? 'مكتمل' : 'قيد التسديد'}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={() => navigateTo('graduate_dashboard')}
              className="flex-1 py-3 rounded-xl bg-[#21D4C2] hover:bg-[#1dbfad] text-black font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#21D4C2]/20"
            >
              <User className="w-4 h-4" />
              <span>الانتقال لبوابة الخريج وحفظ البطاقة</span>
            </button>
            <button
              onClick={signOutFirebase}
              className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
            >
              تسجيل الخروج
            </button>
          </div>
        </div>
      )}

      {/* CASE 2: Student submitted registration and status is PENDING APPROVAL */}
      {firebaseUser && myRegistrationRequest && myRegistrationRequest.status === 'pending' && (
        <div className="rounded-3xl bg-gradient-to-b from-[#101827] via-[#151c2d] to-[#101827] border border-[#D6B779]/40 p-6 sm:p-8 space-y-5 text-right shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#D6B779]/20 text-[#D6B779] flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-[#D6B779] bg-[#D6B779]/15 px-2.5 py-0.5 rounded-full border border-[#D6B779]/30">
                بانتظار موافقة المشرف (Pending Approval)
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                طلبك قيد التدقيق والمراجعة
              </h3>
            </div>
          </div>

          <p className="text-xs text-[#929BAA] leading-relaxed">
            تم استلام بياناتك بنجاح من خلال حسابك الموثق. تخضع طلبات التسجيل للتدقيق من قِبل اللجنة المنظمة لمعهد التمريض للتأكد من هوية الطالب ومطابقة أي إيداعات كاش مسبقة قبل منح صلاحيات الخريج.
          </p>

          <div className="p-4 rounded-2xl bg-[#090B10]/70 border border-white/5 space-y-2 text-xs text-[#929BAA]">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>الاسم الثلاثي/الرباعي:</span>
              <span className="text-white font-bold">{myRegistrationRequest.fullName}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>اللقب المعتمد:</span>
              <span className="text-[#21D4C2] font-semibold">
                {myRegistrationRequest.preferredTitle === 'nurse_f' ? 'الممرضة' : 'الممرض'}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>رقم القيد الجامعي:</span>
              <span className="text-white font-medium">
                {myRegistrationRequest.studentId || 'مسجل بدون رقم قيد (مقبول)'}
              </span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>رقم الهاتف (غير موثق بـ OTP):</span>
              <span className="text-white font-medium" dir="ltr">{myRegistrationRequest.phoneNumber}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span>البريد الإلكتروني الموثق:</span>
              <span className="text-[#D6B779] font-medium" dir="ltr">{myRegistrationRequest.email}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span>تاريخ تقديم الطلب:</span>
              <span className="text-white/70">
                {new Date(myRegistrationRequest.createdAt).toLocaleDateString('ar-IQ')}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              لن تتمكن من استعراض الوصولات أو تحميل بطاقة التخرج حتى يتم اعتماد طلبك رسمياً من قبل الإدارة.
            </span>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={signOutFirebase}
              className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>تسجيل الخروج</span>
            </button>
            <span className="text-[11px] text-[#929BAA]">سيصلك إشعار بالاعتماد فور موافقة اللجنة</span>
          </div>
        </div>
      )}

      {/* CASE 3: Student's request was REJECTED by Admin */}
      {firebaseUser && myRegistrationRequest && myRegistrationRequest.status === 'rejected' && (
        <div className="rounded-3xl bg-[#101827] border border-red-500/40 p-6 sm:p-8 space-y-5 text-right shadow-2xl animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-red-400 bg-red-500/15 px-2.5 py-0.5 rounded-full border border-red-500/30">
                تم رفض الطلب (Rejected)
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                تعذر اعتماد طلب التسجيل
              </h3>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-2 text-xs">
            <span className="font-bold text-red-300">سبب الرفض الموضح من الإدارة:</span>
            <p className="text-white/90 leading-relaxed">
              {myRegistrationRequest.rejectionReason || 'البيانات غير مطابقة لقوائم طلبة معهد التمريض دفعة 2026.'}
            </p>
          </div>

          <p className="text-xs text-[#929BAA]">
            يرجى مراجعة اللجنة التحضيرية لمعهد التمريض أو تصحيح بياناتك وإعادة إرسال طلب جديد.
          </p>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => {
                // allow editing and resubmitting
                setFullName(myRegistrationRequest.fullName);
                setPhoneNumber(myRegistrationRequest.phoneNumber);
                setStudentId(myRegistrationRequest.studentId || '');
                // clear local request state to show form
                window.location.reload();
              }}
              className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs"
            >
              تعديل وإعادة التقديم
            </button>
            <button
              onClick={signOutFirebase}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold text-xs"
            >
              خروج
            </button>
          </div>
        </div>
      )}

      {/* CASE 4: Not signed in, or signed in without a pending request (Ready to Register) */}
      {(!currentUser || currentUser.status !== 'approved') &&
        (!myRegistrationRequest || myRegistrationRequest.status === 'approved') && (
          <div className="space-y-6">
            {/* Mode Switcher Tabs */}
            <div className="flex p-1 rounded-2xl bg-[#101827] border border-white/10 max-w-sm mx-auto shadow-lg">
              <button
                onClick={() => {
                  setMode('register');
                  setFormError(null);
                  setLoginError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'bg-gradient-to-r from-[#21D4C2] to-[#1cb8a9] text-black shadow-md font-black'
                    : 'text-[#929BAA] hover:text-white'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>تسجيل طالب جديد</span>
              </button>

              <button
                onClick={() => {
                  setMode('login');
                  setFormError(null);
                  setLoginError(null);
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-[#D6B779] to-[#bf9e5a] text-black shadow-md font-black'
                    : 'text-[#929BAA] hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>دخول الخريجين المعتمدين</span>
              </button>
            </div>

            {mode === 'register' ? (
              <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl text-right">
                {/* Google Sign-in Gate */}
                <div className="space-y-3 pb-5 border-b border-white/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#21D4C2]">
                    <ShieldCheck className="w-4 h-4" />
                    <span>الخطوة 1: توثيق الهوية السحابية الرسمية</span>
                  </div>

                  {firebaseUser ? (
                    <div className="p-3.5 rounded-2xl bg-[#090B10] border border-[#21D4C2]/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-[#21D4C2]/20 text-[#21D4C2] font-black flex items-center justify-center text-sm">
                          {firebaseUser.displayName?.charAt(0) || firebaseUser.email?.charAt(0)}
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-white">{firebaseUser.displayName || firebaseUser.email}</p>
                          <p className="text-[10px] text-[#21D4C2]" dir="ltr">{firebaseUser.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={signOutFirebase}
                        className="text-[11px] text-red-400 hover:text-red-300 px-2 py-1 rounded-lg bg-white/5"
                      >
                        تبديل الحساب
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleGoogleAuth}
                      disabled={isLoggingIn}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white hover:bg-gray-100 text-gray-900 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 shadow-lg transition-all active:scale-[0.99]"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>{isLoggingIn ? 'جارِ التحقق...' : 'تسجيل الدخول والمتابعة بحساب Google'}</span>
                    </button>
                  )}

                  {/* Honest Disclosure Regarding Phone OTP */}
                  <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px] text-[#929BAA] leading-relaxed flex items-start gap-2">
                    <Info className="w-4 h-4 text-[#D6B779] shrink-0 mt-0.5" />
                    <span>
                      <strong>شفافية التحقق:</strong> يتطلب التحقق الفعلي بالرسائل القصيرة (SMS OTP) ربط بوابة الرسائل المعتمدة في Firebase. لضمان الأمان وتفادي الرموز الوهمية، يتم توثيق الحساب عبر Google Sign-in، ويُحفظ رقم هاتفك كبيانات تواصل ومطابقة كاش غير مؤكدة بـ OTP حتى اكتمال تفعيل البوابة.
                    </span>
                  </div>
                </div>

                {/* Registration Form (Step 2) */}
                <form onSubmit={handleStudentRegisterSubmit} className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-[#D6B779]">
                    <User className="w-4 h-4" />
                    <span>الخطوة 2: استمارة تسجيل طالب معهد التمريض</span>
                  </div>

                  {formError && (
                    <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formError}</span>
                    </div>
                  )}

                  {formSuccess && (
                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{formSuccess}</span>
                    </div>
                  )}

                  {/* Preferred Title Selection */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-[#929BAA]">
                      اللقب المهني المفضل للبطاقة الرسمية:
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPreferredTitle('nurse_m')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          preferredTitle === 'nurse_m'
                            ? 'bg-[#21D4C2]/20 border-[#21D4C2] text-[#21D4C2]'
                            : 'bg-white/5 border-white/10 text-[#929BAA] hover:text-white'
                        }`}
                      >
                        {preferredTitle === 'nurse_m' && <Check className="w-3.5 h-3.5" />}
                        <span>الممرض (للخريج)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPreferredTitle('nurse_f')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          preferredTitle === 'nurse_f'
                            ? 'bg-[#21D4C2]/20 border-[#21D4C2] text-[#21D4C2]'
                            : 'bg-white/5 border-white/10 text-[#929BAA] hover:text-white'
                        }`}
                      >
                        {preferredTitle === 'nurse_f' && <Check className="w-3.5 h-3.5" />}
                        <span>الممرضة (للخريجة)</span>
                      </button>
                    </div>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>الاسم الكامل (الرباعي واللقب) *</span>
                      <span className="text-[10px] text-[#929BAA]">كما سيظهر في بطاقة التخرج</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="مثال: أحمد جاسم محمد الكعبي"
                        className="w-full bg-[#090B10] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#21D4C2]"
                      />
                    </div>
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>رقم الهاتف (للتواصل ومطابقة سندات الكاش) *</span>
                      <span className="text-[10px] text-[#D6B779]">يُحفظ كبيانات تواصل</span>
                    </label>
                    <div className="relative">
                      <input
                        type="tel"
                        required
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder="0770xxxxxxx أو 0780xxxxxxx"
                        className="w-full bg-[#090B10] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#21D4C2]"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {/* Student ID (Optional per Requirement 1) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white flex items-center justify-between">
                      <span>رقم القيد الجامعي / الهوية</span>
                      <span className="text-[10px] text-[#21D4C2] font-semibold bg-[#21D4C2]/10 px-2 py-0.5 rounded-full">
                        اختياري (يمكنك تركه فارغاً)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        placeholder="اتركه فارغاً إذا لم تستلم الهوية أو رقم القيد بعد"
                        className="w-full bg-[#090B10] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#21D4C2]"
                      />
                    </div>
                  </div>

                  {/* Cohort Confirmation Checkbox */}
                  <div className="pt-2">
                    <label className="flex items-start gap-2.5 cursor-pointer text-xs text-[#929BAA] leading-relaxed select-none">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-gray-700 text-[#21D4C2] focus:ring-[#21D4C2]"
                      />
                      <span>
                        أؤكد أنني طالب/خريج في <strong className="text-white">معهد التمريض — دفعة 2026 | التخرج 2027</strong>، وأوافق على إرسال بياناتي للجنة المنظمة للتدقيق والاعتماد قبل منح صلاحيات الخريج.
                      </span>
                    </label>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting || !firebaseUser}
                    className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#21D4C2] to-[#1cb8a9] hover:opacity-90 disabled:opacity-50 text-black font-extrabold text-xs sm:text-sm shadow-lg shadow-[#21D4C2]/20 transition-all flex items-center justify-center gap-2 mt-4"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>جارِ إرسال طلب التسجيل للجنة...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال طلب التسجيل للمراجعة والاعتماد</span>
                      </>
                    )}
                  </button>

                  {!firebaseUser && (
                    <p className="text-[11px] text-amber-300 text-center">
                      * يرجى الضغط على زر Google أعلاه أولاً لربط هويتك المعتمدة.
                    </p>
                  )}
                </form>
              </div>
            ) : (
              /* Approved Graduate / Direct Login Tab */
              <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6 shadow-2xl text-right">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D6B779]/20 text-[#D6B779] flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">دخول الخريجين المعتمدين والمشرفين</h3>
                    <p className="text-xs text-[#929BAA]">للطلبة والمشرفين الذين تم اعتماد حساباتهم مسبقاً</p>
                  </div>
                </div>

                {loginError && (
                  <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleDirectLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-white">
                      البريد الإلكتروني أو رقم القيد أو رقم الهاتف:
                    </label>
                    <input
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="أدخل بريدك أو رقم القيد أو الهاتف"
                      className="w-full bg-[#090B10] border border-white/10 rounded-xl py-2.5 px-3.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[#D6B779]"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-[#D6B779] hover:bg-[#c9a865] text-black font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <span>تسجيل الدخول للحساب</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                <div className="pt-4 border-t border-white/5 space-y-3">
                  <span className="text-[11px] text-[#929BAA] block text-center">أو تسجيل الدخول السحابي المباشر:</span>
                  <button
                    onClick={handleGoogleAuth}
                    className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2"
                  >
                    <span>الدخول التلقائي بحساب Google</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Mobile Testing Switcher for Admin/Developer on Android */}
            <div className="p-4 rounded-2xl bg-[#101827]/60 border border-white/5 space-y-2 text-right">
              <span className="text-[11px] font-bold text-[#D6B779] block">
                أدوات الاختبار المباشر (تسهيلاً للتجربة والتدقيق):
              </span>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  onClick={() => quickSwitchUser('grad-admin')}
                  className="px-3 py-1.5 rounded-lg bg-[#D6B779]/20 text-[#D6B779] border border-[#D6B779]/30 hover:bg-[#D6B779]/30 font-bold"
                >
                  تجربة دور المشرف (Admin)
                </button>
                <button
                  onClick={() => quickSwitchUser('grad-2')}
                  className="px-3 py-1.5 rounded-lg bg-[#21D4C2]/20 text-[#21D4C2] border border-[#21D4C2]/30 hover:bg-[#21D4C2]/30 font-bold"
                >
                  تجربة خريج معتمد (زينب)
                </button>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
