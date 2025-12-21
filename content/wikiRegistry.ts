import { WikiEntry } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

// Obtener entradas aprobadas (Público)
export const getApprovedWikiEntries = async (): Promise<WikiEntry[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('wiki_entries')
      .select('*')
      .eq('status', 'approved')
      .order('term', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Error fetching wiki:", e);
    return [];
  }
};

// Obtener entradas pendientes (Solo Editores)
export const getPendingWikiEntries = async (): Promise<WikiEntry[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  
  try {
    const { data, error } = await supabase
      .from('wiki_entries')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Error fetching pending wiki:", e);
    return [];
  }
};

// Crear nueva entrada (Estado pendiente por defecto)
export const createWikiEntry = async (entry: Omit<WikiEntry, 'id' | 'status' | 'created_at'>) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("DB no configurada");

  const { error } = await supabase
    .from('wiki_entries')
    .insert({
      term: entry.term,
      definition: entry.definition,
      category: entry.category,
      author_name: entry.author_name,
      author_id: entry.author_id,
      status: 'pending' // Siempre pendiente hasta moderación
    });

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('wikiUpdated'));
};

// Aprobar entrada y dar XP al autor
export const approveWikiEntry = async (id: string, authorId: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  // 1. Actualizar estado a approved
  const { error: updateError } = await supabase
    .from('wiki_entries')
    .update({ status: 'approved' })
    .eq('id', id);

  if (updateError) {
    handleDbError(updateError);
    throw updateError;
  }

  // 2. Dar XP al autor (Gamification)
  // Nota: Esto asume que existe el perfil. Usamos RPC o llamada directa.
  // Para simplificar, hacemos un fetch + update simple, aunque un RPC 'increment_xp' sería más atómico.
  try {
    const { data: user } = await supabase.from('profiles').select('xp').eq('id', authorId).single();
    if (user) {
        await supabase.from('profiles').update({ xp: user.xp + 50 }).eq('id', authorId);
    }
  } catch (e) {
    console.warn("No se pudo dar XP al usuario (quizás no existe en DB real)", e);
  }

  window.dispatchEvent(new Event('wikiUpdated'));
};

// Rechazar/Borrar entrada
export const deleteWikiEntry = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('wiki_entries')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('wikiUpdated'));
};