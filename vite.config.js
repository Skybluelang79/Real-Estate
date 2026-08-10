import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
  },
  build: {
    chunkSizeWarningLimit: 600,
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'react-vendor',
              test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
            },
            {
              name: 'router-vendor',
              test: /node_modules[\\/](react-router|react-router-dom)[\\/]/,
              priority: 35,
            },
            {
              name: 'query-vendor',
              test: /node_modules[\\/]@tanstack/,
              priority: 30,
            },
            {
              name: 'pdf-html2canvas',
              test: /node_modules[\\/](html2canvas|dompurify|css-line-break|jspdf-yworks)/,
              priority: 30,
            },
            {
              name: 'pdf-jspdf',
              test: /node_modules[\\/](jspdf|fflate|canvg)/,
              priority: 30,
            },
            {
              name: 'map-vendor',
              test: /node_modules[\\/](leaflet|react-leaflet|react-leaflet-cluster)/,
              priority: 30,
            },
            {
              name: 'socket-vendor',
              test: /node_modules[\\/]socket\.io-client/,
              priority: 30,
            },
            {
              name: 'vendor',
              test: /node_modules/,
              priority: 10,
            },
          ],
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    testTimeout: 20000,
    hookTimeout: 20000,
  },
})
