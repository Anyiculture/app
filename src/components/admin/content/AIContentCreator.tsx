import { useState } from 'react';
import { Sparkles, Wand2, Image as ImageIcon, Check, X, Link as LinkIcon, Download } from 'lucide-react';
import { aiService } from '../../../services/aiService';
import { marketplaceService } from '../../../services/marketplaceService';
import { educationService } from '../../../services/educationService';
import { jobsService } from '../../../services/jobsService';
import { eventsService } from '../../../services/eventsService';
import { useI18n } from '../../../contexts/I18nContext';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Textarea } from '../../ui/Textarea';
import { Select } from '../../ui/Select';
import { ImageUpload } from '../../ui/ImageUpload';
import { MARKETPLACE_CATEGORIES, CONDITION_OPTIONS } from '../../../constants/marketplaceCategories';

type ContentType = 'marketplace' | 'education' | 'jobs' | 'events';

interface AICreatorFormData {
  contentType: ContentType;
  sourceUrl?: string;
  category?: string;
  programType?: string;
  // Generated fields (all types)
  title?: string;
  title_zh?: string;
  description?: string;
  description_zh?: string;
  tags?: string[];
  images?: string[];
  // Marketplace
  suggested_price?: number;
  condition?: string;
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  material?: string;
  // Education
  program_type?: string;
  level?: string;
  language?: string;
  duration_value?: number;
  duration_unit?: string;
  tuition_fee?: number;
  institution_name?: string;
  institution_city?: string;
  eligibility_requirements?: string;
  academic_requirements?: string;
  // Jobs
  company_name?: string;
  job_type?: string;
  location?: string;
  location_city?: string;
  salary_min?: number;
  salary_max?: number;
  remote_type?: string;
  experience_level?: string;
  education_required?: string;
  skills_required?: string[];
  benefits?: string[];
  application_deadline?: string;
  // Events
  event_type?: string;
  start_date?: string;
  location_venue?: string;
  online_link?: string;
  capacity?: number;
  price?: number;
  registration_deadline?: string;
  requirements?: string;
}

const PROGRAM_TYPES = [
  { value: 'language_course', label_en: 'Language Course', label_zh: '语言课程' },
  { value: 'degree_program', label_en: 'Degree Program', label_zh: '学位项目' },
  { value: 'certificate_program', label_en: 'Certificate Program', label_zh: '证书课程' },
  { value: 'workshop', label_en: 'Workshop', label_zh: '研讨会' },
  { value: 'training_program', label_en: 'Training Program', label_zh: '培训项目' },
];

const JOB_TYPES = [
  { value: 'full_time', label_en: 'Full Time', label_zh: '全职' },
  { value: 'part_time', label_en: 'Part Time', label_zh: '兼职' },
  { value: 'contract', label_en: 'Contract', label_zh: '合同工' },
  { value: 'internship', label_en: 'Internship', label_zh: '实习' },
  { value: 'freelance', label_en: 'Freelance', label_zh: '自由职业' },
];

const EVENT_TYPES = [
  { value: 'in_person', label_en: 'In Person', label_zh: '线下活动' },
  { value: 'online', label_en: 'Online', label_zh: '线上活动' },
  { value: 'hybrid', label_en: 'Hybrid', label_zh: '混合模式' },
];

export default function AIContentCreator() {
  const { t, language } = useI18n();
  const [inputMode, setInputMode] = useState<'url' | 'manual'>('url');
  const [formData, setFormData] = useState<AICreatorFormData>({
    contentType: 'marketplace',
  });
  const [generating, setGenerating] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [generatingImages, setGeneratingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleScrapeUrl = async () => {
    if (!formData.sourceUrl) {
      setError(t('admin.aiContent.errors.enterUrl'));
      return;
    }

    setScraping(true);
    setError(null);

    try {
      const scrapedData = await aiService.scrapeUrl(formData.sourceUrl);
      
      setFormData((prev) => ({
        ...prev,
        title: scrapedData.title || prev.title,
        description: scrapedData.description || prev.description,
        images: scrapedData.images || prev.images,
      }));

      setSuccess(t('admin.aiContent.success.scraped', { count: scrapedData.images?.length || 0 }));
    } catch (err: any) {
      console.error('Scraping error:', err);
      setError(err.message || t('admin.aiContent.errors.scrapeFailed'));
    } finally {
      setScraping(false);
    }
  };

  const handleGenerateContent = async () => {
    setGenerating(true);
    setError(null);

    try {
      const content = await aiService.generateContent({
        contentType: formData.contentType,
        category: formData.category,
        programType: formData.programType,
        jobType: formData.job_type,
        eventType: formData.event_type,
        preferences: {
          language: language as 'en' | 'zh',
          tone: 'professional',
        },
      });

      setFormData((prev) => ({ ...prev, ...content }));
      setSuccess(t('admin.aiContent.success.generated'));
    } catch (err: any) {
      console.error('Generation error:', err);
      setError(err.message || t('admin.aiContent.errors.generateFailed'));
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateImages = async () => {
    if (!formData.title) {
      setError(t('admin.aiContent.errors.generateContentFirst'));
      return;
    }

    setGeneratingImages(true);
    setError(null);

    try {
      // Premium ad-style prompting for ultra-realistic, high-quality images
      const basePrompt = `${formData.title}. ${formData.description?.substring(0, 200)}`;
      const enhancedPrompt = `Professional commercial photography, ${basePrompt}. Ultra-realistic, cinematic lighting, premium product photography, 8K resolution, shot on Sony A7R IV, shallow depth of field, perfect composition, high-end advertising aesthetic, magazine quality, professionally styled, studio lighting setup`;
      
      const images = await aiService.generateImages({
        prompt: enhancedPrompt,
        count: 3,
        aspectRatio: '4:3',
        style: 'photographic', // More realistic than 'professional'
      });

      setFormData((prev) => ({
        ...prev,
        images: images.map((img) => img.url),
      }));
      setSuccess(t('admin.aiContent.success.imagesGenerated'));
    } catch (err: any) {
      console.error('Image generation error:', err);
      setError(err.message || t('admin.aiContent.errors.generateImagesFailed'));
    } finally {
      setGeneratingImages(false);
    }
  };

  const handlePublish = async () => {
    try {
      if (formData.contentType === 'marketplace') {
        await marketplaceService.createItem({
          title: formData.title!,
          title_zh: formData.title_zh,
          description: formData.description!,
          description_zh: formData.description_zh,
          category: formData.category!,
          price: formData.suggested_price || 0,
          condition: formData.condition || 'good',
          brand: formData.brand,
          model: formData.model,
          color: formData.color,
          size: formData.size,
          material: formData.material,
          images: formData.images || [],
          location_province: 'Beijing',
          location_city: 'Beijing',
          negotiable: true,
        });
        setSuccess(t('admin.aiContent.success.marketplacePublished'));
      } else if (formData.contentType === 'education') {
        await educationService.createProgram({
          title: formData.title!,
          title_zh: formData.title_zh,
          description: formData.description!,
          description_zh: formData.description_zh,
          program_type: formData.program_type || '',
          type: formData.program_type || '',
          level: formData.level || 'beginner',
          language: formData.language || 'en',
          duration_value: formData.duration_value,
          duration_unit: formData.duration_unit,
          tuition_fee: formData.tuition_fee,
          institution_name: formData.institution_name,
          institution_city: formData.institution_city,
          eligibility_requirements: formData.eligibility_requirements,
          academic_requirements: formData.academic_requirements,
          images: formData.images || [],
          tags: formData.tags,
        });
        setSuccess(t('admin.aiContent.success.educationPublished'));
      } else if (formData.contentType === 'jobs') {
        await jobsService.createJob({
          poster_id: '', // Will be set by service
          title: formData.title!,
          company_name: formData.company_name,
          description: formData.description!,
          image_urls: formData.images,
          job_type: formData.job_type as any,
          location: formData.location || formData.location_city || 'Beijing, China',
          location_city: formData.location_city,
          salary_min: formData.salary_min,
          salary_max: formData.salary_max,
          salary_currency: 'CNY',
          application_deadline: formData.application_deadline,
          remote_type: formData.remote_type as any,
          experience_level: formData.experience_level as any,
          education_required: formData.education_required,
          skills_required: formData.skills_required || [],
          benefits: formData.benefits || [],
          status: 'active',
          featured: false,
          views_count: 0,
          applications_count: 0,
        });
        setSuccess(t('admin.aiContent.success.jobPublished'));
      } else if (formData.contentType === 'events') {
        await eventsService.createEvent({
          title: formData.title!,
          title_zh: formData.title_zh,
          description: formData.description!,
          description_zh: formData.description_zh,
          category: formData.category || 'networking',
          event_type: formData.event_type as any,
          start_date: formData.start_date || new Date().toISOString(),
          location_city: formData.location_city,
          location_venue: formData.location_venue,
          online_link: formData.online_link,
          image_urls: formData.images,
          capacity: formData.capacity,
          price: formData.price,
          registration_deadline: formData.registration_deadline,
          tags: formData.tags,
          requirements: formData.requirements,
        });
        setSuccess(t('admin.aiContent.success.eventPublished'));
      }
      
      // Reset form
      setFormData({ contentType: formData.contentType });
    } catch (err: any) {
      setError(err.message || t('admin.aiContent.errors.publishFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-black text-gray-900 mb-2 flex items-center gap-3">
            <Wand2 className="text-purple-600" size={40} />
            {t('admin.aiContent.title')}
          </h1>
          <p className="text-gray-600">{t('admin.aiContent.subtitle')}</p>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
            <X className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
            <Check className="text-green-600 flex-shrink-0 mt-0.5" size={20} />
            <p className="text-green-800 text-sm">{success}</p>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Panel - Input Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <h2 className="text-2xl font-black text-gray-900">{t('admin.aiContent.configuration')}</h2>

            {/* Input Mode Toggle */}
            <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setInputMode('url')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all text-sm ${
                  inputMode === 'url'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                🔗 URL Scraper
              </button>
              <button
                onClick={() => setInputMode('manual')}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all text-sm ${
                  inputMode === 'manual'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                ✍️ Manual Text
              </button>
            </div>

            {/* URL Scraper - Show only in URL mode */}
            {inputMode === 'url' && (
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border-2 border-blue-200">
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  <LinkIcon size={16} className="inline mr-2" />
                  {t('admin.aiContent.scrapeFromUrl')}
                </label>
                <div className="flex gap-2">
                  <Input
                    value={formData.sourceUrl || ''}
                    onChange={(e) => setFormData({ ...formData, sourceUrl: e.target.value })}
                    placeholder={t('admin.aiContent.urlPlaceholder')}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleScrapeUrl}
                    disabled={scraping || !formData.sourceUrl}
                    variant="outline"
                    className="border-blue-600 text-blue-600 hover:bg-blue-50"
                  >
                    {scraping ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600 border-t-transparent" />
                    ) : (
                      <Download size={20} />
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* Manual Text Input - Show only in Manual mode */}
            {inputMode === 'manual' && (
              <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 space-y-4">
                <label className="block text-sm font-bold text-gray-700">
                  ✍️ Enter Your Content Manually
                </label>
                <Input
                  label="Title"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter a catchy title..."
                />
                <Textarea
                  label="Description"
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Write a detailed description..."
                  rows={6}
                />
              </div>
            )}

            {/* Content Type Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setFormData({ contentType: 'marketplace' })}
                className={`py-3 px-4 rounded-xl font-bold transition-all text-sm ${
                  formData.contentType === 'marketplace'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🛍️ {t('admin.aiContent.marketplace')}
              </button>
              <button
                onClick={() => setFormData({ contentType: 'education' })}
                className={`py-3 px-4 rounded-xl font-bold transition-all text-sm ${
                  formData.contentType === 'education'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                🎓 {t('admin.aiContent.education')}
              </button>
              <button
                onClick={() => setFormData({ contentType: 'jobs' })}
                className={`py-3 px-4 rounded-xl font-bold transition-all text-sm ${
                  formData.contentType === 'jobs'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💼 {t('admin.aiContent.jobs')}
              </button>
              <button
                onClick={() => setFormData({ contentType: 'events' })}
                className={`py-3 px-4 rounded-xl font-bold transition-all text-sm ${
                  formData.contentType === 'events'
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                📅 {t('admin.aiContent.events')}
              </button>
            </div>

            {/* Type-specific selectors */}
            {formData.contentType === 'marketplace' && (
              <Select
                label={t('admin.aiContent.category')}
                value={formData.category || ''}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="">{t('admin.aiContent.selectCategory')}</option>
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {language === 'zh' ? cat.name_zh : cat.name_en}
                  </option>
                ))}
              </Select>
            )}

            {formData.contentType === 'education' && (
              <Select
                label={t('admin.aiContent.programType')}
                value={formData.programType || ''}
                onChange={(e) => setFormData({ ...formData, programType: e.target.value })}
              >
                <option value="">{t('admin.aiContent.selectProgramType')}</option>
                {PROGRAM_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {language === 'zh' ? type.label_zh : type.label_en}
                  </option>
                ))}
              </Select>
            )}

            {formData.contentType === 'jobs' && (
              <Select
                label={t('admin.aiContent.jobType')}
                value={formData.job_type || ''}
                onChange={(e) => setFormData({ ...formData, job_type: e.target.value })}
              >
                <option value="">{t('admin.aiContent.selectJobType')}</option>
                {JOB_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {language === 'zh' ? type.label_zh : type.label_en}
                  </option>
                ))}
              </Select>
            )}

            {formData.contentType === 'events' && (
              <Select
                label={t('admin.aiContent.eventType')}
                value={formData.event_type || ''}
                onChange={(e) => setFormData({ ...formData, event_type: e.target.value })}
              >
                <option value="">{t('admin.aiContent.selectEventType')}</option>
                {EVENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {language === 'zh' ? type.label_zh : type.label_en}
                  </option>
                ))}
              </Select>
            )}

            {/* Generate Content Button */}
            <Button
              onClick={handleGenerateContent}
              disabled={generating}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-4 text-lg font-bold shadow-lg"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  {t('admin.aiContent.generating')}
                </>
              ) : (
                <>
                  <Sparkles size={20} className="mr-2" />
                  {t('admin.aiContent.generateWithAI')}
                </>
              )}
            </Button>

            {/* Editable Fields - Show if content generated or scraped */}
            {formData.title && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <h3 className="font-bold text-gray-900">{t('admin.aiContent.contentEditable')}</h3>

                <Input
                  label={t('admin.aiContent.title')}
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />

                <Textarea
                  label={t('admin.aiContent.description')}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={6}
                />

                {/* Generate or use scraped images */}
                {(!formData.images || formData.images.length === 0) && (
                  <Button
                    onClick={handleGenerateImages}
                    disabled={generatingImages}
                    variant="outline"
                    className="w-full border-2 border-purple-600 text-purple-700 hover:bg-purple-50 py-3"
                  >
                    {generatingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-600 border-t-transparent mr-2" />
                        {t('admin.aiContent.generatingImages')}
                      </>
                    ) : (
                      <>
                        <ImageIcon size={20} className="mr-2" />
                        {t('admin.aiContent.generateImages')}
                      </>
                    )}
                  </Button>
                )}

                {formData.images && formData.images.length > 0 && (
                  <div className="pt-4">
                    <p className="text-sm font-bold text-gray-700 mb-2">
                      {t('admin.aiContent.images')} ({formData.images.length})
                    </p>
                    <div className="grid grid-cols-3 gap-2">
                      {formData.images.map((url, idx) => (
                        <img
                          key={idx}
                          src={url}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-24 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Panel - Preview */}
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">{t('admin.aiContent.livePreview')}</h2>

            {!formData.title ? (
              <div className="h-96 flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <Sparkles size={64} className="mx-auto mb-4 opacity-30" />
                  <p>{t('admin.aiContent.previewPlaceholder')}</p>
                </div>
              </div>
            ) : (
              <div className="border-2 border-gray-200 rounded-2xl p-6 space-y-4">
                {formData.images && formData.images[0] && (
                  <img
                    src={formData.images[0]}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-xl"
                  />
                )}

                <h3 className="text-2xl font-black text-gray-900">{formData.title}</h3>
                <p className="text-gray-700 leading-relaxed">
                  {formData.description?.substring(0, 300)}
                  {formData.description && formData.description.length > 300 && '...'}
                </p>

                {formData.tags && formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-semibold"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Publish Button */}
            {formData.title && (
              <div className="mt-8 flex gap-4">
                <Button
                  onClick={() => setFormData({ contentType: formData.contentType })}
                  variant="outline"
                  className="flex-1"
                >
                  {t('admin.aiContent.clearForm')}
                </Button>
                <Button
                  onClick={handlePublish}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 font-bold"
                >
                  <Check size={20} className="mr-2" />
                  {t('admin.aiContent.publishToPlatform')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
