import { NewsItem } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

export const getAllNews = async (): Promise<NewsItem[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data || []).map((n: any) => {
      // Intentamos detectar si el contenido es un JSON array de bloques
      let blocks = [];
      let contentStr = n.content;

      if (contentStr && typeof contentStr === 'string' && contentStr.trim().startsWith('[')) {
          try {
              blocks = JSON.parse(contentStr);
              // Si parsea correctamente, podemos dejar contentStr vacío o usar el primer bloque de texto como excerpt fallback
              // Pero mantenemos el raw por seguridad.
          } catch (e) {
              // No era JSON, es texto legacy
          }
      }

      return {
        ...n,
        readTime: n.read_time,
        blocks: blocks.length > 0 ? blocks : undefined,
        content: contentStr // Mantenemos el original
      };
    });
  } catch (e) {
    return [];
  }
};

export const getDynamicNews = async (): Promise<NewsItem[]> => {
  return getAllNews();
};

export const saveDynamicNews = async (news: NewsItem) => {
  if (!isSupabaseConfigured || !supabase) return;

  // Lógica inteligente: Si hay bloques, los guardamos serializados en 'content'.
  // Si no hay bloques, guardamos el string 'content' normal.
  let contentToSave = news.content;
  
  if (news.blocks && news.blocks.length > 0) {
      contentToSave = JSON.stringify(news.blocks);
  }

  const { error } = await supabase
    .from('news')
    .upsert({
      id: news.id,
      title: news.title,
      excerpt: news.excerpt,
      content: contentToSave, // Aquí va la magia (JSON string o Texto plano)
      author: news.author,
      category: news.category,
      image: news.image,
      read_time: news.readTime,
      date: news.date
    });

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('newsUpdated'));
};

export const deleteDynamicNews = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error, count } = await supabase
    .from('news')
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw new Error(error.message);
  }
  
  if (count === 0) {
    throw new Error("No se pudo eliminar la noticia o no existe.");
  }
  window.dispatchEvent(new Event('newsUpdated'));
};