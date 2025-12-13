import React from 'react';
import { SubscriptionDetails, User } from '../../types';

interface SubscriptionAlertProps {
    subscription: SubscriptionDetails | null;
    user: User | null;
    onManage: () => void;
}

const SubscriptionAlert: React.FC<SubscriptionAlertProps> = ({ subscription, user, onManage }) => {
    if (!subscription || !user) return null;

    const isSuperAdmin = user.role === 'SuperAdmin';
    const isExpired = subscription.status === 'Expired';
    const isNearExpiry = subscription.status === 'Active' && subscription.daysRemaining <= 7;

    if (!isExpired && !isNearExpiry) return null;

    return (
        <div className={`w-full px-4 py-3 flex items-center justify-between shadow-md relative z-[100] animate-fadeIn
            ${isExpired ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}
        `}>
            <div className="flex items-center gap-3">
                <div className="p-1.5 bg-white/20 rounded-full">
                    {isExpired ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
                    )}
                </div>
                <div>
                    <p className="text-sm font-bold uppercase tracking-wide">
                        {isExpired ? 'System License Expired' : 'License Expiring Soon'}
                    </p>
                    <p className="text-xs font-medium opacity-90">
                        {isExpired 
                            ? 'Access to core features is restricted. Contact Administrator.'
                            : `${subscription.daysRemaining} days remaining. Please renew soon.`
                        }
                    </p>
                </div>
            </div>

            {isSuperAdmin && (
                <button 
                    onClick={onManage}
                    className="px-4 py-2 bg-white text-gray-900 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors shadow-sm"
                >
                    Manage License
                </button>
            )}
        </div>
    );
};

export default SubscriptionAlert;