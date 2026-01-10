
import { LearningPath } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

// Datos estáticos de respaldo (Inlined para permitir borrar archivos sueltos)
const STATIC_PATHS: LearningPath[] = [
  {
    id: 'e101',
    title: 'Introducción a la Electricidad',
    description: 'Fundamentos físicos: voltaje, corriente, resistencia y las leyes básicas.',
    level: 'Principiante',
    modulesCount: 5,
    progress: 0,
    image: 'https://picsum.photos/seed/elec/800/450',
    color: 'bg-green-500',
    finalWorkshop: {
        id: 'w_elec_1',
        title: 'Fuente de Alimentación Regulable',
        description: 'Diseño y construcción de una fuente de 0-12V con protección de cortocircuito.',
        image: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000',
        category: 'Hardware',
        author: 'Sistema',
        isWorkshop: true,
        estimatedTime: "4 Horas",
        difficulty: "Media",
        requirements: ["Transformador", "Puente rectificador", "LM317T", "Componentes pasivos"],
        steps: []
    }
  },
  {
    id: 'analog1',
    title: 'Electrónica Analógica',
    description: 'Domina el comportamiento de los transistores, amplificadores operacionales y señales.',
    level: 'Intermedio',
    modulesCount: 8,
    progress: 0,
    image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&q=80&w=800',
    color: 'bg-orange-500'
  },
  {
    id: 'digital1',
    title: 'Electrónica Digital',
    description: 'Sistemas binarios, puertas lógicas y lógica secuencial.',
    level: 'Principiante',
    modulesCount: 10,
    progress: 0,
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&q=80&w=800',
    color: 'bg-cyan-500'
  }
];

export const getAllPaths = async (): Promise<LearningPath[]> => {
  if (!isSupabaseConfigured || !supabase) return STATIC_PATHS;

  try {
    const { data, error } = await supabase
      .from('paths')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) return STATIC_PATHS;

    if (data && data.length > 0) {
        // Mapeo de la base de datos (snake_case) a la aplicación (camelCase)
        return data.map((p: any) => ({
            id: p.id,
            title: p.title,
            description: p.description,
            level: p.level,
            image: p.image,
            color: p.color,
            modulesCount: 0, // Se calcula dinámicamente en la UI
            progress: 0,
            finalWorkshop: p.final_workshop // Mapeo de la columna JSONB
        }));
    }

    return STATIC_PATHS;
  } catch (e) {
    return STATIC_PATHS;
  }
};

export const getPathById = async (id: string): Promise<LearningPath | undefined> => {
  const all = await getAllPaths();
  return all.find(p => p.id === id);
};

export const saveDynamicPath = async (path: LearningPath) => {
  if (!isSupabaseConfigured || !supabase) return;
  
  // Mapeo inverso para guardar: camelCase -> snake_case
  const { error } = await supabase
    .from('paths')
    .upsert({ 
      id: path.id, 
      title: path.title, 
      description: path.description,
      level: path.level,
      image: path.image,
      color: path.color,
      final_workshop: path.finalWorkshop 
    });

  if (error) {
      handleDbError(error);
      throw error;
  }
  window.dispatchEvent(new Event('pathsUpdated'));
};

export const deleteDynamicPath = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;
  
  const { error } = await supabase
    .from('paths')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('pathsUpdated'));
};
