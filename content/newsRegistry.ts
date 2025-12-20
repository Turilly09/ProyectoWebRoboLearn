
import { NewsItem } from '../types';
import { supabase, handleDbError } from '../services/supabase';
import { n1 } from './news/n1';
import { n2 } from './news/n2';
import { n3 } from './news/n3';
import { n4 } from './news/n4';

const STATIC_NEWS: NewsItem[] = [n1, n2, n3, n4];

// Get all news including static and dynamic items
export const getAllNews = async (): Promise<NewsItem[]> => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Fallback a noticias estáticas:', error.message);
      return STATIC_NEWS;
    }

    // Map database snake_case columns to the CamelCase properties expected by the NewsItem interface
    const dynamic = (data || []).map((n: any) => ({
      ...n,
      readTime: n.read_time
    }));

    return [...dynamic, ...STATIC_NEWS];
  } catch (e) {
    return STATIC_NEWS;
  }
};

// Added missing getDynamicNews function used in ContentStudio
export const getDynamicNews = async (): Promise<NewsItem[]> => {
  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    
    // Map database snake_case columns to the CamelCase properties expected by the NewsItem interface
    return (data || []).map((n: any) => ({
      ...n,
      readTime: n.read_time
    }));
  } catch (e) {
    return [];
  }
};

// Save or update news in Supabase
export const saveDynamicNews = async (news: NewsItem) => {
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
      read_time: news.readTime, // Ensure we use snake_case for the database column
      date: news.date
    });

  if (error) handleDbError(error);
  window.dispatchEvent(new Event('newsUpdated'));
};
