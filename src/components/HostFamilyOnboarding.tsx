import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, ChevronLeft, ArrowRight } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { auPairService } from '../services/auPairService';
import { supabase } from '../lib/supabase';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { LocationCascade, COUNTRIES } from './ui/LocationCascade';
import { Modal } from './ui/Modal';
import { MultiSelectField } from './ui/MultiSelectField';
import { SingleSelectField } from './ui/SingleSelectField';
import { validateField, validators } from '../utils/formValidation';
import { ImageUpload } from './ui/ImageUpload';
import { FileUpload } from './ui/FileUpload';

import { ConfirmModal } from './ui/ConfirmModal';

interface HostFamilyOnboardingProps {
  userId?: string;
  onComplete?: () => void;
  mode?: 'create' | 'edit' | 'view';
  initialData?: any;
}

export function HostFamilyOnboarding({ userId, onComplete, mode = 'create', initialData }: HostFamilyOnboardingProps) {
  const isEditing = mode === 'edit' || mode === 'view';
  const isViewOnly = mode === 'view';
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const totalSteps = 8;
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkAdmin() {
      try {
        const { adminService } = await import('../services/adminService');
        const admin = await adminService.checkIsAdmin();
        setIsAdmin(admin);
      } catch (e) {
        setIsAdmin(false);
      }
    }

    checkAdmin();
  }, []);

  const [formData, setFormData] = useState({
    // Section A: Family Lifestyle
    family_name: '',
    family_size: 0,
    children_count: 0,
    children_ages: [] as number[],
    country: '',
    province: '',
    city: '',
    home_type: '', // New
    household_vibe: [] as string[], // New
    cleanliness_level: 3, // New
    guests_frequency: '', // New
    languages_spoken: [] as string[],

    // Section B: Parenting
    parenting_styles: [] as string[], // New
    discipline_approach: '', // New

    // Section C: House Rules
    rules: [] as string[],
    rules_details: '', // New

    // Section D: Au Pair Preferences
    preferred_traits: [] as string[], // New
    deal_breakers: [] as string[], // New
    preferred_nationalities: [] as string[],

    // Section E: Work Structure
    daily_tasks: [] as string[], 
    work_hours_type: '', // structured selection
    work_hours_details: '', 
    flexibility_level: '', // New
    start_date: '',
    end_date: '',

    // Section F: Benefits
    monthly_salary_offer: 0,
    benefits: [] as string[],
    private_room: true,
    
    // Section G: Media
    profile_photos: [] as string[],
    intro_video_url: '',

    // Legacy mapping / Extras
    housing_type: '', // Map to home_type
    requirements: '',
    expectations: ''
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
          .from('host_family_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setFormData({
            family_name: data.family_name || '',
            family_size: data.family_size || 0,
            children_count: data.children_count || 0,
            children_ages: data.children_ages || [],
            country: data.country || '',
            province: data.province || '',
            city: data.city || '',
            home_type: data.home_type || data.housing_type || '',
            household_vibe: data.household_vibe || [],
            cleanliness_level: data.cleanliness_level || 3,
            guests_frequency: data.guests_frequency || '',
            languages_spoken: data.languages_spoken || [],
            parenting_styles: data.parenting_styles || [],
            discipline_approach: data.discipline_approach || '',
            rules: data.rules || [],
            rules_details: data.house_rules_details || '',
            preferred_traits: data.preferred_traits || [],
            deal_breakers: data.deal_breakers || [],
            preferred_nationalities: data.preferred_nationalities || [],
            daily_tasks: data.daily_tasks || [],
            work_hours_type: data.work_hours || '',
            work_hours_details: '', // Don't overwrite with work_hours if it's structured differently
            flexibility_level: data.flexibility_level || '',
            start_date: data.start_date || '',
            end_date: data.end_date || '',
            monthly_salary_offer: data.monthly_salary_offer || 0,
            benefits: data.benefits || [],
            private_room: data.private_room ?? true,
            profile_photos: data.profile_photos || [],
            intro_video_url: data.intro_video_url || '',
            housing_type: data.housing_type || '',
            requirements: data.requirements || '',
            expectations: data.expectations || ''
          });
        }
      } catch (err) {
        console.error('Error loading existing host family profile:', err);
      }
    }

    loadExistingProfile();
  }, [userId, mode, initialData]);

  // Step-by-step persistence
  useEffect(() => {
    const savedData = localStorage.getItem('host_family_onboarding_draft');
    if (savedData) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedData) }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('host_family_onboarding_draft', JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when field persists
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    // Helper to check and set error
    const check = (field: string, rule: any, value: unknown) => {
      const error = validateField(value, [rule]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
      }
    };

    switch (currentStep) {
      case 1: // Family Lifestyle
        check('family_name', validators.required(), formData.family_name);
        check('family_size', validators.required(), formData.family_size);
        check('country', validators.required(), formData.country);
        check('city', validators.required(), formData.city);
        check('home_type', validators.required(t('validation.required')), formData.home_type);
        check('household_vibe', validators.minSelection(1), formData.household_vibe);
        break;
      
      case 2: // Parenting Style
        check('parenting_styles', validators.minSelection(1), formData.parenting_styles);
        check('discipline_approach', validators.required(), formData.discipline_approach);
        break;

      case 3: // House Rules
        if (formData.rules.length > 0 && formData.rules.includes('other')) {
           check('rules_details', validators.required(t('validation.required')), formData.rules_details);
        }
        break;

      case 4: // Au Pair Preferences
        check('preferred_traits', validators.minSelection(1), formData.preferred_traits);
        break;

      case 5: // Work Structure
        check('daily_tasks', validators.minSelection(1), formData.daily_tasks);
        check('start_date', validators.required(), formData.start_date);
        break;

      case 6: // Benefits
        check('monthly_salary_offer', validators.required(), formData.monthly_salary_offer);
        break;

      case 7: // Media
        // Optional or Recommended? User said "we need to add those sections... so that the profiles have some pictures".
        // Let's enforce at least 1 photo for quality.
        if (formData.profile_photos.length === 0) {
           newErrors['profile_photos'] = t('auPair.onboarding.error.photoRequired') || "Please upload at least one photo of your family or home";
           isValid = false;
        }
        break;
      
      case 8: // Review
        break;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const jumpToStep = (s: number) => {
    setStep(s);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateStep(step)) return;
    
    setLoading(true);
    try {
      await auPairService.setUserRole('host_family');
      
      // Ensure housing_type is populated from home_type if needed
      // Map form fields to DB columns
      // Ensure we don't send legacy fields like 'house_rules' from localStorage drafts
      const { 
        home_type, 
        rules_details, 
        work_hours_type, 
        work_hours_details, 
        rules, 
        profile_photos, 
        intro_video_url, 
        ...rest 
      } = formData as any;
      
      const profileData = {
        ...rest,
        housing_type: formData.home_type || formData.housing_type,
        home_type: formData.home_type,
        rules: formData.rules,
        house_rules_details: formData.rules_details,
        work_hours: formData.work_hours_type,
        family_photos: formData.profile_photos,
        family_video_url: formData.intro_video_url,
        profile_status: 'active'
      };

      await auPairService.createHostFamilyProfile(profileData);
      
      // Only complete onboarding if not in edit mode
      await auPairService.completeOnboarding({
        full_name: formData.family_name,
        current_city: formData.city
      });
      
      localStorage.removeItem('host_family_onboarding_draft');
      
      // Delay for UX
          setTimeout(() => {
            // If creating a new profile, always go to payment first
            if (mode === 'create') {
                navigate('/au-pair/payment');
                return;
            }

            if (userId) {
                 // If we are editing, maybe go back to profile or settings
                 if (onComplete) {
                     onComplete();
                 } else {
                     navigate('/settings');
                 }
            } else {
                 navigate('/au-pair/payment');
            }
          }, 1500);

    } catch (error: any) {
      console.error('Failed to save profile:', error);
      alert(`Failed to save profile: ${error.message || 'Unknown error'}. Please check your connection and try again.`);
      setLoading(false);
    }
  };

  // --- OPTIONS DATA ---
  const homeTypeOptions = [
    { id: 'house', label: t('auPair.onboarding.homeTypeHouse') },
    { id: 'apartment', label: t('auPair.onboarding.homeTypeApartment') },
    { id: 'farm', label: t('auPair.onboarding.homeTypeFarm') },
    { id: 'townhouse', label: t('auPair.onboarding.homeTypeTownhouse') }
  ];

  const vibeOptions = [
    { id: 'active', label: t('auPair.onboarding.vibeActive') },
    { id: 'calm', label: t('auPair.onboarding.vibeCalm') },
    { id: 'creative', label: t('auPair.onboarding.vibeCreative') },
    { id: 'intellectual', label: t('auPair.onboarding.vibeIntellectual') },
    { id: 'social', label: t('auPair.onboarding.vibeSocial') },
    { id: 'structured', label: t('auPair.onboarding.vibeStructured') },
    { id: 'relaxed', label: t('auPair.onboarding.vibeRelaxed') },
    { id: 'nature', label: t('auPair.onboarding.vibeNature') }
  ];

  const parentingOptions = [
    { id: 'gentle', label: t('auPair.onboarding.options.parenting.gentle') || 'Gentle Parenting' },
    { id: 'montessori', label: t('auPair.onboarding.options.parenting.montessori') || 'Montessori Inspired' },
    { id: 'authoritative', label: t('auPair.onboarding.options.parenting.authoritative') || 'Authoritative' },
    { id: 'attachment', label: t('auPair.onboarding.options.parenting.attachment') || 'Attachment Parenting' },
    { id: 'free_range', label: t('auPair.onboarding.options.parenting.free_range') || 'Free-Range' },
    { id: 'structured', label: t('auPair.onboarding.options.parenting.structured') || 'Strict/Structured' }
  ];

  const disciplineOptions = [
    { id: 'discussion', label: t('auPair.onboarding.options.discipline.discussion') || 'Discussion' },
    { id: 'timeouts', label: t('auPair.onboarding.options.discipline.timeouts') || 'Time-outs' },
    { id: 'consequences', label: t('auPair.onboarding.options.discipline.consequences') || 'Natural Consequences' },
    { id: 'loss_privileges', label: t('auPair.onboarding.options.discipline.loss_privileges') || 'Loss of Privileges' },
    { id: 'au_pair_leads', label: t('auPair.onboarding.options.discipline.au_pair_leads') || 'Au Pair can discipline' },
    { id: 'parents_only', label: t('auPair.onboarding.options.discipline.parents_only') || 'Only parents discipline' }
  ];

  const rulesOptions = [
    { id: 'no_smoking', label: t('auPair.onboarding.options.rules.no_smoking') || 'No Smoking' },
    { id: 'no_drinking', label: t('auPair.onboarding.options.rules.no_drinking') || 'No Drinking' },
    { id: 'no_overnight_guests', label: t('auPair.onboarding.options.rules.no_overnight_guests') || 'No Overnight Guests' },
    { id: 'curfew', label: t('auPair.onboarding.options.rules.curfew') || 'Curfew' },
    { id: 'keep_room_tidy', label: t('auPair.onboarding.options.rules.keep_room_tidy') || 'Keep Room Tidy' },
    { id: 'limit_screen_time', label: t('auPair.onboarding.options.rules.screen_limit') || 'Limit Screen Time' },
    { id: 'vegetarian', label: t('auPair.onboarding.options.rules.vegan') || 'Vegetarian Diet' },
    { id: 'other', label: t('auPair.onboarding.options.rules.other') || 'Other' }
  ];

  const traitsOptions = [
    { id: 'energetic', label: t('auPair.onboarding.options.traits.energetic') },
    { id: 'calm', label: t('auPair.onboarding.options.traits.calm') },
    { id: 'organized', label: t('auPair.onboarding.options.traits.organized') },
    { id: 'creative', label: t('auPair.onboarding.options.traits.creative') },
    { id: 'outdoorsy', label: t('auPair.onboarding.options.traits.outdoorsy') },
    { id: 'independent', label: t('auPair.onboarding.options.traits.independent') },
    { id: 'nurturing', label: t('auPair.onboarding.options.traits.nurturing') },
    { id: 'strict', label: t('auPair.onboarding.options.traits.serious') }
  ];




  const dutiesOptions = [
    { id: 'school_pickup', label: t('auPair.onboarding.options.duties.school_pickup') || 'School Pickup' },
    { id: 'homework', label: t('auPair.onboarding.options.duties.homework') || 'Homework Help' },
    { id: 'meal_prep', label: t('auPair.onboarding.options.duties.meal_prep') || 'Meal Prep' },
    { id: 'light_housekeeping', label: t('auPair.onboarding.options.duties.light_housekeeping') || 'Light Housekeeping' },
    { id: 'bedtime', label: t('auPair.onboarding.options.duties.bedtime') || 'Bedtime Routine' },
    { id: 'sports', label: t('auPair.onboarding.options.duties.sports') || 'Driving to Activities' },
    { id: 'laundry', label: t('auPair.onboarding.options.duties.laundry') || 'Kids Laundry' },
    { id: 'language_teaching', label: t('auPair.onboarding.options.duties.language_teaching') || 'Language Teaching' }
  ];

  const nationalityOptions = COUNTRIES.map(c => ({
    id: c.value,
    label: c.label_en
  }));

  const benefitsOptions = [
    { id: 'car_use', label: t('auPair.onboarding.options.benefits.car_use') || 'Personal Use of Car' },
    { id: 'gym', label: t('auPair.onboarding.options.benefits.gym') || 'Gym Membership' },
    { id: 'language_classes', label: t('auPair.onboarding.options.benefits.language_classes') || 'Language Classes Paid' },
    { id: 'travel', label: t('auPair.onboarding.options.benefits.travel') || 'Travel with Family' },
    { id: 'sim_card', label: t('auPair.onboarding.options.benefits.sim_card') || 'SIM Card/Data Plan' },
    { id: 'transit_pass', label: t('auPair.onboarding.options.benefits.transit_pass') || 'Public Transit Pass' },
    { id: 'bonuses', label: t('auPair.onboarding.options.benefits.bonuses') || 'Completion Bonus' }
  ];


  const renderSectionTitle = (s: number) => {
    switch(s) {
      case 1: return t('auPair.onboarding.familyLifestyle');
      case 2: return t('auPair.onboarding.parenting');
      case 3: return t('auPair.onboarding.houseRules');
      case 4: return t('auPair.onboarding.preferences');
      case 5: return t('auPair.onboarding.workStructure');
      case 6: return t('auPair.onboarding.benefits');
      case 7: return t('auPair.onboarding.steps.media');
      default: return t('auPair.onboarding.steps.review');
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-white flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Header & Nav */}
          {!isEditing && (
            <div className="flex items-center justify-between mb-2">
              <button onClick={() => navigate('/au-pair/select-role')} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors">
                <ChevronLeft size={20} /> <span className="text-sm">{t('common.back')}</span>
              </button>
              <button onClick={() => setShowExitModal(true)} className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition-colors">
                <AlertCircle size={14} /> {t('auPair.onboarding.exit')}
              </button>
            </div>
          )}

          {/* Progress / Title */}
          <div className="mb-8">
            <div className="flex justify-between items-end mb-2">
              <h2 className="text-2xl font-bold text-gray-900">
                {isEditing ? t('common.editProfile') : (isAdmin ? t('common.adminBypass') : renderSectionTitle(step))}
              </h2>
              {!isEditing && !isAdmin && (
                <span className="text-xs font-semibold text-pink-600 uppercase tracking-widest">Step {step}/{totalSteps}</span>
              )}
            </div>
            {isEditing ? (
              <p className="text-gray-500 mb-6">{t('auPair.onboarding.editProfileDesc')}</p>
            ) : (
              !isAdmin && <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                 <div className="bg-pink-500 h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${(step / totalSteps) * 100}%` }} />
              </div>
            )}
            {isAdmin && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2 text-green-700 text-sm font-semibold">
                {t('common.adminBypassDesc') || 'Admin: You can create profiles without onboarding restrictions.'}
              </div>
            )}
          </div>

          <div className={`space-y-12 ${isEditing ? 'max-h-[70vh] overflow-y-auto pr-4' : 'min-h-[400px]'}`}>
            
            {/* Step 1: Lifestyle */}
            {(isEditing || step === 1) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(1)}
                  </h3>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input 
                    label={t('auPair.onboarding.familyName')}
                    placeholder={t('auPair.onboarding.familyNamePlaceholder')}
                    value={formData.family_name} 
                    onChange={(e) => updateField('family_name', e.target.value)} 
                    error={errors.family_name}
                    required
                    disabled={isViewOnly}
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <Input 
                      label={t('auPair.onboarding.adultsAndKids')}
                      type="number" 
                      min="1"
                      placeholder={t('auPair.onboarding.totalMembers')}
                      value={formData.family_size || ''} 
                      onChange={(e) => updateField('family_size', parseInt(e.target.value))}
                      error={errors.family_size}
                      required
                      disabled={isViewOnly}
                    />
                    <Input 
                       label={t('auPair.onboarding.children')}
                       type="number"
                       min="0"
                       value={formData.children_count || ''}
                       onChange={(e) => updateField('children_count', parseInt(e.target.value))}
                       required
                       disabled={isViewOnly}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <div className="col-span-1 md:col-span-2">
                     <label className="block text-sm font-medium text-gray-700 mb-1">{t('auPair.onboarding.location')}</label>
                     <LocationCascade
                       country={formData.country}
                       province={formData.province}
                       city={formData.city}
                       onCountryChange={(v) => updateField('country', v)}
                       onProvinceChange={(v) => updateField('province', v)}
                       onCityChange={(v) => updateField('city', v)}
                       language={language as 'en' | 'zh'}
                       required
                       disabled={isViewOnly}
                     />
                     {errors.country && <p className="text-xs text-red-500 mt-1">{errors.country}</p>}
                   </div>
                </div>

                <SingleSelectField 
                  label={t('auPair.onboarding.homeType')}
                  options={homeTypeOptions}
                  value={formData.home_type}
                  onChange={(val) => updateField('home_type', val)}
                  layout="grid"
                  variant="cards"
                  error={errors.home_type}
                  disabled={isViewOnly}
                />

                <MultiSelectField
                  label={t('auPair.onboarding.householdVibe')}
                  options={vibeOptions}
                  value={formData.household_vibe}
                  onChange={(val) => updateField('household_vibe', val)}
                  maxSelection={3}
                  variant="grid"
                  error={errors.household_vibe}
                  disabled={isViewOnly}
                />
              </div>
            )}

            {/* Step 2: Parenting */}
            {(isEditing || step === 2) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(2)}
                  </h3>
                )}
                 <MultiSelectField
                    label={t('auPair.onboarding.questionParenting') || "What is your parenting style?"}
                    description={t('auPair.onboarding.options.parentingDescription') || "This helps Au Pairs understand how you interact with your children."}
                    options={parentingOptions}
                    value={formData.parenting_styles}
                    onChange={(val) => updateField('parenting_styles', val)}
                    maxSelection={2}
                    variant="grid"
                    error={errors.parenting_styles}
                    disabled={isViewOnly}
                 />

                 <SingleSelectField
                    label={t('auPair.onboarding.questionDiscipline') || "How do you approach discipline?"}
                    options={disciplineOptions}
                    value={formData.discipline_approach}
                    onChange={(val) => updateField('discipline_approach', val)}
                    layout="column"
                    error={errors.discipline_approach}
                    disabled={isViewOnly}
                 />
              </div>
            )}

             {/* Step 3: Rules */}
             {(isEditing || step === 3) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(3)}
                  </h3>
                )}
                 <MultiSelectField
                    label={t('auPair.onboarding.questionRules') || "What activities/behaviors are NOT allowed?"}
                    description={t('auPair.onboarding.options.houseRulesDescription') || "Be clear about deal-breakers for your home."}
                    options={rulesOptions}
                    value={formData.rules}
                    onChange={(val) => updateField('rules', val)}
                    variant="grid"
                    allowOther
                    disabled={isViewOnly}
                 />
                 
                 <Textarea
                   label={t('auPair.onboarding.questionRulesDetails') || "Elaborate on your house rules (Optional)"}
                   placeholder={t('auPair.onboarding.elaborateRulesPlaceholder') || "e.g. We prefer quiet time after 9 PM..."}
                   value={formData.rules_details}
                   onChange={(e) => updateField('rules_details', e.target.value)}
                   rows={4}
                   error={errors.rules_details}
                   disabled={isViewOnly}
                 />
              </div>
            )}

            {/* Step 4: Au Pair Preferences */}
            {(isEditing || step === 4) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(4)}
                  </h3>
                )}
                 <MultiSelectField
                   label={t('auPair.onboarding.questionTraits') || "What personality traits are you looking for?"}
                   options={traitsOptions}
                   value={formData.preferred_traits}
                   onChange={(val) => updateField('preferred_traits', val)}
                   maxSelection={5}
                   variant="grid"
                   error={errors.preferred_traits}
                   disabled={isViewOnly}
                 />

                 <MultiSelectField
                   label={t('auPair.onboarding.preferredNationalities') || "Preferred Nationalities"}
                   options={nationalityOptions}
                   value={formData.preferred_nationalities}
                   onChange={(val) => updateField('preferred_nationalities', val)}
                   variant="dropdown"
                   placeholder={t('common.select') || "Select countries..."}
                   disabled={isViewOnly}
                 />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">{t('auPair.onboarding.labelIdealCandidate') || "Ideal Candidate Profile"}</h4>
                    <p className="text-sm text-blue-800">
                      {t('auPair.onboarding.labelLookingFor') || "Looking for someone who is"} {formData.preferred_traits.length > 0 ? formData.preferred_traits.join(", ") : "..."}
                    </p>
                  </div>
              </div>
            )}

            {/* Step 5: Work Structure */}
            {(isEditing || step === 5) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(5)}
                  </h3>
                )}
                 <MultiSelectField
                   label={t('auPair.onboarding.questionDuties') || "What will be the Au Pair's main duties?"}
                   options={dutiesOptions}
                   value={formData.daily_tasks}
                   onChange={(val) => updateField('daily_tasks', val)}
                   maxSelection={10}
                   variant="grid"
                   error={errors.daily_tasks}
                   disabled={isViewOnly}
                 />

                 <div className="grid grid-cols-2 gap-4">
                    <Input
                       label={t('auPair.onboarding.startDate')}
                       type="date"
                       min={new Date().toISOString().split('T')[0]}
                       value={formData.start_date}
                       onChange={(e) => updateField('start_date', e.target.value)}
                       required
                       error={errors.start_date}
                       disabled={isViewOnly}
                    />
                     <Input
                       label={t('auPair.onboarding.endDate')}
                       type="date"
                       min={formData.start_date}
                       value={formData.end_date}
                       onChange={(e) => updateField('end_date', e.target.value)}
                       required
                       error={errors.end_date}
                       disabled={isViewOnly}
                    />
                 </div>
              </div>
            )}

            {/* Step 6: Benefits */}
            {(isEditing || step === 6) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(6)}
                  </h3>
                )}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                       label={t('auPair.onboarding.questionSalary') || "Monthly Pocket Money (CNY)"}
                       type="number"
                       placeholder="e.g. 2000"
                       value={formData.monthly_salary_offer || ''}
                       onChange={(e) => updateField('monthly_salary_offer', parseFloat(e.target.value))}
                       required
                       error={errors.monthly_salary_offer}
                       disabled={isViewOnly}
                     />
                    
                     <div className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200 h-full mt-1">
                        <input 
                          type="checkbox" 
                          checked={formData.private_room} 
                          onChange={(e) => updateField('private_room', e.target.checked)}
                          className="h-5 w-5 text-pink-600 rounded focus:ring-pink-50 disabled:opacity-50"
                          disabled={isViewOnly}
                        />
                        <label className="text-sm text-gray-700 font-medium">{t('auPair.onboarding.labelPrivateRoom')}</label>
                     </div>
                 </div>

                 <MultiSelectField
                    label={t('auPair.onboarding.questionBenefits') || "Additional Benefits"}
                    options={benefitsOptions}
                    value={formData.benefits}
                    onChange={(val) => updateField('benefits', val)}
                    variant="grid"
                    placeholder={t('common.select') || "Select perks..."}
                    disabled={isViewOnly}
                 />
              </div>
            )}

            {/* Step 7: Media */}
            {(isEditing || step === 7) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(7)}
                  </h3>
                )}
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.onboarding.steps.media') || 'Family Photos & Video'}</h3>
                  
                  <div className="space-y-4">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('auPair.onboarding.media.familyPhotosLabel') || 'Family & Home Photos'} <span className="text-red-500">*</span>
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      {t('auPair.onboarding.media.familyPhotosDesc') || 'Upload 1-5 photos showing your family, the Au Pair\'s room, and living areas.'}
                    </p>
                    <ImageUpload
                      value={formData.profile_photos}
                      onChange={(urls) => updateField('profile_photos', urls)}
                      maxImages={5}
                      bucketName="host-family-photos"
                      disabled={isViewOnly}
                    />
                    {errors.profile_photos && <p className="text-xs text-red-500 mt-1">{errors.profile_photos}</p>}
                  </div>

                  <div className="space-y-2 pt-4 border-t border-gray-100">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('auPair.onboarding.media.videoLabel') || 'Family Intro Video'}
                    </label>
                    <p className="text-sm text-gray-500 mb-2">
                      {t('auPair.onboarding.media.videoDesc') || 'Upload a short video introducing your family (optional).'}
                    </p>
                    <FileUpload
                      value={formData.intro_video_url}
                      onChange={(url) => updateField('intro_video_url', url)}
                      bucketName="host-family-videos"
                      acceptedTypes=".mp4,.mov,.avi,.webm"
                      maxSizeMB={100}
                      disabled={isViewOnly}
                    />
                  </div>
              </div>
            )}

            {/* Step 8: Review */}
            {(!isEditing && step === 8) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auPair.onboarding.labelReview')}</h3>
                 <p className="text-gray-500 mb-6">{t('auPair.onboarding.hostFamily.reviewDesc')}</p>

                 <div className="space-y-4">
                    {/* Section 1 */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.familyLifestyle')}</h4>
                          <button onClick={() => jumpToStep(1)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                          <p><span className="font-medium">{t('common.name')}:</span> {formData.family_name}</p>
                          <p><span className="font-medium">{t('common.location')}:</span> {formData.city}, {formData.country}</p>
                          <p><span className="font-medium">{t('auPair.onboarding.familySize')}:</span> {formData.family_size}</p>
                          <p><span className="font-medium">{t('auPair.onboarding.children')}:</span> {formData.children_count}</p>
                       </div>
                    </div>

                    {/* Section 2 */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.parenting')}</h4>
                          <button onClick={() => jumpToStep(2)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600">
                          <p><span className="font-medium">{t('auPair.onboarding.parentingStyles')}:</span> {formData.parenting_styles.join(', ')}</p>
                          <p><span className="font-medium">{t('auPair.onboarding.discipline')}:</span> {formData.discipline_approach}</p>
                       </div>
                    </div>

                    {/* Section 4 */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.preferences')}</h4>
                          <button onClick={() => jumpToStep(4)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600">
                          <p><span className="font-medium">{t('auPair.onboarding.lookingFor')}:</span> {formData.preferred_traits.join(', ')}</p>
                       </div>
                    </div>

                    {/* Section 5 & 6 */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.workStructure')} & {t('auPair.onboarding.benefits')}</h4>
                          <button onClick={() => jumpToStep(5)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                          <p><span className="font-medium">{t('common.startDate')}:</span> {formData.start_date}</p>
                          <p><span className="font-medium">{t('jobs.salary.label')}:</span> ¥{formData.monthly_salary_offer}</p>
                          <div className="col-span-2"><span className="font-medium">{t('auPair.onboarding.duties')}:</span> {formData.daily_tasks.join(', ')}</div>
                       </div>
                    </div>

                    {/* Media */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.steps.media')}</h4>
                          <button onClick={() => jumpToStep(7)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600">
                          <p><span className="font-medium">{t('common.photos')}:</span> {formData.profile_photos.length} {t('common.uploaded')}</p>
                          <p><span className="font-medium">{t('common.video')}:</span> {formData.intro_video_url ? t('common.yes') : t('common.no')}</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}

          </div>

          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-100">
             {isViewOnly ? <div /> : (
               <>
                 {(!isEditing && step > 1) ? (
                   <Button onClick={handleBack} variant="outline" className="px-6">{t('common.back')}</Button>
                 ) : <div></div>}

                 {(!isEditing && step < totalSteps) ? (
                   <Button onClick={handleNext} className="px-8 bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-200">
                     {t('auPair.onboarding.nextStep')} <ArrowRight size={18} className="ml-2" />
                   </Button>
                 ) : (
                    <Button onClick={() => isEditing ? setShowSaveConfirm(true) : handleSubmit()} isLoading={loading} className="px-8 bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-200">
                     {loading ? t('common.saving') : (isEditing ? t('common.saveChanges') : t('auPair.onboarding.completeProfile'))} 
                     <CheckCircle size={18} className="ml-2" />
                   </Button>
                 )}
               </>
             )}
          </div>
        </div>
      </div>

      <ConfirmModal
        isOpen={showSaveConfirm}
        onClose={() => setShowSaveConfirm(false)}
        onConfirm={() => {
          setShowSaveConfirm(false);
          handleSubmit();
        }}
        title={t('common.confirmSaveTitle')}
        message={t('common.confirmSaveMessage')}
        confirmText={t('common.saveChanges')}
        type="danger"
      />

      <Modal isOpen={showExitModal} onClose={() => setShowExitModal(false)} title={t('auPair.onboarding.exitModal.title')}>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <p className="text-sm text-yellow-800 font-medium mb-1">{t('auPair.onboarding.exitModal.progressSaved')}</p>
              <p className="text-xs text-yellow-700">{t('auPair.onboarding.exitModal.returnLater')}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => setShowExitModal(false)} variant="outline" className="flex-1">
              {t('auPair.onboarding.exitModal.continueOnboarding')}
            </Button>
            <Button onClick={() => { localStorage.removeItem('host_family_onboarding_draft'); navigate('/au-pair/browse'); }} className="flex-1">
              {t('auPair.onboarding.exitModal.exitToBrowse')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Saving Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-300">
           <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent"></div>
           </div>
           <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('auPair.onboarding.creatingProfile')}</h3>
           <p className="text-gray-500">{t('auPair.onboarding.pleaseWait')}</p>
        </div>
      )}
    </>
  );
}
