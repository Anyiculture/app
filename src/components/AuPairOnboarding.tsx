import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useI18n } from '../contexts/I18nContext';
import { auPairService } from '../services/auPairService';
import { validators, validateField } from '../utils/formValidation';
import { COUNTRIES } from '../constants/countries';
import { ChevronLeft, AlertCircle, CheckCircle, ArrowRight, Trash2 } from 'lucide-react';
import { Input } from './ui/Input';
import { Select } from './ui/Select';
import { Textarea } from './ui/Textarea';
import { SingleSelectField } from './ui/SingleSelectField';
import { MultiSelectField } from './ui/MultiSelectField';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { LocationCascade } from './ui/LocationCascade';
import { ImageUpload } from './ui/ImageUpload';
import { FileUpload } from './ui/FileUpload';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassCard } from './ui/GlassCard';
import { BackgroundBlobs } from './ui';

import { ConfirmModal } from './ui/ConfirmModal';

interface AuPairOnboardingProps {
  userId?: string;
  onComplete?: () => void;
  mode?: 'create' | 'edit' | 'view';
  initialData?: any;
}

interface Language {
  language: string;
  proficiency: string;
}

export function AuPairOnboarding({ userId, onComplete, mode = 'create', initialData }: AuPairOnboardingProps) {
  const isEditing = mode === 'edit' || mode === 'view';
  const isViewOnly = mode === 'view';
  const { t, language } = useI18n();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const totalSteps = 9;
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Basic Info
    first_name: '',
    middle_name: '',
    last_name: '',
    age: null as number | null,
    gender: '',
    nationality: '',
    nationality_country: '',
    nationality_province: '',
    nationality_city: '',
    current_country: '',
    current_province: '',
    current_city: '',
    hobbies: [] as string[],
    // Step 2: Strengths (Section A)
    personality_traits: [] as string[],
    work_style: [] as string[],
    // Step 3: Childcare Skills (Section B)
    experience_age_groups: [] as string[],
    childcare_skills: [] as string[],
    childcare_experience_desc: '',
    education_level: '',
    childcare_experience_years: 0,
    // Step 4: Rules & Values (Section C)
    acceptable_house_rules: [] as string[],
    // Step 5: Preferences (Section D)
    preferred_family_type: [] as string[],
    deal_breakers: [] as string[],
    preferred_countries: [] as string[],
    accommodation_preference: '',
    smoker: false,
    dietary_restrictions: '',
    // Step 6: Availability (Section E)
    availability_start_date: '',
    duration_months: 12,
    // Step 7: Languages (Section F)
    languages: [] as Language[],
    // Step 8: Media (Section G)
    profile_photos: [] as string[],
    experience_videos: [] as string[],
    // Extra / Legacy
    bio: '',
    has_tattoos: false,
  });

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

  useEffect(() => {
    if (isAdmin) return;

    const savedData = localStorage.getItem('au_pair_onboarding_draft');
    if (savedData) {
      try {
        setFormData(prev => ({ ...prev, ...JSON.parse(savedData) }));
      } catch (e) {
        console.error('Failed to load draft:', e);
      }
    }
  }, [isAdmin]);

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
          .from('au_pair_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setFormData(prev => ({
            ...prev,
            first_name: data.first_name || '',
            middle_name: data.middle_name || '',
            last_name: data.last_name || '',
            age: data.age || null,
            gender: data.gender || '',
            nationality: data.nationality || '',
            current_country: data.current_country || '',
            current_city: data.current_city || '',
            languages: Array.isArray(data.languages) ? data.languages.map((l: any) => ({ language: l.language || l, proficiency: l.proficiency || 'intermediate' })) : [],
            education_level: data.education_level || '',
            field_of_study: data.field_of_study || '',
            childcare_experience_years: data.childcare_experience_years || 0,
            experience_age_groups: data.age_groups_worked || [],
            personality_traits: data.personality_traits || [],
            work_style: data.work_style || [],
            childcare_skills: data.skills || [],
            childcare_experience_desc: data.skills_examples || '',
            bio: data.bio || '',
            preferred_countries: data.preferred_countries || [],
            preferred_family_type: data.preferred_family_type || [],
            deal_breakers: data.deal_breakers || [],
            accommodation_preference: data.live_in_preference || 'live_in',
            smoker: data.smoker || false,
            dietary_restrictions: data.dietary_restrictions || '',
            availability_start_date: data.available_from || '',
            duration_months: data.duration_months || 12,
            profile_photos: data.profile_photos || [],
            experience_videos: data.experience_videos || [],
          }));
        }
      } catch (err) {
        console.error('Error loading existing au pair profile:', err);
      }
    }

    loadExistingProfile();
  }, [userId, mode, initialData]);

  useEffect(() => {
    localStorage.setItem('au_pair_onboarding_draft', JSON.stringify(formData));
  }, [formData]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newHelper = { ...prev };
        delete newHelper[field];
        return newHelper;
      });
    }
  };

  // Language helpers
  const addLanguage = () => {
    updateField('languages', [...formData.languages, { language: '', proficiency: '' }]);
  };

  const updateLanguage = (index: number, field: 'language' | 'proficiency', value: string) => {
    const newLanguages = [...formData.languages];
    newLanguages[index][field] = value;
    updateField('languages', newLanguages);
  };

  const removeLanguage = (index: number) => {
    updateField('languages', formData.languages.filter((_, i) => i !== index));
  };


  const validateStep = (currentStep: number): boolean => {
    const newErrors: Record<string, string> = {};
    let isValid = true;
    const check = (field: string, rule: any, value: any) => {
      const error = validateField(value, [rule]);
      if (error) {
        newErrors[field] = error;
        isValid = false;
        console.log(`Validation failed for ${field}: ${error}`);
      }
    };

    try {
      switch (currentStep) {
        case 1: // Basic
          check('first_name', validators.required(), formData.first_name);
          check('last_name', validators.required(), formData.last_name);
          check('age', validators.required(), formData.age);
          check('gender', validators.required(), formData.gender);
          check('nationality', validators.required(), formData.nationality);
          check('current_country', validators.required(), formData.current_country);
          break;

        case 2: // Strengths
          check('personality_traits', validators.minSelection(1), formData.personality_traits);
          check('work_style', validators.minSelection(1), formData.work_style);
          break;

        case 3: // Skills
          check('experience_age_groups', validators.minSelection(1), formData.experience_age_groups);
          check('childcare_skills', validators.minSelection(1), formData.childcare_skills);
          check('childcare_experience_desc', validators.required("Please describe your experience"), formData.childcare_experience_desc);
          break;

        case 4: // Rules
          // Optional
          break;

        case 5: // Preferences
          check('preferred_family_type', validators.minSelection(1), formData.preferred_family_type);
          check('accommodation_preference', validators.required(), formData.accommodation_preference);
          break;

        case 6: // Availability
          check('availability_start_date', validators.required(), formData.availability_start_date);
          check('duration_months', validators.required(), formData.duration_months);
          break;

        case 7: // Languages
          if (formData.languages.length === 0) {
             newErrors['languages'] = "Please add at least one language";
             isValid = false;
          } else {
             const invalidLang = formData.languages.some(l => !l.language || !l.proficiency);
             if (invalidLang) {
                newErrors['languages'] = "Please complete all language fields";
                isValid = false;
             }
          }
          break;

        case 8: // Media
          // Optional
          break;
      }
    } catch (e) {
      console.error("Validation error:", e);
      return false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, totalSteps));
      window.scrollTo(0, 0);
    } else {
      console.log("Step validation failed");
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
    window.scrollTo(0, 0);
  };

  const jumpToStep = (s: number) => {
    setStep(s);
  };





  const handleSubmit = async () => {
    if (!validateStep(step)) {
      console.warn('Final step validation failed');
      return;
    }

    setLoading(true);
    try {
      const fullName = `${formData.first_name} ${formData.middle_name ? formData.middle_name + ' ' : ''}${formData.last_name}`.trim();
      // Construct display name ensuring it exists (fallback if needed)
      const displayName = `${formData.first_name} ${formData.last_name ? formData.last_name.charAt(0) + '.' : ''}`.trim() || 'Au Pair';



      await auPairService.createAuPairProfile({
        // Basic Info
        first_name: formData.first_name,
        middle_name: formData.middle_name,
        last_name: formData.last_name,
        display_name: displayName,
        age: formData.age ?? undefined,
        gender: formData.gender,
        nationality: [formData.nationality_country, formData.nationality_city].filter(Boolean).join(', '),
        current_country: formData.current_country,
        current_city: formData.current_city,

        // Strengths
        personality_traits: formData.personality_traits,
        work_style: formData.work_style,

        // Childcare Skills
        child_age_comfort: formData.experience_age_groups,
        skills: formData.childcare_skills,
        skills_examples: formData.childcare_experience_desc,
        education_level: formData.education_level,
        childcare_experience_years: formData.childcare_experience_years,

        // Rules & Values
        rules_comfort: formData.acceptable_house_rules,

        // Preferences
        preferred_family_type: formData.preferred_family_type,
        deal_breakers: formData.deal_breakers,
        preferred_countries: formData.preferred_countries,
        preferred_cities: [], // Not collected in form
        live_in_preference: formData.accommodation_preference,
        smoker: formData.smoker,

        // Availability
        available_from: formData.availability_start_date,
        duration_months: formData.duration_months,

        // Languages
        languages: formData.languages,

        // Extra fields that have UI
        bio: `${formData.childcare_experience_desc}\n\nHobbies: ${formData.hobbies.join(', ')}`.trim(),
        has_tattoos: formData.has_tattoos,

        // Required defaults
        previous_au_pair: false,
        profile_photos: formData.profile_photos || [],
        experience_videos: formData.experience_videos || [],
        profile_status: 'active'
      });


      await auPairService.completeOnboarding({
        full_name: fullName,
        current_city: formData.current_city
      });


      localStorage.removeItem('au_pair_onboarding_draft');


      setTimeout(() => {
        if (onComplete) onComplete();
      }, 1500);

    } catch (error: any) {
      console.error('[AuPairOnboarding] Failed to save profile:', error);
      alert(`Failed to save profile: ${error.message || error}`);
      setLoading(false);
    }
  }

  // --- Constants ---
  const nationalityOptions = COUNTRIES.map(c => ({
    id: c.code,
    label: language === 'zh' ? c.zh : c.en
  }));

  const languageOptions = [
    { id: 'English', label: t('auPair.onboarding.options.languages.english') || 'English' },
    { id: 'Chinese (Mandarin)', label: t('auPair.onboarding.options.languages.mandarin') || 'Chinese (Mandarin)' },
    { id: 'Chinese (Cantonese)', label: t('auPair.onboarding.options.languages.cantonese') || 'Chinese (Cantonese)' },
    { id: 'Spanish', label: t('auPair.onboarding.options.languages.spanish') || 'Spanish' },
    { id: 'French', label: t('auPair.onboarding.options.languages.french') || 'French' },
    { id: 'German', label: t('auPair.onboarding.options.languages.german') || 'German' },
    { id: 'Japanese', label: t('auPair.onboarding.options.languages.japanese') || 'Japanese' },
    { id: 'Korean', label: t('auPair.onboarding.options.languages.korean') || 'Korean' },
    { id: 'Russian', label: t('auPair.onboarding.options.languages.russian') || 'Russian' },
    { id: 'Italian', label: t('auPair.onboarding.options.languages.italian') || 'Italian' },
    { id: 'Portuguese', label: t('auPair.onboarding.options.languages.portuguese') || 'Portuguese' }
  ];

  const hobbiesOptions = [
    { id: 'reading', label: t('auPair.onboarding.options.hobbies.reading') },
    { id: 'cooking', label: t('auPair.onboarding.options.hobbies.cooking') },
    { id: 'travel', label: t('auPair.onboarding.options.hobbies.travel') },
    { id: 'music', label: t('auPair.onboarding.options.hobbies.music') },
    { id: 'sports', label: t('auPair.onboarding.options.hobbies.sports') },
    { id: 'photography', label: t('auPair.onboarding.options.hobbies.photography') },
    { id: 'arts_crafts', label: t('auPair.onboarding.options.hobbies.arts_crafts') },
    { id: 'hiking', label: t('auPair.onboarding.options.hobbies.hiking') },
    { id: 'swimming', label: t('auPair.onboarding.options.hobbies.swimming') },
    { id: 'gardening', label: t('auPair.onboarding.options.hobbies.gardening') },
    { id: 'dancing', label: t('auPair.onboarding.options.hobbies.dancing') },
    { id: 'writing', label: t('auPair.onboarding.options.hobbies.writing') },
    { id: 'volunteering', label: t('auPair.onboarding.options.hobbies.volunteering') },
    { id: 'yoga', label: t('auPair.onboarding.options.hobbies.yoga') },
    { id: 'gaming', label: t('auPair.onboarding.options.hobbies.gaming') }
  ].sort((a,b) => a.label.localeCompare(b.label));

  const personalityOptions = [
    { id: 'energetic', label: t('auPair.onboarding.options.traits.energetic') },
    { id: 'playful', label: t('auPair.onboarding.options.traits.playful') },
    { id: 'calm', label: t('auPair.onboarding.options.traits.calm') },
    { id: 'patient', label: t('auPair.onboarding.options.traits.patient') },
    { id: 'organized', label: t('auPair.onboarding.options.traits.organized') },
    { id: 'tidy', label: t('auPair.onboarding.options.traits.tidy') },
    { id: 'creative', label: t('auPair.onboarding.options.traits.creative') },
    { id: 'artistic', label: t('auPair.onboarding.options.traits.artistic') },
    { id: 'nurturing', label: t('auPair.onboarding.options.traits.nurturing') },
    { id: 'warm', label: t('auPair.onboarding.options.traits.warm') },
    { id: 'independent', label: t('auPair.onboarding.options.traits.independent') },
    { id: 'flexible', label: t('auPair.onboarding.options.traits.flexible') },
    { id: 'adaptable', label: t('auPair.onboarding.options.traits.adaptable') },
    { id: 'responsible', label: t('auPair.onboarding.options.traits.responsible') },
    { id: 'serious', label: t('auPair.onboarding.options.traits.serious') },
    { id: 'outgoing', label: t('auPair.onboarding.options.traits.outgoing') },
    { id: 'introverted', label: t('auPair.onboarding.options.traits.introverted') },
    { id: 'outdoorsy', label: t('auPair.onboarding.options.traits.outdoorsy') },
    { id: 'empathetic', label: t('auPair.onboarding.options.traits.empathetic') },
    { id: 'reliable', label: t('auPair.onboarding.options.traits.reliable') },
    { id: 'honest', label: t('auPair.onboarding.options.traits.honest') },
    { id: 'enthusiastic', label: t('auPair.onboarding.options.traits.enthusiastic') },
    { id: 'proactive', label: t('auPair.onboarding.options.traits.proactive') },
  ].sort((a,b) => a.label.localeCompare(b.label));

  const workStyleOptions = [
    { id: 'initiative', label: t('auPair.onboarding.options.workStyle.initiative') },
    { id: 'direction', label: t('auPair.onboarding.options.workStyle.direction') },
    { id: 'collaborative', label: t('auPair.onboarding.options.workStyle.collaborative') },
    { id: 'autonomous', label: t('auPair.onboarding.options.workStyle.autonomous') },
    { id: 'structured', label: t('auPair.onboarding.options.workStyle.structured') },
    { id: 'flexible', label: t('auPair.onboarding.options.workStyle.flexible') },
    { id: 'communicative', label: t('auPair.onboarding.options.workStyle.communicative') },
    { id: 'observer', label: t('auPair.onboarding.options.workStyle.observer') }
  ];

  const ageComfortOptions = [
    { id: 'infants', label: t('auPair.onboarding.options.ageComfort.infants') },
    { id: 'toddlers', label: t('auPair.onboarding.options.ageComfort.toddlers') },
    { id: 'preschool', label: t('auPair.onboarding.options.ageComfort.preschool') },
    { id: 'school_age', label: t('auPair.onboarding.options.ageComfort.school_age') },
    { id: 'teenagers', label: t('auPair.onboarding.options.ageComfort.teenagers') }
  ];

  const skillsOptions = [
    { id: 'cooking', label: t('auPair.onboarding.options.skills.cooking') },
    { id: 'driving', label: t('auPair.onboarding.options.skills.driving') },
    { id: 'swimming', label: t('auPair.onboarding.options.skills.swimming') },
    { id: 'tutoring', label: t('auPair.onboarding.options.skills.tutoring') },
    { id: 'first_aid', label: t('auPair.onboarding.options.skills.first_aid') },
    { id: 'sports', label: t('auPair.onboarding.options.skills.sports') },
    { id: 'arts', label: t('auPair.onboarding.options.skills.arts') },
    { id: 'music', label: t('auPair.onboarding.options.skills.music') },
    { id: 'pets', label: t('auPair.onboarding.options.skills.pets') },
    { id: 'special_needs', label: t('auPair.onboarding.options.skills.special_needs') },
    { id: 'infant_care', label: t('auPair.onboarding.options.skills.infant_care') },
    { id: 'language_teaching', label: t('auPair.onboarding.options.skills.language_teaching') },
    { id: 'housekeeping', label: t('auPair.onboarding.options.skills.housekeeping') },
    { id: 'gardening', label: t('auPair.onboarding.options.skills.gardening') },
    { id: 'elderly_care', label: t('auPair.onboarding.options.skills.elderly_care') }
  ];

  const rulesComfortOptions = [
    { id: 'curfew', label: t('auPair.onboarding.options.rules.curfew') },
    { id: 'no_guests', label: t('auPair.onboarding.options.rules.no_guests') },
    { id: 'screen_limit', label: t('auPair.onboarding.options.rules.screen_limit') },
    { id: 'cleaning', label: t('auPair.onboarding.options.rules.cleaning') },
    { id: 'pet_care', label: t('auPair.onboarding.options.rules.pet_care') },
    { id: 'vegan', label: t('auPair.onboarding.options.rules.vegan') }
  ];

  const traitsOptions = personalityOptions;



  const rulesOptions = rulesComfortOptions;
  
  const familyTypeOptions = [
    { id: 'active', label: t('auPair.onboarding.options.familyType.active') },
    { id: 'intellectual', label: t('auPair.onboarding.options.familyType.intellectual') },
    { id: 'travel', label: t('auPair.onboarding.options.familyType.travel') },
    { id: 'homebody', label: t('auPair.onboarding.options.familyType.homebody') },
    { id: 'large', label: t('auPair.onboarding.options.familyType.large') },
    { id: 'single_parent', label: t('auPair.onboarding.options.familyType.single_parent') }
  ];
  const OPTION_CATEGORIES = {
    "hobbies": "auPair.onboarding.options.hobbies",
    "traits": "auPair.onboarding.options.traits",
    "workStyle": "auPair.onboarding.options.workStyle",
    "ageComfort": "auPair.onboarding.options.ageComfort",
    "skills": "auPair.onboarding.options.skills",
    "rules": "auPair.onboarding.options.rules",
    "familyType": "auPair.onboarding.options.familyType"
  } as const;



  // Helper to translate options
  const getTranslatedOptions = (category: keyof typeof OPTION_CATEGORIES, options: { id: string, label: string }[]) => {
    return options.map(opt => ({
      ...opt,
      label: t(`${OPTION_CATEGORIES[category]}.${opt.id}`) || opt.label
    }));
  };

  const renderSectionTitle = (currentStep: number) => {
    switch(currentStep) {
      case 1: return t('auPair.onboarding.steps.basic');
      case 2: return t('auPair.onboarding.steps.strengths');
      case 3: return t('auPair.onboarding.steps.skills');
      case 4: return t('auPair.onboarding.steps.rules');
      case 5: return t('auPair.onboarding.steps.preferences');
      case 6: return t('auPair.onboarding.steps.availability');
      case 7: return t('auPair.onboarding.steps.languages');
      case 8: return t('auPair.onboarding.steps.media') || "Photos & Video";
      default: return t('auPair.onboarding.steps.review');
    }
  };

  return (
    <>
    <div className={`relative ${isEditing ? '' : 'min-h-[80vh] flex items-center justify-center py-20 px-6'}`}>
      {!isEditing && <BackgroundBlobs />}
      
      <motion.div 
        initial={isEditing ? {} : { opacity: 0, y: 30 }}
        animate={isEditing ? {} : { opacity: 1, y: 0 }}
        className={`w-full max-w-4xl relative z-10 ${isEditing ? '' : 'mx-auto'}`}
      >
        <GlassCard className={`overflow-hidden border-white/60 bg-white/80 backdrop-blur-3xl shadow-2xl ${isEditing ? 'rounded-[2rem] border-none shadow-none bg-transparent backdrop-blur-none' : 'rounded-[3rem]'}`}>
          
          {/* Header & Nav */}
          {!isEditing && (
            <div className="p-8 pb-0 flex items-center justify-between">
              <motion.button 
                whileHover={{ x: -5 }}
                onClick={() => navigate('/au-pair/select-role')} 
                className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors"
              >
                <ChevronLeft size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('common.back')}</span>
              </motion.button>
              <button 
                onClick={() => setShowExitModal(true)} 
                className="px-4 py-2 bg-red-50 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center gap-2"
              >
                <AlertCircle size={14} />
                {t('auPair.onboarding.exit')}
              </button>
            </div>
          )}

          {/* Progress / Title */}
          <div className={`${isEditing ? 'mb-8' : 'p-12 pb-6'}`}>
            <div className="flex justify-between items-end mb-6">
              <div>
                <div className="inline-block px-4 py-1.5 bg-pink-500/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-[0.2em] text-pink-600 mb-3">
                  {isEditing ? 'Profile Editor' : `Step ${step} of ${totalSteps}`}
                </div>
                <h2 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                  {isEditing ? t('common.editProfile') : (isAdmin ? t('common.adminBypass') : renderSectionTitle(step))}
                </h2>
              </div>
              {!isEditing && !isAdmin && (
                <div className="text-right">
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Completion</div>
                  <div className="text-2xl font-black text-pink-600 leading-none">
                    {Math.round((step / totalSteps) * 100)}%
                  </div>
                </div>
              )}
            </div>

            {!isEditing && !isAdmin && (
              <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                 <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${(step / totalSteps) * 100}%` }}
                   className="bg-gradient-to-r from-pink-500 to-rose-400 h-full rounded-full shadow-[0_0_15px_rgba(244,63,94,0.3)]" 
                 />
              </div>
            )}

            {isAdmin && (
              <div className="bg-green-50/50 backdrop-blur-md border border-green-100 rounded-2xl p-6 mt-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                  <CheckCircle size={20} />
                </div>
                <div>
                  <h4 className="text-[12px] font-black uppercase tracking-widest text-green-700">{t('common.adminBypass') || 'Admin Mode'}</h4>
                  <p className="text-[11px] font-bold text-green-600/70 uppercase tracking-tight">
                    {t('common.adminBypassDesc') || 'You can create profiles without onboarding restrictions.'}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className={`${isEditing ? 'space-y-16 pr-2' : 'p-12 pt-6 min-h-[500px]'}`}>
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="space-y-10"
              >
            
            {/* Step 1: Basic Info */}
            {(isEditing || step === 1) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(1)}
                  </h3>
                )}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input 
                      label={t('auPair.onboarding.step1.firstName')} 
                      value={formData.first_name} 
                      onChange={(e) => updateField('first_name', e.target.value)}
                      error={errors.first_name}
                      required 
                      disabled={isViewOnly}
                    />
                    <Input 
                      label={t('auPair.onboarding.step1.lastName')} 
                      value={formData.last_name} 
                      onChange={(e) => updateField('last_name', e.target.value)}
                      error={errors.last_name}
                      required 
                      disabled={isViewOnly}
                    />
                     <Input 
                      label={`${t('auPair.onboarding.step1.middleName')} (${t('auPair.onboarding.step1.optional')})`}
                      value={formData.middle_name || ''} 
                      onChange={(e) => updateField('middle_name', e.target.value)}
                      disabled={isViewOnly}
                    />
                 </div>

                 <div className="bg-pink-50/50 p-4 rounded-lg border border-pink-100">
                    <p className="text-sm text-pink-800 font-medium mb-2">{t('auPair.onboarding.step1.displayNameLabel')}</p>
                    <p className="text-lg font-bold text-gray-900">
                      {formData.first_name || '...'} {formData.last_name?.charAt(0)}
                    </p>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input 
                      label={t('auPair.onboarding.step1.age')} 
                      type="number"
                      min="18"
                      max="35"
                      value={formData.age || ''} 
                      onChange={(e) => updateField('age', parseInt(e.target.value))}
                      error={errors.age}
                      required 
                      disabled={isViewOnly}
                    />
                    
                     <SingleSelectField 
                        label={t('auPair.onboarding.step1.gender')}
                        options={[
                          { id: 'female', label: t('auPair.onboarding.step1.female') },
                          { id: 'male', label: t('auPair.onboarding.step1.male') },
                          { id: 'non-binary', label: t('auPair.onboarding.step1.nonBinary') }
                        ]}
                        value={formData.gender}
                        onChange={(val) => updateField('gender', val)}
                        layout="column"
                        error={errors.gender}
                        disabled={isViewOnly}
                     />
                 </div>

                 <div className="border-t border-gray-100 pt-6">
                   <h3 className="text-sm font-semibold text-gray-900 mb-4">{t('auPair.onboarding.step1.nationalityLocation')}</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                       <Select
                          label={t('auPair.onboarding.step1.nationality')}
                          options={[
                            { value: '', label: t('common.selectNationality') || 'Select nationality' },
                            ...nationalityOptions.map(opt => ({ value: opt.id, label: opt.label }))
                          ]}
                          value={formData.nationality}
                          onChange={(e) => updateField('nationality', e.target.value)}
                          error={errors.nationality}
                          required
                          disabled={isViewOnly}
                       />

                       <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">{t('auPair.onboarding.step1.currentLocation')}</label>
                        <LocationCascade 
                          country={formData.current_country}
                          province={formData.current_province}
                          city={formData.current_city}
                          onCountryChange={(v) => updateField('current_country', v)}
                          onProvinceChange={(v) => updateField('current_province', v)}
                          onCityChange={(v) => updateField('current_city', v)}
                          language={language as 'en' | 'zh'}
                          required
                          disabled={isViewOnly}
                        />
                       </div>
                         {errors.current_country && <p className="text-xs text-red-500 mt-1">{errors.current_country}</p>}
                   </div>
                 </div>

                 <div className="border-t border-gray-100 pt-6">
                    <MultiSelectField
                      label={t('auPair.onboarding.step1.hobbies')}
                      options={getTranslatedOptions('hobbies', hobbiesOptions)}
                      value={formData.hobbies}
                      onChange={(val) => updateField('hobbies', val)}
                      placeholder={t('auPair.onboarding.step1.hobbiesPlaceholder')}
                      variant="grid"
                      error={errors.hobbies}
                      disabled={isViewOnly}
                    />
                 </div>
              </div>
            )}

            {/* Step 2: Strengths */}
            {(isEditing || step === 2) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(2)}
                  </h3>
                )}
                  <MultiSelectField
                    label={t('auPair.onboarding.step2.traitsLabel')}
                    description={t('auPair.onboarding.step2.traitsDesc')}
                    options={getTranslatedOptions('traits', traitsOptions)}
                    value={formData.personality_traits}
                    onChange={(val) => updateField('personality_traits', val)}
                    maxSelection={5}
                    variant="grid"
                    placeholder={t('auPair.onboarding.step2.traitsPlaceholder')}
                    error={errors.personality_traits}
                    disabled={isViewOnly}
                  />

                  <MultiSelectField 
                     label={t('auPair.onboarding.step2.workStyleLabel')}
                     description={t('auPair.onboarding.step2.workStyleDesc')}
                     options={getTranslatedOptions('workStyle', workStyleOptions)}
                     value={formData.work_style}
                     onChange={(val) => updateField('work_style', val)}
                     variant="grid"
                     placeholder={t('auPair.onboarding.step2.workStylePlaceholder')}
                     error={errors.work_style}
                     disabled={isViewOnly}
                  />
              </div>
            )}

            {/* Step 3: Skills */}
            {(isEditing || step === 3) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(3)}
                  </h3>
                )}
                 <MultiSelectField
                    label={t('auPair.onboarding.step3.ageComfortLabel')}
                    options={getTranslatedOptions('ageComfort', ageComfortOptions)}
                    value={formData.experience_age_groups}
                    onChange={(val) => updateField('experience_age_groups', val)}
                    variant="grid"
                    error={errors.experience_age_groups}
                    disabled={isViewOnly}
                  />

                  <MultiSelectField
                    label={t('auPair.onboarding.step3.skillsLabel')}
                    options={getTranslatedOptions('skills', skillsOptions)}
                    value={formData.childcare_skills}
                    onChange={(val) => updateField('childcare_skills', val)}
                    variant="grid"
                    error={errors.childcare_skills}
                    disabled={isViewOnly}
                  />

                  <Textarea 
                     label={t('auPair.onboarding.step3.experienceLabel')}
                     placeholder={t('auPair.onboarding.step3.experiencePlaceholder')}
                     value={formData.childcare_experience_desc}
                     onChange={(e) => updateField('childcare_experience_desc', e.target.value)}
                     rows={5}
                     error={errors.childcare_experience_desc}
                     disabled={isViewOnly}
                  />
              </div>
            )}

            {/* Step 4: Rules */}
            {(isEditing || step === 4) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(4)}
                  </h3>
                )}
                  <MultiSelectField
                    label={t('auPair.onboarding.step4.rulesLabel')}
                    description={t('auPair.onboarding.step4.rulesDesc')}
                    options={getTranslatedOptions('rules', rulesOptions)}
                    value={formData.acceptable_house_rules}
                    onChange={(val) => updateField('acceptable_house_rules', val)}
                    variant="grid"
                    disabled={isViewOnly}
                  />
              </div>
            )}

            {/* Step 5: Preferences */}
            {(isEditing || step === 5) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(5)}
                  </h3>
                )}
                 <SingleSelectField
                    label={t('auPair.onboarding.step5.familyTypeLabel')}
                    options={getTranslatedOptions('familyType', familyTypeOptions)}
                    value={formData.preferred_family_type ? formData.preferred_family_type[0] : ''}
                    onChange={(val) => updateField('preferred_family_type', [val])}
                    layout="grid"
                    variant="cards"
                    error={errors.preferred_family_type}
                    disabled={isViewOnly}
                 />

                 <Input 
                   label={t('auPair.onboarding.step5.dietaryLabel')}
                   placeholder={t('auPair.onboarding.step5.dietaryPlaceholder')}
                   value={formData.dietary_restrictions || ''}
                   onChange={(e) => updateField('dietary_restrictions', e.target.value)}
                   disabled={isViewOnly}
                 />

                 <SingleSelectField
                    label={t('auPair.onboarding.step5.accommodationLabel')}
                    options={[
                      { id: 'live-in', label: t('auPair.onboarding.step5.liveIn') },
                      { id: 'live-out', label: t('auPair.onboarding.step5.liveOut') },
                      { id: 'either', label: t('auPair.onboarding.step5.either') }
                    ]}
                    value={formData.accommodation_preference}
                    onChange={(val) => updateField('accommodation_preference', val)}
                    layout="column"
                    error={errors.accommodation_preference}
                    disabled={isViewOnly}
                 />
              </div>
            )}

            {/* Step 6: Availability */}
            {(isEditing || step === 6) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(6)}
                  </h3>
                )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <Input 
                       label={t('auPair.onboarding.step6.availableFrom')}
                       type="date"
                       min={new Date().toISOString().split('T')[0]}
                       value={formData.availability_start_date}
                       onChange={(e) => updateField('availability_start_date', e.target.value)}
                       required
                       error={errors.availability_start_date}
                       disabled={isViewOnly}
                     />
                     <Input 
                       label={t('auPair.onboarding.step6.duration')}
                       type="number"
                       min="1"
                       max="24"
                       value={formData.duration_months || ''}
                       onChange={(e) => updateField('duration_months', parseInt(e.target.value))}
                       required
                       error={errors.duration_months}
                       disabled={isViewOnly}
                     />
                  </div>
              </div>
            )}

            {/* Step 7: Languages */}
            {(isEditing || step === 7) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(7)}
                  </h3>
                )}
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.onboarding.step7.title')}</h3>
                  
                  {formData.languages.map((_, index) => (
                    <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl">
                      <div className="flex-1 space-y-4">
                         <SingleSelectField 
                          label={t('auPair.onboarding.step7.languageLabel')}
                          options={languageOptions}
                          value={formData.languages[index].language}
                          onChange={(val) => updateLanguage(index, 'language', val)}
                          layout="column"
                          disabled={isViewOnly}
                        />
                         <SingleSelectField 
                          label={t('auPair.onboarding.step7.proficiencyLabel')}
                          options={[
                            { id: 'native', label: t('auPair.onboarding.step7.native') },
                            { id: 'fluent', label: t('auPair.onboarding.step7.fluent') },
                            { id: 'intermediate', label: t('auPair.onboarding.step7.intermediate') },
                            { id: 'beginner', label: t('auPair.onboarding.step7.beginner') },
                          ]}
                          value={formData.languages[index].proficiency}
                          onChange={(val) => updateLanguage(index, 'proficiency', val)}
                          layout="column"
                          disabled={isViewOnly}
                        />
                      </div>
                      {index > 0 && !isViewOnly && (
                        <button onClick={() => removeLanguage(index)} className="text-red-500 p-2 hover:bg-red-50 rounded-full mt-8">
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                  ))}

                  {!isViewOnly && (
                    <Button onClick={addLanguage} variant="outline" className="w-full border-dashed">
                      + {t('auPair.onboarding.step7.addLanguage')}
                    </Button>
                  )}
              </div>
            )}

            {/* Step 8: Media */}
            {(isEditing || step === 8) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                {isEditing && (
                  <h3 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-100">
                    {renderSectionTitle(8)}
                  </h3>
                )}
                 <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auPair.onboarding.steps.media')}</h3>
                 <p className="text-gray-500 mb-6">{t('auPair.onboarding.media.photosDesc')}</p>

                 {/* Profile Photos */}
                 <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('auPair.onboarding.media.photosLabel')}
                    </label>
                    <ImageUpload
                      value={formData.profile_photos}
                      onChange={(urls) => updateField('profile_photos', urls)}
                      maxImages={5}
                      bucketName="au-pair-photos"
                      disabled={isViewOnly}
                    />
                    <p className="text-xs text-gray-500">
                      {t('auPair.onboarding.media.photosHelp')}
                    </p>
                 </div>

                 {/* Experience Videos */}
                 <div className="space-y-2 mt-6">
                    <label className="block text-sm font-medium text-gray-700">
                      {t('auPair.onboarding.media.videoLabel')}
                    </label>
                    <FileUpload
                      value={formData.experience_videos[0] || ''} 
                      onChange={(url) => updateField('experience_videos', url ? [url] : [])}
                      maxSizeMB={50} // 50MB
                      acceptedTypes=".mp4,.mov,.webm"
                      bucketName="au-pair-videos"
                      label={t('auPair.onboarding.field.uploadVideo') || "Upload Video"}
                      disabled={isViewOnly}
                    />
                    <p className="text-xs text-gray-500">
                      {t('auPair.onboarding.media.videoDesc')}
                    </p>
                 </div>
              </div>
            )}

            {/* Step 9: Review */}
            {(!isEditing && step === 9) && (
              <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                 <h3 className="text-xl font-bold text-gray-900 mb-4">{t('auPair.onboarding.step9.title') || "Review Profile"}</h3>
                 <p className="text-gray-500 mb-6">{t('auPair.onboarding.step9.desc') || "Please review your information before submitting."}</p>

                 <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.steps.basic')}</h4>
                          <button onClick={() => jumpToStep(1)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                          <p><span className="font-medium">{t('common.name')}:</span> {formData.first_name} {formData.last_name}</p>
                          <p><span className="font-medium">{t('common.age')}:</span> {formData.age}</p>
                          <p><span className="font-medium">{t('common.location')}:</span> {formData.current_city}, {formData.current_country}</p>
                          <p><span className="font-medium">{t('common.nationality')}:</span> {formData.nationality}</p>
                       </div>
                    </div>

                    {/* Strengths & Skills */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.steps.skills')}</h4>
                          <button onClick={() => jumpToStep(3)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600">
                          <p><span className="font-medium">{t('common.experience')}:</span> {formData.childcare_experience_years} years</p>
                          <p className="mt-1"><span className="font-medium">{t('common.skills')}:</span> {formData.childcare_skills.join(', ')}</p>
                       </div>
                    </div>

                    {/* Preferences */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.steps.preferences')}</h4>
                          <button onClick={() => jumpToStep(5)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
                          <p><span className="font-medium">{t('common.accommodation')}:</span> {formData.accommodation_preference}</p>
                          <p><span className="font-medium">{t('common.smoker')}:</span> {formData.smoker ? 'Yes' : 'No'}</p>
                       </div>
                    </div>

                    {/* Availability */}
                    <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group hover:border-pink-300 transition-colors">
                       <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-gray-900">{t('auPair.onboarding.steps.availability')}</h4>
                          <button onClick={() => jumpToStep(6)} className="text-xs font-medium text-pink-600 hover:text-pink-700 px-3 py-1 bg-pink-50 rounded-full">{t('common.edit')}</button>
                       </div>
                       <div className="text-sm text-gray-600">
                          <p><span className="font-medium">{t('common.startDate')}:</span> {formData.availability_start_date}</p>
                          <p><span className="font-medium">{t('common.duration')}:</span> {formData.duration_months} months</p>
                       </div>
                    </div>
                 </div>
              </div>
            )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-12 pt-8 border-t border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-xl">
           {/* If ViewOnly, show nothing or just Back? User said hide buttons. But keeping standard back is good if not embedded. */}
           {isViewOnly ? (
              <div /> // Empty
           ) : (
             <>
               {(!isEditing && step > 1) ? (
                 <motion.button 
                   whileHover={{ x: -3 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={handleBack} 
                   className="flex items-center gap-3 px-8 py-4 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-gray-900 transition-all shadow-sm hover:shadow-md"
                 >
                   <ChevronLeft size={16} />
                   {t('common.back')}
                 </motion.button>
               ) : <div />}

               {(!isEditing && step < totalSteps) ? (
                 <motion.button 
                   whileHover={{ x: 3 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={handleNext} 
                   className="flex items-center gap-3 px-10 py-4 bg-pink-600 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-pink-600/20 hover:bg-pink-700 transition-all"
                 >
                   {t('common.next')}
                   <ArrowRight size={16} />
                 </motion.button>
               ) : (
                 <motion.button 
                   whileHover={{ scale: 1.02 }}
                   whileTap={{ scale: 0.98 }}
                   onClick={() => isEditing ? setShowSaveConfirm(true) : handleSubmit()} 
                   disabled={loading}
                   className={`flex items-center gap-3 px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl transition-all
                     ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 shadow-green-600/20 hover:bg-green-700'}
                   `}
                 >
                   {loading ? (
                     <>
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                       {t('common.saving')}
                     </>
                   ) : (
                     <>
                       {isEditing ? t('common.saveChanges') : t('auPair.onboarding.step8.submit')}
                       <CheckCircle size={16} />
                     </>
                   )}
                 </motion.button>
               )}
             </>
           )}
        </div>
      </GlassCard>
    </motion.div>
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

      <Modal isOpen={showExitModal} onClose={() => setShowExitModal(false)} title={t('auPair.onboarding.exitModal.title')}>
        <div className="space-y-6">
          <div className="flex items-start gap-4 p-6 bg-amber-50 border border-amber-100 rounded-[2rem]">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-amber-500/20 flex-shrink-0">
              <AlertCircle size={24} />
            </div>
            <div>
              <p className="text-[12px] font-black uppercase tracking-tight text-amber-900 mb-1">{t('auPair.onboarding.exitModal.progressSaved')}</p>
              <p className="text-[11px] font-medium text-amber-800/80 leading-relaxed">{t('auPair.onboarding.exitModal.returnLater')}</p>
            </div>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setShowExitModal(false)} 
              className="flex-1 px-8 py-4 bg-gray-50 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 transition-all"
            >
              {t('auPair.onboarding.exitModal.continueOnboarding')}
            </button>
            <button 
              onClick={() => { localStorage.removeItem('au_pair_onboarding_draft'); navigate('/au-pair/browse'); }} 
              className="flex-1 px-8 py-4 bg-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl hover:bg-black transition-all"
            >
              {t('auPair.onboarding.exitModal.exitToBrowse')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Saving Overlay */}
      {loading && (
        <div className="fixed inset-0 z-[100] bg-white/40 backdrop-blur-2xl flex flex-col items-center justify-center animate-in fade-in duration-500">
           <div className="relative">
             <div className="w-32 h-32 bg-pink-100 rounded-full animate-ping opacity-20 absolute inset-0" />
             <div className="w-32 h-32 bg-pink-50 rounded-full flex items-center justify-center mb-8 relative z-10 shadow-2xl">
                <div className="w-16 h-16 border-[6px] border-pink-500 border-t-transparent rounded-full animate-spin shadow-lg" />
             </div>
           </div>
           <h3 className="text-3xl font-black text-gray-900 uppercase tracking-tight mb-3">{t('auPair.onboarding.step8.creating')}</h3>
           <p className="text-[12px] font-black uppercase tracking-[0.3em] text-pink-500/60 animate-pulse">{t('auPair.onboarding.pleaseWait') || 'Please wait...'}</p>
        </div>
      )}
    </>
  );
}

