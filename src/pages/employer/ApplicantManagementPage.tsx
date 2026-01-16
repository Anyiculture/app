
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Briefcase, TrendingUp, Users, Clock, ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { jobsService, Job } from '../../services/jobsService';
import { jobInterestService } from '../../services/jobInterestService';
import { ApplicationPipeline } from '../../components/jobs/ApplicationPipeline';
import { Loading } from '../../components/ui/Loading';

export function ApplicantManagementPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedJobId = searchParams.get('jobId');

  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalApplications: 0,
    totalInterests: 0,
    pendingReview: 0,
    scheduled: 0
  });

  useEffect(() => {
    if (user?.id) {
      loadMyJobs();
    }
  }, [user]);

  useEffect(() => {
    if (selectedJobId && myJobs.length > 0) {
      const job = myJobs.find(j => j.id === selectedJobId);
      if (job) {
        setSelectedJob(job);
        loadJobStats(selectedJobId);
      }
    } else if (myJobs.length > 0 && !selectedJob) {
      // Auto-select first job
      setSelectedJob(myJobs[0]);
      loadJobStats(myJobs[0].id);
    }
  }, [selectedJobId, myJobs]);

  const loadMyJobs = async () => {
    try {
      setLoading(true);
      const jobs = await jobsService.getUserJobs(user!.id, 'published');
      setMyJobs(jobs);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobStats = async (jobId: string) => {
    try {
      // Load stats from various services
      const interests = await jobInterestService.getJobInterests(jobId);
      // Note: Application stats will be calculated from ApplicationPipeline
      setStats(prev => ({
        ...prev,
        totalInterests: interests.length
      }));
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const handleJobSelect = (job: Job) => {
    setSelectedJob(job);
    navigate(`/employer/applicants?jobId=${job.id}`);
    loadJobStats(job.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text="Loading your jobs..." />
      </div>
    );
  }

  if (myJobs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft size={20} />
            Back to Jobs
          </button>

          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Briefcase className="mx-auto mb-4 text-gray-400" size={48} />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              No Active Job Postings
            </h2>
            <p className="text-gray-600 mb-6">
              Post your first job to start receiving applications
            </p>
            <button
              onClick={() => navigate('/jobs/post')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors"
            >
              Post a Job
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/jobs')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Jobs
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Applicant Management
              </h1>
              <p className="text-gray-600 mt-1">
                Track and manage candidates for your job postings
              </p>
            </div>

            <button
              onClick={() => navigate('/jobs/post')}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium hover:bg-emerald-700 transition-colors"
            >
              Post New Job
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Job Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Job Posting
          </label>
          <select
            value={selectedJob?.id || ''}
            onChange={(e) => {
              const job = myJobs.find(j => j.id === e.target.value);
              if (job) handleJobSelect(job);
            }}
            className="w-full md:w-96 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white"
          >
            {myJobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title} - {job.applications_count || 0} applications
              </option>
            ))}
          </select>
        </div>

        {selectedJob && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Applications</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {selectedJob.applications_count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <Users className="text-blue-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Interests (Say Hi)</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.totalInterests}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-100 rounded-lg">
                    <TrendingUp className="text-emerald-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Views</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {selectedJob.views_count || 0}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Clock className="text-purple-600" size={24} />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl p-6 border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Interviews</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {stats.scheduled}
                    </p>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <CalendarIcon className="text-yellow-600" size={24} />
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline */}
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <ApplicationPipeline jobId={selectedJob.id} />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
