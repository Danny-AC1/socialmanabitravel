
import { GoogleGenAI, Type } from "@google/genai";

// Guideline: Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
// Guideline: The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- SISTEMA DE CACHÉ SIMPLE ---
const memoryCache: Record<string, any> = {};

const getFromCache = (key: string) => {
    return memoryCache[key];
};

const saveToCache = (key: string, data: any) => {
    memoryCache[key] = data;
};

// Prompt Restaurado: Más natural, amable y conversacional (Estilo Original)
const ECUADOR_SYSTEM_INSTRUCTION = `
Eres un guía turístico experto y amigable de Ecuador.
Tu objetivo es ayudar a los viajeros a descubrir los maravillosos destinos de las 4 regiones: Costa, Sierra, Amazonía y Galápagos.

Personalidad:
- Amable, entusiasta y servicial.
- Tus respuestas deben ser breves y fáciles de leer en un celular.
- Usa emojis para dar vida a la conversación, pero sin exagerar.

Si te piden recomendaciones:
- Sugiere lugares específicos.
- Menciona brevemente por qué vale la pena visitarlos.
- Si es relevante, menciona algún plato típico.

Importante: Responde siempre en español y con un tono acogedor.
`;

const handleGeminiError = (error: any, context: string): string => {
    console.error(`Error en Gemini (${context}):`, error);
    const msg = error.message || JSON.stringify(error);
    
    if (msg.includes('429') || msg.includes('quota') || msg.includes('limit') || msg.includes('resource_exhausted')) {
        return "limit_reached";
    }
    return "unknown_error";
};

export const getTravelAdvice = async (query: string): Promise<string> => {
  // Cache key actualizado para invalidar versiones anteriores
  const cacheKey = `advice_restored_v1_${query.trim().toLowerCase()}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
        temperature: 0.7, // Temperature un poco más alta para creatividad natural
        maxOutputTokens: 500, 
      },
    });
    
    const text = response.text || "Lo siento, no pude procesar tu consulta. Intenta ser más específico sobre qué lugar de Ecuador quieres visitar.";
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
    return `Disfrutando de las maravillas de ${location} 🇪🇨✨ #EcuadorTravel #Viajes`;
  }
};

export const generateDestinationDetails = async (name: string, location: string, category: string): Promise<any> => {
  // Use a unique cache key
  const cacheKey = `dest_v3_${name}_${location}`.toLowerCase().replace(/\s/g, '');
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  // Fallback vacío intencional para obligar al usuario a escribir si falla, en lugar de guardar basura.
  const fallbackData = {
    description: "",
    fullDescription: "",
    highlights: [],
    travelTips: [],
    coordinates: { latitude: -1.8312, longitude: -78.1834 }
  };

  const prompt = `
    Actúa como una ENCICLOPEDIA TURÍSTICA EXPERTA de Ecuador.
    Genera información turística real y detallada sobre: "${name}" ubicado en "${location}" (Categoría: ${category}).
    
    Si el lugar no es muy conocido, infiere la información basándote en la ubicación geográfica (${location}) y la categoría (${category}), pero sé honesto.

    Devuelve SOLAMENTE un objeto JSON válido con esta estructura exacta (sin markdown de código):
    {
      "description": "Resumen atractivo de máximo 200 caracteres.",
      "fullDescription": "Descripción detallada de al menos 3 párrafos sobre historia, clima, qué hacer y por qué visitar.",
      "highlights": ["Punto destacado 1", "Plato típico", "Actividad"],
      "travelTips": ["Consejo de ropa", "Mejor época", "Acceso"],
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
    // Limpieza agresiva para asegurar JSON válido
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Buscar inicio y fin del objeto JSON por si hay texto extra
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1) {
        text = text.substring(firstBrace, lastBrace + 1);
    }

    if (!text || text === '{}') return fallbackData;

    const data = JSON.parse(text);
    
    // Validar que tenga datos mínimos
    if (!data.description) data.description = `Un destino increíble en ${location}.`;
    
    saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    handleGeminiError(error, "generateDestinationDetails");
    // Retornamos fallback vacío para que el usuario llene los datos en el modal
    return fallbackData;
  }
};

export const generateItinerary = async (destination: string, days: number, budget: string): Promise<any> => {
  const cacheKey = `itinerary_v2_${destination}_${days}_${budget}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const prompt = `
      Crea un itinerario turístico detallado para ${days} días en ${destination}, Ecuador.
      Presupuesto: ${budget}.
      
      IMPORTANTE:
      Para cada sección del día (morning, afternoon, night), proporciona una lista de actividades con HORARIOS ESPECÍFICOS.
      Formato esperado dentro del texto:
      "08:00 AM - Desayuno en [Lugar]... \n 10:00 AM - Visita a [Lugar]..."
      Usa saltos de línea (\n) para separar cada actividad horaria.
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
                  morning: { type: Type.STRING, description: "Lista de actividades de la mañana con horarios (ej: '08:00 - Actividad...')" },
                  afternoon: { type: Type.STRING, description: "Lista de actividades de la tarde con horarios (ej: '13:00 - Almuerzo...')" },
                  night: { type: Type.STRING, description: "Lista de actividades de la noche con horarios (ej: '20:00 - Cena...')" }
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

// --- GOOGLE MAPS GROUNDING (MODO RADAR LOCAL ESTRICTO) ---

export const findNearbyPlaces = async (lat: number, lng: number, specificQuery?: string): Promise<{ places: any[] }> => {
    // Redondear para caché eficiente
    const roundedLat = lat.toFixed(3);
    const roundedLng = lng.toFixed(3);
    const queryKey = specificQuery ? specificQuery.trim().toLowerCase().replace(/\s/g, '_') : 'general';
    const currentTime = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    
    // Cache Key V9: Búsqueda estricta local
    const cacheKey = `nearby_local_v9_${queryKey}_${roundedLat}_${roundedLng}`; 
    
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        // PROMPT ESTRICTO DE RADIO 30KM
        // Se elimina la lógica que permitía buscar en todo el país.
        const prompt = `
            Actúa como un radar local de alta precisión.
            Busca: "${specificQuery || 'lugares de interés'}" usando Google Maps.
            
            REGLAS CRÍTICAS DE BÚSQUEDA:
            1. **RADIO ESTRICTO:** Busca SOLAMENTE en un radio de 30 KM alrededor de las coordenadas Lat: ${lat}, Lng: ${lng}.
            2. **PROHIBIDO:** No devuelvas resultados de otras ciudades o provincias lejanas, aunque coincidan con el nombre. Si no hay nada cerca, devuelve una lista vacía.
            3. Prioriza lugares abiertos ahora (${currentTime}).
            
            IMPORTANTE: Devuelve SOLAMENTE un JSON válido con esta estructura:
            {
              "places": [
                {
                   "name": "Nombre oficial exacto",
                   "category": "TURISMO" o "COMIDA" o "HOSPEDAJE" o "SERVICIO",
                   "isOpen": true/false (Estimado),
                   "rating": 4.5 (Número),
                   "address": "Dirección específica (Calle/Sector)",
                   "description": "Qué es (ej: 'Playa popular a 5km', 'Restaurante de mariscos')"
                }
              ]
            }
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
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

        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        
        const firstBrace = text.indexOf('{');
        const lastBrace = text.lastIndexOf('}');
        
        if (firstBrace !== -1 && lastBrace !== -1) {
            text = text.substring(firstBrace, lastBrace + 1);
        }

        let data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error("Error parseando JSON de lugares:", text);
            return { places: [] };
        }

        const placesWithLinks = (data.places || []).map((p: any) => ({
            ...p,
            mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.address)}`
        }));

        const result = { places: placesWithLinks };
        
        if (placesWithLinks.length > 0) {
            saveToCache(cacheKey, result);
        }
        
        return result;

    } catch (error: any) {
        const errorType = handleGeminiError(error, "findNearbyPlaces");
        return { places: [] };
    }
};
