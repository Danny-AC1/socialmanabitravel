import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || process.env.API_KEY || ''),
      'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || '')
    },
    optimizeDeps: {
      force: true
    },
    build: {
      // Eliminamos el aviso amarillo "chunk size limit" aumentando el límite
      chunkSizeWarningLimit: 2000, 
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            firebase: ['firebase/app', 'firebase/database'],
            ui: ['lucide-react'],
            ai: ['@google/genai']
          }
        }
      }
    }
  }
})