
import { createClient } from '@supabase/supabase-js';

// Extraemos las variables de entorno de forma segura
const supabaseUrl = (process.env as any).SUPABASE_URL || '';
const supabaseAnonKey = (process.env as any).SUPABASE_ANON_KEY || '';

// Estado de configuración para diagnóstico
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

// Solo creamos el cliente si las credenciales existen
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null as any;

if (!isSupabaseConfigured) {
  console.warn("ADVERTENCIA: Supabase no está configurado. Revisa las variables SUPABASE_URL y SUPABASE_ANON_KEY.");
}

export const handleDbError = (error: any) => {
  console.error('Error de Base de Datos:', error);
};
