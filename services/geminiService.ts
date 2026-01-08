
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
`;

const CHAT_COPILOT_INSTRUCTION = `
Eres el "Copiloto IA de Manabí Social". Tu función es leer el contexto de un chat y sugerir acciones rápidas.
Analiza si están hablando de tomar decisiones y ofrece opciones para una encuesta.
`;

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
    return "Error de conexión con el guía virtual. 🔌";
  }
};

export const getChatCopilotSuggestions = async (lastMessages: string[]): Promise<{suggestions: string[], sentiment: string, theme?: string, pollPrompt?: string}> => {
    try {
        const history = lastMessages.join("\n");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analiza este chat y dame sugerencias, un tema visual (sand|ocean|forest|bonfire) y un prompt para una encuesta si están indecisos. \n${history}`,
            config: {
                systemInstruction: CHAT_COPILOT_INSTRUCTION,
                responseMimeType: "application/json"
            }
        });
        return JSON.parse(response.text);
    } catch (e) {
        return { suggestions: ["Planear almuerzo", "Clima"], sentiment: "calm" };
    }
};

export const getChatCatchUp = async (messages: string[]): Promise<string> => {
    try {
        const history = messages.join("\n");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Resume lo más importante de estos mensajes que el usuario se perdió. Enfócate en decisiones tomadas, lugares acordados y fechas. Sé muy breve. \n${history}`,
            config: { systemInstruction: "Eres un asistente de viajes ultra eficiente." }
        });
        return response.text || "No hay mucho que resumir.";
    } catch (e) {
        return "Error al generar resumen.";
    }
};

export const analyzeTravelImage = async (base64Image: string): Promise<{title: string, info: string, category: string, isReceipt?: boolean, amount?: number}> => {
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1]
            }
        };
        const prompt = "Analiza esta imagen desde una perspectiva turística de Ecuador. ¿Qué es? Si es un recibo, extrae el total. JSON: {title, info, category, isReceipt: boolean, amount: number}";
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch (e) {
        return { title: "Imagen", info: "Detalles no disponibles.", category: "desconocido" };
    }
};

export const getPlaceLiveContext = async (text: string): Promise<{placeName: string, weather: string, temp: string, status: string} | null> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Busca si en este texto se menciona un lugar de Ecuador: "${text}". JSON: {placeName, weather, temp, status}`,
            config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(response.text);
        return data.placeName ? data : null;
    } catch (e) {
        return null;
    }
};

export const translateTravelMessage = async (text: string, targetLang: string = "español"): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Traduce este mensaje de viaje a ${targetLang}: "${text}"`,
        });
        return response.text || text;
    } catch (e) {
        return text;
    }
};

export const processVoiceAction = async (transcription: string): Promise<{action: 'add_expense' | 'add_checklist' | 'none', data: any}> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analiza esta orden: "${transcription}". JSON: {action, data: {amount, desc, item}}`,
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch (e) {
        return { action: 'none', data: null };
    }
};

export const generatePackingList = async (context: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `8 cosas esenciales para: ${context}. JSON: { "items": ["item1", ...] }`,
            config: { responseMimeType: "application/json" }
        });
        const data = JSON.parse(response.text);
        return data.items || [];
    } catch (e) {
        return ["Bloqueador", "Agua", "Cámara"];
    }
};

export const transcribeAndSummarizeAudio = async (base64Audio: string): Promise<{transcription: string, summary: string}> => {
    try {
        const audioPart = { inlineData: { mimeType: 'audio/webm', data: base64Audio.split(',')[1] } };
        const prompt = "Transcribe y resume en una oración. JSON: {transcription, summary}";
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [audioPart, { text: prompt }] },
            config: { responseMimeType: "application/json" }
        });
        return JSON.parse(response.text);
    } catch (e) {
        return { transcription: "Error", summary: "Error" };
    }
};

export const summarizeChatHistory = async (messages: string[]): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Resume en 3 puntos: \n${messages.join("\n")}`,
        });
        return response.text || "Sin resumen.";
    } catch (e) {
        return "Error.";
    }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Caption para ${location}: ${details}.`,
    });
    return response.text || "";
  } catch (error) {
    return `Manabí 🇪🇨`;
  }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Info JSON de ${name}. {description, fullDescription, highlights:[], travelTips:[], coordinates:{latitude,longitude}}`,
      config: { responseMimeType: "application/json" }
    });
    return JSON.parse(response.text);
  } catch (error) {
    return { description: "Mágico.", highlights: [], travelTips: [] };
  }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Itinerario para ${days} días en ${destination}.`,
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
    throw new Error("Error.");
  }
};
