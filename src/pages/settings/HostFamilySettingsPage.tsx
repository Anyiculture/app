import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../../components/ui/Button';
import { Home, Edit2, Eye } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function HostFamilySettingsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Home className="text-orange-500" size={32} />
            {t('settings.roles.hostFamily')}
        </h2>
        <p className="text-gray-500 mt-2 text-md">{t('settings.roles.hostFamilyDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600 mb-4">
                <Edit2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('settings.roles.editFamily')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('settings.hostFamily.updateDesc')}</p>
            <Button  
                onClick={() => navigate('/au-pair/edit-family-profile')}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
                {t('common.edit')}
            </Button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <Eye size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('common.view')} {t('common.profile')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('settings.hostFamily.viewDesc')}</p>
            <Button 
                onClick={() => navigate(`/host-family/profile/${user?.id}`)}
                variant="outline"
                className="w-full"
            >
                {t('common.view')}
            </Button>
        </div>
      </div>
    </div>
  );
}
