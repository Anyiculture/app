import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { adminService } from '../services/adminService';
import { auPairMatchingService } from '../services/auPairMatchingService';
import { ProfileCard } from '../components/aupair/ProfileCard';
import { BrowseFilters } from '../components/aupair/BrowseFilters';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Heart, ChevronDown, Search } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function AuPairBrowsePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'au_pair' | 'host_family' | null>(null);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [savedProfiles, setSavedProfiles] = useState<Set<string>>(new Set());
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [sortBy, setSortBy] = useState('newest');

  const [filters, setFilters] = useState({
    nationality: '',
    location_country: '',
    experience_years_min: '',
    children_count_min: '',
    has_drivers_license: '',
  });

  // 1. Check Auth & Role
  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    checkAdmin();
    determineUserRole();
  }, [user]);

  const checkAdmin = async () => {
    try {
      const isUserAdmin = await adminService.checkIsAdmin();
      setIsAdmin(isUserAdmin);
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  };

  // 2. Load Data on Change
  useEffect(() => {
    if (userRole) {
      if (activeTab === 'favorites') {
        loadSavedProfilesList();
      } else {
        loadProfiles();
        // Also load saved IDs to show heart status
        loadSavedProfileIds(); 
      }
    }
  }, [userRole, filters, activeTab, sortBy]);

  const determineUserRole = async () => {
    try {
      // Check if user is admin - default to host_family role to see Au Pairs (or allow toggle later)
      const { data: adminRole } = await supabase
        .from('admin_roles')
        .select('role')
        .eq('user_id', user!.id)
        .maybeSingle();
      
      if (adminRole) {
         setUserRole('host_family'); // Admins act as host family to browse au pairs by default
         return;
      }

      // Try getting Au Pair profile first
      const auPairProfile = await auPairMatchingService.getAuPairProfile();
      if (auPairProfile) {
        setUserRole('au_pair');
        return;
      }
      
      // Try Host Family
      const familyProfile = await auPairMatchingService.getHostFamilyProfile();
      if (familyProfile) {
        setUserRole('host_family');
        return;
      }

      // If neither, redirect to selection
      navigate('/au-pair/select-role');
    } catch (err) {
      console.error('Failed to determine role:', err);
    } finally {
      // Don't stop loading here, wait for data load
    }
  };

  const loadProfiles = async () => {
    try {
      setLoading(true);
      let data = [];
      if (userRole === 'host_family') {
        // Family looking for Au Pairs
        const filterObj: any = {};
        if (filters.nationality) filterObj.nationality = filters.nationality;
        if (filters.experience_years_min) filterObj.experience_years_min = parseInt(filters.experience_years_min);
        
        data = await auPairMatchingService.searchAuPairs(filterObj) || [];
      } else {
        // Au Pair looking for Families
        const filterObj: any = {};
        if (filters.location_country) filterObj.location_country = filters.location_country;
        if (filters.children_count_min) filterObj.children_count_min = parseInt(filters.children_count_min);
        
        data = await auPairMatchingService.searchHostFamilies(filterObj) || [];
      }

      // Client-side Sorting (since API might not support it yet)
      if (data) {
        data.sort((a: any, b: any) => {
           const dateA = new Date(a.created_at || 0).getTime();
           const dateB = new Date(b.created_at || 0).getTime();
           if (sortBy === 'newest') return dateB - dateA;
           if (sortBy === 'oldest') return dateA - dateB;
           return 0;
        });
      }
      
      setProfiles(data);
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load just the IDs of saved profiles to mark them in the main list
  const loadSavedProfileIds = async () => {
    try {
      const saved = await auPairMatchingService.getSavedProfiles();
      setSavedProfiles(new Set(saved.map((s: any) => s.profile_id)));
    } catch (err) {
      console.error('Failed to load saved IDs:', err);
    }
  };

  // Load full profile objects for favorites tab
  const loadSavedProfilesList = async () => {
    try {
      setLoading(true);
      const saved = await auPairMatchingService.getSavedProfiles();
      
      // FALLBACK: Load all and filter client side
      if (userRole === 'host_family') {
          const all = await auPairMatchingService.searchAuPairs({});
          const savedIds = new Set(saved.map((s: any) => s.profile_id));
          setProfiles(all.filter((p: any) => savedIds.has(p.id)));
      } else {
          const all = await auPairMatchingService.searchHostFamilies({});
          const savedIds = new Set(saved.map((s: any) => s.profile_id));
          setProfiles(all.filter((p: any) => savedIds.has(p.user_id || p.id)));
      }
      
    } catch (err) {
       console.error(err);
    } finally {
       setLoading(false);
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, profileId: string) => {
    e.preventDefault(); 
    try {
      if (savedProfiles.has(profileId)) {
        // Remove
        const saved = await auPairMatchingService.getSavedProfiles();
        const savedRecord = saved.find((s: any) => s.profile_id === profileId);
        if (savedRecord) {
             await auPairMatchingService.removeSavedProfile(savedRecord.id);
             const next = new Set(savedProfiles);
             next.delete(profileId);
             setSavedProfiles(next);
             
             // If in favorites tab, remove from view immediately
             if (activeTab === 'favorites') {
                 setProfiles(prev => prev.filter(p => (p.id || p.user_id) !== profileId));
             }
        }
      } else {
        // Add
        const targetType = userRole === 'host_family' ? 'au_pair' : 'host_family';
        await auPairMatchingService.saveProfile(targetType, profileId);
        const next = new Set(savedProfiles);
        next.add(profileId);
        setSavedProfiles(next);
      }
    } catch (err) {
      console.error('Failed toggle favorite:', err);
    }
  };

  const handleViewProfile = (id: string) => {
    navigate(`/au-pair/profile/${id}`); // Assuming existing route
  };

  const handleResetFilters = () => {
    setFilters({
      nationality: '',
      location_country: '',
      experience_years_min: '',
      children_count_min: '',
      has_drivers_license: '',
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      <div className="max-w-[1600px] mx-auto px-6 py-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <div className="inline-block px-4 py-1.5 bg-blue-500/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-blue-600 mb-4">
              {userRole === 'host_family' ? t('auPair.browse.candidateSearch') : t('auPair.browse.familySearch')}
            </div>
            <h1 className="text-5xl font-black text-gray-900 uppercase tracking-tight">
              {userRole === 'host_family' ? t('auPair.browse.findCandidates') : t('auPair.browse.browseFamilies')}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setUserRole(prev => prev === 'host_family' ? 'au_pair' : 'host_family')}
                className="px-6 py-3 bg-purple-500/10 backdrop-blur-md border border-purple-200 rounded-2xl flex items-center gap-3 text-purple-600"
              >
                <RefreshCw size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {userRole === 'host_family' ? t('auPair.browse.viewAsAuPair') : t('auPair.browse.viewAsFamily')}
                </span>
              </motion.button>
            )}
            {user && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(activeTab === 'all' ? 'favorites' : 'all')}
                className={`px-6 py-3 backdrop-blur-md border rounded-2xl flex items-center gap-3 transition-all duration-500 ${activeTab === 'favorites' ? 'bg-pink-500 border-pink-500 text-white shadow-xl shadow-pink-500/20' : 'bg-white/40 border-white/60 text-gray-600'}`}
              >
                <Heart size={16} className={activeTab === 'favorites' ? 'fill-current' : ''} />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  {t('auPair.browse.favorites')}
                </span>
              </motion.button>
            )}
          </div>
        </motion.div>

        <div className="flex flex-col gap-12">
          {/* Filters Bar */}
          <GlassCard className="p-8 border-white/60 shadow-xl rounded-[2.5rem]">
            <BrowseFilters 
              userRole={userRole || ''} 
              filters={filters} 
              onChange={(k, v) => setFilters(prev => ({ ...prev, [k]: v }))}
              onReset={handleResetFilters}
            />
          </GlassCard>

          <div className="w-full">
            {/* Sort / Results Header */}
            <div className="flex items-center justify-between mb-8 px-4">
               <div className="flex items-end gap-3">
                 <span className="text-4xl font-black text-gray-900 leading-none">
                    {loading ? '...' : profiles.length}
                 </span>
                 <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">
                    {t('auPair.browse.results')} {activeTab === 'favorites' && `(${t('auPair.browse.favorites')})`}
                 </span>
               </div>

               <div className="flex items-center gap-6">
                 <div className="flex items-center gap-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">
                      {t('auPair.browse.sortBy')}
                    </label>
                    <div className="relative group">
                       <select 
                         value={sortBy}
                         onChange={(e) => setSortBy(e.target.value)}
                         className="appearance-none bg-gray-50/50 backdrop-blur-md px-6 py-2.5 pr-10 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-900 cursor-pointer focus:outline-none border border-gray-100 hover:border-blue-200 transition-all"
                       >
                         <option value="newest">{t('auPair.browse.newestFirst')}</option>
                         <option value="oldest">{t('auPair.browse.oldestFirst')}</option>
                       </select>
                       <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                    </div>
                 </div>
               </div>
            </div> 

            {/* Grid */}
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                >
                   {Array.from({ length: 12 }).map((_, i) => (
                     <GlassCard key={i} className="p-3 aspect-[3/4] animate-pulse border-gray-100">
                        <div className="w-full h-2/3 bg-gray-50 rounded-2xl mb-4" />
                        <div className="h-4 bg-gray-50 rounded-lg w-3/4 mb-2" />
                        <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
                     </GlassCard>
                   ))}
                </motion.div>
              ) : profiles.length === 0 ? (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center justify-center py-32 text-center"
                >
                  <div className="w-32 h-32 bg-gray-50 rounded-[3rem] flex items-center justify-center mb-8 border border-gray-100 shadow-inner">
                     <Search size={48} className="text-gray-200" />
                  </div>
                  <h3 className="text-3xl font-black text-gray-900 mb-4 uppercase tracking-tight">
                    {t('auPair.browse.noProfiles')}
                  </h3>
                  <p className="text-[12px] text-gray-400 font-bold uppercase tracking-widest mb-10 max-w-sm leading-relaxed">
                    {t('auPair.browse.tryAdjusting')}
                  </p>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleResetFilters}
                    className="px-10 py-4 bg-gray-900 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-gray-800 transition-all"
                  >
                    {t('auPair.browse.clearAll')}
                  </motion.button>
                </motion.div>
              ) : (
                <motion.div 
                  key="grid"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6"
                >
                   {profiles.map((profile, index) => (
                     <motion.div
                       key={profile.id || profile.user_id}
                       initial={{ opacity: 0, y: 20 }}
                       animate={{ opacity: 1, y: 0 }}
                       transition={{ delay: index * 0.05 }}
                     >
                       <ProfileCard
                         profile={profile}
                         userRole={userRole || 'au_pair'}
                         isFavorited={savedProfiles.has(profile.id || profile.user_id)}
                         onToggleFavorite={handleToggleFavorite}
                         onView={handleViewProfile}
                       />
                     </motion.div>
                   ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

