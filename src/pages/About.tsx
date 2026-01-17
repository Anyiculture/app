import { motion } from 'framer-motion';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { useI18n } from '../contexts/I18nContext';

export function About() {
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-gray-50 pt-16 relative overflow-hidden">
      <BackgroundBlobs />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="text-center"
        >
          <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            {t('about.title')} <span className="text-vibrant-purple">{t('common.brand')}</span>
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto font-medium">
             {t('about.subtitle')}
          </p>
        </motion.div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            <motion.div
               initial={{ opacity: 0, x: -50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
               className="relative rounded-[2rem] overflow-hidden shadow-2xl aspect-[4/3] group"
            >
               <div className="absolute inset-0 bg-vibrant-purple/10 group-hover:bg-transparent transition-colors z-10" />
               <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80" alt={t('about.teamAlt')} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
            </motion.div>
            <motion.div
               initial={{ opacity: 0, x: 50 }}
               whileInView={{ opacity: 1, x: 0 }}
               viewport={{ once: true }}
            >
                <div className="inline-block px-3 py-1 rounded-full bg-vibrant-pink/10 text-vibrant-pink text-sm font-bold mb-4">
                    {t('about.storyBadge')}
                </div>
                <h2 className="text-3xl font-bold font-display mb-6 text-gray-900">{t('about.storyTitle')}</h2>
                <p className="text-gray-600 mb-6 text-lg leading-relaxed">
                    {t('about.storyP1')}
                </p>
                <p className="text-gray-600 text-lg leading-relaxed">
                    {t('about.storyP2')}
                </p>
                
                <div className="mt-8 grid grid-cols-3 gap-6">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-vibrant-purple">{t('about.stats.countries')}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">{t('about.countries')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-vibrant-pink">{t('about.stats.users')}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">{t('about.users')}</div>
                    </div>
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{t('about.stats.support')}</div>
                        <div className="text-xs text-gray-500 font-bold uppercase mt-1">{t('about.support')}</div>
                    </div>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
