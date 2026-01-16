import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { auPairMatchingService, AuPairProfile } from '../services/auPairMatchingService';
import { auPairService, UserSubscriptionStatus } from '../services/auPairService';
import { adminService } from '../services/adminService';
import { ProfileCard } from '../components/aupair/ProfileCard';
import { Button } from '../components/ui/Button';
import { Edit, Search, Briefcase, ChevronDown, Filter, Sparkles, Star, ArrowLeft } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { AuPairOnboarding } from '../components/AuPairOnboarding';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

export function BrowseAuPairsPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [auPairs, setAuPairs] = useState<AuPairProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedProfiles, setSavedProfiles] = useState<string[]>([]);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<UserSubscriptionStatus | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    nationality: 'all',
    childcare_experience_years: '',
    languages: 'all',
  });

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    checkOnboarding();
  }, [user]);

  const checkOnboarding = async () => {
    try {
      // Check if user is admin - bypass role checks
      const isAdmin = await adminService.checkIsAdmin();
      if (isAdmin) return;

      const auPair = await auPairMatchingService.getAuPairProfile();
      
      // If user IS an au pair, they shouldn't see this page
      if (auPair) {
          navigate('/families/browse');
          return;
      }

      const family = await auPairMatchingService.getHostFamilyProfile();
      if (!family) {
        navigate('/au-pair/select-role');
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadAuPairs();
      loadSavedProfiles();
      loadSubscriptionStatus();
    }
  }, [filters, user]);

  const loadSubscriptionStatus = async () => {
    try {
      const status = await auPairService.getUserSubscriptionStatus();
      setSubscriptionStatus(status);
      const isUserAdmin = await adminService.checkIsAdmin();
      setIsAdmin(isUserAdmin);
    } catch (error) {
      console.error('Error loading subscription status:', error);
    }
  };

  const loadAuPairs = async () => {
    try {
      setLoading(true);
      const data = await auPairMatchingService.searchAuPairs(filters);
      setAuPairs(data || []);
    } catch (error) {
      setAuPairs([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSavedProfiles = async () => {
    try {
      const saved = await auPairMatchingService.getSavedProfiles();
      setSavedProfiles(saved.map((s: any) => s.profile_id));
    } catch (error) {
      console.error('Error loading saved profiles:', error);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, profileId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (savedProfiles.includes(profileId)) {
      // Remove from saved
      try {
        const saved = await auPairMatchingService.getSavedProfiles();
        const savedItem = saved.find((s: any) => s.profile_id === profileId);
        if (savedItem) {
          await auPairMatchingService.removeSavedProfile(savedItem.id);
          setSavedProfiles(prev => prev.filter(id => id !== profileId));
        }
      } catch (error) {
        console.error('Error removing saved profile:', error);
      }
    } else {
      // Add to saved
      try {
        await auPairMatchingService.saveProfile('au_pair', profileId);
        setSavedProfiles(prev => [...prev, profileId]);
      } catch (error) {
        console.error('Error saving profile:', error);
      }
    }
  };

  const handleViewProfile = (profileId: string) => {
    navigate(`/au-pair/profile/${profileId}`);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      nationality: 'all',
      childcare_experience_years: '',
      languages: 'all',
    });
  };

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm flex items-center h-14 sm:h-20">
        <div className="max-w-[100rem] mx-auto w-full px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard')}
              className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-vibrant-purple transition-colors rounded-xl bg-white/40 border border-white/60 shadow-sm"
            >
              <ArrowLeft size={16} className="sm:hidden" />
              <ArrowLeft size={20} className="hidden sm:block" />
            </motion.button>
            <div>
              <h1 className="text-sm sm:text-2xl font-black text-gray-900 tracking-tight uppercase">
                {t('auPair.browseAuPairs')}
              </h1>
              <div className="flex items-center gap-1.5 mt-0 sm:mt-0.5">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-vibrant-purple animate-pulse" />
                <p className="text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t('auPair.browse.discoverNextMember')}
                </p>
              </div>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowEditProfile(true)}
            className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2.5 bg-white border border-gray-100 rounded-lg sm:rounded-xl text-[9px] sm:text-[11px] font-black uppercase tracking-widest text-gray-900 shadow-sm hover:shadow-md hover:border-vibrant-purple/30 transition-all"
          >
            <Edit size={12} className="sm:hidden" />
            <Edit size={16} className="hidden sm:block" />
            <span className="hidden xs:inline">{t('common.editProfile') || 'Edit Profile'}</span>
            <span className="xs:hidden">{t('common.edit') || 'Edit'}</span>
          </motion.button>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-3 sm:px-6 py-3 sm:py-8 relative z-10">

        {/* Edit Profile Modal */}
        <Modal
          isOpen={showEditProfile}
          onClose={() => setShowEditProfile(false)}
          title={t('common.editProfile') || 'Edit Profile'}
          size="xl"
        >
          <AuPairOnboarding 
            userId={user?.id || ''}
            mode="edit"
            onComplete={() => {
              setShowEditProfile(false);
              // Optionally reload data or show success message
            }}
          />
        </Modal>
        
         {/* Filters Bar */}
         
         {/* Mobile Filter Toggle */}
         <div className="md:hidden mb-3">
            <div className="flex gap-2">
              <div className="relative flex-1 group">
                 <GlassCard className="relative bg-white/40 border-white/60 p-1 h-full flex items-center rounded-xl">
                   <Search className="absolute left-3 text-vibrant-purple" size={14} />
                   <input
                       type="text"
                       placeholder={t('auPair.browse.searchAuPairsPlaceholder')}
                       value={filters.search}
                       onChange={(e) => handleFilterChange('search', e.target.value)}
                       className="w-full pl-8 pr-2 py-1.5 bg-transparent border-none focus:ring-0 text-[10px] font-bold placeholder:text-gray-400 uppercase tracking-widest"
                   />
                 </GlassCard>
              </div>
              <button
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className={`p-2.5 rounded-xl border transition-all shadow-sm ${showMobileFilters ? 'bg-vibrant-purple text-white border-vibrant-purple' : 'bg-white border-gray-100 text-gray-500 hover:border-vibrant-purple/50'}`}
              >
                <Filter size={18} />
              </button>
            </div>
         </div>

         <div className={`grid grid-cols-1 md:grid-cols-12 gap-2 sm:gap-4 mb-3 sm:mb-12 ${showMobileFilters ? 'block' : 'hidden md:grid'}`}>
             {/* Search */}
             <div className="hidden md:block md:col-span-6 relative group">
                 <div className="absolute inset-0 bg-vibrant-purple/5 blur-xl group-hover:bg-vibrant-purple/10 transition-colors rounded-3xl" />
                 <GlassCard className="relative bg-white/40 border-white/60 p-1.5 h-full">
                   <div className="relative h-full">
                     <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-vibrant-purple" size={16} />
                     <input
                         type="text"
                         placeholder={t('auPair.browse.searchAuPairsPlaceholder')}
                         value={filters.search}
                         onChange={(e) => handleFilterChange('search', e.target.value)}
                         className="w-full pl-12 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm font-bold placeholder:text-gray-400 uppercase tracking-widest"
                     />
                   </div>
                 </GlassCard>
             </div>
 
             {/* Experience Filter */}
              <div className="md:col-span-4 relative group">
                 <GlassCard className="bg-white/40 border-white/60 p-1 h-full sm:p-1.5 rounded-xl sm:rounded-2xl">
                   <div className="relative h-full flex items-center">
                     <Briefcase className="absolute left-3 sm:left-4 text-vibrant-purple" size={16} />
                     <select
                         value={filters.childcare_experience_years}
                         onChange={(e) => handleFilterChange('childcare_experience_years', e.target.value)}
                         className="w-full pl-10 sm:pl-12 pr-8 sm:pr-10 py-2 sm:py-3 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest appearance-none cursor-pointer"
                     >
                         <option value="">{t('auPair.browse.filterExperience')}</option>
                         <option value="1">1+ {t('common.years')}</option>
                         <option value="2">2+ {t('common.years')}</option>
                         <option value="3">3+ {t('common.years')}</option>
                         <option value="5">5+ {t('common.years')}</option>
                     </select>
                     <ChevronDown size={14} className="absolute right-4 pointer-events-none text-gray-400" />
                   </div>
                 </GlassCard>
             </div>
 
              {/* Reset Button */}
              <div className="md:col-span-2 flex items-center justify-end">
                {(filters.search || filters.nationality !== 'all' || filters.childcare_experience_years) ? (
                   <motion.button 
                       whileHover={{ scale: 1.05 }}
                       whileTap={{ scale: 0.95 }}
                       onClick={handleResetFilters}
                       className="flex items-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-white border border-gray-100 rounded-xl sm:rounded-2xl text-[10px] font-black uppercase tracking-widest text-vibrant-pink hover:bg-vibrant-pink hover:text-white transition-all shadow-sm group/btn w-full sm:w-auto justify-center"
                   >
                       <Filter size={14} className="group-hover/btn:rotate-180 transition-transform duration-500" />
                       {t('marketplace.clearAll')}
                   </motion.button>
                ) : (
                  <div className="flex items-center gap-3 px-6 py-3 text-[10px] font-black uppercase tracking-widest text-vibrant-purple/40">
                    <Sparkles size={14} />
                    <span>{t('auPair.browse.filterExperts')}</span>
                  </div>
                )}
              </div>
         </div>

         {/* Results Grid */}
         <div className="flex flex-col gap-8">
             <div className="flex items-center justify-between">
               <div className="flex items-center gap-3 bg-white/40 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/60 shadow-sm">
                 <div className="w-2 h-2 rounded-full bg-vibrant-purple" />
                 <div className="text-[10px] font-black text-gray-900 uppercase tracking-widest">
                   {loading ? t('common.loading') : t('auPair.browse.resultsWithCount', { count: auPairs.length })}
                 </div>
               </div>
             </div>
 
             <AnimatePresence mode="wait">
               {!loading && auPairs.length === 0 ? (
                 <motion.div 
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="flex flex-col items-center justify-center py-32 bg-white/30 backdrop-blur-xl rounded-[3rem] border border-dashed border-white/60 text-center shadow-xl"
                 >
                   <div className="w-24 h-24 bg-white/50 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl">
                     <Star size={48} className="text-gray-200" />
                   </div>
                   <h3 className="text-2xl font-black text-gray-900 mb-4 uppercase tracking-tight">{t('auPair.browse.noAuPairsFound')}</h3>
                   <p className="text-gray-500 font-medium mb-10 max-w-md mx-auto leading-relaxed">{t('auPair.browse.tryAdjusting')}</p>
                   <Button variant="outline" className="px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest" onClick={handleResetFilters}>
                     {t('marketplace.clearAll')}
                   </Button>
                 </motion.div>
               ) : (
                 <motion.div 
                   layout
                   className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-8"
                 >
                   {loading ? (
                     Array.from({ length: 10 }).map((_, i) => (
                       <GlassCard key={i} className="p-1.5 h-[400px] animate-pulse border-white/20">
                         <div className="aspect-square bg-white/20 rounded-2xl mb-4"></div>
                         <div className="p-4 space-y-4">
                           <div className="h-6 bg-white/20 rounded-lg w-3/4"></div>
                           <div className="h-4 bg-white/20 rounded-lg w-1/2"></div>
                           <div className="space-y-2 mt-8">
                             <div className="h-3 bg-white/20 rounded-lg w-full"></div>
                             <div className="h-3 bg-white/20 rounded-lg w-2/3"></div>
                           </div>
                         </div>
                       </GlassCard>
                     ))
                   ) : (
                     auPairs.map(auPair => (
                       <motion.div
                         key={auPair.id}
                         layout
                         initial={{ opacity: 0, scale: 0.9 }}
                         animate={{ opacity: 1, scale: 1 }}
                         transition={{ duration: 0.5 }}
                       >
                         <ProfileCard
                           profile={auPair}
                           userRole="host_family"
                           isFavorited={savedProfiles.includes(auPair.id)}
                           onToggleFavorite={handleToggleFavorite}
                           onView={handleViewProfile}
                           isRestricted={!isAdmin && subscriptionStatus?.subscriptionStatus !== 'premium'}
                         />
                       </motion.div>
                     ))
                   )}
                 </motion.div>
               )}
             </AnimatePresence>
         </div>
      </div>
    </div>
  );
}
