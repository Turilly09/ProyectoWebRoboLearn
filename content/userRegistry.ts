import { User } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false }); // Asumiendo que existe created_at, si no, ordenar por nombre

    if (error) throw error;

    return (data || []).map(u => ({
        ...u,
        completedLessons: u.completed_lessons || [], // Mapeo de snake_case a camelCase si es necesario
        completedWorkshops: u.completed_workshops || [],
        studyMinutes: u.study_minutes || 0,
        activityLog: u.activity_log || []
    }));
  } catch (e) {
    console.error("Error fetching users:", e);
    return [];
  }
};

export const deleteUser = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  // Nota: Esto elimina el perfil de la tabla 'profiles'.
  // En una implementación completa de Supabase Auth, también se debería eliminar de auth.users usando una Edge Function,
  // pero para esta estructura basada en tabla de perfiles, esto es suficiente para "borrar" al usuario de la app.
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('usersUpdated'));
};