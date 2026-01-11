
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

const DESTINATION_EXPERT_INSTRUCTION = `
Eres un especialista en turismo de la República del Ecuador. 
Tu base de conocimientos se limita ESTRICTAMENTE a la geografía, cultura, biodiversidad y atractivos turísticos de Ecuador.
`;

// Basic Text Task: Use gemini-3-flash-preview
export const getTravelAdvice = async (query: string): Promise<string> => {
  const cacheKey = `advice_v3_${query.trim().toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });
    
    const text = response.text || "Lo siento, no pude procesar tu consulta.";
    saveToCache(cacheKey, text);
    return text;
  } catch (error: any) {
    return "Error de conexión con el guía virtual. 🔌";
  }
};

/**
 * SEARCH NEARBY PLACES (Maps Grounding)
 * Uses Gemini 2.5 Flash to find places within 20km using Google Maps tool.
 */
export const searchNearbyExternalPlaces = async (lat: number, lng: number): Promise<any[]> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Busca en Google Maps y lista exactamente 5 lugares (restaurantes, hoteles o atractivos) en un radio de 20km de mi ubicación actual en las coordenadas (${lat}, ${lng}). 
            Sé muy breve. Formato por línea: "Nombre: Descripción corta".`,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: {
                    retrievalConfig: {
                        latLng: { latitude: lat, longitude: lng }
                    }
                }
            },
        });

        const rawText = String(response.text || "");
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        
        // Procesar las líneas de texto ignorando vacíos y numeraciones de forma segura
        const lines = rawText.split('\n')
            .filter(l => l && typeof l === 'string')
            .map(l => l.trim())
            .filter(l => l.length > 5 && l.includes(':'))
            .slice(0, 5);
        
        if (lines.length === 0) return [];

        return lines.map((line) => {
            const parts = line.split(':');
            const rawName = parts[0].replace(/^\d+[\.\-\)]\s*/, '').trim();
            const cleanName = rawName || "Lugar Sugerido";
            const description = parts.slice(1).join(':').trim() || "Lugar recomendado cerca de tu ubicación.";
            
            // Búsqueda de metadatos ultra segura
            const chunk = Array.isArray(chunks) ? chunks.find((c: any) => {
                const title = String(c?.maps?.title || "").toLowerCase();
                const search = cleanName.toLowerCase().substring(0, 3);
                return title.includes(search) || cleanName.toLowerCase().includes(title.substring(0, 3));
            }) : null;
            
            const lowerLine = line.toLowerCase();
            let category: 'COMIDA' | 'HOSPEDAJE' | 'TURISMO' = 'TURISMO';
            
            if (lowerLine.includes('restaurante') || lowerLine.includes('comida') || lowerLine.includes('gastronom')) {
                category = 'COMIDA';
            } else if (lowerLine.includes('hotel') || lowerLine.includes('hospedaje') || lowerLine.includes('hostal')) {
                category = 'HOSPEDAJE';
            }

            return {
                name: cleanName,
                description: description,
                category: category,
                isOpen: true,
                rating: 4.5,
                address: "Cerca de tu zona",
                mapLink: chunk?.maps?.uri || `https://www.google.com/maps/search/${encodeURIComponent(cleanName)}/@${lat},${lng},15z`,
                isInternal: false
            };
        });
    } catch (e) {
        console.error("Error in Radar AI:", e);
        return [];
    }
};

// Complex Text Task: Use gemini-3-pro-preview and add responseSchema
export const getChatCopilotSuggestions = async (lastMessages: string[]): Promise<{suggestions: string[], sentiment: string, theme?: string, pollPrompt?: string}> => {
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
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        return { suggestions: ["Planear almuerzo", "Clima"], sentiment: "calm" };
    }
};

export const getChatCatchUp = async (messages: string[]): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const history = messages.join("\n");
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Resume esta conversación de viajeros en Ecuador de forma muy breve. \n${history}`,
        });
        return response.text || "No hay mucho que resumir por ahora.";
    } catch (e) {
        return "No pude generar el resumen.";
    }
};

// Multimodal Task
export const analyzeTravelImage = async (base64Image: string): Promise<{title: string, info: string, category: string}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const dataStr = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
        const imagePart = {
            inlineData: {
                mimeType: 'image/jpeg',
                data: dataStr
            }
        };
        const prompt = `Analiza esta imagen de Ecuador. Dime qué es, su importancia y clasifícala (PLAYA|GASTRONOMIA|NATURALEZA|CULTURA).`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: { parts: [imagePart, { text: prompt }] },
            config: { 
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    info: { type: Type.STRING },
                    category: { type: Type.STRING }
                  },
                  required: ["title", "info", "category"]
                }
            }
        });
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        return { title: "Lugar Increíble", info: "La luz y el ambiente capturan la esencia de Ecuador perfectamente.", category: "EXPLORACION" };
    }
};

export const generateCaptionForImage = async (base64Image: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const dataStr = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: dataStr
      }
    };
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: [imagePart, { text: "Escribe una descripción corta y atractiva para esta foto de un viaje en Ecuador. Sé creativo y usa emojis." }] },
    });
    return response.text || "¡Un momento increíble en Ecuador! 🇪🇨";
  } catch (e) {
    return "¡Explorando las maravillas de Ecuador! 🇪🇨";
  }
};

export const getPlaceLiveContext = async (text: string): Promise<{placeName: string, weather: string, temp: string, status: string} | null> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Simula datos climáticos actuales si este texto menciona un lugar de Ecuador: "${text}".`,
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
        const jsonText = response.text || "{}";
        const data = JSON.parse(jsonText);
        return data.placeName ? data : null;
    } catch (e) {
        return null;
    }
};

export const transcribeAndSummarizeAudio = async (base64Audio: string): Promise<{transcription: string, summary: string}> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
        const audioPart = { inlineData: { mimeType: 'audio/webm', data: base64Audio.split(',')[1] } };
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            contents: { parts: [audioPart, { text: "Transcribe el audio y resume el contenido." }] },
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
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        return { transcription: "Error en transcripción", summary: "Error" };
    }
};

export const summarizeChatHistory = async (messages: string[]): Promise<string> => {
    return getChatCatchUp(messages);
};

export const generatePackingList = async (destination: string, duration: string): Promise<string[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Genera una lista de empaque recomendada para un viaje de ${duration} a ${destination}, Ecuador.`,
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
    const text = response.text || "{}";
    const data = JSON.parse(text);
    return data.items || [];
  } catch (e) {
    return ["Cámara", "Protector solar", "Ropa cómoda"];
  }
};

export const translateTravelMessage = async (text: string, targetLang: string): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Traduce el siguiente mensaje relacionado con viajes al idioma ${targetLang}: "${text}"`,
    });
    return response.text || text;
  } catch (e) {
    return text;
  }
};

export const processVoiceAction = async (transcription: string): Promise<{action: string, data?: any}> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza este comando de voz de un viajero y clasifícalo en una acción: "${transcription}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, description: "Posibles valores: SEND_MESSAGE, CREATE_POLL, FIND_NEARBY, UNKNOWN" },
            data: { type: Type.STRING, description: "Cualquier dato extra extraído" }
          },
          required: ["action"]
        }
      }
    });
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    return { action: "UNKNOWN" };
  }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Genera la información turística completa para el destino "${name}" en "${location}", Ecuador.`,
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
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error) {
    return { description: "Un hermoso lugar por descubrir en Ecuador.", highlights: [], travelTips: [] };
  }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Genera un itinerario detallado de ${days} días en ${destination}. Presupuesto: ${budget}. 
      REGLA CRÍTICA: Cada actividad dentro de 'morning', 'afternoon' y 'night' debe comenzar OBLIGATORIAMENTE con una hora específica en formato 12h (ej: "08:30 AM - Desayuno", "02:00 PM - Visita al museo"). 
      Cada actividad debe ir en una línea nueva.`,
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
                    morning: { type: Type.STRING, description: "Actividades con hora (ej: 08:00 AM - ...)" }, 
                    afternoon: { type: Type.STRING, description: "Actividades con hora (ej: 01:00 PM - ...)" }, 
                    night: { type: Type.STRING, description: "Actividades con hora (ej: 07:00 PM - ...)" } 
                },
                required: ["morning", "afternoon", "night"]
              } 
            }
          },
          required: ["title", "duration", "budget", "days"]
        }
      }
    });
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (error: any) {
    throw new Error("No se pudo generar el itinerario.");
  }
};
