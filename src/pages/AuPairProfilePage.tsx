import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Globe,
  CheckCircle,
  MessageCircle,
  User,
  Lock,
  ShieldCheck
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

export function AuPairProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [profile, setProfile] = useState<AuPairProfile | null>(null);
  const [loading, setLoading] = useState(true);
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
    <div className="min-h-screen bg-gray-50 font-sans py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header Section */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 hover:bg-gray-200"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t('common.back') || 'Back'}
        </Button>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    {profile.profile_photos && profile.profile_photos.length > 0 ? (
                        <img 
                        src={profile.profile_photos[0]} 
                        alt={profile.display_name} 
                        className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={32} />
                        </div>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">
                            {t('auPair.profile.available')}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <MapPin size={16} className="text-gray-400" />
                            {profile.current_city}, {getCountryLabel(profile.current_country || '')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Globe size={16} className="text-gray-400" />
                            {getCountryLabel(profile.nationality || '')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0">
                 {/* Hide contact button if admin is viewing admin-created listing */}
                 {isAdmin && profile.user_id === 'admin' ? null : (
                  isHostFamily && !isPremium && !isAdmin ? (
                    <Button 
                      onClick={() => navigate('/settings/billing')}
                      className="bg-gray-900 text-white hover:bg-gray-800"
                    >
                      <Lock size={16} className="mr-2" />
                      {t('auPair.profile.unlockContact')}
                    </Button>
                  ) : (
                    <Button 
                      onClick={handleContact}
                      className="bg-pink-600 text-white hover:bg-pink-700"
                    >
                      <MessageCircle size={16} className="mr-2" />
                      {t('auPair.contactAuPair')}
                    </Button>
                  )
                 )}
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Personal, Education, Skills */}
            <div className="space-y-6">
                
                {/* Personal Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={16} />
                        {t('auPair.profile.personalDetails')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.age')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.age} {t('auPair.profile.yearsOld')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.gender')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.gender ? t(`auPair.onboarding.options.gender.${profile.gender}`) : (t('common.notSpecified') || 'Not Specified')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.nationality')}</p>
                            <p className="text-sm font-medium text-gray-900">{getCountryLabel(profile.nationality || '')}</p>
                        </div>
                    </div>
                </div>

                {/* Education Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <GraduationCap size={16} />
                        {t('auPair.education') || 'Education'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.educationLevel') || 'Level'}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {profile.education_level ? (t(`degree.${profile.education_level}`) || profile.education_level) : t('common.notSpecified') || 'Not Specified'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.fieldOfStudy') || 'Field of Study'}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {profile.field_of_study || t('common.notSpecified') || 'Not Specified'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Languages Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe size={16} />
                        {t('auPair.languages') || 'Languages'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {getLanguages().map((lang, i) => (
                            <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-200">
                                {lang}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Skills Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle size={16} />
                        {t('auPair.onboarding.steps.skills') || 'Skills'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills?.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-100">
                                {t(`auPair.onboarding.options.skills.${skill.toLowerCase()}`) || skill}
                            </span>
                        ))}
                    </div>
                </div>

            </div>

            {/* Right Column: About, Experience, Preferences */}
            <div className="md:col-span-2 space-y-6">
                
                {/* About Me */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.aboutMe')}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {profile.bio || t('auPair.profile.bioNotProvided')}
                    </p>
                </div>

                {/* Experience */}
                 {profile.experience_description && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.profile.experience')}</h3>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic border-l-4 border-gray-300">
                            "{profile.experience_description}"
                        </div>
                    </div>
                )}

                {/* Preferences */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('auPair.preferences')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.preferredLocation')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.preferred_countries?.map(getCountryLabel).join(', ') || 'Any'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.duration')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.duration_months} {t('common.months')}</p>
                        </div>
                        <div>
                             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.startDate')}</p>
                             <p className="text-sm font-medium text-gray-900">{profile.available_from}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.ageGroups')}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {profile.age_groups_worked?.map(g => t(`auPair.onboarding.options.ageComfort.${g}`) || g).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Safety Badges */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.profile.safety') || 'Safety & Expertise'}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { key: 'first_aid', label: t('auPair.profile.firstAid') || 'First Aid' },
                            { key: 'swimming_skills', label: t('auPair.profile.swimming') || 'Swimming' },
                            { key: 'drivers_license', label: t('auPair.profile.driversLicense') || 'Driving License' },
                            { key: 'special_needs_experience', label: t('auPair.profile.specialNeeds') || 'Special Needs' }
                        ].map((item, idx) => (
                            <div 
                                key={idx}
                                className={`flex flex-col items-center justify-center text-center p-3 rounded-lg border leading-tight ${
                                    profile[item.key as keyof typeof profile] 
                                    ? 'bg-green-50 border-green-100 text-green-800' 
                                    : 'bg-gray-50 border-gray-100 text-gray-400 opacity-60'
                                }`}
                            >
                                <ShieldCheck size={20} className="mb-2" />
                                <span className="text-xs font-bold">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
