import { motion } from 'framer-motion';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { ScrollText, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

export function Terms() {
  const { t } = useI18n();

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
           <div className="inline-flex items-center justify-center p-3 bg-blue-100 rounded-2xl mb-6">
            <ScrollText className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
            {t('terms.title')} <span className="text-blue-600">{t('terms.titleHighlight')}</span>
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
             {t('terms.subtitle')}
          </p>
        </motion.div>

        <div className="space-y-8">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
            >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" size={20} />
                    {t('terms.section1Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                    {t('terms.section1Content')}
                </p>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
            >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertCircle className="text-orange-500" size={20} />
                     {t('terms.section2Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed mb-4">
                    {t('terms.section2Content')}
                </p>
                <ul className="list-disc list-inside text-gray-600 space-y-2 ml-4">
                    <li>{t('terms.list1')}</li>
                    <li>{t('terms.list2')}</li>
                    <li>{t('terms.list3')}</li>
                </ul>
            </motion.div>

             <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100"
            >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <HelpCircle className="text-vibrant-purple" size={20} />
                     {t('terms.section3Title')}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                    {t('terms.section3Content')} <span className="font-semibold text-vibrant-purple">{t('terms.contactEmail')}</span>.
                </p>
            </motion.div>
        </div>
      </div>
    </div>
  );
}
