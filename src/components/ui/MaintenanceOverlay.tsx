
import React from 'react';

interface MaintenanceOverlayProps {
    isActive: boolean;
    message: string;
    onLogout?: () => void;
}

const MaintenanceOverlay: React.FC<MaintenanceOverlayProps> = ({ isActive, message, onLogout }) => {
    if (!isActive) return null;

    return (
        <div className="fixed inset-0 z-[200] bg-slate-900/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center animate-fadeIn select-none">
            {/* Visual Indicator */}
            <div className="relative mb-10">
                <div className="w-28 h-28 bg-gradient-to-br from-slate-800 to-slate-900 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(245,158,11,0.2)] border border-slate-700">
                    <div className="absolute inset-0 rounded-full border border-amber-500/20 animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]"></div>
                    <svg className="w-14 h-14 text-amber-500 relative z-10 drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                </div>
            </div>
            
            {/* Main Message */}
            <h1 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                System Under Maintenance
            </h1>
            
            {/* Detail Box */}
            <div className="max-w-lg w-full bg-slate-800/50 backdrop-blur-md border border-slate-700/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 opacity-50"></div>
                
                <p className="text-lg text-slate-300 font-medium leading-relaxed font-light">
                    {message || "We are currently performing scheduled maintenance to improve system performance and security. Access is temporarily restricted."}
                </p>

                <div className="mt-8 flex flex-col items-center justify-center gap-4">
                    <div className="text-slate-500 text-xs font-mono flex items-center gap-2 bg-slate-900/50 px-4 py-2 rounded-full border border-slate-800">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.6)]"></span>
                        Status: Lockdown Active
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className="mt-12 flex gap-4">
                <button 
                    onClick={() => window.location.reload()}
                    className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold text-sm transition-all border border-slate-700 hover:border-slate-600 flex items-center gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Check Status
                </button>

                {onLogout && (
                    <button 
                        onClick={onLogout}
                        className="px-6 py-3 bg-transparent hover:bg-white/5 text-slate-400 hover:text-white rounded-xl font-bold text-sm transition-all border border-transparent hover:border-white/10 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        Sign Out
                    </button>
                )}
            </div>

            <p className="mt-8 text-slate-600 text-xs font-medium max-w-xs mx-auto">
                Please try again later. If this persists, contact your System Administrator.
            </p>
        </div>
    );
};

export default MaintenanceOverlay;
