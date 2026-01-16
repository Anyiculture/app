
import { Filter } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { translateJobType, translateRemoteType, translateExperienceLevel } from '../../utils/jobTranslations';

interface JobFiltersProps {
  filters: {
    job_type: string[];
    remote_type: string[];
    experience_level: string[];
  };
  onChange: (key: 'job_type' | 'remote_type' | 'experience_level' | 'clear', value: any) => void;
}

export function JobFilters({ filters, onChange }: JobFiltersProps) {
  const { t } = useI18n();

  const handleCheckboxChange = (category: 'job_type' | 'remote_type' | 'experience_level', value: string) => {
    const current = (filters as any)[category] || [];
    const updated = current.includes(value)
      ? current.filter((item: string) => item !== value)
      : [...current, value];
    onChange(category, updated);
  };

  const SectionHeader = ({ title }: { title: string }) => (
    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">{title}</h4>
  );

  return (
    <div className="space-y-8 pr-4">
      {/* Filters Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-100">
        <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
           <Filter size={20} className="text-vibrant-purple" />
           {t('common.filters')}
        </div>
        <button 
          onClick={() => onChange('clear', null)}
          className="text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors"
        >
          {t('common.clear')}
        </button>
      </div>

      {/* Job Type */}
      <div>
        <SectionHeader title={t('jobs.filterByType')} />
        <div className="space-y-2.5">
          {['full_time', 'part_time', 'contract', 'freelance', 'internship'].map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group select-none">
              <div className="relative flex items-center">
                <input
                  type="checkbox"
                  className="peer h-4.5 w-4.5 rounded-md border-2 border-gray-300 text-vibrant-purple focus:ring-vibrant-purple focus:ring-offset-0 transition-all cursor-pointer"
                  checked={filters.job_type.includes(type)}
                  onChange={() => handleCheckboxChange('job_type', type)}
                />
              </div>
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                {translateJobType(type, t)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Experience Level */}
      <div>
        <SectionHeader title={t('jobs.filterByExperience')} />
        <div className="space-y-2.5">
          {['entry', 'mid', 'senior', 'executive'].map((level) => (
            <label key={level} className="flex items-center gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                className="peer h-4.5 w-4.5 rounded-md border-2 border-gray-300 text-vibrant-purple focus:ring-vibrant-purple focus:ring-offset-0 transition-all cursor-pointer"
                checked={filters.experience_level.includes(level)}
                onChange={() => handleCheckboxChange('experience_level', level)}
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                 {translateExperienceLevel(level, t)}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Work Type (Remote) */}
      <div>
        <SectionHeader title={t('jobs.filterByRemote')} />
        <div className="space-y-2.5">
          {['remote', 'hybrid', 'on_site'].map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer group select-none">
              <input
                type="checkbox"
                className="peer h-4.5 w-4.5 rounded-md border-2 border-gray-300 text-vibrant-purple focus:ring-vibrant-purple focus:ring-offset-0 transition-all cursor-pointer"
                checked={filters.remote_type.includes(type)}
                onChange={() => handleCheckboxChange('remote_type', type)}
              />
              <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors font-medium">
                {translateRemoteType(type, t)}
              </span>
            </label>
          ))}
        </div>
      </div>


    </div>
  );
}
