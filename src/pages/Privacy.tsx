import { motion } from 'framer-motion';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

export function Privacy() {
  const { t } = useI18n();

  const sections = [
    {
      icon: Eye,
      title: t('privacy.section1Title'),
      content: t('privacy.section1Content')
    },
    {
      icon: Lock,
      title: t('privacy.section2Title'),
      content: t('privacy.section2Content')
    },
    {
      icon: Shield,
      title: t('privacy.section3Title'),
      content: t('privacy.section3Content')
    },
    {
      icon: FileText,
      title: t('privacy.section4Title'),
      content: t('privacy.section4Content')
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 relative overflow-hidden">
      <BackgroundBlobs />
      <div className="mx-auto max-w-4xl px-6 lg:px-8 py-12">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.6 }}
           className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center p-3 bg-vibrant-purple/10 rounded-2xl mb-6">
            <Shield className="w-8 h-8 text-vibrant-purple" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            {t('privacy.title')} <span className="text-vibrant-purple">{t('privacy.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
             {t('privacy.subtitle')}
          </p>
        </motion.div>

        <div className="space-y-8">
            {sections.map((section, index) => (
                <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-lg border border-white/60 hover:shadow-xl transition-all"
                >
                    <div className="flex items-start gap-4">
                        <div className="bg-vibrant-pink/10 p-3 rounded-xl text-vibrant-pink shrink-0">
                            <section.icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{section.title}</h3>
                            <p className="text-gray-600 leading-relaxed">{section.content}</p>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>

        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-16 text-center text-sm text-gray-500"
        >
            {t('privacy.lastUpdated')}
        </motion.div>
      </div>
    </div>
  );
}
