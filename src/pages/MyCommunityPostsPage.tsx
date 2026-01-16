import { useState, useEffect } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { ArrowLeft, MessageSquare, Trash2, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function MyCommunityPostsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  // Mock data
  const posts = [
    {
      id: '1',
      title: 'Best places to visit in Shanghai?',
      category: 'Travel',
      date: '2024-03-12',
      likes: 12,
      comments: 5
    }
  ];

  useEffect(() => {
    setTimeout(() => setLoading(false), 600);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate('/community')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="text-gray-600" size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('community.myPosts.title')}</h1>
        </div>

        {loading ? (
           <div className="h-32 bg-white rounded-xl animate-pulse" />
        ) : (
          <div className="space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-white p-6 rounded-xl border border-gray-100 flex justify-between items-center group">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{post.title}</h3>
                  <div className="flex gap-4 text-sm text-gray-500">
                    <span>{post.category}</span>
                    <span>•</span>
                    <span>{post.date}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MessageSquare size={14} /> {post.comments}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                    <Edit2 size={18} />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
