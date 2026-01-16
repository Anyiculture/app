import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, Sparkles, ArrowRight, PartyPopper } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui';
import { motion } from 'framer-motion';
import { useI18n } from '../contexts/I18nContext';

export function AuPairPaymentSuccessPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifyAndActivate = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        // 1. Update Host Family Profile Status to Active
        await supabase
          .from('host_family_profiles')
          .update({ profile_status: 'active' })
          .eq('user_id', user.id);

        // 2. Update Subscription Status in Profiles
        await supabase
          .from('profiles')
          .update({ 
            au_pair_subscription_status: 'premium',
            au_pair_onboarding_completed: true
          })
          .eq('id', user.id);

        setVerifying(false);
      } catch (err) {
        console.error('Activation failed:', err);
        setVerifying(false);
      }
    };

    verifyAndActivate();
  }, []);

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden flex items-center justify-center">
      <BackgroundBlobs />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl w-full px-6 relative z-10"
      >
        <GlassCard className="p-16 border-white/60 bg-white/80 backdrop-blur-3xl text-center shadow-2xl rounded-[3rem] overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500" />
          
          {verifying ? (
            <div className="flex flex-col items-center">
               <motion.div 
                 animate={{ rotate: 360 }}
                 transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                 className="w-24 h-24 bg-pink-50 rounded-[2rem] flex items-center justify-center mb-10 border border-pink-100 shadow-xl"
               >
                 <Loader2 className="text-pink-600" size={40} />
               </motion.div>
               <h2 className="text-4xl font-black text-gray-900 mb-4 uppercase tracking-tight">Confirming Payment</h2>
               <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest">Please wait while we activate your account</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
               <motion.div 
                 initial={{ scale: 0, rotate: -45 }}
                 animate={{ scale: 1, rotate: 0 }}
                 className="w-24 h-24 bg-green-50 rounded-[2rem] flex items-center justify-center mb-10 border border-green-100 shadow-xl relative"
               >
                 <div className="absolute inset-0 bg-green-400 blur-2xl opacity-20 animate-pulse" />
                 <CheckCircle className="text-green-600 relative z-10" size={40} />
               </motion.div>
               <h2 className="text-5xl font-black text-gray-900 mb-6 uppercase tracking-tight">Success!</h2>
               <p className="text-xl text-gray-400 font-black uppercase tracking-widest mb-12 max-w-sm mx-auto leading-relaxed pt-6 border-t border-gray-100">
                 Your profile is now active and you have full access
               </p>
               
               <motion.button 
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 onClick={() => navigate('/dashboard')} 
                 className="group w-full h-16 bg-gray-900 text-white rounded-[1.5rem] text-[12px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-800 transition-all flex items-center justify-center gap-4"
               >
                 <PartyPopper size={20} className="group-hover:rotate-12 transition-transform" />
                 Explore {t('common.dashboard') || 'Dashboard'}
                 <ArrowRight size={20} />
               </motion.button>
            </div>
          )}
        </GlassCard>
        
        {!verifying && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="mt-12 flex justify-center gap-8"
          >
             <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <Sparkles size={14} className="text-pink-500" />
                Premium Member
             </div>
             <div className="flex items-center gap-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <PartyPopper size={14} className="text-purple-500" />
                Welcome Aboard
             </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
