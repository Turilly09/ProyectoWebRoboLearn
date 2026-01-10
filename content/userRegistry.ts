
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

// Sincronizar perfil local con la nube (Lógica movida desde Dashboard)
export const syncUserProfile = async (user: User) => {
  if (!isSupabaseConfigured || !supabase) return;

  try {
    const { data: remoteProfile, error } = await supabase
      .from('profiles')
      .select('xp, level, activity_log, completed_lessons, completed_workshops')
      .eq('id', user.id)
      .single();

    if (error) throw error;

    if (remoteProfile) {
        // Normalizar logs remotos
        const remoteLogs = (remoteProfile.activity_log || (remoteProfile as any).activityLog || []).map((log: any) => ({
            date: log.date,
            xpEarned: log.xp_earned !== undefined ? log.xp_earned : (log.xpEarned || 0)
        }));

        const localXp = user.xp;
        const remoteXp = remoteProfile.xp;
        const localLogStr = JSON.stringify(user.activityLog);
        const remoteLogStr = JSON.stringify(remoteLogs);
        
        // Si hay discrepancias, asumimos que el servidor es la fuente de la verdad
        // (En una app real, aquí iría una lógica de merge más compleja)
        if (remoteXp !== localXp || localLogStr !== remoteLogStr) {
            console.log("Sincronizando perfil con la nube...");
            const updatedUser = {
                ...user,
                xp: remoteXp,
                level: remoteProfile.level,
                activityLog: remoteLogs,
                completedLessons: remoteProfile.completed_lessons || user.completedLessons,
                completedWorkshops: remoteProfile.completed_workshops || user.completedWorkshops
            };
            
            const safeUser = { ...updatedUser };
            if ((safeUser as any).password) delete (safeUser as any).password;
            
            localStorage.setItem('robo_user', JSON.stringify(safeUser));
            window.dispatchEvent(new Event('authChange'));
        }
    }
  } catch (e) {
    console.warn("Error synchronizing profile:", e);
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
