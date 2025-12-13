
import React from 'react';
import { InspectionData } from '../types';
import DashboardTemplate from '../components/dashboard/DashboardTemplate';

interface AcidDashboardProps {
    stats: { total: number, passRate: number | string };
    startNewInspection: () => void;
    fetchHistory: () => void;
    isLoadingHistory: boolean;
    historyList: InspectionData[];
    onViewReport: (item: InspectionData) => void;
    onPrint: (item: InspectionData) => void;
    userRole?: string;
}

const AcidDashboard: React.FC<AcidDashboardProps> = (props) => {
    return (
        <DashboardTemplate 
            {...props}
            title="Acid Tanker Inspection"
            description="Specialized safety checks for acid tankers, spill kits, and hazardous material compliance."
            icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 2l-5.5 9h11z"/><path d="M10 13v6h4v-6z"/></svg>}
            colorTheme="purple"
            titlePrefix="ACID TANKER INSPECTION"
        />
    );
}

export default AcidDashboard;
