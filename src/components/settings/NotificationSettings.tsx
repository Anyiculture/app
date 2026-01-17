import { useState, useEffect } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { notificationService, NotificationPreferences } from '../../services/notificationService';
import { Loader2, Bell, Mail } from 'lucide-react';
import { useToast } from '../ui/Toast';

export function NotificationSettings() {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const data = await notificationService.getPreferences();
      setPreferences(data);
    } catch (error) {
      console.error('Failed to load preferences:', error);
      showToast('error', t('settings.notifications.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!preferences) return;

    const newValue = !preferences[key];
    setPreferences({ ...preferences, [key]: newValue });

    try {
      await notificationService.updatePreferences({ [key]: newValue });
      showToast('success', t('settings.notifications.saved'));
    } catch (error) {
      console.error('Failed to update preference:', error);
      // Revert
      setPreferences({ ...preferences, [key]: !newValue });
      showToast('error', t('settings.notifications.saveError'));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!preferences) return null;

  const categories = [
    { id: 'messages', label: t('nav.messaging') },
    { id: 'applications', label: t('jobs.applications') },
    { id: 'events', label: t('nav.events') },
    { id: 'marketplace', label: t('nav.marketplace') },
    { id: 'visa_updates', label: t('nav.visa') },
    { id: 'au_pair_matches', label: t('nav.auPair') },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">{t('settings.notifications.title')}</h2>
          <p className="text-sm text-gray-500 mt-1">{t('settings.notifications.description')}</p>
        </div>

        <div className="divide-y divide-gray-100">
          {categories.map((category) => (
            <div key={category.id} className="p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-medium text-gray-900">{category.label}</h3>
              </div>
              
              <div className="flex items-center gap-6">
                {/* In-App Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${
                    preferences[`in_app_${category.id}` as keyof NotificationPreferences] 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences[`in_app_${category.id}` as keyof NotificationPreferences] 
                        ? 'translate-x-4' 
                        : 'translate-x-0'
                    }`} />
                  </div>
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Bell size={14} />
                    In-App
                  </span>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={!!preferences[`in_app_${category.id}` as keyof NotificationPreferences]}
                    onChange={() => handleToggle(`in_app_${category.id}` as keyof NotificationPreferences)}
                  />
                </label>

                {/* Email Toggle */}
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-10 h-6 rounded-full transition-colors relative ${
                    preferences[`email_${category.id}` as keyof NotificationPreferences] 
                      ? 'bg-blue-600' 
                      : 'bg-gray-200'
                  }`}>
                    <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      preferences[`email_${category.id}` as keyof NotificationPreferences] 
                        ? 'translate-x-4' 
                        : 'translate-x-0'
                    }`} />
                  </div>
                  <span className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Mail size={14} />
                    Email
                  </span>
                  <input 
                    type="checkbox" 
                    className="hidden"
                    checked={!!preferences[`email_${category.id}` as keyof NotificationPreferences]}
                    onChange={() => handleToggle(`email_${category.id}` as keyof NotificationPreferences)}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
