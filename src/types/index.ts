export type RegistrationStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'active';

export type UserRole =
  | 'graduate'
  | 'student'
  | 'moderator'
  | 'admin'
  | 'super_admin'
  | 'finance_manager'
  | 'event_manager'
  | 'gallery_moderator'
  | 'notification_manager';

export type PaymentMethod = 'cash' | 'bank_transfer';

export type PaymentEventTarget = 'scrub_night' | 'official_grad';

export type PaymentStatus = 'deposit' | 'partial' | 'completed' | 'unpaid';

export type ContentStatus = 'published' | 'draft' | 'archived';

export type ContentVisibility = 'public' | 'admin_only' | 'graduate_only';

export type GraduationOfficialStatus =
  | 'coming_soon'
  | 'date_announced'
  | 'registration_open'
  | 'details_published'
  | 'completed';

export interface Organizer {
  id: string;
  name: string;
  role: string;
  bio?: string;
  photoUrl?: string;
  instagram?: string;
}

export interface EventConfig {
  brandName: string;
  brandSubtitle: string;
  eventType: string;
  cohortYear: string; // "دفعة 2026"
  graduationYear: string; // "2027"
  institutionName: string; // "معهد التمريض"

  // Scrub Night Config
  scrubEventName: string; // "حفلة السكراب"
  scrubPartyDate: string; // ISO string e.g. "2026-12-12T09:00:00"
  scrubPartyDateDisplay: string; // "12/12/2026"
  scrubVenue: string; // "مسرح تفاحة المصور"
  scrubPhotographer: string; // "باقر حسن"
  scrubTime: string; // "الوقت يُعلن لاحقاً" | "08:00 ص" | "09:00 ص"
  scrubPartyDressCode: string;
  scrubCountdownEnabled: boolean;
  scrubFeeIQD: number; // 35000 IQD
  scrubContributionIQD?: number; // Alias for 35000 IQD

  // Official Graduation Config
  officialGraduationTitle: string; // "حفل التخرج الرسمي"
  officialGraduationYear: string; // "2027"
  officialGraduationStatus: GraduationOfficialStatus;
  officialGraduationDate: string; // "قريباً"
  officialGradDateDisplay?: string;
  officialGraduationLocation: string; // "قريباً"
  officialGradVenue?: string;
  officialGraduationSashColor: string; // "تركوازي (وشاح التمريض)"
  officialGraduationSchedule: string;
  officialGradCountdownEnabled: boolean;
  officialGradCountdownDate?: string;
  officialGradFeeIQD: number; // 50000 IQD

  // General & Media
  instagramUrl: string;
  supportPhone?: string;
  organizers: Organizer[];
  maintenanceMode: boolean;
  maintenanceMessage?: string;
  ticketPriceIQD: number; // Internal combined calculation value

  // Admin-Controlled Top Countdown Timer Configuration (Requirement 2)
  countdownEnabled?: boolean;
  countdownPublished?: boolean;
  countdownTarget?: 'scrub_night' | 'scrub_party' | 'official_grad' | 'custom';
  countdownTitle?: string;
  countdownDate?: string; // YYYY-MM-DD e.g. "2026-12-12"
  countdownTime?: string; // HH:mm e.g. "09:00"
  countdownTimezone?: string; // Default "Asia/Baghdad"
  countdownLocation?: string;
  countdownStyle?: 'medical_turquoise' | 'champagne_gold' | 'clinical_navy' | 'medical_glass' | 'gold_ceremonial' | 'compact';
  isScrubDateConfirmed?: boolean; // False until admin confirms exact start time/date
  isOfficialGradDateConfirmed?: boolean; // False until admin confirms official grad date
  isOfficialGradPriceConfirmed?: boolean; // False until admin sets official graduation price

  // Sponsorship & Job Info Fields
  supervisorTitle?: string;
  supervisorName?: string;
  jobWorthText?: string;
  jobCountText?: string;
  jobRightsText?: string;
  audioUrl?: string;
}

export interface LoggedInUserAccount {
  uid: string;
  displayName: string;
  loginMethod: 'google' | 'phone' | 'email';
  email?: string;
  phoneNumber?: string;
  role: UserRole;
  createdAt: string;
  lastLoginAt: string;
}


// Permanent Scrub Party Student Record (Requirement 1, 2, 3, 4, 5, 6)
export interface ScrubStudent {
  id: string; // Permanent internal ID (UUID / deterministic key)
  studentNumber: number; // Visible sequential number (ت: 1..46+)
  fullName: string; // Original Arabic name preserved
  normalizedName: string; // Normalized Arabic name for duplicate detection
  preferredTitle: 'nurse_m' | 'nurse_f'; // 'الممرض' | 'الممرضة'
  phone?: string;
  institutionalStudentId?: string;
  totalFeeIQD: number; // 35,000 IQD
  verifiedPaidIQD: number; // Sum of verified payments
  pendingPaidIQD: number; // Sum of pending/unverified payments
  remainingBalanceIQD: number; // Total fee - Sum of verified payments
  paymentStatus: PaymentStatus; // 'unpaid' | 'deposit' | 'partial' | 'completed'
  status: 'active' | 'archived'; // Soft-deletion / archival status
  isLinkedToAccount: boolean; // False initially unless verified by admin
  linkedUserId?: string; // Authenticated user UID or Graduate ID
  linkedUserEmail?: string;
  linkedUserName?: string;
  linkedAt?: string;
  linkedBy?: string;
  needsReview?: boolean; // True if similar existing record flagged for review
  reviewNote?: string;
  potentialMatchId?: string;
  potentialMatchName?: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  archivedAt?: string;
  archivedBy?: string;
  archiveBatchId?: string;
}

// Individual Payment Record for a Scrub Party Student (Requirement 5)
export interface StudentPayment {
  id: string; // Permanent payment ID
  studentId: string; // Permanent internal ScrubStudent.id
  studentNumber: number; // Visible number at time of payment
  studentName: string; // Arabic student name
  linkedUserId?: string; // Synced if student is linked to an authenticated account
  eventTarget?: PaymentEventTarget; // 'scrub_night' (default) or 'official_grad'
  amountIQD: number;
  paymentType: 'initial_deposit' | 'installment' | 'final_settlement';
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  referenceCode: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
  isVerified: boolean; // Only verified payments affect confirmed balance
  verificationStatus: 'verified' | 'pending' | 'voided';
  recordedBy: string;
  recordedByUid?: string;
  verifiedBy?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Graduate {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  studentId?: string;
  role: UserRole;
  status: RegistrationStatus;
  preferredTitle?: 'nurse_m' | 'nurse_f'; // 'الممرض' | 'الممرضة'
  displayTitle?: string; // e.g. "الممرض أحمد جاسم"
  cohortLabel?: string; // "دفعة 2026 | التخرج 2027"
  linkedScrubStudentId?: string; // Linked ScrubStudent permanent ID

  // Scrub Night Specific Dues
  scrubDueIQD: number;
  scrubPaidIQD: number;
  scrubBalanceIQD: number;
  scrubStatus?: PaymentStatus;

  // Official Graduation Specific Dues
  gradDueIQD: number;
  gradPaidIQD: number;
  gradBalanceIQD: number;
  gradStatus?: PaymentStatus;

  // Combined Totals
  totalDueIQD: number;
  totalPaidIQD: number;
  remainingBalanceIQD: number;

  isAdvanceLinked?: boolean;
  avatarUrl?: string;
  notes?: string;
  createdAt: string;
  approvedAt?: string;
  approvedBy?: string;
}

export interface PaymentTransaction {
  id: string;
  receiptNumber: string;
  graduateId: string;
  graduateName: string;
  eventTarget: PaymentEventTarget; // 'scrub_night' or 'official_grad'
  amountIQD: number;
  paymentStatus?: 'deposit' | 'partial' | 'completed';
  matchingPhone?: string; // for advance cash match
  matchingStudentId?: string; // for advance cash match
  studentPhone?: string; // alias for matchingPhone
  studentId?: string; // alias for matchingStudentId
  studentName?: string;
  userId?: string;
  isLinked?: boolean;
  date: string; // YYYY-MM-DD
  time: string;
  method: PaymentMethod;
  notes?: string;
  recordedBy: string;
  isVerified: boolean;
  referenceCode: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  publishedAt: string;
  status: ContentStatus;
  visibility?: ContentVisibility;
  displayOrder: number;
  expiresAt?: string;
  category?: 'urgent' | 'general' | 'scrub_night' | 'official_grad';
  targetGraduateId?: string;
}

export interface ContentBlock {
  id: string;
  title: string;
  description: string;
  contentType: 'announcement' | 'info_card' | 'image' | 'link' | 'schedule_item' | 'instruction';
  visibility: 'public' | 'admin_only' | 'graduate_only';
  status: ContentStatus;
  order: number;
  imageUrl?: string;
  linkUrl?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  category: 'scrub_night' | 'official_grad' | 'team' | 'posters' | 'memories';
  album?: string;
  url: string;
  caption?: string;
  uploadedAt: string;
  isPublic: boolean;
  status?: 'approved' | 'pending' | 'rejected';
  submittedByGraduateId?: string;
  submittedByGraduateName?: string;
  taggedGraduateName?: string;
  sizeMb?: number;
}

export interface GraduatePrivateMedia {
  id: string;
  graduateId: string;
  title: string;
  url: string;
  uploadedAt: string;
  sizeBytes: number;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  performedBy: string;
  actorUid?: string;
  actorEmail?: string;
  actorRole?: string;
  details: string;
  timestamp: string;
   affectedCount?: number;
  entityType?: 'scrub_student' | 'student_payment' | 'graduate' | 'payment' | 'config' | 'announcement' | 'security';
}

export interface UserSession {
  user: Graduate | null;
  isAdmin: boolean;
  isModerator?: boolean;
  isAuthenticated: boolean;
}

export type SongCategory =
  | 'graduation'
  | 'party'
  | 'calm'
  | 'energetic'
  | 'nasheed';

export type SongStorageType =
  | 'firebase_storage'
  | 'external_url'
  | 'local_indexeddb';

export interface GraduationSong {
  id: string;
  title: string;
  artist: string; // 'اسم غير معروف' if not available
  durationSeconds: number;
  durationFormatted: string; // e.g. '03:45'
  category: SongCategory;
  audioUrl: string; // Direct URL, Firebase Storage URL, or 'idb://<id>'
  storagePath?: string;
  storageType: SongStorageType;
  coverUrl?: string;
  mimeType: string;
  fileSizeBytes: number;
  allowDownload: boolean;
  keywords: string[];
  sortOrder: number;
  createdAt: string;
  updatedAt?: string;
  uploadedBy?: string;
}

