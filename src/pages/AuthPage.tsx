import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { resolvedFirebaseConfig } from '../services/firebase';
import {
  StethoscopeGradCapIllustration,
  AnimatedEcgWaveform,
} from '../components/MedicalIllustrations';
import {
  Lock,
  User,
  Mail,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Clock,
  LogOut,
  Stethoscope,
  Edit3,
  ShieldAlert,
  ExternalLink,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  HelpCircle,
} from 'lucide-react';

export const AuthPage: React.FC<{ initialMode?: 'login' | 'register' | 'otp' }> = ({
  initialMode = 'login',
}) => {
  const {
    isFirebaseConfigured,
    firebaseUser,
    firebaseAuthLoading,
    googleAuthError,
    clearGoogleAuthError,
    signInWithGoogle,
    signInWithGoogleRedirect,
    registerWithEmail,
    loginWithEmail,
    resetPassword,
    signOutFirebase,
    currentUser,
    isAdmin,
    isModerator,
    navigateTo,
    updateMyDisplayName,
  } = useApp();

  // Free Spark Plan Auth Tabs: 'google' | 'email'
  const [authMethodTab, setAuthMethodTab] = useState<'google' | 'email'>(
    initialMode === 'register' ? 'email' : 'google'
  );

  // Email/Password Sub-mode: 'login' | 'register' | 'reset'
  const [emailSubMode, setEmailSubMode] = useState<'login' | 'register' | 'reset'>(
    initialMode === 'register' ? 'register' : 'login'
  );

  // Email/Password Form State
  const [fullNameInput, setFullNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailSubmitting, setIsEmailSubmitting] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Google Auth State
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Display Name Update State for logged-in users
  const [editDisplayNameInput, setEditDisplayNameInput] = useState('');
  const [isSavingDisplayName, setIsSavingDisplayName] = useState(false);
  const [displayNameFeedback, setDisplayNameFeedback] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const currentHostname =
    typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    if (googleAuthError) {
      setFormError(googleAuthError);
    }
  }, [googleAuthError]);

  useEffect(() => {
    if (currentUser?.fullName) {
      setEditDisplayNameInput(currentUser.fullName);
    } else if (firebaseUser?.displayName) {
      setEditDisplayNameInput(firebaseUser.displayName);
    }
  }, [currentUser, firebaseUser]);

  const handleGoogleAuth = async () => {
    setFormError(null);
    setEmailFeedback(null);
    clearGoogleAuthError?.();
    setIsGoogleLoading(true);
    const res = await signInWithGoogle();
    setIsGoogleLoading(false);
    if (!res.success && res.message) {
      setFormError(res.message);
    }
  };

  const handleGoogleRedirectFallback = async () => {
    setFormError(null);
    setEmailFeedback(null);
    clearGoogleAuthError?.();
    setIsGoogleLoading(true);
    const res = await signInWithGoogleRedirect();
    setIsGoogleLoading(false);
    if (!res.success && res.message) {
      setFormError(res.message);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailFeedback(null);
    setFormError(null);

    if (emailSubMode === 'reset') {
      setIsEmailSubmitting(true);
      const res = await resetPassword(emailInput);
      setIsEmailSubmitting(false);
      setEmailFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      return;
    }

    if (emailSubMode === 'register') {
      if (!fullNameInput.trim() || fullNameInput.trim().length < 2) {
        setEmailFeedback({
          type: 'error',
          text: 'يرجى إدخال الاسم الكامل (حرفين على الأقل).',
        });
        return;
      }
      if (passwordInput.length < 6) {
        setEmailFeedback({
          type: 'error',
          text: 'يجب أن تتكون كلمة المرور من 6 أحرف أو أرقام على الأقل.',
        });
        return;
      }
      if (passwordInput !== confirmPasswordInput) {
        setEmailFeedback({
          type: 'error',
          text: 'كلمتا المرور غير متطابقتين. يرجى التأكد من إعادة كتابة كلمة المرور بشكل مطابق.',
        });
        return;
      }

      setIsEmailSubmitting(true);
      const res = await registerWithEmail({
        fullName: fullNameInput.trim(),
        email: emailInput.trim(),
        password: passwordInput,
      });
      setIsEmailSubmitting(false);
      setEmailFeedback({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      return;
    }

    // Login mode
    setIsEmailSubmitting(true);
    const res = await loginWithEmail({
      email: emailInput.trim(),
      password: passwordInput,
    });
    setIsEmailSubmitting(false);
    setEmailFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const handleSaveDisplayName = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisplayNameFeedback(null);
    if (!editDisplayNameInput.trim() || editDisplayNameInput.trim().length < 2) {
      setDisplayNameFeedback({
        type: 'error',
        text: 'يرجى إدخال الاسم الظاهر (حرفين على الأقل).',
      });
      return;
    }
    setIsSavingDisplayName(true);
    const res = await updateMyDisplayName(editDisplayNameInput.trim());
    setIsSavingDisplayName(false);
    setDisplayNameFeedback({
      type: res.success ? 'success' : 'error',
      text: res.message,
    });
  };

  const isSignedIn = Boolean(firebaseUser && currentUser);

  return (
    <div className="py-6 sm:py-12 max-w-2xl mx-auto px-4 sm:px-6">
      {/* Medical Student Portal Brand Header */}
      <div className="rounded-3xl bg-gradient-to-b from-[#101B2C] to-[#0A0D12] border border-[#35D6C5]/35 p-6 mb-6 text-center space-y-3 shadow-2xl relative overflow-hidden clinical-grid-bg">
        <div className="w-36 h-28 mx-auto">
          <StethoscopeGradCapIllustration className="w-full h-full" />
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#35D6C5]/15 border border-[#35D6C5]/35 text-[#35D6C5] text-xs font-bold">
          <Stethoscope className="w-3.5 h-3.5" />
          <span>البوابة الأكاديمية الموحدة • معهد التمريض</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#F4F8FC]">
          الدخول وإنشاء الحساب — دفعة 2027
        </h1>
        <p className="text-xs sm:text-sm text-[#5CE1E6] font-extrabold">
          معهد التمريض • Graduation 2027
        </p>
        <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
          سجّل دخولك عبر حساب Google أو عبر البريد الإلكتروني وكلمة المرور مع دعم استعادة كلمة المرور.
        </p>
        <AnimatedEcgWaveform color="#35D6C5" opacity="opacity-25" className="w-full h-8" />
      </div>

      {/* Firebase Connection Check */}
      {!isFirebaseConfigured && (
        <div className="mb-6 rounded-3xl bg-amber-500/15 border border-amber-400/40 p-5 text-right space-y-2 shadow-xl">
          <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>تنبيه: إعدادات Firebase غير متصلة حالياً</span>
          </div>
          <p className="text-xs text-amber-100 leading-relaxed">
            يرجى ربط مشروع Firebase من خلال إعدادات المنصة أو التأكد من وجود ملف{' '}
            <code className="font-mono text-white">firebase-applet-config.json</code>.
          </p>
        </div>
      )}

      {/* Initial Auth Session Loading State */}
      {firebaseAuthLoading ? (
        <div className="rounded-3xl bg-[#0E1826] border border-[#35D6C5]/35 p-10 text-center space-y-3 shadow-2xl">
          <Clock className="w-8 h-8 text-[#35D6C5] animate-spin mx-auto" />
          <p className="text-sm font-bold text-white">جارِ التحقق من حالة تسجيل الدخول...</p>
          <p className="text-xs text-slate-400">يرجى الانتظار لحظة</p>
        </div>
      ) : isSignedIn && currentUser ? (
        /* ================================================================= */
        /* ACTIVE ACCOUNT CARD (SHOWN IMMEDIATELY AFTER AUTHENTICATION)      */
        /* ================================================================= */
        <div className="rounded-3xl bg-[#0E1826] border border-[#35D6C5]/40 p-6 sm:p-8 space-y-6 text-right shadow-2xl animate-in fade-in duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-[#35D6C5]/20 text-[#35D6C5] flex items-center justify-center shrink-0">
                {isAdmin || isModerator ? (
                  <ShieldAlert className="w-6 h-6 text-[#D7B875]" />
                ) : (
                  <CheckCircle2 className="w-6 h-6" />
                )}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                      isAdmin || isModerator
                        ? 'text-[#D7B875] bg-[#D7B875]/15 border-[#D7B875]/35'
                        : 'text-[#35D6C5] bg-[#35D6C5]/10 border-[#35D6C5]/25'
                    }`}
                  >
                    {isAdmin
                      ? 'حساب مدير النظام المعتمد'
                      : isModerator
                      ? 'حساب مشرف معتمد'
                      : 'تم تسجيل الدخول بنجاح'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black text-white mt-1">
                  {currentUser.displayTitle || currentUser.fullName}
                </h3>
                <p className="text-xs text-[#5CE1E6] font-mono mt-0.5" dir="ltr">
                  {firebaseUser?.email || currentUser.email}
                </p>
              </div>
            </div>

            <button
              onClick={signOutFirebase}
              className="px-4 py-2.5 rounded-xl bg-red-500/15 hover:bg-red-500/25 text-red-300 border border-red-500/30 font-bold text-xs flex items-center gap-1.5 self-start sm:self-center cursor-pointer transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>تسجيل الخروج</span>
            </button>
          </div>

          {/* Display Name Editor */}
          <form
            onSubmit={handleSaveDisplayName}
            className="p-4 rounded-2xl bg-[#090E17] border border-white/10 space-y-3"
          >
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white flex items-center gap-1.5">
                <Edit3 className="w-3.5 h-3.5 text-[#35D6C5]" />
                <span>الاسم الظاهر في الموقع وبطاقة التخرج:</span>
              </label>
              <span className="text-[10px] text-slate-400">يمكنك تعديله في أي وقت</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={editDisplayNameInput}
                onChange={(e) => setEditDisplayNameInput(e.target.value)}
                placeholder="أدخل اسمك الكامل كما تحب أن يظهر"
                className="flex-1 bg-[#101827] border border-white/15 rounded-xl py-2.5 px-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
              />
              <button
                type="submit"
                disabled={isSavingDisplayName}
                className="px-5 py-2.5 rounded-xl bg-[#35D6C5]/20 hover:bg-[#35D6C5]/30 text-[#35D6C5] border border-[#35D6C5]/40 font-extrabold text-xs shrink-0 transition-all cursor-pointer"
              >
                {isSavingDisplayName ? 'جارِ الحفظ...' : 'حفظ الاسم'}
              </button>
            </div>

            {displayNameFeedback && (
              <p
                className={`text-xs font-bold ${
                  displayNameFeedback.type === 'success' ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {displayNameFeedback.text}
              </p>
            )}
          </form>

          {/* Primary Navigation Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {(isAdmin || isModerator) && (
              <button
                onClick={() => navigateTo('admin_dashboard')}
                className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#D7B875] to-[#bf9e5a] hover:opacity-95 text-[#0A0D12] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#D7B875]/25 cursor-pointer"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>الدخول للوحة الإدارة والمالية</span>
              </button>
            )}

            <button
              onClick={() => navigateTo('graduate_dashboard')}
              className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] hover:opacity-95 text-[#0A0D12] font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-[#35D6C5]/25 cursor-pointer"
            >
              <User className="w-4 h-4" />
              <span>الانتقال لصفحة حسابي وبطاقة التخرج</span>
            </button>
          </div>
        </div>
      ) : (
        /* =============================================================== */
        /* AUTHENTICATION PANEL (SPARK FREE PLAN: GOOGLE + EMAIL/PASSWORD) */
        /* =============================================================== */
        <div className="space-y-6">
          <div className="rounded-3xl bg-[#0E1826] border border-[#35D6C5]/35 p-5 sm:p-7 space-y-5 shadow-2xl text-right">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-[#35D6C5]">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                <span>اختر وسيلة تسجيل الدخول</span>
              </div>
              <span className="text-[11px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-0.5 rounded-lg font-bold">
                مجاني وآمن بالكامل
              </span>
            </div>

            {/* Method Selector Tabs (2 Primary Free Spark Plan Methods) */}
            <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-[#090E17] border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setAuthMethodTab('google');
                  setFormError(null);
                  setEmailFeedback(null);
                }}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethodTab === 'google'
                    ? 'bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] shadow-lg shadow-[#35D6C5]/25'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <span>تسجيل الدخول عبر Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuthMethodTab('email');
                  setFormError(null);
                }}
                className={`py-3 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  authMethodTab === 'email'
                    ? 'bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] text-[#0A0D12] shadow-lg shadow-[#35D6C5]/25'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Mail className="w-4 h-4 shrink-0" />
                <span>البريد وكلمة المرور</span>
              </button>
            </div>

            {/* =========================================================== */}
            {/* TAB 1: GOOGLE SIGN-IN (FREE ON SPARK PLAN)                  */}
            {/* =========================================================== */}
            {authMethodTab === 'google' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <p className="text-xs text-slate-300 leading-relaxed">
                  اضغط على الزر أدناه لتسجيل الدخول أو إنشاء حسابك فوراً باستخدام حساب Google الخاص بك:
                </p>

                {formError && (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/35 text-xs text-red-200 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                      <span className="leading-relaxed font-semibold">{formError}</span>
                    </div>

                    {(formError.includes('auth/internal-error') ||
                      formError.includes('auth/unauthorized-domain') ||
                      formError.includes('auth/operation-not-allowed')) && (
                      <div className="p-3 rounded-xl bg-[#090E17] border border-white/10 text-[11px] text-slate-300 space-y-2">
                        <p className="font-bold text-[#5CE1E6]">
                          التشخيص الدقيق والحل في Firebase Console (خطة Spark المجانية):
                        </p>
                        <p>
                          1. في مشروعك (<code className="text-white font-mono" dir="ltr">{resolvedFirebaseConfig.projectId}</code>) تم تفعيل إجبار <strong className="text-white">Firebase App Check Enforcement</strong> على خدمة <strong className="text-white">Authentication</strong> بدون مفتاح reCAPTCHA.
                        </p>
                        <p>
                          2. لإيقاف هذا الحظر مجاناً: افتح{' '}
                          <a
                            href={`https://console.firebase.google.com/project/${resolvedFirebaseConfig.projectId}/appcheck/products`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#35D6C5] underline font-bold"
                          >
                            Firebase Console &gt; App Check &gt; APIs
                          </a>{' '}
                          واضغط على <strong className="text-white">Authentication</strong> ثم اختر <strong className="text-emerald-400">Unenforce (إلغاء الإجبار)</strong>.
                        </p>
                        <p>
                          3. تأكد من وجود النطاق الحالي (<code className="text-[#35D6C5] font-mono" dir="ltr">{currentHostname}</code>) في <strong className="text-white">Authentication &gt; Settings &gt; Authorized domains</strong>.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthMethodTab('email');
                            setFormError(null);
                          }}
                          className="mt-1 inline-flex items-center gap-1.5 text-[#35D6C5] hover:underline font-bold cursor-pointer"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          <span>أو سجل دخولك فوراً عبر تبويب (البريد وكلمة المرور)</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={isGoogleLoading}
                  className="w-full py-4 px-5 rounded-2xl bg-white hover:bg-gray-100 disabled:opacity-60 text-gray-900 font-black text-xs sm:text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.99] cursor-pointer"
                >
                  {isGoogleLoading ? (
                    <>
                      <Clock className="w-5 h-5 animate-spin text-gray-700" />
                      <span>جارِ الاتصال بحساب Google...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
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
                      <span>تسجيل الدخول عبر Google</span>
                    </>
                  )}
                </button>

                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <button
                    type="button"
                    onClick={handleGoogleRedirectFallback}
                    disabled={isGoogleLoading}
                    className="text-[#5CE1E6] hover:underline font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>الدخول المباشر عبر المتصفح (للهواتف)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setAuthMethodTab('email');
                      setEmailSubMode('register');
                    }}
                    className="text-[#35D6C5] hover:underline font-bold cursor-pointer"
                  >
                    أو إنشاء حساب بالبريد وكلمة المرور &larr;
                  </button>
                </div>
              </div>
            )}

            {/* =========================================================== */}
            {/* TAB 2: EMAIL & PASSWORD (REGISTER, LOGIN, PASSWORD RESET)   */}
            {/* =========================================================== */}
            {authMethodTab === 'email' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Sub-mode Switcher: Login vs Register vs Reset */}
                <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[#090E17] border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSubMode('login');
                      setEmailFeedback(null);
                    }}
                    className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      emailSubMode === 'login'
                        ? 'bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>تسجيل الدخول</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailSubMode('register');
                      setEmailFeedback(null);
                    }}
                    className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      emailSubMode === 'register'
                        ? 'bg-[#35D6C5]/20 text-[#35D6C5] border border-[#35D6C5]/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>إنشاء حساب جديد</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setEmailSubMode('reset');
                      setEmailFeedback(null);
                    }}
                    className={`py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      emailSubMode === 'reset'
                        ? 'bg-[#5CE1E6]/20 text-[#5CE1E6] border border-[#5CE1E6]/40'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>نسيت كلمة المرور</span>
                  </button>
                </div>

                {emailFeedback && (
                  <div
                    className={`p-3.5 rounded-xl border text-xs flex items-start gap-2 ${
                      emailFeedback.type === 'success'
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200'
                        : 'bg-red-500/15 border-red-500/35 text-red-200'
                    }`}
                  >
                    {emailFeedback.type === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
                    )}
                    <span className="leading-relaxed">{emailFeedback.text}</span>
                  </div>
                )}

                <form onSubmit={handleEmailAuthSubmit} className="space-y-3.5">
                  {emailSubMode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white">
                        الاسم الكامل (كما سيظهر في الموقع وبطاقة التخرج) *
                      </label>
                      <div className="relative">
                        <User className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          required
                          value={fullNameInput}
                          onChange={(e) => setFullNameInput(e.target.value)}
                          placeholder="مثال: مصطفى علي حسون"
                          className="w-full bg-[#090E17] border border-white/15 rounded-xl py-3 pr-10 pl-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-white">
                      البريد الإلكتروني *
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="name@gmail.com"
                        className="w-full bg-[#090E17] border border-white/15 rounded-xl py-3 pr-10 pl-3.5 text-xs sm:text-sm font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
                        dir="ltr"
                      />
                    </div>
                  </div>

                  {emailSubMode !== 'reset' && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-white">
                          كلمة المرور {emailSubMode === 'register' ? '(6 أحرف على الأقل)' : ''} *
                        </label>
                        {emailSubMode === 'login' && (
                          <button
                            type="button"
                            onClick={() => {
                              setEmailSubMode('reset');
                              setEmailFeedback(null);
                            }}
                            className="text-[11px] text-[#5CE1E6] hover:underline font-semibold cursor-pointer"
                          >
                            نسيت كلمة المرور؟
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={passwordInput}
                          onChange={(e) => setPasswordInput(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-[#090E17] border border-white/15 rounded-xl py-3 pr-10 pl-10 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
                          dir="ltr"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                          aria-label={showPassword ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                        >
                          {showPassword ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  )}

                  {emailSubMode === 'register' && (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold text-white">
                        تأكيد كلمة المرور *
                      </label>
                      <div className="relative">
                        <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPasswordInput}
                          onChange={(e) => setConfirmPasswordInput(e.target.value)}
                          placeholder="أعد كتابة كلمة المرور"
                          className="w-full bg-[#090E17] border border-white/15 rounded-xl py-3 pr-10 pl-3.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#35D6C5]"
                          dir="ltr"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isEmailSubmitting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#5CE1E6] hover:opacity-95 disabled:opacity-50 text-[#0A0D12] font-black text-xs sm:text-sm shadow-lg shadow-[#35D6C5]/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    {isEmailSubmitting ? (
                      <>
                        <Clock className="w-4 h-4 animate-spin" />
                        <span>
                          {emailSubMode === 'register'
                            ? 'جارِ إنشاء الحساب...'
                            : emailSubMode === 'reset'
                            ? 'جارِ إرسال رابط الاستعادة...'
                            : 'جارِ تسجيل الدخول...'}
                        </span>
                      </>
                    ) : emailSubMode === 'register' ? (
                      <>
                        <UserPlus className="w-4 h-4" />
                        <span>إنشاء حساب جديد والدخول فوراً</span>
                      </>
                    ) : emailSubMode === 'reset' ? (
                      <>
                        <Send className="w-4 h-4" />
                        <span>إرسال رابط إعادة تعيين كلمة المرور</span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-4 h-4" />
                        <span>تسجيل الدخول بالبريد الإلكتروني</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
