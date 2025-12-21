import { ForumPost } from '../types';
import { supabase, isSupabaseConfigured, handleDbError } from '../services/supabase';

export const getAllPosts = async (): Promise<ForumPost[]> => {
  if (!isSupabaseConfigured || !supabase) return [];

  try {
    const { data, error } = await supabase
      .from('forum_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Error fetching posts:", e);
    return [];
  }
};

export const createPost = async (post: Omit<ForumPost, 'id' | 'created_at' | 'likes' | 'replies'>) => {
  if (!isSupabaseConfigured || !supabase) throw new Error("Base de datos no configurada");

  const { error } = await supabase
    .from('forum_posts')
    .insert({
      title: post.title,
      content: post.content,
      author: post.author,
      tags: post.tags,
      likes: 0,
      replies: 0
    });

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('forumUpdated'));
};

export const likePost = async (id: string, currentLikes: number) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('forum_posts')
    .update({ likes: currentLikes + 1 })
    .eq('id', id);

  if (error) handleDbError(error);
  window.dispatchEvent(new Event('forumUpdated'));
};

export const deletePost = async (id: string) => {
  if (!isSupabaseConfigured || !supabase) return;

  const { error } = await supabase
    .from('forum_posts')
    .delete()
    .eq('id', id);

  if (error) {
    handleDbError(error);
    throw error;
  }
  window.dispatchEvent(new Event('forumUpdated'));
};