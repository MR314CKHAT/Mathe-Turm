import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Basis-Pfad automatisch bestimmen:
 *  - GitHub Pages liefert unter https://NAME.github.io/REPO/ aus und setzt
 *    in den Actions automatisch GITHUB_REPOSITORY (= "NAME/REPO").
 *  - Lokal, bei Netlify oder Vercel sowie mit eigener Domain bleibt es "/".
 *  - Manuell übersteuern mit VITE_BASE, z. B. VITE_BASE=/mathe-turm/ npm run build
 */
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.VITE_BASE ?? (repository ? `/${repository}/` : '/');

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: [
        'favicon.svg',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'icon-maskable-512.png',
        'og-image.png',
      ],
      manifest: {
        name: 'Mathe-Turm',
        short_name: 'Mathe-Turm',
        description:
          'Rechne dich Stockwerk für Stockwerk nach oben – Mathe-Spiel für Klasse 1 bis 5.',
        lang: 'de',
        dir: 'ltr',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '.',
        scope: '.',
        theme_color: '#120e2a',
        background_color: '#120e2a',
        categories: ['education', 'games', 'kids'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2,webmanifest}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    port: 5173,
    open: false,
  },
  preview: {
    port: 4173,
  },
});
