import { LearningPath } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';
import { e101 } from './paths/e101';
import { al1 } from './paths/al1';
import { rai } from './paths/rai';
import { analogica } from './paths/analogica';
import { digital } from './paths/digital';
import { ca } from './paths/ca';
import { automatismos } from './paths/automatismos';
import { robo_principiantes } from './paths/robo_principiantes';

const STATIC_PATHS: LearningPath[] = [
  e101, al1, analogica, digital, ca, automatismos, robo_principiantes, rai
];

export const getAllPaths = async (): Promise<LearningPath[]> => {
  if (!isSupabaseConfigured || !supabase) return STATIC_PATHS;

  try {
    const { data, error } = await supabase
      .from('paths')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return STATIC_PATHS;
    return [...STATIC_PATHS, ...(data || [])];
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