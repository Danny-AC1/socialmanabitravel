
import { GoogleGenAI, Type } from "@google/genai";

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

// Basic Text Task: Use gemini-3-flash-preview
export const getTravelAdvice = async (query: string): Promise<string> => {
  const cacheKey = `advice_v3_${query.trim().toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Instantiate GoogleGenAI inside function to ensure up-to-date API key usage
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    
    // Access text property directly
    const text = response.text || "Lo siento, no pude procesar tu consulta.";
    saveToCache(cacheKey, text);
    return text;
  } catch (error: any) {
    return "Error de conexión con el guía virtual. 🔌";
  }
};

// Complex Text Task: Use gemini-3-pro-preview and add responseSchema
export const getChatCopilotSuggestions = async (lastMessages: string[]): Promise<{suggestions: string[], sentiment: string, theme?: string, pollPrompt?: string}> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const history = lastMessages.join("\n");
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Analiza este chat y dame sugerencias, un tema visual (sand|ocean|forest|bonfire) y un prompt para una encuesta si están indecisos. \n${history}`,
            config: {
                systemInstruction: CHAT_COPILOT_INSTRUCTION,
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
                    sentiment: { type: Type.STRING },
                    theme: { type: Type.STRING },
                    pollPrompt: { type: Type.STRING }
                  },
                  required: ["suggestions", "sentiment"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { suggestions: ["Planear almuerzo", "Clima"], sentiment: "calm" };
    }
};

export const getChatCatchUp = async (messages: string[]): Promise<string> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const history = messages.join("\n");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Resume esta conversación de un grupo de viajeros que planean visitar Ecuador. 
            Identifica:
            1. Decisiones ya tomadas (destinos, fechas).
            2. Cosas aún pendientes por acordar.
            3. Ambiente general (emocionados, indecisos, etc).
            Sé muy breve, usa emojis y puntos clave. Máximo 100 palabras. \n${history}`,
            config: { systemInstruction: "Eres un asistente de viajes ultra eficiente capaz de resumir planes de grupos rápidamente." }
        });
        return response.text || "No hay mucho que resumir por ahora.";
    } catch (e) {
        return "No pude generar el resumen en este momento.";
    }
};

// Multimodal Task: Use gemini-3-pro-preview for analysis and add schema
export const analyzeTravelImage = async (base64Image: string): Promise<{title: string, info: string, category: string, isReceipt?: boolean, amount?: number}> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1]
            }
        };
        const prompt = `
        Analiza esta imagen como un guía local de Manabí, Ecuador. 
        Dime qué es, su importancia cultural o natural y clasifícala. 
        Sé poético y descriptivo pero breve.
        `;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    info: { type: Type.STRING },
                    category: { type: Type.STRING, description: "PLAYA|GASTRONOMIA|NATURALEZA|CULTURA" }
                  },
                  required: ["title", "info", "category"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { title: "Lugar Increíble", info: "La luz y el ambiente capturan la esencia de Ecuador perfectamente.", category: "EXPLORACION" };
    }
};

export const getPlaceLiveContext = async (text: string): Promise<{placeName: string, weather: string, temp: string, status: string} | null> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Simula datos en tiempo real (clima, temperatura estimada hoy) si este texto menciona un lugar de Ecuador: "${text}".`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    placeName: { type: Type.STRING },
                    weather: { type: Type.STRING },
                    temp: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ["placeName", "weather", "temp", "status"]
                }
            }
        });
        const data = JSON.parse(response.text || "{}");
        return data.placeName ? data : null;
    } catch (e) {
        return null;
    }
};

export const translateTravelMessage = async (text: string, targetLang: string = "español"): Promise<string> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: `Analiza esta orden: "${transcription}".`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    action: { type: Type.STRING, description: "add_expense|add_checklist|none" },
                    data: { 
                      type: Type.OBJECT,
                      properties: {
                        amount: { type: Type.NUMBER },
                        desc: { type: Type.STRING },
                        item: { type: Type.STRING }
                      }
                    }
                  },
                  required: ["action"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { action: 'none', data: null };
    }
};

export const generatePackingList = async (context: string): Promise<string[]> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `8 cosas esenciales para: ${context}.`,
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    items: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ["items"]
                }
            }
        });
        const data = JSON.parse(response.text || "{}");
        return data.items || [];
    } catch (e) {
        return ["Bloqueador", "Agua", "Cámara"];
    }
};

// Use gemini-2.5-flash-native-audio-preview-12-2025 for audio tasks
export const transcribeAndSummarizeAudio = async (base64Audio: string): Promise<{transcription: string, summary: string}> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const audioPart = { inlineData: { mimeType: 'audio/webm', data: base64Audio.split(',')[1] } };
        const prompt = "Transcribe y resume en una oración.";
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            contents: { parts: [audioPart, { text: prompt }] },
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    transcription: { type: Type.STRING },
                    summary: { type: Type.STRING }
                  },
                  required: ["transcription", "summary"]
                }
            }
        });
        return JSON.parse(response.text || "{}");
    } catch (e) {
        return { transcription: "Error", summary: "Error" };
    }
};

export const summarizeChatHistory = async (messages: string[]): Promise<string> => {
    // Instantiate GoogleGenAI inside function
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  // Instantiate GoogleGenAI inside function
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
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
  // Instantiate GoogleGenAI inside function
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Info de ${name}.`,
      config: { 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              description: { type: Type.STRING },
              fullDescription: { type: Type.STRING },
              highlights: { type: Type.ARRAY, items: { type: Type.STRING } },
              travelTips: { type: Type.ARRAY, items: { type: Type.STRING } },
              coordinates: {
                type: Type.OBJECT,
                properties: {
                  latitude: { type: Type.NUMBER },
                  longitude: { type: Type.NUMBER }
                },
                required: ["latitude", "longitude"]
              }
            },
            required: ["description", "fullDescription", "highlights", "travelTips"]
          }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error) {
    return { description: "Mágico.", highlights: [], travelTips: [] };
  }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
  // Instantiate GoogleGenAI inside function
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Itinerario para ${days} días en ${destination}. Presupuesto: ${budget}`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            duration: { type: Type.STRING },
            budget: { type: Type.STRING },
            days: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT, 
                properties: { 
                  morning: { type: Type.STRING }, 
                  afternoon: { type: Type.STRING }, 
                  night: { type: Type.STRING } 
                },
                required: ["morning", "afternoon", "night"]
              } 
            }
          },
          required: ["title", "duration", "budget", "days"],
          propertyOrdering: ["title", "duration", "budget", "days"]
        }
      }
    });
    return JSON.parse(response.text || "{}");
  } catch (error: any) {
    throw new Error("Error.");
  }
};
