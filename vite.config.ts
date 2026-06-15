import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'icons.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Skein',
        short_name: 'Skein',
        description: 'Créez et partagez des diagrammes de Gantt',
        theme_color: '#10b981',
        background_color: '#F8F7F4',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: 'pwa-64x64.png',           sizes: '64x64',   type: 'image/png' },
          { src: 'pwa-192x192.png',          sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png',          sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        // Sert index.html pour toutes les routes SPA (/, /share) quand offline
        navigateFallback: '/index.html',
        // Exclut les requêtes API/fetch non-navigation
        navigateFallbackDenylist: [/^\/__/],
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
})
