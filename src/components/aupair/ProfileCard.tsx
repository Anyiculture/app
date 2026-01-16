
import React from 'react';
import { Heart, MapPin, Users, Star, Briefcase, ArrowRight } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
import { GlassCard } from '../ui/GlassCard';
import { motion } from 'framer-motion';

interface ProfileCardProps {
  profile: any;
  userRole: 'au_pair' | 'host_family';
  isFavorited: boolean;
  onToggleFavorite: (e: React.MouseEvent, id: string) => void;
  onView: (id: string) => void;
  isRestricted?: boolean;
  isDashboard?: boolean;
}

export function ProfileCard({ profile, userRole, isFavorited, onToggleFavorite, onView, isRestricted, isDashboard }: ProfileCardProps) {
  const { t } = useI18n();
  const isFamily = userRole === 'au_pair'; // Viewing families
  const displayName = isFamily ? profile.family_name : profile.display_name;
  
  const location = isFamily 
    ? `${profile.city || profile.location_city || ''}, ${profile.country || profile.location_country || ''}`
    : `${profile.current_city || ''}, ${profile.current_country || ''}`;
    
  // Handle cleaning up location string if parts are missing
  const cleanLocation = location.replace(/^, |, $/g, '').replace(', ,', ',');

  const image = isFamily 
    ? (profile.profile_photos?.[0] || profile.family_photos?.[0] || profile.home_photos?.[0]) 
    : (profile.profile_photos?.[0]);
  
  // Tags/Badges logic
  const badges = [];
  if (isFamily) {
    if (profile.children_count) badges.push(`${profile.children_count} ${t('common.kids') || 'Kids'}`);
    if (profile.housing_type) badges.push(profile.housing_type);
  } else {
    if (profile.nationality) badges.push(profile.nationality);
    if (profile.age) badges.push(`${profile.age} ${t('common.yearsOld') || 'y/o'}`);
  }

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleFavorite(e, profile.id || profile.user_id);
  };

  return (
    <motion.div
      whileHover={isRestricted ? {} : { y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full w-full"
    >
      <GlassCard 
        onClick={() => onView(profile.id || profile.user_id)} 
        className={`cursor-pointer h-full overflow-hidden border-white/20 hover:border-vibrant-purple/30 transition-all duration-500 flex flex-col group ${isRestricted ? 'grayscale-[0.5]' : ''} ${isDashboard ? 'p-1.5' : 'p-1.5 sm:p-2.5'}`}
      >
        {/* Image Container */}
        <div className={`relative ${isDashboard ? 'aspect-square mb-1.5' : 'aspect-square mb-2 sm:mb-4'} rounded-xl sm:rounded-2xl overflow-hidden`}>
          {image ? (
            <img 
              src={image} 
              alt={displayName} 
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ${isRestricted ? 'blur-md' : ''}`}
            />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-vibrant-purple/5 to-vibrant-pink/5 ${isRestricted ? 'blur-md' : ''}`}>
              <Users size={isDashboard ? 16 : 24} className="text-vibrant-purple/20 sm:w-12 sm:h-12" />
            </div>
          )}

          <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Locked Overlay */}
          {isRestricted && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/20 backdrop-blur-[2px] z-10">
               <div className={`p-1 bg-white/90 backdrop-blur-xl rounded-xl shadow-2xl text-vibrant-purple ${isDashboard ? 'scale-50' : 'scale-75 sm:scale-90'}`}>
                 <Star size={12} strokeWidth={2.5} className="fill-current sm:w-6 sm:h-6" />
               </div>
               {!isDashboard && <span className="mt-1 sm:mt-3 text-[6px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-lg">{t('common.premiumOnly') || 'Premium Only'}</span>}
            </div>
          )}

          {/* Favorite Button */}
          {!isRestricted && !isDashboard && (
            <button
              onClick={handleFavoriteClick}
              className="absolute top-1 right-1 sm:top-3 sm:right-3 p-1.5 sm:p-2.5 bg-white/90 backdrop-blur-md rounded-lg sm:rounded-xl shadow-lg hover:bg-vibrant-pink hover:text-white transition-all z-10"
            >
              <Heart
                size={12}
                className={`sm:w-4 sm:h-4 ${isFavorited ? 'fill-current' : ''}`}
              />
            </button>
          )}

          {/* Role Badge */}
          <div className={`absolute top-1 left-1 sm:top-2 sm:left-2 px-1 sm:px-2 py-0.5 sm:py-1 backdrop-blur-md rounded-lg text-[6px] sm:text-[8px] font-black uppercase tracking-widest border border-white/20 shadow-lg text-white ${
            isFamily ? 'bg-vibrant-purple/90' : 'bg-vibrant-pink/90'
          }`}>
            {isFamily ? t('auPair.role.hostFamily') : t('auPair.role.auPair')}
          </div>
        </div>

        {/* Content */}
        <div className={`px-0.5 pb-0.5 flex-1 flex flex-col ${isRestricted ? 'opacity-50' : ''}`}>
          <h3 className={`${isDashboard ? 'text-xs' : 'text-[10px] sm:text-base'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-0.5 line-clamp-1 group-hover:text-vibrant-purple transition-colors`}>
            {isRestricted ? (t('common.premiumProfile') || 'Premium Profile') : displayName}
          </h3>

          <div className="flex items-center gap-1 text-gray-400 font-bold text-[8px] sm:text-[9px] uppercase tracking-widest mt-auto mb-1">
            <MapPin size={8} className="text-vibrant-purple" />
            <span className="truncate">{cleanLocation || t('auPair.card.locationNA')}</span>
          </div>

          {!isDashboard && (
            <>
              {/* Badges Row */}
              <div className="flex flex-wrap gap-1 sm:gap-2 mb-2 sm:mb-6">
                {badges.slice(0, 2).map((badge, i) => (
                   <span key={i} className="px-1.5 sm:px-2.5 py-0.5 bg-vibrant-purple/5 text-vibrant-purple text-[7px] sm:text-[9px] font-black uppercase tracking-widest rounded-md sm:rounded-lg border border-vibrant-purple/10">
                     {isRestricted && i > 0 ? '••••' : badge}
                   </span>
                ))}
              </div>

              <div className="mt-auto pt-1 sm:pt-3 border-t border-gray-100 flex items-center justify-between">
                {isFamily ? (
                  <div className="flex items-center gap-1 text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <Briefcase size={8} className="sm:w-3 sm:h-3 text-vibrant-purple/40" />
                    <span className="truncate">{t('auPair.card.start') || 'Start'}: {profile.start_date || (t('common.flexible') || 'Flex')}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[7px] sm:text-[9px] font-black uppercase tracking-widest text-gray-400">
                    <Star size={8} className="sm:w-3 sm:h-3 text-vibrant-purple/40" />
                    <span>{profile.childcare_experience_years || 0} {t('auPair.card.yearsExp')}</span>
                  </div>
                )}
                
                <div className="w-5 h-5 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-vibrant-purple group-hover:text-white transition-all">
                    <ArrowRight size={10} className="sm:w-3 sm:h-3" />
                </div>
              </div>
            </>
          )}
        </div>
      </GlassCard>
    </motion.div>
  );
}

