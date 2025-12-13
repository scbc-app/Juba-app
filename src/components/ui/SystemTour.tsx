
import React, { useState, useEffect } from 'react';

interface SystemTourProps {
    onComplete: () => void;
}

const TOUR_STEPS = [
    {
        targetId: 'sidebar-toggle',
        title: 'Navigation Menu',
        description: 'Access all inspection modules (Petroleum, Acid, General), settings, and support from here.',
        position: 'top-left'
    },
    {
        targetId: 'start-inspection-btn',
        title: 'Start Inspection',
        description: 'Click here to begin a new vehicle check. The system will guide you through all required steps.',
        position: 'center'
    },
    {
        targetId: 'notification-bell',
        title: 'Alerts Center',
        description: 'Stay updated with critical vehicle failures and system broadcasts.',
        position: 'top-right'
    },
    {
        targetId: 'sync-status-btn',
        title: 'Offline Sync',
        description: 'Works offline! When internet is restored, click here to sync pending reports.',
        position: 'top-right'
    },
    {
        targetId: 'support', // Must match ID in Sidebar
        title: 'Help & Support',
        description: 'Need assistance? Report issues, request features, or contact admins here.',
        position: 'bottom-left'
    }
];

const SystemTour: React.FC<SystemTourProps> = ({ onComplete }) => {
    const [currentStep, setCurrentStep] = useState(0);
    const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});

    useEffect(() => {
        const updatePosition = () => {
            const step = TOUR_STEPS[currentStep];
            const element = document.getElementById(step.targetId);
            
            if (element) {
                const rect = element.getBoundingClientRect();
                
                // --- SPOTLIGHT CALCULATION ---
                // We use a massive box-shadow to darken everything ELSE
                setSpotlightStyle({
                    position: 'fixed',
                    top: rect.top,
                    left: rect.left,
                    width: rect.width,
                    height: rect.height,
                    borderRadius: '8px',
                    boxShadow: '0 0 0 9999px rgba(15, 23, 42, 0.75)', // Dark overlay around the element
                    zIndex: 100, // Below the tooltip but above the rest
                    pointerEvents: 'none', // Allow clicks to pass through if needed (though usually we block interaction)
                    transition: 'all 0.4s ease-out'
                });

                // --- TOOLTIP POSITIONING ---
                const tooltipWidth = 320;
                let top = rect.bottom + 15;
                let left = rect.left;

                // Adjust based on position preference or screen edges
                if (step.position === 'top-right') {
                    left = Math.max(10, rect.right - tooltipWidth);
                } else if (step.position === 'bottom-left') {
                    // Check if it fits below, otherwise move up
                    if (top + 200 > window.innerHeight) {
                        top = rect.top - 200; // rough height estimate
                    }
                }

                // Generic Boundary Checks
                if (left + tooltipWidth > window.innerWidth) {
                    left = window.innerWidth - tooltipWidth - 20;
                }
                if (left < 10) left = 10;

                setTooltipStyle({
                    position: 'fixed',
                    top: top,
                    left: left,
                    zIndex: 101, // Above spotlight
                    transition: 'all 0.4s ease-out'
                });

            } else {
                // Fallback Center if element not found (e.g. mobile hidden elements)
                setSpotlightStyle({ display: 'none' });
                setTooltipStyle({
                    position: 'fixed',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    zIndex: 101
                });
            }
        };

        // Small delay to allow UI to render (especially if sidebar is animating)
        const timer = setTimeout(updatePosition, 100);
        window.addEventListener('resize', updatePosition);
        return () => {
            window.removeEventListener('resize', updatePosition);
            clearTimeout(timer);
        };
    }, [currentStep]);

    const handleNext = () => {
        if (currentStep < TOUR_STEPS.length - 1) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete();
        }
    };

    const stepData = TOUR_STEPS[currentStep];

    return (
        <div className="fixed inset-0 z-[200]">
            {/* The Cutout Spotlight */}
            <div style={spotlightStyle} className="ring-4 ring-white/20 animate-pulse"></div>

            {/* The Tooltip Card */}
            <div 
                className="bg-white rounded-2xl shadow-2xl p-6 w-80 animate-fadeIn border border-slate-100"
                style={tooltipStyle}
            >
                <div className="flex justify-between items-center mb-4">
                    <span className="text-[10px] font-bold text-white bg-indigo-600 px-2 py-1 rounded uppercase tracking-wide shadow-sm">
                        Tip {currentStep + 1} / {TOUR_STEPS.length}
                    </span>
                    <button onClick={onComplete} className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 mb-2">{stepData.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 font-medium">
                    {stepData.description}
                </p>

                <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                    <div className="flex gap-1.5">
                        {TOUR_STEPS.map((_, i) => (
                            <div key={i} className={`w-2 h-2 rounded-full transition-all duration-300 ${i === currentStep ? 'bg-indigo-600 w-4' : 'bg-gray-200'}`}></div>
                        ))}
                    </div>
                    <button 
                        onClick={handleNext}
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-lg transition-transform active:scale-95 flex items-center gap-2"
                    >
                        {currentStep === TOUR_STEPS.length - 1 ? 'Finish' : 'Next'}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemTour;
