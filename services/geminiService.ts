import { GoogleGenAI } from "@google/genai";

// Usamos import.meta.env que es el estándar de Vite, o un string vacío para evitar errores
const apiKey = import.meta.env.VITE_API_KEY || '';
let ai: GoogleGenAI | null = null;

if (apiKey) {
  try {
    ai = new GoogleGenAI({ apiKey });
  } catch (error) {
    console.error("Error inicializando Gemini:", error);
  }
}

const MANABI_SYSTEM_INSTRUCTION = `Eres un experto guía turístico de la provincia de Manabí, Ecuador. 
Tu objetivo es promover el turismo de manera entusiasta, especialmente en el Parque Nacional Machalilla, 
Playa Los Frailes y Puerto López. Eres amable, usas emojis y das consejos prácticos sobre comida, rutas y hospedaje. 
Responde siempre en español.`;

export const getTravelAdvice = async (query: string): Promise<string> => {
  if (!ai || !apiKey) {
    console.warn("API Key no encontrada");
    return "⚠️ Modo Demo: El asistente de IA no está activo en este entorno local. Cuando configures la VITE_API_KEY en Vercel, funcionaré correctamente. 🌴";
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: MANABI_SYSTEM_INSTRUCTION,
      },
    });
    return response.text || "Lo siento, no pude encontrar información sobre eso en este momento.";
  } catch (error) {
    console.error("Error fetching travel advice:", error);
    return "Tuve un problema conectando con el guía virtual. Por favor intenta de nuevo.";
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  if (!ai || !apiKey) return "Descripción no disponible (Falta API Key)";

  try {
    const prompt = `Escribe un pie de foto (caption) corto, inspirador y atractivo para Instagram sobre una foto tomada en ${location}. Detalles extra: ${details}. Incluye hashtags relevantes de turismo en Ecuador.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating caption:", error);
    return "";
  }
};