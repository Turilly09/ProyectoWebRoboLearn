
import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  const key = process.env.API_KEY || '';
  if (key && key !== 'undefined' && key !== '') return key;
  return '';
};

// Fallback inteligente para cuando se agota la cuota de la API
const getFallbackImage = (prompt: string): string => {
  const p = prompt.toLowerCase();
  if (p.includes('circuit') || p.includes('pcb') || p.includes('board') || p.includes('chip')) 
    return "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=1000"; // Circuitos
  if (p.includes('robot') || p.includes('android') || p.includes('ai') || p.includes('cyborg')) 
    return "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&q=80&w=1000"; // Robots
  if (p.includes('code') || p.includes('screen') || p.includes('programming') || p.includes('software')) 
    return "https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=1000"; // Código
  if (p.includes('solder') || p.includes('tool') || p.includes('lab') || p.includes('fix')) 
    return "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&q=80&w=1000"; // Laboratorio
  if (p.includes('drone') || p.includes('fly'))
    return "https://images.unsplash.com/photo-1506947411487-a56738267384?auto=format&fit=crop&q=80&w=1000"; // Drones
  if (p.includes('3d') || p.includes('print'))
    return "https://images.unsplash.com/photo-1631541909061-71e349d1f203?auto=format&fit=crop&q=80&w=1000"; // 3D Printing

  return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000"; // Genérico Tech
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
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Genera una noticia técnica para el blog de RoboLearn sobre: "${headline}". Estructura el contenido usando bloques de texto e imágenes (sugeridas como prompt o url placeholder).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              excerpt: { type: Type.STRING },
              category: { type: Type.STRING },
              image: { type: Type.STRING },
              readTime: { type: Type.STRING },
              blocks: {
                  type: Type.ARRAY,
                  items: {
                      type: Type.OBJECT,
                      properties: {
                          type: { type: Type.STRING, enum: ["text", "image", "video"] },
                          content: { type: Type.STRING }
                      },
                      required: ["type", "content"]
                  }
              }
            },
            required: ["title", "excerpt", "category", "image", "readTime", "blocks"]
          }
        }
      });
      return JSON.parse(response.text || "{}");
    } catch (error) {
      console.error("News Gen Error:", error);
      return null;
    }
  }

  // --- MODELO DE IMAGEN ---
  
  async generateImage(prompt: string, style: string): Promise<string | null> {
    try {
      const ai = this.getAI();
      if (!ai) {
        console.error("API Key not configured");
        return getFallbackImage(prompt);
      }

      console.log("Generando imagen con Gemini...");
      
      // Intentamos usar Gemini 2.5 Flash Image.
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: `High quality, ${style}. ${prompt}. Tech, futuristic, engineering context.` }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });

      const parts = response.candidates?.[0]?.content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
             return `data:image/png;base64,${part.inlineData.data}`;
          }
        }
      }
      return getFallbackImage(prompt);

    } catch (error: any) {
      const msg = error.message || '';
      if (msg.includes('429') || msg.includes('Quota') || msg.includes('RESOURCE_EXHAUSTED')) {
        console.warn("⚠️ Cuota de imágenes agotada. Usando imagen de stock inteligente.");
      } else {
        console.warn("⚠️ Error generando imagen:", msg);
      }
      return getFallbackImage(prompt);
    }
  }
}

export const geminiService = new GeminiService();
