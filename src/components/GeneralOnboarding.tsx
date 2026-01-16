import { useState } from 'react';
import { User, MapPin, Star, Shield, ArrowRight, ArrowLeft, CheckCircle } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { PhoneInput } from './ui/PhoneInput';
import { LocationCascade } from './ui/LocationCascade';
import { SingleSelectField } from './ui/SingleSelectField';
import { COUNTRIES } from '../constants/countries';

interface GeneralOnboardingProps {
  userId: string;
  onComplete: () => void;
}

const MODULES = [
  'jobs', 'marketplace', 'events', 'education', 'community', 'visa', 'auPair'
];

export function GeneralOnboarding({ userId, onComplete }: GeneralOnboardingProps) {
  const { t, language } = useI18n();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    display_name: '',
    phone: '',
    citizenship_country: '',
    residence_country: '',
    residence_province: '',
    residence_city: '',
    current_city: '', // Keep for backward compatibility
    date_of_birth: '',
    gender: '',
    interested_modules: [] as string[],
    primary_interest: '',
    user_goals: '', // New: What they hope to achieve
    platform_intent: '', // New: How they plan to use the platform
    consent_data_processing: false,
    consent_communications: false
  });

  // Dropdown options for user goals and platform intent
  const userGoalsOptions = [
    { id: 'find_job', label: t('onboarding.goals.findJob') },
    { id: 'network', label: t('onboarding.goals.network') },
    { id: 'learn_language', label: t('onboarding.goals.learnLanguage') },
    { id: 'cultural_experience', label: t('onboarding.goals.culturalExperience') },
    { id: 'education', label: t('onboarding.goals.education') },
    { id: 'other', label: t('common.other') }
  ];
  const platformIntentOptions = [
    { id: 'browse_jobs', label: t('onboarding.intents.browseJobs') },
    { id: 'marketplace', label: t('onboarding.intents.marketplace') },
    { id: 'attend_events', label: t('onboarding.intents.attendEvents') },
    { id: 'join_community', label: t('onboarding.intents.joinCommunity') },
    { id: 'au_pair', label: t('onboarding.intents.auPair') },
    { id: 'other', label: t('common.other') }
  ];

  const totalSteps = 3;

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleModule = (module: string) => {
    setFormData(prev => ({
      ...prev,
      interested_modules: prev.interested_modules.includes(module)
        ? prev.interested_modules.filter(m => m !== module)
        : [...prev.interested_modules, module]
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
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: formData.display_name,
          phone: formData.phone,
          current_city: formData.current_city || formData.residence_city,
          citizenship_country: formData.citizenship_country,
          residence_country: formData.residence_country,
          residence_province: formData.residence_province,
          residence_city: formData.residence_city,
          date_of_birth: formData.date_of_birth || null,
          gender: formData.gender || null,
          interested_modules: formData.interested_modules,
          primary_interest: formData.primary_interest,
        user_goals: formData.user_goals,
          platform_intent: formData.platform_intent,
          consent_data_processing: formData.consent_data_processing,
          consent_communications: formData.consent_communications,
          onboarding_completed: true,
          is_first_login: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      onComplete();
    } catch (error) {
      console.error('Failed to save onboarding:', error);
      alert(t('onboarding.saveFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              {t('onboarding.title')}
            </h2>
            <span className="text-sm font-medium text-gray-500">
              {t('common.step')} {step} {t('common.of')} {totalSteps}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-teal-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full mb-4">
                <User className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding.personalInfo')}</h3>
              <p className="text-gray-600">{t('onboarding.personalInfoDesc')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('onboarding.displayName')} *
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => updateField('display_name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('onboarding.displayNamePlaceholder')}
                required
              />
              <p className="text-sm text-gray-500 mt-1">{t('onboarding.displayNameHelp')}</p>
            </div>

            <PhoneInput
              value={formData.phone}
              onChange={(value) => updateField('phone', value)}
              label={t('onboarding.phoneNumber')}
              required
              defaultCountryCode="+86"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.dateOfBirth')}
                </label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => updateField('date_of_birth', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('onboarding.gender')}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => updateField('gender', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">{t('common.select')}</option>
                  <option value="male">{t('onboarding.male')}</option>
                  <option value="female">{t('onboarding.female')}</option>
                  <option value="other">{t('onboarding.other')}</option>
                  <option value="prefer_not_to_say">{t('onboarding.preferNotToSay')}</option>
                </select>
              </div>
            </div>

            {/* Citizenship */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {t('onboarding.citizenshipCountry')} *
              </label>
              <select
                value={formData.citizenship_country}
                onChange={(e) => updateField('citizenship_country', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">{t('onboarding.selectCitizenshipCountry')}</option>
                {COUNTRIES.map((country) => (
                  <option key={country.code} value={country.en}>
                    {language === 'zh' ? country.zh : country.en}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">{t('onboarding.citizenshipCountryHelp')}</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full mb-4">
                <MapPin className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding.residenceCountry')}</h3>
              <p className="text-gray-600">{t('onboarding.residenceCountryDesc')}</p>
            </div>

            <LocationCascade
              country={formData.residence_country}
              province={formData.residence_province}
              city={formData.residence_city}
              onCountryChange={(value) => updateField('residence_country', value)}
              onProvinceChange={(value) => updateField('residence_province', value)}
              onCityChange={(value) => {
                updateField('residence_city', value);
                updateField('current_city', value); // Sync for backward compatibility
              }}
              required
              language={language as 'en' | 'zh'}
            />
            <p className="text-sm text-gray-500 mt-2">
              {t('onboarding.residenceCountryHelp')}
            </p>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full mb-4">
                <Star className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding.interests')}</h3>
              <p className="text-gray-600">{t('onboarding.interestsDesc')}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('onboarding.interestedModules')} *
              </label>
              <p className="text-sm text-gray-500 mb-3">
                {t('onboarding.selectMultipleInterests')}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {MODULES.map(module => (
                  <button
                    key={module}
                    type="button"
                    onClick={() => toggleModule(module)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      formData.interested_modules.includes(module)
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{t(`nav.${module}`)}</span>
                      {formData.interested_modules.includes(module) && (
                        <CheckCircle size={20} className="text-blue-600" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('onboarding.primaryInterest')} *
              </label>
              <select
                value={formData.primary_interest}
                onChange={(e) => updateField('primary_interest', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">{t('common.select')}</option>
                {formData.interested_modules.map(module => (
                  <option key={module} value={module}>{t(`nav.${module}`)}</option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">{t('onboarding.primaryInterestHelp')}</p>
            </div>
          </div>
        )}

        {/* Step 3 removed - was emergency contact, now replaced with consent (moved from step 4) */}

        {/* Final Step: Consent (formerly in last position) */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 rounded-full mb-4">
                <Shield className="text-blue-600" size={32} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('onboarding.almostDone')}</h3>
              <p className="text-gray-600">{t('onboarding.almostDoneDesc')}</p>
            </div>


            {/* User Goals (Dropdown) */}
            <div>
              <SingleSelectField
                label={`${t('onboarding.userGoals')} *`}
                options={userGoalsOptions}
                value={formData.user_goals}
                onChange={(val: string) => updateField('user_goals', val)}
                error={!formData.user_goals ? t('common.required') : undefined}
                description={t('onboarding.userGoalsDesc')}
                variant="radio"
              />
            </div>

            {/* Platform Intent (Dropdown) */}
            <div>
              <SingleSelectField
                label={`${t('onboarding.platformIntent')} *`}
                options={platformIntentOptions}
                value={formData.platform_intent}
                onChange={(val: string) => updateField('platform_intent', val)}
                description={t('onboarding.platformIntentDesc')}
                variant="radio"
              />
            </div>

            {/* Consent Checkboxes */}
            <div className="space-y-3 pt-4 border-t">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent_data_processing}
                  onChange={(e) => updateField('consent_data_processing', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  required
                />
                <span className="text-sm text-gray-700">
                  {t('onboarding.consentDataProcessing')} *
                </span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.consent_communications}
                  onChange={(e) => updateField('consent_communications', e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  {t('onboarding.consentCommunications')}
                </span>
              </label>
            </div>
          </div>
        )}

        <div className="flex justify-between mt-8">
          {step > 1 ? (
            <Button
              onClick={handleBack}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              {t('common.back')}
            </Button>
          ) : (
            <div></div>
          )}

          {step < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={
                (step === 1 && (!formData.display_name || !formData.phone || !formData.citizenship_country)) ||
                (step === 2 && (!formData.residence_country || !formData.residence_city)) ||
                (step === 3 && (formData.interested_modules.length === 0 || !formData.primary_interest))
              }
              className="flex items-center gap-2"
            >
              {t('common.next')}
              <ArrowRight size={20} />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              isLoading={loading}
              disabled={loading || !formData.consent_data_processing || !formData.user_goals || !formData.platform_intent}
              className="flex items-center gap-2"
            >
              {t('onboarding.complete')}
              <CheckCircle size={20} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
