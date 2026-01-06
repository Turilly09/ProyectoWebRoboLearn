
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

      // Usamos Flash para mayor velocidad y menor consumo de cuota
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Eres el Tutor de RoboLearn. Ayuda con: ${practiceTitle}. Objetivo: ${objective}. Paso: ${currentStep}. Duda: ${userQuery}. ${circuitContext}`,
      });
      return response.text || "No he podido analizar la información.";
    } catch (error) {
      console.error("Gemini Tutor Error:", error);
      return "El tutor está descansando (Límite de cuota alcanzado). Intenta más tarde.";
    }
  }

  async generateLessonDraft(topic: string): Promise<any> {
    try {
      const ai = this.getAI();
      if (!ai) return null;
      
      // Usamos Flash para evitar errores 429 en generación de texto
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      console.error("Lesson Gen Error:", error);
      return null;
    }
  }

  async generateNewsDraft(headline: string): Promise<any> {
    try {
      const ai = this.getAI();
      if (!ai) return null;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
      console.error("News Gen Error:", error);
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

      const finalPrompt = `Create a high quality image. Style: ${style}. Subject: ${prompt}. No text overlays.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: finalPrompt }]
        },
        config: {
          imageConfig: {
             aspectRatio: "16:9"
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
             const base64String = part.inlineData.data;
             return `data:image/png;base64,${base64String}`;
          }
        }
      }
      return null;
    } catch (error: any) {
      // Manejo de error de cuota (429) o permisos
      console.warn("Gemini Image Gen Warning:", error.message);
      
      // Fallback: Si falla la generación por cuota, devolvemos una imagen de stock técnica
      // para que la aplicación no se rompa y el usuario pueda continuar.
      return "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000";
    }
  }
}

export const geminiService = new GeminiService();
