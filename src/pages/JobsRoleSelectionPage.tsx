import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Building } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { jobsRoleService } from '../services/jobsRoleService';

export function JobsRoleSelectionPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'employer' | null>(null);

  const handleContinue = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!selectedRole) return;

    try {
      // Save role to database first to prevent redirect loop
      await jobsRoleService.setUserRole(user.id, selectedRole);

      // Redirect to Jobs Dashboard instead of forcing onboarding immediately
      navigate('/jobs');
    } catch (error) {
      console.error('Failed to save role:', error);
      alert(t('jobsOnboarding.failedToSaveRole') || 'Failed to save role. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-4 sm:p-6">
        <div className="mb-4 sm:mb-6 text-center sm:text-left">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1">
            {t('jobsOnboarding.chooseYourRole')}
          </h2>
          <p className="text-[11px] sm:text-sm text-gray-600">
            {t('jobsOnboarding.roleSelectionDescription')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('job_seeker')}
            className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
              selectedRole === 'job_seeker'
                ? 'border-blue-600 bg-blue-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 ${
                selectedRole === 'job_seeker' ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <Briefcase className={`${selectedRole === 'job_seeker' ? 'text-blue-600' : 'text-gray-600'} sm:hidden`} size={18} />
                <Briefcase className={`${selectedRole === 'job_seeker' ? 'text-blue-600' : 'text-gray-600'} hidden sm:block`} size={24} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                {t('jobsOnboarding.jobSeeker')}
              </h3>
              <p className="text-[10px] sm:text-[12px] text-gray-600 leading-tight">
                {t('jobsOnboarding.jobSeekerDescription')}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('employer')}
            className={`p-3 sm:p-4 rounded-xl border-2 transition-all text-left ${
              selectedRole === 'employer'
                ? 'border-emerald-600 bg-emerald-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mb-2 sm:mb-3 ${
                selectedRole === 'employer' ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <Building className={`${selectedRole === 'employer' ? 'text-emerald-600' : 'text-gray-600'} sm:hidden`} size={18} />
                <Building className={`${selectedRole === 'employer' ? 'text-emerald-600' : 'text-gray-600'} hidden sm:block`} size={24} />
              </div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">
                {t('jobsOnboarding.employer')}
              </h3>
              <p className="text-[10px] sm:text-[12px] text-gray-600 leading-tight">
                {t('jobsOnboarding.employerDescription')}
              </p>
            </div>
          </button>
        </div>

        <div className="flex gap-2 sm:gap-4">
          <button
            onClick={() => navigate('/jobs')}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-300 rounded-xl hover:bg-gray-50 transition-all font-bold text-[11px] sm:text-sm uppercase tracking-widest"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleContinue}
            disabled={!selectedRole}
            className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-bold text-[10px] sm:text-[12px] uppercase tracking-widest shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('common.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}
