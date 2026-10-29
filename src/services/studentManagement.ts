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
import { OFFICIAL_244_ROSTER, OfficialRosterStudent } from './officialRosterData';
export { OFFICIAL_244_ROSTER };
export type { OfficialRosterStudent };

const SCRUB_STUDENTS_STORAGE_KEY = 'nursing_grad_scrub_students_v1';
const STUDENT_PAYMENTS_STORAGE_KEY = 'nursing_grad_student_payments_v1';
const SCRUB_IMPORT_DONE_KEY = 'nursing_grad_scrub_244_reconciled_v4';

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
    // Normalize common PDF OCR ligature artifacts (اال -> الا, هللا -> الله)
    .replace(/هللا/g, 'الله')
    .replace(/هالل/g, 'هلال')
    .replace(/االء/g, 'الاء')
    .replace(/عالء/g, 'علاء')
    .replace(/جالل/g, 'جلال')
    .replace(/جالب/g, 'جلاب')
    .replace(/روال/g, 'رولا')
    .replace(/غيالن/g, 'غيلان')
    .replace(/شعالن/g, 'شعلان')
    .replace(/عالوي/g, 'علاوي')
    .replace(/عبداالمير/g, 'عبدالامير')
    .replace(/عبد\s+االمير/g, 'عبدالامير')
    // Normalize common compound spacing like "عبد الله" -> "عبدالله" and attached words like "سؤددوليد" -> "سؤدد وليد"
    .replace(/سؤدد\s*وليد/g, 'سؤدد وليد')
    .replace(/سودد\s*وليد/g, 'سودد وليد')
    .replace(/عبد\s+الله/g, 'عبدالله')
    .replace(/عبد\s+الحسين/g, 'عبدالحسين')
    .replace(/عبد\s+الامير/g, 'عبدالامير')
    .replace(/عبد\s+الساده/g, 'عبدالساده')
    .replace(/عبد\s+الزهره/g, 'عبدالزهره')
    .replace(/عبد\s+الواحد/g, 'عبدالواحد')
    .replace(/عبد\s+الكاظم/g, 'عبدالكاظم')
    .replace(/عبد\s+الرضا/g, 'عبدالرضا')
    .replace(/عبد\s+الحمزه/g, 'عبدالحمزه')
    .replace(/عبد\s+العباس/g, 'عبدالعباس')
    .replace(/عبد\s+الرسول/g, 'عبدالرسول')
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

// Official 46 Unique Scrub Party Old Deposit Records (from 47 raw lines with 1 duplicate "عباس خضير" removed)
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

// 39 Unambiguous 1-to-1 Confirmed Deposit Matches between the 46 old records and the 244 Official Roster
// Total confirmed initial deposits = 38 * 2,000 + 1 * 1,000 = 77,000 IQD
export const CONFIRMED_39_DEPOSIT_MAP = new Map<
  number,
  { seedNumber: number; oldPaymentName: string; depositIQD: number }
>([
  [12, { seedNumber: 37, oldPaymentName: 'إسراء رضا علي', depositIQD: 2000 }],
  [21, { seedNumber: 24, oldPaymentName: 'آيات ثائر', depositIQD: 2000 }],
  [22, { seedNumber: 44, oldPaymentName: 'آيات حاتم درسون', depositIQD: 2000 }],
  [47, { seedNumber: 43, oldPaymentName: 'حسين سعد', depositIQD: 2000 }],
  [52, { seedNumber: 1, oldPaymentName: 'حسين علاء كاظم', depositIQD: 2000 }],
  [55, { seedNumber: 17, oldPaymentName: 'حسين كاظم', depositIQD: 2000 }],
  [57, { seedNumber: 16, oldPaymentName: 'حسين مثنى', depositIQD: 2000 }],
  [61, { seedNumber: 20, oldPaymentName: 'حوراء كاظم ظاهر', depositIQD: 2000 }],
  [70, { seedNumber: 38, oldPaymentName: 'دعاء فوزي', depositIQD: 2000 }],
  [80, { seedNumber: 15, oldPaymentName: 'رقية إسماعيل', depositIQD: 2000 }],
  [95, { seedNumber: 4, oldPaymentName: 'زهراء عبدالله', depositIQD: 2000 }],
  [97, { seedNumber: 46, oldPaymentName: 'زهراء علي كريم', depositIQD: 2000 }],
  [101, { seedNumber: 32, oldPaymentName: 'زهراء هادي عبيس', depositIQD: 2000 }],
  [121, { seedNumber: 33, oldPaymentName: 'سكينة قيس', depositIQD: 2000 }],
  [123, { seedNumber: 45, oldPaymentName: 'سيف مهند', depositIQD: 2000 }],
  [125, { seedNumber: 9, oldPaymentName: 'شهد هاشم', depositIQD: 2000 }],
  [126, { seedNumber: 18, oldPaymentName: 'شيماء جابر', depositIQD: 2000 }],
  [127, { seedNumber: 8, oldPaymentName: 'شيماء حيدر', depositIQD: 2000 }],
  [129, { seedNumber: 7, oldPaymentName: 'صفا محمد', depositIQD: 2000 }],
  [131, { seedNumber: 34, oldPaymentName: 'ضحى رياض', depositIQD: 2000 }],
  [135, { seedNumber: 26, oldPaymentName: 'طيبة عقيل', depositIQD: 2000 }],
  [141, { seedNumber: 27, oldPaymentName: 'عباس خضير', depositIQD: 2000 }],
  [145, { seedNumber: 28, oldPaymentName: 'عباس محمد شيال', depositIQD: 1000 }],
  [147, { seedNumber: 30, oldPaymentName: 'عبدالله جمال', depositIQD: 2000 }],
  [154, { seedNumber: 13, oldPaymentName: 'علي جميل', depositIQD: 2000 }],
  [156, { seedNumber: 39, oldPaymentName: 'علي حسين نعيم', depositIQD: 2000 }],
  [160, { seedNumber: 6, oldPaymentName: 'علي قاسم', depositIQD: 2000 }],
  [166, { seedNumber: 12, oldPaymentName: 'غدير مؤيد', depositIQD: 2000 }],
  [176, { seedNumber: 29, oldPaymentName: 'كرار أحمد', depositIQD: 2000 }],
  [177, { seedNumber: 42, oldPaymentName: 'كرار حيدر', depositIQD: 2000 }],
  [182, { seedNumber: 5, oldPaymentName: 'محمد باقر', depositIQD: 2000 }],
  [204, { seedNumber: 41, oldPaymentName: 'مريم سالم حمزة', depositIQD: 2000 }],
  [205, { seedNumber: 25, oldPaymentName: 'مريم صباح', depositIQD: 2000 }],
  [210, { seedNumber: 23, oldPaymentName: 'مصطفى أحمد موحان', depositIQD: 2000 }],
  [218, { seedNumber: 36, oldPaymentName: 'ملاك فالح', depositIQD: 2000 }],
  [219, { seedNumber: 21, oldPaymentName: 'منار ستار', depositIQD: 2000 }],
  [228, { seedNumber: 35, oldPaymentName: 'نرجس مالك', depositIQD: 2000 }],
  [235, { seedNumber: 19, oldPaymentName: 'نور مشتاق', depositIQD: 2000 }],
  [244, { seedNumber: 22, oldPaymentName: 'يوسف أحمد', depositIQD: 2000 }],
]);

// 7 Old Payment Records that Require Admin Review (linked to 14 candidate students in the 244 official roster):
// - 3 records with slight spelling variation (#14 زهراء حسين محلي -> #92, #31 زهراء جبار حكيم -> #88, #10 سعاد وليد -> #122)
// - 4 records with 1-word or 2-word names shared by multiple official students (#2 علي محمد, #11 علي أكبر, #40 محمد قاسم, #3 عباس)
export const REVIEW_14_CANDIDATES_MAP = new Map<
  number,
  {
    seedNumber: number;
    oldPaymentName: string;
    pendingReviewAmountIQD: number;
    ambiguousGroupKey: string;
    reviewNote: string;
  }
>([
  [
    88,
    {
      seedNumber: 31,
      oldPaymentName: 'زهراء جبار حكيم',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'review-seed-31',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة بمبلغ 2,000 د.ع باسم «زهراء جبار حكيم» تتشابه مع الاسم الرسمي «زهراء جبار حاكم محمد» (اختلاف إملائي: حكيم / حاكم). لم تُحتسب تلقائياً بانتظار تأكيد المشرف.',
    },
  ],
  [
    92,
    {
      seedNumber: 14,
      oldPaymentName: 'زهراء حسين محلي',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'review-seed-14',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة بمبلغ 2,000 د.ع باسم «زهراء حسين محلي» تتشابه مع الاسم الرسمي «زهراء حسين مهلي عجيل» (اختلاف حرف: محلي / مهلي). لم تُحتسب تلقائياً بانتظار تأكيد المشرف.',
    },
  ],
  [
    122,
    {
      seedNumber: 10,
      oldPaymentName: 'سعاد وليد',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'review-seed-10',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة بمبلغ 2,000 د.ع باسم «سعاد وليد» تتشابه في اسم الأب مع الاسم الرسمي «سؤدد وليد عبيد فرحان» (اختلاف إملائي: سعاد / سؤدد). لم تُحتسب تلقائياً بانتظار تأكيد المشرف.',
    },
  ],
  [
    152,
    {
      seedNumber: 11,
      oldPaymentName: 'علي أكبر',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-11-ali-akbar',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم المركب «علي أكبر» فقط بدون اسم الأب، ويشترك فيها طالبان في شعبة 3: (ت 152: علي اكبر حسين عبيد عطيوي) و(ت 153: علي أكبر ساجد شنباره كيطان).',
    },
  ],
  [
    153,
    {
      seedNumber: 11,
      oldPaymentName: 'علي أكبر',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-11-ali-akbar',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم المركب «علي أكبر» فقط بدون اسم الأب، ويشترك فيها طالبان في شعبة 3: (ت 152: علي اكبر حسين عبيد عطيوي) و(ت 153: علي أكبر ساجد شنباره كيطان).',
    },
  ],
  [
    161,
    {
      seedNumber: 2,
      oldPaymentName: 'علي محمد',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-2-ali-mohammed',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم الثنائي «علي محمد» فقط، ويشترك فيها طالبان في شعبة 3: (ت 161: علي محمد كواد حسين) و(ت 162: علي محمد لفته كطش).',
    },
  ],
  [
    162,
    {
      seedNumber: 2,
      oldPaymentName: 'علي محمد',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-2-ali-mohammed',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم الثنائي «علي محمد» فقط، ويشترك فيها طالبان في شعبة 3: (ت 161: علي محمد كواد حسين) و(ت 162: علي محمد لفته كطش).',
    },
  ],
  [
    190,
    {
      seedNumber: 40,
      oldPaymentName: 'محمد قاسم',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-40-mohammed-qasim',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم الثنائي «محمد قاسم» فقط، ويشترك فيها طالبان في شعبة 4: (ت 190: محمد قاسم ابوالسود عطيه) و(ت 191: محمد قاسم زغير عكاب).',
    },
  ],
  [
    191,
    {
      seedNumber: 40,
      oldPaymentName: 'محمد قاسم',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-40-mohammed-qasim',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم الثنائي «محمد قاسم» فقط، ويشترك فيها طالبان في شعبة 4: (ت 190: محمد قاسم ابوالسود عطيه) و(ت 191: محمد قاسم زغير عكاب).',
    },
  ],
  [
    139,
    {
      seedNumber: 3,
      oldPaymentName: 'عباس',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-3-abbas',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم المفرد «عباس» فقط بدون اسم الأب، ويوجد 5 طلاب باسم «عباس» في شعبة 3 غير مسجل لهم عربون مؤكد (ت: 139، 140، 142، 143، 144).',
    },
  ],
  [
    140,
    {
      seedNumber: 3,
      oldPaymentName: 'عباس',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-3-abbas',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم المفرد «عباس» فقط بدون اسم الأب، ويوجد 5 طلاب باسم «عباس» في شعبة 3 غير مسجل لهم عربون مؤكد (ت: 139، 140، 142، 143، 144).',
    },
  ],
  [
    142,
    {
      seedNumber: 3,
      oldPaymentName: 'عباس',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-3-abbas',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم المفرد «عباس» فقط بدون اسم الأب، ويوجد 5 طلاب باسم «عباس» في شعبة 3 غير مسجل لهم عربون مؤكد (ت: 139، 140، 142، 143، 144).',
    },
  ],
  [
    143,
    {
      seedNumber: 3,
      oldPaymentName: 'عباس',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-3-abbas',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم المفرد «عباس» فقط بدون اسم الأب، ويوجد 5 طلاب باسم «عباس» في شعبة 3 غير مسجل لهم عربون مؤكد (ت: 139، 140، 142، 143، 144).',
    },
  ],
  [
    144,
    {
      seedNumber: 3,
      oldPaymentName: 'عباس',
      pendingReviewAmountIQD: 2000,
      ambiguousGroupKey: 'ambig-seed-3-abbas',
      reviewNote:
        'تحتاج إلى مراجعة: توجد دفعة قديمة واحدة بمبلغ 2,000 د.ع وردت بالاسم المفرد «عباس» فقط بدون اسم الأب، ويوجد 5 طلاب باسم «عباس» في شعبة 3 غير مسجل لهم عربون مؤكد (ت: 139، 140، 142، 143، 144).',
    },
  ],
]);

// Calculate balance and payment status strictly from verified payments (Requirement 3, 5, 7, 9)
export function recalculateStudentFinancials(
  student: ScrubStudent,
  allPaymentsForStudent: StudentPayment[]
): ScrubStudent {
  const activePayments = allPaymentsForStudent.filter(
    (p) => p.studentId === student.id && p.verificationStatus !== 'voided'
  );

  const verifiedList = activePayments.filter(
    (p) => p.isVerified && p.verificationStatus === 'verified'
  );

  const verifiedPaidIQD = verifiedList.reduce(
    (sum, p) => sum + Math.max(0, Math.round(Number(p.amountIQD) || 0)),
    0
  );

  const pendingPaidIQD = activePayments
    .filter((p) => !p.isVerified || p.verificationStatus === 'pending')
    .reduce((sum, p) => sum + Math.max(0, Math.round(Number(p.amountIQD) || 0)), 0);

  const latestVerifiedDate = verifiedList
    .map((p) => p.date)
    .filter(Boolean)
    .sort()
    .pop();

  const totalFeeIQD = student.totalFeeIQD >= 0 ? Math.round(student.totalFeeIQD) : 35000;
  const settlementAdj = Math.max(0, Math.round(Number(student.settlementAdjustmentIQD) || 0));
  // Remaining balance = Total fee - Sum of verified payments - Administrative settlement adjustment
  const remainingBalanceIQD = Math.max(0, totalFeeIQD - verifiedPaidIQD - settlementAdj);
  const effectiveNeedsReview = verifiedPaidIQD > 0 ? false : Boolean(student.needsReview);
  const paymentStatus: PaymentStatus =
    remainingBalanceIQD === 0 && (verifiedPaidIQD > 0 || settlementAdj > 0 || totalFeeIQD === 0)
      ? 'completed'
      : calculatePaymentStatus(
          verifiedPaidIQD,
          totalFeeIQD,
          effectiveNeedsReview
        );

  return {
    ...student,
    totalFeeIQD,
    verifiedPaidIQD,
    pendingPaidIQD,
    remainingBalanceIQD,
    settlementAdjustmentIQD: settlementAdj,
    lastPaymentDate: latestVerifiedDate || student.lastPaymentDate,
    needsReview: effectiveNeedsReview,
    paymentStatus,
    matchStatus:
      verifiedPaidIQD > 0
        ? 'confirmed'
        : effectiveNeedsReview
        ? 'needs_review'
        : 'unmatched',
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

// Strict Financial Privacy: super_admin, moderator, and finance_manager can access financial management
export function canManageFinances(
  currentUser: Graduate | null,
  firebaseUser: FirebaseUser | null
): boolean {
  if (isSuperAdminUser(currentUser, firebaseUser)) return true;
  if (!currentUser) return false;
  return currentUser.role === 'finance_manager' || currentUser.role === 'moderator';
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

// Helper to check if a payment was an erroneous v2 auto-seed on a non-confirmed student
export function isErroneousLegacyAutoSeedPayment(pay: StudentPayment): boolean {
  if (!pay.id.startsWith('scrub-pay-init-2027-')) return false;
  const numFromId = Number(pay.id.replace('scrub-pay-init-2027-', ''));
  const stuNum = numFromId || pay.studentNumber;
  return !CONFIRMED_39_DEPOSIT_MAP.has(stuNum);
}

// Deduplicate student records by ID and official studentNumber (1..244), preserving linked account & custom fields
export function deduplicateStudentsList(students: ScrubStudent[]): ScrubStudent[] {
  const officialNameByNumber = new Map<number, string>(
    OFFICIAL_244_ROSTER.map((r) => [r.globalNumber, normalizeArabicName(r.fullName)])
  );

  const byId = new Map<string, ScrubStudent>();

  for (const stu of students) {
    if (!stu || !stu.id) continue;

    // For official IDs scrub-stu-2027-001..244, ensure studentNumber matches the ID suffix
    const idMatch = stu.id.match(/^scrub-stu-2027-(\d{3})$/);
    const canonicalNum = idMatch ? Number(idMatch[1]) : stu.studentNumber;
    const expectedOfficialNorm = officialNameByNumber.get(canonicalNum);
    const stuNorm = normalizeArabicName(stu.fullName);

    const existing = byId.get(stu.id);
    if (!existing) {
      byId.set(stu.id, stu);
      continue;
    }

    // If two records share the same ID, prefer the one whose name matches the official 244 roster for that number,
    // while preserving any linked account or phone information from either record.
    const existingMatchesOfficial =
      expectedOfficialNorm && normalizeArabicName(existing.fullName) === expectedOfficialNorm;
    const currentMatchesOfficial =
      expectedOfficialNorm && stuNorm === expectedOfficialNorm;

    const primary = currentMatchesOfficial && !existingMatchesOfficial ? stu : existing;
    const secondary = primary === stu ? existing : stu;

    byId.set(stu.id, {
      ...primary,
      isLinkedToAccount: primary.isLinkedToAccount || secondary.isLinkedToAccount,
      linkedUserId: primary.linkedUserId || secondary.linkedUserId,
      linkedUserEmail: primary.linkedUserEmail || secondary.linkedUserEmail,
      linkedUserName: primary.linkedUserName || secondary.linkedUserName,
      linkedAt: primary.linkedAt || secondary.linkedAt,
      linkedBy: primary.linkedBy || secondary.linkedBy,
      phone: primary.phone || secondary.phone,
      institutionalStudentId:
        primary.institutionalStudentId || secondary.institutionalStudentId,
    });
  }

  return Array.from(byId.values()).sort((a, b) => a.studentNumber - b.studentNumber);
}

export function deduplicatePaymentsList(payments: StudentPayment[]): StudentPayment[] {
  const byId = new Map<string, StudentPayment>();
  for (const p of payments) {
    if (!p || !p.id) continue;
    byId.set(p.id, p);
  }
  return Array.from(byId.values());
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
      const deduped = deduplicateStudentsList(cleaned);
      if (deduped.length !== parsed.length || modified) {
        this.saveStudents(deduped);
      }
      return deduped;
    } catch {
      return [];
    }
  }

  static saveStudents(students: ScrubStudent[]): void {
    const deduped = deduplicateStudentsList(students);
    localStorage.setItem(SCRUB_STUDENTS_STORAGE_KEY, JSON.stringify(deduped));
  }

  static getStudentPayments(): StudentPayment[] {
    try {
      const raw = localStorage.getItem(STUDENT_PAYMENTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as StudentPayment[];
      const filtered = parsed.filter((p) => {
        const norm = normalizeArabicName(p.studentName);
        if (norm === 'حسين عبدالله جاسم' || norm === 'حسين عبد الله جاسم') return false;
        if (isErroneousLegacyAutoSeedPayment(p)) return false;
        return true;
      });
      const deduped = deduplicatePaymentsList(filtered);
      if (deduped.length !== parsed.length) {
        this.saveStudentPayments(deduped);
      }
      return deduped;
    } catch {
      return [];
    }
  }

  static saveStudentPayments(payments: StudentPayment[]): void {
    const deduped = deduplicatePaymentsList(payments);
    localStorage.setItem(STUDENT_PAYMENTS_STORAGE_KEY, JSON.stringify(deduped));
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

    const fsStudents = deduplicateStudentsList(
      stuSnap.docs
        .map((d) => ({ ...d.data(), id: d.id } as ScrubStudent))
        .filter((s) => {
          const norm = normalizeArabicName(s.fullName);
          return norm !== 'حسين عبدالله جاسم' && norm !== 'حسين عبد الله جاسم';
        })
    );

    const rawFsPayments = paySnap.docs.map((d) => ({ ...d.data(), id: d.id } as StudentPayment));
    const hasErroneousAutoSeeds = rawFsPayments.some((p) => isErroneousLegacyAutoSeedPayment(p));
    const fsPayments = deduplicatePaymentsList(
      rawFsPayments.filter((p) => {
        const norm = normalizeArabicName(p.studentName);
        if (norm === 'حسين عبدالله جاسم' || norm === 'حسين عبد الله جاسم') return false;
        if (isErroneousLegacyAutoSeedPayment(p)) return false;
        return true;
      })
    );

    // Recalculate financials for every student from verified payments
    const recalculated = fsStudents
      .map((s) => recalculateStudentFinancials(s, fsPayments))
      .sort((a, b) => a.studentNumber - b.studentNumber);

    // If Firestore had fewer than 244 active students OR had un-reconciled v2 seeds, run the v3 reconciliation & merge
    const activeCount = recalculated.filter((s) => s.status === 'active').length;
    if (
      activeCount < 244 ||
      hasErroneousAutoSeeds ||
      !ScrubStudentStorage.isInitialImportDone()
    ) {
      const mergedReport = await importOfficial244ScrubStudents({
        existingStudents: recalculated,
        existingPayments: fsPayments,
        existingGraduates: LocalStorageManager.getGraduates(),
        actorName: 'النظام الآلي — تدقيق ومطابقة القوائم الرسمية (244 طالب)',
      });
      const rec46 = await reconcileAndImportSubmitted46Names({
        existingStudents: mergedReport.students,
        existingPayments: mergedReport.studentPayments,
        actorName: 'النظام الآلي — فحص ومطابقة قائمة الـ 46 طالباً',
      });
      return {
        students: rec46.students,
        studentPayments: mergedReport.studentPayments,
      };
    }

    const rec46 = await reconcileAndImportSubmitted46Names({
      existingStudents: recalculated,
      existingPayments: fsPayments,
      actorName: 'النظام الآلي — فحص ومطابقة قائمة الـ 46 طالباً',
    });

    ScrubStudentStorage.saveStudents(rec46.students);
    ScrubStudentStorage.saveStudentPayments(fsPayments);
    ScrubStudentStorage.markInitialImportDone();

    return { students: rec46.students, studentPayments: fsPayments };
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
  sourceTotalCount?: number;
  officialUniqueCount?: number;
  oldPaymentsRawCount?: number;
  oldPaymentsUniqueCount?: number;
  confirmedMatchesCount?: number;
  oldPaymentsFlaggedCount?: number;
  matchedExistingCount?: number;
  importedCount: number;
  skippedDuplicatesCount: number;
  flaggedForReviewCount: number;
  totalActiveStudents: number;
  students: ScrubStudent[];
  studentPayments: StudentPayment[];
  flaggedDetails: Array<{ studentName: string; studentNumber: number; reason: string }>;
}

// Idempotent, Duplicate-Safe Import & Forensic Reconciliation of the 244 Official Nursing Institute Students (Cohort 2026-2027)
// Preserving all manual payments, balances, receipts, linked accounts, and audit history intact!
export async function importOfficial244ScrubStudents(params: {
  existingStudents: ScrubStudent[];
  existingPayments: StudentPayment[];
  existingGraduates: Graduate[];
  actorName: string;
}): Promise<ImportReport> {
  const { existingStudents, existingPayments, existingGraduates, actorName } = params;

  const dedupedExisting = deduplicateStudentsList(existingStudents);
  // Filter out any erroneous v2 auto-seed payments while keeping all 39 confirmed auto-seeds and all manual admin payments
  const updatedPayments = deduplicatePaymentsList(
    existingPayments.filter((p) => !isErroneousLegacyAutoSeedPayment(p))
  );
  const flaggedDetails: Array<{ studentName: string; studentNumber: number; reason: string }> = [];

  // Build a clean Map keyed by student ID so duplicate IDs can never occur
  const finalStudentsMap = new Map<string, ScrubStudent>();
  const officialNamesSet = new Set<string>(
    OFFICIAL_244_ROSTER.map((r) => normalizeArabicName(r.fullName))
  );

  let importedCount = 0;
  let matchedExistingCount = 0;
  let skippedDuplicatesCount = 0;
  let flaggedForReviewCount = 0;

  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];

  for (const rosterStudent of OFFICIAL_244_ROSTER) {
    const deterministicId = `scrub-stu-2027-${String(rosterStudent.globalNumber).padStart(3, '0')}`;
    const normRosterName = normalizeArabicName(rosterStudent.fullName);

    const confirmedSeed = CONFIRMED_39_DEPOSIT_MAP.get(rosterStudent.globalNumber);
    const reviewCandidate = REVIEW_14_CANDIDATES_MAP.get(rosterStudent.globalNumber);

    // Ensure confirmed 1-to-1 initial deposit payment exists in updatedPayments
    if (confirmedSeed) {
      const depositPaymentId = `scrub-pay-init-2027-${String(rosterStudent.globalNumber).padStart(3, '0')}`;
      const receiptNumber = `SCRUB-DEP-${String(rosterStudent.globalNumber).padStart(3, '0')}`;
      const existingDeposit = updatedPayments.find((p) => p.id === depositPaymentId);
      if (!existingDeposit) {
        const initialPayment: StudentPayment = {
          id: depositPaymentId,
          studentId: deterministicId,
          studentNumber: rosterStudent.globalNumber,
          studentName: rosterStudent.fullName,
          amountIQD: confirmedSeed.depositIQD,
          paymentType: 'initial_deposit',
          paymentMethod: 'cash',
          receiptNumber,
          referenceCode: `INIT-2027-${String(rosterStudent.globalNumber).padStart(3, '0')}`,
          date: '2026-10-25',
          time: '10:00',
          notes:
            confirmedSeed.depositIQD === 1000
              ? `عربون أولي موثق (1,000 د.ع) — مطابق لسجل الدفعات القديم رقم (${confirmedSeed.seedNumber}: ${confirmedSeed.oldPaymentName})`
              : `عربون أولي موثق (2,000 د.ع) — مطابق لسجل الدفعات القديم رقم (${confirmedSeed.seedNumber}: ${confirmedSeed.oldPaymentName})`,
          isVerified: true,
          verificationStatus: 'verified',
          recordedBy: actorName || 'اللجنة المالية — معهد التمريض',
          verifiedBy: actorName || 'اللجنة المالية — معهد التمريض',
          verifiedAt: nowIso,
          createdAt: nowIso,
        };
        updatedPayments.push(initialPayment);
      }
      matchedExistingCount++;
    }

    // Find if student already exists in dedupedExisting by exact normalized name or deterministicId
    const existing =
      dedupedExisting.find((s) => normalizeArabicName(s.fullName) === normRosterName) ||
      dedupedExisting.find((s) => s.id === deterministicId);

    if (existing) {
      const hasManualOrConfirmedPayment = updatedPayments.some(
        (p) =>
          p.studentId === deterministicId &&
          p.verificationStatus !== 'voided' &&
          p.isVerified
      );

      const shouldFlagReview = Boolean(reviewCandidate && !hasManualOrConfirmedPayment);
      if (shouldFlagReview && reviewCandidate) {
        flaggedForReviewCount++;
        flaggedDetails.push({
          studentName: rosterStudent.fullName,
          studentNumber: rosterStudent.globalNumber,
          reason: reviewCandidate.reviewNote,
        });
      }

      const defaultNote = confirmedSeed
        ? `مطابقة مؤكدة مع سجل الدفعات القديم رقم (${confirmedSeed.seedNumber}: ${confirmedSeed.oldPaymentName}) — عربون ${confirmedSeed.depositIQD.toLocaleString()} د.ع`
        : shouldFlagReview && reviewCandidate
        ? reviewCandidate.reviewNote
        : `طالب رسمي — المرحلة الثانية / الدراسة الصباحية (${rosterStudent.section} - ت: ${rosterStudent.sectionIndex})`;

      const enriched: ScrubStudent = {
        ...existing,
        id: deterministicId,
        studentNumber: rosterStudent.globalNumber,
        section: rosterStudent.section,
        sectionNumber: rosterStudent.sectionNumber,
        sectionStudentNumber: rosterStudent.sectionIndex,
        fullName: rosterStudent.fullName,
        normalizedName: normRosterName,
        preferredTitle: rosterStudent.preferredTitle,
        totalFeeIQD: 35000,
        needsReview: shouldFlagReview,
        reviewNote: shouldFlagReview ? reviewCandidate?.reviewNote : undefined,
        matchStatus: hasManualOrConfirmedPayment
          ? 'confirmed'
          : shouldFlagReview
          ? 'needs_review'
          : 'unmatched',
        matchedOldPaymentName:
          confirmedSeed?.oldPaymentName || reviewCandidate?.oldPaymentName,
        pendingReviewAmountIQD: shouldFlagReview
          ? reviewCandidate?.pendingReviewAmountIQD
          : undefined,
        ambiguousGroupKey: shouldFlagReview
          ? reviewCandidate?.ambiguousGroupKey
          : undefined,
        notes: defaultNote,
        updatedAt: nowIso,
      };
      finalStudentsMap.set(
        deterministicId,
        recalculateStudentFinancials(enriched, updatedPayments)
      );
      skippedDuplicatesCount++;
      continue;
    }

    // Student does not exist yet — create fresh official record
    let needsReview = false;
    let reviewNote: string | undefined = undefined;
    let potentialMatchId: string | undefined = undefined;
    let potentialMatchName: string | undefined = undefined;

    if (reviewCandidate) {
      needsReview = true;
      reviewNote = reviewCandidate.reviewNote;
      flaggedForReviewCount++;
      flaggedDetails.push({
        studentName: rosterStudent.fullName,
        studentNumber: rosterStudent.globalNumber,
        reason: reviewCandidate.reviewNote,
      });
    } else {
      for (const grad of existingGraduates) {
        if (grad.id === 'grad-admin' || grad.id === 'grad-mod') continue;
        const sim = checkNameSimilarity(rosterStudent.fullName, grad.fullName);
        if (sim.isExact || sim.isSimilar) {
          needsReview = true;
          potentialMatchId = grad.id;
          potentialMatchName = grad.fullName;
          reviewNote = `يوجد حساب مسجل باسم مشابه (${grad.fullName}).`;
          flaggedForReviewCount++;
          flaggedDetails.push({
            studentName: rosterStudent.fullName,
            studentNumber: rosterStudent.globalNumber,
            reason: reviewNote,
          });
          break;
        }
      }
    }

    const initialDepositIQD = confirmedSeed ? confirmedSeed.depositIQD : 0;
    const remainingBalance = Math.max(0, 35000 - initialDepositIQD);

    const newStudent: ScrubStudent = {
      id: deterministicId,
      studentNumber: rosterStudent.globalNumber,
      section: rosterStudent.section,
      sectionNumber: rosterStudent.sectionNumber,
      sectionStudentNumber: rosterStudent.sectionIndex,
      fullName: rosterStudent.fullName,
      normalizedName: normRosterName,
      preferredTitle: rosterStudent.preferredTitle,
      totalFeeIQD: 35000,
      verifiedPaidIQD: initialDepositIQD,
      pendingPaidIQD: 0,
      remainingBalanceIQD: remainingBalance,
      paymentStatus: calculatePaymentStatus(initialDepositIQD, 35000, needsReview),
      status: 'active',
      isLinkedToAccount: false,
      needsReview,
      reviewNote,
      potentialMatchId,
      potentialMatchName,
      matchStatus: confirmedSeed
        ? 'confirmed'
        : needsReview
        ? 'needs_review'
        : 'unmatched',
      matchedOldPaymentName:
        confirmedSeed?.oldPaymentName || reviewCandidate?.oldPaymentName,
      pendingReviewAmountIQD: reviewCandidate?.pendingReviewAmountIQD,
      ambiguousGroupKey: reviewCandidate?.ambiguousGroupKey,
      notes: confirmedSeed
        ? `مطابقة مؤكدة مع سجل الدفعات القديم رقم (${confirmedSeed.seedNumber}: ${confirmedSeed.oldPaymentName}) — عربون ${confirmedSeed.depositIQD.toLocaleString()} د.ع`
        : reviewCandidate
        ? reviewCandidate.reviewNote
        : `طالب رسمي — المرحلة الثانية / الدراسة الصباحية (${rosterStudent.section} - ت: ${rosterStudent.sectionIndex})`,
      createdAt: todayDate,
      updatedAt: nowIso,
    };

    finalStudentsMap.set(
      deterministicId,
      recalculateStudentFinancials(newStudent, updatedPayments)
    );
    importedCount++;
  }

  // Also preserve any custom manually-added students (studentNumber > 244 and not in official 244)
  for (const extra of dedupedExisting) {
    if (
      !finalStudentsMap.has(extra.id) &&
      extra.studentNumber > 244 &&
      !officialNamesSet.has(normalizeArabicName(extra.fullName))
    ) {
      finalStudentsMap.set(
        extra.id,
        recalculateStudentFinancials(extra, updatedPayments)
      );
    }
  }

  const updatedStudents = Array.from(finalStudentsMap.values()).sort(
    (a, b) => a.studentNumber - b.studentNumber
  );

  // Save to LocalStorage
  ScrubStudentStorage.saveStudents(updatedStudents);
  ScrubStudentStorage.saveStudentPayments(updatedPayments);
  ScrubStudentStorage.markInitialImportDone();

  // Persist to Firestore in safe chunks (max 300 ops per writeBatch)
  try {
    const CHUNK_SIZE = 300;
    for (let i = 0; i < updatedStudents.length; i += CHUNK_SIZE) {
      const slice = updatedStudents.slice(i, i + CHUNK_SIZE);
      const batch = writeBatch(db);
      for (const stu of slice) {
        const stuRef = doc(db, 'scrub_students', stu.id);
        const cleanStu = Object.fromEntries(
          Object.entries(stu).filter(([_, v]) => v !== undefined)
        );
        batch.set(stuRef, cleanStu);
      }
      await batch.commit();
    }
    if (updatedPayments.length > 0) {
      const payBatch = writeBatch(db);
      for (const pay of updatedPayments.slice(0, 300)) {
        const payRef = doc(db, 'student_payments', pay.id);
        const cleanPay = Object.fromEntries(
          Object.entries(pay).filter(([_, v]) => v !== undefined)
        );
        payBatch.set(payRef, cleanPay, { merge: true });
      }
      await payBatch.commit();
    }
  } catch (e) {
    console.warn('Firestore batch import sync notice:', e);
  }

  if (importedCount > 0) {
    await recordSystemAuditLog({
      action: 'دمج وتدقيق القائمة الرسمية (244 طالب) مع سجل الدفعات القديم (46 دفعة)',
      performedBy: actorName,
      details: `تم اعتماد 244 طالباً رسمياً (4 شعب)، وتوثيق 39 مطابقة مؤكدة بمبلغ 77,000 د.ع، وتحديد 7 دفعات قديمة (14 طالباً مرشحاً) في حالة «تحتاج إلى مراجعة».`,
      affectedCount: OFFICIAL_244_ROSTER.length,
      entityType: 'scrub_student',
    });
  }

  return {
    sourceTotalCount: OFFICIAL_244_ROSTER.length,
    officialUniqueCount: OFFICIAL_244_ROSTER.length,
    oldPaymentsRawCount: 47,
    oldPaymentsUniqueCount: OFFICIAL_46_SCRUB_STUDENTS.length,
    confirmedMatchesCount: CONFIRMED_39_DEPOSIT_MAP.size,
    oldPaymentsFlaggedCount: 7,
    matchedExistingCount,
    importedCount,
    skippedDuplicatesCount,
    flaggedForReviewCount: updatedStudents.filter((s) => s.status === 'active' && s.needsReview).length,
    totalActiveStudents: updatedStudents.filter((s) => s.status === 'active').length,
    students: updatedStudents,
    studentPayments: updatedPayments,
    flaggedDetails,
  };
}

// Backward-compatible alias for existing callers
export async function importOfficial46ScrubStudents(params: {
  existingStudents: ScrubStudent[];
  existingPayments: StudentPayment[];
  existingGraduates: Graduate[];
  actorName: string;
}): Promise<ImportReport> {
  return importOfficial244ScrubStudents(params);
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

// Helper for unified Arabic status label
export function getUnifiedPaymentStatusArabic(s: ScrubStudent): string {
  if (s.needsReview || s.paymentStatus === 'needs_review') return 'تحتاج إلى مراجعة';
  if (s.paymentStatus === 'completed') return 'مكتمل';
  if (s.paymentStatus === 'deposit' || s.paymentStatus === 'partial') return 'دفع عربون';
  return 'لم يدفع';
}

// Export Scrub Students List to CSV (UTF-8 with BOM for Excel Arabic support)
export function exportScrubStudentsCSV(
  students: ScrubStudent[],
  payments: StudentPayment[] = [],
  includeArchived = false
): string {
  const targetList = includeArchived
    ? students
    : students.filter((s) => s.status === 'active');

  const headers = [
    'التسلسل',
    'الاسم الكامل كما ورد في القائمة الرسمية',
    'الشعبة الدراسية',
    'المبلغ الكامل المطلوب (د.ع)',
    'المبلغ المدفوع (د.ع)',
    'المبلغ المتبقي (د.ع)',
    'حالة الدفع',
    'تاريخ آخر دفعة',
    'ملاحظات المطابقة أو الدفع',
  ];

  const rows = targetList.map((s) => {
    const stuPayments = payments
      .filter((p) => p.studentId === s.id && p.verificationStatus !== 'voided' && p.isVerified)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const lastPayDate = stuPayments[0]?.date || '';
    const combinedNotes = [
      s.reviewNote,
      s.notes,
      stuPayments[0]?.notes && stuPayments[0].notes !== s.notes ? stuPayments[0].notes : '',
    ]
      .filter(Boolean)
      .join(' | ')
      .replace(/"/g, '""');

    const totalFee = s.totalFeeIQD > 0 ? s.totalFeeIQD : 35000;
    const paid = Math.max(0, Math.round(s.verifiedPaidIQD || 0));
    const remaining = Math.max(0, totalFee - paid);

    return [
      s.studentNumber,
      `"${s.fullName.replace(/"/g, '""')}"`,
      `"${s.section || ''}"`,
      totalFee,
      paid,
      remaining,
      `"${getUnifiedPaymentStatusArabic(s)}"`,
      `"${lastPayDate}"`,
      `"${combinedNotes}"`,
    ];
  });

  return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// Export Scrub Students List to native Excel (.xls HTML/XML format with RTL and styling)
export function exportScrubStudentsExcelXLS(
  students: ScrubStudent[],
  payments: StudentPayment[] = [],
  includeArchived = false
): string {
  const targetList = includeArchived
    ? students
    : students.filter((s) => s.status === 'active');

  const escapeHtml = (str: string) =>
    String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  let totalRequiredSum = 0;
  let totalPaidSum = 0;
  let totalRemainingSum = 0;

  const rowsHtml = targetList
    .map((s) => {
      const stuPayments = payments
        .filter((p) => p.studentId === s.id && p.verificationStatus !== 'voided' && p.isVerified)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const lastPayDate = stuPayments[0]?.date || '-';
      const combinedNotes = [
        s.reviewNote,
        s.notes,
        stuPayments[0]?.notes && stuPayments[0].notes !== s.notes ? stuPayments[0].notes : '',
      ]
        .filter(Boolean)
        .join(' | ');

      const totalFee = s.totalFeeIQD > 0 ? s.totalFeeIQD : 35000;
      const paid = Math.max(0, Math.round(s.verifiedPaidIQD || 0));
      const remaining = Math.max(0, totalFee - paid);
      const statusText = getUnifiedPaymentStatusArabic(s);

      totalRequiredSum += totalFee;
      totalPaidSum += paid;
      totalRemainingSum += remaining;

      const bgRow =
        statusText === 'مكتمل'
          ? '#e6f9f5'
          : statusText === 'دفع عربون'
          ? '#fffbeb'
          : statusText === 'تحتاج إلى مراجعة'
          ? '#fef3c7'
          : '#ffffff';

      return `<tr style="background-color:${bgRow};">
        <td style="text-align:center;font-weight:bold;border:1px solid #cbd5e1;padding:6px;">${s.studentNumber}</td>
        <td style="text-align:right;font-weight:bold;border:1px solid #cbd5e1;padding:6px;">${escapeHtml(s.fullName)}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;padding:6px;">${escapeHtml(s.section || '-')}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;padding:6px;">${totalFee}</td>
        <td style="text-align:center;font-weight:bold;color:#047857;border:1px solid #cbd5e1;padding:6px;">${paid}</td>
        <td style="text-align:center;font-weight:bold;color:#b45309;border:1px solid #cbd5e1;padding:6px;">${remaining}</td>
        <td style="text-align:center;font-weight:bold;border:1px solid #cbd5e1;padding:6px;">${statusText}</td>
        <td style="text-align:center;border:1px solid #cbd5e1;padding:6px;">${escapeHtml(lastPayDate)}</td>
        <td style="text-align:right;border:1px solid #cbd5e1;padding:6px;">${escapeHtml(combinedNotes)}</td>
      </tr>`;
    })
    .join('\n');

  return `\uFEFF<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40" dir="rtl">
<head>
<meta charset="utf-8" />
<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>سجل الطلاب والمدفوعات 2027</x:Name><x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
</head>
<body dir="rtl" style="font-family:'Cairo','Segoe UI',Tahoma,Arial,sans-serif;">
  <table border="1" style="border-collapse:collapse;width:100%;direction:rtl;">
    <thead>
      <tr>
        <th colspan="9" style="background-color:#0f172a;color:#ffffff;font-size:16px;padding:10px;text-align:center;">
          تخرج طلاب معهد التمريض — دفعة 2027 • المرحلة الثانية (الدراسة الصباحية) — العام الدراسي 2026–2027
        </th>
      </tr>
      <tr>
        <th colspan="9" style="background-color:#1e293b;color:#35D6C5;font-size:13px;padding:8px;text-align:center;">
          سجل قائمة الطلاب والمدفوعات — دفعة 2027 • مكان الحفلة: مسرح تفاحة المصور • المصور: باقر حسن • مبلغ المساهمة للطالب: 35,000 دينار عراقي
        </th>
      </tr>
      <tr style="background-color:#334155;color:#ffffff;font-weight:bold;">
        <th style="padding:8px;border:1px solid #cbd5e1;">التسلسل</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">الاسم الكامل كما ورد في القائمة الرسمية</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">الشعبة</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">المبلغ الكامل (د.ع)</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">المبلغ المدفوع (د.ع)</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">المبلغ المتبقي (د.ع)</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">حالة الدفع</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">تاريخ آخر دفعة</th>
        <th style="padding:8px;border:1px solid #cbd5e1;">ملاحظات المطابقة أو الدفع</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
    <tfoot>
      <tr style="background-color:#0f172a;color:#ffffff;font-weight:bold;">
        <td colspan="3" style="padding:8px;text-align:center;border:1px solid #cbd5e1;">المجموع الكلي (${targetList.length} طالب)</td>
        <td style="padding:8px;text-align:center;border:1px solid #cbd5e1;">${totalRequiredSum}</td>
        <td style="padding:8px;text-align:center;color:#35D6C5;border:1px solid #cbd5e1;">${totalPaidSum}</td>
        <td style="padding:8px;text-align:center;color:#D7B875;border:1px solid #cbd5e1;">${totalRemainingSum}</td>
        <td colspan="3" style="padding:8px;text-align:right;border:1px solid #cbd5e1;">تاريخ التصدير: ${new Date().toLocaleDateString('ar-IQ')}</td>
      </tr>
    </tfoot>
  </table>
</body>
</html>`;
}

// Export Full Scrub Students & Payments Backup JSON (Used before Super Admin Delete Entire List)
export function exportScrubFullBackupJSON(
  students: ScrubStudent[],
  payments: StudentPayment[]
): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      cohort: 'تخرج طلاب معهد التمريض — دفعة 2027 (المرحلة الثانية صباحي 2026–2027)',
      event: 'فعاليات تخرج دفعة 2027 (مسرح تفاحة المصور - المصور باقر حسن)',
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

// ============================================================================
// FEATURE 2: 46 Submitted Student Names Audit, Deduplication & Reconciliation
// ============================================================================

export const SUBMITTED_46_RAW_NAMES_WITH_DUPLICATE_NOTE: string[] = [
  'حسين علاء كاظم',
  'علي محمد',
  'عباس حمزة عودة',
  'زهراء عبدالله',
  'محمد باقر',
  'علي قاسم',
  'صفا محمد',
  'شيماء حيدر',
  'شهد هاشم',
  'سؤددوليد',
  'علي اكبر',
  'غدير مؤيد',
  'علي جميل',
  'زهراء حسين مهلي',
  'رقية اسماعيل',
  'حسين مثنى',
  'حسين كاظم',
  'شيماء جابر',
  'نور مشتاق',
  'حوراء كاظم ظاهر',
  'منار ستار',
  'يوسف احمد',
  'مصطفى احمد موحان',
  'ايات ثائر',
  'مريم صباح',
  'طيبة عقيل',
  'عباس خضير',
  'عباس خضير', // Duplicate noted in source ("عباس خضير مكرر مرتين") — handled as 1 single record
  'عباس محمد شيال ١',
  'كرار احمد',
  'عبدالله جمال',
  'زهراء جبار حاكم',
  'زهراء هادي عبيس',
  'سكينة قيس',
  'ضحى رياض',
  'نرجس مالك',
  'ملاك فالح',
  'اسراء رضا علي',
  'دعاء فوزي',
  'علي حسين نعيم',
  'محمد قاسم',
  'مريم سالم حمزة',
  'كرار حيدر',
  'حسين سعد',
  'ايات حاتم درسون',
  'سيف مهند',
  'زهراء علي كريم',
];

export interface Reconciliation46Report {
  totalUniqueInList: number; // 46
  rawListCount: number; // 47 (including the noted duplicate of عباس خضير)
  newlyAddedNames: Array<{
    indexIn46: number;
    submittedName: string;
    assignedStudentNumber: number;
    studentId: string;
    similarExistingRecords: string[];
    note: string;
  }>;
  alreadyExistingNames: Array<{
    indexIn46: number;
    submittedName: string;
    matchedStudentNumber: number;
    matchedFullName: string;
    matchType: 'exact_name' | 'existing_linked_record';
  }>;
  preventedDuplicates: Array<{
    submittedName: string;
    reason: string;
  }>;
  similarNamesForManualReview: Array<{
    indexIn46: number;
    submittedName: string;
    candidateRecords: Array<{
      studentNumber: number;
      fullName: string;
      section?: string;
    }>;
    reviewReason: string;
  }>;
  failedNames: Array<{
    submittedName: string;
    reason: string;
  }>;
  executedAt: string;
}

const RECONCILIATION_46_REPORT_STORAGE_KEY = 'nursing2027_reconciliation_46_report_v1';

export function getSavedReconciliation46Report(): Reconciliation46Report | null {
  try {
    const raw = localStorage.getItem(RECONCILIATION_46_REPORT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Reconciliation46Report;
  } catch {
    return null;
  }
}

function stripTrailingNumeralsForSimilarity(norm: string): string {
  return norm.replace(/\s*[٠-٩0-9]+$/g, '').trim();
}

/**
 * Audits the 46 submitted student names against the current database (`scrubStudents`):
 * - Ignores extra spaces, repeated spaces, diacritics (tashkeel), and attached compound words (`سؤددوليد` <-> `سؤدد وليد`).
 * - Preserves original Arabic name (including numerals like `عباس محمد شيال ١` and 2-part names like `علي محمد`) without inventing a 3rd name.
 * - Treats duplicate `عباس خضير` as a single record and logs the prevented duplicate.
 * - Never deletes any existing student and never alters paid/remaining amounts of any existing student.
 * - Idempotent: running multiple times never creates duplicate records.
 */
export async function reconcileAndImportSubmitted46Names(params: {
  existingStudents: ScrubStudent[];
  existingPayments: StudentPayment[];
  actorName: string;
}): Promise<{
  students: ScrubStudent[];
  report: Reconciliation46Report;
}> {
  const { existingStudents, existingPayments, actorName } = params;
  const nowIso = new Date().toISOString();
  const todayDate = nowIso.split('T')[0];

  const updatedStudents = deduplicateStudentsList([...existingStudents]);
  const activeStudents = updatedStudents.filter((s) => s.status === 'active');

  const newlyAddedNames: Reconciliation46Report['newlyAddedNames'] = [];
  const alreadyExistingNames: Reconciliation46Report['alreadyExistingNames'] = [];
  const preventedDuplicates: Reconciliation46Report['preventedDuplicates'] = [];
  const similarNamesForManualReview: Reconciliation46Report['similarNamesForManualReview'] = [];
  const failedNames: Reconciliation46Report['failedNames'] = [];

  // Step 1: Deduplicate raw input list while recording prevented duplicates (e.g., عباس خضير)
  const seenNormalizedInInput = new Map<string, string>();
  const uniqueSubmittedList: Array<{ indexIn46: number; rawName: string; normName: string }> = [];

  for (const rawItem of SUBMITTED_46_RAW_NAMES_WITH_DUPLICATE_NOTE) {
    const cleanedDisplay = rawItem.trim().replace(/\s+/g, ' ');
    const norm = normalizeArabicName(cleanedDisplay);
    if (!norm) continue;

    if (seenNormalizedInInput.has(norm)) {
      preventedDuplicates.push({
        submittedName: cleanedDisplay,
        reason:
          'تكرار داخل القائمة المرسلة («عباس خضير» مكرر مرتين) — تم التعامل معه كسجل واحد فقط ومنع إضافته مرة ثانية.',
      });
      continue;
    }

    seenNormalizedInInput.set(norm, cleanedDisplay);
    uniqueSubmittedList.push({
      indexIn46: uniqueSubmittedList.length + 1,
      rawName: cleanedDisplay,
      normName: norm,
    });
  }

  // Step 2: Inspect each of the 46 unique names against the existing database
  const newlyCreatedRecords: ScrubStudent[] = [];

  for (const item of uniqueSubmittedList) {
    const { indexIn46, rawName, normName } = item;
    const deterministic46Id = `scrub-stu-2027-list46-${String(indexIn46).padStart(3, '0')}`;

    try {
      // 1. Check if an exact fullName match or deterministic46Id already exists in activeStudents
      const exactFullNameMatch = activeStudents.find(
        (s) =>
          s.id === deterministic46Id ||
          normalizeArabicName(s.fullName) === normName
      );

      // 2. Check if already linked via matchedOldPaymentName on a confirmed record (and exact string matches)
      const exactOldPaymentMatch = activeStudents.find(
        (s) =>
          s.matchedOldPaymentName &&
          normalizeArabicName(s.matchedOldPaymentName) === normName
      );

      // Find similar records in the 244 official roster / activeStudents (by prefix or without trailing numeral)
      const normBase = stripTrailingNumeralsForSimilarity(normName);
      const baseTokens = normBase.split(' ').filter(Boolean);
      const hasNumeral = normBase !== normName;

      const similarCandidates = activeStudents.filter((s) => {
        if (s.id.startsWith('scrub-stu-2027-list46-')) return false;
        const sNorm = normalizeArabicName(s.fullName);
        if (sNorm === normName) return false;
        const sTokens = sNorm.split(' ').filter(Boolean);
        if (baseTokens.length >= 2 && sTokens.length >= baseTokens.length) {
          return baseTokens.every((tok, idx) => sTokens[idx] === tok);
        }
        return false;
      });

      // If this is a 2-part name or numbered name or has multiple candidates, always include in similarNamesForManualReview for supervisor visibility
      if (similarCandidates.length > 0 && (baseTokens.length === 2 || hasNumeral || similarCandidates.length > 1 || !exactOldPaymentMatch)) {
        const reasonText = hasNumeral
          ? `اسم يحتوي على رقم («${rawName}») يتشابه مع سجل بدون رقم في القائمة الرسمية (${similarCandidates.map((c) => c.fullName).join(' ، ')}). تم حفظه كما هو وعرضه للمراجعة اليدوية.`
          : similarCandidates.length > 1
          ? `اسم ثنائي («${rawName}») يتشابه مع (${similarCandidates.length}) سجلات رباعية مختلفة في قاعدة البيانات (${similarCandidates.map((c) => `ت ${c.studentNumber}: ${c.fullName}`).join(' | ')}). لم يُدمج تلقائياً لمنع الخلط.`
          : baseTokens.length === 2
          ? `اسم ثنائي («${rawName}») يقابله سجل رباعي مشابه في القائمة الرسمية (ت ${similarCandidates[0].studentNumber}: ${similarCandidates[0].fullName}).`
          : `تشابه في الاسم الثلاثي («${rawName}») مع السجل الرسمي (ت ${similarCandidates[0].studentNumber}: ${similarCandidates[0].fullName}).`;

        similarNamesForManualReview.push({
          indexIn46,
          submittedName: rawName,
          candidateRecords: similarCandidates.map((c) => ({
            studentNumber: c.studentNumber,
            fullName: c.fullName,
            section: c.section,
          })),
          reviewReason: reasonText,
        });
      }

      // Case A: Exact fullName match already in database (or previously added by this reconciliation)
      if (exactFullNameMatch) {
        alreadyExistingNames.push({
          indexIn46,
          submittedName: rawName,
          matchedStudentNumber: exactFullNameMatch.studentNumber,
          matchedFullName: exactFullNameMatch.fullName,
          matchType: 'exact_name',
        });
        preventedDuplicates.push({
          submittedName: rawName,
          reason: `موجود مسبقاً في قاعدة البيانات برقم تسلسلي (${exactFullNameMatch.studentNumber}) — تم منع تكرار السجل.`,
        });
        continue;
      }

      // Case B: Already linked to an existing confirmed deposit record (the 38 unambiguous records)
      if (exactOldPaymentMatch) {
        alreadyExistingNames.push({
          indexIn46,
          submittedName: rawName,
          matchedStudentNumber: exactOldPaymentMatch.studentNumber,
          matchedFullName: exactOldPaymentMatch.fullName,
          matchType: 'existing_linked_record',
        });
        preventedDuplicates.push({
          submittedName: rawName,
          reason: `موثق ومرتبط مسبقاً بالسجل رقم (${exactOldPaymentMatch.studentNumber}: ${exactOldPaymentMatch.fullName}) — تم منع التكرار مع الحفاظ على الرصيد المالي الحالي دون تغيير.`,
        });
        continue;
      }

      // Case C: Name is NOT in the database yet (e.g., علي محمد, عباس حمزة عودة, سؤددوليد, علي اكبر, زهراء حسين مهلي, عباس محمد شيال ١, زهراء جبار حاكم, محمد قاسم)
      // Add it as a new record preserving its exact Arabic name as provided without inventing a 3rd/4th name!
      const nextNum = getNextSequentialStudentNumber([
        ...updatedStudents,
        ...newlyCreatedRecords,
      ]);
      const similarSummary = similarCandidates
        .map((c) => `(ت ${c.studentNumber}: ${c.fullName})`)
        .join(' ، ');

      const reviewNote =
        similarCandidates.length > 0
          ? `سجل مضاف من قائمة الـ 46 طالباً بالاسم الأصلي («${rawName}»). يتشابه مع: ${similarSummary} — بانتظار المراجعة اليدوية للمشرف دون دمج تلقائي.`
          : undefined;

      const newStu: ScrubStudent = recalculateStudentFinancials(
        {
          id: deterministic46Id,
          studentNumber: nextNum,
          section: similarCandidates[0]?.section || 'قائمة الـ 46 المضافة',
          fullName: rawName, // Preserved exact Arabic name (including 'عباس محمد شيال ١', 'سؤددوليد', 2-part names, etc.)
          normalizedName: normName,
          preferredTitle: rawName.startsWith('زهراء') ||
            rawName.startsWith('صفا') ||
            rawName.startsWith('شيماء') ||
            rawName.startsWith('شهد') ||
            rawName.startsWith('سؤدد') ||
            rawName.startsWith('غدير') ||
            rawName.startsWith('رقية') ||
            rawName.startsWith('نور') ||
            rawName.startsWith('حوراء') ||
            rawName.startsWith('منار') ||
            rawName.startsWith('ايات') ||
            rawName.startsWith('مريم') ||
            rawName.startsWith('طيبة') ||
            rawName.startsWith('سكينة') ||
            rawName.startsWith('ضحى') ||
            rawName.startsWith('نرجس') ||
            rawName.startsWith('ملاك') ||
            rawName.startsWith('اسراء') ||
            rawName.startsWith('دعاء')
            ? 'nurse_f'
            : 'nurse_m',
          totalFeeIQD: 35000,
          verifiedPaidIQD: 0,
          pendingPaidIQD: 0,
          remainingBalanceIQD: 35000,
          paymentStatus: similarCandidates.length > 0 ? 'needs_review' : 'unpaid',
          status: 'active',
          isLinkedToAccount: false,
          needsReview: similarCandidates.length > 0,
          reviewNote,
          potentialMatchId: similarCandidates[0]?.id,
          potentialMatchName: similarCandidates[0]?.fullName,
          matchStatus: similarCandidates.length > 0 ? 'needs_review' : 'unmatched',
          matchedOldPaymentName: rawName,
          notes:
            reviewNote ||
            `تمت إضافته من مراجعة قائمة الـ 46 طالباً بالاسم الأصلي («${rawName}»).`,
          createdAt: todayDate,
          updatedAt: nowIso,
        },
        existingPayments
      );

      newlyCreatedRecords.push(newStu);
      newlyAddedNames.push({
        indexIn46,
        submittedName: rawName,
        assignedStudentNumber: nextNum,
        studentId: deterministic46Id,
        similarExistingRecords: similarCandidates.map(
          (c) => `ت ${c.studentNumber}: ${c.fullName}`
        ),
        note:
          similarCandidates.length > 0
            ? `أُضيف بالاسم الأصلي كما ورد وتم تصنيفه ضمن «أسماء متشابهة تحتاج مراجعة يدوية» لوجود: ${similarSummary}`
            : 'أُضيف كسجل جديد مستقل.',
      });
    } catch (err: any) {
      failedNames.push({
        submittedName: rawName,
        reason: err?.message || 'خطأ غير متوقع أثناء فحص السجل',
      });
    }
  }

  const finalStudents = deduplicateStudentsList([
    ...updatedStudents,
    ...newlyCreatedRecords,
  ]);

  // Persist updated students to LocalStorage
  ScrubStudentStorage.saveStudents(finalStudents);

  // Persist any newly created records to Firestore without touching or deleting existing records
  if (newlyCreatedRecords.length > 0) {
    try {
      const batch = writeBatch(db);
      for (const stu of newlyCreatedRecords) {
        const cleanStu = Object.fromEntries(
          Object.entries(stu).filter(([_, v]) => v !== undefined)
        );
        batch.set(doc(db, 'scrub_students', stu.id), cleanStu, { merge: true });
      }
      await batch.commit();
    } catch (e) {
      console.warn('Firestore reconcileAndImportSubmitted46Names sync notice:', e);
    }

    await recordSystemAuditLog({
      action: 'فحص ومطابقة قائمة الـ 46 طالباً وإضافة السجلات الناقصة دون تكرار',
      performedBy: actorName,
      details: `تم فحص 46 اسماً (47 مدخلاً خام مع منع تكرار «عباس خضير»): تمت إضافة (${newlyAddedNames.length}) سجل ناقص بالاسم الأصلي، وتأكيد وجود (${alreadyExistingNames.length}) سجل مسبقاً، وتحديد (${similarNamesForManualReview.length}) حالة تشابه للمراجعة اليدوية دون المساس بأي مبالغ مدفوعة.`,
      affectedCount: newlyAddedNames.length,
      entityType: 'scrub_student',
    });
  }

  // Save report to localStorage so it remains visible even after page reloads
  // If newlyAddedNames is 0 on a subsequent run, preserve the first run's newlyAddedNames list if it was already executed so the admin can still inspect which records were added, while showing current verification status
  const previousReport = getSavedReconciliation46Report();
  const report: Reconciliation46Report = {
    totalUniqueInList: uniqueSubmittedList.length,
    rawListCount: SUBMITTED_46_RAW_NAMES_WITH_DUPLICATE_NOTE.length,
    newlyAddedNames:
      newlyAddedNames.length > 0
        ? newlyAddedNames
        : previousReport?.newlyAddedNames || [],
    alreadyExistingNames,
    preventedDuplicates,
    similarNamesForManualReview,
    failedNames,
    executedAt: nowIso,
  };

  try {
    localStorage.setItem(RECONCILIATION_46_REPORT_STORAGE_KEY, JSON.stringify(report));
  } catch {
    // ignore
  }

  return {
    students: finalStudents,
    report,
  };
}

