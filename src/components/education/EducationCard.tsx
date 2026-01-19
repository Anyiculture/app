import { Link } from 'react-router-dom';
import { GraduationCap, Clock, Star, BookOpen, Share2 } from 'lucide-react';
import { EducationResource } from '../../services/educationService';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../ui/Toast';
import { TranslateWrapper } from '../ui/TranslateWrapper';
import { shareContent } from '../../utils/shareUtils';
import { translateProgramType, translateDeliveryMode, translateEducationLevel } from '../../utils/educationTranslations';
import { GlassCard } from '../ui/GlassCard';
import { motion } from 'framer-motion';

interface EducationCardProps {
  program: EducationResource;
  onToggleFavorite: (e: React.MouseEvent, programId: string) => void;
  isDashboard?: boolean;
}

export function EducationCard({ program, onToggleFavorite, isDashboard }: EducationCardProps) {
  const { t, language } = useI18n();
  const { showToast } = useToast();

  const title = language === 'zh' && program.title_zh ? program.title_zh : program.title;

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const result = await shareContent(
      title,
      program.description || `Check out this program: ${title}`,
      `${window.location.origin}/education/${program.id}`
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
      <Link
        to={`/education/${program.id}`}
        className="block h-full group"
      >
        <GlassCard className={`h-full overflow-hidden border-gray-200 hover:border-vibrant-purple/30 transition-colors flex flex-col ${isDashboard ? 'p-1.5' : 'p-1.5 sm:p-2'}`}>
          {/* Image Container */}
          <div className={`relative ${isDashboard ? 'aspect-[4/3] mb-1.5' : 'aspect-video mb-2 sm:mb-3'} rounded-xl overflow-hidden`}>
            {program.image_url ? (
              <img
                src={program.image_url}
                alt={title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-vibrant-purple/5 to-vibrant-pink/5">
                <GraduationCap className="text-vibrant-purple/20" size={isDashboard ? 24 : 48} />
              </div>
            )}

            <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
            
            {/* Type Badge */}
            {!isDashboard && (
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1.5 sm:gap-2">
                {program.program_type && (
                  <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-vibrant-purple/90 backdrop-blur-md text-white border border-white/20 shadow-lg">
                    {translateProgramType(program.program_type, t)}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            {!isDashboard && (
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 z-10">
                <button
                  onClick={handleShare}
                  className="p-1.5 sm:p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-gray-400 hover:text-vibrant-purple hover:bg-white shadow-lg transition-colors"
                >
                  <Share2 size={14} className="sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={(e) => onToggleFavorite(e, program.id)}
                  className="p-1.5 sm:p-2.5 bg-white/90 backdrop-blur-md rounded-xl text-gray-400 hover:text-vibrant-pink hover:bg-white shadow-lg transition-colors"
                >
                  <Star size={14} fill={program.is_favorited ? "currentColor" : "none"} className={`sm:w-4 sm:h-4 ${program.is_favorited ? "text-vibrant-pink" : ""}`} />
                </button>
              </div>
            )}

            {/* Price Badge overlay */}
            {!isDashboard && (
              <div className={`absolute bottom-2 right-2 sm:bottom-3 sm:right-3 px-1.5 sm:px-2 py-0.5 sm:py-1 bg-white/90 backdrop-blur-md rounded-lg text-[8px] sm:text-[10px] font-black shadow-lg text-vibrant-purple border border-white/40`}>
                {program.price > 0 ? (
                   <div className="flex items-center gap-0.5">
                     <span className="text-[7px] sm:text-[8px] opacity-60 font-bold">{program.currency}</span>
                     {program.price.toLocaleString()}
                   </div>
                ) : (
                  <span className="text-vibrant-green uppercase tracking-widest">{t('education.browse.free')}</span>
                )}
              </div>
            )}
            
            {/* Dashboard: Simple Price Badge */}
            {isDashboard && (
              <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-white/90 backdrop-blur-md rounded-md text-[7px] font-black text-vibrant-purple uppercase tracking-widest shadow-sm">
                {program.price > 0 ? `${program.currency === 'CNY' ? '¥' : '$'}${program.price}` : t('common.free')}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-0.5 flex-1 flex flex-col">
            <TranslateWrapper 
              text={program.title}
              dbTranslation={language === 'zh' ? program.title_zh : null}
              as="h3"
              className={`${isDashboard ? 'text-xs' : 'text-sm sm:text-base'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-0.5 group-hover:text-vibrant-purple transition-colors`}
            />
            
            {isDashboard && (
               <div className="mt-auto pt-1 text-[9px] text-gray-400 font-bold uppercase truncate">
                  {program.institution_name || 'Institution'}
               </div>
            )}

            {!isDashboard && (
              <div className="flex flex-col gap-1 mt-auto">
                <div className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 sm:gap-2">
                  <div className="w-1 h-1 rounded-full bg-vibrant-purple/40" />
                  <span className="truncate">{program.institution_name || t('education.browse.institutionName')}</span>
                </div>
                
                <div className={`flex items-center justify-between w-full mt-1.5 sm:mt-2 pt-2 sm:pt-3 border-t border-gray-100`}>
                   <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1 text-gray-400 font-black text-[7px] sm:text-[8px] uppercase tracking-widest">
                         <Clock size={8} className="text-vibrant-purple/40" />
                         <span>{program.duration_value} {program.duration_unit}</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 font-black text-[8px] sm:text-[9px] uppercase tracking-widest">
                         <BookOpen size={10} className="sm:w-3 sm:h-3 text-vibrant-purple/40" />
                         <span className="truncate max-w-[60px] sm:max-w-none">{translateEducationLevel(program.level, t)}</span>
                      </div>
                   </div>
                   <span className={`text-[7px] sm:text-[8px] font-black text-vibrant-purple uppercase tracking-widest bg-vibrant-purple/5 px-1 sm:px-1.5 py-0.5 rounded-md`}>
                     {translateDeliveryMode(program.delivery_mode || undefined, t) || t('education.browse.onSite')}
                   </span>
                </div>
              </div>
            )}
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );
}
