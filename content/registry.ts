
import { LessonData } from '../types/lessons';
import { supabase, handleDbError } from '../services/supabase';
import { m1 } from './lessons/m1';
import { m2 } from './lessons/m2';

const STATIC_LESSONS: Record<string, LessonData> = {
  m1: { ...m1, pathId: 'e101', order: 1 },
  m2: { ...m2, pathId: 'e101', order: 2 },
};

export const getLessonById = async (id: string): Promise<LessonData | undefined> => {
  // Primero intentamos estáticos (prioridad a contenido core)
  if (STATIC_LESSONS[id]) return STATIC_LESSONS[id];

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return data;
  } catch (e) {
    return undefined;
  }
};

export const getModulesByPath = async (pathId: string): Promise<LessonData[]> => {
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('path_id', pathId)
      .order('order', { ascending: true });

    const staticItems = Object.values(STATIC_LESSONS).filter(l => l.pathId === pathId);
    
    if (error) return staticItems.sort((a, b) => (a.order || 0) - (b.order || 0));

    return [...staticItems, ...(data || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (e) {
    return Object.values(STATIC_LESSONS).filter(l => l.pathId === pathId);
  }
};

export const saveDynamicLesson = async (lesson: LessonData) => {
  const { error } = await supabase
    .from('lessons')
    .upsert({
      id: lesson.id,
      path_id: lesson.pathId,
      order: lesson.order,
      type: lesson.type,
      title: lesson.title,
      subtitle: lesson.subtitle,
      sections: lesson.sections,
      simulator_url: lesson.simulatorUrl,
      steps: lesson.steps,
      quiz: lesson.quiz
    });

  if (error) handleDbError(error);
  window.dispatchEvent(new Event('lessonsUpdated'));
};

export const getAllDynamicLessonsList = async (): Promise<LessonData[]> => {
  const { data } = await supabase.from('lessons').select('*');
  return data || [];
};

export const getNextLessonId = async (currentId: string): Promise<string | null> => {
  const current = await getLessonById(currentId);
  if (!current || !current.pathId) return null;
  
  const pathModules = await getModulesByPath(current.pathId);
  const currentIndex = pathModules.findIndex(m => m.id === currentId);
  
  return (currentIndex >= 0 && currentIndex < pathModules.length - 1) 
    ? pathModules[currentIndex + 1].id 
    : null;
};
