import React, { useState, useEffect, useMemo } from 'react';
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
import AnalyticsDashboard from './views/AnalyticsDashboard';
import FleetWallView from './views/FleetWallView';
import LibraryView from './views/LibraryView';

// Report Components
import PrintableGeneralReport from './components/reports/PrintableGeneralReport';
import PrintablePetroleumReport from './components/reports/PrintablePetroleumReport';
import PrintablePetroleumV2Report from './components/reports/PrintablePetroleumV2Report';
import PrintableAcidReport from './components/reports/PrintableAcidReport';

const App = () => {
  const { currentUser, setCurrentUser, handleLogin, handleLogout, sessionExpired, setSessionExpired } = useAuth();
  const { settings, setSettings, appScriptUrl, setAppScriptUrl, isSavingSettings, handleSaveSettings, fetchSystemSettings } = useSettings();
  const { subscription, history: subHistory, refreshSubscription } = useSubscription(appScriptUrl, currentUser);

  const [activeModule, setActiveModule] = useState('overview'); 
  const [viewMode, setViewMode] = useState<'dashboard' | 'form'>('dashboard');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info' | 'warning'} | null>(null);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [showTour, setShowTour] = useState(false);
  const [isCheckingMaint, setIsCheckingMaint] = useState(false);
  const [lastSubmittedData, setLastSubmittedData] = useState<InspectionData | null>(null);
  
  const { historyList, isLoadingHistory, validationLists, stats, fetchHistory } = useHistory(appScriptUrl, activeModule, currentUser);
  
  useEffect(() => {
    if (currentUser) {
        setActiveModule('overview');
        setViewMode('dashboard');
    }
  }, [currentUser?.username]);

  const lockInfo = useMemo(() => {
      const isSuperAdmin = currentUser?.role === 'SuperAdmin';
      const isSubExpired = subscription ? (subscription.status === 'Expired' || subscription.daysRemaining <= 0) : false;
      const isMaintActive = settings.maintenanceMode === true;
      
      if (isSuperAdmin) return { isLocked: false, reason: null as any };
      
      if (isMaintActive) return { isLocked: true, reason: 'maintenance' as const };
      if (isSubExpired) return { isLocked: true, reason: 'license' as const };
      
      return { isLocked: false, reason: null as any };
  }, [subscription, settings.maintenanceMode, currentUser?.role]);
  
  const isSystemLocked = lockInfo.isLocked;

  useEffect(() => {
    (window as any).isSubscriptionLocked = isSystemLocked;
  }, [isSystemLocked]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      setToast({ message, type });
      setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
      if (sessionExpired === 'idle') showToast("Session expired due to inactivity.", 'warning');
      else if (sessionExpired === 'max_duration') showToast("Session limit reached. Log in again.", 'info');
      if (sessionExpired) setSessionExpired(null);
  }, [sessionExpired]);

  const { submissionStatus, setSubmissionStatus, isSyncing, addToQueue } = useOfflineSync(appScriptUrl, showToast, () => fetchHistory(true));
  
  const handleNavigate = (module: string) => {
    if (module.startsWith('request:start_inspection')) {
        if (isSystemLocked) {
            showToast("Action Restricted: System is in View-Only mode.", "error");
            return;
        }
        const parts = module.split('|');
        const type = parts[1]?.toLowerCase();
        const truck = parts[2];
        const trailer = parts[3];
        const requester = parts[4];
        const reason = parts[5];
        let moduleKey = 'general';
        if (type === 'petroleum') moduleKey = 'petroleum';
        else if (type === 'petroleum_v2') moduleKey = 'petroleum_v2';
        else if (type === 'acid') moduleKey = 'acid';

        setActiveModule(moduleKey);
        startFreshInspection(moduleKey, {
            truckNo: truck,
            trailerNo: trailer,
            remarks: `Requested by ${requester}: ${reason}`,
            requestId: parts[0].split('-')[1]
        });
        return;
    }
    setActiveModule(module);
    setViewMode('dashboard');
  };

  const { notifications, handleMarkNotificationRead, handleDismissNotification, handleClearAllNotifications, handleGlobalAcknowledge } = useNotifications(appScriptUrl, currentUser, showToast);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportData, setSelectedReportData] = useState<InspectionData | null>(null);
  const [formInitialData, setFormInitialData] = useState<InspectionData>(INITIAL_DATA);

  const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
  const isSuperAdmin = currentUser?.role === 'SuperAdmin';

  const startFreshInspection = (module: string, prefill?: Partial<InspectionData>) => {
      if (isSystemLocked) {
          showToast("RESTRICTED: View-Only mode active. Modifications disabled.", "error");
          return;
      }
      setLastSubmittedData(null);
      setFormInitialData({ ...INITIAL_DATA, timestamp: new Date().toISOString(), inspectedBy: currentUser?.name || '', ...prefill });
      setViewMode('form');
  };

  const handleExitForm = (savedData?: InspectionData) => setViewMode('dashboard');

  const handleGoogleSheetSubmit = async (formData: InspectionData) => {
    if (isSystemLocked) {
        showToast("RESTRICTED: View-Only mode. Submission blocked.", "error");
        return;
    }
    if (!appScriptUrl) {
        showToast("Server URL not configured", "error");
        return;
    }

    setSubmissionStatus('submitting');
    setLastSubmittedData(formData);

    let sheetName = 'General';
    let headers = SHEET_HEADERS;
    let moduleTitle = "General Vehicle Inspection";
    let activeItems = INSPECTION_ITEMS;

    if (activeModule === 'petroleum') { 
        sheetName = 'Petroleum'; headers = PETROLEUM_HEADERS; 
        moduleTitle = "Petroleum Tanker Inspection"; activeItems = PETROLEUM_INSPECTION_ITEMS;
    } else if (activeModule === 'petroleum_v2') { 
        sheetName = 'Petroleum_V2'; headers = PETROLEUM_V2_HEADERS; 
        moduleTitle = "Petroleum Tanker Inspection V2"; activeItems = PETROLEUM_V2_ITEMS;
    } else if (activeModule === 'acid') { 
        sheetName = 'Acid'; headers = ACID_HEADERS; 
        moduleTitle = "Acid Tanker Inspection"; activeItems = ACID_INSPECTION_ITEMS;
    }

    const row = headers.map(h => formData[h] !== undefined ? formData[h] : "");
    const reportData = {
        title: moduleTitle,
        timestamp: formData.timestamp,
        truckNo: formData.truckNo,
        trailerNo: formData.trailerNo,
        jobCard: formData.jobCard,
        location: formData.location,
        odometer: formData.odometer,
        inspectedBy: formData.inspectedBy,
        driverName: formData.driverName,
        remarks: formData.remarks,
        rate: formData.rate,
        signatures: { inspector: formData.inspectorSignature, driver: formData.driverSignature },
        photos: { front: formData.photoFront, ls: formData.photoLS, rs: formData.photoRS, back: formData.photoBack, damage: formData.photoDamage },
        items: activeItems.map(item => ({ label: item.label, category: item.category, status: formData[item.id] || 'N/A' })),
        companyName: settings.companyName,
        companyLogo: settings.companyLogo
    };

    const payload = { action: 'create', sheet: sheetName, headers: headers, row: row, requestId: formData.requestId || null, reportData: reportData };

    if (!navigator.onLine) {
        addToQueue(payload);
        setSubmissionStatus('offline_saved');
        setTimeout(() => { setSubmissionStatus('idle'); setViewMode('dashboard'); }, 3500);
        return;
    }

    try {
        await fetch(appScriptUrl, { method: 'POST', body: JSON.stringify(payload), mode: 'no-cors' });
        setSubmissionStatus('success');
        fetchHistory(true); 
    } catch (error) {
        console.error("Submission error", error);
        addToQueue(payload);
        setSubmissionStatus('offline_saved');
        setTimeout(() => { setSubmissionStatus('idle'); setViewMode('dashboard'); }, 3500);
    }
  };

  const handleRequestSubmit = async (data: any) => {
      if (isSystemLocked) { showToast("RESTRICTED: View-Only mode. Requests disabled.", "error"); return; }
      if (!appScriptUrl) return;
      try {
          await fetch(appScriptUrl, {
              method: 'POST',
              body: JSON.stringify({ action: 'request_inspection', requester: currentUser?.name, role: currentUser?.role, ...data }),
              mode: 'no-cors'
          });
          showToast("Inspection Request submitted successfully", "success");
      } catch (e) { showToast("Failed to submit request", "error"); }
  };

  const handleViewReport = (item: InspectionData | null) => {
    setSelectedReportData(item);
    setIsReportModalOpen(true);
  };

  const handleOnboardingComplete = (updatedUser: User) => {
      const userWithSetup = { ...updatedUser, needsSetup: false };
      setCurrentUser(userWithSetup);
      localStorage.setItem('safetyCheck_user', JSON.stringify(userWithSetup));
      setActiveModule('overview');
      setViewMode('dashboard');
      showToast("Profile updated successfully.", "success");
      setShowTour(true);
  };

  const handleCheckMaintStatus = async () => {
    setIsCheckingMaint(true);
    try { await fetchSystemSettings(appScriptUrl, true); showToast("System status updated.", "info"); } finally { setIsCheckingMaint(false); }
  };

  const isAtRoot = activeModule === 'overview';

  if (!currentUser) {
      return (
          <>
            <InstallPwaPrompt />
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
            <LoginView onLogin={handleLogin} appScriptUrl={appScriptUrl} setAppScriptUrl={setAppScriptUrl} settings={settings} />
          </>
      );
  }

  if (currentUser && (currentUser as any).needsSetup) {
      return <OnboardingWizard user={currentUser} appScriptUrl={appScriptUrl} onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className="min-h-screen bg-white font-sans text-gray-900 relative">
      <SubmissionOverlay 
        status={submissionStatus} 
        onClose={() => { setSubmissionStatus('idle'); setViewMode('dashboard'); }}
        onViewReport={() => lastSubmittedData && handleViewReport(lastSubmittedData)}
      />
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showTour && <SystemTour onComplete={() => setShowTour(false)} />}

      {isProfileModalOpen && (
          <ProfileModal user={currentUser} settings={settings} appScriptUrl={appScriptUrl} onClose={() => setIsProfileModalOpen(false)} showToast={showToast} onUpdateSuccess={(u) => setCurrentUser(u)} onLogout={() => { setIsProfileModalOpen(false); handleLogout(); }} />
      )}

      <RequestInspectionModal isOpen={isRequestModalOpen} onClose={() => setIsRequestModalOpen(false)} onSubmit={handleRequestSubmit} validationLists={validationLists} currentUserRole={currentUser.role} />

      <div className="relative z-10 min-h-screen flex flex-col">
          <div className="no-print">
            {settings.maintenanceMode && (
                <div className="bg-amber-600 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-white shadow-lg relative z-[101]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center animate-pulse">
                            <svg className="w-5 h-5 text-amber-100" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <div className="text-center sm:text-left">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-1">System Maintenance Mode Active</p>
                            <p className="text-[11px] font-medium text-amber-5 text-amber-50 leading-tight">{settings.maintenanceMessage || 'Restricted view-only mode enabled for updates.'}</p>
                        </div>
                    </div>
                    <button onClick={handleCheckMaintStatus} disabled={isCheckingMaint} className="px-4 py-1.5 bg-white/10 hover:bg-white/20 border border-white/30 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                        {isCheckingMaint ? <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : null}
                        {isCheckingMaint ? 'Checking...' : 'Check Status'}
                    </button>
                </div>
            )}
            <SubscriptionAlert subscription={subscription} user={currentUser} onManage={() => setActiveModule('maintenance')} />
          </div>

          <header className="bg-white border-b border-gray-100 sticky top-0 z-40 px-4 py-2 flex items-center justify-between h-14 no-print">
              <div className="flex items-center gap-1 sm:gap-2">
                  {!isAtRoot ? (
                      <button onClick={() => { setActiveModule('overview'); setViewMode('dashboard'); }} title="Back to Overview" className="p-2 text-slate-900 hover:bg-slate-50 rounded-lg transition-all flex items-center group">
                          <svg className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"></path></svg>
                          <span className="text-[10px] font-bold uppercase tracking-widest ml-1 hidden sm:inline">Back</span>
                      </button>
                  ) : <div className="w-10"></div>}
              </div>
              <button onClick={() => { setActiveModule('overview'); setViewMode('dashboard'); }} className="flex flex-col items-center hover:opacity-70 transition-opacity">
                  <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none uppercase">{settings.companyName || 'SafetyCheck Pro'}</h1>
                  <span className="text-[7px] font-bold text-slate-400 tracking-[0.3em] mt-1 uppercase">Fleet Portal</span>
              </button>
              <div className="flex items-center gap-1">
                  <NotificationCenter id="notification-bell" notifications={notifications} onMarkAsRead={(id) => handleMarkNotificationRead(id, handleNavigate)} onDismiss={handleDismissNotification} onClearAll={handleClearAllNotifications} onAcknowledge={handleGlobalAcknowledge} canAcknowledge={isAdmin} />
                  <button onClick={() => setIsProfileModalOpen(true)} className={`p-2 transition-colors ${isProfileModalOpen ? 'text-slate-900 bg-slate-50 rounded-full' : 'text-slate-400 hover:text-slate-600'}`}>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                  </button>
              </div>
          </header>

          {isSystemLocked && (
              <div className="bg-amber-100 border-b border-amber-200 px-4 py-2 flex items-center justify-center gap-3 animate-pulse no-print">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-widest">
                      {lockInfo.reason === 'maintenance' ? 'System in Maintenance Mode - Restricted Access' : 'System in Restricted View-Only Mode - License Expired'}
                  </span>
              </div>
          )}

          <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto no-print">
              {viewMode === 'form' ? (
                  <InspectionFormView initialData={formInitialData} activeModule={activeModule} validationLists={validationLists} settings={settings} onSaveDraft={handleExitForm} onExit={() => setViewMode('dashboard')} onSubmit={handleGoogleSheetSubmit} submissionStatus={submissionStatus} onViewReport={handleViewReport} />
              ) : (
                  <div className="animate-fadeIn">
                      {activeModule === 'overview' && <OverviewDashboard appScriptUrl={appScriptUrl} onNavigate={handleNavigate} userRole={currentUser.role} historyList={historyList} isLoading={isLoadingHistory} onViewReport={handleViewReport} isMaintenanceActive={settings.maintenanceMode} pendingAlertsCount={notifications.filter(n => !n.read && n.type === 'critical').length} isLocked={isSystemLocked} />}
                      {activeModule === 'analytics' && <AnalyticsDashboard historyList={historyList} isLoading={isLoadingHistory} />}
                      {activeModule === 'fleet_wall' && <FleetWallView historyList={historyList} isLoading={isLoadingHistory} onClose={() => handleNavigate('overview')} />}
                      {activeModule === 'library' && <LibraryView />}
                      {(activeModule === 'settings' && isAdmin) && <SettingsView settings={settings} setSettings={setSettings} appScriptUrl={appScriptUrl} setAppScriptUrl={setAppScriptUrl} handleSaveSettings={handleSaveSettings} isSavingSettings={isSavingSettings} showToast={showToast} user={currentUser} />}
                      {(activeModule === 'maintenance' && isSuperAdmin) && <MaintenanceView user={currentUser} appScriptUrl={appScriptUrl} settings={settings} onSettingsUpdate={(s) => setSettings(p => ({...p, ...s}))} showToast={showToast} onRefreshSubscription={refreshSubscription} subscription={subscription} history={subHistory} />}
                      {activeModule === 'general' && <GeneralDashboard userRole={currentUser.role} stats={stats} startNewInspection={() => startFreshInspection('general')} fetchHistory={fetchHistory} isLoadingHistory={isLoadingHistory} historyList={historyList} onViewReport={handleViewReport} onPrint={() => {}} isLocked={isSystemLocked} lockReason={lockInfo.reason} maintenanceMessage={settings.maintenanceMessage} />}
                      {activeModule === 'petroleum' && <PetroleumDashboard userRole={currentUser.role} stats={stats} startNewInspection={() => startFreshInspection('petroleum')} fetchHistory={fetchHistory} isLoadingHistory={isLoadingHistory} historyList={historyList} onViewReport={handleViewReport} onPrint={() => {}} isLocked={isSystemLocked} lockReason={lockInfo.reason} maintenanceMessage={settings.maintenanceMessage} />}
                      {activeModule === 'petroleum_v2' && <PetroleumV2Dashboard userRole={currentUser.role} stats={stats} startNewInspection={() => startFreshInspection('petroleum_v2')} fetchHistory={fetchHistory} isLoadingHistory={isLoadingHistory} historyList={historyList} onViewReport={handleViewReport} onPrint={() => {}} isLocked={isSystemLocked} lockReason={lockInfo.reason} maintenanceMessage={settings.maintenanceMessage} />}
                      {activeModule === 'acid' && <AcidDashboard userRole={currentUser.role} stats={stats} startNewInspection={() => startFreshInspection('acid')} fetchHistory={fetchHistory} isLoadingHistory={isLoadingHistory} historyList={historyList} onViewReport={handleViewReport} onPrint={() => {}} isLocked={isSystemLocked} lockReason={lockInfo.reason} maintenanceMessage={settings.maintenanceMessage} />}
                      {(activeModule === 'users' && isAdmin) && <UserManagementView currentUser={currentUser} appScriptUrl={appScriptUrl} showToast={showToast} validationLists={validationLists} settings={settings} />}
                      {activeModule === 'support' && <SupportView appScriptUrl={appScriptUrl} currentUser={currentUser} showToast={showToast} settings={settings} validationLists={validationLists} />}
                      {activeModule === 'track_requests' && <RequestTrackingView appScriptUrl={appScriptUrl} currentUser={currentUser} showToast={showToast} onRequestNew={() => setIsRequestModalOpen(true)} />}
                  </div>
              )}
          </main>
          <footer className="mt-auto py-6 border-t border-slate-50 text-center no-print">
              <span className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">scbc@2026</span>
          </footer>
      </div>

      {isReportModalOpen && selectedReportData && (
          <ReportViewerModal onClose={() => setIsReportModalOpen(false)} onPrint={() => window.print()} title={`Report_${selectedReportData.id || 'History'}`}>
              {activeModule === 'petroleum' ? <PrintablePetroleumReport data={selectedReportData} settings={settings} /> : activeModule === 'petroleum_v2' ? <PrintablePetroleumV2Report data={selectedReportData} settings={settings} /> : activeModule === 'acid' ? <PrintableAcidReport data={selectedReportData} settings={settings} /> : <PrintableGeneralReport data={selectedReportData} settings={settings} />}
          </ReportViewerModal>
      )}
    </div>
  );
};

export default App;