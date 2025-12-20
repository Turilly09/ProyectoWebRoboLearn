import { LessonData } from '../types/lessons';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';
import { m1 } from './lessons/m1';
import { m2 } from './lessons/m2';

const STATIC_LESSONS: Record<string, LessonData> = {
  m1: { ...m1, pathId: 'e101', order: 1 },
  m2: { ...m2, pathId: 'e101', order: 2 },
};

export const getLessonById = async (id: string): Promise<LessonData | undefined> => {
  if (STATIC_LESSONS[id]) return STATIC_LESSONS[id];
  if (!isSupabaseConfigured || !supabase) return undefined;

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;
    return {
      ...data,
      pathId: data.path_id,
      simulatorUrl: data.simulator_url
    };
  } catch (e) {
    return undefined;
  }
};

export const getModulesByPath = async (pathId: string): Promise<LessonData[]> => {
  const staticItems = Object.values(STATIC_LESSONS).filter(l => l.pathId === pathId);
  if (!isSupabaseConfigured || !supabase) return staticItems.sort((a, b) => (a.order || 0) - (b.order || 0));

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('path_id', pathId)
      .order('order', { ascending: true });

    if (error) return staticItems.sort((a, b) => (a.order || 0) - (b.order || 0));
    
    const dynamicItems = (data || []).map(l => ({
      ...l,
      pathId: l.path_id,
      simulatorUrl: l.simulator_url
    }));

    return [...staticItems, ...dynamicItems].sort((a, b) => (a.order || 0) - (b.order || 0));
  } catch (e) {
    return staticItems;
  }
};

export const saveDynamicLesson = async (lesson: LessonData) => {
  if (!isSupabaseConfigured || !supabase) return;
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

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('lessonsUpdated'));
};

export const deleteDynamicLesson = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;
  
  // Usamos count: 'exact' para verificar si realmente se borró
  const { error, count } = await supabase
    .from('lessons')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw new Error(error.message);
  }

  // Si count es 0, es que no se borró nada (posiblemente por políticas RLS)
  if (count === 0) {
    throw new Error("No se encontró el registro o no tienes permisos para borrarlo. Verifica las políticas RLS de Supabase.");
  }
  
  // No disparamos el evento aquí, dejamos que el componente lo maneje
};

export const getAllDynamicLessonsList = async (): Promise<LessonData[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase.from('lessons').select('*');
    if (error) throw error;
    
    return (data || []).map(l => ({
      ...l,
      pathId: l.path_id,
      simulatorUrl: l.simulator_url
    }));
  } catch (e) {
    return [];
  }
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