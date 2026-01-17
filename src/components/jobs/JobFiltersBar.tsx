import { ReactNode, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Search, ChevronDown, X, Filter } from 'lucide-react';
import { CHINA_LOCATIONS } from '../../constants/chinaLocations';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface JobFiltersBarProps {
  filters: {
    job_type: string[];
    remote_type: string[];
    experience_level: string[];
    city: string;
    search: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  rightActions?: ReactNode;
  resultsCount?: number;
}

export function JobFiltersBar({
  filters,
  onFilterChange,
  onReset,
  rightActions,
  resultsCount
}: JobFiltersBarProps) {
  const { t } = useI18n();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const allCities = CHINA_LOCATIONS.flatMap(province => 
    province.cities.map(city => ({
      ...city,
      province: province.name_en
    }))
  ).sort((a, b) => a.name_en.localeCompare(b.name_en));

  const hasActiveFilters = 
    filters.job_type.length > 0 || 
    filters.remote_type.length > 0 || 
    filters.experience_level.length > 0 ||
    filters.city !== 'all' ||
    filters.search !== '';

  return (
    <div className="space-y-4 mb-6">
      {/* Mobile Icon Toolbar */}
      <div className="md:hidden flex items-center justify-between pb-2 bg-white/80 backdrop-blur-xl sticky top-0 z-40 -mx-4 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
              {resultsCount !== undefined ? `${resultsCount} ${t('common.results')}` : t('nav.jobs')}
            </span>
             {(filters.job_type.length > 0 || filters.city !== 'all') && (
               <div className="w-1.5 h-1.5 rounded-full bg-vibrant-purple animate-pulse" />
            )}
        </div>
        <div className="flex items-center justify-end gap-2">
            <Button
                variant={showMobileSearch ? 'primary' : 'outline'}
                className="w-8 h-8 rounded-full !p-0 flex items-center justify-center transition-all bg-white/40 backdrop-blur-md border-white/60"
                onClick={() => {
                setShowMobileSearch(!showMobileSearch);
                if (!showMobileSearch) setShowMobileFilters(false);
                }}
            >
                <Search size={14} className={showMobileSearch ? 'text-white' : 'text-vibrant-purple'} />
            </Button>
            <Button
                variant={showMobileFilters ? 'primary' : 'outline'}
                className="w-8 h-8 rounded-full !p-0 flex items-center justify-center transition-all bg-white/40 backdrop-blur-md border-white/60"
                onClick={() => {
                setShowMobileFilters(!showMobileFilters);
                if (!showMobileFilters) setShowMobileSearch(false);
                }}
            >
                <Filter size={14} className={showMobileFilters ? 'text-white' : 'text-vibrant-purple'} />
            </Button>
        </div>
      </div>

       {/* Mobile Search Input */}
       <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden"
          >
            <div className="relative w-full mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-purple" size={18} />
              <input
                type="text"
                placeholder={t('jobs.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/60 border-2 border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-vibrant-purple/20 text-sm font-bold placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </motion.div>
        )}
       </AnimatePresence>

      {/* Top Row: Search & Filters */}
      <div className={`flex flex-col lg:flex-row gap-4 items-center ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Search Bar (Desktop) */}
        <div className="relative w-full lg:w-80 xl:w-96 group hidden md:block">
          <div className="absolute inset-0 bg-vibrant-purple/5 blur-xl group-hover:bg-vibrant-purple/10 transition-colors rounded-2xl" />
          <div className="relative">
             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-purple transition-transform group-focus-within:scale-110" size={18} />
             <input
               type="text"
               placeholder={t('jobs.searchPlaceholder')}
               value={filters.search}
               onChange={(e) => onFilterChange('search', e.target.value)}
               className="w-full pl-12 pr-4 py-3 bg-white/40 border-2 border-gray-100 rounded-2xl focus:outline-none focus:ring-4 focus:ring-vibrant-purple/5 focus:border-vibrant-purple/30 transition-all shadow-sm backdrop-blur-md font-bold uppercase tracking-widest text-[10px] placeholder:text-gray-400"
             />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 w-full">
           
           {/* Job Type Filter */}
           <div className="relative group">
              <div className="relative">
                <select
                  value={filters.job_type[0] || ''}
                  onChange={(e) => onFilterChange('job_type', e.target.value ? [e.target.value] : [])}
                  className="w-full appearance-none cursor-pointer pl-4 pr-10 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all outline-none bg-white/60 backdrop-blur-xl border-gray-100 text-gray-600 hover:border-vibrant-purple/30 hover:shadow-lg hover:shadow-vibrant-purple/5 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10"
                >
                  <option value="">{t('jobs.allJobTypes') || 'Job Type'}</option>
                  <option value="full_time">{t('jobs.fullTime')}</option>
                  <option value="part_time">{t('jobs.partTime')}</option>
                  <option value="contract">{t('jobs.contract')}</option>
                  <option value="freelance">{t('jobs.freelance')}</option>
                  <option value="internship">{t('jobs.internship')}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-vibrant-purple transition-colors">
                  <ChevronDown size={12} strokeWidth={3} />
                </div>
              </div>
           </div>

           {/* Remote Type Filter */}
           <div className="relative group">
             <div className="relative">
                <select
                   value={filters.remote_type[0] || ''}
                   onChange={(e) => onFilterChange('remote_type', e.target.value ? [e.target.value] : [])}
                   className="w-full appearance-none cursor-pointer pl-4 pr-10 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all outline-none bg-white/60 backdrop-blur-xl border-gray-100 text-gray-600 hover:border-vibrant-purple/30 hover:shadow-lg hover:shadow-vibrant-purple/5 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10"
                >
                   <option value="">{t('jobs.allRemoteTypes') || 'Remote'}</option>
                   <option value="on_site">{t('jobs.onSite')}</option>
                   <option value="remote">{t('jobs.remote')}</option>
                   <option value="hybrid">{t('jobs.hybrid')}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-vibrant-purple transition-colors">
                  <ChevronDown size={12} strokeWidth={3} />
                </div>
             </div>
           </div>

           {/* Experience Level */}
           <div className="relative group">
              <div className="relative">
                <select
                   value={filters.experience_level[0] || ''}
                   onChange={(e) => onFilterChange('experience_level', e.target.value ? [e.target.value] : [])}
                   className="w-full appearance-none cursor-pointer pl-4 pr-10 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all outline-none bg-white/60 backdrop-blur-xl border-gray-100 text-gray-600 hover:border-vibrant-purple/30 hover:shadow-lg hover:shadow-vibrant-purple/5 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10"
                >
                   <option value="">{t('jobs.allExperience') || 'Experience'}</option>
                   <option value="entry">{t('jobs.entry')}</option>
                   <option value="mid">{t('jobs.mid')}</option>
                   <option value="senior">{t('jobs.senior')}</option>
                   <option value="executive">{t('jobs.executive')}</option>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-vibrant-purple transition-colors">
                  <ChevronDown size={12} strokeWidth={3} />
                </div>
              </div>
           </div>

           {/* Location Filter */}
           <div className="relative group">
              <div className="relative">
                <select
                  value={filters.city}
                  onChange={(e) => onFilterChange('city', e.target.value)}
                  className="w-full appearance-none cursor-pointer pl-4 pr-10 py-3 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all outline-none bg-white/60 backdrop-blur-xl border-gray-100 text-gray-600 hover:border-vibrant-purple/30 hover:shadow-lg hover:shadow-vibrant-purple/5 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10"
                >
                   <option value="all">{t('common.everywhere') || 'Everywhere'}</option>
                   {allCities.map((city) => (
                    <option key={`${city.province}-${city.name_en}`} value={city.name_en}>
                      {city.name_en}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none p-1.5 rounded-lg bg-gray-50 text-gray-400 group-hover:text-vibrant-purple transition-colors">
                  <ChevronDown size={12} strokeWidth={3} />
                </div>
              </div>
           </div>

        </div>

        <div className="hidden lg:flex gap-3">
          <Button
            onClick={onReset}
            variant="ghost" 
            disabled={!hasActiveFilters}
            className={`px-4 py-3 rounded-2xl font-bold uppercase tracking-widest text-[10px] transition-all
              ${hasActiveFilters 
                ? 'text-vibrant-pink hover:bg-vibrant-pink/5 hover:text-vibrant-pink' 
                : 'text-gray-300 hover:text-gray-400'}`}
          >
             <X size={14} className="mr-2" />
             {t('common.clear')}
          </Button>

          {rightActions}
        </div>
      </div>
    </div>
  );
}
