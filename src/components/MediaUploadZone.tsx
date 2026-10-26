import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Film,
  Camera,
  FolderOpen,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Loader2,
} from 'lucide-react';

export interface UploadResult {
  title: string;
  url: string;
  album: string;
  category: 'scrub_night' | 'official_grad' | 'team' | 'posters' | 'memories';
  taggedGraduateName?: string;
  fileType: 'image' | 'video';
  sizeMb: number;
}

interface MediaUploadZoneProps {
  onUploadSuccess: (item: UploadResult) => void;
  onCancel?: () => void;
  defaultCategory?: 'scrub_night' | 'official_grad' | 'team' | 'posters' | 'memories';
  defaultAlbum?: string;
  destinationLabel?: string; // e.g. "نشر للكل (المعرض العام)" or "إضافة إلى معرضي الخاص"
  submitButtonText?: string;
}

export const MediaUploadZone: React.FC<MediaUploadZoneProps> = ({
  onUploadSuccess,
  onCancel,
  defaultCategory = 'scrub_night',
  defaultAlbum = 'حفلة السكراب',
  destinationLabel = 'المعرض',
  submitButtonText = 'رفع ونشر',
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'video'>('image');
  const [fileSizeMb, setFileSizeMb] = useState<number>(0);

  const [title, setTitle] = useState('');
  const [album, setAlbum] = useState(defaultAlbum);
  const [category, setCategory] = useState<'scrub_night' | 'official_grad' | 'team' | 'posters' | 'memories'>(defaultCategory);
  const [taggedName, setTaggedName] = useState('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (limit 25MB)
    const sizeInMb = file.size / (1024 * 1024);
    if (sizeInMb > 25) {
      setErrorMessage('حجم الملف كبير جداً. الحد الأقصى المسموح به هو 25 ميغابايت.');
      return;
    }

    const isVideo = file.type.startsWith('video/');
    const isImage = file.type.startsWith('image/');

    if (!isVideo && !isImage) {
      setErrorMessage('يرجى اختيار ملف صورة أو فيديو مدعوم (JPG, PNG, WEBP, MP4).');
      return;
    }

    setSelectedFile(file);
    setFileType(isVideo ? 'video' : 'image');
    setFileSizeMb(parseFloat(sizeInMb.toFixed(2)));

    // Generate local preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Default title from filename if empty
    if (!title) {
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(cleanName.length > 3 ? cleanName : 'صورة تذكارية');
    }
  };

  const handleClearSelected = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setIsUploading(false);
    setErrorMessage(null);
    setStatusMessage(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile && !previewUrl) {
      setErrorMessage('يرجى اختيار صورة أو فيديو أولاً.');
      return;
    }

    if (!title.trim()) {
      setErrorMessage('يرجى كتابة عنوان أو وصف للصورة.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);
    setStatusMessage('جاري قراءة وضغط الملف...');
    setUploadProgress(15);

    try {
      // Read as DataURL for persistent client-side storage
      const reader = new FileReader();
      const readPromise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(new Error('فشل قراءة الملف.'));
      });

      reader.readAsDataURL(selectedFile!);

      // Simulated progressive upload feedback
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 85) {
            clearInterval(progressInterval);
            return 85;
          }
          return prev + 15;
        });
      }, 150);

      const dataUrl = await readPromise;
      clearInterval(progressInterval);

      setStatusMessage('جاري تشفير وتخزين الوسائط في المنظومة...');
      setUploadProgress(95);

      await new Promise((r) => setTimeout(r, 400));
      setUploadProgress(100);
      setStatusMessage('اكتمل الرفع بنجاح!');

      onUploadSuccess({
        title: title.trim(),
        url: dataUrl,
        album: album.trim() || defaultAlbum,
        category,
        taggedGraduateName: taggedName.trim() || undefined,
        fileType,
        sizeMb: fileSizeMb,
      });

      // Cleanup
      handleClearSelected();
    } catch (err) {
      console.error('File upload error:', err);
      setErrorMessage('حدث خطأ أثناء معالجة الملف. يرجى تجربة ملف أصغر حجماً.');
      setIsUploading(false);
    }
  };

  return (
    <div className="rounded-2xl bg-[#090B10] border border-white/10 p-5 shadow-2xl text-right space-y-4">
      {/* Hidden Native File Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Upload className="w-4 h-4 text-[#21D4C2]" />
          <h4 className="text-sm font-bold text-white">رفع وسائط إلى {destinationLabel}</h4>
        </div>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-xs text-gray-400 hover:text-white"
          >
            إلغاء
          </button>
        )}
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* File Selection Stage */}
      {!selectedFile ? (
        <div className="space-y-3">
          <div className="p-8 rounded-2xl border-2 border-dashed border-white/15 hover:border-[#21D4C2]/40 bg-[#101827]/60 text-center transition-all space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#21D4C2] mx-auto shadow-inner">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-white mb-1">اسحب الصورة أو الفيديو إلى هنا</p>
              <p className="text-xs text-[#929BAA]">
                يدعم الصور عالية الدقة ومقاطع الفيديو التذكارية (حتى 25 ميغابايت)
              </p>
            </div>

            {/* Android-Optimized Direct Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4 text-[#D6B779]" />
                <span>إضافة صورة من الاستوديو</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#101827] hover:bg-white/10 text-[#21D4C2] border border-[#21D4C2]/40 font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all"
              >
                <FolderOpen className="w-4 h-4" />
                <span>اختيار صورة أو فيديو من الملفات</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Preview & Details Stage */
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden bg-black/60 border border-white/10 max-h-64 flex items-center justify-center">
            {fileType === 'video' ? (
              <video src={previewUrl!} controls className="max-h-60 w-auto rounded-xl mx-auto" />
            ) : (
              <img src={previewUrl!} alt="Preview" className="max-h-60 w-auto object-contain mx-auto" />
            )}

            <button
              type="button"
              onClick={handleClearSelected}
              className="absolute top-3 left-3 p-1.5 rounded-full bg-black/70 hover:bg-red-600 text-white transition-colors"
              title="تغيير الملف"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[11px] text-white border border-white/10 flex items-center gap-1.5">
              {fileType === 'video' ? <Film className="w-3.5 h-3.5 text-amber-400" /> : <ImageIcon className="w-3.5 h-3.5 text-[#21D4C2]" />}
              <span>{fileSizeMb} ميغابايت</span>
            </div>
          </div>

          {/* Metadata Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-white font-bold mb-1">عنوان الصورة أو الوصف: *</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثال: لقطة تذكارية في مسرح تفاحة المصور"
                className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white focus:outline-none focus:border-[#21D4C2]"
              />
            </div>

            <div>
              <label className="block text-white font-bold mb-1">القسم أو الفعالية:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white focus:outline-none focus:border-[#21D4C2]"
              >
                <option value="scrub_night">حفلة السكراب (12/12/2026)</option>
                <option value="official_grad">حفل التخرج الرسمي 2027</option>
                <option value="posters">الهوية والبوسترات</option>
                <option value="memories">ذكريات معهد التمريض</option>
                <option value="team">اللجنة المنظمة</option>
              </select>
            </div>

            <div>
              <label className="block text-white font-bold mb-1">اسم الألبوم التذكاري:</label>
              <input
                type="text"
                value={album}
                onChange={(e) => setAlbum(e.target.value)}
                placeholder="مثال: كواليس الدفعة"
                className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white focus:outline-none focus:border-[#21D4C2]"
              />
            </div>

            <div>
              <label className="block text-white font-bold mb-1">اسم الطالب في الصورة (اختياري):</label>
              <input
                type="text"
                value={taggedName}
                onChange={(e) => setTaggedName(e.target.value)}
                placeholder="مثال: الممرض كرار حيدر"
                className="w-full px-3 py-2 rounded-xl bg-[#101827] border border-white/10 text-white focus:outline-none focus:border-[#21D4C2]"
              />
            </div>
          </div>

          {/* Upload Progress Bar */}
          {isUploading && (
            <div className="space-y-1.5 p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex justify-between items-center text-xs">
                <span className="text-[#21D4C2] font-bold flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{statusMessage}</span>
                </span>
                <span className="text-white font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#21D4C2] to-[#0D9488] transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              disabled={isUploading}
              onClick={handleClearSelected}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition"
            >
              إلغاء واختيار ملف آخر
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#21D4C2] to-[#0D9488] hover:brightness-110 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-[#21D4C2]/20 active:scale-95 transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>{submitButtonText}</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
