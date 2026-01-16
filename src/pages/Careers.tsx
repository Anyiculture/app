import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { Button } from '../components/ui/Button';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';

export function Careers() {
  const { t } = useI18n();
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    resume_url: ''
  });

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // In a real app, we would upload to storage here. For now, simulate or store text.
      const { error } = await supabase
        .from('job_applications')
        .insert([{
          job_title: selectedJob,
          applicant_name: formData.name,
          applicant_email: formData.email,
          resume_url: formData.resume_url // Placeholder or text link
        }]);

      if (error) throw error;
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setSelectedJob(null);
        setFormData({ name: '', email: '', resume_url: '' });
      }, 3000);
    } catch (error) {
      console.error(error);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  const jobs = [
    { title: 'Senior React Developer', location: 'Remote / Shanghai', type: 'Full-time' },
    { title: 'Product Designer', location: 'Shanghai', type: 'Full-time' },
    { title: 'Community Manager', location: 'Beijing', type: 'Part-time' },
    { title: 'Marketing Specialist', location: 'Remote', type: 'Full-time' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-16 relative overflow-hidden">
      <BackgroundBlobs />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24 text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
             <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
                {t('careers.title')} <span className="text-vibrant-purple">{t('careers.titleHighlight')}</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                {t('careers.subtitle')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto text-left">
                {jobs.map((job) => (
                    <motion.div 
                        key={job.title} 
                        whileHover={{ scale: 1.02 }}
                        className="bg-white/80 backdrop-blur-md p-6 rounded-2xl shadow-lg border border-white/60 flex justify-between items-center group hover:border-vibrant-purple/30 transition-all cursor-pointer"
                        onClick={() => setSelectedJob(job.title)}
                    >
                        <div>
                            <h3 className="text-xl font-bold text-gray-900">{job.title}</h3>
                            <p className="text-gray-500 text-sm mt-1">{job.location} • {job.type}</p>
                        </div>
                        <Button variant="outline" className="text-vibrant-purple border-vibrant-purple hover:bg-vibrant-purple hover:text-white transition-colors">
                           {t('careers.applyBtn')}
                        </Button>
                    </motion.div>
                ))}
            </div>
        </motion.div>
      </div>

      {/* Application Modal */}
      <AnimatePresence>
        {selectedJob && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
           >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }} 
                animate={{ scale: 1, opacity: 1 }} 
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                 <button onClick={() => setSelectedJob(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                    <X size={24} />
                 </button>

                 {submitted ? (
                     <div className="text-center py-12">
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <CheckCircle2 className="w-8 h-8 text-green-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('careers.appSuccess')}</h3>
                        <p className="text-gray-500">{t('careers.appSuccessDesc')}</p>
                     </div>
                 ) : (
                    <>
                        <h3 className="text-2xl font-bold font-display text-gray-900 mb-2">{t('careers.applyFor')}</h3>
                        <p className="text-vibrant-purple font-bold mb-6">{selectedJob}</p>

                        <form onSubmit={handleApply} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.formName')}</label>
                                <input 
                                  type="text" 
                                  required 
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-vibrant-purple focus:border-vibrant-purple outline-none" 
                                  value={formData.name}
                                  onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('contact.formEmail')}</label>
                                <input 
                                  type="email" 
                                  required 
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-vibrant-purple focus:border-vibrant-purple outline-none" 
                                  value={formData.email}
                                  onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('careers.portfolioLink')}</label>
                                <input 
                                  type="url" 
                                  className="w-full px-4 py-2 rounded-xl border border-gray-200 focus:ring-vibrant-purple focus:border-vibrant-purple outline-none" 
                                  placeholder={t('careers.resumePlaceholder')}
                                  value={formData.resume_url}
                                  onChange={e => setFormData({...formData, resume_url: e.target.value})}
                                />
                            </div>
                            <Button 
                                type="submit" 
                                className="w-full mt-2 bg-gray-900 text-white hover:bg-vibrant-purple"
                                disabled={loading}
                            >
                                {loading ? <Loader2 className="animate-spin mr-2 w-4 h-4" /> : null}
                                {t('careers.submitApp')}
                            </Button>
                        </form>
                    </>
                 )}
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
