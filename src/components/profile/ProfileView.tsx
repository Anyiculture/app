import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { supabase } from '../../lib/supabase';
import { Loading } from '../ui/Loading';
import { Button } from '../ui/Button';
import { BackgroundBlobs } from '../ui/BackgroundBlobs';
import {
  User,
  MapPin,
  Calendar,
  MessageCircle,
  Settings,
  Briefcase,
  Award,
  Globe,
  Mail,
  Phone,
  Building2,
  Baby,
  Home
} from 'lucide-react';
import { messagingService } from '../../services/messagingService';

interface Profile {
  id: string;
  full_name?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  city?: string;
  location?: string;
  current_city?: string;
  phone?: string;
  primary_interest?: string;
  interested_modules?: string[];
  created_at: string;
  role?: string;
  citizenship_country?: string;
  residence_country?: string;
  residence_province?: string;
  residence_city?: string;
  user_goals?: string;
  platform_intent?: string;
  gender?: string;
  date_of_birth?: string;
}

interface JobSeekerProfile {
  resume_url?: string;
  skills?: string[];
  education_history?: any[];
  work_history?: any[];
}

interface UserActivity {
  jobs_posted: number;
  events_created: number;
  marketplace_items: number;
}

interface ProfileViewProps {
  userId?: string;
  embedded?: boolean;
}

export function ProfileView({ userId, embedded = false }: ProfileViewProps) {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  // If no ID is provided via props, assume current user
  const profileId = userId || user?.id;
  const isOwnProfile = user?.id === profileId;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobSeekerProfile, setJobSeekerProfile] = useState<JobSeekerProfile | null>(null);
  const [auPairProfile, setAuPairProfile] = useState<any>(null);
  const [hostFamilyProfile, setHostFamilyProfile] = useState<any>(null);
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [activity, setActivity] = useState<UserActivity>({
    jobs_posted: 0,
    events_created: 0,
    marketplace_items: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'details' | 'media'>('about');

  useEffect(() => {
    if (profileId) {
      loadProfile();
      loadActivity();
    } else if (!user && !loading) {
        // If not logged in and no ID, redirect to signin
        // Only if not embedded (if embedded, the parent likely handles auth)
        if (!embedded) navigate('/signin');
    }
  }, [profileId, user]);

  const loadProfile = async () => {
    if (!profileId) return;

    try {
      setLoading(true);
      setError(null);

      // 1. Fetch Basic Profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileData) {
        setError(t('profile.profileNotFound'));
        return;
      }

      setProfile(profileData);

      // 2. Fetch Job Seeker Details (if applicable)
      const { data: jsData } = await supabase
        .from('profiles_jobseeker')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      
      if (jsData) {
        setJobSeekerProfile(jsData);
      }

      // 3. Fetch Au Pair Profile
      const { data: apData } = await supabase
        .from('au_pair_profiles')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      if (apData) setAuPairProfile(apData);

      // 4. Fetch Host Family Profile
      const { data: hfData } = await supabase
        .from('host_family_profiles')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      if (hfData) setHostFamilyProfile(hfData);

      // 5. Fetch Employer Profile
      const { data: empData } = await supabase
        .from('profiles_employer')
        .select('*')
        .eq('user_id', profileId)
        .maybeSingle();
      if (empData) setEmployerProfile(empData);

    } catch (err: any) {
      console.error('Error loading profile:', err);
      setError(t('profile.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadActivity = async () => {
    if (!profileId) return;

    try {
      const [jobsResult, eventsResult, marketplaceResult] = await Promise.all([
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('poster_id', profileId),
        supabase.from('events').select('id', { count: 'exact', head: true }).eq('organizer_id', profileId),
        supabase.from('marketplace_items').select('id', { count: 'exact', head: true }).eq('seller_id', profileId),
      ]);

      setActivity({
        jobs_posted: jobsResult.count || 0,
        events_created: eventsResult.count || 0,
        marketplace_items: marketplaceResult.count || 0,
      });
    } catch (err) {
      console.error('Error loading activity:', err);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !profile) {
      navigate('/signin');
      return;
    }

    try {
      const conversationId = await messagingService.getOrCreateConversation(
        profile.id,
        'general',
        undefined,
        `Chat with ${profile.full_name}`
      );
      navigate(`/messages?conversation=${conversationId}`);
    } catch (err) {
      console.error('Failed to create conversation:', err);
      alert(t('profile.conversationFailed'));
    }
  };

  if (loading) {
    return (
      <div className={`${embedded ? 'h-full' : 'min-h-screen'} bg-gray-50 flex items-center justify-center`}>
        <Loading />
      </div>
    );
  }

  if ((!profileId && !user) || error || !profile) {
    return (
      <div className={`${embedded ? 'h-full' : 'min-h-screen'} bg-gray-50 flex items-center justify-center p-4`}>
        <div className="text-center bg-white p-8 rounded-2xl shadow-xl max-w-md w-full">
          <User size={64} className="mx-auto text-gray-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('profilePage.notFound')}</h2>
          <p className="text-gray-600 mb-6">{error || t('profilePage.signInRequired')}</p>
          {!embedded && (
            <Button onClick={() => navigate(user ? '/' : '/signin')} className="w-full">
              {user ? t('profilePage.goHome') : t('profilePage.signIn')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Display fields fallback
  const displayCity = profile.residence_city || profile.city || profile.current_city || profile.location;

  const interests = [
    profile.primary_interest,
    ...(profile.interested_modules || []),
  ].filter(Boolean);

  const containerClasses = embedded 
    ? "w-full" 
    : "min-h-screen bg-gray-50/50 py-12 relative overflow-hidden";

  const wrapperClasses = embedded
    ? "bg-white rounded-3xl overflow-hidden" 
    : "bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 overflow-hidden";

  // Helper to render tabs
  const renderTabs = () => (
    <div className="flex border-b border-gray-200 mb-6 overflow-x-auto">
      <button
        onClick={() => setActiveTab('about')}
        className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
          activeTab === 'about'
            ? 'border-blue-600 text-blue-600'
            : 'border-transparent text-gray-500 hover:text-gray-700'
        }`}
      >
        {t('profile.tabs.about') || 'About'}
      </button>
      {(auPairProfile || hostFamilyProfile || employerProfile) && (
        <button
          onClick={() => setActiveTab('details')}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('profile.tabs.details') || 'Role Details'}
        </button>
      )}
      {/* Show Media tab if photos/videos exist */}
      {((auPairProfile?.profile_photos?.length > 0) || (hostFamilyProfile?.family_photos?.length > 0) || (employerProfile?.company_images?.length > 0)) && (
        <button
          onClick={() => setActiveTab('media')}
          className={`px-6 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
            activeTab === 'media'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          {t('profile.tabs.media') || 'Photos & Video'}
        </button>
      )}
    </div>
  );

  return (
    <div className={containerClasses}>
      {!embedded && <BackgroundBlobs className="opacity-60" />}

      <div className={`${embedded ? '' : 'max-w-5xl mx-auto px-4'} relative z-10`}>
        <div className={wrapperClasses}>
          
          {/* Cover Image / Header Gradient */}
          <div className="h-48 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 relative">
             <div className="absolute inset-0 bg-black/10"></div>
          </div>

          <div className="px-8 pb-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-20 mb-8">
              <div className="flex items-end gap-6">
                <div className="w-40 h-40 rounded-full border-[6px] border-white bg-white overflow-hidden shadow-2xl relative z-10">
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <span className="text-4xl font-bold text-gray-300">
                         {profile.full_name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="mb-4 pt-20 md:pt-0">
                  <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">{profile.full_name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                     {displayCity && (
                      <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                        <MapPin size={16} className="text-blue-500" />
                        <span>{displayCity}</span>
                      </div>
                     )}
                     <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full text-sm font-medium">
                        <Calendar size={16} className="text-purple-500" />
                        <span>{t('profilePage.joined')} {new Date(profile.created_at).toLocaleDateString()}</span>
                     </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6 md:mt-0">
                {isOwnProfile ? (
                  !embedded && (
                    <Button
                        onClick={() => navigate('/settings/general')}
                        variant="outline"
                        className="flex items-center gap-2 px-6 shadow-sm hover:shadow-md transition-all bg-white"
                    >
                        <Settings size={18} />
                        {t('settings.profile.edit') || t('profilePage.editProfile')}
                    </Button>
                  )
                ) : (
                  <Button
                    onClick={handleSendMessage}
                    className="flex items-center gap-2 px-6 shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all bg-gradient-to-r from-blue-600 to-indigo-600 border-none text-white"
                  >
                    <MessageCircle size={18} />
                    {t('profilePage.message')}
                  </Button>
                )}
              </div>
            </div>

            {renderTabs()}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Stats & Info (Always Visible) */}
              <div className="space-y-6">
                
                {/* Activity Stats */}
                <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t('profilePage.activity.title')}</h3>
                  <div className="space-y-4">
                     {(activity.jobs_posted > 0 || profile.primary_interest === 'jobs') && (
                         <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-2"><Briefcase size={16}/> {t('profilePage.activity.jobsPosted')}</span>
                            <span className="font-bold text-gray-900">{activity.jobs_posted}</span>
                         </div>
                     )}
                     {(activity.events_created > 0 || profile.primary_interest === 'events') && (
                         <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-2"><Calendar size={16}/> {t('profilePage.activity.events')}</span>
                            <span className="font-bold text-gray-900">{activity.events_created}</span>
                         </div>
                     )}
                     {(activity.marketplace_items > 0 || profile.primary_interest === 'marketplace') && (
                         <div className="flex items-center justify-between">
                            <span className="text-gray-600 flex items-center gap-2"><Globe size={16}/> {t('profilePage.activity.marketplace')}</span>
                            <span className="font-bold text-gray-900">{activity.marketplace_items}</span>
                         </div>
                     )}
                     
                     {activity.jobs_posted === 0 && activity.events_created === 0 && activity.marketplace_items === 0 && (
                         <div className="text-sm text-gray-500 italic">{t('profilePage.activity.noActivity')}</div>
                     )}
                  </div>
                </div>

                {/* Contact Info (if available/visible) */}
                {(profile.phone || (isOwnProfile && user?.email)) && (
                   <div className="bg-gray-50/80 rounded-2xl p-6 border border-gray-100">
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">{t('profilePage.contact.title')}</h3>
                    <div className="space-y-3">
                       {isOwnProfile && user?.email && (
                          <div className="flex items-center gap-3 text-gray-700">
                             <Mail size={18} className="text-gray-400"/>
                             <span className="truncate">{user.email}</span>
                          </div>
                       )}
                       {profile.phone && (
                          <div className="flex items-center gap-3 text-gray-700">
                             <Phone size={18} className="text-gray-400"/>
                             <span>{profile.phone}</span>
                          </div>
                       )}
                    </div>
                   </div>
                )}
              </div>

              {/* Right Column: Tabbed Content */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* ABOUT TAB */}
                {activeTab === 'about' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    {/* Bio */}
                    {profile.bio && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{t('profilePage.about.title')}</h3>
                         <p className="text-gray-600 leading-relaxed text-lg bg-white p-6 rounded-2xl border border-gray-100 shadow-sm whitespace-pre-line">
                           {profile.bio}
                         </p>
                      </div>
                    )}

                    {/* Basic Details */}
                    {(profile.citizenship_country || profile.gender || profile.user_goals || profile.platform_intent) && (
                      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">{t('profilePage.details.title')}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {profile.citizenship_country && (
                            <div>
                              <span className="text-sm text-gray-500 block mb-1">{t('profilePage.details.citizenship')}</span>
                              <span className="font-medium text-gray-900 flex items-center gap-2">
                                <Globe size={16} className="text-blue-500"/>
                                {profile.citizenship_country}
                              </span>
                            </div>
                          )}
                          {profile.gender && (
                            <div>
                              <span className="text-sm text-gray-500 block mb-1">{t('profilePage.details.gender')}</span>
                              <span className="font-medium text-gray-900 capitalize">{profile.gender}</span>
                            </div>
                          )}
                          {profile.platform_intent && (
                            <div className="md:col-span-2">
                              <span className="text-sm text-gray-500 block mb-1">{t('profilePage.details.intent')}</span>
                              <span className="font-medium text-gray-900">{profile.platform_intent}</span>
                            </div>
                          )}
                          {profile.user_goals && (
                            <div className="md:col-span-2">
                              <span className="text-sm text-gray-500 block mb-1">{t('profilePage.details.goals')}</span>
                              <p className="text-gray-700">{profile.user_goals}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interests */}
                    {interests.length > 0 && (
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{t('profilePage.interests.title')}</h3>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest, idx) => (
                            <span
                              key={idx}
                              className="px-4 py-2 bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-700 rounded-xl text-sm font-medium border border-blue-100"
                            >
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Job Seeker Only: Skills & Experience */}
                    {jobSeekerProfile && (
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mt-6">
                             {jobSeekerProfile.skills && Array.isArray(jobSeekerProfile.skills) && jobSeekerProfile.skills.length > 0 && (
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
                                        <Award className="text-purple-500" size={24}/>
                                        {t('profilePage.skills.title')}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {jobSeekerProfile.skills.map(skill => (
                                            <span key={skill} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm border border-purple-100">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                            
                             {jobSeekerProfile.resume_url && (
                                 <div className="mt-6">
                                    <a 
                                        href={jobSeekerProfile.resume_url} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="inline-flex items-center gap-2 px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                                    >
                                        <FileTextIcon /> {t('profilePage.resume.view')}
                                    </a>
                                 </div>
                             )}
                        </div>
                    )}
                  </div>
                )}

                {/* DETAILS TAB */}
                {activeTab === 'details' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    
                    {/* AU PAIR DETAILS */}
                    {auPairProfile && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                             <Baby className="text-pink-500" size={24}/>
                             {t('settings.roles.auPair')}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <span className="text-sm text-gray-500 block mb-1">{t('auPair.details.nationality')}</span>
                                <span className="font-medium text-gray-900">{auPairProfile.nationality || '-'}</span>
                             </div>
                             <div>
                                <span className="text-sm text-gray-500 block mb-1">{t('auPair.details.experience')}</span>
                                <span className="font-medium text-gray-900">{auPairProfile.childcare_experience_years} {t('common.years')}</span>
                             </div>
                             {auPairProfile.education_level && (
                               <div>
                                  <span className="text-sm text-gray-500 block mb-1">{t('auPair.onboarding.step3.education')}</span>
                                  <span className="font-medium text-gray-900">{auPairProfile.education_level}</span>
                               </div>
                             )}
                             <div className="md:col-span-2">
                                <span className="text-sm text-gray-500 block mb-2">{t('auPair.details.languages')}</span>
                                <div className="flex flex-wrap gap-2">
                                  {auPairProfile.languages && Array.isArray(auPairProfile.languages) ? (
                                     auPairProfile.languages.map((l: any, i: number) => (
                                       <span key={i} className="px-3 py-1 bg-gray-100 rounded-lg text-sm">
                                         {l.language || l} <span className="text-gray-500 text-xs">({l.proficiency || 'Intermediate'})</span>
                                       </span>
                                     ))
                                  ) : '-'}
                                </div>
                             </div>
                          </div>
                        </div>

                        {/* Traits & Skills */}
                        {(auPairProfile.personality_traits?.length > 0 || auPairProfile.skills?.length > 0) && (
                          <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                             <h4 className="text-lg font-bold text-gray-900 mb-4">{t('profile.section.traitsAndSkills') || 'Traits & Skills'}</h4>
                             
                             {auPairProfile.personality_traits?.length > 0 && (
                               <div className="mb-6">
                                 <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('auPair.onboarding.step2.traitsLabel')}</h5>
                                 <div className="flex flex-wrap gap-2">
                                   {auPairProfile.personality_traits.map((trait: string) => (
                                     <span key={trait} className="px-3 py-1 bg-pink-50 text-pink-700 rounded-lg text-sm border border-pink-100 capitalize">
                                       {trait}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             )}

                             {auPairProfile.skills?.length > 0 && (
                               <div>
                                 <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('auPair.onboarding.step3.skillsLabel')}</h5>
                                 <div className="flex flex-wrap gap-2">
                                   {auPairProfile.skills.map((skill: string) => (
                                     <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm border border-blue-100 capitalize">
                                       {skill}
                                     </span>
                                   ))}
                                 </div>
                               </div>
                             )}
                          </div>
                        )}

                        {/* Preferences */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                           <h4 className="text-lg font-bold text-gray-900 mb-4">{t('profile.section.preferences') || 'Preferences'}</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                 <span className="text-gray-500 block">{t('auPair.onboarding.step5.accommodationLabel')}</span>
                                 <span className="font-medium capitalize">{auPairProfile.live_in_preference?.replace('_', ' ')}</span>
                              </div>
                              <div>
                                 <span className="text-gray-500 block">{t('auPair.onboarding.step5.familyTypeLabel')}</span>
                                 <span className="font-medium capitalize">{auPairProfile.preferred_family_type?.join(', ') || '-'}</span>
                              </div>
                              <div className="md:col-span-2">
                                 <span className="text-gray-500 block">{t('auPair.onboarding.step6.availableFrom')}</span>
                                 <span className="font-medium">{auPairProfile.available_from} ({auPairProfile.duration_months} months)</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}

                    {/* HOST FAMILY DETAILS */}
                    {hostFamilyProfile && (
                      <div className="space-y-6">
                         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                               <Home className="text-orange-500" size={24}/>
                               {t('settings.roles.hostFamily')}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                  <span className="text-sm text-gray-500 block mb-1">{t('auPair.hostFamily.children')}</span>
                                  <span className="font-medium text-gray-900">{hostFamilyProfile.children_count}</span>
                               </div>
                               <div>
                                  <span className="text-sm text-gray-500 block mb-1">{t('auPair.hostFamily.location')}</span>
                                  <span className="font-medium text-gray-900">{hostFamilyProfile.city}, {hostFamilyProfile.country}</span>
                               </div>
                               {hostFamilyProfile.children_ages && (
                                 <div className="md:col-span-2">
                                    <span className="text-sm text-gray-500 block mb-1">{t('auPair.onboarding.childrenAges') || 'Children Ages'}</span>
                                    <div className="flex gap-2">
                                       {hostFamilyProfile.children_ages.map((age: number, i: number) => (
                                          <span key={i} className="w-8 h-8 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-sm">
                                             {age}
                                          </span>
                                       ))}
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>

                         {/* Lifestyle & Rules */}
                         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-900 mb-4">{t('profile.section.lifestyle') || 'Lifestyle & Home'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                               <div>
                                  <span className="text-sm text-gray-500 block mb-1">{t('auPair.onboarding.homeType')}</span>
                                  <span className="font-medium text-gray-900 capitalize">{hostFamilyProfile.housing_type || hostFamilyProfile.home_type}</span>
                               </div>
                               <div>
                                  <span className="text-sm text-gray-500 block mb-1">{t('auPair.onboarding.householdVibe')}</span>
                                  <span className="font-medium text-gray-900 capitalize">{hostFamilyProfile.household_vibe?.join(', ')}</span>
                               </div>
                            </div>

                            {hostFamilyProfile.rules && hostFamilyProfile.rules.length > 0 && (
                               <div className="mb-4">
                                  <span className="text-sm text-gray-500 block mb-2">{t('auPair.onboarding.houseRules')}</span>
                                  <div className="flex flex-wrap gap-2">
                                     {hostFamilyProfile.rules.map((rule: string) => (
                                        <span key={rule} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm border border-gray-200 capitalize">
                                           {rule.replace('_', ' ')}
                                        </span>
                                     ))}
                                  </div>
                               </div>
                            )}
                            
                            {hostFamilyProfile.house_rules_details && (
                               <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-600 italic">
                                  "{hostFamilyProfile.house_rules_details}"
                               </div>
                            )}
                         </div>

                         {/* Job Offer */}
                         <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                            <h4 className="text-lg font-bold text-gray-900 mb-4">{t('profile.section.jobOffer') || 'Job Offer'}</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                               <div>
                                  <span className="text-sm text-gray-500 block mb-1">{t('jobs.salary.label')}</span>
                                  <span className="font-bold text-green-600 text-lg">¥{hostFamilyProfile.monthly_salary_offer}</span>
                                  <span className="text-xs text-gray-400 block">/ month</span>
                               </div>
                               <div>
                                  <span className="text-sm text-gray-500 block mb-1">{t('common.startDate')}</span>
                                  <span className="font-medium text-gray-900">{hostFamilyProfile.start_date}</span>
                               </div>
                               <div className="md:col-span-2">
                                  <span className="text-sm text-gray-500 block mb-2">{t('auPair.onboarding.duties')}</span>
                                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                     {hostFamilyProfile.daily_tasks?.map((task: string) => (
                                        <li key={task} className="flex items-center gap-2 text-gray-700 text-sm">
                                           <div className="w-1.5 h-1.5 rounded-full bg-orange-400"/>
                                           <span className="capitalize">{task.replace('_', ' ')}</span>
                                        </li>
                                     ))}
                                  </ul>
                               </div>
                               {hostFamilyProfile.benefits?.length > 0 && (
                                 <div className="md:col-span-2">
                                    <span className="text-sm text-gray-500 block mb-2">{t('auPair.onboarding.benefits')}</span>
                                    <div className="flex flex-wrap gap-2">
                                       {hostFamilyProfile.benefits.map((benefit: string) => (
                                          <span key={benefit} className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs border border-green-100 capitalize">
                                             {benefit.replace('_', ' ')}
                                          </span>
                                       ))}
                                    </div>
                                 </div>
                               )}
                            </div>
                         </div>
                      </div>
                    )}

                    {/* EMPLOYER DETAILS */}
                    {employerProfile && (
                      <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                             <Building2 className="text-blue-500" size={24}/>
                             {t('settings.roles.company')}
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                <span className="text-sm text-gray-500 block">{t('jobs.company')}</span>
                                <span className="font-medium">{employerProfile.company_name}</span>
                             </div>
                             <div>
                                <span className="text-sm text-gray-500 block">{t('jobs.industry')}</span>
                                <span className="font-medium capitalize">{employerProfile.industry}</span>
                             </div>
                             <div>
                                <span className="text-sm text-gray-500 block">{t('jobsOnboarding.companySize')}</span>
                                <span className="font-medium">{employerProfile.company_size ? t(`companySize.${employerProfile.company_size}`) : '-'}</span>
                             </div>
                             <div>
                                <span className="text-sm text-gray-500 block">{t('common.location')}</span>
                                <span className="font-medium">{employerProfile.registration_city}, {employerProfile.registration_province}</span>
                             </div>
                             <div className="md:col-span-2">
                                <Button 
                                   size="sm" 
                                   variant="outline" 
                                   onClick={() => navigate(`/companies/${employerProfile.user_id}`)}
                                >
                                   {t('profilePage.viewCompanyProfile')}
                                </Button>
                             </div>
                          </div>
                        </div>

                        {employerProfile.technologies?.length > 0 && (
                           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <h4 className="text-lg font-bold text-gray-900 mb-4">{t('jobsOnboarding.techStack')}</h4>
                              <div className="flex flex-wrap gap-2">
                                 {employerProfile.technologies.map((tech: string) => (
                                    <span key={tech} className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm font-medium">
                                       {tech}
                                    </span>
                                 ))}
                              </div>
                           </div>
                        )}
                        
                        {(employerProfile.website || employerProfile.linkedin_url) && (
                           <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                              <h4 className="text-lg font-bold text-gray-900 mb-4">{t('jobsOnboarding.onlinePresence')}</h4>
                              <div className="flex flex-col gap-2">
                                 {employerProfile.website && (
                                    <a href={employerProfile.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-2">
                                       <Globe size={16}/> {employerProfile.website}
                                    </a>
                                 )}
                              </div>
                           </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* MEDIA TAB */}
                {activeTab === 'media' && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                     {/* Au Pair Media */}
                     {auPairProfile?.profile_photos?.length > 0 && (
                        <div>
                           <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auPair.onboarding.steps.media')}</h3>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {auPairProfile.profile_photos.map((photo: string, i: number) => (
                                 <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <img src={photo} alt={`Photo ${i+1}`} className="w-full h-full object-cover" />
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                     
                     {/* Host Family Media */}
                     {hostFamilyProfile?.family_photos?.length > 0 && (
                        <div>
                           <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auPair.onboarding.steps.media')}</h3>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {hostFamilyProfile.family_photos.map((photo: string, i: number) => (
                                 <div key={i} className="aspect-square rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <img src={photo} alt={`Family Photo ${i+1}`} className="w-full h-full object-cover" />
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                     
                     {/* Employer Media */}
                     {employerProfile?.company_images?.length > 0 && (
                        <div>
                           <h3 className="text-xl font-bold text-gray-900 mb-4">{t('jobsOnboarding.companyPhotos')}</h3>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                              {employerProfile.company_images.map((photo: string, i: number) => (
                                 <div key={i} className="aspect-video rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                                    <img src={photo} alt={`Company Photo ${i+1}`} className="w-full h-full object-cover" />
                                 </div>
                              ))}
                           </div>
                        </div>
                     )}
                  </div>
                )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

}

const FileTextIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
);
