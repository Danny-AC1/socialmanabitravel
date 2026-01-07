
// @ts-ignore
import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key].trim();
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return (process.env[key] as string).trim();
  }
  return '';
};

const fallbackConfig = {
  apiKey: "AIzaSy_Dummy_Key",
  authDomain: "demo.firebaseapp.com",
  databaseURL: "https://demo-default-rtdb.firebaseio.com",
  projectId: "demo-project",
  appId: "1:1:web:1"
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  databaseURL: getEnv('VITE_FIREBASE_DATABASE_URL'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

// Normalizamos la URL para comparar (quitamos la barra final si existe)
const normalizedURL = firebaseConfig.databaseURL.replace(/\/$/, "");
const fallbackURL = fallbackConfig.databaseURL.replace(/\/$/, "");

// Verificación robusta
export const isFirebaseConfigured = 
  !!firebaseConfig.apiKey && 
  !!firebaseConfig.databaseURL && 
  !!firebaseConfig.projectId &&
  normalizedURL !== fallbackURL &&
  firebaseConfig.databaseURL.startsWith('https://');

// Log de diagnóstico para el desarrollador
if (isFirebaseConfigured) {
  console.log("✅ Firebase conectado con éxito a:", normalizedURL);
} else {
  console.warn("⚠️ Firebase en MODO DEMO. Revisa estas variables en Vercel:");
  if (!firebaseConfig.apiKey) console.error("- Falta: VITE_FIREBASE_API_KEY");
  if (!firebaseConfig.databaseURL) console.error("- Falta: VITE_FIREBASE_DATABASE_URL");
  if (!firebaseConfig.projectId) console.error("- Falta: VITE_FIREBASE_PROJECT_ID");
}

const app = getApps().length === 0 
  ? initializeApp(isFirebaseConfigured ? firebaseConfig : fallbackConfig) 
  : getApps()[0];

export const db = getDatabase(app);
