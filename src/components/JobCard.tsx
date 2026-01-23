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

  const cardGradient = React.useMemo(() => {
    const gradients = [
      'from-blue-500 via-blue-600 to-indigo-600',
      'from-purple-500 via-purple-600 to-fuchsia-600',
      'from-pink-500 via-pink-600 to-rose-600',
      'from-orange-500 via-orange-600 to-red-600',
      'from-emerald-500 via-emerald-600 to-teal-600',
      'from-indigo-500 via-indigo-600 to-violet-600',
      'from-cyan-500 via-cyan-600 to-blue-600'
    ];
    const seed = job.company_name || job.poster_id || 'C';
    const index = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  }, [job.company_name, job.poster_id]);

  const logoText = job.company_name ? job.company_name.substring(0, 1).toUpperCase() : (job.poster_id ? job.poster_id.substring(0, 1).toUpperCase() : 'C');
  const postedDate = job.published_at ? formatDistanceToNow(new Date(job.published_at), { addSuffix: true }) : t('common.recently');
  
  // Check for logo from joined data (Dashboard) or potentially job data
  const companyLogo = (job as any).company_logo || (job as any).employer_logo;

  return (
    <Link to={`/jobs/${job.id}`} className="block h-full group/link relative">
      {/* Gradient Border Container */}
      <div className={`h-full p-[2px] rounded-xl sm:rounded-2xl transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl bg-gradient-to-br ${cardGradient} group-hover/link:shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)]`}>
        
        {/* White Card Content */}
        <div className={`h-full w-full bg-white rounded-[10px] sm:rounded-[14px] flex ${isDashboard ? 'flex-col min-h-[160px]' : 'flex-row sm:flex-col p-3 sm:p-6'} relative overflow-hidden`}>
            
            {/* Subtle decorative background for white card */}
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${cardGradient} opacity-[0.03] rounded-bl-full pointer-events-none transition-opacity group-hover/link:opacity-[0.08]`} />

            {/* Header Section */}
            <div className={`flex ${isDashboard ? 'items-center pb-2 px-4 pt-4' : 'flex-shrink-0 mb-3'} relative z-10`}>
                <div className="flex-shrink-0 mr-3 sm:mr-0 sm:mb-3">
                    {companyLogo ? (
                        <img src={companyLogo} alt={job.company_name} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover shadow-sm border border-gray-100" />
                    ) : (
                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm font-black shadow-sm text-white bg-gradient-to-br ${cardGradient}`}>
                        {logoText}
                        </div>
                    )}
                </div>
                 {/* Mobile / Dashboard Company Name layout fix */}
                 {isDashboard && (
                     <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide truncate max-w-[120px]">{job.company_name || 'Company'}</span>
                 )}
            </div>

            <div className={`flex-grow min-w-0 flex flex-col ${isDashboard ? 'px-4 pb-4 pt-0' : 'justify-between'} relative z-10`}>
                {/* Title & Stats */}
                <div className="flex justify-between items-start w-full">
                <div className="min-w-0 w-full pr-2">
                    <TranslateWrapper 
                    text={job.title}
                    dbTranslation={null}
                    as="h3"
                    className={`${isDashboard ? 'text-xs mb-1' : 'text-sm sm:text-xl'} font-bold text-gray-900 leading-tight group-hover/link:text-transparent group-hover/link:bg-clip-text group-hover/link:bg-gradient-to-r group-hover/link:${cardGradient} transition-all duration-300`}
                    />
                    <div className={`flex items-center gap-1.5 text-gray-500 ${isDashboard ? 'text-[10px]' : 'text-[11px] sm:text-sm mt-1'}`}>
                        {!isDashboard && <span className="font-semibold text-gray-700 truncate max-w-[100px] sm:max-w-none">{job.company_name || 'Company'}</span>}
                        {!isDashboard && <span>•</span>}
                        <span className="truncate font-medium text-gray-400">{job.location_city || 'Remote'}</span>
                    </div>
                </div>
                
                {!isDashboard && (
                    <div className="flex flex-col items-end flex-shrink-0 pl-2">
                        <span className={`font-bold text-[11px] sm:text-base whitespace-nowrap px-2 py-1 rounded-lg bg-gray-50 text-gray-700 group-hover/link:text-white group-hover/link:bg-gradient-to-r group-hover/link:${cardGradient} transition-all duration-300`}>
                        {formatSalary()}
                        </span>
                        <span className="text-[10px] text-gray-400 mt-1.5 font-medium">{postedDate}</span>
                    </div>
                )}
                </div>

                {/* Dashboard Footer Info */}
                {isDashboard && (
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-100">
                    <span className={`font-bold text-[10px] text-gray-700`}>
                    {formatSalary()}
                    </span>
                    <span className="text-[9px] text-gray-400 capitalize">{postedDate}</span>
                </div>
                )}

                {/* Desktop Only Extra Info (Tags) */}
                {!isDashboard && (
                <div className="hidden sm:flex mt-4 items-center gap-2">
                    <span className="bg-gray-50 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 border border-gray-100 group-hover/link:border-gray-200 transition-colors cursor-default">
                        {t(`jobs.${job.job_type}`)}
                    </span>
                    <span className="bg-gray-50 px-2.5 py-1 rounded-lg text-xs font-medium text-gray-600 border border-gray-100 group-hover/link:border-gray-200 transition-colors cursor-default">
                        1-3 Years
                    </span>
                    
                    <div className="ml-auto flex items-center gap-1">
                         <button
                        onClick={handleShare}
                        className="p-2 rounded-full text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
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
                            className={`p-2 rounded-full transition-colors ${
                                isSaved 
                                ? 'text-pink-500 hover:text-pink-600 bg-pink-50' 
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Bookmark size={16} className={isSaved ? "fill-current" : ""} />
                        </button>
                    </div>
                </div>
                )}
            </div>
            
            {/* Mobile Actions Overlay */}
            {!isDashboard && (
            <div className="absolute top-2 right-2 sm:hidden flex flex-col gap-1 z-20">
                 <button
                   onClick={(e) => {
                     e.preventDefault();
                     e.stopPropagation();
                     onSave?.(job.id);
                   }}
                   className={`p-1.5 rounded-full shadow-sm border border-gray-100 ${
                     isSaved 
                       ? 'text-pink-500 bg-pink-50' 
                       : 'text-gray-400 bg-white hover:bg-gray-50'
                   }`}
                 >
                   <Bookmark size={14} className={isSaved ? "fill-current" : ""} />
                 </button>
            </div>
            )}
        </div>
      </div>
    </Link>
  );
}