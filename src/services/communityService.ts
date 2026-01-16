import { supabase } from '../lib/supabase';

export interface CommunityPost {
  id: string;
  author_id: string;
  content: string;
  images: string[];
  category: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  updated_at: string;
  author?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  user_has_liked?: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  author?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export interface CreatePostData {
  content: string;
  images?: string[];
  category?: string;
}

export interface CreateCommentData {
  post_id: string;
  content: string;
}

export const communityService = {
  async getPosts(filters?: { category?: string }): Promise<CommunityPost[]> {
    let query = supabase
      .from('community_posts')
      .select(`
        *
      `)
      .eq('is_deleted', false)
      .order('created_at', { ascending: false });

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getPostById(id: string): Promise<CommunityPost | null> {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createPost(postData: CreatePostData): Promise<CommunityPost> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('community_posts')
      .insert({
        author_id: user.id,
        content: postData.content,
        image_urls: postData.images || [],
        category: postData.category || null,
        likes_count: 0,
        comments_count: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getComments(postId: string): Promise<CommunityComment[]> {
    const { data, error } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .eq('is_deleted', false)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async createComment(commentData: CreateCommentData): Promise<CommunityComment> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('community_comments')
      .insert({
        post_id: commentData.post_id,
        author_id: user.id,
        content: commentData.content,
      })
      .select()
      .single();

    if (error) throw error;

    await supabase.rpc('increment_post_comments', { post_id: commentData.post_id });

    return data;
  },


  async likePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('community_likes')
      .insert({
        post_id: postId,
        user_id: user.id,
      });

    if (error) throw error;

    const { data: post } = await supabase
      .from('community_posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('community_posts')
        .update({ likes_count: post.likes_count + 1 })
        .eq('id', postId);
    }
  },

  async unlikePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('community_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) throw error;

    const { data: post } = await supabase
      .from('community_posts')
      .select('likes_count')
      .eq('id', postId)
      .single();

    if (post) {
      await supabase
        .from('community_posts')
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq('id', postId);
    }
  },

  async checkUserLiked(postId: string, userId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('community_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async updatePost(postId: string, content: string, imageUrls?: string[]): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('community_posts')
      .update({
        content,
        image_urls: imageUrls,
        edited_at: new Date().toISOString(),
      })
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) throw error;
  },

  async deletePost(postId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('community_posts')
      .update({ is_deleted: true })
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) throw error;
  },

  async updateComment(commentId: string, content: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('community_comments')
      .update({
        content,
        edited_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('author_id', user.id);

    if (error) throw error;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: comment } = await supabase
      .from('community_comments')
      .select('post_id')
      .eq('id', commentId)
      .single();

    const { error } = await supabase
      .from('community_comments')
      .update({ is_deleted: true })
      .eq('id', commentId)
      .eq('author_id', user.id);

    if (error) throw error;

    if (comment?.post_id) {
      await supabase.rpc('decrement_post_comments', { post_id: comment.post_id });
    }
  },

  async reportContent(contentType: 'post' | 'comment', contentId: string, reason: string, description?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('community_reports')
      .insert({
        content_type: contentType,
        content_id: contentId,
        reported_by: user.id,
        reason,
        description,
      });

    if (error) throw error;
  },

  async getContentReports(contentType: 'post' | 'comment', contentId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('community_reports')
      .select('*')
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};