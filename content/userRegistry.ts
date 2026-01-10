
import { User } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

// Obtener todos los usuarios (para el panel de administración)
export const getAllUsers = async (): Promise<User[]> => {
  if (!isSupabaseConfigured || !supabase) return [];
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Mapeo seguro de snake_case a camelCase
    return data.map((p: any) => ({
      ...p,
      completedLessons: p.completed_lessons || [],
      completedWorkshops: p.completed_workshops || [],
      activityLog: p.activity_log || [],
      studyMinutes: p.study_minutes || 0,
      githubUser: p.github_user || '',
      description: p.description || '',
      preferences: p.preferences || {},
      badges: p.badges || []
    }));
  } catch (e) {
    console.error("Error fetching users:", e);
    return [];
  }
};

// Cambiar rol de usuario
export const updateUserRole = async (id: string, newRole: 'student' | 'editor') => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from('profiles')
    .update({ role: newRole })
    .eq('id', id);

  if (error) { 
    handleDbError(error); 
    throw error; 
  }
  window.dispatchEvent(new Event('usersUpdated'));
};

// Eliminar usuario
export const deleteUser = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;
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
