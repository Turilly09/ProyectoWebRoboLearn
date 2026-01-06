
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

  // --- MODELO DE TEXTO: GEMINI 3 FLASH (Rápido y eficiente) ---

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

      // Usamos gemini-3-flash-preview para texto (Tutor)
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Eres el Tutor de RoboLearn. Ayuda con: ${practiceTitle}. Objetivo: ${objective}. Paso: ${currentStep}. Duda: ${userQuery}. ${circuitContext}`,
      });
      return response.text || "No he podido analizar la información.";
    } catch (error) {
      console.error("Gemini Tutor Error:", error);
      return "El tutor está descansando (Límite de cuota alcanzado o error de red). Intenta más tarde.";
    }
  }

  async generateLessonDraft(topic: string): Promise<any> {
    try {
      const ai = this.getAI();
      if (!ai) return null;
      
      // Usamos gemini-3-flash-preview para generación de estructuras JSON complejas
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
      
      // Usamos gemini-3-flash-preview para redacción de noticias
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

  // --- MODELO DE IMAGEN: IMAGEN 3.0 (Especializado) ---

  async generateImage(prompt: string, style: string): Promise<string | null> {
    try {
      const ai = this.getAI();
      if (!ai) {
        console.error("API Key not configured");
        return null;
      }

      // Usamos imagen-3.0-generate-001 específicamente para imágenes
      console.log("Generando imagen con Imagen 3.0...");
      const response = await ai.models.generateImages({
        model: 'imagen-3.0-generate-001',
        prompt: `High quality, ${style}. ${prompt}. Tech, futuristic, engineering context.`,
        config: {
          numberOfImages: 1,
          aspectRatio: '16:9',
          outputMimeType: 'image/jpeg'
        }
      });

      const base64String = response.generatedImages?.[0]?.image?.imageBytes;
      if (base64String) {
          return `data:image/jpeg;base64,${base64String}`;
      }
      return null;
    } catch (error: any) {
      console.warn("Imagen 3.0 Error (Quota/Limit):", error.message);
      
      // Fallback ROBUSTO:
      // Si Imagen 3.0 falla (común en Free Tier por límites diarios),
      // devolvemos una imagen de stock técnica de alta calidad.
      return "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000";
    }
  }
}

export const geminiService = new GeminiService();
