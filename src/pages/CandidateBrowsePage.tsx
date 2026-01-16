
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../contexts/AuthContext';
import { candidateService } from '../services/jobsService';
import { Button } from '../components/ui/Button';
import { useI18n } from '../contexts/I18nContext';
import { Search, Filter, ArrowLeft, Users, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
// import { CandidateCard } from '../components/jobs/CandidateCard';

interface CandidateProfile {
  id?: string;
  user_id?: string;
  full_name?: string;
  avatar_url?: string;
  role?: string;
  location?: string;
  subscription_status?: string;
  created_at?: string;
  // Add other fields as needed
}

export function CandidateBrowsePage() {
  // const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<CandidateProfile[]>([]);
  const [savedProfiles] = useState<Set<string>>(new Set());
  
  const [activeTab] = useState<'all' | 'favorites'>('all');
  const [sortBy] = useState('newest');

  const [filters] = useState({
    skills: [] as string[],
    availability: '',
    current_location_country: '',
  });

  // Load Data on Change
  useEffect(() => {
    const loadProfiles = async () => {
      try {
        setLoading(true);
        const data = await candidateService.searchCandidates(filters) || [];
  
        // Client-side Sorting
        if (data) {
          data.sort((a: CandidateProfile, b: CandidateProfile) => {
             const dateA = new Date(a.created_at || 0).getTime();
             const dateB = new Date(b.created_at || 0).getTime();
             if (sortBy === 'newest') return dateB - dateA;
             if (sortBy === 'oldest') return dateA - dateB;
             return 0;
          });
        }
        
        setProfiles(data);
      } catch (err) {
        console.error('Failed to load candidates:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProfiles();
  }, [filters, activeTab, sortBy]);

  const handleViewProfile = (id: string) => {
    navigate(`/candidate/${id}`); // We might need to create this route or use a modal
  };

  return (
    <div className="min-h-screen bg-[#fafafa]">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-[#fafafa]/80 backdrop-blur-xl border-b border-gray-200/50 shadow-sm flex items-center h-14 sm:h-20">
        <div className="max-w-[1600px] mx-auto w-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-vibrant-purple transition-colors rounded-xl bg-white/60 border border-white/60 shadow-sm"
            >
              <ArrowLeft size={16} className="sm:hidden" />
              <ArrowLeft size={20} className="hidden sm:block" />
            </motion.button>
            <div>
              <h1 className="text-sm sm:text-2xl font-black text-gray-900 tracking-tight uppercase">
                {t('candidates.title')}
              </h1>
              <div className="flex items-center gap-1.5 mt-0 sm:mt-0.5">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-vibrant-purple animate-pulse" />
                <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t('candidates.subtitle')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-8">
               <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-gray-100 flex flex-col justify-between h-24 sm:h-40 relative overflow-hidden group shadow-lg shadow-gray-200/40">
                  <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-500">
                     <Search size={40} className="text-gray-900 sm:hidden" />
                     <Search size={80} className="text-gray-900 hidden sm:block" />
                  </div>
                  <div className="relative z-10">
                     <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gray-50 flex items-center justify-center mb-1 sm:mb-4">
                        <Search size={14} className="text-gray-900 sm:hidden" />
                        <Search size={20} className="text-gray-900 hidden sm:block" />
                     </div>
                     <p className="text-xl sm:text-4xl font-black text-gray-900 tracking-tight mb-0 sm:mb-1">{profiles.length}</p>
                     <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest truncate">{t('candidates.stats.total')}</p>
                  </div>
               </div>

               <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl sm:rounded-3xl p-3 sm:p-6 text-white flex flex-col justify-between h-24 sm:h-40 relative overflow-hidden group shadow-xl shadow-blue-500/20">
                  <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-20 group-hover:opacity-30 transition-opacity transform group-hover:scale-110 duration-500">
                     <Users size={40} className="sm:hidden" />
                     <Users size={80} className="hidden sm:block" />
                  </div>
                  <div className="relative z-10">
                     <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-white/20 flex items-center justify-center mb-1 sm:mb-4 backdrop-blur-sm">
                        <Users size={14} className="text-white sm:hidden" />
                        <Users size={20} className="text-white hidden sm:block" />
                     </div>
                     <p className="text-xl sm:text-4xl font-black tracking-tight mb-0 sm:mb-1">{profiles.length > 5 ? 5 : profiles.length}</p>
                     <p className="text-[8px] sm:text-xs font-bold text-white/80 uppercase tracking-widest truncate">{t('candidates.stats.new')}</p>
                  </div>
               </div>

               <div className="bg-white rounded-2xl sm:rounded-3xl p-3 sm:p-6 border border-gray-100 flex flex-col justify-between h-24 sm:h-40 relative overflow-hidden group shadow-lg shadow-gray-200/40">
                  <div className="absolute top-0 right-0 p-2 sm:p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity transform group-hover:scale-110 duration-500">
                     <Filter size={40} className="text-vibrant-purple sm:hidden" />
                     <Filter size={80} className="text-vibrant-purple hidden sm:block" />
                  </div>
                  <div className="relative z-10">
                     <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-purple-50 flex items-center justify-center mb-1 sm:mb-4">
                        <Filter size={14} className="text-vibrant-purple sm:hidden" />
                        <Filter size={20} className="text-vibrant-purple hidden sm:block" />
                     </div>
                     <p className="text-xl sm:text-4xl font-black text-gray-900 tracking-tight mb-0 sm:mb-1">{savedProfiles.size}</p>
                     <p className="text-[8px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest truncate">{t('candidates.stats.saved')}</p>
                  </div>
               </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
              <div className="flex-1 w-full min-w-0">
                 {/* Visual Filters / Search Bar placeholder */}
                 <div className="bg-white p-2 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm mb-4 sm:mb-6 flex gap-2 sm:gap-4 items-center">
                     <div className="flex-1 relative">
                         <input 
                             type="text" 
                             placeholder={t('candidates.searchPlaceholder')}
                             className="w-full pl-9 sm:pl-12 pr-4 py-2 sm:py-3 bg-gray-50 border-none rounded-xl sm:rounded-2xl text-[11px] sm:text-sm font-medium focus:ring-2 focus:ring-vibrant-purple/20 outline-none transition-all placeholder:text-gray-400"
                         />
                         <Search className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400 absolute left-3 sm:left-4 top-1/2 -translate-y-1/2" />
                     </div>
                      <Button variant="outline" className="flex items-center gap-1.5 sm:gap-2 !rounded-xl sm:!rounded-2xl !py-2 sm:!py-3 !px-4 sm:!px-6 border-gray-200 hover:border-vibrant-purple/50 hover:bg-vibrant-purple/5 hover:text-vibrant-purple text-[10px] sm:text-sm font-black tracking-widest uppercase">
                         <Filter size={14} className="sm:w-4 sm:h-4" /> <span className="hidden xs:inline">{t('candidates.filters')}</span>
                         <span className="xs:hidden">{t('common.filter') || 'Filter'}</span>
                      </Button>
                 </div>
 
                 {/* List View */}
                 <div className="bg-white rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                    {loading ? (
                       <div className="divide-y divide-gray-50">
                          {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 sm:gap-5 p-3 sm:p-5 animate-pulse">
                               <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-100 rounded-xl sm:rounded-2xl"></div>
                               <div className="flex-1">
                                  <div className="h-3 sm:h-4 bg-gray-100 rounded w-1/3 mb-1 sm:mb-2"></div>
                                  <div className="h-2 sm:h-3 bg-gray-100 rounded w-1/4"></div>
                               </div>
                               <div className="w-8 h-8 bg-gray-100 rounded-full"></div>
                            </div>
                          ))}
                       </div>
                    ) : profiles.length === 0 ? (
                       <div className="flex flex-col items-center justify-center py-20 text-center">
                          <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mb-6">
                             <Search size={32} className="text-gray-300" />
                          </div>
                          <h3 className="text-xl font-black text-gray-900 mb-2">{t('candidates.noResults.title')}</h3>
                          <p className="text-gray-500 max-w-md mx-auto font-medium">{t('candidates.noResults.message')}</p>
                       </div>
                    ) : (
                       <div className="divide-y divide-gray-50">
                          {profiles.map(profile => (
                             <div
                               key={profile.id || profile.user_id}
                               onClick={() => handleViewProfile((profile.id || profile.user_id) as string)}
                               className="group flex items-center gap-3 sm:gap-5 p-3 sm:p-5 hover:bg-gray-50/80 transition-all cursor-pointer"
                             >
                                {/* Avatar */}
                                <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-gray-200 overflow-hidden shadow-sm relative shrink-0">
                                   {profile.avatar_url ? (
                                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                                   ) : (
                                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                                         <Users size={24} />
                                      </div>
                                   )}
                                   {/* Status Indicator */}
                                   <div className="absolute top-1 right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                   <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1">
                                      <h3 className="text-xs sm:text-base font-bold text-gray-900 truncate">{profile.full_name || t('common.anonymous')}</h3>
                                      {profile.subscription_status === 'premium' && (
                                         <span className="px-2 py-0.5 bg-gradient-to-r from-amber-200 to-amber-400 text-amber-900 text-[10px] font-black uppercase tracking-wider rounded-full">{t('candidates.pro')}</span>
                                      )}
                                   </div>
                                   <p className="text-[9px] sm:text-xs text-gray-500 font-medium flex items-center gap-1.5 sm:gap-2 truncate">
                                      <span className="truncate">{profile.role || t('common.candidate')}</span>
                                      <span className="w-1 h-1 rounded-full bg-gray-300 shrink-0" />
                                      <span className="truncate">{profile.location || t('common.locationHidden')}</span>
                                   </p>
                                </div>
                                
                                {/* Arrow */}
                                <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-vibrant-purple group-hover:text-white transition-all shadow-sm shrink-0">
                                   <ArrowRight size={16} className="sm:w-5 sm:h-5" />
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                 </div>
              </div>
            </div>
      </div>
    </div>
  );
}
