
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

export const getNotebook = async (userId: string, workshopId: string): Promise<string> => {
  if (!isSupabaseConfigured || !supabase) {
    // Fallback a localStorage si no hay DB
    return localStorage.getItem(`notebook_${userId}_${workshopId}`) || '';
  }

  try {
    const { data, error } = await supabase
      .from('notebooks')
      .select('content')
      .eq('user_id', userId)
      .eq('workshop_id', workshopId)
      .maybeSingle();

    if (error) throw error;
    return data?.content || '';
  } catch (e) {
    console.error("Error cargando cuaderno:", e);
    return '';
  }
};

export const saveNotebook = async (userId: string, workshopId: string, content: string) => {
  // Guardado local de respaldo
  localStorage.setItem(`notebook_${userId}_${workshopId}`, content);

  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('notebooks')
    .upsert({
      user_id: userId,
      workshop_id: workshopId,
      content: content,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id, workshop_id' });

  if (error) {
    handleDbError(error);
    throw error;
  }
};
