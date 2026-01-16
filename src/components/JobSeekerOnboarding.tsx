import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, CheckCircle, GraduationCap, Award,
  Plus, X, ChevronLeft, FileText, ArrowRight, ArrowLeft
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { CategorySelector } from './CategorySelector';
import { CHINA_LOCATIONS } from '../constants/chinaLocations'; // Added import
import { LANGUAGE_PROFICIENCY } from '../constants/jobCategories';
import { OnboardingSuccessModal } from './ui/OnboardingSuccessModal';
import { profileService } from '../services/profileService';
import { BackgroundBlobs } from './ui/BackgroundBlobs';
import { FileUpload } from './ui/FileUpload';
import { PhoneInput } from './ui/PhoneInput'; // Added PhoneInput import

import { ConfirmModal } from './ui/ConfirmModal';

export interface JobSeekerOnboardingProps {
  userId?: string;
  onComplete?: () => void;
  mode?: 'create' | 'edit' | 'view';
  initialData?: any;
}

export function JobSeekerOnboarding({ userId: propUserId, onComplete, mode = 'create', initialData }: JobSeekerOnboardingProps = {}) {
  const isEditing = mode === 'edit' || mode === 'view';
  const isViewOnly = mode === 'view';
  const { user } = useAuth();
  const userId = propUserId || user?.id;
  const { t } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basics & Resume
    resume_url: '',
    first_name: '',
    middle_name: '',
    last_name: '',
    phone: '',
    wechat_id: '',
    current_location_country: 'China',
    current_location_city: '',
    bio: '',

    // Step 2: Preferences
    desired_job_title: '',
    preferred_job_types: [] as string[],
    preferred_remote: 'any',
    salary_min: '',
    categories: [] as string[],
    availability: '', // 'immediate', '2_weeks', etc.

    // Step 3: Work Experience (Detailed)
    work_history: [] as {
      title: string;
      company: string;
      location: string;
      start_date: string;
      end_date: string;
      current: boolean;
      description: string;
    }[],
    years_experience: 0, // Calculated or manual? Keep manual for now.

    // Step 4: Education (Detailed)
    education_history: [] as {
      school: string;
      degree: string;
      field_of_study: string;
      start_date: string;
      end_date: string;
      current: boolean;
    }[],
    highest_education: '', // Derivable, but keeping for compatibility

    // Step 5: Skills & Certifications
    skills: [] as string[],
    languages: [] as { language: string; proficiency: string }[],
    certifications: [] as {
      name: string;
      issuer: string;
      issue_date: string;
    }[],
  });

  // Fetch existing data for Edit/View mode
  useEffect(() => {
    if (initialData) {
       setFormData(prev => ({ ...prev, ...initialData }));
       return;
    }

    async function loadExistingProfile() {
      if (!userId || mode === 'create') return;
      
      try {
        // Fetch Job Seeker Profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles_jobseeker')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (profileError) throw profileError;

        // Fetch Job Preferences
        const { data: prefs, error: prefsError } = await supabase
          .from('job_preferences')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (prefsError) throw prefsError;
        
        if (profile) {
          const names = (profile.full_name || '').split(' ');
          const first_name = names[0] || '';
          const last_name = names.length > 1 ? names[names.length - 1] : '';
          const middle_name = names.length > 2 ? names.slice(1, -1).join(' ') : '';

          setFormData(prev => ({
            ...prev,
            resume_url: profile.resume_url || '',
            first_name,
            middle_name,
            last_name,
            phone: profile.phone || '',
            wechat_id: profile.wechat_id || '',
            current_location_country: profile.current_location_country || 'China',
            current_location_city: profile.current_location_city || '',
            bio: profile.bio || '',
            desired_job_title: profile.desired_job_title || '',
            years_experience: profile.years_experience || 0,
            highest_education: profile.highest_education || '',
            skills: profile.skills || [],
            languages: profile.languages || [],
            work_history: profile.work_history || [],
            education_history: profile.education_history || [],
            certifications: profile.certifications || [],
            availability: profile.availability || '',
            preferred_job_types: prefs?.preferred_job_types || [],
            preferred_remote: prefs?.remote_preference || 'any',
            salary_min: prefs?.salary_min?.toString() || '',
            categories: prefs?.preferred_categories || [],
          }));
        }
      } catch (err) {
        console.error('Error loading existing job seeker profile:', err);
      }
    }

    loadExistingProfile();
  }, [userId, mode, initialData]);

  // Temporary state for repeaters
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentLanguage, setCurrentLanguage] = useState({ language: '', proficiency: '' });
  const [currentWork, setCurrentWork] = useState({
    title: '', company: '', location: '', start_date: '', end_date: '', current: false, description: ''
  });
  const [currentEducation, setCurrentEducation] = useState({
    school: '', degree: '', field_of_study: '', start_date: '', end_date: '', current: false
  });
  const [currentCert, setCurrentCert] = useState({ name: '', issuer: '', issue_date: '' });

  const totalSteps = 5;

  const allCities = useMemo(() => {
    return CHINA_LOCATIONS.flatMap(province => 
      province.cities.map(city => ({
        ...city,
        province: province.name_en,
        // Create a unique value for key/selection logic if needed, 
        // but simple name_en is requested "from A to Z"
      }))
    ).sort((a, b) => a.name_en.localeCompare(b.name_en));
  }, []);

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleJobType = (type: string) => {
    setFormData(prev => ({
      ...prev,
      preferred_job_types: prev.preferred_job_types.includes(type)
        ? prev.preferred_job_types.filter(t => t !== type)
        : [...prev.preferred_job_types, type]
    }));
  };

  const addSkill = () => {
    if (currentSkill.trim()) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, currentSkill.trim()]
      }));
      setCurrentSkill('');
    }
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter((_, i) => i !== index)
    }));
  };

  const addLanguage = () => {
    if (currentLanguage.language && currentLanguage.proficiency) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, { ...currentLanguage }]
      }));
      setCurrentLanguage({ language: '', proficiency: '' });
    }
  };

  const removeLanguage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter((_, i) => i !== index)
    }));
  };

  const addWork = () => {
    if (currentWork.title && currentWork.company) {
      setFormData(prev => ({
        ...prev,
        work_history: [...prev.work_history, { ...currentWork }]
      }));
      setCurrentWork({ title: '', company: '', location: '', start_date: '', end_date: '', current: false, description: '' });
    }
  };

  const removeWork = (index: number) => {
    setFormData(prev => ({
      ...prev,
      work_history: prev.work_history.filter((_, i) => i !== index)
    }));
  };

  const addEducation = () => {
    if (currentEducation.school && currentEducation.degree) {
      setFormData(prev => ({
        ...prev,
        education_history: [...prev.education_history, { ...currentEducation }]
      }));
      setCurrentEducation({ school: '', degree: '', field_of_study: '', start_date: '', end_date: '', current: false });
    }
  };

  const removeEducation = (index: number) => {
    setFormData(prev => ({
      ...prev,
      education_history: prev.education_history.filter((_, i) => i !== index)
    }));
  };

  const addCertification = () => {
    if (currentCert.name) {
      setFormData(prev => ({
        ...prev,
        certifications: [...prev.certifications, { ...currentCert }]
      }));
      setCurrentCert({ name: '', issuer: '', issue_date: '' });
    }
  };

  const removeCertification = (index: number) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!userId) {
      alert(t('common.signInRequired'));
      navigate('/signin');
      return;
    }

    setLoading(true);
    try {
      // Verify profile exists first to prevent FK error
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profileCheck) {
        if (user) {
           // Auto-create profile if missing
           const { error: insertProfileError } = await supabase.from('profiles').insert({
              id: userId,
              display_name: user.email?.split('@')[0] || 'User',
              email: user.email,
              role: 'job_seeker', 
              updated_at: new Date().toISOString()
           });
           if (insertProfileError) {
             console.error('Failed to auto-create missing profile:', insertProfileError);
             throw new Error('User profile missing. Please contact support.');
           }
        }
      }

      const profileData: Record<string, unknown> = {
        user_id: userId,
        full_name: `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim(),
        current_location_country: formData.current_location_country,
        current_location_city: formData.current_location_city,
        phone: formData.phone,
        wechat_id: formData.wechat_id,
        bio: formData.bio,
        resume_url: formData.resume_url,
        desired_job_title: formData.desired_job_title,
        years_experience: formData.years_experience,
        highest_education: formData.highest_education, // Should derive from history technically
        skills: formData.skills,
        languages: formData.languages,
        work_history: formData.work_history,
        education_history: formData.education_history,
        certifications: formData.certifications,
        availability: formData.availability,
        profile_completion_percent: 100,
      };

      await supabase.from('profiles_jobseeker').upsert({
        ...profileData,
        status: 'active'
      });

      await supabase.from('job_preferences').upsert({
        user_id: userId,
        preferred_job_types: formData.preferred_job_types,
        remote_preference: formData.preferred_remote,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
        salary_currency: 'CNY',
        preferred_categories: formData.categories,
      });

      // Update user_services to mark onboarding complete
      const { error: serviceError } = await supabase
        .from('user_services')
        .update({ onboarding_completed: true })
        .eq('user_id', userId)
        .eq('service_type', 'jobs');

      if (serviceError) {
        console.warn('Could not update user_services (non-critical):', serviceError);
      }

      // Mark jobs onboarding as completed
      await profileService.completeModuleOnboarding('jobs');

      // Show success modal instead of navigating immediately
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Failed to save profile:', error);
      alert(t('common.failedToSaveProfile'));
    } finally {
      setLoading(false);
    }
  };


// ... inside the component return ...

  return (
    <div className={`min-h-screen bg-gray-50/50 flex items-center justify-center p-4 relative overflow-hidden ${isEditing ? 'py-12' : ''}`}>
      {!isEditing && <BackgroundBlobs className="opacity-60" />}

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 max-w-4xl w-full p-8 transition-all duration-300 relative z-10">
        {/* Back Button */}
        <button
          onClick={() => isEditing ? navigate('/jobs') : navigate('/jobs/role-selection')}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-vibrant-purple transition-colors font-medium group"
        >
          <div className="bg-white p-2 rounded-full shadow-sm group-hover:shadow-md transition-all">
              <ChevronLeft size={18} />
          </div>
          <span className="text-sm">{isEditing ? t('common.backToJobs') : t('common.back')}</span>
        </button>

        <div className="mb-8">
          {!isEditing ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibrant-purple to-vibrant-pink tracking-tight">
                    {t('jobsOnboarding.jobSeekerProfile')}
                </h2>
                <span className="px-3 py-1 rounded-full bg-vibrant-purple/10 text-vibrant-purple text-xs font-bold uppercase tracking-wider border border-vibrant-purple/20">
                  {t('common.step')} {step} / {totalSteps}
                </span>
              </div>
              {/* Progress Bar */}
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                <div
                  className="bg-gradient-to-r from-vibrant-purple to-vibrant-pink h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-vibrant-purple to-vibrant-pink tracking-tight mb-2">
                {t('common.editProfile') || 'Edit Profile'}
              </h2>
              <p className="text-gray-500">{t('jobsOnboarding.editProfileDesc')}</p>
            </div>
          )}
        </div>

        <div className={`space-y-12 ${isEditing ? 'max-h-[70vh] overflow-y-auto pr-4' : ''}`}>
          {/* Step 1: Basics & Resume */}
          {(isEditing || step === 1) && (
            <div className="space-y-6">
              {isEditing && <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">{t('jobsOnboarding.basics')}</h3>}
              <div className="text-center mb-6">
                {!isEditing && (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                      <FileText className="text-blue-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.resumeAndBasics')}</h3>
                    <p className="text-gray-600">{t('jobsOnboarding.resumeAndBasicsDescription')}</p>
                  </>
                )}
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-6">
                <label className="block text-sm font-semibold text-blue-900 mb-2">
                  {t('jobsOnboarding.resumeUrl')}
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-2">{t('jobsOnboarding.resumeUrl')}</label>
                    <input
                      type="url"
                      value={formData.resume_url}
                      onChange={(e) => updateField('resume_url', e.target.value)}
                      className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:text-gray-500"
                      placeholder={t('jobsOnboarding.resumePlaceholder')}
                      disabled={isViewOnly}
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-blue-200"></div></div>
                    <div className="relative flex justify-center text-xs"><span className="px-2 bg-blue-50 text-blue-600 font-medium">{t('common.or')}</span></div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-blue-800 mb-2">{t('jobsOnboarding.uploadResume')}</label>
                    <FileUpload
                      value={formData.resume_url.startsWith('http') ? '' : formData.resume_url}
                      onChange={(url) => updateField('resume_url', url)}
                      bucketName="resumes"
                      acceptedTypes=".pdf,.doc,.docx"
                      maxSizeMB={10}
                      disabled={isViewOnly}
                    />
                  </div>
                </div>
                <p className="text-xs text-blue-600 mt-3">{t('jobsOnboarding.resumeTip')}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{t('jobsOnboarding.firstName')} *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => updateField('first_name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10 bg-white disabled:bg-gray-100"
                    placeholder={t('jobsOnboarding.firstNamePlaceholder')}
                    required
                    disabled={isViewOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{t('jobsOnboarding.middleName')} <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    value={formData.middle_name}
                    onChange={(e) => updateField('middle_name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10 bg-white disabled:bg-gray-100"
                    placeholder={t('jobsOnboarding.middleNamePlaceholder')}
                    disabled={isViewOnly}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{t('jobsOnboarding.lastName')} *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => updateField('last_name', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10 bg-white disabled:bg-gray-100"
                    placeholder={t('jobsOnboarding.lastNamePlaceholder')}
                    required
                    disabled={isViewOnly}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <PhoneInput
                  value={formData.phone}
                  onChange={(value) => updateField('phone', value)}
                  label={t('jobsOnboarding.phone')}
                  defaultCountryCode="+86"
                  disabled={isViewOnly}
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{t('jobsOnboarding.wechatId')} <span className="text-gray-400 font-normal">(Optional)</span></label>
                  <input
                    type="text"
                    value={formData.wechat_id}
                    onChange={(e) => updateField('wechat_id', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10 bg-white disabled:bg-gray-100"
                    placeholder={t('jobsOnboarding.yourWechatId')}
                    disabled={isViewOnly}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5 ml-1">{t('jobsOnboarding.currentCity')} *</label>
                <select 
                  value={formData.current_location_city}
                  onChange={(e) => updateField('current_location_city', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-vibrant-purple focus:ring-4 focus:ring-vibrant-purple/10 bg-white disabled:bg-gray-100"
                  required
                  disabled={isViewOnly}
                >
                  <option value="">{t('jobsOnboarding.selectCity')}</option>
                  {allCities.map((city, idx) => (
                      <option key={`${city.province}-${city.name_en}-${idx}`} value={city.name_en}>
                          {city.name_en} ({city.province})
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.bio')}</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => updateField('bio', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-100"
                  placeholder={t('jobsOnboarding.bioPlaceholder')}
                  disabled={isViewOnly}
                />
              </div>
            </div>
          )}

          {/* Step 2: Preferences */}
          {(isEditing || step === 2) && (
            <div className="space-y-6">
              {isEditing && <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">{t('jobsOnboarding.preferences')}</h3>}
              <div className="text-center mb-6">
                {!isEditing && (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                      <Briefcase className="text-green-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.preferences')}</h3>
                    <p className="text-gray-600">{t('jobsOnboarding.preferencesDescription')}</p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.desiredJobTitle')} *</label>
                <input
                  type="text"
                  value={formData.desired_job_title}
                  onChange={(e) => updateField('desired_job_title', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  placeholder={t('jobsOnboarding.enterJobTitle')}
                  disabled={isViewOnly}
                />
              </div>

              <CategorySelector
                value={formData.categories}
                onChange={(cats) => updateField('categories', cats)}
                label={t('jobsOnboarding.preferredCategories')}
                placeholder={t('jobsOnboarding.selectCategories')}
                showSubcategories={true}
                disabled={isViewOnly}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">{t('jobsOnboarding.preferredJobTypes')}</label>
                <div className="grid grid-cols-2 gap-3">
                  {['full_time', 'part_time', 'contract', 'internship', 'freelance'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => !isViewOnly && toggleJobType(type)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        formData.preferred_job_types.includes(type)
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-medium'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${isViewOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {t(`jobTypes.${type}`)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.remotePreference')}</label>
                  <select
                    value={formData.preferred_remote}
                    onChange={(e) => updateField('preferred_remote', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white disabled:bg-gray-100"
                    disabled={isViewOnly}
                  >
                    <option value="any">{t('remotePreference.any')}</option>
                    <option value="on_site">{t('remotePreference.on_site')}</option>
                    <option value="remote">{t('remotePreference.remote')}</option>
                    <option value="hybrid">{t('remotePreference.hybrid')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.minSalary')}</label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => updateField('salary_min', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg disabled:bg-gray-100"
                    placeholder={t('jobsOnboarding.salaryPlaceholder')}
                    disabled={isViewOnly}
                  />
                </div>
              </div>

              <div>
                 <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.availability')}</label>
                 <select
                   value={formData.availability}
                   onChange={(e) => updateField('availability', e.target.value)}
                   className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg bg-white disabled:bg-gray-100"
                   disabled={isViewOnly}
                 >
                   <option value="">{t('common.select')}</option>
                   <option value="immediate">{t('availability.immediate')}</option>
                   <option value="two_weeks">{t('availability.two_weeks')}</option>
                   <option value="one_month">{t('availability.one_month')}</option>
                   <option value="more_than_month">{t('availability.more_than_month')}</option>
                 </select>
              </div>
            </div>
          )}

          {/* Step 3: Experience */}
          {(isEditing || step === 3) && (
            <div className="space-y-6">
              {isEditing && <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">{t('jobsOnboarding.experience')}</h3>}
              <div className="text-center mb-6">
                {!isEditing && (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-100 rounded-full mb-4">
                      <Briefcase className="text-orange-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.workHistory')}</h3>
                    <p className="text-gray-600">{t('jobsOnboarding.workHistoryDescription')}</p>
                  </>
                )}
              </div>

              <div className="bg-orange-50 p-6 rounded-xl border border-orange-100">
                {!isViewOnly && (
                  <>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} /> {t('jobsOnboarding.addExperience')}</h4>
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={currentWork.title}
                        onChange={(e) => setCurrentWork({ ...currentWork, title: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                        placeholder={t('jobsOnboarding.jobTitle')}
                      />
                      <input
                        type="text"
                        value={currentWork.company}
                        onChange={(e) => setCurrentWork({ ...currentWork, company: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-200 rounded-lg"
                        placeholder={t('jobsOnboarding.company')}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={currentWork.start_date} onChange={(e) => setCurrentWork({ ...currentWork, start_date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg" />
                        <input type="date" value={currentWork.end_date} onChange={(e) => setCurrentWork({ ...currentWork, end_date: e.target.value })} disabled={currentWork.current} className="w-full px-4 py-3 border border-gray-200 rounded-lg disabled:bg-gray-100" />
                      </div>
                      <label className="flex items-center gap-2 text-sm text-gray-700">
                        <input type="checkbox" checked={currentWork.current} onChange={(e) => setCurrentWork({ ...currentWork, current: e.target.checked })} className="rounded text-orange-600" />
                        {t('jobsOnboarding.currentRole')}
                      </label>
                      <textarea value={currentWork.description} onChange={(e) => setCurrentWork({ ...currentWork, description: e.target.value })} rows={3} className="w-full px-4 py-3 border border-gray-200 rounded-lg resize-none" placeholder={t('jobsOnboarding.description')} />
                      <button type="button" onClick={addWork} className="w-full py-3 bg-orange-600 text-white rounded-lg font-medium">{t('common.add')}</button>
                    </div>
                  </>
                )}
              </div>

              {formData.work_history.length > 0 && (
                <div className="space-y-3">
                  {formData.work_history.map((work, idx) => (
                    <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-gray-900">{work.title}</h5>
                        <p className="text-gray-600">{work.company}</p>
                        <p className="text-sm text-gray-500 mt-1">{work.start_date} - {work.current ? t('common.present') : work.end_date}</p>
                      </div>
                      {!isViewOnly && <button onClick={() => removeWork(idx)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Education */}
          {(isEditing || step === 4) && (
            <div className="space-y-6">
              {isEditing && <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">{t('jobsOnboarding.education')}</h3>}
              <div className="text-center mb-6">
                {!isEditing && (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                      <GraduationCap className="text-purple-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.education')}</h3>
                    <p className="text-gray-600">{t('jobsOnboarding.educationDescription')}</p>
                  </>
                )}
              </div>

              <div className="bg-purple-50 p-6 rounded-xl border border-purple-100">
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('jobsOnboarding.highestEducation')}</label>
                  <select
                    value={formData.highest_education}
                    onChange={(e) => updateField('highest_education', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 bg-white disabled:bg-gray-100"
                    disabled={isViewOnly}
                  >
                    <option value="">{t('common.select')}</option>
                    <option value="High School">{t('degree.High School')}</option>
                    <option value="Associate">{t('degree.Associate')}</option>
                    <option value="Bachelor's">{t('degree.Bachelor\'s')}</option>
                    <option value="Master's">{t('degree.Master\'s')}</option>
                    <option value="PhD">{t('degree.PhD')}</option>
                    <option value="Other">{t('degree.Other')}</option>
                  </select>
                </div>

                {!isViewOnly && (
                  <>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} /> {t('jobsOnboarding.addEducation')}</h4>
                    <div className="space-y-3">
                      <input type="text" value={currentEducation.school} onChange={(e) => setCurrentEducation({ ...currentEducation, school: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg" placeholder={t('jobsOnboarding.school')} />
                      <div className="grid grid-cols-2 gap-3">
                        <select value={currentEducation.degree} onChange={(e) => setCurrentEducation({ ...currentEducation, degree: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-white">
                           <option value="">{t('jobsOnboarding.degree')}</option>
                           <option value="High School">{t('degree.High School')}</option>
                           <option value="Associate">{t('degree.Associate')}</option>
                           <option value="Bachelor's">{t('degree.Bachelor\'s')}</option>
                           <option value="Master's">{t('degree.Master\'s')}</option>
                           <option value="PhD">{t('degree.PhD')}</option>
                        </select>
                        <input type="text" value={currentEducation.field_of_study} onChange={(e) => setCurrentEducation({ ...currentEducation, field_of_study: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg" placeholder={t('jobsOnboarding.fieldOfStudy')} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="date" value={currentEducation.start_date} onChange={(e) => setCurrentEducation({ ...currentEducation, start_date: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg" />
                        <input type="date" value={currentEducation.end_date} onChange={(e) => setCurrentEducation({ ...currentEducation, end_date: e.target.value })} disabled={currentEducation.current} className="w-full px-4 py-3 border border-gray-200 rounded-lg disabled:bg-gray-100" />
                      </div>
                      <button type="button" onClick={addEducation} className="w-full py-3 bg-purple-600 text-white rounded-lg font-medium">{t('common.add')}</button>
                    </div>
                  </>
                )}
              </div>

              {formData.education_history.length > 0 && (
                <div className="space-y-3">
                  {formData.education_history.map((edu, idx) => (
                    <div key={idx} className="p-4 bg-white border border-gray-200 rounded-lg flex justify-between items-start">
                      <div>
                        <h5 className="font-bold text-gray-900">{edu.school}</h5>
                        <p className="text-gray-600">{edu.degree} in {edu.field_of_study}</p>
                        <p className="text-sm text-gray-500 mt-1">{edu.start_date} - {edu.end_date}</p>
                      </div>
                      {!isViewOnly && <button onClick={() => removeEducation(idx)} className="text-gray-400 hover:text-red-500"><X size={20} /></button>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 5: Skills & Final */}
          {(isEditing || step === 5) && (
            <div className="space-y-6">
              {isEditing && <h3 className="text-xl font-bold text-gray-900 border-b pb-2 mb-4">{t('jobsOnboarding.skillsAndCertifications')}</h3>}
              <div className="text-center mb-6">
                {!isEditing && (
                  <>
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-pink-100 rounded-full mb-4">
                      <Award className="text-pink-600" size={32} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.skillsAndCertifications')}</h3>
                    <p className="text-gray-600">{t('jobsOnboarding.skillsDescription')}</p>
                  </>
                )}
              </div>

              {/* Skills Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.skills')}</label>
                {!isViewOnly && (
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentSkill}
                      onChange={(e) => setCurrentSkill(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                      className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg"
                      placeholder={t('jobsOnboarding.addSkillPlaceholder')}
                    />
                    <button type="button" onClick={addSkill} className="px-6 py-3 bg-gray-900 text-white rounded-lg">{t('common.add')}</button>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill, index) => (
                    <span key={index} className="px-3 py-1.5 bg-pink-50 text-pink-700 rounded-lg flex items-center gap-2">
                      {skill}
                      {!isViewOnly && <button type="button" onClick={() => removeSkill(index)}><X size={14} /></button>}
                    </span>
                  ))}
                </div>
              </div>

              {/* Languages Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.languages')}</label>
                {!isViewOnly && (
                  <div className="flex gap-2 mb-2">
                    <select value={currentLanguage.language} onChange={(e) => setCurrentLanguage({ ...currentLanguage, language: e.target.value })} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-white">
                      <option value="">{t('jobsOnboarding.selectLanguage')}</option>
                      <option value="English">{t('languages.English')}</option>
                      <option value="Chinese (Mandarin)">{t('languages.Chinese (Mandarin)')}</option>
                      <option value="Cantonese">{t('languages.Cantonese')}</option>
                      <option value="Spanish">{t('languages.Spanish')}</option>
                      <option value="French">{t('languages.French')}</option>
                    </select>
                    <select value={currentLanguage.proficiency} onChange={(e) => setCurrentLanguage({ ...currentLanguage, proficiency: e.target.value })} className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg bg-white">
                      <option value="">{t('jobsOnboarding.proficiency')}</option>
                      {LANGUAGE_PROFICIENCY.map(level => <option key={level} value={level}>{t(`proficiency.${level}`)}</option>)}
                    </select>
                    <button type="button" onClick={addLanguage} className="px-6 py-3 bg-gray-900 text-white rounded-lg">{t('common.add')}</button>
                  </div>
                )}
                <div className="space-y-2">
                  {formData.languages.map((lang, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>{lang.language} | {lang.proficiency}</span>
                      {!isViewOnly && <button type="button" onClick={() => removeLanguage(index)} className="text-gray-400 hover:text-red-500"><X size={18} /></button>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Certifications Section */}
              <div>
                 {!isViewOnly && (
                   <>
                     <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2"><Plus size={18} /> {t('jobsOnboarding.addCertification')}</h4>
                     <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <input type="text" value={currentCert.name} onChange={(e) => setCurrentCert({ ...currentCert, name: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg" placeholder={t('jobsOnboarding.certName')} />
                      <input type="text" value={currentCert.issuer} onChange={(e) => setCurrentCert({ ...currentCert, issuer: e.target.value })} className="w-full px-4 py-3 border border-gray-200 rounded-lg" placeholder={t('jobsOnboarding.issuingOrg')} />
                      <div className="flex gap-3">
                          <input type="date" value={currentCert.issue_date} onChange={(e) => setCurrentCert({ ...currentCert, issue_date: e.target.value })} className="flex-1 px-4 py-3 border border-gray-200 rounded-lg" />
                           <button type="button" onClick={addCertification} className="flex-1 py-3 bg-gray-900 text-white rounded-lg">{t('common.add')}</button>
                      </div>
                    </div>
                   </>
                 )}
                {formData.certifications.length > 0 && (
                  <div className="space-y-2 mt-4">
                    {formData.certifications.map((cert, idx) => (
                      <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center">
                        <div><p className="font-bold">{cert.name}</p><p className="text-sm text-gray-600">{cert.issuer} • {cert.issue_date}</p></div>
                        {!isViewOnly && <button onClick={() => removeCertification(idx)} className="text-gray-400"><X size={18} /></button>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between mt-8 pt-8 border-t border-gray-100">
          {!isEditing ? (
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-6 py-3 border-2 border-gray-100 rounded-xl hover:bg-gray-50 transition-all font-medium text-gray-600"
            >
              <ArrowLeft size={20} />
              {step === 1 ? t('jobsOnboarding.changeRole') : t('common.back')}
            </button>
          ) : (
            <div /> // Spacer
          )}

          {/* View Only Mode: Show Nothing or maybe a Back button if needed */}
          {isViewOnly ? null : (
            (!isEditing && step < totalSteps) ? (
              <button
                onClick={handleNext}
                className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-lg shadow-blue-200 ml-auto"
              >
                {t('common.next')}
                <ArrowRight size={20} />
              </button>
            ) : (
              <button
                 onClick={() => isEditing ? setShowSaveConfirm(true) : handleSubmit()}
                 disabled={loading || !formData.first_name || !formData.last_name}
                className="flex items-center gap-2 px-10 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all font-semibold shadow-lg shadow-indigo-200 disabled:opacity-50 disabled:cursor-not-allowed ml-auto"
              >
                {loading 
                  ? t('common.saving')
                  : (isEditing ? t('common.saveChanges') : t('common.complete'))}
                <CheckCircle size={20} />
              </button>
            )
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => {
          setShowSaveConfirm(false);
          handleSubmit();
        }}
        title={t('common.confirmSaveTitle') || "Save Changes?"}
        message={t('common.confirmSaveMessage') || "Are you sure you want to save these changes? This action is irreversible."}
        confirmText={t('common.saveChanges')}
        type="danger"
      />

      <OnboardingSuccessModal
        isOpen={showSuccessModal}
        title={t('jobsOnboarding.successTitle')}
        message={t('jobsOnboarding.successMessage')}
        redirectPath="/jobs"
        onClose={() => {
          setShowSuccessModal(false);
          if (onComplete) onComplete();
        }}
      />

      {/* Saving Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-600 border-t-transparent"></div>
           </div>
           <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('jobsOnboarding.creatingProfile')}</h3>
           <p className="text-gray-500">{t('jobsOnboarding.waitMessage')}</p>
        </div>
      )}
    </div>
  );
}
