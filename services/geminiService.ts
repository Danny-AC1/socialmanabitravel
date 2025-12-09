
import { GoogleGenAI, Type } from "@google/genai";

// Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// Guideline: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const ECUADOR_SYSTEM_INSTRUCTION = `Eres el guía turístico oficial de 'Ecuador Travel'.
Tu misión es promocionar el turismo en las 4 regiones del Ecuador: Costa, Sierra, Amazonía e Insular (Galápagos).
Tu tono es amigable, entusiasta y experto. Usas emojis de banderas de Ecuador, plantas y animales.
Si te preguntan por un lugar específico, da datos reales sobre ubicación, comida típica y qué hacer.
Responde siempre en español. Sé conciso pero útil.`;

export const getTravelAdvice = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
      },
    });
    
    return response.text || "Lo siento, me quedé sin palabras. Intenta de nuevo.";
  } catch (error: any) {
    console.error("Error detallado de Gemini:", error);
    
    // MENSAJES DE DIAGNÓSTICO REALES
    const errorMsg = error.message || JSON.stringify(error);

    if (errorMsg.includes('API key not valid')) {
       return `🔑 Error: Google dice que la clave no es válida. \n(Detalle: ${errorMsg})`;
    }
    
    if (errorMsg.includes('not enabled')) {
       return `🛑 Error: La API 'Generative Language' no está activada en tu cuenta de Google Cloud. \n(Ve a console.cloud.google.com y actívala).`;
    }

    if (errorMsg.includes('403')) {
       return `🚫 Error 403: Permiso denegado. Posiblemente tu clave tiene restricciones de IP que bloquean a Vercel. Crea una clave SIN restricciones.`;
    }
    
    return `⚠️ Ocurrió un error técnico: ${errorMsg.substring(0, 100)}...`;
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  try {
    const prompt = `Escribe un pie de foto (caption) corto, inspirador y atractivo para Instagram sobre una foto en ${location}, Ecuador. Contexto: ${details}. Usa emojis y hashtags.`;
    
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

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  const fallbackData = {
    description: `Un hermoso lugar para visitar en ${location}.`,
    fullDescription: `Disfruta de la experiencia única que ofrece ${name}. Este destino ubicado en ${location} es ideal para los amantes de ${category}.`,
    highlights: ["Paisajes increíbles", "Gastronomía local", "Fotos únicas"],
    travelTips: ["Lleva ropa cómoda", "No olvides tu cámara", "Hidrátate bien"],
    coordinates: { latitude: -1.8312, longitude: -78.1834 } // Centro de Ecuador aprox
  };

  const prompt = `
    Actúa como una ENCICLOPEDIA TURÍSTICA EXPERTA Y RIGUROSA de Ecuador.
    Genera un objeto JSON válido con información turística 100% REAL, PRECISA y DETALLADA sobre: "${name}" ubicado en "${location}" (Categoría: ${category}).
    
    REQUISITOS OBLIGATORIOS:
    1. La 'fullDescription' debe ser EXTENSA (Mínimo 15 líneas de texto o 4 párrafos completos).
    2. Incluye datos históricos reales, geografía exacta, biodiversidad específica (flora/fauna) y datos culturales precisos.
    3. Incluye las COORDENADAS GEOGRÁFICAS (latitude, longitude) más precisas posibles del lugar.
    4. NO inventes información. Si es un lugar histórico, menciona fechas. Si es natural, menciona especies reales.
    
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
    // Limpieza CRÍTICA para evitar errores de Markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Verificación extra para evitar JSONs vacíos
    if (!text || text === '{}') return fallbackData;

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating destination details:", error);
    return fallbackData;
  }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
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
    // Limpieza CRÍTICA: Eliminar bloques de código markdown que Gemini a veces añade
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating itinerary:", error);
    throw new Error("No pudimos generar el itinerario. Intenta de nuevo.");
  }
};

// --- NEW FUNCTION: GOOGLE MAPS GROUNDING ---

export const findNearbyPlaces = async (lat: number, lng: number): Promise<{text: string, places: any[]}> => {
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
            .filter((c: any) => c.web?.uri || c.web?.title) // A veces viene como web o maps
            .map((c: any) => ({
                title: c.web?.title || "Ver en Mapa",
                uri: c.web?.uri
            }));

        return {
            text: response.text || "No encontré información cercana.",
            places: places
        };
    } catch (error: any) {
        console.error("Error finding nearby places:", error);
        throw new Error("Error al consultar ubicación: " + (error.message || "Desconocido"));
    }
};