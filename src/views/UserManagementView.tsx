
import React, { useState, useEffect } from 'react';
import { User, ValidationLists, SystemSettings } from '../types';
import AutocompleteInput from '../components/ui/AutocompleteInput';

interface UserManagementViewProps {
    currentUser: User;
    appScriptUrl: string;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    validationLists: ValidationLists;
    settings?: SystemSettings;
}

const UserManagementView: React.FC<UserManagementViewProps> = ({ currentUser, appScriptUrl, showToast, validationLists, settings }) => {
    // User type extended with password for sharing logic
    const [users, setUsers] = useState<(User & {password?: string})[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // View State: 'list' or 'form'
    const [viewMode, setViewMode] = useState<'list' | 'form'>('list');
    const [isEditing, setIsEditing] = useState(false);
    const [originalUsername, setOriginalUsername] = useState('');
    
    // Form State
    const [formData, setFormData] = useState<{
        name: string;
        username: string;
        password: string;
        role: 'SuperAdmin' | 'Admin' | 'Inspector' | 'Operations' | 'Maintenance' | 'Other' | 'Secretary';
        position: string;
    }>({
        name: '',
        username: '',
        password: '',
        role: 'Inspector',
        position: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Only SuperAdmin can create other SuperAdmins
    const isSuperAdmin = currentUser.role === 'SuperAdmin';

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        if (!appScriptUrl) return;
        setIsLoading(true);
        try {
            const response = await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_users' })
            });
            const result = await response.json();
            if (result.status === 'success' && Array.isArray(result.users)) {
                let fetchedUsers = result.users;
                
                // SECURITY: Hide SuperAdmins from regular Admins
                if (!isSuperAdmin) {
                    fetchedUsers = fetchedUsers.filter((u: User) => u.role !== 'SuperAdmin');
                }
                
                setUsers(fetchedUsers);
            }
        } catch (e) {
            console.error(e);
            showToast("Failed to load users", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = async (username: string) => {
        if (!window.confirm(`Are you sure you want to remove user "${username}"?`)) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'delete_user', username })
            });
            const result = await response.json();
            if (result.status === 'success') {
                showToast("User removed successfully", 'success');
                fetchUsers();
            } else {
                showToast(result.message || "Failed to delete user", 'error');
            }
        } catch (e) {
            showToast("Connection failed", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (user: User) => {
        setFormData({
            name: user.name,
            username: user.username,
            role: user.role as any,
            position: user.position || '',
            password: '' // Leave empty for edit
        });
        setOriginalUsername(user.username);
        setIsEditing(true);
        setViewMode('form');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.name || !formData.username) {
            showToast("Please fill in required fields.", 'error');
            return;
        }

        if (!isEditing && !formData.password) {
             showToast("Password is required for new users.", 'error');
             return;
        }

        setIsSubmitting(true);
        
        try {
            // Find current user's existing preferences to preserve them, OR set default
            const existingUser = users.find(u => u.username === originalUsername);
            let prefs = existingUser?.preferences || {
                emailNotifications: true,
                notifyGeneral: true,
                notifyPetroleum: true,
                notifyPetroleumV2: true,
                notifyAcid: true,
                mustChangePassword: false
            };

            // If creating new user, OR changing password for existing user, force password change on next login
            if (!isEditing || (formData.password && formData.password.trim() !== '')) {
                prefs = { ...prefs, mustChangePassword: true };
            }

            const payload: any = {
                action: isEditing ? 'update_user' : 'register_user',
                ...formData,
                preferences: prefs
            };
            
            if (isEditing) {
                payload.originalUsername = originalUsername;
            }

            const response = await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                const msg = isEditing 
                    ? (formData.password ? "User updated. They must change password on next login." : "User updated successfully")
                    : "User created. They must change password on first login.";
                
                showToast(msg, 'success');
                setViewMode('list');
                setFormData({ name: '', username: '', password: '', role: 'Inspector', position: '' });
                setIsEditing(false);
                fetchUsers();
            } else {
                showToast(result.message || "Operation failed", 'error');
            }
        } catch (e) {
            showToast("Connection failed", 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Robust Fallback Copy Mechanism
    const fallbackCopyTextToClipboard = (text: string) => {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        
        // Avoid scrolling to bottom
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        try {
            const successful = document.execCommand('copy');
            if (successful) {
                showToast("Details copied to clipboard (Fallback)", 'success');
            } else {
                showToast("Unable to copy details. Please copy manually.", 'error');
            }
        } catch (err) {
            showToast("Unable to copy details. Please copy manually.", 'error');
        }

        document.body.removeChild(textArea);
    };

    const handleShareUser = async (user: User & {password?: string}) => {
        const companyName = settings?.companyName || 'SafetyCheck Pro';
        const webUrl = settings?.webAppUrl || window.location.origin + window.location.pathname;
        const apkUrl = settings?.mobileApkLink || 'Contact Admin for APK';

        const title = "System Access Credentials";
        const text = `
${companyName.toUpperCase()} - ACCESS CREDENTIALS
----------------------------------
Here are your login details for the digital inspection system.

Name: ${user.name}
Role: ${user.role}
${user.position ? `Position: ${user.position}` : ''}

LOGIN DETAILS:
Username: ${user.username}
Password: ${user.password || '****'} (Change on first login)

ACCESS LINKS:
💻 Web Portal:
${webUrl}

📱 Android App:
${apkUrl}

Please keep these credentials secure.
----------------------------------
`.trim();

        if (navigator.share) {
            try {
                // Pass text ONLY to ensure consistent behavior across platforms (avoiding URL-only shares)
                await navigator.share({
                    title: title,
                    text: text
                });
                showToast("Credentials shared successfully via System", 'success');
            } catch (err) {
                // User cancelled or API failed
                // Attempt Clipboard Fallback
                try {
                    await navigator.clipboard.writeText(text);
                    showToast("Share cancelled. Details copied to clipboard.", 'info');
                } catch (clipboardErr) {
                    fallbackCopyTextToClipboard(text);
                }
            }
        } else {
            // Fallback for browsers without share support
            try {
                await navigator.clipboard.writeText(text);
                showToast("Credentials copied to clipboard!", 'success');
            } catch (err) {
                fallbackCopyTextToClipboard(text);
            }
        }
    };

    // Access Control: Must be Admin or SuperAdmin
    const canManage = currentUser.role && (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin');

    if (!canManage) {
        return <div className="p-8 text-center text-red-600 font-bold">Access Denied. Admin Privileges Required.</div>;
    }

    // --- FORM VIEW (CREATE & EDIT) ---
    if (viewMode === 'form') {
        return (
            <div className="max-w-lg mx-auto animate-fadeIn py-4 px-2 sm:px-0">
                <button 
                    onClick={() => setViewMode('list')}
                    className="mb-4 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors text-xs font-bold uppercase tracking-wider"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to List
                </button>

                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                    <div className="bg-slate-50 px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight">
                            {isEditing ? 'Edit User Details' : 'Create New User'}
                        </h2>
                        <div className="w-8 h-8 bg-white rounded-lg shadow-sm flex items-center justify-center text-blue-600 border border-gray-100">
                             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                    </div>

                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            
                            {/* Full Name */}
                            <div className="space-y-1">
                                <AutocompleteInput
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={v => setFormData({...formData, name: v})}
                                    options={validationLists.inspectors} 
                                    isTitleCase={true}
                                    placeholder="e.g. John Doe"
                                />
                            </div>

                            {/* Position & Role (Side-by-Side) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <AutocompleteInput
                                        label="Position"
                                        value={formData.position}
                                        onChange={v => setFormData({...formData, position: v})}
                                        options={validationLists.positions} 
                                        isTitleCase={true}
                                        placeholder="Job Title"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">System Role</label>
                                        {!isSuperAdmin && (
                                            <span className="text-[9px] text-amber-600 font-medium flex items-center gap-1 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-100">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                                                Restricted
                                            </span>
                                        )}
                                    </div>
                                    <select 
                                        className="w-full p-3.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-sm font-medium transition-colors text-gray-800"
                                        value={formData.role}
                                        onChange={e => setFormData({...formData, role: e.target.value as any})}
                                    >
                                        <option value="Inspector">Inspector</option>
                                        <option value="Operations">Operations</option>
                                        <option value="Maintenance">Maintenance</option>
                                        <option value="Secretary">Secretary</option>
                                        <option value="Other">Other</option>
                                        <option value="Admin">Admin</option>
                                        {isSuperAdmin && <option value="SuperAdmin">SuperAdmin</option>}
                                    </select>
                                </div>
                            </div>

                            {/* Username & Password (Side-by-Side) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">Username</label>
                                    <input 
                                        type="text" required 
                                        className="w-full p-3.5 border rounded-lg outline-none font-medium transition-all text-sm bg-gray-50 border-gray-200 text-gray-800 focus:ring-2 focus:ring-blue-500"
                                        value={formData.username}
                                        onChange={e => setFormData({...formData, username: e.target.value})}
                                        placeholder="jdoe"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wide">
                                        Password {isEditing && <span className="text-gray-400 font-normal normal-case">(Optional)</span>}
                                    </label>
                                    <input 
                                        type="password" 
                                        required={!isEditing}
                                        className="w-full p-3.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-gray-50 text-gray-800 placeholder-gray-400 font-medium transition-all text-sm"
                                        value={formData.password}
                                        onChange={e => setFormData({...formData, password: e.target.value})}
                                        placeholder={isEditing ? "Leave blank to keep current" : "••••"}
                                    />
                                </div>
                            </div>
                            
                            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100 flex items-start gap-2">
                                <svg className="w-4 h-4 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                <p className="text-[10px] text-amber-800">
                                    Setting a password will prompt the user to change it upon their next login for security.
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setViewMode('list')}
                                    className="flex-1 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition text-sm"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:bg-blue-400 text-sm flex items-center justify-center gap-2"
                                >
                                    {isSubmitting ? 'Saving...' : isEditing ? 'Update User' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // --- LIST VIEW ---
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                    <span className="p-2 bg-purple-100 text-purple-700 rounded-lg">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                    </span>
                    User Management
                </h2>
                <div className="flex gap-3 w-full sm:w-auto">
                     <button 
                        onClick={fetchUsers} 
                        className="flex-1 sm:flex-none justify-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                        <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Refresh
                    </button>
                    <button 
                        onClick={() => {
                            setFormData({ name: '', username: '', password: '', role: 'Inspector', position: '' });
                            setIsEditing(false);
                            setViewMode('form');
                        }}
                        className="flex-1 sm:flex-none justify-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md flex items-center gap-2 transition"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        Add User
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-3">Name / Position</th>
                                <th className="px-4 py-3">Username</th>
                                <th className="px-4 py-3">Role</th>
                                <th className="px-4 py-3">Last Login</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.length === 0 ? (
                                <tr><td colSpan={5} className="p-8 text-center text-gray-500">{isLoading ? 'Loading users...' : 'No users found.'}</td></tr>
                            ) : (
                                users.map((u, i) => (
                                    <tr key={i} className="hover:bg-gray-50">
                                        <td className="px-4 py-3">
                                            <div className="font-bold text-gray-900">{u.name}</div>
                                            <div className="text-xs text-gray-500">{u.position}</div>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-gray-600">{u.username}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded text-xs font-bold 
                                                ${u.role === 'SuperAdmin' ? 'bg-black text-white' : 
                                                  u.role === 'Admin' ? 'bg-purple-100 text-purple-700' : 
                                                  u.role === 'Operations' ? 'bg-blue-100 text-blue-700' :
                                                  u.role === 'Maintenance' ? 'bg-orange-100 text-orange-700' :
                                                  u.role === 'Secretary' ? 'bg-indigo-100 text-indigo-700' :
                                                  u.role === 'Other' ? 'bg-gray-100 text-gray-700' :
                                                  'bg-green-100 text-green-700'}`}>
                                                {u.role}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 text-xs">
                                            {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            {u.username !== currentUser.username && (
                                                <div className="flex justify-end gap-2">
                                                    {/* Native Share - Increased Hit Area */}
                                                    <button 
                                                        onClick={() => handleShareUser(u)}
                                                        title="Share Access Credentials & Links"
                                                        className="p-2 text-indigo-600 hover:bg-indigo-50 rounded border border-transparent hover:border-indigo-200 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                                    </button>

                                                    {/* Edit */}
                                                    <button 
                                                        onClick={() => handleEdit(u)}
                                                        title="Edit User"
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded border border-transparent hover:border-blue-200 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                                    </button>

                                                    {/* Delete */}
                                                    <button 
                                                        onClick={() => handleDelete(u.username)}
                                                        title="Delete User"
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded border border-transparent hover:border-red-200 transition-colors"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UserManagementView;
