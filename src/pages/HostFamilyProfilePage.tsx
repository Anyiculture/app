import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Users,
  Home,
  CheckCircle,
  ArrowLeft,
  MessageCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  Baby,
  Heart,
  Award,
  Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { HostFamilyProfile, auPairService } from '../services/auPairService';
import { messagingService } from '../services/messagingService';
import { COUNTRIES } from '../components/ui/LocationCascade';

export function HostFamilyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [profile, setProfile] = useState<HostFamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [currentUserRole, setCurrentUserRole] = useState<'au_pair' | 'host_family' | null>(null);

  useEffect(() => {
    if (id) {
      loadProfile();
    }
    if (user) {
        checkUserRole();
    }
  }, [id, user]);

  const checkUserRole = async () => {
      try {
          const status = await auPairService.getUserSubscriptionStatus();
          setCurrentUserRole(status.role);
      } catch (e) {
          console.error('Failed to get user role', e);
      }
  }

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('host_family_profiles')
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

  const handleBack = () => {
      if (currentUserRole === 'au_pair') {
          navigate('/families/browse');
      } else {
          navigate('/dashboard');
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
        `Family ${profile.family_name}`
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

  const getHousingTypeLabel = (type: string) => {
    if (!type) return '';
    // Capitalize first letter for the key match: homeTypeHouse, homeTypeApartment
    const key = `auPair.onboarding.homeType${type.charAt(0).toUpperCase() + type.slice(1)}`;
    return t(key) || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text={t('common.loading') || "Loading family profile..."} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{t('hostFamily.profile.notFound') || "Family not found"}</p>
          <Button onClick={() => navigate('/families/browse')}>{t('common.back') || "Back"}</Button>
        </div>
      </div>
    );
  }

  const allPhotos = [...(profile.home_photos || []), ...(profile.family_photos || [])];

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-6 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ x: -4 }}
          onClick={handleBack}
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2 sm:py-3 bg-white/40 backdrop-blur-md border border-white/60 rounded-xl sm:rounded-2xl text-[8px] sm:text-[10px] font-black uppercase tracking-widest text-gray-900 shadow-sm hover:shadow-xl transition-all mb-4 sm:mb-8"
        >
          <ArrowLeft size={16} />
          {currentUserRole === 'au_pair' ? t('auPair.backToBrowseFamilies') : (t('common.backToDashboard') || 'Back to Dashboard')}
        </motion.button>

        <div className="bg-white/80 backdrop-blur-2xl rounded-[2rem] sm:rounded-[3rem] border border-white/60 shadow-2xl overflow-hidden relative">
          {/* Image Gallery */}
          <div className="relative h-[220px] sm:h-[400px] group bg-gray-100">
            {allPhotos.length > 0 ? (
               <AnimatePresence mode="wait">
                 <motion.img
                   key={selectedImageIndex}
                   initial={{ opacity: 0 }}
                   animate={{ opacity: 1 }}
                   exit={{ opacity: 0 }}
                   src={allPhotos[selectedImageIndex]}
                   alt={`Family photo ${selectedImageIndex + 1}`}
                   className="w-full h-full object-cover"
                 />
               </AnimatePresence>
            ) : (
                <div className="w-full h-full bg-gradient-to-br from-vibrant-purple/10 to-vibrant-pink/10 flex items-center justify-center">
                    <Users size={64} className="text-vibrant-purple/30" />
                </div>
            )}
            
            {allPhotos.length > 1 && (
              <>
                <div className="absolute inset-0 flex items-center justify-between px-4 sm:px-8 bg-gradient-to-b from-black/10 via-transparent to-black/10 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1))}
                        className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full border border-white/40 flex items-center justify-center text-white shadow-2xl hover:bg-white/40 transition"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => setSelectedImageIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1))}
                        className="w-12 h-12 bg-white/20 backdrop-blur-xl rounded-full border border-white/40 flex items-center justify-center text-white shadow-2xl hover:bg-white/40 transition"
                    >
                        <ChevronRight size={24} />
                    </button>
                </div>
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                  {allPhotos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`h-1 rounded-full transition-all ${
                        idx === selectedImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}

            <div className="absolute top-6 left-6 flex flex-col gap-3 z-20">
                <div className="px-4 py-2 bg-vibrant-purple/90 backdrop-blur-md rounded-xl text-[8px] font-black uppercase tracking-widest text-white shadow-2xl border border-white/20 flex items-center gap-2">
                    <Award size={14} />
                    Verified Host Family
                </div>
            </div>
          </div>

          <div className="relative pt-8 px-6 sm:px-12 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
              <div className="flex-1">
                <h1 className="text-2xl sm:text-4xl font-black text-gray-900 uppercase tracking-tight leading-tight mb-4">{profile.family_name}</h1>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-100">
                    <MapPin size={16} className="text-vibrant-purple" />
                    {profile.city}, {getCountryLabel(profile.country)}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-100">
                    <Users size={16} className="text-vibrant-purple" />
                    {profile.children_count} {t('common.children') || 'Children'}
                  </div>
                  <div className="flex items-center gap-2 bg-gray-100/50 px-4 py-2 rounded-xl text-[10px] font-black text-gray-600 uppercase tracking-widest border border-gray-100">
                    <Home size={16} className="text-vibrant-purple" />
                    {getHousingTypeLabel(profile.housing_type || '')}
                  </div>
                </div>
              </div>
              <motion.button 
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleContact} 
                className="group flex items-center justify-center gap-3 px-8 py-4 bg-vibrant-purple text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl border border-vibrant-purple/20"
              >
                <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
                {t('auPair.contactFamily') || 'Contact Family'}
              </motion.button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              <div className="md:col-span-2 space-y-12">
                {/* About Section */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-6 flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-vibrant-purple/30" />
                        {t('hostFamily.profile.aboutFamily') || 'About the Family'}
                    </h2>
                    <p className="text-sm sm:text-lg text-gray-700 leading-relaxed font-bold uppercase tracking-tight whitespace-pre-line bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 shadow-inner">
                        {profile.expectations || t('hostFamily.profile.bioNotProvided') || "No description provided."}
                    </p>
                </section>

                {/* Children */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-6 flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-vibrant-purple/30" />
                        {t('hostFamily.profile.theChildren') || 'The Children'}
                    </h2>
                    <GlassCard className="p-8 sm:p-10 bg-vibrant-pink/[0.02] border-vibrant-pink/10">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                            <div>
                                <span className="block text-[9px] text-vibrant-pink font-black uppercase tracking-[0.2em] mb-3">{t('hostFamily.profile.ages') || 'Ages'}</span>
                                <div className="flex items-center gap-3">
                                    <Baby size={24} className="text-vibrant-pink" />
                                    <span className="text-xl font-black text-gray-900">{profile.children_ages?.join(', ')} {t('common.yearsOld') || 'years old'}</span>
                                </div>
                            </div>
                            <div>
                                <span className="block text-[9px] text-vibrant-pink font-black uppercase tracking-[0.2em] mb-3">{t('hostFamily.profile.personalities') || 'Personalities'}</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.children_personalities?.map((p, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-white text-vibrant-pink text-[9px] font-black uppercase tracking-widest rounded-lg shadow-sm border border-vibrant-pink/10">
                                            {t(`auPair.onboarding.options.traits.${p}`) || p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </GlassCard>
                </section>

                {/* Family Values */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-6 flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-vibrant-purple/30" />
                        {t('hostFamily.profile.familyValues') || 'Family Values'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {profile.parenting_styles && profile.parenting_styles.length > 0 && (
                            <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                                <span className="block text-[9px] text-vibrant-purple font-black uppercase tracking-[0.2em] mb-3">{t('hostFamily.profile.parentingStyle')}</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.parenting_styles.map((style, i) => (
                                        <span key={i} className="text-sm font-bold text-gray-700 italic">
                                            {t(`auPair.onboarding.options.parenting.${style}`) || style}{i < (profile.parenting_styles?.length || 0) - 1 ? ',' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {profile.house_rules_details && (
                            <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
                                <span className="block text-[9px] text-vibrant-purple font-black uppercase tracking-[0.2em] mb-3">{t('hostFamily.profile.houseRules')}</span>
                                <p className="text-sm font-bold text-gray-700 leading-relaxed italic">"{profile.house_rules_details}"</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* The Role */}
                <section>
                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-6 flex items-center gap-3">
                        <div className="w-8 h-[1px] bg-vibrant-purple/30" />
                        {t('hostFamily.profile.theRole') || 'The Role'}
                    </h2>
                    <GlassCard className="p-8 sm:p-10 bg-vibrant-purple/[0.02] border-vibrant-purple/10">
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-[9px] font-black text-vibrant-purple uppercase tracking-widest mb-4">{t('hostFamily.profile.dailyTasks') || 'Daily Tasks'}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {profile.daily_tasks?.map((task, i) => (
                                        <div key={i} className="flex items-center gap-3 text-[11px] font-black text-gray-700 uppercase tracking-widest bg-white/60 p-3 rounded-xl border border-white/80">
                                            <CheckCircle size={16} className="text-vibrant-green" />
                                            {t(`auPair.onboarding.options.duties.${task}`) || task}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            {profile.weekly_schedule && (
                                <div>
                                    <h3 className="text-[9px] font-black text-vibrant-purple uppercase tracking-widest mb-2">{t('hostFamily.profile.schedule') || 'Schedule'}</h3>
                                    <p className="text-sm text-gray-700 font-bold uppercase tracking-tight">{profile.weekly_schedule}</p>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </section>

                {/* Video Intro */}
                {profile.family_video_url && (
                    <section>
                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-vibrant-purple mb-6 flex items-center gap-3">
                            <div className="w-8 h-[1px] bg-vibrant-purple/30" />
                            {t('hostFamily.profile.videoIntroduction') || 'Video Intro'}
                        </h2>
                        <div className="aspect-video rounded-[2.5rem] overflow-hidden border border-white/60 shadow-2xl bg-black">
                            <video src={profile.family_video_url} controls className="w-full h-full object-contain" />
                        </div>
                    </section>
                )}
              </div>

              {/* Sidebar Info */}
              <div className="space-y-8">
                <GlassCard className="p-8 border-white/40">
                  <h3 className="text-[10px] font-black tracking-widest text-vibrant-purple uppercase mb-6 flex items-center gap-2">
                      <Sparkles size={18} />
                      {t('hostFamily.profile.quickFacts') || 'Quick Facts'}
                  </h3>
                  <div className="space-y-5">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t('hostFamily.profile.salary')}</span>
                      <span className="text-sm font-black text-vibrant-green uppercase tracking-tight">¥{profile.monthly_salary_offer}/mo</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t('hostFamily.profile.room')}</span>
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{profile.private_room ? (t('hostFamily.profile.privateRoom') || 'Private Room') : (t('hostFamily.profile.sharedRoom') || 'Shared')}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{t('hostFamily.profile.experience')}</span>
                      <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{profile.experience_required_years}+ {t('common.years') || 'Years'}</span>
                    </div>
                  </div>
                </GlassCard>

                <GlassCard className="p-8 border-white/40 bg-white/60">
                  <h3 className="text-[10px] font-black tracking-widest text-vibrant-purple uppercase mb-6 flex items-center gap-2">
                    <Globe size={18} />
                    {t('hostFamily.profile.languages') || 'Languages'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.languages_spoken?.map((lang, i) => (
                      <span key={i} className="px-3 py-1.5 bg-white/40 rounded-xl text-[10px] font-black text-gray-900 uppercase tracking-widest border border-white/60 shadow-sm">
                        {t(`auPair.onboarding.step7.${lang.toLowerCase()}`) || lang}
                      </span>
                    ))}
                  </div>
                </GlassCard>

                <GlassCard className="p-8 border-white/40">
                  <h3 className="text-[10px] font-black tracking-widest text-vibrant-purple uppercase mb-6 flex items-center gap-2">
                      <Heart size={18} />
                      {t('hostFamily.profile.benefits') || 'Benefits'}
                  </h3>
                  <div className="space-y-3">
                    {profile.benefits?.map((benefit, i) => (
                      <div key={i} className="flex items-start gap-3 text-[10px] font-black text-gray-600 uppercase tracking-widest bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                        <CheckCircle size={16} className="text-vibrant-purple flex-shrink-0" />
                        {t(`auPair.onboarding.options.benefits.${benefit}`) || benefit}
                      </div>
                    ))}
                  </div>
                </GlassCard>

                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="p-8 bg-gradient-to-br from-vibrant-purple to-vibrant-pink rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group"
                >
                    <div className="absolute -right-4 -top-4 text-white/10 group-hover:rotate-12 transition-transform duration-700">
                      <Sparkles size={120} />
                    </div>
                    <h3 className="text-[11px] font-black uppercase tracking-widest mb-2 relative z-10">Premium Match</h3>
                    <p className="text-[10px] font-bold leading-relaxed relative z-10 opacity-90">
                        This family has a high success rate and great feedback from previous au pairs.
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
