
export type BlockType = 'text' | 'image' | 'video';

export interface ContentBlock {
  type: BlockType;
  content: string; // URL para imagen/video, Markdown para texto
}

export interface Section {
  title: string;
  blocks: ContentBlock[]; // Array ordenado de bloques
  fact: string;
  // Campos obsoletos mantenidos opcionalmente para evitar errores en migracion si fuera necesario, 
  // pero la UI usará blocks.
  deprecatedContent?: string;
  deprecatedImage?: string;
}

export interface PracticeStep {
  title: string;
  desc: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  hint: string;
}

export interface LessonData {
  id: string;
  pathId?: string;
  order?: number;
  type?: 'theory' | 'practice';
  title: string;
  subtitle: string;
  // Para Teoría
  sections: Section[];
  // Para Práctica
  simulatorUrl?: string;
  steps?: PracticeStep[];
  // Evaluación: Array de preguntas
  quiz: QuizQuestion[];
}
