
import React, { useState, useEffect } from 'react';
import { SystemSettings, User } from '../types';
import { BACKEND_SCRIPT_TEMPLATE, BACKEND_FILES } from '../constants';

interface SettingsViewProps {
    settings: SystemSettings;
    setSettings: React.Dispatch<React.SetStateAction<SystemSettings>>;
    appScriptUrl: string;
    setAppScriptUrl: (url: string) => void;
    handleSaveSettings: () => void;
    isSavingSettings: boolean;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    user?: User | null; // Passed to check roles
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
    settings, setSettings, appScriptUrl, setAppScriptUrl, handleSaveSettings, isSavingSettings, showToast, user 
}) => {
    const [isCopying, setIsCopying] = useState(false);
    const [showEmailHelp, setShowEmailHelp] = useState(false);
    const [isExtending, setIsExtending] = useState(false);
    const [logoError, setLogoError] = useState(false);
    
    // File Explorer State
    const [selectedFile, setSelectedFile] = useState<string>('1_Controller.gs');

    useEffect(() => {
        setLogoError(false);
    }, [settings.companyLogo]);

    // Permission Logic
    const isSuperAdmin = user?.role === 'SuperAdmin';
    const canEditCompanySettings = isSuperAdmin || user?.role === 'Admin';
    const canEditSystemConfig = isSuperAdmin; 

    const compressImage = (file: File, callback: (base64: string) => void) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                const maxWidth = 300; 
                const maxHeight = 150;
                let width = img.width;
                let height = img.height;

                if (width > height) {
                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width *= maxHeight / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;
                
                if (ctx) {
                    ctx.fillStyle = "#FFFFFF";
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                    callback(dataUrl);
                }
            };
            img.src = e.target?.result as string;
        };
        reader.readAsDataURL(file);
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!canEditCompanySettings) return;
        const file = e.target.files?.[0];
        if (file) {
          showToast("Compressing logo...", 'info');
          compressImage(file, (base64) => {
             setSettings(s => ({ ...s, companyLogo: base64 }));
             showToast("Logo processed. Click 'Save Configuration' to persist.", 'success');
          });
        }
    };

    const copyScriptToClipboard = (all: boolean = false) => {
        const text = all ? BACKEND_SCRIPT_TEMPLATE : BACKEND_FILES[selectedFile as keyof typeof BACKEND_FILES];
        navigator.clipboard.writeText(text);
        setIsCopying(true);
        showToast(all ? "Full project code copied!" : `${selectedFile} copied!`, 'success');
        setTimeout(() => setIsCopying(false), 2000);
    };

    const copyToClipboard = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text).then(() => {
            showToast(`${label} copied!`, 'success');
        }).catch(() => showToast("Failed to copy", 'error'));
    };

    const handleCombinedShare = async () => {
        const company = settings.companyName || 'SafetyCheck Pro';
        const webUrl = settings.webAppUrl || 'Not configured';
        const apkLink = settings.mobileApkLink || 'Not configured';

        const title = `${company} - App Access`;
        const text = `🚀 SYSTEM ACCESS DETAILS\n\nOrganization: ${company}\n\nHere are the links to access the Inspection System:\n\n📱 DOWNLOAD MOBILE APP (Android):\n${apkLink}\n\n💻 ACCESS WEB PORTAL:\n${webUrl}\n\nPlease save these links for future use.`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    text: text
                });
                showToast("System details shared successfully!", 'success');
            } catch (err) {
                copyToClipboard(text, "Access Details");
            }
        } else {
            copyToClipboard(text, "Access Details");
        }
    };

    return (
        <div className="max-w-4xl mx-auto animate-fadeIn space-y-8 pb-12">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
               <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                  </div>
                  System Settings
              </h2>
              {!canEditSystemConfig && (
                  <div className="bg-amber-100 text-amber-800 px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 border border-amber-200">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                      Limited Access
                  </div>
              )}
             </div>

             {/* APP DISTRIBUTION & SHARING (UNIFIED) */}
             <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl shadow-lg border border-indigo-500 p-6 text-white relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-24 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                 <div className="relative z-10">
                     <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <svg className="w-6 h-6 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                Share Application Access
                            </h3>
                            <p className="text-indigo-100 text-sm mt-1">Distribute App and Web Portal links to your team.</p>
                        </div>
                        <button 
                            onClick={handleCombinedShare}
                            className="bg-white text-indigo-700 hover:bg-indigo-50 font-bold py-2 px-4 rounded-lg shadow-md transition-transform transform active:scale-95 flex items-center gap-2 text-sm"
                        >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/></svg>
                            Share All Details
                        </button>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                             <div className="flex justify-between items-center mb-1">
                                 <div className="flex items-center gap-2">
                                     <svg className="w-4 h-4 text-green-400" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.4102 13.8688 8.0099 12 8.0099s-3.5902.4003-5.1367.9497L4.841 5.4565a.416.416 0 00-.5676-.1521.416.416 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3432-4.1021-2.6889-7.5743-6.1185-9.4396"/></svg>
                                     <span className="text-xs font-bold text-indigo-100">Android APK</span>
                                 </div>
                                 <button onClick={() => copyToClipboard(settings.mobileApkLink!, 'APK Link')} className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded transition">Copy</button>
                             </div>
                             <div className="text-xs text-indigo-200 truncate font-mono bg-black/20 p-1.5 rounded">
                                 {settings.mobileApkLink || 'Not configured'}
                             </div>
                         </div>

                         <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm border border-white/10">
                             <div className="flex justify-between items-center mb-1">
                                 <div className="flex items-center gap-2">
                                     <svg className="w-4 h-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path></svg>
                                     <span className="text-xs font-bold text-indigo-100">Web Portal</span>
                                 </div>
                                 <button onClick={() => copyToClipboard(settings.webAppUrl!, 'Web Link')} className="text-[10px] bg-white/20 hover:bg-white/30 text-white px-2 py-0.5 rounded transition">Copy</button>
                             </div>
                             <div className="text-xs text-indigo-200 truncate font-mono bg-black/20 p-1.5 rounded">
                                 {settings.webAppUrl || 'Not configured'}
                             </div>
                         </div>
                     </div>
                 </div>
             </div>
             
             {/* Configuration Card */}
             <div className={`bg-white p-8 rounded-xl shadow-sm border border-gray-100 space-y-6 ${!canEditCompanySettings ? 'opacity-80 pointer-events-none grayscale-[0.2]' : ''}`}>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold text-gray-800">Company Profile & App Links</h3>
                    {canEditCompanySettings && !canEditSystemConfig && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">You can edit profile</span>}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">Company Name</label>
                       <input 
                          type="text" 
                          value={settings.companyName} 
                          onChange={(e) => setSettings(s => ({...s, companyName: e.target.value}))}
                          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="e.g. Apex Logistics Ltd."
                          readOnly={!canEditCompanySettings}
                       />
                    </div>
                    
                    <div>
                       <label className="block text-sm font-bold text-gray-700 mb-2">Manager Email</label>
                       <input 
                          type="email" 
                          value={settings.managerEmail} 
                          onChange={(e) => setSettings(s => ({...s, managerEmail: e.target.value}))}
                          className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                          placeholder="manager@company.com"
                          readOnly={!canEditCompanySettings}
                       />
                    </div>
                </div>

                {isSuperAdmin && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-blue-50 p-4 rounded-xl border border-blue-100">
                        <div className="col-span-1 md:col-span-2 text-[10px] text-blue-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            Enter Distribution Links (Will appear in Share Card for all users)
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Mobile APK Download Link</label>
                           <input 
                              type="text" 
                              value={settings.mobileApkLink || ''} 
                              onChange={(e) => setSettings(s => ({...s, mobileApkLink: e.target.value}))}
                              className="w-full p-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-blue-900"
                              placeholder="https://example.com/app.apk"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-bold text-blue-800 uppercase mb-2">Web Browser Link</label>
                           <input 
                              type="text" 
                              value={settings.webAppUrl || ''} 
                              onChange={(e) => setSettings(s => ({...s, webAppUrl: e.target.value}))}
                              className="w-full p-3 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-sm text-blue-900"
                              placeholder="https://safetycheck.com"
                           />
                        </div>
                    </div>
                )}

                <div>
                   <label className="block text-sm font-bold text-gray-700 mb-2">Company Logo (For Reports)</label>
                   <div className="flex items-center gap-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                       <div className="w-20 h-20 bg-white border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shadow-sm">
                           {settings.companyLogo && !logoError ? (
                               <img 
                                    src={settings.companyLogo} 
                                    alt="Logo" 
                                    className="w-full h-full object-contain" 
                                    onError={() => setLogoError(true)}
                                />
                           ) : (
                               <span className="text-xs text-gray-300">No Logo</span>
                           )}
                       </div>
                       <div className="flex-1">
                           <input 
                              type="file" 
                              accept="image/*"
                              onChange={handleLogoUpload}
                              disabled={!canEditCompanySettings}
                              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer disabled:cursor-not-allowed"
                           />
                           <p className="text-xs text-gray-400 mt-2">
                               Image will be automatically resized & compressed for database storage.
                           </p>
                       </div>
                   </div>
                </div>

                <div className="flex justify-end pt-2 border-t border-gray-100">
                     <button 
                        onClick={handleSaveSettings} 
                        disabled={isSavingSettings || !canEditCompanySettings}
                        className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
                            ${isSavingSettings || !canEditCompanySettings ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700 hover:scale-105'}
                        `}
                     >
                        {isSavingSettings ? 'Saving...' : 'Save Configuration'}
                     </button>
                </div>
             </div>

             {/* Connection Card - BLURRED FOR NON-SUPERADMIN */}
             <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 relative overflow-hidden">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-800">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"></path></svg>
                    Database Connection
                </h3>
                
                <div className="space-y-4 relative">
                    {!canEditSystemConfig && (
                        <div className="absolute inset-0 z-10 bg-white/10 backdrop-blur-[3px] flex items-center justify-center rounded-lg border border-dashed border-slate-300">
                            <span className="bg-slate-800 text-white text-xs font-bold px-3 py-1 rounded shadow-lg flex items-center gap-2">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                PROTECTED
                            </span>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Google Apps Script Web App URL</label>
                        <input 
                            type="text" 
                            value={appScriptUrl} 
                            onChange={(e) => setAppScriptUrl(e.target.value)}
                            placeholder="https://script.google.com/macros/s/..."
                            className={`w-full p-3 bg-gray-50 border border-gray-300 rounded-lg font-mono text-xs text-blue-800 break-all
                                ${!canEditSystemConfig ? 'blur-[3px] select-none pointer-events-none opacity-50' : ''}
                            `}
                            readOnly={!canEditSystemConfig}
                        />
                    </div>
                    <div className="flex justify-end pt-2">
                         <button 
                            onClick={handleSaveSettings} 
                            disabled={isSavingSettings || !canEditSystemConfig}
                            className={`px-6 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2
                                ${!canEditSystemConfig ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'}
                            `}
                         >
                            Update Connection
                         </button>
                    </div>
                </div>
             </div>

             {/* BACKEND SCRIPT SECTION - NEW FILE EXPLORER */}
             {canEditSystemConfig && (
                 <div className="bg-slate-900 text-slate-300 p-0 rounded-xl shadow-lg border border-slate-800 overflow-hidden flex flex-col md:flex-row min-h-[500px]">
                    {/* File Sidebar */}
                    <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col">
                        <div className="p-4 border-b border-slate-800">
                            <h3 className="text-white text-sm font-bold flex items-center gap-2">
                                <svg className="w-4 h-4 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"></path></svg>
                                Project Files
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {Object.keys(BACKEND_FILES).map((fileName) => (
                                <button
                                    key={fileName}
                                    onClick={() => setSelectedFile(fileName)}
                                    className={`w-full text-left px-4 py-3 text-xs font-mono border-l-2 transition-all flex items-center justify-between
                                        ${selectedFile === fileName 
                                            ? 'bg-slate-800 text-white border-blue-500' 
                                            : 'border-transparent text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                                        }
                                    `}
                                >
                                    <span>{fileName}</span>
                                    {selectedFile === fileName && <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-800">
                            <button 
                                onClick={() => copyScriptToClipboard(true)}
                                className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                                Copy Entire Project
                            </button>
                        </div>
                    </div>

                    {/* Code Viewer */}
                    <div className="flex-1 flex flex-col bg-slate-900">
                        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Viewing:</span>
                                <span className="text-sm font-mono text-green-400 font-bold">{selectedFile}</span>
                            </div>
                            <button 
                                onClick={() => copyScriptToClipboard(false)}
                                className={`px-3 py-1.5 rounded text-xs font-bold border transition-all flex items-center gap-2
                                    ${isCopying 
                                        ? 'bg-green-500/10 border-green-500 text-green-400' 
                                        : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                                    }
                                `}
                            >
                                {isCopying ? (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"></path></svg>
                                        Copy File
                                    </>
                                )}
                            </button>
                        </div>
                        <div className="flex-1 relative">
                            <pre className="absolute inset-0 p-6 overflow-auto text-[11px] font-mono text-slate-300 leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
                                {BACKEND_FILES[selectedFile as keyof typeof BACKEND_FILES]}
                            </pre>
                        </div>
                    </div>
                 </div>
             )}
        </div>
    );
}

export default SettingsView;
