
import { useState, useEffect } from 'react';

export const useOfflineSync = (appScriptUrl: string, showToast: (msg: string, type: 'success' | 'error' | 'info') => void, onSyncComplete: () => void) => {
    const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'offline_saved'>('idle');
    const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isPoorConnection, setIsPoorConnection] = useState(false);

    useEffect(() => {
        const savedQueue = localStorage.getItem('safetycheck_offline_queue');
        if (savedQueue) {
            try { setOfflineQueue(JSON.parse(savedQueue)); } catch(e) {}
        }

        const handleOnline = () => {
            setIsPoorConnection(false);
            showToast("Connection restored. Attempting background sync...", 'info');
            syncOfflineQueue();
        };

        const handleOffline = () => {
            setIsPoorConnection(false); // Reset this as we are definitely offline now
        };

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const syncOfflineQueue = async () => {
        if (isSyncing) return;
        
        // Re-read latest from local storage just in case
        const queue = JSON.parse(localStorage.getItem('safetycheck_offline_queue') || '[]');
        if (queue.length === 0) return;
  
        setIsSyncing(true);
        setIsPoorConnection(false);
        
        let successCount = 0;
        let currentQueue = [...queue];
        const totalItems = currentQueue.length;
  
        try {
            // Process queue one by one to ensure order
            while (currentQueue.length > 0) {
                const item = currentQueue[0];
                try {
                    // Add a timeout to the fetch to detect poor connections faster
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

                    const response = await fetch(appScriptUrl, {
                        method: 'POST',
                        body: JSON.stringify(item),
                        mode: 'no-cors',
                        headers: { 'Content-Type': 'text/plain' },
                        signal: controller.signal
                    });
                    
                    clearTimeout(timeoutId);

                    // If we get here in no-cors, we assume it went through (opaque response)
                    // If it was a network error, it would throw.
                    
                    currentQueue.shift(); // Remove successful item
                    successCount++;
                    
                    // Update State & Storage immediately
                    setOfflineQueue([...currentQueue]);
                    localStorage.setItem('safetycheck_offline_queue', JSON.stringify(currentQueue));
                    
                    // Small delay between requests to not overwhelm a poor connection
                    await new Promise(r => setTimeout(r, 1000));

                } catch (error: any) {
                    console.error("Sync failed for item", error);
                    if (error.name === 'AbortError' || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
                        setIsPoorConnection(true);
                        // Stop processing the queue if connection is bad, try again later
                        break; 
                    }
                    // If it's a logic error, we might want to skip it, but for now we break to be safe
                    break;
                }
            }
        } finally {
            setIsSyncing(false);
            if (successCount > 0) {
                if (currentQueue.length === 0) {
                    showToast(`All ${successCount} offline records synced successfully!`, 'success');
                    onSyncComplete();
                } else {
                    showToast(`Synced ${successCount} items. ${currentQueue.length} remaining.`, 'info');
                }
            } else if (isPoorConnection && queue.length > 0) {
                // Toast handled by UI component usually, but good to log
            }
        }
    };

    const addToQueue = (payload: any) => {
        const newQueue = [...offlineQueue, payload];
        setOfflineQueue(newQueue);
        localStorage.setItem('safetycheck_offline_queue', JSON.stringify(newQueue));
    };

    return {
        submissionStatus,
        setSubmissionStatus,
        offlineQueue,
        isSyncing,
        isPoorConnection,
        syncOfflineQueue,
        addToQueue
    };
};
