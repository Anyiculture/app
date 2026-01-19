import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';

import { 
  Briefcase, Users, FileText, TrendingUp, Plus, 
  Edit, ArrowRight, MapPin
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { GlassCard } from '../components/ui/GlassCard';

interface DashboardStats {
  totalJobs: number;
  activeJobs: number;
  totalApplicants: number;
  pendingReviews: number;
}

interface RecentJob {
  id: string;
  title: string;
  status: string;
  location_city: string;
  created_at: string;
  applicant_count?: number;
}

interface EmployerProfile {
  company_name: string;
  company_logo?: string;
  industry: string;
  registration_city: string;
  profile_completion_percent: number;
  verified: boolean;
}

export function EmployerDashboardPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalJobs: 0,
    activeJobs: 0,
    totalApplicants: 0,
    pendingReviews: 0
  });
  const [recentJobs, setRecentJobs] = useState<RecentJob[]>([]);
  const [profile, setProfile] = useState<EmployerProfile | null>(null);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load employer profile
      const { data: profileData } = await supabase
        .from('profiles_employer')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      setProfile(profileData);

      // Load jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, job_applications(count)')
        .eq('poster_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!jobsError && jobsData) {
        setRecentJobs(jobsData.map((job: any) => ({
          ...job,
          applicant_count: job.job_applications?.[0]?.count || 0
        })));

        // Calculate stats
        const total = jobsData.length;
        const active = jobsData.filter((j: any) => j.status === 'active').length;
        const totalApps = jobsData.reduce((sum: number, job: any) => 
          sum + (job.job_applications?.[0]?.count || 0), 0
        );

        // Get pending applications
        const { count: pendingCount } = await supabase
          .from('job_applications')
          .select('*', { count: 'exact', head: true })
          .in('job_id', jobsData.map((j: any) => j.id))
          .eq('status', 'pending');

        setStats({
          totalJobs: total,
          activeJobs: active,
          totalApplicants: totalApps,
          pendingReviews: pendingCount || 0
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { bg: string; text: string; label: string }> = {
      active: { bg: 'bg-green-100', text: 'text-green-700', label: t('employerDashboard.statusPublished') },
      draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: t('employerDashboard.statusDraft') },
      closed: { bg: 'bg-red-100', text: 'text-red-700', label: t('employerDashboard.statusClosed') }
    };
    const config = statusMap[status] || statusMap.draft;
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#eaecf0] pb-10">
      {/* Header */}
      <div className="bg-white/40 backdrop-blur-xl border-b border-white/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0">
              {profile?.company_logo && (
                <div className="shrink-0 w-8 h-8 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl overflow-hidden shadow-lg ring-1 ring-black/5">
                  <img 
                    src={profile.company_logo} 
                    alt={profile.company_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div className="min-w-0">
                <h1 className="text-sm sm:text-lg font-black text-gray-900 truncate tracking-tight uppercase leading-tight">
                  {profile?.company_name || t('employerDashboard.title')}
                </h1>
                <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest truncate">
                  {profile?.industry} • {profile?.registration_city}
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate('/employer/profile/edit')}
              variant="outline"
              className="shrink-0 h-7 sm:h-9 rounded-full px-3 py-0 sm:px-5 font-black uppercase tracking-widest text-[8px] sm:text-[10px] border-gray-200"
            >
              <Edit size={12} className="sm:w-4 sm:h-4 mr-1 sm:mr-1.5" />
              <span className="hidden sm:inline">{t('employerDashboard.editProfile')}</span>
              <span className="sm:hidden">{t('common.edit')}</span>
            </Button>
          </div>
          
          {/* Profile Completion - Compacted */}
          {profile && profile.profile_completion_percent < 100 && (
            <div className="mt-2 sm:mt-3 bg-vibrant-purple/5 border border-vibrant-purple/10 rounded-lg p-2 sm:p-3">
              <div className="flex items-center justify-between mb-1 sm:mb-1.5">
                <span className="text-[9px] sm:text-xs font-black uppercase tracking-widest text-vibrant-purple">
                  {t('employerDashboard.profileCompletion')}
                </span>
                <span className="text-[9px] sm:text-xs font-black text-vibrant-purple">
                  {profile.profile_completion_percent}%
                </span>
              </div>
              <div className="w-full bg-vibrant-purple/10 rounded-full h-1 sm:h-1.5">
                <div 
                  className="bg-vibrant-purple h-full rounded-full transition-all duration-1000"
                  style={{ width: `${profile.profile_completion_percent}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Grid - Ultra Compact */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-6 sm:mb-8">
          <StatCompactCard 
            label={t('employerDashboard.totalJobs')} 
            value={stats.totalJobs} 
            icon={<Briefcase size={16} />} 
            variant="dark"
          />
          <StatCompactCard 
            label={t('employerDashboard.activeJobs')} 
            value={stats.activeJobs} 
            icon={<TrendingUp size={16} />} 
            variant="light"
          />
          <StatCompactCard 
            label={t('employerDashboard.totalApplicants')} 
            value={stats.totalApplicants} 
            icon={<Users size={16} />} 
            variant="gradient"
          />
          <StatCompactCard 
            label={t('employerDashboard.pendingReviews')} 
            value={stats.pendingReviews} 
            icon={<FileText size={16} />} 
            variant="light"
          />
        </div>

        {/* Recent Jobs List */}
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between px-1 sm:px-2">
            <div>
              <h2 className="text-sm sm:text-lg font-black text-gray-900 tracking-tight uppercase leading-tight">{t('employerDashboard.recentJobs')}</h2>
              <p className="text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest">{t('employerDashboard.managePostings')}</p>
            </div>
            <button
               onClick={() => navigate('/jobs/post')}
               className="h-7 sm:h-9 flex items-center gap-1 sm:gap-2 px-3 sm:px-5 bg-gray-900 text-white rounded-full text-[8px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition-all shadow-lg ring-1 ring-white/10"
            >
               <Plus size={12} className="sm:w-4 sm:h-4" />
               {t('employerDashboard.postNewJob')}
            </button>
          </div>
          
          <GlassCard className="rounded-xl sm:rounded-[2rem] border-white/60 shadow-xl overflow-hidden p-0">
            {recentJobs.length === 0 ? (
               <div className="p-8 sm:p-12 text-center">
                  <Briefcase className="mx-auto text-gray-200 mb-2 sm:mb-4" size={32} />
                  <p className="text-[10px] sm:text-xs text-gray-400 uppercase font-black tracking-widest">{t('employerDashboard.noJobsYet')}</p>
               </div>
            ) : (
                <div className="divide-y divide-gray-100/50">
                  {recentJobs.map(job => (
                    <div 
                        key={job.id} 
                        onClick={() => navigate(`/jobs/${job.id}`)}
                        className="group flex items-center gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-white/40 transition-all cursor-pointer"
                    >
                        {/* Status Icon - Tighter */}
                        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shadow-sm transition-transform group-hover:scale-105 shrink-0 ${
                            job.status === 'active' ? 'bg-green-50 text-green-600' : 
                            job.status === 'closed' ? 'bg-red-50 text-red-500' : 'bg-gray-100 text-gray-400'
                        }`}>
                            {job.status === 'active' ? <TrendingUp size={14} className="sm:w-5 sm:h-5" /> : 
                             job.status === 'closed' ? <Briefcase size={14} className="sm:w-5 sm:h-5" /> : <FileText size={14} className="sm:w-5 sm:h-5" />}
                        </div>
                        
                        {/* Info - Denser */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                                <h3 className="text-[11px] sm:text-sm font-black text-gray-900 truncate uppercase tracking-tight leading-tight">{job.title}</h3>
                                {getStatusBadge(job.status)}
                            </div>
                            <div className="flex items-center gap-1.5 text-[8px] sm:text-[10px] text-gray-400 font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden">
                                <span className="flex items-center gap-0.5 shrink-0"><MapPin size={8} className="sm:w-3 sm:h-3" /> {job.location_city}</span>
                                <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                                <span className="shrink-0">{new Date(job.created_at).toLocaleDateString()}</span>
                                {job.applicant_count ? (
                                  <>
                                   <span className="w-0.5 h-0.5 rounded-full bg-gray-300" />
                                   <span className="text-vibrant-purple font-black shrink-0">{job.applicant_count} {t('common.applicants')}</span>
                                  </>
                                ) : null}
                            </div>
                        </div>
                        
                        {/* Arrow - Tighter */}
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-vibrant-purple group-hover:text-white transition-all shadow-sm shrink-0">
                           <ArrowRight size={12} className="sm:w-4 sm:h-4" />
                        </div>
                    </div>
                  ))}
                  
                  <button 
                    onClick={() => navigate('/jobs/my-jobs')}
                    className="w-full py-2.5 sm:py-3.5 text-center text-[8px] sm:text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-vibrant-purple hover:bg-white/50 transition-all border-t border-gray-100/50"
                  >
                    {t('employerDashboard.viewAll')}
                  </button>
                </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  );
}

function StatCompactCard({ label, value, icon, variant }: { 
  label: string, value: number, icon: any, variant: 'dark' | 'light' | 'gradient' 
}) {
  const configs = {
    dark: 'bg-gray-900 text-white shadow-gray-900/10 ring-1 ring-white/10',
    light: 'bg-white text-gray-900 border border-white/60 shadow-gray-200/40',
    gradient: 'bg-gradient-to-br from-vibrant-purple to-vibrant-pink text-white shadow-purple-500/20 ring-1 ring-white/10'
  };

  return (
    <div className={`${configs[variant]} rounded-xl sm:rounded-2xl p-2.5 sm:p-4 flex flex-col justify-between h-20 sm:h-28 relative overflow-hidden group shadow-lg transition-transform hover:scale-[1.02]`}>
      <div className={`absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 ${variant === 'light' ? 'text-gray-900' : 'text-white'}`}>
        {React.cloneElement(icon, { size: 32, className: 'sm:w-12 sm:h-12' })}
      </div>
      <div className="relative z-10">
         <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center mb-1.5 sm:mb-3 backdrop-blur-sm ${variant === 'light' ? 'bg-gray-100 text-gray-400' : 'bg-white/20 text-white'}`}>
            {React.cloneElement(icon, { size: 12, className: 'sm:w-4 sm:h-4' })}
         </div>
         <p className="text-lg sm:text-2xl font-black tracking-tighter leading-none mb-0.5">{value}</p>
          <p className={`text-[7px] sm:text-[9px] font-black uppercase tracking-widest leading-none ${variant === 'light' ? 'text-gray-400' : 'text-white/60'}`}>{label}</p>
      </div>
    </div>
  );
}
