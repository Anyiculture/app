import { ReactNode, useState } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { Search, ChevronDown, Filter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../ui/Button';

interface CommunityFiltersBarProps {
  filters: {
    category: string;
    sort: string;
    search: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  rightActions?: ReactNode;
  resultsCount?: number;
}

export function CommunityFiltersBar({
  filters,
  onFilterChange,
  onReset,
  rightActions,
  resultsCount
}: CommunityFiltersBarProps) {
  const { t } = useI18n();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const hasActiveFilters = 
    filters.category !== 'all' ||
    filters.sort !== 'newest' ||
    filters.search !== '';

  return (
    <div className="space-y-4 mb-2 md:mb-6">
      {/* Mobile Icon Toolbar */}
      <div className="md:hidden flex items-center justify-between pb-2 bg-white/80 backdrop-blur-xl sticky top-0 z-40 -mx-4 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
              {resultsCount !== undefined ? `${resultsCount} ${t('common.results')}` : t('nav.community')}
            </span>
             {(filters.category !== 'all' || filters.sort !== 'newest') && (
               <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
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
                <Search size={14} className={showMobileSearch ? 'text-white' : 'text-cyan-600'} />
            </Button>
            <Button
                variant={showMobileFilters ? 'primary' : 'outline'}
                className="w-8 h-8 rounded-full !p-0 flex items-center justify-center transition-all bg-white/40 backdrop-blur-md border-white/60"
                onClick={() => {
                setShowMobileFilters(!showMobileFilters);
                if (!showMobileFilters) setShowMobileSearch(false);
                }}
            >
                <Filter size={14} className={showMobileFilters ? 'text-white' : 'text-cyan-600'} />
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
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-600" size={18} />
              <input
                type="text"
                placeholder={t('community.filters.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => onFilterChange('search', e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-cyan-500/20 text-sm font-bold placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </motion.div>
        )}
       </AnimatePresence>

      {/* Top Row: Search & Filters */}
      <div className={`flex flex-col lg:flex-row gap-4 items-center ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Search Bar (Desktop) */}
        <div className="hidden md:block relative w-full md:w-80 lg:w-96 flex-shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={t('community.filters.searchPlaceholder')}
            value={filters.search}
            onChange={(e) => onFilterChange('search', e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm"
          />
        </div>

        {/* Horizontal Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 w-full lg:w-auto no-scrollbar scroll-smooth">
          
          {/* Category Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-4 pr-9 py-2.5 rounded-full border text-sm font-medium transition-all outline-none truncate
                ${filters.category !== 'all'
                  ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 shadow-sm'
                }`}
            >
              <option value="all">{t('community.filters.allTopics')}</option>
              <option value="living">{t('community.filters.categories.living')}</option>
              <option value="language">{t('community.filters.categories.language')}</option>
              <option value="finance">{t('community.filters.categories.finance')}</option>
              <option value="technology">{t('community.filters.categories.technology')}</option>
              <option value="travel">{t('community.filters.categories.travel')}</option>
              <option value="networking">{t('community.filters.categories.networking')}</option>
              <option value="culture">{t('community.filters.categories.culture')}</option>
              <option value="other">{t('community.filters.categories.other')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>

          {/* Sort Filter */}
          <div className="relative min-w-[140px]">
            <select
              value={filters.sort}
              onChange={(e) => onFilterChange('sort', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-4 pr-9 py-2.5 rounded-full border text-sm font-medium transition-all outline-none truncate
                ${filters.sort !== 'newest'
                  ? 'bg-cyan-50 border-cyan-200 text-cyan-700' 
                  : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 shadow-sm'
                }`}
            >
              <option value="newest">{t('community.filters.sort.newest')}</option>
              <option value="popular">{t('community.filters.sort.popular')}</option>
              <option value="trending">{t('community.filters.sort.trending')}</option>
              <option value="most_replies">{t('community.filters.sort.mostReplies')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500" />
          </div>

          {/* Clear Filters Button (Desktop) */}
          {hasActiveFilters && (
            <button 
              onClick={onReset}
              className="hidden lg:block text-sm text-gray-500 hover:text-red-500 font-medium px-2 transition-colors whitespace-nowrap"
            >
              {t('community.filters.clear')}
            </button>
          )}

          {/* Clear Filters Icon (Mobile) */}
          {hasActiveFilters && (
            <button 
                onClick={onReset}
                className="lg:hidden w-8 h-8 rounded-full bg-red-50 text-red-500 flex items-center justify-center shrink-0 ml-1"
            >
                <X size={14} />
            </button>
          )}

        </div>

        {/* Right Actions */}
        {rightActions && (
          <div className="flex items-center gap-3 ml-auto flex-shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
}
