import { ReactNode, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Search, ChevronDown, Filter } from 'lucide-react';
import { CHINA_LOCATIONS } from '../../constants/chinaLocations';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface EducationFiltersBarProps {
  filters: {
    program_type: string;
    level: string;
    city: string;
    search: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  rightActions?: ReactNode;
  resultsCount?: number;
}

export function EducationFiltersBar({
  filters,
  onFilterChange,
  onReset,
  rightActions,
  resultsCount
}: EducationFiltersBarProps) {
  const { t, language } = useI18n();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const allCities = CHINA_LOCATIONS.flatMap(province => 
    province.cities.map(city => ({
      ...city,
      province: province.name_en
    }))
  ).sort((a, b) => a.name_en.localeCompare(b.name_en));

  const hasActiveFilters = 
    filters.program_type !== 'all' ||
    filters.level !== 'all' ||
    filters.city !== 'all' ||
    filters.search !== '';

  return (
    <div className="space-y-6 mb-2 md:mb-12">
      {/* Mobile Icon Toolbar */}
      <div className="md:hidden flex items-center justify-between pb-2 bg-white/80 backdrop-blur-xl sticky top-0 z-40 -mx-4 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
              {resultsCount !== undefined ? `${resultsCount} ${t('common.results')}` : t('nav.education')}
            </span>
             {(filters.program_type !== 'all' || filters.level !== 'all' || filters.city !== 'all') && (
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
                placeholder={t('education.browse.searchPlaceholder')}
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
      <div className={`flex flex-col xl:flex-row gap-6 items-center ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Search Bar (Desktop) */}
        <div className="hidden md:block relative w-full md:w-[400px] flex-shrink-0 group">
          <div className="absolute inset-0 bg-vibrant-purple/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
          <div className="relative flex items-center bg-white/40 backdrop-blur-md border border-gray-200 rounded-2xl transition-all duration-300 focus-within:bg-white/60 focus-within:border-vibrant-purple/40 focus-within:shadow-xl focus-within:shadow-vibrant-purple/10">
            <Search className="ml-4 text-gray-400 group-focus-within:text-vibrant-purple transition-colors" size={20} />
            <input
              type="text"
              placeholder={t('education.browse.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full bg-transparent border-none focus:ring-0 py-4 px-3 text-sm font-bold uppercase tracking-widest placeholder:text-gray-400 placeholder:font-bold"
            />
          </div>
        </div>

        {/* Horizontal Filters */}
        <div className="flex flex-wrap items-center gap-4 w-full">
          
          {/* Program Type Filter */}
          <div className="relative flex-1 min-w-[160px]">
            <select
              value={filters.program_type}
              onChange={(e) => onFilterChange('program_type', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-4 pr-10 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all outline-none 
                ${filters.program_type !== 'all'
                  ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg' 
                  : 'bg-white/40 border-white/60 text-gray-700 hover:bg-white/60'
                }`}
            >
              <option value="all" className="bg-white">{t('education.browse.programTypes.all')}</option>
              <option value="language" className="bg-white">{t('education.browse.programTypes.language')}</option>
              <option value="degree" className="bg-white">{t('education.browse.programTypes.degree')}</option>
              <option value="certificate" className="bg-white">{t('education.browse.programTypes.certificate')}</option>
              <option value="workshop" className="bg-white">{t('education.browse.programTypes.workshop')}</option>
              <option value="online" className="bg-white">{t('education.browse.programTypes.online')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          {/* Level Filter */}
          <div className="relative flex-1 min-w-[160px]">
            <select
              value={filters.level}
              onChange={(e) => onFilterChange('level', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-4 pr-10 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all outline-none 
                ${filters.level !== 'all'
                  ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg' 
                  : 'bg-white/40 border-white/60 text-gray-700 hover:bg-white/60'
                }`}
            >
              <option value="all" className="bg-white">{t('education.browse.levels.all')}</option>
              <option value="beginner" className="bg-white">{t('education.browse.levels.beginner')}</option>
              <option value="intermediate" className="bg-white">{t('education.browse.levels.intermediate')}</option>
              <option value="advanced" className="bg-white">{t('education.browse.levels.advanced')}</option>
              <option value="undergraduate" className="bg-white">{t('education.browse.levels.undergraduate')}</option>
              <option value="graduate" className="bg-white">{t('education.browse.levels.graduate')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          {/* Location Filter */}
          <div className="relative flex-1 min-w-[160px]">
            <select
              value={filters.city}
              onChange={(e) => onFilterChange('city', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-4 pr-10 py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest backdrop-blur-md transition-all outline-none 
                ${filters.city !== 'all'
                  ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg' 
                  : 'bg-white/40 border-gray-200 text-gray-700 hover:bg-white/60'
                }`}
            >
              <option value="all" className="bg-white">{t('education.browse.allLocations')}</option>
              {allCities.map(city => (
                <option key={`${city.province}-${city.name_en}`} value={city.name_en} className="bg-white">
                  {language === 'zh' ? city.name_zh : city.name_en}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onReset}
              className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-vibrant-pink hover:text-white hover:bg-vibrant-pink rounded-2xl transition-all shadow-sm flex items-center gap-2 group border border-transparent hover:border-vibrant-pink/20"
            >
              <Filter size={14} className="group-hover:rotate-180 transition-transform duration-500" />
              {t('education.browse.clearFilters')}
            </motion.button>
          )}

        </div>

        {/* Right Actions */}
        {rightActions && (
          <div className="flex items-center gap-4 ml-auto flex-shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
}
