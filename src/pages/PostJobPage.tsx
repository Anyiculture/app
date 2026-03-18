import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Briefcase, MapPin, DollarSign, Calendar, X, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { useToast } from '../components/ui/Toast';
import { useFormPersistence } from '../hooks/useFormPersistence';
import { jobsService, type Job } from '../services/jobsService';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { JOB_CATEGORIES, type JobCategory, type JobSubcategory } from '../constants/jobCategories';

type JobType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
type RemoteType = 'on_site' | 'remote' | 'hybrid';
type ExperienceLevel = '' | 'entry' | 'mid' | 'senior' | 'executive';
type JobRecord = Job & { category?: string; subcategory?: string; subcategory_id?: string };

interface JobFormData {
  title: string;
  description: string;
  job_type: JobType;
  location_country: string;
  location_province: string;
  location_city: string;
  salary_min: string;
  salary_max: string;
  salary_currency: string;
  salary_period: string;
  remote_type: RemoteType;
  category_id: string;
  subcategory_id: string;
  experience_level: ExperienceLevel;
  education_required: string;
  skills_required: string[];
  benefits: string[];
  application_email: string;
  application_url: string;
  application_deadline: string;
}

const EDUCATION_OPTIONS = [
  'No formal education required',
  'High school diploma',
  'Certificate',
  'Diploma',
  'Associate degree',
  "Bachelor's degree",
  "Master's degree",
  'Doctorate / PhD',
  'Trade school / Vocational training',
  'Other',
];

const TECHNICAL_BENEFIT_OPTIONS = [
  'Paid holidays',
  'Annual leave',
  'Flexible day off',
  'Travel allowance',
  'Overtime pay',
  'Performance bonus',
  'Accommodation support',
  'Meals provided',
  'Transport provided',
  'Training provided',
  'Tools provided',
  'Career growth opportunities',
];

const TECHNICAL_CATEGORY_IDS = new Set(['technology', 'construction']);
const TECHNICAL_SUBCATEGORY_IDS = new Set([
  'backend_dev',
  'frontend_dev',
  'mobile_dev',
  'fullstack_dev',
  'test_qa',
  'devops_sre',
  'construction_worker',
  'civil_engineer',
  'medical_tech',
]);

const INVALID_SKILL_VALUES = [
  'Add skill',
  'Added',
  'jobs.addSkill',
  'jobs.added',
  'Add Skill',
];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const createInitialFormData = (): JobFormData => ({
  title: '',
  description: '',
  job_type: 'full_time',
  location_country: 'China',
  location_province: '',
  location_city: '',
  salary_min: '',
  salary_max: '',
  salary_currency: 'CNY',
  salary_period: 'monthly',
  remote_type: 'on_site',
  category_id: '',
  subcategory_id: '',
  experience_level: '',
  education_required: '',
  skills_required: [],
  benefits: [],
  application_email: '',
  application_url: '',
  application_deadline: '',
});

const normalizeText = (value: string) => value.trim().replace(/\s+/g, ' ');
const normalizeKey = (value: string) => normalizeText(value).toLocaleLowerCase();

const sanitizeStringArray = (value: unknown, invalidValues: string[] = []) => {
  const invalid = new Set(invalidValues.map(normalizeKey).filter(Boolean));
  const seen = new Set<string>();
  const source = Array.isArray(value)
    ? value
    : typeof value === 'string'
      ? value.split(',')
      : [];

  return source.reduce<string[]>((result, item) => {
    if (typeof item !== 'string') return result;

    const normalized = normalizeText(item);
    const key = normalizeKey(normalized);

    if (!normalized || invalid.has(key) || seen.has(key)) {
      return result;
    }

    seen.add(key);
    result.push(normalized);
    return result;
  }, []);
};

const hasNormalizedMatch = (items: string[], candidate: string) =>
  items.some((item) => normalizeKey(item) === normalizeKey(candidate));

const normalizeEducationValue = (value: unknown) => {
  if (typeof value !== 'string') return '';

  const normalized = normalizeKey(value);
  if (!normalized) return '';
  if (normalized.includes('no formal') || normalized === 'none' || normalized === 'n/a') return 'No formal education required';
  if (normalized.includes('high school')) return 'High school diploma';
  if (normalized.includes('associate')) return 'Associate degree';
  if (normalized.includes('doctor') || normalized.includes('phd')) return 'Doctorate / PhD';
  if (normalized.includes('master')) return "Master's degree";
  if (normalized.includes('bachelor')) return "Bachelor's degree";
  if (normalized.includes('trade') || normalized.includes('vocational')) return 'Trade school / Vocational training';
  if (normalized.includes('certificate')) return 'Certificate';
  if (normalized.includes('diploma')) return 'Diploma';
  return EDUCATION_OPTIONS.includes(value) ? value : 'Other';
};

const matchesTechnicalCategory = (category?: JobCategory, subcategory?: JobSubcategory) => {
  if (!category) return false;
  if (TECHNICAL_CATEGORY_IDS.has(category.id)) return true;
  if (subcategory && TECHNICAL_SUBCATEGORY_IDS.has(subcategory.id)) return true;

  const technicalKeywords = ['technical', 'maintenance', 'repair', 'technician', 'construction', 'engineer', 'support'];
  const haystack = [
    category.id,
    category.name_en,
    subcategory?.id ?? '',
    subcategory?.name_en ?? '',
  ]
    .join(' ')
    .toLocaleLowerCase();

  return technicalKeywords.some((keyword) => haystack.includes(keyword));
};

const mapJobToFormData = (job: JobRecord): JobFormData => ({
  title: job.title ?? '',
  description: job.description ?? '',
  job_type: job.job_type ?? 'full_time',
  location_country: job.location_country ?? 'China',
  location_province: job.location_province ?? '',
  location_city: job.location_city ?? '',
  salary_min: job.salary_min ? String(job.salary_min) : '',
  salary_max: job.salary_max ? String(job.salary_max) : '',
  salary_currency: job.salary_currency ?? 'CNY',
  salary_period: job.salary_period ?? 'monthly',
  remote_type: job.remote_type ?? 'on_site',
  category_id:
    typeof job.category === 'string' && job.category
      ? job.category
      : typeof job.category_id === 'string' && !UUID_PATTERN.test(job.category_id)
        ? job.category_id
        : '',
  subcategory_id:
    typeof job.subcategory === 'string' && job.subcategory
      ? job.subcategory
      : typeof job.subcategory_id === 'string' && !UUID_PATTERN.test(job.subcategory_id)
        ? job.subcategory_id
        : '',
  experience_level: job.experience_level ?? '',
  education_required: normalizeEducationValue(job.education_required),
  skills_required: sanitizeStringArray(job.skills_required, INVALID_SKILL_VALUES),
  benefits: sanitizeStringArray(job.benefits),
  application_email: job.application_email ?? '',
  application_url: job.application_url ?? '',
  application_deadline: job.application_deadline ? job.application_deadline.slice(0, 10) : '',
});

const getSubmitErrorMessage = (error: unknown) => {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string'
        ? error.message
        : 'Failed to save job';

  if (message.includes('jobs_poster_id_profiles_fkey')) {
    return 'Your employer profile is missing. Open your employer profile once, then try posting again.';
  }

  if (message.includes('profiles_employer_user_id_fkey')) {
    return 'Your account record is not fully synced yet. Sign out, sign back in, and try posting again.';
  }

  if (message.includes('invalid input syntax for type uuid')) {
    return 'The selected job category could not be saved. Refresh the page and try again.';
  }

  if (message.toLocaleLowerCase().includes('row level security')) {
    return 'Your account does not currently have permission to manage jobs. Apply the latest jobs RLS SQL and try again.';
  }

  return message;
};

export function PostJobPage() {
  const navigate = useNavigate();
  const { id: jobId } = useParams();
  const isEditMode = Boolean(jobId);
  const { user } = useAuth();
  const { t, language } = useI18n();
  const { showToast } = useToast();
  const initialFormData = useMemo(() => createInitialFormData(), []);
  const persistenceKey = isEditMode && jobId ? `edit_job_draft_${jobId}` : 'post_job_draft';
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(isEditMode);
  const [error, setError] = useState('');
  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  const {
    data: formData,
    setData: setFormData,
    replaceData,
    clearPersistence,
  } = useFormPersistence({
    key: persistenceKey,
    initialData: initialFormData,
  });

  useEffect(() => {
    if (!isEditMode || !jobId) {
      setLoadingJob(false);
      return;
    }

    let active = true;

    const loadJob = async () => {
      setLoadingJob(true);
      setError('');

      try {
        const job = await jobsService.getJobById(jobId);

        if (!active) return;
        if (!job) {
          setError('Job not found.');
          return;
        }

        if (user?.id && job.poster_id !== user.id) {
          setError('You can only edit jobs you posted.');
          return;
        }

        replaceData(mapJobToFormData(job as JobRecord), true);
      } catch (loadError) {
        if (active) {
          setError(getSubmitErrorMessage(loadError));
        }
      } finally {
        if (active) {
          setLoadingJob(false);
        }
      }
    };

    void loadJob();

    return () => {
      active = false;
    };
  }, [isEditMode, jobId, replaceData, user?.id]);

  const selectedCategory = useMemo(
    () => JOB_CATEGORIES.find((category) => category.id === formData.category_id),
    [formData.category_id]
  );

  const subcategories = selectedCategory?.subcategories ?? [];

  const selectedSubcategory = useMemo(
    () => subcategories.find((subcategory) => subcategory.id === formData.subcategory_id),
    [formData.subcategory_id, subcategories]
  );

  const suggestedSkills = useMemo(
    () => sanitizeStringArray(selectedSubcategory?.skills ?? [], INVALID_SKILL_VALUES),
    [selectedSubcategory]
  );

  const displayedSkills = useMemo(
    () => sanitizeStringArray(formData.skills_required, INVALID_SKILL_VALUES),
    [formData.skills_required]
  );

  const displayedBenefits = useMemo(
    () => sanitizeStringArray(formData.benefits),
    [formData.benefits]
  );

  const suggestedBenefits = matchesTechnicalCategory(selectedCategory, selectedSubcategory)
    ? TECHNICAL_BENEFIT_OPTIONS
    : [];

  const updateField = (field: keyof JobFormData, value: string) => {
    setFormData((previous) => {
      const next = {
        ...previous,
        [field]: value,
      } as JobFormData;

      if (field === 'category_id' && previous.category_id !== value) {
        next.subcategory_id = '';
      }

      return next;
    });
    setError('');
  };

  const addSkill = (rawValue: string) => {
    const [skill] = sanitizeStringArray([rawValue], INVALID_SKILL_VALUES);
    if (!skill) {
      setSkillInput('');
      return;
    }

    setFormData((previous) => ({
      ...previous,
      skills_required: sanitizeStringArray([...previous.skills_required, skill], INVALID_SKILL_VALUES),
    }));
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData((previous) => ({
      ...previous,
      skills_required: previous.skills_required.filter(
        (skill) => normalizeKey(skill) !== normalizeKey(skillToRemove)
      ),
    }));
  };

  const addBenefit = (rawValue: string) => {
    const [benefit] = sanitizeStringArray([rawValue]);
    if (!benefit) {
      setBenefitInput('');
      return;
    }

    setFormData((previous) => ({
      ...previous,
      benefits: sanitizeStringArray([...previous.benefits, benefit]),
    }));
    setBenefitInput('');
  };

  const removeBenefit = (benefitToRemove: string) => {
    setFormData((previous) => ({
      ...previous,
      benefits: previous.benefits.filter(
        (benefit) => normalizeKey(benefit) !== normalizeKey(benefitToRemove)
      ),
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user?.id) {
      setError(t('errors.mustBeLoggedIn') || 'You must be logged in to post a job.');
      return;
    }

    const title = normalizeText(formData.title);
    const description = formData.description.trim();
    const locationCountry = normalizeText(formData.location_country);
    const locationProvince = normalizeText(formData.location_province);
    const locationCity = normalizeText(formData.location_city);
    const skillsRequired = sanitizeStringArray(formData.skills_required, INVALID_SKILL_VALUES);
    const benefits = sanitizeStringArray(formData.benefits);

    if (!title || !description || !locationCity || !formData.category_id || !formData.subcategory_id) {
      setError(t('errors.fillAllRequired') || 'Fill in all required fields.');
      return;
    }

    if (formData.salary_min && formData.salary_max && Number(formData.salary_min) > Number(formData.salary_max)) {
      setError('Minimum salary cannot be greater than maximum salary.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title,
        description,
        category: formData.category_id,
        subcategory: formData.subcategory_id,
        job_type: formData.job_type,
        location: [locationCity, locationProvince, locationCountry].filter(Boolean).join(', '),
        location_country: locationCountry || undefined,
        location_province: locationProvince || undefined,
        location_city: locationCity,
        salary_min: formData.salary_min ? Number(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? Number(formData.salary_max) : undefined,
        salary_currency: formData.salary_currency,
        salary_period: formData.salary_period || undefined,
        remote_type: formData.remote_type,
        experience_level: formData.experience_level || undefined,
        education_required: formData.education_required || undefined,
        skills_required: skillsRequired,
        benefits,
        application_email: normalizeText(formData.application_email) || undefined,
        application_url: normalizeText(formData.application_url) || undefined,
        application_deadline: formData.application_deadline || undefined,
      };

      if (isEditMode && jobId) {
        await jobsService.updateJob(jobId, payload);
      } else {
        await jobsService.createJob({
          poster_id: user.id,
          ...payload,
          status: 'active',
          published_at: new Date().toISOString(),
          featured: false,
        });
      }

      clearPersistence();
      showToast('success', isEditMode ? 'Job updated successfully' : 'Job posted successfully');
      navigate('/jobs/my-jobs');
    } catch (submitError) {
      setError(getSubmitErrorMessage(submitError));
    } finally {
      setLoading(false);
    }
  };

  const backPath = isEditMode ? '/jobs/my-jobs' : '/jobs';
  const pageTitle = isEditMode ? 'Edit Job' : (t('postJob.title') || 'Post a Job');
  const pageDescription = isEditMode
    ? 'Update your listing and keep the structured details accurate.'
    : (t('postJob.description') || 'Create a structured listing to attract the right candidates.');

  if (loadingJob) {
    return (
      <div className="min-h-screen bg-gray-50/50 py-12 relative overflow-hidden">
        <BackgroundBlobs className="opacity-50" />
        <div className="max-w-5xl mx-auto px-4 relative z-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-10 text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600" />
            <p className="text-gray-600">Loading job details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 relative overflow-hidden">
      <BackgroundBlobs className="opacity-50" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <button
          onClick={() => navigate(backPath)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('common.backTo') || 'Back to'} {isEditMode ? (t('myJobs.title') || 'My Jobs') : (t('nav.jobs') || 'Jobs')}
        </button>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-6 sm:p-10">
          <div className="mb-10 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-vibrant-purple/10 text-vibrant-purple text-sm font-bold tracking-wide mb-4 border border-vibrant-purple/20">
              {t('jobs.employerPortal') || 'Employer Portal'}
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-vibrant-purple to-vibrant-pink tracking-tight mb-3">
              {pageTitle}
            </h1>
            <p className="text-gray-600 text-base sm:text-lg font-medium">{pageDescription}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline mr-1" size={16} />
                {t('postJob.jobTitle') || 'Job Title'} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('postJob.jobTitlePlaceholder') || 'Enter the job title'}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('jobs.categories.category') || 'Category'} *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => updateField('category_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">{t('jobs.categories.select') || 'Select a category'}</option>
                  {JOB_CATEGORIES.map((category) => (
                    <option key={category.id} value={category.id}>
                      {language === 'zh' ? category.name_zh : category.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('jobs.categories.subcategory') || 'Subcategory'} *
                </label>
                <select
                  value={formData.subcategory_id}
                  onChange={(e) => updateField('subcategory_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.category_id}
                  required
                >
                  <option value="">{t('jobs.categories.subcategorySelect') || 'Select a subcategory'}</option>
                  {subcategories.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {language === 'zh' ? subcategory.name_zh : subcategory.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('postJob.jobDescription') || 'Job Description'} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('postJob.jobDescriptionPlaceholder') || 'Describe responsibilities, schedule, and expectations'}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.jobType') || 'Job Type'} *
                </label>
                <select
                  value={formData.job_type}
                  onChange={(e) => updateField('job_type', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="full_time">{t('jobs.fullTime') || 'Full time'}</option>
                  <option value="part_time">{t('jobs.partTime') || 'Part time'}</option>
                  <option value="contract">{t('jobs.contract') || 'Contract'}</option>
                  <option value="internship">{t('jobs.internship') || 'Internship'}</option>
                  <option value="freelance">{t('jobs.freelance') || 'Freelance'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.workLocation') || 'Work Location'} *
                </label>
                <select
                  value={formData.remote_type}
                  onChange={(e) => updateField('remote_type', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="on_site">{t('jobs.onSite') || 'On-site'}</option>
                  <option value="remote">{t('jobs.remote') || 'Remote'}</option>
                  <option value="hybrid">{t('jobs.hybrid') || 'Hybrid'}</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline mr-1" size={16} />
                {t('postJob.location') || 'Location'} *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.location_country}
                  onChange={(e) => updateField('location_country', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.locationCountry') || 'Country'}
                  required
                />
                <input
                  type="text"
                  value={formData.location_province}
                  onChange={(e) => updateField('location_province', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.locationProvince') || 'Province / State'}
                />
                <input
                  type="text"
                  value={formData.location_city}
                  onChange={(e) => updateField('location_city', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.locationCity') || 'City'}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline mr-1" size={16} />
                {t('postJob.salaryRange') || 'Salary Range'}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => updateField('salary_min', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.salaryMin') || 'Minimum'}
                />
                <input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => updateField('salary_max', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.salaryMax') || 'Maximum'}
                />
                <select
                  value={formData.salary_currency}
                  onChange={(e) => updateField('salary_currency', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CNY">{t('jobs.salary.currency.CNY') || 'CNY'}</option>
                  <option value="USD">{t('jobs.salary.currency.USD') || 'USD'}</option>
                  <option value="EUR">{t('jobs.salary.currency.EUR') || 'EUR'}</option>
                </select>
                <select
                  value={formData.salary_period}
                  onChange={(e) => updateField('salary_period', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hourly">{t('jobs.salary.period.hourly') || 'Hourly'}</option>
                  <option value="monthly">{t('jobs.salary.period.monthly') || 'Monthly'}</option>
                  <option value="yearly">{t('jobs.salary.period.yearly') || 'Yearly'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.experienceLevel') || 'Experience Level'}
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => updateField('experience_level', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('postJob.anyLevel') || 'Any level'}</option>
                  <option value="entry">{t('jobs.entry') || 'Entry'}</option>
                  <option value="mid">{t('jobs.mid') || 'Mid'}</option>
                  <option value="senior">{t('jobs.senior') || 'Senior'}</option>
                  <option value="executive">{t('jobs.executive') || 'Executive'}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.educationRequired') || 'Education Required'}
                </label>
                <select
                  value={formData.education_required}
                  onChange={(e) => updateField('education_required', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('postJob.educationPlaceholder') || 'Select an education level'}</option>
                  {EDUCATION_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('postJob.requiredSkills') || 'Required Skills'}
              </label>

              {suggestedSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">{t('jobs.suggestedSkills') || 'Suggested skills'}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map((skill) => {
                      const selected = hasNormalizedMatch(displayedSkills, skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            selected
                              ? 'bg-blue-100 border-blue-300 text-blue-700'
                              : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                          }`}
                        >
                          {selected && <Check size={14} />}
                          {skill}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSkill(skillInput);
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('jobs.typeCustomSkill') || 'Type a skill and press Add'}
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('postJob.add') || 'Add'}
                </button>
              </div>

              {displayedSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {displayedSkills.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(skill)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('postJob.benefits') || 'Benefits'}
              </label>

              {suggestedBenefits.length > 0 && (
                <div className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
                  <p className="text-sm font-medium text-emerald-900 mb-2">
                    Suggested benefits for repair, technical, and maintenance roles
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedBenefits.map((benefit) => {
                      const selected = hasNormalizedMatch(displayedBenefits, benefit);
                      return (
                        <button
                          key={benefit}
                          type="button"
                          onClick={() => addBenefit(benefit)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm rounded-full border transition-colors ${
                            selected
                              ? 'bg-emerald-100 border-emerald-300 text-emerald-700'
                              : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                          }`}
                        >
                          {selected && <Check size={14} />}
                          {benefit}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addBenefit(benefitInput);
                    }
                  }}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.benefitPlaceholder') || 'Add a custom benefit'}
                />
                <button
                  type="button"
                  onClick={() => addBenefit(benefitInput)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {t('postJob.add') || 'Add'}
                </button>
              </div>

              {displayedBenefits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {displayedBenefits.map((benefit) => (
                    <span
                      key={benefit}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg flex items-center gap-2"
                    >
                      {benefit}
                      <button
                        type="button"
                        onClick={() => removeBenefit(benefit)}
                        className="text-green-700 hover:text-green-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.applicationEmail') || 'Application Email'}
                </label>
                <input
                  type="email"
                  value={formData.application_email}
                  onChange={(e) => updateField('application_email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="careers@example.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.applicationUrl') || 'Application URL'}
                </label>
                <input
                  type="url"
                  value={formData.application_url}
                  onChange={(e) => updateField('application_url', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.urlPlaceholder') || 'https://example.com/apply'}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline mr-1" size={16} />
                {t('postJob.applicationDeadline') || 'Application Deadline'}
              </label>
              <input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => updateField('application_deadline', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-700 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate(backPath)}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading
                  ? (isEditMode ? 'Saving...' : (t('postJob.posting') || 'Posting...'))
                  : (isEditMode ? 'Save Changes' : (t('postJob.postJob') || 'Post Job'))}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
