import CryptoJS from 'crypto-js';

const APP_SECRET = "ECUADOR_TRAVEL_SECURE_CHAT_2024"; 

export const EncryptionService = {
  
  getChatKey: (chatId: string) => {
    return `${chatId}_${APP_SECRET}`;
  },

  encrypt: (text: string, chatId: string): string => {
    try {
      const key = EncryptionService.getChatKey(chatId);
      return CryptoJS.AES.encrypt(text, key).toString();
    } catch (e) {
      console.error("Error encrypting", e);
      return text;
    }
  },

  decrypt: (cipherText: string, chatId: string): string => {
    try {
      const key = EncryptionService.getChatKey(chatId);
      const bytes = CryptoJS.AES.decrypt(cipherText, key);
      const originalText = bytes.toString(CryptoJS.enc.Utf8);
      return originalText || "⚠️ Mensaje ilegible";
    } catch (e) {
      // Si falla, retornamos el texto original por si no estaba cifrado
      return cipherText || "⚠️ Error";
    }
  }
};