
export interface PracticeStep {
  title: string;
  desc: string;
}

export interface PracticeData {
  id: string;
  title: string;
  subtitle: string;
  objective: string;
  simulatorUrl: string;
  steps: PracticeStep[];
  tutorPrompt: string;
}
