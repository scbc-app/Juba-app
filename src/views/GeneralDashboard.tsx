
import React from 'react';
import { InspectionData } from '../types';
import DashboardTemplate from '../components/dashboard/DashboardTemplate';

interface GeneralDashboardProps {
    stats: { total: number, passRate: number | string };
    startNewInspection: () => void;
    fetchHistory: () => void;
    isLoadingHistory: boolean;
    historyList: InspectionData[];
    onViewReport: (item: InspectionData) => void;
    onPrint: (item: InspectionData) => void;
    userRole?: string;
}

const GeneralDashboard: React.FC<GeneralDashboardProps> = (props) => {
    return (
        <DashboardTemplate 
            {...props}
            title="General Inspection"
            description="Manage standard vehicle safety checks, driver documentation, and exterior condition reports."
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
            colorTheme="emerald"
            titlePrefix="VEHICLE INSPECTION"
        />
    );
}

export default GeneralDashboard;
