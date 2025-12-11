
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

// Prompt Optimizado para claridad, concisión y valor agregado (Tips Locales)
const ECUADOR_SYSTEM_INSTRUCTION = `
Eres el 'Guía Virtual' de Ecuador Travel, experto en turismo nacional.
TU MISIÓN: Inspirar y guiar a los viajeros con respuestas rápidas, visuales y útiles.

PAUTAS DE RESPUESTA:
1. **BREVEDAD:** Respuestas cortas y directas (ideal para móvil). Evita párrafos largos.
2. **FORMATO VISUAL:**
   - Usa **negritas** para nombres de lugares y platos.
   - Usa listas con viñetas (•) para enumerar actividades.
   - Emojis obligatorios para dar vida (📍, 🍲, 🎒, 💡).
3. **VALOR AGREGADO:**
   - Siempre incluye un **"💡 Tip Local"** o **"Dato Curioso"** (ej: mejor hora para ir, precio aproximado, plato secreto).
   - Si preguntan por un lugar, menciona brevemente la provincia y el clima.
4. **TONO:** Cálido, ecuatoriano (puedes usar "chévere", "full recomendado" con moderación) y servicial.

EJEMPLO DE RESPUESTA IDEAL:
"📍 **Manta, Manabí** (Clima cálido ☀️)
Es conocida como la capital del atún, con playas increíbles y excelente gastronomía.

• **Playa Murciélago:** Ideal para relax y cerca del Malecón Escénico.
• **San Mateo:** Perfecta para ver atardeceres y hacer kitesurf.
• 🍲 **Imperdible:** Prueba el **Viche de Pescado** o el Camotillo.

💡 **Tip Local:** Ve a la playa de Santa Marianita (a 20 min) si buscas menos gente y mejores vientos para deportes acuáticos."
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
  const cacheKey = `advice_v3_${query.trim().toLowerCase()}`; // v3 para invalidar caché anterior con el nuevo prompt
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: ECUADOR_SYSTEM_INSTRUCTION,
        temperature: 0.6, // Un poco más bajo para seguir mejor la estructura
        maxOutputTokens: 600, 
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

// --- GOOGLE MAPS GROUNDING OPTIMIZADO PARA UI SEGMENTADA ---

export const findNearbyPlaces = async (lat: number, lng: number, specificQuery?: string): Promise<{ places: any[] }> => {
    // Redondear para caché eficiente
    const roundedLat = lat.toFixed(3);
    const roundedLng = lng.toFixed(3);
    const queryKey = specificQuery ? specificQuery.trim().toLowerCase().replace(/\s/g, '_') : 'general';
    const currentTime = new Date().toLocaleTimeString('es-EC', { hour: '2-digit', minute: '2-digit' });
    // Versión 8: Prompt ajustado para búsqueda de 30km
    const cacheKey = `nearby_v8_${queryKey}_${roundedLat}_${roundedLng}`; 
    
    const cached = getFromCache(cacheKey);
    if (cached) return cached;

    try {
        let prompt = "";

        if (specificQuery) {
            // PROMPT ESPECÍFICO (Búsqueda General en Ecuador)
            // Se instruye a la IA para buscar en todo Ecuador si la consulta lo requiere, usando Lat/Lng solo como referencia inicial.
            prompt = `
                Usa Google Maps para buscar lugares que coincidan con: "${specificQuery}" dentro de ECUADOR.
                
                Instrucciones:
                1. Si la búsqueda es un lugar específico (ej: "Montañita", "Cotopaxi"), busca ese lugar exacto en Ecuador, sin importar la distancia a las coordenadas actuales.
                2. Si la búsqueda es genérica (ej: "Restaurantes", "Gasolinera"), busca opciones cercanas a Lat: ${lat}, Lng: ${lng}.
                3. Prioriza lugares turísticos populares si hay ambigüedad.
                
                Devuelve una lista con los mejores resultados (máximo 10).
                
                IMPORTANTE: Devuelve SOLAMENTE un JSON válido con esta estructura:
                {
                  "places": [
                    {
                       "name": "Nombre exacto del lugar",
                       "category": "SERVICIO" o "COMIDA" o "HOSPEDAJE" o "TURISMO",
                       "isOpen": true/false (Estimado según hora ${currentTime}),
                       "rating": 4.5 (Número),
                       "address": "Dirección corta (Ciudad/Provincia)",
                       "description": "Breve descripción de qué es"
                    }
                  ]
                }
            `;
        } else {
            // PROMPT GENERAL (Botón "¿Qué hay cerca?")
            // OPTIMIZACIÓN: Radio de 30km y mayor precisión
            prompt = `
                Actúa como un radar turístico local de alta precisión usando Google Maps.
                Busca lugares de interés, restaurantes, hoteles y servicios útiles en un radio EXACTO de 30 KM alrededor de las coordenadas Lat: ${lat}, Lng: ${lng}.
                
                Instrucciones:
                1. Busca dentro de los 30km a la redonda.
                2. Prioriza lugares turísticos destacados y restaurantes populares.
                3. Intenta encontrar al menos 10 lugares variados (Comida, Turismo, Hospedaje).
                4. Sé preciso con la dirección y el estado "Abierto/Cerrado".
                
                IMPORTANTE: Devuelve SOLAMENTE un JSON válido con esta estructura:
                {
                  "places": [
                    {
                       "name": "Nombre oficial exacto",
                       "category": "TURISMO" o "COMIDA" o "HOSPEDAJE" o "SERVICIO",
                       "isOpen": true/false (Estimado según hora ${currentTime}),
                       "rating": 4.5 (Número),
                       "address": "Dirección específica (Calle/Sector, Ciudad)",
                       "description": "Qué es (ej: 'Playa popular', 'Restaurante de mariscos')"
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
                }
            },
        });

        let text = response.text || "{}";
        
        // Limpieza agresiva del JSON
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
