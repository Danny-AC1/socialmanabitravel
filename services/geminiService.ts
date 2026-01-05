
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const memoryCache: Record<string, any> = {};

const getFromCache = (key: string) => memoryCache[key];
const saveToCache = (key: string, data: any) => { memoryCache[key] = data; };

const ECUADOR_SYSTEM_INSTRUCTION = `
Eres un guía turístico experto y amigable de Ecuador.
Tu objetivo es ayudar a los viajeros a descubrir los maravillosos destinos de las 4 regiones: Costa, Sierra, Amazonía y Galápagos.
Personalidad: Amable, entusiasta y servicial.
Importante: Responde siempre en español y con un tono acogedor.
`;

const handleGeminiError = (error: any, context: string): string => {
    console.error(`Error en Gemini (${context}):`, error);
    const msg = error.message || JSON.stringify(error);
    if (msg.includes('429') || msg.includes('quota')) return "limit_reached";
    return "unknown_error";
};

// --- CORE AI TRAVEL FUNCTIONS ---

export const getTravelAdvice = async (query: string): Promise<string> => {
  const cacheKey = `advice_v2_${query.trim().toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    const text = response.text || "No pude procesar tu consulta.";
    saveToCache(cacheKey, text);
    return text;
  } catch (error: any) {
    return handleGeminiError(error, "getTravelAdvice") === "limit_reached" 
      ? "🐢 ¡Vaya! Mi energía de IA se está recargando. Intenta de nuevo en unos minutos."
      : "Problemas de conexión con el experto de viaje. 🔌";
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Escribe un pie de foto corto y atractivo para ${location}, Ecuador. Contexto: ${details}.`,
    });
    return response.text || "";
  } catch (error) { return `Disfrutando de ${location} 🇪🇨`; }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  const prompt = `Actúa como ENCICLOPEDIA TURÍSTICA de Ecuador. Información sobre: "${name}" en "${location}" (${category}). JSON format only.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            fullDescription: { type: Type.STRING },
            highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
            travelTips: { type: Type.ARRAY, items: { type: Type.STRING } },
            coordinates: { type: Type.OBJECT, properties: { latitude: { type: Type.NUMBER }, longitude: { type: Type.NUMBER } } }
          }
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { return {}; }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
  const prompt = `Itinerario de ${days} días en ${destination}, Ecuador. Presupuesto ${budget}. Formato JSON.`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) { throw new Error("IA Saturada."); }
};

// --- CHAT INTELLIGENCE FUNCTIONS (OPTION A) ---

/**
 * Resume una conversación basándose en los últimos mensajes.
 */
export const summarizeChatMessages = async (messages: { sender: string, text: string }[]): Promise<string> => {
  const chatHistory = messages.map(m => `${m.sender}: ${m.text}`).join('\n');
  const prompt = `Resume esta conversación de chat de forma amigable y profesional. Enfócate en acuerdos de viaje, lugares mencionados y conclusiones. Sé breve y usa viñetas.\n\nCONVERSACIÓN:\n${chatHistory}`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { temperature: 0.3 }
    });
    return response.text || "No hay suficientes mensajes para resumir.";
  } catch (error) {
    return "No pude generar el resumen en este momento.";
  }
};

/**
 * Traduce un mensaje al español si es otro idioma, o detecta el contexto.
 */
export const translateChatMessage = async (text: string): Promise<string> => {
  const prompt = `Traduce el siguiente mensaje al español de Ecuador, manteniendo el tono original. Si ya está en español, mejora la redacción para que sea más clara y profesional.\n\nMENSAJE: "${text}"`;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt
    });
    return response.text || text;
  } catch (error) { return text; }
};

/**
 * Transcribe un audio basado en su contenido base64.
 */
export const transcribeAudioMessage = async (base64Audio: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-native-audio-preview-09-2025',
      contents: {
        parts: [
          { inlineData: { mimeType: 'audio/pcm;rate=16000', data: base64Audio.split(',')[1] || base64Audio } },
          { text: "Transcribe exactamente lo que dice este audio. Si menciona lugares de Ecuador o precios, resáltalos en negrita." }
        ]
      }
    });
    return response.text || "Transcripción no disponible.";
  } catch (error) {
    console.error("Transcription error:", error);
    return "Transcripción fallida.";
  }
};

/**
 * Analiza el contexto de un mensaje para sugerir acciones inteligentes.
 */
export const analyzeChatContext = async (lastMessage: string): Promise<any[]> => {
  const prompt = `Analiza este mensaje de chat y genera hasta 3 sugerencias de acciones rápidas relacionadas con turismo en Ecuador. 
  Tipos permitidos: 'guide' (Ver guía), 'weather' (Ver clima), 'search' (Buscar), 'itinerary' (Planear ruta).
  Devuelve JSON: [{ "type": "...", "label": "...", "query": "..." }]
  
  MENSAJE: "${lastMessage}"`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text || "[]");
  } catch (error) { return []; }
};

// --- MAPS GROUNDING ---

export const findNearbyPlaces = async (lat: number, lng: number, specificQuery?: string): Promise<{ places: any[] }> => {
    try {
        const prompt = `Radar local de alta precisión. Lat: ${lat}, Lng: ${lng}. Busca: "${specificQuery || 'lugares de interés'}". Radio 30km. JSON format.`;
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{googleMaps: {}}],
                toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
            },
        });
        const data = JSON.parse(response.text || "{}");
        return { places: (data.places || []).map((p: any) => ({ ...p, mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.address)}` })) };
    } catch (error) { return { places: [] }; }
};
