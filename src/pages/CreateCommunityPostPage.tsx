import { useState } from 'react';
import { useI18n } from '../contexts/I18nContext';
import { ArrowLeft, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/Toast';

export function CreateCommunityPostPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    category: 'general',
    content: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      showToast('success', t('community.createPost.success') || 'Post created successfully');
      navigate('/community');
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => navigate('/community')}
            className="p-2 hover:bg-white rounded-full transition-colors"
          >
            <ArrowLeft className="text-gray-600" size={24} />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{t('community.createPost.title')}</h1>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('community.createPost.postTitle')}</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder={t('community.createPost.titlePlaceholder')}
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('community.createPost.category')}</label>
              <select
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
              >
                <option value="general">{t('community.categories.general')}</option>
                <option value="visa_help">{t('community.categories.visaHelp')}</option>
                <option value="language_exchange">{t('community.categories.languageExchange')}</option>
                <option value="events">{t('community.categories.events')}</option>
                <option value="life_in_china">{t('community.categories.lifeInChina')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">{t('community.createPost.content')}</label>
              <textarea
                required
                rows={6}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                placeholder={t('community.createPost.contentPlaceholder')}
                value={formData.content}
                onChange={e => setFormData({...formData, content: e.target.value})}
              />
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading ? t('community.createPost.posting') : (
                  <>
                    <Send size={18} />
                    {t('community.createPost.postButton')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
