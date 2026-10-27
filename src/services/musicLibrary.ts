import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
} from 'firebase/firestore';
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from 'firebase/storage';
import { app, db, auth } from './firebase';
import { GraduationSong, SongCategory, SongStorageType } from '../types';

const MUSIC_METADATA_STORAGE_KEY = 'nursing_grad_music_library_v1';
const IDB_DB_NAME = 'nursing_grad_audio_blobs_v1';
const IDB_STORE_NAME = 'audio_files';

export const SONG_CATEGORIES: Array<{
  id: SongCategory;
  label: string;
  description: string;
}> = [
  {
    id: 'graduation',
    label: 'أغاني التخرج',
    description: 'أغاني مسيرة التخرج والاحتفال الأكاديمي',
  },
  {
    id: 'party',
    label: 'أغاني الحفلات',
    description: 'أغاني حفلة السكراب والاحتفالات الجماعية',
  },
  {
    id: 'energetic',
    label: 'الموسيقى الحماسية',
    description: 'إيقاعات حماسية لدخول الخريجين والفقرات التفاعلية',
  },
  {
    id: 'calm',
    label: 'الموسيقى الهادئة',
    description: 'خلفيات موسيقية هادئة ومؤثرة للكلمات والتكريم',
  },
  {
    id: 'nasheed',
    label: 'الأناشيد',
    description: 'أناشيد النجاح والتخرج الرسمية',
  },
];

export function getSongCategoryLabel(category: SongCategory): string {
  const found = SONG_CATEGORIES.find((c) => c.id === category);
  return found ? found.label : 'أغاني التخرج';
}

export function formatSongDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '00:00';
  }
  const totalSec = Math.round(seconds);
  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function formatFileSize(bytes: number): string {
  if (!bytes || bytes <= 0) return '';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(1)} MB`;
  }
  const kb = bytes / 1024;
  return `${Math.round(kb)} KB`;
}

// Validate audio file type and size (MP3, M4A, WAV, AAC, OGG)
export function validateAudioFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxBytes = 50 * 1024 * 1024; // 50 MB max per audio file
  if (file.size === 0) {
    return { valid: false, error: `الملف «${file.name}» فارغ.` };
  }
  if (file.size > maxBytes) {
    return {
      valid: false,
      error: `حجم الملف «${file.name}» (${formatFileSize(file.size)}) يتجاوز الحد المسموح به (50 MB).`,
    };
  }

  const lowerName = file.name.toLowerCase();
  const validExt =
    lowerName.endsWith('.mp3') ||
    lowerName.endsWith('.m4a') ||
    lowerName.endsWith('.wav') ||
    lowerName.endsWith('.aac') ||
    lowerName.endsWith('.ogg') ||
    lowerName.endsWith('.mp4');

  const validMime =
    file.type.startsWith('audio/') ||
    file.type === 'video/mp4' || // Some Android file managers label .m4a as video/mp4 or application/octet-stream
    file.type === 'application/octet-stream' ||
    file.type === '';

  if (!validExt && !file.type.startsWith('audio/')) {
    return {
      valid: false,
      error: `صيغة الملف «${file.name}» غير مدعومة. يرجى اختيار ملف صوتي بصيغة MP3 أو M4A أو WAV.`,
    };
  }

  if (!validMime && !validExt) {
    return {
      valid: false,
      error: `نوع الملف «${file.name}» غير صالح للتشغيل الصوتي.`,
    };
  }

  return { valid: true };
}

// Smart Free Auto-Classification & Keyword Generator
export function suggestSongCategoryAndKeywords(
  title: string,
  artist: string,
  fileName = ''
): { category: SongCategory; keywords: string[] } {
  const combined = `${title} ${artist} ${fileName}`.toLowerCase();

  let category: SongCategory = 'graduation';

  if (
    combined.includes('نشيد') ||
    combined.includes('أنشودة') ||
    combined.includes('انشودة') ||
    combined.includes('اناشيد') ||
    combined.includes('أناشيد') ||
    combined.includes('nasheed') ||
    combined.includes('قسم')
  ) {
    category = 'nasheed';
  } else if (
    combined.includes('هادئ') ||
    combined.includes('هادئة') ||
    combined.includes('بيانو') ||
    combined.includes('كمان') ||
    combined.includes('موسيقى تصويرية') ||
    combined.includes('piano') ||
    combined.includes('calm') ||
    combined.includes('ambient') ||
    combined.includes('relax') ||
    combined.includes('slow')
  ) {
    category = 'calm';
  } else if (
    combined.includes('حماس') ||
    combined.includes('حماسية') ||
    combined.includes('ردح') ||
    combined.includes('دبكة') ||
    combined.includes('طاقة') ||
    combined.includes('ريمكس') ||
    combined.includes('remix') ||
    combined.includes('beat') ||
    combined.includes('energetic') ||
    combined.includes('dance')
  ) {
    category = 'energetic';
  } else if (
    combined.includes('حفلة') ||
    combined.includes('حفل') ||
    combined.includes('سكراب') ||
    combined.includes('فرح') ||
    combined.includes('مبروك') ||
    combined.includes('party') ||
    combined.includes('celebration') ||
    combined.includes('scrub')
  ) {
    category = 'party';
  } else {
    category = 'graduation';
  }

  const rawTokens = combined
    .replace(/[^\u0600-\u06FFa-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && w !== 'mp3' && w !== 'm4a' && w !== 'wav');

  const categoryKeywords: Record<SongCategory, string[]> = {
    graduation: ['تخرج', 'خريجين', 'نجاح', 'دفعة 2027', 'تمريض'],
    party: ['حفلة', 'احتفال', 'سكراب', 'فرح'],
    energetic: ['حماس', 'حماسية', 'إيقاع', 'حفلة'],
    calm: ['هادئة', 'موسيقى', 'تأمل', 'خلفية'],
    nasheed: ['نشيد', 'أناشيد', 'تخرج', 'رسمي'],
  };

  const uniqueKeywords = Array.from(
    new Set([...rawTokens.slice(0, 10), ...categoryKeywords[category]])
  );

  return { category, keywords: uniqueKeywords };
}

// Parse ID3v2 / ID3v1 tags from MP3 buffer if available
async function parseId3TagsFromFile(file: File): Promise<{
  title?: string;
  artist?: string;
}> {
  try {
    const headerSlice = file.slice(0, Math.min(file.size, 65536));
    const buffer = await headerSlice.arrayBuffer();
    const bytes = new Uint8Array(buffer);

    // Check for "ID3" header (ID3v2.3 / ID3v2.4)
    if (
      bytes.length > 10 &&
      bytes[0] === 0x49 && // 'I'
      bytes[1] === 0x44 && // 'D'
      bytes[2] === 0x33 // '3'
    ) {
      const version = bytes[3];
      const tagSize =
        ((bytes[6] & 0x7f) << 21) |
        ((bytes[7] & 0x7f) << 14) |
        ((bytes[8] & 0x7f) << 7) |
        (bytes[9] & 0x7f);

      const limit = Math.min(bytes.length, 10 + tagSize);
      let offset = 10;
      let foundTitle: string | undefined;
      let foundArtist: string | undefined;

      while (offset + 10 < limit) {
        const frameId = String.fromCharCode(
          bytes[offset],
          bytes[offset + 1],
          bytes[offset + 2],
          bytes[offset + 3]
        );
        if (!/^[A-Z0-9]{4}$/.test(frameId)) break;

        let frameSize = 0;
        if (version === 4) {
          frameSize =
            ((bytes[offset + 4] & 0x7f) << 21) |
            ((bytes[offset + 5] & 0x7f) << 14) |
            ((bytes[offset + 6] & 0x7f) << 7) |
            (bytes[offset + 7] & 0x7f);
        } else {
          frameSize =
            (bytes[offset + 4] << 24) |
            (bytes[offset + 5] << 16) |
            (bytes[offset + 6] << 8) |
            bytes[offset + 7];
        }

        if (frameSize <= 1 || offset + 10 + frameSize > limit) break;

        if (frameId === 'TIT2' || frameId === 'TPE1') {
          const encoding = bytes[offset + 10];
          const textBytes = bytes.slice(offset + 11, offset + 10 + frameSize);
          let decoded = '';
          try {
            if (encoding === 1 || encoding === 2) {
              decoded = new TextDecoder('utf-16').decode(textBytes);
            } else {
              decoded = new TextDecoder('utf-8').decode(textBytes);
            }
          } catch {
            decoded = '';
          }
          // Strip null bytes and control characters
          const cleaned = decoded.replace(/\0/g, '').trim();
          if (cleaned && !cleaned.includes('')) {
            if (frameId === 'TIT2') foundTitle = cleaned;
            if (frameId === 'TPE1') foundArtist = cleaned;
          }
        }

        if (foundTitle && foundArtist) break;
        offset += 10 + frameSize;
      }

      return { title: foundTitle, artist: foundArtist };
    }
  } catch {
    // Ignore binary tag parse errors and fall back to filename
  }
  return {};
}

// Read real audio duration using HTMLAudioElement metadata
export function readAudioFileDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(0);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    const tempAudio = new Audio();
    tempAudio.preload = 'metadata';

    let settled = false;
    const finish = (dur: number) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(objectUrl);
      resolve(Number.isFinite(dur) && dur > 0 ? Math.round(dur) : 0);
    };

    const timer = setTimeout(() => finish(0), 6000);

    tempAudio.onloadedmetadata = () => {
      clearTimeout(timer);
      finish(tempAudio.duration);
    };

    tempAudio.onerror = () => {
      clearTimeout(timer);
      finish(0);
    };

    tempAudio.src = objectUrl;
  });
}

// Extract song title, artist, duration, and suggested category from a File
export async function extractAudioMetadataFromFile(file: File): Promise<{
  title: string;
  artist: string;
  durationSeconds: number;
  durationFormatted: string;
  suggestedCategory: SongCategory;
  keywords: string[];
}> {
  const [id3, durationSeconds] = await Promise.all([
    parseId3TagsFromFile(file),
    readAudioFileDuration(file),
  ]);

  // Clean filename without extension
  const baseName = file.name
    .replace(/\.[a-z0-9]{2,4}$/i, '')
    .replace(/[_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let title = id3.title?.trim() || '';
  let artist = id3.artist?.trim() || '';

  if (!title) {
    // Check if filename follows "Artist - Title" or "Title - Artist"
    const dashParts = baseName.split(/\s+[-–—]\s+/);
    if (dashParts.length >= 2) {
      artist = artist || dashParts[0].trim();
      title = dashParts.slice(1).join(' - ').trim();
    } else {
      title = baseName || 'اسم غير معروف';
    }
  }

  if (!title) {
    title = 'اسم غير معروف';
  }
  if (!artist) {
    artist = 'اسم غير معروف';
  }

  const { category, keywords } = suggestSongCategoryAndKeywords(
    title,
    artist,
    baseName
  );

  return {
    title,
    artist,
    durationSeconds,
    durationFormatted: formatSongDuration(durationSeconds),
    suggestedCategory: category,
    keywords,
  };
}

// ============================================================================
// IndexedDB Helper for Local Device Audio Blob Storage (Spark Plan Fallback)
// ============================================================================
function openAudioIndexedDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this browser'));
      return;
    }
    const request = indexedDB.open(IDB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const dbInstance = request.result;
      if (!dbInstance.objectStoreNames.contains(IDB_STORE_NAME)) {
        dbInstance.createObjectStore(IDB_STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveAudioBlobToIndexedDB(
  songId: string,
  blob: Blob
): Promise<boolean> {
  try {
    const idb = await openAudioIndexedDB();
    return await new Promise<boolean>((resolve) => {
      const tx = idb.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.put(blob, songId);
      tx.oncomplete = () => {
        idb.close();
        resolve(true);
      };
      tx.onerror = () => {
        idb.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
}

export async function getAudioBlobFromIndexedDB(
  songId: string
): Promise<Blob | null> {
  try {
    const idb = await openAudioIndexedDB();
    return await new Promise<Blob | null>((resolve) => {
      const tx = idb.transaction(IDB_STORE_NAME, 'readonly');
      const store = tx.objectStore(IDB_STORE_NAME);
      const req = store.get(songId);
      req.onsuccess = () => {
        idb.close();
        resolve((req.result as Blob) || null);
      };
      req.onerror = () => {
        idb.close();
        resolve(null);
      };
    });
  } catch {
    return null;
  }
}

export async function deleteAudioBlobFromIndexedDB(
  songId: string
): Promise<void> {
  try {
    const idb = await openAudioIndexedDB();
    await new Promise<void>((resolve) => {
      const tx = idb.transaction(IDB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(IDB_STORE_NAME);
      store.delete(songId);
      tx.oncomplete = () => {
        idb.close();
        resolve();
      };
      tx.onerror = () => {
        idb.close();
        resolve();
      };
    });
  } catch {
    // Ignore cleanup errors
  }
}

// Cache of active object URLs created from blobs
const activeBlobUrlCache = new Map<string, string>();

const AUDIO_CHUNK_SIZE = 350 * 1024; // 350 KB per binary slice (approx 467 KB base64 string, safe within Firestore 1MB doc limit)

// Convert Blob/File slice to Base64 string
export async function blobSliceToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const res = reader.result as string;
      const base64 = res.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Convert an array of Base64 strings to a single Blob
export function combineBase64ChunksToBlob(chunks: string[], mimeType: string): Blob {
  const byteArrays: BlobPart[] = [];
  for (const b64 of chunks) {
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    byteArrays.push(bytes.buffer as ArrayBuffer);
  }
  return new Blob(byteArrays, { type: mimeType });
}

// Upload audio file chunks directly to Firestore subcollection (/graduation_songs/{songId}/audio_chunks/{chunkIndex})
export async function uploadAudioFileToFirestoreChunks(
  songId: string,
  file: File,
  onProgress?: (step: string, pct: number) => void
): Promise<{ success: boolean; totalChunks: number; error?: string }> {
  try {
    const fileSize = file.size;
    const totalChunks = Math.ceil(fileSize / AUDIO_CHUNK_SIZE);
    const mimeType = file.type || 'audio/mpeg';

    for (let index = 0; index < totalChunks; index++) {
      const start = index * AUDIO_CHUNK_SIZE;
      const end = Math.min(start + AUDIO_CHUNK_SIZE, fileSize);
      const slice = file.slice(start, end);
      const base64Data = await blobSliceToBase64(slice);

      const chunkDocId = String(index).padStart(4, '0');
      const chunkRef = doc(db, 'graduation_songs', songId, 'audio_chunks', chunkDocId);

      await setDoc(chunkRef, {
        index,
        totalChunks,
        data: base64Data,
        mimeType,
        chunkSizeBytes: slice.size,
      });

      const pct = Math.round(((index + 1) / totalChunks) * 100);
      onProgress?.(`جارِ رفع وحفظ مقاطع الصوت السحابية (${index + 1}/${totalChunks})...`, pct);
    }

    return { success: true, totalChunks };
  } catch (err: any) {
    console.error('Error saving audio chunks to Firestore:', err);
    return {
      success: false,
      totalChunks: 0,
      error: err?.message || 'فشل حفظ أجزاء ملف الصوت في قاعدة البيانات.',
    };
  }
}

// Read audio file chunks from Firestore subcollection and reconstruct a Blob
export async function fetchAudioBlobFromFirestoreChunks(
  songId: string
): Promise<Blob | null> {
  try {
    const chunksColl = collection(db, 'graduation_songs', songId, 'audio_chunks');
    const snap = await getDocs(chunksColl);
    if (snap.empty) {
      return null;
    }

    const docs = snap.docs.map((d) => d.data());
    docs.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

    const chunkStrings = docs.map((d) => d.data as string).filter(Boolean);
    if (chunkStrings.length === 0) return null;

    const mimeType = docs[0]?.mimeType || 'audio/mpeg';
    const blob = combineBase64ChunksToBlob(chunkStrings, mimeType);
    return blob;
  } catch (err) {
    console.warn('Error fetching audio chunks from Firestore:', err);
    return null;
  }
}

// Resolve a song's audioUrl into a playable browser URL
export async function resolvePlayableSongUrl(
  song: GraduationSong
): Promise<{ url: string | null; error?: string }> {
  if (!song || !song.audioUrl) {
    return { url: null, error: 'لا يوجد ملف صوتي مرتبط بهذه الأغنية.' };
  }

  // 1. If stored in Firestore chunks (or audioUrl starts with firestore://)
  if (song.storageType === 'firestore_chunks' || song.audioUrl.startsWith('firestore://')) {
    const songId = song.id || song.audioUrl.replace('firestore://', '');
    const cachedUrl = activeBlobUrlCache.get(songId);
    if (cachedUrl) {
      return { url: cachedUrl };
    }

    // Check device local IndexedDB cache first
    let blob = await getAudioBlobFromIndexedDB(songId);
    if (!blob) {
      // Fetch from Firestore cloud chunks
      blob = await fetchAudioBlobFromFirestoreChunks(songId);
      if (blob) {
        // Cache in device IndexedDB for instant future playback
        await saveAudioBlobToIndexedDB(songId, blob);
      }
    }

    if (!blob) {
      return {
        url: null,
        error: 'تعذر تحميل ملف الصوت من السحابة. يرجى التأكد من اتصال الإنترنت.',
      };
    }

    const objUrl = URL.createObjectURL(blob);
    activeBlobUrlCache.set(songId, objUrl);
    return { url: objUrl };
  }

  // 2. Legacy local-only IndexedDB (if any left from previous turn on current device)
  if (song.audioUrl.startsWith('idb://')) {
    const songId = song.audioUrl.replace('idb://', '');
    const cachedUrl = activeBlobUrlCache.get(songId);
    if (cachedUrl) return { url: cachedUrl };

    const blob = await getAudioBlobFromIndexedDB(songId);
    if (!blob) {
      return {
        url: null,
        error: 'هذا الملف الصوتي كان محفوظاً محلياً على جهاز المشرف فقط. يرجى إعادة رفعه ليُنشر سحابياً لجميع الطلاب.',
      };
    }
    const objUrl = URL.createObjectURL(blob);
    activeBlobUrlCache.set(songId, objUrl);
    return { url: objUrl };
  }

  // 3. Direct or Firebase Storage URL
  return { url: song.audioUrl };
}

// ============================================================================
// LocalStorage & Firestore Persistence for GraduationSong Metadata
// ============================================================================
export function getLocalSongs(): GraduationSong[] {
  try {
    const raw = localStorage.getItem(MUSIC_METADATA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GraduationSong[];
    if (!Array.isArray(parsed)) return [];
    return parsed.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  } catch {
    return [];
  }
}

export function saveLocalSongs(songs: GraduationSong[]): void {
  try {
    localStorage.setItem(MUSIC_METADATA_STORAGE_KEY, JSON.stringify(songs));
  } catch (e) {
    console.warn('Could not save song metadata to localStorage:', e);
  }
}

export async function syncSongsFromFirestore(): Promise<GraduationSong[]> {
  const localSongs = getLocalSongs();
  try {
    const snap = await getDocs(collection(db, 'graduation_songs'));
    const cloudSongs = snap.docs.map(
      (d) => ({ ...d.data(), id: d.id } as GraduationSong)
    );

    const sorted = cloudSongs.sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
    );
    saveLocalSongs(sorted);
    return sorted;
  } catch (err) {
    console.warn('Firestore graduation_songs sync fallback to local:', err);
    return localSongs;
  }
}

// Upload an audio file: tries Firebase Storage first; if storage bucket is unavailable, stores in Firestore subcollection chunks
export async function uploadGraduationSongFile(params: {
  file: File;
  title: string;
  artist: string;
  category: SongCategory;
  durationSeconds: number;
  coverUrl?: string;
  allowDownload: boolean;
  sortOrder: number;
  onProgress?: (step: string, pct: number) => void;
}): Promise<{
  success: boolean;
  song?: GraduationSong;
  storageType?: SongStorageType;
  notice: string;
  isLocalFallback?: boolean;
}> {
  const {
    file,
    title,
    artist,
    category,
    durationSeconds,
    coverUrl,
    allowDownload,
    sortOrder,
    onProgress,
  } = params;

  const validation = validateAudioFile(file);
  if (!validation.valid) {
    return {
      success: false,
      notice: validation.error || 'ملف صوتي غير صالح.',
    };
  }

  // Ensure an authenticated supervisor/admin is publishing
  if (!auth.currentUser) {
    return {
      success: false,
      notice: 'يجب تسجيل الدخول بحساب المشرف أو المسؤول المعتمد لنشر الأغنية في المكتبة السحابية.',
    };
  }

  const songId = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanTitle = title.trim() || 'اسم غير معروف';
  const cleanArtist = artist.trim() || 'اسم غير معروف';
  const { keywords } = suggestSongCategoryAndKeywords(
    cleanTitle,
    cleanArtist,
    file.name
  );
  const nowIso = new Date().toISOString();

  let audioUrl = '';
  let storagePath: string | undefined;
  let storageType: SongStorageType = 'firestore_chunks';
  let totalChunks = 0;

  onProgress?.('جارِ فحص إمكانية التخزين السحابي...', 10);

  // 1. Attempt upload to Firebase Cloud Storage if bucket exists
  try {
    const storage = getStorage(app);
    const safeFileName = file.name.replace(/[^a-zA-Z0-9._\-\u0600-\u06FF]/g, '_');
    storagePath = `graduation_songs/${songId}_${safeFileName}`;
    const fileRef = storageRef(storage, storagePath);

    const uploadTaskPromise = uploadBytes(fileRef, file, {
      contentType: file.type || 'audio/mpeg',
    });

    // Fast timeout of 3s in case storage bucket is unprovisioned
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('storage/not-available')), 3000)
    );

    await Promise.race([uploadTaskPromise, timeoutPromise]);
    audioUrl = await getDownloadURL(fileRef);
    storageType = 'firebase_storage';
    onProgress?.('تم رفع الملف إلى Firebase Storage...', 80);
  } catch (err: any) {
    storagePath = undefined;
    audioUrl = '';
  }

  // 2. If Firebase Storage is unprovisioned or failed, upload in binary chunks directly to Firestore
  if (!audioUrl) {
    onProgress?.('جارِ رفع مقاطع الصوت السحابية إلى قاعدة بيانات Firestore...', 20);
    const chunkRes = await uploadAudioFileToFirestoreChunks(songId, file, onProgress);
    if (!chunkRes.success) {
      return {
        success: false,
        notice: `فشل رفع أجزاء الملف الصوتي: ${chunkRes.error}`,
      };
    }
    totalChunks = chunkRes.totalChunks;
    audioUrl = `firestore://${songId}`;
    storageType = 'firestore_chunks';

    // Also cache locally on this device for instant local playback
    await saveAudioBlobToIndexedDB(songId, file);
  }

  const newSong: GraduationSong = {
    id: songId,
    title: cleanTitle,
    artist: cleanArtist,
    durationSeconds,
    durationFormatted: formatSongDuration(durationSeconds),
    category,
    audioUrl,
    ...(storagePath ? { storagePath } : {}),
    storageType,
    ...(totalChunks > 0 ? { chunkCount: totalChunks } : {}),
    ...(coverUrl?.trim() ? { coverUrl: coverUrl.trim() } : {}),
    mimeType: file.type || 'audio/mpeg',
    fileSizeBytes: file.size,
    allowDownload,
    keywords,
    sortOrder,
    createdAt: nowIso,
    updatedAt: nowIso,
    uploadedBy: auth.currentUser.email || auth.currentUser.uid || 'admin',
  };

  // 3. Save song metadata document to Firestore /graduation_songs/{songId}
  onProgress?.('جارِ حفظ ونشر بيانات الأغنية في المكتبة العامة...', 90);
  try {
    await setDoc(doc(db, 'graduation_songs', songId), newSong);
  } catch (fsErr: any) {
    console.error('Firestore graduation_songs setDoc error:', fsErr);
    return {
      success: false,
      notice: `فشل حفظ بيانات الأغنية في قاعدة بيانات Firestore: ${fsErr?.message || fsErr}`,
    };
  }

  const currentList = getLocalSongs();
  const updatedList = [...currentList, newSong].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  saveLocalSongs(updatedList);

  onProgress?.('اكتمل النشر بنجاح!', 100);

  return {
    success: true,
    song: newSong,
    storageType,
    notice: `تم نشر وحفظ الأغنية «${cleanTitle}» سحابياً بنجاح، وأصبحت متاحة لجميع الطلاب الآن!`,
  };
}

// Add a song via direct external or public audio URL (100% Free Cloud Persistence in Firestore)
export async function addGraduationSongByUrl(params: {
  title: string;
  artist: string;
  audioUrl: string;
  category: SongCategory;
  durationSeconds?: number;
  coverUrl?: string;
  allowDownload: boolean;
  sortOrder: number;
}): Promise<{
  success: boolean;
  song?: GraduationSong;
  notice: string;
}> {
  const cleanUrl = params.audioUrl.trim();
  if (
    !cleanUrl ||
    (!cleanUrl.startsWith('https://') &&
      !cleanUrl.startsWith('http://') &&
      !cleanUrl.startsWith('/'))
  ) {
    return {
      success: false,
      notice: 'يرجى إدخال رابط صوتي مباشر صالح يبدأ بـ https:// أو مسار داخل الموقع.',
    };
  }

  if (!auth.currentUser) {
    return {
      success: false,
      notice: 'يجب تسجيل الدخول بحساب المشرف أو المسؤول المعتمد لحفظ الأغنية ونشرها.',
    };
  }

  const songId = `song-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const cleanTitle = params.title.trim() || 'اسم غير معروف';
  const cleanArtist = params.artist.trim() || 'اسم غير معروف';
  const durSec = params.durationSeconds && params.durationSeconds > 0 ? params.durationSeconds : 0;
  const { keywords } = suggestSongCategoryAndKeywords(cleanTitle, cleanArtist, cleanUrl);
  const nowIso = new Date().toISOString();

  const newSong: GraduationSong = {
    id: songId,
    title: cleanTitle,
    artist: cleanArtist,
    durationSeconds: durSec,
    durationFormatted: formatSongDuration(durSec),
    category: params.category,
    audioUrl: cleanUrl,
    storageType: 'external_url',
    ...(params.coverUrl?.trim() ? { coverUrl: params.coverUrl.trim() } : {}),
    mimeType: 'audio/mpeg',
    fileSizeBytes: 0,
    allowDownload: params.allowDownload,
    keywords,
    sortOrder: params.sortOrder,
    createdAt: nowIso,
    updatedAt: nowIso,
    uploadedBy: auth.currentUser.email || auth.currentUser.uid || 'admin',
  };

  try {
    await setDoc(doc(db, 'graduation_songs', songId), newSong);
  } catch (err: any) {
    console.error('Firestore graduation_songs write error:', err);
    return {
      success: false,
      notice: `تعذر حفظ الأغنية في قاعدة بيانات Firestore: ${err?.message || 'خطأ في الصلاحيات'}`,
    };
  }

  const currentList = getLocalSongs();
  const updatedList = [...currentList, newSong].sort(
    (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)
  );
  saveLocalSongs(updatedList);

  return {
    success: true,
    song: newSong,
    notice: `تمت إضافة ونشر الأغنية «${cleanTitle}» في قاعدة بيانات المكتبة بنجاح!`,
  };
}

// Update song metadata (title, artist, category, coverUrl, allowDownload, sortOrder)
export async function updateGraduationSongMetadata(
  songId: string,
  updates: Partial<
    Pick<
      GraduationSong,
      | 'title'
      | 'artist'
      | 'category'
      | 'coverUrl'
      | 'allowDownload'
      | 'sortOrder'
      | 'durationSeconds'
      | 'durationFormatted'
    >
  >
): Promise<{ success: boolean; song?: GraduationSong; notice: string }> {
  if (!auth.currentUser) {
    return { success: false, notice: 'يجب تسجيل الدخول بحساب المشرف لتعديل الأغنية.' };
  }

  const currentList = getLocalSongs();
  const existing = currentList.find((s) => s.id === songId);
  if (!existing) {
    return { success: false, notice: 'لم يتم العثور على الأغنية المطلوبة.' };
  }

  const nextTitle =
    updates.title !== undefined ? updates.title.trim() || 'اسم غير معروف' : existing.title;
  const nextArtist =
    updates.artist !== undefined ? updates.artist.trim() || 'اسم غير معروف' : existing.artist;
  const nextCategory = updates.category || existing.category;
  const { keywords } = suggestSongCategoryAndKeywords(nextTitle, nextArtist);

  const updatedSong: GraduationSong = {
    ...existing,
    ...updates,
    title: nextTitle,
    artist: nextArtist,
    category: nextCategory,
    keywords,
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'graduation_songs', songId), updatedSong, { merge: true });
  } catch (err: any) {
    console.error('Firestore update song error:', err);
    return {
      success: false,
      notice: `فشل تحديث بيانات الأغنية في قاعدة البيانات: ${err?.message || err}`,
    };
  }

  const updatedList = currentList
    .map((s) => (s.id === songId ? updatedSong : s))
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  saveLocalSongs(updatedList);

  return {
    success: true,
    song: updatedSong,
    notice: 'تم تحديث بيانات الأغنية بنجاح في قاعدة البيانات.',
  };
}

// Delete a song from Firestore (including any audio_chunks), Firebase Storage, and local cache
export async function deleteGraduationSong(
  song: GraduationSong
): Promise<{ success: boolean; notice: string }> {
  if (!auth.currentUser) {
    return { success: false, notice: 'يجب تسجيل الدخول بحساب المشرف لحذف الأغنية.' };
  }

  try {
    // 1. If stored in Firestore chunks, delete the subcollection chunk documents
    if (song.storageType === 'firestore_chunks' || song.audioUrl.startsWith('firestore://')) {
      try {
        const chunksColl = collection(db, 'graduation_songs', song.id, 'audio_chunks');
        const snap = await getDocs(chunksColl);
        for (const chunkDoc of snap.docs) {
          await deleteDoc(chunkDoc.ref);
        }
      } catch (chunkErr) {
        console.warn('Error deleting audio chunks:', chunkErr);
      }
    }

    // 2. Delete parent metadata doc
    await deleteDoc(doc(db, 'graduation_songs', song.id));

    // 3. Delete Firebase Storage object if applicable
    if (song.storagePath && song.storageType === 'firebase_storage') {
      try {
        const storage = getStorage(app);
        await deleteObject(storageRef(storage, song.storagePath));
      } catch (stErr) {
        console.warn('Firebase Storage delete object note:', stErr);
      }
    }

    // 4. Delete local IndexedDB blob
    await deleteAudioBlobFromIndexedDB(song.id);
    const cachedUrl = activeBlobUrlCache.get(song.id);
    if (cachedUrl) {
      URL.revokeObjectURL(cachedUrl);
      activeBlobUrlCache.delete(song.id);
    }

    const currentList = getLocalSongs().filter((s) => s.id !== song.id);
    saveLocalSongs(currentList);

    return {
      success: true,
      notice: `تم حذف الأغنية «${song.title}» نهائياً من المكتبة وقاعدة البيانات.`,
    };
  } catch (err: any) {
    console.error('Firestore delete song error:', err);
    return {
      success: false,
      notice: `فشل حذف الأغنية من قاعدة البيانات: ${err?.message || err}`,
    };
  }
}

// Seed the official graduation song if Firestore has zero songs
export async function seedOfficialGraduationSongIfEmpty(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'graduation_songs'));
    if (!snap.empty) {
      return false; // Already has songs
    }

    if (!auth.currentUser) {
      return false;
    }

    const officialSongId = 'official-grad-anthem-2027';
    const nowIso = new Date().toISOString();
    const anthemSong: GraduationSong = {
      id: officialSongId,
      title: 'سلام يا دفعة الأمل 2027 (نشيد التخرج الرسمي)',
      artist: 'كورال معهد التمريض',
      durationSeconds: 215,
      durationFormatted: '03:35',
      category: 'nasheed',
      audioUrl: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=inspiring-cinematic-ambient-116199.mp3',
      storageType: 'external_url',
      coverUrl: '',
      mimeType: 'audio/mpeg',
      fileSizeBytes: 3500000,
      allowDownload: true,
      keywords: ['تخرج', 'نشيد', 'رسمي', 'تمريض', 'دفعة 2027'],
      sortOrder: 0,
      createdAt: nowIso,
      updatedAt: nowIso,
      uploadedBy: auth.currentUser.email || 'mustafaaalihassonkazh@gmail.com',
    };

    await setDoc(doc(db, 'graduation_songs', officialSongId), anthemSong);
    return true;
  } catch (err) {
    console.warn('Could not seed default song:', err);
    return false;
  }
}

// Smart & Traditional Search + Category Filter + Sort
export function filterAndSortSongsSmart(params: {
  songs: GraduationSong[];
  queryText: string;
  selectedCategory: SongCategory | 'all';
  sortBy: 'custom' | 'alphabetical' | 'newest' | 'duration';
}): {
  results: GraduationSong[];
  detectedSmartIntent?: string;
} {
  const { songs, queryText, selectedCategory, sortBy } = params;
  const trimmed = queryText.trim().toLowerCase();

  let detectedCategoryFromQuery: SongCategory | null = null;
  let detectedSmartIntent: string | undefined;

  if (trimmed) {
    if (
      trimmed.includes('حماس') ||
      trimmed.includes('حماسية') ||
      trimmed.includes('سريعة') ||
      trimmed.includes('طاقة')
    ) {
      detectedCategoryFromQuery = 'energetic';
      detectedSmartIntent = 'البحث الذكي: تم التعرف على طلب «موسيقى وأغاني حماسية»';
    } else if (
      trimmed.includes('هادئ') ||
      trimmed.includes('هادئة') ||
      trimmed.includes('بيانو') ||
      trimmed.includes('رومانسي')
    ) {
      detectedCategoryFromQuery = 'calm';
      detectedSmartIntent = 'البحث الذكي: تم التعرف على طلب «موسيقى هادئة للحفل»';
    } else if (
      trimmed.includes('نشيد') ||
      trimmed.includes('أناشيد') ||
      trimmed.includes('اناشيد') ||
      trimmed.includes('انشودة')
    ) {
      detectedCategoryFromQuery = 'nasheed';
      detectedSmartIntent = 'البحث الذكي: تم التعرف على طلب «الأناشيد»';
    } else if (
      trimmed.includes('حفلة') ||
      trimmed.includes('حفلات') ||
      trimmed.includes('سكراب')
    ) {
      detectedCategoryFromQuery = 'party';
      detectedSmartIntent = 'البحث الذكي: تم التعرف على طلب «أغاني الحفلات»';
    } else if (trimmed.includes('تخرج') || trimmed.includes('خريجين')) {
      detectedCategoryFromQuery = 'graduation';
      detectedSmartIntent = 'البحث الذكي: تم التعرف على طلب «أغاني التخرج»';
    }
  }

  // Stopwords in natural Arabic queries (e.g., "أغاني تخرج حماسية" or "موسيقى هادئة للحفل")
  const genericQueryWords = new Set([
    'اغاني',
    'أغاني',
    'اغنية',
    'أغنية',
    'موسيقى',
    'للحفل',
    'للحفلة',
    'في',
    'من',
    'على',
    'عن',
    'اريد',
    'أريد',
  ]);

  const specificSearchTokens = trimmed
    .split(/\s+/)
    .filter((tok) => tok.length >= 2 && !genericQueryWords.has(tok));

  const filtered = songs.filter((song) => {
    // 1. Explicit Category Tab Filter
    if (selectedCategory !== 'all' && song.category !== selectedCategory) {
      return false;
    }

    if (!trimmed) return true;

    const hay = `${song.title} ${song.artist} ${getSongCategoryLabel(
      song.category
    )} ${(song.keywords || []).join(' ')}`.toLowerCase();

    // Direct substring match
    if (hay.includes(trimmed)) return true;

    // Smart intent match
    if (detectedCategoryFromQuery && song.category === detectedCategoryFromQuery) {
      return true;
    }

    // Token match
    if (
      specificSearchTokens.length > 0 &&
      specificSearchTokens.some((tok) => hay.includes(tok))
    ) {
      return true;
    }

    return false;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'alphabetical') {
      return a.title.localeCompare(b.title, 'ar');
    }
    if (sortBy === 'newest') {
      return (b.createdAt || '').localeCompare(a.createdAt || '');
    }
    if (sortBy === 'duration') {
      return (b.durationSeconds || 0) - (a.durationSeconds || 0);
    }
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });

  return { results: sorted, detectedSmartIntent };
}

// Suggest similar songs based on category and shared keywords
export function getSimilarSongs(
  currentSong: GraduationSong | null,
  allSongs: GraduationSong[],
  limit = 4
): GraduationSong[] {
  if (!currentSong || allSongs.length <= 1) return [];

  const currentKeywords = new Set(
    (currentSong.keywords || []).map((k) => k.toLowerCase())
  );

  return allSongs
    .filter((s) => s.id !== currentSong.id)
    .map((candidate) => {
      let score = 0;
      if (candidate.category === currentSong.category) score += 3;
      if (
        candidate.artist !== 'اسم غير معروف' &&
        candidate.artist === currentSong.artist
      ) {
        score += 2;
      }
      for (const kw of candidate.keywords || []) {
        if (currentKeywords.has(kw.toLowerCase())) {
          score += 1;
        }
      }
      return { candidate, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.candidate);
}

// Download a song safely with verification and clear Arabic error messages
export async function downloadGraduationSong(
  song: GraduationSong
): Promise<{ success: boolean; message: string }> {
  if (!song.allowDownload) {
    return {
      success: false,
      message: 'تنزيل هذه الأغنية غير متاح بناءً على إعدادات صلاحيات التوزيع.',
    };
  }

  const resolved = await resolvePlayableSongUrl(song);
  if (!resolved.url) {
    return {
      success: false,
      message:
        resolved.error || 'ملف الأغنية غير متوفر للتنزيل حالياً أو انتهت صلاحية الرابط.',
    };
  }

  const ext = song.mimeType.includes('wav')
    ? 'wav'
    : song.mimeType.includes('mp4') || song.mimeType.includes('m4a')
    ? 'm4a'
    : 'mp3';
  const safeDownloadName = `${song.title}${
    song.artist && song.artist !== 'اسم غير معروف' ? ` - ${song.artist}` : ''
  }.${ext}`;

  try {
    // If it's already a blob: URL from IndexedDB, trigger direct download
    if (resolved.url.startsWith('blob:')) {
      const a = document.createElement('a');
      a.href = resolved.url;
      a.download = safeDownloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return { success: true, message: `جاري تنزيل «${song.title}»...` };
    }

    // Try fetching as Blob to verify link validity and force download on Android/iOS browsers
    const response = await fetch(resolved.url, { method: 'GET' });
    if (!response.ok) {
      return {
        success: false,
        message: `تعذر تنزيل الملف (رمز الحالة ${response.status}). قد يكون الرابط منتهي الصلاحية أو غير متاح.`,
      };
    }

    const blob = await response.blob();
    if (blob.size === 0) {
      return {
        success: false,
        message: 'الملف المستلم فارغ أو غير صالح للتنزيل.',
      };
    }

    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = safeDownloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);

    return { success: true, message: `تم بدء تنزيل «${song.title}» بنجاح.` };
  } catch {
    // If CORS blocks fetch() on an external CDN, open direct download anchor fallback
    try {
      const a = document.createElement('a');
      a.href = resolved.url;
      a.download = safeDownloadName;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return {
        success: true,
        message: `تم فتح رابط التنزيل المباشر للأغنية «${song.title}».`,
      };
    } catch {
      return {
        success: false,
        message: 'تعذر إتمام التنزيل. قد يكون الرابط منتهي الصلاحية أو محظوراً من المصدر.',
      };
    }
  }
}
