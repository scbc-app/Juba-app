
import React from 'react';

interface SubmissionOverlayProps {
    status: 'idle' | 'submitting' | 'success' | 'offline_saved';
}

const SubmissionOverlay: React.FC<SubmissionOverlayProps> = ({ status }) => {
    if (status === 'idle') return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-all duration-300"></div>

            {/* Content Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transform transition-all duration-300 scale-100 animate-fadeIn border border-white/20">
                
                {status === 'submitting' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path></svg>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-gray-900">Submitting Inspection</h3>
                            <p className="text-sm text-gray-500 mt-1">Syncing data with Google Sheets...</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Success!</h3>
                            <p className="text-sm text-gray-500 mt-1">Inspection record saved securely.</p>
                            <p className="text-xs text-blue-500 mt-4 font-medium uppercase tracking-wide">Redirecting to Dashboard...</p>
                        </div>
                    </div>
                )}

                {status === 'offline_saved' && (
                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center shadow-inner">
                            <svg className="w-10 h-10 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Connection Unstable</h3>
                            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                                Don't worry, your data is safe! It has been stored on your device and will <strong>automatically upload</strong> when the connection improves.
                            </p>
                            <p className="text-xs text-amber-600 mt-4 font-medium uppercase tracking-wide">Returning to Dashboard...</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SubmissionOverlay;
