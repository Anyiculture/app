import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { auPairService } from '../services/auPairService';
import { adminService } from '../services/adminService';
import { auPairMatchingService } from '../services/auPairMatchingService';
import { ProfileCard } from '../components/aupair/ProfileCard';
import { Baby, Heart, Home, Globe, ArrowRight, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { AuPairRoleSelectionPage } from './AuPairRoleSelectionPage';
import { GlassCard, BackgroundBlobs } from '../components/ui';
import { motion } from 'framer-motion';

function LoadingScreen() {
    const { t } = useI18n();
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        <BackgroundBlobs />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 bg-vibrant-purple/10 rounded-[2rem] flex items-center justify-center mb-8 mx-auto border border-vibrant-purple/20 shadow-2xl relative">
            <div className="absolute inset-0 border-2 border-vibrant-purple border-t-transparent rounded-[2rem] animate-spin" />
            <Baby className="text-vibrant-purple" size={32} />
          </div>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-loose">
            {t('common.loading')}
          </p>
        </div>
      </div>
    );
}

function AdminAuPairDashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [auPairs, setAuPairs] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [auPairData, familyData] = await Promise.all([
          auPairMatchingService.searchAuPairs({}),
          auPairMatchingService.searchHostFamilies({})
        ]);
        setAuPairs(auPairData || []);
        setFamilies(familyData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) return <LoadingScreen />;

  return (
    <div className="min-h-screen bg-white relative overflow-hidden font-sans">
      <BackgroundBlobs />
      
      <div className="max-w-[100rem] mx-auto px-6 py-8 relative z-10">
        <div className="flex items-center gap-6 mb-16">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-16 h-16 bg-white/80 border border-white/60 shadow-xl rounded-2xl flex items-center justify-center text-vibrant-purple"
          >
            <ShieldCheck size={32} />
          </motion.div>
          <div>
            <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">
              {t('admin.auPairManagement')}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-vibrant-purple animate-pulse" />
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Administrative Panel</p>
            </div>
          </div>
        </div>
        
        {/* Au Pairs Shelf */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-vibrant-purple/10 rounded-xl text-vibrant-purple">
                <Baby size={20} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                {t('auPair.qualifiedAuPairs')}
              </h2>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/au-pairs/browse')}
              className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
            >
              {t('common.viewAll')}
            </motion.button>
          </div>
          
          <div className="relative">
            <div className="flex gap-8 overflow-x-auto pb-8 snap-x no-scrollbar scroll-smooth">
              {auPairs.length > 0 ? (
                auPairs.map(profile => (
                  <div key={profile.id} className="w-[40vw] sm:w-[340px] flex-none snap-start">
                    <ProfileCard
                      profile={profile}
                      userRole="host_family" // Renders as Au Pair card
                      isFavorited={false}
                      onToggleFavorite={() => {}}
                      onView={(id) => navigate(`/au-pair/profile/${id}`)}
                      isDashboard={true}
                    />
                  </div>
                ))
              ) : (
                <GlassCard className="w-full py-20 border-dashed bg-white/30 text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{t('auPair.browse.noAuPairsFound')}</p>
                </GlassCard>
              )}
            </div>
          </div>
        </div>

        {/* Families Shelf */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-vibrant-pink/10 rounded-xl text-vibrant-pink">
                <Home size={20} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tight">
                {t('auPair.hostFamilies')}
              </h2>
            </div>
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/families/browse')}
              className="px-6 py-2.5 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 hover:bg-gray-50 transition-all shadow-sm"
            >
              {t('common.viewAll')}
            </motion.button>
          </div>
          
          <div className="relative">
             <div className="flex gap-8 overflow-x-auto pb-8 snap-x no-scrollbar scroll-smooth">
              {families.length > 0 ? (
                families.map(profile => (
                  <div key={profile.id || profile.user_id} className="w-[40vw] sm:w-[340px] flex-none snap-start">
                    <ProfileCard
                      profile={profile}
                      userRole="au_pair" // Renders as Family card
                      isFavorited={false}
                      onToggleFavorite={() => {}}
                      onView={(id) => navigate(`/host-family/profile/${id}`)}
                      isDashboard={true}
                    />
                  </div>
                ))
              ) : (
                <GlassCard className="w-full py-20 border-dashed bg-white/30 text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[11px]">{t('auPair.browse.noFamiliesFound')}</p>
                </GlassCard>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuPairPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userStatus, setUserStatus] = useState<{
    role: 'host_family' | 'au_pair' | null;
    subscriptionStatus: 'free' | 'premium' | null;
    onboardingCompleted: boolean;
  } | null>(null);

  useEffect(() => {
    // If not logged in, show Landing View (which is distinct from Role Selection)
    if (!user) {
      setLoading(false);
      return;
    }
    loadUserStatus();
  }, [user]);

  const loadUserStatus = async () => {
    try {
      setLoading(true);
      
      // Check admin status
      const isAdminUser = await adminService.checkIsAdmin();
      setIsAdmin(isAdminUser);
      
      if (isAdminUser) {
        setLoading(false);
        return;
      }

      const status = await auPairService.getUserSubscriptionStatus();
      
      setUserStatus({
        role: status.role,
        subscriptionStatus: status.subscriptionStatus,
        onboardingCompleted: status.onboardingCompleted
      });

    } catch (err: any) {
      console.warn('Failed to load user status', err);
      // Fallback
       setUserStatus({
        role: null,
        subscriptionStatus: null,
        onboardingCompleted: false
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingScreen />;

  // 1. Not Logged In -> Landing View
  if (!user) {
    return <LandingView />;
  }

  // Admin bypass
  if (isAdmin) {
    return <AdminAuPairDashboard />;
  }

  // 2. Logged In, No Role OR Incomplete Onboarding -> Go to Role Selection Page
  if (!userStatus?.role || !userStatus.onboardingCompleted) {
      return <AuPairRoleSelectionPage />; 
  }

  // 3. Logged In, Has Role, Complete Onboarding -> Redirect to Browse
  if (userStatus.role === 'host_family') {
      return <Navigate to="/au-pairs/browse" replace />;
  } else {
      return <Navigate to="/families/browse" replace />;
  }
}

function LandingView() {
  const { t } = useI18n();
  const navigate = useNavigate();

  const features = [
    {
      icon: Home,
      title: t('auPair.hostFamilies'),
      description: t('auPair.hostFamiliesDesc')
    },
    {
      icon: Baby,
      title: t('auPair.qualifiedAuPairs'),
      description: t('auPair.qualifiedAuPairsDesc')
    },
    {
      icon: Globe,
      title: t('auPair.culturalExchange'),
      description: t('auPair.culturalExchangeDesc')
    },
    {
      icon: Heart,
      title: t('auPair.trustedCommunity'),
      description: t('auPair.trustedCommunityDesc')
    }
  ];

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      <div className="max-w-[100rem] mx-auto px-6 py-10 relative z-10">
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-vibrant-purple mb-12 transition-colors border border-gray-100 px-4 py-2 rounded-xl bg-white/40 backdrop-blur-md"
        >
          <ArrowLeft size={16} />
          <span>{t('common.back')}</span>
        </motion.button>

        <div className="text-center mb-12">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-white border border-white/60 shadow-2xl rounded-[2rem] mb-6 text-vibrant-pink"
          >
            <Baby size={40} />
          </motion.div>
          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-4xl md:text-5xl font-black text-gray-900 mb-4 uppercase tracking-tight"
          >
            {t('auPair.title')}
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-lg text-gray-500 font-medium"
          >
            {t('auPair.subtitle')}
          </motion.p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <GlassCard className="p-8 text-center border-white/20 hover:border-vibrant-pink/30 hover:shadow-2xl transition-all duration-500 h-full group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-vibrant-pink/10 rounded-2xl mb-6 text-vibrant-pink group-hover:scale-110 transition-transform duration-500">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-3 uppercase tracking-tight group-hover:text-vibrant-pink transition-colors">{feature.title}</h3>
                <p className="text-sm text-gray-500 font-medium leading-relaxed">{feature.description}</p>
              </GlassCard>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <motion.div whileHover={{ y: -8 }}>
            <GlassCard className="p-12 border-vibrant-purple/20 bg-vibrant-purple/[0.02] h-full flex flex-col">
              <div className="w-12 h-12 bg-vibrant-purple/10 rounded-xl flex items-center justify-center mb-8 text-vibrant-purple">
                <Home size={24} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">{t('auPair.forHostFamilies')}</h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10 flex-grow">
                {t('auPair.hostFamiliesText')}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/signin')}
                className="w-full flex items-center justify-center gap-3 bg-vibrant-purple text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-vibrant-purple/20 hover:bg-vibrant-purple/90 transition-all"
              >
                {t('auth.signIn')}
                <ArrowRight size={20} />
              </motion.button>
            </GlassCard>
          </motion.div>

          <motion.div whileHover={{ y: -8 }}>
            <GlassCard className="p-12 border-vibrant-pink/20 bg-vibrant-pink/[0.02] h-full flex flex-col">
              <div className="w-12 h-12 bg-vibrant-pink/10 rounded-xl flex items-center justify-center mb-8 text-vibrant-pink">
                <Baby size={24} />
              </div>
              <h2 className="text-3xl font-black text-gray-900 mb-6 uppercase tracking-tight">{t('auPair.forAuPairs')}</h2>
              <p className="text-gray-500 text-lg font-medium leading-relaxed mb-10 flex-grow">
                {t('auPair.auPairsText')}
              </p>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/signin')}
                className="w-full flex items-center justify-center gap-3 bg-vibrant-pink text-white py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-vibrant-pink/20 hover:bg-vibrant-pink/90 transition-all"
              >
                {t('auth.signIn')}
                <ArrowRight size={20} />
              </motion.button>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div
          whileHover={{ y: -8 }}
          className="relative group overflow-hidden rounded-[2.5rem]"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-vibrant-pink to-vibrant-purple opacity-90" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&q=80')] mix-blend-overlay opacity-20 bg-cover bg-center" />
          
            <div className="relative z-10 p-10 lg:p-16 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center mb-6 border border-white/20 shadow-2xl">
              <Sparkles className="text-white" size={32} />
            </div>
            <h2 className="text-3xl lg:text-4xl font-black text-white mb-4 uppercase tracking-tight">{t('auPair.readyToStart')}</h2>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto font-medium leading-relaxed">
              {t('auPair.joinCommunity')}
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/signin')}
              className="bg-white text-vibrant-purple px-12 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all shadow-2xl flex items-center gap-3"
            >
              {t('auth.signIn')}
              <ArrowRight size={20} />
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
