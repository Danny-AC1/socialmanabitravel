import { GoogleGenAI } from "@google/genai";

let ai: GoogleGenAI | null = null;

// Función auxiliar para limpiar la clave
const cleanKey = (key: string | undefined): string => {
  if (!key) return "";
  return key.replace(/["']/g, "").trim(); 
};

const getApiKey = (): string => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_KEY) {
    // @ts-ignore
    return cleanKey(import.meta.env.VITE_API_KEY);
  }
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
      console.error("Error inicializando Gemini:", e);
      return null;
    }
  }
  return null;
};

// --- MODO RESPALDO (MOCK) ---
// Si la API falla, usamos estas respuestas para que la app no parezca rota.
const getMockResponse = (query: string): string => {
  const q = query.toLowerCase();
  
  if (q.includes('comida') || q.includes('comer') || q.includes('plato')) {
    return "🍽️ [Modo Respaldo] En Ecuador la gastronomía es increíble. Te recomiendo probar el **Encebollado** en la costa, el **Hornado** en la sierra o un **Maito** en la Amazonía. ¡El Viche de Manabí es patrimonio nacional!";
  }
  if (q.includes('playa') || q.includes('mar')) {
    return "🏖️ [Modo Respaldo] Las mejores playas están en la Ruta del Spondylus. **Los Frailes** es imprescindible por su naturaleza virgen. También visita **Canoa** para surf o **Salinas** para diversión.";
  }
  if (q.includes('llegar') || q.includes('transporte') || q.includes('donde')) {
    return "Bus [Modo Respaldo] Para moverte por Ecuador, los buses interprovinciales son económicos y frecuentes. Para Galápagos necesitas vuelo desde Quito o Guayaquil.";
  }
  if (q.includes('clima') || q.includes('tiempo')) {
    return "☀️ [Modo Respaldo] El clima varía mucho. Costa: Caluroso (25-30°C). Sierra: Fresco/Frío (10-20°C). Amazonía: Húmedo (25°C+). ¡Trae ropa para todo!";
  }
  
  return "🇪🇨 [Modo Respaldo] ¡Hola! Soy tu guía virtual de Ecuador. Aunque mi conexión neuronal está descansando, te puedo decir que Ecuador es el país de los 4 mundos. ¿Te gustaría saber sobre playas, montañas o selva?";
};

const ECUADOR_SYSTEM_INSTRUCTION = `Eres el guía turístico oficial de 'Ecuador Travel'. Responde en español, con emojis y datos reales.`;

export const getTravelAdvice = async (query: string): Promise<string> => {
  const aiInstance = getAiInstance();

  // Si no hay instancia, usamos respaldo directo
  if (!aiInstance) {
    console.warn("Gemini no configurado, usando respaldo.");
    return getMockResponse(query);
  }

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: { systemInstruction: ECUADOR_SYSTEM_INSTRUCTION },
    });
    return response.text || getMockResponse(query);
  } catch (error: any) {
    console.error("Error API Gemini (usando respaldo):", error.message);
    // Si falla por CUALQUIER razón (403, 400, internet), devolvemos respuesta simulada
    // para que el usuario final no vea un error técnico.
    return getMockResponse(query);
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  const aiInstance = getAiInstance();
  if (!aiInstance) return `Disfrutando de las maravillas de ${location} 🇪🇨✨ #EcuadorTravel #Turismo`;

  try {
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Caption Instagram corto para foto en ${location}: ${details}`,
    });
    return response.text || `Explorando ${location} 🇪🇨`;
  } catch (error) {
    return `Momentos inolvidables en ${location} 🇪🇨 #ViajaEcuador`;
  }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  const aiInstance = getAiInstance();
  
  // Datos de respaldo robustos por si falla la IA al crear destino
  const fallbackData = {
    description: `Un destino increíble en ${location} que debes visitar.`,
    fullDescription: `Este es uno de los lugares más destacados de ${location}. Ofrece una experiencia única de ${category.toLowerCase()} con paisajes impresionantes y cultura local vibrante. Ideal para tomar fotos y disfrutar la naturaleza.`,
    highlights: ["Vistas panorámicas", "Gastronomía local", "Senderos naturales", "Sitios fotográficos"],
    travelTips: ["Lleva ropa cómoda", "Usa protector solar", "Lleva efectivo", "Visita temprano en la mañana"]
  };

  if (!aiInstance) return fallbackData;

  try {
    const prompt = `Genera JSON turístico para: "${name}" en "${location}" (Cat: ${category}). Estructura: { "description": "...", "fullDescription": "...", "highlights": [], "travelTips": [] }`;
    
    const response = await aiInstance.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generando detalles (usando fallback):", error);
    return fallbackData;
  }
};