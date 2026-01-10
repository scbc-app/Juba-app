export enum InspectionStatus {
  GOOD = 'Good',
  BAD = 'Bad',
  ATTENTION = 'Needs Attention',
  NIL = 'Nil'
}

export interface InspectionItemConfig {
  id: string;
  label: string;
  category: string;
}

export interface ResourceLink {
  id: string;
  title: string;
  category: 'SOP' | 'Manual' | 'Safety' | 'Video';
  url: string;
  description: string;
}

export interface InspectionData {
  id?: string;
  truckNo: string;
  trailerNo: string;
  inspectedBy: string;
  driverName: string;
  location: string;
  odometer: string;
  jobCard?: string;
  timestamp: string;
  rate?: number | string;
  remarks?: string;
  inspectorSignature?: string; 
  driverSignature?: string; 
  photoFront?: string; 
  photoLS?: string;
  photoRS?: string;
  photoBack?: string;
  photoDamage?: string;
  requestId?: string; // Track origin request
  [key: string]: any; 
}

export const INITIAL_DATA: InspectionData = {
  truckNo: '',
  trailerNo: '',
  inspectedBy: '',
  driverName: '',
  location: '',
  odometer: '',
  jobCard: '',
  timestamp: '',
  rate: 0,
  remarks: '',
  inspectorSignature: '',
  driverSignature: '',
  photoFront: '',
  photoLS: '',
  photoRS: '',
  photoBack: '',
  photoDamage: ''
};

export interface UserPreferences {
    emailNotifications: boolean;
    notifyGeneral: boolean;
    notifyPetroleum: boolean;
    notifyPetroleumV2: boolean;
    notifyAcid: boolean;
    mustChangePassword?: boolean;
    isEmailVerified?: boolean;
    hasCompletedTour?: boolean;
}

export interface User {
    username: string;
    name: string;
    role: 'SuperAdmin' | 'Admin' | 'Inspector' | 'Operations' | 'Maintenance' | 'Other' | string;
    position?: string;
    lastLogin?: string;
    preferences?: UserPreferences;
    password?: string;
    isActive?: boolean;
}

export interface SystemSettings {
    companyName: string;
    managerEmail: string;
    companyLogo?: string;
    mobileApkLink?: string;
    webAppUrl?: string;
    maintenanceMode?: boolean;
    maintenanceMessage?: string;
}

export interface SubscriptionDetails {
    status: string;
    plan: string;
    expiryDate: string;
    daysRemaining: number;
}

export interface ValidationLists {
    trucks: string[];
    trailers: string[];
    drivers: string[];
    inspectors: string[];
    locations: string[];
    positions: string[];
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'critical' | 'warning' | 'success' | 'info';
    timestamp: string;
    read: boolean;
    module?: string;
    actionLink?: string;
    isServerEvent?: boolean;
}

export interface TicketComment {
    user: string;
    role: string;
    message: string;
    timestamp: string;
}

export interface SupportTicket {
    ticketId: string;
    type: string;
    subject: string;
    description: string;
    priority: string;
    user: string;
    email: string;
    role: string;
    timestamp: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    comments: TicketComment[];
    assignedTo?: string;
    attachment?: string;
}