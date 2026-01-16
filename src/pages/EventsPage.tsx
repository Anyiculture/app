import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, ArrowLeft, Heart, Plus, Sparkles } from 'lucide-react';
import { eventsService, Event } from '../services/eventsService';
import { EventsFiltersBar } from '../components/events/EventsFiltersBar';
import { EventCard } from '../components/events/EventCard';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui';
import { motion, AnimatePresence } from 'framer-motion';

export function EventsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [filters, setFilters] = useState({
    category: 'all',
    city: 'all',
    date_range: 'all',
    search: ''
  });

  useEffect(() => {
    loadEvents();
  }, [activeTab]);

  useEffect(() => {
    applyFilters();
  }, [events, filters]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      let data;
      if (activeTab === 'favorites') {
        if (!user) {
          setEvents([]);
          setLoading(false);
          return;
        }
        data = await eventsService.getFavorites();
      } else {
        data = await eventsService.getEvents();
      }
      setEvents(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchLower) ||
        event.description?.toLowerCase().includes(searchLower)
      );
    }

    // Category filter
    if (filters.category !== 'all') {
      filtered = filtered.filter(event => event.category === filters.category);
    }

    // City filter
    if (filters.city !== 'all') {
      filtered = filtered.filter(event => event.location_city?.includes(filters.city));
    }

    // Date range filter
    const now = new Date();
    if (filters.date_range !== 'all') {
      filtered = filtered.filter(event => {
        if (!event.start_date) return false;
        const eventDate = new Date(event.start_date);
        switch (filters.date_range) {
          case 'today':
            return eventDate.toDateString() === now.toDateString();
          case 'this_week':
            const weekEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            return eventDate >= now && eventDate <= weekEnd;
          case 'this_month':
            return eventDate.getMonth() === now.getMonth() && eventDate.getFullYear() === now.getFullYear();
          case 'upcoming':
            return eventDate >= now;
          default:
            return true;
        }
      });
    }

    setFilteredEvents(filtered);
  };

  const handleFilterChange = (key: string, value: any) => {
    if (key === 'clear') {
      setFilters({
        category: 'all',
        city: 'all',
        date_range: 'all',
        search: ''
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const upcomingEvents = filteredEvents.filter(event => new Date(event.start_date || '') >= new Date());
  const pastEvents = filteredEvents.filter(event => new Date(event.start_date || '') < new Date());

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
                {t('nav.events')}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-vibrant-purple animate-pulse" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t('events.liveExperiences')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 py-4 md:py-6 relative z-10">
        
        {/* Filter Bar */}
        <EventsFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={() => handleFilterChange('clear', null)}
          resultsCount={filteredEvents.length}
          rightActions={
            user && (
              <>
                <button
                  onClick={() => setActiveTab(activeTab === 'all' ? 'favorites' : 'all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-medium text-sm shadow-sm mr-2 ${
                    activeTab === 'favorites' 
                      ? 'bg-purple-100 border-purple-200 text-purple-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart size={18} className={activeTab === 'favorites' ? 'fill-current' : ''} />
                  <span className="hidden sm:inline">{t('events.myFavorites')}</span>
                </button>
                <Link
                  to="/events/create"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">{t('events.createEvent')}</span>
                </Link>
              </>
            )
          }
        />

        {/* Results Header */}
        <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/80 border border-white/60 shadow-xl flex items-center justify-center text-vibrant-purple">
              <Calendar size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                {loading ? t('events.loading') : (
                  activeTab === 'favorites' 
                    ? t('events.savedCount', { count: filteredEvents.length })
                    : t('events.foundCount', { count: filteredEvents.length })
                )}
              </h2>
              {!loading && (
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles size={12} className="text-vibrant-purple" />
                  <p className="text-[10px] font-black text-vibrant-purple uppercase tracking-widest">
                    {t('events.exclusives')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <GlassCard key={i} className="h-72 animate-pulse p-3 border-white/20">
                <div className="w-full aspect-video bg-white/20 rounded-2xl mb-6" />
                <div className="h-6 bg-white/20 rounded-lg w-3/4 mb-4" />
                <div className="h-4 bg-white/10 rounded-lg w-1/2" />
              </GlassCard>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <GlassCard className="py-24 border-dashed border-gray-200 bg-white/30 backdrop-blur-md">
            <div className="text-center">
              <div className="w-24 h-24 bg-white border border-gray-100 rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 text-gray-300">
                <Calendar size={40} />
              </div>
              <h3 className="text-gray-900 text-3xl font-black uppercase tracking-tight mb-4">{t('events.noEventsTitle')}</h3>
              <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium text-lg">{t('events.noEventsMessage')}</p>
              <button
                onClick={() => handleFilterChange('clear', null)}
                className="px-10 py-4 bg-white border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
              >
                {t('events.clearFilters')}
              </button>
            </div>
          </GlassCard>
        ) : (
          <div className="space-y-16">
            <AnimatePresence mode="popLayout">
              {upcomingEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <h2 className="text-2xl font-black text-gray-900 mb-8 uppercase tracking-tight flex items-center gap-3">
                    {t('events.upcomingEvents')}
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-4" />
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
                    {upcomingEvents.map((event) => (
                      <motion.div
                        key={event.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                      >
                        <EventCard event={event} />
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {pastEvents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <h2 className="text-xl font-black text-gray-400 mb-8 uppercase tracking-tight flex items-center gap-3">
                    {t('events.pastEvents')}
                    <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent ml-4 opacity-50" />
                  </h2>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6 opacity-60 filter grayscale hover:grayscale-0 transition-all duration-500">
                    {pastEvents.map((event) => (
                      <EventCard key={event.id} event={event} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
