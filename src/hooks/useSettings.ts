
import { useState, useEffect, useRef } from 'react';
import { SystemSettings } from '../types';
import { PRE_CONFIGURED_SCRIPT_URL } from '../constants';

export const useSettings = () => {
    const [appScriptUrl, setAppScriptUrl] = useState<string>(() => {
        if (PRE_CONFIGURED_SCRIPT_URL && PRE_CONFIGURED_SCRIPT_URL.length > 0) return PRE_CONFIGURED_SCRIPT_URL;
        if (typeof window !== 'undefined') return localStorage.getItem('safetyCheck_scriptUrl') || '';
        return '';
    });

    const [settings, setSettings] = useState<SystemSettings>(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('safetyCheck_settings');
            if (saved) {
                try { return JSON.parse(saved); } catch (e) { console.error("Failed to parse local settings", e); }
            }
        }
        return { companyName: 'My Transport Co.', managerEmail: '' };
    });

    const [isSavingSettings, setIsSavingSettings] = useState(false);
    // Ref to track if we are already fetching to prevent overlap
    const isFetchingRef = useRef(false);

    useEffect(() => {
        if (appScriptUrl) {
            // Initial fetch
            fetchSystemSettings(appScriptUrl);

            // Poll every 30 seconds to check for Lockdown/Maintenance mode updates
            const intervalId = setInterval(() => {
                fetchSystemSettings(appScriptUrl);
            }, 30000);

            return () => clearInterval(intervalId);
        }
    }, [appScriptUrl]);

    const fetchSystemSettings = async (url: string) => {
        if (!url || typeof url !== 'string' || !url.startsWith('http')) return;
        if (!navigator.onLine || isFetchingRef.current) return;

        isFetchingRef.current = true;
        try {
            const response = await fetch(`${url}?t=${new Date().getTime()}`);
            if (!response.ok) {
                return;
            }
            
            const json = await response.json();
            const settingsRows = json['System_Settings'];
            
            if (settingsRows && Array.isArray(settingsRows) && settingsRows.length > 1) {
                const latestConfig = settingsRows[settingsRows.length - 1];
                if (latestConfig && latestConfig.length >= 2) {
                    const maintenanceModeVal = String(latestConfig[7]).toUpperCase().trim();
                    
                    const remoteSettings: SystemSettings = {
                        companyName: latestConfig[0] || 'My Transport Co.',
                        managerEmail: latestConfig[1] || '',
                        companyLogo: (latestConfig[4] && String(latestConfig[4]).length > 100) ? latestConfig[4] : undefined,
                        mobileApkLink: latestConfig[5] || '', 
                        webAppUrl: latestConfig[6] || '',
                        maintenanceMode: maintenanceModeVal === 'TRUE',
                        maintenanceMessage: latestConfig[8] || ''
                    };
                    
                    // Only update state if something changed to prevent re-renders
                    setSettings(prev => {
                        if (JSON.stringify(prev) !== JSON.stringify(remoteSettings)) {
                            try {
                                localStorage.setItem('safetyCheck_settings', JSON.stringify(remoteSettings));
                            } catch (e) { /* Storage quota exceeded */ }
                            return { ...prev, ...remoteSettings };
                        }
                        return prev;
                    });
                }
            }
        } catch (error) {
            // Silently fail on network error
        } finally {
            isFetchingRef.current = false;
        }
    };

    const handleSaveSettings = async () => {
        setIsSavingSettings(true);
        try {
            // Local Save
            localStorage.setItem('safetyCheck_settings', JSON.stringify(settings));
            localStorage.setItem('safetyCheck_scriptUrl', appScriptUrl);

            // Server Sync
            if (appScriptUrl && appScriptUrl.startsWith('http') && navigator.onLine) {
                 await fetch(appScriptUrl, {
                    method: 'POST',
                    body: JSON.stringify({
                        action: 'update_settings',
                        companyName: settings.companyName,
                        managerEmail: settings.managerEmail,
                        companyLogo: settings.companyLogo,
                        mobileApkLink: settings.mobileApkLink,
                        webAppUrl: settings.webAppUrl,
                        maintenanceMode: settings.maintenanceMode,
                        maintenanceMessage: settings.maintenanceMessage
                    })
                });
            }
        } catch (error) {
            console.error("Save Settings Failed", error);
        } finally {
            setTimeout(() => {
                setIsSavingSettings(false);
            }, 800);
        }
    };

    return { 
        settings, 
        setSettings, 
        appScriptUrl, 
        setAppScriptUrl, 
        isSavingSettings, 
        setIsSavingSettings, 
        fetchSystemSettings,
        handleSaveSettings
    };
};
