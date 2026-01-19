import { useState } from 'react';
import { Briefcase, Building, X } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';

interface JobsRoleSelectionProps {
  onRoleSelected: (role: 'job_seeker' | 'employer') => void;
  onClose?: () => void;
}

export function JobsRoleSelection({ onRoleSelected, onClose }: JobsRoleSelectionProps) {
  const { t } = useI18n();
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'employer' | null>(null);

  const handleContinue = () => {
    if (selectedRole) {
      onRoleSelected(selectedRole);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 relative">
        {onClose && (
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            aria-label={t('common.close') || 'Close'}
          >
            <X size={24} />
          </button>
        )}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.chooseYourRole')}</h2>
          <p className="text-gray-600">{t('jobsOnboarding.roleSelectionDescription')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            type="button"
            onClick={() => setSelectedRole('job_seeker')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedRole === 'job_seeker'
                ? 'border-blue-600 bg-blue-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                selectedRole === 'job_seeker' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Briefcase className={selectedRole === 'job_seeker' ? 'text-blue-600' : 'text-gray-600'} size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.jobSeeker')}</h3>
              <p className="text-sm text-gray-600">
                {t('jobsOnboarding.jobSeekerDesc')}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('employer')}
            className={`p-6 rounded-xl border-2 transition-all text-left ${
              selectedRole === 'employer'
                ? 'border-emerald-600 bg-emerald-50 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
                selectedRole === 'employer' ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <Building className={selectedRole === 'employer' ? 'text-emerald-600' : 'text-gray-600'} size={32} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.employer')}</h3>
              <p className="text-sm text-gray-600">
                {t('jobsOnboarding.employerDesc')}
              </p>
            </div>
          </button>
        </div>

        <div className="flex gap-4">
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
