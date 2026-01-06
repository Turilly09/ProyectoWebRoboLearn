
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
      
      // Esquema actualizado para soportar BLOQUES
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera una lección técnica detallada para RoboLearn sobre: "${topic}". Estructura el contenido en bloques (texto o imagen) alternados para mejor lectura. Incluye al menos 2 preguntas de validación.`,
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
                    blocks: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: { type: Type.STRING, enum: ["text", "image"] },
                                content: { type: Type.STRING }
                            },
                            required: ["type", "content"]
                        }
                    },
                    fact: { type: Type.STRING }
                  },
                  required: ["title", "blocks", "fact"]
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

  // --- MODELO DE IMAGEN: GEMINI 2.5 FLASH IMAGE (Multimodal nativo, mejor cuota gratuita) ---

  async generateImage(prompt: string, style: string): Promise<string | null> {
    try {
      const ai = this.getAI();
      if (!ai) {
        console.error("API Key not configured");
        return null;
      }

      console.log("Generando imagen con Gemini 2.5 Flash Image...");
      
      // Cambio CLAVE: Usamos 'generateContent' con 'gemini-2.5-flash-image'.
      // Este modelo suele estar disponible en el nivel gratuito donde 'imagen-3.0' falla.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `High quality image. ${style}. ${prompt}. Tech, engineering context.` }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });

      // La respuesta de Gemini contiene la imagen en 'inlineData' dentro de las partes
      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
             // Devolvemos la imagen en base64 lista para el src de <img>
             return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return null;
    } catch (error: any) {
      console.warn("Gemini Image Gen Error:", error.message);
      
      // Fallback ROBUSTO:
      // Si la IA falla, devolvemos una imagen de stock técnica de alta calidad.
      return "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000";
    }
  }
}

export const geminiService = new GeminiService();
