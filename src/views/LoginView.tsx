
import React, { useState } from 'react';
import { User, SystemSettings } from '../types';
import { BACKEND_SCRIPT_TEMPLATE } from '../constants';

interface LoginViewProps {
  onLogin: (user: User) => void;
  appScriptUrl: string;
  setAppScriptUrl: (url: string) => void;
  settings: SystemSettings;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, appScriptUrl, setAppScriptUrl, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfig, setShowConfig] = useState(!appScriptUrl); // Only show if URL is missing
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [logoError, setLogoError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appScriptUrl) {
      setError("System Database URL is missing.");
      setShowConfig(true);
      return;
    }
    setError('');
    setIsLoading(true);

    try {
      // CRITICAL: First user registered (Bootstrapping) must be SuperAdmin
      const payload = isRegistering 
        ? { action: 'register_user', username, password, name: fullName, position: position, role: 'SuperAdmin' }
        : { action: 'login', username, password };

      const response = await fetch(appScriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      if (result.status === 'success') {
          if (isRegistering) {
              setError("System Owner (SuperAdmin) created! Please log in.");
              setIsRegistering(false);
              setFullName('');
              setPosition('');
              setPassword('');
          } else {
              const rawUser = result.user;
              let safeRole: User['role'] = 'Inspector';
              const rawRole = rawUser.role ? String(rawUser.role).trim().toLowerCase() : '';
              
              if (rawRole === 'superadmin') safeRole = 'SuperAdmin';
              else if (rawRole === 'admin') safeRole = 'Admin';
              else if (rawRole === 'operations') safeRole = 'Operations';
              else if (rawRole === 'maintenance') safeRole = 'Maintenance';
              else if (rawRole === 'secretary') safeRole = 'Secretary'; // Explicitly handle Secretary
              else if (rawRole === 'other') safeRole = 'Other';
              else safeRole = 'Inspector';
              
              const normalizedUser: User = {
                  ...rawUser,
                  role: safeRole,
                  position: rawUser.position || ''
              };

              // Note: Password change logic is now handled in App.tsx via OnboardingWizard
              onLogin(normalizedUser);
          }
      } else if (result.code === 'NO_USERS') {
          setError("New Database detected. Create the System Owner account.");
          setIsRegistering(true);
      } else {
          setError(result.message || "Authentication failed.");
      }

    } catch (err) {
      console.error("Login Error", err);
      setError("Connection failed. Check internet or Settings.");
    } finally {
      setIsLoading(false); 
    }
  };

  const copyScript = () => {
      navigator.clipboard.writeText(BACKEND_SCRIPT_TEMPLATE);
      setIsCopying(true);
      setTimeout(() => setIsCopying(false), 2000);
  };

  return (
    <div className="min-h-screen w-full bg-white flex items-center justify-center p-4 font-sans text-slate-600 relative overflow-hidden">
       {/* Background accent - Subtle professional gradients matching logo tones */}
       <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-50/60 blur-[100px] rounded-full pointer-events-none"></div>
       <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-emerald-50/60 blur-[100px] rounded-full pointer-events-none"></div>

       {/* Main Container */}
       <div className="w-full max-w-[420px] relative z-10 flex flex-col items-center">
          
          {/* Logo & Header */}
          <div className="text-center mb-8 w-full animate-fadeIn">
             <div 
                className="w-auto h-28 mx-auto mb-6 flex items-center justify-center p-2 transition-transform duration-300 hover:scale-105"
             >
                {settings.companyLogo && !logoError ? (
                    <img 
                        src={settings.companyLogo} 
                        alt="Logo" 
                        className="w-full h-full object-contain" 
                        onError={() => setLogoError(true)}
                    />
                ) : (
                    <div className="flex flex-col items-center">
                        <svg className="w-16 h-16 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        <span className="text-2xl font-black text-slate-900 tracking-tight mt-2">JUBA</span>
                    </div>
                )}
             </div>
             
             <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                 {settings.companyName || 'SafetyCheck Pro'}
             </h1>
             <p className="text-sm font-medium text-slate-500 mt-1">Professional Fleet Inspection Portal</p>
          </div>

          {/* Login Form Container - Seamless White */}
          <div className="w-full bg-white p-2">
              <form onSubmit={handleSubmit} className="space-y-6">
                  
                  {error && (
                      <div className={`p-4 rounded-lg text-xs font-bold flex items-center gap-3 border animate-fadeIn ${error.includes("created") || error.includes("success") ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                          <div className={`w-2 h-2 rounded-full shrink-0 ${error.includes("created") ? 'bg-green-500' : 'bg-red-500'}`}></div>
                          <span className="flex-1">{error}</span>
                      </div>
                  )}

                  {isRegistering && (
                      <div className="space-y-4 animate-fadeIn bg-slate-50 p-6 rounded-xl border border-slate-100 shadow-inner">
                        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-3">
                            <div className="bg-amber-100 text-amber-700 p-1 rounded">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                            </div>
                            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wide">System Owner Setup</h3>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-tight">You are creating the first account (SuperAdmin). You will have full access to settings and subscriptions.</p>
                        <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 pl-1">Full Name</label>
                            <input 
                                type="text" required 
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder-slate-400"
                                placeholder="e.g. John Doe"
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 pl-1">Position</label>
                            <input 
                                type="text" required 
                                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all text-slate-900 text-sm font-medium placeholder-slate-400"
                                placeholder="e.g. Fleet Director"
                                value={position}
                                onChange={e => setPosition(e.target.value)}
                            />
                        </div>
                      </div>
                  )}

                  <div className="space-y-5">
                      <div className="group">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 pl-1 transition-colors group-focus-within:text-emerald-700">Username</label>
                          <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                              </span>
                              <input 
                                  type="text" required 
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 text-sm font-bold placeholder-slate-400 shadow-sm"
                                  placeholder="Enter username"
                                  value={username}
                                  onChange={e => setUsername(e.target.value)}
                              />
                          </div>
                      </div>

                      <div className="group">
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-2 pl-1 transition-colors group-focus-within:text-emerald-700">Password</label>
                          <div className="relative">
                              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-600 transition-colors">
                                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                              </span>
                              <input 
                                  type="password" required 
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all text-slate-900 text-sm font-bold placeholder-slate-400 shadow-sm"
                                  placeholder="••••••••"
                                  value={password}
                                  onChange={e => setPassword(e.target.value)}
                              />
                          </div>
                      </div>
                  </div>

                  <div className="pt-4">
                      <button 
                          type="submit" 
                          disabled={isLoading}
                          className={`w-full py-4 rounded-xl font-bold text-white shadow-lg transition-all text-sm tracking-wide transform active:scale-[0.98] border border-transparent
                              ${isLoading 
                                ? 'bg-slate-400 cursor-wait' 
                                : isRegistering 
                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-blue-200' 
                                    : 'bg-gradient-to-r from-emerald-700 to-emerald-600 hover:from-emerald-600 hover:to-emerald-500 shadow-emerald-200'
                              }
                          `}
                      >
                          {isLoading ? (
                              <div className="flex items-center justify-center gap-2">
                                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                  <span>VERIFYING...</span>
                              </div>
                          ) : (
                              isRegistering ? 'CREATE SYSTEM OWNER' : 'SECURE LOGIN'
                          )}
                      </button>
                  </div>

                  {isRegistering && (
                      <button 
                        type="button" 
                        onClick={() => setIsRegistering(false)}
                        className="w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-800 uppercase tracking-wider transition-colors"
                      >
                          Cancel Registration
                      </button>
                   )}
              </form>

              {/* Configure Link */}
              {!appScriptUrl && !isRegistering && (
                  <div className="mt-12 text-center">
                      <button 
                        type="button" 
                        onClick={() => setShowConfig(!showConfig)}
                        className="group flex items-center justify-center gap-2 mx-auto px-4 py-2 rounded-full bg-slate-100 hover:bg-white border border-slate-200 hover:border-slate-300 shadow-sm transition-all"
                      >
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                          <span className="text-[10px] text-slate-500 group-hover:text-slate-800 font-bold uppercase tracking-widest">Connect Database</span>
                      </button>
                  </div>
              )}
          </div>

          {/* Config Panel */}
          {showConfig && (
              <div className="w-full mt-6 bg-white border border-slate-200 p-6 rounded-2xl animate-fadeIn shadow-xl relative z-20">
                  <h4 className="text-[10px] font-black text-slate-400 mb-4 uppercase tracking-widest flex items-center gap-2">
                      <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      Database Connection
                  </h4>
                  <input 
                      type="text" 
                      value={appScriptUrl} 
                      onChange={e => setAppScriptUrl(e.target.value)}
                      placeholder="https://script.google.com/macros/s/..."
                      className="w-full p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono text-blue-600 mb-4 focus:outline-none focus:border-blue-500 shadow-inner"
                  />
                  <button 
                      onClick={() => setShowScriptModal(true)}
                      className="w-full py-3 bg-slate-800 text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                      <svg className="w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      View Setup Instructions
                  </button>
              </div>
          )}
       </div>

       {/* Script Modal */}
       {showScriptModal && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full flex flex-col max-h-[85vh] overflow-hidden border border-slate-200">
                <div className="p-5 bg-slate-50 flex justify-between items-center border-b border-slate-200">
                    <h3 className="font-bold text-lg text-slate-800">Backend Setup Guide</h3>
                    <button onClick={() => setShowScriptModal(false)} className="text-slate-400 hover:text-slate-700 transition p-2 hover:bg-slate-200 rounded-lg">✕</button>
                </div>
                <div className="p-8 overflow-y-auto bg-white">
                    <div className="prose prose-sm max-w-none text-slate-600 mb-6">
                        <ol className="list-decimal pl-4 space-y-2 font-medium">
                            <li>Create a new <strong>Google Sheet</strong>.</li>
                            <li>Go to <strong>Extensions &gt; Apps Script</strong>.</li>
                            <li>Paste the code below entirely, replacing any existing code.</li>
                            <li>Click <strong>Deploy &gt; New Deployment</strong>.</li>
                            <li>Select type: <strong>Web App</strong>.</li>
                            <li>Set "Execute as" to <strong>Me</strong>.</li>
                            <li>Set "Who has access" to <strong>Anyone</strong>.</li>
                            <li>Copy the resulting Web App URL and paste it into the login screen.</li>
                        </ol>
                    </div>
                    <div className="relative group">
                        <pre className="bg-slate-900 p-6 rounded-xl text-[10px] font-mono text-emerald-400 overflow-x-auto border border-slate-800 shadow-inner h-64">
                            {BACKEND_SCRIPT_TEMPLATE}
                        </pre>
                        <button 
                            onClick={copyScript}
                            className="absolute top-4 right-4 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-500 shadow-lg transition-all transform active:scale-95"
                        >
                            {isCopying ? 'COPIED!' : 'COPY CODE'}
                        </button>
                    </div>
                </div>
            </div>
         </div>
       )}
    </div>
  );
};

export default LoginView;
