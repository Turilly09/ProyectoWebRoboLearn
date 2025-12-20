import { NewsItem } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';
import { n1 } from './news/n1';
import { n2 } from './news/n2';
import { n3 } from './news/n3';
import { n4 } from './news/n4';

const STATIC_NEWS: NewsItem[] = [n1, n2, n3, n4];

export const getAllNews = async (): Promise<NewsItem[]> => {
  if (!isSupabaseConfigured || !supabase) return STATIC_NEWS;

  try {
    const { data, error } = await supabase
      .from('news')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return STATIC_NEWS;

    const dynamic = (data || []).map((n: any) => ({
      ...n,
      readTime: n.read_time
    }));

    return [...dynamic, ...STATIC_NEWS];
  } catch (e) {
    return STATIC_NEWS;
  }
};

export const getDynamicNews = async (): Promise<NewsItem[]> => {
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

  if (error) handleDbError(error);
  window.dispatchEvent(new Event('newsUpdated'));
};