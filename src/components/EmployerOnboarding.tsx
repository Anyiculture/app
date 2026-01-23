import { useState, useEffect } from 'react';
import { 
  Building, Globe, CheckCircle, ArrowRight,  
  ChevronLeft, Code 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { profileService } from '../services/profileService';
import { getAllProvinces, getCitiesForProvince } from '../constants/chinaLocations';
import { COMMON_TECHNOLOGIES, COMPANY_SIZE_OPTIONS } from '../constants/companyInfo';
import { ImageUpload } from './ui/ImageUpload';
import { Select } from './ui/Select';
import { ConfirmModal } from './ui/ConfirmModal';

interface EmployerOnboardingProps {
  userId?: string;
  onComplete?: () => void;
  mode?: 'create' | 'edit' | 'view';
  initialData?: any;
  adminMode?: boolean;
}

export function EmployerOnboarding({ userId: propUserId, onComplete, mode = 'create', initialData }: EmployerOnboardingProps) {
  const isEditing = mode === 'edit' || mode === 'view';
  const isViewOnly = mode === 'view';
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  
  const userId = propUserId || user?.id; // Fallback to auth user

  const handleComplete = () => {
    if (onComplete) {
      onComplete();
    } else {
      navigate('/employer/dashboard'); // Redirect to employer dashboard
    }
  };

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_type: 'employer' as 'employer' | 'agency',
    industry: '',
    company_size: '',
    founded_year: '',
    company_description: '',
    
    // Location - China only
    registration_country: 'China',
    registration_province: '',
    registration_city: '',
    office_address: '',
    
    // Images
    company_logo: '', // Removed default logo
    company_license_url: '',
    company_images: [] as string[],
    
    // Technologies
    technologies: [] as string[],
    
    // Online presence
    website: '',
    linkedin_url: '',
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
        const { data, error } = await supabase
          .from('profiles_employer')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setFormData({
            company_name: data.company_name || '',
            company_type: data.company_type || 'employer',
            industry: data.industry || '',
            company_size: data.company_size || '',
            founded_year: data.founded_year?.toString() || '',
            company_description: data.company_description || '',
            registration_country: data.registration_country || 'China',
            registration_province: data.registration_province || '',
            registration_city: data.registration_city || '',
            office_address: data.office_address || '',
            company_logo: data.company_logo || '',
            company_license_url: data.company_license_url || '',
            company_images: data.company_images || [],
            technologies: data.technologies || [],
            website: data.website || '',
            linkedin_url: data.linkedin_url || '',
          });
        }
      } catch (err) {
        console.error('Error loading existing employer profile:', err);
      }
    }

    loadExistingProfile();
  }, [userId, mode, initialData]);

  const totalSteps = 5;
  const availableCities = formData.registration_province 
    ? getCitiesForProvince(formData.registration_province) 
    : [];

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      // Reset city when province changes
      if (field === 'registration_province') {
        updated.registration_city = '';
      }
      return updated;
    });
  };

  const toggleTechnology = (tech: string) => {
    setFormData(prev => ({
      ...prev,
      technologies: prev.technologies.includes(tech)
        ? prev.technologies.filter(t => t !== tech)
        : [...prev.technologies, tech]
    }));
  };

  const handleNext = async () => {
    setError(null);
    
    // Validation
    if (step === 1) {
      if (!formData.company_name || !formData.industry || !formData.company_size) {
        setError(t('common.required'));
        return;
      }
    } else if (step === 2) {
      if (!formData.registration_province || !formData.registration_city) {
        setError(t('common.required'));
        return;
      }
    } else if (step === 3) {
      if (!formData.company_license_url) {
        setError(t('jobsOnboarding.companyLicenseRequired'));
        return;
      }
    }
    
    if (step < totalSteps) {
      // Skip Tech Stack (step 4) if not technology industry
      if (step === 3 && formData.industry !== 'technology') {
        setStep(5);
      } else {
        setStep(step + 1);
      }
    }
  };

  const handleBack = () => {
    if (step === 1) {
      // If user wants to go back from step 1, go to jobs dashboard instead of role selection
      // This prevents loop if they are already assigned a role
      navigate('/jobs');
      return;
    }
    if (step > 1) {
      // Skip Tech Stack (step 4) if not technology industry when going back
      if (step === 5 && formData.industry !== 'technology') {
        setStep(3);
      } else {
        setStep(step - 1);
      }
      setError(null);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Verify profile exists first to prevent FK error
      const { data: profileCheck } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .maybeSingle();

      if (!profileCheck) {
        // If profile doesn't exist, create it from auth user metadata if possible or error
        // For now, we assume user is authenticated and should have a profile in triggers
        // But if trigger failed, we might need manual insert. 
        // Let's try to insert a minimal profile if missing
        if (user) {
          const { error: insertProfileError } = await supabase.from('profiles').insert({
              id: userId,
              display_name: user.email?.split('@')[0] || 'User',
              email: user.email,
              role: 'employer',
              updated_at: new Date().toISOString()
          });
          if (insertProfileError) {
             console.error('Failed to auto-create missing profile:', insertProfileError);
             throw new Error('User profile missing. Please contact support.');
          }
        }
      }

      const { error: upsertError } = await supabase.from('profiles_employer').upsert({
        user_id: userId,
        company_name: formData.company_name,
        company_type: formData.company_type,
        industry: formData.industry,
        company_size: formData.company_size || null,
        founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
        company_description: formData.company_description || null,
        
        registration_country: 'China',
        registration_province: formData.registration_province,
        registration_city: formData.registration_city,
        office_address: formData.office_address || null,
        
        company_logo: formData.company_logo || null,
        company_license_url: formData.company_license_url || null,
        company_images: formData.company_images.length > 0 ? formData.company_images : null,
        
        technologies: formData.technologies.length > 0 ? formData.technologies : null,
        
        website: formData.website || null,
        linkedin_url: formData.linkedin_url || null,
        
        profile_completion_percent: 100,
        verified: false,
      });

      if (upsertError) throw upsertError;

      // Update user_services to mark onboarding complete
      const { error: serviceError } = await supabase
        .from('user_services')
        .update({ onboarding_completed: true })
        .eq('user_id', userId)
        .eq('service_type', 'jobs');

      if (serviceError) {
        console.warn('Could not update user_services:', serviceError);
      }

      // Mark jobs onboarding as completed in profile
      await profileService.completeModuleOnboarding('jobs');

      handleComplete();
    } catch (error: any) {
      console.error('Failed to save profile:', error);
      setError(error.message || 'Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft size={20} />
            <span className="text-sm font-medium">{t('common.back')}</span>
          </button>
          
          <div className="flex items-center gap-2 text-sm font-medium text-gray-500">
             <span>{t('common.step')} {step} {t('common.of')} {totalSteps}</span>
          </div>
        </div>

        {/* Progress Bar - Only show if not editing */}
        {!isEditing && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {step === 1 && t('jobsOnboarding.companyInfo')}
                {step === 2 && t('industries.location')}
                {step === 3 && t('jobsOnboarding.imagesAndCulture')}
                {step === 4 && t('jobsOnboarding.techStack')}
                {step === 5 && t('jobsOnboarding.onlinePresence')}
              </h2>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-600 h-2 rounded-full transition-all duration-500 ease-in-out"
                style={{ width: `${(step / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        )}

        {isEditing && (
          <div className="mb-8 p-4 bg-emerald-50 rounded-xl border border-emerald-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <Building className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('common.editProfile') || 'Edit Profile'}</h2>
                <p className="text-sm text-emerald-700">{t('jobsOnboarding.updateCompanyInfo') || 'Update your company information below'}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
            <div className="w-1 h-4 bg-red-500 rounded-full"/>
            {error}
          </div>
        )}

        <div className={`space-y-12 ${isEditing ? 'max-h-[70vh] overflow-y-auto pr-2' : ''}`}>
          {/* Step 1: Company Info */}
          {(isEditing || step === 1) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               {isEditing && <h3 className="text-lg font-bold text-gray-900 pb-2 border-b">{t('jobsOnboarding.companyInfo')}</h3>}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.companyName')}</label>
                   <input
                     type="text"
                     value={formData.company_name}
                     onChange={(e) => updateField('company_name', e.target.value)}
                     className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100"
                     placeholder={t('jobs.companyNamePlaceholder')}
                     disabled={isViewOnly}
                   />
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.industry')}</label>
                   <Select
                      value={formData.industry}
                      onChange={(e) => updateField('industry', e.target.value)}
                      className="w-full"
                      disabled={isViewOnly}
                    >
                      <option value="">{t('jobsOnboarding.selectIndustry')}</option>
                      <option value="technology">{t('industries.technology')}</option>
                      <option value="finance">{t('industries.finance')}</option>
                      <option value="healthcare">{t('industries.healthcare')}</option>
                      <option value="education">{t('industries.education')}</option>
                      <option value="manufacturing">{t('industries.manufacturing')}</option>
                      <option value="retail">{t('industries.retail')}</option>
                      <option value="other">{t('industries.other')}</option>
                    </Select>
                 </div>

                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.companySize')}</label>
                   <Select
                      value={formData.company_size}
                      onChange={(e) => updateField('company_size', e.target.value)}
                      className="w-full"
                      disabled={isViewOnly}
                    >
                      <option value="">{t('jobsOnboarding.selectSize')}</option>
                      {COMPANY_SIZE_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{t(`companySize.${opt.value}`)}</option>
                      ))}
                    </Select>
                 </div>

                 <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.companyType')}</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => !isViewOnly && updateField('company_type', 'employer')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.company_type === 'employer'
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-gray-100 hover:border-emerald-200'
                        } ${isViewOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <Building className={`mb-2 ${formData.company_type === 'employer' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <div className="font-semibold text-gray-900">{t('jobsOnboarding.directEmployer')}</div>
                        <div className="text-xs text-gray-500">{t('jobsOnboarding.directEmployerDesc')}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => !isViewOnly && updateField('company_type', 'agency')}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          formData.company_type === 'agency'
                            ? 'border-emerald-600 bg-emerald-50'
                            : 'border-gray-100 hover:border-emerald-200'
                        } ${isViewOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                      >
                        <Globe className={`mb-2 ${formData.company_type === 'agency' ? 'text-emerald-600' : 'text-gray-400'}`} />
                        <div className="font-semibold text-gray-900">{t('jobsOnboarding.recruitmentAgency')}</div>
                        <div className="text-xs text-gray-500">{t('jobsOnboarding.recruitmentAgencyDesc')}</div>
                      </button>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {/* Step 2: Location */}
          {(isEditing || step === 2) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {isEditing && <h3 className="text-lg font-bold text-gray-900 pb-2 border-b">{t('industries.location')}</h3>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.country')}</label>
                  <input
                    type="text"
                    value="China"
                    disabled
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('jobPost.chinaOnly')}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobPost.province')} *</label>
                  <Select
                    value={formData.registration_province}
                    onChange={(e) => updateField('registration_province', e.target.value)}
                    className="w-full"
                    disabled={isViewOnly}
                  >
                    <option value="">{t('common.selectState')}</option>
                    {getAllProvinces().map(p => (
                      <option key={p.name_en} value={p.name_en}>{p.name_en}</option>
                    ))}
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.city')} *</label>
                  <Select
                    value={formData.registration_city}
                    onChange={(e) => updateField('registration_city', e.target.value)}
                    className="w-full"
                    disabled={!formData.registration_province || isViewOnly}
                  >
                    <option value="">{t('common.selectCity')}</option>
                    {availableCities.map(c => (
                      <option key={c.name_en} value={c.name_en}>{c.name_en}</option>
                    ))}
                  </Select>
                </div>
                
                <div className="col-span-1 md:col-span-2">
                   <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobPost.officeAddress')}</label>
                   <input
                      type="text"
                      value={formData.office_address}
                      onChange={(e) => updateField('office_address', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100"
                      placeholder={t('jobPost.officeAddressPlaceholder')}
                      disabled={isViewOnly}
                    />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Images & Culture */}
          {(isEditing || step === 3) && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
               {isEditing && <h3 className="text-lg font-bold text-gray-900 pb-2 border-b">{t('jobsOnboarding.imagesAndCulture')}</h3>}
               {/* Company License (Mandatory) */}
               <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    {t('jobsOnboarding.companyLicense')} <span className="text-red-500">*</span>
                  </label>
                  <p className="text-sm text-gray-500 mb-4">{t('jobsOnboarding.companyLicenseDesc')}</p>
                  <div className="max-w-[300px]">
                    <ImageUpload
                      value={formData.company_license_url ? [formData.company_license_url] : []}
                      onChange={(urls) => updateField('company_license_url', urls[0] || '')}
                      maxImages={1}
                      bucketName="company-licenses"
                      disabled={isViewOnly}
                    />
                  </div>
               </div>

               {/* Logo */}
               <div>
                 <label className="block text-sm font-medium text-gray-900 mb-4">{t('jobsOnboarding.companyLogo')}</label>
                 <div className="max-w-[200px]">
                   <ImageUpload
                     value={formData.company_logo ? [formData.company_logo] : []}
                     onChange={(urls) => updateField('company_logo', urls[0] || '')}
                     maxImages={1}
                     bucketName="company-logos"
                     disabled={isViewOnly}
                   />
                 </div>
               </div>
               
               {/* Gallery */}
               <div>
                 <label className="block text-sm font-medium text-gray-900 mb-4">
                   {t('jobsOnboarding.companyPhotos')}
                   <span className="text-gray-500 font-normal ml-2">(Max 5)</span>
                 </label>
                 
                 <div className="mt-4">
                   <ImageUpload
                     value={formData.company_images}
                     onChange={(urls) => updateField('company_images', urls)}
                     maxImages={5}
                     bucketName="company-images"
                     disabled={isViewOnly}
                   />
                 </div>
               </div>
            </div>
          )}

          {/* Step 4: Tech Stack */}
          {(isEditing || step === 4 || (isEditing && formData.industry === 'technology')) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
              {isEditing && <h3 className="text-lg font-bold text-gray-900 pb-2 border-b">{t('jobsOnboarding.techStack')}</h3>}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-4">
                  {t('jobsOnboarding.techStackQuestion')}
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_TECHNOLOGIES.map((tech) => (
                    <button
                      key={tech}
                      onClick={() => !isViewOnly && toggleTechnology(tech)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        formData.technologies.includes(tech)
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } ${isViewOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                    >
                      {tech}
                    </button>
                  ))}
                </div>
              </div>
              
              {formData.technologies.length === 0 && (
                 <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm flex items-start gap-2">
                   <Code size={16} className="mt-0.5" />
                   {t('jobsOnboarding.techStackDesc')}
                 </div>
              )}
            </div>
          )}

          {/* Step 5: Online Presence */}
          {(isEditing || step === 5) && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
               {isEditing && <h3 className="text-lg font-bold text-gray-900 pb-2 border-b">{t('jobsOnboarding.onlinePresence')}</h3>}
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('jobsOnboarding.website')}</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => updateField('website', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none disabled:bg-gray-100"
                      placeholder={t('jobsOnboarding.websitePlaceholder') || 'https://example.com'}
                      disabled={isViewOnly}
                    />
                  </div>
               </div>

               {!isEditing && (
                 <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6">
                    <h3 className="font-semibold text-emerald-900 mb-4">{t('jobsOnboarding.readyToComplete')}</h3>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-emerald-800 text-sm">
                        <CheckCircle size={16} /> {t('jobsOnboarding.verifyBenefit1')}
                      </li>
                      <li className="flex items-center gap-2 text-emerald-800 text-sm">
                        <CheckCircle size={16} /> {t('jobsOnboarding.verifyBenefit2')}
                      </li>
                    </ul>
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center mt-10 pt-6 border-t border-gray-100">
          {!isEditing ? (
            <button
              onClick={handleBack}
              className="px-6 py-2 text-gray-500 hover:text-gray-900 font-medium transition-colors"
            >
              {step === 1 ? t('jobsOnboarding.changeRole') || 'Change Role' : t('common.back')}
            </button>
          ) : (
            <div /> // Spacer
          )}

          {/* View Mode: Hide buttons or show Back? */}
          {isViewOnly ? null : (
            (!isEditing && step < totalSteps) ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium flex items-center gap-2 shadow-lg shadow-gray-200"
              >
                {t('common.continue')} <ArrowRight size={18} />
              </button>
            ) : (
               <button
                onClick={() => isEditing ? setShowSaveConfirm(true) : handleSubmit()}
                disabled={loading}
                className="px-8 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all font-medium flex items-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
              >
                {loading 
                  ? (isEditing ? t('common.saving') : t('jobsOnboarding.creatingProfile')) 
                  : (isEditing ? t('common.saveChanges') : t('jobsOnboarding.completeSetup'))}
                {!loading && <CheckCircle size={18} />}
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
    </div>
  );
}
