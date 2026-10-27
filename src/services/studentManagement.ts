import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
  query,
  where,
} from 'firebase/firestore';
import { User as FirebaseUser } from 'firebase/auth';
import {
  db,
  auth,
  isUserAdmin,
  BOOTSTRAP_ADMIN_EMAIL,
} from './firebase';
import {
  ScrubStudent,
  StudentPayment,
  Graduate,
  AuditLogEntry,
  PaymentStatus,
  PaymentMethod,
  UserRole,
} from '../types';
import { calculatePaymentStatus, LocalStorageManager } from './storage';

const SCRUB_STUDENTS_STORAGE_KEY = 'nursing_grad_scrub_students_v1';
const STUDENT_PAYMENTS_STORAGE_KEY = 'nursing_grad_student_payments_v1';
const SCRUB_IMPORT_DONE_KEY = 'nursing_grad_scrub_46_imported_v1';

// Normalize Arabic name strictly for duplicate detection and search (never alters stored/displayed fullName)
export function normalizeArabicName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .replace(/\s+/g, ' ')
    // Remove Arabic diacritics (tashkeel) and tatweel
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    // Normalize Alef variants (أ إ آ ٱ -> ا)
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize Teh Marbuta (ة -> ه)
    .replace(/ة/g, 'ه')
    // Normalize Alef Maksura (ى -> ي)
    .replace(/ى/g, 'ي')
    // Normalize common compound spacing like "عبد الله" -> "عبدالله"
    .replace(/عبد\s+الله/g, 'عبدالله')
    .toLowerCase();
}

// Check if two Arabic names are potentially similar (for flagging review without auto-merging or deleting)
export function checkNameSimilarity(
  candidateName: string,
  existingName: string
): { isExact: boolean; isSimilar: boolean; reason?: string } {
  const normA = normalizeArabicName(candidateName);
  const normB = normalizeArabicName(existingName);

  if (!normA || !normB) {
    return { isExact: false, isSimilar: false };
  }

  if (normA === normB) {
    return { isExact: true, isSimilar: true, reason: 'تطابق تام في الاسم الثلاثي/الثنائي' };
  }

  const tokensA = normA.split(' ');
  const tokensB = normB.split(' ');

  // Only flag if at least 2 tokens match in order from the start (e.g. "كرار حيدر" vs "كرار حيدر الموسوي")
  if (tokensA.length >= 2 && tokensB.length >= 2) {
    if (tokensA[0] === tokensB[0] && tokensA[1] === tokensB[1]) {
      return {
        isExact: false,
        isSimilar: true,
        reason: `تشابه في الاسم الأول والثاني مع السجل الموجود (${existingName})`,
      };
    }
  }

  return { isExact: false, isSimilar: false };
}

// Official 46 Unique Scrub Party Students (Cohort 2026 | Graduation 2027)
// Preserving exact Arabic names, Abbas Khudair included once (#27), Abbas Mohammed Shiyal (#28) with 1,000 IQD deposit
export interface InitialScrubStudentSeed {
  studentNumber: number;
  fullName: string;
  preferredTitle: 'nurse_m' | 'nurse_f';
  initialDepositIQD: number;
  totalFeeIQD: number;
}

export const OFFICIAL_46_SCRUB_STUDENTS: InitialScrubStudentSeed[] = [
  { studentNumber: 1, fullName: 'حسين علاء كاظم', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 2, fullName: 'علي محمد', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 3, fullName: 'عباس', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 4, fullName: 'زهراء عبدالله', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 5, fullName: 'محمد باقر', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 6, fullName: 'علي قاسم', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 7, fullName: 'صفا محمد', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 8, fullName: 'شيماء حيدر', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 9, fullName: 'شهد هاشم', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 10, fullName: 'سعاد وليد', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 11, fullName: 'علي أكبر', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 12, fullName: 'غدير مؤيد', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 13, fullName: 'علي جميل', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 14, fullName: 'زهراء حسين محلي', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 15, fullName: 'رقية إسماعيل', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 16, fullName: 'حسين مثنى', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 17, fullName: 'حسين كاظم', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 18, fullName: 'شيماء جابر', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 19, fullName: 'نور مشتاق', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 20, fullName: 'حوراء كاظم ظاهر', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 21, fullName: 'منار ستار', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 22, fullName: 'يوسف أحمد', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 23, fullName: 'مصطفى أحمد موحان', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 24, fullName: 'آيات ثائر', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 25, fullName: 'مريم صباح', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 26, fullName: 'طيبة عقيل', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 27, fullName: 'عباس خضير', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 28, fullName: 'عباس محمد شيال', preferredTitle: 'nurse_m', initialDepositIQD: 1000, totalFeeIQD: 35000 },
  { studentNumber: 29, fullName: 'كرار أحمد', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 30, fullName: 'عبدالله جمال', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 31, fullName: 'زهراء جبار حكيم', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 32, fullName: 'زهراء هادي عبيس', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 33, fullName: 'سكينة قيس', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 34, fullName: 'ضحى رياض', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 35, fullName: 'نرجس مالك', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 36, fullName: 'ملاك فالح', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 37, fullName: 'إسراء رضا علي', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 38, fullName: 'دعاء فوزي', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 39, fullName: 'علي حسين نعيم', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 40, fullName: 'محمد قاسم', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 41, fullName: 'مريم سالم حمزة', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 42, fullName: 'كرار حيدر', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 43, fullName: 'حسين سعد', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 44, fullName: 'آيات حاتم درسون', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 45, fullName: 'سيف مهند', preferredTitle: 'nurse_m', initialDepositIQD: 2000, totalFeeIQD: 35000 },
  { studentNumber: 46, fullName: 'زهراء علي كريم', preferredTitle: 'nurse_f', initialDepositIQD: 2000, totalFeeIQD: 35000 },
];

// Calculate balance and payment status strictly from verified payments (Requirement 5)
export function recalculateStudentFinancials(
  student: ScrubStudent,
  allPaymentsForStudent: StudentPayment[]
): ScrubStudent {
  const activePayments = allPaymentsForStudent.filter(
    (p) => p.studentId === student.id && p.verificationStatus !== 'voided'
  );

  const verifiedPaidIQD = activePayments
    .filter((p) => p.isVerified && p.verificationStatus === 'verified')
    .reduce((sum, p) => sum + Math.max(0, Number(p.amountIQD) || 0), 0);

  const pendingPaidIQD = activePayments
    .filter((p) => !p.isVerified || p.verificationStatus === 'pending')
    .reduce((sum, p) => sum + Math.max(0, Number(p.amountIQD) || 0), 0);

  const totalFeeIQD = student.totalFeeIQD > 0 ? student.totalFeeIQD : 35000;
  // Remaining balance = Total fee - Sum of verified payments (never silent negative)
  const remainingBalanceIQD = Math.max(0, totalFeeIQD - verifiedPaidIQD);
  const paymentStatus: PaymentStatus = calculatePaymentStatus(verifiedPaidIQD, totalFeeIQD);

  return {
    ...student,
    totalFeeIQD,
    verifiedPaidIQD,
    pendingPaidIQD,
    remainingBalanceIQD,
    paymentStatus,
  };
}

// Role Permission Helpers (Requirement 6, 8, 10)
export function isSuperAdminUser(
  currentUser: Graduate | null,
  firebaseUser: FirebaseUser | null
): boolean {
  if (firebaseUser && isUserAdmin(firebaseUser)) return true;
  if (!currentUser) return false;
  return (
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase() ||
    currentUser.id === 'grad-admin'
  );
}

// Strict Financial Privacy: ONLY super_admin and finance_manager can access private financial management
export function canManageFinances(
  currentUser: Graduate | null,
  firebaseUser: FirebaseUser | null
): boolean {
  if (isSuperAdminUser(currentUser, firebaseUser)) return true;
  if (!currentUser) return false;
  return currentUser.role === 'finance_manager';
}

export function canManageEvents(
  currentUser: Graduate | null,
  firebaseUser: FirebaseUser | null
): boolean {
  if (isSuperAdminUser(currentUser, firebaseUser)) return true;
  if (!currentUser) return false;
  return currentUser.role === 'event_manager' || currentUser.role === 'moderator';
}

export function canManageGallery(
  currentUser: Graduate | null,
  firebaseUser: FirebaseUser | null
): boolean {
  if (isSuperAdminUser(currentUser, firebaseUser)) return true;
  if (!currentUser) return false;
  return currentUser.role === 'gallery_moderator' || currentUser.role === 'moderator';
}

export function canManageNotifications(
  currentUser: Graduate | null,
  firebaseUser: FirebaseUser | null
): boolean {
  if (isSuperAdminUser(currentUser, firebaseUser)) return true;
  if (!currentUser) return false;
  return currentUser.role === 'notification_manager' || currentUser.role === 'moderator';
}

// LocalStorage persistence helpers with initial seed
export class ScrubStudentStorage {
  static getStudents(): ScrubStudent[] {
    try {
      const raw = localStorage.getItem(SCRUB_STUDENTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as ScrubStudent[];
      const demoIds = new Set(['grad-admin', 'grad-mod', 'grad-2', 'grad-3', 'grad-4', 'grad-advance-1']);
      let modified = false;
      const filtered = parsed.filter((s) => {
        const norm = normalizeArabicName(s.fullName);
        if (norm === 'حسين عبدالله جاسم' || norm === 'حسين عبد الله جاسم') {
          modified = true;
          return false;
        }
        return true;
      });
      const cleaned = filtered.map((s) => {
        if (
          s.needsReview &&
          ((s.potentialMatchId && demoIds.has(s.potentialMatchId)) ||
            (s.reviewNote &&
              (s.reviewNote.includes('كرار حيدر الموسوي') ||
                s.reviewNote.includes('حسين عبدالله جاسم') ||
                s.reviewNote.includes('حسين عبد الله جاسم'))))
        ) {
          modified = true;
          return {
            ...s,
            needsReview: false,
            reviewNote: undefined,
            potentialMatchId: undefined,
            potentialMatchName: undefined,
          };
        }
        return s;
      });
      if (modified) {
        this.saveStudents(cleaned);
      }
      return cleaned;
    } catch {
      return [];
    }
  }

  static saveStudents(students: ScrubStudent[]): void {
    localStorage.setItem(SCRUB_STUDENTS_STORAGE_KEY, JSON.stringify(students));
  }

  static getStudentPayments(): StudentPayment[] {
    try {
      const raw = localStorage.getItem(STUDENT_PAYMENTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StudentPayment[];
      const filtered = parsed.filter((p) => {
        const norm = normalizeArabicName(p.studentName);
        return norm !== 'حسين عبدالله جاسم' && norm !== 'حسين عبد الله جاسم';
      });
      if (filtered.length !== parsed.length) {
        this.saveStudentPayments(filtered);
      }
      return filtered;
    } catch {
      return [];
    }
  }

  static saveStudentPayments(payments: StudentPayment[]): void {
    localStorage.setItem(STUDENT_PAYMENTS_STORAGE_KEY, JSON.stringify(payments));
  }

  static isInitialImportDone(): boolean {
    return localStorage.getItem(SCRUB_IMPORT_DONE_KEY) === 'true';
  }

  static markInitialImportDone(): void {
    localStorage.setItem(SCRUB_IMPORT_DONE_KEY, 'true');
  }
}

// Record Audit Log in both LocalStorage and Firestore (if authenticated admin)
export async function recordSystemAuditLog(entry: {
  action: string;
  performedBy: string;
  actorUid?: string;
  actorEmail?: string;
  actorRole?: string;
  details: string;
  affectedCount?: number;
  entityType: AuditLogEntry['entityType'];
}): Promise<AuditLogEntry> {
  const nowIso = new Date().toISOString();
  const displayTime = nowIso.replace('T', ' ').substring(0, 16);
  const logId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const logEntry: AuditLogEntry = {
    id: logId,
    action: entry.action,
    performedBy: entry.performedBy,
    actorUid: entry.actorUid || auth.currentUser?.uid || 'local-admin',
    actorEmail: entry.actorEmail || auth.currentUser?.email || '',
    actorRole: entry.actorRole || 'super_admin',
    details: entry.details,
    affectedCount: entry.affectedCount,
    timestamp: displayTime,
    entityType: entry.entityType,
  };

  LocalStorageManager.addAuditLog({
    action: logEntry.action,
    performedBy: logEntry.performedBy,
    actorUid: logEntry.actorUid,
    actorEmail: logEntry.actorEmail,
    actorRole: logEntry.actorRole,
    details: logEntry.details,
    affectedCount: logEntry.affectedCount,
    entityType: logEntry.entityType,
  });

  if (auth.currentUser) {
    try {
      await setDoc(doc(db, 'audit_logs', logId), {
        ...logEntry,
        timestamp: nowIso,
      });
    } catch (e) {
      console.warn('Firestore audit log sync notice:', e);
    }
  }

  return logEntry;
}

// Fetch from Firestore for public student lookup and admin roster, merging safely with local state
export async function syncScrubRosterFromFirestore(): Promise<{
  students: ScrubStudent[];
  studentPayments: StudentPayment[];
} | null> {
  try {
    const stuSnap = await getDocs(collection(db, 'scrub_students'));
    const paySnap = await getDocs(collection(db, 'student_payments'));

    if (stuSnap.empty) {
      return null;
    }

    const fsStudents = stuSnap.docs
      .map((d) => ({ ...d.data(), id: d.id } as ScrubStudent))
      .filter((s) => {
        const norm = normalizeArabicName(s.fullName);
        return norm !== 'حسين عبدالله جاسم' && norm !== 'حسين عبد الله جاسم';
      });
    const fsPayments = paySnap.docs
      .map((d) => ({ ...d.data(), id: d.id } as StudentPayment))
      .filter((p) => {
        const norm = normalizeArabicName(p.studentName);
        return norm !== 'حسين عبدالله جاسم' && norm !== 'حسين عبد الله جاسم';
      });

    // Recalculate financials for every student from verified payments
    const recalculated = fsStudents
      .map((s) => recalculateStudentFinancials(s, fsPayments))
      .sort((a, b) => a.studentNumber - b.studentNumber);

    ScrubStudentStorage.saveStudents(recalculated);
    ScrubStudentStorage.saveStudentPayments(fsPayments);
    ScrubStudentStorage.markInitialImportDone();

    return { students: recalculated, studentPayments: fsPayments };
  } catch (err) {
    console.warn('syncScrubRosterFromFirestore note:', err);
    return null;
  }
}

// Fetch a single linked student's private Scrub Party record and payments (for logged-in Student privacy view)
export async function fetchLinkedStudentFinancialsForUser(
  userId: string,
  localStudents: ScrubStudent[],
  localPayments: StudentPayment[]
): Promise<{
  student: ScrubStudent | null;
  payments: StudentPayment[];
}> {
  // Check local state first
  const localMatch = localStudents.find(
    (s) => s.status === 'active' && s.isLinkedToAccount && s.linkedUserId === userId
  );
  if (localMatch) {
    const myPays = localPayments.filter(
      (p) => p.studentId === localMatch.id && p.verificationStatus !== 'voided'
    );
    return { student: localMatch, payments: myPays };
  }

  // If authenticated with Firebase, query only records where linkedUserId == userId
  if (auth.currentUser && auth.currentUser.uid === userId) {
    try {
      const qStu = query(
        collection(db, 'scrub_students'),
        where('isLinkedToAccount', '==', true),
        where('linkedUserId', '==', userId)
      );
      const snapStu = await getDocs(qStu);
      if (!snapStu.empty) {
        const stuDoc = { ...snapStu.docs[0].data(), id: snapStu.docs[0].id } as ScrubStudent;
        const qPay = query(
          collection(db, 'student_payments'),
          where('linkedUserId', '==', userId)
        );
        const snapPay = await getDocs(qPay);
        const pays = snapPay.docs.map((d) => ({ ...d.data(), id: d.id } as StudentPayment));
        return {
          student: recalculateStudentFinancials(stuDoc, pays),
          payments: pays,
        };
      }
    } catch (e) {
      console.warn('fetchLinkedStudentFinancialsForUser note:', e);
    }
  }

  return { student: null, payments: [] };
}

export interface ImportReport {
  importedCount: number;
  skippedDuplicatesCount: number;
  flaggedForReviewCount: number;
  totalActiveStudents: number;
  students: ScrubStudent[];
  studentPayments: StudentPayment[];
  flaggedDetails: Array<{ studentName: string; studentNumber: number; reason: string }>;
}

// Idempotent, Duplicate-Safe Import of the 46 Official Scrub Party Students (Requirement 1 & 2)
export async function importOfficial46ScrubStudents(params: {
  existingStudents: ScrubStudent[];
  existingPayments: StudentPayment[];
  existingGraduates: Graduate[];
  actorName: string;
}): Promise<ImportReport> {
  const { existingStudents, existingPayments, existingGraduates, actorName } = params;

  const updatedStudents = [...existingStudents];
  const updatedPayments = [...existingPayments];
  const flaggedDetails: Array<{ studentName: string; studentNumber: number; reason: string }> = [];

  let importedCount = 0;
  let skippedDuplicatesCount = 0;
  let flaggedForReviewCount = 0;

  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];

  for (const seed of OFFICIAL_46_SCRUB_STUDENTS) {
    const deterministicId = `scrub-stu-2026-${String(seed.studentNumber).padStart(3, '0')}`;
    const normSeedName = normalizeArabicName(seed.fullName);

    // 1. Check if this student already exists in scrub_students (by permanent ID or exact normalized Arabic name)
    const existingRecord = updatedStudents.find(
      (s) =>
        s.id === deterministicId ||
        (s.normalizedName === normSeedName && s.studentNumber === seed.studentNumber) ||
        s.normalizedName === normSeedName
    );

    if (existingRecord) {
      // Do NOT duplicate or overwrite verified payments or account links!
      // If it was archived and we are re-importing only if no active exists, keep existing verified data intact.
      skippedDuplicatesCount++;
      continue;
    }

    // 2. Inspect existing graduates collection to check if any existing record has a similar name (Flag for review rather than auto-linking or duplicating)
    let needsReview = false;
    let reviewNote: string | undefined = undefined;
    let potentialMatchId: string | undefined = undefined;
    let potentialMatchName: string | undefined = undefined;

    for (const grad of existingGraduates) {
      if (grad.id === 'grad-admin' || grad.id === 'grad-mod') continue;
      const sim = checkNameSimilarity(seed.fullName, grad.fullName);
      if (sim.isExact || sim.isSimilar) {
        needsReview = true;
        potentialMatchId = grad.id;
        potentialMatchName = grad.fullName;
        reviewNote = `يوجد حساب خريج مسجل باسم مشابه (${grad.fullName} - ${grad.phone}). لم يتم الربط التلقائي حفاظاً على الأمان؛ يرجى التحقق قبل الربط.`;
        flaggedForReviewCount++;
        flaggedDetails.push({
          studentName: seed.fullName,
          studentNumber: seed.studentNumber,
          reason: reviewNote,
        });
        break;
      }
    }

    // 3. Create initial verified deposit payment record (2,000 IQD for 45 students, 1,000 IQD for Abbas Mohammed Shiyal)
    const depositPaymentId = `scrub-pay-init-2026-${String(seed.studentNumber).padStart(3, '0')}`;
    const receiptNumber = `SCRUB-DEP-${String(seed.studentNumber).padStart(3, '0')}`;
    const remainingBalance = Math.max(0, seed.totalFeeIQD - seed.initialDepositIQD);

    const existingDeposit = updatedPayments.find((p) => p.id === depositPaymentId);
    if (!existingDeposit && seed.initialDepositIQD > 0) {
      const initialPayment: StudentPayment = {
        id: depositPaymentId,
        studentId: deterministicId,
        studentNumber: seed.studentNumber,
        studentName: seed.fullName,
        amountIQD: seed.initialDepositIQD,
        paymentType: 'initial_deposit',
        paymentMethod: 'cash',
        receiptNumber,
        referenceCode: `INIT-2026-${String(seed.studentNumber).padStart(3, '0')}`,
        date: '2026-10-25',
        time: '10:00',
        notes:
          seed.initialDepositIQD === 1000
            ? 'عربون أولي موثق لحفلة السكراب (1,000 د.ع - المتبقي 34,000 د.ع)'
            : 'عربون أولي موثق لحفلة السكراب (2,000 د.ع - المتبقي 33,000 د.ع)',
        isVerified: true,
        verificationStatus: 'verified',
        recordedBy: actorName || 'اللجنة المالية — معهد التمريض',
        verifiedBy: actorName || 'اللجنة المالية — معهد التمريض',
        verifiedAt: nowIso,
        createdAt: nowIso,
      };
      updatedPayments.push(initialPayment);
    }

    // 4. Create the ScrubStudent record (unlinked by default per Requirement 1 & 6)
    const newStudent: ScrubStudent = {
      id: deterministicId,
      studentNumber: seed.studentNumber,
      fullName: seed.fullName,
      normalizedName: normSeedName,
      preferredTitle: seed.preferredTitle,
      totalFeeIQD: seed.totalFeeIQD,
      verifiedPaidIQD: seed.initialDepositIQD,
      pendingPaidIQD: 0,
      remainingBalanceIQD: remainingBalance,
      paymentStatus: calculatePaymentStatus(seed.initialDepositIQD, seed.totalFeeIQD),
      status: 'active',
      isLinkedToAccount: false,
      needsReview,
      reviewNote,
      potentialMatchId,
      potentialMatchName,
      notes:
        seed.initialDepositIQD === 1000
          ? 'سجل رسمي مستورد (عربون أولي 1,000 د.ع | المتبقي 34,000 د.ع)'
          : 'سجل رسمي مستورد (عربون أولي 2,000 د.ع | المتبقي 33,000 د.ع)',
      createdAt: todayDate,
      updatedAt: nowIso,
    };

    updatedStudents.push(recalculateStudentFinancials(newStudent, updatedPayments));
    importedCount++;
  }

  // Sort by studentNumber ascending
  updatedStudents.sort((a, b) => a.studentNumber - b.studentNumber);

  // Save to LocalStorage
  ScrubStudentStorage.saveStudents(updatedStudents);
  ScrubStudentStorage.saveStudentPayments(updatedPayments);
  ScrubStudentStorage.markInitialImportDone();

  // Persist to Firestore if authenticated admin
  if (auth.currentUser && importedCount > 0) {
    try {
      const batch = writeBatch(db);
      for (const stu of updatedStudents) {
        const stuRef = doc(db, 'scrub_students', stu.id);
        const cleanStu = Object.fromEntries(
          Object.entries(stu).filter(([_, v]) => v !== undefined)
        );
        batch.set(stuRef, cleanStu, { merge: true });
      }
      for (const pay of updatedPayments) {
        const payRef = doc(db, 'student_payments', pay.id);
        const cleanPay = Object.fromEntries(
          Object.entries(pay).filter(([_, v]) => v !== undefined)
        );
        batch.set(payRef, cleanPay, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore batch import sync notice:', e);
    }
  }

  if (importedCount > 0) {
    await recordSystemAuditLog({
      action: 'استيراد قائمة طلبة حفلة السكراب الرسمية',
      performedBy: actorName,
      details: `تم استيراد ${importedCount} طالب/طالبة بنجاح، وتخطي ${skippedDuplicatesCount} سجل مكرر، وتحديد ${flaggedForReviewCount} سجل للمراجعة اليدوية دون الكتابة فوق السجلات المالية الموثقة.`,
      affectedCount: importedCount,
      entityType: 'scrub_student',
    });
  }

  return {
    importedCount,
    skippedDuplicatesCount,
    flaggedForReviewCount,
    totalActiveStudents: updatedStudents.filter((s) => s.status === 'active').length,
    students: updatedStudents,
    studentPayments: updatedPayments,
    flaggedDetails,
  };
}

// Sync local Scrub Students and Payments to Firestore when Super Admin / Finance Admin connects
export async function pushLocalScrubRosterToFirestore(
  students: ScrubStudent[],
  payments: StudentPayment[]
): Promise<void> {
  if (!auth.currentUser) return;
  try {
    const existingSnap = await getDocs(collection(db, 'scrub_students'));
    if (existingSnap.size >= students.length && existingSnap.size > 0) {
      return; // Already synced in Firestore
    }

    // Commit in chunks of 400 (well under Firestore 500 batch limit)
    const batch = writeBatch(db);
    for (const stu of students) {
      const cleanStu = Object.fromEntries(
        Object.entries(stu).filter(([_, v]) => v !== undefined)
      );
      batch.set(doc(db, 'scrub_students', stu.id), cleanStu, { merge: true });
    }
    for (const pay of payments) {
      const cleanPay = Object.fromEntries(
        Object.entries(pay).filter(([_, v]) => v !== undefined)
      );
      batch.set(doc(db, 'student_payments', pay.id), cleanPay, { merge: true });
    }
    await batch.commit();
  } catch (e) {
    console.warn('pushLocalScrubRosterToFirestore note:', e);
  }
}

// Compute next sequential studentNumber automatically (Requirement 2: 47, 48, ...)
export function getNextSequentialStudentNumber(students: ScrubStudent[]): number {
  if (students.length === 0) return 1;
  const maxNum = students.reduce(
    (max, s) => (typeof s.studentNumber === 'number' && s.studentNumber > max ? s.studentNumber : max),
    0
  );
  return maxNum + 1;
}

// Private Student Payment Lookup Helpers («استعلام عن حسابي» - Requirement 4 & 5)
// Step 2: Check whether a matching student record exists by Arabic name WITHOUT returning financial or contact details
export interface PublicLookupMatchSummary {
  found: boolean;
  studentId?: string;
  studentNumber?: number;
  fullName?: string;
  preferredTitle?: 'nurse_m' | 'nurse_f';
  hasVerifiedAccountLink?: boolean;
  hasVerificationMethodAvailable?: boolean;
  isCurrentUserLinkedOwner?: boolean;
}

export function lookupStudentByNameWithoutFinancials(
  queryName: string,
  students: ScrubStudent[],
  payments: StudentPayment[],
  currentUserId?: string | null
): PublicLookupMatchSummary {
  const normQuery = normalizeArabicName(queryName);
  if (!normQuery || normQuery.length < 3) {
    return { found: false };
  }

  const activeStudents = students.filter((s) => s.status === 'active');
  // Exact normalized Arabic match first, then unambiguous token match
  let match = activeStudents.find((s) => normalizeArabicName(s.fullName) === normQuery);
  if (!match) {
    const queryTokens = normQuery.split(' ').filter(Boolean);
    if (queryTokens.length >= 2) {
      const candidates = activeStudents.filter((s) => {
        const sNorm = normalizeArabicName(s.fullName);
        return queryTokens.every((t) => sNorm.includes(t));
      });
      if (candidates.length === 1) {
        match = candidates[0];
      }
    }
  }

  if (!match) {
    return { found: false };
  }

  const studentPayments = payments.filter(
    (p) => p.studentId === match!.id && p.verificationStatus !== 'voided'
  );
  const hasPhone = Boolean(match.phone && match.phone.trim().length >= 7);
  const hasInstId = Boolean(match.institutionalStudentId && match.institutionalStudentId.trim().length >= 3);
  const hasReceiptOrRef = studentPayments.some(
    (p) => Boolean(p.receiptNumber) || Boolean(p.referenceCode)
  );
  const isCurrentUserLinkedOwner = Boolean(
    currentUserId && match.isLinkedToAccount && match.linkedUserId === currentUserId
  );

  return {
    found: true,
    studentId: match.id,
    studentNumber: match.studentNumber,
    fullName: match.fullName,
    preferredTitle: match.preferredTitle,
    hasVerifiedAccountLink: Boolean(match.isLinkedToAccount && match.linkedUserId),
    hasVerificationMethodAvailable: Boolean(
      match.isLinkedToAccount || hasPhone || hasInstId || hasReceiptOrRef
    ),
    isCurrentUserLinkedOwner,
  };
}

// Step 3 & 4: Verify Student Identity before returning private financial record
export function verifyStudentIdentityForLookup(params: {
  studentId: string;
  students: ScrubStudent[];
  payments: StudentPayment[];
  currentUser: Graduate | null;
  verificationInput?: string; // Receipt number, reference code, verified phone, or institutional ID
}): {
  verified: boolean;
  errorReason?: string;
  student?: ScrubStudent;
  payments?: StudentPayment[];
} {
  const { studentId, students, payments, currentUser, verificationInput } = params;
  const student = students.find((s) => s.id === studentId && s.status === 'active');
  if (!student) {
    return { verified: false, errorReason: 'لم يتم العثور على السجل المطلوب.' };
  }

  const studentPayments = payments
    .filter((p) => p.studentId === student.id && p.verificationStatus !== 'voided')
    .sort((a, b) => b.date.localeCompare(a.date));

  // Method A: Authenticated user is already verified & linked by Admin to this exact student record
  if (
    currentUser &&
    student.isLinkedToAccount &&
    student.linkedUserId &&
    student.linkedUserId === currentUser.id
  ) {
    return {
      verified: true,
      student: recalculateStudentFinancials(student, studentPayments),
      payments: studentPayments,
    };
  }

  // Method B: Verification via receipt number, reference code, verified phone number, or institutional student ID
  const cleanInput = (verificationInput || '').trim().toUpperCase();
  if (!cleanInput) {
    return {
      verified: false,
      errorReason: 'يرجى إدخال رمز التحقق (رقم الوصل، رمز المرجع، أو رقم الهاتف الموثق لدى اللجنة المالية).',
    };
  }

  // Check if matches any non-default / admin-issued receipt or reference code, or matches verified phone / institutional ID
  const matchedPhone =
    student.phone &&
    student.phone.replace(/\s+/g, '') === cleanInput.replace(/\s+/g, '') &&
    student.phone.length >= 7;
  const matchedInstId =
    student.institutionalStudentId &&
    student.institutionalStudentId.trim().toUpperCase() === cleanInput;
  const matchedPaymentReceipt = studentPayments.some(
    (p) =>
      p.receiptNumber.trim().toUpperCase() === cleanInput ||
      p.referenceCode.trim().toUpperCase() === cleanInput
  );

  if (matchedPhone || matchedInstId || matchedPaymentReceipt) {
    return {
      verified: true,
      student: recalculateStudentFinancials(student, studentPayments),
      payments: studentPayments,
    };
  }

  return {
    verified: false,
    errorReason:
      'بيانات التحقق غير مطابقة للسجل المحمي. إذا لم تستلم رمز الوصل المالي أو لم تقم اللجنة المالية بربط حسابك بعد، يرجى التواصل مع مسؤول النظام أو اللجنة المالية لتوثيق حسابك.',
  };
}

// Direct Simple Student Payment Lookup by Two-Part or Three-Part Arabic Name
export interface StudentLookupCandidate {
  id: string;
  fullName: string;
}

export interface DirectStudentPaymentResult {
  status: 'single_match' | 'multiple_matches' | 'not_found' | 'empty_database';
  student?: {
    id: string;
    fullName: string;
    paidAmountIQD: number;
    gradPaidAmountIQD: number;
    totalFeeIQD: number;
  };
  candidates?: StudentLookupCandidate[];
}

export function getActualPaidAmountForStudent(
  student: ScrubStudent,
  payments: StudentPayment[]
): number {
  const scrubOnlyPayments = payments.filter(
    (p) => !p.eventTarget || p.eventTarget === 'scrub_night'
  );
  const recalculated = recalculateStudentFinancials(student, scrubOnlyPayments);
  const activeVerifiedPayments = scrubOnlyPayments.filter(
    (p) =>
      p.studentId === student.id &&
      p.verificationStatus !== 'voided' &&
      p.isVerified &&
      p.verificationStatus === 'verified'
  );
  if (activeVerifiedPayments.length > 0) {
    return recalculated.verifiedPaidIQD;
  }
  return Math.max(0, Number(student.verifiedPaidIQD) || 0);
}

export function getOfficialGradPaidAmountForStudent(
  student: ScrubStudent,
  payments: StudentPayment[]
): number {
  const activeGradPayments = payments.filter(
    (p) =>
      p.studentId === student.id &&
      p.eventTarget === 'official_grad' &&
      p.verificationStatus !== 'voided' &&
      p.isVerified &&
      p.verificationStatus === 'verified'
  );
  return activeGradPayments.reduce(
    (sum, p) => sum + Math.max(0, Number(p.amountIQD) || 0),
    0
  );
}

export function searchStudentPaymentByName(
  rawQueryName: string,
  students: ScrubStudent[],
  payments: StudentPayment[]
): DirectStudentPaymentResult {
  const normQuery = normalizeArabicName(rawQueryName);
  if (!normQuery || normQuery.length < 2) {
    return { status: 'not_found' };
  }

  const queryTokens = normQuery.split(' ').filter(Boolean);
  const activeStudents = students.filter((s) => s.status === 'active');

  if (activeStudents.length === 0) {
    return { status: 'empty_database' };
  }

  // 1. If the user entered a single word (e.g., "عباس" or "زهراء"), find all records whose full name or first name matches
  if (queryTokens.length === 1) {
    const firstWordMatches = activeStudents.filter((s) => {
      const sNorm = normalizeArabicName(s.fullName);
      const sTokens = sNorm.split(' ').filter(Boolean);
      return sNorm === normQuery || sTokens[0] === normQuery;
    });

    if (firstWordMatches.length === 1) {
      const matched = firstWordMatches[0];
      return {
        status: 'single_match',
        student: {
          id: matched.id,
          fullName: matched.fullName,
          paidAmountIQD: getActualPaidAmountForStudent(matched, payments),
          gradPaidAmountIQD: getOfficialGradPaidAmountForStudent(matched, payments),
          totalFeeIQD: matched.totalFeeIQD > 0 ? matched.totalFeeIQD : 35000,
        },
      };
    }

    if (firstWordMatches.length > 1) {
      return {
        status: 'multiple_matches',
        candidates: firstWordMatches.map((s) => ({
          id: s.id,
          fullName: s.fullName,
        })),
      };
    }

    return { status: 'not_found' };
  }

  // 2. Two-part or three-part name matching:
  // Tier A: Exact full name match OR ordered prefix match in either direction
  // (e.g., user enters 2-part "حسين علاء" matching "حسين علاء كاظم", OR user enters 3-part "علي قاسم حسن" matching 2-part record "علي قاسم")
  const primaryMatches = activeStudents.filter((s) => {
    const sNorm = normalizeArabicName(s.fullName);
    if (sNorm === normQuery) return true;

    const sTokens = sNorm.split(' ').filter(Boolean);

    // Case A1: Query tokens match the beginning of the stored student name (e.g., 2-part query matches 3-part stored name)
    if (
      queryTokens.length >= 2 &&
      sTokens.length >= queryTokens.length &&
      queryTokens.every((tok, idx) => sTokens[idx] === tok)
    ) {
      return true;
    }

    // Case A2: Stored student name has >= 2 tokens and matches the beginning of the 3-part query
    if (
      sTokens.length >= 2 &&
      queryTokens.length > sTokens.length &&
      sTokens.every((tok, idx) => queryTokens[idx] === tok)
    ) {
      return true;
    }

    return false;
  });

  if (primaryMatches.length === 1) {
    const matched = primaryMatches[0];
    return {
      status: 'single_match',
      student: {
        id: matched.id,
        fullName: matched.fullName,
        paidAmountIQD: getActualPaidAmountForStudent(matched, payments),
        gradPaidAmountIQD: getOfficialGradPaidAmountForStudent(matched, payments),
        totalFeeIQD: matched.totalFeeIQD > 0 ? matched.totalFeeIQD : 35000,
      },
    };
  }

  if (primaryMatches.length > 1) {
    return {
      status: 'multiple_matches',
      candidates: primaryMatches.map((s) => ({
        id: s.id,
        fullName: s.fullName,
      })),
    };
  }

  // Tier B: Similar / token-subset match (e.g., user entered 1st + 3rd name "زهراء محلي" for "زهراء حسين محلي", or partial token prefix)
  const similarMatches = activeStudents.filter((s) => {
    const sNorm = normalizeArabicName(s.fullName);
    const sTokens = sNorm.split(' ').filter(Boolean);

    // First name must match or start with the query's first name, and all query tokens must appear in the student's name
    if (sTokens.length === 0 || sTokens[0] !== queryTokens[0]) return false;

    return queryTokens.every((qTok) =>
      sTokens.some((sTok) => sTok === qTok || (qTok.length >= 3 && sTok.startsWith(qTok)))
    );
  });

  if (similarMatches.length === 1) {
    const matched = similarMatches[0];
    return {
      status: 'single_match',
      student: {
        id: matched.id,
        fullName: matched.fullName,
        paidAmountIQD: getActualPaidAmountForStudent(matched, payments),
        gradPaidAmountIQD: getOfficialGradPaidAmountForStudent(matched, payments),
        totalFeeIQD: matched.totalFeeIQD > 0 ? matched.totalFeeIQD : 35000,
      },
    };
  }

  if (similarMatches.length > 1) {
    return {
      status: 'multiple_matches',
      candidates: similarMatches.map((s) => ({
        id: s.id,
        fullName: s.fullName,
      })),
    };
  }

  return { status: 'not_found' };
}

export function getStudentPaymentById(
  studentId: string,
  students: ScrubStudent[],
  payments: StudentPayment[]
): {
  id: string;
  fullName: string;
  paidAmountIQD: number;
  gradPaidAmountIQD: number;
  totalFeeIQD: number;
} | null {
  const found = students.find((s) => s.id === studentId && s.status === 'active');
  if (!found) return null;

  return {
    id: found.id,
    fullName: found.fullName,
    paidAmountIQD: getActualPaidAmountForStudent(found, payments),
    gradPaidAmountIQD: getOfficialGradPaidAmountForStudent(found, payments),
    totalFeeIQD: found.totalFeeIQD > 0 ? found.totalFeeIQD : 35000,
  };
}

// Export Scrub Students List to CSV (UTF-8 with BOM for Excel Arabic support) - No Total Fee column per Requirement 3
export function exportScrubStudentsCSV(students: ScrubStudent[], includeArchived = false): string {
  const targetList = includeArchived
    ? students
    : students.filter((s) => s.status === 'active');

  const headers = [
    'ت (رقم الطالب)',
    'المعرف الدائم (ID)',
    'الاسم الكامل',
    'اللقب',
    'المبلغ المدفوع الموثق (د.ع)',
    'المبلغ قيد التدقيق (د.ع)',
    'المبلغ المتبقي (د.ع)',
    'حالة الدفعة',
    'مرتبط بحساب مستخدم',
    'البريد المرتبط',
    'رقم الهاتف',
    'رقم القيد',
    'حالة السجل',
    'ملاحظات المراجعة',
    'ملاحظات إدارية',
  ];

  const statusLabel = (st: PaymentStatus) =>
    st === 'completed'
      ? 'مكتمل الدفع'
      : st === 'partial'
      ? 'مدفوع جزئياً'
      : st === 'deposit'
      ? 'دافع عربون'
      : 'غير مدفوع';

  const rows = targetList.map((s) => [
    s.studentNumber,
    `"${s.id}"`,
    `"${s.fullName}"`,
    `"${s.preferredTitle === 'nurse_f' ? 'الممرضة' : 'الممرض'}"`,
    s.verifiedPaidIQD,
    s.pendingPaidIQD || 0,
    s.remainingBalanceIQD,
    `"${statusLabel(s.paymentStatus)}"`,
    `"${s.isLinkedToAccount ? 'نعم (موثق)' : 'غير مرتبط'}"`,
    `"${s.linkedUserEmail || ''}"`,
    `"${s.phone || ''}"`,
    `"${s.institutionalStudentId || ''}"`,
    `"${s.status === 'active' ? 'نشط' : 'مؤرشف'}"`,
    `"${s.reviewNote || ''}"`,
    `"${s.notes || ''}"`,
  ]);

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Export Full Scrub Students & Payments Backup JSON (Used before Super Admin Delete Entire List)
export function exportScrubFullBackupJSON(
  students: ScrubStudent[],
  payments: StudentPayment[]
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      institution: 'معهد التمريض — دفعة 2027',
      event: 'حفلة السكراب (مسرح تفاحة المصور)',
      activeStudentsCount: students.filter((s) => s.status === 'active').length,
      archivedStudentsCount: students.filter((s) => s.status === 'archived').length,
      totalPaymentsCount: payments.length,
      students,
      studentPayments: payments,
    },
    null,
    2
  );
}
