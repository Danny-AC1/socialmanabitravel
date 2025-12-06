import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Definimos una variable segura para evitar errores si process no existe
    'process.env': {}
  },
  optimizeDeps: {
    // Forzamos que Vite limpie la caché de dependencias al reiniciar
    force: true
  }
})