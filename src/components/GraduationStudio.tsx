import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { StudioTemplateId, SavedStudioDesign } from '../types';
import {
  Camera,
  Download,
  Bookmark,
  Share2,
  Trash2,
  Move,
  ZoomIn,
  Type,
  Palette,
  Award,
  CheckCircle2,
  Lock,
  Image as ImageIcon,
  Sliders,
  RefreshCw,
  Eye,
  ExternalLink,
  FileText,
  Upload,
  Maximize2,
  X,
} from 'lucide-react';

export type StudioAspectRatio = '4:5' | '9:16' | '1:1';
export type PhotoCropShape = 'editorial_rect' | 'soft_arch' | 'circle' | 'full_bleed';
export type TextVerticalPosition = 'bottom' | 'top' | 'center';

interface RealisticTemplateDefinition {
  id: StudioTemplateId;
  categoryNumber: number;
  name: string;
  subtitle: string;
  categoryBadge: string;
  defaultAspect: StudioAspectRatio;
  defaultCropShape: PhotoCropShape;
  defaultBgColor: string;
  surfaceCardColor: string;
  primaryTextColor: string;
  secondaryTextColor: string;
  accentColor: string;
  borderStyle: 'minimal_line' | 'double_editorial' | 'studio_clean' | 'sash_accent';
  showSashBand: boolean;
  showCapIcon: boolean;
  showLarge2027: boolean;
  originalReferenceUrl?: string;
  originalReferenceLabel?: string;
}

/**
 * 10 Realistic, Clean Editorial & Studio Photography Templates
 * (Zero neon, zero glowing purple, zero artificial over-decorated frames)
 */
const REALISTIC_STUDIO_TEMPLATES: RealisticTemplateDefinition[] = [
  {
    id: 'turquoise_luxury',
    categoryNumber: 1,
    name: '1. صور تخرج شخصية احترافية',
    subtitle: 'تصميم بورتريه استوديو نظيف يبرز الصورة الشخصية بإضاءة متوازنة وتايبوغرافي هادئ',
    categoryBadge: 'بورتريه احترافي',
    defaultAspect: '4:5',
    defaultCropShape: 'editorial_rect',
    defaultBgColor: '#F4F1EA',
    surfaceCardColor: '#FFFFFF',
    primaryTextColor: '#182232',
    secondaryTextColor: '#475569',
    accentColor: '#1F7A70',
    borderStyle: 'minimal_line',
    showSashBand: false,
    showCapIcon: false,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/templates/?query=graduation-portrait-clean',
    originalReferenceLabel: 'CapCut / Canva Reference',
  },
  {
    id: 'portrait_grad_cap',
    categoryNumber: 2,
    name: '2. صور بورتريه بقبعة التخرج',
    subtitle: 'كادر بورتريه أكاديمي متوج بشعار قبعة التخرج الكلاسيكية وسنة التخرج 2027',
    categoryBadge: 'قبعة التخرج',
    defaultAspect: '4:5',
    defaultCropShape: 'soft_arch',
    defaultBgColor: '#182232',
    surfaceCardColor: '#1E293B',
    primaryTextColor: '#F8FAFC',
    secondaryTextColor: '#CBD5E1',
    accentColor: '#C5A872',
    borderStyle: 'double_editorial',
    showSashBand: false,
    showCapIcon: true,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.capcut.com/templates/graduation-portrait',
    originalReferenceLabel: 'CapCut Graduation Reference',
  },
  {
    id: 'indigo_cinematic',
    categoryNumber: 3,
    name: '3. تصاميم تخرج بخلفيات استوديو تصوير حقيقية المظهر',
    subtitle: 'يحاكي خلفيات ورق الاستوديو الفوتوغرافي الدافئة مع تظليل طبيعي ناعم خلف الصورة',
    categoryBadge: 'استوديو تصوير واقعي',
    defaultAspect: '4:5',
    defaultCropShape: 'editorial_rect',
    defaultBgColor: '#E5E2DC',
    surfaceCardColor: '#F8F6F2',
    primaryTextColor: '#1E293B',
    secondaryTextColor: '#475569',
    accentColor: '#2B3A4E',
    borderStyle: 'studio_clean',
    showSashBand: false,
    showCapIcon: false,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/templates/?query=studio-portrait-photography',
    originalReferenceLabel: 'Studio Backdrop Reference',
  },
  {
    id: 'nurse_stethoscope',
    categoryNumber: 4,
    name: '4. تصاميم تخرج بخلفيات بسيطة وفخمة',
    subtitle: 'خلفية عاجية فاخرة مع إطار خطي رفيع وتنسيق مستوحى من مطبوعات التخرج الأكاديمية',
    categoryBadge: 'بسيط وفخم',
    defaultAspect: '4:5',
    defaultCropShape: 'soft_arch',
    defaultBgColor: '#FAF8F4',
    surfaceCardColor: '#FFFFFF',
    primaryTextColor: '#16202E',
    secondaryTextColor: '#526071',
    accentColor: '#9E824C',
    borderStyle: 'double_editorial',
    showSashBand: false,
    showCapIcon: false,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/templates/?query=minimalist-graduation-announcement',
    originalReferenceLabel: 'Minimalist Luxury Reference',
  },
  {
    id: 'congrats_2027',
    categoryNumber: 5,
    name: '5. تصاميم تخرج بالوشاح التركوازي',
    subtitle: 'تصميم متناسق مع لون وشاح التمريض التركوازي الهادئ وهوية دفعة 2027',
    categoryBadge: 'الوشاح التركوازي',
    defaultAspect: '4:5',
    defaultCropShape: 'editorial_rect',
    defaultBgColor: '#12292D',
    surfaceCardColor: '#18363B',
    primaryTextColor: '#F8FAFC',
    secondaryTextColor: '#CCEAE7',
    accentColor: '#2A9D8F',
    borderStyle: 'sash_accent',
    showSashBand: true,
    showCapIcon: true,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/templates/?query=nursing-graduation-card',
    originalReferenceLabel: 'Nursing Graduation Reference',
  },
  {
    id: 'photo_name_quote',
    categoryNumber: 6,
    name: '6. تصاميم تخرج باللون النيلي والأسود والأبيض',
    subtitle: 'تناغم كلاسيكي رصين بين النيلي العميق والأسود والأبيض بأسلوب المجلات التحريرية',
    categoryBadge: 'نيلي وأسود وأبيض',
    defaultAspect: '4:5',
    defaultCropShape: 'editorial_rect',
    defaultBgColor: '#121824',
    surfaceCardColor: '#FFFFFF',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#CBD5E1',
    accentColor: '#94A3B8',
    borderStyle: 'minimal_line',
    showSashBand: false,
    showCapIcon: false,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/templates/?query=black-white-editorial-portrait',
    originalReferenceLabel: 'Editorial Monograph Reference',
  },
  {
    id: 'appreciation_certificate',
    categoryNumber: 7,
    name: '7. تصاميم مناسبة لمنشورات Instagram',
    subtitle: 'مقاس بورتريه 4:5 (1080×1350) مضبوط الأبعاد لمنشورات إنستغرام الرسمية بدون اقتصاص',
    categoryBadge: 'منشور Instagram 4:5',
    defaultAspect: '4:5',
    defaultCropShape: 'editorial_rect',
    defaultBgColor: '#F3F4F6',
    surfaceCardColor: '#FFFFFF',
    primaryTextColor: '#111827',
    secondaryTextColor: '#4B5563',
    accentColor: '#1F7A70',
    borderStyle: 'studio_clean',
    showSashBand: true,
    showCapIcon: false,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/instagram-posts/templates/graduation/',
    originalReferenceLabel: 'Instagram Post Template',
  },
  {
    id: 'instagram_story',
    categoryNumber: 8,
    name: '8. تصاميم مناسبة لقصص Instagram',
    subtitle: 'مقاس طولي كامل 9:16 (1080×1920) مخصص لقصص إنستغرام وTikTok وReels',
    categoryBadge: 'ستوري 9:16',
    defaultAspect: '9:16',
    defaultCropShape: 'soft_arch',
    defaultBgColor: '#16202E',
    surfaceCardColor: '#1E293B',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#CBD5E1',
    accentColor: '#2A9D8F',
    borderStyle: 'minimal_line',
    showSashBand: true,
    showCapIcon: true,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/instagram-stories/templates/graduation/',
    originalReferenceLabel: 'Instagram Story / CapCut 9:16',
  },
  {
    id: 'social_square',
    categoryNumber: 9,
    name: '9. تصاميم مربعة لصورة الحساب',
    subtitle: 'مقاس مربع 1:1 (1080×1080) مثالي للصورة الرمزية والمنشورات المربعة في جميع المنصات',
    categoryBadge: 'صورة حساب 1:1',
    defaultAspect: '1:1',
    defaultCropShape: 'circle',
    defaultBgColor: '#F7F5F0',
    surfaceCardColor: '#FFFFFF',
    primaryTextColor: '#182232',
    secondaryTextColor: '#475569',
    accentColor: '#1F7A70',
    borderStyle: 'double_editorial',
    showSashBand: false,
    showCapIcon: false,
    showLarge2027: false,
    originalReferenceUrl: 'https://www.canva.com/templates/?query=graduation-profile-picture',
    originalReferenceLabel: 'Profile Picture 1:1 Reference',
  },
  {
    id: 'group_collage',
    categoryNumber: 10,
    name: '10. تصاميم تحمل اسم الطالب وسنة التخرج 2027',
    subtitle: 'تصميم يبرز سنة التخرج 2027 بخط أكاديمي واضح مع اسم الطالب الثلاثي وصورته',
    categoryBadge: 'دفعة 2027',
    defaultAspect: '4:5',
    defaultCropShape: 'editorial_rect',
    defaultBgColor: '#1A2433',
    surfaceCardColor: '#233044',
    primaryTextColor: '#FFFFFF',
    secondaryTextColor: '#E2E8F0',
    accentColor: '#C5A872',
    borderStyle: 'double_editorial',
    showSashBand: true,
    showCapIcon: true,
    showLarge2027: true,
    originalReferenceUrl: 'https://www.capcut.com/templates/class-of-2027-graduation',
    originalReferenceLabel: 'Class of 2027 Reference',
  },
];

const STUDIO_BG_PRESETS = [
  { id: '#F4F1EA', label: 'ورق استوديو عاجي دافئ', color: '#F4F1EA', isLight: true },
  { id: '#E5E2DC', label: 'رمادي استوديو فوتوغرافي', color: '#E5E2DC', isLight: true },
  { id: '#FAF8F4', label: 'أبيض لؤلؤي كلاسيكي', color: '#FAF8F4', isLight: true },
  { id: '#182232', label: 'كحلي أكاديمي رصين', color: '#182232', isLight: false },
  { id: '#12292D', label: 'تركوازي استوديو داكن', color: '#12292D', isLight: false },
  { id: '#121824', label: 'أسود/نيلي مونوكروم', color: '#121824', isLight: false },
];

const TEXT_COLOR_PRESETS = [
  { id: '#182232', label: 'كحلي داكن', color: '#182232' },
  { id: '#FFFFFF', label: 'أبيض نقي', color: '#FFFFFF' },
  { id: '#1F7A70', label: 'تركوازي هادئ', color: '#1F7A70' },
  { id: '#9E824C', label: 'ذهبي أكاديمي هادئ', color: '#9E824C' },
  { id: '#334155', label: 'رمادي صخري', color: '#334155' },
];

const PRESET_QUOTES = [
  'رحلة علم، تعب، وذكريات تجمعنا — دفعة التمريض 2027',
  'الحمد لله الذي بنعمته تتم الصالحات.. تخرجنا لنكون عوناً وشفاءً لكل مريض',
  'بين سهر الليالي ونبض الإنسانية، نرفع اليوم قبعات التخرج بكل فخر — دفعة 2027',
  'دفعة التمريض 2027 • خطوة واثقة نحو مستقبل مهني وإنساني مشرق',
];

// ============================================================================
// INDEPENDENT APPRECIATION CERTIFICATES DEFINITIONS (5 FORMAL TYPES)
// ============================================================================

export type AppreciationCertificateTypeId =
  | 'student_appreciation'
  | 'thanks_and_recognition'
  | 'student_activity_participation'
  | 'graduation_congratulations'
  | 'supervisors_and_organizers';

interface CertificateTemplateOption {
  id: AppreciationCertificateTypeId;
  name: string;
  defaultTitle: string;
  defaultBody: string;
  paperColor: '#FFFFFF' | '#FAF8F3';
  borderColor: string;
  accentColor: string;
}

const CERTIFICATE_TYPES: CertificateTemplateOption[] = [
  {
    id: 'student_appreciation',
    name: '1. شهادة تقدير للطالب',
    defaultTitle: 'شهادة تقدير واعتزاز للطالب',
    defaultBody:
      'تُمنح هذه الشهادة تقديراً للالتزام العلمي والأخلاقي والجهود المتميزة خلال مسيرة الدراسة في قسم التمريض — دفعة 2027، مع خالص التمنيات بدوام التفوق والنجاح المهني.',
    paperColor: '#FAF8F3',
    borderColor: '#1B2A4A',
    accentColor: '#1F7A70',
  },
  {
    id: 'thanks_and_recognition',
    name: '2. شهادة شكر وتقدير',
    defaultTitle: 'شهادة شكر وتقدير',
    defaultBody:
      'نتقدم بخالص الشكر والتقدير على المساهمة الفاعلة وروح التعاون العالية التي كان لها أطيب الأثر في دعم زملاء الدفعة وإنجاح أنشطة تخرج دفعة التمريض 2027.',
    paperColor: '#FFFFFF',
    borderColor: '#1F7A70',
    accentColor: '#1B2A4A',
  },
  {
    id: 'student_activity_participation',
    name: '3. شهادة مشاركة في نشاط طلابي',
    defaultTitle: 'شهادة مشاركة في فعالية طلابية',
    defaultBody:
      'تُوثّق هذه الشهادة المشاركة الإيجابية والفاعلة في الأنشطة والفعاليات الطلابية الخاصة بدفعة التمريض 2027، مثمّنين روح المبادرة والعمل الجماعي.',
    paperColor: '#FAF8F3',
    borderColor: '#334155',
    accentColor: '#1F7A70',
  },
  {
    id: 'graduation_congratulations',
    name: '4. شهادة تهنئة بالتخرج',
    defaultTitle: 'شهادة تهنئة بمناسبة التخرج — دفعة 2027',
    defaultBody:
      'أسمى آيات التهاني والتبريكات بمناسبة التخرج ضمن دفعة التمريض لعام 2027، سائلين الله أن يجعل هذه الخطوة بداية لمسيرة حافلة بالعطاء الإنساني والمهني.',
    paperColor: '#FFFFFF',
    borderColor: '#1B2A4A',
    accentColor: '#8C6D3F',
  },
  {
    id: 'supervisors_and_organizers',
    name: '5. شهادة تقدير للمشرفين والمنظمين',
    defaultTitle: 'شهادة تقدير لفريق الإشراف والتنظيم',
    defaultBody:
      'تقديراً للجهود التنظيمية المخلصة والمتابعة المستمرة في تنسيق شؤون وفعاليات تخرج دفعة التمريض 2027 بكل أمانة ومسؤولية وتفانٍ.',
    paperColor: '#FAF8F3',
    borderColor: '#1B2A4A',
    accentColor: '#1F7A70',
  },
];

interface GraduationStudioProps {
  embedded?: boolean;
}

export const GraduationStudio: React.FC<GraduationStudioProps> = ({
  embedded = false,
}) => {
  const {
    currentUser,
    firebaseUser,
    savedDesigns,
    saveStudioDesign,
    deleteStudioDesign,
    submitGraduateMedia,
    navigateTo,
  } = useApp();

  // Main section switcher: 'photo_studio' | 'certificates' | 'saved_designs'
  const [activeMainSection, setActiveMainSection] = useState<
    'photo_studio' | 'certificates' | 'saved_designs'
  >('photo_studio');

  // ==========================================================================
  // PHOTO STUDIO STATE
  // ==========================================================================
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const primaryPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const customBgInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<StudioTemplateId>('turquoise_luxury');
  const [aspectRatio, setAspectRatio] = useState<StudioAspectRatio>('4:5');
  const [cropShape, setCropShape] = useState<PhotoCropShape>('editorial_rect');
  const [customName, setCustomName] = useState<string>(
    currentUser?.fullName || 'اسم الطالب الثلاثي'
  );
  const [customTitle, setCustomTitle] = useState<'nurse_m' | 'nurse_f'>(
    currentUser?.preferredTitle || 'nurse_m'
  );
  const [customQuote, setCustomQuote] = useState<string>(PRESET_QUOTES[0]);
  const [bgColor, setBgColor] = useState<string>('#F4F1EA');
  const [textColor, setTextColor] = useState<string>('#182232');
  const [textPosition, setTextPosition] =
    useState<TextVerticalPosition>('bottom');
  const [textOffsetY, setTextOffsetY] = useState<number>(0);

  const [sashStyle, setSashStyle] = useState<
    'turquoise_gold' | 'royal_navy' | 'champagne_luxury'
  >('turquoise_gold');
  const [showStethoscope, setShowStethoscope] = useState<boolean>(false);
  const [showGradCap, setShowGradCap] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<'Cairo' | 'Tajawal' | 'Amiri'>(
    'Cairo'
  );
  const [fontSize, setFontSize] = useState<number>(46);
  const [photoScale, setPhotoScale] = useState<number>(1);
  const [photoOffsetX, setPhotoOffsetX] = useState<number>(0);
  const [photoOffsetY, setPhotoOffsetY] = useState<number>(0);

  // Student personal photo & optional custom background photo
  const [primaryImageObj, setPrimaryImageObj] =
    useState<HTMLImageElement | null>(null);
  const [primaryPhotoUrl, setPrimaryPhotoUrl] = useState<string | null>(
    currentUser?.avatarUrl || null
  );
  const [customBgImageObj, setCustomBgImageObj] =
    useState<HTMLImageElement | null>(null);
  const [customBgUrl, setCustomBgUrl] = useState<string | null>(null);

  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewModalDataUrl, setPreviewModalDataUrl] = useState<string>('');
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showShareConfirmModal, setShowShareConfirmModal] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // ==========================================================================
  // APPRECIATION CERTIFICATES STATE
  // ==========================================================================
  const certCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const certLogoInputRef = useRef<HTMLInputElement | null>(null);
  const certStudentPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedCertTypeId, setSelectedCertTypeId] =
    useState<AppreciationCertificateTypeId>('student_appreciation');
  const [certRecipientName, setCertRecipientName] = useState<string>(
    currentUser?.fullName || 'اسم الطالب أو المستلم'
  );
  const [certTitleText, setCertTitleText] = useState<string>(
    CERTIFICATE_TYPES[0].defaultTitle
  );
  const [certBodyText, setCertBodyText] = useState<string>(
    CERTIFICATE_TYPES[0].defaultBody
  );
  const [certShowDate, setCertShowDate] = useState<boolean>(true);
  const [certDateText, setCertDateText] = useState<string>(
    () => new Date().toISOString().split('T')[0]
  );
  const [certShowIssuer, setCertShowIssuer] = useState<boolean>(true);
  const [certIssuerName, setCertIssuerName] = useState<string>(
    'فريق تنظيم دفعة التمريض 2027'
  );
  const [certShowSignature, setCertShowSignature] = useState<boolean>(true);
  const [certSignatureText, setCertSignatureText] = useState<string>(
    'لجنة تنظيم دفعة 2027'
  );
  const [certPaperBg, setCertPaperBg] = useState<'#FAF8F3' | '#FFFFFF'>('#FAF8F3');
  const [certAccentColor, setCertAccentColor] = useState<string>('#1B2A4A');
  const [certFontFamily, setCertFontFamily] = useState<'Amiri' | 'Cairo' | 'Tajawal'>('Amiri');
  const [certCustomLogoUrl, setCertCustomLogoUrl] = useState<string | null>(null);
  const [certCustomLogoObj, setCertCustomLogoObj] = useState<HTMLImageElement | null>(null);
  const [certStudentPhotoUrl, setCertStudentPhotoUrl] = useState<string | null>(null);
  const [certStudentPhotoObj, setCertStudentPhotoObj] = useState<HTMLImageElement | null>(null);

  const activeTemplate =
    REALISTIC_STUDIO_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    REALISTIC_STUDIO_TEMPLATES[0];

  const mySavedDesigns = savedDesigns.filter(
    (d) => d.userId === (firebaseUser?.uid || currentUser?.id)
  );

  // Sync user name if currentUser loads
  useEffect(() => {
    if (currentUser?.fullName) {
      if (customName === 'اسم الطالب الثلاثي') {
        setCustomName(currentUser.fullName);
      }
      if (certRecipientName === 'اسم الطالب أو المستلم') {
        setCertRecipientName(currentUser.fullName);
      }
    }
    if (currentUser?.preferredTitle) {
      setCustomTitle(currentUser.preferredTitle);
    }
  }, [currentUser?.fullName, currentUser?.preferredTitle]);

  // Apply template defaults when user picks a template card
  const handleSelectTemplate = (tpl: RealisticTemplateDefinition) => {
    setSelectedTemplateId(tpl.id);
    setAspectRatio(tpl.defaultAspect);
    setCropShape(tpl.defaultCropShape);
    setBgColor(tpl.defaultBgColor);
    setTextColor(tpl.primaryTextColor);
    setShowGradCap(tpl.showCapIcon);
  };

  // Apply certificate defaults when user picks a certificate type
  const handleSelectCertificateType = (cert: CertificateTemplateOption) => {
    setSelectedCertTypeId(cert.id);
    setCertTitleText(cert.defaultTitle);
    setCertBodyText(cert.defaultBody);
    setCertPaperBg(cert.paperColor);
    setCertAccentColor(cert.borderColor);
  };

  // Load primary photo into HTMLImageElement
  useEffect(() => {
    if (!primaryPhotoUrl) {
      setPrimaryImageObj(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setPrimaryImageObj(img);
    img.src = primaryPhotoUrl;
  }, [primaryPhotoUrl]);

  // Load custom background image into HTMLImageElement
  useEffect(() => {
    if (!customBgUrl) {
      setCustomBgImageObj(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setCustomBgImageObj(img);
    img.src = customBgUrl;
  }, [customBgUrl]);

  // Load optional user-owned certificate logo
  useEffect(() => {
    if (!certCustomLogoUrl) {
      setCertCustomLogoObj(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setCertCustomLogoObj(img);
    img.src = certCustomLogoUrl;
  }, [certCustomLogoUrl]);

  const handlePrimaryPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPrimaryPhotoUrl(reader.result);
        setPhotoScale(1);
        setPhotoOffsetX(0);
        setPhotoOffsetY(0);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCustomBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCustomBgUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCertLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCertCustomLogoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (!certStudentPhotoUrl) {
      setCertStudentPhotoObj(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => setCertStudentPhotoObj(img);
    img.src = certStudentPhotoUrl;
  }, [certStudentPhotoUrl]);

  const handleCertStudentPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCertStudentPhotoUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper to wrap Arabic text cleanly on Canvas
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines = 3
  ): number => {
    const words = text.trim().split(/\s+/);
    let line = '';
    const lines: string[] = [];
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        lines.push(line.trim());
        line = words[n] + ' ';
      } else {
        line = testLine;
      }
    }
    if (line.trim()) lines.push(line.trim());
    const finalLines = lines.slice(0, maxLines);
    finalLines.forEach((l, i) => {
      ctx.fillText(l, x, y + i * lineHeight);
    });
    return finalLines.length;
  };

  // Minimalist Academic Mortarboard Vector Icon
  const drawMinimalistGradCap = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    color: string,
    scale = 1
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(48, -6);
    ctx.lineTo(0, 10);
    ctx.lineTo(-48, -6);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-26, 2);
    ctx.lineTo(-22, 18);
    ctx.quadraticCurveTo(0, 26, 22, 18);
    ctx.lineTo(26, 2);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(28, -2);
    ctx.lineTo(38, 18);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  };

  // ==========================================================================
  // RENDER PHOTO STUDIO CANVAS (REALISTIC EDITORIAL & STUDIO AESTHETIC)
  // ==========================================================================
  const renderPhotoStudioCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1080;
    const h =
      aspectRatio === '9:16' ? 1920 : aspectRatio === '1:1' ? 1080 : 1350;
    canvas.width = w;
    canvas.height = h;

    // 1. Background Surface (Custom Uploaded Image OR Realistic Studio Backdrop)
    if (customBgImageObj && customBgImageObj.width > 0) {
      const bgScale = Math.max(
        w / customBgImageObj.width,
        h / customBgImageObj.height
      );
      const bw = customBgImageObj.width * bgScale;
      const bh = customBgImageObj.height * bgScale;
      ctx.drawImage(customBgImageObj, (w - bw) / 2, (h - bh) / 2, bw, bh);
      // Subtle neutral studio scrim for text legibility
      ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.fillRect(0, 0, w, h);
    } else {
      ctx.fillStyle = bgColor || activeTemplate.defaultBgColor;
      ctx.fillRect(0, 0, w, h);

      // Soft studio photography vignette lighting (natural studio paper lighting, zero neon)
      const studioLight = ctx.createRadialGradient(
        w * 0.5,
        h * 0.38,
        w * 0.05,
        w * 0.5,
        h * 0.45,
        w * 0.85
      );
      const isLightBg =
        bgColor === '#F4F1EA' ||
        bgColor === '#E5E2DC' ||
        bgColor === '#FAF8F4' ||
        bgColor === '#F3F4F6' ||
        bgColor === '#F7F5F0';
      if (isLightBg) {
        studioLight.addColorStop(0, 'rgba(255, 255, 255, 0.55)');
        studioLight.addColorStop(1, 'rgba(0, 0, 0, 0.06)');
      } else {
        studioLight.addColorStop(0, 'rgba(255, 255, 255, 0.07)');
        studioLight.addColorStop(1, 'rgba(0, 0, 0, 0.28)');
      }
      ctx.fillStyle = studioLight;
      ctx.fillRect(0, 0, w, h);
    }

    // 2. Editorial Hairline Framing (Clean, minimalist, non-intrusive)
    const pad = aspectRatio === '9:16' ? 54 : 44;
    ctx.save();
    ctx.strokeStyle = activeTemplate.accentColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    if (activeTemplate.borderStyle === 'double_editorial') {
      ctx.globalAlpha = 0.18;
      ctx.lineWidth = 1;
      ctx.strokeRect(pad + 12, pad + 12, w - (pad + 12) * 2, h - (pad + 12) * 2);
    }
    ctx.restore();

    // 3. Optional Turquoise Nursing Sash Accent Ribbon at Top/Bottom Edge
    if (activeTemplate.showSashBand || sashStyle === 'turquoise_gold') {
      ctx.save();
      const sashColor =
        sashStyle === 'turquoise_gold'
          ? '#1F7A70'
          : sashStyle === 'royal_navy'
          ? '#1E3A5F'
          : '#8C6D3F';
      ctx.fillStyle = sashColor;
      ctx.fillRect(pad, pad, w - pad * 2, 10);
      ctx.restore();
    }

    // 4. Top Editorial Header
    const headerY = aspectRatio === '9:16' ? 130 : 108;
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.85;
    ctx.font = `700 22px "${fontFamily}", sans-serif`;
    ctx.fillText('دفعة التمريض 2027 • CLASS OF 2027', w / 2, headerY);

    if (showGradCap) {
      drawMinimalistGradCap(
        ctx,
        w / 2,
        headerY + 46,
        activeTemplate.accentColor,
        0.85
      );
    }
    ctx.restore();

    // 5. Large Typographic "2027" for Category 10 (Clean Solid Editorial Heading)
    if (activeTemplate.showLarge2027) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = activeTemplate.accentColor;
      ctx.font = `900 ${aspectRatio === '9:16' ? 92 : 76}px "${fontFamily}", sans-serif`;
      ctx.fillText('2027', w / 2, headerY + (showGradCap ? 125 : 82));
      ctx.restore();
    }

    // 6. Calculate Photo Frame Geometry based on Aspect Ratio & Text Position
    const photoBoxW =
      cropShape === 'circle'
        ? aspectRatio === '1:1'
          ? 460
          : 540
        : aspectRatio === '1:1'
        ? 520
        : aspectRatio === '9:16'
        ? 740
        : 640;
    const photoBoxH =
      cropShape === 'circle'
        ? photoBoxW
        : aspectRatio === '1:1'
        ? 480
        : aspectRatio === '9:16'
        ? 880
        : 660;

    const photoX = (w - photoBoxW) / 2;
    let photoY =
      aspectRatio === '9:16'
        ? 310
        : aspectRatio === '1:1'
        ? 185
        : activeTemplate.showLarge2027
        ? 255
        : 200;

    if (textPosition === 'top') {
      photoY += aspectRatio === '9:16' ? 220 : 160;
    }

    // Soft realistic studio drop shadow behind photo frame
    ctx.save();
    ctx.shadowColor = 'rgba(15, 23, 42, 0.16)';
    ctx.shadowBlur = 32;
    ctx.shadowOffsetY = 12;
    ctx.fillStyle = activeTemplate.surfaceCardColor;

    ctx.beginPath();
    if (cropShape === 'circle') {
      ctx.arc(
        photoX + photoBoxW / 2,
        photoY + photoBoxH / 2,
        photoBoxW / 2,
        0,
        Math.PI * 2
      );
    } else if (cropShape === 'soft_arch') {
      const r = photoBoxW / 2;
      ctx.moveTo(photoX, photoY + r);
      ctx.arc(photoX + r, photoY + r, r, Math.PI, 0, false);
      ctx.lineTo(photoX + photoBoxW, photoY + photoBoxH - 24);
      ctx.quadraticCurveTo(
        photoX + photoBoxW,
        photoY + photoBoxH,
        photoX + photoBoxW - 24,
        photoY + photoBoxH
      );
      ctx.lineTo(photoX + 24, photoY + photoBoxH);
      ctx.quadraticCurveTo(
        photoX,
        photoY + photoBoxH,
        photoX,
        photoY + photoBoxH - 24
      );
      ctx.closePath();
    } else {
      ctx.roundRect(photoX, photoY, photoBoxW, photoBoxH, 20);
    }
    ctx.fill();
    ctx.restore();

    // Draw Student Photo Inside Frame (Preserving 100% authentic facial features)
    ctx.save();
    ctx.beginPath();
    if (cropShape === 'circle') {
      ctx.arc(
        photoX + photoBoxW / 2,
        photoY + photoBoxH / 2,
        photoBoxW / 2,
        0,
        Math.PI * 2
      );
    } else if (cropShape === 'soft_arch') {
      const r = photoBoxW / 2;
      ctx.moveTo(photoX, photoY + r);
      ctx.arc(photoX + r, photoY + r, r, Math.PI, 0, false);
      ctx.lineTo(photoX + photoBoxW, photoY + photoBoxH - 24);
      ctx.quadraticCurveTo(
        photoX + photoBoxW,
        photoY + photoBoxH,
        photoX + photoBoxW - 24,
        photoY + photoBoxH
      );
      ctx.lineTo(photoX + 24, photoY + photoBoxH);
      ctx.quadraticCurveTo(
        photoX,
        photoY + photoBoxH,
        photoX,
        photoY + photoBoxH - 24
      );
      ctx.closePath();
    } else {
      ctx.roundRect(photoX, photoY, photoBoxW, photoBoxH, 20);
    }
    ctx.clip();

    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(photoX, photoY, photoBoxW, photoBoxH);

    if (primaryImageObj && primaryImageObj.width > 0) {
      const baseScale = Math.max(
        photoBoxW / primaryImageObj.width,
        photoBoxH / primaryImageObj.height
      );
      const finalScale = baseScale * photoScale;
      const drawW = primaryImageObj.width * finalScale;
      const drawH = primaryImageObj.height * finalScale;
      const dx = photoX + (photoBoxW - drawW) / 2 + photoOffsetX;
      const dy = photoY + (photoBoxH - drawH) / 2 + photoOffsetY;
      ctx.drawImage(primaryImageObj, dx, dy, drawW, drawH);
    } else {
      // Clean minimalist studio placeholder
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(photoX, photoY, photoBoxW, photoBoxH);
      ctx.fillStyle = '#334155';
      ctx.textAlign = 'center';
      ctx.font = `700 28px "${fontFamily}", sans-serif`;
      ctx.fillText(
        'ارفع صورتك الشخصية هنا',
        photoX + photoBoxW / 2,
        photoY + photoBoxH / 2 - 12
      );
      ctx.fillStyle = '#64748B';
      ctx.font = `500 20px "${fontFamily}", sans-serif`;
      ctx.fillText(
        'معاينة استوديو واقعية بجودة أصلية',
        photoX + photoBoxW / 2,
        photoY + photoBoxH / 2 + 28
      );
    }
    ctx.restore();

    // Subtle 2px border around photo frame
    ctx.save();
    ctx.beginPath();
    if (cropShape === 'circle') {
      ctx.arc(
        photoX + photoBoxW / 2,
        photoY + photoBoxH / 2,
        photoBoxW / 2,
        0,
        Math.PI * 2
      );
    } else if (cropShape === 'soft_arch') {
      const r = photoBoxW / 2;
      ctx.moveTo(photoX, photoY + r);
      ctx.arc(photoX + r, photoY + r, r, Math.PI, 0, false);
      ctx.lineTo(photoX + photoBoxW, photoY + photoBoxH - 24);
      ctx.quadraticCurveTo(
        photoX + photoBoxW,
        photoY + photoBoxH,
        photoX + photoBoxW - 24,
        photoY + photoBoxH
      );
      ctx.lineTo(photoX + 24, photoY + photoBoxH);
      ctx.quadraticCurveTo(
        photoX,
        photoY + photoBoxH,
        photoX,
        photoY + photoBoxH - 24
      );
      ctx.closePath();
    } else {
      ctx.roundRect(photoX, photoY, photoBoxW, photoBoxH, 20);
    }
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = activeTemplate.accentColor;
    ctx.globalAlpha = 0.55;
    ctx.stroke();
    ctx.restore();

    // 7. Student Name, Nursing Title, and Short Graduation Quote
    const titlePrefix = customTitle === 'nurse_f' ? 'الممرضة' : 'الممرض';
    const fullTitledName = `${titlePrefix} ${customName.trim() || 'اسم الطالب الثلاثي'}`;

    let baseTextY =
      textPosition === 'top'
        ? headerY + (showGradCap ? 110 : 70)
        : textPosition === 'center'
        ? photoY + photoBoxH / 2
        : photoY + photoBoxH + (aspectRatio === '9:16' ? 110 : 78);

    baseTextY += textOffsetY;

    if (textPosition === 'center') {
      // Clean translucent editorial name band when centered over portrait
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      ctx.roundRect(w * 0.12, baseTextY - 58, w * 0.76, 155, 16);
      ctx.fill();
      ctx.restore();
    }

    const effectiveNameColor =
      textPosition === 'center' ? '#182232' : textColor;

    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = effectiveNameColor;
    ctx.font = `800 ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.fillText(fullTitledName, w / 2, baseTextY);

    // Subtitle line
    ctx.fillStyle = activeTemplate.accentColor;
    ctx.font = `700 22px "${fontFamily}", sans-serif`;
    ctx.fillText(
      'خريجو قسم التمريض • دفعة 2027',
      w / 2,
      baseTextY + 46
    );

    // Short Graduation Quote
    if (customQuote.trim() && textPosition !== 'center') {
      ctx.fillStyle = effectiveNameColor;
      ctx.globalAlpha = 0.82;
      ctx.font = `500 ${aspectRatio === '1:1' ? 21 : 24}px "${fontFamily}", sans-serif`;
      drawWrappedText(
        ctx,
        `« ${customQuote.trim()} »`,
        w / 2,
        baseTextY + 96,
        w - 180,
        38,
        2
      );
    }
    ctx.restore();

    // 8. Minimalist Footer Line
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = textColor;
    ctx.globalAlpha = 0.5;
    ctx.font = `600 17px "${fontFamily}", sans-serif`;
    ctx.fillText(
      'منصة تنظيم شؤون الدفعة • دفعة التمريض 2027',
      w / 2,
      h - pad - 18
    );
    ctx.restore();
  }, [
    activeTemplate,
    aspectRatio,
    bgColor,
    cropShape,
    customBgImageObj,
    customName,
    customQuote,
    customTitle,
    fontFamily,
    fontSize,
    photoOffsetX,
    photoOffsetY,
    photoScale,
    primaryImageObj,
    sashStyle,
    showGradCap,
    textColor,
    textOffsetY,
    textPosition,
  ]);

  useEffect(() => {
    if (activeMainSection === 'photo_studio') {
      renderPhotoStudioCanvas();
    }
  }, [activeMainSection, renderPhotoStudioCanvas]);

  // ==========================================================================
  // RENDER APPRECIATION CERTIFICATE CANVAS (CLEAN, FORMAL, MINIMALIST)
  // ==========================================================================
  const renderCertificateCanvas = useCallback(() => {
    const canvas = certCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High-resolution A4 Landscape proportion (1600 x 1130)
    const w = 1600;
    const h = 1130;
    canvas.width = w;
    canvas.height = h;

    // 1. Clean Paper Background (White or Light Ivory — Zero Neon)
    ctx.fillStyle = certPaperBg;
    ctx.fillRect(0, 0, w, h);

    // 2. Thin, Refined Formal Border (Double Hairline)
    const outerPad = 56;
    const innerPad = 70;
    ctx.save();
    ctx.strokeStyle = certAccentColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(outerPad, outerPad, w - outerPad * 2, h - outerPad * 2);

    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(innerPad, innerPad, w - innerPad * 2, h - innerPad * 2);
    ctx.restore();

    // Subtle corner ticks
    ctx.save();
    ctx.strokeStyle = certAccentColor;
    ctx.lineWidth = 2;
    const cornerLen = 28;
    // Top-left
    ctx.beginPath();
    ctx.moveTo(innerPad + 12, innerPad + 12 + cornerLen);
    ctx.lineTo(innerPad + 12, innerPad + 12);
    ctx.lineTo(innerPad + 12 + cornerLen, innerPad + 12);
    ctx.stroke();
    // Top-right
    ctx.beginPath();
    ctx.moveTo(w - innerPad - 12 - cornerLen, innerPad + 12);
    ctx.lineTo(w - innerPad - 12, innerPad + 12);
    ctx.lineTo(w - innerPad - 12, innerPad + 12 + cornerLen);
    ctx.stroke();
    // Bottom-left
    ctx.beginPath();
    ctx.moveTo(innerPad + 12, h - innerPad - 12 - cornerLen);
    ctx.lineTo(innerPad + 12, h - innerPad - 12);
    ctx.lineTo(innerPad + 12 + cornerLen, h - innerPad - 12);
    ctx.stroke();
    // Bottom-right
    ctx.beginPath();
    ctx.moveTo(w - innerPad - 12 - cornerLen, h - innerPad - 12);
    ctx.lineTo(w - innerPad - 12, h - innerPad - 12);
    ctx.lineTo(w - innerPad - 12, h - innerPad - 12 - cornerLen);
    ctx.stroke();
    ctx.restore();

    // 3. Optional User-Uploaded Logo OR Minimalist Academic Cap Icon
    const topCenterY = 175;
    if (certCustomLogoObj && certCustomLogoObj.width > 0) {
      const maxLogoH = 95;
      const scale = Math.min(1, maxLogoH / certCustomLogoObj.height);
      const lw = certCustomLogoObj.width * scale;
      const lh = certCustomLogoObj.height * scale;
      ctx.drawImage(certCustomLogoObj, (w - lw) / 2, 125, lw, lh);
    } else {
      drawMinimalistGradCap(ctx, w / 2, topCenterY, certAccentColor, 1.15);
    }

    // 4. Kicker Line
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#475569';
    ctx.font = `700 24px "${certFontFamily}", serif`;
    ctx.fillText('دفعة التمريض 2027 • NURSING COHORT 2027', w / 2, 265);

    // 5. Certificate Main Title
    ctx.fillStyle = certAccentColor;
    ctx.font = `900 54px "${certFontFamily}", serif`;
    ctx.fillText(certTitleText.trim() || 'شهادة تقدير', w / 2, 355);

    // Thin divider line under title
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 180, 390);
    ctx.lineTo(w / 2 + 180, 390);
    ctx.stroke();

    // 6. Recipient Intro & Name
    ctx.fillStyle = '#475569';
    ctx.font = `600 28px "${certFontFamily}", serif`;
    ctx.fillText('تُقدَّم هذه الشهادة بكل اعتزاز وتقدير إلى:', w / 2, 465);

    ctx.fillStyle = '#0F172A';
    ctx.font = `900 58px "${certFontFamily}", serif`;
    ctx.fillText(certRecipientName.trim() || 'اسم الطالب أو المستلم', w / 2, 555);

    // Subtle underline beneath recipient name
    ctx.strokeStyle = certAccentColor;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 280, 582);
    ctx.lineTo(w / 2 + 280, 582);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 7. Certificate Body Paragraph
    ctx.fillStyle = '#334155';
    ctx.font = `600 30px "${certFontFamily}", serif`;
    drawWrappedText(
      ctx,
      certBodyText.trim(),
      w / 2,
      655,
      w - 380,
      52,
      4
    );

    // 3b. Optional Student Portrait Photo (Clean Framed Portrait on Top Right)
    if (certStudentPhotoObj && certStudentPhotoObj.width > 0) {
      const photoSize = 155;
      const px = w - 265;
      const py = 135;
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(px, py, photoSize, photoSize, 20);
      ctx.clip();
      const scale = Math.max(
        photoSize / certStudentPhotoObj.width,
        photoSize / certStudentPhotoObj.height
      );
      const sw = certStudentPhotoObj.width * scale;
      const sh = certStudentPhotoObj.height * scale;
      ctx.drawImage(
        certStudentPhotoObj,
        px + (photoSize - sw) / 2,
        py + (photoSize - sh) / 2,
        sw,
        sh
      );
      ctx.restore();

      ctx.save();
      ctx.strokeStyle = certAccentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(px, py, photoSize, photoSize, 20);
      ctx.stroke();
      ctx.restore();
    }

    // 8. Optional Date, Optional Signature Text Box & Optional Organizer Text Footer
    const footerY = 935;
    if (certShowDate && certDateText.trim()) {
      ctx.textAlign = 'right';
      ctx.fillStyle = '#64748B';
      ctx.font = `600 22px "${certFontFamily}", sans-serif`;
      ctx.fillText('التاريخ:', w - 180, footerY - 36);
      ctx.fillStyle = '#1E293B';
      ctx.font = `700 25px "${certFontFamily}", sans-serif`;
      ctx.fillText(certDateText.trim(), w - 180, footerY);
    }

    if (certShowSignature && certSignatureText.trim()) {
      ctx.textAlign = 'center';
      ctx.fillStyle = '#64748B';
      ctx.font = `600 22px "${certFontFamily}", sans-serif`;
      ctx.fillText('التوقيع / الاعتماد التذكاري:', w / 2, footerY - 36);
      ctx.fillStyle = certAccentColor;
      ctx.font = `700 26px "${certFontFamily}", serif`;
      ctx.fillText(certSignatureText.trim(), w / 2, footerY);
      ctx.strokeStyle = '#94A3B8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(w / 2 - 110, footerY + 14);
      ctx.lineTo(w / 2 + 110, footerY + 14);
      ctx.stroke();
    }

    if (certShowIssuer && certIssuerName.trim()) {
      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = `600 22px "${certFontFamily}", sans-serif`;
      ctx.fillText('جهة التنظيم / الإشراف:', 180, footerY - 36);
      ctx.fillStyle = '#1E293B';
      ctx.font = `700 25px "${certFontFamily}", sans-serif`;
      ctx.fillText(certIssuerName.trim(), 180, footerY);
    }

    ctx.restore();
  }, [
    certAccentColor,
    certBodyText,
    certCustomLogoObj,
    certDateText,
    certFontFamily,
    certIssuerName,
    certPaperBg,
    certRecipientName,
    certShowDate,
    certShowIssuer,
    certShowSignature,
    certSignatureText,
    certStudentPhotoObj,
    certTitleText,
  ]);

  useEffect(() => {
    if (activeMainSection === 'certificates') {
      renderCertificateCanvas();
    }
  }, [activeMainSection, renderCertificateCanvas]);

  // ==========================================================================
  // EXPORT & SAVE HANDLERS
  // ==========================================================================

  const handleOpenPreviewModal = () => {
    const canvas =
      activeMainSection === 'certificates'
        ? certCanvasRef.current
        : canvasRef.current;
    if (!canvas) return;
    setPreviewModalDataUrl(canvas.toDataURL('image/png', 1.0));
    setShowPreviewModal(true);
  };

  const handleDownloadPhotoHighRes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const cleanSlug = (customName || 'nursing-2027').trim().replace(/\s+/g, '-');
    link.download = `تخرج-دفعة-2027-${cleanSlug}-${aspectRatio.replace(':', 'x')}.png`;
    link.href = dataUrl;
    link.click();
    setFeedbackNotice({
      type: 'success',
      text: 'تم تنزيل صورة التخرج بجودة عالية (PNG) إلى جهازك بنجاح!',
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleDownloadCertificatePNG = () => {
    const canvas = certCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const cleanSlug = (certRecipientName || 'certificate').trim().replace(/\s+/g, '-');
    link.download = `شهادة-تقدير-2027-${cleanSlug}.png`;
    link.href = dataUrl;
    link.click();
    setFeedbackNotice({
      type: 'success',
      text: 'تم تنزيل الشهادة بصيغة PNG عالية الدقة بنجاح!',
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  /**
   * Generates a valid standalone single-page Landscape PDF file directly from the Certificate Canvas JPEG bytes
   * without using window.open or external popup windows (works inside any iframe).
   */
  const handleDownloadCertificatePDF = () => {
    const canvas = certCanvasRef.current;
    if (!canvas) return;

    try {
      const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const base64Data = jpegDataUrl.split(',')[1];
      const binaryStr = atob(base64Data);
      const imgBytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        imgBytes[i] = binaryStr.charCodeAt(i);
      }

      // A4 Landscape dimensions in PDF points: 841.89 x 595.28
      const pageW = 842;
      const pageH = 595;
      const imgW = canvas.width;
      const imgH = canvas.height;

      const encoder = new TextEncoder();
      const chunks: Uint8Array[] = [];
      const offsets: number[] = [];
      let currentOffset = 0;

      const pushStr = (s: string) => {
        const b = encoder.encode(s);
        chunks.push(b);
        currentOffset += b.length;
      };
      const pushBytes = (b: Uint8Array) => {
        chunks.push(b);
        currentOffset += b.length;
      };
      const markObj = () => {
        offsets.push(currentOffset);
      };

      pushStr('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

      // 1: Catalog
      markObj();
      pushStr('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

      // 2: Pages
      markObj();
      pushStr('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

      // 3: Page
      markObj();
      pushStr(
        `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageW} ${pageH}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
      );

      // 4: Image XObject (DCTDecode JPEG)
      markObj();
      pushStr(
        `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${imgW} /Height ${imgH} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${imgBytes.length} >>\nstream\n`
      );
      pushBytes(imgBytes);
      pushStr('\nendstream\nendobj\n');

      // 5: Content Stream drawing the image across the full A4 Landscape page
      const contentStream = `q\n${pageW} 0 0 ${pageH} 0 0 cm\n/Im0 Do\nQ\n`;
      markObj();
      pushStr(
        `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
      );

      const xrefOffset = currentOffset;
      pushStr(`xref\n0 ${offsets.length + 1}\n0000000000 65535 f \n`);
      for (const off of offsets) {
        pushStr(`${String(off).padStart(10, '0')} 00000 n \n`);
      }
      pushStr(
        `trailer\n<< /Size ${offsets.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
      );

      const pdfBlob = new Blob(chunks as unknown as BlobPart[], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const cleanSlug = (certRecipientName || 'certificate').trim().replace(/\s+/g, '-');
      link.download = `شهادة-تقدير-2027-${cleanSlug}.pdf`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      setFeedbackNotice({
        type: 'success',
        text: 'تم توليد وتنزيل الشهادة بصيغة PDF جاهزة للطباعة بنجاح!',
      });
      setTimeout(() => setFeedbackNotice(null), 4000);
    } catch (e) {
      console.warn('PDF export fallback notice:', e);
      handleDownloadCertificatePNG();
    }
  };

  const handleSaveToMyAccount = async () => {
    if (!currentUser && !firebaseUser) {
      setFeedbackNotice({
        type: 'error',
        text: 'يرجى تسجيل الدخول بحسابك لحفظ التصميم في قسم «تصاميمي المحفوظة».',
      });
      return;
    }
    const canvas =
      activeMainSection === 'certificates'
        ? certCanvasRef.current
        : canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    try {
      const previewCanvas = document.createElement('canvas');
      const scaleFactor = 540 / canvas.width;
      previewCanvas.width = 540;
      previewCanvas.height = Math.round(canvas.height * scaleFactor);
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
      }
      const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.85);

      const res = await saveStudioDesign({
        templateId: selectedTemplateId,
        templateName:
          activeMainSection === 'certificates'
            ? certTitleText
            : activeTemplate.name,
        customName:
          activeMainSection === 'certificates' ? certRecipientName : customName,
        customTitle,
        customQuote:
          activeMainSection === 'certificates' ? certBodyText : customQuote,
        bgColor:
          activeMainSection === 'certificates' ? certPaperBg : bgColor,
        sashStyle,
        showStethoscope,
        showGradCap,
        fontFamily:
          activeMainSection === 'certificates' ? certFontFamily : fontFamily,
        fontSize,
        photoScale,
        photoOffsetX,
        photoOffsetY,
        previewDataUrl,
        isPrivate: true,
      });

      setFeedbackNotice({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      setTimeout(() => setFeedbackNotice(null), 4500);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoadSavedDesign = (design: SavedStudioDesign) => {
    setSelectedTemplateId(design.templateId);
    setCustomName(design.customName);
    setCustomTitle(design.customTitle);
    setCustomQuote(design.customQuote);
    setBgColor(design.bgColor);
    setSashStyle(design.sashStyle);
    setShowStethoscope(design.showStethoscope);
    setShowGradCap(design.showGradCap);
    setFontFamily(design.fontFamily);
    setFontSize(design.fontSize);
    setPhotoScale(design.photoScale);
    setPhotoOffsetX(design.photoOffsetX);
    setPhotoOffsetY(design.photoOffsetY);
    setActiveMainSection('photo_studio');
    setFeedbackNotice({
      type: 'success',
      text: `تم استرجاع التصميم «${design.templateName}» للمعاينة والتعديل.`,
    });
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleConfirmedShare = async (mode: 'device_share' | 'public_gallery') => {
    const canvas =
      activeMainSection === 'certificates'
        ? certCanvasRef.current
        : canvasRef.current;
    if (!canvas) return;
    setShowShareConfirmModal(false);

    if (mode === 'device_share') {
      try {
        const blob = await new Promise<Blob | null>((resolve) =>
          canvas.toBlob(resolve, 'image/png', 0.95)
        );
        if (blob && navigator.share) {
          const file = new File([blob], 'nursing-grad-2027.png', {
            type: 'image/png',
          });
          await navigator.share({
            title: 'تخرج دفعة التمريض 2027',
            text: `${customTitle === 'nurse_f' ? 'الممرضة' : 'الممرض'} ${customName} — دفعة التمريض 2027`,
            files: [file],
          });
          return;
        }
      } catch {
        // fallback to download
      }
      handleDownloadPhotoHighRes();
      return;
    }

    if (mode === 'public_gallery') {
      const previewCanvas = document.createElement('canvas');
      const scaleFactor = 720 / canvas.width;
      previewCanvas.width = 720;
      previewCanvas.height = Math.round(canvas.height * scaleFactor);
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
      }
      const dataUrl = previewCanvas.toDataURL('image/jpeg', 0.85);
      const res = submitGraduateMedia({
        title: `تصميم تخرج — ${customTitle === 'nurse_f' ? 'الممرضة' : 'الممرض'} ${customName}`,
        url: dataUrl,
        album: 'استوديو التخرج 2027',
        category: 'memories',
      });
      setFeedbackNotice({
        type: res.success ? 'success' : 'error',
        text: res.message,
      });
      setTimeout(() => setFeedbackNotice(null), 4500);
    }
  };

  return (
    <div
      className={`${
        embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12'
      } space-y-6 text-right`}
      dir="rtl"
    >
      {/* Clean Editorial Studio Header (No Neon / No Glowing Purple) */}
      <div className="rounded-3xl bg-[#111927] border border-slate-700/70 p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg bg-[#1F7A70]/20 border border-[#2A9D8F]/40 text-[#5EEAD4] text-xs font-bold">
              <Camera className="w-3.5 h-3.5" />
              <span>استوديو التخرج الفوتوغرافي وشهادات التقدير • دفعة 2027</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              قوالب صور تخرج واقعية وأنيقة + قسم شهادات التقدير المستقل
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              تصاميم فوتوغرافية حديثة وواقعية مستوحاة من أسلوب جلسات تصوير التخرج الحقيقية ومنشورات وقصص Instagram وCapCut، بالإضافة إلى قسم مستقل لتصميم وتنزيل شهادات التقدير الرسمية البسيطة بصيغتي PNG وPDF.
            </p>
          </div>

          {/* 3 Main Studio Sections Navigation */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveMainSection('photo_studio')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeMainSection === 'photo_studio'
                  ? 'bg-[#2A9D8F] text-white shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>قوالب صور التخرج (10 فئات)</span>
            </button>

            <button
              onClick={() => setActiveMainSection('certificates')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeMainSection === 'certificates'
                  ? 'bg-[#1E293B] text-[#F8FAFC] border-2 border-[#C5A872] shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Award className="w-4 h-4 text-[#C5A872]" />
              <span>شهادات التقدير (5 نماذج)</span>
            </button>

            <button
              onClick={() => setActiveMainSection('saved_designs')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeMainSection === 'saved_designs'
                  ? 'bg-slate-200 text-slate-900 shadow-md'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>تصاميمي المحفوظة ({mySavedDesigns.length})</span>
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#2A9D8F]" />
            <span>
              خصوصية تامة: صورك وشهاداتك تُعالج مباشرة في متصفحك مع الحفاظ الكامل على ملامح الصورة الأصلية ودقتها.
            </span>
          </div>
          {!currentUser && !firebaseUser && (
            <button
              onClick={() => navigateTo('login')}
              className="text-[#5EEAD4] font-bold underline hover:text-white cursor-pointer"
            >
              سجّل الدخول لحفظ تصاميمك في حسابك الشخصي
            </button>
          )}
        </div>
      </div>

      {feedbackNotice && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 ${
            feedbackNotice.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-red-500/15 border-red-500/40 text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{feedbackNotice.text}</span>
          </div>
          <button
            onClick={() => setFeedbackNotice(null)}
            className="text-white/70 hover:text-white cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 1: SAVED DESIGNS                                             */}
      {/* ==================================================================== */}
      {activeMainSection === 'saved_designs' && (
        <div className="rounded-3xl bg-[#111927] border border-slate-800 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">
                تصاميمي المحفوظة في الحساب ({mySavedDesigns.length})
              </h3>
              <p className="text-xs text-slate-400">
                جميع التصاميم المحفوظة هنا خاصة بحسابك الشخصي فقط. يمكنك استعادتها للتعديل أو تنزيلها في أي وقت.
              </p>
            </div>
            <button
              onClick={() => setActiveMainSection('photo_studio')}
              className="px-4 py-2 rounded-xl bg-[#2A9D8F] text-white font-extrabold text-xs cursor-pointer"
            >
              + تصميم صورة تخرج جديدة
            </button>
          </div>

          {mySavedDesigns.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#0B111B] border border-dashed border-slate-800 space-y-3">
              <Bookmark className="w-10 h-10 text-slate-500 mx-auto" />
              <p className="text-sm font-bold text-white">
                لا توجد تصاميم محفوظة في حسابك حتى الآن
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                قم بتخصيص أي قالب في استوديو التخرج أو قسم شهادات التقدير ثم اضغط على «حفظ في حسابي».
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mySavedDesigns.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl bg-[#0B111B] border border-slate-800 overflow-hidden flex flex-col justify-between hover:border-slate-600 transition"
                >
                  <div className="aspect-[4/5] bg-black/50 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={d.previewDataUrl}
                      alt={d.templateName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#5EEAD4] block">
                        {d.templateName}
                      </span>
                      <h4 className="text-sm font-black text-white truncate">
                        {d.customName}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        تاريخ الحفظ: {d.createdAt.split('T')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                      <button
                        onClick={() => handleLoadSavedDesign(d)}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>فتح وتعديل</span>
                      </button>
                      <a
                        href={d.previewDataUrl}
                        download={`تصميم-تخرج-${d.customName}.jpg`}
                        className="px-3 py-2 rounded-xl bg-[#2A9D8F] hover:opacity-90 text-white text-xs font-bold flex items-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        onClick={() => deleteStudioDesign(d.id)}
                        className="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 cursor-pointer"
                        title="حذف التصميم"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 2: INDEPENDENT APPRECIATION CERTIFICATES («شهادات التقدير») */}
      {/* ==================================================================== */}
      {activeMainSection === 'certificates' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column (6 cols) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Step 1: 5 Formal Certificate Types */}
            <div className="rounded-3xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-[#C5A872]" />
                  <span>1. اختر نوع شهادة التقدير (5 نماذج رسمية هادئة)</span>
                </h3>
                <span className="text-[11px] text-slate-400">
                  خلفية بيضاء أو عاجية • بدون زخارف مبالغ فيها
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CERTIFICATE_TYPES.map((cert) => {
                  const isSelected = cert.id === selectedCertTypeId;
                  return (
                    <button
                      key={cert.id}
                      type="button"
                      onClick={() => handleSelectCertificateType(cert)}
                      className={`p-3.5 rounded-2xl border text-right transition flex flex-col justify-between gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-[#C5A872] shadow-md'
                          : 'bg-[#0B111B] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black text-white">
                          {cert.name}
                        </span>
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-slate-400 shrink-0"
                          style={{ backgroundColor: cert.paperColor }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 line-clamp-1">
                        {cert.defaultTitle}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Certificate Text & Optional Fields */}
            <div className="rounded-3xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2A9D8F]" />
                <span>2. تخصيص نصوص الشهادة والشعار الاختياري</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    اسم الطالب أو المستلم
                  </label>
                  <input
                    type="text"
                    value={certRecipientName}
                    onChange={(e) => setCertRecipientName(e.target.value)}
                    placeholder="اكتب اسم الطالب أو المستلم..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    عنوان الشهادة
                  </label>
                  <input
                    type="text"
                    value={certTitleText}
                    onChange={(e) => setCertTitleText(e.target.value)}
                    placeholder="عنوان الشهادة..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  نص الشهادة القصير
                </label>
                <textarea
                  rows={3}
                  value={certBodyText}
                  onChange={(e) => setCertBodyText(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs leading-relaxed focus:outline-none focus:border-[#2A9D8F]"
                />
              </div>

              {/* Optional Date & Optional Organizer Text */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certShowDate}
                      onChange={(e) => setCertShowDate(e.target.checked)}
                      className="rounded accent-[#2A9D8F]"
                    />
                    <span>إضافة التاريخ (اختياري)</span>
                  </label>
                  {certShowDate && (
                    <input
                      type="text"
                      value={certDateText}
                      onChange={(e) => setCertDateText(e.target.value)}
                      placeholder="مثال: 2027/05/15"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs font-mono"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certShowIssuer}
                      onChange={(e) => setCertShowIssuer(e.target.checked)}
                      className="rounded accent-[#2A9D8F]"
                    />
                    <span>إضافة اسم جهة التنظيم نصياً (اختياري)</span>
                  </label>
                  {certShowIssuer && (
                    <input
                      type="text"
                      value={certIssuerName}
                      onChange={(e) => setCertIssuerName(e.target.value)}
                      placeholder="فريق تنظيم دفعة التمريض 2027"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Paper Color, Accent Border Color, Font, and User-Owned Logo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    لون خلفية الشهادة
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setCertPaperBg('#FAF8F3')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        certPaperBg === '#FAF8F3'
                          ? 'bg-[#FAF8F3] text-slate-900 border-[#C5A872]'
                          : 'bg-[#0B111B] text-slate-300 border-slate-700'
                      }`}
                    >
                      عاجي فاتح
                    </button>
                    <button
                      type="button"
                      onClick={() => setCertPaperBg('#FFFFFF')}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        certPaperBg === '#FFFFFF'
                          ? 'bg-white text-slate-900 border-[#2A9D8F]'
                          : 'bg-[#0B111B] text-slate-300 border-slate-700'
                      }`}
                    >
                      أبيض نقي
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    اللون الهادئ للإطار والعنوان
                  </span>
                  <div className="flex items-center gap-2">
                    {[
                      { id: '#1B2A4A', label: 'كحلي' },
                      { id: '#1F7A70', label: 'تركوازي هادئ' },
                      { id: '#334155', label: 'رمادي رسمي' },
                    ].map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setCertAccentColor(c.id)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold border cursor-pointer ${
                          certAccentColor === c.id
                            ? 'border-white text-white'
                            : 'border-slate-700 text-slate-300'
                        }`}
                        style={{ backgroundColor: c.id }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-[11px] font-bold text-slate-300 block">
                    الخط العربي للشهادة
                  </span>
                  <select
                    value={certFontFamily}
                    onChange={(e) =>
                      setCertFontFamily(e.target.value as 'Amiri' | 'Cairo' | 'Tajawal')
                    }
                    className="w-full px-3 py-2 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs font-bold"
                  >
                    <option value="Amiri">خط أميري (Amiri كلاسيكي)</option>
                    <option value="Cairo">خط القاهرة (Cairo حديث)</option>
                    <option value="Tajawal">خط تجوال (Tajawal ناعم)</option>
                  </select>
                </div>
              </div>

              {/* Optional Signature Text & Student Portrait Photo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={certShowSignature}
                      onChange={(e) => setCertShowSignature(e.target.checked)}
                      className="rounded accent-[#2A9D8F]"
                    />
                    <span>خانة توقيع نصية (اختياري)</span>
                  </label>
                  {certShowSignature && (
                    <input
                      type="text"
                      value={certSignatureText}
                      onChange={(e) => setCertSignatureText(e.target.value)}
                      placeholder="مثال: لجنة تنظيم دفعة 2027"
                      className="w-full px-3 py-2 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">
                    صورة الطالب على الشهادة (اختياري)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      ref={certStudentPhotoInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCertStudentPhotoUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => certStudentPhotoInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5 text-[#2A9D8F]" />
                      <span>
                        {certStudentPhotoUrl ? 'تغيير صورة الطالب' : 'إضافة صورة الطالب'}
                      </span>
                    </button>
                    {certStudentPhotoUrl && (
                      <button
                        type="button"
                        onClick={() => setCertStudentPhotoUrl(null)}
                        className="px-3 py-2 rounded-xl bg-red-500/15 text-red-300 text-xs font-bold cursor-pointer"
                      >
                        إزالة
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Optional User-Owned Custom Logo */}
              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-slate-200 block">
                    رفع شعار اختياري (تملكه أو تملك حق استخدامه)
                  </span>
                  <span className="text-[10px] text-slate-400 block">
                    لا يتم استخدام أي أختام أو تواقيع رسمية غير مفوضة.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={certLogoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCertLogoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => certLogoInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#2A9D8F]" />
                    <span>{certCustomLogoUrl ? 'تغيير الشعار' : 'رفع شعار اختياري'}</span>
                  </button>
                  {certCustomLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setCertCustomLogoUrl(null)}
                      className="px-3 py-2 rounded-xl bg-red-500/15 text-red-300 text-xs font-bold cursor-pointer"
                    >
                      إزالة
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Live Certificate Preview & Download Column (6 cols) */}
          <div className="lg:col-span-6 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-3xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-5 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white">
                    المعاينة الحية لشهادة التقدير
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    مقاس أفقي رسمي عالي الدقة (1600×1130) جاهز للتنزيل بصيغتي PNG وPDF
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPreviewModal}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>تكبير المعاينة</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#0B111B] p-3 border border-slate-800 flex items-center justify-center overflow-hidden">
                <canvas
                  ref={certCanvasRef}
                  className="w-full h-auto max-h-[420px] object-contain rounded-lg shadow-lg"
                />
              </div>

              {/* Certificate Download & Save Actions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleDownloadCertificatePNG}
                  className="py-3 px-4 rounded-xl bg-[#2A9D8F] hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل بصيغة PNG</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadCertificatePDF}
                  className="py-3 px-4 rounded-xl bg-[#1E293B] hover:bg-slate-700 text-white font-extrabold text-xs border border-[#C5A872]/60 flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-[#C5A872]" />
                  <span>تنزيل بصيغة PDF</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToMyAccount}
                  disabled={isSaving}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Bookmark className="w-4 h-4 text-[#5EEAD4]" />
                  <span>{isSaving ? 'جارِ الحفظ...' : 'حفظ في حسابي'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SECTION 3: REALISTIC PHOTO STUDIO (10 TEMPLATE CATEGORIES & EDITOR)  */}
      {/* ==================================================================== */}
      {activeMainSection === 'photo_studio' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls & 10 Templates Gallery (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: 10 Realistic Template Categories Gallery */}
            <div className="rounded-3xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Palette className="w-4 h-4 text-[#2A9D8F]" />
                    <span>1. معرض قوالب التخرج الحديثة والواقعية (10 فئات)</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    اختر القالب المناسب لمعاينته وتخصيصه مباشرة، أو افتح مرجع القالب الأصلي في تبويب جديد.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[430px] overflow-y-auto pr-1">
                {REALISTIC_STUDIO_TEMPLATES.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <div
                      key={tpl.id}
                      onClick={() => handleSelectTemplate(tpl)}
                      className={`p-3.5 rounded-2xl border transition flex flex-col justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-slate-800/90 border-[#2A9D8F] shadow-md'
                          : 'bg-[#0B111B] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {/* Visual Mini Preview Swatch */}
                        <div
                          className="w-14 h-16 rounded-xl border border-slate-600/50 shrink-0 flex flex-col items-center justify-between p-1.5 overflow-hidden shadow-inner"
                          style={{ backgroundColor: tpl.defaultBgColor }}
                        >
                          <span
                            className="w-full h-1 rounded-full"
                            style={{ backgroundColor: tpl.accentColor }}
                          />
                          <div
                            className={`w-7 h-8 border ${
                              tpl.defaultCropShape === 'circle'
                                ? 'rounded-full'
                                : tpl.defaultCropShape === 'soft_arch'
                                ? 'rounded-t-full'
                                : 'rounded-sm'
                            }`}
                            style={{
                              backgroundColor: tpl.surfaceCardColor,
                              borderColor: tpl.accentColor,
                            }}
                          />
                          <span
                            className="text-[7px] font-black font-mono"
                            style={{ color: tpl.primaryTextColor }}
                          >
                            2027
                          </span>
                        </div>

                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-[#5EEAD4] text-[10px] font-bold">
                              {tpl.categoryBadge}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {tpl.defaultAspect}
                            </span>
                          </div>
                          <h4 className="text-xs font-black text-white leading-snug">
                            {tpl.name}
                          </h4>
                          <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                            {tpl.subtitle}
                          </p>
                        </div>
                      </div>

                      {tpl.originalReferenceUrl && (
                        <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <span className="text-[10px] text-slate-400">
                            {isSelected ? '✓ القالب قيد المعاينة حالياً' : 'اضغط لتطبيق القالب'}
                          </span>
                          <a
                            href={tpl.originalReferenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold flex items-center gap-1 border border-slate-700"
                          >
                            <span>استخدام القالب الأصلي</span>
                            <ExternalLink className="w-3 h-3 text-[#5EEAD4]" />
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Upload Photo, Crop/Position/Zoom & Custom Background */}
            <div className="rounded-3xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-5">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-[#2A9D8F]" />
                <span>2. رفع الصورة الشخصية، القص والتموضع، وتغيير الخلفية</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    ref={primaryPhotoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePrimaryPhotoUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => primaryPhotoInputRef.current?.click()}
                    className="w-full py-3 px-4 rounded-2xl bg-[#2A9D8F] hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>
                      {primaryPhotoUrl ? 'تغيير صورتك الشخصية' : 'رفع صورتك الشخصية'}
                    </span>
                  </button>
                </div>

                <div>
                  <input
                    ref={customBgInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleCustomBgUpload}
                    className="hidden"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => customBgInputRef.current?.click()}
                      className="flex-1 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Upload className="w-4 h-4 text-[#5EEAD4]" />
                      <span>
                        {customBgUrl ? 'تغيير صورة الخلفية' : 'رفع خلفية من جهازك'}
                      </span>
                    </button>
                    {customBgUrl && (
                      <button
                        type="button"
                        onClick={() => setCustomBgUrl(null)}
                        className="py-3 px-3 rounded-2xl bg-red-500/15 text-red-300 text-xs font-bold cursor-pointer"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Aspect Ratio & Crop Frame Shape */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    المقاس (منشور / قصة / مربع)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '4:5', label: 'منشور 4:5' },
                      { id: '9:16', label: 'ستوري 9:16' },
                      { id: '1:1', label: 'مربع 1:1' },
                    ].map((ar) => (
                      <button
                        key={ar.id}
                        type="button"
                        onClick={() => setAspectRatio(ar.id as StudioAspectRatio)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          aspectRatio === ar.id
                            ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                            : 'bg-[#0B111B] text-slate-300 border-slate-800'
                        }`}
                      >
                        {ar.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    شكل قص كادر الصورة
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'editorial_rect', label: 'بورتريه مستطيل' },
                      { id: 'soft_arch', label: 'قوس استوديو' },
                      { id: 'circle', label: 'دائري' },
                    ].map((sh) => (
                      <button
                        key={sh.id}
                        type="button"
                        onClick={() => setCropShape(sh.id as PhotoCropShape)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          cropShape === sh.id
                            ? 'bg-slate-200 text-slate-900 border-white'
                            : 'bg-[#0B111B] text-slate-300 border-slate-800'
                        }`}
                      >
                        {sh.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Photo Zoom & X/Y Pan Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300 font-bold">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-[#5EEAD4]" />
                      تكبير الصورة
                    </span>
                    <span className="font-mono">{Math.round(photoScale * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.6"
                    max="2.4"
                    step="0.05"
                    value={photoScale}
                    onChange={(e) => setPhotoScale(Number(e.target.value))}
                    className="w-full accent-[#2A9D8F]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300 font-bold">
                    <span className="flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-[#5EEAD4]" />
                      موضع أفقي (يمين/يسار)
                    </span>
                    <span className="font-mono">{photoOffsetX}px</span>
                  </div>
                  <input
                    type="range"
                    min="-260"
                    max="260"
                    step="5"
                    value={photoOffsetX}
                    onChange={(e) => setPhotoOffsetX(Number(e.target.value))}
                    className="w-full accent-[#2A9D8F]"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300 font-bold">
                    <span className="flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-[#5EEAD4]" />
                      موضع عمودي (أعلى/أسفل)
                    </span>
                    <span className="font-mono">{photoOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-260"
                    max="260"
                    step="5"
                    value={photoOffsetY}
                    onChange={(e) => setPhotoOffsetY(Number(e.target.value))}
                    className="w-full accent-[#2A9D8F]"
                  />
                </div>
              </div>

              {/* Studio Backdrop Color Presets */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300">
                    خلفيات استوديو التصوير المسموحة (بدون نيون)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoScale(1);
                      setPhotoOffsetX(0);
                      setPhotoOffsetY(0);
                      setTextOffsetY(0);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إعادة ضبط التموضع</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {STUDIO_BG_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => {
                        setCustomBgUrl(null);
                        setBgColor(preset.color);
                        setTextColor(preset.isLight ? '#182232' : '#FFFFFF');
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 cursor-pointer ${
                        bgColor === preset.color && !customBgUrl
                          ? 'border-[#2A9D8F] bg-slate-800 text-white'
                          : 'border-slate-800 bg-[#0B111B] text-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-slate-500 shrink-0"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="truncate">{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Arabic Name, Typography, Size, Color, Position & Quote */}
            <div className="rounded-3xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-[#2A9D8F]" />
                <span>3. الاسم بالعربية، الخطوط، حجم ولون ومكان النص، وعبارة التخرج</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    اسم الطالب / الخريج باللغة العربية
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="اكتب اسمك الثلاثي..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs font-bold focus:outline-none focus:border-[#2A9D8F]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    اللقب المهني
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomTitle('nurse_m')}
                      className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        customTitle === 'nurse_m'
                          ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                          : 'bg-[#0B111B] text-slate-300 border-slate-800'
                      }`}
                    >
                      الممرض
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomTitle('nurse_f')}
                      className={`py-2.5 rounded-xl text-xs font-bold border cursor-pointer ${
                        customTitle === 'nurse_f'
                          ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                          : 'bg-[#0B111B] text-slate-300 border-slate-800'
                      }`}
                    >
                      الممرضة
                    </button>
                  </div>
                </div>
              </div>

              {/* Font Family, Font Size, Text Position, Text Color */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    الخط العربي
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['Cairo', 'Tajawal', 'Amiri'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFontFamily(f)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          fontFamily === f
                            ? 'bg-slate-200 text-slate-900 border-white'
                            : 'bg-[#0B111B] text-slate-300 border-slate-800'
                        }`}
                      >
                        {f === 'Cairo' ? 'القاهرة' : f === 'Tajawal' ? 'تجوال' : 'أميري'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    مكان النص في التصميم
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: 'bottom', label: 'أسفل الصورة' },
                      { id: 'top', label: 'أعلى الصورة' },
                      { id: 'center', label: 'وسط الصورة' },
                    ].map((pos) => (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => setTextPosition(pos.id as TextVerticalPosition)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          textPosition === pos.id
                            ? 'bg-[#2A9D8F] text-white border-[#2A9D8F]'
                            : 'bg-[#0B111B] text-slate-300 border-slate-800'
                        }`}
                      >
                        {pos.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>حجم النص</span>
                    <span className="font-mono">{fontSize}px</span>
                  </div>
                  <input
                    type="range"
                    min="32"
                    max="68"
                    step="2"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    className="w-full accent-[#2A9D8F]"
                  />
                </div>
              </div>

              {/* Text Color & Fine Vertical Offset */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-800">
                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-slate-300 block">
                    لون النص
                  </span>
                  <div className="flex items-center gap-2">
                    {TEXT_COLOR_PRESETS.map((tc) => (
                      <button
                        key={tc.id}
                        type="button"
                        onClick={() => setTextColor(tc.color)}
                        className={`px-3 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 cursor-pointer ${
                          textColor === tc.color
                            ? 'border-[#2A9D8F] bg-slate-800 text-white'
                            : 'border-slate-800 bg-[#0B111B] text-slate-300'
                        }`}
                      >
                        <span
                          className="w-3 h-3 rounded-full border border-slate-500"
                          style={{ backgroundColor: tc.color }}
                        />
                        <span>{tc.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-300">
                    <span>ضبط ارتفاع النص عمودياً</span>
                    <span className="font-mono">{textOffsetY}px</span>
                  </div>
                  <input
                    type="range"
                    min="-120"
                    max="120"
                    step="5"
                    value={textOffsetY}
                    onChange={(e) => setTextOffsetY(Number(e.target.value))}
                    className="w-full accent-[#2A9D8F]"
                  />
                </div>
              </div>

              {/* Short Graduation Quote */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="text-xs font-bold text-slate-300 block">
                  عبارة التخرج القصيرة
                </label>
                <input
                  type="text"
                  value={customQuote}
                  onChange={(e) => setCustomQuote(e.target.value)}
                  placeholder="اكتب عبارة تخرج قصيرة..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#0B111B] border border-slate-700 text-white text-xs focus:outline-none focus:border-[#2A9D8F]"
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUOTES.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomQuote(q)}
                      className="px-2.5 py-1 rounded-lg bg-[#0B111B] hover:bg-slate-800 text-slate-300 text-[10px] border border-slate-800 cursor-pointer"
                    >
                      عبارة مقترحة #{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Live Canvas Preview & Export Column (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-3xl bg-[#111927] border border-slate-800 p-5 sm:p-6 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[11px] font-bold text-[#5EEAD4] block">
                    المعاينة الحية قبل الحفظ والتنزيل ({aspectRatio})
                  </span>
                  <h3 className="text-sm font-black text-white">
                    {activeTemplate.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={handleOpenPreviewModal}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>معاينة مكبرة</span>
                </button>
              </div>

              <div className="rounded-2xl bg-[#0B111B] p-3 border border-slate-800 flex items-center justify-center overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto max-h-[500px] object-contain rounded-xl shadow-lg"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadPhotoHighRes}
                  className="w-full py-3.5 px-4 rounded-2xl bg-[#2A9D8F] hover:opacity-95 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل الصورة بجودة عالية (PNG)</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleSaveToMyAccount}
                    disabled={isSaving}
                    className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-[#5EEAD4]" />
                    <span>{isSaving ? 'جارِ الحفظ...' : 'حفظ في حسابي'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShareConfirmModal(true)}
                    className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-[#C5A872]" />
                    <span>مشاركة التصميم</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Preview Modal */}
      {showPreviewModal && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowPreviewModal(false)}
        >
          <div
            className="max-w-3xl w-full bg-[#111927] border border-slate-700 rounded-3xl p-4 sm:p-6 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="text-sm font-black text-white">
                معاينة التصميم بالحجم الكامل قبل التنزيل
              </h4>
              <button
                type="button"
                onClick={() => setShowPreviewModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-[#0B111B] rounded-2xl p-3">
              <img
                src={previewModalDataUrl}
                alt="Preview"
                className="max-h-[70vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setShowPreviewModal(false);
                  if (activeMainSection === 'certificates') {
                    handleDownloadCertificatePNG();
                  } else {
                    handleDownloadPhotoHighRes();
                  }
                }}
                className="px-5 py-2.5 rounded-xl bg-[#2A9D8F] text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>تنزيل بجودة عالية الآن</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Explicit Share Confirmation Modal */}
      {showShareConfirmModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowShareConfirmModal(false)}
        >
          <div
            className="max-w-md w-full rounded-3xl bg-[#111927] border border-slate-700 p-6 space-y-4 text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-black text-white">
              خيارات مشاركة التصميم
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              تصميمك محفوظ بخصوصية تامة. اختر طريقة المشاركة التي تفضلها:
            </p>
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleConfirmedShare('device_share')}
                className="w-full py-3 px-4 rounded-xl bg-[#2A9D8F] text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة عبر تطبيقات جهازك (Instagram / WhatsApp)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmedShare('public_gallery')}
                className="w-full py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-[#C5A872]" />
                <span>إرسال لمعرض ذكريات الدفعة (بموافقتي)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowShareConfirmModal(false)}
                className="w-full py-2.5 rounded-xl bg-transparent text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
