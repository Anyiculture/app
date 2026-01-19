import { useState, useEffect } from 'react';
import { useI18n } from '../../../contexts/I18nContext';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Modal } from '../../ui/Modal';
import { profileService } from '../../../services/profileService';
import { useToast } from '../../ui/Toast';

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: any;
}

export function EditUserModal({ isOpen, onClose, onSuccess, user }: EditUserModalProps) {
  const { t } = useI18n();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    role: '',
    current_city: '',
    bio: '',
    user_goals: '',
    platform_intent: ''
  });

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        role: user.role || '',
        current_city: user.current_city || user.city || user.location || '',
        bio: user.bio || '',
        user_goals: user.user_goals || '',
        platform_intent: user.platform_intent || ''
      });
    }
  }, [user, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // Use existing profileService to update
      await profileService.updateProfile(user.id, formData);
      showToast('success', t('admin.users.saveSuccess'));
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update user:', error);
      showToast('error', t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.users.editTitle')}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('settings.profile.displayName')}</label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('settings.profile.phone')}</label>
            <Input
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="space-y-2">
             <label className="text-sm font-medium text-gray-700">{t('admin.users.columns.role')}</label>
             <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             >
                <option value="">{t('common.select')}</option>
                <option value="user">User</option>
                <option value="employer">Employer</option>
                <option value="job_seeker">Job Seeker</option>
                <option value="host_family">Host Family</option>
                <option value="au_pair">Au Pair</option>
             </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">{t('settings.profile.city')}</label>
            <Input
              value={formData.current_city}
              onChange={(e) => setFormData({ ...formData, current_city: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">{t('settings.profile.bio')}</label>
          <Textarea
            value={formData.bio}
            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
            rows={4}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('onboarding.userGoals')}</label>
                <Input
                value={formData.user_goals}
                onChange={(e) => setFormData({ ...formData, user_goals: e.target.value })}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">{t('onboarding.platformIntent')}</label>
                <Input
                value={formData.platform_intent}
                onChange={(e) => setFormData({ ...formData, platform_intent: e.target.value })}
                />
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
          <Button type="button" variant="ghost" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" isLoading={loading}>
            {t('common.saveChanges')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
