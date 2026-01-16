import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { auPairMatchingService } from '../services/auPairMatchingService';
import { useI18n } from '../contexts/I18nContext';
import { profileService } from '../services/profileService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { 
  User, 
  Bell, 
  LogOut, 
  Save, 
  Star,
  Shield, 
  CreditCard,
  ChevronRight,
  Camera
} from 'lucide-react';

interface ProfileData {
  full_name?: string;
  display_name?: string;
  phone?: string;
  current_city?: string;
  citizenship_country?: string;
  residence_country?: string;
  residence_province?: string;
  residence_city?: string;
  bio?: string;
  profile_image_url?: string;
  avatar_url?: string;
  interested_modules: string[];
  primary_interest?: string;
  gender?: string;
  date_of_birth?: string;
  user_goals?: string;
  platform_intent?: string;
}

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useAuth();
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [auPairProfile, setAuPairProfile] = useState<any>(null);
  const [hostFamilyProfile, setHostFamilyProfile] = useState<any>(null);
  const [employerProfile, setEmployerProfile] = useState<any>(null);
  const [jobSeekerProfile, setJobSeekerProfile] = useState<any>(null);
  const [profileData, setProfileData] = useState<ProfileData>({
    interested_modules: []
  });

  const availableModules = [
    { id: 'jobs', name: t('nav.jobs'), icon: '💼' },
    { id: 'aupair', name: t('nav.auPair'), icon: '👶' },
    { id: 'events', name: t('nav.events'), icon: '📅' },
    { id: 'marketplace', name: t('nav.marketplace'), icon: '🛒' },
    { id: 'education', name: t('nav.education'), icon: '📚' },
    { id: 'visa', name: t('nav.visa'), icon: '📋' },
    { id: 'community', name: t('nav.community'), icon: '👥' },
  ];

  useEffect(() => {
    if (!authLoading && !user) {
        navigate('/signin');
        return;
    }

    if (user?.id) {
      loadProfile();
      loadRoleProfiles();
    }
  }, [user?.id, authLoading]);

  const loadRoleProfiles = async () => {
    if (!user?.id) return;
    
    // Au Pair
    auPairMatchingService.getAuPairProfile(user.id).then(setAuPairProfile);
    
    // Host Family
    supabase.from('host_family_profiles').select('*').eq('user_id', user.id).maybeSingle().then(({ data }: any) => setHostFamilyProfile(data));
    
    // Check for roles in user_services to show edit buttons even if profile is incomplete
    const { data: userServices } = await supabase
        .from('user_services')
        .select('service_type, role')
        .eq('user_id', user.id);
        
    const hasEmployerRole = userServices?.some((s: any) => s.service_type === 'jobs' && s.role === 'employer');
    const hasJobSeekerRole = userServices?.some((s: any) => s.service_type === 'jobs' && s.role === 'job_seeker');

    // Employer - Load existing OR set dummy if role exists but profile doesn't
    supabase.from('profiles_employer').select('*').eq('user_id', user.id).maybeSingle().then(({ data }: any) => {
        if (data) {
             setEmployerProfile(data);
        } else if (hasEmployerRole) {
             setEmployerProfile({ status: 'incomplete' }); // Dummy object to trigger UI render
        }
    });
    
    // Job Seeker - Load existing OR set dummy if role exists but profile doesn't
    supabase.from('profiles_jobseeker').select('*').eq('user_id', user.id).maybeSingle().then(({ data }: any) => {
        if (data) {
            setJobSeekerProfile(data);
        } else if (hasJobSeekerRole) {
            setJobSeekerProfile({ status: 'incomplete' }); // Dummy object to trigger UI render
        }
    });
  };

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const profile = await profileService.getProfile(user.id);
      if (profile) {
        setProfileData({
          full_name: profile.full_name || undefined,
          display_name: profile.display_name || undefined,
          phone: profile.phone || undefined,
          current_city: profile.current_city || undefined,
          citizenship_country: profile.citizenship_country || (profile as any).citizenship_country || undefined,
          residence_country: profile.residence_country || (profile as any).residence_country || undefined,
          residence_province: profile.residence_province || (profile as any).residence_province || undefined,
          residence_city: profile.residence_city || (profile as any).residence_city || undefined,
          bio: profile.bio || undefined,
          profile_image_url: profile.profile_image_url || undefined,
          avatar_url: profile.avatar_url || undefined,
          interested_modules: profile.interested_modules || [],
          primary_interest: profile.primary_interest || undefined,
          gender: profile.gender || (profile as any).gender || undefined,
          date_of_birth: profile.date_of_birth || (profile as any).date_of_birth || undefined,
          user_goals: profile.user_goals || undefined,
          platform_intent: profile.platform_intent || undefined,
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleProfileUpdate = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      await profileService.updateProfile(user.id, profileData);
      alert(t('settings.updateSuccess'));
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(t('settings.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setProfileData(prev => {
      const modules = prev.interested_modules.includes(moduleId)
        ? prev.interested_modules.filter(m => m !== moduleId)
        : [...prev.interested_modules, moduleId];
      return { ...prev, interested_modules: modules };
    });
  };

  const tabs = [
    { id: 'profile', label: t('settings.generalProfile'), icon: User },
    { id: 'modules', label: t('settings.myInterests'), icon: Star },
    { id: 'security', label: t('settings.accountSecurity'), icon: Shield },
    { id: 'notifications', label: t('settings.notifications'), icon: Bell },
    { id: 'billing', label: t('settings.billingPlans'), icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-gray-50/50 py-8 relative overflow-hidden font-sans">
      <BackgroundBlobs className="opacity-60" />

      <div className="max-w-6xl mx-auto px-4 relative z-10 animate-in fade-in duration-700">
        
        <div className="bg-white/80 backdrop-blur-2xl rounded-2xl shadow-xl border border-white/60 overflow-hidden flex flex-col md:flex-row min-h-[600px]">
          
          {/* Sidebar - Precise premium styling */}
          <div className="w-full md:w-72 bg-white/40 border-r border-white/50 p-5 flex flex-col justify-between backdrop-blur-md">
            <div>
                 <div className="mb-6 px-2">
                    <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">{t('settings.title')}</h2>
                    <p className="text-xs text-gray-500 mt-1">{t('settings.description')}</p>
                 </div>

                <nav className="space-y-1">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-left transition-all duration-300 ease-out group ${
                        isActive
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-200 scale-[1.02]'
                            : 'text-gray-600 hover:bg-white/80 hover:text-gray-900 border border-transparent hover:border-white/50 hover:shadow-sm'
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                        <Icon size={20} className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-blue-500 transition-colors'} strokeWidth={isActive ? 2.5 : 2} />
                        <span className={`text-[15px] ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
                        </div>
                        {isActive && <ChevronRight size={16} className="text-white/80" />}
                    </button>
                    );
                })}
                </nav>
            </div>

            <div className="pt-6 mt-6 border-t border-gray-200/50">
               <button
                  onClick={() => setShowLogoutDialog(true)}
                  className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-left text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors group"
                >
                  <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                  <span className="text-sm font-medium">{t('auth.signOut')}</span>
                </button>
            </div>
          </div>

          {/* Content Area - Precise form styling */}
          <div className="flex-1 p-6 md:p-10 overflow-y-auto bg-white/60">
            
            {activeTab === 'profile' && (
              <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {auPairProfile && (
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white text-xl">👶</div>
                      <div>
                        <h3 className="text-base font-bold text-blue-900">{t('settings.roles.auPair')}</h3>
                        <p className="text-blue-700 text-sm">{t('settings.roles.auPairDesc')}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate('/au-pair/edit-profile')}
                      className="bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 shadow-sm"
                    >
                      {t('settings.roles.editAuPair')}
                    </Button>
                  </div>
                )}

                {hostFamilyProfile && (
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white text-xl">🏠</div>
                      <div>
                        <h3 className="text-base font-bold text-orange-900">{t('settings.roles.hostFamily')}</h3>
                        <p className="text-orange-700 text-sm">{t('settings.roles.hostFamilyDesc')}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate('/au-pair/edit-family-profile')}
                      className="bg-white text-orange-600 border border-orange-200 hover:bg-orange-50 shadow-sm"
                    >
                      {t('settings.roles.editFamily')}
                    </Button>
                  </div>
                )}

                {employerProfile && (
                  <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-xl">🏢</div>
                      <div>
                        <h3 className="text-base font-bold text-emerald-900">{t('settings.roles.company')}</h3>
                        <p className="text-emerald-700 text-sm">{t('settings.roles.companyDesc')}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate('/employer/profile/edit')}
                      className="bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 shadow-sm"
                    >
                      {t('settings.roles.editCompany')}
                    </Button>
                  </div>
                )}

                {jobSeekerProfile && (
                  <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200 flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white text-xl">📝</div>
                      <div>
                        <h3 className="text-base font-bold text-indigo-900">{t('settings.roles.jobSeeker')}</h3>
                        <p className="text-indigo-700 text-sm">{t('settings.roles.jobSeekerDesc')}</p>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate('/job-seeker/edit-profile')}
                      className="bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 shadow-sm"
                    >
                      {t('settings.roles.editResume')}
                    </Button>
                  </div>
                )}

                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('settings.profile.title')}</h2>
                    <p className="text-gray-500 mt-1 text-sm">{t('settings.profile.description')}</p>
                  </div>
                  <Button 
                    onClick={handleProfileUpdate} 
                    disabled={loading} 
                    className="shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:scale-105 transition-transform px-5 py-2 h-auto rounded-lg text-sm"
                  >
                    <Save size={18} className="mr-2" />
                    {loading ? t('common.saving') : t('common.saveChanges')}
                  </Button>
                </div>

                {/* Avatar Section - Exact clone layout */}
                <div className="flex items-start gap-8">
                   <div className="relative group">
                       <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-2xl bg-gray-100 relative">
                          {profileData.profile_image_url ? (
                             <img src={profileData.profile_image_url} alt="Profile" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700" />
                          ) : (
                             <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-200">
                                <User size={56} />
                             </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                              <Camera className="text-white drop-shadow-md" size={24} />
                              <span className="text-white text-xs font-bold shadow-sm">{t('common.change')}</span>
                          </div>
                       </div>
                   </div>
                   
                   <div className="flex-1 pt-2">
                       <label className="block text-sm font-bold text-gray-900 mb-2">{t('settings.profile.photo')}</label>
                       <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                          {t('settings.profile.photoDesc')}
                       </p>
                       <div className="w-fit">
                          <label className="cursor-pointer bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm inline-flex items-center gap-2">
                             <Camera size={16} />
                             {t('common.chooseFile')}
                             <input
                               type="file"
                               className="hidden"
                               accept="image/*"
                               onChange={async (e) => {
                                   if (e.target.files && e.target.files[0]) {
                                       const file = e.target.files[0];
                                       try {
                                           setLoading(true);
                                           const fileExt = file.name.split('.').pop();
                                           const fileName = `${user!.id}-${Math.random()}.${fileExt}`;
                                           const filePath = `${fileName}`;
                                           
                                           const { error: uploadError } = await supabase.storage
                                               .from('avatars')
                                               .upload(filePath, file);

                                           if (uploadError) throw uploadError;

                                           const { data: { publicUrl } } = supabase.storage
                                               .from('avatars')
                                               .getPublicUrl(filePath);

                                           setProfileData(prev => ({ ...prev, avatar_url: publicUrl, profile_image_url: publicUrl }));
                                       } catch (error) {
                                           console.error('Error uploading image:', error);
                                           alert('Error uploading image');
                                       } finally {
                                           setLoading(false);
                                       }
                                   }
                               }}
                             />
                          </label>
                       </div>
                   </div>
                </div>

                {/* Form Fields - Exact clone spacing */}
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">{t('settings.profile.displayName')}</label>
                          <Input
                            value={profileData.display_name || profileData.full_name || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, display_name: e.target.value, full_name: e.target.value }))}
                            placeholder={t('settings.profile.displayNamePlaceholder')}
                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">{t('settings.profile.phone')}</label>
                          <Input
                            value={profileData.phone || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                            placeholder={t('settings.profile.phonePlaceholder')}
                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                          />
                       </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">{t('settings.profile.dob')}</label>
                          <Input
                            type="date"
                            value={profileData.date_of_birth || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, date_of_birth: e.target.value }))}
                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">{t('settings.profile.gender')}</label>
                          <select
                            value={profileData.gender || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, gender: e.target.value }))}
                            className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                          >
                            <option value="">{t('common.select')}</option>
                            <option value="male">{t('common.male')}</option>
                            <option value="female">{t('common.female')}</option>
                            <option value="other">{t('common.other')}</option>
                            <option value="prefer_not_to_say">{t('common.preferNotToSay')}</option>
                          </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">{t('settings.profile.citizenship')}</label>
                      <Input
                        value={profileData.citizenship_country || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, citizenship_country: e.target.value }))}
                        placeholder={t('settings.profile.citizenship')}
                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">{t('settings.profile.residence')}</label>
                          <Input
                            value={profileData.residence_country || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, residence_country: e.target.value }))}
                            placeholder={t('settings.profile.residence')}
                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">{t('settings.profile.province')}</label>
                          <Input
                            value={profileData.residence_province || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, residence_province: e.target.value }))}
                            placeholder={t('settings.profile.province')}
                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">{t('settings.profile.city')}</label>
                          <Input
                            value={profileData.residence_city || profileData.current_city || ''}
                            onChange={(e) => setProfileData(prev => ({ ...prev, residence_city: e.target.value, current_city: e.target.value }))}
                            placeholder={t('settings.profile.city')}
                            className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                          />
                        </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">{t('settings.profile.bio')}</label>
                      <Textarea
                        value={profileData.bio || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                        placeholder={t('settings.profile.bioPlaceholder')}
                        rows={5}
                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg resize-none p-3"
                      />
                      <div className="flex justify-end mt-1">
                         <span className="text-xs text-gray-400 font-medium">{profileData.bio?.length || 0}/500</span>
                      </div>
                    </div>

                    {/* User Goals */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">{t('onboarding.userGoals')}</label>
                      <Input
                        value={profileData.user_goals || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, user_goals: e.target.value }))}
                        placeholder={t('onboarding.userGoalsDesc')}
                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                      />
                      <p className="text-xs text-gray-500">{t('onboarding.userGoalsDesc')}</p>
                    </div>

                    {/* Platform Intent */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">{t('onboarding.platformIntent')}</label>
                      <Input
                        value={profileData.platform_intent || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, platform_intent: e.target.value }))}
                        placeholder={t('onboarding.platformIntentDesc')}
                        className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                      />
                      <p className="text-xs text-gray-500">{t('onboarding.platformIntentDesc')}</p>
                    </div>

                    {/* Primary Interest */}
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">{t('onboarding.primaryInterest')}</label>
                      <select
                        value={profileData.primary_interest || ''}
                        onChange={(e) => setProfileData(prev => ({ ...prev, primary_interest: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-lg h-10"
                      >
                        <option value="">{t('common.select')}</option>
                        <option value="jobs">{t('nav.jobs')}</option>
                        <option value="marketplace">{t('nav.marketplace')}</option>
                        <option value="events">{t('nav.events')}</option>
                        <option value="education">{t('nav.education')}</option>
                        <option value="community">{t('nav.community')}</option>
                        <option value="visa">{t('nav.visa')}</option>
                        <option value="auPair">{t('nav.auPair')}</option>
                      </select>
                      <p className="text-xs text-gray-500">{t('onboarding.primaryInterestHelp')}</p>
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'modules' && (
              <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="border-b border-gray-100 pb-6">
                   <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{t('settings.profile.interests')}</h2>
                   <p className="text-gray-500 mt-1 text-sm">{t('settings.profile.interestsDesc')}</p>
                </div>

                <div className="space-y-6">
                   <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('settings.profile.primaryFocus')}</h3>
                   <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                     {availableModules.map((module) => (
                       <button
                         key={module.id}
                         onClick={() => setProfileData(prev => ({ ...prev, primary_interest: module.id }))}
                         className={`p-4 rounded-xl border-2 transition-all text-left relative overflow-hidden group ${
                           profileData.primary_interest === module.id
                             ? 'border-blue-500 bg-blue-50/30'
                             : 'border-gray-100 hover:border-blue-200 hover:shadow-lg bg-white'
                         }`}
                       >
                         <div className="text-2xl mb-2 transform group-hover:scale-110 transition-transform duration-300">{module.icon}</div>
                         <div className={`font-bold text-base ${profileData.primary_interest === module.id ? 'text-blue-700' : 'text-gray-700'}`}>
                            {module.name}
                         </div>
                         {profileData.primary_interest === module.id && (
                             <div className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                         )}
                       </button>
                     ))}
                   </div>
                </div>

                 <div className="space-y-6">
                   <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">{t('settings.profile.otherInterests')}</h3>
                   <div className="space-y-3">
                     {availableModules.map((module) => (
                       <label
                         key={module.id}
                         className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-blue-100 hover:shadow-md cursor-pointer transition-all bg-white group"
                       >
                         <input
                           type="checkbox"
                           checked={profileData.interested_modules.includes(module.id)}
                           onChange={() => handleModuleToggle(module.id)}
                           className="w-5 h-5 rounded-md border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2"
                         />
                         <span className="text-xl group-hover:scale-110 transition-transform">{module.icon}</span>
                         <span className="font-semibold text-gray-900 text-base">{module.name}</span>
                       </label>
                     ))}
                   </div>
                </div>

                <div className="pt-8 border-t border-gray-100">
                    <Button 
                        onClick={handleProfileUpdate} 
                        disabled={loading} 
                        className="shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:scale-105 transition-transform px-6 py-2.5 h-auto rounded-xl w-full md:w-auto font-bold text-sm"
                    >
                       <Save size={20} className="mr-2" />
                       {loading ? t('common.saving') : t('common.savePreferences')}
                    </Button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutDialog}
        onClose={() => setShowLogoutDialog(false)}
        onConfirm={handleSignOut}
        title={t('common.signOut')}
        message={t('auth.signOutConfirm')}
        confirmText={t('common.signOut')}
        cancelText={t('common.cancel')}
        variant="warning"
      />
    </div>
  );
}
