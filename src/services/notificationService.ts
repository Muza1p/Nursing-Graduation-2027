import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  arrayUnion,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { PageRoute } from '../context/AppContext';

export type NotificationType =
  | 'moderator_request'
  | 'moderator_approval'
  | 'announcement'
  | 'event_update'
  | 'financial_link_approved'
  | 'payment_status'
  | 'receipt_added'
  | 'account_alert'
  | 'song'
  | 'general';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  targetAudience: 'all' | 'admins' | 'user';
  targetUserId?: string;
  readBy: string[];
  isRead?: boolean;
  linkRoute?: PageRoute;
  createdAt: string;
  createdBy?: string;
}

const NOTIFICATIONS_STORAGE_KEY = 'nursing_grad_notifications_v2';

export function getLocalNotifications(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveLocalNotifications(notifs: AppNotification[]): void {
  try {
    localStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(notifs));
  } catch (e) {
    console.warn('Could not save notifications to localStorage:', e);
  }
}

/**
 * Filter notifications for a specific user based on audience:
 * - 'all': everyone sees it
 * - 'admins': only supervisors / admins see it
 * - 'user': only the specific targetUserId sees it
 */
export function filterNotificationsForUser(
  notifs: AppNotification[],
  userId?: string | null,
  isStaff?: boolean
): AppNotification[] {
  return notifs
    .filter((n) => {
      if (n.targetAudience === 'all') return true;
      if (n.targetAudience === 'admins') return Boolean(isStaff);
      if (n.targetAudience === 'user') return userId && n.targetUserId === userId;
      return false;
    })
    .map((n) => ({
      ...n,
      isRead: Boolean(userId && n.readBy && n.readBy.includes(userId)),
    }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Send a new real-time notification persisted in Firestore
 */
export async function sendAppNotification(params: {
  title: string;
  message: string;
  type: NotificationType;
  targetAudience: 'all' | 'admins' | 'user';
  targetUserId?: string;
  linkRoute?: PageRoute;
}): Promise<{ success: boolean; id: string; error?: string }> {
  const notifId = `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const nowIso = new Date().toISOString();

  const notifData: AppNotification = {
    id: notifId,
    title: params.title.trim(),
    message: params.message.trim(),
    type: params.type,
    targetAudience: params.targetAudience,
    ...(params.targetUserId ? { targetUserId: params.targetUserId } : {}),
    readBy: [],
    ...(params.linkRoute ? { linkRoute: params.linkRoute } : {}),
    createdAt: nowIso,
    createdBy: auth.currentUser?.email || auth.currentUser?.uid || 'system',
  };

  try {
    await setDoc(doc(db, 'notifications', notifId), notifData);

    // Save to local cache
    const current = getLocalNotifications();
    saveLocalNotifications([notifData, ...current]);

    return { success: true, id: notifId };
  } catch (err: any) {
    console.warn('Firestore sendAppNotification warning:', err);
    // Even if offline, save locally
    const current = getLocalNotifications();
    saveLocalNotifications([notifData, ...current]);
    return { success: true, id: notifId };
  }
}

/**
 * Mark a single notification as read by current user
 */
export async function markNotificationAsRead(
  notificationId: string,
  userId: string
): Promise<void> {
  if (!userId || !notificationId) return;

  // 1. Update local cache
  const current = getLocalNotifications();
  const updated = current.map((n) => {
    if (n.id === notificationId) {
      const readBy = Array.from(new Set([...(n.readBy || []), userId]));
      return { ...n, readBy, isRead: true };
    }
    return n;
  });
  saveLocalNotifications(updated);

  // 2. Persist to Firestore
  try {
    await updateDoc(doc(db, 'notifications', notificationId), {
      readBy: arrayUnion(userId),
    });
  } catch (err) {
    console.warn('Firestore markNotificationAsRead error:', err);
  }
}

/**
 * Mark all visible notifications as read by current user
 */
export async function markAllNotificationsAsRead(
  notifIds: string[],
  userId: string
): Promise<void> {
  if (!userId || notifIds.length === 0) return;

  // 1. Update local cache
  const current = getLocalNotifications();
  const idSet = new Set(notifIds);
  const updated = current.map((n) => {
    if (idSet.has(n.id)) {
      const readBy = Array.from(new Set([...(n.readBy || []), userId]));
      return { ...n, readBy, isRead: true };
    }
    return n;
  });
  saveLocalNotifications(updated);

  // 2. Persist each in Firestore
  for (const id of notifIds) {
    try {
      await updateDoc(doc(db, 'notifications', id), {
        readBy: arrayUnion(userId),
      });
    } catch {
      // Ignore per-doc errors
    }
  }
}

/**
 * Listen to real-time notifications from Firestore
 */
export function subscribeToNotifications(
  userId: string | null | undefined,
  isStaff: boolean,
  onUpdate: (notifs: AppNotification[]) => void
): () => void {
  try {
    const unsub = onSnapshot(
      collection(db, 'notifications'),
      (snapshot) => {
        const cloudNotifs = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() } as AppNotification)
        );
        saveLocalNotifications(cloudNotifs);
        const filtered = filterNotificationsForUser(cloudNotifs, userId, isStaff);
        onUpdate(filtered);
      },
      (error) => {
        console.warn('Real-time notifications onSnapshot note:', error);
        const local = getLocalNotifications();
        const filtered = filterNotificationsForUser(local, userId, isStaff);
        onUpdate(filtered);
      }
    );

    return unsub;
  } catch (err) {
    console.warn('subscribeToNotifications setup error:', err);
    const local = getLocalNotifications();
    const filtered = filterNotificationsForUser(local, userId, isStaff);
    onUpdate(filtered);
    return () => {};
  }
}
