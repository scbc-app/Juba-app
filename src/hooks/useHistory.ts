
import { useState, useMemo } from 'react';
import { InspectionData, ValidationLists, User } from '../types';
import { CACHE_TTL, SHEET_HEADERS, PETROLEUM_HEADERS, PETROLEUM_V2_HEADERS, ACID_HEADERS } from '../constants';

export const useHistory = (appScriptUrl: string, activeModule: string, currentUser: User | null) => {
    const [historyList, setHistoryList] = useState<InspectionData[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [isBackgroundFetching, setIsBackgroundFetching] = useState(false);
    
    const [validationLists, setValidationLists] = useState<ValidationLists>({
        trucks: [],
        trailers: [],
        drivers: [],
        inspectors: [],
        locations: [],
        positions: []
    });

    const fetchHistory = async (forceRefresh = false) => {
        if (!appScriptUrl || typeof appScriptUrl !== 'string' || !appScriptUrl.startsWith('http')) return;
        
        // Cache is now isolated per user to prevent data leaks on shared devices
        const userPrefix = currentUser ? `${currentUser.username}_` : 'anon_';
        const cacheKey = `sc_history_${userPrefix}${activeModule}`;
        
        const cachedData = localStorage.getItem(cacheKey);
        let hasCachedData = false;

        if (cachedData && !forceRefresh) {
            try {
                const parsed = JSON.parse(cachedData);
                if (parsed.data && Array.isArray(parsed.data)) {
                    setHistoryList(parsed.data);
                    hasCachedData = true;
                    const cachedLists = localStorage.getItem('sc_validation_lists');
                    if (cachedLists) setValidationLists(JSON.parse(cachedLists));
                    if (Date.now() - parsed.timestamp < CACHE_TTL) {
                        setIsLoadingHistory(false);
                        return; 
                    }
                }
            } catch (e) {
                console.error("Cache parsing error", e);
            }
        }

        if (!hasCachedData) setIsLoadingHistory(true);
        else setIsBackgroundFetching(true);
        
        if (!navigator.onLine) {
            setIsLoadingHistory(false);
            setIsBackgroundFetching(false);
            return;
        }

        try {
            const response = await fetch(`${appScriptUrl}?t=${new Date().getTime()}`);
            if (!response.ok) throw new Error("Network response was not ok");

            const text = await response.text();
            if (!text || text.trim().startsWith('<')) throw new Error("Invalid response format");

            const json = JSON.parse(text);

            const validationData = json['Validation_Data'];
            if (validationData) {
                const newLists = {
                    trucks: validationData['Truck_Reg_No'] || [],
                    trailers: validationData['Trailer_Reg_No'] || [],
                    drivers: validationData['Driver_Name'] || [],
                    inspectors: validationData['Inspector_Name'] || [],
                    locations: validationData['Location'] || [],
                    positions: validationData['Position'] || []
                };
                setValidationLists(newLists);
                localStorage.setItem('sc_validation_lists', JSON.stringify(newLists));
            }
            
            let targetSheet = 'General';
            let targetHeaders = SHEET_HEADERS;

            if (activeModule === 'petroleum') {
                targetSheet = 'Petroleum';
                targetHeaders = PETROLEUM_HEADERS;
            } else if (activeModule === 'petroleum_v2') {
                targetSheet = 'Petroleum_V2';
                targetHeaders = PETROLEUM_V2_HEADERS;
            } else if (activeModule === 'acid') {
                targetSheet = 'Acid';
                targetHeaders = ACID_HEADERS;
            }
            
            const rawRows = json[targetSheet];
            let historyData: InspectionData[] = [];

            if (rawRows !== undefined && Array.isArray(rawRows) && rawRows.length > 1) {
                historyData = rawRows.slice(1).map((row: any[]) => {
                    const item: any = {};
                    targetHeaders.forEach((header, index) => {
                    item[header] = row[index] !== undefined ? row[index] : null;
                    });
                    return item as InspectionData;
                }).reverse();
            }

            setHistoryList(historyData);
            localStorage.setItem(cacheKey, JSON.stringify({
                timestamp: Date.now(),
                data: historyData
            }));

        } catch (error) {
            // console.error("Failed to fetch history", error); // Suppress log
        } finally {
            setIsLoadingHistory(false);
            setIsBackgroundFetching(false);
        }
    };

    const stats = useMemo(() => {
        if (!historyList.length) return { total: 0, avgRate: 0, passRate: 0 };
        const total = historyList.length;
        const goodInspections = historyList.filter(i => Number(i.rate) >= 4).length;
        const passRate = ((goodInspections / total) * 100).toFixed(0);
        return { total, avgRate: 0, passRate };
    }, [historyList]);

    return { 
        historyList, 
        isLoadingHistory, 
        isBackgroundFetching, 
        validationLists, 
        stats, 
        fetchHistory 
    };
};
