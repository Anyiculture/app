import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { educationService, CreateProgramData, ProgramType } from '../services/educationService';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Select } from '../components/ui/Select';
import { Loading } from '../components/ui/Loading';
import { ArrowLeft, Plus, X } from 'lucide-react';
import { LocationCascade } from '../components/ui/LocationCascade';
import { LANGUAGES } from '../constants/languages';
import { DOCUMENT_TYPES } from '../constants/educationDocuments';
import { ImageUpload } from '../components/ui/ImageUpload';

export function CreateEducationProgramPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, language } = useI18n();
  const [loading, setLoading] = useState(false);
  const [programTypes, setProgramTypes] = useState<ProgramType[]>([]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<Partial<CreateProgramData>>({
    title: '',
    title_zh: '',
    description: '',
    description_zh: '',
    program_type: '',
    education_level: '',
    type: 'program',
    level: 'intermediate',
    language: 'en',
    duration_value: undefined,
    duration_unit: 'months',
    schedule_type: 'full-time',
    delivery_mode: 'on-campus',
    tuition_fee: undefined,
    currency: 'CAD',
    scholarship_amount: undefined,
    financial_aid_available: false,
    institution_name: '',
    institution_country: '',
    institution_city: '',
    institution_website: '',
    institution_logo: '',
    start_date: '',
    end_date: '',
    application_deadline: '',
    eligibility_requirements: '',
    academic_requirements: '',
    language_requirements: [],
    documents_required: [],
    age_requirements: '',
    capacity: undefined,
    tags: [],
    images: [],
    contact_email: '',
    contact_phone: '',
    external_url: '',
  });

  const [languageReq, setLanguageReq] = useState({ language: '', requirement: '' });
  const [document, setDocument] = useState('');
  const [tag, setTag] = useState('');
  const [institutionProvince, setInstitutionProvince] = useState('');

  useEffect(() => {
    if (!user) {
      navigate(`/signin?returnTo=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    loadProgramTypes();
    if (id) {
      loadProgram();
    }
  }, [user, id]);

  const loadProgramTypes = async () => {
    try {
      const types = await educationService.getProgramTypes();
      setProgramTypes(types);
    } catch (error) {
      console.error('Error loading program types:', error);
    }
  };

  const loadProgram = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const program = await educationService.getProgramById(id);
      if (program) {
        setFormData({
          title: program.title,
          title_zh: program.title_zh || '',
          description: program.description,
          description_zh: program.description_zh || '',
          program_type: program.program_type || '',
          education_level: program.education_level || '',
          type: program.type,
          level: program.level,
          language: program.language,
          duration_value: program.duration_value || undefined,
          duration_unit: program.duration_unit || 'months',
          schedule_type: program.schedule_type || 'full-time',
          delivery_mode: program.delivery_mode || 'on-campus',
          tuition_fee: program.tuition_fee || undefined,
          currency: program.currency || 'CAD',
          scholarship_amount: program.scholarship_amount || undefined,
          financial_aid_available: program.financial_aid_available || false,
          institution_name: program.institution_name || '',
          institution_country: program.institution_country || '',
          institution_city: program.institution_city || '',
          institution_website: program.institution_website || '',
          institution_logo: program.institution_logo || '',
          start_date: program.start_date || '',
          end_date: program.end_date || '',
          application_deadline: program.application_deadline || '',
          eligibility_requirements: program.eligibility_requirements || '',
          academic_requirements: program.academic_requirements || '',
          language_requirements: program.language_requirements || [],
          documents_required: program.documents_required || [],
          age_requirements: program.age_requirements || '',
          capacity: program.capacity || undefined,
          tags: program.tags || [],
          images: program.images || [],
          contact_email: program.contact_email || '',
          contact_phone: program.contact_phone || '',
          external_url: program.external_url || '',
        });
      }
    } catch (error) {
      console.error('Error loading program:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: keyof CreateProgramData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLanguageRequirement = () => {
    if (!languageReq.language || !languageReq.requirement) return;
    updateField('language_requirements', [
      ...(formData.language_requirements || []),
      { language: languageReq.language, requirement: languageReq.requirement }
    ]);
    setLanguageReq({ language: '', requirement: '' });
  };

  const removeLanguageRequirement = (index: number) => {
    const reqs = formData.language_requirements || [];
    updateField('language_requirements', reqs.filter((_, i) => i !== index));
  };

  const addDocument = () => {
    if (!document) return;
    updateField('documents_required', [...(formData.documents_required || []), document]);
    setDocument('');
  };

  const removeDocument = (index: number) => {
    const docs = formData.documents_required || [];
    updateField('documents_required', docs.filter((_, i) => i !== index));
  };

  const addTag = () => {
    if (!tag) return;
    updateField('tags', [...(formData.tags || []), tag]);
    setTag('');
  };

  const removeTag = (index: number) => {
    const tags = formData.tags || [];
    updateField('tags', tags.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.description || !formData.program_type) {
      alert(t('education.create.requiredFieldsError'));
      return;
    }

    try {
      setLoading(true);
      if (id) {
        await educationService.updateProgram(id, formData);
        alert(t('education.create.updated'));
      } else {
        const created = await educationService.createProgram(formData as CreateProgramData);
        alert(t('education.create.created'));
        navigate(`/education/${created.id}`);
      }
    } catch (error: any) {
      console.error('Error saving program:', error);
      alert(error.message || t('education.create.createError'));
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.title && formData.description && formData.program_type;
      case 2:
        return formData.institution_name;
      default:
        return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">{t('education.create.basicInformation')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={`${t('education.create.programTitleEn')} ${t('education.create.required')}`}
          value={formData.title}
          onChange={(e) => updateField('title', e.target.value)}
          placeholder={t('education.create.programTitleEnPlaceholder')}
          required
        />
        <Input
          label={t('education.create.programTitleZh')}
          value={formData.title_zh}
          onChange={(e) => updateField('title_zh', e.target.value)}
          placeholder={t('education.create.programTitleZhPlaceholder')}
        />
      </div>

      <Textarea
        label={`${t('education.create.descriptionEn')} ${t('education.create.required')}`}
        value={formData.description}
        onChange={(e) => updateField('description', e.target.value)}
        placeholder={t('education.create.descriptionEnPlaceholder')}
        rows={4}
        required
      />

      <Textarea
        label={t('education.create.descriptionZh')}
        value={formData.description_zh}
        onChange={(e) => updateField('description_zh', e.target.value)}
        placeholder={t('education.create.descriptionZhPlaceholder')}
        rows={4}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label={`${t('education.create.programType')} ${t('education.create.required')}`}
          value={formData.program_type}
          onChange={(e) => updateField('program_type', e.target.value)}
          required
        >
          <option value="">{t('education.create.programTypePlaceholder')}</option>
          {programTypes.map(type => (
            <option key={type.id} value={type.id}>
              {language === 'zh' ? type.name_zh : type.name_en}
            </option>
          ))}
        </Select>

        <Select
          label={t('education.create.educationLevel')}
          value={formData.education_level}
          onChange={(e) => updateField('education_level', e.target.value)}
        >
          <option value="">{t('education.create.educationLevelPlaceholder')}</option>
          <option value="K-12">{t('education.create.level_K-12')}</option>
          <option value="undergraduate">{t('education.create.level_undergraduate')}</option>
          <option value="graduate">{t('education.create.level_graduate')}</option>
          <option value="doctoral">{t('education.create.level_doctoral')}</option>
          <option value="postdoctoral">{t('education.create.level_postdoctoral')}</option>
          <option value="vocational">{t('education.create.level_vocational')}</option>
          <option value="continuing-education">{t('education.create.level_continuing-education')}</option>
        </Select>

        <Select
          label={t('education.create.language')}
          value={formData.language}
          onChange={(e) => updateField('language', e.target.value)}
        >
          <option value="en">{t('education.english')}</option>
          <option value="zh">{t('education.chinese')}</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label={t('education.create.deliveryMode')}
          value={formData.delivery_mode}
          onChange={(e) => updateField('delivery_mode', e.target.value)}
        >
          <option value="on-campus">{t('education.create.deliveryMode_on-campus')}</option>
          <option value="online">{t('education.create.deliveryMode_online')}</option>
          <option value="hybrid">{t('education.create.deliveryMode_hybrid')}</option>
        </Select>

        <Select
          label={t('education.create.scheduleType')}
          value={formData.schedule_type}
          onChange={(e) => updateField('schedule_type', e.target.value)}
        >
          <option value="full-time">{t('education.create.scheduleType_full-time')}</option>
          <option value="part-time">{t('education.create.scheduleType_part-time')}</option>
          <option value="flexible">{t('education.create.scheduleType_flexible')}</option>
        </Select>

        <div className="flex gap-2">
          <Input
            label={t('education.create.durationLabel')}
            type="number"
            value={formData.duration_value || ''}
            onChange={(e) => updateField('duration_value', e.target.value ? parseInt(e.target.value) : undefined)}
            placeholder={t('education.create.durationPlaceholder')}
            className="flex-1"
          />
          <Select
            label={t('education.create.durationUnit')}
            value={formData.duration_unit}
            onChange={(e) => updateField('duration_unit', e.target.value)}
            className="w-32"
          >
            <option value="weeks">{t('education.create.unit_weeks')}</option>
            <option value="months">{t('education.create.unit_months')}</option>
            <option value="years">{t('education.create.unit_years')}</option>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">{t('education.create.institutionInformation')}</h3>

      <Input
        label={`${t('education.create.institutionName')} ${t('education.create.required')}`}
        value={formData.institution_name}
        onChange={(e) => updateField('institution_name', e.target.value)}
        placeholder={t('education.create.institutionNamePlaceholder')}
        required
      />

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">{t('education.create.location')}</label>
        <LocationCascade
          country={formData.institution_country || ''}
          province={institutionProvince}
          city={formData.institution_city || ''}
          onCountryChange={(val) => updateField('institution_country', val)}
          onProvinceChange={(val) => setInstitutionProvince(val)}
          onCityChange={(val) => updateField('institution_city', val)}
          language={language as 'en' | 'zh'}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('education.create.institutionWebsite')}
          type="url"
          value={formData.institution_website}
          onChange={(e) => updateField('institution_website', e.target.value)}
          placeholder={t('education.create.institutionWebsitePlaceholder')}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('education.create.programImages')}</label>
          <ImageUpload
            value={formData.images || []}
            onChange={(urls) => updateField('images', urls)}
            maxImages={5}
            bucketName="education-images"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('education.create.contactEmail')}
          type="email"
          value={formData.contact_email}
          onChange={(e) => updateField('contact_email', e.target.value)}
          placeholder={t('education.create.contactEmailPlaceholder')}
        />
        <Input
          label={t('education.create.contactPhone')}
          type="tel"
          value={formData.contact_phone}
          onChange={(e) => updateField('contact_phone', e.target.value)}
          placeholder={t('education.create.contactPhonePlaceholder')}
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">{t('education.create.feesAndFinancialAid')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label={t('education.create.tuitionFeeLabel')}
          type="number"
          value={formData.tuition_fee || ''}
          onChange={(e) => updateField('tuition_fee', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder={t('education.create.tuitionFeePlaceholder')}
        />
        <Select
          label={t('education.create.currency')}
          value={formData.currency}
          onChange={(e) => updateField('currency', e.target.value)}
        >
          <option value="CAD">CAD</option>
          <option value="USD">USD</option>
          <option value="CNY">CNY</option>
          <option value="EUR">EUR</option>
          <option value="GBP">GBP</option>
        </Select>
        <Input
          label={t('education.create.scholarshipAmount')}
          type="number"
          value={formData.scholarship_amount || ''}
          onChange={(e) => updateField('scholarship_amount', e.target.value ? parseFloat(e.target.value) : undefined)}
          placeholder={t('education.create.scholarshipAmountPlaceholder')}
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={formData.financial_aid_available || false}
          onChange={(e) => updateField('financial_aid_available', e.target.checked)}
          className="w-4 h-4 text-teal-600 rounded"
        />
        <span className="text-sm text-gray-700">{t('education.create.financialAidAvailable')}</span>
      </label>

      <h3 className="text-xl font-semibold text-gray-900 mt-8">{t('education.create.importantDates')}</h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label={t('education.create.applicationDeadlineLabel')}
          type="date"
          value={formData.application_deadline}
          onChange={(e) => updateField('application_deadline', e.target.value)}
        />
        <Input
          label={t('education.create.programStartDate')}
          type="date"
          value={formData.start_date}
          onChange={(e) => updateField('start_date', e.target.value)}
        />
        <Input
          label={t('education.create.programEndDate')}
          type="date"
          value={formData.end_date}
          onChange={(e) => updateField('end_date', e.target.value)}
        />
      </div>

      <Input
        label={t('education.create.capacity')}
        type="number"
        value={formData.capacity || ''}
        onChange={(e) => updateField('capacity', e.target.value ? parseInt(e.target.value) : undefined)}
        placeholder={t('education.create.capacityPlaceholder')}
      />
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900">{t('education.create.requirements')}</h3>

      <Textarea
        label={t('education.create.eligibilityRequirements')}
        value={formData.eligibility_requirements}
        onChange={(e) => updateField('eligibility_requirements', e.target.value)}
        placeholder={t('education.create.eligibilityPlaceholder')}
        rows={3}
      />

      <Textarea
        label={t('education.create.academicRequirements')}
        value={formData.academic_requirements}
        onChange={(e) => updateField('academic_requirements', e.target.value)}
        placeholder={t('education.create.academicPlaceholder')}
        rows={3}
      />

      <Input
        label={t('education.create.ageRequirements')}
        value={formData.age_requirements}
        onChange={(e) => updateField('age_requirements', e.target.value)}
        placeholder={t('education.create.ageRequirementsPlaceholder')}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('education.create.languageRequirements')}
        </label>
        <div className="flex gap-2 mb-2">
          <Select
            value={languageReq.language}
            onChange={(e) => setLanguageReq({ ...languageReq, language: e.target.value })}
            className="flex-1"
          >
            <option value="">{t('education.create.languagePlaceholder')}</option>
            {LANGUAGES.map(l => (
              <option key={l.code} value={l.name_en}>
                {language === 'zh' ? l.name_zh : l.name_en}
              </option>
            ))}
          </Select>
          <Input
            placeholder={t('education.create.requirementPlaceholder')}
            value={languageReq.requirement}
            onChange={(e) => setLanguageReq({ ...languageReq, requirement: e.target.value })}
            className="flex-1"
          />
          <Button onClick={addLanguageRequirement} variant="outline">
            <Plus size={16} />
          </Button>
        </div>
        {formData.language_requirements && formData.language_requirements.length > 0 && (
          <div className="space-y-2">
            {formData.language_requirements.map((req: any, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm">
                  <strong>{req.language}</strong>: {req.requirement}
                </span>
                <button onClick={() => removeLanguageRequirement(idx)} className="text-red-600">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('education.create.requiredDocuments')}
        </label>
        <div className="flex gap-2 mb-2">
          <Select
             value={DOCUMENT_TYPES.includes(document) ? document : (document ? 'Other' : '')}
             onChange={(e) => {
               if(e.target.value === 'Other') setDocument('');
               else setDocument(e.target.value);
             }}
             className="flex-1"
          >
            <option value="">{t('education.create.documentPlaceholder')}</option>
            {DOCUMENT_TYPES.map(d => (
              <option key={d} value={d}>{d}</option>
            ))}
            <option value="Other">{t('common.other')}</option>
          </Select>
          {(!DOCUMENT_TYPES.includes(document) || document === '') && (
             <Input
               placeholder={t('education.create.enterDocumentName')}
               value={document}
               onChange={(e) => setDocument(e.target.value)}
               className="flex-1"
             />
          )}
          <Button onClick={addDocument} variant="outline">
            <Plus size={16} />
          </Button>
        </div>
        {formData.documents_required && formData.documents_required.length > 0 && (
          <div className="space-y-2">
            {formData.documents_required.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm">{doc}</span>
                <button onClick={() => removeDocument(idx)} className="text-red-600">
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('education.create.tags')}
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder={t('education.create.tagPlaceholder')}
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="flex-1"
          />
          <Button onClick={addTag} variant="outline">
            <Plus size={16} />
          </Button>
        </div>
        {formData.tags && formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.tags.map((t, idx) => (
              <span key={idx} className="inline-flex items-center gap-2 bg-teal-100 text-teal-800 px-3 py-1 rounded-full text-sm">
                {t}
                <button onClick={() => removeTag(idx)} className="text-teal-600 hover:text-teal-800">
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  if (loading && id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-teal-50 to-gray-50">
      <div className="max-w-5xl mx-auto px-6 py-6">
        <button
          onClick={() => navigate('/education')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          {t('common.backTo')} {t('education.create.backToEducation')}
        </button>

        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            {id ? t('education.create.editTitle') : t('education.create.title')}
          </h1>
          <p className="text-lg text-gray-600">
            {id ? t('education.create.editSubtitle') : t('education.create.subtitle')}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-gray-900">{t('education.create.step')} {step} {t('education.create.of')} 4</h2>
              <span className="text-sm text-gray-600">
                {step === 1 && t('education.create.stepBasicInfo')}
                {step === 2 && t('education.create.stepInstitution')}
                {step === 3 && t('education.create.stepFeesAndDates')}
                {step === 4 && t('education.create.stepRequirements')}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-teal-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}

          <div className="flex items-center justify-between pt-8 mt-8 border-t">
            <div>
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  {t('education.create.back')}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => navigate('/education')}>
                {t('education.create.cancel')}
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                  {t('education.create.next')}
                </Button>
              ) : (
                <Button onClick={handleSubmit} disabled={loading || !canProceed()}>
                  {loading ? t('education.create.saving') : id ? t('education.create.updateProgramButton') : t('education.create.createProgramButton')}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
