import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle, 
  Search,
  Plus,
  Briefcase,
  Users,
  Eye,
  Edit,
  Trash2,
  Bookmark,
  FileText
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { analyticsService } from '../services/analyticsService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import localizationUtils from '../utils/localization';
import { useI18n } from '../contexts/I18nContext';
import { jobsRoleService } from '../services/jobsRoleService';
import { savedJobsService, Job, SavedJob, JobApplication } from '../services/jobsService';
import { JobCard } from '../components/JobCard';

// Employer Job Interface (for posted jobs)
interface PostedJob extends Job {
  applications?: { count: number }[];
}

interface DashboardStats {
  total_jobs: number;
  active_jobs: number;
  total_applications: number;
  pending_applications: number;
  total_views: number;
  avg_applications_per_job: number;
}

export default function MyJobsPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State for Role Determination
  const [jobsRole, setJobsRole] = useState<'employer' | 'job_seeker' | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  // State for Employer View
  const [postedJobs, setPostedJobs] = useState<PostedJob[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  
  // State for Job Seeker View
  const [savedJobs, setSavedJobs] = useState<(SavedJob & { jobs: Job })[]>([]);
  const [applications, setApplications] = useState<(JobApplication & { jobs: Job })[]>([]); // Need to join jobs
  const [activeTab, setActiveTab] = useState<'saved' | 'applied'>('saved');

  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const isEmployer = jobsRole === 'employer';

  const toggleRoleView = async () => {
    if (!user) return;
    const newRole = jobsRole === 'employer' ? 'job_seeker' : 'employer';
    try {
      await jobsRoleService.setUserRole(user.id, newRole);
      setJobsRole(newRole);
      // Reload specific data if needed, but the view switch handles the main components
      if (newRole === 'employer') {
        loadEmployerData();
      } else {
        loadJobSeekerData();
      }
    } catch (error) {
      console.error('Failed to switch role:', error);
    }
  };

  useEffect(() => {
    const initPage = async () => {
      if (user) {
        try {
          // 1. Determine correct role from user_services (not profile)
          const role = await jobsRoleService.getUserJobsRole(user.id);
          setJobsRole(role);
          
          // 2. Load data based on that role
          if (role === 'employer') {
            await loadEmployerData();
          } else {
            // Default to job seeker data if role is job_seeker OR null (fallback)
            await loadJobSeekerData();
          }
        } catch (error) {
          console.error('Error initializing My Jobs page:', error);
        } finally {
          setCheckingRole(false);
          setLoading(false);
        }
        
        analyticsService.trackPageView('/jobs/my-jobs', 'My Jobs Dashboard');
      }
    };
    
    initPage();
  }, [user, activeTab]); // Remove isEmployer from dependency to avoid loops

  const loadEmployerData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select(`
          *,
          applications:job_applications(count)
        `)
        .eq('poster_id', user.id)
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      const allJobs = (jobsData as unknown as PostedJob[]) || [];
      const activeJobs = allJobs.filter(j => j.status === 'published');
      const totalApplications = allJobs.reduce((sum, job) => {
        return sum + (job.applications?.[0]?.count || 0);
      }, 0);

      setPostedJobs(allJobs);
      setStats({
        total_jobs: allJobs.length,
        active_jobs: activeJobs.length,
        total_applications: totalApplications,
        pending_applications: 0,
        total_views: allJobs.reduce((sum, j) => sum + (j.views_count || 0), 0),
        avg_applications_per_job: allJobs.length > 0 ? totalApplications / allJobs.length : 0,
      });
    } catch (error) {
      console.error('Failed to load employer dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadJobSeekerData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      if (activeTab === 'saved') {
        const saved = await savedJobsService.getSavedJobs(user.id);
        setSavedJobs(saved);
      } else {
        // Fetch applications with job details
        const { data, error } = await supabase
          .from('job_applications')
          .select('*, jobs(*)')
          .eq('applicant_id', user.id)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setApplications(data as any || []);
      }
    } catch (error) {
      console.error('Failed to load job seeker data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      await supabase.from('jobs').delete().eq('id', jobId);
      setShowDeleteConfirm(null);
      loadEmployerData();
    } catch (error) {
      console.error('Failed to delete job:', error);
    }
  };

  const handleUnsave = async (jobId: string) => {
    if (!user) return;
    try {
      await savedJobsService.unsaveJob(user.id, jobId);
      loadJobSeekerData(); // Reload to remove from list
    } catch (error) {
      console.error('Failed to unsave job:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      published: 'bg-green-100 text-green-800',
      active: 'bg-green-100 text-green-800',
      inactive: 'bg-gray-100 text-gray-800',
      draft: 'bg-yellow-100 text-yellow-800',
      closed: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      reviewed: 'bg-blue-100 text-blue-800',
      shortlisted: 'bg-purple-100 text-purple-800',
      rejected: 'bg-red-100 text-red-800',
      withdrawn: 'bg-gray-100 text-gray-800'
    };
    return styles[status as keyof typeof styles] || styles.inactive;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'published':
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'closed': 
      case 'rejected': return <XCircle className="w-4 h-4" />;
      case 'draft': 
      case 'pending': return <Clock className="w-4 h-4" />;
      default: return <AlertCircle className="w-4 h-4" />;
    }
  };

  if ((loading || checkingRole) && !postedJobs.length && !savedJobs.length && !applications.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('myJobs.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('myJobs.title')}</h1>
              <p className="text-gray-600 mt-1">{t('myJobs.subtitle')}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button 
                variant="outline" 
                onClick={toggleRoleView}
                className="text-gray-600"
              >
                {isEmployer ? (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    {t('myJobs.switchToJobSeeker')}
                  </>
                ) : (
                  <>
                    <Briefcase className="w-4 h-4 mr-2" />
                    {t('myJobs.switchToEmployer')}
                  </>
                )}
              </Button>

              {!isEmployer && (
                <Button 
                  variant="outline"
                  onClick={() => navigate('/jobs/edit-profile')}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  {t('myJobs.editProfile')}
                </Button>
              )}

              {isEmployer && (
                <Button onClick={() => navigate('/jobs/post')}>
                  <Plus className="w-5 h-5 mr-2" />
                  {t('myJobs.postNewJob')}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Job Seeker Tabs */}
        {!isEmployer && (
          <div className="flex space-x-4 mb-6 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('saved')}
              className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'saved' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <Bookmark className="w-4 h-4" />
                {t('myJobs.tabs.saved')}
              </div>
              {activeTab === 'saved' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('applied')}
              className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                activeTab === 'applied' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {t('myJobs.tabs.applied')}
              </div>
              {activeTab === 'applied' && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
              )}
            </button>
          </div>
        )}

        {/* Employer View */}
        {isEmployer ? (
          <>
            {/* Stats Cards (Existing Code) */}
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* ... Stats cards content ... */}
                 <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('myJobs.stats.totalJobs')}</p>
                      <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total_jobs}</p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('myJobs.stats.activeJobs')}</p>
                      <p className="text-2xl font-bold text-green-600 mt-1">{stats.active_jobs}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('myJobs.stats.totalApplications')}</p>
                      <p className="text-2xl font-bold text-purple-600 mt-1">{stats.total_applications}</p>
                    </div>
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="w-6 h-6 text-purple-600" />
                    </div>
                  </div>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('myJobs.stats.totalViews')}</p>
                      <p className="text-2xl font-bold text-orange-600 mt-1">{stats.total_views}</p>
                    </div>
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Eye className="w-6 h-6 text-orange-600" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <Input
                      type="text"
                      placeholder={t('myJobs.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">{t('myJobs.status.all')}</option>
                    <option value="published">{t('myJobs.status.published')}</option>
                    <option value="inactive">{t('myJobs.status.inactive')}</option>
                    <option value="draft">{t('myJobs.status.draft')}</option>
                    <option value="closed">{t('myJobs.status.closed')}</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Posted Jobs Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
              {postedJobs.length === 0 ? (
                <div className="p-12 text-center">
                  <Briefcase className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{t('myJobs.empty.title')}</h3>
                  <Button onClick={() => navigate('/jobs/post')}>
                    <Plus className="w-5 h-5 mr-2" />
                    {t('myJobs.empty.postFirst')}
                  </Button>
                </div>
              ) : (
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.jobTitle')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.location')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.status')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.applications')}</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.posted')}</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {postedJobs.map((job) => (
                      <tr key={job.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-500">{job.company_name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">{job.location_city}</td>
                        <td className="px-6 py-4">
                           <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                             {getStatusIcon(job.status)}
                             {t(`myJobs.status.${job.status}`)}
                           </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{job.applications_count || 0}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{localizationUtils.formatRelativeTime(job.created_at)}</td>
                        <td className="px-6 py-4 text-right text-sm font-medium">
                           <div className="flex items-center justify-end gap-2">
                             <button onClick={() => navigate(`/jobs/${job.id}`)} className="text-blue-600 hover:text-blue-900"><Eye className="w-4 h-4" /></button>
                             <button onClick={() => alert('Edit functionality coming soon')} className="text-gray-400 cursor-not-allowed"><Edit className="w-4 h-4" /></button>
                             <button onClick={() => setShowDeleteConfirm(job.id)} className="text-red-600 hover:text-red-900"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        ) : (
          /* Job Seeker View */
          <div className="space-y-6">
            {activeTab === 'saved' ? (
              savedJobs.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                  <Bookmark className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">{t('jobs.noSavedJobs')}</p>
                  <Button variant="outline" onClick={() => navigate('/jobs')} className="mt-4">
                    {t('jobs.browseJobs')}
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
                  {savedJobs.map((saved) => (
                    <JobCard
                      key={saved.id}
                      job={saved.jobs}
                      isSaved={true}
                      onSave={() => handleUnsave(saved.jobs.id)}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Applied Jobs Table */
              <div className="bg-white rounded-lg shadow overflow-hidden overflow-x-auto">
                {applications.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">{t('myJobs.empty.noApplications')}</p>
                    <Button variant="outline" onClick={() => navigate('/jobs')} className="mt-4">
                      {t('jobs.browseJobs')}
                    </Button>
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.jobTitle')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.company')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.appliedDate')}</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.status')}</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('myJobs.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {applications.map((app) => (
                        <tr key={app.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 font-medium text-gray-900">{app.jobs?.title}</td>
                          <td className="px-6 py-4 text-gray-500">{app.jobs?.company_name}</td>
                          <td className="px-6 py-4 text-gray-500">{localizationUtils.formatRelativeTime(app.created_at)}</td>
                          <td className="px-6 py-4">
                             <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(app.status)}`}>
                               {getStatusIcon(app.status)}
                               {t(`myJobs.status.${app.status}`)}
                             </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <Button variant="ghost" size="sm" onClick={() => navigate(`/jobs/${app.job_id}`)}>
                              {t('myJobs.actions.view')}
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal (Existing) */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('myJobs.deleteConfirm.title')}</h3>
              <p className="text-gray-600 mb-6">{t('myJobs.deleteConfirm.message')}</p>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowDeleteConfirm(null)} className="flex-1">{t('myJobs.deleteConfirm.cancel')}</Button>
                <Button onClick={() => handleDelete(showDeleteConfirm)} className="flex-1 bg-red-600 hover:bg-red-700">{t('myJobs.deleteConfirm.confirm')}</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
