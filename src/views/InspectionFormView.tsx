
import React, { useState, useEffect } from 'react';
import { InspectionData, InspectionStatus, InspectionItemConfig, ValidationLists, SystemSettings } from '../types';
import { INSPECTION_ITEMS, INSPECTION_CATEGORIES, PETROLEUM_INSPECTION_ITEMS, PETROLEUM_CATEGORIES, ACID_INSPECTION_ITEMS, ACID_CATEGORIES, PETROLEUM_V2_ITEMS, PETROLEUM_V2_CATEGORIES, SECTIONS } from '../constants';
import CameraCapture from '../components/CameraCapture';
import SignaturePad from '../components/SignaturePad';
import StatusButton from '../components/ui/StatusButton';
import Input from '../components/ui/Input';
import AutocompleteInput from '../components/ui/AutocompleteInput';
import PrintableGeneralReport from '../components/reports/PrintableGeneralReport';
import PrintablePetroleumReport from '../components/reports/PrintablePetroleumReport';
import PrintablePetroleumV2Report from '../components/reports/PrintablePetroleumV2Report';
import PrintableAcidReport from '../components/reports/PrintableAcidReport';

interface InspectionFormViewProps {
    initialData: InspectionData;
    activeModule: string;
    validationLists: ValidationLists;
    settings: SystemSettings;
    onSaveDraft: (data: InspectionData) => void;
    onSubmit: (data: InspectionData) => void;
    onExit: () => void;
    submissionStatus: 'idle' | 'submitting' | 'success' | 'offline_saved';
    onViewReport: (data: InspectionData) => void;
}

const InspectionFormView: React.FC<InspectionFormViewProps> = ({ 
    initialData, activeModule, validationLists, settings, onSaveDraft, onSubmit, onExit, submissionStatus, onViewReport 
}) => {
    const [formData, setFormData] = useState<InspectionData & any>(initialData);
    const [currentSection, setCurrentSection] = useState(0);
    const [errors, setErrors] = useState<Record<string, boolean>>({});

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => {
                const next = {...prev};
                delete next[field];
                return next;
            });
        }
    };

    const getItemsForStep = (stepIndex: number): InspectionItemConfig[] => {
        let categories: string[] = [];
        let sourceItems: InspectionItemConfig[] = [];

        if (activeModule === 'general') sourceItems = INSPECTION_ITEMS;
        else if (activeModule === 'petroleum') sourceItems = PETROLEUM_INSPECTION_ITEMS;
        else if (activeModule === 'petroleum_v2') sourceItems = PETROLEUM_V2_ITEMS;
        else if (activeModule === 'acid') sourceItems = ACID_INSPECTION_ITEMS;

        if (activeModule === 'general') {
            if (stepIndex === 2) categories = [INSPECTION_CATEGORIES.PPE, INSPECTION_CATEGORIES.DOCUMENTATION];
            if (stepIndex === 3) categories = [INSPECTION_CATEGORIES.VEHICLE_EXTERIOR, INSPECTION_CATEGORIES.LIGHTS_ELECTRICAL];
            if (stepIndex === 4) categories = [INSPECTION_CATEGORIES.MECHANICAL, INSPECTION_CATEGORIES.TRAILER];
        } else if (activeModule === 'petroleum') {
            if (stepIndex === 2) categories = [PETROLEUM_CATEGORIES.TRUCK_EQUIPMENT];
            if (stepIndex === 3) categories = [PETROLEUM_CATEGORIES.TYRES, PETROLEUM_CATEGORIES.PPE_ID];
            if (stepIndex === 4) categories = [PETROLEUM_CATEGORIES.DOCUMENTS, PETROLEUM_CATEGORIES.ONBOARD];
        } else if (activeModule === 'petroleum_v2') {
            if (stepIndex === 2) categories = [PETROLEUM_V2_CATEGORIES.PRIME_MOVER];
            if (stepIndex === 3) categories = [PETROLEUM_V2_CATEGORIES.TRAILER_TANKS];
            if (stepIndex === 4) categories = [PETROLEUM_V2_CATEGORIES.DRIVER, PETROLEUM_V2_CATEGORIES.SAFETY_SIGNS, PETROLEUM_V2_CATEGORIES.DOCUMENTS];
        } else if (activeModule === 'acid') {
            if (stepIndex === 2) categories = [ACID_CATEGORIES.PPE];
            if (stepIndex === 3) categories = [ACID_CATEGORIES.VEHICLE];
            if (stepIndex === 4) categories = [ACID_CATEGORIES.SPILL_KIT, ACID_CATEGORIES.DOCUMENTATION];
        }

        return sourceItems.filter(item => categories.includes(item.category));
    };

    const validateSection = (sectionIndex: number): boolean => {
        const newErrors: Record<string, boolean> = {};
        
        if (sectionIndex === 0) {
            if (!formData.truckNo) newErrors.truckNo = true;
            if (!formData.trailerNo) newErrors.trailerNo = true;
            if (!formData.driverName) newErrors.driverName = true;
            if (!formData.location) newErrors.location = true;
            if (!formData.odometer) newErrors.odometer = true;
            if (activeModule !== 'general' && !formData.jobCard) newErrors.jobCard = true;
        }

        if (sectionIndex >= 2 && sectionIndex <= 4) {
            const requiredItems = getItemsForStep(sectionIndex);
            
            requiredItems.forEach(item => {
                const val = formData[item.id];
                if (!val) {
                    newErrors[item.id] = true;
                }
            });
        }

        if (sectionIndex === 5) {
             if (!formData.remarks || formData.remarks.trim() === '') newErrors.remarks = true;
             if (!formData.rate || formData.rate === 0) newErrors.rate = true;
             if (!formData.inspectorSignature) newErrors.inspectorSignature = true;
             if (!formData.driverSignature) newErrors.driverSignature = true;
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            window.scrollTo({ top: 0, behavior: 'smooth' }); 
            return false;
        }

        setErrors({});
        return true;
    };

    const validateFullForm = (): boolean => {
        for (let i = 0; i <= 5; i++) {
            if (!validateSection(i)) {
                setCurrentSection(i); 
                return false;
            }
        }
        return true;
    };

    const handleNext = () => {
        if (!validateSection(currentSection)) return;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        setCurrentSection(prev => Math.min(prev + 1, SECTIONS.length - 1));
    };

    const handleBack = () => {
        if (currentSection === 0) {
            onExit();
        } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setCurrentSection(prev => Math.max(prev - 1, 0));
        }
    };

    const handleSubmitInspection = () => {
        if (validateFullForm()) {
            onSubmit(formData);
        }
    };

    const renderDetailsSection = () => (
      <div className="space-y-6 animate-fadeIn">
        {formData.requestId && (
            <div className="bg-gradient-to-r from-indigo-500 to-blue-600 p-4 rounded-xl shadow-lg flex items-center justify-between text-white border border-indigo-400">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                    </div>
                    <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-indigo-100">Task Assignment</p>
                        <p className="text-sm font-bold">Fulfilling Request #{formData.requestId}</p>
                    </div>
                </div>
                <span className="text-[10px] bg-white text-indigo-600 px-2 py-1 rounded font-bold shadow-sm uppercase tracking-wide">
                    Priority Action
                </span>
            </div>
        )}

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 p-2 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0c0 .667.333 1 1 1v1m2-2c-.667 0-1 .333-1 1v1"></path></svg>
            </span>
            Vehicle & Driver Information
          </h2>
          <div className="text-xs text-red-500 font-medium mb-4">* All fields in this section are required.</div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <AutocompleteInput 
              label="Truck/Vehicle Reg No. *" 
              value={formData.truckNo} 
              onChange={v => updateField('truckNo', v)} 
              options={validationLists.trucks}
              placeholder="e.g. AHB 1502 ZM"
              isRegNo={true}
              error={errors.truckNo}
            />
            <AutocompleteInput 
              label="Trailer/Unit Reg No. *" 
              value={formData.trailerNo} 
              onChange={v => updateField('trailerNo', v)} 
              options={validationLists.trailers}
              placeholder="e.g. AHB 1502 ZM"
              isRegNo={true}
              error={errors.trailerNo}
            />
            
            <Input 
              label="Job Card #" 
              value={formData.jobCard || ''} 
              onChange={v => updateField('jobCard', v)} 
              error={errors.jobCard}
            />
            
            <AutocompleteInput 
              label="Inspected By (Name)" 
              value={formData.inspectedBy} 
              onChange={v => updateField('inspectedBy', v)} 
              options={validationLists.inspectors}
              placeholder="Auto-filled"
              isTitleCase={true}
              readOnly={true}
            />
  
            <AutocompleteInput 
              label="Driver Name *" 
              value={formData.driverName} 
              onChange={v => updateField('driverName', v)} 
              options={validationLists.drivers}
              placeholder="e.g. John Doe"
              isTitleCase={true}
              error={errors.driverName}
            />
            <AutocompleteInput 
              label="Current Location *" 
              value={formData.location} 
              onChange={v => updateField('location', v)} 
              options={validationLists.locations}
              placeholder="e.g. Lusaka, Zambia"
              isTitleCase={true}
              error={errors.location}
            />
            
            <Input 
              label="Odometer Reading (km) *" 
              type="number" 
              value={formData.odometer} 
              onChange={v => updateField('odometer', v)} 
              error={errors.odometer}
            />
          </div>
        </div>
      </div>
    );
  
    const renderPhotosSection = () => (
      <div className="space-y-6 animate-fadeIn">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 p-2 rounded-lg">
               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
            </span>
            Vehicle Photos
          </h2>
          <p className="text-gray-500 text-sm mb-4">Photos are optional but recommended for documentation.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <CameraCapture label="Front View" existingImage={formData.photoFront} onCapture={img => updateField('photoFront', img)} />
            <CameraCapture label="Left Side (LS)" existingImage={formData.photoLS} onCapture={img => updateField('photoLS', img)} />
            <CameraCapture label="Right Side (RS)" existingImage={formData.photoRS} onCapture={img => updateField('photoRS', img)} />
            <CameraCapture label="Back View" existingImage={formData.photoBack} onCapture={img => updateField('photoBack', img)} />
          </div>
        </div>
      </div>
    );
  
    const renderInspectionSection = (categoriesToShow: string[]) => {
        const itemsToRender = getItemsForStep(currentSection).filter(i => categoriesToShow.includes(i.category));
        
        const grouping: Record<string, InspectionItemConfig[]> = {};
        categoriesToShow.forEach(cat => {
            grouping[cat] = itemsToRender.filter(i => i.category === cat);
        });
  
        return (
          <div className="space-y-8 animate-fadeIn">
            {categoriesToShow.map(cat => (
              <div key={cat} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="text-lg font-bold text-blue-900">{cat}</h3>
                  <span className="text-[10px] text-red-500 font-bold uppercase tracking-wider">Required</span>
                </div>
                <div className="p-4 md:p-6 space-y-6">
                  {grouping[cat].map(item => (
                    <div key={item.id} className={`flex flex-col gap-3 pb-6 border-b border-gray-50 last:border-0 last:pb-0 ${errors[item.id] ? 'p-3 rounded-lg bg-red-50 ring-1 ring-red-300' : ''}`}>
                      <div className="flex justify-between items-center">
                          <span className={`font-semibold text-base ${errors[item.id] ? 'text-red-800' : 'text-gray-800'}`}>
                              {item.label} <span className="text-red-500">*</span>
                          </span>
                          {errors[item.id] && <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider bg-white px-2 py-1 rounded border border-red-200 shadow-sm">Action Required</span>}
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                         <StatusButton label="Good" status={InspectionStatus.GOOD} current={formData[item.id]} onClick={() => updateField(item.id, InspectionStatus.GOOD)} colorClass="green" />
                         <StatusButton label="Bad" status={InspectionStatus.BAD} current={formData[item.id]} onClick={() => updateField(item.id, InspectionStatus.BAD)} colorClass="red" />
                         <StatusButton label="Attn" status={InspectionStatus.ATTENTION} current={formData[item.id]} onClick={() => updateField(item.id, InspectionStatus.ATTENTION)} colorClass="yellow" />
                         <StatusButton label="Nil" status={InspectionStatus.NIL} current={formData[item.id]} onClick={() => updateField(item.id, InspectionStatus.NIL)} colorClass="gray" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
    };
  
    const renderSignaturesSection = () => (
      <div className="space-y-6 animate-fadeIn">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
             Finalize Inspection
          </h2>
          
          <div className="mb-6">
            <label className={`block text-sm font-bold mb-2 ${errors.remarks ? 'text-red-600' : 'text-gray-700'}`}>Remarks / Observations <span className="text-red-500">*</span></label>
            <textarea 
              className={`w-full p-4 border rounded-lg h-32 outline-none transition-all
                 ${errors.remarks 
                   ? 'border-red-300 ring-2 ring-red-200 bg-red-50 placeholder-red-300' 
                   : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                 }
              `} 
              placeholder="Enter observations..."
              value={formData.remarks}
              onChange={(e) => updateField('remarks', e.target.value)}
            />
            {errors.remarks && <p className="text-xs text-red-500 mt-1 font-bold">Please provide remarks</p>}
          </div>
  
          <div className="mb-8">
              <CameraCapture label="Picture of Damage / Defects (Optional)" existingImage={formData.photoDamage} onCapture={img => updateField('photoDamage', img)} />
          </div>
  
          <div className="mb-8">
             <label className={`block text-sm font-bold mb-3 ${errors.rate ? 'text-red-600' : 'text-gray-700'}`}>Overall Vehicle Rating <span className="text-red-500">*</span></label>
             <div className={`flex gap-2 sm:gap-4 justify-between sm:justify-start p-2 rounded-xl transition-colors ${errors.rate ? 'bg-red-50 ring-1 ring-red-200' : ''}`}>
               {[1, 2, 3, 4, 5].map(num => (
                 <button
                  key={num}
                  type="button"
                  onClick={() => updateField('rate', num)}
                  className={`flex-1 sm:flex-none w-12 h-12 rounded-lg font-bold text-lg transition-all ${
                    formData.rate === num ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                 >
                   {num}
                 </button>
               ))}
             </div>
             {errors.rate && <p className="text-xs text-red-500 mt-1 font-bold">Rating required</p>}
          </div>
  
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-gray-100">
             <div className={errors.inspectorSignature ? 'p-2 bg-red-50 rounded-lg border border-red-200' : ''}>
                 <SignaturePad label="Inspector Signature" existingSignature={formData.inspectorSignature} onSave={sig => updateField('inspectorSignature', sig)} />
                 {errors.inspectorSignature && <p className="text-xs text-red-600 mt-1 font-bold animate-pulse">Signature Required</p>}
             </div>
             <div className={errors.driverSignature ? 'p-2 bg-red-50 rounded-lg border border-red-200' : ''}>
                 <SignaturePad label="Driver Signature" existingSignature={formData.driverSignature} onSave={sig => updateField('driverSignature', sig)} />
                 {errors.driverSignature && <p className="text-xs text-red-600 mt-1 font-bold animate-pulse">Signature Required</p>}
             </div>
          </div>
        </div>
      </div>
    );
  
    const renderSummarySection = () => (
      <div className="space-y-6 animate-fadeIn pb-12">
        <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inspection Ready</h2>
          <p className="text-gray-500">Please review the report below.</p>
          <button 
              onClick={() => onViewReport(formData)}
              className="mt-4 px-6 py-2 bg-blue-50 text-blue-600 rounded-lg font-bold text-sm hover:bg-blue-100 transition-colors"
          >
              View Full Screen Preview
          </button>
        </div>
  
        <div className="mt-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-700">Document Preview</h3>
          </div>
          <div className="p-4 overflow-x-auto bg-gray-100 flex justify-center">
               <div className="bg-white shadow-xl transform scale-75 md:scale-100 transition-transform origin-top">
                   {activeModule === 'petroleum' ? (
                       <PrintablePetroleumReport data={formData} settings={settings} />
                   ) : activeModule === 'petroleum_v2' ? (
                       <PrintablePetroleumV2Report data={formData} settings={settings} />
                   ) : activeModule === 'acid' ? (
                       <PrintableAcidReport data={formData} settings={settings} />
                   ) : (
                       <PrintableGeneralReport data={formData} settings={settings} />
                   )}
               </div>
          </div>
        </div>
  
        <div className="mt-8 bg-emerald-950 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-emerald-900/50 transform skew-y-12 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="text-center md:text-left">
                    <h3 className="text-2xl font-bold mb-2 text-emerald-100">Ready to Submit?</h3>
                    <p className="text-emerald-400 text-sm max-w-md">
                        This will finalize the inspection record and upload it to the {activeModule === 'petroleum' ? 'Petroleum' : activeModule === 'petroleum_v2' ? 'Petroleum_V2' : activeModule === 'acid' ? 'Acid' : 'General'} Database.
                    </p>
                    
                    {!navigator.onLine && (
                         <div className="mt-4 inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold border border-amber-500/30">
                             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path></svg>
                             Offline Mode: Will save to device
                         </div>
                    )}
                </div>
                <div className="flex flex-col gap-3 w-full md:w-auto">
                   <button 
                    onClick={handleSubmitInspection}
                    disabled={submissionStatus !== 'idle'}
                    className={`w-full md:w-auto px-10 py-5 text-white rounded-2xl font-black text-xl shadow-xl transition-all flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 border-2 border-white/20
                       ${submissionStatus !== 'idle' ? 'bg-gray-600 cursor-wait' : 'bg-emerald-500 hover:bg-emerald-400'}
                    `}
                   >
                     {submissionStatus === 'submitting' ? 'Processing...' : submissionStatus === 'offline_saved' ? 'Saved Offline' : 'SUBMIT INSPECTION'}
                     {submissionStatus === 'idle' && <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>}
                  </button>
                </div>
            </div>
        </div>
      </div>
    );

    return (
        <div className="flex flex-col min-h-screen">
             <div className="bg-white border-b border-gray-200 sticky top-14 md:top-16 z-30">
                <div className="overflow-x-auto scrollbar-hide">
                    <div className="flex px-4 py-3 min-w-max">
                    {SECTIONS.map((section, idx) => {
                        const isActive = idx === currentSection;
                        const isCompleted = idx < currentSection;
                        return (
                        <div key={section.id} className="flex items-center">
                            <div className={`flex flex-col items-center gap-1 cursor-default`} >
                            <div className={`
                                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
                                ${isActive ? 'bg-emerald-600 text-white shadow-md' : isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}
                            `}>
                                {isCompleted ? '✓' : idx + 1}
                            </div>
                            <span className={`text-[10px] uppercase font-bold tracking-wide ${isActive ? 'text-emerald-700' : 'text-gray-400'}`}>
                                {section.title}
                            </span>
                            </div>
                            {idx < SECTIONS.length - 1 && (
                            <div className={`h-0.5 w-8 md:w-16 mx-2 ${isCompleted ? 'bg-emerald-200' : 'bg-gray-100'}`} />
                            )}
                        </div>
                        );
                    })}
                    </div>
                </div>
                <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-emerald-900 text-white text-xs font-medium">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    {SECTIONS[currentSection].label}
                </div>
            </div>

            <div className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full">
                {currentSection === 0 && renderDetailsSection()}
                {currentSection === 1 && renderPhotosSection()}
                
                {activeModule === 'general' && currentSection === 2 && renderInspectionSection([INSPECTION_CATEGORIES.PPE, INSPECTION_CATEGORIES.DOCUMENTATION])}
                {activeModule === 'general' && currentSection === 3 && renderInspectionSection([INSPECTION_CATEGORIES.VEHICLE_EXTERIOR, INSPECTION_CATEGORIES.LIGHTS_ELECTRICAL])}
                {activeModule === 'general' && currentSection === 4 && renderInspectionSection([INSPECTION_CATEGORIES.MECHANICAL, INSPECTION_CATEGORIES.TRAILER])}
                
                {activeModule === 'petroleum' && currentSection === 2 && renderInspectionSection([PETROLEUM_CATEGORIES.TRUCK_EQUIPMENT])}
                {activeModule === 'petroleum' && currentSection === 3 && renderInspectionSection([PETROLEUM_CATEGORIES.TYRES, PETROLEUM_CATEGORIES.PPE_ID])}
                {activeModule === 'petroleum' && currentSection === 4 && renderInspectionSection([PETROLEUM_CATEGORIES.DOCUMENTS, PETROLEUM_CATEGORIES.ONBOARD])}

                {activeModule === 'petroleum_v2' && currentSection === 2 && renderInspectionSection([PETROLEUM_V2_CATEGORIES.PRIME_MOVER])}
                {activeModule === 'petroleum_v2' && currentSection === 3 && renderInspectionSection([PETROLEUM_V2_CATEGORIES.TRAILER_TANKS])}
                {activeModule === 'petroleum_v2' && currentSection === 4 && renderInspectionSection([PETROLEUM_V2_CATEGORIES.DRIVER, PETROLEUM_V2_CATEGORIES.SAFETY_SIGNS, PETROLEUM_V2_CATEGORIES.DOCUMENTS])}

                {activeModule === 'acid' && currentSection === 2 && renderInspectionSection([ACID_CATEGORIES.PPE])}
                {activeModule === 'acid' && currentSection === 3 && renderInspectionSection([ACID_CATEGORIES.VEHICLE])}
                {activeModule === 'acid' && currentSection === 4 && renderInspectionSection([ACID_CATEGORIES.SPILL_KIT, ACID_CATEGORIES.DOCUMENTATION])}
                
                {currentSection === 5 && renderSignaturesSection()}
                {currentSection === 6 && renderSummarySection()}
            </div>

            <footer className="bg-white border-t border-gray-200 p-4 sticky bottom-0 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between gap-4">
                <div className="flex gap-2 w-full sm:w-auto">
                    <button 
                        onClick={handleBack} 
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-gray-300 font-semibold text-gray-600 hover:bg-gray-50 transition"
                    >
                        {currentSection === 0 ? 'Cancel' : 'Back'}
                    </button>
                    <button 
                        onClick={() => onSaveDraft(formData)}
                        className="flex-1 sm:flex-none px-6 py-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition flex items-center justify-center gap-2"
                        title="Save progress and exit"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                        <span className="hidden sm:inline">Save Draft</span>
                        <span className="sm:hidden">Draft</span>
                    </button>
                </div>
                
                {currentSection < SECTIONS.length - 1 ? (
                   <button 
                    onClick={handleNext} 
                    className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition flex items-center justify-center gap-2"
                  >
                    Next Section
                  </button>
                ) : (
                   <div className="flex-1 flex items-center justify-end text-sm font-medium text-gray-500">
                      Review & Submit above
                   </div>
                )}
              </div>
            </footer>
        </div>
    );
};

export default InspectionFormView;
