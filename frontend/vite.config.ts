import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
  build: {
    // Split large vendor/editor bundles to reduce initial chunk size
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@codemirror') || id.includes('codemirror') || id.includes('@uiw/react-codemirror')) {
              return 'editor'
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor'
            }
            if (id.includes('lucide-react')) {
              return 'icons'
            }
            if (id.includes('axios')) {
              return 'http'
            }
            return 'vendor'
          }
        }
      }
    }
  }
})
