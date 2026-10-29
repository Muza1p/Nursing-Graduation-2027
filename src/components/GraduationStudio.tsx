import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { StudioTemplateId, SavedStudioDesign } from '../types';
import {
  Camera,
  Download,
  Sparkles,
  Bookmark,
  Share2,
  Trash2,
  Move,
  ZoomIn,
  Type,
  Palette,
  Award,
  Stethoscope,
  GraduationCap,
  CheckCircle2,
  Lock,
  Image as ImageIcon,
  Sliders,
  RefreshCw,
  Eye,
} from 'lucide-react';

interface TemplateDefinition {
  id: StudioTemplateId;
  name: string;
  subtitle: string;
  badge: string;
  width: number;
  height: number;
  aspectLabel: string;
  defaultBg: string;
  accentColor: string;
  secondaryColor: string;
}

const STUDIO_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'turquoise_luxury',
    name: 'قالب تخرج فاخر باللون التركوازي',
    subtitle: 'إطار ملكي تركوازي مذهب مع وشاح التمريض',
    badge: 'الأكثر اختياراً',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5 بورتريه',
    defaultBg: '#07171B',
    accentColor: '#35D6C5',
    secondaryColor: '#D7B875',
  },
  {
    id: 'indigo_cinematic',
    name: 'قالب نيلي مع إضاءة سينمائية',
    subtitle: 'تدرج نيلي عميق مع هالة ضوئية سينمائية فاخرة',
    badge: 'سينمائي',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5 بورتريه',
    defaultBg: '#0A0D18',
    accentColor: '#38BDF8',
    secondaryColor: '#D7B875',
  },
  {
    id: 'portrait_grad_cap',
    name: 'قالب بورتريه بقبعة تخرج',
    subtitle: 'بورتريه احترافي متوج بقبعة التخرج وشعار دفعة 2027',
    badge: 'بورتريه',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5 بورتريه',
    defaultBg: '#0E1726',
    accentColor: '#D7B875',
    secondaryColor: '#35D6C5',
  },
  {
    id: 'nurse_stethoscope',
    name: 'قالب بصورة ممرض مع سماعة طبية',
    subtitle: 'تصميم طبي متكامل مع السماعة الطبية وتخطيط نبض القلب ECG',
    badge: 'هوية تمريضية',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5 بورتريه',
    defaultBg: '#081C20',
    accentColor: '#35D6C5',
    secondaryColor: '#A6F0DF',
  },
  {
    id: 'appreciation_certificate',
    name: 'قالب شهادة تقدير شخصية',
    subtitle: 'شهادة فخر واعتزاز بتخرج الكادر التمريضي — دفعة 2027',
    badge: 'شهادة فخرية',
    width: 1400,
    height: 1050,
    aspectLabel: '4:3 أفقي',
    defaultBg: '#0B1320',
    accentColor: '#D7B875',
    secondaryColor: '#35D6C5',
  },
  {
    id: 'congrats_2027',
    name: 'قالب تهنئة بالتخرج لعام 2027',
    subtitle: 'بطاقة تهنئة احتفالية مذهبة بمناسبة التخرج 2027',
    badge: 'تهنئة 2027',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5 بورتريه',
    defaultBg: '#111522',
    accentColor: '#D7B875',
    secondaryColor: '#35D6C5',
  },
  {
    id: 'instagram_story',
    name: 'قالب عمودي لقصص إنستغرام',
    subtitle: 'مقاس كامل 9:16 مخصص للستوري والريلز بجودة فائقة',
    badge: 'ستوري 9:16',
    width: 1080,
    height: 1920,
    aspectLabel: '9:16 عمودي',
    defaultBg: '#08121E',
    accentColor: '#35D6C5',
    secondaryColor: '#D7B875',
  },
  {
    id: 'social_square',
    name: 'قالب مربع لمنشورات التواصل الاجتماعي',
    subtitle: 'مقاس متوازن 1:1 مثالي للمنشورات والصورة الشخصية',
    badge: 'منشور 1:1',
    width: 1080,
    height: 1080,
    aspectLabel: '1:1 مربع',
    defaultBg: '#0A1520',
    accentColor: '#35D6C5',
    secondaryColor: '#D7B875',
  },
  {
    id: 'photo_name_quote',
    name: 'قالب يجمع صورة الطالب واسمه وعبارة تخرج',
    subtitle: 'تصميم أدبي يبرز اقتباس التخرج مع الصورة والاسم الثلاثي',
    badge: 'اقتباس تخرج',
    width: 1080,
    height: 1350,
    aspectLabel: '4:5 بورتريه',
    defaultBg: '#0C121D',
    accentColor: '#A6F0DF',
    secondaryColor: '#D7B875',
  },
  {
    id: 'group_collage',
    name: 'قالب جماعي يمكن إضافة عدة صور إليه',
    subtitle: 'اجمع 2 إلى 4 صور مع زملائك في الدفعة داخل لوحة ذكريات واحدة',
    badge: 'جماعي (حتى 4 صور)',
    width: 1200,
    height: 1200,
    aspectLabel: '1:1 جماعي',
    defaultBg: '#09131C',
    accentColor: '#35D6C5',
    secondaryColor: '#D7B875',
  },
];

const BG_COLOR_PRESETS = [
  { id: '#07171B', label: 'تركوازي ملكي داكن', color: '#07171B' },
  { id: '#0A0D18', label: 'نيلي سينمائي', color: '#0A0D18' },
  { id: '#0E1726', label: 'كحلي طبي فاخر', color: '#0E1726' },
  { id: '#141122', label: 'بنفسجي ليلي', color: '#141122' },
  { id: '#171412', label: 'شامبين أسود مذهب', color: '#171412' },
];

const PRESET_QUOTES = [
  'رحلة علم، تعب، وذكريات تجمعنا — ملائكة الرحمة دفعة 2027',
  'الحمد لله الذي بنعمته تتم الصالحات.. تخرجنا لنكون عوناً وشفاءً لكل مريض',
  'بين سهر الليالي ونبض الإنسانية، نرفع اليوم قبعات التخرج بكل فخر — دفعة 2027',
  'أقسمنا أن نصون الحياة ونخفف الألم.. خريجو معهد التمريض 2027',
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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const primaryPhotoInputRef = useRef<HTMLInputElement | null>(null);
  const groupPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedTemplateId, setSelectedTemplateId] =
    useState<StudioTemplateId>('turquoise_luxury');
  const [customName, setCustomName] = useState<string>(
    currentUser?.fullName || 'اسم الطالب الثلاثي'
  );
  const [customTitle, setCustomTitle] = useState<'nurse_m' | 'nurse_f'>(
    currentUser?.preferredTitle || 'nurse_m'
  );
  const [customQuote, setCustomQuote] = useState<string>(PRESET_QUOTES[0]);
  const [bgColor, setBgColor] = useState<string>('#07171B');
  const [sashStyle, setSashStyle] = useState<
    'turquoise_gold' | 'royal_navy' | 'champagne_luxury'
  >('turquoise_gold');
  const [showStethoscope, setShowStethoscope] = useState<boolean>(true);
  const [showGradCap, setShowGradCap] = useState<boolean>(true);
  const [fontFamily, setFontFamily] = useState<'Cairo' | 'Tajawal' | 'Amiri'>(
    'Cairo'
  );
  const [fontSize, setFontSize] = useState<number>(52);
  const [photoScale, setPhotoScale] = useState<number>(1);
  const [photoOffsetX, setPhotoOffsetX] = useState<number>(0);
  const [photoOffsetY, setPhotoOffsetY] = useState<number>(0);

  // Loaded HTMLImageElement instances for canvas drawing
  const [primaryImageObj, setPrimaryImageObj] =
    useState<HTMLImageElement | null>(null);
  const [primaryPhotoUrl, setPrimaryPhotoUrl] = useState<string | null>(
    currentUser?.avatarUrl || null
  );
  const [groupImageObjs, setGroupImageObjs] = useState<HTMLImageElement[]>([]);
  const [groupPhotoUrls, setGroupPhotoUrls] = useState<string[]>([]);

  const [activeStudioSubTab, setActiveStudioSubTab] = useState<
    'editor' | 'saved_designs'
  >('editor');
  const [feedbackNotice, setFeedbackNotice] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showShareConfirmModal, setShowShareConfirmModal] =
    useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const activeTemplate =
    STUDIO_TEMPLATES.find((t) => t.id === selectedTemplateId) ||
    STUDIO_TEMPLATES[0];

  const mySavedDesigns = savedDesigns.filter(
    (d) => d.userId === (firebaseUser?.uid || currentUser?.id)
  );

  // Sync user name if currentUser loads
  useEffect(() => {
    if (currentUser?.fullName && customName === 'اسم الطالب الثلاثي') {
      setCustomName(currentUser.fullName);
    }
    if (currentUser?.preferredTitle) {
      setCustomTitle(currentUser.preferredTitle);
    }
  }, [currentUser?.fullName, currentUser?.preferredTitle]);

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

  // Load group photos into HTMLImageElement[]
  useEffect(() => {
    if (groupPhotoUrls.length === 0) {
      setGroupImageObjs([]);
      return;
    }
    let isMounted = true;
    Promise.all(
      groupPhotoUrls.map(
        (url) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = () => resolve(img);
            img.src = url;
          })
      )
    ).then((imgs) => {
      if (isMounted) setGroupImageObjs(imgs);
    });
    return () => {
      isMounted = false;
    };
  }, [groupPhotoUrls]);

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

  const handleGroupPhotosUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4);
    if (files.length === 0) return;
    Promise.all(
      files.map(
        (f) =>
          new Promise<string>((resolve) => {
            const r = new FileReader();
            r.onload = () => resolve(typeof r.result === 'string' ? r.result : '');
            r.readAsDataURL(f);
          })
      )
    ).then((urls) => {
      setGroupPhotoUrls((prev) => [...prev, ...urls.filter(Boolean)].slice(0, 4));
    });
  };

  // Helper to wrap Arabic text on Canvas
  const drawWrappedText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number
  ) => {
    const words = text.split(' ');
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
    lines.push(line.trim());
    lines.slice(0, 3).forEach((l, i) => {
      ctx.fillText(l, x, y + i * lineHeight);
    });
  };

  // Draw Graduation Cap vector on Canvas
  const drawGraduationCapVector = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    scale = 1
  ) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);

    // Mortarboard diamond
    ctx.beginPath();
    ctx.moveTo(0, -45);
    ctx.lineTo(95, -12);
    ctx.lineTo(0, 20);
    ctx.lineTo(-95, -12);
    ctx.closePath();
    ctx.fillStyle = '#101827';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#D7B875';
    ctx.stroke();

    // Skull cap base
    ctx.beginPath();
    ctx.moveTo(-52, 4);
    ctx.lineTo(-44, 34);
    ctx.quadraticCurveTo(0, 50, 44, 34);
    ctx.lineTo(52, 4);
    ctx.closePath();
    ctx.fillStyle = '#182438';
    ctx.fill();
    ctx.strokeStyle = '#35D6C5';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Gold tassel
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(55, -2, 72, 36);
    ctx.strokeStyle = '#D7B875';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(0, -12, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#D7B875';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(72, 38, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#D7B875';
    ctx.fill();

    ctx.restore();
  };

  // Draw Medical Stethoscope + ECG Waveform on Canvas
  const drawMedicalEmblemAndEcg = (
    ctx: CanvasRenderingContext2D,
    w: number,
    yPos: number,
    accent: string
  ) => {
    ctx.save();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.65;

    const startX = w * 0.14;
    const endX = w * 0.86;
    const midX = w / 2;

    ctx.beginPath();
    ctx.moveTo(startX, yPos);
    ctx.lineTo(midX - 110, yPos);
    ctx.lineTo(midX - 85, yPos - 14);
    ctx.lineTo(midX - 65, yPos + 18);
    ctx.lineTo(midX - 40, yPos - 44);
    ctx.lineTo(midX - 15, yPos + 34);
    ctx.lineTo(midX + 10, yPos - 22);
    ctx.lineTo(midX + 32, yPos);
    ctx.lineTo(endX, yPos);
    ctx.stroke();

    // Stethoscope chestpiece circle at right end
    ctx.beginPath();
    ctx.arc(endX + 14, yPos, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#0A0D12';
    ctx.fill();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#D7B875';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(endX + 14, yPos, 5, 0, Math.PI * 2);
    ctx.fillStyle = accent;
    ctx.fill();

    ctx.restore();
  };

  // Draw Nursing Sash ribbon badge on Canvas
  const drawSashRibbon = (
    ctx: CanvasRenderingContext2D,
    cx: number,
    yPos: number,
    style: 'turquoise_gold' | 'royal_navy' | 'champagne_luxury'
  ) => {
    ctx.save();
    const pillW = 460;
    const pillH = 54;
    const x = cx - pillW / 2;
    const y = yPos - pillH / 2;

    const grad = ctx.createLinearGradient(x, y, x + pillW, y + pillH);
    if (style === 'turquoise_gold') {
      grad.addColorStop(0, '#0F3B3C');
      grad.addColorStop(0.5, '#176B66');
      grad.addColorStop(1, '#0F3B3C');
    } else if (style === 'royal_navy') {
      grad.addColorStop(0, '#101B33');
      grad.addColorStop(0.5, '#1E3A5F');
      grad.addColorStop(1, '#101B33');
    } else {
      grad.addColorStop(0, '#332814');
      grad.addColorStop(0.5, '#685022');
      grad.addColorStop(1, '#332814');
    }

    ctx.beginPath();
    ctx.roundRect(x, y, pillW, pillH, 27);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#D7B875';
    ctx.stroke();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = `700 22px "${fontFamily}", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('وشاح التمريض • تخرج دفعة 2027', cx, yPos);
    ctx.restore();
  };

  // Master Canvas Render Function
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = activeTemplate.width;
    const h = activeTemplate.height;
    canvas.width = w;
    canvas.height = h;

    // 1. Background Fill + Luxury Radial Glows
    ctx.fillStyle = bgColor || activeTemplate.defaultBg;
    ctx.fillRect(0, 0, w, h);

    const topGlow = ctx.createRadialGradient(
      w * 0.5,
      h * 0.22,
      20,
      w * 0.5,
      h * 0.22,
      w * 0.65
    );
    topGlow.addColorStop(0, `${activeTemplate.accentColor}38`);
    topGlow.addColorStop(0.6, `${activeTemplate.secondaryColor}12`);
    topGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = topGlow;
    ctx.fillRect(0, 0, w, h);

    const bottomGlow = ctx.createRadialGradient(
      w * 0.5,
      h * 0.88,
      20,
      w * 0.5,
      h * 0.88,
      w * 0.55
    );
    bottomGlow.addColorStop(0, `${activeTemplate.secondaryColor}26`);
    bottomGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = bottomGlow;
    ctx.fillRect(0, 0, w, h);

    // 2. Luxury Double Border Frame
    ctx.save();
    ctx.strokeStyle = activeTemplate.accentColor;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.65;
    ctx.strokeRect(32, 32, w - 64, h - 64);

    ctx.strokeStyle = '#D7B875';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.55;
    ctx.strokeRect(46, 46, w - 92, h - 92);
    ctx.restore();

    // 3. Top Header Branding
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D7B875';
    ctx.font = `800 26px "${fontFamily}", sans-serif`;
    ctx.fillText('تخرج دفعة التمريض 2027 • CLASS OF 2027', w / 2, 98);

    ctx.fillStyle = '#A6F0DF';
    ctx.font = `600 20px "${fontFamily}", sans-serif`;
    ctx.fillText('رحلة علم، تعب، وذكريات تجمعنا', w / 2, 134);
    ctx.restore();

    const titlePrefix = customTitle === 'nurse_f' ? 'الممرضة' : 'الممرض';
    const fullTitledName = `${titlePrefix} ${customName.trim() || 'اسم الطالب الثلاثي'}`;

    // Special Layout A: Group Collage (up to 4 photos)
    if (selectedTemplateId === 'group_collage') {
      const gridTop = 185;
      const gridSize = 620;
      const gridLeft = (w - gridSize) / 2;
      const cellGap = 18;
      const cellSize = (gridSize - cellGap) / 2;

      const slots = [
        { x: gridLeft, y: gridTop },
        { x: gridLeft + cellSize + cellGap, y: gridTop },
        { x: gridLeft, y: gridTop + cellSize + cellGap },
        { x: gridLeft + cellSize + cellGap, y: gridTop + cellSize + cellGap },
      ];

      slots.forEach((slot, idx) => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(slot.x, slot.y, cellSize, cellSize, 26);
        ctx.clip();

        ctx.fillStyle = '#101A29';
        ctx.fillRect(slot.x, slot.y, cellSize, cellSize);

        const img = groupImageObjs[idx] || (idx === 0 ? primaryImageObj : null);
        if (img && img.width > 0) {
          const scale =
            Math.max(cellSize / img.width, cellSize / img.height) * photoScale;
          const drawW = img.width * scale;
          const drawH = img.height * scale;
          const dx =
            slot.x + (cellSize - drawW) / 2 + (idx === 0 ? photoOffsetX : 0);
          const dy =
            slot.y + (cellSize - drawH) / 2 + (idx === 0 ? photoOffsetY : 0);
          ctx.drawImage(img, dx, dy, drawW, drawH);
        } else {
          ctx.fillStyle = '#35D6C5';
          ctx.font = `700 22px "${fontFamily}", sans-serif`;
          ctx.textAlign = 'center';
          ctx.fillText(
            `صورة ذكريات #${idx + 1}`,
            slot.x + cellSize / 2,
            slot.y + cellSize / 2
          );
        }
        ctx.restore();

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(slot.x, slot.y, cellSize, cellSize, 26);
        ctx.lineWidth = 3;
        ctx.strokeStyle = idx % 2 === 0 ? '#35D6C5' : '#D7B875';
        ctx.stroke();
        ctx.restore();
      });

      drawSashRibbon(ctx, w / 2, 860, sashStyle);

      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
      ctx.fillText(fullTitledName, w / 2, 945);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = `600 25px "${fontFamily}", sans-serif`;
      drawWrappedText(ctx, `« ${customQuote} »`, w / 2, 1005, w - 180, 38);
      ctx.restore();

      if (showStethoscope) {
        drawMedicalEmblemAndEcg(ctx, w, 1115, activeTemplate.accentColor);
      }
      return;
    }

    // Special Layout B: Appreciation Certificate (Horizontal 1400x1050)
    if (selectedTemplateId === 'appreciation_certificate') {
      // Photo on right side, certificate text on left/center
      const avatarRadius = 155;
      const avatarCx = w - 265;
      const avatarCy = 440;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarRadius, 0, Math.PI * 2);
      ctx.clip();
      ctx.fillStyle = '#122033';
      ctx.fillRect(
        avatarCx - avatarRadius,
        avatarCy - avatarRadius,
        avatarRadius * 2,
        avatarRadius * 2
      );

      if (primaryImageObj && primaryImageObj.width > 0) {
        const scale =
          Math.max(
            (avatarRadius * 2) / primaryImageObj.width,
            (avatarRadius * 2) / primaryImageObj.height
          ) * photoScale;
        const dw = primaryImageObj.width * scale;
        const dh = primaryImageObj.height * scale;
        ctx.drawImage(
          primaryImageObj,
          avatarCx - dw / 2 + photoOffsetX,
          avatarCy - dh / 2 + photoOffsetY,
          dw,
          dh
        );
      } else {
        ctx.fillStyle = '#35D6C5';
        ctx.font = `700 24px "${fontFamily}", sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('صورتك الشخصية', avatarCx, avatarCy);
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarCx, avatarCy, avatarRadius, 0, Math.PI * 2);
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#D7B875';
      ctx.stroke();
      ctx.restore();

      if (showGradCap) {
        drawGraduationCapVector(ctx, avatarCx, avatarCy - avatarRadius - 22, 0.9);
      }

      const textCenterX = (w - 380) / 2;
      ctx.save();
      ctx.textAlign = 'center';
      ctx.fillStyle = '#D7B875';
      ctx.font = `900 46px "${fontFamily}", sans-serif`;
      ctx.fillText('شهادة فخر وتقدير بتخرج الكادر التمريضي', textCenterX, 265);

      ctx.fillStyle = '#94A3B8';
      ctx.font = `600 26px "${fontFamily}", sans-serif`;
      ctx.fillText(
        'تُمنح هذه الشهادة التذكارية اعتزازاً بمسيرة العطاء والتفاني العلمي والعملي إلى:',
        textCenterX,
        340
      );

      ctx.fillStyle = '#35D6C5';
      ctx.font = `900 ${fontSize + 6}px "${fontFamily}", sans-serif`;
      ctx.fillText(fullTitledName, textCenterX, 435);

      drawSashRibbon(ctx, textCenterX, 520, sashStyle);

      ctx.fillStyle = '#F8FAFC';
      ctx.font = `600 28px "${fontFamily}", sans-serif`;
      drawWrappedText(
        ctx,
        `« ${customQuote} »`,
        textCenterX,
        615,
        760,
        44
      );

      if (showStethoscope) {
        drawMedicalEmblemAndEcg(ctx, w, 835, '#35D6C5');
      }

      ctx.fillStyle = '#D7B875';
      ctx.font = `700 22px "${fontFamily}", sans-serif`;
      ctx.fillText(
        'منصة تنظيم شؤون الدفعة • تخرج طلاب معهد التمريض — دفعة 2027',
        w / 2,
        945
      );
      ctx.restore();
      return;
    }

    // Standard Portrait / Story / Square Templates
    const isStory = selectedTemplateId === 'instagram_story';
    const isSquare = selectedTemplateId === 'social_square';
    const photoRadius = isStory ? 235 : isSquare ? 185 : 210;
    const photoCenterX = w / 2;
    const photoCenterY = isStory ? 520 : isSquare ? 395 : 435;

    // Outer Halo Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCenterX, photoCenterY, photoRadius + 16, 0, Math.PI * 2);
    ctx.strokeStyle = activeTemplate.accentColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.restore();

    // Circular/Rounded Portrait Mask Preserving Original Facial Features
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
    ctx.clip();

    ctx.fillStyle = '#111C2D';
    ctx.fillRect(
      photoCenterX - photoRadius,
      photoCenterY - photoRadius,
      photoRadius * 2,
      photoRadius * 2
    );

    if (primaryImageObj && primaryImageObj.width > 0) {
      const baseScale = Math.max(
        (photoRadius * 2) / primaryImageObj.width,
        (photoRadius * 2) / primaryImageObj.height
      );
      const finalScale = baseScale * photoScale;
      const drawW = primaryImageObj.width * finalScale;
      const drawH = primaryImageObj.height * finalScale;
      const dx = photoCenterX - drawW / 2 + photoOffsetX;
      const dy = photoCenterY - drawH / 2 + photoOffsetY;
      ctx.drawImage(primaryImageObj, dx, dy, drawW, drawH);
    } else {
      ctx.fillStyle = activeTemplate.accentColor;
      ctx.font = `800 28px "${fontFamily}", sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('ارفع صورتك الشخصية هنا', photoCenterX, photoCenterY - 10);
      ctx.fillStyle = '#94A3B8';
      ctx.font = `600 20px "${fontFamily}", sans-serif`;
      ctx.fillText(
        'مع الحفاظ التام على ملامحك الأصلية',
        photoCenterX,
        photoCenterY + 30
      );
    }
    ctx.restore();

    // Portrait Gold/Turquoise Frame Ring
    ctx.save();
    ctx.beginPath();
    ctx.arc(photoCenterX, photoCenterY, photoRadius, 0, Math.PI * 2);
    ctx.lineWidth = 7;
    ctx.strokeStyle =
      selectedTemplateId === 'portrait_grad_cap' ||
      selectedTemplateId === 'congrats_2027'
        ? '#D7B875'
        : activeTemplate.accentColor;
    ctx.stroke();
    ctx.restore();

    // Optional Graduation Cap on top of portrait
    if (showGradCap) {
      drawGraduationCapVector(
        ctx,
        photoCenterX,
        photoCenterY - photoRadius - 18,
        isStory ? 1.15 : 1.0
      );
    }

    // Sash Ribbon below portrait
    const sashY = photoCenterY + photoRadius + (isStory ? 65 : 52);
    drawSashRibbon(ctx, w / 2, sashY, sashStyle);

    // Student Triple Name & Nursing Title
    const nameY = sashY + (isStory ? 110 : 88);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#FFFFFF';
    ctx.font = `900 ${fontSize}px "${fontFamily}", sans-serif`;
    ctx.shadowColor = 'rgba(0,0,0,0.65)';
    ctx.shadowBlur = 16;
    ctx.fillText(fullTitledName, w / 2, nameY);
    ctx.restore();

    // Template-Specific Subtitle Badge
    const subY = nameY + (isStory ? 65 : 52);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = activeTemplate.accentColor;
    ctx.font = `700 25px "${fontFamily}", sans-serif`;
    ctx.fillText(
      selectedTemplateId === 'congrats_2027'
        ? 'مبارك التخرج • دفعة التمريض 2027'
        : 'خريج دفعة التمريض 2027 • ملائكة الرحمة',
      w / 2,
      subY
    );
    ctx.restore();

    // Personal Graduation Quote
    const quoteY = subY + (isStory ? 85 : 64);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#E2E8F0';
    ctx.font = `600 ${isSquare ? 23 : 26}px "${fontFamily}", sans-serif`;
    drawWrappedText(
      ctx,
      `« ${customQuote} »`,
      w / 2,
      quoteY,
      w - 160,
      isSquare ? 36 : 42
    );
    ctx.restore();

    // Medical Stethoscope & ECG Waveform
    if (showStethoscope) {
      const ecgY = h - (isStory ? 210 : isSquare ? 105 : 135);
      drawMedicalEmblemAndEcg(ctx, w, ecgY, activeTemplate.accentColor);
    }

    // Footer Signature
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = '#94A3B8';
    ctx.font = `600 19px "${fontFamily}", sans-serif`;
    ctx.fillText(
      'استوديو التخرج الرقمي • دفعة التمريض 2027',
      w / 2,
      h - 62
    );
    ctx.restore();
  }, [
    activeTemplate,
    bgColor,
    customName,
    customQuote,
    customTitle,
    fontFamily,
    fontSize,
    groupImageObjs,
    photoOffsetX,
    photoOffsetY,
    photoScale,
    primaryImageObj,
    sashStyle,
    selectedTemplateId,
    showGradCap,
    showStethoscope,
  ]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleDownloadHighRes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png', 1.0);
    const link = document.createElement('a');
    const cleanSlug = (customName || 'nursing-2027').replace(/\s+/g, '-');
    link.download = `تخرج-التمريض-2027-${cleanSlug}-${selectedTemplateId}.png`;
    link.href = dataUrl;
    link.click();
    setFeedbackNotice({
      type: 'success',
      text: 'تم تنزيل التصميم بجودة عالية (PNG) إلى جهازك بنجاح!',
    });
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleSaveToMyAccount = async () => {
    if (!currentUser && !firebaseUser) {
      setFeedbackNotice({
        type: 'error',
        text: 'يرجى تسجيل الدخول بحسابك لحفظ التصميم في قسم «تصاميمي المحفوظة».',
      });
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsSaving(true);
    try {
      // Create compact preview data URL so it fits cleanly in Firestore/localStorage
      const previewCanvas = document.createElement('canvas');
      const scaleFactor = 540 / canvas.width;
      previewCanvas.width = 540;
      previewCanvas.height = Math.round(canvas.height * scaleFactor);
      const pCtx = previewCanvas.getContext('2d');
      if (pCtx) {
        pCtx.drawImage(canvas, 0, 0, previewCanvas.width, previewCanvas.height);
      }
      const previewDataUrl = previewCanvas.toDataURL('image/jpeg', 0.82);

      const res = await saveStudioDesign({
        templateId: selectedTemplateId,
        templateName: activeTemplate.name,
        customName,
        customTitle,
        customQuote,
        bgColor,
        sashStyle,
        showStethoscope,
        showGradCap,
        fontFamily,
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
    setActiveStudioSubTab('editor');
    setFeedbackNotice({
      type: 'success',
      text: `تم استرجاع التصميم «${design.templateName}» للمعاينة والتعديل.`,
    });
    setTimeout(() => setFeedbackNotice(null), 3500);
  };

  const handleConfirmedShare = async (mode: 'device_share' | 'public_gallery') => {
    const canvas = canvasRef.current;
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
            title: 'بطاقة تخرج دفعة التمريض 2027',
            text: `${customTitle === 'nurse_f' ? 'الممرضة' : 'الممرض'} ${customName} — تخرج دفعة التمريض 2027`,
            files: [file],
          });
          return;
        }
      } catch {
        // Fallback to download if Web Share cancelled or unsupported
      }
      handleDownloadHighRes();
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
      {/* Studio Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-[#0A1320] via-[#0F1E32] to-[#081720] border border-[#35D6C5]/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#35D6C5]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#35D6C5]/15 border border-[#35D6C5]/35 text-[#35D6C5] text-xs font-extrabold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>استوديو التخرج الذكي • دفعة التمريض 2027</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              صمّم بطاقة تخرجك وشهادتك التقديرية باسمك وصورتك
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed">
              اختر من بين 10 قوالب تخرج احترافية مخصصة لطلبة التمريض، ارفع صورتك مع الحفاظ الكامل على ملامحك الأصلية، تحكم بالوشاح والخطوط، واحفظ تصميمك في حسابك الخاص أو نزّله بجودة عالية.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveStudioSubTab('editor')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeStudioSubTab === 'editor'
                  ? 'bg-[#35D6C5] text-[#0A0D12] shadow-lg shadow-[#35D6C5]/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>مساحة التصميم (10 قوالب)</span>
            </button>
            <button
              onClick={() => setActiveStudioSubTab('saved_designs')}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition cursor-pointer ${
                activeStudioSubTab === 'saved_designs'
                  ? 'bg-[#D7B875] text-[#0A0D12] shadow-lg shadow-[#D7B875]/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 border border-white/10'
              }`}
            >
              <Bookmark className="w-4 h-4" />
              <span>تصاميمي المحفوظة ({mySavedDesigns.length})</span>
            </button>
          </div>
        </div>

        {/* Privacy Assurance Strip */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#A6F0DF]">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-[#35D6C5]" />
            <span>
              خصوصية تامة: صورك وتصاميمك تُعالج داخل متصفحك وتُحفظ في حسابك الشخصي فقط ولا تُنشر للعامة تلقائياً.
            </span>
          </div>
          {!currentUser && !firebaseUser && (
            <button
              onClick={() => navigateTo('login')}
              className="text-[#D7B875] font-bold underline hover:text-white cursor-pointer"
            >
              سجّل الدخول لحفظ تصاميمك في حسابك الدائم
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
            className="text-white/70 hover:text-white"
          >
            إغلاق
          </button>
        </div>
      )}

      {activeStudioSubTab === 'saved_designs' ? (
        <div className="rounded-3xl bg-[#101827] border border-white/10 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-black text-white">
                تصاميمي المحفوظة في الحساب ({mySavedDesigns.length})
              </h3>
              <p className="text-xs text-slate-400">
                جميع التصاميم المحفوظة هنا خاصة بحسابك الشخصي فقط. يمكنك استعادتها للتعديل أو تنزيلها في أي وقت.
              </p>
            </div>
            <button
              onClick={() => setActiveStudioSubTab('editor')}
              className="px-4 py-2 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-extrabold text-xs cursor-pointer"
            >
              + إنشاء تصميم جديد
            </button>
          </div>

          {mySavedDesigns.length === 0 ? (
            <div className="py-16 text-center rounded-2xl bg-[#0A0D12] border border-dashed border-white/10 space-y-3">
              <Bookmark className="w-10 h-10 text-[#35D6C5] mx-auto opacity-50" />
              <p className="text-sm font-bold text-white">
                لا توجد تصاميم محفوظة في حسابك حتى الآن
              </p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                قم بتخصيص أي قالب في استوديو التخرج ثم اضغط على زر «حفظ في حسابي» ليظهر هنا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {mySavedDesigns.map((d) => (
                <div
                  key={d.id}
                  className="rounded-2xl bg-[#0A0D12] border border-white/10 overflow-hidden flex flex-col justify-between group hover:border-[#35D6C5]/40 transition"
                >
                  <div className="aspect-[4/5] bg-black/60 relative overflow-hidden flex items-center justify-center">
                    <img
                      src={d.previewDataUrl}
                      alt={d.templateName}
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <span className="text-[10px] font-bold text-[#35D6C5] block">
                        {d.templateName}
                      </span>
                      <h4 className="text-sm font-black text-white truncate">
                        {d.customTitle === 'nurse_f' ? 'الممرضة' : 'الممرض'}{' '}
                        {d.customName}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        تاريخ الحفظ: {d.createdAt.split('T')[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                      <button
                        onClick={() => handleLoadSavedDesign(d)}
                        className="flex-1 py-2 rounded-xl bg-[#35D6C5]/15 hover:bg-[#35D6C5]/25 text-[#35D6C5] text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>فتح وتعديل</span>
                      </button>
                      <a
                        href={d.previewDataUrl}
                        download={`تصميم-تخرج-${d.customName}.jpg`}
                        className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold flex items-center gap-1"
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
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Right Column: Controls & 10 Templates (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: 10 Professional Templates Selector */}
            <div className="rounded-3xl bg-[#101827] border border-white/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#35D6C5]" />
                  <span>1. اختر قالب التخرج (10 قوالب احترافية)</span>
                </h3>
                <span className="text-[11px] font-bold text-[#D7B875]">
                  {activeTemplate.aspectLabel}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
                {STUDIO_TEMPLATES.map((tpl) => {
                  const isSelected = tpl.id === selectedTemplateId;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => {
                        setSelectedTemplateId(tpl.id);
                        setBgColor(tpl.defaultBg);
                      }}
                      className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex items-start justify-between gap-2 ${
                        isSelected
                          ? 'bg-[#35D6C5]/15 border-[#35D6C5] shadow-md shadow-[#35D6C5]/10'
                          : 'bg-[#0A0D12]/90 border-white/10 hover:border-white/25'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-extrabold text-white">
                            {tpl.name}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 leading-snug">
                          {tpl.subtitle}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[9px] font-black shrink-0 ${
                          isSelected
                            ? 'bg-[#35D6C5] text-[#0A0D12]'
                            : 'bg-white/10 text-[#D7B875]'
                        }`}
                      >
                        {tpl.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Upload Personal Photo(s) & Adjust Position/Scale */}
            <div className="rounded-3xl bg-[#101827] border border-white/10 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-[#35D6C5]" />
                  <span>2. رفع الصورة الشخصية وضبط الموقع والحجم</span>
                </h3>
                {primaryPhotoUrl && (
                  <button
                    type="button"
                    onClick={() => {
                      setPhotoScale(1);
                      setPhotoOffsetX(0);
                      setPhotoOffsetY(0);
                    }}
                    className="text-[11px] text-[#35D6C5] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>إعادة ضبط الموضع</span>
                  </button>
                )}
              </div>

              <input
                ref={primaryPhotoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePrimaryPhotoUpload}
                className="hidden"
              />
              <input
                ref={groupPhotoInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGroupPhotosUpload}
                className="hidden"
              />

              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => primaryPhotoInputRef.current?.click()}
                  className="flex-1 min-w-[200px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-[#35D6C5]/20 to-[#35D6C5]/10 hover:from-[#35D6C5]/30 hover:to-[#35D6C5]/20 border border-[#35D6C5]/40 text-white font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Camera className="w-4 h-4 text-[#35D6C5]" />
                  <span>
                    {primaryPhotoUrl
                      ? 'تغيير الصورة الشخصية'
                      : 'رفع صورتك الشخصية من جهازك'}
                  </span>
                </button>

                {selectedTemplateId === 'group_collage' && (
                  <button
                    type="button"
                    onClick={() => groupPhotoInputRef.current?.click()}
                    className="flex-1 min-w-[200px] py-3.5 px-4 rounded-2xl bg-[#D7B875]/20 hover:bg-[#D7B875]/30 border border-[#D7B875]/40 text-[#D7B875] font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <ImageIcon className="w-4 h-4" />
                    <span>إضافة صور القالب الجماعي ({groupPhotoUrls.length}/4)</span>
                  </button>
                )}
              </div>

              {selectedTemplateId === 'group_collage' &&
                groupPhotoUrls.length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    {groupPhotoUrls.map((u, idx) => (
                      <div
                        key={idx}
                        className="w-12 h-12 rounded-xl overflow-hidden border border-white/20 relative"
                      >
                        <img
                          src={u}
                          alt={`group-${idx}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setGroupPhotoUrls([])}
                      className="text-[11px] text-red-400 hover:underline mr-2 cursor-pointer"
                    >
                      مسح الصور الجماعية
                    </button>
                  </div>
                )}

              {/* Photo Zoom & X/Y Position Sliders */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 border-t border-white/10">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <ZoomIn className="w-3.5 h-3.5 text-[#35D6C5]" />
                      حجم الصورة (التكبير)
                    </span>
                    <span className="font-mono text-[#35D6C5]">
                      {Math.round(photoScale * 100)}%
                    </span>
                  </label>
                  <input
                    type="range"
                    min="0.6"
                    max="2.2"
                    step="0.05"
                    value={photoScale}
                    onChange={(e) => setPhotoScale(parseFloat(e.target.value))}
                    className="w-full accent-[#35D6C5]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-[#D7B875]" />
                      إزاحة أفقية (يمين/يسار)
                    </span>
                    <span className="font-mono text-[#D7B875]">
                      {photoOffsetX}px
                    </span>
                  </label>
                  <input
                    type="range"
                    min="-220"
                    max="220"
                    step="5"
                    value={photoOffsetX}
                    onChange={(e) =>
                      setPhotoOffsetX(parseInt(e.target.value, 10))
                    }
                    className="w-full accent-[#D7B875]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <Move className="w-3.5 h-3.5 text-[#D7B875]" />
                      إزاحة عمودية (أعلى/أسفل)
                    </span>
                    <span className="font-mono text-[#D7B875]">
                      {photoOffsetY}px
                    </span>
                  </label>
                  <input
                    type="range"
                    min="-220"
                    max="220"
                    step="5"
                    value={photoOffsetY}
                    onChange={(e) =>
                      setPhotoOffsetY(parseInt(e.target.value, 10))
                    }
                    className="w-full accent-[#D7B875]"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Name, Nursing Title, Font & Quote */}
            <div className="rounded-3xl bg-[#101827] border border-white/10 p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Type className="w-4 h-4 text-[#35D6C5]" />
                <span>3. الاسم الثلاثي، اللقب، الخط وعبارة التخرج</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    الاسم الثلاثي للطالب
                  </label>
                  <input
                    type="text"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="أدخل اسمك الثلاثي..."
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white text-sm font-bold focus:outline-none focus:border-[#35D6C5]"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    اللقب التمريضي
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCustomTitle('nurse_m')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
                        customTitle === 'nurse_m'
                          ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                          : 'bg-[#0A0D12] text-slate-300 border-white/10'
                      }`}
                    >
                      الممرض
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomTitle('nurse_f')}
                      className={`py-2.5 rounded-xl text-xs font-extrabold border cursor-pointer ${
                        customTitle === 'nurse_f'
                          ? 'bg-[#35D6C5] text-[#0A0D12] border-[#35D6C5]'
                          : 'bg-[#0A0D12] text-slate-300 border-white/10'
                      }`}
                    >
                      الممرضة
                    </button>
                  </div>
                </div>
              </div>

              {/* Font Family & Font Size */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">
                    نوع الخط العربي
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['Cairo', 'Tajawal', 'Amiri'] as const).map((f) => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setFontFamily(f)}
                        className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                          fontFamily === f
                            ? 'bg-[#D7B875] text-[#0A0D12] border-[#D7B875]'
                            : 'bg-[#0A0D12] text-slate-300 border-white/10'
                        }`}
                      >
                        {f === 'Cairo'
                          ? 'القاهرة'
                          : f === 'Tajawal'
                          ? 'تجوال'
                          : 'أميري كلاسيك'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                    <span>حجم خط الاسم</span>
                    <span className="font-mono text-[#35D6C5]">{fontSize}px</span>
                  </label>
                  <input
                    type="range"
                    min="34"
                    max="72"
                    step="2"
                    value={fontSize}
                    onChange={(e) => setFontSize(parseInt(e.target.value, 10))}
                    className="w-full accent-[#35D6C5] mt-2"
                  />
                </div>
              </div>

              {/* Graduation Quote */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  عبارة التخرج الشخصية
                </label>
                <textarea
                  rows={2}
                  value={customQuote}
                  onChange={(e) => setCustomQuote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0D12] border border-white/15 text-white text-xs leading-relaxed focus:outline-none focus:border-[#35D6C5]"
                  placeholder="اكتب عبارة تخرجك الخاصة..."
                />
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_QUOTES.map((q, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCustomQuote(q)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] text-slate-300 cursor-pointer"
                    >
                      عبارة جاهزة #{i + 1}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 4: Background, Sash, Grad Cap & Medical Stethoscope Toggles */}
            <div className="rounded-3xl bg-[#101827] border border-white/10 p-5 sm:p-6 space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#35D6C5]" />
                <span>4. الخلفية، الوشاح، قبعة التخرج والرموز التمريضية</span>
              </h3>

              {/* Background Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  لون الخلفية الفاخرة
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  {BG_COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setBgColor(preset.color)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 cursor-pointer ${
                        bgColor === preset.color
                          ? 'border-[#35D6C5] bg-[#35D6C5]/15 text-white'
                          : 'border-white/10 bg-[#0A0D12] text-slate-300'
                      }`}
                    >
                      <span
                        className="w-4 h-4 rounded-full border border-white/30"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sash Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  تصميم وشاح التخرج
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {[
                    { id: 'turquoise_gold', label: 'وشاح تركوازي مذهب' },
                    { id: 'royal_navy', label: 'وشاح كحلي ملكي' },
                    { id: 'champagne_luxury', label: 'وشاح شامبين ذهبي' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSashStyle(s.id as any)}
                      className={`py-2.5 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 cursor-pointer ${
                        sashStyle === s.id
                          ? 'bg-[#35D6C5]/20 border-[#35D6C5] text-[#35D6C5]'
                          : 'bg-[#0A0D12] border-white/10 text-slate-300'
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Overlays Toggles */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowGradCap((v) => !v)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                    showGradCap
                      ? 'bg-[#D7B875]/15 border-[#D7B875] text-[#D7B875]'
                      : 'bg-[#0A0D12] border-white/10 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <GraduationCap className="w-4 h-4" />
                    <span>إظهار قبعة التخرج الملكية</span>
                  </span>
                  <span>{showGradCap ? 'مفعّل' : 'مخفي'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowStethoscope((v) => !v)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex items-center justify-between cursor-pointer ${
                    showStethoscope
                      ? 'bg-[#35D6C5]/15 border-[#35D6C5] text-[#35D6C5]'
                      : 'bg-[#0A0D12] border-white/10 text-slate-400'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4" />
                    <span>إظهار السماعة الطبية ونبض ECG</span>
                  </span>
                  <span>{showStethoscope ? 'مفعّل' : 'مخفي'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Left Column: Live High-Res Canvas Preview & Export Actions (5 cols) */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-4">
            <div className="rounded-3xl bg-[#101827] border border-[#35D6C5]/30 p-4 sm:p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-black text-white">
                    المعاينة الحية للتصميم
                  </h3>
                  <p className="text-[11px] text-[#35D6C5]">
                    {activeTemplate.name} ({activeTemplate.width}×
                    {activeTemplate.height})
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-300 text-[10px] font-bold">
                  دقة عالية HD
                </span>
              </div>

              <div className="w-full rounded-2xl bg-[#070A0F] border border-white/10 overflow-hidden flex items-center justify-center p-2">
                <canvas
                  ref={canvasRef}
                  className="max-w-full max-h-[520px] w-auto h-auto rounded-xl shadow-2xl"
                />
              </div>

              {/* Action Buttons: Download, Save to Account, Share after Consent */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={handleDownloadHighRes}
                  className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-[#35D6C5] to-[#20b5a5] text-[#0A0D12] font-black text-xs sm:text-sm shadow-xl shadow-[#35D6C5]/20 flex items-center justify-center gap-2 cursor-pointer hover:brightness-110 transition"
                >
                  <Download className="w-4 h-4" />
                  <span>تنزيل التصميم بجودة عالية (PNG)</span>
                </button>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={handleSaveToMyAccount}
                    className="py-3 px-4 rounded-2xl bg-[#D7B875]/20 hover:bg-[#D7B875]/30 border border-[#D7B875]/40 text-[#D7B875] font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Bookmark className="w-4 h-4" />
                    <span>
                      {isSaving ? 'جارِ الحفظ...' : 'حفظ في حسابي'}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowShareConfirmModal(true)}
                    className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition"
                  >
                    <Share2 className="w-4 h-4 text-[#35D6C5]" />
                    <span>مشاركة التصميم</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Explicit User Consent Modal for Sharing */}
      {showShareConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md rounded-3xl bg-[#101827] border border-[#35D6C5]/40 p-6 space-y-4 text-right shadow-2xl">
            <div className="flex items-center gap-2 text-[#35D6C5]">
              <Share2 className="w-5 h-5" />
              <h3 className="text-base font-black text-white">
                مشاركة التصميم بعد موافقتك الشخصية
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              حفاظاً على خصوصيتك، لا يتم نشر أي صورة أو تصميم إلا بعد موافقتك الصريحة. كيف ترغب بمشاركة تصميمك؟
            </p>
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={() => handleConfirmedShare('device_share')}
                className="w-full py-3 px-4 rounded-xl bg-[#35D6C5] text-[#0A0D12] font-black text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>مشاركة عبر تطبيقات الهاتف (إنستغرام / تيليجرام / واتساب)</span>
              </button>
              <button
                type="button"
                onClick={() => handleConfirmedShare('public_gallery')}
                className="w-full py-3 px-4 rounded-xl bg-[#D7B875]/20 hover:bg-[#D7B875]/30 border border-[#D7B875]/40 text-[#D7B875] font-extrabold text-xs flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>أوافق على إرسال التصميم لمعرض ذكريات الدفعة (بإشراف اللجنة)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowShareConfirmModal(false)}
                className="w-full py-2.5 rounded-xl bg-white/5 text-slate-400 hover:text-white text-xs font-bold cursor-pointer"
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
