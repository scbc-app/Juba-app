
import React, { useState, useEffect } from 'react';
import { User, SystemSettings } from '../types';

interface LoginViewProps {
  onLogin: (user: User) => void;
  appScriptUrl: string;
  setAppScriptUrl: (url: string) => void;
  settings: SystemSettings;
}

const LoginView: React.FC<LoginViewProps> = ({ onLogin, appScriptUrl, setAppScriptUrl, settings }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [fullName, setFullName] = useState('');
  const [position, setPosition] = useState('');
  const [logoError, setLogoError] = useState(false);

  // Load remembered credentials on mount
  useEffect(() => {
    const saved = localStorage.getItem('sc_remembered_creds');
    if (saved) {
      try {
        const { u, p } = JSON.parse(atob(saved));
        setUsername(u);
        setPassword(p);
        setRememberMe(true);
      } catch (e) {
        localStorage.removeItem('sc_remembered_creds');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appScriptUrl || !appScriptUrl.startsWith('https://script.google.com')) {
      setError("System connection not configured. Please contact your IT Administrator.");
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const payload = isRegistering 
        ? { action: 'register_user', username, password, name: fullName, position: position, role: 'SuperAdmin' }
        : { action: 'login', username, password };

      const response = await fetch(appScriptUrl, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      
      const result = await response.json();

      if (result.status === 'success') {
          if (rememberMe) {
            const creds = btoa(JSON.stringify({ u: username, p: password }));
            localStorage.setItem('sc_remembered_creds', creds);
          } else {
            localStorage.removeItem('sc_remembered_creds');
          }

          if (isRegistering) {
              setError("Admin account created. Log in now.");
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
              else if (rawRole === 'secretary') safeRole = 'Secretary';
              else if (rawRole === 'other') safeRole = 'Other';
              else safeRole = 'Inspector';
              
              onLogin({ ...rawUser, role: safeRole, position: rawUser.position || '' });
          }
      } else if (result.code === 'NO_USERS') {
          setError("Initial setup needed. Create Master Admin.");
          setIsRegistering(true);
      } else {
          setError(result.message || "Authentication failed.");
      }

    } catch (err) {
      setError("Unable to reach server. Check connection.");
    } finally {
      setIsLoading(false); 
    }
  };

  const isUrlValid = appScriptUrl && appScriptUrl.startsWith('https://script.google.com');

  return (
    <div className="min-h-screen w-full bg-slate-50 flex flex-col md:flex-row font-sans text-slate-700 overflow-x-hidden">
      
      {/* BRANDING PANEL */}
      <div className="w-full md:w-[35%] lg:w-[30%] bg-emerald-950 p-6 md:p-12 flex flex-col justify-between relative overflow-hidden shrink-0 border-b md:border-b-0 border-emerald-900 shadow-xl z-10">
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-10">
            <div className="absolute -top-10 -left-10 w-64 h-64 bg-emerald-400 rounded-full blur-[80px]"></div>
        </div>

        <div className="relative z-10 flex md:block items-center justify-between">
          <div className="bg-white p-2 rounded-xl inline-block shadow-lg">
             {settings.companyLogo && !logoError ? (
                <img src={settings.companyLogo} alt="Logo" className="h-8 md:h-12 w-auto object-contain" onError={() => setLogoError(true)} />
             ) : (
                <div className="flex items-center gap-2 px-1">
                    <svg className="w-6 h-6 text-emerald-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="font-black text-emerald-950 text-base md:text-xl tracking-tight">SAFETYPRO</span>
                </div>
             )}
          </div>
          
          <div className="md:mt-8 text-right md:text-left">
            <h1 className="text-xl md:text-3xl font-black text-white leading-tight">
                {settings.companyName || 'SafetyCheck Pro'}
            </h1>
            <p className="text-emerald-400 font-bold uppercase tracking-widest text-[9px] mt-1 opacity-60">Operations Portal</p>
          </div>
        </div>

        <div className="relative z-10 mt-4 space-y-4">
            {/* SYSTEM STATUS INDICATOR - NANO SCALE & DYNAMIC POSITIONING */}
            <div className="flex items-center gap-2 animate-fadeIn">
                <div className={`w-[2px] h-3.5 rounded-full transition-all duration-500 
                    ${isLoading ? 'bg-blue-400 animate-pulse shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 
                      isUrlValid ? 'bg-emerald-500 shadow-sm' : 
                      'bg-red-500'}`}
                ></div>
                <div className="flex flex-col">
                    <span className={`text-[8px] font-black tracking-widest leading-none uppercase transition-colors 
                        ${isLoading ? 'text-blue-200' : isUrlValid ? 'text-white' : 'text-red-100'}`}
                    >
                        {isLoading ? 'Syncing System' : isUrlValid ? 'System Connected' : 'System Offline'}
                    </span>
                    <span className={`text-[6px] font-bold tracking-[0.15em] mt-0.5 uppercase transition-colors 
                        ${isLoading ? 'text-blue-400/80' : isUrlValid ? 'text-emerald-500/70' : 'text-red-400/60'}`}
                    >
                        {isLoading ? 'Accessing Data...' : isUrlValid ? 'Database Ready' : 'Connection Required'}
                    </span>
                </div>
            </div>

            <div className="hidden md:block border-t border-white/5 pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1 h-1 rounded-full bg-emerald-500/30"></div>
                  <span className="text-[8px] text-emerald-100/30 font-medium uppercase tracking-[0.2em]">© SCBC 2026</span>
                </div>
            </div>
        </div>
      </div>

      {/* LOGIN AREA */}
      <div className="flex-1 flex flex-col bg-white">
        <div className="flex-1 overflow-y-auto px-6 py-10 md:px-12 flex items-center justify-center">
          <div className="w-full max-w-sm mx-auto">
            
            {settings.maintenanceMode && (
              <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-100 flex items-start gap-3">
                <svg className="w-5 h-5 text-amber-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                <p className="text-[11px] text-amber-800 font-medium leading-tight">System restricted for maintenance. Only Admins may access.</p>
              </div>
            )}

            <div className="mb-8">
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                {isRegistering ? 'Admin Setup' : 'Login'}
              </h2>
              <p className="text-slate-400 text-sm mt-1 font-medium">
                {isRegistering ? 'Create the system owner account.' : 'Sign in to access your dashboard.'}
              </p>
            </div>

            {error && (
              <div className={`mb-6 p-4 rounded-lg text-xs font-medium flex items-center gap-3 border animate-fadeIn
                ${error.includes("created") ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-100'}`}>
                <span className="flex-1">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {isRegistering && (
                <div className="space-y-4 bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                  <div>
                      <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1.5 tracking-wider">Full Name</label>
                      <input type="text" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-base font-light transition-all" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Full Name" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1.5 tracking-wider">Position</label>
                      <input type="text" required className="w-full px-4 py-3 bg-white border border-slate-200 rounded-lg focus:border-emerald-500 outline-none text-base font-light transition-all" value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Fleet Manager" />
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1.5 tracking-wider ml-1">Username</label>
                  <input 
                    type="text" 
                    required 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 outline-none font-light text-base transition-all" 
                    value={username} 
                    onChange={e => setUsername(e.target.value)} 
                    placeholder="Username"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 uppercase mb-1.5 tracking-wider ml-1">Password</label>
                  <input 
                    type="password" 
                    required 
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:border-emerald-500 outline-none font-light text-base transition-all" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group select-none">
                      <div className="relative flex items-center">
                          <input 
                              type="checkbox" 
                              className="peer h-4 w-4 opacity-0 absolute cursor-pointer" 
                              checked={rememberMe}
                              onChange={e => setRememberMe(e.target.checked)}
                          />
                          <div className="h-4 w-4 bg-slate-100 border border-slate-300 rounded peer-checked:bg-emerald-600 peer-checked:border-emerald-600 transition-all flex items-center justify-center">
                              <svg className={`w-2.5 h-2.5 text-white transition-opacity ${rememberMe ? 'opacity-100' : 'opacity-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                              </svg>
                          </div>
                      </div>
                      <span className="text-xs text-slate-400 font-medium group-hover:text-slate-600 transition-colors">Remember credentials</span>
                  </label>
              </div>

              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isLoading || !isUrlValid} 
                  className={`w-full h-[56px] rounded-xl font-bold text-white shadow-lg transition-all text-sm uppercase tracking-widest active:scale-[0.98] flex items-center justify-center
                    ${!isUrlValid ? 'bg-slate-200 cursor-not-allowed text-slate-400 shadow-none' : isLoading ? 'bg-emerald-900 cursor-wait' : isRegistering ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-slate-900 hover:bg-black'}`}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-3">
                        <svg className="animate-spin h-5 w-5 text-emerald-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="normal-case font-medium tracking-normal text-emerald-100/80">Authenticating...</span>
                    </div>
                  ) : isRegistering ? 'Create Admin' : 'Sign In'}
                </button>
              </div>
            </form>

            <div className="mt-12 flex flex-col items-center select-none">
                <div className="h-px w-12 bg-slate-100 mb-4"></div>
                <p className="text-[9px] font-medium text-slate-300 uppercase tracking-[0.25em]">© 2026 SCBC Fleet Solutions</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
