
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  const key = process.env.API_KEY || '';
  if (key && key !== 'undefined' && key !== '') return key;
  return '';
};

export class GeminiService {
  private ai: GoogleGenAI | null = null;

  private getAI() {
    const key = getApiKey();
    if (!key) {
      console.warn("Gemini API Key missing");
      return null;
    }
    if (!this.ai) {
      this.ai = new GoogleGenAI({ apiKey: key });
    }
    return this.ai;
  }

  async getTutorAssistance(
    practiceTitle: string, 
    objective: string, 
    currentStep: string, 
    userQuery: string,
    circuitData?: string
  ): Promise<string> {
    try {
      const ai = this.getAI();
      if (!ai) return "Configura tu API_KEY para usar el tutor.";
      
      const circuitContext = circuitData 
        ? `\nESTADO ACTUAL DEL CIRCUITO (Formato Falstad):\n${circuitData}`
        : "\nSin datos técnicos.";

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Eres el Tutor de RoboLearn. Ayuda con: ${practiceTitle}. Objetivo: ${objective}. Paso: ${currentStep}. Duda: ${userQuery}. ${circuitContext}`,
      });
      return response.text || "No he podido analizar la información.";
    } catch (error) {
      console.error("Gemini Error:", error);
      return "Error de conexión con el tutor IA.";
    }
  }

  async generateLessonDraft(topic: string): Promise<any> {
    try {
      const ai = this.getAI();
      if (!ai) return null;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Genera una lección técnica detallada para RoboLearn sobre: "${topic}". Incluye al menos 2 preguntas de validación.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              title: { type: Type.STRING },
              subtitle: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING },
                    content: { type: Type.STRING },
                    image: { type: Type.STRING },
                    fact: { type: Type.STRING }
                  },
                  required: ["title", "content", "image", "fact"]
                }
              },
              quiz: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        question: { type: Type.STRING },
                        options: { type: Type.ARRAY, items: { type: Type.STRING } },
                        correctIndex: { type: Type.INTEGER },
                        hint: { type: Type.STRING }
                    },
                    required: ["question", "options", "correctIndex", "hint"]
                }
              }
            },
            required: ["id", "title", "subtitle", "sections", "quiz"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      return null;
    }
  }

  async generateNewsDraft(headline: string): Promise<any> {
    try {
      const ai = this.getAI();
      if (!ai) return null;
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Genera una noticia técnica para el blog de RoboLearn sobre: "${headline}".`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              content: { type: Type.STRING },
              category: { type: Type.STRING },
              image: { type: Type.STRING },
              readTime: { type: Type.STRING }
            },
            required: ["title", "excerpt", "content", "category", "image", "readTime"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      return null;
    }
  }

  async generateImage(prompt: string, style: string): Promise<string | null> {
    try {
      const ai = this.getAI();
      if (!ai) {
        console.error("API Key not configured");
        return null;
      }

      // Prompt optimizado
      const finalPrompt = `Create a high quality image. Style: ${style}. Subject: ${prompt}. No text overlays.`;

      // Usamos gemini-2.5-flash-image que tiene mejor disponibilidad en capa gratuita
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }]
        },
        config: {
          imageConfig: {
             aspectRatio: "16:9"
             // imageSize eliminado ya que es exclusivo del modelo Pro
          }
        }
      });

      // Búsqueda robusta de la parte de imagen en la respuesta
      const parts = response.candidates?.[0]?.content?.parts;
      
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
             const base64String = part.inlineData.data;
             return `data:image/png;base64,${base64String}`;
          }
        }
        if (parts.length > 0 && parts[0].text) {
           console.warn("Gemini Image Response (Text Only):", parts[0].text);
        }
      }
      return null;
    } catch (error) {
      console.error("Image Generation Error:", error);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
