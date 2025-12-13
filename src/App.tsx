
import React, { useState, useEffect } from 'react';
import { INITIAL_DATA, InspectionData, User } from './types';
import { 
    SHEET_HEADERS, PETROLEUM_HEADERS, PETROLEUM_V2_HEADERS, ACID_HEADERS,
    INSPECTION_ITEMS, PETROLEUM_INSPECTION_ITEMS, PETROLEUM_V2_ITEMS, ACID_INSPECTION_ITEMS
} from './constants';

// Hooks
import { useAuth } from './hooks/useAuth';
import { useSettings } from './hooks/useSettings';
import { useNotifications } from './hooks/useNotifications';
import { useHistory } from './hooks/useHistory';
import { useOfflineSync } from './hooks/useOfflineSync';
import { useSubscription } from './hooks/useSubscription';

// UI Components
import Toast from './components/ui/Toast';
import Sidebar from './components/layout/Sidebar';
import ReportViewerModal from './components/ui/ReportViewerModal';
import SubmissionOverlay from './components/ui/SubmissionOverlay';
import ProfileModal from './components/ui/ProfileModal';
import NotificationCenter from './components/ui/NotificationCenter'; 
import UpgradeModal from './components/ui/UpgradeModal';
import InspectionStartModal from './components/ui/InspectionStartModal';
import SubscriptionAlert from './components/ui/SubscriptionAlert';
import MaintenanceOverlay from './components/ui/MaintenanceOverlay';
import RequestInspectionModal from './components/ui/RequestInspectionModal'; 
import OnboardingWizard from './components/ui/OnboardingWizard'; 
import SystemTour from './components/ui/SystemTour'; 
import InstallPwaPrompt from './components/ui/InstallPwaPrompt';

// Views
import LoginView from './views/LoginView';
import SettingsView from './views/SettingsView';
import GeneralDashboard from './views/GeneralDashboard';
import PetroleumDashboard from './views/PetroleumDashboard';
import PetroleumV2Dashboard from './views/PetroleumV2Dashboard';
import AcidDashboard from './views/AcidDashboard';
import UserManagementView from './views/UserManagementView';
import OverviewDashboard from './views/OverviewDashboard';
import InspectionFormView from './views/InspectionFormView';
import SupportView from './views/SupportView';
import MaintenanceView from './views/MaintenanceView';
import RequestTrackingView from './views/RequestTrackingView';

// Reports
import PrintableGeneralReport from './components/reports/PrintableGeneralReport';
import PrintablePetroleumReport from './components/reports/PrintablePetroleumReport';
import PrintablePetroleumV2Report from './components/reports/PrintablePetroleumV2Report';
import PrintableAcidReport from './components/reports/PrintableAcidReport';

// --- Smart Network & Sync Status Component ---
const NetworkStatus = ({ queueLength, isSyncing, isPoorConnection, onRetry }: { queueLength: number, isSyncing: boolean, isPoorConnection: boolean, onRetry: () => void }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const setOnline = () => setIsOnline(true);
    const setOffline = () => setIsOnline(false);
    window.addEventListener('online', setOnline);
    window.addEventListener('offline', setOffline);
    return () => {
      window.removeEventListener('online', setOnline);
      window.removeEventListener('offline', setOffline);
    };
  }, []);

  if (isOnline && queueLength === 0 && !isSyncing && !isPoorConnection) return null;

  let bgColor = 'bg-slate-900';
  let icon = (
      <div className="relative">
        <div className="w-3 h-3 rounded-full bg-red-500"></div>
        <div className="w-3 h-3 rounded-full bg-red-500 absolute top-0 left-0 animate-ping opacity-75"></div>
      </div>
  );
  let title = "You are offline";
  let subtitle = "Data saved securely to device";
  let showRetry = false;

  if (isSyncing) {
      bgColor = 'bg-blue-600';
      icon = <svg className="animate-spin w-5 h-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>;
      title = "Syncing Data...";
      subtitle = `${queueLength} records remaining`;
  } else if (isPoorConnection && isOnline) {
      bgColor = 'bg-amber-600';
      icon = <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>;
      title = "Unstable Connection";
      subtitle = `${queueLength} pending uploads`;
      showRetry = true;
  } else if (queueLength > 0 && isOnline) {
      bgColor = 'bg-indigo-600';
      icon = <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>;
      title = "Uploads Pending";
      subtitle = `${queueLength} records waiting`;
      showRetry = true;
  } else if (!isOnline && queueLength > 0) {
      bgColor = 'bg-slate-800';
      title = "Offline Mode";
      subtitle = `${queueLength} records saved locally`;
  }

  return (
    <div className={`fixed bottom-4 left-4 z-[90] ${bgColor} text-white px-4 py-3 rounded-lg shadow-xl flex items-center gap-4 animate-fadeIn border border-white/10 max-w-xs transition-colors duration-300`}>
      <div className="shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold truncate">{title}</div>
        <div className="text-[10px] opacity-80 font-medium truncate">{subtitle}</div>
      </div>
      {showRetry && (
          <button 
            onClick={onRetry}
            className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded transition-colors"
          >
            Retry
          </button>
      )}
    </div>
  );
};

const App = () => {
  const { currentUser, setCurrentUser, handleLogin, handleLogout, sessionExpired, setSessionExpired } = useAuth();
  const { settings, setSettings, appScriptUrl, setAppScriptUrl, isSavingSettings, handleSaveSettings } = useSettings();
  const { subscription, isLocked, refreshSubscription } = useSubscription(appScriptUrl, currentUser);

  if (typeof window !== 'undefined') {
      (window as any).isSubscriptionLocked = isLocked;
  }

  const [activeModule, setActiveModule] = useState('overview'); 
  const [viewMode, setViewMode] = useState<'dashboard' | 'form'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [upgradeFeature, setUpgradeFeature] = useState<string | null>(null);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  
  const { historyList, isLoadingHistory, isBackgroundFetching, validationLists, stats, fetchHistory } = useHistory(appScriptUrl, activeModule, currentUser);
  
  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
  };

  // --- Session Expiry Toast Handling ---
  useEffect(() => {
      if (sessionExpired === 'idle') {
          showToast("Session expired due to inactivity.", 'warning');
          setSessionExpired(null); // Clear flag so we don't spam toast on re-render
      } else if (sessionExpired === 'max_duration') {
          showToast("Session limit reached. Please log in again.", 'info');
          setSessionExpired(null);
      }
  }, [sessionExpired]);

  const { submissionStatus, setSubmissionStatus, offlineQueue, isSyncing, isPoorConnection, syncOfflineQueue, addToQueue } = useOfflineSync(appScriptUrl, showToast, () => fetchHistory(true));
  const { notifications, fetchNotifications, handleMarkNotificationRead, handleDismissNotification, handleGlobalAcknowledge, handleClearAllNotifications } = useNotifications(appScriptUrl, currentUser, showToast);

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [targetModuleForStart, setTargetModuleForStart] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportData, setSelectedReportData] = useState<InspectionData | null>(null);
  const [formInitialData, setFormInitialData] = useState<InspectionData>(INITIAL_DATA);

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
      if (currentUser) {
          const needsPassword = currentUser.preferences?.mustChangePassword === true;
          const needsEmail = currentUser.preferences?.isEmailVerified !== true;
          if (needsPassword || needsEmail) {
              setShowOnboarding(true);
          } else if (currentUser.preferences?.hasCompletedTour !== true) {
              setShowTour(true);
          }
      } else {
          setShowOnboarding(false);
          setShowTour(false);
      }
  }, [currentUser]);

  const handleOnboardingComplete = async (updatedUser: User) => {
      setCurrentUser(updatedUser);
      localStorage.setItem('safetyCheck_user', JSON.stringify(updatedUser));
      setShowOnboarding(false);
      if (updatedUser.preferences?.hasCompletedTour !== true) {
          setTimeout(() => setShowTour(true), 500);
      }
  };

  const handleTourComplete = async () => {
      if (!currentUser) return;
      const updatedUser = { 
          ...currentUser, 
          preferences: { ...currentUser.preferences, hasCompletedTour: true } 
      };
      setCurrentUser(updatedUser);
      localStorage.setItem('safetyCheck_user', JSON.stringify(updatedUser));
      setShowTour(false);
      if (appScriptUrl) {
          try {
              await fetch(appScriptUrl, {
                  method: 'POST',
                  body: JSON.stringify({
                      action: 'update_user',
                      originalUsername: updatedUser.username,
                      preferences: updatedUser.preferences
                  }),
                  mode: 'no-cors'
              });
          } catch(e) {}
      }
  };

  useEffect(() => {
      if (currentUser) {
          const role = currentUser.role || '';
          const isAdmin = role === 'Admin' || role === 'SuperAdmin';
          const isSuperAdmin = role === 'SuperAdmin';
          if (!isAdmin && (activeModule === 'settings' || activeModule === 'users')) {
              showToast("Access Restricted to Admins.", 'error');
              setActiveModule('overview');
          }
          if (!isSuperAdmin && activeModule === 'maintenance') {
              showToast("Access Restricted to SuperAdmins.", 'error');
              setActiveModule('overview');
          }
      }
  }, [activeModule, currentUser]);

  useEffect(() => {
    if (!currentUser || !appScriptUrl) return;
    const loadData = () => {
        if (navigator.onLine) {
            fetchNotifications();
            if (offlineQueue.length > 0) syncOfflineQueue();
            fetchHistory(false); 
        }
    };
    loadData();
    const intervalId = setInterval(() => {
        if (navigator.onLine) {
            fetchNotifications();
        }
    }, 30000);
    return () => clearInterval(intervalId);
  }, [currentUser, appScriptUrl]);

  const getDraftKey = (module: string) => {
      const userPrefix = currentUser ? `${currentUser.username}_` : 'anon_';
      return `sc_draft_${userPrefix}${module}`;
  };
  const hasDraft = (module: string) => !!localStorage.getItem(getDraftKey(module));
  
  const loadDraft = (module: string) => {
      const draft = localStorage.getItem(getDraftKey(module));
      if (draft) {
          try { return JSON.parse(draft); } catch(e) { return null; }
      }
      return null;
  };

  const clearDraft = (module: string) => localStorage.removeItem(getDraftKey(module));

  const handleInitiateStartInspection = (module: string) => {
      if (isLocked) {
          showToast("Subscription Expired. Cannot start inspection.", 'error');
          return;
      }
      if (hasDraft(module)) {
          setTargetModuleForStart(module);
          setIsStartModalOpen(true);
      } else {
          startFreshInspection(module);
      }
  };

  const startFreshInspection = (module: string, prefill?: Partial<InspectionData>) => {
      clearDraft(module); 
      setFormInitialData({ 
          ...INITIAL_DATA, 
          timestamp: new Date().toISOString(),
          inspectedBy: currentUser?.name || '',
          ...prefill 
      });
      setViewMode('form');
  };

  const resumeDraftInspection = (module: string) => {
      const draft = loadDraft(module);
      if (draft) {
          setFormInitialData(draft);
          setViewMode('form');
          showToast("Draft resumed.", 'info');
      } else {
          showToast("Failed to load draft. Starting new.", 'error');
          startFreshInspection(module);
      }
  };

  const handleExitForm = (savedData?: InspectionData) => {
      if (savedData) {
          localStorage.setItem(getDraftKey(activeModule), JSON.stringify(savedData));
          showToast("Draft saved successfully.", 'success');
      }
      setViewMode('dashboard');
  };

  const handleRequestInspectionSubmit = async (data: any) => {
      if (!appScriptUrl) return;
      try {
          await fetch(appScriptUrl, {
              method: 'POST',
              body: JSON.stringify({
                  action: 'request_inspection',
                  requester: currentUser?.name,
                  role: currentUser?.role,
                  truckNo: data.truckNo,
                  trailerNo: data.trailerNo,
                  type: data.type,
                  priority: data.priority,
                  reason: data.reason,
                  assignedInspector: data.assignedInspector || '' 
              }),
              mode: 'no-cors'
          });
          showToast("Inspection request sent to inspectors.", 'success');
      } catch (e) {
          showToast("Failed to submit request.", 'error');
      }
  };

  const handleGoogleSheetSubmit = async (formData: InspectionData) => {
    if (currentUser?.role && !['Admin', 'Inspector', 'SuperAdmin'].includes(currentUser.role)) {
        showToast("Access Denied: View Only Account.", 'error');
        return;
    }
    
    if (!appScriptUrl) {
        showToast("System Not Connected. Please configure Settings.", 'error');
        setActiveModule('settings');
        return;
    }

    setSubmissionStatus('submitting');

    const recordId = crypto.randomUUID();
    let targetSheet = "General";
    let targetHeaders = SHEET_HEADERS;
    let reportItems: { category: string, label: string, status: string }[] = [];
    let reportTitle = "General Inspection Report";

    if (activeModule === 'petroleum') {
        targetSheet = "Petroleum";
        targetHeaders = PETROLEUM_HEADERS;
        reportTitle = "Petroleum Tanker Inspection";
        reportItems = PETROLEUM_INSPECTION_ITEMS.map(item => ({
            category: item.category,
            label: item.label,
            status: String((formData as any)[item.id] || 'N/A')
        }));
    } else if (activeModule === 'petroleum_v2') {
        targetSheet = "Petroleum_V2";
        targetHeaders = PETROLEUM_V2_HEADERS;
        reportTitle = "Petroleum Tanker Inspection V2";
        reportItems = PETROLEUM_V2_ITEMS.map(item => ({
            category: item.category,
            label: item.label,
            status: String((formData as any)[item.id] || 'N/A')
        }));
    } else if (activeModule === 'acid') {
        targetSheet = "Acid";
        targetHeaders = ACID_HEADERS;
        reportTitle = "Acid Tanker Inspection";
        reportItems = ACID_INSPECTION_ITEMS.map(item => ({
            category: item.category,
            label: item.label,
            status: String((formData as any)[item.id] || 'N/A')
        }));
    } else {
        reportItems = INSPECTION_ITEMS.map(item => ({
            category: item.category,
            label: item.label,
            status: String((formData as any)[item.id] || 'N/A')
        }));
    }

    const reportData = {
        title: reportTitle,
        truckNo: formData.truckNo,
        trailerNo: formData.trailerNo,
        jobCard: formData.jobCard || 'N/A',
        driverName: formData.driverName,
        inspectedBy: formData.inspectedBy,
        location: formData.location,
        odometer: formData.odometer,
        timestamp: formData.timestamp,
        remarks: formData.remarks,
        rate: formData.rate,
        items: reportItems,
        signatures: {
            inspector: formData.inspectorSignature,
            driver: formData.driverSignature
        },
        photos: {
            front: formData.photoFront,
            ls: formData.photoLS,
            rs: formData.photoRS,
            back: formData.photoBack,
            damage: formData.photoDamage
        },
        companyName: settings.companyName,
        companyLogo: settings.companyLogo
    };

    const rowData = targetHeaders.map(header => {
        if (header === 'id') return recordId;
        const val = (formData as any)[header];
        return (val === null || val === undefined) ? "" : val;
    });

    const payload = {
        sheet: targetSheet,
        action: "create",
        row: rowData,
        headers: targetHeaders,
        id: recordId,
        reportData: reportData,
        requestId: formData.requestId // Pass Request ID to close the loop
    };

    if (!navigator.onLine) {
        addToQueue(payload);
        clearDraft(activeModule);
        setSubmissionStatus('offline_saved');
        setTimeout(() => {
             startFreshInspection(activeModule); 
             setViewMode('dashboard');
             setSubmissionStatus('idle');
             showToast("Offline Mode: Report Saved. Will sync when online.", 'info');
        }, 2000);
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);

        await fetch(appScriptUrl, {
            method: 'POST',
            body: JSON.stringify(payload),
            mode: 'no-cors', 
            headers: { 'Content-Type': 'text/plain' },
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        clearDraft(activeModule);
        setSubmissionStatus('success');
        
        setTimeout(() => {
             startFreshInspection(activeModule); 
             setViewMode('dashboard');
             setSubmissionStatus('idle');
             fetchHistory(true); 
             fetchNotifications();
             showToast(formData.requestId ? "Request Fulfilled & Report Submitted!" : "Inspection Submitted & Email Sent!", 'success');
        }, 2500);

    } catch (error: any) {
        console.error("Submission Error", error);
        addToQueue(payload);
        clearDraft(activeModule); 
        setSubmissionStatus('offline_saved');
        const isTimeout = error.name === 'AbortError';
        const msg = isTimeout ? "Slow Network detected. Saved to offline queue." : "Network Error. Report queued for auto-sync.";
        setTimeout(() => {
             startFreshInspection(activeModule); 
             setViewMode('dashboard');
             setSubmissionStatus('idle');
             showToast(msg, 'warning');
        }, 2500);
    }
  };

  const handlePrint = () => window.print();
  const handleQuickPrint = (item: InspectionData) => {
      setSelectedReportData(item);
      setTimeout(() => window.print(), 500);
  };
  const handleViewReport = (item: InspectionData | null) => {
    setSelectedReportData(item);
    setIsReportModalOpen(true);
  };

  const handleNotificationAction = (id: string, onNavigate?: (module: string) => void) => {
      handleMarkNotificationRead(id, (module) => {
          // Special handling for request inspection start links
          // Link format: request:start_inspection|type|truck|trailer|requester|reason|reqId
          const targetNotification = notifications.find(n => n.id === id);
          if (targetNotification?.actionLink?.startsWith('request:start_inspection')) {
              const parts = targetNotification.actionLink.split('|');
              const type = parts[1].toLowerCase();
              const truck = parts[2];
              const trailer = parts[3];
              const requester = parts[4];
              const reason = parts[5];
              const reqId = parts[6] || ''; // Extract Request ID

              let targetMod = 'general';
              if (type.includes('petroleum_v2')) targetMod = 'petroleum_v2';
              else if (type.includes('petroleum')) targetMod = 'petroleum';
              else if (type.includes('acid')) targetMod = 'acid';

              setActiveModule(targetMod);
              
              startFreshInspection(targetMod, {
                  truckNo: truck,
                  trailerNo: trailer,
                  remarks: `** AD-HOC REQUEST **\nInitiated by: ${requester}\nReason: ${reason}`,
                  requestId: reqId // Attach ID for loop closure
              });
              
              showToast("Starting requested inspection...", 'info');
          } else {
              if (onNavigate) onNavigate(module);
              else {
                  setActiveModule(module);
                  setViewMode('dashboard');
              }
          }
      });
  };

  if (!currentUser) {
      return (
          <>
            <InstallPwaPrompt />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <LoginView 
                onLogin={handleLogin} 
                appScriptUrl={appScriptUrl}
                setAppScriptUrl={setAppScriptUrl}
                settings={settings}
            />
          </>
      );
  }

  if (showOnboarding && currentUser) {
      return (
          <OnboardingWizard 
              user={currentUser} 
              appScriptUrl={appScriptUrl} 
              onComplete={handleOnboardingComplete} 
          />
      );
  }

  const canAcknowledge = ['Admin', 'Maintenance', 'Inspector', 'SuperAdmin'].includes(currentUser.role || '');
  const isSuperAdmin = currentUser.role === 'SuperAdmin';
  const showMaintenanceOverlay = settings.maintenanceMode && !isSuperAdmin;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 relative">
      <InstallPwaPrompt />
      <SubmissionOverlay status={submissionStatus} />
      {showTour && <SystemTour onComplete={handleTourComplete} />}
      <MaintenanceOverlay isActive={showMaintenanceOverlay} message={settings.maintenanceMessage || ''} onLogout={() => handleLogout()} />
      <NetworkStatus queueLength={offlineQueue.length} isSyncing={isSyncing} isPoorConnection={isPoorConnection} onRetry={syncOfflineQueue} />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <RequestInspectionModal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          onSubmit={handleRequestInspectionSubmit}
          validationLists={validationLists}
          currentUserRole={currentUser.role || ''}
      />

      <InspectionStartModal 
          isOpen={isStartModalOpen}
          onClose={() => setIsStartModalOpen(false)}
          moduleName={targetModuleForStart || 'General'}
          hasDraft={!!targetModuleForStart && hasDraft(targetModuleForStart)}
          onStartNew={() => {
              if (targetModuleForStart) startFreshInspection(targetModuleForStart);
              setIsStartModalOpen(false);
          }}
          onResume={() => {
              if (targetModuleForStart) resumeDraftInspection(targetModuleForStart);
              setIsStartModalOpen(false);
          }}
      />

      {upgradeFeature && <UpgradeModal featureName={upgradeFeature} onClose={() => setUpgradeFeature(null)} />}

      {isProfileModalOpen && currentUser && (
          <ProfileModal 
              user={currentUser}
              appScriptUrl={appScriptUrl}
              onClose={() => setIsProfileModalOpen(false)}
              showToast={showToast}
              onUpdateSuccess={(updatedUser) => {
                   setCurrentUser(updatedUser);
                   localStorage.setItem('safetyCheck_user', JSON.stringify(updatedUser));
              }}
          />
      )}

      {isReportModalOpen && (
          <ReportViewerModal 
            onClose={() => setIsReportModalOpen(false)} 
            onPrint={handlePrint}
            title="Inspection Report"
          >
               <div className="print-only-container">
                    {activeModule === 'petroleum' ? (
                        <PrintablePetroleumReport data={selectedReportData || formInitialData} settings={settings} />
                    ) : activeModule === 'petroleum_v2' ? (
                        <PrintablePetroleumV2Report data={selectedReportData || formInitialData} settings={settings} />
                    ) : activeModule === 'acid' ? (
                        <PrintableAcidReport data={selectedReportData || formInitialData} settings={settings} />
                    ) : (
                        <PrintableGeneralReport data={selectedReportData || formInitialData} settings={settings} />
                    )}
               </div>
          </ReportViewerModal>
      )}

      <div className="print-only hidden p-0 bg-white">
         {activeModule === 'petroleum' ? (
             <PrintablePetroleumReport data={selectedReportData || formInitialData} settings={settings} />
         ) : activeModule === 'petroleum_v2' ? (
             <PrintablePetroleumV2Report data={selectedReportData || formInitialData} settings={settings} />
         ) : activeModule === 'acid' ? (
             <PrintableAcidReport data={selectedReportData || formInitialData} settings={settings} />
         ) : (
             <PrintableGeneralReport data={selectedReportData || formInitialData} settings={settings} />
         )}
      </div>

      <div className="relative z-10 bg-gray-50 min-h-screen">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onClose={() => setIsSidebarOpen(false)} 
            activeModule={activeModule}
            onSelectModule={(m) => {
                setActiveModule(m);
                setViewMode('dashboard');
            }}
            onLockedItemClick={(feature) => setUpgradeFeature(feature)}
            settings={settings}
            user={currentUser}
            onLogout={() => handleLogout()}
            onEditProfile={() => setIsProfileModalOpen(true)}
            subscription={subscription} 
            onRequestInspection={() => {
                fetchHistory(false);
                setIsRequestModalOpen(true);
            }} 
          />

          <div className="lg:pl-64 min-h-screen flex flex-col transition-all duration-300">
            <SubscriptionAlert 
                subscription={subscription} 
                user={currentUser} 
                onManage={() => { setActiveModule('settings'); setViewMode('dashboard'); }}
            />

            <header className="bg-emerald-950 border-b border-emerald-900 sticky top-0 z-40 shadow-sm">
              <div className="px-4 py-3 flex justify-between items-center text-white">
                <div className="flex items-center gap-3">
                    <button id="sidebar-toggle" onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-1 hover:bg-slate-800 rounded">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div className="flex flex-col">
                        <h1 className="text-lg md:text-xl font-bold flex items-center gap-2">
                            {activeModule === 'overview' ? 'Executive Dashboard' : 
                            activeModule === 'petroleum' ? 'Petroleum V1' : 
                            activeModule === 'petroleum_v2' ? 'Petroleum V2' : 
                            activeModule === 'acid' ? 'Acid' : 
                            activeModule === 'settings' ? 'System' :
                            activeModule === 'users' ? 'Users' :
                            activeModule === 'support' ? 'Support Hub' :
                            activeModule === 'track_requests' ? 'My Requests' :
                            activeModule === 'maintenance' ? 'Superadmin Console' :
                            'SafetyCheck'}
                        </h1>
                        {isBackgroundFetching && (
                            <div className="flex items-center gap-1.5 text-[10px] text-emerald-300 animate-pulse">
                                Checking for updates...
                            </div>
                        )}
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {offlineQueue.length > 0 && (
                        <button
                            id="sync-status-btn"
                            onClick={syncOfflineQueue}
                            disabled={isSyncing} 
                            className={`hidden md:flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all shadow-sm
                                ${isSyncing 
                                    ? 'bg-blue-600 text-white cursor-wait' 
                                    : isPoorConnection 
                                        ? 'bg-red-500 text-white hover:bg-red-600 animate-pulse' 
                                        : 'bg-amber-500 text-white hover:bg-amber-600'}
                            `}
                        >
                            {isSyncing ? (
                                <>
                                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    <span>Syncing...</span>
                                </>
                            ) : (
                                <span>{isPoorConnection ? 'Retry Upload' : `Pending (${offlineQueue.length})`}</span>
                            )}
                        </button>
                    )}
                    
                    <div id="notification-bell">
                        <NotificationCenter 
                            notifications={notifications}
                            onMarkAsRead={(id) => handleNotificationAction(id, (m) => { setActiveModule(m); setViewMode('dashboard'); })}
                            onDismiss={handleDismissNotification}
                            onClearAll={handleClearAllNotifications}
                            onAcknowledge={handleGlobalAcknowledge}
                            canAcknowledge={canAcknowledge}
                        />
                    </div>
                </div>
              </div>
            </header>

            {viewMode === 'form' ? (
                <InspectionFormView 
                    initialData={formInitialData}
                    activeModule={activeModule}
                    validationLists={validationLists}
                    settings={settings}
                    onSaveDraft={handleExitForm} 
                    onExit={() => handleExitForm()} 
                    onSubmit={handleGoogleSheetSubmit}
                    submissionStatus={submissionStatus}
                    onViewReport={handleViewReport}
                />
            ) : (
                <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
                  {activeModule === 'overview' && (
                      <OverviewDashboard 
                          appScriptUrl={appScriptUrl}
                          onNavigate={(module) => { setActiveModule(module); setViewMode('dashboard'); }}
                          userRole={currentUser?.role}
                      />
                  )}

                  {activeModule === 'settings' && (
                      <SettingsView 
                          settings={settings}
                          setSettings={setSettings}
                          appScriptUrl={appScriptUrl}
                          setAppScriptUrl={setAppScriptUrl}
                          handleSaveSettings={handleSaveSettings}
                          isSavingSettings={isSavingSettings}
                          showToast={showToast}
                          user={currentUser} 
                      />
                  )}

                  {activeModule === 'users' && (
                      <UserManagementView 
                          currentUser={currentUser}
                          appScriptUrl={appScriptUrl}
                          showToast={showToast}
                          validationLists={validationLists}
                          settings={settings}
                      />
                  )}

                  {activeModule === 'support' && (
                      <SupportView 
                          appScriptUrl={appScriptUrl}
                          currentUser={currentUser}
                          showToast={showToast}
                          settings={settings}
                          validationLists={validationLists}
                      />
                  )}

                  {activeModule === 'track_requests' && (
                      <RequestTrackingView 
                          appScriptUrl={appScriptUrl}
                          currentUser={currentUser}
                          showToast={showToast}
                      />
                  )}

                  {activeModule === 'maintenance' && isSuperAdmin && (
                      <MaintenanceView 
                          user={currentUser}
                          appScriptUrl={appScriptUrl}
                          settings={settings}
                          onSettingsUpdate={(newS) => setSettings(p => ({...p, ...newS}))}
                          showToast={showToast}
                      />
                  )}
                  
                  {activeModule === 'general' && (
                      <GeneralDashboard 
                          stats={stats}
                          startNewInspection={() => handleInitiateStartInspection('general')}
                          fetchHistory={() => fetchHistory(true)}
                          isLoadingHistory={isLoadingHistory}
                          historyList={historyList}
                          onViewReport={handleViewReport}
                          onPrint={handleQuickPrint}
                          userRole={currentUser?.role}
                      />
                  )}
                  
                  {activeModule === 'petroleum' && (
                      <PetroleumDashboard 
                          stats={stats}
                          startNewInspection={() => handleInitiateStartInspection('petroleum')}
                          fetchHistory={() => fetchHistory(true)}
                          isLoadingHistory={isLoadingHistory}
                          historyList={historyList}
                          onViewReport={handleViewReport}
                          onPrint={handleQuickPrint}
                          userRole={currentUser?.role}
                      />
                  )}

                  {activeModule === 'petroleum_v2' && (
                      <PetroleumV2Dashboard 
                          stats={stats}
                          startNewInspection={() => handleInitiateStartInspection('petroleum_v2')}
                          fetchHistory={() => fetchHistory(true)}
                          isLoadingHistory={isLoadingHistory}
                          historyList={historyList}
                          onViewReport={handleViewReport}
                          onPrint={handleQuickPrint}
                          userRole={currentUser?.role}
                      />
                  )}

                  {activeModule === 'acid' && (
                      <AcidDashboard 
                          stats={stats}
                          startNewInspection={() => handleInitiateStartInspection('acid')}
                          fetchHistory={() => fetchHistory(true)}
                          isLoadingHistory={isLoadingHistory}
                          historyList={historyList}
                          onViewReport={handleViewReport}
                          onPrint={handleQuickPrint}
                          userRole={currentUser?.role}
                      />
                  )}
                </main>
            )}
          </div>
      </div>
    </div>
  );
};

export default App;
