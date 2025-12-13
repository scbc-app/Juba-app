
import React, { useEffect, useState } from 'react';
import { User } from '../types';

interface RequestTrackingViewProps {
    appScriptUrl: string;
    currentUser: User | null;
    showToast: (msg: string, type: 'success' | 'error' | 'info') => void;
}

interface RequestItem {
    id: string;
    requester: string;
    truck: string;
    trailer: string;
    type: string;
    reason: string;
    priority: string;
    assignedTo: string;
    status: string;
    timestamp: string;
}

const RequestTrackingView: React.FC<RequestTrackingViewProps> = ({ appScriptUrl, currentUser, showToast }) => {
    const [requests, setRequests] = useState<RequestItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        fetchRequests();
    }, [currentUser, appScriptUrl]);

    const fetchRequests = async () => {
        if (!appScriptUrl || !currentUser) return;
        setIsLoading(true);
        try {
            const response = await fetch(`${appScriptUrl}?t=${new Date().getTime()}`);
            const json = await response.json();
            
            const reqSheet = json['Inspection_Requests'];
            if (reqSheet && Array.isArray(reqSheet) && reqSheet.length > 1) {
                // Headers: Request_ID, Requester, Role, Truck_No, Trailer_No, Type, Reason, Priority, Assigned_Inspector, Status, Timestamp
                const myRequests = reqSheet.slice(1)
                    .map((row: any[]) => ({
                        id: row[0],
                        requester: row[1],
                        truck: row[3],
                        trailer: row[4],
                        type: row[5],
                        reason: row[6],
                        priority: row[7],
                        assignedTo: row[8],
                        status: row[9] || 'Pending',
                        timestamp: row[10]
                    }))
                    .filter((req: RequestItem) => {
                        // Filter for current user's requests. If Admin, show all.
                        if (currentUser.role === 'Admin' || currentUser.role === 'SuperAdmin') return true;
                        return String(req.requester).toLowerCase() === String(currentUser.name).toLowerCase();
                    })
                    .sort((a: RequestItem, b: RequestItem) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

                setRequests(myRequests);
            } else {
                setRequests([]);
            }
        } catch (error) {
            console.error("Failed to fetch requests", error);
            showToast("Failed to load requests.", 'error');
        } finally {
            setIsLoading(false);
        }
    };

    const pendingCount = requests.filter(r => r.status === 'Pending').length;
    const completedCount = requests.filter(r => r.status === 'Completed').length;
    const completionRate = requests.length > 0 ? Math.round((completedCount / requests.length) * 100) : 0;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h2 className="text-3xl font-black text-gray-800 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                        </div>
                        Track Requests
                    </h2>
                    <p className="text-gray-500 font-medium mt-1">Monitor the status of your vehicle inspection requests.</p>
                </div>
                <button 
                    onClick={fetchRequests} 
                    className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition shadow-sm"
                >
                    <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    Refresh Status
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending</p>
                        <h3 className="text-3xl font-black text-amber-500">{pendingCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Completed</p>
                        <h3 className="text-3xl font-black text-emerald-600">{completedCount}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Fulfilment Rate</p>
                        <h3 className="text-3xl font-black text-indigo-600">{completionRate}%</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                    </div>
                </div>
            </div>

            {/* Request List */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {isLoading ? (
                    <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                        <p>Updating status...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="p-16 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
                        </div>
                        <h3 className="text-gray-800 font-bold mb-1">No Requests Found</h3>
                        <p className="text-sm text-gray-500">You haven't submitted any inspection requests yet.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Vehicle</th>
                                    <th className="px-6 py-4">Type & Priority</th>
                                    <th className="px-6 py-4">Inspector</th>
                                    <th className="px-6 py-4 text-right">Date Requested</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4">
                                            {req.status === 'Completed' ? (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200">
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                                    Completed
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 animate-pulse">
                                                    <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                                                    Pending
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-800">{req.truck}</div>
                                            <div className="text-xs text-gray-500">{req.trailer || 'No Trailer'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-xs font-bold text-gray-700">{req.type}</div>
                                            <div className={`text-[10px] font-bold uppercase mt-1 ${
                                                req.priority === 'Critical' || req.priority === 'Urgent' ? 'text-red-600' : 'text-gray-400'
                                            }`}>
                                                {req.priority}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {req.assignedTo && req.assignedTo !== 'Unassigned' ? (
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-600">
                                                        {req.assignedTo.charAt(0)}
                                                    </div>
                                                    <span className="text-gray-600">{req.assignedTo}</span>
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic text-xs">Pending Assignment</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right text-gray-500 font-mono text-xs">
                                            {new Date(req.timestamp).toLocaleDateString()}
                                            <div className="text-[10px] opacity-60">{new Date(req.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default RequestTrackingView;
