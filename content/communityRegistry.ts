
import { CommunityProject } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

export const getAllCommunityProjects = async (): Promise<CommunityProject[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('community_projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return (data || []).map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      coverImage: p.cover_image,
      category: p.category,
      authorId: p.author_id,
      authorName: p.author_name,
      likes: p.likes,
      supplies: p.supplies,
      steps: p.steps,
      createdAt: p.created_at
    }));
  } catch (e) {
    console.error("Error fetching community projects:", e);
    return [];
  }
};

export const getCommunityProjectById = async (id: string): Promise<CommunityProject | undefined> => {
  if (!isSupabaseConfigured || !supabase) return undefined;

  try {
    const { data, error } = await supabase
      .from('community_projects')
      .select('*')
      .eq('id', id)
      .single();

    if (error) return undefined;

    return {
      id: data.id,
      title: data.title,
      description: data.description,
      coverImage: data.cover_image,
      category: data.category,
      authorId: data.author_id,
      authorName: data.author_name,
      likes: data.likes,
      supplies: data.supplies,
      steps: data.steps,
      createdAt: data.created_at
    };
  } catch (e) {
    return undefined;
  }
};

export const getCommunityStats = async () => {
  if (!isSupabaseConfigured || !supabase) {
    // Mock data for demo
    return { total: 142, online: 18 };
  }

  try {
    // Obtener cuenta real de perfiles registrados
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    const total = count || 0;
    
    // Estimación de usuarios online (para demo visual ya que no usamos websockets reales aún)
    // Se calcula como el 15% de los usuarios totales + un número aleatorio pequeño
    const online = Math.max(1, Math.floor(total * 0.15) + Math.floor(Math.random() * 5));

    return { total, online };
  } catch (e) {
    console.error("Error fetching stats:", e);
    return { total: 0, online: 0 };
  }
};

export const saveCommunityProject = async (project: CommunityProject) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('community_projects')
    .upsert({
      id: project.id.includes('temp') ? undefined : project.id, // Deja que Supabase genere UUID si es nuevo
      title: project.title,
      description: project.description,
      cover_image: project.coverImage,
      category: project.category,
      author_id: project.authorId,
      author_name: project.authorName,
      supplies: project.supplies,
      steps: project.steps,
      likes: project.likes
    });

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('communityUpdated'));
};

export const deleteCommunityProject = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('community_projects')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('communityUpdated'));
};
