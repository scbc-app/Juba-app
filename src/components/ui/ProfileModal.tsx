
import React, { useState } from 'react';
import { User, UserPreferences } from '../../types';
import { useNotifications } from '../../hooks/useNotifications';

interface ProfileModalProps {
    user: User;
    appScriptUrl: string;
    onClose: () => void;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    onUpdateSuccess: (newUser: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ user, appScriptUrl, onClose, showToast, onUpdateSuccess }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'notifications'>('profile');
    
    // Profile State
    const [name, setName] = useState(user.name);
    const [username, setUsername] = useState(user.username);
    const [password, setPassword] = useState('');
    
    // Notifications State
    const [preferences, setPreferences] = useState<UserPreferences>(user.preferences || {
        emailNotifications: false,
        notifyGeneral: true,
        notifyPetroleum: true,
        notifyPetroleumV2: true,
        notifyAcid: true
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Access notification hook logic solely for permission request
    const { requestPushPermission, pushEnabled } = useNotifications(appScriptUrl, user, showToast);

    // Only Admins can change Name and Username
    const canEditDetails = user.role === 'Admin';

    const handleToggle = (key: keyof UserPreferences) => {
        setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handlePushToggle = async () => {
        if (!pushEnabled) {
            const success = await requestPushPermission();
            if (success) showToast("Device alerts enabled successfully!", "success");
        } else {
            showToast("To disable device alerts, please reset permissions in your browser settings.", "info");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const response = await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_user',
                    originalUsername: user.username, // Key to find record
                    username: username, // New value
                    name: name,
                    password: password || undefined, // Only send if changed
                    // Preserve existing role/position since this is a self-update
                    role: user.role,
                    position: user.position,
                    preferences: preferences // Send new preferences
                })
            });
            const result = await response.json();

            if (result.status === 'success') {
                showToast("Account settings updated successfully!", 'success');
                onUpdateSuccess({
                    ...user,
                    name,
                    username,
                    position: user.position,
                    preferences
                });
                onClose();
            } else {
                showToast(result.message || "Failed to update profile.", 'error');
            }
        } catch (e) {
            console.error(e);
            showToast("Connection failed.", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-slate-800">Account Settings</h3>
                        <p className="text-xs text-slate-500">Manage your profile and preferences</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                    <button 
                        onClick={() => setActiveTab('profile')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                           ${activeTab === 'profile' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        Profile Details
                    </button>
                    <button 
                         onClick={() => setActiveTab('notifications')}
                        className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors flex items-center justify-center gap-2
                           ${activeTab === 'notifications' ? 'border-blue-600 text-blue-600 bg-blue-50/50' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                        `}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                        Notifications
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        
                        {/* PROFILE TAB */}
                        {activeTab === 'profile' && (
                            <div className="space-y-4 animate-fadeIn">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Full Name</label>
                                    <input 
                                        type="text" 
                                        required 
                                        readOnly={!canEditDetails}
                                        className={`w-full p-3 border rounded-lg outline-none transition font-medium
                                            ${!canEditDetails ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500'}
                                        `}
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">Username</label>
                                    <input 
                                        type="text" 
                                        required 
                                        readOnly={!canEditDetails}
                                        className={`w-full p-3 border rounded-lg outline-none transition font-medium
                                            ${!canEditDetails ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-gray-50 border-gray-200 focus:ring-2 focus:ring-blue-500'}
                                        `}
                                        value={username}
                                        onChange={e => setUsername(e.target.value)}
                                    />
                                    {!canEditDetails && (
                                        <p className="text-[10px] text-gray-400">Contact Admin to change username.</p>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">New Password</label>
                                    <input 
                                        type="password" 
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition font-medium placeholder-gray-400"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        placeholder="Leave blank to keep current"
                                    />
                                </div>

                                <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-xs border border-blue-100 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold uppercase tracking-wide opacity-70">Role</div>
                                        <div className="text-sm font-black">{user.role}</div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold uppercase tracking-wide opacity-70">Position</div>
                                        <div className="text-sm font-black">{user.position || 'N/A'}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* NOTIFICATIONS TAB */}
                        {activeTab === 'notifications' && (
                            <div className="space-y-6 animate-fadeIn">
                                {/* Device Alerts Toggle */}
                                <div className={`flex items-center justify-between p-4 rounded-xl border ${pushEnabled ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200 shadow-sm'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${pushEnabled ? 'bg-green-200 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">Device Push Alerts</div>
                                            <div className="text-xs text-gray-500">{pushEnabled ? 'System alerts active' : 'Enable browser notifications'}</div>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={pushEnabled}
                                            onChange={handlePushToggle}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                    </label>
                                </div>

                                <div className="h-px bg-gray-200"></div>

                                {/* Email Settings */}
                                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border border-gray-100">
                                    <div>
                                        <div className="font-bold text-gray-900 text-sm">Email Summaries</div>
                                        <div className="text-xs text-gray-500">Receive reports via email</div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={preferences.emailNotifications}
                                            onChange={() => handleToggle('emailNotifications')}
                                        />
                                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                    </label>
                                </div>

                                {/* Granular Settings */}
                                <div className={`space-y-4 transition-opacity pl-2 ${!preferences.emailNotifications ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
                                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide pb-1">Email Types:</h4>
                                    
                                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
                                        <span className="text-sm font-medium text-gray-700">General Inspections</span>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                            checked={preferences.notifyGeneral}
                                            onChange={() => handleToggle('notifyGeneral')}
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
                                        <span className="text-sm font-medium text-gray-700">Petroleum Inspections</span>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-orange-600 rounded border-gray-300 focus:ring-orange-500"
                                            checked={preferences.notifyPetroleum}
                                            onChange={() => handleToggle('notifyPetroleum')}
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
                                        <span className="text-sm font-medium text-gray-700">Petroleum V2 Inspections</span>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                            checked={preferences.notifyPetroleumV2}
                                            onChange={() => handleToggle('notifyPetroleumV2')}
                                        />
                                    </label>

                                    <label className="flex items-center justify-between cursor-pointer p-2 hover:bg-gray-50 rounded-lg transition">
                                        <span className="text-sm font-medium text-gray-700">Acid Tanker Inspections</span>
                                        <input 
                                            type="checkbox" 
                                            className="w-5 h-5 text-purple-600 rounded border-gray-300 focus:ring-purple-500"
                                            checked={preferences.notifyAcid}
                                            onChange={() => handleToggle('notifyAcid')}
                                        />
                                    </label>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex gap-3 border-t border-gray-100 mt-2">
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="flex-1 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition text-sm"
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:bg-blue-400 text-sm"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProfileModal;
