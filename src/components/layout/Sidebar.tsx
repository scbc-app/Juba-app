
import React, { useState, useEffect } from 'react';
import { SystemSettings, User, SubscriptionDetails } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeModule: string;
  onSelectModule: (m: string) => void;
  settings: SystemSettings;
  user?: User; 
  onLogout?: () => void;
  onEditProfile?: () => void; 
  onLockedItemClick?: (featureName: string) => void;
  subscription?: SubscriptionDetails | null;
  onRequestInspection?: () => void; // New prop for triggering request modal
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, activeModule, onSelectModule, settings, user, onLogout, onEditProfile, onLockedItemClick, subscription, onRequestInspection }) => {
    
    const roleStr = user?.role ? String(user.role).toLowerCase() : '';
    const isAdmin = roleStr === 'admin' || roleStr === 'superadmin';
    const isSuperAdmin = roleStr === 'superadmin';
    
    // Allow Ops, Maintenance, Admins, and Support Staff (Secretary, Other) to request inspections
    const canRequestInspection = isAdmin || ['operations', 'maintenance', 'secretary', 'other', 'clerk'].includes(roleStr);

    const [logoError, setLogoError] = useState(false);

    useEffect(() => {
        setLogoError(false);
    }, [settings.companyLogo]);

    const NavItem = ({ id, label, icon, subLabel, isLocked = false, isDanger = false, onClickCustom }: { id: string, label: string, icon: React.ReactNode, subLabel?: string, isLocked?: boolean, isDanger?: boolean, onClickCustom?: () => void }) => {
        const isActive = activeModule === id;
        const isProfile = id === 'profile'; 

        return (
            <button
                onClick={() => { 
                    if (onClickCustom) {
                        onClickCustom();
                        return;
                    }
                    if (isLocked && onLockedItemClick) {
                        onLockedItemClick(label);
                        onClose();
                    } else if (isProfile && onEditProfile) {
                        onEditProfile();
                        onClose();
                    } else {
                        onSelectModule(id); 
                        onClose(); 
                    }
                }}
                className={`w-full group relative flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 overflow-hidden
                    ${isActive 
                        ? (isDanger ? 'bg-red-600 text-white shadow-md' : 'bg-emerald-600 text-white shadow-md shadow-emerald-900/20')
                        : isLocked 
                            ? 'text-slate-500 cursor-not-allowed opacity-70 hover:bg-slate-800/50' 
                            : isDanger 
                                ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }
                `}
            >
                {isActive && (
                    <div className="absolute left-0 top-1 bottom-1 w-1 bg-white/40 rounded-r shadow-sm"></div>
                )}
                
                <span className={`relative z-10 transition-transform duration-300 shrink-0 ${isActive ? 'scale-105 text-white' : isLocked ? 'text-slate-600' : 'group-hover:text-white group-hover:scale-105'}`}>
                    {icon}
                </span>
                
                <div className="flex flex-col items-start relative z-10 text-left flex-1 min-w-0">
                    <div className="flex items-center justify-between w-full">
                        <span className={`text-sm font-semibold tracking-wide truncate leading-tight ${isActive ? 'text-white' : isLocked ? 'text-slate-500' : isDanger ? 'text-red-400 group-hover:text-red-200' : 'text-slate-300 group-hover:text-white'}`}>
                            {label}
                        </span>
                        {isLocked && (
                            <svg className="w-3 h-3 text-amber-600/60 ml-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                        )}
                    </div>
                    {subLabel && (
                        <span className={`text-[10px] leading-none mt-0.5 ${isActive ? 'text-emerald-100' : 'text-slate-500 group-hover:text-slate-400'}`}>
                            {subLabel}
                        </span>
                    )}
                </div>
            </button>
        );
    };

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    className="fixed inset-0 z-[55] bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity cursor-pointer"
                    onClick={onClose}
                ></div>
            )}

            <aside className={`fixed inset-y-0 left-0 z-[60] w-64 bg-slate-900 text-white transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 border-r border-slate-800 flex flex-col shadow-2xl`}>
                 {/* Header - Compact but Readable */}
                 <div className="px-4 py-4 border-b border-slate-800 bg-black/20 shrink-0">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <div id="sidebar-toggle" className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-emerald-900 shadow-lg shrink-0 overflow-hidden p-1">
                                {settings.companyLogo && !logoError ? (
                                    <img 
                                        src={settings.companyLogo} 
                                        alt="Logo" 
                                        className="w-full h-full object-contain" 
                                        onError={() => setLogoError(true)}
                                    />
                                ) : (
                                    <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 01 1v5m-4 0h4"></path></svg>
                                )}
                            </div>
                            <div className="min-w-0 flex flex-col justify-center">
                                <h1 className="text-sm font-black tracking-tight text-white leading-tight truncate">
                                    {settings.companyName || 'SafetyPro'}
                                </h1>
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest truncate block mt-0.5">
                                    System Active
                                </span>
                            </div>
                            <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white ml-auto p-1">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </button>
                        </div>
                </div>
                
                {/* Navigation - Professional Spacing */}
                <div className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-1">
                     <NavItem 
                        id="overview" 
                        label="Dashboard" 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>} 
                     />

                     <div className="my-2 mx-2 border-t border-slate-800/40" />
                     
                     <NavItem 
                        id="general" 
                        label="General" 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 012-2v0a2 2 0 012 2m9 0a2 2 0 012-2v0a2 2 0 012 2"></path></svg>} 
                     />
                     <NavItem 
                        id="petroleum" 
                        label="Petroleum V1" 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>} 
                     />
                     <NavItem 
                        id="petroleum_v2" 
                        label="Petroleum V2" 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>} 
                     />
                     <NavItem 
                        id="acid" 
                        label="Acid" 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>} 
                     />

                     {canRequestInspection && (
                        <>
                            <div className="my-2 mx-2 border-t border-slate-800/40" />
                            <NavItem 
                                id="request_inspection" 
                                label="Request Inspection" 
                                onClickCustom={() => { onRequestInspection?.(); onClose(); }}
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>} 
                            />
                            <NavItem 
                                id="track_requests" 
                                label="Track Requests" 
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>} 
                            />
                        </>
                     )}

                     <div className="my-2 mx-2 border-t border-slate-800/40" />

                     {/* CONSOLIDATED ENTERPRISE MODULES */}
                     <NavItem 
                        id="enterprise_suite" 
                        label="Enterprise Suite" 
                        subLabel="Fleet, Lashing, Stores..."
                        isLocked={true}
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>} 
                     />

                     <div className="my-2 mx-2 border-t border-slate-800/40" />

                     {/* Admin / Profile / Support */}
                     {isAdmin ? (
                        <>
                            {isSuperAdmin && (
                                <NavItem 
                                    id="maintenance" 
                                    label="Console" 
                                    isDanger={true}
                                    icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path></svg>}
                                />
                            )}
                            <NavItem 
                                id="settings" 
                                label="System" 
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>} 
                            />
                            <NavItem 
                                id="users" 
                                label="Users" 
                                icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} 
                            />
                        </>
                     ) : (
                        <NavItem 
                            id="profile" 
                            label="Profile" 
                            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>} 
                        />
                     )}

                    <NavItem 
                        id="support" 
                        label="Help & Support" 
                        icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>} 
                    />
                </div>

                {/* BOTTOM FIXED SECTION: Widget + Footer */}
                <div className="shrink-0 bg-slate-900 z-10 border-t border-slate-800">
                    {/* SUBSCRIPTION WIDGET */}
                    {subscription && (
                        <div className="px-3 py-3">
                            <div className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
                                subscription.status === 'Active' 
                                    ? 'bg-slate-800/40 border-slate-800' 
                                    : 'bg-red-900/10 border-red-900/30'
                            }`}>
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                                        subscription.status === 'Active' 
                                            ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' 
                                            : 'bg-red-500 animate-pulse'
                                    }`} />
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider truncate leading-none">
                                            {subscription.plan}
                                        </span>
                                        <span className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                                            {subscription.daysRemaining > 0 
                                                ? <span className={subscription.daysRemaining <= 7 ? 'text-amber-400' : ''}>{subscription.daysRemaining} Days</span>
                                                : <span className="text-red-400">Expired</span>
                                            }
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Footer Actions: Profile & Logout */}
                    <div className="p-3 bg-black/20">
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-800 border border-slate-700 hover:bg-slate-700 transition-colors group">
                            
                            {/* User Info */}
                            <div className="flex-1 flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-xs font-bold text-white shadow-md shrink-0 border border-emerald-800 group-hover:border-emerald-500 transition-colors">
                                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'OP'}
                                </div>
                                <div className="min-w-0">
                                    <div className="text-sm font-bold text-white truncate leading-tight group-hover:text-emerald-300 transition-colors">
                                        {user?.name || 'User'}
                                    </div>
                                    <div className="text-xs text-slate-400 truncate leading-tight">
                                        {user?.role || 'User'}
                                    </div>
                                </div>
                            </div>

                            {/* Actions Control Panel */}
                            <div className="flex items-center border-l border-slate-600 pl-2 ml-1 space-x-1">
                                <button
                                    onClick={onLogout}
                                    className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-all"
                                    title="Sign Out"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H5a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
