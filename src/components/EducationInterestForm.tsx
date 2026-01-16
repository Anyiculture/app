import { useState } from 'react';
import { educationService, SubmitInterestData } from '../services/educationService';
import { useI18n } from '../contexts/I18nContext';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { Select } from './ui/Select';
import { EmailInput } from './ui/EmailInput';
import { PhoneInput } from './ui/PhoneInput';
import { X } from 'lucide-react';

interface EducationInterestFormProps {
  resourceId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EducationInterestForm({ resourceId, onSuccess, onCancel }: EducationInterestFormProps) {
  const { t } = useI18n();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Partial<SubmitInterestData>>({
    resource_id: resourceId,
    full_name: '',
    email: '',
    phone: '',
    date_of_birth: '',
    nationality: '',
    current_location: '',
    current_education_level: '',
    current_institution: '',
    field_of_study: '',
    gpa: '',
    language_proficiency: [],
    work_experience: '',
    motivation: '',
    message: '',
    additional_info: '',
    preferred_start_date: '',
  });

  const [languageInput, setLanguageInput] = useState({
    language: '',
    proficiency: 'intermediate',
  });

  const updateField = (field: keyof SubmitInterestData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addLanguage = () => {
    if (!languageInput.language) return;

    const newLang = {
      language: languageInput.language,
      proficiency: languageInput.proficiency,
    };

    updateField('language_proficiency', [...(formData.language_proficiency || []), newLang]);
    setLanguageInput({ language: '', proficiency: 'intermediate' });
  };

  const removeLanguage = (index: number) => {
    const langs = formData.language_proficiency || [];
    updateField('language_proficiency', langs.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!formData.full_name || !formData.email) {
      alert(t('education.apply.validation.required'));
      return;
    }

    if (!formData.motivation || formData.motivation.length < 50) {
      alert(t('education.apply.validation.motivation'));
      return;
    }

    try {
      setSubmitting(true);
      await educationService.submitInterest(formData as SubmitInterestData);
      onSuccess();
    } catch (error: any) {
      console.error('Error submitting interest:', error);
      alert(error.message || t('education.apply.errors.submit'));
    } finally {
      setSubmitting(false);
    }
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return formData.full_name && formData.email;
      case 2:
        return formData.current_education_level;
      case 3:
        return formData.motivation && formData.motivation.length >= 50;
      default:
        return true;
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('education.apply.personalInfo')}</h3>

      <Input
        label={t('education.apply.fullName')}
        value={formData.full_name}
        onChange={(e) => updateField('full_name', e.target.value)}
        placeholder={t('education.apply.fullNamePlaceholder')}
        required
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EmailInput
          value={formData.email || ''}
          onChange={(value) => updateField('email', value)}
          label={t('education.apply.email')}
          required
          helpText={t('education.apply.emailHelp')}
        />
        <PhoneInput
          value={formData.phone || ''}
          onChange={(value: string) => updateField('phone', value)}
          label={t('education.apply.phone')}
          defaultCountryCode="+1"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('education.apply.dob')}
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => updateField('date_of_birth', e.target.value)}
        />
        <Input
          label={t('education.apply.nationality')}
          value={formData.nationality}
          onChange={(e) => updateField('nationality', e.target.value)}
          placeholder={t('education.apply.nationalityPlaceholder')}
        />
      </div>

      <Input
        label={t('education.apply.location')}
        value={formData.current_location}
        onChange={(e) => updateField('current_location', e.target.value)}
        placeholder={t('education.apply.locationPlaceholder')}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('education.apply.academicBackground')}</h3>

      <Select
        label={t('education.apply.educationLevel')}
        value={formData.current_education_level}
        onChange={(e) => updateField('current_education_level', e.target.value)}
        required
      >
        <option value="">{t('education.apply.educationLevelPlaceholder')}</option>
        <option value="high-school">{t('degree.High School')}</option>
        <option value="undergraduate">{t('education.create.level_undergraduate')}</option>
        <option value="graduate">{t('education.create.level_graduate')}</option>
        <option value="doctoral">{t('education.create.level_doctoral')}</option>
        <option value="postdoctoral">{t('education.create.level_postdoctoral')}</option>
        <option value="professional">{t('education.apply.level_professional')}</option>
      </Select>

      <Input
        label={t('education.apply.institution')}
        value={formData.current_institution}
        onChange={(e) => updateField('current_institution', e.target.value)}
        placeholder={t('education.apply.institutionPlaceholder')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('education.apply.fieldOfStudy')}
          value={formData.field_of_study}
          onChange={(e) => updateField('field_of_study', e.target.value)}
          placeholder={t('education.apply.fieldOfStudyPlaceholder')}
        />
        <Input
          label={t('education.apply.gpa')}
          value={formData.gpa}
          onChange={(e) => updateField('gpa', e.target.value)}
          placeholder={t('education.apply.gpaPlaceholder')}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('education.apply.languageProficiency')}
        </label>
        <div className="flex gap-2 mb-2">
          <Input
            placeholder={t('education.apply.languagePlaceholder')}
            value={languageInput.language}
            onChange={(e) => setLanguageInput({ ...languageInput, language: e.target.value })}
            className="flex-1"
          />
          <Select
            value={languageInput.proficiency}
            onChange={(e) => setLanguageInput({ ...languageInput, proficiency: e.target.value })}
            className="w-40"
          >
            <option value="beginner">{t('common.proficiency_beginner')}</option>
            <option value="intermediate">{t('common.proficiency_intermediate')}</option>
            <option value="advanced">{t('common.proficiency_advanced')}</option>
            <option value="native">{t('common.proficiency_native')}</option>
          </Select>
          <Button onClick={addLanguage} variant="outline">
            {t('common.add')}
          </Button>
        </div>

        {formData.language_proficiency && formData.language_proficiency.length > 0 && (
          <div className="space-y-2">
            {formData.language_proficiency.map((lang: any, idx) => (
              <div key={idx} className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                <span className="text-sm">
                  <strong>{lang.language}</strong> - {t(`common.proficiency_${lang.proficiency}`)}
                </span>
                <button
                  onClick={() => removeLanguage(idx)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <Textarea
        label={t('education.apply.workExperience')}
        value={formData.work_experience}
        onChange={(e) => updateField('work_experience', e.target.value)}
        placeholder={t('education.apply.workExperiencePlaceholder')}
        rows={3}
      />
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('education.apply.motivationSection')}</h3>

      <Textarea
        label={t('education.apply.motivation')}
        value={formData.motivation}
        onChange={(e) => updateField('motivation', e.target.value)}
        placeholder={t('education.apply.motivationPlaceholder')}
        rows={6}
        required
      />
      <p className="text-sm text-gray-500">
        {t('education.apply.characterCount', { count: formData.motivation?.length || 0 })}
      </p>

      <Textarea
        label={t('education.apply.additionalMessage')}
        value={formData.message}
        onChange={(e) => updateField('message', e.target.value)}
        placeholder={t('education.apply.additionalMessagePlaceholder')}
        rows={3}
      />

      <Input
        label={t('education.apply.startDate')}
        type="date"
        value={formData.preferred_start_date}
        onChange={(e) => updateField('preferred_start_date', e.target.value)}
      />

      <Textarea
        label={t('education.apply.additionalInfo')}
        value={formData.additional_info}
        onChange={(e) => updateField('additional_info', e.target.value)}
        placeholder={t('education.apply.additionalInfoPlaceholder')}
        rows={3}
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-bold text-gray-900">{t('education.apply.title')}</h2>
          <span className="text-sm text-gray-600">
            {t('education.apply.step', { step, total: 3 })}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-teal-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}

      <div className="flex items-center justify-between pt-4 border-t">
        <div>
          {step > 1 && (
            <Button
              variant="outline"
              onClick={() => setStep(step - 1)}
            >
              {t('common.back')}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
          >
            {t('common.cancel')}
          </Button>
          {step < 3 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceedToNext()}
            >
              {t('common.next')}
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting || !canProceedToNext()}
            >
              {submitting ? t('common.submitting') : t('education.apply.submit')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
