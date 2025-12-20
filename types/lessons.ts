
export interface Section {
  title: string;
  content: string;
  image: string;
  fact: string;
}

export interface PracticeStep {
  title: string;
  desc: string;
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
  // Evaluación común
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    hint: string;
  };
}
