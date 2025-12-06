import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Función auxiliar para limpiar la clave de comillas o espacios accidentales
const cleanKey = (key: string | undefined): string => {
  if (!key) return "";
  return key.replace(/["']/g, "").trim(); 
};

const getApiKey = (): string => {
  // 1. PRIMERA PRIORIDAD: VITE_API_KEY (Estándar en Vercel + Vite)
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return cleanKey(import.meta.env.VITE_API_KEY);
  }
  
  // 2. SEGUNDA PRIORIDAD: API_KEY (Si lo definiste así en Vercel y Vite lo mapea)
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_API_KEY) return cleanKey(process.env.VITE_API_KEY);
    if (process.env.API_KEY) return cleanKey(process.env.API_KEY);
  }
  
  return "";
};

const getAiInstance = (): GoogleGenAI | null => {
  if (ai) return ai;

  const key = getApiKey();
  
  if (key && key.length > 10 && !key.includes("PEGA_AQUI")) {
    try {
      ai = new GoogleGenAI({ apiKey: key });
      return ai;
    } catch (e) {
      console.error("Error crítico al inicializar Gemini:", e);
      return null;
    }
  }
  
  return null;
};

const ECUADOR_SYSTEM_INSTRUCTION = `Eres el guía turístico oficial de 'Ecuador Travel'.
Tu misión es promocionar el turismo en las 4 regiones del Ecuador: Costa, Sierra, Amazonía e Insular (Galápagos).
Tu tono es amigable, entusiasta y experto. Usas emojis de banderas de Ecuador, plantas y animales.
Si te preguntan por un lugar específico, da datos reales sobre ubicación, comida típica y qué hacer.
Responde siempre en español. Sé conciso pero útil.`;

export const getTravelAdvice = async (query: string): Promise<string> => {
  const aiInstance = getAiInstance();

  if (!aiInstance) {
    return "⚠️ El Guía Virtual no está activo. (Error: No se encontró la API Key en la configuración de Vercel).";
  }

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
      },
    });
    
    return response.text || "Lo siento, me quedé sin palabras. Intenta de nuevo.";
  } catch (error: any) {
    console.error("Error en getTravelAdvice:", error);
    
    if (error.message?.includes('403') || error.message?.includes('API key')) {
      return "🔑 Error: La API Key configurada no es válida. Revisa que no tenga espacios extra en Vercel.";
    }
    if (error.message?.includes('400')) {
      return "⚠️ Error de solicitud. Intenta preguntar de otra forma.";
    }
    
    return "Tuve un problema de conexión momentáneo. Por favor intenta de nuevo.";
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  const aiInstance = getAiInstance();
  if (!aiInstance) return "Descripción automática no disponible (Falta Key).";

  try {
    const prompt = `Escribe un pie de foto (caption) corto, inspirador y atractivo para Instagram sobre una foto en ${location}, Ecuador. Contexto: ${details}. Usa emojis y hashtags.`;
    
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error generating caption:", error);
    return "";
  }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  const aiInstance = getAiInstance();
  
  const fallbackData = {
    description: `Un hermoso lugar para visitar en ${location}.`,
    fullDescription: `Disfruta de la experiencia única que ofrece ${name}. Este destino ubicado en ${location} es ideal para los amantes de ${category}.`,
    highlights: ["Paisajes increíbles", "Gastronomía local", "Fotos únicas"],
    travelTips: ["Lleva ropa cómoda", "No olvides tu cámara", "Hidrátate bien"]
  };

  if (!aiInstance) return fallbackData;

  const prompt = `
    Actúa como una base de datos turística experta de Ecuador.
    Genera un objeto JSON válido con información turística atractiva y real sobre: "${name}" ubicado en "${location}" (Categoría: ${category}).
    
    El JSON debe tener EXACTAMENTE esta estructura:
    {
      "description": "Resumen corto y atractivo de máximo 150 caracteres.",
      "fullDescription": "Descripción detallada, histórica y experiencial de 2 o 3 párrafos.",
      "highlights": ["Punto 1", "Punto 2", "Punto 3", "Punto 4"],
      "travelTips": ["Consejo 1", "Consejo 2", "Consejo 3"]
    }
    
    IMPORTANTE: Responde SOLO con el JSON puro, sin bloques de código markdown ni texto adicional.
  `;

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating destination details:", error);
    return fallbackData;
  }
};