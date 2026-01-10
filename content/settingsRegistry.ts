
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

// Clave por defecto para el estado de la tienda
const STORE_OPEN_KEY = 'store_status';

export const getStoreStatus = async (): Promise<boolean> => {
  if (!isSupabaseConfigured || !supabase) {
    // Si no hay DB, asumimos abierto para la demo o cerrado según preferencia
    // Para demo sin DB, mejor abierto para que vean el trabajo.
    return true; 
  }

  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', STORE_OPEN_KEY)
      .maybeSingle();

    if (error) throw error;
    
    // Si no existe el registro, asumimos que está CERRADA por seguridad/construcción
    if (!data) return false;

    return data.value?.isOpen === true;
  } catch (e) {
    console.error("Error fetching store status:", e);
    return false; // Fallback seguro
  }
};

export const setStoreStatus = async (isOpen: boolean) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('app_settings')
    .upsert({
      key: STORE_OPEN_KEY,
      value: { isOpen }
    });

  if (error) {
    handleDbError(error);
    throw error;
  }
  
  // Disparar evento para actualizar UI inmediatamente
  window.dispatchEvent(new Event('settingsUpdated'));
};
