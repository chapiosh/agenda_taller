
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.warn("API key for Gemini is not set. AI features will be disabled.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateServiceDescription = async (prompt: string): Promise<string> => {
  if (!API_KEY) {
    return "La función de IA está deshabilitada. Por favor, configure la clave de API.";
  }
  
  try {
    const fullPrompt = `Basado en la siguiente queja de un cliente para su vehículo, escribe una descripción de servicio concisa y profesional para una orden de trabajo de un mecánico. Mantén el lenguaje técnico pero comprensible. No añadas saludos ni despedidas, solo la descripción del trabajo a realizar. Queja del cliente: "${prompt}"`;
    
    const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: fullPrompt
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error generating service description with Gemini:", error);
    return "Error al generar la descripción. Por favor, inténtalo de nuevo.";
  }
};
