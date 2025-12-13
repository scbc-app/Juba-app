
import React, { useState } from 'react';
import { User } from '../../types';

interface OnboardingWizardProps {
    user: User;
    appScriptUrl: string;
    onComplete: (updatedUser: User) => void;
}

const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ user, appScriptUrl, onComplete }) => {
    const [step, setStep] = useState(1); // 1: Password, 2: Notifications, 3: Success
    const [isLoading, setIsLoading] = useState(false);
    
    // Password State
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [pwdError, setPwdError] = useState('');

    // Notification State
    const [prefs, setPrefs] = useState({
        notifyGeneral: true,
        notifyPetroleum: true,
        notifyPetroleumV2: true,
        notifyAcid: true,
        emailNotifications: true
    });

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword.length < 4) { setPwdError("Minimum 4 characters required."); return; }
        if (newPassword !== confirmPassword) { setPwdError("Passwords do not match."); return; }
        
        setIsLoading(true);
        try {
            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_user',
                    originalUsername: user.username,
                    password: newPassword,
                    preferences: { ...user.preferences, mustChangePassword: false }
                }),
                mode: 'no-cors'
            });
            setTimeout(() => {
                setStep(2);
                setIsLoading(false);
            }, 1000);
        } catch (err) {
            setPwdError("Connection failed. Try again.");
            setIsLoading(false);
        }
    };

    const handleNotificationSubmit = async () => {
        setIsLoading(true);
        try {
            const newPreferences = { 
                ...user.preferences, 
                ...prefs,
                mustChangePassword: false, 
                isEmailVerified: true // Mark as configured
            };

            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_user',
                    originalUsername: user.username,
                    preferences: newPreferences
                }),
                mode: 'no-cors'
            });
            
            // Update local user state immediately for the final step
            user.preferences = newPreferences;
            setStep(3);
        } catch(e) {
            // Proceed even if sync fails visually
            setStep(3);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFinish = () => {
        onComplete({
            ...user,
            preferences: { 
                ...user.preferences,
                hasCompletedTour: false // Trigger tour next
            }
        });
    };

    const togglePref = (key: keyof typeof prefs) => {
        setPrefs(p => ({ ...p, [key]: !p[key] }));
    };

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 flex items-center justify-center p-4 animate-fadeIn">
            <div className="max-w-4xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px]">
                
                {/* Left Side: Visuals */}
                <div className="md:w-5/12 bg-slate-800 p-8 flex flex-col justify-between text-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-indigo-900 to-slate-900 opacity-90"></div>
                    <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl"></div>
                    
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-indigo-900/50">
                            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                        </div>
                        <h1 className="text-2xl font-bold mb-2">Account Setup</h1>
                        <p className="text-slate-300 text-sm leading-relaxed">Complete these steps to secure your account and configure your inspection workspace.</p>
                    </div>

                    <div className="relative z-10 space-y-6">
                        <div className={`flex items-center gap-4 transition-opacity duration-300 ${step >= 1 ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > 1 ? 'bg-green-500 border-green-500 text-white' : 'border-slate-400 text-slate-300'} font-bold text-sm`}>
                                {step > 1 ? '✓' : '1'}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Security</span>
                                <span className="text-xs text-slate-400">Change Password</span>
                            </div>
                        </div>
                        
                        <div className={`flex items-center gap-4 transition-opacity duration-300 ${step >= 2 ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step > 2 ? 'bg-green-500 border-green-500 text-white' : 'border-slate-400 text-slate-300'} font-bold text-sm`}>
                                {step > 2 ? '✓' : '2'}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Notifications</span>
                                <span className="text-xs text-slate-400">Email Activation</span>
                            </div>
                        </div>

                        <div className={`flex items-center gap-4 transition-opacity duration-300 ${step >= 3 ? 'opacity-100' : 'opacity-40'}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'bg-white border-white text-slate-900' : 'border-slate-400 text-slate-300'} font-bold text-sm`}>3</div>
                            <div className="flex flex-col">
                                <span className="font-bold text-sm">Completion</span>
                                <span className="text-xs text-slate-400">Ready to go</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Forms */}
                <div className="md:w-7/12 p-8 md:p-12 bg-white relative overflow-y-auto">
                    
                    {/* STEP 1: PASSWORD */}
                    {step === 1 && (
                        <div className="h-full flex flex-col justify-center animate-fadeIn">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Secure Your Account</h2>
                            <p className="text-slate-500 text-sm mb-8">Please set a new, permanent password to continue.</p>
                            
                            <form onSubmit={handlePasswordSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-slate-800"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        autoFocus
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Confirm Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-slate-800"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                    />
                                </div>
                                
                                {pwdError && (
                                    <div className="text-red-600 text-xs font-bold bg-red-50 p-3 rounded-lg flex items-center gap-2 border border-red-100">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        {pwdError}
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={isLoading}
                                    className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:bg-indigo-300"
                                >
                                    {isLoading ? 'Saving...' : 'Set Password'}
                                </button>
                            </form>
                        </div>
                    )}

                    {/* STEP 2: NOTIFICATIONS */}
                    {step === 2 && (
                        <div className="h-full flex flex-col justify-center animate-fadeIn">
                            <h2 className="text-2xl font-bold text-slate-800 mb-2">Notification Preferences</h2>
                            <p className="text-slate-500 text-sm mb-6">Activate email alerts for the specific inspections relevant to your role.</p>
                            
                            <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 mb-6 flex items-center gap-3">
                                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-indigo-900 uppercase">Alert Destination</p>
                                    <p className="text-sm font-medium text-slate-700 truncate">{user.username}</p>
                                </div>
                            </div>

                            <div className="space-y-3 mb-8">
                                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${prefs.notifyGeneral ? 'bg-blue-50 border-blue-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prefs.notifyGeneral ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                        </div>
                                        <span className={`text-sm font-bold ${prefs.notifyGeneral ? 'text-blue-900' : 'text-slate-500'}`}>General Inspections</span>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" checked={prefs.notifyGeneral} onChange={() => togglePref('notifyGeneral')} />
                                </label>

                                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${prefs.notifyPetroleum ? 'bg-orange-50 border-orange-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prefs.notifyPetroleum ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                        </div>
                                        <span className={`text-sm font-bold ${prefs.notifyPetroleum ? 'text-orange-900' : 'text-slate-500'}`}>Petroleum Tanker V1</span>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" checked={prefs.notifyPetroleum} onChange={() => togglePref('notifyPetroleum')} />
                                </label>

                                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${prefs.notifyPetroleumV2 ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prefs.notifyPetroleumV2 ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                                        </div>
                                        <span className={`text-sm font-bold ${prefs.notifyPetroleumV2 ? 'text-red-900' : 'text-slate-500'}`}>Petroleum Tanker V2</span>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5 text-red-600 rounded focus:ring-red-500" checked={prefs.notifyPetroleumV2} onChange={() => togglePref('notifyPetroleumV2')} />
                                </label>

                                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${prefs.notifyAcid ? 'bg-purple-50 border-purple-200' : 'bg-white border-slate-200'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${prefs.notifyAcid ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                                        </div>
                                        <span className={`text-sm font-bold ${prefs.notifyAcid ? 'text-purple-900' : 'text-slate-500'}`}>Acid Tanker</span>
                                    </div>
                                    <input type="checkbox" className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500" checked={prefs.notifyAcid} onChange={() => togglePref('notifyAcid')} />
                                </label>
                            </div>

                            <button 
                                onClick={handleNotificationSubmit}
                                disabled={isLoading}
                                className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
                            >
                                {isLoading ? 'Activating...' : 'Activate Selected Notifications'}
                            </button>
                        </div>
                    )}

                    {/* STEP 3: DONE */}
                    {step === 3 && (
                        <div className="h-full flex flex-col justify-center items-center text-center animate-fadeIn">
                            <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6 shadow-sm border border-green-100">
                                <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                            </div>
                            <h2 className="text-3xl font-black text-slate-800 mb-2">You're All Set!</h2>
                            <p className="text-slate-500 text-sm mb-8 max-w-sm leading-relaxed">
                                Your account is secure and notifications are active. We'll now give you a quick tour of the features.
                            </p>
                            
                            {/* Help & Support Pointer */}
                            <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-8 w-full max-w-sm text-left flex items-start gap-4">
                                <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700 shrink-0">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-indigo-900">Need Assistance?</h4>
                                    <p className="text-xs text-indigo-700 mt-1">
                                        If you ever need help or want to report an issue, use the <strong>Help & Support</strong> tab in the main menu.
                                    </p>
                                </div>
                            </div>
                            
                            <button 
                                onClick={handleFinish}
                                className="w-full max-w-xs py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"
                            >
                                Start System Tour
                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path></svg>
                            </button>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default OnboardingWizard;
