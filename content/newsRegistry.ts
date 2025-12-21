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

    return (data || []).map((n: any) => ({
      ...n,
      readTime: n.read_time
    }));
  } catch (e) {
    return [];
  }
};

export const getDynamicNews = async (): Promise<NewsItem[]> => {
  return getAllNews();
};

export const saveDynamicNews = async (news: NewsItem) => {
  if (!isSupabaseConfigured || !supabase) return;
  const { error } = await supabase
    .from('news')
    .upsert({
      id: news.id,
      title: news.title,
      excerpt: news.excerpt,
      content: news.content,
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