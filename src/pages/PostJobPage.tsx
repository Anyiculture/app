import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { jobsService } from '../services/jobsService';
import { BackgroundBlobs } from '../components/ui/BackgroundBlobs';
import { JOB_CATEGORIES } from '../constants/jobCategories';
import { Briefcase, MapPin, DollarSign, Calendar, X, ArrowLeft } from 'lucide-react';

export function PostJobPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n(); // Helper to access current language
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Updated state for new category structure
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    job_type: 'full_time' as 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance',
    location_country: 'China',
    location_province: '',
    location_city: '',
    salary_min: '',
    salary_max: '',
    salary_currency: 'CNY',
    salary_period: 'monthly',
    remote_type: 'on_site' as 'on_site' | 'remote' | 'hybrid',
    // New fields
    category_id: '',
    subcategory_id: '',
    
    experience_level: '' as '' | 'entry' | 'mid' | 'senior' | 'executive',
    education_required: '',
    skills_required: [] as string[],
    benefits: [] as string[],
    application_email: '',
    application_url: '',
    application_deadline: '',
  });

  const [skillInput, setSkillInput] = useState('');
  const [benefitInput, setBenefitInput] = useState('');

  // Derived state for subcategories and skills
  const selectedCategory = JOB_CATEGORIES.find(c => c.id === formData.category_id);
  const subcategories = selectedCategory?.subcategories || [];
  
  const selectedSubcategory = subcategories.find(s => s.id === formData.subcategory_id);
  const suggestedSkills = selectedSubcategory?.skills || [];

  const updateField = (field: string, value: any) => {
    setFormData(prev => {
      const newState = { ...prev, [field]: value };
      
      // Reset dependent fields
      if (field === 'category_id') {
        newState.subcategory_id = '';
      }
      return newState;
    });
  };

  const addSkill = (skillToAdd: string) => {
    const skill = skillToAdd.trim();
    if (skill && !formData.skills_required.includes(skill)) {
      setFormData(prev => ({
        ...prev,
        skills_required: [...prev.skills_required, skill]
      }));
    }
    setSkillInput('');
  };

  const removeSkill = (index: number) => {
    setFormData(prev => ({
      ...prev,
      skills_required: prev.skills_required.filter((_, i) => i !== index)
    }));
  };

  const addBenefit = () => {
    if (benefitInput.trim() && !formData.benefits.includes(benefitInput.trim())) {
      setFormData(prev => ({
        ...prev,
        benefits: [...prev.benefits, benefitInput.trim()]
      }));
      setBenefitInput('');
    }
  };

  const removeBenefit = (index: number) => {
    setFormData(prev => ({
      ...prev,
      benefits: prev.benefits.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setError(t('errors.mustBeLoggedIn'));
      return;
    }

    if (!formData.title || !formData.description || !formData.location_city || !formData.category_id || !formData.subcategory_id) {
      setError(t('errors.fillAllRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Construct location field from individual parts
      const locationParts = [
        formData.location_city,
        formData.location_province,
        formData.location_country
      ].filter(Boolean); // Remove empty values
      
      await jobsService.createJob({
        poster_id: user.id,
        title: formData.title,
        description: formData.description,
        job_type: formData.job_type,
        location: locationParts.join(', '), // Required field in database
        location_country: formData.location_country,
        location_province: formData.location_province,
        location_city: formData.location_city,
        salary_min: formData.salary_min ? parseFloat(formData.salary_min) : undefined,
        salary_max: formData.salary_max ? parseFloat(formData.salary_max) : undefined,
        salary_currency: formData.salary_currency,
        salary_period: formData.salary_period,
        remote_type: formData.remote_type,
        // category_id: formData.category_id, // Temporarily disabled - app uses string IDs but DB expects UUID
        experience_level: formData.experience_level || undefined,
        education_required: formData.education_required || undefined,
        skills_required: formData.skills_required,
        benefits: formData.benefits,
        application_email: formData.application_email || undefined,
        application_url: formData.application_url || undefined,
        application_deadline: formData.application_deadline || undefined,
        status: 'active', // Changed from 'published' to match DB constraint
        published_at: new Date().toISOString(),
        featured: false,
      });

      navigate('/jobs');
    } catch (err: any) {
      setError(err.message || 'Failed to post job');
    } finally {
      setLoading(false);
    }
  };


// ... inside component ...

  return (
    <div className="min-h-screen bg-gray-50/50 py-12 relative overflow-hidden">
      <BackgroundBlobs className="opacity-50" />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <button
          onClick={() => navigate('/jobs')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('common.backTo')} {t('nav.jobs')}
        </button>

        <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 p-10">
          <div className="mb-10 text-center">
             <span className="inline-block px-4 py-1.5 rounded-full bg-vibrant-purple/10 text-vibrant-purple text-sm font-bold tracking-wide mb-4 border border-vibrant-purple/20">
                {t('jobs.employerPortal')}
             </span>
            <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-vibrant-purple to-vibrant-pink tracking-tight mb-3">
                {t('postJob.title')}
            </h1>
            <p className="text-gray-600 text-lg font-medium">{t('postJob.description')}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Briefcase className="inline mr-1" size={16} />
                {t('postJob.jobTitle')} *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => updateField('title', e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('postJob.jobTitlePlaceholder')}
                required
              />
            </div>

            {/* Category & Subcategory */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('jobs.categories.category')} *
                </label>
                <select
                  value={formData.category_id}
                  onChange={(e) => updateField('category_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">{t('jobs.categories.select')}</option>
                  {JOB_CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {language === 'zh' ? cat.name_zh : cat.name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('jobs.categories.subcategory')} *
                </label>
                <select
                  value={formData.subcategory_id}
                  onChange={(e) => updateField('subcategory_id', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={!formData.category_id}
                  required
                >
                  <option value="">{t('jobs.categories.subcategorySelect')}</option>
                  {subcategories.map(sub => (
                    <option key={sub.id} value={sub.id}>
                      {language === 'zh' ? sub.name_zh : sub.name_en}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('postJob.jobDescription')} *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('postJob.jobDescriptionPlaceholder')}
                required
              />
            </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.jobType')} *
                </label>
                <select
                  value={formData.job_type}
                  onChange={(e) => updateField('job_type', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="full_time">{t('jobs.fullTime')}</option>
                  <option value="part_time">{t('jobs.partTime')}</option>
                  <option value="contract">{t('jobs.contract')}</option>
                  <option value="internship">{t('jobs.internship')}</option>
                  <option value="freelance">{t('jobs.freelance')}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.workLocation')} *
                </label>
                <select
                  value={formData.remote_type}
                  onChange={(e) => updateField('remote_type', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="on_site">{t('jobs.onSite')}</option>
                  <option value="remote">{t('jobs.remote')}</option>
                  <option value="hybrid">{t('jobs.hybrid')}</option>
                </select>
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="inline mr-1" size={16} />
                {t('postJob.location')} *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input
                  type="text"
                  value={formData.location_country}
                  onChange={(e) => updateField('location_country', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.locationCountry')}
                  required
                />
                <input
                  type="text"
                  value={formData.location_province}
                  onChange={(e) => updateField('location_province', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.locationProvince')}
                />
                <input
                  type="text"
                  value={formData.location_city}
                  onChange={(e) => updateField('location_city', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.locationCity')}
                  required
                />
              </div>
            </div>

            {/* Salary */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline mr-1" size={16} />
                {t('postJob.salaryRange')}
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <input
                  type="number"
                  value={formData.salary_min}
                  onChange={(e) => updateField('salary_min', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.salaryMin')}
                />
                <input
                  type="number"
                  value={formData.salary_max}
                  onChange={(e) => updateField('salary_max', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.salaryMax')}
                />
                <select
                  value={formData.salary_currency}
                  onChange={(e) => updateField('salary_currency', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="CNY">{t('jobs.salary.currency.CNY')}</option>
                  <option value="USD">{t('jobs.salary.currency.USD')}</option>
                  <option value="EUR">{t('jobs.salary.currency.EUR')}</option>
                </select>
                <select
                  value={formData.salary_period}
                  onChange={(e) => updateField('salary_period', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="hourly">{t('jobs.salary.period.hourly')}</option>
                  <option value="monthly">{t('jobs.salary.period.monthly')}</option>
                  <option value="yearly">{t('jobs.salary.period.yearly')}</option>
                </select>
              </div>
            </div>

            {/* Experience & Education */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.experienceLevel')}
                </label>
                <select
                  value={formData.experience_level}
                  onChange={(e) => updateField('experience_level', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('postJob.anyLevel')}</option>
                  <option value="entry">{t('jobs.entry')}</option>
                  <option value="mid">{t('jobs.mid')}</option>
                  <option value="senior">{t('jobs.senior')}</option>
                  <option value="executive">{t('jobs.executive')}</option>
                </select>
              </div>

               <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.educationRequired')}
                </label>
                <input
                  type="text"
                  value={formData.education_required}
                  onChange={(e) => updateField('education_required', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.educationPlaceholder')}
                />
              </div>
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('postJob.requiredSkills')}
              </label>
              
              {/* Suggested Skills */}
              {suggestedSkills.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-gray-500 mb-2">{t('jobs.suggestedSkills')}</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestedSkills.map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => addSkill(skill)}
                        className={`px-3 py-1 text-sm rounded-full border ${formData.skills_required.includes(skill) ? 'bg-blue-100 border-blue-300 text-blue-700' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
                        disabled={formData.skills_required.includes(skill)}
                      >
                        {formData.skills_required.includes(skill) ? t('jobs.added') : t('jobs.addSkill', { skill })}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill(skillInput))}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('jobs.typeCustomSkill')}
                />
                <button
                  type="button"
                  onClick={() => addSkill(skillInput)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('postJob.add')}
                </button>
              </div>
              
              {formData.skills_required.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.skills_required.map((skill, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg flex items-center gap-2"
                    >
                      {skill}
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-blue-700 hover:text-blue-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Benefits - Keeping existing logic */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('postJob.benefits')}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={benefitInput}
                  onChange={(e) => setBenefitInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addBenefit())}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('postJob.benefitPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addBenefit}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {t('postJob.add')}
                </button>
              </div>
              {formData.benefits.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.benefits.map((benefit, index) => (
                    <span
                      key={index}
                      className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg flex items-center gap-2"
                    >
                      {benefit}
                      <button
                        type="button"
                        onClick={() => removeBenefit(index)}
                        className="text-green-700 hover:text-green-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Application Contact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.applicationEmail')}
                </label>
                <input
                  type="email"
                  value={formData.application_email}
                  onChange={(e) => updateField('application_email', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="careers@company.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('postJob.applicationUrl')}
                </label>
                <input
                  type="url"
                  value={formData.application_url}
                  onChange={(e) => updateField('application_url', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder={t('common.urlPlaceholder')}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Calendar className="inline mr-1" size={16} />
                {t('postJob.applicationDeadline')}
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

            <div className="flex gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/jobs')}
                className="flex-1 px-6 py-3 border-2 border-gray-300 rounded-lg hover:bg-gray-50 transition-all font-semibold"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all font-semibold shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('postJob.posting') : t('postJob.postJob')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
