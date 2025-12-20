import { createClient } from '@supabase/supabase-js';

// En Vite, las variables definidas en vite.config.ts se inyectan en process.env
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Verificamos que las variables tengan un formato válido y no sean solo la cadena "undefined"
export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseUrl.startsWith('http')
);

// Inicializamos el cliente solo si la configuración es válida
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const handleDbError = (error: any) => {
  console.error('Error de Base de Datos:', error);
};