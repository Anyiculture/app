import { ReactNode, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Search, ChevronDown, Filter, X } from 'lucide-react';
import { CHINA_LOCATIONS } from '../../constants/chinaLocations';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface EventsFiltersBarProps {
  filters: {
    category: string;
    city: string;
    date_range: string;
    search: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  rightActions?: ReactNode;
  resultsCount?: number;
}

export function EventsFiltersBar({
  filters,
  onFilterChange,
  onReset,
  rightActions,
  resultsCount
}: EventsFiltersBarProps) {
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
    filters.category !== 'all' ||
    filters.city !== 'all' ||
    filters.date_range !== 'all' ||
    filters.search !== '';

  return (
    <div className="space-y-6 mb-2 md:mb-6">
      {/* Mobile Icon Toolbar */}
      <div className="md:hidden flex items-center justify-between pb-2 bg-white/80 backdrop-blur-xl sticky top-0 z-40 -mx-4 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
              {resultsCount !== undefined ? `${resultsCount} ${t('common.results')}` : t('nav.events')}
            </span>
             {(filters.category !== 'all' || filters.city !== 'all') && (
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
                placeholder={t('events.filters.searchPlaceholder')}
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
              placeholder={t('events.filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="w-full pl-3 pr-4 py-3.5 bg-transparent border-none rounded-2xl focus:ring-0 text-[11px] font-black uppercase tracking-widest placeholder:text-gray-400"
            />
          </div>
        </div>

        {/* Filters Grid */}
        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
           
           {/* Category Filter */}
           <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <select
                  value={filters.category}
                  onChange={(e) => onFilterChange('category', e.target.value)}
                  className={`w-full appearance-none cursor-pointer pl-4 pr-10 py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all outline-none backdrop-blur-md
                    ${filters.category !== 'all'
                      ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                      : 'bg-white/60 border-white/60 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                    }`}
                >
                  <option value="all">{t('events.filters.allCategories')}</option>
                  <option value="cultural">{t('events.filters.cultural')}</option>
                  <option value="professional">{t('events.filters.professional')}</option>
                  <option value="social">{t('events.filters.social')}</option>
                  <option value="family">{t('events.filters.family')}</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-vibrant-purple transition-colors" />
              </div>
           </div>

           {/* Date Range Filter */}
           <div className="relative group">
             <div className="relative">
                <select
                   value={filters.date_range}
                   onChange={(e) => onFilterChange('date_range', e.target.value)}
                   className={`w-full appearance-none cursor-pointer pl-4 pr-10 py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all outline-none backdrop-blur-md
                    ${filters.date_range !== 'all'
                      ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                      : 'bg-white/60 border-white/60 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                    }`}
                >
                   <option value="all">{t('events.filters.anyTime')}</option>
                   <option value="today">{t('events.filters.today')}</option>
                   <option value="week">{t('events.filters.thisWeek')}</option>
                   <option value="month">{t('events.filters.thisMonth')}</option>
                   <option value="weekend">{t('events.filters.weekend')}</option>
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-vibrant-purple transition-colors" />
             </div>
           </div>

           {/* Location Filter */}
           <div className="relative group">
              <div className="relative">
                <select
                  value={filters.city}
                  onChange={(e) => onFilterChange('city', e.target.value)}
                  className={`w-full appearance-none cursor-pointer pl-4 pr-10 py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all outline-none backdrop-blur-md
                    ${filters.city !== 'all'
                      ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                      : 'bg-white/60 border-white/60 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                    }`}
                >
                  <option value="all">{t('events.filters.allLocations')}</option>
                  {allCities.map((city) => (
                    <option key={`${city.province}-${city.name_en}`} value={city.name_en}>
                      {city.name_en}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-vibrant-purple transition-colors" />
              </div>
           </div>

        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <motion.button 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={onReset}
            className="hidden xl:flex items-center gap-2 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-vibrant-pink hover:bg-vibrant-pink/10 rounded-xl transition-all flex-shrink-0"
          >
            <X size={14} />
            {t('common.clearFilters')}
          </motion.button>
        )}

        {/* Right Actions */}
        {rightActions && (
          <div className="flex items-center gap-3 xl:ml-auto flex-shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
}
