import { useState } from 'react';
import { motion } from 'framer-motion';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { Button } from '../components/ui/Button';
import { Mail, MapPin, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';

export function Contact() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('contact_submissions')
        .insert([formData]);

      if (error) throw error;
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert(t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-16 relative overflow-hidden">
      <BackgroundBlobs />
      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            <motion.div
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6 }}
            >
                <h1 className="font-display text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
                    {t('contact.title')} <span className="text-vibrant-pink">{t('contact.titleHighlight')}</span>
                </h1>
                <p className="text-lg text-gray-600 mb-12">
                    {t('contact.subtitle')}
                </p>

                <div className="space-y-6">
                    <div className="flex items-center gap-4 group">
                        <div className="bg-white p-4 rounded-full shadow-lg text-vibrant-purple border border-gray-100 group-hover:scale-110 transition-transform"><Mail size={24} /></div>
                        <div>
                            <p className="font-bold text-gray-900">{t('contact.email')}</p>
                            <p className="text-gray-600">{t('contact.emailValue')}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 group">
                        <div className="bg-white p-4 rounded-full shadow-lg text-vibrant-purple border border-gray-100 group-hover:scale-110 transition-transform"><Phone size={24} /></div>
                        <div>
                            <p className="font-bold text-gray-900">{t('contact.phone')}</p>
                            <p className="text-gray-600">{t('contact.phoneValue')}</p>
                        </div>
                    </div>
                     <div className="flex items-center gap-4 group">
                        <div className="bg-white p-4 rounded-full shadow-lg text-vibrant-purple border border-gray-100 group-hover:scale-110 transition-transform"><MapPin size={24} /></div>
                        <div>
                            <p className="font-bold text-gray-900">{t('contact.office')}</p>
                            <p className="text-gray-600">{t('landing.footer.addressValue')}</p>
                        </div>
                    </div>
                </div>
            </motion.div>
            
            <motion.div
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ duration: 0.6, delay: 0.2 }}
               className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl border border-white/60"
            >
                {submitted ? (
                   <div className="h-full flex flex-col items-center justify-center text-center py-12">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <CheckCircle2 className="w-8 h-8 text-green-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('contact.successTitle')}</h3>
                      <p className="text-gray-600">{t('contact.successMessage')}</p>
                      <Button onClick={() => setSubmitted(false)} variant="outline" className="mt-6">
                        {t('contact.sendAnother')}
                      </Button>
                   </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('contact.formName')}</label>
                          <input 
                            type="text" 
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-2 focus:ring-vibrant-purple/20 transition-all outline-none bg-white/50" 
                            placeholder={t('contact.placeholderName')}
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('contact.formEmail')}</label>
                          <input 
                            type="email" 
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-2 focus:ring-vibrant-purple/20 transition-all outline-none bg-white/50" 
                            placeholder={t('contact.placeholderEmail')}
                            value={formData.email}
                             onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                      </div>
                      <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">{t('contact.formMessage')}</label>
                          <textarea 
                            rows={4} 
                            required
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-2 focus:ring-vibrant-purple/20 transition-all outline-none bg-white/50 resize-none" 
                            placeholder={t('contact.placeholderMessage')}
                            value={formData.message}
                             onChange={(e) => setFormData({...formData, message: e.target.value})}
                          />
                      </div>
                      <Button 
                        type="submit" 
                        className="w-full py-4 text-lg bg-gradient-to-r from-vibrant-purple to-vibrant-pink text-white hover:opacity-90 shadow-lg shadow-vibrant-purple/25 rounded-xl"
                        disabled={loading}
                      >
                        {loading ? <Loader2 className="animate-spin mr-2" /> : <Send className="mr-2 w-5 h-5" />}
                        {t('contact.submit')}
                      </Button>
                  </form>
                )}
            </motion.div>
        </div>
      </div>
    </div>
  );
}
