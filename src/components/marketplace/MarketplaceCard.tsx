import { Link } from 'react-router-dom';
import { Heart, MapPin, ShoppingBag } from 'lucide-react';
import { MarketplaceItem } from '../../services/marketplaceService';
import { useI18n } from '../../contexts/I18nContext';
import { getCategoryById, CONDITION_OPTIONS } from '../../constants/marketplaceCategories';
import { motion } from 'framer-motion';

interface MarketplaceCardProps {
  item: MarketplaceItem & { seller?: any; is_favorited?: boolean };
  user: any;
  onToggleFavorite: (e: React.MouseEvent, itemId: string) => void;
  getItemDistance: (item: MarketplaceItem) => string | null;
  isDashboard?: boolean;
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  'CNY': '¥',
  'USD': '$',
  'EUR': '€',
  'HKD': 'HK$',
};

export function MarketplaceCard({ item, user, onToggleFavorite, getItemDistance, isDashboard }: MarketplaceCardProps) {
  const { language } = useI18n();
  const distance = getItemDistance(item);

  // Helper to get translated category name
  const getCategoryName = (id: string) => {
    const category = getCategoryById(id);
    if (!category) return id;
    return language === 'zh' ? category.name_zh : category.name_en;
  };

  // Helper to get translated condition label
  const getConditionLabel = (value: string) => {
    const condition = CONDITION_OPTIONS.find(c => c.value === value);
    if (!condition) return value;
    return language === 'zh' ? condition.label_zh : condition.label_en;
  };

  const cardGradient = item.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
  const gradients = [
    'from-vibrant-purple via-purple-600 to-indigo-600',
    'from-vibrant-pink via-pink-600 to-rose-600',
    'from-blue-500 via-blue-600 to-cyan-600',
    'from-emerald-500 via-emerald-600 to-teal-600',
    'from-orange-500 via-orange-600 to-red-600'
  ];
  const gradientClass = gradients[cardGradient];

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full group"
    >
      <Link to={`/marketplace/${item.id}`} className="block h-full relative">
        <div className={`h-full w-full p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradientClass} shadow-md group-hover:shadow-2xl transition-all duration-500`}>
          
          {/* Inner White Card */}
          <div className={`h-full w-full bg-white rounded-[14px] sm:rounded-[22px] overflow-hidden flex flex-col relative ${isDashboard ? 'p-2' : 'p-2 sm:p-3'}`}>
            
             {/* Subtle Decorative Background Gradient inside white card */}
             <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${gradientClass} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none`} />

            {/* Image Container */}
            <div className={`relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden ${isDashboard ? 'mb-2' : 'mb-3'}`}>
              {item.images?.[0] ? (
                <img 
                  src={item.images[0]} 
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gray-50`}>
                  <div className={`w-full h-full opacity-10 bg-gradient-to-br ${gradientClass}`} />
                  <ShoppingBag size={isDashboard ? 24 : 40} className="absolute text-gray-300 sm:w-16 sm:h-16" />
                </div>
              )}

              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

              {!isDashboard && (
                <>
                  {/* Condition Badge */}
                  <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-2">
                    {item.condition && (
                      <div className={`px-2 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest backdrop-blur-md shadow-lg border border-white/20 text-white
                        ${item.condition === 'new' 
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                          : 'bg-black/50'
                        }`}
                      >
                        {getConditionLabel(item.condition)}
                      </div>
                    )}
                  </div>

                  {/* Price Badge */}
                   <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[10px] sm:text-xs font-black shadow-lg border border-white/40 text-transparent bg-clip-text bg-gradient-to-br ${gradientClass}`}>
                     {CURRENCY_SYMBOLS[item.currency || 'CNY'] || '¥'}{item.price.toLocaleString()}
                  </div>
                </>
              )}

              {/* Favorite Button */}
              {user && !isDashboard && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    onToggleFavorite(e, item.id);
                  }}
                  className="absolute bottom-2 right-2 sm:bottom-3 sm:right-3 p-2 bg-white/80 backdrop-blur-md hover:bg-white text-gray-400 hover:text-vibrant-pink rounded-full shadow-lg transition-all z-10"
                >
                  <Heart
                    size={14}
                    className={`sm:w-5 sm:h-5 transition-colors ${item.is_favorited ? 'fill-vibrant-pink text-vibrant-pink' : ''}`}
                  />
                </button>
              )}
            </div>

            <div className="p-1 flex-1 flex flex-col relative z-10">
              <h3 className={`${isDashboard ? 'text-xs' : 'text-sm sm:text-base'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-0.5 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${gradientClass} transition-all duration-300`}>
                {language === 'zh' && item.title_zh ? item.title_zh : item.title}
              </h3>

              <div className="flex flex-col gap-1 mt-auto">
                {isDashboard ? (
                  <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                    <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientClass} text-xs font-black`}>
                      {CURRENCY_SYMBOLS[item.currency || 'CNY'] || '¥'}{item.price.toLocaleString()}
                    </span>
                    <span className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[60px]">{item.location_city || 'City'}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mb-1">
                      <MapPin size={10} className={`text-gray-300 group-hover:text-${gradientClass.split('-')[1] || 'purple'}-400 transition-colors`} />
                      <span className="line-clamp-1">{item.location_city || 'N/A'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-gray-50">
                       <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-gray-100 group-hover:border-gray-200 transition-colors">
                         {getCategoryName(item.category)}
                       </span>
                       {distance && (
                         <span className="text-[8px] sm:text-[9px] text-gray-300 font-black uppercase tracking-widest flex items-center gap-1">
                           {distance}
                         </span>
                       )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
