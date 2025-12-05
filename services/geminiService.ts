import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MANABI_SYSTEM_INSTRUCTION = `Eres un experto guía turístico de la provincia de Manabí, Ecuador. 
Tu objetivo es promover el turismo de manera entusiasta, especialmente en el Parque Nacional Machalilla, 
Playa Los Frailes y Puerto López. Eres amable, usas emojis y das consejos prácticos sobre comida, rutas y hospedaje. 
Responde siempre en español.`;

export const getTravelAdvice = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: MANABI_SYSTEM_INSTRUCTION,
      },
    });
    return response.text || "Lo siento, no pude encontrar información sobre eso en este momento.";
  } catch (error) {
    console.error("Error fetching travel advice:", error);
    return "Tuve un problema conectando con el guía virtual. Por favor intenta de nuevo.";
  }
};

export const generateCaptionForImage = async (location: string, details: string): Promise<string> => {
  try {
    const prompt = `Escribe un pie de foto (caption) corto, inspirador y atractivo para Instagram sobre una foto tomada en ${location}. Detalles extra: ${details}. Incluye hashtags relevantes de turismo en Ecuador.`;
    
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

// Function to analyze an image (simulated upload) and tell us where it might be or describe it
export const analyzeTravelPhoto = async (base64Image: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image', // Using appropriate model for image analysis
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity in this demo
              data: base64Image
            }
          },
          {
            text: "Describe este lugar turístico de Manabí y dame un dato curioso."
          }
        ]
      }
    });
    return response.text || "Bonita foto.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "No pude analizar la imagen.";
  }
}
