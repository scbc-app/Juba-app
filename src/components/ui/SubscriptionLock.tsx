import React from 'react';

interface SubscriptionLockProps {
    isLocked: boolean;
    children: React.ReactNode;
    isSuperAdmin?: boolean; // New prop to check role
    onUnlock?: () => void; // Handler to go to settings
}

const SubscriptionLock: React.FC<SubscriptionLockProps> = ({ isLocked, children, isSuperAdmin, onUnlock }) => {
    return (
        <div className="relative min-h-[500px]">
            {/* Content */}
            <div className={`transition-all duration-500 ${isLocked ? 'blur-md opacity-30 pointer-events-none select-none' : ''}`}>
                {children}
            </div>

            {/* Lock Overlay */}
            {isLocked && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
                    <div className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center transform scale-100 animate-fadeIn">
                        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        </div>
                        
                        <h2 className="text-2xl font-black text-slate-800 mb-2">System Locked</h2>
                        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                            The subscription for this system has expired. Access is restricted to maintenance mode.
                        </p>

                        <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6">
                            <p className="text-xs font-bold text-red-800 uppercase tracking-wide">Contact Administrator</p>
                            <p className="text-xs text-red-600 mt-1">Please renew your license to restore full access.</p>
                        </div>

                        {isSuperAdmin ? (
                            <button 
                                onClick={onUnlock}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                Access Management Console
                            </button>
                        ) : (
                            <p className="text-[10px] text-gray-400">
                                Super Admins can still access System Settings.
                            </p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SubscriptionLock;