import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(async () => {
  let plugins = [react()];
  
  try {
    const { VitePWA } = await import('vite-plugin-pwa');
    plugins.push(VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SINHLN2326 Yearbook',
        short_name: 'SINHLN2326',
        description: 'Kỷ yếu lớp 12 Chuyên Sinh niên khóa 2023 - 2026',
        theme_color: '#003399',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-stylesheets',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 }
            }
          },
          {
            // Ảnh public từ Supabase Storage
            urlPattern: ({ url }) =>
              url.hostname.endsWith('.supabase.co') && url.pathname.includes('/storage/v1/object/public/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-images',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Thumbnail Google Drive
            urlPattern: ({ url }) => url.hostname === 'drive.google.com',
            handler: 'CacheFirst',
            options: {
              cacheName: 'drive-thumbs',
              expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          }
        ]
      }
    }));
  } catch (e) {
    console.warn('vite-plugin-pwa not installed, skipping PWA config for build verification');
  }

  return {
    plugins
  };
});
