import { Link } from 'react-router-dom';
import { Heart, MapPin, ShoppingBag } from 'lucide-react';
import { MarketplaceItem } from '../../services/marketplaceService';
import { useI18n } from '../../contexts/I18nContext';
import { getCategoryById, CONDITION_OPTIONS } from '../../constants/marketplaceCategories';
import { GlassCard } from '../ui/GlassCard';
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

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full"
    >
      <Link to={`/marketplace/${item.id}`} className="block h-full group">
        <GlassCard className={`h-full overflow-hidden border-gray-200 hover:border-vibrant-purple/30 transition-colors flex flex-col ${isDashboard ? 'p-1.5' : 'p-1.5'}`}>
          {/* Image Container */}
          <div className={`relative aspect-[4/3] rounded-xl overflow-hidden ${isDashboard ? 'mb-1.5' : 'mb-2'}`}>
            {item.images?.[0] ? (
              <img 
                src={item.images[0]} 
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vibrant-purple/5 to-vibrant-pink/5">
                <ShoppingBag size={isDashboard ? 24 : 48} className="text-vibrant-purple/20" />
              </div>
            )}

            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            {!isDashboard && (
              <>
                {/* Condition Badge */}
                <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex gap-2">
                  {item.condition && (
                    <div className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest backdrop-blur-md border shadow-lg
                      ${item.condition === 'new' 
                        ? 'bg-vibrant-purple/90 border-vibrant-purple/20 text-white' 
                        : 'bg-white/80 border-white/40 text-gray-900'
                      }`}
                    >
                      {getConditionLabel(item.condition)}
                    </div>
                  )}
                </div>

                {/* Price Badge */}
                <div className="absolute top-2 sm:top-3 right-2 sm:right-3 px-2 sm:px-3 py-1 sm:py-1.5 bg-white/90 backdrop-blur-md rounded-xl text-[10px] sm:text-xs font-black shadow-lg text-vibrant-purple border border-white/40">
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
                className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-2 sm:p-2.5 bg-white/90 backdrop-blur-md hover:bg-vibrant-pink hover:text-white text-gray-400 rounded-xl shadow-lg transition-all"
              >
                <Heart
                  size={14}
                  className={`sm:w-4 sm:h-4 ${item.is_favorited ? 'fill-current text-white' : ''}`}
                />
              </button>
            )}
          </div>

          <div className={`p-1 flex-1 flex flex-col`}>
            <h3 className={`${isDashboard ? 'text-xs' : 'text-sm sm:text-base'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-0.5 line-clamp-1 group-hover:text-vibrant-purple transition-colors`}>
              {language === 'zh' && item.title_zh ? item.title_zh : item.title}
            </h3>

            <div className="flex flex-col gap-0.5 sm:gap-1 mt-auto">
              {isDashboard ? (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-vibrant-purple text-xs font-black">
                    {CURRENCY_SYMBOLS[item.currency || 'CNY'] || '¥'}{item.price.toLocaleString()}
                  </span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[60px]">{item.location_city || 'City'}</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 sm:gap-2 text-gray-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">
                    <MapPin size={10} className="text-vibrant-purple sm:w-3 sm:h-3" />
                    <span className="line-clamp-1">{item.location_city || 'N/A'}</span>
                  </div>
                  
                  <div className="flex items-center justify-between w-full mt-1.5 sm:mt-2 pt-2 sm:pt-3 border-t border-gray-100">
                     <span className="bg-vibrant-purple/5 text-vibrant-purple px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-vibrant-purple/10">
                       {getCategoryName(item.category)}
                     </span>
                     {distance && (
                       <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-0.5 sm:gap-1 opacity-60">
                         {distance}
                       </span>
                     )}
                  </div>
                </>
              )}
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
