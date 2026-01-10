import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all envs regardless of the `VITE_` prefix.
  // Fix: Cast process to any to avoid TypeScript error on 'cwd' method
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    base: './',
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
        manifest: {
          name: 'SafetyCheck Pro',
          short_name: 'SafetyCheck',
          description: 'Professional Truck & Trailer Inspection App',
          theme_color: '#1e3a8a',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          icons: [
            {
              src: 'https://cdn-icons-png.flaticon.com/512/716/716766.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'https://cdn-icons-png.flaticon.com/512/716/716766.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    define: {
      'process.env': {
        API_KEY: env.API_KEY || ''
      },
      // This specifically injects your Script URL during the build process
      'import.meta.env.VITE_APP_SCRIPT_URL': JSON.stringify(env.VITE_APP_SCRIPT_URL || '')
    }
  };
});