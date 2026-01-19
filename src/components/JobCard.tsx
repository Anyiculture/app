import React from 'react';
import { Bookmark, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Job } from '../services/jobsService';
import { useI18n } from '../contexts/I18nContext';
import { formatDistanceToNow } from 'date-fns';
import { useToast } from './ui/Toast';
import { TranslateWrapper } from './ui/TranslateWrapper';
import { shareContent } from '../utils/shareUtils';

interface JobCardProps {
  job: Job;
  isSaved?: boolean;
  onSave?: (id: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  matchScore?: number;
  isDashboard?: boolean;
}

export function JobCard({ job, isSaved, onSave, matchScore: _matchScore, isDashboard }: JobCardProps) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = await shareContent(
      job.title,
      `${job.company_name || 'A company'} is hiring a ${job.title}`,
      `${window.location.origin}/jobs/${job.id}`
    );

    if (result === 'copied') {
      showToast('success', t('common.linkCopied'));
    }
  };

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return t('jobs.negotiable');
    const currency = job.salary_currency === 'CNY' ? '¥' : '$';
    const toK = (num?: number) => num ? `${(num / 1000).toFixed(1).replace('.0', '')}k` : '';
    if (job.salary_min && job.salary_max) return `${currency}${toK(job.salary_min)}-${toK(job.salary_max)}`;
    return `${currency}${toK(job.salary_min || job.salary_max)}`;
  };

  const logoColor = React.useMemo(() => {
    const colors = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-pink-50 text-pink-600', 'bg-orange-50 text-orange-600', 'bg-emerald-50 text-emerald-600', 'bg-indigo-50 text-indigo-600'];
    const seed = job.company_name || job.poster_id || 'C';
    const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    return colors[index];
  }, [job.company_name, job.poster_id]);

  const logoText = job.company_name ? job.company_name.substring(0, 1).toUpperCase() : (job.poster_id ? job.poster_id.substring(0, 1).toUpperCase() : 'C');
  const postedDate = job.published_at ? formatDistanceToNow(new Date(job.published_at), { addSuffix: true }) : t('common.recently');
  
  // Check for logo from joined data (Dashboard) or potentially job data
  const companyLogo = (job as any).company_logo || (job as any).employer_logo;

  return (
    <Link to={`/jobs/${job.id}`} className="block h-full group/link">
      <div className={`h-full bg-white border border-gray-200 hover:border-vibrant-purple/30 transition-all duration-200 rounded-xl sm:rounded-2xl shadow-sm hover:shadow-md flex ${isDashboard ? 'flex-col min-h-[160px]' : 'flex-row sm:flex-col gap-2 sm:gap-0 p-3 sm:p-6'} relative overflow-hidden`}>
        
        {/* Dashboard Media Card Style - Top Section */}
        {isDashboard ? (
          <div className={`p-4 pb-2`}>
            {/* Minimal Dashboard Header */}
            <div className="flex items-center gap-2 mb-2">
              <div className="flex-shrink-0">
                  {companyLogo ? (
                    <img src={companyLogo} alt={job.company_name} className="w-8 h-8 rounded-lg object-cover shadow-sm border border-gray-100" />
                  ) : (
                    <div className={`w-8 h-8 ${logoColor} rounded-lg flex items-center justify-center text-xs font-black shadow-sm`}>
                      {logoText}
                    </div>
                  )}
              </div>
               <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[120px]">{job.company_name || 'Company'}</span>
            </div>
          </div>
        ) : (
          <div className="flex-shrink-0">
               {companyLogo ? (
                 <img src={companyLogo} alt={job.company_name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl object-cover shadow-sm border border-gray-100" />
               ) : (
                 <div className={`w-10 h-10 sm:w-12 sm:h-12 ${logoColor} rounded-lg sm:rounded-xl flex items-center justify-center text-[10px] sm:text-xs font-black shadow-sm`}>
                   {logoText}
                 </div>
               )}
          </div>
        )}

        <div className={`flex-grow min-w-0 flex flex-col ${isDashboard ? 'px-4 pb-4 pt-0' : 'justify-center'}`}>
            {/* Title & Stats */}
            <div className="flex justify-between items-start">
               <div className="min-w-0 w-full">
                 <TranslateWrapper 
                   text={job.title}
                   dbTranslation={null}
                   as="h3"
                   className={`${isDashboard ? 'text-xs mb-1' : 'text-[13px] sm:text-xl'} font-bold text-gray-900 leading-tight group-hover/link:text-vibrant-purple transition-colors`}
                 />
                 <div className={`flex items-center gap-1 text-gray-500 ${isDashboard ? 'text-[10px]' : 'text-[11px] sm:text-sm mt-0.5'}`}>
                    <span className="font-medium text-gray-700 truncate max-w-[80px] sm:max-w-none">{job.company_name || 'Company'}</span>
                    {!isDashboard && <span className="text-gray-300">•</span>}
                    {!isDashboard && <span className="truncate">{job.location_city || 'Remote'}</span>}
                 </div>
               </div>
               
               {!isDashboard && (
                 <div className="flex flex-col items-end flex-shrink-0">
                    <span className="font-bold text-emerald-600 text-[11px] sm:text-lg whitespace-nowrap bg-emerald-50 px-1.5 py-0.5 rounded text-right">
                      {formatSalary()}
                    </span>
                    <span className="text-[9px] text-gray-400 mt-1 sm:mt-2 sm:text-xs">{postedDate}</span>
                 </div>
               )}
            </div>

            {/* Dashboard Footer Info */}
            {isDashboard && (
              <div className="flex items-center justify-between mt-auto pt-2">
                <span className="font-bold text-emerald-600 text-[10px]">
                  {formatSalary()}
                </span>
                <span className="text-[9px] text-gray-400 capitalize">{job.location_city || 'Remote'}</span>
              </div>
            )}

            {/* Desktop Only Extra Info */}
            {!isDashboard && (
              <div className="hidden sm:flex mt-4 items-center gap-2 text-sm text-gray-500">
                <span className="bg-gray-50 px-2 py-1 rounded-lg text-xs">{t(`jobs.${job.job_type}`)}</span>
                <span className="bg-gray-50 px-2 py-1 rounded-lg text-xs">1-3 Years</span>
              </div>
            )}
        </div>
        
        {/* Actions */}
        {!isDashboard && (
          <div className="absolute bottom-2 right-2 sm:static sm:mt-auto sm:ml-auto flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-1.5 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
              title={t('common.share')}
            >
              <Share2 size={16} />
            </button>
            <button
               onClick={(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 onSave?.(job.id);
               }}
               className={`p-1.5 rounded-full transition-colors ${
                 isSaved 
                   ? 'text-vibrant-pink hover:bg-pink-50' 
                   : 'text-gray-300 hover:text-gray-600 hover:bg-gray-50'
               }`}
            >
               <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
            </button>
          </div>
        )}

      </div>
    </Link>
  );
}