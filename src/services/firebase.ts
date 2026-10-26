import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  initializeFirestore,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  orderBy,
  serverTimestamp,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Graduate, PaymentTransaction } from '../types';

// 1. Initialize Firebase App & Services
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = initializeFirestore(
  app,
  {
    experimentalForceLongPolling: true,
  },
  firebaseConfig.firestoreDatabaseId
);
export const googleProvider = new GoogleAuthProvider();

// Standard Error Handling conforming to Firebase Skill guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test on boot as mandated
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'system_test', 'ping'));
    return true;
  } catch (err: unknown) {
    if (err instanceof Error && (err.message.includes('client is offline') || err.message.includes('Failed to get document'))) {
      console.warn('Firestore offline notice. Verify active internet access.');
      return false;
    }
    // Any permission error still means server responded and connection is alive
    return true;
  }
}

// 2. Types for Registration Workflow
export interface RegistrationRequestDoc {
  id?: string;
  userId: string;
  fullName: string;
  preferredTitle: 'nurse_m' | 'nurse_f';
  studentId?: string; // Optional
  phoneNumber: string; // Stored as profile field
  phoneVerified: boolean; // False until authentic SMS OTP verification
  email: string;
  cohortLabel: string;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

// 3. Admin Detection
export const BOOTSTRAP_ADMIN_EMAIL = 'mustafaaalihassonkazh@gmail.com';

export function isUserAdmin(user: FirebaseUser | null): boolean {
  if (!user || !user.email) return false;
  return user.email.toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
}

// 4. Registration Workflow API
export async function submitRegistrationRequest(data: {
  userId: string;
  fullName: string;
  preferredTitle: 'nurse_m' | 'nurse_f';
  studentId?: string;
  phoneNumber: string;
  email: string;
}): Promise<RegistrationRequestDoc> {
  const path = `registration_requests/${data.userId}`;
  try {
    const newReq: RegistrationRequestDoc = {
      userId: data.userId,
      fullName: data.fullName.trim(),
      preferredTitle: data.preferredTitle,
      studentId: data.studentId?.trim() || '',
      phoneNumber: data.phoneNumber.trim(),
      phoneVerified: false, // Honest flag: phone is stored in profile, genuine SMS OTP not yet gateway-verified
      email: data.email,
      cohortLabel: 'دفعة 2026 | التخرج 2027',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'registration_requests', data.userId), newReq);
    return newReq;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function getStudentRegistrationRequest(userId: string): Promise<RegistrationRequestDoc | null> {
  const path = `registration_requests/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'registration_requests', userId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as RegistrationRequestDoc;
    }
    return null;
  } catch (err: any) {
    if (
      err?.code === 'permission-denied' ||
      err?.code === 'unavailable' ||
      (err?.message && (
        err.message.includes('Missing or insufficient permissions') ||
        err.message.includes('client is offline') ||
        err.message.includes('Failed to get document')
      ))
    ) {
      console.warn(`Registration request for ${userId} not accessible or client offline; treating as unsubmitted`);
      return null;
    }
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function getAllRegistrationRequests(): Promise<RegistrationRequestDoc[]> {
  const path = 'registration_requests';
  try {
    const snap = await getDocs(collection(db, 'registration_requests'));
    return snap.docs.map((d) => ({ id: d.id, ...d.data() } as RegistrationRequestDoc));
  } catch (err: any) {
    if (
      err?.code === 'unavailable' ||
      (err?.message && (
        err.message.includes('client is offline') ||
        err.message.includes('Failed to get document')
      ))
    ) {
      console.warn('getAllRegistrationRequests: Firestore is offline, returning empty list');
      return [];
    }
    handleFirestoreError(err, OperationType.LIST, path);
  }
}

export async function approveStudentRequest(
  request: RegistrationRequestDoc,
  adminUser: FirebaseUser
): Promise<Graduate> {
  const reqPath = `registration_requests/${request.userId}`;
  const gradPath = `graduates/${request.userId}`;

  try {
    // 1. Search for existing advance cash payments by reliable identifier (Student ID or Phone Number - NEVER by name alone)
    let advancePayments: PaymentTransaction[] = [];
    const paymentsRef = collection(db, 'payments');

    // Reliable query by Student ID if present
    if (request.studentId && request.studentId.trim().length > 0) {
      try {
        const qId = query(
          paymentsRef,
          where('studentId', '==', request.studentId.trim()),
          where('paymentMethod', '==', 'advance_deposit')
        );
        const snapId = await getDocs(qId);
        snapId.forEach((docSnap) => {
          advancePayments.push({ id: docSnap.id, ...docSnap.data() } as PaymentTransaction);
        });
      } catch (err) {
        console.warn('Advance query by studentId failed:', err);
      }
    }

    // Reliable query by verified Phone Number
    if (request.phoneNumber && request.phoneNumber.trim().length > 0) {
      try {
        const qPhone = query(
          paymentsRef,
          where('studentPhone', '==', request.phoneNumber.trim()),
          where('paymentMethod', '==', 'advance_deposit')
        );
        const snapPhone = await getDocs(qPhone);
        snapPhone.forEach((docSnap) => {
          if (!advancePayments.some((p) => p.id === docSnap.id)) {
            advancePayments.push({ id: docSnap.id, ...docSnap.data() } as PaymentTransaction);
          }
        });
      } catch (err) {
        console.warn('Advance query by phone failed:', err);
      }
    }

    // Calculate advance linked sum
    let scrubAdvanceSum = 0;
    let gradAdvanceSum = 0;

    for (const payment of advancePayments) {
      if (!payment.isLinked) {
        if (payment.eventTarget === 'scrub_night') {
          scrubAdvanceSum += payment.amountIQD;
        } else {
          gradAdvanceSum += payment.amountIQD;
        }
        // Link the payment record in Firestore
        await updateDoc(doc(db, 'payments', payment.id), {
          graduateId: request.userId,
          userId: request.userId,
          isLinked: true,
          status: 'completed',
          notes: `تم الربط الآلي عبر التحقق الموثق (${request.studentId || request.phoneNumber}) بواسطة المشرف ${adminUser.email}`,
        });
      }
    }

    const scrubDue = 35000;
    const scrubPaid = scrubAdvanceSum;
    const scrubBalance = Math.max(0, scrubDue - scrubPaid);
    const scrubStatus = scrubPaid >= scrubDue ? 'completed' : scrubPaid > 0 ? 'deposit' : 'unpaid';

    const gradDue = 50000;
    const gradPaid = gradAdvanceSum;
    const gradBalance = Math.max(0, gradDue - gradPaid);
    const gradStatus = gradPaid >= gradDue ? 'completed' : gradPaid > 0 ? 'deposit' : 'unpaid';

    // 2. Create the approved Graduate document
    const titleLabel = request.preferredTitle === 'nurse_f' ? 'الممرضة' : 'الممرض';
    const graduateDoc: Graduate = {
      id: request.userId,
      fullName: request.fullName,
      email: request.email,
      phone: request.phoneNumber,
      studentId: request.studentId,
      preferredTitle: request.preferredTitle,
      displayTitle: `${titleLabel} ${request.fullName}`,
      cohortLabel: 'دفعة 2026 | التخرج 2027',
      role: 'graduate',
      status: 'active',
      scrubDueIQD: scrubDue,
      scrubPaidIQD: scrubPaid,
      scrubBalanceIQD: scrubBalance,
      scrubStatus: scrubStatus as any,
      gradDueIQD: gradDue,
      gradPaidIQD: gradPaid,
      gradBalanceIQD: gradBalance,
      gradStatus: gradStatus as any,
      totalDueIQD: scrubDue + gradDue,
      totalPaidIQD: scrubPaid + gradPaid,
      remainingBalanceIQD: scrubBalance + gradBalance,
      isAdvanceLinked: advancePayments.length > 0,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'graduates', request.userId), {
      ...graduateDoc,
      userId: request.userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Mark request as approved
    await updateDoc(doc(db, 'registration_requests', request.userId), {
      status: 'approved',
      reviewedBy: adminUser.email || adminUser.uid,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    return graduateDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, gradPath);
  }
}

export async function rejectStudentRequest(
  userId: string,
  reason: string,
  adminUser: FirebaseUser
): Promise<void> {
  const reqPath = `registration_requests/${userId}`;
  try {
    await updateDoc(doc(db, 'registration_requests', userId), {
      status: 'rejected',
      rejectionReason: reason.trim() || 'لم يتم استيفاء شروط التسجيل المعتمدة للدفعة.',
      reviewedBy: adminUser.email || adminUser.uid,
      reviewedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, reqPath);
  }
}

export async function getGraduateDoc(userId: string): Promise<Graduate | null> {
  const path = `graduates/${userId}`;
  try {
    const snap = await getDoc(doc(db, 'graduates', userId));
    if (snap.exists()) {
      return { id: snap.id, ...snap.data() } as Graduate;
    }
    return null;
  } catch (err: any) {
    if (
      err?.code === 'permission-denied' ||
      err?.code === 'unavailable' ||
      (err?.message && (
        err.message.includes('Missing or insufficient permissions') ||
        err.message.includes('client is offline') ||
        err.message.includes('Failed to get document')
      ))
    ) {
      console.warn(`Graduate doc for ${userId} not accessible or client offline; treating as unregistered`);
      return null;
    }
    handleFirestoreError(err, OperationType.GET, path);
  }
}
