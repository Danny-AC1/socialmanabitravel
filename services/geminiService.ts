import { GoogleGenAI } from "@google/genai";

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
    fullDescription: `Disfruta de la experiencia única que ofrece ${name}. Este destino ubicado en ${location} es ideal para los amantes de ${category}. Ofrece paisajes increíbles y una conexión profunda con la naturaleza y la cultura local.`,
    highlights: ["Paisajes increíbles", "Gastronomía local", "Fotos únicas"],
    travelTips: ["Lleva ropa cómoda", "No olvides tu cámara", "Hidrátate bien"]
  };

  const prompt = `
    Actúa como un historiador y guía turístico experto de Ecuador con más de 20 años de experiencia.
    Genera un objeto JSON con información EXTREMADAMENTE DETALLADA, PRECISA y EXTENSA sobre el destino turístico: "${name}" ubicado en "${location}" (Categoría: ${category}).

    REQUISITOS OBLIGATORIOS PARA EL CONTENIDO:
    1. La "fullDescription" debe ser muy larga (mínimo 20 líneas de texto rico).
    2. Debe incluir datos históricos, geográficos exactos, clima, flora, fauna y relevancia cultural.
    3. Debe mencionar explícitamente a qué cantón y provincia pertenece.
    4. Usa un tono profesional pero inspirador.

    El JSON debe tener EXACTAMENTE esta estructura:
    {
      "description": "Resumen atractivo de 2 frases para la tarjeta (max 150 caracteres).",
      "fullDescription": "Aquí va el texto largo. Mínimo 3 párrafos extensos detallando historia, ubicación exacta, clima, biodiversidad y actividades específicas.",
      "highlights": ["Punto destacado 1", "Punto destacado 2", "Punto destacado 3", "Punto destacado 4"],
      "travelTips": ["Consejo práctico 1", "Consejo práctico 2", "Consejo práctico 3", "Consejo práctico 4"]
    }
    
    IMPORTANTE: Responde SOLO con el JSON puro, sin bloques de código markdown ni texto adicional.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    let text = response.text || "{}";
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Error generating destination details:", error);
    return fallbackData;
  }
};