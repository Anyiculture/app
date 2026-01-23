import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Users,
  Home,
  CheckCircle,
  MessageCircle,
  Globe,
  ChevronLeft,
  ChevronRight,
  Baby,
  Heart,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { HostFamilyProfile } from '../services/auPairService';
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

  useEffect(() => {
    if (id) {
      loadProfile();
    }
  }, [id]);

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
    // Use lowercased type for key: house, apartment, penthouse
    const key = `auPair.onboarding.options.housing.${type.toLowerCase()}`;
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
    <div className="min-h-screen bg-gray-50 font-sans py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative h-[300px] sm:h-[400px] bg-gray-100 group">
                 {allPhotos.length > 0 ? (
                    <img
                        src={allPhotos[selectedImageIndex]}
                        alt={`Family photo ${selectedImageIndex + 1}`}
                        className="w-full h-full object-cover"
                    />
                 ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <Users size={64} />
                    </div>
                 )}

                {allPhotos.length > 1 && (
                    <>
                        <div className="absolute inset-0 flex items-center justify-between px-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => setSelectedImageIndex((prev) => (prev === 0 ? allPhotos.length - 1 : prev - 1))}
                                className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <button
                                onClick={() => setSelectedImageIndex((prev) => (prev === allPhotos.length - 1 ? 0 : prev + 1))}
                                className="w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                            {allPhotos.map((_, idx) => (
                                <button
                                key={idx}
                                onClick={() => setSelectedImageIndex(idx)}
                                className={`h-1.5 rounded-full transition-all ${
                                    idx === selectedImageIndex ? 'w-6 bg-white' : 'w-2 bg-white/60'
                                }`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
            <button
                onClick={() => navigate(-1)}
                className="absolute top-4 left-4 z-10 w-10 h-10 bg-black/30 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/50 transition cursor-pointer"
            >
                <ChevronLeft size={24} />
            </button>

            <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start gap-6">
                <div>
                     <div className="flex items-center gap-3 mb-2">
                        <h1 className="text-3xl font-bold text-gray-900">{profile.family_name}</h1>
                        <span className="px-2.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-bold uppercase tracking-wide rounded-full">
                            {t('hostFamily.profile.verifiedHost')}
                        </span>
                     </div>
                     <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <MapPin size={16} className="text-gray-400" />
                            {profile.city}, {getCountryLabel(profile.country)}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Users size={16} className="text-gray-400" />
                            {profile.children_count} {t('common.children') || 'Children'}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Home size={16} className="text-gray-400" />
                            {getHousingTypeLabel(profile.housing_type || '')}
                        </div>
                     </div>
                </div>

                <div className="flex-shrink-0">
                    <Button 
                        onClick={handleContact} 
                        className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                        <MessageCircle size={18} className="mr-2" />
                        {t('auPair.contactFamily') || 'Contact Family'}
                    </Button>
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-6">
                
                {/* About Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                     <h2 className="text-lg font-bold text-gray-900 mb-4">{t('hostFamily.profile.aboutFamily') || 'About the Family'}</h2>
                     <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {profile.expectations || t('hostFamily.profile.bioNotProvided') || "No description provided."}
                     </p>
                </div>

                {/* Children Section */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                     <h2 className="text-lg font-bold text-gray-900 mb-6">{t('hostFamily.profile.theChildren') || 'The Children'}</h2>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                        <div>
                            <div className="flex items-center gap-2 mb-2 text-pink-600">
                                <Baby size={20} />
                                <span className="text-xs font-bold uppercase tracking-wider">{t('hostFamily.profile.ages') || 'Ages'}</span>
                            </div>
                            <p className="text-xl font-bold text-gray-900 pl-7">{profile.children_ages?.join(', ')} {t('common.yearsOld') || 'years old'}</p>
                        </div>
                         <div>
                            <div className="mb-2 text-pink-600">
                                <span className="text-xs font-bold uppercase tracking-wider">{t('hostFamily.profile.personalities') || 'Personalities'}</span>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {profile.children_personalities?.map((p, i) => (
                                    <span key={i} className="px-2.5 py-1 bg-pink-50 text-pink-700 text-xs font-medium rounded border border-pink-100">
                                        {t(`auPair.onboarding.options.traits.${p.toLowerCase()}`) || p}
                                    </span>
                                ))}
                            </div>
                        </div>
                     </div>
                 </div>

                 {/* Family Values */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-lg font-bold text-gray-900 mb-6">{t('hostFamily.profile.familyValues') || 'Family Values'}</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {profile.parenting_styles && profile.parenting_styles.length > 0 && (
                             <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('hostFamily.profile.parentingStyle')}</span>
                                <div className="flex flex-wrap gap-2">
                                    {profile.parenting_styles.map((style, i) => (
                                        <span key={i} className="text-sm font-medium text-gray-700 bg-gray-50 px-2 py-1 rounded border border-gray-200">
                                            {t(`auPair.onboarding.options.parenting.${style.toLowerCase()}`) || style}
                                        </span>
                                    ))}
                                </div>
                             </div>
                        )}
                        {profile.house_rules_details && (
                             <div>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">{t('hostFamily.profile.houseRules')}</span>
                                <p className="text-sm text-gray-600 italic">"{profile.house_rules_details}"</p>
                             </div>
                        )}
                      </div>
                 </div>

                 {/* The Role */}
                 <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                      <h2 className="text-lg font-bold text-gray-900 mb-6">{t('hostFamily.profile.theRole') || 'The Role'}</h2>
                      <div className="space-y-6">
                          <div>
                                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-3">{t('hostFamily.profile.dailyTasks') || 'Daily Tasks'}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {profile.daily_tasks?.map((task, i) => (
                                        <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                                            <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                            {t(`auPair.onboarding.options.duties.${task.toLowerCase().replace(/ /g, '_')}`) || task}
                                        </div>
                                    ))}
                                </div>
                          </div>
                          {profile.weekly_schedule && (
                                <div>
                                    <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-2">{t('hostFamily.profile.schedule') || 'Schedule'}</h3>
                                    <p className="text-sm text-gray-700">{profile.weekly_schedule}</p>
                                </div>
                            )}
                      </div>
                 </div>

                 {/* Video Intro */}
                 {profile.family_video_url && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4">{t('hostFamily.profile.videoIntroduction') || 'Video Intro'}</h2>
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <video src={profile.family_video_url} controls className="w-full h-full object-contain" />
                        </div>
                    </div>
                )}

            </div>

             {/* Sidebar Column */}
             <div className="space-y-6">
                
                {/* Quick Facts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles size={16} />
                        {t('hostFamily.profile.quickFacts') || 'Quick Facts'}
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-xs text-gray-500 font-bold uppercase">{t('hostFamily.profile.salary')}</span>
                            <span className="text-sm font-bold text-green-600">¥{profile.monthly_salary_offer}/mo</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-xs text-gray-500 font-bold uppercase">{t('hostFamily.profile.room')}</span>
                            <span className="text-sm font-medium text-gray-900">{profile.private_room ? (t('hostFamily.profile.privateRoom') || 'Private Room') : (t('hostFamily.profile.sharedRoom') || 'Shared')}</span>
                        </div>
                        <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                            <span className="text-xs text-gray-500 font-bold uppercase">{t('hostFamily.profile.experience')}</span>
                            <span className="text-sm font-medium text-gray-900">{profile.experience_required_years}+ {t('common.years') || 'Years'}</span>
                        </div>
                    </div>
                </div>

                {/* Languages */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe size={16} />
                        {t('hostFamily.profile.languages') || 'Languages'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                         {profile.languages_spoken?.map((lang, i) => (
                            <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-200">
                                {t(`auPair.onboarding.languages.${lang.toLowerCase()}`) || lang}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Benefits */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Heart size={16} />
                        {t('hostFamily.profile.benefits') || 'Benefits'}
                    </h3>
                    <div className="space-y-3">
                        {profile.benefits?.map((benefit, i) => (
                            <div key={i} className="flex items-start gap-3 bg-purple-50 p-3 rounded-lg text-xs font-medium text-purple-900">
                                <CheckCircle size={14} className="text-purple-600 flex-shrink-0 mt-0.5" />
                                {t(`auPair.onboarding.options.benefits.${benefit.toLowerCase().replace(/ /g, '_')}`) || benefit}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Premium Match Badge */}
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-4 -mr-4 text-white/20">
                        <Sparkles size={80} />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest mb-2 relative z-10">{t('hostFamily.profile.premiumMatch')}</h3>
                    <p className="text-xs font-medium opacity-90 relative z-10 leading-relaxed">
                        {t('hostFamily.profile.premiumMatchDesc') || 'This family has a high success rate and great feedback from previous au pairs.'}
                    </p>
                </div>

             </div>

        </div>
      </div>
    </div>
  );
}
