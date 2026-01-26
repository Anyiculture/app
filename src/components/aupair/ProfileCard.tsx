
import React from 'react';
import { Heart, MapPin, Users, Star, Briefcase, ArrowRight } from 'lucide-react';
import { useI18n } from '../../contexts/I18nContext';
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
  
  const cardGradient = React.useMemo(() => {
    // Unique palettes for variety
    const gradients = [
      'from-vibrant-purple via-violet-600 to-indigo-600',
      'from-vibrant-pink via-rose-500 to-red-500', 
      'from-blue-500 via-cyan-500 to-teal-400',
      'from-emerald-400 via-green-500 to-lime-500',
      'from-orange-400 via-amber-500 to-yellow-500',
      'from-indigo-400 via-blue-500 to-sky-500'
    ];
    const seed = displayName || profile.id || 'User';
    const index = seed.split('').reduce((acc: number, char: string) => acc + char.charCodeAt(0), 0) % gradients.length;
    return gradients[index];
  }, [displayName, profile.id]);

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
      whileHover={isRestricted ? {} : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full w-full group"
    >
      <div 
        onClick={() => onView(profile.id || profile.user_id)} 
        className={`relative h-full w-full p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${cardGradient} shadow-md group-hover:shadow-2xl transition-all duration-500 cursor-pointer ${isRestricted ? 'grayscale-[0.8] opacity-80' : ''}`}
      >
        {/* Inner White Card */}
        <div className={`relative h-full w-full bg-white rounded-[14px] sm:rounded-[22px] overflow-hidden flex flex-col ${isDashboard ? 'p-2' : 'p-2 sm:p-3'}`}>
          
          {/* Subtle Decorative Background Gradient inside white card */}
          <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${cardGradient} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none`} />

          {/* Image Container */}
          <div className={`relative ${isDashboard ? 'aspect-square mb-2' : 'aspect-[4/3] sm:aspect-square mb-3'} rounded-xl sm:rounded-2xl overflow-hidden shadow-sm`}>
            {image ? (
              <img 
                src={image} 
                alt={displayName} 
                className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out ${isRestricted ? 'blur-sm scale-110' : ''}`}
              />
            ) : (
              <div className={`w-full h-full flex items-center justify-center bg-gray-50`}>
                 <div className={`w-full h-full opacity-10 bg-gradient-to-br ${cardGradient}`} />
                 <Users size={isDashboard ? 20 : 32} className="absolute text-gray-300 sm:w-16 sm:h-16" />
              </div>
            )}

            {/* Dark gradient overlay on bottom of image for text readability if needed, but we put text below */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Locked Overlay */}
            {isRestricted && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[3px] z-10 transition-all duration-300 group-hover:bg-black/50">
                 <div className={`p-2 bg-white/90 backdrop-blur-xl rounded-full shadow-2xl text-vibrant-purple ${isDashboard ? 'scale-75' : 'scale-90 sm:scale-100'} animate-bounce-slow`}>
                   <Star size={20} strokeWidth={2.5} className="fill-current w-5 h-5 sm:w-6 sm:h-6" />
                 </div>
                 {!isDashboard && <span className="mt-2 text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-white drop-shadow-md">{t('common.premiumOnly') || 'Premium Only'}</span>}
              </div>
            )}

            {/* Favorite Button */}
            {!isRestricted && !isDashboard && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleFavoriteClick}
                className="absolute top-2 right-2 sm:top-3 sm:right-3 p-2 bg-white/80 backdrop-blur-md rounded-full shadow-lg hover:bg-white hover:text-vibrant-pink transition-colors z-10 group/fav"
              >
                <Heart
                  size={14}
                  className={`sm:w-5 sm:h-5 transition-colors ${isFavorited ? 'fill-vibrant-pink text-vibrant-pink' : 'text-gray-400 group-hover/fav:text-vibrant-pink'}`}
                />
              </motion.button>
            )}

            {/* Role Badge (Gradient) */}
            <div className={`absolute top-2 left-2 sm:top-3 sm:left-3 px-2 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-white shadow-lg bg-gradient-to-r ${isFamily ? 'from-purple-600 to-indigo-600' : 'from-pink-500 to-rose-500'}`}>
              {isFamily ? t('auPair.role.host_family') : t('auPair.role.au_pair')}
            </div>
          </div>

          {/* Content */}
          <div className={`flex-1 flex flex-col relative z-10 ${isRestricted ? 'opacity-40' : ''}`}>
            <h3 className={`${isDashboard ? 'text-xs' : 'text-sm sm:text-lg'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-1 truncate group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${cardGradient} transition-all duration-300`}>
              {isRestricted ? (t('common.premiumProfile') || 'Premium Profile') : displayName}
            </h3>

            <div className="flex items-center gap-1.5 text-gray-500 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mb-3">
              <MapPin size={10} className={`text-gray-400 group-hover:text-${cardGradient.split('-')[1] || 'purple'}-500 transition-colors`} />
              <span className="truncate max-w-[120px]">{cleanLocation || t('auPair.card.locationNA')}</span>
            </div>

            {!isDashboard && (
              <>
                {/* Badges Row */}
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {badges.slice(0, 2).map((badge, i) => (
                     <span key={i} className="px-2 py-1 bg-gray-50 text-gray-600 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest rounded-md border border-gray-100 group-hover:border-gray-200 transition-colors">
                       {isRestricted && i > 0 ? '••••' : badge}
                     </span>
                  ))}
                </div>

                <div className="mt-auto pt-3 border-t border-gray-50 flex items-center justify-between">
                  {isFamily ? (
                    <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      <Briefcase size={12} className="text-gray-300" />
                      <span className="truncate max-w-[100px]">{t('auPair.card.start') || 'Start'}: {profile.start_date || (t('common.flexible') || 'Flex')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest text-gray-400">
                      <Star size={12} className="text-gray-300" />
                      <span>{profile.childcare_experience_years || 0} {t('auPair.card.yearsExp')}</span>
                    </div>
                  )}
                  
                  <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-300 group-hover:text-white group-hover:bg-gradient-to-br group-hover:${cardGradient} transition-all duration-300 shadow-sm group-hover:shadow-md`}>
                      <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

