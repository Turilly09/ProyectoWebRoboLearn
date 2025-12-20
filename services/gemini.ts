import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = (): string => {
  try {
    if (typeof process !== 'undefined' && process.env) {
      return (process.env as any).API_KEY || '';
    }
    return '';
  } catch {
    return '';
  }
};

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: getApiKey() });
  }

  async getTutorAssistance(
    practiceTitle: string, 
    objective: string, 
    currentStep: string, 
    userQuery: string,
    circuitData?: string
  ): Promise<string> {
    try {
      if (!getApiKey()) return "Configura tu API_KEY para usar el tutor.";
      
      const circuitContext = circuitData 
        ? `\nESTADO ACTUAL DEL CIRCUITO (Formato Falstad):\n${circuitData}`
        : "\nSin datos técnicos.";

      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Eres el Tutor de RoboLearn. Ayuda con: ${practiceTitle}. Objetivo: ${objective}. Paso: ${currentStep}. Duda: ${userQuery}. ${circuitContext}`,
      });
      return response.text || "No he podido analizar la información.";
    } catch (error) {
      return "Error de conexión con el tutor IA.";
    }
  }

  async generateLessonDraft(topic: string): Promise<any> {
    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: `Genera una lección técnica detallada para RoboLearn sobre: "${topic}".`,
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
                type: Type.OBJECT,
                properties: {
                  question: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  hint: { type: Type.STRING }
                },
                required: ["question", "options", "correctIndex", "hint"]
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
      const response = await this.ai.models.generateContent({
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
}

export const geminiService = new GeminiService();