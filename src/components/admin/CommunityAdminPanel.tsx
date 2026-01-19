import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { adminService } from '../../services/adminService';
import { StartConversationButton } from './ui/StartConversationButton';
import { Button, Modal } from '../ui';
import { Eye, ChevronLeft, ChevronRight, MessageSquare, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

const SimpleCard = ({ children, className = "", noPadding = false }: { children: React.ReactNode, className?: string, noPadding?: boolean }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}>
    {children}
  </div>
);

export function CommunityAdminPanel() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 10;
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  useEffect(() => {
    loadData();
  }, [page]);

  const loadData = async () => {
    try {
      const { data, total } = await adminService.getCommunityPosts(itemsPerPage, (page - 1) * itemsPerPage);
      setPosts(data);
      setTotal(total);
    } catch (error) {
      console.error('Error loading community posts:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t('admin.actions.deleteConfirm') || 'Are you sure you want to delete this post?')) {
      try {
        await adminService.deleteCommunityPost(id);
        loadData();
        if (selectedPost?.id === id) setSelectedPost(null);
      } catch (error) {
        console.error('Error deleting post:', error);
        alert('Failed to delete post');
      }
    }
  };

  const totalPages = Math.ceil(total / itemsPerPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-gray-900">{t('admin.community.management')}</h2>
      </div>

      <SimpleCard noPadding className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500">
              <tr>
                <th className="px-6 py-3 font-medium">{t('admin.community.columns.content')}</th>
                <th className="px-6 py-3 font-medium hidden md:table-cell">{t('admin.community.columns.author')}</th>
                <th className="px-6 py-3 font-medium hidden lg:table-cell">{t('admin.community.columns.date')}</th>
                <th className="px-6 py-3 font-medium text-right">{t('admin.community.columns.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                    {t('admin.community.noPosts')}
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                         {post.image_url && (
                            <img src={post.image_url} alt="Post" className="w-12 h-12 rounded object-cover bg-gray-100 shrink-0" />
                         )}
                         <div>
                            <p className="font-medium text-gray-900 line-clamp-2">{post.content}</p>
                            <div className="flex gap-2 mt-1">
                                <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <MessageSquare size={10} /> {post.comments_count || 0}
                                </span>
                            </div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <div className="text-gray-900">{post.author?.full_name || 'Unknown'}</div>
                      <div className="text-xs text-gray-500">{post.author?.email}</div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 hidden lg:table-cell">
                      {post.created_at ? format(new Date(post.created_at), 'MMM d, yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      <StartConversationButton 
                          userId={post.author_id} 
                          userName={post.author?.full_name || 'Author'} 
                          contextType="community" 
                          sourceContext={`Post by ${post.author?.full_name}`}
                          size="sm"
                          variant="ghost"
                          className="text-blue-600"
                      />
                      <Button size="sm" variant="outline" onClick={() => setSelectedPost(post)}>
                        <Eye size={14} className="mr-1" /> {t('admin.actions.view')}
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-600 hover:bg-red-50" onClick={() => handleDelete(post.id)}>
                        <Trash2 size={14} />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">
              {t('common.page')} {page} {t('common.of')} {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </SimpleCard>

      {selectedPost && (
        <Modal
          isOpen={!!selectedPost}
          onClose={() => setSelectedPost(null)}
          title={`Post Details`}
        >
          <div className="p-6 space-y-6">
             {selectedPost.image_url && (
                <img src={selectedPost.image_url} alt="Post" className="w-full h-48 object-cover rounded-lg" />
             )}
            <div>
                 <label className="text-xs text-gray-500 uppercase font-bold">Content</label>
                 <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{selectedPost.content}</p>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
              <StartConversationButton 
                  userId={selectedPost.author_id} 
                  userName={selectedPost.author?.full_name || 'Author'} 
                  contextType="community" 
                  sourceContext={`Post by ${selectedPost.author?.full_name}`}
                  size="sm"
                  variant="outline"
                  className="mr-auto"
                  label={t('admin.actions.messageUser')}
              />
              <Button
                size="sm"
                variant="ghost"
                className="text-red-600"
                onClick={() => handleDelete(selectedPost.id)}
              >
                {t('admin.actions.delete')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
