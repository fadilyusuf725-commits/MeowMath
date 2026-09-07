import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'MeowMath — Kota Meow',
        short_name: 'MeowMath',
        description: 'Petualangan geometri ruang untuk murid kelas V.',
        theme_color: '#ff8b5e',
        background_color: '#fff8ee',
        display: 'standalone',
        lang: 'id',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,webp,woff2}']
      }
    })
  ]
})
