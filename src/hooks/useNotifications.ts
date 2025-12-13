
import { useState, useEffect } from 'react';
import { AppNotification, User } from '../types';

const MAX_NOTIFICATIONS = 50; // Professional cap to prevent UI clutter

export const useNotifications = (appScriptUrl: string, currentUser: User | null, showToast: (msg: string, type: 'success' | 'error' | 'info') => void) => {
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
    const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
    const [globalAcknowledgedIds, setGlobalAcknowledgedIds] = useState<string[]>([]);
    const [notifiedIds, setNotifiedIds] = useState<string[]>([]); // Track IDs we already toasted for
    const [pushEnabled, setPushEnabled] = useState(false);

    useEffect(() => {
        if (!currentUser) return;
        const userPrefix = currentUser.username + '_';
        const savedRead = localStorage.getItem(`sc_read_notifications_${userPrefix}`);
        const savedDismissed = localStorage.getItem(`sc_dismissed_notifications_${userPrefix}`);
        if (savedRead) setReadNotificationIds(JSON.parse(savedRead));
        if (savedDismissed) setDismissedNotificationIds(JSON.parse(savedDismissed));
        
        // Check Push Permission State
        if ('Notification' in window && Notification.permission === 'granted') {
            setPushEnabled(true);
        }
    }, [currentUser]);

    const requestPushPermission = async () => {
        if (!('Notification' in window)) {
            showToast("This browser does not support system notifications.", "error");
            return false;
        }
        
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                setPushEnabled(true);
                // Send a test notification
                sendSystemNotification("Notifications Enabled", {
                    body: "You will now receive system alerts for critical inspection updates.",
                    icon: "https://cdn-icons-png.flaticon.com/512/716/716766.png"
                });
                return true;
            } else {
                setPushEnabled(false);
                return false;
            }
        } catch (e) {
            console.error("Permission request error", e);
            return false;
        }
    };

    const sendSystemNotification = (title: string, options: NotificationOptions) => {
        if (Notification.permission === 'granted') {
            try {
                // Try Service Worker first for mobile/PWA support
                if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, options);
                    });
                } else {
                    // Fallback to standard API
                    new Notification(title, options);
                }
            } catch (e) {
                console.error("Notification trigger failed", e);
            }
        }
    };

    const saveReadState = (ids: string[]) => {
        if (!currentUser) return;
        const userPrefix = currentUser.username + '_';
        localStorage.setItem(`sc_read_notifications_${userPrefix}`, JSON.stringify(ids));
        setReadNotificationIds(ids);
    };

    const saveDismissedState = (ids: string[]) => {
        if (!currentUser) return;
        const userPrefix = currentUser.username + '_';
        localStorage.setItem(`sc_dismissed_notifications_${userPrefix}`, JSON.stringify(ids));
        setDismissedNotificationIds(ids);
    };

    const fetchNotifications = async () => {
        // Strict Validation before attempting fetch
        if (!appScriptUrl || typeof appScriptUrl !== 'string' || !appScriptUrl.startsWith('http')) return;
        if (!navigator.onLine || !currentUser) return;

        try {
            const response = await fetch(`${appScriptUrl}?t=${new Date().getTime()}`);
            
            if (!response.ok) {
                // Silently return on server errors to avoid console spam during polling
                return;
            }

            const text = await response.text();
            // Guard against HTML responses (e.g. Google Login page or 404s)
            if (!text || text.trim().startsWith('<')) {
                return;
            }

            let json;
            try {
                json = JSON.parse(text);
            } catch (parseErr) {
                // Silent return on JSON parse error
                return;
            }
            
            const serverAcknowledgements = json['Acknowledgements'] || [];
            setGlobalAcknowledgedIds(serverAcknowledgements);

            let allAlerts: AppNotification[] = [];

            // --- 1. Inspection Alerts Logic ---
            const processForAlerts = (rows: any[], type: string): AppNotification[] => {
                if (!Array.isArray(rows) || rows.length <= 1) return [];
                
                const rateIndex = type === 'General' ? 8 : 9;
                const truckIndex = 2;
                
                const alerts: AppNotification[] = [];
                // Process only the last 100 rows to optimize performance
                const recentRows = rows.slice(Math.max(1, rows.length - 100));
                
                recentRows.forEach((row: any[]) => {
                    const rate = Number(row[rateIndex]);
                    const truck = row[truckIndex] || 'Unknown Truck';
                    const timestamp = row[1]; 
                    const alertId = `${type}_${new Date(timestamp).getTime()}_${truck.replace(/\s/g, '')}`;

                    if (dismissedNotificationIds.includes(alertId)) return;
                    if (serverAcknowledgements.includes(alertId)) return;

                    const isRead = readNotificationIds.includes(alertId);

                    if (rate <= 2) {
                        alerts.push({
                            id: alertId,
                            title: `Critical: ${truck}`,
                            message: `${type} Check rated ${rate}/5. Urgent attention needed.`,
                            type: 'critical',
                            timestamp: timestamp,
                            read: isRead,
                            module: type
                        });
                    } else if (rate === 3) {
                        alerts.push({
                            id: alertId,
                            title: `Warning: ${truck}`,
                            message: `${type} Check rated ${rate}/5. Maintenance review required.`,
                            type: 'warning',
                            timestamp: timestamp,
                            read: isRead,
                            module: type
                        });
                    }
                });
                return alerts;
            };

            // --- 2. System Notifications Sheet Logic ---
            const systemRows = json['SystemNotification'] || [];
            const userEmail = currentUser.username.toLowerCase().trim();
            const userRole = currentUser.role.toLowerCase().trim();
            const isSuperAdmin = userRole === 'superadmin';

            if (Array.isArray(systemRows) && systemRows.length > 1) {
                // Only take last 50 system notifications to prevent loop overhead
                const recentSystemRows = systemRows.slice(Math.max(1, systemRows.length - 50));
                
                recentSystemRows.forEach((row: any[]) => {
                    const notifId = String(row[0]);
                    const recipientId = String(row[1]).trim().toLowerCase();
                    const isReadOnServer = String(row[5]).toUpperCase() === 'TRUE';
                    
                    const isForUser = recipientId === userEmail;
                    const isForRole = recipientId === userRole || (isSuperAdmin && recipientId === 'admin');
                    const isForAll = recipientId === 'all';
                    
                    if (!isReadOnServer && (isForUser || isForRole || isForAll)) {
                        if(dismissedNotificationIds.includes(notifId)) return;

                        const typeRaw = String(row[2]).toLowerCase();
                        let notifType: 'info' | 'critical' | 'warning' | 'success' = 'info';
                        if (typeRaw === 'critical') notifType = 'critical';
                        else if (typeRaw === 'warning') notifType = 'warning';
                        else if (typeRaw === 'success') notifType = 'success';

                        allAlerts.push({
                            id: notifId,
                            title: typeRaw === 'success' ? 'System Update' : 'Notification',
                            message: String(row[3]),
                            type: notifType,
                            timestamp: row[4],
                            read: readNotificationIds.includes(notifId),
                            actionLink: row[6],
                            isServerEvent: true,
                            module: 'System'
                        });
                    }
                });
            }

            // --- 3. Support Ticket Sync Logic ---
            const ticketRows = json['Support_Tickets'] || [];
            
            if (Array.isArray(ticketRows) && ticketRows.length > 1) {
                // Process recently updated tickets
                ticketRows.slice(Math.max(1, ticketRows.length - 50)).forEach((row: any[]) => {
                    const ticketId = row[0];
                    const subject = row[2];
                    const status = row[9];
                    // const ownerEmail = String(row[6]).toLowerCase().trim(); // Unused
                    const assignedTo = row[11] ? String(row[11]) : null;
                    const isAssignedAgent = assignedTo && assignedTo.toLowerCase() === currentUser.name.toLowerCase();
                    
                    const shouldSeeAsAdmin = (isSuperAdmin || userRole === 'admin' || isAssignedAgent) && (status === 'Open' || status === 'In Progress');
                    
                    if (shouldSeeAsAdmin) {
                        const alertId = `ticket_active_${ticketId}_${status}`;
                        const existsInSystem = allAlerts.some(s => s.message.includes(ticketId));
                        
                        if (!dismissedNotificationIds.includes(alertId) && !existsInSystem) {
                            allAlerts.push({
                                id: alertId,
                                title: status === 'Open' ? 'New Ticket' : 'Ticket In Progress',
                                message: `#${ticketId}: ${subject}`,
                                type: 'info',
                                timestamp: row[8],
                                read: readNotificationIds.includes(alertId),
                                module: 'Support',
                                actionLink: 'view:support'
                            });
                        }
                    }
                });
            }

            // --- 4. Subscription Status Check ---
            const subData = json['Subscription_Data'];
            if (subData) {
                if (subData.status) {
                    const expiry = new Date(subData.expiryDate);
                    const now = new Date();
                    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                    const subAlertId = `sub_alert_${subData.expiryDate}`;

                    if (!dismissedNotificationIds.includes(subAlertId)) {
                        if (subData.status === 'Expired') {
                            allAlerts.push({
                                id: subAlertId,
                                title: 'License Expired',
                                message: 'System is locked. Please renew subscription immediately.',
                                type: 'critical',
                                timestamp: new Date().toISOString(),
                                read: readNotificationIds.includes(subAlertId),
                                module: 'Billing',
                                actionLink: 'view:settings'
                            });
                        } else if (diffDays <= 7) {
                            allAlerts.push({
                                id: subAlertId,
                                title: 'License Expiring',
                                message: `Subscription expires in ${diffDays} days. Renew to avoid lockout.`,
                                type: 'warning',
                                timestamp: new Date().toISOString(),
                                read: readNotificationIds.includes(subAlertId),
                                module: 'Billing',
                                actionLink: 'view:settings'
                            });
                        }
                    }
                }
            }

            // --- 5. Offline Sync Queue Check ---
            const offlineQ = JSON.parse(localStorage.getItem('safetycheck_offline_queue') || '[]');
            if (offlineQ.length > 0) {
                const syncId = `sync_pending_${offlineQ.length}`;
                allAlerts.push({
                    id: syncId,
                    title: 'Offline Data Pending',
                    message: `${offlineQ.length} records waiting to sync. Connect to internet to upload.`,
                    type: 'warning',
                    timestamp: new Date().toISOString(),
                    read: false,
                    module: 'Sync'
                });
            }

            // --- 6. Inspection Data Merging ---
            if (json['General']) allAlerts = [...allAlerts, ...processForAlerts(json['General'], 'General')];
            if (json['Petroleum']) allAlerts = [...allAlerts, ...processForAlerts(json['Petroleum'], 'Petroleum')];
            if (json['Petroleum_V2']) allAlerts = [...allAlerts, ...processForAlerts(json['Petroleum_V2'], 'Petroleum_V2')];
            if (json['Acid']) allAlerts = [...allAlerts, ...processForAlerts(json['Acid'], 'Acid')];
            
            // --- SMART SORTING & CAPPING ---
            // 1. Sort: Unread Critical > Unread > Critical > Date
            allAlerts.sort((a, b) => {
                const aScore = (a.read ? 0 : 2) + (a.type === 'critical' ? 1 : 0);
                const bScore = (b.read ? 0 : 2) + (b.type === 'critical' ? 1 : 0);
                if (aScore !== bScore) return bScore - aScore;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            // 2. Cap the list to MAX_NOTIFICATIONS
            if (allAlerts.length > MAX_NOTIFICATIONS) {
                allAlerts = allAlerts.slice(0, MAX_NOTIFICATIONS);
            }

            // --- 7. NEW NOTIFICATION TOAST & PUSH TRIGGER ---
            const newlyFetched = allAlerts.filter(a => !notifiedIds.includes(a.id));
            if (newlyFetched.length > 0) {
                // Find highest priority new notification
                const critical = newlyFetched.find(a => a.type === 'critical');
                const warning = newlyFetched.find(a => a.type === 'warning');
                const info = newlyFetched.find(a => a.type === 'info'); 

                if (critical) {
                    showToast(critical.message, 'error');
                    sendSystemNotification(critical.title, { body: critical.message, icon: 'https://cdn-icons-png.flaticon.com/512/716/716766.png', tag: critical.id });
                }
                else if (warning) {
                    showToast(warning.message, 'info');
                    sendSystemNotification(warning.title, { body: warning.message, icon: 'https://cdn-icons-png.flaticon.com/512/716/716766.png', tag: warning.id });
                }
                else if (info && info.module === 'System') {
                    showToast(info.message, 'info');
                    sendSystemNotification(info.title, { body: info.message, icon: 'https://cdn-icons-png.flaticon.com/512/716/716766.png', tag: info.id });
                }

                // Mark as notified so we don't toast/push again
                setNotifiedIds(prev => [...prev, ...newlyFetched.map(a => a.id)]);
            }

            setNotifications(allAlerts);

        } catch (e) {
            // Suppress network errors to prevent console noise during polling
            // console.warn("Fetch notifications error (polling)", e);
        }
    };

    const handleMarkNotificationRead = async (id: string, onNavigate?: (module: string) => void) => {
        const target = notifications.find(n => n.id === id);
        setNotifications(prev => prev.map(n => n.id === id ? {...n, read: true} : n));
        
        if (target?.isServerEvent && appScriptUrl && navigator.onLine) {
            try {
                await fetch(appScriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({ action: 'mark_notification_read', id: id }),
                    mode: 'no-cors'
                });
            } catch(e) { /* ignore */ }
        }
        
        const newReadIds = [...readNotificationIds, id];
        saveReadState(newReadIds);
        
        // --- CRITICAL FIX: Ensure custom handlers (like requests) are called ---
        if (target?.actionLink && onNavigate) {
            const action = target.actionLink.toLowerCase();
            
            if (action.startsWith('request:')) {
                // Pass a generic identifier; the logic in App.tsx will parse the link itself
                onNavigate('request_handler'); 
            }
            else if (action.includes('view:petroleum')) onNavigate('petroleum');
            else if (action.includes('view:general')) onNavigate('general');
            else if (action.includes('view:acid')) onNavigate('acid');
            else if (action.includes('view:settings') && currentUser?.role === 'Admin') onNavigate('settings');
            else if (action.includes('view:users') && currentUser?.role === 'Admin') onNavigate('users');
            else if (action.includes('view:support')) onNavigate('support');
        }
    };

    const handleDismissNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        const newDismissedIds = [...dismissedNotificationIds, id];
        saveDismissedState(newDismissedIds);
    };

    const handleGlobalAcknowledge = async (id: string) => {
        if (!appScriptUrl || !navigator.onLine) return;
        setNotifications(prev => prev.filter(n => n.id !== id));
        setGlobalAcknowledgedIds(prev => [...prev, id]);

        try {
            const payload = {
                action: 'acknowledge_issue',
                issueId: id,
                user: currentUser?.name || 'Unknown',
                role: currentUser?.role || 'Unknown'
            };

            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload),
                mode: 'no-cors'
            });
            
            showToast("Issue Resolved & Acknowledged Globally.", 'success');
        } catch (e) {
            // console.error("Failed to acknowledge issue", e);
        }
    };

    const handleClearAllNotifications = () => {
        const allIds = notifications.map(n => n.id);
        
        // 1. Mark as read
        const newReadIds = [...new Set([...readNotificationIds, ...allIds])];
        saveReadState(newReadIds);

        // 2. Also Dismiss them from view (Clear)
        const newDismissedIds = [...new Set([...dismissedNotificationIds, ...allIds])];
        saveDismissedState(newDismissedIds);

        // 3. Clear state
        setNotifications([]);
    };

    return {
        notifications,
        fetchNotifications,
        handleMarkNotificationRead,
        handleDismissNotification,
        handleGlobalAcknowledge,
        handleClearAllNotifications,
        requestPushPermission,
        pushEnabled
    };
};
