// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import removeConsole from 'vite-plugin-remove-console'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'production' && removeConsole(),
  ].filter(Boolean),
  build: {
    target: 'es2019',
    minify: 'esbuild',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 300,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          router: ['react-router-dom'],
          charts: ['chart.js'],
          firebase: ['firebase/app','firebase/auth','firebase/firestore'],
          iconify: ['@iconify/react']
        }
      },
      plugins: [
        visualizer({
          filename: 'dist/bundle-stats.html',
          gzipSize: true,
          brotliSize: true,
          template: 'treemap',
          title: 'SmartShooter Bundle Visualizer'
        })
      ]
    }
  },
  define: { __DEV__: false }
}))
