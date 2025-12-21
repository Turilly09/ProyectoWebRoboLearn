import { LessonData } from '../types/lessons';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

export const getLessonById = async (id: string): Promise<LessonData | undefined> => {
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
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('path_id', pathId)
      .order('order', { ascending: true });

    if (error) return [];
    
    return (data || []).map(l => ({
      ...l,
      pathId: l.path_id,
      simulatorUrl: l.simulator_url
    }));
  } catch (e) {
    return [];
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
  
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
  window.dispatchEvent(new Event('lessonsUpdated'));
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