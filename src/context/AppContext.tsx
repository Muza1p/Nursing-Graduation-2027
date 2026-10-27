import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import {
  EventConfig,
  Graduate,
  PaymentTransaction,
  Announcement,
  MediaItem,
  AuditLogEntry,
  PaymentMethod,
  PaymentEventTarget,
  PaymentStatus,
  ScrubStudent,
  StudentPayment,
  UserRole,
  LoggedInUserAccount,
  ModeratorRequest,
} from '../types';
import {
  DEFAULT_CONFIG,
  LocalStorageManager,
  calculatePaymentStatus,
} from '../services/storage';
import {
  auth,
  db,
  googleProvider,
  browserPopupRedirectResolver,
  isFirebaseConfigured,
  mapFirebaseAuthErrorToArabic,
  signInWithGoogleDirectOAuth,
  getPersistedVerifiedAuthUser,
  clearPersistedVerifiedAuthUser,
  registerWithEmailPassword,
  signInWithEmailPassword,
  sendFirebasePasswordReset,
  testFirestoreConnection,
  submitRegistrationRequest,
  getStudentRegistrationRequest,
  getAllRegistrationRequests,
  approveStudentRequest,
  rejectStudentRequest,
  getGraduateDoc,
  isUserAdmin,
  resolveUserAdminRole,
  recordLoggedInUserAccount,
  updateLoggedInUserDisplayName,
  getAllLoggedInUserAccounts,
  getLocalLoggedInUsers,
  RegistrationRequestDoc,
  BOOTSTRAP_ADMIN_EMAIL,
  BOOTSTRAP_ADMIN_PHONE,
  submitModeratorRequest as fbSubmitModeratorRequest,
  getMyModeratorRequest,
  getAllModeratorRequests,
  approveModeratorRequest as fbApproveModeratorRequest,
  rejectModeratorRequest as fbRejectModeratorRequest,
  getLocalModeratorRequests,
} from '../services/firebase';
import {
  ScrubStudentStorage,
  importOfficial46ScrubStudents,
  syncScrubRosterFromFirestore,
  pushLocalScrubRosterToFirestore,
  recalculateStudentFinancials,
  normalizeArabicName,
  checkNameSimilarity,
  getNextSequentialStudentNumber,
  recordSystemAuditLog,
  isSuperAdminUser,
  canManageFinances as checkCanManageFinances,
  ImportReport,
} from '../services/studentManagement';
import {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';

export type PageRoute =
  | 'home'
  | 'events'
  | 'scrub_night'
  | 'official_grad'
  | 'payments'
  | 'music'
  | 'gallery'
  | 'announcements'
  | 'team'
  | 'login'
  | 'register'
  | 'graduate_dashboard'
  | 'admin_dashboard';

interface AppContextType {
  currentPage: PageRoute;
  navigateTo: (page: PageRoute) => void;
  currentUser: Graduate | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isModerator: boolean;
  canManageFinances: boolean;
  canManageContent: boolean;
  eventConfig: EventConfig;
  graduates: Graduate[];
  payments: PaymentTransaction[];
  announcements: Announcement[];
  media: MediaItem[];
  auditLogs: AuditLogEntry[];
  activeReceipt: PaymentTransaction | null;
  openReceipt: (transaction: PaymentTransaction) => void;
  closeReceipt: () => void;

  // Scrub Party Student Management System (46+ Roster & Financial Ledger)
  scrubStudents: ScrubStudent[];
  studentPayments: StudentPayment[];
  importOfficial46List: () => Promise<ImportReport>;
  importCustomStudentsList: (
    entries: Array<{
      fullName: string;
      preferredTitle?: 'nurse_m' | 'nurse_f';
      initialDepositIQD?: number;
      totalFeeIQD?: number;
      phone?: string;
      institutionalStudentId?: string;
      notes?: string;
    }>
  ) => Promise<ImportReport>;
  addScrubStudent: (data: {
    fullName: string;
    preferredTitle: 'nurse_m' | 'nurse_f';
    initialDepositIQD?: number;
    totalFeeIQD?: number;
    phone?: string;
    institutionalStudentId?: string;
    notes?: string;
    isDepositVerified?: boolean;
  }) => Promise<{
    success: boolean;
    message: string;
    student?: ScrubStudent;
    flaggedForReview?: boolean;
  }>;
  updateScrubStudent: (
    studentId: string,
    updates: {
      fullName?: string;
      preferredTitle?: 'nurse_m' | 'nurse_f';
      totalFeeIQD?: number;
      phone?: string;
      institutionalStudentId?: string;
      notes?: string;
    }
  ) => Promise<{ success: boolean; message: string }>;
  archiveSingleScrubStudent: (
    studentId: string,
    reason?: string
  ) => Promise<{ success: boolean; message: string }>;
  restoreSingleScrubStudent: (
    studentId: string
  ) => Promise<{ success: boolean; message: string }>;
  deleteEntireStudentListSuperAdmin: (
    confirmationPhrase: string
  ) => Promise<{ success: boolean; message: string; archivedCount?: number }>;
  restoreEntireStudentListSuperAdmin: () => Promise<{
    success: boolean;
    message: string;
    restoredCount?: number;
  }>;
  addStudentPayment: (params: {
    studentId: string;
    amountIQD: number;
    paymentMethod: PaymentMethod;
    paymentType?: 'initial_deposit' | 'installment' | 'final_settlement';
    receiptNumber?: string;
    notes?: string;
    isVerified?: boolean;
  }) => Promise<{
    success: boolean;
    message: string;
    payment?: StudentPayment;
  }>;
  verifyStudentPayment: (
    paymentId: string,
    verified: boolean
  ) => Promise<{ success: boolean; message: string }>;
  voidStudentPayment: (
    paymentId: string,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;
  linkStudentToAccount: (
    studentId: string,
    targetUser: {
      userId: string;
      email: string;
      fullName: string;
      phone?: string;
    }
  ) => Promise<{ success: boolean; message: string }>;
  unlinkStudentFromAccount: (
    studentId: string
  ) => Promise<{ success: boolean; message: string }>;
  resolveStudentReviewFlag: (
    studentId: string,
    resolutionNote?: string
  ) => Promise<{ success: boolean; message: string }>;

  // Firebase Auth & Workflow
  isFirebaseConfigured: boolean;
  firebaseUser: any | null;
  firebaseAuthLoading: boolean;
  googleAuthError?: string | null;
  clearGoogleAuthError?: () => void;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  signInWithGoogleRedirect: () => Promise<{ success: boolean; message?: string }>;
  registerWithEmail: (params: {
    fullName: string;
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message: string }>;
  loginWithEmail: (params: {
    email: string;
    password: string;
  }) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  signOutFirebase: () => Promise<void>;
  loggedInUsers: LoggedInUserAccount[];
  refreshLoggedInUsers: () => Promise<void>;
  updateMyDisplayName: (
    displayName: string
  ) => Promise<{ success: boolean; message: string }>;
  myRegistrationRequest: any | null;
  pendingRegistrationRequests: any[];
  submitStudentRegistration: (data: {
    fullName: string;
    preferredTitle: 'nurse_m' | 'nurse_f';
    studentId?: string;
    phoneNumber: string;
  }) => Promise<{ success: boolean; message: string }>;
  approveStudentRegistration: (
    request: any
  ) => Promise<{ success: boolean; message: string; graduate?: Graduate }>;
  rejectStudentRegistration: (
    userId: string,
    reason: string
  ) => Promise<{ success: boolean; message: string }>;
  refreshPendingRequests: () => Promise<void>;
  moderatorRequests: ModeratorRequest[];
  myModeratorRequest: ModeratorRequest | null;
  submitModeratorRequest: (data: {
    userName: string;
    note?: string;
    userEmail?: string;
    userPhone?: string;
  }) => Promise<{ success: boolean; notice: string }>;
  approveModeratorRequest: (
    requestId: string
  ) => Promise<{ success: boolean; notice: string }>;
  rejectModeratorRequest: (
    requestId: string,
    reason?: string
  ) => Promise<{ success: boolean; notice: string }>;
  refreshModeratorRequests: () => Promise<void>;

  // Legacy/Local methods for testing
  login: (
    emailOrPhone: string
  ) => { success: boolean; message: string; user?: Graduate };
  loginWithPhoneOtp: (
    phone: string,
    otpCode: string
  ) => { success: boolean; message: string; user?: Graduate };
  logout: () => void;
  registerGraduate: (data: {
    fullName: string;
    email: string;
    phone: string;
    studentId?: string;
    preferredTitle?: 'nurse_m' | 'nurse_f';
    notes?: string;
  }) => { success: boolean; message: string; linkedAdvanceNotice?: string };
  // Admin & Moderator Operations
  updateEventConfig: (updates: Partial<EventConfig>) => void;
  addGraduateManually: (newGrad: Graduate) => void;
  deleteGraduate: (graduateId: string) => void;
  approveGraduate: (graduateId: string) => void;
  rejectGraduate: (graduateId: string) => void;
  suspendGraduate: (graduateId: string) => void;
  updateGraduateRole: (graduateId: string, newRole: UserRole) => void;
  recordPayment: (params: {
    graduateId: string;
    amountIQD: number;
    eventTarget: PaymentEventTarget;
    method: PaymentMethod;
    paymentStatus?: 'deposit' | 'partial' | 'completed';
    matchingPhone?: string;
    matchingStudentId?: string;
    notes?: string;
  }) => { success: boolean; message: string; receipt?: PaymentTransaction };
  addAnnouncement: (ann: Omit<Announcement, 'id' | 'publishedAt'>) => void;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => void;
  deleteAnnouncement: (id: string) => void;
  addMedia: (item: Omit<MediaItem, 'id' | 'uploadedAt'>) => void;
  deleteMedia: (id: string) => void;
  approveMedia: (id: string) => void;
  rejectMedia: (id: string) => void;
  submitGraduateMedia: (item: {
    title: string;
    url: string;
    album?: string;
    category: MediaItem['category'];
  }) => {
    success: boolean;
    message: string;
  };
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentPage, setCurrentPage] = useState<PageRoute>('home');
  const [eventConfig, setEventConfig] = useState<EventConfig>(() =>
    LocalStorageManager.getEventConfig()
  );
  const [graduates, setGraduates] = useState<Graduate[]>(() =>
    LocalStorageManager.getGraduates()
  );
  const [payments, setPayments] = useState<PaymentTransaction[]>(() =>
    LocalStorageManager.getPayments()
  );
  const [announcements, setAnnouncements] = useState<Announcement[]>(() =>
    LocalStorageManager.getAnnouncements()
  );
  const [media, setMedia] = useState<MediaItem[]>(() =>
    LocalStorageManager.getMedia()
  );
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() =>
    LocalStorageManager.getAuditLogs()
  );
  const [activeReceipt, setActiveReceipt] = useState<PaymentTransaction | null>(
    null
  );

  // Scrub Party Student Management State
  const [scrubStudents, setScrubStudents] = useState<ScrubStudent[]>(() =>
    ScrubStudentStorage.getStudents()
  );
  const [studentPayments, setStudentPayments] = useState<StudentPayment[]>(() =>
    ScrubStudentStorage.getStudentPayments()
  );

  // Current session user
  const [currentUserId, setCurrentUserId] = useState<string | null>(() =>
    LocalStorageManager.getCurrentUserId()
  );

  // Firebase Auth & Workflow state
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [firebaseAuthLoading, setFirebaseAuthLoading] = useState<boolean>(true);
  const [resolvedAdminRole, setResolvedAdminRole] = useState<UserRole | null>(
    null
  );
  const [loggedInUsers, setLoggedInUsers] = useState<LoggedInUserAccount[]>(() =>
    getLocalLoggedInUsers()
  );
  const [googleAuthError, setGoogleAuthError] = useState<string | null>(null);
  const clearGoogleAuthError = useCallback(() => setGoogleAuthError(null), []);
  const [myRegistrationRequest, setMyRegistrationRequest] =
    useState<RegistrationRequestDoc | null>(null);
  const [pendingRegistrationRequests, setPendingRegistrationRequests] =
    useState<RegistrationRequestDoc[]>([]);
  const [moderatorRequests, setModeratorRequests] = useState<ModeratorRequest[]>(() =>
    getLocalModeratorRequests()
  );
  const [myModeratorRequest, setMyModeratorRequest] = useState<ModeratorRequest | null>(null);

  // Guards to prevent duplicate login processing between signInWithPopup, getRedirectResult, and onAuthStateChanged
  const redirectResultHandledRef = useRef<boolean>(false);
  const processedAuthSessionRef = useRef<{
    uid: string;
    targetRoute: PageRoute;
    navigated: boolean;
  } | null>(null);
  const inFlightAuthSessionRef = useRef<{
    uid: string;
    promise: Promise<PageRoute>;
  } | null>(null);

  const REDIRECT_PENDING_STORAGE_KEY = 'nursing_grad_2027_auth_redirect_pending';

  const isAndroidDevice = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    return /Android/i.test(navigator.userAgent || '');
  };

  const shouldUseRedirectOnMobile = (): boolean => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }
    const ua = navigator.userAgent || '';
    // Only force redirect inside restricted in-app WebViews (Instagram, Telegram, WhatsApp, Facebook, TikTok)
    // On standard Android Chrome / Samsung Internet / Safari, signInWithPopup works as a tab and avoids 3rd-party cookie blocking!
    const isInAppWebView =
      /(wv|FBAN|FBAV|Instagram|Telegram|WhatsApp|Line|Snapchat|TikTok)/i.test(
        ua
      );

    return isInAppWebView;
  };

  const logAndFormatGoogleAuthError = useCallback(
    (error: any, contextSource: string): string => {
      return mapFirebaseAuthErrorToArabic(error, contextSource);
    },
    []
  );

  // Unified post-authentication handler for Admin & Students with de-duplication
  const processAuthenticatedFirebaseUser = useCallback(
    async (
      user: FirebaseUser,
      options: { shouldNavigate: boolean }
    ): Promise<PageRoute> => {
      // 1. If already processed for this user UID, avoid repeating Firestore reads
      if (processedAuthSessionRef.current?.uid === user.uid) {
        if (
          options.shouldNavigate &&
          !processedAuthSessionRef.current.navigated
        ) {
          processedAuthSessionRef.current.navigated = true;
          setCurrentPage(processedAuthSessionRef.current.targetRoute);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return processedAuthSessionRef.current.targetRoute;
      }

      // 2. If currently in flight for this user UID, await existing promise instead of running twice
      if (inFlightAuthSessionRef.current?.uid === user.uid) {
        const resolvedRoute = await inFlightAuthSessionRef.current.promise;
        if (
          options.shouldNavigate &&
          processedAuthSessionRef.current &&
          !processedAuthSessionRef.current.navigated
        ) {
          processedAuthSessionRef.current.navigated = true;
          setCurrentPage(resolvedRoute);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return resolvedRoute;
      }

      const taskPromise = (async (): Promise<PageRoute> => {
        // Resolve admin role from bootstrap email/phone OR Firestore /admins/{uid}
        const adminRole = await resolveUserAdminRole(user);
        setResolvedAdminRole(adminRole);

        // Record or update this user in /user_accounts/{uid} so the admin sees all logged-in accounts
        const recordedAccount = await recordLoggedInUserAccount(user, {
          role: adminRole || 'student',
        });
        setLoggedInUsers((prev) => [
          recordedAccount,
          ...prev.filter((u) => u.uid !== recordedAccount.uid),
        ]);

        if (adminRole !== null || isUserAdmin(user)) {
          setCurrentUserId(user.uid);
          LocalStorageManager.setCurrentUserId(user.uid);

          try {
            const allUsers = await getAllLoggedInUserAccounts();
            setLoggedInUsers(allUsers);
          } catch (e) {
            console.warn('Error fetching logged-in user accounts:', e);
          }

          try {
            const allReqs = await getAllRegistrationRequests();
            setPendingRegistrationRequests(
              allReqs.filter(
                (r) =>
                  r.status === 'pending' &&
                  !r.fullName.includes('حسين عبدالله جاسم') &&
                  !r.fullName.includes('حسين عبد الله جاسم')
              )
            );
          } catch (e) {
            console.warn('Error fetching pending registration requests:', e);
          }

          try {
            const synced = await syncScrubRosterFromFirestore();
            if (synced && synced.students.length > 0) {
              setScrubStudents(synced.students);
              setStudentPayments(synced.studentPayments);
            } else {
              const localStus = ScrubStudentStorage.getStudents();
              const localPays = ScrubStudentStorage.getStudentPayments();
              if (localStus.length > 0) {
                await pushLocalScrubRosterToFirestore(localStus, localPays);
              }
            }
          } catch (e) {
            console.warn('Error syncing scrub students with Firestore:', e);
          }

          return 'admin_dashboard';
        }

        // Ordinary Student / Visitor check — immediately active upon login without mandatory admin approval
        let gradDoc: Graduate | null = null;
        try {
          const fetchedGrad = await getGraduateDoc(user.uid);
          if (
            fetchedGrad &&
            !fetchedGrad.fullName.includes('حسين عبدالله جاسم') &&
            !fetchedGrad.fullName.includes('حسين عبد الله جاسم')
          ) {
            gradDoc = fetchedGrad;
          }
        } catch (e) {
          console.warn('Error fetching graduate doc:', e);
        }

        if (gradDoc) {
          const validGrad: Graduate = {
            ...gradDoc,
            status: 'approved',
          };
          setGraduates((prev) => {
            if (prev.some((g) => g.id === validGrad.id)) {
              return prev.map((g) => (g.id === validGrad.id ? validGrad : g));
            }
            return [validGrad, ...prev];
          });
          setCurrentUserId(validGrad.id);
          LocalStorageManager.setCurrentUserId(validGrad.id);
        } else {
          setCurrentUserId(user.uid);
          LocalStorageManager.setCurrentUserId(user.uid);
        }

        try {
          const myReq = await getStudentRegistrationRequest(user.uid);
          if (
            myReq &&
            !myReq.fullName.includes('حسين عبدالله جاسم') &&
            !myReq.fullName.includes('حسين عبد الله جاسم')
          ) {
            setMyRegistrationRequest(myReq);
          } else {
            setMyRegistrationRequest(null);
          }
        } catch (e) {
          console.warn('Error fetching student registration request:', e);
        }

        try {
          const modReq = await getMyModeratorRequest(user.uid);
          setMyModeratorRequest(modReq);
          if (isUserAdmin(user)) {
            const allModReqs = await getAllModeratorRequests();
            setModeratorRequests(allModReqs);
          }
        } catch (e) {
          console.warn('Error fetching moderator request:', e);
        }

        return 'graduate_dashboard';
      })();

      inFlightAuthSessionRef.current = { uid: user.uid, promise: taskPromise };

      try {
        const targetRoute = await taskPromise;
        processedAuthSessionRef.current = {
          uid: user.uid,
          targetRoute,
          navigated: options.shouldNavigate,
        };
        if (options.shouldNavigate) {
          setCurrentPage(targetRoute);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return targetRoute;
      } finally {
        if (inFlightAuthSessionRef.current?.uid === user.uid) {
          inFlightAuthSessionRef.current = null;
        }
      }
    },
    []
  );

  // Automatic Initial Import of the 46 Unique Scrub Party Students & Public Cloud Sync
  useEffect(() => {
    const existingList = ScrubStudentStorage.getStudents();
    const existingPays = ScrubStudentStorage.getStudentPayments();

    const initializeRoster = async () => {
      // 1. Try syncing latest admin-saved student records & payments from Firestore (no login required)
      const cloudSynced = await syncScrubRosterFromFirestore();
      if (cloudSynced && cloudSynced.students.length > 0) {
        setScrubStudents(cloudSynced.students);
        setStudentPayments(cloudSynced.studentPayments);
        return;
      }

      // 2. Otherwise ensure the 46 official student records are initialized locally
      if (!ScrubStudentStorage.isInitialImportDone() || existingList.length === 0) {
        const report = await importOfficial46ScrubStudents({
          existingStudents: existingList,
          existingPayments: existingPays,
          existingGraduates: LocalStorageManager.getGraduates(),
          actorName: 'النظام الآلي — استيراد الدفعة المعتمد',
        });
        setScrubStudents(report.students);
        setStudentPayments(report.studentPayments);
        setAuditLogs(LocalStorageManager.getAuditLogs());
      }
    };

    initializeRoster();
  }, []);

  // Test connection and load cloud eventConfig on mount without overriding fixed countdown defaults
  useEffect(() => {
    testFirestoreConnection();
    getDoc(doc(db, 'settings', 'eventConfig'))
      .then((snap) => {
        if (snap.exists()) {
          const cloudCfg = snap.data() as Partial<EventConfig>;
          setEventConfig((prev) => ({
            ...prev,
            ...cloudCfg,
            organizers: prev.organizers.filter(
              (o) =>
                o.id !== 'org-3' &&
                !o.name.includes('حسين عبدالله جاسم') &&
                !o.name.includes('حسين عبد الله جاسم') &&
                !(o.instagram && o.instagram.includes('922r_h'))
            ),
            countdownEnabled: cloudCfg.countdownEnabled ?? true,
            countdownPublished: cloudCfg.countdownPublished ?? true,
            countdownDate: cloudCfg.countdownDate || '2026-12-12',
            countdownTime:
              !cloudCfg.countdownTime || cloudCfg.countdownTime === '09:00'
                ? '09:00:00'
                : cloudCfg.countdownTime,
            countdownTimezone: 'Asia/Baghdad',
            isScrubDateConfirmed: true,
            scrubCountdownEnabled: true,
          }));
        }
      })
      .catch(() => {
        // Ignore offline/unauthenticated read fallback
      });
  }, []);

  // Handle getRedirectResult ONLY when a redirect was explicitly initiated, avoiding false auth/internal-error on initial boot
  useEffect(() => {
    const hadPendingRedirectOnMount =
      typeof sessionStorage !== 'undefined' &&
      sessionStorage.getItem(REDIRECT_PENDING_STORAGE_KEY) === '1';

    if (!redirectResultHandledRef.current && hadPendingRedirectOnMount) {
      redirectResultHandledRef.current = true;
      getRedirectResult(auth, browserPopupRedirectResolver)
        .then(async (result) => {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(REDIRECT_PENDING_STORAGE_KEY);
          }

          if (result?.user) {
            setGoogleAuthError(null);
            setFirebaseUser(result.user);
            await processAuthenticatedFirebaseUser(result.user, {
              shouldNavigate: true,
            });
          } else if (auth.currentUser) {
            await processAuthenticatedFirebaseUser(auth.currentUser, {
              shouldNavigate: true,
            });
          }
        })
        .catch((error: any) => {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.removeItem(REDIRECT_PENDING_STORAGE_KEY);
          }
          const formattedMsg = logAndFormatGoogleAuthError(
            error,
            'getRedirectResult'
          );
          setGoogleAuthError(formattedMsg);
          setCurrentPage('login');
        });
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        setFirebaseAuthLoading(false);
        const hadPendingRedirect =
          typeof sessionStorage !== 'undefined' &&
          sessionStorage.getItem(REDIRECT_PENDING_STORAGE_KEY) === '1';
        if (hadPendingRedirect && typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem(REDIRECT_PENDING_STORAGE_KEY);
        }
        await processAuthenticatedFirebaseUser(user, {
          shouldNavigate: hadPendingRedirect,
        });
      } else {
        const persistedVerified = getPersistedVerifiedAuthUser();
        if (persistedVerified) {
          setFirebaseUser(persistedVerified);
          setFirebaseAuthLoading(false);
          await processAuthenticatedFirebaseUser(persistedVerified, {
            shouldNavigate: false,
          });
          return;
        }
        setFirebaseUser(null);
        setFirebaseAuthLoading(false);
        processedAuthSessionRef.current = null;
        inFlightAuthSessionRef.current = null;
        setResolvedAdminRole(null);
        setMyRegistrationRequest(null);
      }
    });

    return () => unsubscribe();
  }, [logAndFormatGoogleAuthError, processAuthenticatedFirebaseUser]);

  const matchedGraduateUser =
    graduates.find(
      (g) => g.id === currentUserId || (firebaseUser && g.id === firebaseUser.uid)
    ) || null;
  const matchedLoggedInAccount = firebaseUser
    ? loggedInUsers.find((u) => u.uid === firebaseUser.uid) || null
    : null;
  const linkedScrubRecord = firebaseUser
    ? scrubStudents.find(
        (s) =>
          s.status === 'active' &&
          s.isLinkedToAccount &&
          s.linkedUserId === firebaseUser.uid
      )
    : undefined;

  const isFirebaseAdminAccount = Boolean(
    firebaseUser && (isUserAdmin(firebaseUser) || resolvedAdminRole !== null)
  );

  const currentUser: Graduate | null = isFirebaseAdminAccount && firebaseUser
    ? {
        id: firebaseUser.uid,
        fullName:
          matchedLoggedInAccount?.displayName ||
          firebaseUser.displayName ||
          'مصطفى علي حسون',
        email: firebaseUser.email || BOOTSTRAP_ADMIN_EMAIL,
        phone: firebaseUser.phoneNumber || '07800088386',
        role:
          resolvedAdminRole === 'super_admin' || isUserAdmin(firebaseUser)
            ? 'admin'
            : resolvedAdminRole || 'admin',
        status: 'approved',
        preferredTitle: 'nurse_m',
        displayTitle:
          matchedLoggedInAccount?.displayName ||
          firebaseUser.displayName ||
          'الممرض مصطفى علي حسون',
        cohortLabel: 'دفعة 2027',
        scrubDueIQD: 0,
        scrubPaidIQD: 0,
        scrubBalanceIQD: 0,
        scrubStatus: 'completed',
        gradDueIQD: 0,
        gradPaidIQD: 0,
        gradBalanceIQD: 0,
        gradStatus: 'completed',
        totalDueIQD: 0,
        totalPaidIQD: 0,
        remainingBalanceIQD: 0,
        createdAt: '2026-10-01',
      }
    : matchedGraduateUser
    ? {
        ...matchedGraduateUser,
        status: 'approved',
      }
    : firebaseUser
    ? {
        id: firebaseUser.uid,
        fullName:
          matchedLoggedInAccount?.displayName ||
          firebaseUser.displayName ||
          (firebaseUser.email
            ? firebaseUser.email.split('@')[0]
            : firebaseUser.phoneNumber
            ? `طالب (${firebaseUser.phoneNumber})`
            : 'طالب مسجل'),
        email: firebaseUser.email || '',
        phone: firebaseUser.phoneNumber || '',
        role: 'graduate',
        status: 'approved',
        preferredTitle: linkedScrubRecord?.preferredTitle || 'nurse_m',
        displayTitle:
          matchedLoggedInAccount?.displayName ||
          firebaseUser.displayName ||
          (firebaseUser.email
            ? firebaseUser.email.split('@')[0]
            : firebaseUser.phoneNumber || 'طالب مسجل'),
        cohortLabel: 'دفعة 2027',
        linkedScrubStudentId: linkedScrubRecord?.id,
        scrubDueIQD: linkedScrubRecord?.totalFeeIQD ?? 35000,
        scrubPaidIQD: linkedScrubRecord?.verifiedPaidIQD ?? 0,
        scrubBalanceIQD: linkedScrubRecord?.remainingBalanceIQD ?? 35000,
        scrubStatus: linkedScrubRecord?.paymentStatus ?? 'unpaid',
        gradDueIQD: 50000,
        gradPaidIQD: 0,
        gradBalanceIQD: 50000,
        gradStatus: 'unpaid',
        totalDueIQD: (linkedScrubRecord?.totalFeeIQD ?? 35000) + 50000,
        totalPaidIQD: linkedScrubRecord?.verifiedPaidIQD ?? 0,
        remainingBalanceIQD:
          (linkedScrubRecord?.remainingBalanceIQD ?? 35000) + 50000,
        createdAt:
          matchedLoggedInAccount?.createdAt?.split('T')[0] ||
          new Date().toISOString().split('T')[0],
      }
    : null;

  // Server / Firebase Security Rules verified admin roles ONLY — never trust client-side localStorage flags
  const isSuperAdmin = Boolean(
    firebaseUser &&
      (isUserAdmin(firebaseUser) || resolvedAdminRole === 'super_admin')
  );
  const isAdmin = Boolean(
    firebaseUser &&
      (isSuperAdmin ||
        resolvedAdminRole === 'admin' ||
        resolvedAdminRole === 'finance_manager' ||
        resolvedAdminRole === 'event_manager')
  );
  const isModerator = Boolean(
    firebaseUser &&
      (isAdmin ||
        resolvedAdminRole === 'moderator' ||
        resolvedAdminRole === 'gallery_moderator' ||
        resolvedAdminRole === 'notification_manager')
  );
  const canManageFinances = Boolean(
    firebaseUser &&
      (isSuperAdmin ||
        resolvedAdminRole === 'super_admin' ||
        resolvedAdminRole === 'finance_manager' ||
        resolvedAdminRole === 'admin')
  );
  const canManageContent = isModerator;

  const actorDisplayName =
    currentUser?.displayTitle ||
    currentUser?.fullName ||
    firebaseUser?.email ||
    'مصطفى علي حسون (مدير النظام)';

  // Sync state changes with LocalStorage
  useEffect(() => {
    LocalStorageManager.saveEventConfig(eventConfig);
  }, [eventConfig]);

  useEffect(() => {
    LocalStorageManager.saveGraduates(graduates);
  }, [graduates]);

  useEffect(() => {
    LocalStorageManager.savePayments(payments);
  }, [payments]);

  useEffect(() => {
    LocalStorageManager.saveAnnouncements(announcements);
  }, [announcements]);

  useEffect(() => {
    LocalStorageManager.saveMedia(media);
  }, [media]);

  useEffect(() => {
    ScrubStudentStorage.saveStudents(scrubStudents);
  }, [scrubStudents]);

  useEffect(() => {
    ScrubStudentStorage.saveStudentPayments(studentPayments);
  }, [studentPayments]);

  const navigateTo = (page: PageRoute) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // =========================================================================
  // SCRUB PARTY STUDENT MANAGEMENT SYSTEM ACTIONS (REQUIREMENTS 1 - 7)
  // =========================================================================

  // Helper to sync a linked student's Scrub Party financials to their Graduate profile
  const syncLinkedGraduateBalance = (
    updatedStu: ScrubStudent
  ) => {
    if (!updatedStu.isLinkedToAccount || !updatedStu.linkedUserId) return;
    setGraduates((prev) =>
      prev.map((g) => {
        if (g.id === updatedStu.linkedUserId) {
          const scrubDue = updatedStu.totalFeeIQD;
          const scrubPaid = updatedStu.verifiedPaidIQD;
          const scrubBal = updatedStu.remainingBalanceIQD;
          const gradDue = g.gradDueIQD || 50000;
          const gradPaid = g.gradPaidIQD || 0;
          const gradBal = Math.max(0, gradDue - gradPaid);
          return {
            ...g,
            linkedScrubStudentId: updatedStu.id,
            scrubDueIQD: scrubDue,
            scrubPaidIQD: scrubPaid,
            scrubBalanceIQD: scrubBal,
            scrubStatus: updatedStu.paymentStatus,
            totalDueIQD: scrubDue + gradDue,
            totalPaidIQD: scrubPaid + gradPaid,
            remainingBalanceIQD: scrubBal + gradBal,
          };
        }
        return g;
      })
    );
  };

  const importOfficial46List = async (): Promise<ImportReport> => {
    const report = await importOfficial46ScrubStudents({
      existingStudents: scrubStudents,
      existingPayments: studentPayments,
      existingGraduates: graduates,
      actorName: actorDisplayName,
    });
    setScrubStudents(report.students);
    setStudentPayments(report.studentPayments);
    setAuditLogs(LocalStorageManager.getAuditLogs());
    return report;
  };

  const importCustomStudentsList = async (
    entries: Array<{
      fullName: string;
      preferredTitle?: 'nurse_m' | 'nurse_f';
      initialDepositIQD?: number;
      totalFeeIQD?: number;
      phone?: string;
      institutionalStudentId?: string;
      notes?: string;
    }>
  ): Promise<ImportReport> => {
    const updatedStudents = [...scrubStudents];
    const updatedPayments = [...studentPayments];
    const flaggedDetails: Array<{
      studentName: string;
      studentNumber: number;
      reason: string;
    }> = [];

    let importedCount = 0;
    let skippedDuplicatesCount = 0;
    let flaggedForReviewCount = 0;
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];

    for (const raw of entries) {
      const cleanName = raw.fullName.trim();
      if (!cleanName || cleanName.length < 2) continue;

      const normName = normalizeArabicName(cleanName);

      // 1. Check exact duplicate in existing scrubStudents
      const exactMatch = updatedStudents.find(
        (s) => s.normalizedName === normName && s.status === 'active'
      );
      if (exactMatch) {
        skippedDuplicatesCount++;
        continue;
      }

      // 2. Check similar name in existing scrubStudents or graduates
      let needsReview = false;
      let reviewNote: string | undefined = undefined;
      let potentialMatchId: string | undefined = undefined;
      let potentialMatchName: string | undefined = undefined;

      for (const existingStu of updatedStudents) {
        const sim = checkNameSimilarity(cleanName, existingStu.fullName);
        if (sim.isSimilar && !sim.isExact) {
          needsReview = true;
          potentialMatchId = existingStu.id;
          potentialMatchName = existingStu.fullName;
          reviewNote = `تشابه محتمل مع الطالب رقم (${existingStu.studentNumber}) "${existingStu.fullName}". يرجى المراجعة.`;
          break;
        }
      }

      if (!needsReview) {
        for (const grad of graduates) {
          if (grad.id === 'grad-admin' || grad.id === 'grad-mod') continue;
          const sim = checkNameSimilarity(cleanName, grad.fullName);
          if (sim.isSimilar || sim.isExact) {
            needsReview = true;
            potentialMatchId = grad.id;
            potentialMatchName = grad.fullName;
            reviewNote = `يوجد حساب خريج باسم مشابه (${grad.fullName}). يرجى التحقق قبل ربط الحساب.`;
            break;
          }
        }
      }

      if (needsReview && reviewNote) {
        flaggedForReviewCount++;
      }

      const nextNumber = getNextSequentialStudentNumber(updatedStudents);
      const studentId = `scrub-stu-custom-${Date.now()}-${nextNumber}`;
      const totalFee =
        raw.totalFeeIQD !== undefined && raw.totalFeeIQD > 0
          ? raw.totalFeeIQD
          : 35000;
      const deposit = Math.max(
        0,
        Math.min(totalFee, Number(raw.initialDepositIQD) || 0)
      );

      if (needsReview && reviewNote) {
        flaggedDetails.push({
          studentName: cleanName,
          studentNumber: nextNumber,
          reason: reviewNote,
        });
      }

      if (deposit > 0) {
        const payId = `scrub-pay-${Date.now()}-${nextNumber}`;
        const receiptNum = `SCRUB-DEP-${String(nextNumber).padStart(3, '0')}`;
        updatedPayments.push({
          id: payId,
          studentId,
          studentNumber: nextNumber,
          studentName: cleanName,
          amountIQD: deposit,
          paymentType: 'initial_deposit',
          paymentMethod: 'cash',
          receiptNumber: receiptNum,
          referenceCode: `IMP-${nextNumber}-${Date.now().toString().slice(-4)}`,
          date: todayDate,
          time: new Date().toTimeString().substring(0, 5),
          notes: raw.notes || `دفعة أولية مستوردة (${deposit.toLocaleString()} د.ع)`,
          isVerified: true,
          verificationStatus: 'verified',
          recordedBy: actorDisplayName,
          verifiedBy: actorDisplayName,
          verifiedAt: nowIso,
          createdAt: nowIso,
        });
      }

      const newStudent: ScrubStudent = {
        id: studentId,
        studentNumber: nextNumber,
        fullName: cleanName,
        normalizedName: normName,
        preferredTitle: raw.preferredTitle || 'nurse_m',
        phone: raw.phone?.trim(),
        institutionalStudentId: raw.institutionalStudentId?.trim(),
        totalFeeIQD: totalFee,
        verifiedPaidIQD: deposit,
        pendingPaidIQD: 0,
        remainingBalanceIQD: Math.max(0, totalFee - deposit),
        paymentStatus: calculatePaymentStatus(deposit, totalFee),
        status: 'active',
        isLinkedToAccount: false,
        needsReview,
        reviewNote,
        potentialMatchId,
        potentialMatchName,
        notes: raw.notes?.trim() || 'تمت الإضافة عبر استيراد قائمة إضافية',
        createdAt: todayDate,
        updatedAt: nowIso,
      };

      updatedStudents.push(
        recalculateStudentFinancials(newStudent, updatedPayments)
      );
      importedCount++;
    }

    updatedStudents.sort((a, b) => a.studentNumber - b.studentNumber);
    setScrubStudents(updatedStudents);
    setStudentPayments(updatedPayments);

    if (auth.currentUser && importedCount > 0) {
      try {
        const batch = writeBatch(db);
        for (const s of updatedStudents) {
          const clean = Object.fromEntries(
            Object.entries(s).filter(([_, v]) => v !== undefined)
          );
          batch.set(doc(db, 'scrub_students', s.id), clean, { merge: true });
        }
        for (const p of updatedPayments) {
          const clean = Object.fromEntries(
            Object.entries(p).filter(([_, v]) => v !== undefined)
          );
          batch.set(doc(db, 'student_payments', p.id), clean, { merge: true });
        }
        await batch.commit();
      } catch (e) {
        console.warn('Firestore custom import sync notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'استيراد دفعة طلبة إضافية',
      performedBy: actorDisplayName,
      details: `تم استيراد ${importedCount} طالب جديد، وتخطي ${skippedDuplicatesCount} اسم مكرر، وتحديد ${flaggedForReviewCount} سجل للمراجعة.`,
      affectedCount: importedCount,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      importedCount,
      skippedDuplicatesCount,
      flaggedForReviewCount,
      totalActiveStudents: updatedStudents.filter((s) => s.status === 'active')
        .length,
      students: updatedStudents,
      studentPayments: updatedPayments,
      flaggedDetails,
    };
  };

  const addScrubStudent = async (data: {
    fullName: string;
    preferredTitle: 'nurse_m' | 'nurse_f';
    initialDepositIQD?: number;
    totalFeeIQD?: number;
    phone?: string;
    institutionalStudentId?: string;
    notes?: string;
    isDepositVerified?: boolean;
  }) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بإضافة طلبة أو تعديل السجلات المالية.',
      };
    }

    const cleanName = data.fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      return {
        success: false,
        message: 'يرجى إدخال اسم الطالب باللغة العربية بشكل صحيح.',
      };
    }

    const normName = normalizeArabicName(cleanName);
    const exactDuplicate = scrubStudents.find(
      (s) => s.status === 'active' && s.normalizedName === normName
    );
    if (exactDuplicate) {
      return {
        success: false,
        message: `الطالب "${exactDuplicate.fullName}" مسجل بالفعل في القائمة برقم (${exactDuplicate.studentNumber}). تم منع التكرار تلقائياً.`,
      };
    }

    const totalFee =
      data.totalFeeIQD !== undefined && data.totalFeeIQD > 0
        ? Number(data.totalFeeIQD)
        : 35000;
    const deposit = Math.max(0, Number(data.initialDepositIQD) || 0);

    if (deposit > totalFee) {
      return {
        success: false,
        message: `العربون المدخل (${deposit.toLocaleString()} د.ع) يتجاوز إجمالي رسوم حفلة السكراب (${totalFee.toLocaleString()} د.ع).`,
      };
    }

    // Check similarity with existing students or graduates to flag for review if similar
    let needsReview = false;
    let reviewNote: string | undefined = undefined;
    let potentialMatchId: string | undefined = undefined;
    let potentialMatchName: string | undefined = undefined;

    for (const existingStu of scrubStudents) {
      if (existingStu.status !== 'active') continue;
      const sim = checkNameSimilarity(cleanName, existingStu.fullName);
      if (sim.isSimilar) {
        needsReview = true;
        potentialMatchId = existingStu.id;
        potentialMatchName = existingStu.fullName;
        reviewNote = `تشابه في الاسم مع الطالب رقم (${existingStu.studentNumber}): ${existingStu.fullName}`;
        break;
      }
    }

    if (!needsReview) {
      for (const grad of graduates) {
        if (grad.id === 'grad-admin' || grad.id === 'grad-mod') continue;
        const sim = checkNameSimilarity(cleanName, grad.fullName);
        if (sim.isSimilar || sim.isExact) {
          needsReview = true;
          potentialMatchId = grad.id;
          potentialMatchName = grad.fullName;
          reviewNote = `يوجد حساب خريج مسجل باسم مشابه (${grad.fullName}). يرجى التحقق قبل ربط الحساب.`;
          break;
        }
      }
    }

    const nextNumber = getNextSequentialStudentNumber(scrubStudents);
    const permanentId = `scrub-stu-${Date.now()}-${nextNumber}`;
    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];
    const isVerified = data.isDepositVerified !== false;

    const newPaymentsList = [...studentPayments];
    if (deposit > 0) {
      const paymentId = `scrub-pay-${Date.now()}-${nextNumber}`;
      const receiptNumber = `SCRUB-REC-${String(nextNumber).padStart(3, '0')}-${Math.floor(100 + Math.random() * 900)}`;
      const paymentRecord: StudentPayment = {
        id: paymentId,
        studentId: permanentId,
        studentNumber: nextNumber,
        studentName: cleanName,
        amountIQD: deposit,
        paymentType: deposit >= totalFee ? 'final_settlement' : 'initial_deposit',
        paymentMethod: 'cash',
        receiptNumber,
        referenceCode: `CASH-${Math.floor(10000 + Math.random() * 90000)}`,
        date: todayDate,
        time: new Date().toTimeString().substring(0, 5),
        notes: data.notes?.trim() || 'دفعة أولية عند إضافة الطالب',
        isVerified,
        verificationStatus: isVerified ? 'verified' : 'pending',
        recordedBy: actorDisplayName,
        verifiedBy: isVerified ? actorDisplayName : undefined,
        verifiedAt: isVerified ? nowIso : undefined,
        createdAt: nowIso,
      };
      newPaymentsList.unshift(paymentRecord);

      if (auth.currentUser) {
        try {
          const cleanPay = Object.fromEntries(
            Object.entries(paymentRecord).filter(([_, v]) => v !== undefined)
          );
          await setDoc(doc(db, 'student_payments', paymentRecord.id), cleanPay);
        } catch (e) {
          console.warn('Firestore payment create notice:', e);
        }
      }
    }

    const rawStudent: ScrubStudent = {
      id: permanentId,
      studentNumber: nextNumber,
      fullName: cleanName,
      normalizedName: normName,
      preferredTitle: data.preferredTitle,
      phone: data.phone?.trim() || undefined,
      institutionalStudentId: data.institutionalStudentId?.trim() || undefined,
      totalFeeIQD: totalFee,
      verifiedPaidIQD: isVerified ? deposit : 0,
      pendingPaidIQD: isVerified ? 0 : deposit,
      remainingBalanceIQD: isVerified ? Math.max(0, totalFee - deposit) : totalFee,
      paymentStatus: calculatePaymentStatus(isVerified ? deposit : 0, totalFee),
      status: 'active',
      isLinkedToAccount: false,
      needsReview,
      reviewNote,
      potentialMatchId,
      potentialMatchName,
      notes: data.notes?.trim() || undefined,
      createdAt: todayDate,
      updatedAt: nowIso,
    };

    const finalStudent = recalculateStudentFinancials(
      rawStudent,
      newPaymentsList
    );

    const updatedStudents = [...scrubStudents, finalStudent].sort(
      (a, b) => a.studentNumber - b.studentNumber
    );
    setScrubStudents(updatedStudents);
    setStudentPayments(newPaymentsList);

    if (auth.currentUser) {
      try {
        const cleanStu = Object.fromEntries(
          Object.entries(finalStudent).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'scrub_students', finalStudent.id), cleanStu);
      } catch (e) {
        console.warn('Firestore student create notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'إضافة طالب جديد لقائمة السكراب',
      performedBy: actorDisplayName,
      details: `تمت إضافة الطالب "${finalStudent.fullName}" بالتسلسل التلقائي رقم (${finalStudent.studentNumber}) ومعرف دائم (${finalStudent.id}). المدفوع الموثق: ${finalStudent.verifiedPaidIQD.toLocaleString()} د.ع، المتبقي: ${finalStudent.remainingBalanceIQD.toLocaleString()} د.ع.`,
      affectedCount: 1,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تمت إضافة "${finalStudent.fullName}" بنجاح بالرقم التسلسلي (${finalStudent.studentNumber})!`,
      student: finalStudent,
      flaggedForReview: needsReview,
    };
  };

  const updateScrubStudent = async (
    studentId: string,
    updates: {
      fullName?: string;
      preferredTitle?: 'nurse_m' | 'nurse_f';
      totalFeeIQD?: number;
      phone?: string;
      institutionalStudentId?: string;
      notes?: string;
    }
  ) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بتعديل بيانات الطلبة.',
      };
    }

    const existing = scrubStudents.find((s) => s.id === studentId);
    if (!existing) {
      return { success: false, message: 'سجل الطالب غير موجود.' };
    }

    const newName = updates.fullName !== undefined ? updates.fullName.trim() : existing.fullName;
    if (!newName || newName.length < 2) {
      return { success: false, message: 'الاسم الكامل غير صالح.' };
    }

    const normName = normalizeArabicName(newName);
    const conflict = scrubStudents.find(
      (s) => s.id !== studentId && s.status === 'active' && s.normalizedName === normName
    );
    if (conflict) {
      return {
        success: false,
        message: `يوجد طالب آخر بنفس الاسم "${conflict.fullName}" برقم (${conflict.studentNumber}).`,
      };
    }

    const newTotalFee =
      updates.totalFeeIQD !== undefined && updates.totalFeeIQD >= existing.verifiedPaidIQD
        ? Number(updates.totalFeeIQD)
        : existing.totalFeeIQD;

    if (
      updates.totalFeeIQD !== undefined &&
      updates.totalFeeIQD < existing.verifiedPaidIQD
    ) {
      return {
        success: false,
        message: `لا يمكن تخفيض الرسوم الكلية لأقل من مجموع المدفوعات الموثقة الحالية (${existing.verifiedPaidIQD.toLocaleString()} د.ع).`,
      };
    }

    const updatedRecord = recalculateStudentFinancials(
      {
        ...existing,
        fullName: newName,
        normalizedName: normName,
        preferredTitle: updates.preferredTitle ?? existing.preferredTitle,
        totalFeeIQD: newTotalFee,
        phone: updates.phone !== undefined ? updates.phone.trim() : existing.phone,
        institutionalStudentId:
          updates.institutionalStudentId !== undefined
            ? updates.institutionalStudentId.trim()
            : existing.institutionalStudentId,
        notes: updates.notes !== undefined ? updates.notes.trim() : existing.notes,
        updatedAt: new Date().toISOString(),
      },
      studentPayments
    );

    // Update studentName in associated payment records if name changed
    const updatedPays = studentPayments.map((p) =>
      p.studentId === studentId ? { ...p, studentName: newName } : p
    );

    setScrubStudents((prev) =>
      prev.map((s) => (s.id === studentId ? updatedRecord : s))
    );
    setStudentPayments(updatedPays);
    syncLinkedGraduateBalance(updatedRecord);

    if (auth.currentUser) {
      try {
        const cleanStu = Object.fromEntries(
          Object.entries(updatedRecord).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'scrub_students', studentId), cleanStu, {
          merge: true,
        });
      } catch (e) {
        console.warn('Firestore student update notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'تعديل بيانات طالب في قائمة السكراب',
      performedBy: actorDisplayName,
      details: `تم تحديث بيانات الطالب رقم (${updatedRecord.studentNumber}) "${updatedRecord.fullName}".`,
      affectedCount: 1,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم حفظ تعديلات الطالب "${updatedRecord.fullName}" بنجاح.`,
    };
  };

  const archiveSingleScrubStudent = async (
    studentId: string,
    reason?: string
  ) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بأرشفة أو حذف سجلات الطلبة.',
      };
    }

    const target = scrubStudents.find((s) => s.id === studentId);
    if (!target) {
      return { success: false, message: 'سجل الطالب غير موجود.' };
    }

    const nowIso = new Date().toISOString();
    const updated: ScrubStudent = {
      ...target,
      status: 'archived',
      archivedAt: nowIso,
      archivedBy: actorDisplayName,
      notes: reason
        ? `${target.notes ? target.notes + ' • ' : ''}سبب الأرشفة: ${reason}`
        : target.notes,
      updatedAt: nowIso,
    };

    setScrubStudents((prev) =>
      prev.map((s) => (s.id === studentId ? updated : s))
    );

    if (auth.currentUser) {
      try {
        const cleanStu = Object.fromEntries(
          Object.entries(updated).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'scrub_students', studentId), cleanStu, {
          merge: true,
        });
      } catch (e) {
        console.warn('Firestore single archive notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'أرشفة سجل طالب فردي',
      performedBy: actorDisplayName,
      details: `تم نقل الطالب رقم (${target.studentNumber}) "${target.fullName}" إلى الأرشيف مع الاحتفاظ الكامل بسجلاته المالية والوصولات لأغراض التدقيق.`,
      affectedCount: 1,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم أرشفة سجل الطالب "${target.fullName}" مع الاحتفاظ بوصولاته المالية في الأرشيف.`,
    };
  };

  const restoreSingleScrubStudent = async (studentId: string) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك باستعادة السجلات المؤرشفة.',
      };
    }

    const target = scrubStudents.find((s) => s.id === studentId);
    if (!target) {
      return { success: false, message: 'سجل الطالب غير موجود.' };
    }

    const nowIso = new Date().toISOString();
    const restored: ScrubStudent = recalculateStudentFinancials(
      {
        ...target,
        status: 'active',
        updatedAt: nowIso,
      },
      studentPayments
    );

    setScrubStudents((prev) =>
      prev.map((s) => (s.id === studentId ? restored : s))
    );

    if (auth.currentUser) {
      try {
        const cleanStu = Object.fromEntries(
          Object.entries(restored).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'scrub_students', studentId), cleanStu, {
          merge: true,
        });
      } catch (e) {
        console.warn('Firestore restore student notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'استعادة سجل طالب من الأرشيف',
      performedBy: actorDisplayName,
      details: `تمت استعادة الطالب رقم (${restored.studentNumber}) "${restored.fullName}" إلى القائمة النشطة بكامل أرصدته الموثقة.`,
      affectedCount: 1,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تمت استعادة الطالب "${restored.fullName}" إلى القائمة النشطة بنجاح.`,
    };
  };

  // REQUIREMENT 4: Super-Admin-Only "Delete Entire Student List" Action
  const deleteEntireStudentListSuperAdmin = async (
    confirmationPhrase: string
  ) => {
    // Backend & Role Enforcement: strictly super_admin only
    if (!isSuperAdmin) {
      await recordSystemAuditLog({
        action: 'محاولة غير مصرح بها لحذف قائمة الطلبة بالكامل',
        performedBy: actorDisplayName,
        actorRole: currentUser?.role || 'unauthorized',
        details: `تم حظر محاولة حذف قائمة طلبة حفلة السكراب بالكامل لأن المستخدم لا يمتلك صلاحية المدير الأعلى (super_admin).`,
        affectedCount: 0,
        entityType: 'security',
      });
      setAuditLogs(LocalStorageManager.getAuditLogs());
      return {
        success: false,
        message:
          'مرفوض أمنياً: إجراء حذف قائمة الطلبة بالكامل محصور حصرياً بالمدير الأعلى للنظام (Super Admin).',
      };
    }

    if (confirmationPhrase !== 'DELETE STUDENT LIST') {
      return {
        success: false,
        message:
          'عبارة التأكيد غير مطابقة. يجب كتابة العبارة الإلزامية DELETE STUDENT LIST بالأحرف الكبيرة بدقة.',
      };
    }

    const activeRecords = scrubStudents.filter((s) => s.status === 'active');
    if (activeRecords.length === 0) {
      return {
        success: false,
        message: 'لا توجد سجلات طلبة نشطة حالياً لحذفها.',
      };
    }

    const nowIso = new Date().toISOString();
    const archiveBatchId = `batch-del-${Date.now()}`;
    const affectedCount = activeRecords.length;

    // Soft-delete / archive ONLY the Scrub Party student list (retaining all financial records & receipts, never touching unrelated users/events/announcements/gallery)
    const archivedList = scrubStudents.map((s) =>
      s.status === 'active'
        ? {
            ...s,
            status: 'archived' as const,
            archivedAt: nowIso,
            archivedBy: actorDisplayName,
            archiveBatchId,
            updatedAt: nowIso,
          }
        : s
    );

    setScrubStudents(archivedList);

    if (auth.currentUser) {
      try {
        const batch = writeBatch(db);
        for (const s of archivedList) {
          const cleanStu = Object.fromEntries(
            Object.entries(s).filter(([_, v]) => v !== undefined)
          );
          batch.set(doc(db, 'scrub_students', s.id), cleanStu, { merge: true });
        }
        await batch.commit();
      } catch (e) {
        console.warn('Firestore batch archive notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'حذف وأرشفة قائمة طلبة حفلة السكراب بالكامل (Super Admin)',
      performedBy: actorDisplayName,
      actorRole: 'super_admin',
      details: `قام المدير الأعلى بتنفيذ إجراء (حذف قائمة الطلبة بالكامل) بعد اجتياز التحقق المزدوج وكتابة DELETE STUDENT LIST. تم نقل ${affectedCount} سجل طالب إلى الأرشيف الآمن مع الاحتفاظ بكافة السجلات المالية والوصولات (${studentPayments.length} سند) وعدم المساس بحسابات المستخدمين أو الفعاليات أو الإعلانات أو المعرض.`,
      affectedCount,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم حذف قائمة الطلبة النشطة (${affectedCount} طالب/طالبة) ونقلها للأرشيف الآمن مع حفظ كافة السجلات المالية للتدقيق.`,
      archivedCount: affectedCount,
    };
  };

  // Super Admin Restore Entire Archived Student List
  const restoreEntireStudentListSuperAdmin = async () => {
    if (!isSuperAdmin) {
      return {
        success: false,
        message: 'غير مصرح لك! استعادة القائمة الكاملة محصورة بالمدير الأعلى للنظام (Super Admin).',
      };
    }

    const archivedRecords = scrubStudents.filter((s) => s.status === 'archived');
    if (archivedRecords.length === 0) {
      return {
        success: false,
        message: 'لا توجد سجلات طلبة مؤرشفة لاستعادتها.',
      };
    }

    const nowIso = new Date().toISOString();
    const restoredCount = archivedRecords.length;
    const restoredList = scrubStudents.map((s) =>
      s.status === 'archived'
        ? recalculateStudentFinancials(
            {
              ...s,
              status: 'active' as const,
              updatedAt: nowIso,
            },
            studentPayments
          )
        : s
    );

    setScrubStudents(restoredList);

    if (auth.currentUser) {
      try {
        const batch = writeBatch(db);
        for (const s of restoredList) {
          const cleanStu = Object.fromEntries(
            Object.entries(s).filter(([_, v]) => v !== undefined)
          );
          batch.set(doc(db, 'scrub_students', s.id), cleanStu, { merge: true });
        }
        await batch.commit();
      } catch (e) {
        console.warn('Firestore batch restore notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'استعادة قائمة طلبة حفلة السكراب بالكامل من الأرشيف',
      performedBy: actorDisplayName,
      actorRole: 'super_admin',
      details: `قام المدير الأعلى باستعادة ${restoredCount} سجل طالب من الأرشيف إلى القائمة النشطة مع كافة أرصدتهم الموثقة.`,
      affectedCount: restoredCount,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تمت استعادة ${restoredCount} طالب/طالبة إلى القائمة النشطة بنجاح!`,
      restoredCount,
    };
  };

  // REQUIREMENT 5: Accurate Deposit & Balance Calculations + Payment History
  const addStudentPayment = async (params: {
    studentId: string;
    amountIQD: number;
    paymentMethod: PaymentMethod;
    paymentType?: 'initial_deposit' | 'installment' | 'final_settlement';
    receiptNumber?: string;
    notes?: string;
    isVerified?: boolean;
  }) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بتسجيل أو تعديل الدفعات المالية.',
      };
    }

    const student = scrubStudents.find((s) => s.id === params.studentId);
    if (!student) {
      return { success: false, message: 'سجل الطالب غير موجود.' };
    }

    const amount = Math.floor(Number(params.amountIQD) || 0);
    if (amount <= 0) {
      return {
        success: false,
        message: 'يجب أن يكون مبلغ الدفعة أكبر من صفر دينار عراقي.',
      };
    }

    // Explicit Overpayment Validation: Never allow a payment that causes a negative balance
    if (amount > student.remainingBalanceIQD) {
      return {
        success: false,
        message: `رفض عملية الدفع الزائد: المبلغ المدخل (${amount.toLocaleString()} د.ع) أكبر من الرصيد المتبقي على الطالب (${student.remainingBalanceIQD.toLocaleString()} د.ع). الحد الأقصى المسموح به هو ${student.remainingBalanceIQD.toLocaleString()} د.ع.`,
      };
    }

    const customReceipt = params.receiptNumber?.trim();
    // Prevent duplicate receipt numbers or rapid duplicate payment entries
    const existingStudentPays = studentPayments.filter(
      (p) => p.studentId === student.id && p.verificationStatus !== 'voided'
    );

    if (customReceipt) {
      const receiptDup = studentPayments.find(
        (p) =>
          p.verificationStatus !== 'voided' &&
          p.receiptNumber.toLowerCase() === customReceipt.toLowerCase()
      );
      if (receiptDup) {
        return {
          success: false,
          message: `رقم الوصل (${customReceipt}) مستخدم مسبقاً لطالب (${receiptDup.studentName}). تم منع تكرار الدفعة.`,
        };
      }
    }

    const nowMs = Date.now();
    const rapidDuplicate = existingStudentPays.find((p) => {
      const createdMs = new Date(p.createdAt).getTime();
      return (
        p.amountIQD === amount &&
        Math.abs(nowMs - createdMs) < 10000 &&
        (p.notes || '') === (params.notes?.trim() || '')
      );
    });

    if (rapidDuplicate) {
      return {
        success: false,
        message:
          'تم رصد دفعة مماثلة لنفس الطالب بنفس القيمة قبل لحظات. تم منع التكرار المزدوج.',
      };
    }

    const nowIso = new Date().toISOString();
    const todayDate = nowIso.split('T')[0];
    const nowTime = new Date().toTimeString().substring(0, 5);
    const isVerified = params.isVerified !== false;

    const seqCount = existingStudentPays.length + 1;
    const receiptNumber =
      customReceipt ||
      `SCRUB-REC-${String(student.studentNumber).padStart(3, '0')}-${seqCount}-${Math.floor(100 + Math.random() * 900)}`;

    const paymentType =
      params.paymentType ||
      (amount === student.remainingBalanceIQD
        ? 'final_settlement'
        : student.verifiedPaidIQD === 0
        ? 'initial_deposit'
        : 'installment');

    const newPayment: StudentPayment = {
      id: `scrub-pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      studentId: student.id,
      studentNumber: student.studentNumber,
      studentName: student.fullName,
      linkedUserId: student.isLinkedToAccount ? student.linkedUserId : undefined,
      amountIQD: amount,
      paymentType,
      paymentMethod: params.paymentMethod,
      receiptNumber,
      referenceCode: `${params.paymentMethod === 'cash' ? 'CASH' : 'BANK'}-${Math.floor(10000 + Math.random() * 90000)}`,
      date: todayDate,
      time: nowTime,
      notes:
        params.notes?.trim() ||
        (paymentType === 'final_settlement'
          ? 'تسديد الرصيد المتبقي بالكامل لحفلة السكراب'
          : 'دفعة نقدية لحفلة السكراب'),
      isVerified,
      verificationStatus: isVerified ? 'verified' : 'pending',
      recordedBy: actorDisplayName,
      recordedByUid: auth.currentUser?.uid,
      verifiedBy: isVerified ? actorDisplayName : undefined,
      verifiedAt: isVerified ? nowIso : undefined,
      createdAt: nowIso,
    };

    const updatedPayments = [newPayment, ...studentPayments];
    const updatedStudent = recalculateStudentFinancials(
      { ...student, updatedAt: nowIso },
      updatedPayments
    );

    setStudentPayments(updatedPayments);
    setScrubStudents((prev) =>
      prev.map((s) => (s.id === student.id ? updatedStudent : s))
    );
    syncLinkedGraduateBalance(updatedStudent);

    if (auth.currentUser) {
      try {
        const cleanPay = Object.fromEntries(
          Object.entries(newPayment).filter(([_, v]) => v !== undefined)
        );
        const cleanStu = Object.fromEntries(
          Object.entries(updatedStudent).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'student_payments', newPayment.id), cleanPay);
        await setDoc(doc(db, 'scrub_students', updatedStudent.id), cleanStu, {
          merge: true,
        });
      } catch (e) {
        console.warn('Firestore addStudentPayment sync notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: isVerified
        ? 'تسجيل وتوثيق دفعة مالية لطالب'
        : 'تسجيل دفعة مالية قيد التدقيق',
      performedBy: actorDisplayName,
      details: `تم تسجيل مبلغ ${amount.toLocaleString()} د.ع للطالب رقم (${student.studentNumber}) "${student.fullName}" بوصل رقم (${receiptNumber}). إجمالي المدفوع الموثق الآن: ${updatedStudent.verifiedPaidIQD.toLocaleString()} د.ع، المتبقي: ${updatedStudent.remainingBalanceIQD.toLocaleString()} د.ع.`,
      affectedCount: 1,
      entityType: 'student_payment',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم تسجيل الدفعة بمبلغ ${amount.toLocaleString()} د.ع وإصدار الوصل (${receiptNumber}). الرصيد المتبقي الآن: ${updatedStudent.remainingBalanceIQD.toLocaleString()} د.ع.`,
      payment: newPayment,
    };
  };

  const verifyStudentPayment = async (paymentId: string, verified: boolean) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بتوثيق أو إلغاء توثيق الدفعات المالية.',
      };
    }

    const targetPay = studentPayments.find((p) => p.id === paymentId);
    if (!targetPay) {
      return { success: false, message: 'سجل الدفعة غير موجود.' };
    }

    const student = scrubStudents.find((s) => s.id === targetPay.studentId);
    if (!student) {
      return { success: false, message: 'سجل الطالب المرتبط غير موجود.' };
    }

    // If verifying a pending payment, check that it won't cause overpayment
    if (verified && !targetPay.isVerified) {
      if (targetPay.amountIQD > student.remainingBalanceIQD) {
        return {
          success: false,
          message: `لا يمكن اعتماد هذه الدفعة (${targetPay.amountIQD.toLocaleString()} د.ع) لأنها تتجاوز الرصيد المتبقي للطالب (${student.remainingBalanceIQD.toLocaleString()} د.ع).`,
        };
      }
    }

    const nowIso = new Date().toISOString();
    const updatedPay: StudentPayment = {
      ...targetPay,
      isVerified: verified,
      verificationStatus: verified ? 'verified' : 'pending',
      verifiedBy: verified ? actorDisplayName : undefined,
      verifiedAt: verified ? nowIso : undefined,
      updatedAt: nowIso,
    };

    const updatedPayments = studentPayments.map((p) =>
      p.id === paymentId ? updatedPay : p
    );
    const updatedStudent = recalculateStudentFinancials(
      { ...student, updatedAt: nowIso },
      updatedPayments
    );

    setStudentPayments(updatedPayments);
    setScrubStudents((prev) =>
      prev.map((s) => (s.id === student.id ? updatedStudent : s))
    );
    syncLinkedGraduateBalance(updatedStudent);

    if (auth.currentUser) {
      try {
        const cleanPay = Object.fromEntries(
          Object.entries(updatedPay).filter(([_, v]) => v !== undefined)
        );
        const cleanStu = Object.fromEntries(
          Object.entries(updatedStudent).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'student_payments', updatedPay.id), cleanPay, {
          merge: true,
        });
        await setDoc(doc(db, 'scrub_students', updatedStudent.id), cleanStu, {
          merge: true,
        });
      } catch (e) {
        console.warn('Firestore verifyStudentPayment sync notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: verified ? 'اعتماد وتوثيق دفعة مالية' : 'تحويل دفعة إلى قيد التدقيق',
      performedBy: actorDisplayName,
      details: `تم ${verified ? 'اعتماد' : 'إلغاء اعتماد'} الوصل (${targetPay.receiptNumber}) بقيمة ${targetPay.amountIQD.toLocaleString()} د.ع للطالب "${student.fullName}". المتبقي المؤكد: ${updatedStudent.remainingBalanceIQD.toLocaleString()} د.ع.`,
      affectedCount: 1,
      entityType: 'student_payment',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: verified
        ? `تم توثيق الدفعة (${targetPay.receiptNumber}) وتحديث الرصيد المتبقي إلى ${updatedStudent.remainingBalanceIQD.toLocaleString()} د.ع.`
        : `تم تحويل الدفعة (${targetPay.receiptNumber}) إلى حالة قيد المراجعة.`,
    };
  };

  const voidStudentPayment = async (paymentId: string, reason: string) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بإلغاء السندات المالية.',
      };
    }

    const targetPay = studentPayments.find((p) => p.id === paymentId);
    if (!targetPay) {
      return { success: false, message: 'سجل الدفعة غير موجود.' };
    }

    const student = scrubStudents.find((s) => s.id === targetPay.studentId);
    if (!student) {
      return { success: false, message: 'سجل الطالب المرتبط غير موجود.' };
    }

    const nowIso = new Date().toISOString();
    const voidedPay: StudentPayment = {
      ...targetPay,
      isVerified: false,
      verificationStatus: 'voided',
      notes: `${targetPay.notes ? targetPay.notes + ' • ' : ''}[ملغى: ${reason.trim() || 'تعديل إداري'}]`,
      updatedAt: nowIso,
    };

    const updatedPayments = studentPayments.map((p) =>
      p.id === paymentId ? voidedPay : p
    );
    const updatedStudent = recalculateStudentFinancials(
      { ...student, updatedAt: nowIso },
      updatedPayments
    );

    setStudentPayments(updatedPayments);
    setScrubStudents((prev) =>
      prev.map((s) => (s.id === student.id ? updatedStudent : s))
    );
    syncLinkedGraduateBalance(updatedStudent);

    if (auth.currentUser) {
      try {
        const cleanPay = Object.fromEntries(
          Object.entries(voidedPay).filter(([_, v]) => v !== undefined)
        );
        const cleanStu = Object.fromEntries(
          Object.entries(updatedStudent).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'student_payments', voidedPay.id), cleanPay, {
          merge: true,
        });
        await setDoc(doc(db, 'scrub_students', updatedStudent.id), cleanStu, {
          merge: true,
        });
      } catch (e) {
        console.warn('Firestore voidStudentPayment sync notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'إلغاء سند دفع (مع حفظ الأثر المالي للتدقيق)',
      performedBy: actorDisplayName,
      details: `تم إلغاء الوصل (${targetPay.receiptNumber}) بقيمة ${targetPay.amountIQD.toLocaleString()} د.ع للطالب "${student.fullName}". السبب: ${reason || 'غير محدد'}. الرصيد المتبقي بعد التعديل: ${updatedStudent.remainingBalanceIQD.toLocaleString()} د.ع.`,
      affectedCount: 1,
      entityType: 'student_payment',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم إلغاء الوصل (${targetPay.receiptNumber}) مع الاحتفاظ به في سجل التدقيق المالي. المتبقي الحالي: ${updatedStudent.remainingBalanceIQD.toLocaleString()} د.ع.`,
    };
  };

  // REQUIREMENT 6: Student Account Linking and Privacy
  const linkStudentToAccount = async (
    studentId: string,
    targetUser: {
      userId: string;
      email: string;
      fullName: string;
      phone?: string;
    }
  ) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بربط سجلات الطلبة بحسابات المستخدمين.',
      };
    }

    const student = scrubStudents.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, message: 'سجل الطالب غير موجود.' };
    }

    // Ensure no other active student record is already linked to this userId
    const alreadyLinked = scrubStudents.find(
      (s) =>
        s.id !== studentId &&
        s.status === 'active' &&
        s.isLinkedToAccount &&
        s.linkedUserId === targetUser.userId
    );
    if (alreadyLinked) {
      return {
        success: false,
        message: `هذا الحساب مرتبط بالفعل بسجل الطالب رقم (${alreadyLinked.studentNumber}) "${alreadyLinked.fullName}".`,
      };
    }

    const nowIso = new Date().toISOString();
    const updatedStudent: ScrubStudent = {
      ...student,
      isLinkedToAccount: true,
      linkedUserId: targetUser.userId,
      linkedUserEmail: targetUser.email,
      linkedUserName: targetUser.fullName,
      linkedAt: nowIso,
      linkedBy: actorDisplayName,
      phone: student.phone || targetUser.phone,
      needsReview: false,
      reviewNote: undefined,
      updatedAt: nowIso,
    };

    const updatedPayments = studentPayments.map((p) =>
      p.studentId === studentId ? { ...p, linkedUserId: targetUser.userId } : p
    );

    setScrubStudents((prev) =>
      prev.map((s) => (s.id === studentId ? updatedStudent : s))
    );
    setStudentPayments(updatedPayments);
    syncLinkedGraduateBalance(updatedStudent);

    if (auth.currentUser) {
      try {
        const cleanStu = Object.fromEntries(
          Object.entries(updatedStudent).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'scrub_students', studentId), cleanStu, {
          merge: true,
        });
        for (const p of updatedPayments.filter((x) => x.studentId === studentId)) {
          const cleanPay = Object.fromEntries(
            Object.entries(p).filter(([_, v]) => v !== undefined)
          );
          await setDoc(doc(db, 'student_payments', p.id), cleanPay, {
            merge: true,
          });
        }
      } catch (e) {
        console.warn('Firestore linkStudentToAccount sync notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'ربط موثق لسجل طالب بحساب مستخدم',
      performedBy: actorDisplayName,
      details: `تم التحقق وربط سجل الطالب رقم (${student.studentNumber}) "${student.fullName}" (المعرف الدائم: ${student.id}) بحساب المستخدم "${targetUser.fullName}" (${targetUser.email} | UID: ${targetUser.userId}).`,
      affectedCount: 1,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم ربط سجل الطالب "${student.fullName}" بحساب (${targetUser.email}) بشكل موثق وآمن!`,
    };
  };

  const unlinkStudentFromAccount = async (studentId: string) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بفك ارتباط الحسابات.',
      };
    }

    const student = scrubStudents.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, message: 'سجل الطالب غير موجود.' };
    }

    const previousEmail = student.linkedUserEmail || student.linkedUserId || '';
    const nowIso = new Date().toISOString();

    const updatedStudent: ScrubStudent = {
      ...student,
      isLinkedToAccount: false,
      linkedUserId: undefined,
      linkedUserEmail: undefined,
      linkedUserName: undefined,
      linkedAt: undefined,
      linkedBy: undefined,
      updatedAt: nowIso,
    };

    const updatedPayments = studentPayments.map((p) =>
      p.studentId === studentId ? { ...p, linkedUserId: undefined } : p
    );

    setScrubStudents((prev) =>
      prev.map((s) => (s.id === studentId ? updatedStudent : s))
    );
    setStudentPayments(updatedPayments);

    if (auth.currentUser) {
      try {
        const cleanStu = Object.fromEntries(
          Object.entries(updatedStudent).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'scrub_students', studentId), cleanStu);
      } catch (e) {
        console.warn('Firestore unlinkStudentFromAccount sync notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'إلغاء ربط حساب مستخدم من سجل طالب',
      performedBy: actorDisplayName,
      details: `تم فك ارتباط الحساب (${previousEmail}) عن سجل الطالب رقم (${student.studentNumber}) "${student.fullName}" مع الاحتفاظ بسجله المالي مستقلّاً.`,
      affectedCount: 1,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم فك ارتباط الحساب عن سجل الطالب "${student.fullName}" بنجاح.`,
    };
  };

  const resolveStudentReviewFlag = async (
    studentId: string,
    resolutionNote?: string
  ) => {
    if (!canManageFinances) {
      return {
        success: false,
        message: 'غير مصرح لك بتحديث حالة المراجعة.',
      };
    }

    const student = scrubStudents.find((s) => s.id === studentId);
    if (!student) {
      return { success: false, message: 'سجل الطالب غير موجود.' };
    }

    const nowIso = new Date().toISOString();
    const updated: ScrubStudent = {
      ...student,
      needsReview: false,
      reviewNote: undefined,
      notes: resolutionNote
        ? `${student.notes ? student.notes + ' • ' : ''}${resolutionNote}`
        : student.notes,
      updatedAt: nowIso,
    };

    setScrubStudents((prev) =>
      prev.map((s) => (s.id === studentId ? updated : s))
    );

    if (auth.currentUser) {
      try {
        const cleanStu = Object.fromEntries(
          Object.entries(updated).filter(([_, v]) => v !== undefined)
        );
        await setDoc(doc(db, 'scrub_students', studentId), cleanStu);
      } catch (e) {
        console.warn('Firestore resolveStudentReviewFlag notice:', e);
      }
    }

    await recordSystemAuditLog({
      action: 'اعتماد مراجعة تطابق اسم طالب',
      performedBy: actorDisplayName,
      details: `تمت مراجعة وتأكيد استقلالية سجل الطالب رقم (${student.studentNumber}) "${student.fullName}".`,
      affectedCount: 1,
      entityType: 'scrub_student',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم تأكيد صحة سجل الطالب "${student.fullName}" وإزالة تنبيه المراجعة.`,
    };
  };

  // =========================================================================
  // EXISTING AUTH, GRADUATES, ANNOUNCEMENTS & MEDIA WORKFLOWS
  // =========================================================================

  const login = (emailOrPhone: string) => {
    const cleanInput = emailOrPhone.trim().toLowerCase();
    const cleanPhone = emailOrPhone.trim().replace(/[^0-9]/g, '');

    const found = graduates.find((g) => {
      const gEmail = g.email.toLowerCase();
      const gPhone = g.phone.replace(/[^0-9]/g, '');
      const gStudentId = g.studentId?.toLowerCase();
      return (
        gEmail === cleanInput ||
        (cleanPhone.length >= 7 && gPhone === cleanPhone) ||
        gStudentId === cleanInput
      );
    });

    if (!found) {
      return {
        success: false,
        message: 'لم يتم العثور على حساب بهذا البريد أو الهاتف أو رقم القيد.',
      };
    }

    if (found.status === 'pending') {
      return {
        success: false,
        message:
          'طلب تسجيلك لا يزال قيد المراجعة والتدقيق من قبل اللجنة المنظمة لمعهد التمريض. يرجى الانتظار لحين الاعتماد.',
      };
    }

    if (found.status === 'rejected' || found.status === 'suspended') {
      return {
        success: false,
        message:
          'تم تعليق أو رفض هذا الحساب. يرجى مراجعة اللجنة المنظمة لمعهد التمريض.',
      };
    }

    let activeUser = found;
    if (!found.isAdvanceLinked) {
      const { updatedGraduate } =
        LocalStorageManager.linkAdvancePaymentsForGraduate(found);
      activeUser = updatedGraduate;
      setGraduates(LocalStorageManager.getGraduates());
      setPayments(LocalStorageManager.getPayments());
    }

    setCurrentUserId(activeUser.id);
    LocalStorageManager.setCurrentUserId(activeUser.id);
    LocalStorageManager.addAuditLog({
      action: 'تسجيل دخول',
      performedBy: activeUser.displayTitle || activeUser.fullName,
      details: `تم تسجيل الدخول بنجاح بحساب (${activeUser.role === 'admin' ? 'مسؤول النظام' : activeUser.role === 'moderator' ? 'مشرف' : 'خريج'}).`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    if (activeUser.role === 'admin' || activeUser.role === 'moderator') {
      navigateTo('admin_dashboard');
    } else {
      navigateTo('graduate_dashboard');
    }

    return {
      success: true,
      message: `مرحباً بك ${activeUser.displayTitle || activeUser.fullName}!`,
      user: activeUser,
    };
  };

  const logout = () => {
    setCurrentUserId(null);
    LocalStorageManager.setCurrentUserId(null);
    navigateTo('home');
  };

  const loginWithPhoneOtp = (phone: string, otpCode: string) => {
    const cleanPhone = phone.trim().replace(/[^0-9]/g, '');
    if (!otpCode || otpCode.length < 4) {
      return {
        success: false,
        message:
          'رمز التحقق غير صحيح. يرجى إدخال رمز التحقق المكون من 4 أرقام على الأقل.',
      };
    }

    const found = graduates.find((g) => {
      const gClean = g.phone.replace(/[^0-9]/g, '');
      return gClean === cleanPhone || g.phone === phone.trim();
    });

    if (!found) {
      return {
        success: false,
        message:
          'رقم الهاتف غير مسجل في قوائم خريجي معهد التمريض (دفعة 2027).',
      };
    }

    if (found.status === 'pending') {
      return {
        success: false,
        message:
          'طلب تسجيلك قيد المراجعة والتدقيق من قبل اللجنة المنظمة لمعهد التمريض.',
      };
    }

    if (found.status === 'rejected' || found.status === 'suspended') {
      return {
        success: false,
        message: 'تم تعليق هذا الحساب. يرجى مراجعة اللجنة المنظمة.',
      };
    }

    let activeUser = found;
    if (!found.isAdvanceLinked) {
      const { updatedGraduate } =
        LocalStorageManager.linkAdvancePaymentsForGraduate(found);
      activeUser = updatedGraduate;
      setGraduates(LocalStorageManager.getGraduates());
      setPayments(LocalStorageManager.getPayments());
    }

    setCurrentUserId(activeUser.id);
    LocalStorageManager.setCurrentUserId(activeUser.id);
    LocalStorageManager.addAuditLog({
      action: 'تسجيل دخول برمز هاتف OTP',
      performedBy: activeUser.displayTitle || activeUser.fullName,
      details: `تم الدخول بنجاح عبر التحقق برقم الهاتف (${activeUser.phone}).`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    if (activeUser.role === 'admin' || activeUser.role === 'moderator') {
      navigateTo('admin_dashboard');
    } else {
      navigateTo('graduate_dashboard');
    }

    return {
      success: true,
      message: `تم تسجيل الدخول بنجاح! مرحباً ${activeUser.displayTitle || activeUser.fullName}`,
      user: activeUser,
    };
  };

  const registerGraduate = (data: {
    fullName: string;
    email: string;
    phone: string;
    studentId?: string;
    preferredTitle?: 'nurse_m' | 'nurse_f';
    notes?: string;
  }) => {
    const emailExists = graduates.some(
      (g) => g.email.toLowerCase() === data.email.trim().toLowerCase()
    );
    if (emailExists) {
      return {
        success: false,
        message: 'البريد الإلكتروني مسجل مسبقاً في المنظومة.',
      };
    }

    const titlePrefix =
      data.preferredTitle === 'nurse_f' ? 'الممرضة' : 'الممرض';
    const displayTitle = `${titlePrefix} ${data.fullName.trim()}`;

    const scrubDue = eventConfig.scrubFeeIQD || 35000;
    const gradDue = eventConfig.officialGradFeeIQD || 50000;
    const totalDue = scrubDue + gradDue;

    const newGrad: Graduate = {
      id: 'grad-' + Date.now(),
      fullName: data.fullName.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      studentId:
        data.studentId?.trim() ||
        `NUR-2027-${Math.floor(100 + Math.random() * 900)}`,
      role: 'graduate',
      status: 'pending',
      preferredTitle: data.preferredTitle || 'nurse_m',
      displayTitle,
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
      notes: data.notes?.trim() || 'طلب تسجيل خريج جديد عبر الموقع',
    };

    const { matchedTransactions, updatedGraduate } =
      LocalStorageManager.linkAdvancePaymentsForGraduate(newGrad);
    let linkedNotice: string | undefined = undefined;

    if (matchedTransactions.length > 0) {
      linkedNotice = `تم العثور على ${matchedTransactions.length} وصل دفع كاش/عربون مسجل مسبقاً برقم هاتفك وتم ربطه بحسابك تلقائياً!`;
    }

    setGraduates((prev) => [updatedGraduate, ...prev]);
    setPayments(LocalStorageManager.getPayments());

    LocalStorageManager.addAuditLog({
      action: 'طلب تسجيل خريج جديد',
      performedBy: updatedGraduate.displayTitle || updatedGraduate.fullName,
      details: `تم تقديم طلب تسجيل جديد بحالة (قيد المراجعة) برقم قيد ${updatedGraduate.studentId}. ${linkedNotice || ''}`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message:
        'تم إرسال طلب تسجيلك بنجاح! سيتم تدقيق بياناتك واعتماد الحساب من قبل اللجنة المنظمة قريباً.',
      linkedAdvanceNotice: linkedNotice,
    };
  };

  const updateEventConfig = (updates: Partial<EventConfig>) => {
    const newConfig = { ...eventConfig, ...updates };
    setEventConfig(newConfig);

    if (auth.currentUser) {
      setDoc(doc(db, 'settings', 'eventConfig'), newConfig, { merge: true }).catch((err) => {
        console.warn('Could not sync eventConfig to Firestore:', err);
      });
    }

    LocalStorageManager.addAuditLog({
      action: 'تعديل إعدادات الحفل والعداد التنازلي',
      performedBy: actorDisplayName,
      details: 'تم تحديث إعدادات ومعلومات الحفل العامة وحالة العداد التنازلي.',
      entityType: 'config',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const addGraduateManually = (newGrad: Graduate) => {
    setGraduates((prev) => [newGrad, ...prev]);
    LocalStorageManager.addAuditLog({
      action: 'إنشاء حساب خريج يدوياً',
      performedBy: actorDisplayName,
      details: `تم إضافة الخريج ${newGrad.displayTitle || newGrad.fullName} واعتماده مباشرة.`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const deleteGraduate = (graduateId: string) => {
    const target = graduates.find((g) => g.id === graduateId);
    setGraduates((prev) => prev.filter((g) => g.id !== graduateId));
    LocalStorageManager.addAuditLog({
      action: 'حذف سجل خريج',
      performedBy: actorDisplayName,
      details: `تم حذف سجل الخريج: ${target?.displayTitle || target?.fullName || graduateId}`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const approveGraduate = (graduateId: string) => {
    setGraduates((prev) =>
      prev.map((g) => {
        if (g.id === graduateId) {
          return {
            ...g,
            status: 'approved',
            approvedAt: new Date().toISOString().split('T')[0],
            approvedBy: actorDisplayName,
          };
        }
        return g;
      })
    );

    const target = graduates.find((g) => g.id === graduateId);
    LocalStorageManager.addAuditLog({
      action: 'اعتماد حساب خريج',
      performedBy: actorDisplayName,
      details: `تمت الموافقة وتفعيل حساب: ${target?.displayTitle || target?.fullName || graduateId}`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const rejectGraduate = (graduateId: string) => {
    setGraduates((prev) =>
      prev.map((g) => (g.id === graduateId ? { ...g, status: 'rejected' } : g))
    );

    const target = graduates.find((g) => g.id === graduateId);
    LocalStorageManager.addAuditLog({
      action: 'رفض حساب خريج',
      performedBy: actorDisplayName,
      details: `تم رفض طلب: ${target?.displayTitle || target?.fullName || graduateId}`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const suspendGraduate = (graduateId: string) => {
    setGraduates((prev) =>
      prev.map((g) => {
        if (g.id === graduateId) {
          const newStatus =
            g.status === 'suspended' ? 'approved' : 'suspended';
          return { ...g, status: newStatus };
        }
        return g;
      })
    );

    const target = graduates.find((g) => g.id === graduateId);
    LocalStorageManager.addAuditLog({
      action: 'تغيير حالة حساب',
      performedBy: actorDisplayName,
      details: `تم تعديل حالة حساب: ${target?.displayTitle || target?.fullName || graduateId}`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const updateGraduateRole = (graduateId: string, newRole: UserRole) => {
    if (!isSuperAdmin) return;
    setGraduates((prev) =>
      prev.map((g) => (g.id === graduateId ? { ...g, role: newRole } : g))
    );
    const target = graduates.find((g) => g.id === graduateId);
    if (auth.currentUser && target) {
      setDoc(
        doc(db, 'admins', graduateId),
        {
          role: newRole,
          email: target.email,
          fullName: target.fullName,
          updatedAt: new Date().toISOString(),
          updatedBy: actorDisplayName,
        },
        { merge: true }
      ).catch(() => {});
    }
    LocalStorageManager.addAuditLog({
      action: 'تحديث الصلاحيات والأدوار (RBAC)',
      performedBy: actorDisplayName,
      details: `تم تغيير صلاحية (${target?.fullName || graduateId}) إلى الدور (${newRole}).`,
      entityType: 'graduate',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const recordPayment = ({
    graduateId,
    amountIQD,
    eventTarget,
    method,
    paymentStatus,
    matchingPhone,
    matchingStudentId,
    notes,
  }: {
    graduateId: string;
    amountIQD: number;
    eventTarget: PaymentEventTarget;
    method: PaymentMethod;
    paymentStatus?: 'deposit' | 'partial' | 'completed';
    matchingPhone?: string;
    matchingStudentId?: string;
    notes?: string;
  }) => {
    const grad = graduates.find((g) => g.id === graduateId);
    if (!grad && !matchingPhone) {
      return {
        success: false,
        message: 'الخريج غير موجود في المنظومة ولم يتم تزويد رقم هاتف للمطابقة.',
      };
    }

    if (amountIQD <= 0) {
      return {
        success: false,
        message: 'يجب أن يكون المبلغ المقبوض أكبر من صفر.',
      };
    }

    const now = new Date();
    const receiptNum = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    const refCode = `${method === 'cash' ? 'CASH' : 'BANK'}-${Math.floor(10000 + Math.random() * 90000)}`;

    const targetDue =
      eventTarget === 'scrub_night'
        ? grad?.scrubDueIQD || eventConfig.scrubFeeIQD || 35000
        : grad?.gradDueIQD || eventConfig.officialGradFeeIQD || 50000;
    const resolvedStatus =
      paymentStatus ||
      (amountIQD >= targetDue
        ? 'completed'
        : amountIQD <= 20000
        ? 'deposit'
        : 'partial');

    const newPayment: PaymentTransaction = {
      id: 'pay-' + Date.now(),
      receiptNumber: receiptNum,
      graduateId: grad ? grad.id : `unlinked_${Date.now()}`,
      graduateName: grad
        ? grad.displayTitle || grad.fullName
        : `طالب قيد الربط (${matchingPhone})`,
      eventTarget,
      amountIQD: Math.floor(amountIQD),
      paymentStatus: resolvedStatus,
      matchingPhone: matchingPhone || grad?.phone,
      matchingStudentId: matchingStudentId || grad?.studentId,
      isLinked: Boolean(grad),
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      method,
      notes:
        notes ||
        (method === 'cash'
          ? `قبض نقدي كاش (${resolvedStatus === 'deposit' ? 'عربون' : 'دفعة'})`
          : 'تحويل بنكي مدقق'),
      recordedBy: actorDisplayName,
      isVerified: true,
      referenceCode: refCode,
    };

    if (grad) {
      setGraduates((prev) =>
        prev.map((g) => {
          if (g.id === graduateId) {
            let scrubPaid = g.scrubPaidIQD || 0;
            let scrubBal = g.scrubBalanceIQD || 0;
            let gradPaid = g.gradPaidIQD || 0;
            let gradBal = g.gradBalanceIQD || 0;

            if (eventTarget === 'scrub_night') {
              scrubPaid += newPayment.amountIQD;
              scrubBal = Math.max(0, (g.scrubDueIQD || 35000) - scrubPaid);
            } else {
              gradPaid += newPayment.amountIQD;
              gradBal = Math.max(0, (g.gradDueIQD || 50000) - gradPaid);
            }

            const totalPaid = scrubPaid + gradPaid;
            const remaining = scrubBal + gradBal;

            return {
              ...g,
              scrubPaidIQD: scrubPaid,
              scrubBalanceIQD: scrubBal,
              scrubStatus: calculatePaymentStatus(
                scrubPaid,
                g.scrubDueIQD || 35000
              ),
              gradPaidIQD: gradPaid,
              gradBalanceIQD: gradBal,
              gradStatus: calculatePaymentStatus(
                gradPaid,
                g.gradDueIQD || 50000
              ),
              totalPaidIQD: totalPaid,
              remainingBalanceIQD: remaining,
            };
          }
          return g;
        })
      );
    }

    setPayments((prev) => [newPayment, ...prev]);

    const eventLabel =
      eventTarget === 'scrub_night' ? 'حفلة السكراب' : 'حفل التخرج الرسمي';
    LocalStorageManager.addAuditLog({
      action: `تسجيل دفعة (${eventLabel})`,
      performedBy: actorDisplayName,
      details: `تم قبض مبلغ ${newPayment.amountIQD.toLocaleString()} د.ع (${resolvedStatus === 'deposit' ? 'عربون' : 'دفعة'}) لحساب (${eventLabel}) للخريج (${newPayment.graduateName}) وإصدار الوصل (${receiptNum}).`,
      entityType: 'payment',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message: `تم تثبيت الدفعة بنجاح وإصدار الوصل رقم ${receiptNum}`,
      receipt: newPayment,
    };
  };

  const addAnnouncement = (ann: Omit<Announcement, 'id' | 'publishedAt'>) => {
    const newAnn: Announcement = {
      id: 'ann-' + Date.now(),
      publishedAt: new Date().toISOString().split('T')[0],
      ...ann,
    };
    setAnnouncements((prev) => [newAnn, ...prev]);

    LocalStorageManager.addAuditLog({
      action: 'نشر إعلان جديد',
      performedBy: actorDisplayName,
      details: `تم إضافة إعلان: "${newAnn.title}"`,
      entityType: 'announcement',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const updateAnnouncement = (id: string, updates: Partial<Announcement>) => {
    setAnnouncements((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const deleteAnnouncement = (id: string) => {
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  };

  const addMedia = (item: Omit<MediaItem, 'id' | 'uploadedAt'>) => {
    const newItem: MediaItem = {
      id: 'media-' + Date.now(),
      uploadedAt: new Date().toISOString().split('T')[0],
      status: 'approved',
      ...item,
    };
    setMedia((prev) => [newItem, ...prev]);

    LocalStorageManager.addAuditLog({
      action: 'إضافة صورة للمعرض العام',
      performedBy: actorDisplayName,
      details: `تمت إضافة وسائط: "${newItem.title}" في ألبوم ${newItem.album || newItem.category}`,
      entityType: 'config',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());
  };

  const deleteMedia = (id: string) => {
    setMedia((prev) => prev.filter((m) => m.id !== id));
  };

  const approveMedia = (id: string) => {
    setMedia((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'approved' } : m))
    );
  };

  const rejectMedia = (id: string) => {
    setMedia((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status: 'rejected' } : m))
    );
  };

  const submitGraduateMedia = (item: {
    title: string;
    url: string;
    album?: string;
    category: MediaItem['category'];
  }) => {
    if (!currentUser) {
      return {
        success: false,
        message: 'يجب تسجيل الدخول لإرسال صور للنشر.',
      };
    }
    const newItem: MediaItem = {
      id: 'media-' + Date.now(),
      title: item.title,
      url: item.url,
      album: item.album || 'مشاركات الخريجين',
      category: item.category,
      isPublic: true,
      status: 'pending',
      submittedByGraduateId: currentUser.id,
      submittedByGraduateName:
        currentUser.displayTitle || currentUser.fullName,
      uploadedAt: new Date().toISOString().split('T')[0],
      sizeMb: 1.5,
    };
    setMedia((prev) => [newItem, ...prev]);

    LocalStorageManager.addAuditLog({
      action: 'تقديم صورة للنشر في المعرض',
      performedBy: currentUser.displayTitle || currentUser.fullName,
      details: `قدم الخريج صورة "${newItem.title}" بانتظار موافقة المشرف.`,
      entityType: 'config',
    });
    setAuditLogs(LocalStorageManager.getAuditLogs());

    return {
      success: true,
      message:
        'تم إرسال الصورة بنجاح! ستظهر في المعرض العام بعد مراجعة المشرف.',
    };
  };

  // --- Real Firebase Student Registration & Approval Workflow ---

  const signInWithGoogleRedirect = async () => {
    setGoogleAuthError(null);
    // Try direct Google OAuth 2.0 GIS flow first if redirect is requested manually
    const directRes = await signInWithGoogleDirectOAuth();
    if (directRes.success && directRes.user) {
      setFirebaseUser(directRes.user);
      processedAuthSessionRef.current = null;
      await processAuthenticatedFirebaseUser(directRes.user, {
        shouldNavigate: true,
      });
      return { success: true };
    }

    try {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(REDIRECT_PENDING_STORAGE_KEY, '1');
      }
      await signInWithRedirect(
        auth,
        googleProvider,
        browserPopupRedirectResolver
      );
      return { success: true };
    } catch (redirectErr: any) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(REDIRECT_PENDING_STORAGE_KEY);
      }
      const formattedMsg = logAndFormatGoogleAuthError(
        redirectErr,
        'signInWithRedirect (Manual)'
      );
      setGoogleAuthError(formattedMsg);
      return {
        success: false,
        message: formattedMsg,
      };
    }
  };

  const signInWithGoogle = async () => {
    setGoogleAuthError(null);

    // 1. Direct redirect mode for embedded social WebViews where popups are unsupported
    if (shouldUseRedirectOnMobile()) {
      return signInWithGoogleRedirect();
    }

    // 2. Standard popup mode using explicit browserPopupRedirectResolver
    try {
      const res = await signInWithPopup(
        auth,
        googleProvider,
        browserPopupRedirectResolver
      );
      setFirebaseUser(res.user);
      await processAuthenticatedFirebaseUser(res.user, {
        shouldNavigate: true,
      });
      return { success: true };
    } catch (error: any) {
      const code = typeof error?.code === 'string' ? error.code : '';

      // When Firebase Identity Toolkit throws auth/internal-error (e.g. App Check Enforcement on Identity Toolkit),
      // automatically authenticate via Google Identity Services (GIS) OAuth 2.0 using project's official oAuthClientId!
      if (
        code === 'auth/internal-error' ||
        code === 'auth/operation-not-supported-in-this-environment' ||
        code === 'auth/web-storage-unsupported'
      ) {
        const directRes = await signInWithGoogleDirectOAuth();
        if (directRes.success && directRes.user) {
          setGoogleAuthError(null);
          setFirebaseUser(directRes.user);
          processedAuthSessionRef.current = null;
          await processAuthenticatedFirebaseUser(directRes.user, {
            shouldNavigate: true,
          });
          return { success: true };
        }
      }

      const formattedMsg = logAndFormatGoogleAuthError(error, 'signInWithPopup');

      if (code === 'auth/popup-blocked') {
        return signInWithGoogleRedirect();
      }

      setGoogleAuthError(formattedMsg);
      return {
        success: false,
        message: formattedMsg,
      };
    }
  };

  const registerWithEmail = async (params: {
    fullName: string;
    email: string;
    password: string;
  }) => {
    setGoogleAuthError(null);
    const res = await registerWithEmailPassword(params);
    if (res.success && res.user) {
      setFirebaseUser(res.user);
      await recordLoggedInUserAccount(res.user, {
        customDisplayName: params.fullName.trim(),
        role: isUserAdmin(res.user) ? 'super_admin' : 'student',
      });
      processedAuthSessionRef.current = null;
      await processAuthenticatedFirebaseUser(res.user, {
        shouldNavigate: true,
      });
    }
    return {
      success: res.success,
      message: res.message,
    };
  };

  const loginWithEmail = async (params: {
    email: string;
    password: string;
  }) => {
    setGoogleAuthError(null);
    const res = await signInWithEmailPassword(params);
    if (res.success && res.user) {
      setFirebaseUser(res.user);
      processedAuthSessionRef.current = null;
      await processAuthenticatedFirebaseUser(res.user, {
        shouldNavigate: true,
      });
    }
    return {
      success: res.success,
      message: res.message,
    };
  };

  const resetPassword = async (email: string) => {
    return sendFirebasePasswordReset(email);
  };

  const refreshLoggedInUsers = async () => {
    try {
      const allUsers = await getAllLoggedInUserAccounts();
      setLoggedInUsers(allUsers);
    } catch (e) {
      console.warn('Refresh logged-in users error:', e);
    }
  };

  const updateMyDisplayName = async (displayName: string) => {
    const clean = displayName.trim();
    if (!clean || clean.length < 2) {
      return {
        success: false,
        message: 'يرجى إدخال الاسم بشكل صحيح (حرفين على الأقل).',
      };
    }
    if (!firebaseUser) {
      return {
        success: false,
        message: 'يرجى تسجيل الدخول أولاً.',
      };
    }
    const updated = await updateLoggedInUserDisplayName(firebaseUser.uid, clean);
    if (updated) {
      setLoggedInUsers((prev) => [
        updated,
        ...prev.filter((u) => u.uid !== updated.uid),
      ]);
      return {
        success: true,
        message: 'تم حفظ اسمك بنجاح!',
      };
    }
    return {
      success: false,
      message: 'تعذر تحديث الاسم، يرجى المحاولة مرة أخرى.',
    };
  };

  const signOutFirebase = async () => {
    try {
      processedAuthSessionRef.current = null;
      inFlightAuthSessionRef.current = null;
      setResolvedAdminRole(null);
      setGoogleAuthError(null);
      clearPersistedVerifiedAuthUser();
      await fbSignOut(auth);
      setFirebaseUser(null);
      setMyRegistrationRequest(null);
      logout();
    } catch (err) {
      console.warn('Error signing out:', err);
    }
  };

  const submitStudentRegistration = async (data: {
    fullName: string;
    preferredTitle: 'nurse_m' | 'nurse_f';
    studentId?: string;
    phoneNumber: string;
  }) => {
    if (!firebaseUser) {
      return {
        success: false,
        message: 'يرجى تسجيل الدخول عبر Google أو برقم الموبايل أولاً لربط هويتك المعتمدة.',
      };
    }

    try {
      await updateLoggedInUserDisplayName(firebaseUser.uid, data.fullName);
      const req = await submitRegistrationRequest({
        userId: firebaseUser.uid,
        fullName: data.fullName,
        preferredTitle: data.preferredTitle,
        studentId: data.studentId,
        phoneNumber: data.phoneNumber || firebaseUser.phoneNumber || '',
        email: firebaseUser.email || '',
        phoneVerified: Boolean(firebaseUser.phoneNumber),
      });
      setMyRegistrationRequest(req);
      return {
        success: true,
        message:
          'تم حفظ بياناتك بنجاح وتحديث ملفك الشخصي!',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'حدث خطأ أثناء حفظ البيانات: ' + (err.message || String(err)),
      };
    }
  };

  const approveStudentRegistration = async (
    request: RegistrationRequestDoc
  ) => {
    if (!firebaseUser || !isUserAdmin(firebaseUser)) {
      if (!isAdmin) {
        return {
          success: false,
          message:
            'غير مصرح لك باعتماد الطلبات. هذه الصلاحية محصورة بالمشرفين المعتمدين فقط.',
        };
      }
    }

    try {
      const newGrad = await approveStudentRequest(
        request,
        firebaseUser || ({ email: BOOTSTRAP_ADMIN_EMAIL, uid: 'admin' } as any)
      );

      setGraduates((prev) => [
        newGrad,
        ...prev.filter((g) => g.id !== newGrad.id),
      ]);
      setPendingRegistrationRequests((prev) =>
        prev.filter((r) => r.userId !== request.userId)
      );

      LocalStorageManager.addAuditLog({
        action: 'قبول طلب تسجيل خريج موثق',
        performedBy: firebaseUser?.email || 'مشرف النظام',
        details: `تم اعتماد وتسجيل ${newGrad.displayTitle || newGrad.fullName} وربط حسابه رسمياً. ${newGrad.isAdvanceLinked ? 'تم ربط دفعات كاش مسبقة!' : ''}`,
        entityType: 'graduate',
      });
      setAuditLogs(LocalStorageManager.getAuditLogs());

      return {
        success: true,
        message: `تم اعتماد وقبول الطالب (${newGrad.displayTitle || newGrad.fullName}) بنجاح! تم إنشاء سجله الرسمي وربط مدفوعاته.`,
        graduate: newGrad,
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'فشل اعتماد الطلب: ' + (err.message || String(err)),
      };
    }
  };

  const rejectStudentRegistration = async (
    userId: string,
    reason: string
  ) => {
    if (!firebaseUser || !isUserAdmin(firebaseUser)) {
      if (!isAdmin) {
        return { success: false, message: 'غير مصرح لك برفض الطلبات.' };
      }
    }

    try {
      await rejectStudentRequest(
        userId,
        reason,
        firebaseUser || ({ email: BOOTSTRAP_ADMIN_EMAIL, uid: 'admin' } as any)
      );
      setPendingRegistrationRequests((prev) =>
        prev.filter((r) => r.userId !== userId)
      );

      LocalStorageManager.addAuditLog({
        action: 'رفض طلب تسجيل طالب',
        performedBy: firebaseUser?.email || 'مشرف النظام',
        details: `تم رفض الطلب لـ (${userId}) مع ذكر السبب: ${reason || 'شروط غير مستوفاة'}`,
        entityType: 'graduate',
      });
      setAuditLogs(LocalStorageManager.getAuditLogs());

      return {
        success: true,
        message: 'تم رفض طلب التسجيل وتسجيل سبب الرفض بنجاح.',
      };
    } catch (err: any) {
      return {
        success: false,
        message: 'فشل رفض الطلب: ' + (err.message || String(err)),
      };
    }
  };

  const refreshPendingRequests = async () => {
    try {
      const allReqs = await getAllRegistrationRequests();
      setPendingRegistrationRequests(
        allReqs.filter((r) => r.status === 'pending')
      );
    } catch (e) {
      console.warn('Refresh pending requests error:', e);
    }
  };

  const refreshModeratorRequests = async () => {
    try {
      const all = await getAllModeratorRequests();
      setModeratorRequests(all);
    } catch (e) {
      console.warn('Refresh moderator requests error:', e);
    }
  };

  const submitModeratorRequestAction = async (data: {
    userName: string;
    note?: string;
    userEmail?: string;
    userPhone?: string;
  }): Promise<{ success: boolean; notice: string }> => {
    const uid = firebaseUser?.uid || currentUser?.id;
    if (!uid) {
      return { success: false, notice: 'يجب تسجيل الدخول أولاً لتقديم طلب الإشراف.' };
    }
    const res = await fbSubmitModeratorRequest({
      userId: uid,
      userName: data.userName,
      userEmail: data.userEmail || firebaseUser?.email || currentUser?.email,
      userPhone: data.userPhone || firebaseUser?.phoneNumber || currentUser?.phone,
      note: data.note,
    });
    if (res.success && res.request) {
      setMyModeratorRequest(res.request);
      await refreshModeratorRequests();
    }
    return { success: res.success, notice: res.notice };
  };

  const approveModeratorRequestAction = async (
    requestId: string
  ): Promise<{ success: boolean; notice: string }> => {
    const adminUid = firebaseUser?.uid || 'super_admin';
    const adminName = currentUser?.fullName || firebaseUser?.displayName || 'المشرف العام';
    const res = await fbApproveModeratorRequest(requestId, adminUid, adminName);
    if (res.success) {
      await refreshModeratorRequests();
      await refreshLoggedInUsers();
    }
    return res;
  };

  const rejectModeratorRequestAction = async (
    requestId: string,
    reason?: string
  ): Promise<{ success: boolean; notice: string }> => {
    const adminUid = firebaseUser?.uid || 'super_admin';
    const adminName = currentUser?.fullName || firebaseUser?.displayName || 'المشرف العام';
    const res = await fbRejectModeratorRequest(requestId, adminUid, adminName, reason);
    if (res.success) {
      await refreshModeratorRequests();
      await refreshLoggedInUsers();
    }
    return res;
  };

  const openReceipt = (transaction: PaymentTransaction) => {
    setActiveReceipt(transaction);
  };

  const closeReceipt = () => {
    setActiveReceipt(null);
  };

  return (
    <AppContext.Provider
      value={{
        currentPage,
        navigateTo,
        currentUser,
        isAdmin,
        isSuperAdmin,
        isModerator,
        canManageFinances,
        canManageContent,
        eventConfig,
        graduates,
        payments,
        announcements,
        media,
        auditLogs,
        activeReceipt,
        openReceipt,
        closeReceipt,
        scrubStudents,
        studentPayments,
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
        loggedInUsers,
        refreshLoggedInUsers,
        updateMyDisplayName,
        myRegistrationRequest,
        pendingRegistrationRequests,
        submitStudentRegistration,
        approveStudentRegistration,
        rejectStudentRegistration,
        refreshPendingRequests,
        moderatorRequests,
        myModeratorRequest,
        submitModeratorRequest: submitModeratorRequestAction,
        approveModeratorRequest: approveModeratorRequestAction,
        rejectModeratorRequest: rejectModeratorRequestAction,
        refreshModeratorRequests,
        login,
        loginWithPhoneOtp,
        logout,
        registerGraduate,
        updateEventConfig,
        addGraduateManually,
        deleteGraduate,
        approveGraduate,
        rejectGraduate,
        suspendGraduate,
        updateGraduateRole,
        recordPayment,
        addAnnouncement,
        updateAnnouncement,
        deleteAnnouncement,
        addMedia,
        deleteMedia,
        approveMedia,
        rejectMedia,
        submitGraduateMedia,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
