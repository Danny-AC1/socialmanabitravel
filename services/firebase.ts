
// @ts-ignore
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// --- CONFIGURACIÓN DINÁMICA ---
// Estos valores se inyectan desde Vercel o desde tu archivo .env local
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validación de seguridad para la consola
if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "undefined") {
  console.warn("⚠️ Firebase: No se detectó API KEY. Asegúrate de configurar las variables de entorno en Vercel.");
}

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
