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

  // 1. LIMPIEZA EN CASCADA MANUAL
  // Intentamos borrar los datos asociados al usuario para evitar errores de Foreign Key (Integridad Referencial)
  // si la base de datos no está configurada con "ON DELETE CASCADE".
  // Usamos Promise.allSettled para que si falla uno (por ejemplo, por no tener proyectos), no detenga el proceso.
  await Promise.allSettled([
    supabase.from('community_projects').delete().eq('author_id', id),
    supabase.from('wiki_entries').delete().eq('author_id', id),
    supabase.from('notebooks').delete().eq('user_id', id)
  ]);

  // 2. BORRAR PERFIL
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', id);

  if (error) {
    console.error("Error borrando perfil:", error);
    // Relanzamos el error para que la UI muestre el modal de SQL Help
    throw error;
  }
  
  window.dispatchEvent(new Event('usersUpdated'));
};