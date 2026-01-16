import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../../components/ui/Button';
import { Briefcase, Edit2, LayoutDashboard } from 'lucide-react';

export function EmployerSettingsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Briefcase className="text-emerald-500" size={32} />
            {t('settings.roles.company')}
        </h2>
        <p className="text-gray-500 mt-2 text-md">{t('settings.roles.companyDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 mb-4">
                <Edit2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('settings.roles.editCompany')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('settings.employer.updateDesc')}</p>
            <Button  
                onClick={() => navigate('/employer/profile/edit')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
            >
                {t('common.edit')}
            </Button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <LayoutDashboard size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('settings.employer.dashboard')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('settings.employer.dashboardDesc')}</p>
            <Button 
                onClick={() => navigate('/employer/dashboard')}
                variant="outline"
                className="w-full"
            >
                {t('settings.employer.goToDashboard')}
            </Button>
        </div>
      </div>
    </div>
  );
}
