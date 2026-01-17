import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { profileService } from '../../services/profileService';
import { Button } from '../../components/ui/Button';
import { Save, Star } from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

export function InterestsSettingsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<any>({
    interested_modules: [],
    primary_interest: '',
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
          interested_modules: profile.interested_modules || [],
          primary_interest: profile.primary_interest || '',
        });
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleUpdate = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      await profileService.updateProfile(user.id, profileData);
      showToast('success', t('settings.updateSuccess'));
    } catch (error) {
      console.error('Error updating preferences:', error);
      showToast('error', t('settings.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const handleModuleToggle = (moduleId: string) => {
    setProfileData((prev: any) => {
      const modules = prev.interested_modules.includes(moduleId)
        ? prev.interested_modules.filter((m: string) => m !== moduleId)
        : [...prev.interested_modules, moduleId];
      return { ...prev, interested_modules: modules };
    });
  };

  return (
    <div className="max-w-3xl space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between border-b border-gray-100 pb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{t('settings.profile.interests')}</h2>
          <p className="text-gray-500 mt-2 text-md">{t('settings.profile.interestsDesc')}</p>
        </div>
        <Button 
          onClick={handleUpdate} 
          disabled={loading} 
          className="shadow-xl shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:scale-105 transition-transform px-6 py-2.5 h-auto rounded-xl"
        >
          <Save size={18} className="mr-2" />
          {loading ? t('common.saving') : t('common.saveChanges')}
        </Button>
      </div>

      <div className="space-y-8">
        <div className="space-y-6">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Star size={16} className="text-blue-500" />
            {t('settings.profile.primaryFocus')}
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {availableModules.map((module) => (
              <button
                key={module.id}
                onClick={() => setProfileData((prev: any) => ({ ...prev, primary_interest: module.id }))}
                className={`p-5 rounded-2xl border-2 transition-all text-left relative overflow-hidden group ${
                  profileData.primary_interest === module.id
                    ? 'border-blue-500 bg-blue-50/30 ring-4 ring-blue-500/10'
                    : 'border-gray-100 hover:border-blue-200 hover:shadow-xl bg-white'
                }`}
              >
                <div className="text-3xl mb-3 transform group-hover:scale-110 transition-transform duration-300">{module.icon}</div>
                <div className={`font-bold text-base ${profileData.primary_interest === module.id ? 'text-blue-700' : 'text-gray-700'}`}>
                  {module.name}
                </div>
                {profileData.primary_interest === module.id && (
                  <div className="absolute top-4 right-4 w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50"></div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6 pt-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
            <Star size={16} className="text-gray-400" />
            {t('settings.profile.otherInterests')}
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {availableModules.map((module) => (
              <label
                key={module.id}
                className={`flex items-center gap-4 p-5 rounded-2xl border cursor-pointer transition-all group ${
                  profileData.interested_modules.includes(module.id)
                    ? 'border-blue-200 bg-blue-50/20 shadow-sm'
                    : 'border-gray-100 hover:border-blue-100 hover:shadow-md bg-white'
                }`}
              >
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={profileData.interested_modules.includes(module.id)}
                    onChange={() => handleModuleToggle(module.id)}
                    className="w-6 h-6 rounded-lg border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 transition-all cursor-pointer"
                  />
                </div>
                <span className="text-2xl group-hover:scale-110 transition-transform duration-300">{module.icon}</span>
                <span className={`font-semibold text-lg ${profileData.interested_modules.includes(module.id) ? 'text-blue-900' : 'text-gray-700'}`}>
                  {module.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-gray-100">
        <Button 
          onClick={handleUpdate} 
          disabled={loading} 
          className="w-full md:w-auto shadow-xl shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 hover:scale-105 transition-transform px-10 py-3 h-auto rounded-xl font-bold"
        >
          <Save size={20} className="mr-2" />
          {loading ? t('common.saving') : t('common.savePreferences')}
        </Button>
      </div>
    </div>
  );
}
