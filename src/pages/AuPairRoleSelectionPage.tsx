import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { ArrowLeft, ArrowRight, CheckCircle, Baby, Sparkles } from 'lucide-react';
import { auPairService } from '../services/auPairService';
import { useState } from 'react';
import { BackgroundBlobs } from '../components/ui';
import { motion } from 'framer-motion';

export function AuPairRoleSelectionPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = async (role: 'host_family' | 'au_pair') => {
    if (!user) {
      navigate('/signin?redirect=/au-pair/select-role');
      return;
    }

    setLoading(true);
    try {
      await auPairService.setUserRole(role);
      // After setting role, redirect to the main au pair page handler which will route to onboarding
      navigate('/aupair/onboarding'); 
    } catch (error) {
      console.error('Failed to set role:', error);
      alert('Failed to set role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden flex flex-col">
      <BackgroundBlobs />
      
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-xl border-b border-white/40 h-14 sm:h-20 px-4 sm:px-6 sticky top-0 z-50 shadow-sm flex items-center">
        <div className="max-w-[100rem] mx-auto w-full flex justify-between items-center">
             <motion.button 
               whileHover={{ x: -4 }}
               onClick={() => navigate('/dashboard')} 
               className="flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-vibrant-purple transition-all"
             >
               <ArrowLeft size={16} />
               <span className="hidden sm:inline">{t('auPair.roleSelection.backToDashboard')}</span>
               <span className="sm:hidden">{t('common.back')}</span>
             </motion.button>

             <div className="flex items-center gap-2 sm:gap-3">
               <div className="w-7 h-7 sm:w-8 sm:h-8 bg-vibrant-purple/10 rounded-lg flex items-center justify-center text-vibrant-purple">
                 <Baby size={16} />
               </div>
               <h1 className="text-xs sm:text-sm font-black text-gray-900 uppercase tracking-widest">
                 {t('auPair.roleSelection.programTitle')}
               </h1>
             </div>
             
             <div className="w-16 sm:w-24"></div> 
        </div>
      </div>

      <div className="flex-1 flex px-4 sm:px-6 py-4 sm:py-16 items-center justify-center relative z-10">
        <div className="max-w-7xl w-full">
          <div className="text-center mb-4 sm:mb-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="inline-flex items-center justify-center w-8 h-8 sm:w-14 sm:h-14 bg-white border border-white/60 shadow-xl rounded-xl sm:rounded-2xl mb-4 sm:mb-6 text-vibrant-purple"
            >
              <Sparkles size={16} className="sm:hidden" />
              <Sparkles size={32} className="hidden sm:block" />
            </motion.div>
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="text-lg sm:text-3xl font-black text-gray-900 mb-2 sm:mb-4 uppercase tracking-tight leading-tight"
            >
              {t('auPair.roleSelection.joinGlobalFamily')}
            </motion.h1>
            <motion.p 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-[9px] sm:text-sm text-gray-500 font-medium max-w-2xl mx-auto leading-relaxed"
            >
              {t('auPair.roleSelection.globalFamilyDesc')}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-10">
            
            {/* Host Family Card */}
            <motion.div
              initial={{ x: -40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <button
                onClick={() => handleRoleSelect('host_family')}
                disabled={loading}
                className="group relative overflow-hidden rounded-xl sm:rounded-[2rem] bg-white shadow-xl text-left h-[220px] sm:h-[380px] w-full flex flex-col transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1511895426328-dc8714191300?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                </div>
                
                <div className="relative z-10 mt-auto p-4 sm:p-8 text-white">
                  <div className="flex items-center gap-2 mb-2 sm:mb-6">
                     <span className="bg-vibrant-purple text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl uppercase tracking-widest shadow-xl border border-white/20">
                       {t('auPair.roleSelection.hostFamilyLabel')}
                     </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black mb-0.5 sm:mb-2 uppercase tracking-tight group-hover:text-vibrant-purple transition-colors duration-300">
                    {t('auPair.roleSelection.hostFamilyTitle')}
                  </h3>
                  <p className="text-gray-300 mb-2 sm:mb-4 text-[9px] sm:text-xs font-medium leading-relaxed opacity-90 line-clamp-2">
                    {t('auPair.roleSelection.hostFamilyDescription')}
                  </p>
                  <div className="hidden sm:flex flex-col gap-2 mb-6">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                         <div className="w-4 h-4 rounded-lg bg-vibrant-purple/20 flex items-center justify-center">
                           <CheckCircle size={12} className="text-vibrant-purple"/>
                         </div>
                         {t(`auPair.roleSelection.hostFamilyBenefit${i}` as any)}
                       </div>
                     ))}
                  </div>
                  
                  <div className="inline-flex items-center gap-2 sm:gap-3 bg-white text-vibrant-purple px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-2xl transition-all group-hover:bg-vibrant-purple group-hover:text-white group-hover:scale-105 active:scale-95">
                    {t('auPair.roleSelection.getStarted')} <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </button>
            </motion.div>

            {/* Au Pair Card */}
            <motion.div
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => handleRoleSelect('au_pair')}
                disabled={loading}
                className="group relative overflow-hidden rounded-xl sm:rounded-[2rem] bg-white shadow-xl text-left h-[220px] sm:h-[380px] w-full flex flex-col transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80')] bg-cover bg-center transition-transform duration-1000 group-hover:scale-110">
                   <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                </div>

                <div className="relative z-10 mt-auto p-4 sm:p-8 text-white">
                  <div className="flex items-center gap-2 mb-2 sm:mb-6">
                     <span className="bg-vibrant-pink text-white text-[8px] sm:text-[10px] font-black px-2 sm:px-4 py-1 sm:py-2 rounded-lg sm:rounded-xl uppercase tracking-widest shadow-xl border border-white/20">
                       {t('auPair.roleSelection.auPairLabel')}
                     </span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black mb-0.5 sm:mb-2 uppercase tracking-tight group-hover:text-vibrant-pink transition-colors duration-300">
                    {t('auPair.roleSelection.auPairTitle')}
                  </h3>
                  <p className="text-gray-300 mb-2 sm:mb-4 text-[9px] sm:text-xs font-medium leading-relaxed opacity-90 line-clamp-2">
                    {t('auPair.roleSelection.auPairDescription')}
                  </p>
                  <div className="hidden sm:flex flex-col gap-2 mb-6">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="flex items-center gap-2 text-xs font-black uppercase tracking-widest opacity-80 group-hover:opacity-100 transition-opacity">
                         <div className="w-4 h-4 rounded-lg bg-vibrant-pink/20 flex items-center justify-center">
                           <CheckCircle size={12} className="text-vibrant-pink"/>
                         </div>
                         {t(`auPair.roleSelection.auPairBenefit${i}` as any)}
                       </div>
                     ))}
                  </div>
                  
                  <div className="inline-flex items-center gap-2 sm:gap-3 bg-white text-vibrant-pink px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl font-black text-[9px] sm:text-[10px] uppercase tracking-widest shadow-2xl transition-all group-hover:bg-vibrant-pink group-hover:text-white group-hover:scale-105 active:scale-95">
                    {t('auPair.roleSelection.joinNow')} <ArrowRight className="w-4 h-4 sm:w-4 sm:h-4" />
                  </div>
                </div>
              </button>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}
