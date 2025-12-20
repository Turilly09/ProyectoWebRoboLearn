import { createClient } from '@supabase/supabase-js';

// En Vite, el acceso debe ser estático para que el compilador reemplace el valor
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.length > 10 &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const handleDbError = (error: any) => {
  console.error('Error de Base de Datos:', error);
};