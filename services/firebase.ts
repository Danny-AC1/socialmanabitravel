// @ts-ignore
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// --- INSTRUCCIONES ---
// 1. Ve a la consola de Firebase > Configuración del Proyecto (Rueda dentada) > General
// 2. Baja hasta "Tus apps" y verás un código parecido a este.
// 3. Copia solo los valores que faltan (apiKey, appId, messagingSenderId) y pégalos abajo.

const firebaseConfig = {
    apiKey: "AIzaSyBGRgkH1kwBmHeBETgjeGsFe4W-IBJJeBc",
    authDomain: "red-social-turistica.firebaseapp.com",
  databaseURL: "https://red-social-turistica-default-rtdb.firebaseio.com",
  projectId: "red-social-turistica",
  storageBucket: "red-social-turistica.firebasestorage.app",
  messagingSenderId: "107964257640",
  appId: "1:107964257640:web:793c66a04036e5ecd9b2dd"
};

// Validación simple para avisar si faltan las claves
if (firebaseConfig.apiKey.includes("AIzaSyBGRgkH1kwBmHeBETgjeGsFe4W-IBJJeBc")) {
  console.error("⛔ ERROR CRÍTICO: Faltan claves en services/firebase.ts");
}

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la referencia a la base de datos para usarla en toda la app
export const db = getDatabase(app);