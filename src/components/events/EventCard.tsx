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

  const cardGradient = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
  const gradients = [
    'from-indigo-500 via-indigo-600 to-violet-600',
    'from-fuchsia-500 via-fuchsia-600 to-pink-600',
    'from-sky-500 via-sky-600 to-blue-600',
    'from-teal-500 via-teal-600 to-emerald-600',
    'from-amber-500 via-amber-600 to-orange-600'
  ];
  const gradientClass = gradients[cardGradient];

  return (
    <motion.div
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full w-full group"
    >
      <Link to={`/events/${event.id}`} className="block h-full relative">
        <div className={`h-full w-full p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradientClass} shadow-md group-hover:shadow-2xl transition-all duration-500`}>
          
          {/* Inner White Card */}
          <div className={`h-full w-full bg-white rounded-[14px] sm:rounded-[22px] overflow-hidden flex flex-col relative ${isDashboard ? 'p-2' : 'p-2 sm:p-3'}`}>
            
            {/* Subtle Decorative Background Gradient inside white card */}
            <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${gradientClass} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none`} />

            {/* Image Container */}
            <div className={`relative ${isDashboard ? 'aspect-[4/3] mb-2' : 'aspect-video mb-2 sm:mb-3'} rounded-xl sm:rounded-2xl overflow-hidden`}>
              {event.image_urls?.[0] ? (
                <img 
                  src={event.image_urls[0]} 
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center bg-gray-50`}>
                  <div className={`w-full h-full opacity-10 bg-gradient-to-br ${gradientClass}`} />
                  <Calendar className="absolute text-gray-300 sm:w-16 sm:h-16" size={isDashboard ? 24 : 32} />
                </div>
              )}

              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />

              {/* Share Button */}
              {!isDashboard && (
                <button
                  onClick={handleShare}
                  className="absolute top-2 left-2 sm:top-3 sm:left-3 p-2 bg-white/80 backdrop-blur-md rounded-full text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-500 transition-all shadow-lg opacity-0 group-hover:opacity-100 z-10"
                >
                  <Share2 size={14} className="sm:w-4 sm:h-4" />
                </button>
              )}

              {/* Price Badge */}
              {!isDashboard && (
                <div className={`absolute top-2 right-2 sm:top-3 sm:right-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-black shadow-lg border border-white/40`}>
                   {event.price && event.price > 0 ? (
                     <span className={`text-transparent bg-clip-text bg-gradient-to-br ${gradientClass}`}>
                       {event.currency === 'CNY' ? '¥' : '$'}{event.price}
                     </span>
                   ) : (
                     <span className="text-emerald-500 uppercase tracking-widest">{t('common.free') || 'Free'}</span>
                   )}
                </div>
              )}

              {/* Date Badge overlay */}
              {!isDashboard && (
                <div className={`absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-2 py-1 bg-white/90 backdrop-blur-md rounded-lg text-[7px] sm:text-[9px] font-black shadow-lg text-gray-800 border border-white/20 uppercase tracking-widest flex items-center gap-1`}>
                  <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradientClass}`} />
                  {event.start_date && format(new Date(event.start_date), 'MMM d, h:mm a')}
                </div>
              )}
              
              {/* Dashboard: Simple Date Badge */}
               {isDashboard && (
                <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-md rounded-md text-[7px] font-black text-gray-800 uppercase tracking-widest shadow-sm">
                  {event.start_date && format(new Date(event.start_date), 'MMM d')}
                </div>
              )}
            </div>

            <div className="p-0.5 flex-1 flex flex-col relative z-10">
              <h3 className={`${isDashboard ? 'text-xs' : 'text-sm sm:text-base'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-0.5 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${gradientClass} transition-all duration-300`}>
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
                    <div className="flex items-center gap-1.5 sm:gap-2 text-gray-400 font-bold text-[9px] sm:text-[10px] uppercase tracking-widest mb-1.5">
                      <MapPin size={10} className={`sm:w-3 sm:h-3 text-gray-300 group-hover:text-${gradientClass.split('-')[1] || 'indigo'}-400 transition-colors`} />
                      <span className="line-clamp-1">{event.location_venue || event.location_city}</span>
                    </div>
                  )}
                  
                  <div className={`flex items-center justify-between w-full mt-2 pt-3 border-t border-gray-50`}>
                     {/* Organizer Info */}
                     <div className="flex items-center gap-1.5">
                        <div className="relative">
                          {event.organizer?.avatar_url ? (
                            <img src={event.organizer.avatar_url} alt="Org" className="w-4 h-4 sm:w-5 sm:h-5 rounded-full object-cover border border-white shadow-sm ring-1 ring-gray-100" />
                          ) : (
                            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-gray-50 flex items-center justify-center border border-white shadow-sm ring-1 ring-gray-100">
                               <User size={8} className="text-gray-400" />
                            </div>
                          )}
                        </div>
                        <span className="text-[8px] sm:text-[9px] text-gray-400 font-black uppercase tracking-widest truncate max-w-[80px] sm:max-w-[100px]">
                          {event.organizer?.full_name || t('events.organizer')}
                        </span>
                     </div>

                     {/* Attendees */}
                     <div className={`flex items-center gap-1 text-gray-500 font-black text-[7px] sm:text-[8px] uppercase tracking-widest bg-gray-50 px-1.5 sm:px-2 py-0.5 rounded-md border border-gray-100`}>
                       <Users size={8} />
                       <span>{event.attendee_count || 0}</span>
                     </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
