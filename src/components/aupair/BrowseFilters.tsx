import { useI18n } from '../../contexts/I18nContext';
import { ChevronDown, Filter } from 'lucide-react';
import { motion } from 'framer-motion';

interface BrowseFiltersProps {
  userRole: string;
  filters: any;
  onChange: (key: string, value: any) => void;
  onReset: () => void;
  rightActions?: React.ReactNode;
}

export function BrowseFilters({ 
  userRole, 
  filters, 
  onChange, 
  onReset,
  rightActions,
}: BrowseFiltersProps) {
  const { t } = useI18n();
  const isFamilyView = userRole === 'au_pair'; // Au Pair looking at families
  
  const hasActiveFilters = Object.values(filters).some(val => val !== '' && val !== 'all');

  // Styled Select Component to match Marketplace
  const Select = ({ value, onChange, options, placeholder, icon: Icon }: any) => (
    <div className="relative group">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none cursor-pointer pl-10 pr-10 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all duration-500 outline-none
          ${value 
            ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20' 
            : 'bg-white border-gray-200 text-gray-700 hover:border-blue-300 shadow-sm'
          }`}
      >
        <option value="" className="text-gray-900 bg-white">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value} className="text-gray-900 bg-white">{opt.label}</option>
        ))}
      </select>
      {Icon && <Icon size={14} className={`absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${value ? 'text-white' : 'text-gray-400'}`} />}
      <ChevronDown size={14} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none transition-colors ${value ? 'text-white' : 'text-gray-400'}`} />
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-center w-full">
      <div className="flex flex-wrap items-center gap-4 flex-1">
         <div className="flex items-center gap-3 mr-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center border border-blue-100 shadow-sm">
               <Filter size={18} className="text-blue-600" />
            </div>
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('common.filters')}</span>
         </div>

         {isFamilyView ? (
           <>
             <Select 
               value={filters.location_country} 
               onChange={(v: string) => onChange('location_country', v)} 
               placeholder={t('auPair.browse.filterLocation')}
               options={[
                   {value: 'China', label: t('countries.China')}, 
                   {value: 'USA', label: t('countries.USA')},
                   {value: 'UK', label: t('countries.UK')},
                   {value: 'Australia', label: t('countries.Australia')},
                   {value: 'Canada', label: t('countries.Canada')},
                   {value: 'Germany', label: t('countries.Germany')},
                   {value: 'France', label: t('countries.France')}
               ]}
             />
             <Select 
               value={filters.children_count_min} 
               onChange={(v: string) => onChange('children_count_min', v)} 
               placeholder={t('auPair.browse.filterChildren')}
                options={[
                    {value: '1', label: t('auPair.browse.childrenCount.one')}, 
                    {value: '2', label: t('auPair.browse.childrenCount.two')},
                    {value: '3', label: t('auPair.browse.childrenCount.three')}
                ]}
             />
           </>
         ) : (
           <>
             <Select 
               value={filters.nationality} 
               onChange={(v: string) => onChange('nationality', v)} 
               placeholder={t('auPair.browse.filterNationality')}
               options={[
                   {value: 'American', label: t('nationalities.American')}, 
                   {value: 'British', label: t('nationalities.British')}, 
                   {value: 'Chinese', label: t('nationalities.Chinese')},
                   {value: 'German', label: t('nationalities.German')},
                   {value: 'French', label: t('nationalities.French')},
                   {value: 'Australian', label: t('nationalities.Australian')},
                   {value: 'Canadian', label: t('nationalities.Canadian')}
               ]}
             />
             <Select 
                value={filters.experience_years_min} 
                onChange={(v: string) => onChange('experience_years_min', v)} 
                placeholder={t('auPair.browse.filterExperience')}
                options={[
                  {value: '1', label: `1+ ${t('common.years')}`},
                  {value: '3', label: `3+ ${t('common.years')}`},
                  {value: '5', label: `5+ ${t('common.years')}`}
                ]}
             />
           </>
         )}
         
         {hasActiveFilters && (
             <motion.button 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onReset}
                className="text-[10px] font-black text-red-500 uppercase tracking-widest px-4 py-3 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors"
             >
                {t('marketplace.clearAll')}
             </motion.button>
         )}
      </div>

      {/* Right Actions */}
      {rightActions && (
        <div className="flex items-center gap-4 flex-shrink-0">
          {rightActions}
        </div>
      )}
    </div>
  );
}
