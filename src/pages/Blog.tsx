import { motion } from 'framer-motion';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { useI18n } from '../contexts/I18nContext';

export function Blog() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 pt-16 relative overflow-hidden">
      <BackgroundBlobs />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-12 text-center">
            {t('blog.title')} <span className="text-vibrant-purple">{t('blog.titleHighlight')}</span>
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
                <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all cursor-pointer group"
                >
                    <div className="h-48 bg-gray-200 relative overflow-hidden">
                        <img src={`https://images.unsplash.com/photo-${1520000000000 + i}?auto=format&fit=crop&w=500&q=60`} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="Blog" />
                    </div>
                    <div className="p-6">
                        <div className="text-sm text-vibrant-pink font-bold mb-2">{t('blog.category')}</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-vibrant-purple transition-colors">{t('blog.demoTitle')}</h3>
                        <p className="text-gray-600 text-sm">{t('blog.demoDesc')}</p>
                    </div>
                </motion.div>
            ))}
        </div>
      </div>
    </div>
  );
}
