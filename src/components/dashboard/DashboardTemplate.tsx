
import React, { useState, useMemo } from 'react';
import { InspectionData } from '../../types';
import SubscriptionLock from '../ui/SubscriptionLock';

interface DashboardTemplateProps {
    title: string;
    description: string;
    icon: React.ReactNode;
    colorTheme: 'emerald' | 'orange' | 'rose' | 'purple' | 'blue';
    stats: { total: number, passRate: number | string };
    startNewInspection: () => void;
    fetchHistory: () => void;
    isLoadingHistory: boolean;
    historyList: InspectionData[];
    onViewReport: (item: InspectionData) => void;
    onPrint: (item: InspectionData) => void;
    userRole?: string;
    titlePrefix?: string; // e.g. "PETROLEUM" used in summaries
}

const DashboardTemplate: React.FC<DashboardTemplateProps> = ({ 
    title, description, icon, colorTheme, stats, 
    startNewInspection, fetchHistory, isLoadingHistory, historyList, 
    onViewReport, onPrint, userRole, titlePrefix = "INSPECTION"
}) => {
    const [searchTerm, setSearchTerm] = useState('');

    const displayList = useMemo(() => {
        let list = historyList;
        if (searchTerm.trim()) {
            const lowerSearch = searchTerm.toLowerCase();
            list = list.filter(item => 
                (item.truckNo && item.truckNo.toLowerCase().includes(lowerSearch)) ||
                (item.driverName && item.driverName.toLowerCase().includes(lowerSearch)) ||
                (item.inspectedBy && item.inspectedBy.toLowerCase().includes(lowerSearch))
            );
        } else {
            list = list.slice(0, 10);
        }
        return list;
    }, [historyList, searchTerm]);

    const getSummaryText = (item: InspectionData) => {
        const isPass = Number(item.rate) >= 4;
        const statusIcon = isPass ? '🟢' : Number(item.rate) === 3 ? '🟡' : '🔴';
        const statusText = isPass ? 'PASSED' : Number(item.rate) === 3 ? 'WARNING' : 'CRITICAL FAIL';
        
        return `${titlePrefix} SUMMARY\n\n` +
               `Vehicle: ${item.truckNo}\n` +
               `Trailer: ${item.trailerNo || 'N/A'}\n` +
               `Date: ${new Date(item.timestamp).toLocaleDateString()} ${new Date(item.timestamp).toLocaleTimeString()}\n` +
               `Inspector: ${item.inspectedBy}\n\n` +
               `STATUS: ${statusIcon} ${statusText}\n` +
               `Safety Rating: ${item.rate}/5\n\n` +
               `Remarks:\n${item.remarks || 'None'}\n\n` +
               `Generated via SafetyCheck Pro`;
    };

    const handleShareReport = async (item: InspectionData) => {
        const shareData = {
            title: `${title}: ${item.truckNo}`,
            text: getSummaryText(item)
        };
        try {
            if (navigator.share) {
                await navigator.share(shareData);
            } else {
                await navigator.clipboard.writeText(shareData.text);
                alert("Report summary copied to clipboard.");
            }
        } catch (err) {
            console.error('Error sharing:', err);
        }
    };

    const handleEmailReport = (item: InspectionData) => {
        const subject = `${title}: ${item.truckNo}`;
        const body = getSummaryText(item);
        window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
    };

    const isLocked = (window as any).isSubscriptionLocked || false;
    const canCreate = (userRole === 'Admin' || userRole === 'Inspector' || userRole === 'SuperAdmin') && !isLocked;

    // Theme Class Generators
    const getThemeClasses = () => {
        switch(colorTheme) {
            case 'orange': return { 
                bgLight: 'bg-orange-50', bgIcon: 'bg-orange-100', textIcon: 'text-orange-700', 
                border: 'border-orange-100', hoverBg: 'group-hover:bg-orange-100',
                btnBg: 'bg-orange-600', btnHover: 'hover:bg-orange-700', btnShadow: 'shadow-orange-200', textLink: 'text-orange-600',
                statText: 'text-orange-800', statScore: 'text-orange-600', focusRing: 'focus:ring-orange-500'
            };
            case 'rose': return { 
                bgLight: 'bg-rose-50', bgIcon: 'bg-rose-100', textIcon: 'text-rose-700', 
                border: 'border-rose-100', hoverBg: 'group-hover:bg-rose-100',
                btnBg: 'bg-rose-600', btnHover: 'hover:bg-rose-700', btnShadow: 'shadow-rose-200', textLink: 'text-rose-600',
                statText: 'text-rose-800', statScore: 'text-rose-600', focusRing: 'focus:ring-rose-500'
            };
            case 'purple': return { 
                bgLight: 'bg-purple-50', bgIcon: 'bg-purple-100', textIcon: 'text-purple-700', 
                border: 'border-purple-100', hoverBg: 'group-hover:bg-purple-100',
                btnBg: 'bg-purple-600', btnHover: 'hover:bg-purple-700', btnShadow: 'shadow-purple-200', textLink: 'text-purple-600',
                statText: 'text-purple-800', statScore: 'text-purple-600', focusRing: 'focus:ring-purple-500'
            };
            default: return { 
                bgLight: 'bg-emerald-50', bgIcon: 'bg-emerald-100', textIcon: 'text-emerald-700', 
                border: 'border-emerald-100', hoverBg: 'group-hover:bg-emerald-100',
                btnBg: 'bg-emerald-600', btnHover: 'hover:bg-emerald-700', btnShadow: 'shadow-emerald-200', textLink: 'text-emerald-600',
                statText: 'text-emerald-800', statScore: 'text-emerald-600', focusRing: 'focus:ring-emerald-500'
            };
        }
    };
    const theme = getThemeClasses();

    return (
      <SubscriptionLock isLocked={isLocked}>
      <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
          {/* Header Card */}
          <div className={`bg-white rounded-2xl p-8 shadow-sm border ${theme.border} relative overflow-hidden group`}>
               <div className={`absolute top-0 right-0 w-64 h-64 ${theme.bgLight} rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 ${theme.hoverBg} transition-colors`}></div>
               
               <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                   <div>
                       <div className="flex items-center gap-3 mb-2">
                           <div className={`p-2 ${theme.bgIcon} ${theme.textIcon} rounded-lg`}>
                               {icon}
                           </div>
                           <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
                       </div>
                       <p className="text-gray-500 text-sm max-w-lg mb-6">{description}</p>
                       
                       <div className="flex flex-wrap gap-4">
                           {canCreate && (
                               <button 
                                 id="start-inspection-btn"
                                 onClick={startNewInspection}
                                 className={`px-6 py-3 ${theme.btnBg} ${theme.btnHover} text-white font-bold rounded-xl shadow-lg ${theme.btnShadow} transition transform hover:scale-105 active:scale-95 flex items-center gap-2`}
                               >
                                   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                                   Start New Inspection
                               </button>
                           )}
                           <button 
                             onClick={fetchHistory}
                             className={`px-6 py-3 bg-white border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 hover:${theme.textLink} transition flex items-center gap-2`}
                           >
                               <svg className={`w-5 h-5 ${isLoadingHistory ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                               Refresh Data
                           </button>
                       </div>
                   </div>
                   
                   <div className="flex gap-4">
                       <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center min-w-[110px]">
                           <div className={`text-3xl font-black ${theme.statText}`}>{stats.total}</div>
                           <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mt-1">Total Inspections</div>
                       </div>
                       <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 text-center min-w-[110px]">
                           <div className={`text-3xl font-black ${theme.statScore}`}>{stats.passRate}%</div>
                           <div className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mt-1">Safety Score</div>
                       </div>
                   </div>
               </div>
          </div>

          {/* Assigned Tasks Banner - Universal feature */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-xl p-4 flex items-start gap-4 shadow-sm animate-fadeIn">
              <div className="bg-blue-100 text-blue-600 p-2 rounded-lg shrink-0">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
              </div>
              <div className="flex-1">
                  <h4 className="font-bold text-blue-900 text-sm">Assigned Tasks</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                      Check your <strong>Notification Bell</strong> (top right) for assigned requests. 
                      Clicking a request notification will automatically start the form for that vehicle.
                  </p>
              </div>
          </div>
          
          {/* List Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50/50">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      Inspection History
                      {!searchTerm && <span className="text-xs bg-white border border-gray-200 text-gray-400 px-2 py-0.5 rounded-md font-normal">Last 10</span>}
                  </h3>
                  
                  <div className="relative w-full md:w-72">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                      </div>
                      <input 
                          type="text" 
                          placeholder="Search Truck, Driver or Inspector..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className={`w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:ring-2 ${theme.focusRing} focus:border-transparent outline-none transition-all shadow-sm`}
                      />
                  </div>
              </div>

              {isLoadingHistory ? (
                  <div className="py-16 text-center text-gray-400 flex flex-col items-center">
                      <div className={`w-8 h-8 border-4 border-gray-200 border-t-${colorTheme}-500 rounded-full animate-spin mb-4`}></div>
                      <p>Loading records...</p>
                  </div>
              ) : displayList.length === 0 ? (
                  <div className="py-16 text-center">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                      </div>
                      <div className="text-gray-400 mb-2 font-medium">No inspections found</div>
                      <p className="text-sm text-gray-400 max-w-xs mx-auto">{searchTerm ? 'Try a different search term.' : 'Inspections submitted will appear here.'}</p>
                  </div>
              ) : (
                  <div className="divide-y divide-gray-100">
                      {displayList.map((item, i) => (
                          <div key={i} className="flex flex-col md:flex-row justify-between items-center p-5 hover:bg-slate-50 transition-colors gap-4 group cursor-default">
                              <div className="flex items-center gap-5 w-full md:w-auto">
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black text-white shadow-sm shrink-0
                                      ${Number(item.rate) >= 4 ? 'bg-emerald-500' : Number(item.rate) === 3 ? 'bg-amber-500' : 'bg-red-500'}
                                  `}>
                                      {item.rate}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                      <div className="flex flex-wrap items-center gap-2 mb-1">
                                          <span className="font-bold text-gray-800 text-base">{item.truckNo}</span>
                                          {item.trailerNo && (
                                              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 tracking-wide">
                                                  {item.trailerNo}
                                              </span>
                                          )}
                                      </div>
                                      <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3">
                                          <div className="flex items-center gap-1.5" title="Date of Inspection">
                                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                                              <span className="font-medium tabular-nums">{new Date(item.timestamp).toLocaleDateString()}</span>
                                          </div>
                                          <div className="flex items-center gap-1.5" title="Time of Inspection">
                                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                              <span className="font-medium tabular-nums">{new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                          </div>
                                          <div className="hidden sm:block w-px h-3 bg-gray-300 mx-1"></div>
                                          <div className="flex items-center gap-1.5 text-gray-600">
                                              <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                                              <span className="font-medium truncate max-w-[120px]">{item.inspectedBy}</span>
                                          </div>
                                      </div>
                                  </div>
                              </div>

                              <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                                  <button 
                                    onClick={() => onViewReport(item)}
                                    title="View & Download Report"
                                    className="px-4 py-2 text-xs font-bold text-slate-600 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-all shadow-sm flex items-center gap-2"
                                  >
                                      <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                                      View Report
                                  </button>

                                  <button 
                                    onClick={() => handleEmailReport(item)}
                                    title="Email Report"
                                    className="p-2 text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors"
                                  >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                                  </button>

                                  <button 
                                    onClick={() => handleShareReport(item)}
                                    title="Share Report Summary"
                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition-colors"
                                  >
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              )}
          </div>
      </div>
      </SubscriptionLock>
    );
};

export default DashboardTemplate;
