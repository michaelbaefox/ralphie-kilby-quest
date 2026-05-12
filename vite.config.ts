import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/** GitHub project pages: CI sets `VITE_BASE=/YourRepoName/`. Local dev uses `/`. */
const viteBase = process.env.VITE_BASE?.trim()
const base =
  !viteBase || viteBase === '/' ? '/' : viteBase.endsWith('/') ? viteBase : `${viteBase}/`

// https://vite.dev/config/
export default defineConfig({
  base,
  server: { port: 9180, strictPort: true },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'pwa-maskable.svg', 'apple-touch-icon.png'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,svg,json,woff2}'],
        maximumFileSizeToCacheInBytes: 5_000_000,
      },
      manifest: {
        name: 'Kilby QueQueQuest',
        short_name: 'Kilby QQQ',
        description:
          "Ralphie's adventure log for the road from Lansing to the Kilby Block Party in Bluffdale.",
        theme_color: '#0c0c10',
        background_color: '#050508',
        display: 'standalone',
        orientation: 'portrait',
        start_url: './',
        icons: [
          {
            src: 'pwa-maskable.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
        ],
      },
    }),
  ],
})
