import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    // Vite inyecta variables vía define en vite.config.ts
    const val = (process.env as any)[key];
    if (val && val !== 'undefined' && val !== '') return val;
    
    // Fallback para desarrollo local estándar de Vite
    const viteVal = (import.meta as any).env?.[`VITE_${key}`];
    if (viteVal && viteVal !== 'undefined' && viteVal !== '') return viteVal;
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