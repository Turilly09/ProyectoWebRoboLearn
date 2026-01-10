
import { LearningPath } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';
import { e101 } from './paths/e101';
import { analogica } from './paths/analogica';
import { digital } from './paths/digital';

const STATIC_PATHS: LearningPath[] = [
  e101, analogica, digital
];

export const getAllPaths = async (): Promise<LearningPath[]> => {
  if (!isSupabaseConfigured || !supabase) return STATIC_PATHS;

  try {
    const { data, error } = await supabase
      .from('paths')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return STATIC_PATHS;

    if (data && data.length > 0) {
        // Mapeo de la base de datos (snake_case) a la aplicación (camelCase)
        return data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            level: p.level,
            image: p.image,
            color: p.color,
            modulesCount: 0, // Se calcula dinámicamente en la UI usualmente, o aquí si se unieran tablas
            progress: 0,
            finalWorkshop: p.final_workshop // Mapeo de la columna JSONB
        }));
    }

    return STATIC_PATHS;
  } catch (e) {
    return STATIC_PATHS;
  }
};

export const getPathById = async (id: string): Promise<LearningPath | undefined> => {
  const all = await getAllPaths();
  return all.find(p => p.id === id);
};

export const saveDynamicPath = async (path: LearningPath) => {
  if (!isSupabaseConfigured || !supabase) return;
  
  // Mapeo inverso para guardar: camelCase -> snake_case
  const { error } = await supabase
    .from('paths')
    .upsert({ 
      id: path.id, 
      title: path.title, 
      description: path.description,
      level: path.level,
      image: path.image,
      color: path.color,
      final_workshop: path.finalWorkshop // Guardamos el objeto completo del taller
    });

  if (error) {
      handleDbError(error);
      throw error;
  }
  window.dispatchEvent(new Event('pathsUpdated'));
};

export const deleteDynamicPath = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;
  
  const { error } = await supabase
    .from('paths')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('pathsUpdated'));
};
