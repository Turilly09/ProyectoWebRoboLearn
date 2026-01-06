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
    // 1. Excluimos las que ya existen en STATIC_PATHS (por ID) para que MANDEN los archivos locales.
    // 2. Excluimos explícitamente títulos antiguos por si tienen IDs diferentes.
    const uniqueDbPaths = (data || []).filter(p => 
      !STATIC_PATHS.some(staticPath => staticPath.id === p.id) &&
      p.title !== 'Electrónica Básica' && 
      p.title !== 'Electronica Basica'
    );

    return [...STATIC_PATHS, ...uniqueDbPaths];
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

  if (error) handleDbError(error);
  window.dispatchEvent(new Event('pathsUpdated'));
};