import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Clock,
  GraduationCap,
  Globe,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  User,
  Lock,
  Award,
  Calendar,
  Sparkles,
  Baby,
  ShieldCheck,
  Video,
  Heart
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { AuPairProfile, auPairService } from '../services/auPairService';
import { messagingService } from '../services/messagingService';
import { adminService } from '../services/adminService';
import { COUNTRIES } from '../components/ui/LocationCascade';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

export function AuPairProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [profile, setProfile] = useState<AuPairProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [isHostFamily, setIsHostFamily] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (id) {
      loadProfile();
      checkSubscription();
    }
  }, [id]);

  const checkSubscription = async () => {
    try {
      // Check Admin
      const adminStatus = await adminService.checkIsAdmin();
      setIsAdmin(adminStatus);
      
      // Check Subscription
      const status = await auPairService.getUserSubscriptionStatus();
      setIsHostFamily(status.role === 'host_family');
      setIsPremium(status.subscriptionStatus === 'premium');
    } catch (error) {
      console.error('Error checking subscription/admin status:', error);
    }
  };

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('au_pair_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!profile) return;

    try {
      const conversationId = await messagingService.getOrCreateConversation(
        profile.user_id,
        'aupair',
        profile.id,
        `Au Pair ${profile.display_name}`
      );
      navigate(`/messages?conversation=${conversationId}`);
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const getCountryLabel = (countryName: string) => {
    const country = COUNTRIES.find(c => c.value === countryName || c.label_en === countryName);
    return country ? (language === 'zh' ? country.label_zh : country.label_en) : countryName;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text={t('common.loading') || "Loading..."} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{t('auPair.profile.notFound')}</p>
          <Button onClick={() => navigate('/au-pairs/browse')}>{t('auPair.profile.backToBrowse')}</Button>
        </div>
      </div>
    );
  }

  const getLanguages = () => {
    if (Array.isArray(profile.languages)) {
      return profile.languages.map((l: any) => {
        const langName = typeof l === 'string' ? l : l.language;
        const proficiency = typeof l === 'string' ? '' : l.proficiency;
        
        // Try to find translation in global languages object first, then raw value
        const translatedLang = t(`languages.${langName}`) !== `languages.${langName}` 
          ? t(`languages.${langName}`) 
          : (t(`auPair.onboarding.options.languages.${langName.toLowerCase()}`) || langName);

        if (!proficiency) return translatedLang;
        
        return `${translatedLang} (${t(`proficiency.${proficiency}`) || proficiency})`;
      });
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm hover:shadow-xl transition-all mb-4 sm:mb-8"
        >
          <ArrowLeft size={16} />
          {t('common.back') || 'Back'}
        </motion.button>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] border border-white/60 shadow-2xl overflow-hidden relative">
          {/* Header / Photos */}
          <div className="relative h-[220px] sm:h-[360px] group">
            {profile.profile_photos && profile.profile_photos.length > 0 ? (
              <AnimatePresence mode="wait">
                <motion.img
                  key={selectedImageIndex}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  src={profile.profile_photos[selectedImageIndex]}
                  alt={profile.display_name}
                  className="w-full h-full object-cover"
                />
              </AnimatePresence>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-vibrant-purple/10 to-vibrant-pink/10 flex items-center justify-center">
                <div className="w-32 h-32 bg-white/50 backdrop-blur-xl rounded-[3rem] flex items-center justify-center text-vibrant-purple shadow-2xl border border-white/60">
                   <User size={64} />
                </div>
              </div>
            )}

            {/* Carousel Controls */}
            {profile.profile_photos && profile.profile_photos.length > 1 && (
              <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-8 bg-gradient-to-b from-black/20 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedImageIndex(prev => prev === 0 ? profile.profile_photos.length - 1 : prev - 1)}
                  className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full border border-white/40 flex items-center justify-center text-white shadow-2xl hover:bg-white/40 transition-all"
                >
                  <ChevronLeft size={28} />
                </motion.button>
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedImageIndex(prev => prev === profile.profile_photos.length - 1 ? 0 : prev + 1)}
                  className="w-14 h-14 bg-white/20 backdrop-blur-xl rounded-full border border-white/40 flex items-center justify-center text-white shadow-2xl hover:bg-white/40 transition-all"
                >
                  <ChevronRight size={28} />
                </motion.button>
              </div>
            )}
            
            {/* Dots */}
            {profile.profile_photos && profile.profile_photos.length > 1 && (
              <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
                {profile.profile_photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      idx === selectedImageIndex ? 'w-8 bg-white shadow-lg' : 'w-2 bg-white/40'
                    }`}
                  />
                ))}
              </div>
            )}

            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 sm:top-10 sm:left-10 flex flex-col gap-2 sm:gap-4 z-20">
               <div className="px-3 sm:px-5 py-1.5 sm:py-2.5 bg-vibrant-purple/90 backdrop-blur-md rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-white shadow-2xl border border-white/20 flex items-center gap-1.5 sm:gap-2">
                 <Award size={14} />
                 Featured Au Pair
               </div>
            </div>
          </div>

          <div className="relative pt-6 px-6 pb-10">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10 px-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
                  <h1 className="text-xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight leading-tight">{profile.display_name}</h1>
                  <div className="w-2.5 h-2.5 rounded-full bg-vibrant-green animate-pulse flex-shrink-0" title="Available" />
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-6">
                  <div className="flex items-center gap-1.5 sm:gap-2 bg-gray-100/50 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[8px] sm:text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-100">
                    <MapPin size={16} className="text-vibrant-purple" />
                    {profile.current_city}, {getCountryLabel(profile.current_country || '')}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-100">
                    <Globe size={16} className="text-vibrant-purple" />
                    {getCountryLabel(profile.nationality || '')}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-100">
                    <Clock size={16} className="text-vibrant-purple" />
                    {profile.age} {t('auPair.profile.yearsOld')}
                  </div>
                </div>
              </div>
              
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                   if (isHostFamily && !isPremium && !isAdmin) {
                      navigate('/settings/billing');
                   } else {
                      handleContact();
                   }
                }}
                className={`group flex items-center justify-center gap-3 sm:gap-4 px-6 sm:px-10 py-3 sm:py-5 rounded-2xl sm:rounded-[2rem] text-[9px] sm:text-[11px] font-black uppercase tracking-widest transition-all shadow-2xl ${
                  isHostFamily && !isPremium && !isAdmin 
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200" 
                  : "bg-vibrant-purple text-white hover:bg-vibrant-purple/90 border border-vibrant-purple/20"
                }`}
              >
                <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
                {isHostFamily && !isPremium && !isAdmin ? 'Premium Required' : t('auPair.contactAuPair')}
              </motion.button>
            </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              
              {/* Paywall Overlay */}
              {isHostFamily && !isPremium && !isAdmin && (
                <div className="absolute inset-x-8 top-64 bottom-16 z-[30] backdrop-blur-3xl bg-white/20 flex items-center justify-center rounded-[3rem] border border-white/60 shadow-inner">
                  <GlassCard className="text-center p-12 bg-white/95 max-w-xl mx-auto border-white shadow-[0_32px_128px_-16px_rgba(0,0,0,0.1)] relative">
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 bg-vibrant-purple rounded-[2rem] flex items-center justify-center shadow-2xl text-white">
                      <Lock size={40} strokeWidth={2.5} />
                    </div>
                    
                    <div className="mt-8 space-y-6">
                      <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight leading-none">
                        Premium Matchmaking
                      </h2>
                      <p className="text-gray-500 font-medium text-lg leading-relaxed px-4">
                        Unlock access to this detailed profile, HD photo gallery, and direct messaging to find your perfect family member.
                      </p>
                      
                      <div className="flex flex-col gap-4 mt-10">
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/settings/billing')}
                          className="w-full bg-vibrant-purple py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-white shadow-xl shadow-vibrant-purple/20 hover:shadow-2xl hover:bg-vibrant-purple/90 transition-all flex items-center justify-center gap-3"
                        >
                          <Sparkles size={18} />
                          Unlock Profile
                        </motion.button>
                        
                        <motion.button 
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => navigate('/au-pair/browse')}
                          className="w-full bg-white border border-gray-100 py-5 rounded-2xl text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-sm hover:border-vibrant-purple/30 transition-all"
                        >
                          Keep Browsing
                        </motion.button>
                      </div>
                    </div>

                    <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-vibrant-pink/10 blur-3xl rounded-full" />
                    <div className="absolute -top-4 -left-4 w-24 h-24 bg-vibrant-purple/10 blur-3xl rounded-full" />
                  </GlassCard>
                </div>
              )}

              <div className="md:col-span-2 space-y-8">
                {/* Bio */}
                <section className="px-2 sm:px-4">
                  <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-4 sm:mb-6 flex items-center gap-3">
                    <div className="w-6 h-[1px] bg-vibrant-purple/30" />
                    {t('auPair.aboutMe')}
                  </h2>
                  <p className="text-sm sm:text-lg text-gray-700 leading-relaxed font-bold uppercase tracking-tight whitespace-pre-line bg-gray-50/50 p-6 sm:p-10 rounded-[1.5rem] sm:rounded-[2.5rem] border border-gray-100 shadow-inner">
                    {profile.bio || t('auPair.profile.bioNotProvided')}
                  </p>
                </section>

                <GlassCard className="p-6 sm:p-10 bg-vibrant-purple/[0.02] border-vibrant-purple/10">
                  <p className="text-base sm:text-lg text-gray-800 leading-relaxed font-bold mb-6 sm:mb-8 italic">"{profile.experience_description}"</p>
                  <div className="flex flex-wrap gap-2 sm:gap-3">
                    {profile.skills?.map((skill, i) => (
                      <div key={i} className="px-4 py-2 bg-white border border-vibrant-purple/10 text-vibrant-purple text-[8px] sm:text-[10px] font-black uppercase tracking-widest rounded-lg sm:rounded-xl shadow-sm flex items-center gap-2">
                        <CheckCircle size={12} className="text-vibrant-purple" />
                        {t(`auPair.onboarding.options.skills.${skill}`) || skill}
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Safety & Expertise */}
                <section className="px-2 sm:px-4">
                  <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-4 sm:mb-6 flex items-center gap-3">
                    <div className="w-6 h-[1px] bg-vibrant-purple/30" />
                    {t('auPair.profile.safety') || 'Safety & Expertise'}
                  </h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { key: 'first_aid', icon: ShieldCheck, label: t('auPair.profile.firstAid') || 'First Aid' },
                      { key: 'swimming_skills', icon: ShieldCheck, label: t('auPair.profile.swimming') || 'Swimming' },
                      { key: 'drivers_license', icon: ShieldCheck, label: t('auPair.profile.driversLicense') || 'Driving' },
                      { key: 'special_needs_experience', icon: ShieldCheck, label: t('auPair.profile.specialNeeds') || 'Special Needs' }
                    ].map((item, idx) => (
                      <div 
                        key={idx}
                        className={`p-4 rounded-2xl border transition-all flex flex-col items-center text-center gap-2 ${
                          profile[item.key as keyof typeof profile] 
                          ? 'bg-vibrant-green/5 border-vibrant-green/20 text-vibrant-green' 
                          : 'bg-gray-50 border-gray-100 text-gray-300 contrast-50'
                        }`}
                      >
                        <item.icon size={20} />
                        <span className="text-[8px] font-black uppercase tracking-widest">{item.label}</span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Video Introduction */}
                {(() => {
                  const videoUrl = profile.intro_video_url || profile.experience_videos?.[0];
                  return videoUrl;
                })() && (
                  <section className="px-2 sm:px-4">
                    <h2 className="text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-4 sm:mb-6 flex items-center gap-3">
                      <div className="w-6 h-[1px] bg-vibrant-purple/30" />
                      {t('auPair.profile.videoIntroduction') || 'Video Introduction'}
                    </h2>
                    <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/60 shadow-2xl bg-black relative group">
                      <video 
                        src={profile.intro_video_url || profile.experience_videos?.[0]} 
                        controls 
                        className="w-full h-full object-contain"
                      />
                      {!profile.intro_video_url && !profile.experience_videos?.[0] && (
                         <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40 gap-4">
                           <Video size={48} />
                           <span className="font-black uppercase tracking-widest text-xs">{t('auPair.profile.noVideo')}</span>
                         </div>
                      )}
                    </div>
                  </section>
                )}

                {/* Preferences */}
                <section className="px-4">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-6 flex items-center gap-3">
                    <div className="w-8 h-[1px] bg-vibrant-purple/30" />
                    {t('auPair.preferences')}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm group hover:border-vibrant-purple/30 transition-all">
                      <span className="block text-[9px] text-vibrant-purple font-black uppercase tracking-[0.2em] mb-3">{t('auPair.preferredLocation')}</span>
                      <div className="flex items-center gap-3">
                        <MapPin size={20} className="text-vibrant-purple" />
                        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">{profile.preferred_countries?.map(getCountryLabel).join(', ')}</span>
                      </div>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm group hover:border-vibrant-purple/30 transition-all">
                      <span className="block text-[9px] text-vibrant-purple font-black uppercase tracking-[0.2em] mb-3">{t('auPair.duration')}</span>
                      <div className="flex items-center gap-3">
                        <Calendar size={20} className="text-vibrant-purple" />
                        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">{profile.duration_months} {t('common.months')}</span>
                      </div>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm group hover:border-vibrant-purple/30 transition-all">
                      <span className="block text-[9px] text-vibrant-purple font-black uppercase tracking-[0.2em] mb-3">{t('auPair.startDate')}</span>
                      <div className="flex items-center gap-3">
                        <Clock size={20} className="text-vibrant-purple" />
                        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">{profile.available_from}</span>
                      </div>
                    </div>
                    <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm group hover:border-vibrant-purple/30 transition-all">
                      <span className="block text-[9px] text-vibrant-purple font-black uppercase tracking-[0.2em] mb-3">{t('auPair.ageGroups')}</span>
                      <div className="flex items-center gap-3">
                        <Baby size={20} className="text-vibrant-purple" />
                        <span className="text-lg font-black text-gray-900 uppercase tracking-tight">
                          {profile.age_groups_worked?.map(g => t(`auPair.onboarding.options.ageComfort.${g}`) || g).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-8 filter blur-0">
                <GlassCard className="p-6 sm:p-8 border-white/40">
                  <h3 className="text-[9px] sm:text-[10px] font-black tracking-widest text-vibrant-purple uppercase mb-4 sm:mb-6 flex items-center gap-2">
                    <GraduationCap size={18} />
                    {t('auPair.education')}
                  </h3>
                  <div className="space-y-4 sm:y-6">
                    <div>
                      <span className="block text-[7px] sm:text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{t('auPair.level')}</span>
                      <span className="block text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight">
                        {profile.education_level ? (t(`degree.${profile.education_level}`) || profile.education_level) : t('common.notSpecified') || 'Not Specified'}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[7px] sm:text-[8px] text-gray-400 font-black uppercase tracking-[0.2em] mb-1">{t('auPair.field')}</span>
                      <span className="block text-xs sm:text-sm font-black text-gray-900 uppercase tracking-tight">
                        {profile.field_of_study || t('common.notSpecified') || 'Not Specified'}
                      </span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-8 border-white/40 bg-white/60">
                  <h3 className="text-[10px] font-black tracking-widest text-vibrant-purple uppercase mb-6 flex items-center gap-2">
                    <Globe size={18} />
                    {t('auPair.languages')}
                  </h3>
                  <div className="space-y-3">
                    {getLanguages().map((lang, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/40 rounded-xl border border-white/60">
                        <div className="w-1.5 h-1.5 rounded-full bg-vibrant-purple" />
                        <span className="text-[10px] font-black text-gray-900 uppercase tracking-widest">{lang}</span>
                      </div>
                    ))}
                  </div>
                </GlassCard>

                {/* Interests */}
                {profile.interests && profile.interests.length > 0 && (
                  <GlassCard className="p-8 border-white/40 bg-white/60">
                    <h3 className="text-[10px] font-black tracking-widest text-vibrant-purple uppercase mb-6 flex items-center gap-2">
                      <Heart size={18} />
                      {t('auPair.profile.interests') || 'Interests'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.interests.map((interest: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-white/40 rounded-lg text-[8px] font-bold text-gray-600 uppercase tracking-widest border border-white/60">
                          {t(`auPair.onboarding.options.hobbies.${interest}`) || interest}
                        </span>
                      ))}
                    </div>
                  </GlassCard>
                )}

                <motion.div 
                  whileHover={{ y: -4 }}
                  className="p-8 bg-vibrant-purple/5 border border-vibrant-purple/10 rounded-[2.5rem] relative overflow-hidden group"
                >
                   <div className="absolute -right-4 -top-4 text-vibrant-purple/5 group-hover:rotate-12 transition-transform duration-700">
                     <Sparkles size={120} />
                   </div>
                   <h3 className="text-[10px] font-black tracking-widest text-vibrant-purple uppercase mb-2">Pro Recommendation</h3>
                   <p className="text-xs text-gray-600 font-bold leading-relaxed relative z-10">
                     Great match for families seeking high-quality childcare and cultural exchange.
                   </p>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
