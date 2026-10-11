import { ReviewSubmission } from '../types/accessibility';

const DB_NAME = 'accesspath_offline_db';
const DB_VERSION = 1;
const STORE_NAME = 'pending_reviews';

interface QueuedItem {
  id: string;
  review: ReviewSubmission;
  queuedAt: string;
  status: 'pending' | 'syncing' | 'failed';
  retryCount: number;
  lastError?: string;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('status', 'status', { unique: false });
        store.createIndex('queuedAt', 'queuedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Saves a review to IndexedDB offline queue
 */
export async function queueOfflineReview(review: ReviewSubmission): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);

    const queuedItem: QueuedItem = {
      id: review.id,
      review,
      queuedAt: new Date().toISOString(),
      status: 'pending',
      retryCount: 0,
    };

    const req = store.put(queuedItem);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Retrieves all pending reviews from IndexedDB
 */
export async function getPendingOfflineReviews(): Promise<QueuedItem[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();

    req.onsuccess = () => {
      const items: QueuedItem[] = req.result || [];
      resolve(items.filter((i) => i.status === 'pending' || i.status === 'failed'));
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Removes a synced review from IndexedDB
 */
export async function removeSyncedReview(id: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Sync function to send queued reviews to the remote/local repository
 */
export async function processOfflineQueue(
  syncHandler: (review: ReviewSubmission) => Promise<boolean>
): Promise<{ syncedCount: number; failedCount: number }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { syncedCount: 0, failedCount: 0 };
  }

  const pending = await getPendingOfflineReviews();
  let syncedCount = 0;
  let failedCount = 0;

  for (const item of pending) {
    try {
      const success = await syncHandler(item.review);
      if (success) {
        await removeSyncedReview(item.id);
        syncedCount++;
      } else {
        failedCount++;
      }
    } catch {
      failedCount++;
    }
  }

  return { syncedCount, failedCount };
}
