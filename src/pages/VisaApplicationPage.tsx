import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { visaService, VisaType, VisaApplication, VisaDocument, DocumentType } from '../services/visaService';
import { ArrowLeft, ArrowRight, Save, Send, Upload, X, Check, FileText, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Textarea } from '../components/ui/Textarea';
import { LocationCascade } from '../components/ui/LocationCascade';
import { Loading } from '../components/ui/Loading';
import { OnboardingSuccessModal } from '../components/ui/OnboardingSuccessModal';

const TOTAL_STEPS = 5;

export function VisaApplicationPage() {
  const { user } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [application, setApplication] = useState<VisaApplication | null>(null);
  const [documents, setDocuments] = useState<VisaDocument[]>([]);
  const [uploadingDocs, setUploadingDocs] = useState<Set<string>>(new Set());
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const [formData, setFormData] = useState({
    visa_type: '' as VisaType,
    first_name: '',
    last_name: '',
    full_name: '', // Keeping for legacy/display if needed, but primary input will be split
    nationality_country: '',
    nationality_province: '',
    nationality_city: '',
    date_of_birth: '',
    passport_number: '',
    passport_expiry: '',
    current_country: '',
    current_province: '',
    current_city: '',
    purpose_data: {
      employer: '',
      school: '',
      education_level: '',
      start_date: '',
      family_contact: '',
      visa_purpose: '', // Dropdown value
      purpose_description: '' // Optional extra details
    }
  });

  useEffect(() => {
    if (!user) {
      navigate('/visa');
      return;
    }

    if (id === 'new') {
      setLoading(false);
    } else if (id) {
      loadApplication();
    }
  }, [id, user]);

  const loadApplication = async () => {
    if (!id || id === 'new') return;

    try {
      const [appData, docsData] = await Promise.all([
        visaService.getApplication(id),
        visaService.getDocuments(id)
      ]);

      if (appData) {
        setApplication(appData);
        setFormData({
          visa_type: appData.visa_type,
          first_name: appData.full_name ? appData.full_name.split(' ')[0] : '',
          last_name: appData.full_name ? appData.full_name.split(' ').slice(1).join(' ') : '',
          full_name: appData.full_name || '',
          nationality_country: appData.nationality_country || '',
          nationality_province: appData.nationality_province || '',
          nationality_city: appData.nationality_city || '',
          date_of_birth: appData.date_of_birth || '',
          passport_number: appData.passport_number || '',
          passport_expiry: appData.passport_expiry || '',
          current_country: appData.current_country || '',
          current_province: appData.current_province || '',
          current_city: appData.current_city || '',
          purpose_data: appData.purpose_data || {}
        });
        setDocuments(docsData);
      }
    } catch (error) {
      console.error('Failed to load application:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!application) return;
    
    if (!confirm(t('common.deleteConfirm'))) return;
    
    try {
      await visaService.deleteApplication(application.id);
      navigate('/visa/dashboard');
    } catch (error) {
      console.error('Failed to delete application:', error);
      alert(t('visa.application.deleteAppError'));
    }
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      if (!application) {
        if (!formData.visa_type) {
          throw new Error(t('visa.application.selectVisaType'));
        }
        const newApp = await visaService.createApplication(formData.visa_type);
        setApplication(newApp);
        navigate(`/visa/application/${newApp.id}`, { replace: true });
      } else {
        const updatedApp = await visaService.updateApplication(application.id, formData);
        setApplication(updatedApp);
      }
    } catch (error: any) {
      alert(error.message || t('visa.application.saveDraftError'));
    } finally {
      setSaving(false);
    }
  };

  const handleNext = async () => {
    await saveDraft();
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    if (!application) return;

    const requiredDocs = visaService.getRequiredDocuments(application.visa_type);
    const uploadedTypes = new Set(documents.map(d => d.document_type));
    const missingDocs = requiredDocs.filter(doc => !uploadedTypes.has(doc));

    if (missingDocs.length > 0) {
      alert(t('visa.application.missingDocuments') + ': ' + missingDocs.join(', '));
      return;
    }

    if (!formData.first_name || !formData.last_name || !formData.passport_number || !formData.purpose_data.visa_purpose) {
      alert(t('visa.application.fillRequired'));
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        ...formData,
        full_name: `${formData.first_name} ${formData.last_name}`.trim()
      };
      await visaService.updateApplication(application.id, submitData);
      await visaService.submitApplication(application.id);
      setShowSuccessModal(true);
    } catch (error) {
      alert(t('visa.application.submitError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File, docType: DocumentType) => {
    if (!application) return;

    if (file.size > 10 * 1024 * 1024) {
      alert(t('visa.application.fileTooLarge'));
      return;
    }

    setUploadingDocs(prev => new Set(prev).add(docType));
    try {
      const doc = await visaService.uploadDocument(application.id, file, docType);
      setDocuments(prev => [...prev, doc]);
    } catch (error) {
      alert(t('visa.application.uploadError'));
    } finally {
      setUploadingDocs(prev => {
        const next = new Set(prev);
        next.delete(docType);
        return next;
      });
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    try {
      await visaService.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
    } catch (error) {
      alert(t('visa.application.deleteError'));
    }
  };

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const updatePurposeData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      purpose_data: { ...prev.purpose_data, [field]: value }
    }));
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t('visa.application.step1.title')}</h2>
      <p className="text-gray-600">{t('visa.application.step1.description')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(['work_z', 'student_x', 'family_q', 'family_s', 'business_m', 'tourist_l', 'talent_r', 'crew_c', 'other'] as VisaType[]).map((type) => (
          <button
            key={type}
            onClick={() => updateField('visa_type', type)}
            className={`p-6 rounded-xl border-2 text-left transition-all ${
              formData.visa_type === type
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <h3 className="font-semibold text-gray-900 mb-2">
              {t(`visa.types.${type}.title`)}
            </h3>
            <p className="text-sm text-gray-600">
              {t(`visa.types.${type}.description`)}
            </p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">{t('visa.application.step2.title')}</h2>
      <p className="text-gray-600">{t('visa.application.step2.description')}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('visa.application.firstName') + ' *'}
          value={formData.first_name}
          onChange={(e) => updateField('first_name', e.target.value)}
          required
        />
        <Input
          label={t('visa.application.lastName') + ' *'}
          value={formData.last_name}
          onChange={(e) => updateField('last_name', e.target.value)}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('visa.application.nationality')} *
        </label>
        <LocationCascade
          country={formData.nationality_country}
          province={formData.nationality_province}
          city={formData.nationality_city}
          onCountryChange={(v) => updateField('nationality_country', v)}
          onProvinceChange={(v) => updateField('nationality_province', v)}
          onCityChange={(v) => updateField('nationality_city', v)}
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('visa.application.dateOfBirth') + ' *'}
          type="date"
          value={formData.date_of_birth}
          onChange={(e) => updateField('date_of_birth', e.target.value)}
          required
        />
        <Input
          label={t('visa.application.passportNumber') + ' *'}
          value={formData.passport_number}
          onChange={(e) => updateField('passport_number', e.target.value)}
          required
        />
      </div>

      <Input
        label={t('visa.application.passportExpiry') + ' *'}
        type="date"
        value={formData.passport_expiry}
        onChange={(e) => updateField('passport_expiry', e.target.value)}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('visa.application.currentResidence')} *
        </label>
        <LocationCascade
          country={formData.current_country}
          province={formData.current_province}
          city={formData.current_city}
          onCountryChange={(v) => updateField('current_country', v)}
          onProvinceChange={(v) => updateField('current_province', v)}
          onCityChange={(v) => updateField('current_city', v)}
          required
        />
      </div>
    </div>
  );

  const renderStep3 = () => {
    const visaType = formData.visa_type;
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('visa.application.step3.title')}</h2>
        <p className="text-gray-600">{t('visa.application.step3.description')}</p>

        {/* Purpose Dropdown */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('visa.application.visaPurpose')} *
          </label>
          <Select
            value={formData.purpose_data.visa_purpose || ''}
            onChange={(e) => updatePurposeData('visa_purpose', e.target.value)}
            options={[
              { value: 'work', label: t('visa.purposes.work') },
              { value: 'study', label: t('visa.purposes.study') },
              { value: 'tourism', label: t('visa.purposes.tourism') },
              { value: 'business', label: t('visa.purposes.business') },
              { value: 'family', label: t('visa.purposes.family') },
              { value: 'transit', label: t('visa.purposes.transit') },
              { value: 'crew', label: t('visa.purposes.crew') },
              { value: 'talent', label: t('visa.purposes.talent') },
              { value: 'other', label: t('visa.purposes.other') }
            ]}
            required
          />
        </div>

        {(visaType === 'work_z') && (
          <Input
            label={t('visa.application.employer') + ' *'}
            value={formData.purpose_data.employer || ''}
            onChange={(e) => updatePurposeData('employer', e.target.value)}
            placeholder={t('visa.application.employerPlaceholder')}
            required
          />
        )}

        {(visaType === 'student_x') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('visa.application.educationLevel')} *
                  </label>
                  <Select
                    value={formData.purpose_data.education_level || ''}
                    onChange={(e) => updatePurposeData('education_level', e.target.value)}
                    options={[
                      { value: 'high_school', label: t('visa.educationLevels.high_school') },
                      { value: 'associate', label: t('visa.educationLevels.associate') },
                      { value: 'bachelor', label: t('visa.educationLevels.bachelor') },
                      { value: 'master', label: t('visa.educationLevels.master') },
                      { value: 'phd', label: t('visa.educationLevels.phd') },
                      { value: 'language', label: t('visa.educationLevels.language') },
                      { value: 'other', label: t('visa.educationLevels.other') }
                    ]}
                    required
                  />
               </div>
               <Input
                  label={t('visa.application.startDate') + ' *'}
                  type="month"
                  value={formData.purpose_data.start_date || ''}
                  onChange={(e) => updatePurposeData('start_date', e.target.value)}
                  required
               />
            </div>
            {/* School Name removed as per request, can be added back if needed */}
          </>
        )}

        {(visaType === 'family_q' || visaType === 'family_s') && (
          <Input
            label={t('visa.application.familyContact') + ' *'}
            value={formData.purpose_data.family_contact || ''}
            onChange={(e) => updatePurposeData('family_contact', e.target.value)}
            placeholder={t('visa.application.familyContactPlaceholder')}
            required
          />
        )}

        <Textarea
          label={t('visa.application.purposeDescription') + ' (Optional)'}
          value={formData.purpose_data.purpose_description || ''}
          onChange={(e) => updatePurposeData('purpose_description', e.target.value)}
          rows={4}
          placeholder={t('visa.application.purposePlaceholder')}
        />
        <p className="text-sm text-gray-500">{t('visa.application.purposeHelper')}</p>
      </div>
    );
  };

  const renderStep4 = () => {
    if (!application) return null;

    const requiredDocs = visaService.getRequiredDocuments(application.visa_type);

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('visa.application.step4.title')}</h2>
        <p className="text-gray-600">{t('visa.application.step4.description')}</p>

        <div className="space-y-4">
          {requiredDocs.map((docType) => {
            const uploaded = documents.filter(d => d.document_type === docType);
            const isUploading = uploadingDocs.has(docType);

            return (
              <div key={docType} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">
                      {t(`visa.documents.${docType}`)} *
                    </h3>
                    {uploaded.length > 0 && (
                      <Check className="text-green-500" size={20} />
                    )}
                  </div>
                  {!isUploading && (
                    <label className="cursor-pointer">
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file, docType);
                        }}
                      />
                      <div className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                        <Upload size={16} />
                        <span className="text-sm">{t('visa.application.upload')}</span>
                      </div>
                    </label>
                  )}
                </div>

                {isUploading && (
                  <div className="text-sm text-gray-600">{t('visa.application.uploading')}</div>
                )}

                {uploaded.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between bg-gray-50 rounded p-3 mt-2">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-700">{doc.file_name}</span>
                    </div>
                    {application.status === 'draft' && (
                      <button
                        onClick={() => handleDeleteDocument(doc.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            {t('visa.application.documentRequirements')}
          </p>
        </div>
      </div>
    );
  };

  const renderStep5 = () => {
    const requiredDocs = application ? visaService.getRequiredDocuments(formData.visa_type || application.visa_type) : [];
    const uploadedTypes = new Set(documents.map(d => d.document_type));
    const allDocsUploaded = requiredDocs.every(doc => uploadedTypes.has(doc));

    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">{t('visa.application.step5.title')}</h2>
        <p className="text-gray-600">{t('visa.application.step5.description')}</p>

        <div className="bg-white border border-gray-200 rounded-lg divide-y">
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">{t('visa.application.visaType')}</h3>
            <p className="text-gray-700">{t(`visa.types.${formData.visa_type}.title`)}</p>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{t('visa.application.personalInfo')}</h3>
              <button
                onClick={() => setCurrentStep(2)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t('visa.application.edit')}
              </button>
            </div>
            <div className="text-sm text-gray-700 space-y-1">
              <p><strong>{t('visa.application.fullName')}:</strong> {formData.first_name} {formData.last_name}</p>
              <p><strong>{t('visa.application.passportNumber')}:</strong> {formData.passport_number}</p>
              <p><strong>{t('visa.application.nationality')}:</strong> {formData.nationality_country}</p>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{t('visa.application.purpose')}</h3>
              <button
                onClick={() => setCurrentStep(3)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t('visa.application.edit')}
              </button>
            </div>
            <p className="text-sm text-gray-700">
              {formData.purpose_data.purpose_description}
            </p>
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{t('visa.application.documents')}</h3>
              <button
                onClick={() => setCurrentStep(4)}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {t('visa.application.edit')}
              </button>
            </div>
            <p className="text-sm text-gray-700">
              {documents.length} {t('visa.application.documentsUploaded')}
              {!allDocsUploaded && (
                <span className="text-red-600 ml-2">({t('visa.application.incomplete')})</span>
              )}
            </p>
          </div>
        </div>

        {!allDocsUploaded && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              {t('visa.application.uploadAllDocuments')}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return <Loading />;
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return !!formData.visa_type;
      case 2:
        return formData.first_name && formData.last_name && formData.passport_number && formData.nationality_country && formData.current_country;
      case 3:
        // purpose_description is now optional
        return !!formData.purpose_data.visa_purpose;
      case 4:
        if (!application) return false;
        const requiredDocs = visaService.getRequiredDocuments(application.visa_type);
        const uploadedTypes = new Set(documents.map(d => d.document_type));
        return requiredDocs.every(doc => uploadedTypes.has(doc));
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/visa/dashboard')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft size={20} />
              <span>{t('visa.application.backToDashboard')}</span>
            </button>

            {application && (
              <button
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 flex items-center gap-1 text-sm font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
              >
                <Trash2 size={16} />
                {t('common.delete')}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{t('visa.application.title')}</h1>
            <span className="text-sm font-medium text-gray-500">
              {t('visa.application.step')} {currentStep} {t('visa.application.of')} {TOTAL_STEPS}
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}
        </div>

        <div className="flex items-center justify-between">
          <div>
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
              >
                <ArrowLeft size={20} className="mr-2" />
                {t('visa.application.back')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={saving}
            >
              <Save size={20} className="mr-2" />
              {saving ? t('visa.application.saving') : t('visa.application.saveDraft')}
            </Button>

            {currentStep < TOTAL_STEPS ? (
              <Button
                onClick={handleNext}
                disabled={!canProceed() || saving}
              >
                <ArrowRight size={20} className="mr-2" />
                {t('visa.application.next')}
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!canProceed() || submitting}
              >
                <Send size={20} className="mr-2" />
                {submitting ? t('visa.application.submitting') : t('visa.application.submit')}
              </Button>
            )}
          </div>
        </div>
      </div>

      <OnboardingSuccessModal
        isOpen={showSuccessModal}
        title={t('visa.application.success.title')}
        message={t('visa.application.success.message')}
        redirectPath="/visa/dashboard"
        onClose={() => setShowSuccessModal(false)}
      />
    </div>
  );
}
