import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { savedJobsService, Job } from '../services/jobsService';
import { JobCard } from '../components/JobCard';
import { Bookmark, ArrowLeft, Search, Briefcase } from 'lucide-react';
import { Loading } from '../components/ui/Loading';

export function MySavedJobsPage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [savedJobs, setSavedJobs] = useState<(Job & { saved_at?: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    loadSavedJobs();
  }, [user, navigate]);

  const loadSavedJobs = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await savedJobsService.getSavedJobs(user.id);

      const jobs = data.map(item => ({
        ...item.jobs,
        saved_at: item.created_at
      }));

      setSavedJobs(jobs);
      setSavedJobIds(new Set(jobs.map(job => job.id)));
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveJob = async (jobId: string) => {
    if (!user?.id) return;

    try {
      await savedJobsService.unsaveJob(user.id, jobId);
      setSavedJobs(prev => prev.filter(job => job.id !== jobId));
      setSavedJobIds(prev => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    } catch (error) {
      console.error('Failed to unsave job:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          <span>{t('common.back')}</span>
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Bookmark className="text-blue-600" size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">
                {t('jobs.savedJobs')}
              </h1>
              <p className="text-lg text-gray-600 mt-1">
                {savedJobs.length} {t('jobs.savedJob')}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12">
            <Loading />
          </div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-6">
              <Bookmark className="text-gray-400" size={32} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t('jobs.noSavedJobs')}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {t('jobs.noSavedJobsDescription')}
            </p>
            <button
              onClick={() => navigate('/jobs')}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg"
            >
              <Search size={20} />
              {t('jobs.browseJobs')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4">
            {savedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSave={handleUnsaveJob}
                isSaved={savedJobIds.has(job.id)}
              />
            ))}
          </div>
        )}

        {savedJobs.length > 0 && (
          <div className="mt-8 p-6 bg-blue-50 border-2 border-blue-200 rounded-xl">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 p-2 bg-blue-100 rounded-lg">
                <Briefcase className="text-blue-600" size={24} />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {t('jobs.quickTip')}
                </h3>
                <p className="text-gray-700">
                  {t('jobs.savedJobsTip')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
