
export interface UserActivity {
  date: string; // Formato YYYY-MM-DD
  xpEarned: number;
}

export type UserRole = 'student' | 'editor';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar: string;
  level: number;
  xp: number;
  role: UserRole;
  completedLessons: string[];
  completedWorkshops: string[]; // IDs de talleres completados
  activityLog: UserActivity[];
  studyMinutes: number;
}

export interface NewsItem {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  author: string;
  category: 'Tecnología' | 'Comunidad' | 'Tutorial' | 'Evento';
  image: string;
  readTime: string;
}

export interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: string;
  board: string;
  tags: string[];
  likes: number;
  replies: number;
  created_at: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  duration: string;
  status: 'completed' | 'current' | 'locked';
  icon: string;
  type: 'theory' | 'practice'; 
}

export interface WorkshopStep {
  title: string;
  description: string;
  image?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  author: string;
  isWorkshop?: boolean;
  // Propiedades extendidas para el Workshop Detallado
  videoUrl?: string; // URL de YouTube/Embed
  requirements?: string[]; // Lista de materiales (BOM)
  steps?: WorkshopStep[]; // Guía paso a paso
  estimatedTime?: string;
  difficulty?: 'Baja' | 'Media' | 'Alta';
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  level: 'Principiante' | 'Intermedio' | 'Avanzado';
  modulesCount: number;
  progress?: number;
  image: string;
  color: string;
  modules?: Module[];
  finalWorkshop?: Project; 
}

export interface UserStats {
  xp: number;
  lessonsCompleted: number;
  studyTime: string;
  level: number;
  progressToNextLevel: number;
}