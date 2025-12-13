
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { AppNotification } from '../../types';

interface NotificationCenterProps {
    notifications: AppNotification[];
    onMarkAsRead: (id: string) => void;
    onDismiss: (id: string) => void;
    onClearAll: () => void;
    onAcknowledge?: (id: string) => void; 
    canAcknowledge?: boolean;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
    notifications, 
    onMarkAsRead, 
    onDismiss, 
    onClearAll,
    onAcknowledge,
    canAcknowledge = false
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'critical'>('all');
    const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Smart Calculations
    const unreadCount = notifications.filter(n => !n.read).length;
    const criticalCount = notifications.filter(n => !n.read && n.type === 'critical').length;

    // Filter Logic
    const filteredNotifications = useMemo(() => {
        let filtered = [...notifications];
        
        if (activeFilter === 'unread') {
            filtered = filtered.filter(n => !n.read);
        } else if (activeFilter === 'critical') {
            filtered = filtered.filter(n => n.type === 'critical');
        }

        // Sort: Critical Unread First, Then Date
        return filtered.sort((a, b) => {
            if (a.type === 'critical' && !a.read && (b.type !== 'critical' || b.read)) return -1;
            if (b.type === 'critical' && !b.read && (a.type !== 'critical' || a.read)) return 1;
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });
    }, [notifications, activeFilter]);

    // Intelligent Time Formatter
    const getRelativeTime = (isoString: string) => {
        const date = new Date(isoString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 172800) return 'Yesterday';
        return date.toLocaleDateString();
    };

    const getIcon = (type: string) => {
        switch(type) {
            case 'critical': 
                return (
                    <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 shadow-sm border border-red-200">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    </div>
                );
            case 'warning':
                return (
                    <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0 shadow-sm border border-amber-200">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                );
            case 'success':
                return (
                    <div className="w-9 h-9 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0 shadow-sm border border-green-200">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                );
            default:
                return (
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-sm border border-blue-200">
                         <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                );
        }
    };

    const handleAcknowledgeClick = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        if (onAcknowledge) {
            setAcknowledgingId(id);
            onAcknowledge(id);
        }
    };

    const handleStartInspection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        onMarkAsRead(id);
    };

    return (
        <div className="relative" ref={wrapperRef}>
            {/* Bell Icon Trigger */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className={`relative p-2 transition-colors rounded-full transition-all duration-300
                    ${isOpen ? 'bg-blue-800 text-white' : 'text-blue-200 hover:text-white hover:bg-blue-800'}
                `}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4">
                        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${criticalCount > 0 ? 'bg-red-400' : 'bg-blue-400'}`}></span>
                        <span className={`relative inline-flex rounded-full h-4 w-4 text-[9px] font-bold text-white items-center justify-center ${criticalCount > 0 ? 'bg-red-500' : 'bg-blue-500'}`}>
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    </span>
                )}
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-2xl shadow-2xl ring-1 ring-black ring-opacity-5 z-[100] overflow-hidden animate-fadeIn origin-top-right">
                    
                    {/* Header with Stats */}
                    <div className="px-5 py-4 bg-white border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-gray-800 text-lg">Notifications</h3>
                            {criticalCount > 0 && (
                                <p className="text-xs text-red-600 font-bold mt-0.5 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                                    {criticalCount} Critical Issues Found
                                </p>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <button 
                                onClick={onClearAll}
                                className="text-xs font-bold text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
                            >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                Dismiss All
                            </button>
                        )}
                    </div>

                    {/* Intelligent Filters */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50">
                        <button 
                            onClick={() => setActiveFilter('all')}
                            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${activeFilter === 'all' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            All
                        </button>
                        <button 
                            onClick={() => setActiveFilter('unread')}
                            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${activeFilter === 'unread' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Unread
                        </button>
                        <button 
                            onClick={() => setActiveFilter('critical')}
                            className={`flex-1 py-2.5 text-xs font-bold text-center border-b-2 transition-colors ${activeFilter === 'critical' ? 'border-red-500 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                        >
                            Critical
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-[60vh] overflow-y-auto bg-gray-50">
                        {filteredNotifications.length === 0 ? (
                            <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                                    <svg className="w-8 h-8 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                                <p className="text-sm font-medium text-gray-600">You're all caught up!</p>
                                <p className="text-xs text-gray-400 mt-1">No {activeFilter === 'all' ? 'new' : activeFilter} notifications.</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {filteredNotifications.map(n => (
                                    <div 
                                        key={n.id} 
                                        className={`p-4 transition-all relative group cursor-pointer 
                                            ${!n.read ? 'bg-white hover:bg-blue-50/30' : 'bg-gray-50 hover:bg-gray-100'}
                                            ${n.type === 'critical' && !n.read ? 'border-l-4 border-red-500 pl-3' : 'border-l-4 border-transparent pl-3'}
                                        `}
                                        onClick={() => onMarkAsRead(n.id)}
                                    >
                                        <div className="flex gap-3">
                                            {getIcon(n.type)}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h4 className={`text-sm font-bold truncate pr-6 ${n.type === 'critical' ? 'text-red-700' : !n.read ? 'text-gray-900' : 'text-gray-600'}`}>
                                                        {n.title}
                                                    </h4>
                                                    <span className="text-[10px] text-gray-400 whitespace-nowrap font-medium">
                                                        {getRelativeTime(n.timestamp)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs leading-relaxed mb-1.5 line-clamp-2 ${!n.read ? 'text-gray-700' : 'text-gray-500'}`}>
                                                    {n.message}
                                                </p>
                                                <div className="flex items-center gap-2">
                                                    {n.module && (
                                                        <span className="inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-200 text-slate-600">
                                                            {n.module}
                                                        </span>
                                                    )}
                                                    {!n.read && (
                                                        <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">NEW</span>
                                                    )}
                                                </div>
                                                
                                                {/* Start Inspection Action Button */}
                                                {n.actionLink && n.actionLink.startsWith('request:start_inspection') && (
                                                    <div className="mt-3 flex items-center justify-start">
                                                        <button 
                                                            onClick={(e) => handleStartInspection(e, n.id)}
                                                            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-md active:scale-95 w-full justify-center sm:w-auto"
                                                        >
                                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                                            Start Inspection
                                                        </button>
                                                    </div>
                                                )}

                                                {/* Intelligent Acknowledge Action - Only for Critical/Warning */}
                                                {(n.type === 'critical' || n.type === 'warning') && canAcknowledge && onAcknowledge && !n.actionLink?.startsWith('request:') && (
                                                    <div className="mt-3 flex items-center justify-start">
                                                        <button 
                                                            onClick={(e) => handleAcknowledgeClick(e, n.id)}
                                                            disabled={acknowledgingId === n.id}
                                                            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                                                                ${acknowledgingId === n.id ? 'bg-gray-100 text-gray-400' : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 shadow-sm'}
                                                            `}
                                                        >
                                                            {acknowledgingId === n.id ? (
                                                                <>
                                                                    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                                    Resolving...
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                                    Acknowledge & Resolve
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        {/* Hover Actions (Dismiss - Local Only) */}
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }}
                                            className="absolute top-2 right-2 p-1.5 text-gray-300 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                            title="Dismiss locally"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationCenter;
