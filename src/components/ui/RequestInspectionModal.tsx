
import React, { useState, useEffect, useRef } from 'react';
import { ValidationLists } from '../../types';

interface RequestInspectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: any) => void;
    validationLists: ValidationLists;
    currentUserRole: string;
}

const RequestInspectionModal: React.FC<RequestInspectionModalProps> = ({ 
    isOpen, onClose, onSubmit, validationLists, currentUserRole 
}) => {
    if (!isOpen) return null;

    const [truckNo, setTruckNo] = useState('');
    const [trailerNo, setTrailerNo] = useState('');
    const [type, setType] = useState('General');
    const [priority, setPriority] = useState('Normal');
    const [reason, setReason] = useState('');
    const [inspector, setInspector] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Real-time validation states
    const [isTruckVerified, setIsTruckVerified] = useState(false);
    const [isTrailerVerified, setIsTrailerVerified] = useState(false);
    const [isInspectorVerified, setIsInspectorVerified] = useState(false);

    useEffect(() => {
        setIsTruckVerified(!!truckNo);
    }, [truckNo]);

    useEffect(() => {
        setIsTrailerVerified(!!trailerNo);
    }, [trailerNo]);

    useEffect(() => {
        setIsInspectorVerified(!!inspector);
    }, [inspector]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const newErrors: Record<string, string> = {};

        // --- STRICT VALIDATION LOGIC ---
        
        // 1. Validate Truck (Mandatory)
        if (!truckNo) {
            newErrors.truckNo = "Please select a truck.";
        }

        // 2. Reason Check
        if (!reason.trim()) newErrors.reason = "Please provide a reason or instruction.";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setIsSubmitting(true);
        try {
            await onSubmit({ 
                truckNo, 
                trailerNo, 
                type, 
                priority, 
                reason,
                assignedInspector: inspector 
            });
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    // Reusable Professional Searchable Select Component
    const SelectField = ({ 
        label, 
        value, 
        onChange, 
        options, 
        placeholder = "Select...", 
        error, 
        isVerified, 
        isOptional = false 
    }: { 
        label: string, 
        value: string, 
        onChange: (val: string) => void, 
        options: string[], 
        placeholder?: string, 
        error?: string, 
        isVerified?: boolean, 
        isOptional?: boolean 
    }) => {
        const [isOpen, setIsOpen] = useState(false);
        const [searchTerm, setSearchTerm] = useState('');
        const wrapperRef = useRef<HTMLDivElement>(null);

        useEffect(() => {
            function handleClickOutside(event: any) {
                if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                    setIsOpen(false);
                }
            }
            document.addEventListener("mousedown", handleClickOutside);
            return () => document.removeEventListener("mousedown", handleClickOutside);
        }, [wrapperRef]);

        useEffect(() => {
            if (isOpen) setSearchTerm('');
        }, [isOpen]);

        const filteredOptions = options.filter(opt => 
            String(opt).toLowerCase().includes(searchTerm.toLowerCase())
        );

        return (
            <div className="relative group" ref={wrapperRef}>
                <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">
                    {label} {isOptional && <span className="text-gray-400 font-normal normal-case">(Optional)</span>}
                </label>
                
                <div 
                    onClick={() => { if (options.length > 0) setIsOpen(!isOpen); }}
                    className={`relative w-full p-2.5 bg-gray-50 border rounded-lg outline-none text-xs font-bold text-gray-700 transition-all cursor-pointer flex items-center justify-between
                        ${error ? 'border-red-300 ring-1 ring-red-200 bg-red-50 text-red-900' : isOpen ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-white' : 'border-gray-200 hover:bg-white hover:border-gray-300'}
                        ${options.length === 0 ? 'opacity-70 cursor-not-allowed' : ''}
                    `}
                >
                    <span className={`truncate mr-6 ${!value && 'text-gray-400 font-medium'}`}>
                        {value || (options.length === 0 ? "Loading / No Data..." : placeholder)}
                    </span>
                    
                    <div className="absolute right-2.5 flex items-center gap-2 pointer-events-none">
                        {isVerified && value && !error && (
                            <span className="text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200 flex items-center gap-1">
                                <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                VERIFIED
                            </span>
                        )}
                        <svg className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </div>
                </div>

                {isOpen && options.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden animate-fadeIn flex flex-col max-h-56">
                        <div className="p-2 border-b border-gray-100 bg-gray-50 sticky top-0 shrink-0">
                            <div className="relative">
                                <svg className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                                <input 
                                    type="text" 
                                    autoFocus
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 placeholder-gray-400"
                                    placeholder="Search options..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                />
                            </div>
                        </div>
                        <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 flex-1">
                            {filteredOptions.length === 0 ? (
                                <div className="p-3 text-center text-xs text-gray-400 italic">No matches found</div>
                            ) : (
                                filteredOptions.map((opt, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={() => { onChange(opt); setIsOpen(false); }}
                                        className={`px-3 py-2 text-xs cursor-pointer transition-colors flex items-center justify-between border-b border-gray-50 last:border-0 ${value === opt ? 'bg-indigo-50 text-indigo-700 font-bold' : 'text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        {opt}
                                        {value === opt && <svg className="w-3 h-3 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
                {error && <p className="text-[9px] text-red-600 font-bold mt-0.5 ml-0.5">{error}</p>}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white w-full max-w-md rounded-xl shadow-2xl overflow-hidden transform transition-all scale-100 border border-slate-200">
                
                {/* Compact Header */}
                <div className="bg-indigo-600 px-5 py-3 flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-inner text-white">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-white tracking-wide leading-tight">Request Inspection</h3>
                            <p className="text-indigo-200 text-[10px] font-medium">Submit vehicle for ad-hoc check</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-indigo-200 hover:text-white p-1 rounded-full hover:bg-indigo-500 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                </div>

                <div className="p-5">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        
                        <div className="p-2.5 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-2.5">
                            <svg className="w-4 h-4 text-blue-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                            <p className="text-[10px] text-blue-800 font-medium leading-tight">
                                Select vehicles from the database using the search below.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <SelectField 
                                label="Truck Reg No *"
                                value={truckNo}
                                onChange={(v) => { setTruckNo(v); setErrors(prev => ({...prev, truckNo: ''})); }}
                                options={validationLists.trucks}
                                placeholder="Select Truck..."
                                error={errors.truckNo}
                                isVerified={isTruckVerified}
                            />
                            
                            <SelectField 
                                label="Trailer Reg No"
                                value={trailerNo}
                                onChange={(v) => { setTrailerNo(v); setErrors(prev => ({...prev, trailerNo: ''})); }}
                                options={validationLists.trailers}
                                placeholder="Optional..."
                                isVerified={isTrailerVerified}
                                isOptional={true}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <SelectField 
                                label="Inspection Type"
                                value={type}
                                onChange={setType}
                                options={['General', 'Petroleum', 'Petroleum_V2', 'Acid']}
                                placeholder="Select Type..."
                            />
                            
                            <SelectField 
                                label="Priority"
                                value={priority}
                                onChange={setPriority}
                                options={['Normal', 'Urgent', 'Safety Concern']}
                                placeholder="Select Priority..."
                            />
                        </div>

                        <SelectField 
                            label="Assign Inspector"
                            value={inspector}
                            onChange={(v) => { setInspector(v); setErrors(prev => ({...prev, inspector: ''})); }}
                            options={validationLists.inspectors}
                            placeholder="Select an Inspector (Optional)..."
                            isVerified={isInspectorVerified}
                            isOptional={true}
                        />

                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1 tracking-wide">Reason / Instructions *</label>
                            <textarea 
                                className={`w-full p-2.5 bg-gray-50 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium h-20 placeholder-gray-400 resize-none
                                    ${errors.reason ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-200'}
                                `}
                                placeholder="e.g. Driver reported strange brake noise."
                                value={reason}
                                onChange={(e) => { setReason(e.target.value); setErrors(prev => ({...prev, reason: ''})); }}
                                required
                            ></textarea>
                            {errors.reason && <p className="text-[9px] text-red-600 font-bold mt-0.5 ml-0.5">{errors.reason}</p>}
                        </div>

                        <div className="pt-2 flex justify-end">
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`px-5 py-2.5 rounded-lg font-bold text-white shadow-md transition-all flex items-center gap-2 text-xs
                                    ${isSubmitting ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95'}
                                `}
                            >
                                {isSubmitting ? (
                                    <>
                                        <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                        Sending...
                                    </>
                                ) : (
                                    'Submit Request'
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestInspectionModal;
