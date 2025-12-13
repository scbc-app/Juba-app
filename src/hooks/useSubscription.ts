
import { useState, useEffect } from 'react';
import { SubscriptionDetails, User } from '../types';

export const useSubscription = (appScriptUrl: string, currentUser: User | null) => {
    const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const fetchSubscription = async () => {
        if (!appScriptUrl || typeof appScriptUrl !== 'string' || !appScriptUrl.startsWith('http')) return;
        if (!currentUser) return;
        
        setIsLoading(true);
        try {
            const response = await fetch(`${appScriptUrl}?t=${new Date().getTime()}`);
            if (!response.ok) return;

            const text = await response.text();
            if (!text || text.trim().startsWith('<')) return;

            const json = JSON.parse(text);
            
            if (json['Subscription_Data']) {
                const data = json['Subscription_Data'];
                // Calculate days remaining locally to be precise
                const expiry = new Date(data.expiryDate);
                const now = new Date();
                const diffTime = expiry.getTime() - now.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                
                setSubscription({
                    status: data.status,
                    plan: data.plan,
                    expiryDate: data.expiryDate,
                    daysRemaining: diffDays
                });
            }
        } catch (error) {
            // Silent fail
        } finally {
            setIsLoading(false);
        }
    };

    // Check on mount and periodically
    useEffect(() => {
        fetchSubscription();
    }, [appScriptUrl, currentUser]);

    // Check if system is locked
    const isLocked = subscription?.status === 'Expired' && currentUser?.role !== 'SuperAdmin';

    return { subscription, isLocked, isLoading, refreshSubscription: fetchSubscription };
};
