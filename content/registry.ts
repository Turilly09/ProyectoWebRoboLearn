
import { LessonData } from '../types/lessons';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

// --- HELPERS ---

/**
 * Convierte los datos crudos de la base de datos (snake_case) 
 * al tipo LessonData de la aplicación (camelCase).
 */
const mapDatabaseToLesson = (data: any): LessonData => {
  // Normalización defensiva del quiz:
  // Si viene null o undefined -> array vacío
  // Si es un objeto único (legacy) -> array con ese objeto
  // Si ya es array -> se mantiene
  let normalizedQuiz = [];
  if (Array.isArray(data.quiz)) {
    normalizedQuiz = data.quiz;
  } else if (data.quiz && typeof data.quiz === 'object') {
    normalizedQuiz = [data.quiz];
  }

  return {
    id: data.id,
    pathId: data.path_id, // Mapping explícito snake_case -> camelCase
    order: data.order,
    type: data.type || 'theory',
    title: data.title,
    subtitle: data.subtitle,
    sections: data.sections || [],
    simulatorUrl: data.simulator_url, // Mapping explícito
    steps: data.steps || [],
    quiz: normalizedQuiz
  };
};

// --- READ OPERATIONS ---

export const getLessonById = async (id: string): Promise<LessonData | undefined> => {
  if (!isSupabaseConfigured || !supabase) return undefined;

  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .maybeSingle(); // Usamos maybeSingle para evitar error si no existe (devuelve null)

    if (error) {
      console.warn(`Error fetching lesson ${id}:`, error.message);
      return undefined;
    }

    if (!data) return undefined;
    
    return mapDatabaseToLesson(data);
  } catch (e) {
    console.error(`Unexpected error in getLessonById(${id}):`, e);
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

    if (error) {
      console.warn(`Error fetching modules for path ${pathId}:`, error.message);
      return [];
    }
    
    return (data || []).map(l => mapDatabaseToLesson(l));
  } catch (e) {
    console.error(`Unexpected error in getModulesByPath(${pathId}):`, e);
    return [];
  }
};

export const getAllDynamicLessonsList = async (): Promise<LessonData[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('lessons')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(l => mapDatabaseToLesson(l));
  } catch (e) {
    console.error("Error fetching all lessons:", e);
    return [];
  }
};

export const getNextLessonId = async (currentId: string): Promise<string | null> => {
  // 1. Obtenemos la lección actual para saber su pathId
  const current = await getLessonById(currentId);
  if (!current || !current.pathId) return null;
  
  // 2. Obtenemos todos los módulos de ese path ordenados
  const pathModules = await getModulesByPath(current.pathId);
  
  // 3. Encontramos el índice y devolvemos el siguiente
  const currentIndex = pathModules.findIndex(m => m.id === currentId);
  
  if (currentIndex >= 0 && currentIndex < pathModules.length - 1) {
    return pathModules[currentIndex + 1].id;
  }
  
  return null;
};

// --- WRITE OPERATIONS ---

export const saveDynamicLesson = async (lesson: LessonData) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Base de datos no configurada.");
  }

  // Preparamos el objeto con las claves en snake_case para la DB
  const dbPayload = {
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
  };

  const { error } = await supabase
    .from('lessons')
    .upsert(dbPayload);

  if (error) {
    handleDbError(error);
    throw error; // Relanzamos para que la UI (ContentStudio) muestre el mensaje
  }
  
  // Notificamos a la app para refrescar datos
  window.dispatchEvent(new Event('lessonsUpdated'));
};

export const deleteDynamicLesson = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) {
    throw new Error("Base de datos no configurada.");
  }
  
  const { error } = await supabase
    .from('lessons')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw new Error(`No se pudo eliminar la lección: ${error.message}`);
  }
  
  window.dispatchEvent(new Event('lessonsUpdated'));
};
