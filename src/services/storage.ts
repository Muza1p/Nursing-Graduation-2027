import {
  EventConfig,
  Graduate,
  PaymentTransaction,
  Announcement,
  MediaItem,
  GraduatePrivateMedia,
  AuditLogEntry,
  PaymentStatus,
  PaymentEventTarget,
  FinancialLinkRequest,
  SavedStudioDesign,
} from '../types';

const STORAGE_KEYS = {
  EVENT_CONFIG: 'nursing_grad_config_v2',
  GRADUATES: 'nursing_grad_graduates_v2',
  PAYMENTS: 'nursing_grad_payments_v2',
  ANNOUNCEMENTS: 'nursing_grad_announcements_v2',
  MEDIA: 'nursing_grad_media_v2',
  PRIVATE_MEDIA: 'nursing_grad_private_media_v2',
  AUDIT_LOGS: 'nursing_grad_audit_logs_v2',
  CURRENT_USER_ID: 'nursing_grad_current_user_v2',
  FINANCIAL_LINK_REQUESTS: 'nursing_grad_fin_link_requests_v2',
  SAVED_DESIGNS: 'nursing_grad_saved_designs_v2',
};

export const DEFAULT_ABOUT_SITE_TEXT =
  'منصة خاصة بطلاب دفعة التمريض 2027، مخصصة لتنظيم شؤون الدفعة وفعاليات التخرج وتوثيق الذكريات وتنسيق المعلومات بين الطلاب وفريق التنظيم. الموقع مستقل عن الإدارة الرسمية للمؤسسة التعليمية';

// Initial default configuration strictly as required by the user's updated brief
export const DEFAULT_CONFIG: EventConfig = {
  brandName: 'تخرج دفعة التمريض 2027',
  brandSubtitle: 'رحلة علم، تعب، وذكريات تجمعنا',
  aboutSiteText: DEFAULT_ABOUT_SITE_TEXT,
  eventType: 'حفلة تخرج طلاب معهد التمريض',
  cohortYear: 'دفعة 2027',
  graduationYear: '2027',
  institutionName: 'تخرج طلاب معهد التمريض — دفعة 2027',
  collegeName: 'معهد التمريض — دفعة 2027',
  departmentName: 'قسم التمريض',
  stageName: 'المرحلة الثانية',
  studyType: 'صباحي',
  academicYear: '2026–2027',
  
  // Scrub Night Config
  scrubEventName: 'حفلة السكراب',
  scrubPartyDate: '2026-12-12T09:00:00+03:00', // Morning event (09:00:00 AM Asia/Baghdad)
  scrubPartyDateDisplay: '12/12/2026',
  scrubVenue: 'مسرح تفاحة المصور',
  scrubPhotographer: 'باقر حسن',
  scrubTime: '09:00 صباحاً',
  scrubPartyDressCode: 'السكراب الطبي الموحد لطلاب دفعة التمريض 2027',
  scrubCountdownEnabled: true,
  scrubFeeIQD: 35000, // 35,000 IQD required per student
  
  // Official Graduation 2027 Config
  officialGraduationTitle: 'حفل تخرج دفعة 2027',
  officialGraduationYear: '2027',
  officialGraduationStatus: 'coming_soon',
  officialGraduationDate: 'قريباً',
  officialGraduationLocation: 'قريباً',
  officialGraduationSashColor: 'تركوازي (وشاح التمريض)',
  officialGraduationSchedule: 'سيتم إعلان الموعد والقاعة والجدول الزمني من قِبل فريق تنظيم الدفعة فور تحديدها',
  officialGradCountdownEnabled: false, // Do NOT run countdown until configured
  officialGradFeeIQD: 50000,

  // General & Media
  instagramUrl: 'https://www.instagram.com/uofaon.1/',
  supportPhone: '07800088386',
  maintenanceMode: false,
  ticketPriceIQD: 85000, // Internal combined value

  // Admin-Controlled Top Countdown Timer Configuration (Requirement 2)
  countdownEnabled: true,
  countdownPublished: true,
  countdownTarget: 'scrub_night',
  countdownTitle: 'العد التنازلي لفعالية حفلة السكراب — دفعة 2027',
  countdownDate: '2026-12-12',
  countdownTime: '09:00:00',
  countdownTimezone: 'Asia/Baghdad',
  countdownLocation: 'مسرح تفاحة المصور — بعدسة المصور باقر حسن',
  countdownStyle: 'medical_turquoise',
  isScrubDateConfirmed: true,
  isOfficialGradDateConfirmed: false,

  supervisorTitle: '',
  supervisorName: '',
  jobWorthText: '',
  jobCountText: '',
  jobRightsText: '',

  paymentGatewayConfig: {
    allowStudentCashRequest: true,
    allowInstallments: true,
    minPaymentAmountIQD: 15000,
    electronicGatewayEnabled: false,
    gatewayProviderName: 'بوابة البطاقات العراقية (QiCard / ZainCash / Switch)',
    gatewayWebhookConfigured: false,
    committeePaymentInstructions:
      'يمكنك تسجيل طلب تسديد نقدي أو تحويل مالي وإرفاق رقم المرجع ليقوم فريق تنظيم الدفعة بتدقيقه وتوثيق الوصل الرسمي في حسابك.',
  },

  organizers: [
    {
      id: 'org-1',
      name: 'مصطفى علي حسون',
      role: 'فريق تنظيم دفعة 2027',
      bio: '',
      instagram: 'https://www.instagram.com/mustafaa.hassoun',
    },
    {
      id: 'org-2',
      name: 'مصطفى أركان ساجت',
      role: 'فريق تنظيم دفعة 2027',
      bio: '',
      instagram: 'https://www.instagram.com/t__suf',
    },
    {
      id: 'org-4',
      name: 'علي أكبر حسين عبيد',
      role: 'فريق تنظيم دفعة 2027',
      bio: '',
      instagram: 'https://www.instagram.com/4hll0_/',
    },
  ],
};

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    id: 'ann-1',
    title: 'تفاصيل حفلة السكراب (مسرح تفاحة المصور — 12/12/2026)',
    description: 'تقرر إقامة حفلة السكراب لطلاب معهد التمريض — دفعة 2027 في مسرح تفاحة المصور بتاريخ 12/12/2026 بعدسة المصور باقر حسن، ومبلغ المساهمة الكامل لكل طالب 35,000 د.ع.',
    publishedAt: '2026-10-20',
    status: 'published',
    displayOrder: 1,
    category: 'scrub_night',
  },
  {
    id: 'ann-2',
    title: 'تنويه: الحفل صباحي (الساعة 09:00 صباحاً)',
    description: 'نود إعلام جميع الزملاء في دفعة التمريض 2027 بأن حفلة السكراب ستقام صباحاً في تمام الساعة 09:00 صباحاً في مسرح تفاحة المصور.',
    publishedAt: '2026-10-22',
    status: 'published',
    displayOrder: 2,
    category: 'scrub_night',
  },
  {
    id: 'ann-3',
    title: 'حفل تخرج دفعة 2027 (قريباً)',
    description: 'بخصوص حفل التخرج لدفعة 2027 ووشاح التمريض باللون التركوازي، فإن الموعد والقاعة قيد الترتيب من قِبل فريق تنظيم الدفعة وسيتم نشر التفاصيل فور تحديدها.',
    publishedAt: '2026-10-24',
    status: 'published',
    displayOrder: 3,
    category: 'official_grad',
  },
  {
    id: 'ann-4',
    title: 'حساب دفعة التمريض 2027 لمتابعة كافة المستجدات',
    description: 'يرجى متابعة حساب الدفعة على الإنستغرام (@uofaon.1) لتلقي كافة التنبيهات والمستجدات الخاصة بفعاليات التخرج من فريق تنظيم الدفعة.',
    publishedAt: '2026-10-25',
    status: 'published',
    displayOrder: 4,
    category: 'urgent',
  },
];

export const DEMO_GRADUATE_IDS = new Set([
  'grad-admin',
  'grad-mod',
  'grad-2',
  'grad-3',
  'grad-4',
  'grad-advance-1',
]);

export const DEMO_PAYMENT_IDS = new Set([
  'pay-101',
  'pay-102',
  'pay-103',
  'pay-104',
  'pay-105',
  'pay-106',
]);

export const DEMO_MEDIA_IDS = new Set([
  'media-1',
  'media-2',
  'media-3',
  'media-4',
]);

export const DEMO_AUDIT_LOG_IDS = new Set([
  'log-2',
  'log-3',
  'log-4',
]);

export const INITIAL_GRADUATES: Graduate[] = [];

export const INITIAL_PAYMENTS: PaymentTransaction[] = [];

export const INITIAL_MEDIA: MediaItem[] = [];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'log-1',
    action: 'تهيئة النظام الأولي',
    performedBy: 'النظام الآلي',
    details: 'تم تأسيس منصة تنظيم شؤون الدفعة — تخرج طلاب معهد التمريض (دفعة 2027) وتحديد حفلة السكراب في مسرح تفاحة المصور بعدسة باقر حسن بقيمة 35,000 د.ع.',
    timestamp: '2026-10-20 10:00',
    entityType: 'config',
  },
];

// Helper to determine payment status
export function calculatePaymentStatus(paid: number, due: number, needsReview?: boolean): PaymentStatus {
  if (paid >= due && due > 0) return 'completed';
  if (paid > 0 && paid < due) return 'deposit'; // دفع عربون
  if (needsReview) return 'needs_review'; // تحتاج إلى مراجعة
  return 'unpaid'; // لم يدفع
}

export function getPaymentStatusArabic(status?: PaymentStatus, needsReview?: boolean): string {
  if (status === 'completed') return 'مكتمل';
  if (status === 'deposit' || status === 'partial') return 'دفع عربون';
  if (status === 'needs_review' || needsReview) return 'تحتاج إلى مراجعة';
  return 'لم يدفع';
}

export function getPaymentStatusBadgeClass(status?: PaymentStatus, needsReview?: boolean): string {
  if (status === 'completed') {
    return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30';
  }
  if (status === 'deposit' || status === 'partial') {
    return 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30';
  }
  if (status === 'needs_review' || needsReview) {
    return 'bg-amber-500/20 text-amber-300 border border-amber-500/40';
  }
  return 'bg-red-500/20 text-red-400 border border-red-500/30';
}

// Helper methods to read/write from localStorage safely
export class LocalStorageManager {
  static getEventConfig(): EventConfig {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EVENT_CONFIG);
      if (!data) {
        this.saveEventConfig(DEFAULT_CONFIG);
        return DEFAULT_CONFIG;
      }
      const parsed: EventConfig = JSON.parse(data);
      const isOldBrandName =
        !parsed.brandName ||
        parsed.brandName === 'معهد التمريض — دفعة 2027' ||
        parsed.brandName.includes('الكلية البوليتكنك');
      const isOldBrandSubtitle =
        !parsed.brandSubtitle ||
        parsed.brandSubtitle.includes('الكلية البوليتكنك') ||
        parsed.brandSubtitle.includes('قسم تقنيات التمريض');

      const merged: EventConfig = {
        ...DEFAULT_CONFIG,
        ...parsed,
        supportPhone: '07800088386',
        organizers: DEFAULT_CONFIG.organizers,
        scrubFeeIQD: 35000,
        brandName: isOldBrandName ? DEFAULT_CONFIG.brandName : parsed.brandName,
        brandSubtitle: isOldBrandSubtitle ? DEFAULT_CONFIG.brandSubtitle : parsed.brandSubtitle,
        aboutSiteText: parsed.aboutSiteText?.trim() || DEFAULT_ABOUT_SITE_TEXT,
        collegeName: 'معهد التمريض — دفعة 2027',
        departmentName: 'قسم التمريض',
        stageName: parsed.stageName || 'المرحلة الثانية',
        studyType: parsed.studyType || 'صباحي',
        academicYear: parsed.academicYear || '2026–2027',
        scrubVenue: parsed.scrubVenue || 'مسرح تفاحة المصور',
        scrubPhotographer: parsed.scrubPhotographer || 'باقر حسن',
        scrubTime:
          !parsed.scrubTime || parsed.scrubTime === 'الوقت يُعلن لاحقاً'
            ? '09:00 صباحاً'
            : parsed.scrubTime,
        scrubPartyDate: parsed.scrubPartyDate || '2026-12-12T09:00:00+03:00',
        scrubPartyDateDisplay: parsed.scrubPartyDateDisplay || '12/12/2026',
        scrubCountdownEnabled: true,
        institutionName: 'تخرج طلاب معهد التمريض — دفعة 2027',
        cohortYear: 'دفعة 2027',
        graduationYear: '2027',
        officialGraduationTitle:
          !parsed.officialGraduationTitle || parsed.officialGraduationTitle === 'حفل التخرج الرسمي'
            ? 'حفل تخرج دفعة 2027'
            : parsed.officialGraduationTitle,
        countdownTitle: parsed.countdownTitle
          ? parsed.countdownTitle.replace(/دفعة 2026/g, 'دفعة 2027')
          : DEFAULT_CONFIG.countdownTitle,
        countdownEnabled: parsed.countdownEnabled ?? true,
        countdownPublished: parsed.countdownPublished ?? true,
        countdownTarget: parsed.countdownTarget || 'scrub_night',
        countdownDate: parsed.countdownDate || '2026-12-12',
        countdownTime:
          !parsed.countdownTime || parsed.countdownTime === '09:00'
            ? '09:00:00'
            : parsed.countdownTime,
        countdownTimezone: 'Asia/Baghdad',
        isScrubDateConfirmed: true,
        supervisorTitle: '',
        supervisorName:
          parsed.supervisorName && !parsed.supervisorName.includes('خليج النيجيرية')
            ? parsed.supervisorName
            : '',
      };
      this.saveEventConfig(merged);
      return merged;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  static saveEventConfig(config: EventConfig): void {
    localStorage.setItem(STORAGE_KEYS.EVENT_CONFIG, JSON.stringify(config));
  }

  static getGraduates(): Graduate[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.GRADUATES);
      if (!data) {
        this.saveGraduates(INITIAL_GRADUATES);
        return INITIAL_GRADUATES;
      }
      const rawList: Graduate[] = JSON.parse(data);
      const list = rawList.filter(
        (g) =>
          !DEMO_GRADUATE_IDS.has(g.id) &&
          !g.fullName.includes('حسين عبدالله جاسم') &&
          !g.fullName.includes('حسين عبد الله جاسم') &&
          !g.email.toLowerCase().includes('922r_h')
      );
      if (list.length !== rawList.length) {
        this.saveGraduates(list);
      }
      return list.map((g) => {
        const scrubFee = g.scrubDueIQD && g.scrubDueIQD !== 100000 ? g.scrubDueIQD : 35000;
        const gradFee = g.gradDueIQD || 50000;
        const scrubPaid = g.scrubPaidIQD ?? 0;
        const gradPaid = g.gradPaidIQD ?? 0;
        const totalPaid = scrubPaid + gradPaid;
        const totalDue = scrubFee + gradFee;

        return {
          ...g,
          cohortLabel: 'دفعة 2027',
          displayTitle: g.displayTitle || (g.preferredTitle === 'nurse_f' ? `الممرضة ${g.fullName}` : `الممرض ${g.fullName}`),
          scrubDueIQD: scrubFee,
          scrubPaidIQD: scrubPaid,
          scrubBalanceIQD: Math.max(0, scrubFee - scrubPaid),
          scrubStatus: calculatePaymentStatus(scrubPaid, scrubFee),
          gradDueIQD: gradFee,
          gradPaidIQD: gradPaid,
          gradBalanceIQD: Math.max(0, gradFee - gradPaid),
          gradStatus: calculatePaymentStatus(gradPaid, gradFee),
          totalDueIQD: totalDue,
          totalPaidIQD: totalPaid,
          remainingBalanceIQD: Math.max(0, totalDue - totalPaid),
        };
      });
    } catch {
      return INITIAL_GRADUATES;
    }
  }

  static saveGraduates(graduates: Graduate[]): void {
    localStorage.setItem(STORAGE_KEYS.GRADUATES, JSON.stringify(graduates));
  }

  static getPayments(): PaymentTransaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (!data) {
        this.savePayments(INITIAL_PAYMENTS);
        return INITIAL_PAYMENTS;
      }
      const rawList: PaymentTransaction[] = JSON.parse(data);
      const list = rawList.filter(
        (p) =>
          !DEMO_PAYMENT_IDS.has(p.id) &&
          !DEMO_GRADUATE_IDS.has(p.graduateId) &&
          !p.graduateName.includes('حسين عبدالله جاسم') &&
          !p.graduateName.includes('حسين عبد الله جاسم')
      );
      if (list.length !== rawList.length) {
        this.savePayments(list);
      }
      return list.map((p) => ({
        ...p,
        eventTarget: p.eventTarget || 'scrub_night',
        paymentStatus: p.paymentStatus || (p.amountIQD >= 35000 ? 'completed' : 'deposit'),
      }));
    } catch {
      return INITIAL_PAYMENTS;
    }
  }

  static savePayments(payments: PaymentTransaction[]): void {
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
  }

  // Securely match and link advance pre-payments based on verified phone number or student ID
  static linkAdvancePaymentsForGraduate(graduate: Graduate): {
    matchedTransactions: PaymentTransaction[];
    updatedGraduate: Graduate;
  } {
    const payments = this.getPayments();
    let newlyLinked = false;
    let addedPaidScrub = 0;
    let addedPaidGrad = 0;

    const updatedPayments = payments.map((p) => {
      // Never match on name alone. Require exact matching phone or studentId
      const matchesPhone = Boolean(p.matchingPhone && graduate.phone && p.matchingPhone.trim() === graduate.phone.trim());
      const matchesStudentId = Boolean(p.matchingStudentId && graduate.studentId && p.matchingStudentId.trim().toLowerCase() === graduate.studentId.trim().toLowerCase());

      if ((matchesPhone || matchesStudentId) && !p.isLinked) {
        newlyLinked = true;
        if (p.eventTarget === 'scrub_night') {
          addedPaidScrub += p.amountIQD;
        } else {
          addedPaidGrad += p.amountIQD;
        }
        return {
          ...p,
          graduateId: graduate.id,
          graduateName: graduate.fullName,
          isLinked: true,
          notes: `${p.notes ? p.notes + ' • ' : ''}تم ربط الدفعة مسبقاً بحساب الخريج عبر التحقق`,
        };
      }
      return p;
    });

    if (newlyLinked) {
      this.savePayments(updatedPayments);
      const newScrubPaid = graduate.scrubPaidIQD + addedPaidScrub;
      const newGradPaid = graduate.gradPaidIQD + addedPaidGrad;
      const newTotalPaid = newScrubPaid + newGradPaid;

      const updatedGraduate: Graduate = {
        ...graduate,
        scrubPaidIQD: newScrubPaid,
        scrubBalanceIQD: Math.max(0, graduate.scrubDueIQD - newScrubPaid),
        scrubStatus: calculatePaymentStatus(newScrubPaid, graduate.scrubDueIQD),
        gradPaidIQD: newGradPaid,
        gradBalanceIQD: Math.max(0, graduate.gradDueIQD - newGradPaid),
        gradStatus: calculatePaymentStatus(newGradPaid, graduate.gradDueIQD),
        totalPaidIQD: newTotalPaid,
        remainingBalanceIQD: Math.max(0, graduate.totalDueIQD - newTotalPaid),
        isAdvanceLinked: true,
      };

      const grads = this.getGraduates().map((g) => (g.id === graduate.id ? updatedGraduate : g));
      this.saveGraduates(grads);

      this.addAuditLog({
        action: 'ربط دفعات مسبقة تلقائياً',
        performedBy: 'النظام — التحقق الآمن',
        details: `تم العثور على وصولات كاش مسبقة وربطها بنجاح بحساب ${graduate.fullName} برقم الهاتف ${graduate.phone}.`,
        entityType: 'payment',
      });

      return {
        matchedTransactions: updatedPayments.filter((p) => p.graduateId === graduate.id),
        updatedGraduate,
      };
    }

    return {
      matchedTransactions: payments.filter((p) => p.graduateId === graduate.id),
      updatedGraduate: graduate,
    };
  }

  static getAnnouncements(): Announcement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ANNOUNCEMENTS);
      if (!data) {
        this.saveAnnouncements(INITIAL_ANNOUNCEMENTS);
        return INITIAL_ANNOUNCEMENTS;
      }
      const parsed: Announcement[] = JSON.parse(data);
      const updated = parsed.map((ann) => {
        const defaultReplacement = INITIAL_ANNOUNCEMENTS.find((d) => d.id === ann.id);
        if (
          defaultReplacement &&
          (ann.description.includes('الكلية البوليتكنك') ||
            ann.description.includes('التوجيهات الرسمية') ||
            ann.title.includes('الحساب الرسمي'))
        ) {
          return defaultReplacement;
        }
        return ann;
      });
      return updated;
    } catch {
      return INITIAL_ANNOUNCEMENTS;
    }
  }

  static saveAnnouncements(announcements: Announcement[]): void {
    localStorage.setItem(STORAGE_KEYS.ANNOUNCEMENTS, JSON.stringify(announcements));
  }

  static getMedia(): MediaItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MEDIA);
      if (!data) {
        this.saveMedia(INITIAL_MEDIA);
        return INITIAL_MEDIA;
      }
      const rawList: MediaItem[] = JSON.parse(data);
      const list = rawList.filter((m) => !DEMO_MEDIA_IDS.has(m.id));
      if (list.length !== rawList.length) {
        this.saveMedia(list);
      }
      return list;
    } catch {
      return INITIAL_MEDIA;
    }
  }

  static saveMedia(media: MediaItem[]): void {
    localStorage.setItem(STORAGE_KEYS.MEDIA, JSON.stringify(media));
  }

  static getPrivateMedia(graduateId: string): GraduatePrivateMedia[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRIVATE_MEDIA);
      const all: GraduatePrivateMedia[] = data ? JSON.parse(data) : [];
      return all.filter((item) => item.graduateId === graduateId && !DEMO_GRADUATE_IDS.has(item.graduateId));
    } catch {
      return [];
    }
  }

  static savePrivateMedia(item: GraduatePrivateMedia): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRIVATE_MEDIA);
      const all: GraduatePrivateMedia[] = data ? JSON.parse(data) : [];
      all.unshift(item);
      localStorage.setItem(STORAGE_KEYS.PRIVATE_MEDIA, JSON.stringify(all));
    } catch (e) {
      console.error('Failed to save private media', e);
    }
  }

  static deletePrivateMedia(graduateId: string, mediaId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRIVATE_MEDIA);
      const all: GraduatePrivateMedia[] = data ? JSON.parse(data) : [];
      const filtered = all.filter((item) => !(item.graduateId === graduateId && item.id === mediaId));
      localStorage.setItem(STORAGE_KEYS.PRIVATE_MEDIA, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete private media', e);
    }
  }

  static getFinancialLinkRequests(): FinancialLinkRequest[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FINANCIAL_LINK_REQUESTS);
      if (!data) return [];
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  static saveFinancialLinkRequests(requests: FinancialLinkRequest[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.FINANCIAL_LINK_REQUESTS, JSON.stringify(requests));
    } catch (e) {
      console.error('Failed to save financial link requests', e);
    }
  }

  static getSavedStudioDesigns(userId?: string): SavedStudioDesign[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_DESIGNS);
      const all: SavedStudioDesign[] = data ? JSON.parse(data) : [];
      if (!userId) return all;
      return all.filter((item) => item.userId === userId);
    } catch {
      return [];
    }
  }

  static saveStudioDesign(design: SavedStudioDesign): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_DESIGNS);
      const all: SavedStudioDesign[] = data ? JSON.parse(data) : [];
      const withoutExisting = all.filter((d) => d.id !== design.id);
      withoutExisting.unshift(design);
      localStorage.setItem(
        STORAGE_KEYS.SAVED_DESIGNS,
        JSON.stringify(withoutExisting.slice(0, 30))
      );
    } catch (e) {
      console.error('Failed to save studio design', e);
    }
  }

  static deleteStudioDesign(userId: string, designId: string): void {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVED_DESIGNS);
      const all: SavedStudioDesign[] = data ? JSON.parse(data) : [];
      const filtered = all.filter(
        (item) => !(item.userId === userId && item.id === designId)
      );
      localStorage.setItem(STORAGE_KEYS.SAVED_DESIGNS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to delete studio design', e);
    }
  }

  static getAuditLogs(): AuditLogEntry[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
        return INITIAL_AUDIT_LOGS;
      }
      const rawList: AuditLogEntry[] = JSON.parse(data);
      const list = rawList.filter((l) => !DEMO_AUDIT_LOG_IDS.has(l.id));
      if (list.length !== rawList.length) {
        localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(list));
      }
      return list;
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  static addAuditLog(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): void {
    try {
      const logs = this.getAuditLogs();
      const newEntry: AuditLogEntry = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        ...entry,
      };
      logs.unshift(newEntry);
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 150)));
    } catch (e) {
      console.error('Failed to add audit log', e);
    }
  }

  static getCurrentUserId(): string | null {
    const id = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (id && DEMO_GRADUATE_IDS.has(id)) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
      return null;
    }
    return id;
  }

  static setCurrentUserId(id: string | null): void {
    if (id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, id);
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }
  }

  // Export full backup JSON
  static exportFullBackupJSON(): string {
    const backup = {
      exportedAt: new Date().toISOString(),
      platform: 'معهد التمريض — دفعة 2027',
      config: this.getEventConfig(),
      graduates: this.getGraduates(),
      payments: this.getPayments(),
      announcements: this.getAnnouncements(),
      media: this.getMedia(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(backup, null, 2);
  }

  // Export graduates CSV (without any Total Fee columns per Requirement 3)
  static exportGraduatesCSV(): string {
    const grads = this.getGraduates();
    const headers = [
      'رقم القيد',
      'اللقب والاسم الكامل',
      'البريد الإلكتروني',
      'رقم الهاتف',
      'الدور',
      'الحالة',
      'حالة دفع السكراب',
      'المبلغ المدفوع للسكراب د.ع',
      'المبلغ المتبقي للسكراب د.ع',
      'حالة دفع التخرج',
      'المبلغ المدفوع للتخرج د.ع',
      'المبلغ المتبقي للتخرج د.ع',
      'إجمالي المبلغ المدفوع د.ع',
      'إجمالي المبلغ المتبقي د.ع',
      'تاريخ التسجيل',
    ];
    const rows = grads.map((g) => [
      `"${g.studentId || ''}"`,
      `"${g.displayTitle || g.fullName}"`,
      `"${g.email}"`,
      `"${g.phone}"`,
      `"${g.role}"`,
      `"${g.status}"`,
      `"${getPaymentStatusArabic(g.scrubStatus)}"`,
      g.scrubPaidIQD,
      g.scrubBalanceIQD,
      `"${getPaymentStatusArabic(g.gradStatus)}"`,
      g.gradPaidIQD,
      g.gradBalanceIQD,
      g.totalPaidIQD,
      g.remainingBalanceIQD,
      `"${g.createdAt}"`,
    ]);
    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  // Export payments CSV
  static exportPaymentsCSV(): string {
    const payments = this.getPayments();
    const headers = [
      'رقم الوصل',
      'اسم الخريج',
      'الفعالية',
      'نوع الدفعة',
      'المبلغ د.ع',
      'طريقة الدفع',
      'التاريخ',
      'الوقت',
      'بواسطة',
      'رمز المرجع',
      'الملاحظات',
    ];
    const rows = payments.map((p) => [
      `"${p.receiptNumber}"`,
      `"${p.graduateName}"`,
      `"${p.eventTarget === 'scrub_night' ? 'حفلة السكراب' : 'حفل التخرج الرسمي'}"`,
      `"${getPaymentStatusArabic(p.paymentStatus)}"`,
      p.amountIQD,
      `"${p.method === 'cash' ? 'نقدي (كاش)' : 'تحويل بنكي'}"`,
      `"${p.date}"`,
      `"${p.time}"`,
      `"${p.recordedBy}"`,
      `"${p.referenceCode}"`,
      `"${p.notes || ''}"`,
    ]);
    return '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}

// Format Iraqi Dinar nicely
export function formatIQD(amount: number): string {
  return new Intl.NumberFormat('ar-IQ').format(amount || 0) + ' د.ع';
}

// Format date in Arabic
export function formatArabicDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('ar-IQ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return dateStr;
  }
}
