import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Heart, Search, ChevronDown, List, ShoppingBag, Sparkles, ArrowLeft } from 'lucide-react';
import {
  marketplaceService,
  MarketplaceItem,
} from '../services/marketplaceService';
import { calculateDistance, getCurrentLocation, formatDistance, Coordinates } from '../utils/geolocation';
import { Button } from '../components/ui/Button';
import { MarketplaceFilters } from '../components/marketplace/MarketplaceFilters';
import { MarketplaceCard } from '../components/marketplace/MarketplaceCard';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { motion, AnimatePresence } from 'framer-motion';

export function MarketplacePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Data State
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState<Coordinates | null>(null);
  
  // Filter State
  const [filters, setFilters] = useState({
    category: 'all',
    subcategory: 'all',
    city: 'all',
    minPrice: '',
    maxPrice: '',
    condition: 'all',
    distance: 'all',
    search: ''
  });

  const [sortBy, setSortBy] = useState('newest');
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');

  // Initialize Location
  useEffect(() => {
    handleUpdateLocation();
  }, []);

  const handleUpdateLocation = async () => {
    try {
      const loc = await getCurrentLocation();
      setUserLocation(loc);
    } catch (err) {
      console.log('Location access denied or error:', err);
    }
  };

  // Load Items
  useEffect(() => {
    loadItems();
  }, [filters, activeTab, sortBy]); // Reload when filters change

  const loadItems = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'favorites') {
        if (!user) {
          setItems([]);
          return;
        }
        const data = await marketplaceService.getFavorites();
        setItems(data || []);
      } else {
        // Build API filters
        const apiFilters: Record<string, string | number | undefined> = {
          minPrice: filters.minPrice ? parseFloat(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? parseFloat(filters.maxPrice) : undefined,
          search: filters.search || undefined,
        };

        if (filters.category !== 'all') apiFilters.category = filters.category;
        if (filters.subcategory !== 'all') apiFilters.subcategory = filters.subcategory;
        
        // Handle location filtering
        // Only apply city filter if explicitly selected by user, not just 'all'
        if (filters.city !== 'all') {
             apiFilters.location_city = filters.city;
        }

        let data = await marketplaceService.getItems(apiFilters);
        
        // Client-side filtering
        if (data) {
           // Distance Filter
           if (filters.distance !== 'all' && userLocation) {
            const maxDist = parseFloat(filters.distance);
            data = data.filter(item => {
              if (!item.latitude || !item.longitude || typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return false;
              try {
                const dist = calculateDistance(
                  { latitude: userLocation.latitude, longitude: userLocation.longitude },
                  { latitude: item.latitude, longitude: item.longitude }
                );
                return dist <= maxDist;
              } catch (error) {
                console.error('Distance calculation error:', error);
                return false;
              }
            });
          }

          // Condition Filter
          if (filters.condition !== 'all') {
             // Assuming condition is stored as 'new' or 'used' lowercase
             data = data.filter(item => item.condition?.toLowerCase() === filters.condition);
          }

          // Sorting
          data.sort((a, b) => {
             if (sortBy === 'price_asc') return a.price - b.price;
             if (sortBy === 'price_desc') return b.price - a.price;
             // Default newest
             return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          });
        }

        setItems(data || []);
      }
    } catch (error: unknown) {
      console.error('Error loading marketplace items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      subcategory: 'all',
      city: 'all',
      minPrice: '',
      maxPrice: '',
      condition: 'all',
      distance: 'all',
      search: ''
    });
  };

  const handleToggleFavorite = async (e: React.MouseEvent, itemId: string) => {
    e.preventDefault();
    if (!user) {
      navigate('/signin');
      return;
    }
    try {
      const isFavorited = await marketplaceService.toggleFavorite(itemId);
      setItems(items.map(item =>
        item.id === itemId ? { ...item, is_favorited: isFavorited } : item
      ));
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const getItemDistance = (item: MarketplaceItem) => {
    if (!userLocation || !item.latitude || !item.longitude || typeof item.latitude !== 'number' || typeof item.longitude !== 'number') return null;
    try {
      const km = calculateDistance(
        { latitude: userLocation.latitude, longitude: userLocation.longitude },
        { latitude: item.latitude, longitude: item.longitude }
      );
      return formatDistance(km);
    } catch (error) {
      console.error('Distance calculation error:', error);
      return null;
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm hidden md:block">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-vibrant-purple transition-colors rounded-xl bg-white/40 border border-white/60 shadow-sm"
            >
              <ArrowLeft size={20} />
            </motion.button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                {t('nav.marketplace')}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Community Listings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 py-0 md:py-6 relative z-10">

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          
          {/* Main Content - Full Width with Horizontal Filters */}
          <div className="flex-1 w-full min-w-0">
             
             {/* Horizontal Filters with Right Actions */}
             <MarketplaceFilters 
               filters={filters}
               onFilterChange={handleFilterChange}
               onReset={handleResetFilters}
               userLocation={userLocation ? { lat: userLocation.latitude, lng: userLocation.longitude } : null}
               onUpdateLocation={handleUpdateLocation}
               resultsCount={items.length}
               rightActions={
                 <>
                  {user && (
                    <>
                      <Button
                        variant="outline"
                        onClick={() => navigate('/marketplace/my-listings')}
                        className="px-3 py-2 text-sm rounded-full"
                      >
                        <List size={16} />
                        <span className="ml-1.5 hidden md:inline">{t('marketplace.myListings')}</span>
                      </Button>
                      <Button
                        variant={activeTab === 'favorites' ? 'primary' : 'outline'}
                        onClick={() => setActiveTab(activeTab === 'all' ? 'favorites' : 'all')}
                        className="px-3 py-2 text-sm rounded-full"
                      >
                        <Heart size={16} className={activeTab === 'favorites' ? 'fill-current' : ''} />
                        <span className="ml-1.5 hidden md:inline">{t('marketplace.favorites')}</span>
                      </Button>
                    </>
                  )}
                  <Button 
                    onClick={() => navigate('/marketplace/post')} 
                    className="px-4 py-2 text-sm rounded-full shadow-sm bg-gray-900 text-white hover:bg-gray-800"
                  >
                    <Plus size={16} />
                    <span className="ml-1.5 hidden md:inline">{t('marketplace.postItem')}</span>
                  </Button>
                 </>
               }
             />

             {/* Sort / Results Header */}
             <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-4">
               <div className="flex items-center gap-4">
                 <div className="w-14 h-14 rounded-2xl bg-white/80 border border-white/60 shadow-xl flex items-center justify-center text-vibrant-purple">
                   <ShoppingBag size={28} />
                 </div>
                 <div>
                   <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                     {loading ? t('common.loading') : `${items.length} ${t('common.results')}`}
                   </h2>
                   {!loading && (filters.minPrice || filters.category !== 'all' || filters.city !== 'all') && (
                     <div className="flex items-center gap-2 mt-1">
                       <Sparkles size={12} className="text-vibrant-purple" />
                       <p className="text-[10px] font-black text-vibrant-purple uppercase tracking-widest">
                         {t('common.for')} "{filters.category !== 'all' ? filters.category : t('marketplace.allCategories')}"
                       </p>
                     </div>
                   )}
                 </div>
               </div>

               <div className="flex items-center gap-4">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden sm:block">
                   {t('marketplace.sortBy')}
                 </p>
                 <div className="w-52 relative group">
                   <div className="absolute inset-0 bg-vibrant-purple/5 blur-xl group-hover:bg-vibrant-purple/10 transition-all opacity-0 group-hover:opacity-100" />
                   <div className="relative">
                      <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="w-full appearance-none cursor-pointer px-5 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-widest transition-all outline-none backdrop-blur-md bg-white/40 border-white/60 text-gray-700 hover:border-vibrant-purple/20 shadow-sm"
                      >
                        <option value="newest">{t('marketplace.newestFirst')}</option>
                        <option value="price_asc">{t('marketplace.priceLowToHigh')}</option>
                        <option value="price_desc">{t('marketplace.priceHighToLow')}</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400" />
                   </div>
                 </div>
               </div>
             </div> 

             {/* Listings Grid */}
             {!loading && items.length === 0 ? (
               <GlassCard className="py-12 border-dashed border-gray-200 bg-white/30 backdrop-blur-md">
                 <div className="text-center">
                   <div className="w-24 h-24 bg-white border border-gray-100 rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 text-gray-300">
                     <Search size={40} />
                   </div>
                   <h3 className="text-gray-900 text-3xl font-black uppercase tracking-tight mb-4">{t('marketplace.noItemsFound')}</h3>
                   <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium text-lg">{t('marketplace.noItemsDescription')}</p>
                   <Button 
                     variant="outline" 
                     className="px-10 py-4 !rounded-2xl"
                     onClick={handleResetFilters}
                   >
                     {t('marketplace.clearAll')}
                   </Button>
                 </div>
               </GlassCard>
             ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                {loading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <GlassCard key={i} className="h-64 animate-pulse p-3 border-white/20">
                      <div className="w-full aspect-[4/3] bg-white/20 rounded-2xl mb-6" />
                      <div className="h-6 bg-white/20 rounded-lg w-3/4 mb-4" />
                      <div className="h-4 bg-white/10 rounded-lg w-1/2" />
                    </GlassCard>
                  ))
                ) : (
                  <AnimatePresence mode="popLayout">
                    {items.map(item => (
                      <motion.div
                        key={item.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                      >
                        <MarketplaceCard
                          item={item}
                          user={user}
                          onToggleFavorite={handleToggleFavorite}
                          getItemDistance={getItemDistance}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
