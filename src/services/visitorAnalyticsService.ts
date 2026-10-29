import {
  collection,
  doc,
  getDocs,
  onSnapshot,
  runTransaction,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from './firebase';

export interface SiteAnalyticsSummaryDoc {
  totalVisits: number;
  uniqueVisitorsEstimate: number;
  lastUpdatedAt: string;
  lastVisitDate: string;
}

export interface SiteAnalyticsDailyDoc {
  dateKey: string; // YYYY-MM-DD in Asia/Baghdad
  visits: number;
  uniqueVisitors: number;
  updatedAt: string;
}

export interface DailyAnalyticsPoint {
  dateKey: string;
  shortLabel: string;
  fullLabel: string;
  visits: number;
  uniqueVisitors: number;
}

export interface ComputedSiteAnalytics {
  totalVisits: number;
  uniqueVisitorsEstimate: number;
  todayVisits: number;
  todayUniqueVisitors: number;
  last7DaysVisits: number;
  last7DaysUniqueVisitors: number;
  last30DaysVisits: number;
  last30DaysUniqueVisitors: number;
  lastUpdatedAt: string | null;
  dailySeries14: DailyAnalyticsPoint[];
  dailySeries30: DailyAnalyticsPoint[];
  isLiveConnected: boolean;
}

const SESSION_VISIT_KEY = 'nursing2027_active_visit_session_v1';
const LAST_VISIT_TIMESTAMP_KEY = 'nursing2027_last_visit_ts_v1';
const ANON_VISITOR_TOKEN_KEY = 'nursing2027_anon_visitor_id_v1';
const GLOBAL_UNIQUE_COUNTED_KEY = 'nursing2027_unique_visitor_counted_v1';
const LOCAL_ANALYTICS_CACHE_KEY = 'nursing2027_site_analytics_cache_v1';

// Cooldown window (30 minutes) so refreshing the page does not inflate totalVisits
const VISIT_COOLDOWN_MS = 30 * 60 * 1000;

let visitRecordingInFlight = false;

/**
 * Returns YYYY-MM-DD in Asia/Baghdad timezone
 */
export function getBaghdadDateKey(date: Date = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Baghdad',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const y = parts.find((p) => p.type === 'year')?.value || String(date.getFullYear());
    const m = parts.find((p) => p.type === 'month')?.value || String(date.getMonth() + 1).padStart(2, '0');
    const d = parts.find((p) => p.type === 'day')?.value || String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  } catch {
    return date.toISOString().split('T')[0];
  }
}

/**
 * Generates last N calendar date keys (oldest -> newest) in Asia/Baghdad timezone
 */
export function getRecentDateKeys(daysCount: number): Array<{
  dateKey: string;
  shortLabel: string;
  fullLabel: string;
}> {
  const result: Array<{ dateKey: string; shortLabel: string; fullLabel: string }> = [];
  const now = new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dateKey = getBaghdadDateKey(d);
    let shortLabel = dateKey.slice(5); // MM-DD
    let fullLabel = dateKey;
    try {
      shortLabel = new Intl.DateTimeFormat('ar-IQ', {
        timeZone: 'Asia/Baghdad',
        month: 'short',
        day: 'numeric',
      }).format(d);
      fullLabel = new Intl.DateTimeFormat('ar-IQ', {
        timeZone: 'Asia/Baghdad',
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(d);
    } catch {
      // fallback to ISO slice
    }
    result.push({ dateKey, shortLabel, fullLabel });
  }
  return result;
}

/**
 * Ensures an anonymous, non-invasive random token exists in localStorage
 * without collecting any personal data or hardware fingerprint.
 */
function ensureAnonymousVisitorToken(): string {
  try {
    let existing = localStorage.getItem(ANON_VISITOR_TOKEN_KEY);
    if (!existing) {
      existing = `v-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      localStorage.setItem(ANON_VISITOR_TOKEN_KEY, existing);
    }
    return existing;
  } catch {
    return `v-mem-${Date.now()}`;
  }
}

/**
 * Records a real site visit upon opening the website (works for both guests and logged-in users).
 * Prevents page reloads (F5) from counting as new visits or new unique visitors.
 */
export async function recordWebsiteVisitOncePerSession(): Promise<void> {
  if (typeof window === 'undefined' || visitRecordingInFlight) return;

  try {
    ensureAnonymousVisitorToken();
    const todayKey = getBaghdadDateKey();
    const nowMs = Date.now();

    // Check if this browser tab session or recent 30-min window already recorded a visit
    const activeSessionRecorded = sessionStorage.getItem(SESSION_VISIT_KEY) === '1';
    const lastVisitTsRaw = localStorage.getItem(LAST_VISIT_TIMESTAMP_KEY);
    const lastVisitTs = lastVisitTsRaw ? Number(lastVisitTsRaw) : 0;
    const isWithinCooldown = lastVisitTs > 0 && nowMs - lastVisitTs < VISIT_COOLDOWN_MS;

    if (activeSessionRecorded || isWithinCooldown) {
      return; // Page refresh / reload within session — do not increment visit counters
    }

    visitRecordingInFlight = true;

    // Determine whether this visitor is a new global unique visitor and/or new daily unique visitor
    const isNewGlobalUnique = localStorage.getItem(GLOBAL_UNIQUE_COUNTED_KEY) !== '1';
    const dailyUniqueStorageKey = `nursing2027_daily_unique_${todayKey}`;
    const isNewDailyUnique = localStorage.getItem(dailyUniqueStorageKey) !== '1';

    // Mark session & cooldown immediately to prevent duplicate triggers on rapid re-renders
    sessionStorage.setItem(SESSION_VISIT_KEY, '1');
    localStorage.setItem(LAST_VISIT_TIMESTAMP_KEY, String(nowMs));
    if (isNewGlobalUnique) {
      localStorage.setItem(GLOBAL_UNIQUE_COUNTED_KEY, '1');
    }
    if (isNewDailyUnique) {
      localStorage.setItem(dailyUniqueStorageKey, '1');
    }

    const nowIso = new Date().toISOString();

    if (isFirebaseConfigured) {
      const summaryRef = doc(db, 'site_analytics', 'global_stats');
      const dailyRef = doc(db, 'site_analytics_daily', todayKey);

      await runTransaction(db, async (tx) => {
        const [summarySnap, dailySnap] = await Promise.all([
          tx.get(summaryRef),
          tx.get(dailyRef),
        ]);

        const prevTotalVisits = summarySnap.exists()
          ? Math.max(0, Number(summarySnap.data()?.totalVisits) || 0)
          : 0;
        const prevUniqueVisitors = summarySnap.exists()
          ? Math.max(0, Number(summarySnap.data()?.uniqueVisitorsEstimate) || 0)
          : 0;

        const nextTotalVisits = prevTotalVisits + 1;
        const nextUniqueVisitors = Math.max(
          1,
          prevUniqueVisitors + (isNewGlobalUnique || prevUniqueVisitors === 0 ? 1 : 0)
        );

        const prevDailyVisits = dailySnap.exists()
          ? Math.max(0, Number(dailySnap.data()?.visits) || 0)
          : 0;
        const prevDailyUnique = dailySnap.exists()
          ? Math.max(0, Number(dailySnap.data()?.uniqueVisitors) || 0)
          : 0;

        const nextDailyVisits = prevDailyVisits + 1;
        const nextDailyUnique = Math.max(
          1,
          prevDailyUnique + (isNewDailyUnique || prevDailyUnique === 0 ? 1 : 0)
        );

        tx.set(
          summaryRef,
          {
            totalVisits: nextTotalVisits,
            uniqueVisitorsEstimate: nextUniqueVisitors,
            lastUpdatedAt: nowIso,
            lastVisitDate: todayKey,
          },
          { merge: true }
        );

        tx.set(
          dailyRef,
          {
            dateKey: todayKey,
            visits: nextDailyVisits,
            uniqueVisitors: nextDailyUnique,
            updatedAt: nowIso,
          },
          { merge: true }
        );
      });
    }
  } catch (err) {
    console.warn('Visitor analytics recording notice:', err);
  } finally {
    visitRecordingInFlight = false;
  }
}

/**
 * Computes aggregated metrics (Today, Last 7 Days, Last 30 Days, Daily Chart Series)
 * strictly from real Firestore documents without any fake or random numbers.
 */
export function buildComputedSiteAnalytics(
  summaryDoc: SiteAnalyticsSummaryDoc | null,
  dailyMap: Map<string, SiteAnalyticsDailyDoc>,
  isLiveConnected: boolean
): ComputedSiteAnalytics {
  const todayKey = getBaghdadDateKey();
  const recent30 = getRecentDateKeys(30);
  const recent7Keys = new Set(recent30.slice(-7).map((d) => d.dateKey));

  let sum30Visits = 0;
  let sum30Unique = 0;
  let sum7Visits = 0;
  let sum7Unique = 0;

  const dailySeries30: DailyAnalyticsPoint[] = recent30.map((d) => {
    const rec = dailyMap.get(d.dateKey);
    const visits = rec ? Math.max(0, Number(rec.visits) || 0) : 0;
    const uniqueVisitors = rec ? Math.max(0, Number(rec.uniqueVisitors) || 0) : 0;

    sum30Visits += visits;
    sum30Unique += uniqueVisitors;

    if (recent7Keys.has(d.dateKey)) {
      sum7Visits += visits;
      sum7Unique += uniqueVisitors;
    }

    return {
      dateKey: d.dateKey,
      shortLabel: d.shortLabel,
      fullLabel: d.fullLabel,
      visits,
      uniqueVisitors,
    };
  });

  const dailySeries14 = dailySeries30.slice(-14);
  const todayRec = dailyMap.get(todayKey);
  const todayVisits = todayRec ? Math.max(0, Number(todayRec.visits) || 0) : 0;
  const todayUniqueVisitors = todayRec ? Math.max(0, Number(todayRec.uniqueVisitors) || 0) : 0;

  const totalVisits = Math.max(
    summaryDoc ? Math.max(0, Number(summaryDoc.totalVisits) || 0) : 0,
    sum30Visits
  );
  const uniqueVisitorsEstimate = Math.max(
    summaryDoc ? Math.max(0, Number(summaryDoc.uniqueVisitorsEstimate) || 0) : 0,
    todayUniqueVisitors
  );

  const computed: ComputedSiteAnalytics = {
    totalVisits,
    uniqueVisitorsEstimate,
    todayVisits,
    todayUniqueVisitors,
    last7DaysVisits: sum7Visits,
    last7DaysUniqueVisitors: sum7Unique,
    last30DaysVisits: sum30Visits,
    last30DaysUniqueVisitors: sum30Unique,
    lastUpdatedAt: summaryDoc?.lastUpdatedAt || todayRec?.updatedAt || null,
    dailySeries14,
    dailySeries30,
    isLiveConnected,
  };

  try {
    localStorage.setItem(LOCAL_ANALYTICS_CACHE_KEY, JSON.stringify(computed));
  } catch {
    // ignore storage quota errors
  }

  return computed;
}

export function getCachedSiteAnalytics(): ComputedSiteAnalytics {
  try {
    const raw = localStorage.getItem(LOCAL_ANALYTICS_CACHE_KEY);
    if (raw) {
      return JSON.parse(raw) as ComputedSiteAnalytics;
    }
  } catch {
    // ignore
  }
  return buildComputedSiteAnalytics(null, new Map(), false);
}

/**
 * Subscribes in real-time to Firestore visitor analytics (/site_analytics/global_stats & /site_analytics_daily).
 */
export function subscribeToSiteAnalytics(
  onUpdate: (analytics: ComputedSiteAnalytics) => void
): () => void {
  if (!isFirebaseConfigured) {
    onUpdate(getCachedSiteAnalytics());
    return () => {};
  }

  let currentSummary: SiteAnalyticsSummaryDoc | null = null;
  const currentDailyMap = new Map<string, SiteAnalyticsDailyDoc>();
  let summaryConnected = false;
  let dailyConnected = false;

  const emit = () => {
    onUpdate(
      buildComputedSiteAnalytics(
        currentSummary,
        currentDailyMap,
        summaryConnected || dailyConnected
      )
    );
  };

  const unsubSummary = onSnapshot(
    doc(db, 'site_analytics', 'global_stats'),
    (snap) => {
      summaryConnected = true;
      if (snap.exists()) {
        currentSummary = snap.data() as SiteAnalyticsSummaryDoc;
      }
      emit();
    },
    (err) => {
      console.warn('site_analytics summary listener notice:', err);
    }
  );

  const unsubDaily = onSnapshot(
    collection(db, 'site_analytics_daily'),
    (snap) => {
      dailyConnected = true;
      currentDailyMap.clear();
      snap.forEach((docSnap) => {
        const data = docSnap.data() as SiteAnalyticsDailyDoc;
        currentDailyMap.set(docSnap.id, {
          dateKey: data.dateKey || docSnap.id,
          visits: Number(data.visits) || 0,
          uniqueVisitors: Number(data.uniqueVisitors) || 0,
          updatedAt: data.updatedAt || '',
        });
      });
      emit();
    },
    (err) => {
      console.warn('site_analytics_daily listener notice:', err);
    }
  );

  return () => {
    unsubSummary();
    unsubDaily();
  };
}

/**
 * Manual refresh helper for Admin Dashboard
 */
export async function fetchSiteAnalyticsSnapshot(): Promise<ComputedSiteAnalytics> {
  if (!isFirebaseConfigured) {
    return getCachedSiteAnalytics();
  }
  try {
    const [summarySnap, dailySnap] = await Promise.all([
      getDocs(collection(db, 'site_analytics')),
      getDocs(collection(db, 'site_analytics_daily')),
    ]);

    let summaryDoc: SiteAnalyticsSummaryDoc | null = null;
    summarySnap.forEach((d) => {
      if (d.id === 'global_stats') {
        summaryDoc = d.data() as SiteAnalyticsSummaryDoc;
      }
    });

    const dailyMap = new Map<string, SiteAnalyticsDailyDoc>();
    dailySnap.forEach((d) => {
      const data = d.data() as SiteAnalyticsDailyDoc;
      dailyMap.set(d.id, {
        dateKey: data.dateKey || d.id,
        visits: Number(data.visits) || 0,
        uniqueVisitors: Number(data.uniqueVisitors) || 0,
        updatedAt: data.updatedAt || '',
      });
    });

    return buildComputedSiteAnalytics(summaryDoc, dailyMap, true);
  } catch (err) {
    console.warn('fetchSiteAnalyticsSnapshot notice:', err);
    return getCachedSiteAnalytics();
  }
}
