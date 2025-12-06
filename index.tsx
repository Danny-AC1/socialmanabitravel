import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

try {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (error) {
  // Si hay un error grave al iniciar, lo mostramos en pantalla en lugar de dejarla blanca
  console.error("Error fatal al montar la app:", error);
  rootElement.innerHTML = `
    <div style="padding: 20px; color: red; font-family: sans-serif;">
      <h1>Algo salió mal 😔</h1>
      <p>Error: ${error}</p>
      <p>Revisa la consola (F12) para más detalles.</p>
    </div>
  `;
}