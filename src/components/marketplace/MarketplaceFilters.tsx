import { useState, useEffect, ReactNode } from 'react';
import { useI18n } from '../../contexts/I18nContext';
import { MARKETPLACE_CATEGORIES, getSubcategories, Subcategory } from '../../constants/marketplaceCategories';
import { CHINA_LOCATIONS } from '../../constants/chinaLocations';
import { Search, ChevronDown, Sparkles, X, Filter } from 'lucide-react';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';
import { motion, AnimatePresence } from 'framer-motion';

interface MarketplaceFiltersProps {
  filters: {
    category: string;
    subcategory: string;
    city: string;
    minPrice: string;
    maxPrice: string;
    condition: string;
    distance: string;
    search: string;
  };
  onFilterChange: (key: string, value: any) => void;
  onReset: () => void;
  userLocation: { lat: number; lng: number } | null;
  onUpdateLocation: () => void;
  rightActions?: ReactNode;
}

export function MarketplaceFilters({
  filters,
  onFilterChange,
  onReset,
  userLocation: _userLocation,
  onUpdateLocation: _onUpdateLocation,
  rightActions,
  resultsCount
}: MarketplaceFiltersProps & { resultsCount?: number }) {
  const { t, language } = useI18n();
  const [availableSubcategories, setAvailableSubcategories] = useState<Subcategory[]>([]);
  const [showPriceDropdown, setShowPriceDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync local search with props (e.g. when reset is clicked)
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFilterChange('search', localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch, filters.search, onFilterChange]);

  // Get all cities
  const allCities = CHINA_LOCATIONS.flatMap(province => 
    province.cities.map(city => ({
      ...city,
      province: province.name_en
    }))
  ).sort((a, b) => a.name_en.localeCompare(b.name_en));

  // Update subcategories
  useEffect(() => {
    if (filters.category !== 'all') {
      setAvailableSubcategories(getSubcategories(filters.category));
    } else {
      setAvailableSubcategories([]);
    }
  }, [filters.category]);

  const hasActiveFilters = Object.values(filters).some(val => val !== 'all' && val !== '');

  return (
    <div className="space-y-6 mb-2 md:mb-10">
      {/* Mobile Icon Toolbar */}
      <div className="md:hidden flex items-center justify-between pb-2 bg-white/80 backdrop-blur-xl sticky top-0 z-40 -mx-4 px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">
              {resultsCount !== undefined ? `${resultsCount} ${t('common.results')}` : t('nav.marketplace')}
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
                placeholder={t('marketplace.searchPlaceholder')}
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/60 border-2 border-white/60 rounded-2xl focus:outline-none focus:ring-2 focus:ring-vibrant-purple/20 text-sm font-bold placeholder:text-gray-400"
                autoFocus
              />
            </div>
          </motion.div>
        )}
       </AnimatePresence>

      {/* Top Row: Filters & Search */}
      <div className={`flex flex-col xl:flex-row gap-4 items-center ${showMobileFilters ? 'flex' : 'hidden md:flex'}`}>
        
        {/* Search Bar (Desktop) */}
        <div className="hidden md:block relative w-full md:w-80 lg:w-96 flex-shrink-0 group">
          <div className="absolute inset-0 bg-vibrant-purple/5 blur-xl group-focus-within:bg-vibrant-purple/10 transition-all opacity-0 group-focus-within:opacity-100" />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-vibrant-purple transition-colors" size={20} />
          <input
            type="text"
            placeholder={t('marketplace.searchPlaceholder')}
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full pl-12 pr-6 py-3.5 bg-white/40 border-2 border-gray-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-vibrant-purple/5 focus:border-vibrant-purple/30 transition-all shadow-sm backdrop-blur-md font-bold uppercase tracking-widest text-[11px] placeholder:text-gray-400"
          />
        </div>

        {/* Horizontal Filters Scrollable Container */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 lg:pb-0 w-full xl:w-auto no-scrollbar scroll-smooth">
          
          {/* Category */}
          <div className="relative min-w-[150px] group">
            <select
              value={filters.category}
              onChange={(e) => onFilterChange('category', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-5 pr-10 py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all outline-none truncate backdrop-blur-md
                ${filters.category !== 'all'
                  ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                  : 'bg-white/40 border-gray-200 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                }`}
            >
              <option value="all">{t('marketplace.allCategories')}</option>
              {MARKETPLACE_CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.id}>
                  {language === 'zh' ? cat.name_zh : cat.name_en}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-vibrant-purple transition-colors" />
          </div>

          {/* Subcategory (Conditional) */}
          <AnimatePresence>
            {availableSubcategories.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="relative min-w-[150px] group"
              >
                <select
                  value={filters.subcategory}
                  onChange={(e) => onFilterChange('subcategory', e.target.value)}
                  className={`w-full appearance-none cursor-pointer pl-5 pr-10 py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all outline-none truncate backdrop-blur-md
                    ${filters.subcategory !== 'all'
                      ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                      : 'bg-white/40 border-gray-200 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                    }`}
                >
                  <option value="all">{t('marketplace.allSubcategories')}</option>
                  {availableSubcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {language === 'zh' ? sub.name_zh : sub.name_en}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-vibrant-purple transition-colors" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Location */}
          <div className="relative min-w-[150px] group">
            <select
              value={filters.city}
              onChange={(e) => onFilterChange('city', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-5 pr-10 py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all outline-none truncate backdrop-blur-md
                ${filters.city !== 'all'
                  ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                  : 'bg-white/40 border-gray-200 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                }`}
            >
              <option value="all">{t('marketplace.allCities')}</option>
              {allCities.map(city => (
                <option key={`${city.province}-${city.name_en}`} value={city.name_en}>
                  {language === 'zh' ? city.name_zh : city.name_en}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-vibrant-purple transition-colors" />
          </div>

          {/* Condition */}
          <div className="relative min-w-[140px] group">
            <select
              value={filters.condition}
              onChange={(e) => onFilterChange('condition', e.target.value)}
              className={`w-full appearance-none cursor-pointer pl-5 pr-10 py-3.5 rounded-2xl border-2 text-[11px] font-black uppercase tracking-widest transition-all outline-none truncate backdrop-blur-md
                ${filters.condition !== 'all'
                  ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                  : 'bg-white/40 border-gray-200 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                }`}
            >
              <option value="all">{t('marketplace.allConditions')}</option>
              <option value="new">{t('marketplace.new')}</option>
              <option value="used">{t('marketplace.used')}</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-vibrant-purple transition-colors" />
          </div>

          {/* Price Range */}
          <div className="relative group">
             <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowPriceDropdown(!showPriceDropdown)}
                className={`flex items-center gap-2.5 px-5 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all outline-none whitespace-nowrap backdrop-blur-md
                  ${(filters.minPrice || filters.maxPrice)
                    ? 'bg-vibrant-purple/10 border-vibrant-purple/30 text-vibrant-purple shadow-lg shadow-vibrant-purple/5' 
                    : 'bg-white/40 border-gray-200 text-gray-700 hover:border-vibrant-purple/20 shadow-sm'
                  }`}
             >
                {(filters.minPrice || filters.maxPrice) 
                  ? `¥${filters.minPrice || '0'} - ¥${filters.maxPrice || t('marketplace.any')}` 
                  : t('marketplace.priceRange')}
                <ChevronDown size={14} className={showPriceDropdown ? 'rotate-180 transition-transform' : 'transition-transform'} />
             </motion.button>

             {/* Dropdown Content */}
             <AnimatePresence>
               {showPriceDropdown && (
                 <>
                   <div className="fixed inset-0 z-20" onClick={() => setShowPriceDropdown(false)} />
                   <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-full left-0 xl:right-0 xl:left-auto mt-3 w-72 z-30"
                   >
                     <GlassCard className="p-5 border-white/60 shadow-2xl shadow-vibrant-purple/10">
                      <div className="flex items-center gap-2 mb-4">
                        <Sparkles size={14} className="text-vibrant-purple" />
                        <h4 className="font-black text-[10px] uppercase tracking-widest text-gray-900">{t('marketplace.priceRangeWithCurrency')}</h4>
                      </div>
                      <div className="flex items-center gap-3 mb-6">
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">¥</span>
                          <input
                            type="number"
                            placeholder={t('marketplace.min')}
                            value={filters.minPrice}
                            onChange={(e) => onFilterChange('minPrice', e.target.value)}
                            className="w-full pl-7 pr-3 py-2.5 text-xs font-bold bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-vibrant-purple/5 focus:border-vibrant-purple/30 transition-all"
                          />
                        </div>
                        <span className="text-gray-400 font-bold">-</span>
                        <div className="relative flex-1">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">¥</span>
                          <input
                            type="number"
                            placeholder={t('marketplace.max')}
                            value={filters.maxPrice}
                            onChange={(e) => onFilterChange('maxPrice', e.target.value)}
                            className="w-full pl-7 pr-3 py-2.5 text-xs font-bold bg-white/50 border-2 border-white/60 rounded-xl focus:outline-none focus:ring-4 focus:ring-vibrant-purple/5 focus:border-vibrant-purple/30 transition-all"
                          />
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <button 
                          onClick={() => {
                            onFilterChange('minPrice', '');
                            onFilterChange('maxPrice', '');
                          }}
                          className="text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-vibrant-pink transition-colors"
                        >
                          {t('marketplace.reset')}
                        </button>
                        <button 
                          onClick={() => setShowPriceDropdown(false)}
                          className="text-[10px] font-black uppercase tracking-widest text-white bg-vibrant-purple px-5 py-2.5 rounded-xl hover:bg-vibrant-purple/90 transition-all shadow-lg shadow-vibrant-purple/20"
                        >
                          {t('common.apply')}
                        </button>
                      </div>
                    </GlassCard>
                   </motion.div>
                 </>
               )}
             </AnimatePresence>
          </div>
          
           {hasActiveFilters && (
            <motion.button 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              onClick={onReset}
              className="flex items-center gap-1.5 p-2 px-3 text-[10px] font-black uppercase tracking-widest text-vibrant-pink hover:text-white hover:bg-vibrant-pink rounded-xl transition-all"
            >
              <X size={12} />
              {t('marketplace.clearAll')}
            </motion.button>
          )}

        </div>

        {/* Right Actions - Pushed to the end */}
        {rightActions && (
          <div className="flex items-center gap-3 xl:ml-auto flex-shrink-0">
            {rightActions}
          </div>
        )}
      </div>
    </div>
  );
}
