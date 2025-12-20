import { createClient } from '@supabase/supabase-js';

// Intentamos obtener las variables de múltiples fuentes para máxima compatibilidad
const getEnv = (key: string): string => {
  try {
    // 1. Intentar via process.env (inyectado por Vite define)
    const val = (process.env as any)[key];
    if (val && val !== 'undefined') return val;
    
    // 2. Intentar via import.meta.env (estándar de Vite)
    const viteVal = (import.meta as any).env?.[`VITE_${key}`];
    if (viteVal && viteVal !== 'undefined') return viteVal;
  } catch (e) {}
  return '';
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