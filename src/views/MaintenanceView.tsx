
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';

interface MaintenanceViewProps {
    user: User;
    appScriptUrl: string;
    settings: SystemSettings;
    onSettingsUpdate: (newSettings: Partial<SystemSettings>) => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const MaintenanceView: React.FC<MaintenanceViewProps> = ({ user, appScriptUrl, settings, onSettingsUpdate, showToast }) => {
    const [msgType, setMsgType] = useState<'info' | 'warning' | 'critical'>('info');
    const [msgBody, setMsgBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    
    // Maintenance Mode State
    const [maintMode, setMaintMode] = useState(settings.maintenanceMode || false);
    const [maintMessage, setMaintMessage] = useState(settings.maintenanceMessage || 'System under scheduled maintenance.');
    const [isSavingMaint, setIsSavingMaint] = useState(false);

    const handleBroadcast = async () => {
        if (!msgBody.trim()) {
            showToast("Please enter a message.", "error");
            return;
        }
        setIsSending(true);
        try {
            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'broadcast',
                    type: msgType,
                    message: msgBody
                }),
                mode: 'no-cors'
            });
            showToast("Broadcast sent successfully!", "success");
            setMsgBody('');
        } catch (e) {
            showToast("Failed to send broadcast.", "error");
        } finally {
            setIsSending(false);
        }
    };

    const handleSaveMaintenance = async () => {
        setIsSavingMaint(true);
        try {
            // Re-use update_settings but only for maintenance fields
            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_settings',
                    companyName: settings.companyName,
                    managerEmail: settings.managerEmail,
                    companyLogo: settings.companyLogo,
                    mobileApkLink: settings.mobileApkLink,
                    webAppUrl: settings.webAppUrl,
                    maintenanceMode: maintMode,
                    maintenanceMessage: maintMessage
                })
            });
            
            // Optimistic update locally
            onSettingsUpdate({ maintenanceMode: maintMode, maintenanceMessage: maintMessage });
            showToast("System status updated.", "success");
        } catch (e) {
            showToast("Failed to update system status.", "error");
        } finally {
            setIsSavingMaint(false);
        }
    };

    const applyTemplate = (type: 'upgrade' | 'downtime' | 'restart') => {
        if (type === 'upgrade') {
            setMsgType('info');
            setMsgBody('System Upgrade scheduled for tonight at 22:00. Brief downtime expected.');
        } else if (type === 'downtime') {
            setMsgType('critical');
            setMsgBody('Emergency Maintenance: System will be offline in 15 minutes. Please save your work.');
        } else if (type === 'restart') {
            setMsgType('warning');
            setMsgBody('Server restart initiated. Performance may be degraded for 5 minutes.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto animate-fadeIn pb-12 space-y-8">
            <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-red-600 rounded-xl shadow-lg text-white">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>
                </div>
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Superadmin Console</h1>
                    <p className="text-slate-500 font-medium">System Control & Emergency Broadcasts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* LEFT: Broadcast Center */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path></svg>
                                Broadcast Alert
                            </h3>
                            <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded uppercase">All Users</span>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Message Content</label>
                                <textarea 
                                    className="w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none min-h-[120px] text-sm text-slate-700 bg-slate-50 font-medium placeholder-slate-400"
                                    placeholder="Type your alert message here..."
                                    value={msgBody}
                                    onChange={e => setMsgBody(e.target.value)}
                                ></textarea>
                            </div>

                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Severity</label>
                                    <div className="flex bg-slate-100 p-1 rounded-lg">
                                        {(['info', 'warning', 'critical'] as const).map(t => (
                                            <button
                                                key={t}
                                                onClick={() => setMsgType(t)}
                                                className={`flex-1 py-2 text-xs font-bold rounded-md capitalize transition-all
                                                    ${msgType === t 
                                                        ? (t === 'info' ? 'bg-white text-blue-600 shadow-sm' : t === 'warning' ? 'bg-white text-amber-600 shadow-sm' : 'bg-white text-red-600 shadow-sm') 
                                                        : 'text-slate-400 hover:text-slate-600'}
                                                `}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-end">
                                    <button 
                                        onClick={handleBroadcast}
                                        disabled={isSending}
                                        className="h-[42px] px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {isSending ? 'Sending...' : 'Send Alert'}
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-50 px-6 py-3 border-t border-slate-100 flex gap-2 overflow-x-auto">
                            <button onClick={() => applyTemplate('upgrade')} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-blue-300 hover:text-blue-600 transition whitespace-nowrap">Load: Scheduled Upgrade</button>
                            <button onClick={() => applyTemplate('downtime')} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-red-300 hover:text-red-600 transition whitespace-nowrap">Load: Emergency Downtime</button>
                            <button onClick={() => applyTemplate('restart')} className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:border-amber-300 hover:text-amber-600 transition whitespace-nowrap">Load: Server Restart</button>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Maintenance Mode */}
                <div className="space-y-6">
                    <div className={`rounded-2xl shadow-sm border overflow-hidden transition-all ${maintMode ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                        <div className={`px-6 py-4 border-b flex justify-between items-center ${maintMode ? 'bg-red-100 border-red-200' : 'bg-slate-50 border-slate-100'}`}>
                            <h3 className={`font-bold flex items-center gap-2 ${maintMode ? 'text-red-800' : 'text-slate-800'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
                                System Lockdown
                            </h3>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold uppercase tracking-wider ${maintMode ? 'text-red-600' : 'text-slate-400'}`}>
                                    {maintMode ? 'Active' : 'Inactive'}
                                </span>
                                <button 
                                    onClick={() => setMaintMode(!maintMode)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${maintMode ? 'bg-red-600' : 'bg-slate-200'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${maintMode ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-slate-600">
                                When active, only <strong>SuperAdmins</strong> can access the system. All other users will see a maintenance screen.
                            </p>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Public Maintenance Message</label>
                                <input 
                                    type="text" 
                                    className={`w-full p-3 border rounded-lg text-sm font-bold outline-none transition ${maintMode ? 'bg-white border-red-300 text-red-900 focus:ring-red-500' : 'bg-slate-50 border-slate-300 text-slate-700'}`}
                                    value={maintMessage}
                                    onChange={e => setMaintMessage(e.target.value)}
                                />
                            </div>

                            <div className="pt-2">
                                <button 
                                    onClick={handleSaveMaintenance}
                                    disabled={isSavingMaint}
                                    className={`w-full py-3 rounded-xl font-bold shadow-md transition-all flex items-center justify-center gap-2
                                        ${maintMode 
                                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-200' 
                                            : 'bg-slate-800 hover:bg-slate-900 text-white shadow-slate-200'}
                                    `}
                                >
                                    {isSavingMaint ? 'Saving...' : 'Update System Status'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Quick Info */}
                    <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100">
                        <h4 className="text-sm font-bold text-blue-900 mb-2">Admin Tips</h4>
                        <ul className="text-xs text-blue-700 space-y-2 list-disc pl-4">
                            <li>Broadcasts appear instantly for online users.</li>
                            <li>Critical alerts will show a red indicator on the notification bell.</li>
                            <li>Lockdown mode does not affect SuperAdmins, allowing you to verify fixes before reopening.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MaintenanceView;
