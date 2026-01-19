import { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Bookmark, Plus, AlertCircle, Briefcase, Search, Users, Edit, Sparkles } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { useI18n } from '../contexts/I18nContext';
import { useAuth } from '../contexts/AuthContext';
import { jobsService, Job, savedJobsService } from '../services/jobsService';
import { jobsRoleService } from '../services/jobsRoleService';
import { JobCard } from '../components/JobCard';
import { JobFiltersBar } from '../components/jobs/JobFiltersBar';
import { GuardrailModal } from '../components/GuardrailModal';
import { Select } from '../components/ui/Select';
import { adminService } from '../services/adminService';
import { GlassCard } from '../components/ui/GlassCard';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '../components/ui/Button';

export function JobsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);



  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());
  const [showGuardrail, setShowGuardrail] = useState(false);
  const [activeRole, setActiveRole] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Filter State
  const [filters, setFilters] = useState({
    job_type: [] as string[],
    remote_type: [] as string[],
    experience_level: [] as string[],
    city: 'all',
    search: '',
    sort: 'newest' as 'newest' | 'salary_desc' | 'salary_asc',
  });

  useEffect(() => {
    loadJobs();
  }, [page, filters]); // Reload when page or filters change

  useEffect(() => {
    if (user) {
      loadSavedJobs();
      checkJobsRole();
      checkAdminStatus();
    } else {
      setCheckingRole(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const admin = await adminService.checkIsAdmin();
      setIsAdmin(admin);
    } catch (err) {
      console.error('Failed to check admin status:', err);
    }
  };

  const checkJobsRole = async () => {
    if (!user?.id) {
      setCheckingRole(false);
      return;
    }
    try {
      const role = await jobsRoleService.getUserJobsRole(user.id);
      setActiveRole(role); // 'employer' or 'job_seeker'
    } catch (err) {
      console.error('Failed to check jobs role:', err);
      // Don't set activeRole on error
    } finally {
      setCheckingRole(false);
    }
  };

  const loadJobs = async () => {
    try {
      setLoading(true);

      const result = await jobsService.getJobs(page, 12, {
        search: filters.search || undefined,
        location_city: filters.city !== 'all' ? filters.city : undefined,
        job_type: filters.job_type.length ? filters.job_type : undefined,
        remote_type: filters.remote_type.length ? filters.remote_type :undefined,
        experience_level: filters.experience_level.length ? filters.experience_level : undefined,
        sort: filters.sort,
      });
      setJobs(result.jobs || []); // Ensure array
      setTotalPages(result.totalPages || 1);
    } catch (err) {

      console.error('Failed to load jobs:', err);
      setJobs([]); // Reset to empty array on error
    } finally {
      setLoading(false);
    }
  };

  const loadSavedJobs = async () => {
    if (!user?.id) return;
    try {
      const saved = await savedJobsService.getSavedJobs(user.id);
      setSavedJobIds(new Set(saved.map(s => s.job_id)));
    } catch (err) {
      console.error('Failed to load saved jobs:', err);
    }
  };

  const handleSaveJob = async (jobId: string) => {
    if (!user?.id) {
      setShowGuardrail(true);
      return;
    }

    try {
      if (savedJobIds.has(jobId)) {
        await savedJobsService.unsaveJob(user.id, jobId);
        setSavedJobIds(prev => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
      } else {
        await savedJobsService.saveJob(user.id, jobId);
        setSavedJobIds(prev => new Set(prev).add(jobId));
      }
    } catch (err) {
      console.error('Failed to save job:', err);
    }
  };



  const handleFilterChange = (key: string, value: any) => {
    if (key === 'clear') {
      setFilters({
        job_type: [],
        remote_type: [],
        experience_level: [],
        city: 'all',
        search: '',
        sort: 'newest',
      });
    } else {
      setFilters(prev => ({ ...prev, [key]: value }));
    }
    setPage(1);
  };

  const handlePostJob = () => {
    if (!user) {
      setShowGuardrail(true);
      return;
    }
    
    if (isAdmin) {
      navigate('/jobs/post');
      return;
    }

    if (activeRole !== 'employer') {
      navigate('/jobs/role-selection');
      return;
    }
    navigate('/jobs/post');
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans relative overflow-hidden">
      <BackgroundBlobs />
      
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100 shadow-sm">
        <div className="max-w-[100rem] mx-auto px-4 sm:px-6 h-12 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-6">
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate('/dashboard')}
              className="w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center text-gray-500 hover:text-vibrant-purple transition-colors rounded-lg bg-gray-50 sm:bg-white/40 border border-gray-200 sm:border-white/60"
            >
              <ArrowLeft size={16} />
            </motion.button>
            <div>
              <h1 className="text-base sm:text-xl font-black text-gray-900 tracking-tight uppercase">
                {t('jobs.title')}
              </h1>
              <div className="flex items-center gap-1 mt-0">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-[8px] sm:text-[9px] font-black text-gray-400 uppercase tracking-widest">
                  Live Opportunities
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[100rem] mx-auto px-3 sm:px-6 py-4 sm:py-6 relative z-10">
        
        {/* Onboarding Notice */}
        <AnimatePresence>
          {user && !checkingRole && !activeRole && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <GlassCard className="p-1 px-4 border-vibrant-purple/20 shadow-xl shadow-vibrant-purple/5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-vibrant-purple/10 flex items-center justify-center text-vibrant-purple">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs">Complete Your Setup</h4>
                      <p className="text-sm text-gray-500 font-medium">
                        {t('jobsOnboarding.completeSetupDesc')}
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/jobs/role-selection')}
                    variant="primary"
                    size="sm"
                    className="rounded-xl shadow-vibrant-blue/20"
                  >
                    {t('jobsOnboarding.completeJobsSetup')} <ArrowRight className="ml-2" size={16} />
                  </Button>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filter Bar at Top */}
        <JobFiltersBar 
          filters={filters}
          onFilterChange={handleFilterChange}
          onReset={() => handleFilterChange('clear', null)}
          resultsCount={jobs.length}
          rightActions={
            <>
              {user && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={async () => {
                      if (!user?.id || !activeRole) return;
                      const newRole = activeRole === 'employer' ? 'job_seeker' : 'employer';
                      try {
                        await jobsRoleService.setUserRole(user.id, newRole);
                        setActiveRole(newRole);
                      } catch (err) {
                        console.error('Failed to update role:', err);
                      }
                    }}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    title={activeRole === 'employer' ? "Switch to Job Seeker View" : "Switch to Employer View"}
                  >
                     {activeRole === 'employer' ? (
                       <>
                         <Users size={14} />
                         <span className="hidden lg:inline">{t('common.viewAsSeeker') || 'View as Seeker'}</span>
                       </>
                     ) : (
                       <>
                         <Briefcase size={14} />
                         <span className="hidden lg:inline">{t('common.viewAsEmployer') || 'View as Employer'}</span>
                       </>
                     )}
                  </button>

                  {activeRole === 'job_seeker' && (
                     <button
                      onClick={() => navigate('/jobs/edit-profile')}
                      className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm shadow-sm"
                    >
                      <Edit size={16} className="text-gray-400" />
                      <span className="hidden md:inline">{t('common.editProfile')}</span>
                    </button>
                  )}
                </div>
              )}

              {user && activeRole === 'job_seeker' && (
                <button
                  onClick={() => navigate('/saved-jobs')}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm shadow-sm"
                >
                  <Bookmark size={18} />
                  <span className="hidden md:inline">{t('jobs.savedJobs')}</span>
                </button>
              )}

              {user && activeRole === 'employer' && (
                <>
                  <button
                    onClick={() => navigate('/employer/profile/edit')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm shadow-sm"
                  >
                    <Edit size={16} className="text-gray-400" />
                    <span className="hidden md:inline">{t('common.editProfile')}</span>
                  </button>
                  <button
                    onClick={() => navigate('/jobs/my-jobs')}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full hover:bg-gray-50 hover:border-gray-300 transition-all font-medium text-sm shadow-sm"
                  >
                    <Briefcase size={18} />
                    <span className="hidden md:inline">{t('jobs.myJobs')}</span>
                  </button>
                  <button
                    onClick={handlePostJob}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all font-medium text-sm shadow-sm"
                  >
                    <Plus size={18} />
                    <span className="hidden md:inline">{t('nav.postJob')}</span>
                  </button>
                </>
              )}

              {user && !checkingRole && !activeRole && (
                <button
                  onClick={() => navigate('/jobs/role-selection')}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-all font-medium text-sm shadow-sm"
                >
                  <AlertCircle size={18} />
                  <span className="hidden md:inline">{t('jobs.completeSetup')}</span>
                </button>
              )}
            </>
          }
        />

        {/* RESULTS STATS & SORT */}
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-white/80 border border-white/60 shadow-xl items-center justify-center text-vibrant-purple">
              <Briefcase size={20} />
            </div>
            <div>
              <h2 className="text-sm sm:text-xl font-black text-gray-900 tracking-tight uppercase">
                {loading ? t('common.searching') : `${jobs.length} ${t('jobs.jobsAvailable')}`}
              </h2>
              {!loading && (
                <div className="hidden sm:flex items-center gap-2 mt-0.5">
                  <Sparkles size={10} className="text-vibrant-purple" />
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                    {t('common.basedOnPreferences')}
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="w-28 sm:w-44 relative group">
              <div className="absolute inset-0 bg-vibrant-purple/5 blur-xl group-hover:bg-vibrant-purple/10 transition-all opacity-0 group-hover:opacity-100" />
              <Select 
                value={filters.sort}
                onChange={(e) => handleFilterChange('sort', e.target.value)}
                className="relative z-10 !rounded-xl sm:!rounded-2xl !px-3 sm:!px-4 !py-1.5 sm:!py-2 !font-bold !text-[9px] sm:!text-[10px] !border-gray-200 !bg-white/60 !shadow-sm hover:!bg-white/80 transition-all"
              >
                <option value="newest">{t('common.newestFirst')}</option>
                <option value="salary_desc">{t('common.highestSalary')}</option>
                <option value="salary_asc">{t('common.lowestSalary')}</option>
              </Select>
            </div>
          </div>
        </div>

        {/* JOB GRID */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-8">
            {[...Array(8)].map((_, i) => (
              <GlassCard key={i} className="h-72 animate-pulse p-6 border-white/20">
                <div className="w-14 h-14 bg-white/20 rounded-2xl mb-6" />
                <div className="h-6 bg-white/20 rounded-lg w-3/4 mb-4" />
                <div className="h-4 bg-white/10 rounded-lg w-1/2 mb-8" />
                <div className="flex gap-4">
                   <div className="h-10 bg-white/10 rounded-xl flex-1" />
                   <div className="h-10 bg-white/10 rounded-xl flex-1" />
                </div>
              </GlassCard>
            ))}
          </div>
        ) : jobs.length === 0 ? (
              <GlassCard className="py-24 border-dashed border-gray-200 bg-white/30 backdrop-blur-md">
                <div className="text-center">
                  <div className="w-24 h-24 bg-white border border-gray-100 rounded-[2rem] shadow-xl flex items-center justify-center mx-auto mb-8 text-gray-300">
                     <Search size={40} />
                  </div>
                  <h3 className="text-gray-900 text-3xl font-black uppercase tracking-tight mb-4">{t('jobs.noJobsFound')}</h3>
                  <p className="text-gray-500 mb-10 max-w-md mx-auto font-medium text-lg">{t('common.tryAdjustingSearchCriteria')}</p>
                  <Button
                    onClick={() => handleFilterChange('clear', null)}
                    variant="outline"
                    className="px-10 py-4 !rounded-2xl"
                  >
                    {t('common.clearAllFilters')}
                  </Button>
                </div>
              </GlassCard>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-4 md:gap-8"
            >
              <AnimatePresence mode="popLayout">
                {jobs.map((job) => (
                  <motion.div
                    key={job.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    <JobCard
                      job={job}
                      onSave={handleSaveJob}
                      isSaved={savedJobIds.has(job.id)}
                      matchScore={Math.floor(Math.random() * (99 - 85) + 85)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
          
          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-20">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
                className="w-12 h-12 flex items-center justify-center bg-white border border-white/60 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-xl shadow-black/5"
              >
                <ArrowLeft size={20} />
              </motion.button>
              
              <div className="flex gap-2">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (page > 3) {
                      pageNum = page - 2 + i;
                    }
                    if (pageNum > totalPages) return null;
                  }
                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setPage(pageNum)}
                      className={`w-12 h-12 text-sm rounded-2xl font-black uppercase tracking-widest transition-all shadow-xl ${
                        page === pageNum
                          ? 'bg-vibrant-purple text-white shadow-vibrant-purple/20'
                          : 'bg-white border border-white/60 text-gray-700 hover:bg-gray-50 shadow-black/5'
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
                className="w-12 h-12 flex items-center justify-center bg-white border border-white/60 rounded-2xl disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 transition-all shadow-xl shadow-black/5"
              >
                <ArrowRight size={20} />
              </motion.button>
            </div>
          )}




        </div>

      <GuardrailModal
        isOpen={showGuardrail}
        onClose={() => setShowGuardrail(false)}
      />
    </div>
  );
}
