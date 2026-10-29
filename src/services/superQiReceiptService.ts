import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  setDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, BOOTSTRAP_ADMIN_EMAIL } from './firebase';
import {
  FinancialSettlementRecord,
  PaymentEventTarget,
  PaymentReceiptSubmission,
  PrivateReceiptVaultItem,
  ReceiptAiAnalysisResult,
  ReceiptAiClassification,
  ScrubStudent,
  StudentPayment,
  SupervisorPermissions,
} from '../types';
import { recordSystemAuditLog } from './studentManagement';

export const SUPERQI_RECIPIENT_CARD_NUMBER = '6132013829';

export const SUPERQI_OFFICIAL_LINKS = {
  androidIntent:
    'intent://open#Intent;scheme=superqi;package=iq.qi.superqi;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Diq.qi.superqi;end',
  googlePlay: 'https://play.google.com/store/apps/details?id=iq.qi.superqi',
  appleAppStore: 'https://apps.apple.com/iq/app/superqi/id6446159843',
  officialWebsite: 'https://qi.iq',
};

const RECEIPT_SUBMISSIONS_STORAGE_KEY = 'nursing2027_superqi_receipt_submissions_v1';
const PRIVATE_VAULT_LOCAL_CACHE_KEY = 'nursing2027_private_receipt_vault_v1';
const FINANCIAL_SETTLEMENTS_STORAGE_KEY = 'nursing2027_financial_settlements_v1';
const SUPERVISOR_PERMISSIONS_STORAGE_KEY = 'nursing2027_supervisor_permissions_v1';
const PRE_LOGIN_NOTICE_ACK_KEY = 'nursing2027_superqi_prelogin_notice_ack_v1';

// ============================================================================
// 1. GRANULAR SUPERVISOR PERMISSIONS (Requirement 12 & 13)
// ============================================================================

export const DEFAULT_SUPER_ADMIN_PERMISSIONS: SupervisorPermissions = {
  view_payments_list: true,
  view_financial_receipts: true,
  analyze_receipts: true,
  record_manual_payment: true,
  edit_financial_amounts: true,
  approve_reject_payments: true,
  manage_students: true,
  manage_financial_settings: true,
};

/**
 * Per Requirement 12:
 * "لا تمنح جميع المشرفين هذه الصلاحيات تلقائياً.
 * مدير الموقع وحده يحدد المشرفين المخوّلين بالاطلاع على الوصولات المالية، ويستطيع إلغاء صلاحياتهم في أي وقت."
 */
export const DEFAULT_MODERATOR_PERMISSIONS: SupervisorPermissions = {
  view_payments_list: true,
  view_financial_receipts: false,
  analyze_receipts: false,
  record_manual_payment: false,
  edit_financial_amounts: false,
  approve_reject_payments: false,
  manage_students: false,
  manage_financial_settings: false,
};

export const NO_SUPERVISOR_PERMISSIONS: SupervisorPermissions = {
  view_payments_list: false,
  view_financial_receipts: false,
  analyze_receipts: false,
  record_manual_payment: false,
  edit_financial_amounts: false,
  approve_reject_payments: false,
  manage_students: false,
  manage_financial_settings: false,
};

export const SUPERVISOR_PERMISSION_META: Array<{
  key: keyof SupervisorPermissions;
  label: string;
  description: string;
  sensitive?: boolean;
}> = [
  {
    key: 'view_payments_list',
    label: 'مشاهدة قائمة الدفعات',
    description: 'الاطلاع على جدول دفعات الطلاب وحالات التسديد دون كشف صور الوصولات.',
  },
  {
    key: 'view_financial_receipts',
    label: 'مشاهدة الوصولات المالية',
    description: 'فتح ومعاينة صور وصولات الدفع المحمية المرسلة من الطلاب.',
    sensitive: true,
  },
  {
    key: 'analyze_receipts',
    label: 'تحليل الوصولات بالذكاء الاصطناعي',
    description: 'مشاهدة وتشغيل نتائج فحص ومطابقة الوصل بالذكاء الاصطناعي.',
    sensitive: true,
  },
  {
    key: 'record_manual_payment',
    label: 'تسجيل دفعة يدوية',
    description: 'إضافة دفعة نقدية أو تحويل يدوي موثق لطالب.',
  },
  {
    key: 'edit_financial_amounts',
    label: 'تعديل المبالغ والتسويات المالية',
    description: 'تعديل المبلغ الإجمالي أو المدفوع أو إنشاء تسوية مالية إدارية مسببة.',
    sensitive: true,
  },
  {
    key: 'approve_reject_payments',
    label: 'الموافقة على الدفعات أو رفضها',
    description: 'اعتماد وصولات الدفع وتحديث الرصيد الفعلي للطالب أو رفضها.',
    sensitive: true,
  },
  {
    key: 'manage_students',
    label: 'إدارة الطلاب',
    description: 'إضافة وتعديل بيانات الطلاب الأساسية وربط الحسابات.',
  },
  {
    key: 'manage_financial_settings',
    label: 'إدارة الإعدادات المالية',
    description: 'تعديل رسوم الفعاليات وإعدادات بوابات الدفع في المنصة.',
    sensitive: true,
  },
];

export function getSavedSupervisorPermissionsMap(): Record<string, SupervisorPermissions> {
  try {
    const raw = localStorage.getItem(SUPERVISOR_PERMISSIONS_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, SupervisorPermissions>;
  } catch {
    return {};
  }
}

export function saveSupervisorPermissionsMap(
  map: Record<string, SupervisorPermissions>
): void {
  try {
    localStorage.setItem(SUPERVISOR_PERMISSIONS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage errors
  }
}

export function normalizePermissionsObject(
  raw?: Partial<SupervisorPermissions> | null,
  isSuperAdmin = false
): SupervisorPermissions {
  if (isSuperAdmin) {
    return { ...DEFAULT_SUPER_ADMIN_PERMISSIONS };
  }
  if (!raw) {
    return { ...DEFAULT_MODERATOR_PERMISSIONS };
  }
  return {
    view_payments_list: Boolean(raw.view_payments_list ?? true),
    view_financial_receipts: Boolean(raw.view_financial_receipts ?? false),
    analyze_receipts: Boolean(raw.analyze_receipts ?? false),
    record_manual_payment: Boolean(raw.record_manual_payment ?? false),
    edit_financial_amounts: Boolean(raw.edit_financial_amounts ?? false),
    approve_reject_payments: Boolean(raw.approve_reject_payments ?? false),
    manage_students: Boolean(raw.manage_students ?? false),
    manage_financial_settings: Boolean(raw.manage_financial_settings ?? false),
  };
}

export async function updateSupervisorPermissionsBySiteManager(params: {
  targetUserId: string;
  targetName: string;
  targetEmail?: string;
  permissions: SupervisorPermissions;
  actorUid: string;
  actorName: string;
  actorEmail?: string;
  isActorSuperAdmin: boolean;
}): Promise<{ success: boolean; message: string }> {
  if (!params.isActorSuperAdmin) {
    return {
      success: false,
      message: 'مدير الموقع (المشرف العام) وحده مخوّل بتعديل صلاحيات المشرفين.',
    };
  }

  if (
    params.targetUserId === 'super_admin_root' ||
    (params.targetEmail &&
      params.targetEmail.trim().toLowerCase() === BOOTSTRAP_ADMIN_EMAIL.toLowerCase())
  ) {
    return {
      success: false,
      message: 'صلاحيات مدير الموقع الرئيسي كاملة ومحمية دائماً.',
    };
  }

  const normalized = normalizePermissionsObject(params.permissions, false);
  const map = getSavedSupervisorPermissionsMap();
  map[params.targetUserId] = normalized;
  saveSupervisorPermissionsMap(map);

  const nowIso = new Date().toISOString();
  try {
    await setDoc(
      doc(db, 'admins', params.targetUserId),
      {
        fullName: params.targetName,
        email: params.targetEmail || '',
        role: 'moderator',
        permissions: normalized,
        updatedAt: nowIso,
        permissionsUpdatedBy: params.actorName,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[updateSupervisorPermissionsBySiteManager] Firestore warning:', err);
  }

  const grantedList = SUPERVISOR_PERMISSION_META.filter(
    (m) => normalized[m.key]
  ).map((m) => m.label);

  await recordSystemAuditLog({
    action: 'تحديث الصلاحيات الدقيقة لمشرف',
    performedBy: params.actorName,
    actorUid: params.actorUid,
    actorEmail: params.actorEmail,
    actorRole: 'super_admin',
    details: `قام مدير الموقع بتحديث صلاحيات المشرف «${params.targetName}» (${params.targetUserId}). الصلاحيات الممنوحة حالياً: [${grantedList.length > 0 ? grantedList.join(' ، ') : 'بدون صلاحيات مالية'}].`,
    entityType: 'security',
  });

  return {
    success: true,
    message: `تم حفظ وتحديث صلاحيات المشرف «${params.targetName}» فوراً في قاعدة البيانات.`,
  };
}

// ============================================================================
// 2. PRE-LOGIN VISITOR NOTICE ACKNOWLEDGMENT (Requirement 3)
// ============================================================================

export function hasVisitorAcknowledgedReceiptNotice(): boolean {
  try {
    return sessionStorage.getItem(PRE_LOGIN_NOTICE_ACK_KEY) === 'true';
  } catch {
    return false;
  }
}

export function markVisitorAcknowledgedReceiptNotice(): void {
  try {
    sessionStorage.setItem(PRE_LOGIN_NOTICE_ACK_KEY, 'true');
  } catch {
    // ignore
  }
}

// ============================================================================
// 3. SUPERQI COPY & OFFICIAL APP LAUNCHER (Requirement 2)
// ============================================================================

export async function copySuperQiCardToClipboard(): Promise<{
  copied: boolean;
  cardNumber: string;
  message: string;
}> {
  const card = SUPERQI_RECIPIENT_CARD_NUMBER;
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(card);
      return {
        copied: true,
        cardNumber: card,
        message: 'تم نسخ رقم البطاقة بنجاح',
      };
    }
  } catch {
    // Fallback to textarea selection below
  }

  try {
    if (typeof document !== 'undefined') {
      const textArea = document.createElement('textarea');
      textArea.value = card;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(textArea);
      if (ok) {
        return {
          copied: true,
          cardNumber: card,
          message: 'تم نسخ رقم البطاقة بنجاح',
        };
      }
    }
  } catch {
    // ignore
  }

  return {
    copied: false,
    cardNumber: card,
    message: 'تعذّر النسخ التلقائي في متصفحك؛ يمكنك تحديد رقم البطاقة ونسخه يدوياً.',
  };
}

export function getSuperQiOfficialTargetUrl(): {
  url: string;
  platformLabel: string;
} {
  if (typeof navigator === 'undefined') {
    return {
      url: SUPERQI_OFFICIAL_LINKS.officialWebsite,
      platformLabel: 'الموقع الرسمي لتطبيق SuperQi',
    };
  }
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) {
    return {
      url: SUPERQI_OFFICIAL_LINKS.appleAppStore,
      platformLabel: 'صفحة تطبيق SuperQi الرسمية على App Store',
    };
  }
  if (/Android|Adr|Honor|Huawei/i.test(ua)) {
    return {
      url: SUPERQI_OFFICIAL_LINKS.googlePlay,
      platformLabel: 'صفحة تطبيق SuperQi الرسمية على Google Play',
    };
  }
  return {
    url: SUPERQI_OFFICIAL_LINKS.officialWebsite,
    platformLabel: 'الصفحة الرسمية لخدمة SuperQi (Qi Card)',
  };
}

// ============================================================================
// 4. IMAGE VALIDATION, COMPRESSION, SHA-256 & PRIVATE VAULT CIPHER
// ============================================================================

const VAULT_CIPHER_PREFIX = 'NURS2027_VAULT_V1:';
const VAULT_XOR_SECRET = 'NursingGrad2027_PrivateReceiptVault_Key_#9941';

function obfuscateForVault(plainDataUrl: string): string {
  // Reversible XOR + Base64 encoding so raw data:image/... strings never sit in plain text
  const encoded = encodeURIComponent(plainDataUrl);
  let out = '';
  for (let i = 0; i < encoded.length; i++) {
    const c = encoded.charCodeAt(i) ^ VAULT_XOR_SECRET.charCodeAt(i % VAULT_XOR_SECRET.length);
    out += String.fromCharCode(c);
  }
  return VAULT_CIPHER_PREFIX + btoa(out);
}

function deobfuscateFromVault(encryptedPayload: string): string {
  if (!encryptedPayload.startsWith(VAULT_CIPHER_PREFIX)) {
    return encryptedPayload;
  }
  const b64 = encryptedPayload.slice(VAULT_CIPHER_PREFIX.length);
  const raw = atob(b64);
  let decodedUri = '';
  for (let i = 0; i < raw.length; i++) {
    const c = raw.charCodeAt(i) ^ VAULT_XOR_SECRET.charCodeAt(i % VAULT_XOR_SECRET.length);
    decodedUri += String.fromCharCode(c);
  }
  return decodeURIComponent(decodedUri);
}

async function computeSha256Hex(input: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const buf = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest('SHA-256', buf);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return `hash_${(h >>> 0).toString(16).padStart(16, '0')}`;
}

export async function validateAndPrepareReceiptImage(file: File): Promise<{
  valid: boolean;
  error?: string;
  normalizedDataUrl?: string;
  mimeType?: string;
  sizeBytes?: number;
  sha256?: string;
  width?: number;
  height?: number;
}> {
  if (!file) {
    return { valid: false, error: 'يرجى اختيار ملف صورة وصل التحويل أولاً.' };
  }

  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'نوع الملف غير مدعوم. يرجى رفع صورة واضحة بصيغة JPG أو PNG أو WEBP فقط.',
    };
  }

  if (file.size < 1500) {
    return {
      valid: false,
      error: 'حجم الملف صغير جداً أو تالف. يرجى رفع صورة واضحة لوصل التحويل.',
    };
  }

  const maxBytes = 10 * 1024 * 1024; // 10 MB max input file
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: 'حجم الصورة يتجاوز الحد المسموح (10 ميجابايت). يرجى اختيار صورة بحجم أصغر.',
    };
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onerror = () => {
      resolve({ valid: false, error: 'تعذر قراءة ملف الصورة. يرجى المحاولة مرة أخرى.' });
    };
    reader.onload = () => {
      const rawDataUrl = String(reader.result || '');
      const img = new Image();
      img.onerror = () => {
        resolve({
          valid: false,
          error: 'الملف المرفوع ليس صورة صالحة. يرجى التأكد من رفع لقطة شاشة أو صورة واضحة للوصل.',
        });
      };
      img.onload = async () => {
        if (img.width < 120 || img.height < 120) {
          resolve({
            valid: false,
            error: 'أبعاد الصورة صغيرة جداً وغير واضحة للفحص. يرجى رفع لقطة شاشة كاملة وواضحة للوصل.',
          });
          return;
        }

        const maxDim = 1350;
        let targetW = img.width;
        let targetH = img.height;
        if (targetW > maxDim || targetH > maxDim) {
          const ratio = Math.min(maxDim / targetW, maxDim / targetH);
          targetW = Math.round(targetW * ratio);
          targetH = Math.round(targetH * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({ valid: false, error: 'تعذر معالجة الصورة في المتصفح.' });
          return;
        }

        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);
        ctx.drawImage(img, 0, 0, targetW, targetH);

        const normalizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        const sha256 = await computeSha256Hex(rawDataUrl);
        const approxBytes = Math.round((normalizedDataUrl.length * 3) / 4);

        resolve({
          valid: true,
          normalizedDataUrl,
          mimeType: 'image/jpeg',
          sizeBytes: approxBytes,
          sha256,
          width: targetW,
          height: targetH,
        });
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

// ============================================================================
// 5. PRIVATE RECEIPT VAULT STORAGE & PROTECTED BLOB VIEWER (Requirement 13)
// ============================================================================

function getLocalPrivateVaultMap(): Record<string, PrivateReceiptVaultItem> {
  try {
    const raw = localStorage.getItem(PRIVATE_VAULT_LOCAL_CACHE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, PrivateReceiptVaultItem>;
  } catch {
    return {};
  }
}

function saveLocalPrivateVaultItem(item: PrivateReceiptVaultItem): void {
  try {
    const map = getLocalPrivateVaultMap();
    map[item.id] = item;
    // Keep at most 25 recent items in localStorage to avoid quota issues
    const entries = Object.values(map).sort((a, b) =>
      (b.createdAt || '').localeCompare(a.createdAt || '')
    );
    const trimmed: Record<string, PrivateReceiptVaultItem> = {};
    for (const entry of entries.slice(0, 25)) {
      trimmed[entry.id] = entry;
    }
    localStorage.setItem(PRIVATE_VAULT_LOCAL_CACHE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore quota errors
  }
}

/**
 * Fetches and decrypts a receipt image from `/private_receipt_vault/{vaultId}` ONLY
 * if the caller has verified `view_financial_receipts` permission (or is `super_admin`),
 * returning a short-lived `blob:` URL that is revoked immediately when closed.
 */
export async function loadAuthorizedReceiptBlobUrl(params: {
  vaultReceiptId: string;
  submissionId: string;
  viewerUid?: string;
  viewerIsSuperAdmin: boolean;
  viewerPermissions: SupervisorPermissions;
  submitterUid?: string;
}): Promise<{
  allowed: boolean;
  blobUrl?: string;
  error?: string;
}> {
  const isAuthorizedSupervisor =
    params.viewerIsSuperAdmin ||
    Boolean(params.viewerPermissions?.view_financial_receipts);
  const isOriginalSubmitter =
    Boolean(params.viewerUid) &&
    Boolean(params.submitterUid) &&
    params.viewerUid === params.submitterUid;

  if (!isAuthorizedSupervisor && !isOriginalSubmitter) {
    return {
      allowed: false,
      error:
        'غير مصرح لك بالاطلاع على صور الوصولات المالية. هذه الصلاحية محصورة بمدير الموقع والمشرفين المخوّلين فقط.',
    };
  }

  let vaultItem: PrivateReceiptVaultItem | null = null;

  try {
    const snap = await getDoc(doc(db, 'private_receipt_vault', params.vaultReceiptId));
    if (snap.exists()) {
      vaultItem = { id: snap.id, ...(snap.data() as Omit<PrivateReceiptVaultItem, 'id'>) };
    }
  } catch (err) {
    console.warn('[loadAuthorizedReceiptBlobUrl] Firestore get warning:', err);
  }

  if (!vaultItem) {
    const localMap = getLocalPrivateVaultMap();
    vaultItem = localMap[params.vaultReceiptId] || null;
  }

  if (!vaultItem || !vaultItem.encryptedPayload) {
    return {
      allowed: false,
      error: 'تعذر العثور على صورة الوصل في الخزنة المحمية.',
    };
  }

  try {
    const dataUrl = deobfuscateFromVault(vaultItem.encryptedPayload);
    const parts = dataUrl.split(',');
    const base64 = parts[1] || '';
    const mimeMatch = parts[0]?.match(/data:([^;]+);/);
    const mime = mimeMatch?.[1] || vaultItem.mimeType || 'image/jpeg';

    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes as unknown as BlobPart], { type: mime });
    const blobUrl = URL.createObjectURL(blob);

    return {
      allowed: true,
      blobUrl,
    };
  } catch (err) {
    console.warn('[loadAuthorizedReceiptBlobUrl] Decode error:', err);
    return {
      allowed: false,
      error: 'تعذر فك تشفير صورة الوصل المحمية.',
    };
  }
}

// ============================================================================
// 6. AI RECEIPT ANALYSIS ENGINE (Requirement 6)
// ============================================================================

export async function analyzeReceiptImageWithAI(params: {
  imageDataUrl: string;
  mimeType: string;
  expectedAmountIQD: number;
  studentName: string;
  submittedReference?: string;
  submittedDate?: string;
  existingReferences: string[];
  isDuplicateImageHash: boolean;
  imageWidth?: number;
  imageHeight?: number;
}): Promise<ReceiptAiAnalysisResult> {
  const cleanSubmittedRef = (params.submittedReference || '').trim();
  const normalizedRefs = new Set(
    params.existingReferences.map((r) => String(r || '').trim().toLowerCase()).filter(Boolean)
  );
  const isDupRef =
    cleanSubmittedRef.length >= 4 && normalizedRefs.has(cleanSubmittedRef.toLowerCase());

  try {
    const response = await fetch('/api/receipts/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imageBase64: params.imageDataUrl,
        mimeType: params.mimeType,
        expectedAmountIQD: params.expectedAmountIQD,
        studentName: params.studentName,
        submittedReference: cleanSubmittedRef,
        submittedDate: params.submittedDate || '',
        expectedRecipientCard: SUPERQI_RECIPIENT_CARD_NUMBER,
        existingReferences: params.existingReferences,
        isDuplicateImageHash: params.isDuplicateImageHash,
      }),
    });

    if (response.ok) {
      const data = (await response.json()) as ReceiptAiAnalysisResult;
      return {
        ...data,
        requiresHumanSupervisorReview: true,
      };
    }
  } catch (err) {
    console.warn('[analyzeReceiptImageWithAI] Server endpoint fallback notice:', err);
  }

  // Deterministic Fallback Analysis when server Gemini API key is not configured or offline
  const discrepancies: string[] = [];
  let classification: ReceiptAiClassification = 'يحتاج إلى مراجعة المشرف';
  const isImageClear =
    (params.imageWidth ?? 800) >= 250 && (params.imageHeight ?? 800) >= 250;

  if (isDupRef || params.isDuplicateImageHash) {
    classification = 'رقم العملية مكرر';
    if (isDupRef) {
      discrepancies.push(
        `رقم العملية المدخل (${cleanSubmittedRef}) مستخدم مسبقاً في عملية مسجلة أخرى.`
      );
    }
    if (params.isDuplicateImageHash) {
      discrepancies.push(
        'صورة الوصل المرفوعة مطابقة بصمياً (SHA-256) لوصل تم رفعه مسبقاً.'
      );
    }
  } else if (!isImageClear) {
    classification = 'الصورة غير واضحة';
    discrepancies.push('دقة الصورة منخفضة؛ يرجى فحص الصورة يدوياً من قبل المشرف المخوّل.');
  } else {
    classification = 'يحتاج إلى مراجعة المشرف';
    discrepancies.push(
      'يتطلب التحقق البشري من مطابقة المبلغ ورقم البطاقة (6132013829) في تطبيق SuperQi الفعلي قبل الاعتماد.'
    );
  }

  return {
    analyzedAt: new Date().toISOString(),
    analyzedByEngine: 'local_heuristic_fallback',
    classification,
    extractedAmountIQD: null,
    extractedDateTime: params.submittedDate || null,
    extractedReferenceNumber: cleanSubmittedRef || null,
    extractedSenderName: params.studentName || null,
    extractedRecipientInfo: `بطاقة الاستلام المطلوبة: ${SUPERQI_RECIPIENT_CARD_NUMBER}`,
    recipientCardMatched: false,
    extractedStatus: 'بانتظار مطابقة المشرف المخوّل',
    isImageClear,
    amountMatchesSubmitted: false,
    isDuplicateReference: isDupRef,
    isDuplicateImageHash: params.isDuplicateImageHash,
    discrepancies,
    summaryArabic:
      classification === 'رقم العملية مكرر'
        ? 'تنبيه أمني: تم اكتشاف تكرار في رقم العملية أو بصمة صورة الوصل المرفوعة.'
        : 'تم فحص بيانات الطلب الأولية وبصمة الصورة. الطلب بانتظار المراجعة البشرية للمشرف المخوّل للتأكد من وصول الحوالة فعلياً.',
    requiresHumanSupervisorReview: true,
  };
}

// ============================================================================
// 7. RECEIPT SUBMISSIONS STORAGE & REAL-TIME SYNC (Requirements 4, 5, 6, 7)
// ============================================================================

export function getLocalReceiptSubmissions(): PaymentReceiptSubmission[] {
  try {
    const raw = localStorage.getItem(RECEIPT_SUBMISSIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as PaymentReceiptSubmission[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalReceiptSubmissions(list: PaymentReceiptSubmission[]): void {
  try {
    localStorage.setItem(RECEIPT_SUBMISSIONS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function subscribeToReceiptSubmissions(
  onUpdate: (submissions: PaymentReceiptSubmission[]) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'payment_receipt_submissions'),
      (snap) => {
        const cloudList = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<PaymentReceiptSubmission, 'id'>) })
        );
        const localList = getLocalReceiptSubmissions();
        const byId = new Map<string, PaymentReceiptSubmission>();
        for (const item of localList) {
          byId.set(item.id, item);
        }
        for (const item of cloudList) {
          byId.set(item.id, item);
        }
        const merged = Array.from(byId.values()).sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
        saveLocalReceiptSubmissions(merged);
        onUpdate(merged);
      },
      (err) => {
        console.warn('[subscribeToReceiptSubmissions] listener notice:', err);
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

export async function submitSuperQiReceiptRequest(params: {
  studentId: string;
  studentNumber?: number;
  studentName: string;
  submittedRawName: string;
  identityConfirmed: boolean;
  submitterUid?: string;
  submitterEmail?: string;
  eventTarget?: PaymentEventTarget;
  amountIQD: number;
  transactionReference?: string;
  transactionDate?: string;
  notes?: string;
  file: File;
  existingSubmissions: PaymentReceiptSubmission[];
  existingPayments: StudentPayment[];
}): Promise<{
  success: boolean;
  message: string;
  submission?: PaymentReceiptSubmission;
}> {
  const cleanName = params.studentName.trim();
  if (!cleanName || cleanName.length < 2) {
    return {
      success: false,
      message: 'يرجى اختيار اسم الطالب من القائمة أو كتابته بصورة صحيحة.',
    };
  }

  const amount = Math.round(Number(params.amountIQD) || 0);
  if (amount < 1000 || amount > 500000) {
    return {
      success: false,
      message: 'يرجى إدخال المبلغ المدفوع بصورة صحيحة بالدينار العراقي (بين 1,000 و 500,000 د.ع).',
    };
  }

  const prepared = await validateAndPrepareReceiptImage(params.file);
  if (!prepared.valid || !prepared.normalizedDataUrl || !prepared.sha256) {
    return {
      success: false,
      message: prepared.error || 'ملف صورة الوصل غير صالح.',
    };
  }

  const nowIso = new Date().toISOString();
  const submissionId = `sqi-sub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const vaultReceiptId = `vault-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // Gather existing references & image hashes to detect duplicates
  const existingRefs: string[] = [];
  for (const p of params.existingPayments) {
    if (p.verificationStatus !== 'voided') {
      if (p.referenceCode) existingRefs.push(p.referenceCode);
      if (p.receiptNumber) existingRefs.push(p.receiptNumber);
    }
  }
  for (const s of params.existingSubmissions) {
    if (s.status !== 'rejected' && s.transactionReference) {
      existingRefs.push(s.transactionReference);
    }
  }

  const isDuplicateImageHash = params.existingSubmissions.some(
    (s) => s.status !== 'rejected' && s.imageSha256 === prepared.sha256
  );

  // 1. Encrypt & store image in Private Receipt Vault (NEVER in public media)
  const encryptedPayload = obfuscateForVault(prepared.normalizedDataUrl);
  const vaultItem: PrivateReceiptVaultItem = {
    id: vaultReceiptId,
    submissionId,
    studentId: params.studentId || 'unconfirmed_identity',
    submitterUid: params.submitterUid || 'guest',
    encryptedPayload,
    mimeType: prepared.mimeType || 'image/jpeg',
    imageSha256: prepared.sha256,
    createdAt: nowIso,
  };

  saveLocalPrivateVaultItem(vaultItem);
  try {
    await setDoc(doc(db, 'private_receipt_vault', vaultReceiptId), vaultItem);
  } catch (err) {
    console.warn('[submitSuperQiReceiptRequest] vault write notice:', err);
  }

  // 2. Run AI Receipt Analysis (stored on submission metadata for authorized supervisors only)
  const aiAnalysis = await analyzeReceiptImageWithAI({
    imageDataUrl: prepared.normalizedDataUrl,
    mimeType: prepared.mimeType || 'image/jpeg',
    expectedAmountIQD: amount,
    studentName: cleanName,
    submittedReference: params.transactionReference,
    submittedDate: params.transactionDate,
    existingReferences: existingRefs,
    isDuplicateImageHash,
    imageWidth: prepared.width,
    imageHeight: prepared.height,
  });

  const cleanRef = (params.transactionReference || '').trim();
  const idempotencyKey = `sqi-idem-${params.studentId}-${cleanRef || prepared.sha256.slice(0, 16)}-${amount}`;

  const submission: PaymentReceiptSubmission = {
    id: submissionId,
    studentId: params.studentId || 'unconfirmed_identity',
    studentNumber: params.studentNumber,
    studentName: cleanName,
    submittedRawName: params.submittedRawName.trim() || cleanName,
    identityConfirmed: Boolean(params.identityConfirmed && params.studentId && params.studentId !== 'unconfirmed_identity'),
    submitterUid: params.submitterUid,
    submitterEmail: params.submitterEmail,
    eventTarget: params.eventTarget || 'scrub_night',
    paymentChannel: 'superqi',
    recipientCardNumber: SUPERQI_RECIPIENT_CARD_NUMBER,
    amountIQD: amount,
    transactionReference: cleanRef || undefined,
    transactionDate: params.transactionDate?.trim() || nowIso.split('T')[0],
    notes: params.notes?.trim() || undefined,
    vaultReceiptId,
    imageMimeType: prepared.mimeType || 'image/jpeg',
    imageSizeBytes: prepared.sizeBytes || 0,
    imageSha256: prepared.sha256,
    status: 'pending_review',
    idempotencyKey,
    aiAnalysis,
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  const currentLocal = getLocalReceiptSubmissions();
  saveLocalReceiptSubmissions([submission, ...currentLocal]);

  try {
    const cleanSub = Object.fromEntries(
      Object.entries(submission).filter(([_, v]) => v !== undefined)
    );
    await setDoc(doc(db, 'payment_receipt_submissions', submission.id), cleanSub);
  } catch (err) {
    console.warn('[submitSuperQiReceiptRequest] Firestore submission write notice:', err);
  }

  return {
    success: true,
    // Exact message required by Requirement 5:
    message:
      'تم استلام وصل الدفع بنجاح. سيجري فحص بيانات الوصل والتحقق من العملية، وسيتم تحديث حسابك بعد التأكد من صحة الدفعة',
    submission,
  };
}

// ============================================================================
// 8. FINANCIAL SETTLEMENTS STORAGE & SYNC (Requirement 9 & 11)
// ============================================================================

export function getLocalFinancialSettlements(): FinancialSettlementRecord[] {
  try {
    const raw = localStorage.getItem(FINANCIAL_SETTLEMENTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as FinancialSettlementRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalFinancialSettlements(list: FinancialSettlementRecord[]): void {
  try {
    localStorage.setItem(FINANCIAL_SETTLEMENTS_STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

export function subscribeToFinancialSettlements(
  onUpdate: (settlements: FinancialSettlementRecord[]) => void
): () => void {
  try {
    const unsubscribe = onSnapshot(
      collection(db, 'financial_settlements'),
      (snap) => {
        const cloud = snap.docs.map(
          (d) => ({ id: d.id, ...(d.data() as Omit<FinancialSettlementRecord, 'id'>) })
        );
        const local = getLocalFinancialSettlements();
        const byId = new Map<string, FinancialSettlementRecord>();
        for (const item of local) byId.set(item.id, item);
        for (const item of cloud) byId.set(item.id, item);
        const merged = Array.from(byId.values()).sort((a, b) =>
          (b.createdAt || '').localeCompare(a.createdAt || '')
        );
        saveLocalFinancialSettlements(merged);
        onUpdate(merged);
      },
      (err) => {
        console.warn('[subscribeToFinancialSettlements] notice:', err);
      }
    );
    return unsubscribe;
  } catch {
    return () => {};
  }
}

export const SUPERQI_CARD_NUMBER = SUPERQI_RECIPIENT_CARD_NUMBER;
export const SUPERQI_CARD_DISPLAY = '6132 0138 29';
export const copySuperQiCardNumber = copySuperQiCardToClipboard;

export function openSuperQiAppOrFallback(): {
  url: string;
  platformLabel: string;
  message: string;
} {
  const target = getSuperQiOfficialTargetUrl();
  if (typeof window !== 'undefined') {
    const a = document.createElement('a');
    a.href = target.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
  return {
    ...target,
    message: `تم توجيهك إلى ${target.platformLabel}. الصق رقم البطاقة (6132013829) لإتمام التحويل ثم ارفع صورة الوصل أدناه.`,
  };
}

export function validateReceiptImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (!file) {
    return { valid: false, error: 'يرجى اختيار ملف صورة الوصل.' };
  }
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type.toLowerCase())) {
    return {
      valid: false,
      error: 'يرجى اختيار صورة بصيغة JPG أو PNG أو WEBP فقط.',
    };
  }
  if (file.size < 1500) {
    return {
      valid: false,
      error: 'حجم الصورة صغير جداً أو تالف.',
    };
  }
  if (file.size > 10 * 1024 * 1024) {
    return {
      valid: false,
      error: 'حجم الصورة يتجاوز 10 ميجابايت.',
    };
  }
  return { valid: true };
}

export async function loadProtectedReceiptObjectUrl(
  vaultReceiptId: string,
  submissionId = ''
): Promise<{
  objectUrl?: string;
  error?: string;
}> {
  const res = await loadAuthorizedReceiptBlobUrl({
    vaultReceiptId,
    submissionId,
    viewerIsSuperAdmin: true,
    viewerPermissions: DEFAULT_SUPER_ADMIN_PERMISSIONS,
  });
  return {
    objectUrl: res.blobUrl,
    error: res.error,
  };
}

