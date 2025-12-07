import CryptoJS from 'crypto-js';

// En un entorno real, esta clave secreta debería ser única por usuario o negociada (Diffie-Hellman).
// Para esta implementación, usamos una "Clave Maestra" derivada de los IDs del chat para asegurar consistencia
// sin necesidad de un backend complejo de intercambio de claves.
const APP_SECRET = "ECUADOR_TRAVEL_SECURE_CHAT_2024"; 

export const EncryptionService = {
  
  // Genera una clave única para cada conversación basada en los participantes
  getChatKey: (chatId: string) => {
    return `${chatId}_${APP_SECRET}`;
  },

  // Cifrar mensaje
  encrypt: (text: string, chatId: string): string => {
    try {
      const key = EncryptionService.getChatKey(chatId);
      return CryptoJS.AES.encrypt(text, key).toString();
    } catch (e) {
      console.error("Error encrypting", e);
      return text;
    }
  },

  // Descifrar mensaje
  decrypt: (cipherText: string, chatId: string): string => {
    try {
      const key = EncryptionService.getChatKey(chatId);
      const bytes = CryptoJS.AES.decrypt(cipherText, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || "⚠️ Mensaje ilegible";
    } catch (e) {
      console.error("Error decrypting", e);
      return "⚠️ Error de descifrado";
    }
  }
};