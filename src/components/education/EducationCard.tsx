import { Link } from 'react-router-dom';
import { GraduationCap, Clock, Star, BookOpen, Share2 } from 'lucide-react';
import { EducationResource } from '../../services/educationService';
import { useI18n } from '../../contexts/I18nContext';
import { useToast } from '../ui/Toast';
import { TranslateWrapper } from '../ui/TranslateWrapper';
import { shareContent } from '../../utils/shareUtils';
import { translateProgramType, translateDeliveryMode, translateEducationLevel } from '../../utils/educationTranslations';
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

  const cardGradient = program.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 5;
  const gradients = [
    'from-emerald-500 via-emerald-600 to-teal-600',
    'from-blue-500 via-blue-600 to-indigo-600',
    'from-purple-500 via-purple-600 to-fuchsia-600',
    'from-amber-500 via-amber-600 to-orange-600',
    'from-rose-500 via-rose-600 to-pink-600'
  ];
  const gradientClass = gradients[cardGradient];

  return (
    <motion.div 
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="h-full group"
    >
      <Link
        to={`/education/${program.id}`}
        className="block h-full relative"
      >
        <div className={`h-full w-full p-[2px] rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradientClass} shadow-md group-hover:shadow-2xl transition-all duration-500`}>
            
            {/* Inner White Card */}
            <div className={`h-full w-full bg-white rounded-[14px] sm:rounded-[22px] overflow-hidden flex flex-col relative ${isDashboard ? 'p-2' : 'p-2 sm:p-3'}`}>
                
                {/* Subtle Decorative Background Gradient inside white card */}
                <div className={`absolute -top-10 -right-10 w-40 h-40 bg-gradient-to-br ${gradientClass} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity duration-500 pointer-events-none`} />

                {/* Image Container */}
                <div className={`relative aspect-[4/3] rounded-xl sm:rounded-2xl overflow-hidden ${isDashboard ? 'mb-2' : 'mb-3'} bg-gray-50`}>
                    {(program.images && program.images.length > 0) || program.image_url ? (
                    <img
                        src={program.images?.[0] || program.image_url!}
                        alt={title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50">
                        <div className={`w-full h-full opacity-10 bg-gradient-to-br ${gradientClass}`} />
                        <GraduationCap className="absolute text-gray-300 sm:w-16 sm:h-16" size={isDashboard ? 24 : 48} />
                    </div>
                    )}

                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    {/* Type Badge */}
                    {!isDashboard && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 flex gap-1.5 sm:gap-2">
                        {program.program_type && (
                        <div className="px-2 py-1 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest bg-black/50 backdrop-blur-md text-white border border-white/20">
                            {translateProgramType(program.program_type, t)}
                        </div>
                        )}
                    </div>
                    )}

                    {/* Action Buttons */}
                    {!isDashboard && (
                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 flex gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 z-10">
                        <button
                        onClick={handleShare}
                        className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-md rounded-lg text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-indigo-500 shadow-sm transition-all border border-gray-100"
                        >
                        <Share2 size={14} className="sm:w-4 sm:h-4" />
                        </button>
                        <button
                        onClick={(e) => onToggleFavorite(e, program.id)}
                        className="p-1.5 sm:p-2 bg-white/90 backdrop-blur-md rounded-lg text-gray-400 hover:text-white hover:bg-gradient-to-r hover:from-pink-500 hover:to-rose-500 shadow-sm transition-all border border-gray-100"
                        >
                        <Star size={14} fill={program.is_favorited ? "currentColor" : "none"} className={`sm:w-4 sm:h-4 ${program.is_favorited ? "text-vibrant-pink" : ""}`} />
                        </button>
                    </div>
                    )}

                    {/* Price Badge overlay */}
                    {!isDashboard && (
                    <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 px-2 py-1 bg-white/95 backdrop-blur-md rounded-lg text-[10px] sm:text-xs font-black shadow-lg border border-white/40">
                        {program.price > 0 ? (
                            <span className={`text-transparent bg-clip-text bg-gradient-to-br ${gradientClass}`}>
                                {program.currency === 'CNY' ? '¥' : '$'}{program.price.toLocaleString()}
                            </span>
                        ) : (
                            <span className="text-emerald-600 uppercase tracking-widest">{t('education.browse.free')}</span>
                        )}
                    </div>
                    )}
                </div>

                {/* Content */}
                <div className="p-1 flex-1 flex flex-col relative z-20">
                    <TranslateWrapper 
                    text={program.title}
                    dbTranslation={language === 'zh' ? program.title_zh : null}
                    as="h3"
                    className={`${isDashboard ? 'text-xs' : 'text-sm sm:text-base'} font-black text-gray-900 leading-tight uppercase tracking-tight mb-0.5 line-clamp-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:${gradientClass} transition-all duration-300`}
                    />
                    
                    <div className="flex flex-col gap-1 mt-auto">
                        {isDashboard ? (
                           <div className="flex items-center justify-between mt-1 pt-2 border-t border-gray-50">
                               <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientClass} text-xs font-black`}>
                                   {program.price > 0 ? `${program.currency === 'CNY' ? '¥' : '$'}${program.price}` : t('common.free')}
                               </span>
                               <span className="text-[9px] text-gray-400 font-bold uppercase truncate max-w-[60px]">{program.institution_name || 'Institution'}</span>
                           </div>
                        ) : (
                            <>
                                <div className="text-[8px] sm:text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradientClass}`} />
                                    <span className="truncate">{program.institution_name || t('education.browse.institutionName')}</span>
                                </div>
                                
                                <div className="flex items-center justify-between w-full mt-2 pt-2 border-t border-gray-50">
                                    <div className="flex items-center gap-2">
                                        <div className="flex items-center gap-1 text-gray-400 font-bold text-[7px] sm:text-[8px] uppercase tracking-widest">
                                            <Clock size={8} className="text-gray-300" />
                                            <span>{program.duration_value} {program.duration_unit}</span>
                                        </div>
                                    </div>
                                    <span className="bg-gray-50 text-gray-500 px-2 py-1 rounded-md text-[8px] sm:text-[9px] font-black uppercase tracking-widest border border-gray-100 group-hover:border-gray-200 transition-colors">
                                        {translateDeliveryMode(program.delivery_mode || undefined, t) || t('education.browse.onSite')}
                                    </span>
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
