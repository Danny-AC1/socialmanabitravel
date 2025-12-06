import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carga las variables de entorno desde .env o el sistema (Vercel)
  // el tercer argumento '' le dice a vite que cargue TODAS las variables, no solo las que empiezan por VITE_
  const env = loadEnv(mode, process.cwd(), '');
  
  return {
    plugins: [react()],
    define: {
      // Exponemos las variables de entorno de forma segura
      // JSON.stringify es crucial aquí para que se inserten como strings válidos en el código JS
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY || env.API_KEY || process.env.API_KEY || ''),
      'process.env.VITE_API_KEY': JSON.stringify(env.VITE_API_KEY || ''),
      // Definimos un objeto process.env vacío para evitar errores si alguna librería intenta acceder a propiedades no definidas
      'process.env': {}
    },
    optimizeDeps: {
      force: true // Fuerza la regeneración de caché para evitar errores de iconos (Lucide)
    }
  }
})