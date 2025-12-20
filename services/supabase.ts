import { createClient } from '@supabase/supabase-js';

// En Vite, el reemplazo de process.env es LITERAL. 
// No podemos usar (process.env as any)[key] porque el compilador no sabe qué reemplazar.
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' &&
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const handleDbError = (error: any) => {
  console.error('Error de Base de Datos:', error);
};