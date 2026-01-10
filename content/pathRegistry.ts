
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

    // Filtramos las rutas que vienen de la BD:
    // 1. Excluimos las que ya existen en STATIC_PATHS (por ID) para que MANDEN los archivos locales si hay conflicto,
    //    O, si prefieres que mande la BD, invierte la lógica. Aquí priorizamos BD si existe.
    
    // Estrategia Híbrida: Mostramos TODO lo de la BD. Si la BD está vacía, mostramos estáticos.
    if (data && data.length > 0) {
        return data;
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
  const { error } = await supabase
    .from('paths')
    .upsert({ 
      id: path.id, 
      title: path.title, 
      description: path.description,
      level: path.level,
      image: path.image,
      color: path.color
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
