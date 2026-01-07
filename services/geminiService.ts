
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const memoryCache: Record<string, any> = {};

const getFromCache = (key: string) => {
    return memoryCache[key];
};

const saveToCache = (key: string, data: any) => {
    memoryCache[key] = data;
};

const ECUADOR_SYSTEM_INSTRUCTION = `
Eres un guía turístico experto y amigable de Ecuador.
Tu objetivo es ayudar a los viajeros a descubrir los maravillosos destinos de las 4 regiones: Costa, Sierra, Amazonía y Galápagos.

Personalidad:
- Amable, entusiasta y servicial.
- Tus respuestas deben ser breves y fáciles de leer en un celular.
- Usa emojis para dar vida a la conversación, pero sin exagerar.
`;

const handleGeminiError = (error: any, context: string): string => {
    console.error(`Error en Gemini (${context}):`, error);
    const msg = error.message || JSON.stringify(error);
    if (msg.includes('429') || msg.includes('limit')) return "limit_reached";
    return "unknown_error";
};

export const getTravelAdvice = async (query: string): Promise<string> => {
  const cacheKey = `advice_v3_${query.trim().toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
        temperature: 0.7,
        maxOutputTokens: 500, 
      },
    });
    
    const text = response.text || "Lo siento, no pude procesar tu consulta.";
    saveToCache(cacheKey, text);
    return text;
  } catch (error: any) {
    if (handleGeminiError(error, "advice") === "limit_reached") return "IA en mantenimiento. Intenta pronto.";
    return "Error de conexión. 🔌";
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Caption para Instagram en ${location}: ${details}. Emojis y hashtags.`,
    });
    return response.text || "";
  } catch (error) {
    return `Disfrutando de Manabí 🇪🇨✨`;
  }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Info JSON de ${name} en ${location} (${category}). JSON exacto: {description, fullDescription, highlights:[], travelTips:[], coordinates:{latitude,longitude}}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { description: "Un lugar mágico.", highlights: [], travelTips: [] };
  }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Itinerario para ${days} días en ${destination}. Presupuesto ${budget}.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            days: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { morning: { type: Type.STRING }, afternoon: { type: Type.STRING }, night: { type: Type.STRING } } } }
          }
        }
      }
    });
    return JSON.parse(response.text);
  } catch (error: any) {
    throw new Error("No se pudo generar.");
  }
};

export const findNearbyPlaces = async (lat: number, lng: number, query?: string): Promise<{ places: any[] }> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Lugares de ${query || 'interés'} cerca de Lat:${lat}, Lng:${lng}. JSON: {places:[{name,category,isOpen,rating,address,description}]}`,
            config: {
                tools: [{googleMaps: {}}],
                toolConfig: { retrievalConfig: { latLng: { latitude: lat, longitude: lng } } }
            },
        });
        const data = JSON.parse(response.text);
        return { places: data.places || [] };
    } catch (error: any) {
        return { places: [] };
    }
};
