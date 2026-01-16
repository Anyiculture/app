import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { FileText, Briefcase, GraduationCap, Users, Building2, HelpCircle, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui';
import { motion } from 'framer-motion';

export function VisaPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const visaTypes = [
    {
      id: 'work_z',
      icon: Briefcase,
      title: t('visa.types.work_z.title'),
      description: t('visa.types.work_z.description'),
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'student_x',
      icon: GraduationCap,
      title: t('visa.types.student_x.title'),
      description: t('visa.types.student_x.description'),
      color: 'from-teal-500 to-teal-600'
    },
    {
      id: 'family_q',
      icon: Users,
      title: t('visa.types.family_q.title'),
      description: t('visa.types.family_q.description'),
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'business_m',
      icon: Building2,
      title: t('visa.types.business_m.title'),
      description: t('visa.types.business_m.description'),
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'other',
      icon: HelpCircle,
      title: t('visa.types.other.title'),
      description: t('visa.types.other.description'),
      color: 'from-gray-500 to-gray-600'
    }
  ];

  useEffect(() => {
    if (user) {
      navigate('/visa/dashboard');
    }
  }, [user, navigate]);

  const handleCTA = () => {
    if (user) {
      navigate('/visa/dashboard');
    } else {
      setShowAuthModal(true);
    }
  };

  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      <div className="max-w-[100rem] mx-auto px-6 py-12 relative z-10">
        <div className="text-center mb-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white/80 border border-white/60 shadow-2xl rounded-[2rem] mb-6 text-vibrant-purple"
          >
            <FileText size={40} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight"
          >
            {t('visa.landing.title')}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto font-medium"
          >
            {t('visa.landing.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 mb-16">
          {visaTypes.map((type, index) => {
            const Icon = type.icon;
            return (
              <motion.div
                key={type.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                whileHover={{ y: -10 }}
                onClick={handleCTA}
                className="cursor-pointer group h-full"
              >
                <GlassCard className="h-full border-white/20 group-hover:border-vibrant-purple/30 group-hover:shadow-2xl transition-all duration-500 flex flex-col p-6">
                  <div className={`inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br ${type.color} rounded-2xl mb-6 shadow-xl group-hover:scale-110 transition-transform duration-500`}>
                    <Icon className="text-white" size={28} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight group-hover:text-vibrant-purple transition-colors">{type.title}</h3>
                  <p className="text-gray-500 text-sm font-medium mb-6 leading-relaxed flex-grow">{type.description}</p>
                  <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-vibrant-purple group-hover:gap-3 transition-all">
                    <span>{t('visa.landing.learnMore')}</span>
                    <ArrowRight size={16} />
                  </div>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>

        {/* Guidelines Section */}
        <GlassCard className="mb-16 border-white/40 bg-white/30 backdrop-blur-xl p-8 lg:p-12 border-dashed">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="w-10 h-0.5 bg-gradient-to-r from-transparent to-vibrant-purple/20" />
            <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight text-center">{t('visa.guidelines.title')}</h2>
            <div className="w-10 h-0.5 bg-gradient-to-l from-transparent to-vibrant-purple/20" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <motion.div 
              whileHover={{ y: -5 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-white border border-gray-100 rounded-3xl flex items-center justify-center mb-8 shadow-xl text-vibrant-purple">
                <Clock size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-3 uppercase tracking-tight">{t('visa.guidelines.timing.title')}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{t('visa.guidelines.timing.description')}</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-white border border-gray-100 rounded-3xl flex items-center justify-center mb-8 shadow-xl text-vibrant-purple">
                <FileText size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-3 uppercase tracking-tight">{t('visa.guidelines.documents.title')}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{t('visa.guidelines.documents.description')}</p>
            </motion.div>

            <motion.div 
              whileHover={{ y: -5 }}
              className="flex flex-col items-center text-center"
            >
              <div className="w-20 h-20 bg-white border border-gray-100 rounded-3xl flex items-center justify-center mb-8 shadow-xl text-vibrant-purple">
                <HelpCircle size={32} />
              </div>
              <h3 className="text-lg font-black text-gray-900 mb-3 uppercase tracking-tight">{t('visa.guidelines.assistance.title')}</h3>
              <p className="text-sm text-gray-500 font-medium leading-relaxed">{t('visa.guidelines.assistance.description')}</p>
            </motion.div>
          </div>
        </GlassCard>

        {/* CTA Card */}
        <motion.div
          whileHover={{ y: -8 }}
          className="relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-vibrant-purple to-vibrant-pink opacity-90" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1526045612212-70caf35c14df?auto=format&fit=crop&q=80')] mix-blend-overlay opacity-20 bg-cover bg-center" />
          
          <div className="relative z-10 p-10 lg:p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/20 shadow-2xl">
              <ShieldCheck className="text-white" size={32} />
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 uppercase tracking-tight">{t('visa.landing.readyToStart')}</h2>
            <p className="text-xl text-white/80 mb-12 max-w-2xl mx-auto font-medium leading-relaxed">
              {t('visa.landing.ctaDescription')}
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCTA}
              className="bg-white text-vibrant-purple px-12 py-5 rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-2xl flex items-center gap-3"
            >
              {t('visa.landing.startApplication')}
              <ArrowRight size={20} />
            </motion.button>
          </div>
        </motion.div>
      </div>

      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title={t('visa.landing.signInRequired')}
      >
        <div className="p-8">
          <div className="w-16 h-16 bg-vibrant-purple/10 rounded-2xl flex items-center justify-center mb-6 text-vibrant-purple mx-auto">
             <ShieldCheck size={32} />
          </div>
          <h3 className="text-2xl font-black text-center text-gray-900 uppercase tracking-tight mb-4">{t('visa.landing.signInRequired')}</h3>
          <p className="text-gray-500 text-center mb-10 font-medium">{t('visa.landing.signInMessage')}</p>
          <div className="flex flex-col gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/signin')}
              className="w-full px-6 py-4 bg-vibrant-purple text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-vibrant-purple/20 hover:bg-vibrant-purple/90 transition-colors"
            >
              {t('auth.login')}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/signup')}
              className="w-full px-6 py-4 border-2 border-gray-100 text-gray-900 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-colors"
            >
              {t('auth.signUp')}
            </motion.button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
