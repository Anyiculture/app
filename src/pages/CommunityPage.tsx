import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { MessageSquare, Heart, MessageCircle, User, Send, ArrowLeft } from 'lucide-react';
import { communityService, CommunityPost, CommunityComment } from '../services/communityService';
import { Button } from '../components/ui/Button';
import { Textarea } from '../components/ui/Textarea';
import { CommunityFiltersBar } from '../components/community/CommunityFiltersBar';
import { useToast } from '../components/ui/Toast';
import { format } from 'date-fns';

import { ImageUpload } from '../components/ui/ImageUpload';

export function CommunityPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImages, setNewPostImages] = useState<string[]>([]);
  const [posting, setPosting] = useState(false);
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, CommunityComment[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});
  
  const [filters, setFilters] = useState({
    category: 'all',
    sort: 'newest',
    search: ''
  });

  useEffect(() => {
    loadPosts();
  }, [filters.category]); // Reload when category changes as it's server-side

  useEffect(() => {
    applyFilters();
  }, [posts, filters.sort, filters.search]); // Client-side filter/sort

  const loadPosts = async () => {
    try {
      setLoading(true);
      const serverFilters = filters.category !== 'all' ? { category: filters.category } : undefined;
      const data = await communityService.getPosts(serverFilters);
      setPosts(data);

      if (user) {
        const liked: Record<string, boolean> = {};
        // Optimize: verify likes in bulk or rely on data if optimized, but loop is fine for now
        // Assuming current service doesn't return user_has_liked efficienty, checking one by one is slow
        // But let's stick to existing logic for now
        await Promise.all(data.map(async (post) => {
           const hasLiked = await communityService.checkUserLiked(post.id, user.id);
           liked[post.id] = hasLiked;
        }));
        setLikedPosts(liked);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...posts];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(post => 
        post.content.toLowerCase().includes(searchLower) ||
        post.author?.profiles?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Sort
    switch (filters.sort) {
      case 'popular':
        result.sort((a, b) => b.likes_count - a.likes_count);
        break;
      case 'trending':
        result.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count));
        break;
      case 'most_replies':
        result.sort((a, b) => b.comments_count - a.comments_count);
        break;
      case 'newest':
      default:
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }

    setFilteredPosts(result);
  };

  const handleFilterChange = (key: string, value: any) => {
    if (key === 'clear') {
      setFilters({
        category: 'all',
        sort: 'newest',
        search: ''
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleCreatePost = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!newPostContent.trim()) return;

    try {
      setPosting(true);
      await communityService.createPost({ 
        content: newPostContent,
        images: newPostImages,
        category: filters.category !== 'all' ? filters.category : undefined 
      });
      setNewPostContent('');
      setNewPostImages([]);
      await loadPosts();
    } catch (error) {
      console.error('Error creating post:', error);
      showToast('error', t('community.createPostError'));
    } finally {
      setPosting(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }

    try {
      const isLiked = likedPosts[postId];
      // Optimistic update
      setLikedPosts(prev => ({ ...prev, [postId]: !isLiked }));
      setFilteredPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, likes_count: isLiked ? Math.max(0, p.likes_count - 1) : p.likes_count + 1 };
        }
        return p;
      }));

      if (isLiked) {
        await communityService.unlikePost(postId);
      } else {
        await communityService.likePost(postId);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert if error (omitted for brevity, but good practice)
    }
  };

  const loadComments = async (postId: string) => {
    try {
      const data = await communityService.getComments(postId);
      setComments(prev => ({ ...prev, [postId]: data }));
    } catch (error) {
      console.error('Error loading comments:', error);
    }
  };

  const handleToggleComments = async (postId: string) => {
    if (expandedPost === postId) {
      setExpandedPost(null);
    } else {
      setExpandedPost(postId);
      if (!comments[postId]) {
        await loadComments(postId);
      }
    }
  };

  const handleAddComment = async (postId: string) => {
    if (!user) {
      navigate('/signin');
      return;
    }

    const content = commentText[postId];
    if (!content?.trim()) return;

    try {
      await communityService.createComment({ post_id: postId, content });
      setCommentText(prev => ({ ...prev, [postId]: '' }));
      await loadComments(postId);
      
      // Update comment count locally
      setFilteredPosts(prev => prev.map(p => {
        if (p.id === postId) {
          return { ...p, comments_count: p.comments_count + 1 };
        }
        return p;
      }));
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleShare = async (post: CommunityPost) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Anyiculture Community Post',
          text: post.content.substring(0, 100),
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        showToast('success', t('common.linkCopied'));
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F9FAFB] font-sans">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 hidden md:block">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 -ml-2 text-gray-400 hover:text-gray-900 transition-colors rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">
              {t('nav.community')}
            </h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-0 md:py-6">
        
        {/* Filter Bar */}
        <CommunityFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={() => handleFilterChange('clear', null)}
          resultsCount={filteredPosts.length}
        />

        {/* Create Post Section */}
        {user && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-4 md:mb-8 transition-shadow hover:shadow-md">
            <div className="flex gap-3 md:gap-4 mb-4">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gradient-to-tr from-cyan-400 to-blue-500 p-0.5 flex-shrink-0">
                <div className="w-full h-full rounded-full bg-white flex items-center justify-center overflow-hidden">
                   {user.user_metadata?.avatar_url ? (
                      <img src={user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                   ) : (
                      <span className="font-bold text-[10px] md:text-xs text-transparent bg-clip-text bg-gradient-to-tr from-cyan-400 to-blue-500">
                        {user.email?.[0].toUpperCase()}
                      </span>
                   )}
                </div>
              </div>
              <div className="flex-1">
                <Textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder={t('community.whatsOnYourMind')}
                  rows={2}
                  className="w-full bg-gray-50 border-gray-200 focus:bg-white transition-colors mb-3 text-sm"
                />
                <div className="mb-2">
                   <p className="text-xs font-medium text-gray-700 mb-2">{t('common.upload.addPhotos')}</p>
                   <ImageUpload
                     value={newPostImages}
                     onChange={setNewPostImages}
                     maxImages={4}
                     bucketName="community-images"
                   />
                </div>
              </div>
            </div>
            <div className="flex justify-end border-t border-gray-50 pt-3">
              <Button
                onClick={handleCreatePost}
                disabled={posting || !newPostContent.trim()}
                className="shadow-sm hover:shadow-md bg-gradient-to-r from-cyan-500 to-blue-600 border-none px-4 py-2 h-9 text-xs"
              >
                <Send size={14} className="mr-2" />
                {posting ? t('community.posting') : t('community.post')}
              </Button>
            </div>
          </div>
        )}

        {/* Results Count Footer (Desktop Only) */}
        <div className="hidden md:flex mb-4 items-center justify-between">
          <h2 className="text-gray-700 font-semibold text-sm">
            {loading ? t('common.loading') : t('community.discussions', { count: filteredPosts.length })}
          </h2>
        </div>

        {loading ? (
          <div className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl h-64 animate-pulse shadow-sm border border-gray-100" />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100 border-dashed">
            <MessageSquare className="mx-auto text-gray-300 mb-5" size={64} />
            <h3 className="text-gray-900 text-xl font-bold mb-2">{t('community.noPostsYet')}</h3>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">{t('community.noPostsDescription')}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.map((post) => {
              const authorName = post.author?.profiles?.full_name || post.author?.email || t('community.anonymous');
              const isExpanded = expandedPost === post.id;
              const postComments = comments[post.id] || [];
              const isLiked = likedPosts[post.id];

              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 hover:shadow-md transition-all duration-300 group">
                  <div className="flex items-start gap-3 mb-3 md:mb-4">
                    <div className="w-9 h-9 md:w-11 md:h-11 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {post.author?.profiles?.avatar_url ? (
                        <img
                          src={post.author.profiles.avatar_url}
                          alt={authorName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="text-gray-400" size={20} />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-gray-900 text-sm md:text-base hover:text-cyan-600 transition-colors cursor-pointer">{authorName}</p>
                         {post.category && (
                           <span className="text-xs font-medium px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full">
                             {t(`community.filters.categories.${post.category}`)}
                           </span>
                         )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{format(new Date(post.created_at), 'MMM d, yyyy • h:mm a')}</p>
                    </div>
                  </div>

                  <p className="text-gray-800 mb-4 md:mb-5 whitespace-pre-wrap leading-relaxed text-sm md:text-[15px]">{post.content}</p>

                  {/* Post Images */}
                  {post.images && post.images.length > 0 && (
                    <div className={`grid gap-2 mb-5 ${
                      post.images.length === 1 ? 'grid-cols-1' : 
                      post.images.length === 2 ? 'grid-cols-2' : 
                      'grid-cols-3'
                    }`}>
                      {post.images.map((img, idx) => (
                        <img 
                          key={idx} 
                          src={img} 
                          alt={`Post attachment ${idx+1}`} 
                          className="rounded-lg object-cover w-full h-48 md:h-64 border border-gray-100"
                        />
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-6 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleLike(post.id)}
                      className={`flex items-center gap-2 transition-all ${
                        isLiked ? 'text-rose-500' : 'text-gray-500 hover:text-rose-500'
                      }`}
                    >
                      <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                      <span className="font-medium text-sm">{post.likes_count}</span>
                    </button>
                    <button
                      onClick={() => handleToggleComments(post.id)}
                      className={`flex items-center gap-2 transition-all ${
                        isExpanded ? 'text-cyan-600' : 'text-gray-500 hover:text-cyan-600'
                      }`}
                    >
                      <MessageCircle size={20} className={isExpanded ? 'fill-current opacity-20' : ''} />
                      <span className="font-medium text-sm">{post.comments_count}</span>
                    </button>
                    
                    <button 
                      onClick={() => handleShare(post)}
                      className="flex items-center gap-2 text-gray-500 hover:text-gray-700 ml-auto text-sm font-medium"
                    >
                      {t('community.share')}
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-gray-100 space-y-5 animate-in fade-in slide-in-from-top-2 duration-200">
                      {user && (
                        <div className="flex gap-3 items-start">
                          <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-1">
                             <User className="text-cyan-600" size={14} />
                          </div>
                          <div className="flex-1 gap-2">
                            <div className="relative">
                              <input
                                type="text"
                                value={commentText[post.id] || ''}
                                onChange={(e) => setCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                                placeholder={t('community.writeComment')}
                                className="w-full pl-4 pr-12 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 focus:bg-white transition-all text-sm"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddComment(post.id);
                                  }
                                }}
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentText[post.id]?.trim()}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-cyan-600 hover:bg-cyan-50 rounded-lg disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                              >
                                <Send size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="space-y-4 pl-2 sm:pl-4">
                        {postComments.map((comment) => {
                          const commentAuthor = comment.author?.profiles?.full_name || comment.author?.email || t('community.anonymous');
                          return (
                            <div key={comment.id} className="flex gap-3 group/comment">
                              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5 overflow-hidden">
                                {comment.author?.profiles?.avatar_url ? (
                                  <img
                                    src={comment.author.profiles.avatar_url}
                                    alt={commentAuthor}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <User className="text-gray-400" size={14} />
                                )}
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-2xl px-4 py-2.5 inline-block min-w-[200px]">
                                  <p className="text-xs font-bold text-gray-900 mb-0.5">{commentAuthor}</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{comment.content}</p>
                                </div>
                                <div className="flex items-center gap-3 mt-1 ml-2">
                                  <span className="text-[11px] text-gray-400">{format(new Date(comment.created_at), 'MMM d, h:mm a')}</span>
                                  <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-800">{t('community.like')}</button>
                                  <button className="text-[11px] font-semibold text-gray-500 hover:text-gray-800">{t('community.reply')}</button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
