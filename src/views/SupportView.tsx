
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { User, SystemSettings, SupportTicket, TicketComment, ValidationLists } from '../types';

interface SupportViewProps {
    appScriptUrl: string;
    currentUser: User | null;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
    settings?: SystemSettings;
    validationLists?: ValidationLists;
}

// --- EXTRACTED COMPONENTS ---

const TicketList: React.FC<{
    tickets: SupportTicket[];
    isLoading: boolean;
    onRefresh: () => void;
    onSelect: (t: SupportTicket) => void;
    isAdmin: boolean;
    filterStatus: 'ALL' | 'OPEN' | 'CLOSED';
}> = ({ tickets, isLoading, onRefresh, onSelect, isAdmin, filterStatus }) => {
    
    const filteredTickets = useMemo(() => {
        if (filterStatus === 'ALL') return tickets;
        if (filterStatus === 'OPEN') return tickets.filter(t => t.status === 'Open' || t.status === 'In Progress');
        if (filterStatus === 'CLOSED') return tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed');
        return tickets;
    }, [tickets, filterStatus]);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-h-[400px] flex flex-col">
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-slate-50">
                <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-700 text-sm">
                        {filterStatus === 'ALL' ? 'All Tickets' : filterStatus === 'OPEN' ? 'Open & In Progress' : 'Resolved & Closed'}
                    </h3>
                    <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-bold">{filteredTickets.length}</span>
                </div>
                <button 
                    onClick={onRefresh}
                    className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium"
                >
                    <svg className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh List
                </button>
            </div>
            
            {isLoading && filteredTickets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-gray-400">
                    <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-sm">Retrieving tickets...</p>
                </div>
            ) : filteredTickets.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <p className="text-gray-500 font-medium">No tickets found in this view.</p>
                    <p className="text-xs text-gray-400 mt-2 max-w-xs">Change the filter or create a new ticket.</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-100 overflow-y-auto max-h-[500px]">
                    {filteredTickets.map(ticket => (
                        <div 
                            key={ticket.ticketId} 
                            onClick={() => onSelect(ticket)}
                            className="p-4 hover:bg-slate-50 cursor-pointer transition flex items-center justify-between group"
                        >
                            <div className="min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border 
                                        ${ticket.status === 'Open' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                          ticket.status === 'Resolved' ? 'bg-green-50 text-green-600 border-green-100' :
                                          ticket.status === 'Closed' ? 'bg-gray-100 text-gray-600 border-gray-200' :
                                          'bg-amber-50 text-amber-600 border-amber-100'}`}>
                                        {ticket.status}
                                    </span>
                                    <span className="text-xs font-mono text-gray-400">#{ticket.ticketId}</span>
                                    <span className="text-xs text-gray-400">• {new Date(ticket.timestamp).toLocaleDateString()}</span>
                                    {ticket.assignedTo && isAdmin && (
                                        <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-600 border border-slate-200">
                                            Assigned: {ticket.assignedTo}
                                        </span>
                                    )}
                                </div>
                                <h4 className="font-bold text-gray-800 text-sm truncate">{ticket.subject}</h4>
                                <p className="text-xs text-gray-500 truncate mt-0.5">{ticket.description}</p>
                            </div>
                            <div className="text-gray-300 group-hover:text-blue-500 transition-colors">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

const TicketDetail: React.FC<{
    ticket: SupportTicket;
    currentUser: User | null;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    onClose: () => void;
    onStatusChange: (s: string) => void;
    onReassign: (agent: string) => void;
    onReply: (msg: string) => void;
    isSendingReply: boolean;
    agents: string[];
}> = ({ ticket, currentUser, isAdmin, isSuperAdmin, onClose, onStatusChange, onReassign, onReply, isSendingReply, agents }) => {
    const [replyText, setReplyText] = useState('');
    const [assignAgent, setAssignAgent] = useState('');
    const [isAssigning, setIsAssigning] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const statusColors: any = { 'Open': 'bg-blue-500', 'In Progress': 'bg-amber-500', 'Resolved': 'bg-green-500', 'Closed': 'bg-gray-500' };

    // Scroll to bottom on mount and updates
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [ticket.comments]);

    const handleSend = () => {
        if(!replyText.trim()) return;
        onReply(replyText);
        setReplyText('');
    };

    const handleAgentReassign = async () => {
        if(!assignAgent) return;
        setIsAssigning(true);
        await onReassign(assignAgent);
        setIsAssigning(false);
        setAssignAgent('');
    };

    const lastComment = ticket.comments.length > 0 
        ? ticket.comments[ticket.comments.length - 1] 
        : null;
        
    const isClosed = ticket.status === 'Resolved' || ticket.status === 'Closed';
    const userCanReply = !isClosed && (isAdmin || (lastComment && (lastComment.role === 'Admin' || lastComment.role === 'SuperAdmin')));
    
    let replyPlaceholder = "Type a reply...";
    if (isClosed) replyPlaceholder = "Ticket is closed. No further replies allowed.";
    else if (!userCanReply && !isAdmin) replyPlaceholder = "Awaiting admin review...";

    return (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
            {/* Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0">
                <div>
                    <button onClick={onClose} className="text-xs font-bold text-gray-500 hover:text-gray-800 flex items-center gap-1 mb-2">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg> Back
                    </button>
                    <h3 className="font-bold text-lg text-gray-800 line-clamp-1">{ticket.subject}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-xs font-mono text-gray-400">#{ticket.ticketId}</span>
                        <span className={`w-2 h-2 rounded-full ${statusColors[ticket.status] || 'bg-gray-400'}`}></span>
                        <span className="text-xs text-gray-500">{ticket.status}</span>
                        {ticket.assignedTo && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded border border-indigo-100 ml-2">
                                Agent: {ticket.assignedTo}
                            </span>
                        )}
                    </div>
                </div>
                
                {isAdmin && (
                    <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex items-center gap-2">
                            <label className="text-[10px] font-bold text-gray-500 uppercase">Status</label>
                            <select 
                                value={ticket.status}
                                onChange={(e) => onStatusChange(e.target.value)}
                                className="text-xs border border-gray-300 rounded-lg px-2 py-1.5 bg-white font-medium outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-auto"
                            >
                                <option value="Open">Open</option>
                                <option value="In Progress">In Progress</option>
                                <option value="Resolved">Resolved</option>
                                <option value="Closed">Closed</option>
                            </select>
                        </div>
                        
                        {isSuperAdmin && (
                            <div className="flex items-center gap-2 mt-1 pt-2 border-t border-slate-200 w-full md:w-64">
                                <div className="relative flex-1">
                                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                    </div>
                                    <select
                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                                        value={assignAgent}
                                        onChange={(e) => setAssignAgent(e.target.value)}
                                    >
                                        <option value="">Reassign Agent...</option>
                                        {agents.map(name => (
                                            <option key={name} value={name}>{name}</option>
                                        ))}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                                        <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAgentReassign}
                                    disabled={isAssigning || !assignAgent}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white p-1.5 rounded-lg disabled:opacity-50 transition-colors shadow-sm shrink-0"
                                    title="Confirm Assignment"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50/50">
                {/* Original Request */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                {ticket.user.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-gray-700">{ticket.user}</span>
                            <span className="text-[10px] text-gray-400">{new Date(ticket.timestamp).toLocaleString()}</span>
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Original Request</span>
                    </div>
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    {ticket.attachment && (
                        <div className="mt-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Attachment</p>
                            <img src={ticket.attachment} alt="Attachment" className="max-h-48 rounded-lg border border-gray-200" />
                        </div>
                    )}
                </div>

                {/* Timeline */}
                {ticket.comments?.map((comment, idx) => {
                    const isMe = comment.user === currentUser?.name;
                    const isAdminComment = comment.role === 'Admin' || comment.role === 'SuperAdmin';
                    const displayName = isAdminComment ? 'Support Admin' : comment.user;
                    
                    return (
                        <div key={idx} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm shrink-0 mt-1
                                ${isAdminComment ? 'bg-indigo-600' : 'bg-slate-400'}`}>
                                {isAdminComment ? 'SA' : comment.user.charAt(0)}
                            </div>
                            <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-4 shadow-sm text-sm ${
                                isMe 
                                    ? 'bg-blue-600 text-white rounded-tr-none' 
                                    : 'bg-white border border-gray-100 text-gray-700 rounded-tl-none'
                            }`}>
                                <div className={`text-[10px] font-bold mb-1 opacity-70 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {displayName} • {new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </div>
                                <p className="leading-relaxed break-words">{comment.message}</p>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            <div className="p-4 bg-white border-t border-gray-200 shrink-0">
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        className={`flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition
                            ${isClosed || (!userCanReply && !isAdmin) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
                        `}
                        placeholder={replyPlaceholder}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isClosed && (userCanReply || isAdmin) && handleSend()}
                        disabled={isClosed || (!userCanReply && !isAdmin)}
                    />
                    <button 
                        onClick={handleSend}
                        disabled={isSendingReply || !replyText.trim() || isClosed || (!userCanReply && !isAdmin)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-6 py-2 font-bold transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
                    >
                        {isSendingReply ? '...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MAIN SUPPORT VIEW COMPONENT ---

const SupportView: React.FC<SupportViewProps> = ({ appScriptUrl, currentUser, showToast, settings, validationLists }) => {
    const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [ticketFilter, setTicketFilter] = useState<'ALL' | 'OPEN' | 'CLOSED'>('ALL');

    // Form State
    const [ticketType, setTicketType] = useState<'Issue' | 'Feature' | 'Other'>('Issue');
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Medium');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [attachment, setAttachment] = useState<string>('');

    // Data State
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [agents, setAgents] = useState<string[]>([]);
    const [isLoadingTickets, setIsLoadingTickets] = useState(false);
    const [isSendingReply, setIsSendingReply] = useState(false);

    const isAdmin = currentUser?.role === 'Admin' || currentUser?.role === 'SuperAdmin';
    const isSuperAdmin = currentUser?.role === 'SuperAdmin';

    // Stats
    const activeTickets = tickets.filter(t => t.status === 'Open' || t.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(t => t.status === 'Resolved' || t.status === 'Closed').length;

    // --- AUTO LOAD & CACHE LOGIC ---
    
    useEffect(() => {
        const cacheKey = `sc_support_tickets_${currentUser?.username}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
            try {
                const parsed = JSON.parse(cached);
                setTickets(parsed);
            } catch(e) {}
        }
        fetchTickets();
        
        if (isAdmin) {
            fetchAgents();
        }
    }, []);

    useEffect(() => {
        if (tickets.length > 0 && currentUser?.username) {
            const cacheKey = `sc_support_tickets_${currentUser?.username}`;
            localStorage.setItem(cacheKey, JSON.stringify(tickets));
        }
    }, [tickets, currentUser]);

    const fetchAgents = async () => {
        if (!appScriptUrl) return;
        try {
            const response = await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({ action: 'get_users' })
            });
            const result = await response.json();
            if (result.status === 'success' && result.users) {
                const agentList = result.users
                    .filter((u: any) => ['Admin', 'SuperAdmin', 'Inspector'].includes(u.role))
                    .map((u: any) => u.name)
                    .filter((n: string) => n);
                setAgents([...new Set(agentList)].sort() as string[]);
            }
        } catch(e) { console.error("Failed to fetch agents", e); }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAttachment(reader.result as string);
                showToast("Image attached", "info");
            };
            reader.readAsDataURL(file);
        }
    };

    const fetchTickets = async (retryCount = 0) => {
        if (!appScriptUrl || !currentUser) return;
        
        if (tickets.length === 0 && retryCount === 0) setIsLoadingTickets(true);
        
        try {
            const response = await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({ 
                    action: 'get_tickets',
                    email: currentUser.username.toLowerCase().trim(), 
                    role: currentUser.role
                })
            });
            const result = await response.json();
            
            if (result.status === 'success') {
                if (result.tickets) {
                    setTickets(result.tickets);
                }
            }
        } catch (e) {
            console.error("Ticket fetch failed", e);
        } finally {
            setIsLoadingTickets(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!appScriptUrl) {
            showToast("System offline. Please check settings.", "error");
            return;
        }
        
        setIsSubmitting(true);
        try {
            const payload = {
                action: 'submit_support_ticket',
                type: ticketType,
                subject,
                description,
                priority,
                user: currentUser?.name || 'Anonymous',
                email: (currentUser?.username || 'N/A').toLowerCase().trim(), 
                role: currentUser?.role || 'N/A',
                attachment: attachment
            };

            const response = await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();

            if (result.status === 'success') {
                showToast(`Ticket #${result.ticketId} created successfully.`, "success");
                const newTicket: SupportTicket = {
                    ticketId: result.ticketId,
                    type: ticketType,
                    subject: subject,
                    description: description,
                    priority: priority,
                    user: currentUser?.name || 'Me',
                    email: currentUser?.username || '',
                    role: currentUser?.role || 'User',
                    timestamp: new Date().toISOString(),
                    status: 'Open',
                    comments: [],
                    attachment: attachment
                };
                setTickets(prev => [newTicket, ...prev]);
                setSubject('');
                setDescription('');
                setPriority('Medium');
                setAttachment('');
                setTicketFilter('ALL');
                setActiveTab('list');
                setTimeout(() => fetchTickets(), 1000);
            } else {
                throw new Error(result.message || "Unknown error");
            }
        } catch (error) {
            showToast("Failed to submit ticket. Please check connection.", "error");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReply = async (message: string) => {
        if (!selectedTicket) return;
        setIsSendingReply(true);

        const newComment: TicketComment = {
            user: currentUser?.name || 'User',
            role: currentUser?.role || 'User',
            message: message,
            timestamp: new Date().toISOString()
        };

        try {
            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_ticket',
                    ticketId: selectedTicket.ticketId,
                    comment: newComment
                }),
                mode: 'no-cors'
            });

            const updatedTicket = {
                ...selectedTicket,
                comments: [...(selectedTicket.comments || []), newComment]
            };
            setSelectedTicket(updatedTicket);
            setTickets(prev => prev.map(t => t.ticketId === updatedTicket.ticketId ? updatedTicket : t));
        } catch (e) {
            showToast("Failed to send reply", "error");
        } finally {
            setIsSendingReply(false);
        }
    };

    const handleStatusChange = async (newStatus: any) => {
        if (!selectedTicket) return;
        try {
            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_ticket',
                    ticketId: selectedTicket.ticketId,
                    status: newStatus
                }),
                mode: 'no-cors'
            });
            
            const updatedTicket = { ...selectedTicket, status: newStatus };
            setSelectedTicket(updatedTicket);
            setTickets(prev => prev.map(t => t.ticketId === updatedTicket.ticketId ? updatedTicket : t));
            showToast(`Status updated to ${newStatus}`, "success");
        } catch(e) {
            showToast("Failed to update status", "error");
        }
    };

    const handleReassign = async (agent: string) => {
        if (!selectedTicket) return;
        try {
            await fetch(appScriptUrl, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'update_ticket',
                    ticketId: selectedTicket.ticketId,
                    assignedTo: agent
                }),
                mode: 'no-cors'
            });
            
            const updatedTicket = { ...selectedTicket, assignedTo: agent };
            setSelectedTicket(updatedTicket);
            setTickets(prev => prev.map(t => t.ticketId === updatedTicket.ticketId ? updatedTicket : t));
            showToast(`Ticket reassigned to ${agent}`, "success");
        } catch(e) {
            showToast("Failed to reassign ticket", "error");
        }
    };

    const handleProfessionalShare = async () => {
        const companyName = settings?.companyName || 'SafetyCheck Pro';
        const webUrl = settings?.webAppUrl || window.location.origin + window.location.pathname;
        const mobileUrl = settings?.mobileApkLink || 'Contact Admin for APK';
        
        const title = `Access ${companyName}`;
        const text = `System Access Details:\n\nWeb Portal: ${webUrl}\nMobile App: ${mobileUrl}\n\nDemo Credentials:\nUser: admin\nPass: 123456`;

        if (navigator.share) {
            try {
                await navigator.share({ title, text });
                showToast("Shared successfully!", "success");
            } catch (err) {}
        } else {
            navigator.clipboard.writeText(text).then(() => showToast("Copied details", "success"));
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn pb-12">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                        </div>
                        Help & Support Hub
                    </h2>
                    <p className="text-gray-500 text-sm mt-1 ml-14">Get assistance, track tickets, or share the system.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* LEFT: Ticket Area */}
                <div className="lg:col-span-2">
                    {/* Mode Toggle Tabs with Professional Counts & Filtering */}
                    <div className="flex bg-white p-1 rounded-xl border border-gray-200 shadow-sm mb-6 w-full md:w-auto self-start">
                        <button 
                            onClick={() => { setActiveTab('create'); setSelectedTicket(null); }}
                            className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'create' ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                            New Request
                        </button>
                        
                        {/* Interactive My Tickets Button Group */}
                        <div className={`flex items-center rounded-lg ml-1 border transition-colors ${activeTab === 'list' ? 'bg-indigo-50 border-indigo-100' : 'bg-white border-transparent'}`}>
                            <button 
                                onClick={() => { setActiveTab('list'); setTicketFilter('ALL'); fetchTickets(); }}
                                className={`px-4 py-3 text-sm font-bold transition-colors rounded-l-lg hover:text-indigo-700 flex items-center gap-2 ${activeTab === 'list' && ticketFilter === 'ALL' ? 'text-indigo-800' : 'text-gray-500'}`}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                                My Tickets
                            </button>
                            
                            {(activeTickets > 0 || resolvedTickets > 0) && (
                                <div className="flex items-center pr-2 gap-1 border-l border-indigo-200/50 pl-2 h-6">
                                    {activeTickets > 0 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveTab('list'); setTicketFilter('OPEN'); }}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105 ${ticketFilter === 'OPEN' && activeTab === 'list' ? 'bg-blue-600 text-white shadow-md' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}
                                        >
                                            {activeTickets} Open
                                        </button>
                                    )}
                                    {resolvedTickets > 0 && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setActiveTab('list'); setTicketFilter('CLOSED'); }}
                                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full transition-all hover:scale-105 ${ticketFilter === 'CLOSED' && activeTab === 'list' ? 'bg-gray-700 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                        >
                                            {resolvedTickets} Closed
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {activeTab === 'create' && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fadeIn">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-100">
                                <h3 className="font-bold text-gray-800 text-lg">Submit a Request</h3>
                                <p className="text-xs text-gray-500">Report a bug or request a new feature.</p>
                            </div>
                            <div className="p-6">
                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Request Type</label>
                                            <select 
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                                value={ticketType}
                                                onChange={(e) => setTicketType(e.target.value as any)}
                                            >
                                                <option value="Issue">Report an Issue (Bug)</option>
                                                <option value="Feature">Request a Feature</option>
                                                <option value="Other">Other Inquiry</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Priority</label>
                                            <select 
                                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium"
                                                value={priority}
                                                onChange={(e) => setPriority(e.target.value)}
                                            >
                                                <option value="Low">Low - Minor Tweak</option>
                                                <option value="Medium">Medium - Standard</option>
                                                <option value="High">High - Urgent</option>
                                                <option value="Critical">Critical - System Down</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Subject</label>
                                        <input 
                                            type="text" 
                                            required
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium placeholder-gray-400"
                                            placeholder="Brief summary of the issue or idea"
                                            value={subject}
                                            onChange={(e) => setSubject(e.target.value)}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Description</label>
                                        <textarea 
                                            required
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-medium placeholder-gray-400 h-32"
                                            placeholder="Please describe the details..."
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                        ></textarea>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Attachment (Image)</label>
                                        <div className="flex items-center gap-4">
                                            <label className="cursor-pointer bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 px-4 py-2 rounded-lg text-sm font-medium transition shadow-sm">
                                                Choose Image
                                                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                                            </label>
                                            {attachment && <span className="text-xs text-green-600 font-bold">Image Attached ✓</span>}
                                        </div>
                                    </div>

                                    <div className="flex justify-end">
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2
                                                ${isSubmitting ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105'}
                                            `}
                                        >
                                            {isSubmitting ? 'Sending...' : 'Submit Ticket'}
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {activeTab === 'list' && (
                        <div className="animate-fadeIn">
                            {selectedTicket ? (
                                <TicketDetail 
                                    ticket={selectedTicket} 
                                    currentUser={currentUser}
                                    isAdmin={isAdmin}
                                    isSuperAdmin={isSuperAdmin}
                                    onClose={() => setSelectedTicket(null)}
                                    onStatusChange={handleStatusChange}
                                    onReassign={handleReassign}
                                    onReply={handleReply}
                                    isSendingReply={isSendingReply}
                                    agents={agents}
                                />
                            ) : (
                                <TicketList 
                                    tickets={tickets} 
                                    isLoading={isLoadingTickets} 
                                    onRefresh={() => fetchTickets(0)} 
                                    onSelect={setSelectedTicket}
                                    isAdmin={isAdmin}
                                    filterStatus={ticketFilter}
                                />
                            )}
                        </div>
                    )}
                </div>

                {/* RIGHT: System Sharing & Info */}
                <div className="space-y-6">
                    {/* Share System Card */}
                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-lg p-6 text-white relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-16 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-white/10 transition-all"></div>
                        
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
                                <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                Share System Access
                            </h3>
                            
                            <button 
                                onClick={handleProfessionalShare}
                                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group-hover:scale-[1.02]"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                Share App & Login
                            </button>
                        </div>
                    </div>

                    {/* Quick FAQ / Status */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                            System Status
                        </h4>
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Database</span>
                                <span className="text-green-600 font-bold">Connected</span>
                            </div>
                            <div className="flex justify-between border-b border-gray-50 pb-2">
                                <span className="text-gray-500">Version</span>
                                <span className="text-gray-800 font-medium">2.4.7 (Fixed)</span>
                            </div>
                            <div className="flex justify-between pb-1">
                                <span className="text-gray-500">Support Hours</span>
                                <span className="text-gray-800 font-medium">08:00 - 17:00</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SupportView;
