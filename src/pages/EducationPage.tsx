import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { GraduationCap, ArrowLeft, Plus, Sparkles, Heart } from 'lucide-react';
import { educationService, EducationResource } from '../services/educationService';
import { EducationFiltersBar } from '../components/education/EducationFiltersBar';
import { EducationCard } from '../components/education/EducationCard';
import { BackgroundBlobs } from '../components/ui';

export function EducationPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [programs, setPrograms] = useState<EducationResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites'>('all');
  const [filters, setFilters] = useState({
    program_type: 'all',
    level: 'all',
    city: 'all',
    search: ''
  });

  useEffect(() => {
    loadPrograms();
  }, [filters, activeTab]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      let data;
      if (activeTab === 'favorites') {
        if (!user) {
          setPrograms([]);
          setLoading(false);
          return;
        }
        data = await educationService.getFavorites();
      } else {
        const apiFilters = {
          program_type: filters.program_type,
          education_level: filters.level !== 'all' ? filters.level : undefined,
          city: filters.city !== 'all' ? filters.city : undefined,
          search: filters.search
        };
        
        data = await educationService.getPrograms(apiFilters);
      }
      setPrograms(data);
    } catch (error) {
      console.error('Error loading programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: any) => {
    if (key === 'clear') {
      setFilters({
        program_type: 'all',
        level: 'all',
        city: 'all',
        search: ''
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
  };

  const handleToggleFavorite = async (e: React.MouseEvent, programId: string) => {
    e.preventDefault();
    if (!user) return; // Optionally prompt login

    try {
      const isFavorited = programs.find(p => p.id === programId)?.is_favorited;
      // Optimistic update
      setPrograms(prev => prev.map(p => {
        if (p.id === programId) return { ...p, is_favorited: !isFavorited };
        return p;
      }));

      await educationService.toggleFavorite(programId);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      // Revert if needed
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/40 shadow-sm hidden md:block">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => navigate('/dashboard')}
              className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-vibrant-purple transition-all rounded-xl bg-white/40 border border-white/60 shadow-sm hover:scale-105 active:scale-95"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                {t('nav.education')}
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="w-1.5 h-1.5 rounded-full bg-vibrant-purple animate-pulse" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  {t('education.pathways')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-4 sm:px-6 py-4 md:py-6 relative z-10">
        
        {/* Filter Bar */}
        <EducationFiltersBar
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={() => handleFilterChange('clear', null)}
          rightActions={
            user && (
              <>
                <button
                  onClick={() => setActiveTab(activeTab === 'all' ? 'favorites' : 'all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all font-medium text-sm shadow-sm mr-2 ${
                    activeTab === 'favorites' 
                      ? 'bg-violet-100 border-violet-200 text-violet-700' 
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Heart size={18} className={activeTab === 'favorites' ? 'fill-current' : ''} />
                  <span className="hidden sm:inline">{t('education.browse.myFavorites')}</span>
                </button>
                <Link
                  to="/education/create"
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all font-medium text-sm shadow-sm"
                >
                  <Plus size={18} />
                  <span className="hidden sm:inline">{t('education.browse.listProgram')}</span>
                </Link>
              </>
            )
          }
        />

        {/* Results Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 md:mb-6 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-200 shadow-sm flex items-center justify-center text-vibrant-purple">
              <GraduationCap size={28} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">
                {loading ? t('education.browse.loading') : (
                  activeTab === 'favorites'
                    ? t('education.browse.savedCount', { count: programs.length })
                    : t('education.browse.foundCount', { count: programs.length })
                )}
              </h2>
              {!loading && (
                <div className="flex items-center gap-2 mt-1">
                  <Sparkles size={12} className="text-vibrant-purple" />
                  <p className="text-[10px] font-black text-vibrant-purple uppercase tracking-widest">
                    {t('education.anyiEducation')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-72 animate-pulse p-3 border border-gray-100 bg-white rounded-2xl shadow-sm">
                <div className="w-full aspect-video bg-gray-100 rounded-xl mb-6" />
                <div className="h-6 bg-gray-100 rounded-lg w-3/4 mb-4" />
                <div className="h-4 bg-gray-50 rounded-lg w-1/2" />
              </div>
            ))}
          </div>
        ) : programs.length === 0 ? (
          <div className="py-24 border-2 border-dashed border-gray-200 rounded-3xl bg-white/50 text-center">
            <div className="w-24 h-24 bg-white border border-gray-100 rounded-[2rem] shadow-sm flex items-center justify-center mx-auto mb-8 text-gray-300">
              <GraduationCap size={40} />
            </div>
            <h3 className="text-gray-900 text-3xl font-black uppercase tracking-tight mb-4">{t('education.browse.noProgramsTitle')}</h3>
            <p className="text-gray-500 mb-10 max-w-sm mx-auto font-medium text-lg">{t('education.browse.noProgramsDescription')}</p>
            <button
              onClick={() => handleFilterChange('clear', null)}
              className="px-10 py-4 bg-white border border-gray-200 text-[11px] font-black uppercase tracking-widest text-gray-700 rounded-2xl hover:bg-gray-50 transition-all shadow-sm"
            >
              {t('education.browse.clearAllFilters')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-5">
            {programs.map((program) => (
              <EducationCard 
                key={program.id}
                program={program} 
                onToggleFavorite={handleToggleFavorite} 
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
