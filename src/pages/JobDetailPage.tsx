import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Briefcase,
  DollarSign,
  Calendar,
  Building2,
  Award,
  GraduationCap,
  CheckCircle,
  ArrowLeft,
  Bookmark,
  Share2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { jobsService, applicationsService, savedJobsService, Job } from '../services/jobsService';
import { messagingService } from '../services/messagingService';
import { jobInterestService } from '../services/jobInterestService'; // Added
import { profileService } from '../services/profileService';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Loading } from '../components/ui/Loading';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TranslateWrapper } from '../components/ui/TranslateWrapper';
import { adminService } from '../services/adminService';
import {
  translateJobType,
  translateRemoteType,
  translateExperienceLevel,
} from '../utils/jobTranslations';
import { QuickChatButton } from '../components/jobs/QuickChatButton';
import { SayHiButton } from '../components/jobs/SayHiButton';
import { GuardrailModal } from '../components/GuardrailModal';
import { SuccessModal } from '../components/SuccessModal';
import { supabase } from '../lib/supabase';

interface EmployerProfile {
  company_name?: string;
  company_logo?: string;
}

export function JobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useI18n();
  const [job, setJob] = useState<Job | null>(null);
  const [employerProfile, setEmployerProfile] = useState<EmployerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [hasInterest, setHasInterest] = useState(false); // Added
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [showGuardrail, setShowGuardrail] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [applying, setApplying] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [applicationData, setApplicationData] = useState({
    coverLetter: '',
    resumeUrl: '',
    portfolioUrl: '',
  });

  // Removed handleContactEmployer as it's replaced by QuickChatButton

  useEffect(() => {
    if (id) {
      loadJob();
      checkIfSaved();
      checkIfInterested(); // Added
    }
  }, [id, user]); // Added user dependency to refetch on login

  // ... (loadJob remains same)

  const checkIfInterested = async () => {
    if (!user?.id || !id) return;
    try {
      const interested = await jobInterestService.hasExpressedInterest(id);
      setHasInterest(interested);
    } catch (err) {
      console.error('Failed to check interest:', err);
    }
  };

  const loadJob = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      setEmployerProfile(null);
      const data = await jobsService.getJobById(id);
      if (!data) {
        setError(t('common.jobNotFound'));
      } else {
        setJob(data);
        if (data.poster_id) {
          const { data: employerData } = await supabase
            .from('profiles_employer')
            .select('company_name, company_logo')
            .eq('user_id', data.poster_id)
            .maybeSingle(); // Use maybeSingle to avoid error if not found
          
          if (employerData) {
            setEmployerProfile(employerData);
          }
        }
      }
    } catch (err) {
      setError(t('common.failedToLoadJob'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkIfSaved = async () => {
    if (!user?.id || !id) return;
    try {
      const saved = await savedJobsService.isJobSaved(user.id, id);
      setIsSaved(saved);
    } catch (err) {
      console.error('Failed to check if job is saved:', err);
    }
  };

  const handleSaveJob = async () => {
    if (!user?.id || !id) {
      setShowGuardrail(true);
      return;
    }

    try {
      if (isSaved) {
        await savedJobsService.unsaveJob(user.id, id);
        setIsSaved(false);
      } else {
        await savedJobsService.saveJob(user.id, id);
        setIsSaved(true);
      }
    } catch (err) {
      console.error('Failed to save job:', err);
      alert(t('common.failedToSaveJob'));
    }
  };

  const handleApplyClick = async () => {
    if (!user) {
      setShowGuardrail(true);
      return;
    }
    
    // Check if user is admin
    try {
      const isAdmin = await adminService.checkIsAdmin();
      if (isAdmin) {
        setShowApplyModal(true);
        return;
      }
    } catch (err) {
      console.error('Error checking admin status:', err);
    }
    
    // Check if user has completed jobs onboarding
    try {
      const hasCompletedOnboarding = await profileService.getModuleOnboardingStatus('jobs');
      if (!hasCompletedOnboarding) {
        navigate('/jobs/onboarding');
        return;
      }
    } catch (err) {
      console.error('Failed to check onboarding status:', err);
      // Fail open: If check fails, allow user to proceed to avoid blocking due to network issues
    }
    
    setShowApplyModal(true);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !id) {
      setShowGuardrail(true);
      return;
    }

    setApplying(true);
    try {
      await applicationsService.createApplication({
        job_id: id,
        applicant_id: user.id,
        status: 'pending',
        // Use the resume provided in the simplified modal
        resume_url: applicationData.resumeUrl || undefined,
        // Other fields entered previously in onboarding are implicitly part of the applicant's profile
      });

      setShowApplyModal(false);
      setApplicationData({ coverLetter: '', resumeUrl: '', portfolioUrl: '' });

      if (job?.poster_id) {
        try {
          const { conversationId } = await messagingService.createConversationWithMessage({
            otherUserId: job.poster_id,
            contextType: 'job',
            contextId: job.id,
            relatedItemTitle: job.title || t('jobs.jobApplication'),
            initialMessage: t('applications.initialMessage', { title: job.title || t('jobs.jobApplication') }),
            messageType: 'system',
          });

          navigate(`/messages?conversation=${conversationId}`);
        } catch (err) {
          console.error('Failed to create conversation:', err);
          setShowSuccessModal(true);
        }
      } else {
        setShowSuccessModal(true);
      }
    } catch (err) {
      console.error('Failed to apply:', err);
      alert(t('common.failedToSubmitApplication'));
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text={t('common.loadingJobDetails')} />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{error || t('common.jobNotFound')}</p>
          <Button onClick={() => navigate('/jobs')}>{t('common.backToJobs')}</Button>
        </div>
      </div>
    );
  }

  const formatSalary = () => {
    if (!job.salary_min && !job.salary_max) return t('jobs.negotiable');

    const currency = job.salary_currency || 'USD';
    const period = job.salary_period || 'monthly';

    if (job.salary_min && job.salary_max) {
      return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()} / ${t(`jobs.salary.period.${period}`)}`;
    }

    if (job.salary_min) {
      return `${t('jobs.from')} ${currency} ${job.salary_min.toLocaleString()} / ${t(`jobs.salary.period.${period}`)}`;
    }

    return `${t('jobs.upTo')} ${currency} ${job.salary_max?.toLocaleString()} / ${t(`jobs.salary.period.${period}`)}`;
  };

  return (
    <div className="min-h-screen bg-gray-100 py-6">
      <div className="max-w-5xl mx-auto px-4">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4 text-sm"
        >
          <ArrowLeft size={16} />
          {t('common.backToJobs')}
        </button>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-4">
          <div className="flex justify-between items-start mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                {employerProfile?.company_logo ? (
                  <Link to={`/company/${job.poster_id}`} className="flex-shrink-0">
                    <img 
                      src={employerProfile.company_logo} 
                      alt={employerProfile.company_name || job.company_name} 
                      className="w-12 h-12 object-contain rounded-lg border border-gray-100 hover:shadow-md transition-shadow"
                    />
                  </Link>
                ) : (
                  <Link to={`/company/${job.poster_id}`} className="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center text-blue-500 font-bold text-lg hover:bg-blue-100 transition-colors">
                    {(employerProfile?.company_name || job.company_name || 'C').charAt(0).toUpperCase()}
                  </Link>
                )}
                <div>
                   <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{job.title}</h1>
                   <Link 
                     to={`/company/${job.poster_id}`}
                     className="text-base text-blue-600 hover:text-blue-800 font-medium hover:underline"
                   >
                     {employerProfile?.company_name || job.company_name || t('jobs.companyNamePlaceholder')}
                   </Link>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-gray-600 text-sm mt-3 sm:ml-15">
                <span className="flex items-center gap-1">
                  <MapPin size={16} />
                  {job.location_city}, {job.location_country}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase size={16} />
                  {translateJobType(job.job_type, t)}
                </span>
                {job.remote_type && (
                  <span className="flex items-center gap-1">
                    <Building2 size={16} />
                    {translateRemoteType(job.remote_type, t)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveJob}
                className={`p-2 rounded-lg border transition ${
                  isSaved
                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bookmark size={18} fill={isSaved ? 'currentColor' : 'none'} />
              </button>
              <button className="p-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
                <Share2 size={18} />
              </button>
            </div>
          </div>

          {job.image_urls && job.image_urls.length > 0 && (
            <div className="mb-6">
              <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden max-h-[400px]">
                <img
                  src={job.image_urls[selectedImageIndex]}
                  alt={t('common.imageNumber', { number: selectedImageIndex + 1 })}
                  className="w-full h-full object-cover"
                />
                {job.image_urls.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) =>
                        prev === 0 ? job.image_urls!.length - 1 : prev - 1
                      )}
                      className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-lg transition"
                    >
                      <ChevronLeft size={20} className="text-gray-800" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) =>
                        prev === job.image_urls!.length - 1 ? 0 : prev + 1
                      )}
                      className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white p-1.5 rounded-full shadow-lg transition"
                    >
                      <ChevronRight size={20} className="text-gray-800" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {job.image_urls.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImageIndex(idx)}
                          className={`w-1.5 h-1.5 rounded-full transition ${
                            idx === selectedImageIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
              {job.image_urls.length > 1 && (
                <div className="flex gap-2 mt-2 overflow-x-auto pb-1">
                  {job.image_urls.map((url, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border transition ${
                        idx === selectedImageIndex ? 'border-blue-500' : 'border-gray-200'
                      }`}
                    >
                      <img
                        src={url}
                        alt={t('common.thumbnailNumber', { number: idx + 1 })}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 pb-6 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium">{t('jobs.salary')}</p>
                <p className="font-semibold text-gray-900 text-sm">{formatSalary()}</p>
              </div>
            </div>

            {job.experience_level && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Award className="text-green-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">{t('jobs.experience')}</p>
                  <p className="font-semibold text-gray-900 text-sm">{translateExperienceLevel(job.experience_level, t)}</p>
                </div>
              </div>
            )}

            {job.published_at && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Calendar className="text-purple-600" size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium">{t('jobs.posted')}</p>
                  <p className="font-semibold text-gray-900 text-sm">
                    {new Date(job.published_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-lg font-bold text-gray-900 mb-2">{t('jobs.jobDescription')}</h2>
            <TranslateWrapper 
              text={job.description}
              dbTranslation={null}
              as="div"
              className="text-gray-700 whitespace-pre-line text-sm leading-relaxed"
            />
          </div>

          {job.education_required && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                <GraduationCap size={20} />
                {t('jobs.educationRequired')}
              </h2>
              <p className="text-gray-700 text-sm">{job.education_required}</p>
            </div>
          )}

          {job.skills_required && job.skills_required.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{t('jobs.requiredSkills')}</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills_required.map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md font-medium text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.language_requirements && Array.isArray(job.language_requirements) && job.language_requirements.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{t('jobs.languageRequirements')}</h2>
              <div className="flex flex-wrap gap-2">
                {job.language_requirements.map((lang: any, index: number) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-green-50 text-green-700 rounded-md font-medium text-sm"
                  >
                    {typeof lang === 'string' ? lang : `${lang.language || ''} ${lang.level ? `(${lang.level})` : ''}`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {job.benefits && job.benefits.length > 0 && (
            <div className="mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-2">{t('jobs.benefits')}</h2>
              <ul className="space-y-1.5">
                {job.benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-700 text-sm">
                    <CheckCircle className="text-green-500" size={16} />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-100">
            <Button
              onClick={handleApplyClick}
              className="w-full sm:flex-1"
            >
              {t('jobs.applyNow')}
            </Button>
            
            <SayHiButton
              jobId={job.id}
              hasInterest={hasInterest}
              onInterestExpressed={() => setHasInterest(true)}
              className="w-full sm:flex-1"
            />
            
            {job.poster_id && (
              <QuickChatButton
                employerId={job.poster_id}
                employerName={t('jobs.companyNamePlaceholder')}
                jobId={job.id}
                jobTitle={job.title}
                variant="outline"
                className="w-full sm:flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
              />
            )}
            
            {job.application_url && (
              <Button
                variant="outline"
                onClick={() => window.open(job.application_url, '_blank')}
                className="w-full sm:flex-1"
              >
                {t('jobs.applyOnCompanySite')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        title={t('jobs.applyForThisJob')}
        size="lg"
      >
        <form onSubmit={handleApply} className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4">
            <h3 className="font-semibold text-blue-900 mb-1 text-sm">{t('applications.almostDone')}</h3>
            <p className="text-xs text-blue-700">
              {t('applications.usingProfileInfo')}
            </p>
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('applications.selectCV')} *
             </label>
             <Input
                type="url"
                placeholder={t('common.urlPlaceholder')}
                value={applicationData.resumeUrl}
                onChange={(e) =>
                  setApplicationData({ ...applicationData, resumeUrl: e.target.value })
                }
                helperText={t('applications.resumeUrlHelperText')}
                required
                className="text-sm"
             />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowApplyModal(false)}
              className="flex-1"
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" isLoading={applying} className="flex-1">
              {t('applications.confirmAndApply')}
            </Button>
          </div>
        </form>
      </Modal>

      <GuardrailModal
        isOpen={showGuardrail}
        onClose={() => setShowGuardrail(false)}
      />

      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title={t('common.success')}
        message={t('common.applicationSubmittedSuccessfully')}
        ctaText={t('common.backToJobs')}
        onCtaClick={() => navigate('/jobs')}
      />
    </div>
  );
}
