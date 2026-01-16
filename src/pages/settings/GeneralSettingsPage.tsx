import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { profileService } from '../../services/profileService';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Textarea } from '../../components/ui/Textarea';
import { supabase } from '../../lib/supabase';
import { Save, User, Camera } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export function GeneralSettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  const [profileData, setProfileData] = useState<any>({
    interested_modules: [],
  });

  useEffect(() => {
    if (user?.id) {
      loadProfile();
    }
  }, [user?.id]);

  const loadProfile = async () => {
    if (!user?.id) return;
    try {
      const profile = await profileService.getProfile(user.id);
      if (profile) {
        setProfileData({
            ...profile,
            citizenship_country: profile.citizenship_country || (profile as any).citizenship_country,
            residence_country: profile.residence_country || (profile as any).residence_country,
            residence_province: profile.residence_province || (profile as any).residence_province,
            residence_city: profile.residence_city || (profile as any).residence_city,
            gender: profile.gender || (profile as any).gender,
            date_of_birth: profile.date_of_birth || (profile as any).date_of_birth,
            interested_modules: profile.interested_modules || [],
            primary_interest: profile.primary_interest || '',
            user_goals: profile.user_goals || '',
            platform_intent: profile.platform_intent || '',
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
      showToast('success', t('settings.updateSuccess'));
    } catch (error) {
      console.error('Error updating profile:', error);
      showToast('error', t('settings.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('settings.profile.title')}</h2>
          <p className="text-gray-500 mt-2 text-md">{t('settings.profile.description')}</p>
        </div>
        <Button 
          onClick={handleProfileUpdate} 
          disabled={loading} 
          className="shadow-xl shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:scale-105 transition-transform px-6 py-2.5 h-auto rounded-xl"
        >
          <Save size={18} className="mr-2" />
          {loading ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </div>

      {/* Avatar Section */}
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
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 cursor-pointer">
                    <Camera className="text-white drop-shadow-md" size={24} />
                    <span className="text-white text-xs font-bold shadow-sm">{t('common.change')}</span>
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

                                  setProfileData((prev: any) => ({ ...prev, avatar_url: publicUrl, profile_image_url: publicUrl }));
                                  // Auto save avatar update
                                  await profileService.updateProfile(user!.id, { ...profileData, avatar_url: publicUrl, profile_image_url: publicUrl });
                                  showToast('success', 'Avatar updated');
                              } catch (error) {
                                  console.error('Error uploading image:', error);
                                  showToast('error', 'Error uploading image');
                              } finally {
                                  setLoading(false);
                              }
                          }
                      }}
                    />
                </label>
             </div>
         </div>
         
         <div className="flex-1 pt-2">
             <label className="block text-sm font-bold text-gray-900 mb-2">{t('settings.profile.photo')}</label>
             <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                {t('settings.profile.photoDesc')}
             </p>
         </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('settings.profile.displayName')}</label>
                <Input
                  value={profileData.display_name || profileData.full_name || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, display_name: e.target.value, full_name: e.target.value }))}
                  placeholder={t('settings.profile.displayNamePlaceholder')}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
                />
             </div>
             <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('settings.profile.phone')}</label>
                <Input
                  value={profileData.phone || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, phone: e.target.value }))}
                  placeholder={t('settings.profile.phonePlaceholder')}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
                />
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('settings.profile.dob')}</label>
                <Input
                  type="date"
                  value={profileData.date_of_birth || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, date_of_birth: e.target.value }))}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('settings.profile.gender')}</label>
                <select
                  value={profileData.gender || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
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
              onChange={(e) => setProfileData((prev: any) => ({ ...prev, citizenship_country: e.target.value }))}
              placeholder={t('settings.profile.citizenship')}
              className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('settings.profile.residence')}</label>
                <Input
                  value={profileData.residence_country || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, residence_country: e.target.value }))}
                  placeholder={t('settings.profile.residence')}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('settings.profile.province')}</label>
                <Input
                  value={profileData.residence_province || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, residence_province: e.target.value }))}
                  placeholder={t('settings.profile.province')}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700">{t('settings.profile.city')}</label>
                <Input
                  value={profileData.residence_city || profileData.current_city || ''}
                  onChange={(e) => setProfileData((prev: any) => ({ ...prev, residence_city: e.target.value, current_city: e.target.value }))}
                  placeholder={t('settings.profile.city')}
                  className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
                />
              </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">{t('settings.profile.bio')}</label>
            <Textarea
              value={profileData.bio || ''}
              onChange={(e) => setProfileData((prev: any) => ({ ...prev, bio: e.target.value }))}
              placeholder={t('settings.profile.bioPlaceholder')}
              rows={5}
              className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl resize-none p-4"
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
              onChange={(e) => setProfileData((prev: any) => ({ ...prev, user_goals: e.target.value }))}
              placeholder={t('onboarding.userGoalsDesc')}
              className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
            />
            <p className="text-xs text-gray-500">{t('onboarding.userGoalsDesc')}</p>
          </div>

          {/* Platform Intent */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">{t('onboarding.platformIntent')}</label>
            <Input
              value={profileData.platform_intent || ''}
              onChange={(e) => setProfileData((prev: any) => ({ ...prev, platform_intent: e.target.value }))}
              placeholder={t('onboarding.platformIntentDesc')}
              className="bg-gray-50/50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
            />
            <p className="text-xs text-gray-500">{t('onboarding.platformIntentDesc')}</p>
          </div>

          {/* Primary Interest */}
          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">{t('onboarding.primaryInterest')}</label>
            <select
              value={profileData.primary_interest || ''}
              onChange={(e) => setProfileData((prev: any) => ({ ...prev, primary_interest: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-50/50 border border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all rounded-xl h-12"
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
  );
}
