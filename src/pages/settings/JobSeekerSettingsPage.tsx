import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../contexts/I18nContext';
import { Button } from '../../components/ui/Button';
import { Briefcase, User, FileText } from 'lucide-react';

export function JobSeekerSettingsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <div className="max-w-3xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b border-gray-100 pb-8">
        <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
            <Briefcase className="text-blue-500" size={32} />
            {t('settings.roles.jobSeeker')}
        </h2>
        <p className="text-gray-500 mt-2 text-md">{t('settings.roles.jobSeekerDesc')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4">
                <User size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('settings.roles.editProfile')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('settings.jobSeeker.updateDesc')}</p>
            <Button  
                onClick={() => navigate('/jobs/edit-profile')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
                {t('common.edit')}
            </Button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                <FileText size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">{t('nav.myApplications')}</h3>
            <p className="text-gray-500 text-sm mb-6">{t('settings.jobSeeker.applicationsDesc')}</p>
            <Button  
                onClick={() => navigate('/jobs/applications')}
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
