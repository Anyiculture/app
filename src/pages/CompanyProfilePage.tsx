
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Users, 
  Calendar, 
  Linkedin, 
  ArrowLeft,
  CheckCircle,
  Briefcase
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { TranslateWrapper } from '../components/ui/TranslateWrapper';
import { useI18n } from '../contexts/I18nContext';
import { jobsService, Job } from '../services/jobsService';
import { JobCard } from '../components/JobCard';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { GlassCard } from '../components/ui/GlassCard';

interface CompanyProfile {
  user_id: string;
  company_name: string;
  company_type: string;
  industry: string;
  company_size: string;
  founded_year: number;
  company_description: string;
  registration_country: string;
  registration_province: string;
  registration_city: string;
  office_address: string;
  company_logo: string;
  company_images: string[];
  technologies: string[];
  website: string;
  linkedin_url: string;
  verified: boolean;
}

export function CompanyProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [profile, setProfile] = useState<CompanyProfile | null>(null);
  const [activeJobs, setActiveJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      if (!id) return;
      
      try {
        setLoading(true);
        
        // 1. Fetch Company Profile
        const { data: profileData, error: profileError } = await supabase
          .from('profiles_employer')
          .select('*')
          .eq('user_id', id)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);

        // 2. Fetch Active Jobs
        const jobs = await jobsService.getUserJobs(id, 'active');
        setActiveJobs(jobs);

      } catch (err) {
        console.error('Error loading company profile:', err);
        setError(t('common.errorLoadingProfile') || 'Failed to load company profile');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  if (loading) return <Loading />;

  if (error || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <p className="text-xl text-gray-600 mb-4">{error || 'Company not found'}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2" size={16} />
          {t('common.back')}
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eaecf0] pb-12 relative overflow-x-hidden font-sans">
      <BackgroundBlobs className="opacity-30" />
      
      {/* Header Banner */}
      <div className="h-48 sm:h-64 bg-gradient-to-r from-blue-600 to-indigo-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
        <div className="absolute top-4 left-4 z-10">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-white/90 hover:text-white bg-black/20 hover:bg-black/30 px-4 py-2 rounded-full transition-colors backdrop-blur-md border border-white/10"
          >
            <ArrowLeft size={16} />
            <span className="font-bold text-xs uppercase tracking-widest">{t('common.back')}</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 -mt-16 sm:-mt-20">
        
        {/* Company Header Card */}
        <GlassCard className="p-6 sm:p-8 mb-8">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            {/* Logo */}
            <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white shadow-lg p-2 flex-shrink-0 border border-gray-100 relative z-10">
              {profile.company_logo ? (
                <img 
                  src={profile.company_logo} 
                  alt={profile.company_name} 
                  className="w-full h-full object-contain rounded-xl"
                />
              ) : (
                <div className="w-full h-full bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                  <Building2 size={40} />
                </div>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1 w-full pt-2">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl md:text-4xl font-black text-gray-900 flex items-center gap-2 mb-2 leading-tight">
                    {profile.company_name}
                    {profile.verified && (
                      <CheckCircle className="text-blue-500 fill-blue-50" size={24} />
                    )}
                  </h1>
                  
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 font-medium">
                    {profile.industry && (
                      <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-lg">
                        <Building2 size={14} className="text-gray-400" />
                        {profile.industry}
                      </span>
                    )}
                    {(profile.registration_city || profile.registration_province) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-gray-400" />
                        {[profile.registration_city, profile.registration_province].filter(Boolean).join(', ')}
                      </span>
                    )}
                    {profile.company_size && (
                      <span className="flex items-center gap-1.5">
                        <Users size={14} className="text-gray-400" />
                        {profile.company_size} {t('jobsOnboarding.employees') || 'employees'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 mt-2 md:mt-0">
                  {profile.website && (
                    <a 
                      href={profile.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 font-bold text-sm"
                    >
                      <Globe size={16} />
                      <span className="hidden sm:inline">{t('jobsOnboarding.visitWebsite')}</span>
                      <span className="sm:hidden">Website</span>
                    </a>
                  )}
                  {profile.linkedin_url && (
                    <a 
                      href={profile.linkedin_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="p-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100"
                      title={t('jobsOnboarding.viewLinkedin')}
                    >
                      <Linkedin size={20} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </GlassCard>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* About Section */}
            <GlassCard className="p-6 sm:p-8">
              <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 uppercase tracking-wide border-l-4 border-blue-600 pl-3">
                {t('jobsOnboarding.companyDescription')}
              </h2>
              <div className="prose prose-blue max-w-none text-gray-600 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                <TranslateWrapper 
                  text={profile.company_description || t('common.noDescription')}
                  dbTranslation={null}
                  as="div"
                  className={!profile.company_description ? "text-gray-400 italic" : ""}
                />
              </div>
            </GlassCard>

            {/* Tech Stack */}
            {profile.technologies && profile.technologies.length > 0 && (
              <GlassCard className="p-6 sm:p-8">
                <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 uppercase tracking-wide border-l-4 border-indigo-600 pl-3">
                  {t('jobsOnboarding.techStack')}
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.technologies.map((tech) => (
                    <span 
                      key={tech}
                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold border border-indigo-100 uppercase tracking-wide"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Gallery */}
            {profile.company_images && profile.company_images.length > 0 && (
              <GlassCard className="p-6 sm:p-8">
                <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3 uppercase tracking-wide border-l-4 border-purple-600 pl-3">
                  {t('jobsOnboarding.companyPhotos')}
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {profile.company_images.map((img, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setSelectedImage(img)}
                      className="aspect-video rounded-xl overflow-hidden border border-gray-100 hover:shadow-lg transition-all transform hover:-translate-y-1 group relative"
                    >
                      <img 
                        src={img} 
                        alt={`Gallery ${idx + 1}`} 
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                    </button>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Active Jobs */}
            <div id="open-positions">
              <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center justify-between">
                <span>{t('jobsOnboarding.openPositions')}</span>
                <span className="text-sm font-bold px-3 py-1 bg-gray-900 text-white rounded-full">
                  {activeJobs.length}
                </span>
              </h2>
              {activeJobs.length > 0 ? (
                <div className="grid gap-4">
                  {activeJobs.map(job => (
                    <div key={job.id} onClick={() => navigate(`/jobs/${job.id}`)} className="cursor-pointer transform hover:-translate-y-1 transition-transform">
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>
              ) : (
                <GlassCard className="p-12 text-center">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
                    <Briefcase size={32} />
                  </div>
                  <p className="text-gray-500 font-bold uppercase tracking-wide text-sm">{t('jobsOnboarding.noOpenPositions')}</p>
                </GlassCard>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              <GlassCard className="p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-gray-50 to-gray-100 rounded-bl-[4rem] -mr-8 -mt-8 z-0"></div>
                <h3 className="font-black text-gray-900 mb-6 relative z-10 uppercase tracking-wide text-sm">{t('jobsOnboarding.companyDetails')}</h3>
                
                <div className="space-y-6 relative z-10">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0 shadow-sm">
                      <Building2 size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('jobsOnboarding.type')}</p>
                      <p className="text-gray-900 font-bold capitalize text-sm">{profile.company_type || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 flex-shrink-0 shadow-sm">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('jobsOnboarding.founded')}</p>
                      <p className="text-gray-900 font-bold text-sm">{profile.founded_year || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 flex-shrink-0 shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('jobsOnboarding.headquarters')}</p>
                      <p className="text-gray-900 font-bold leading-tight text-sm">
                        {[profile.registration_city, profile.registration_province, profile.registration_country].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>

                  {profile.office_address && (
                     <div className="flex items-start gap-4">
                       <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 flex-shrink-0 shadow-sm">
                         <MapPin size={18} />
                       </div>
                       <div>
                         <p className="text-[10px] text-gray-400 uppercase font-black tracking-widest mb-1">{t('jobsOnboarding.officeAddress')}</p>
                         <p className="text-gray-900 font-bold leading-tight text-sm">{profile.office_address}</p>
                       </div>
                     </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setSelectedImage(null)}
        >
          <img 
            src={selectedImage} 
            alt="Full size" 
            className="max-w-full max-h-[90vh] rounded-2xl shadow-2xl"
          />
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors bg-white/10 rounded-full p-2"
          >
            <span className="sr-only">Close</span>
            <ArrowLeft className="w-6 h-6 rotate-180" /> 
          </button>
        </div>
      )}
    </div>
  );
}
