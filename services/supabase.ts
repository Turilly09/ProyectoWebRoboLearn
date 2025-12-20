import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // Vite reemplaza process.env.KEY por su valor string durante el build/dev
    const val = (process.env as any)[key];
    return (val && val !== 'undefined') ? val : '';
  } catch {
    return '';
  }
};

const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');

export const isSupabaseConfigured = !!(
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl.startsWith('http')
);

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export const handleDbError = (error: any) => {
  console.error('Error de Base de Datos:', error);
};