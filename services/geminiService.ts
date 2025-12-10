
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

// Prompt Optimizado para claridad y concisión
const ECUADOR_SYSTEM_INSTRUCTION = `
Eres el 'Guía Experto' de la app Ecuador Travel.
TU OBJETIVO: Dar respuestas útiles, directas y visualmente ordenadas sobre turismo en Ecuador.

REGLAS DE ORO:
1. **SÉ CONCISO:** Máximo 3 o 4 oraciones por párrafo. Evita el relleno.
2. **ESTRUCTURA TU RESPUESTA:**
   - Usa listas con viñetas (•) para enumerar lugares o comidas.
   - Usa emojis para categorizar (📍 Ubicación, 💰 Costo, 🍽️ Comida).
3. **DATOS REALES:** Si preguntan por un lugar, menciona siempre: Provincia, Clima promedio y Qué llevar.
4. **TONO:** Amigable y local (puedes usar palabras como "chévere" o "bacán" con moderación), pero profesional.
5. **ALCANCE:** Solo responde sobre turismo en Ecuador. Si preguntan otra cosa, redirige amablemente al tema.

EJEMPLO DE BUENA RESPUESTA:
"📍 **Los Frailes, Manabí**
Es una de las playas más hermosas del país, ubicada dentro del Parque Nacional Machalilla.

• **Qué hacer:** Senderismo al mirador, snorkel y relax.
• 🎒 **Lleva:** Agua, gorra y protector solar (no hay tiendas dentro).
• 🕒 **Horario:** 08:00 - 16:00."
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
  const cacheKey = `advice_v2_${query.trim().toLowerCase()}`; // v2 para invalidar caché anterior
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
        temperature: 0.7, // Un poco más creativo pero controlado
        maxOutputTokens: 500, // Forzar respuestas cortas
      },
    });
    
    const text = response.text || "Lo siento, no pude procesar tu consulta. Intenta ser más específico.";
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
  const cacheKey = `dest_v2_${name}_${location}`.toLowerCase().replace(/\s/g, '');
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
    saveToCache(cacheKey, data);
    return data;
  } catch (error) {
    handleGeminiError(error, "generateDestinationDetails");
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

// --- GOOGLE MAPS GROUNDING OPTIMIZADO PARA UI SEGMENTADA ---

export const findNearbyPlaces = async (lat: number, lng: number, specificQuery?: string): Promise<{ places: any[] }> => {
    // Redondear para caché eficiente
    const roundedLat = lat.toFixed(3);
    const roundedLng = lng.toFixed(3);
    const queryKey = specificQuery ? specificQuery.trim().toLowerCase().replace(/\s/g, '_') : 'general';
    const currentTime = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    const cacheKey = `nearby_v5_${queryKey}_${roundedLat}_${roundedLng}_${currentTime.split(':')[0]}`;
    
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        let prompt = "";

        if (specificQuery) {
            // PROMPT PARA BÚSQUEDA ESPECÍFICA (Hospitales, Farmacias, etc.)
            prompt = `
                Actúa como un radar local. Busca lugares REALES relacionados con "${specificQuery}" alrededor de las coordenadas Lat: ${lat}, Lng: ${lng}.
                La hora actual local es: ${currentTime}.
                
                Encuentra al menos 5 opciones relevantes para la búsqueda "${specificQuery}".
                
                Devuelve un JSON con esta estructura exacta para cada lugar:
                {
                  "places": [
                    {
                       "name": "Nombre real del lugar",
                       "category": "SERVICIO" | "COMIDA" | "HOSPEDAJE" | "TURISMO", (Clasifica según corresponda, ej: Hospital -> SERVICIO)
                       "isOpen": boolean, (Calcula si está abierto según la hora actual ${currentTime})
                       "rating": number, (Ej: 4.5)
                       "address": "Dirección corta o referencia",
                       "description": "Breve descripción relacionada con la búsqueda"
                    }
                  ]
                }
            `;
        } else {
            // PROMPT GENERAL (TURISMO)
            prompt = `
                Actúa como un radar local. Busca lugares REALES alrededor de las coordenadas Lat: ${lat}, Lng: ${lng}.
                La hora actual local es: ${currentTime}.
                
                PRIORIDAD: Encuentra los MEJORES atractivos turísticos cercanos primero.
                
                Debes encontrar lugares en estas categorías:
                1. TURISMO (Playas, miradores, parques, museos, plazas principales) - Mínimo 4 opciones.
                2. COMIDA (Restaurantes típicos, cafeterías populares) - Mínimo 3 opciones.
                3. HOSPEDAJE (Hoteles recomendados, hostales) - Mínimo 2 opciones.
                4. SERVICIOS (Farmacias, supermercados) - Máximo 2 opciones.

                Devuelve un JSON con esta estructura exacta para cada lugar:
                {
                  "places": [
                    {
                       "name": "Nombre real del lugar",
                       "category": "TURISMO" | "COMIDA" | "HOSPEDAJE" | "SERVICIO",
                       "isOpen": boolean, (Calcula si está abierto según la hora actual ${currentTime})
                       "rating": number, (Ej: 4.5)
                       "address": "Dirección corta o referencia",
                       "description": "Qué es (Ej: 'Playa famosa', 'Comida Manabita')"
                    }
                  ]
                }
            `;
        }

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
                },
                responseMimeType: "application/json"
            },
        });

        let text = response.text || "{}";
        text = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(text);

        const placesWithLinks = (data.places || []).map((p: any) => ({
            ...p,
            mapLink: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + " " + p.address)}`
        }));

        const result = { places: placesWithLinks };
        saveToCache(cacheKey, result);
        return result;

    } catch (error: any) {
        const errorType = handleGeminiError(error, "findNearbyPlaces");
        
        if (errorType === "limit_reached") {
             return { places: [] }; 
        }

        return { places: [] };
    }
};
