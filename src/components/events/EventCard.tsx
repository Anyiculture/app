import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, User, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { Event } from '../../services/eventsService';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../ui/Toast';
import { shareContent } from '../../utils/shareUtils';
import { GlassCard } from '../ui/GlassCard';
import { motion } from 'framer-motion';

interface EventCardProps {
  event: Event & { organizer?: any };
  isDashboard?: boolean;
}

export function EventCard({ event, isDashboard }: EventCardProps) {
  const { t } = useI18n();
  const { showToast } = useToast();

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = await shareContent(
      event.title,
      event.description || `Check out this event: ${event.title}`,
      `${window.location.origin}/events/${event.id}`
    );

    if (result === 'copied') {
      showToast('success', t('common.linkCopied'));
    }
  };

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full w-full"
    >
      <Link to={`/events/${event.id}`} className="block h-full group">
        <GlassCard className={`h-full overflow-hidden border-gray-200 hover:border-vibrant-purple/30 transition-colors flex flex-col ${isDashboard ? 'p-1.5' : 'p-1.5 sm:p-2'}`}>
          {/* Image Container */}
          <div className={`relative ${isDashboard ? 'aspect-[4/3] mb-1.5' : 'aspect-video mb-2 sm:mb-3'} rounded-xl overflow-hidden`}>
            {event.image_urls?.[0] ? (
              <img 
                src={event.image_urls[0]} 
                alt={event.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vibrant-purple/5 to-vibrant-pink/5">
                <Calendar className="text-vibrant-purple/20" size={isDashboard ? 24 : 32} />
              </div>
            )}

            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Share Button */}
            {!isDashboard && (
              <button
                onClick={handleShare}
                className="absolute top-2 left-2 sm:top-3 sm:left-3 p-1.5 sm:p-2 bg-white/90 backdrop-blur-md rounded-xl text-gray-500 hover:text-vibrant-purple hover:bg-white transition-all shadow-lg opacity-0 group-hover:opacity-100 z-10"
              >
                <Share2 size={14} className="sm:w-4 sm:h-4" />
              </button>
            )}

            {/* Price Badge */}
            {!isDashboard && (
              <div className={`absolute top-1 right-1 sm:top-2 sm:right-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-black shadow-lg text-vibrant-purple border border-white/40`}>
                 {event.price && event.price > 0 ? (
                   <>
                     {event.currency === 'CNY' ? '¥' : '$'}{event.price}
                   </>
                 ) : (
                   <span className="text-vibrant-green uppercase tracking-widest">{t('common.free') || 'Free'}</span>
                 )}
              </div>
            )}

            {/* Date Badge overlay */}
            {!isDashboard && (
              <div className={`absolute bottom-1 left-1 sm:bottom-2 sm:left-2 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-vibrant-purple/90 backdrop-blur-md rounded-lg text-[7px] sm:text-[8px] font-black shadow-lg text-white border border-white/20 uppercase tracking-widest`}>
                {event.start_date && format(new Date(event.start_date), 'MMM d, h:mm a')}
              </div>
            )}
            
            {/* Dashboard: Simple Date Badge */}
             {isDashboard && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-md rounded-md text-[7px] font-black text-vibrant-purple uppercase tracking-widest shadow-sm">
                {event.start_date && format(new Date(event.start_date), 'MMM d')}
              </div>
            )}
          </div>

          <div className="p-0.5 flex-1 flex flex-col">
            <h3 className={`${isDashboard ? 'text-xs' : 'text-sm sm:text-base'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-0.5 line-clamp-1 group-hover:text-vibrant-purple transition-colors`}>
              {event.title}
            </h3>

            {isDashboard && (
               <div className="flex flex-col mt-auto pt-1">
                 <span className="text-[9px] text-gray-400 font-bold uppercase truncate">
                   {event.location_venue || event.location_city || 'Online'}
                 </span>
               </div>
            )}

            {!isDashboard && (
              <div className="flex flex-col gap-1 mt-auto">
                 {(event.location_city || event.location_venue) && (
                  <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest">
                    <MapPin size={10} className="sm:w-3 sm:h-3 text-vibrant-purple" />
                    <span className="line-clamp-1">{event.location_venue || event.location_city}</span>
                  </div>
                )}
                
                <div className={`flex items-center justify-between w-full mt-1.5 sm:mt-2 pt-2 sm:pt-3 border-t border-gray-100`}>
                   {/* Organizer Info */}
                   <div className="flex items-center gap-1.5">
                      <div className="relative">
                        {event.organizer?.avatar_url ? (
                          <img src={event.organizer.avatar_url} alt="Org" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white shadow-sm" />
                        ) : (
                          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-vibrant-purple/10 flex items-center justify-center border border-white shadow-sm">
                             <User size={8} className="text-vibrant-purple" />
                          </div>
                        )}
                      </div>
                      <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-widest truncate max-w-[80px] sm:max-w-[100px]">
                        {event.organizer?.full_name || t('events.organizer')}
                      </span>
                   </div>

                   {/* Attendees */}
                   <div className={`flex items-center gap-1 text-vibrant-purple font-black text-[7px] sm:text-[8px] uppercase tracking-widest bg-vibrant-purple/5 px-1 sm:px-1.5 py-0.5 rounded-md`}>
                     <Users size={8} />
                     <span>{event.attendee_count || 0}</span>
                   </div>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
