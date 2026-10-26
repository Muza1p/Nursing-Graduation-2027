import React, { useRef, useEffect, useState } from 'react';
import { Graduate } from '../types';
import confetti from 'canvas-confetti';
import {
  Download,
  X,
  Sparkles,
  GraduationCap,
  HeartPulse,
  Share2,
  Check,
  Palette,
} from 'lucide-react';

interface CardGeneratorModalProps {
  graduate: Graduate;
  onClose: () => void;
}

export const CardGeneratorModal: React.FC<CardGeneratorModalProps> = ({
  graduate,
  onClose,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [cardTheme, setCardTheme] = useState<'indigo' | 'turquoise' | 'gold'>('indigo');
  
  // Default to the graduate's selected title
  const defaultTitle = graduate.preferredTitle === 'nurse_f' ? 'ممرضة فنية معتمدة' : 'ممرض فني معتمد';
  const [customTitle, setCustomTitle] = useState(defaultTitle);

  const drawCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // High resolution canvas for mobile download (1200 x 750)
    canvas.width = 1200;
    canvas.height = 750;

    // Background base
    const bgGrad = ctx.createLinearGradient(0, 0, 1200, 750);
    if (cardTheme === 'indigo') {
      bgGrad.addColorStop(0, '#090B10');
      bgGrad.addColorStop(0.5, '#1e1b4b');
      bgGrad.addColorStop(1, '#0f172a');
    } else if (cardTheme === 'turquoise') {
      bgGrad.addColorStop(0, '#090B10');
      bgGrad.addColorStop(0.5, '#0c2226');
      bgGrad.addColorStop(1, '#101827');
    } else {
      bgGrad.addColorStop(0, '#090B10');
      bgGrad.addColorStop(0.5, '#1e1810');
      bgGrad.addColorStop(1, '#101827');
    }
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, 1200, 750);

    // Decorative Borders
    const accentColor = cardTheme === 'indigo' ? '#818cf8' : cardTheme === 'turquoise' ? '#21D4C2' : '#D6B779';
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 4;
    ctx.strokeRect(30, 30, 1140, 690);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1;
    ctx.strokeRect(45, 45, 1110, 660);

    // Corner Ornaments
    const drawCorner = (x: number, y: number, rot: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(40, 0);
      ctx.moveTo(0, 0);
      ctx.lineTo(0, 40);
      ctx.stroke();
      ctx.restore();
    };

    drawCorner(50, 50, 0);
    drawCorner(1150, 50, Math.PI / 2);
    drawCorner(1150, 700, Math.PI);
    drawCorner(50, 700, -Math.PI / 2);

    // Header Branding
    ctx.textAlign = 'center';
    ctx.fillStyle = '#D6B779';
    ctx.font = 'bold 22px "Cairo", sans-serif';
    ctx.fillText('معهد التمريض — دفعة 2027', 600, 110);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 18px "Cairo", sans-serif';
    ctx.fillText('حفلة السكراب وحفل التخرج الرسمي • دفعة الإنسانية والعطاء', 600, 145);

    // Subtle divider line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(350, 175);
    ctx.lineTo(850, 175);
    ctx.stroke();

    // Central Greeting
    ctx.fillStyle = 'rgba(245, 247, 250, 0.75)';
    ctx.font = '500 22px "Cairo", sans-serif';
    ctx.fillText('تتشرف دفعة معهد التمريض بتهنئة الزميل(ة)', 600, 235);

    // Official Title & Name
    const fullDisplay = graduate.displayTitle || (graduate.preferredTitle === 'nurse_f' ? `الممرضة ${graduate.fullName}` : `الممرض ${graduate.fullName}`);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 46px "Cairo", sans-serif';
    ctx.fillText(fullDisplay, 600, 315);

    // Badge Box for Custom Role
    ctx.fillStyle = 'rgba(16, 24, 39, 0.85)';
    ctx.fillRect(380, 355, 440, 75);
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(380, 355, 440, 75);

    ctx.fillStyle = accentColor;
    ctx.font = 'bold 25px "Cairo", sans-serif';
    ctx.fillText(customTitle, 600, 402);

    // Student ID / Code & Verification
    ctx.fillStyle = '#929BAA';
    ctx.font = '16px "Cairo", sans-serif';
    ctx.fillText(`رقم القيد: ${graduate.studentId || 'NUR-2027'}  •  دفعة 2027  •  الحالة: معتمد رسمي`, 600, 475);

    // Poetic Quote
    ctx.fillStyle = 'rgba(245, 247, 250, 0.9)';
    ctx.font = 'italic 20px "Cairo", sans-serif';
    ctx.fillText('«نحتفل بسنوات التعب، ونتطلع إلى مستقبل نصنعه بإنسانيتنا وعلمنا»', 600, 540);

    // Footer divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.beginPath();
    ctx.moveTo(250, 580);
    ctx.lineTo(950, 580);
    ctx.stroke();

    ctx.fillStyle = '#D6B779';
    ctx.font = 'bold 16px "Cairo", sans-serif';
    ctx.fillText('حفلة السكراب: 12/12/2026 (مسرح تفاحة المصور)  |  حفل التخرج الرسمي: 2027', 600, 625);

    ctx.fillStyle = '#929BAA';
    ctx.font = '14px "Cairo", sans-serif';
    ctx.fillText('اللجنة المنظمة لمعهد التمريض: مصطفى علي حسون • حسين عبدالله جاسم • مصطفى أركان ساجت | @uofaon.1', 600, 660);
  };

  useEffect(() => {
    drawCard();
  }, [graduate, cardTheme, customTitle]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `Nursing_Institute_Cohort_2027_${graduate.fullName.replace(/\s+/g, '_')}.png`;
      link.href = dataUrl;
      link.click();

      // Confetti celebration
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#21D4C2', '#D6B779', '#818cf8', '#ffffff'],
      });

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (e) {
      console.error('Download card error', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl rounded-3xl bg-[#101827] border border-white/10 p-5 sm:p-7 shadow-2xl text-right overflow-y-auto max-h-[92vh]">
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-2 rounded-full text-gray-400 hover:text-white bg-white/5 hover:bg-white/10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-xs font-bold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>بطاقة التخرج الرقمية الرسمية</span>
          </div>
          <h3 className="text-xl font-black text-white">
            بطاقة تهنئة خريج معهد التمريض (دفعة 2027)
          </h3>
          <p className="text-xs text-[#929BAA]">
            خصص الألوان والمسمى الوظيفي ثم نزل البطاقة التذكارية بدقة عالية إلى هاتفك مباشرة.
          </p>
        </div>

        {/* Customizer Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 p-3.5 rounded-2xl bg-[#090B10] border border-white/10">
          <div>
            <label className="block text-[11px] font-bold text-white mb-1">
              المسمى الوظيفي في البطاقة:
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-400"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-white mb-1">
              طابع ألوان البطاقة:
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setCardTheme('indigo')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                  cardTheme === 'indigo'
                    ? 'bg-indigo-600 text-white border-indigo-500'
                    : 'bg-white/5 text-gray-300 border-white/10'
                }`}
              >
                نيلي (السكراب)
              </button>
              <button
                onClick={() => setCardTheme('turquoise')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                  cardTheme === 'turquoise'
                    ? 'bg-[#21D4C2] text-black border-[#21D4C2]'
                    : 'bg-white/5 text-gray-300 border-white/10'
                }`}
              >
                تركوازي (التخرج)
              </button>
              <button
                onClick={() => setCardTheme('gold')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold border transition-colors ${
                  cardTheme === 'gold'
                    ? 'bg-[#D6B779] text-black border-[#D6B779]'
                    : 'bg-white/5 text-gray-300 border-white/10'
                }`}
              >
                ذهبي فاخر
              </button>
            </div>
          </div>
        </div>

        {/* Real HTML5 Canvas preview */}
        <div className="relative rounded-2xl overflow-hidden border border-white/15 bg-black/40 shadow-inner mb-5">
          <canvas
            ref={canvasRef}
            className="w-full h-auto block select-none pointer-events-none"
            style={{ aspectRatio: '1200 / 750' }}
          />
        </div>

        {/* Modal actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-white/10">
          <span className="text-xs text-[#929BAA]">
            صيغة PNG عالية الجودة متوافقة مع متصفحات هواتف أندرويد والطباعة
          </span>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-black bg-gradient-to-r from-[#21D4C2] to-[#1cb8a9] hover:from-[#1fc2b1] hover:to-[#17a597] shadow-lg shadow-[#21D4C2]/20 transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {downloadSuccess ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>تم حفظ البطاقة بنجاح!</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>تنزيل بطاقتي (PNG)</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-gray-300 bg-white/5 hover:bg-white/10 border border-white/10"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
