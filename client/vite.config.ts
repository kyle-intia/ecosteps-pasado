import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:4004',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'EcoSteps',
        short_name: 'EcoSteps',
        start_url: '.',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#4CAF50',
        icons: [
          {
            src: 'pwa_x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa_x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
        screenshots: [
          {//desktop
            src: 'ss-desktop.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
          },
          {//desktop
            src: 'ss-desktop2.png',
            sizes: '1920x1080',
            type: 'image/png',
            form_factor: 'wide',
          },
          {//mobile
            src: 'ss-mobile.png',
            sizes: '400x800',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {//mobile
            src: 'ss-mobile2.png',
            sizes: '400x800',
            type: 'image/png',
            form_factor: 'narrow',
          },
          {// No form_factor property
            src: 'ss-generic.png',
            sizes: '800x600',
            type: 'image/png',
            
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
