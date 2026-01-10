
// This variable looks for VITE_APP_SCRIPT_URL in your environment/env file
// If not found (like in a public repo), it stays empty, triggering the manual setup UI.
// Fix: Cast import.meta to any to avoid TypeScript error on 'env' property
export const PRE_CONFIGURED_SCRIPT_URL: string = ((import.meta as any).env?.VITE_APP_SCRIPT_URL as string) || ''; 

export const CACHE_TTL = 300000; // 5 minutes

// Re-export everything from modules
export * from './constants/definitions';
export * from './constants/headers';
export * from './constants/scripts';