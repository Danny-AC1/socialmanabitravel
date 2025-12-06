// @ts-ignore
import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

// --- INSTRUCCIONES ---
// 1. Ve a la consola de Firebase > Configuración del Proyecto > General
// 2. Baja hasta "Tus apps" y copia el objeto "firebaseConfig"
// 3. Reemplaza los valores de abajo con los tuyos REALES que copiaste de Firebase.

const firebaseConfig = {
    apiKey: "AIzaSyBGRgkH1kwBmHeBETgjeGsFe4W-IBJJeBc",
    authDomain: "red-social-turistica.firebaseapp.com",
  databaseURL: "https://TU_PROYECTO-default-rtdb.firebaseio.com",
  projectId: "red-social-turistica",
  storageBucket: "red-social-turistica.firebasestorage.app",
  messagingSenderId: "107964257640",
  appId: "1:107964257640:web:793c66a04036e5ecd9b2dd"
};

// Validación simple para avisar al desarrollador si olvidó poner la clave
if (firebaseConfig.apiKey === "AIzaSyBGRgkH1kwBmHeBETgjeGsFe4W-IBJJeBc") {
  console.error("⛔ ERROR CRÍTICO: No has configurado las claves de Firebase en services/firebase.ts");
  console.error("La aplicación no funcionará correctamente hasta que pegues tu configuración real.");
}

// Inicializamos Firebase
const app = initializeApp(firebaseConfig);

// Exportamos la referencia a la base de datos para usarla en toda la app
export const db = getDatabase(app);