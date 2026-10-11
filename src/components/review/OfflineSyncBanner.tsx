import React, { useState, useEffect } from 'react';
import { getPendingOfflineReviews, processOfflineQueue } from '../../db/offlineQueue';
import { useAccessibility } from '../../context/AccessibilityContext';
import { CloudUpload, WifiOff, CheckCircle2 } from 'lucide-react';

export const OfflineSyncBanner: React.FC = () => {
  const { announce } = useAccessibility();
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');

  const refreshPendingCount = async () => {
    try {
      const items = await getPendingOfflineReviews();
      setPendingCount(items.length);
    } catch {
      setPendingCount(0);
    }
  };

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      setIsOnline(true);
      announce('Internet connection restored. Synchronizing queued accessibility audits...');
      triggerSync();
    };

    const handleOffline = () => {
      setIsOnline(false);
      announce('You are now working offline. Accessibility reviews will be stored in IndexedDB.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const interval = setInterval(refreshPendingCount, 8000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const triggerSync = async () => {
    if (!isOnline || isSyncing) return;
    setIsSyncing(true);

    try {
      const result = await processOfflineQueue(async (review) => {
        // Mock remote sync delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        return true;
      });

      if (result.syncedCount > 0) {
        setSyncMessage(`Successfully synced ${result.syncedCount} queued review(s)!`);
        announce(`Successfully synced ${result.syncedCount} queued review(s) to AccessPath.`);
        setTimeout(() => setSyncMessage(''), 5000);
      }
      refreshPendingCount();
    } catch (err) {
      console.error('Failed to sync queue:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isOnline && pendingCount === 0 && !syncMessage) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-600 text-white px-4 py-2 text-xs md:text-sm font-medium flex flex-wrap items-center justify-between gap-2 shadow-sm"
    >
      <div className="flex items-center gap-2">
        {!isOnline ? (
          <>
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Offline mode active: Reviews are safely saved locally on this device.</span>
          </>
        ) : syncMessage ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" aria-hidden="true" />
            <span>{syncMessage}</span>
          </>
        ) : (
          <>
            <CloudUpload className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>{pendingCount} review(s) waiting in offline queue.</span>
          </>
        )}
      </div>

      {isOnline && pendingCount > 0 && (
        <button
          onClick={triggerSync}
          disabled={isSyncing}
          className="px-3 py-1 bg-white text-amber-800 font-bold rounded-lg hover:bg-amber-50 focus:outline-none min-h-[36px] disabled:opacity-50"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  );
};
