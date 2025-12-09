
import { GoogleGenAI, Type } from "@google/genai";

// Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// Guideline: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SISTEMA DE CACHÉ SIMPLE ---
// Esto evita llamar a la IA repetidamente por la misma información.
const memoryCache: Record<string, any> = {};

const getFromCache = (key: string) => {
    return memoryCache[key];
};

const saveToCache = (key: string, data: any) => {
    memoryCache[key] = data;
};

const ECUADOR_SYSTEM_INSTRUCTION = `Eres el guía turístico oficial de 'Ecuador Travel'.
Tu misión es promocionar el turismo en las 4 regiones del Ecuador: Costa, Sierra, Amazonía e Insular (Galápagos).
Tu tono es amigable, entusiasta y experto. Usas emojis de banderas de Ecuador, plantas y animales.
Si te preguntan por un lugar específico, da datos reales sobre ubicación, comida típica y qué hacer.
Responde siempre en español. Sé conciso pero útil.`;

const handleGeminiError = (error: any, context: string): string => {
    console.error(`Error en Gemini (${context}):`, error);
    const msg = error.message || JSON.stringify(error);
    
    if (msg.includes('429') || msg.includes('quota') || msg.includes('limit') || msg.includes('resource_exhausted')) {
        return "limit_reached";
    }
    return "unknown_error";
};

export const getTravelAdvice = async (query: string): Promise<string> => {
  // Check Cache
  const cacheKey = `advice_${query.trim().toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
      },
    });
    
    const text = response.text || "Lo siento, me quedé sin palabras. Intenta de nuevo.";
    
    // Save to Cache
    saveToCache(cacheKey, text);
    
    return text;
  } catch (error: any) {
    const errorType = handleGeminiError(error, "getTravelAdvice");
    
    if (errorType === "limit_reached") {
        return "🐢 ¡Vaya! He recibido demasiadas consultas hoy y mi energía de IA se está recargando. Por favor, intenta de nuevo en unos minutos.";
    }
    
    return "Lo siento, estoy teniendo problemas de conexión con el servidor de turismo. Intenta más tarde. 🔌";
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  const cacheKey = `caption_${location}_${details}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `Escribe un pie de foto (caption) corto, inspirador y atractivo para Instagram sobre una foto en ${location}, Ecuador. Contexto: ${details}. Usa emojis y hashtags.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    const text = response.text || "";
    if (text) saveToCache(cacheKey, text);
    
    return text;
  } catch (error) {
    handleGeminiError(error, "generateCaption");
    // Fallback simple
    return `Disfrutando de las maravillas de ${location} 🇪🇨✨ #EcuadorTravel #Viajes`;
  }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  // Check Cache para destinos completos (Esto ahorra mucha cuota)
  const cacheKey = `dest_${name}_${location}`.toLowerCase().replace(/\s/g, '');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const fallbackData = {
    description: `Un hermoso lugar para visitar en ${location}.`,
    fullDescription: `Disfruta de la experiencia única que ofrece ${name}. Este destino ubicado en ${location} es ideal para los amantes de ${category}. (Información generada automáticamente por falta de conexión a IA).`,
    highlights: ["Paisajes increíbles", "Gastronomía local", "Fotos únicas"],
    travelTips: ["Lleva ropa cómoda", "No olvides tu cámara", "Hidrátate bien"],
    coordinates: { latitude: -1.8312, longitude: -78.1834 }
  };

  const prompt = `
    Actúa como una ENCICLOPEDIA TURÍSTICA EXPERTA Y RIGUROSA de Ecuador.
    Genera un objeto JSON válido con información turística 100% REAL, PRECISA y DETALLADA sobre: "${name}" ubicado en "${location}" (Categoría: ${category}).
    
    REQUISITOS OBLIGATORIOS:
    1. La 'fullDescription' debe ser EXTENSA (Mínimo 15 líneas de texto o 4 párrafos completos).
    2. Incluye datos históricos reales, geografía exacta, biodiversidad específica (flora/fauna) y datos culturales precisos.
    3. Incluye las COORDENADAS GEOGRÁFICAS (latitude, longitude) más precisas posibles del lugar.
    
    El JSON debe tener EXACTAMENTE esta estructura:
    {
      "description": "Resumen atractivo de máximo 200 caracteres para la tarjeta.",
      "fullDescription": "Descripción profunda, educativa y detallada de más de 300 palabras. Debe cubrir historia, qué ver, importancia ecológica y cultura.",
      "highlights": ["Dato preciso 1", "Plato típico real del lugar", "Actividad específica", "Punto de interés exacto"],
      "travelTips": ["Consejo de clima/ropa específico", "Mejor época real de visita", "Consejo de seguridad o acceso"],
      "coordinates": { "latitude": 0.0, "longitude": 0.0 }
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    if (!text || text === '{}') return fallbackData;

    const data = JSON.parse(text);
    saveToCache(cacheKey, data); // Guardar en caché si fue exitoso
    return data;

  } catch (error) {
    handleGeminiError(error, "generateDestinationDetails");
    return fallbackData;
  }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
  const cacheKey = `itinerary_${destination}_${days}_${budget}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      Crea un itinerario turístico detallado para ${days} días en ${destination}, Ecuador.
      Presupuesto: ${budget}.
      Incluye lugares reales, platos típicos y consejos.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Título atractivo del viaje" },
            duration: { type: Type.STRING, description: "Duración (ej: 3 Días)" },
            budget: { type: Type.STRING, description: "Presupuesto seleccionado" },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  morning: { type: Type.STRING, description: "Actividad detallada de mañana" },
                  afternoon: { type: Type.STRING, description: "Actividad detallada de tarde" },
                  night: { type: Type.STRING, description: "Actividad detallada de noche" }
                }
              }
            }
          }
        }
      }
    });
    
    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const data = JSON.parse(text);
    
    saveToCache(cacheKey, data);
    return data;

  } catch (error: any) {
    const errorType = handleGeminiError(error, "generateItinerary");
    if (errorType === "limit_reached") {
        throw new Error("El servicio de IA está saturado en este momento. Intenta más tarde.");
    }
    throw new Error("No pudimos generar el itinerario. Intenta de nuevo.");
  }
};

// --- NEW FUNCTION: GOOGLE MAPS GROUNDING ---

export const findNearbyPlaces = async (lat: number, lng: number): Promise<{text: string, places: any[]}> => {
    // Round coords to avoid cache missing on micro-movements (approx 100m radius)
    const roundedLat = lat.toFixed(3);
    const roundedLng = lng.toFixed(3);
    const cacheKey = `nearby_${roundedLat}_${roundedLng}`;
    
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: "Recomienda 4 lugares interesantes (turismo o comida) muy cerca de mi ubicación actual. Sé breve, incluye calificación si existe y por qué ir.",
            config: {
                tools: [{googleMaps: {}}],
                toolConfig: {
                    retrievalConfig: {
                        latLng: {
                            latitude: lat,
                            longitude: lng
                        }
                    }
                }
            },
        });

        // Extraer Grounding Chunks (Enlaces a mapas)
        const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
        const places = chunks
            .filter((c: any) => c.web?.uri || c.web?.title)
            .map((c: any) => ({
                title: c.web?.title || "Ver en Mapa",
                uri: c.web?.uri
            }));

        const result = {
            text: response.text || "No encontré información cercana.",
            places: places
        };
        
        saveToCache(cacheKey, result);
        return result;

    } catch (error: any) {
        const errorType = handleGeminiError(error, "findNearbyPlaces");
        
        if (errorType === "limit_reached") {
             return {
                text: "⚠️ El radar turístico está recargando energía (Límite de cuota alcanzado). Por favor intenta en unos minutos.",
                places: []
            };
        }

        return {
            text: "No pudimos conectar con el servicio de mapas en este momento.",
            places: []
        };
    }
};
