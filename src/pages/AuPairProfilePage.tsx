import { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  GraduationCap,
  Globe,
  CheckCircle,
  MessageCircle,
  User,
  ShieldCheck,
  Shield,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useI18n } from '../contexts/I18nContext';
import { Loading } from '../components/ui/Loading';
import { Button } from '../components/ui/Button';
import { AuPairProfile, auPairService } from '../services/auPairService';
import { Lock } from 'lucide-react';
import { messagingService } from '../services/messagingService';
import {
  accessControlService,
  type AuPairContactAccessResolution,
} from '../services/accessControlService';
import { COUNTRIES } from '../components/ui/LocationCascade';

export function AuPairProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useI18n();
  const [profile, setProfile] = useState<AuPairProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessLoading, setAccessLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [contactAccess, setContactAccess] = useState<AuPairContactAccessResolution | null>(null);
  const [latestSubmission, setLatestSubmission] = useState<any>(null);

  const tr = (key: string, fallback: string, options?: Record<string, any>) => {
    const value = t(key, options);
    return value === key ? fallback : value;
  };

  const isUuidLike = (value: string | null | undefined) =>
    Boolean(
      value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        value
      )
    );

  const isValidRecipientId = (value: string | null | undefined) => isUuidLike(value);

  useEffect(() => {
    if (id) void loadProfile();
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    const resolveAccess = async () => {
      if (!profile) {
        setAccessLoading(false);
        setContactAccess(null);
        setLatestSubmission(null);
        return;
      }

      const targetUserId = isValidRecipientId(profile.user_id) ? profile.user_id : null;
      setAccessLoading(true);

      try {
        const access = await accessControlService.resolveAuPairContactAccess({
          targetUserId,
        });
        if (cancelled) return;
        setContactAccess(access);

        if (
          access.context?.effectiveRole === 'host_family' &&
          !access.context?.isAdmin
        ) {
          const submission = await auPairService.getLatestPaymentSubmission();
          if (!cancelled) setLatestSubmission(submission);
        } else if (!cancelled) {
          setLatestSubmission(null);
        }
      } catch (error) {
        console.error('Failed to resolve au pair contact access:', error);
        if (!cancelled) {
          setContactAccess(null);
          setLatestSubmission(null);
        }
      } finally {
        if (!cancelled) setAccessLoading(false);
      }
    };

    void resolveAccess();
    return () => {
      cancelled = true;
    };
  }, [profile?.user_id, user?.id]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('au_pair_profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      navigate('/signin');
      return;
    }

    if (!profile) return;

    setActionLoading(true);
    try {
      const fallbackRecipientId = isValidRecipientId(profile.user_id) ? profile.user_id : undefined;
      const resolvedAccess = await accessControlService.resolveAuPairContactAccess({
        targetUserId: fallbackRecipientId ?? null,
      });
      setContactAccess(resolvedAccess);
      const action = accessControlService.getAuPairContactActionPresentation(resolvedAccess);

      if (action.primaryAction === 'navigate' && action.redirectTo) {
        navigate(action.redirectTo);
        return;
      }

      if (resolvedAccess.state === 'pending_approval') {
        alert(
          tr(
            'auPair.payment.pendingApproval',
            'Your payment proof is under review. Please wait for admin approval.'
          )
        );
        return;
      }

      if (!resolvedAccess.allowed || action.primaryAction !== 'start_conversation') {
        if (action.redirectTo) navigate(action.redirectTo);
        return;
      }

      const result = await messagingService.createConversationWithMessage({
        otherUserId: fallbackRecipientId,
        contextType: 'aupair',
        contextId: profile.id,
        profileType: 'au_pair',
        relatedItemTitle: `Au Pair ${profile.display_name}`,
        initialMessage: tr('auPair.profile.contactInquiry', `Hello! I'm interested in your profile.`),
      });
      
      if (result.conversationId) {
        navigate(`/messages?conversation=${result.conversationId}`);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error: any) {
      console.error('Failed to start conversation:', error);
      
      let errorMessage = messagingService.getConversationErrorMessage(
        error,
        tr('admin.common.failedToStartChat', 'Failed to start conversation. Please try again.')
      );
      
      if (error?.message?.includes('Not authenticated')) {
        errorMessage = 'Please sign in to contact au pairs.';
        navigate('/signin');
      }
      
      alert(errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const getCountryLabel = (countryName: string) => {
    const country = COUNTRIES.find(c => c.value === countryName || c.label_en === countryName);
    return country ? (language === 'zh' ? country.label_zh : country.label_en) : countryName;
  };

  const contactPresentation = useMemo(() => {
    if (accessLoading || !contactAccess) return null;
    return accessControlService.getAuPairContactActionPresentation(contactAccess);
  }, [accessLoading, contactAccess]);

  const viewerContext = contactAccess?.context;
  const isHostFamilyViewer = viewerContext?.effectiveRole === 'host_family' && !viewerContext?.isAdmin;
  const hostFamilyState = viewerContext?.hostFamilyState;
  const hostFamilySubscriptionStatus = hostFamilyState?.subscription_status || 'free';

  const contactButtonClass = () => {
    if (accessLoading) return 'bg-gray-500 cursor-not-allowed opacity-80';
    switch (contactPresentation?.tone) {
      case 'contact':
        return 'bg-pink-600 hover:bg-pink-700';
      case 'upgrade':
        return 'bg-gray-700 hover:bg-gray-800';
      case 'warning':
        return 'bg-amber-500 cursor-not-allowed opacity-80';
      case 'danger':
        return 'bg-red-600 hover:bg-red-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading size="lg" text={t('common.loading') || "Loading..."} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 mb-4">{t('auPair.profile.notFound')}</p>
          <Button onClick={() => navigate('/au-pairs/browse')}>{t('auPair.profile.backToBrowse')}</Button>
        </div>
      </div>
    );
  }

  const getLanguages = () => {
    if (Array.isArray(profile.languages)) {
      return profile.languages.map((l: any) => {
        const langName = typeof l === 'string' ? l : l.language;
        const proficiency = typeof l === 'string' ? '' : l.proficiency;
        
        // Try to find translation in global languages object first, then raw value
        const translatedLang = t(`languages.${langName}`) !== `languages.${langName}` 
          ? t(`languages.${langName}`) 
          : (t(`auPair.onboarding.options.languages.${langName.toLowerCase()}`) || langName);

        if (!proficiency) return translatedLang;
        
        return `${translatedLang} (${t(`proficiency.${proficiency}`) || proficiency})`;
      });
    }
    return [];
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        
        {/* Header Section */}
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 hover:bg-gray-200"
        >
          <ArrowLeft size={20} className="mr-2" />
          {t('common.back') || 'Back'}
        </Button>

        {/* Status Banner for Host Families */}
        {!accessLoading && isHostFamilyViewer && (
          <div className={`mb-6 p-4 rounded-xl border flex items-center gap-4 ${
            hostFamilySubscriptionStatus === 'premium_active'
              ? 'bg-green-50 border-green-200 text-green-800'
              : hostFamilySubscriptionStatus === 'pending_approval'
                ? 'bg-amber-50 border-amber-200 text-amber-800' 
                : 'bg-red-50 border-red-200 text-red-800'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              hostFamilySubscriptionStatus === 'premium_active' ? 'bg-green-100' :
              hostFamilySubscriptionStatus === 'pending_approval' ? 'bg-amber-100' : 'bg-red-100'
            }`}>
              {hostFamilySubscriptionStatus === 'premium_active' ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <AlertCircle className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">
                {hostFamilySubscriptionStatus === 'premium_active'
                  ? tr('auPair.payment.approvedTitle', 'Premium approved')
                  : hostFamilySubscriptionStatus === 'pending_approval'
                    ? tr('auPair.payment.pendingTitle', 'Payment pending approval')
                    : tr('auPair.payment.rejectedTitle', 'Payment rejected')}
              </h3>
              <p className="text-sm opacity-90">
                {hostFamilySubscriptionStatus === 'premium_active'
                  ? (tr('auPair.payment.activeUntil', 'Premium active until {{date}}')
                    .replace('{{date}}', hostFamilyState?.expires_at ? new Date(hostFamilyState.expires_at).toLocaleDateString() : '-'))
                  : hostFamilySubscriptionStatus === 'pending_approval'
                    ? tr('auPair.payment.pendingDesc', 'Payment submitted, awaiting admin approval.')
                    : hostFamilySubscriptionStatus === 'premium_expired'
                      ? tr('auPair.payment.expiredDesc', 'Subscription expired. Renew to continue contacting au pairs.')
                      : hostFamilyState?.rejection_reason || latestSubmission?.admin_notes || tr('auPair.payment.reuploadDesc', 'Please re-upload payment proof.')}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-6">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-300">
                    {profile.profile_photos && profile.profile_photos.length > 0 ? (
                        <img 
                        src={profile.profile_photos[0]} 
                        alt={profile.display_name} 
                        className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <User size={32} />
                        </div>
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl font-bold text-gray-900">{profile.display_name}</h1>
                        <span className="px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wide">
                            {t('auPair.profile.available')}
                        </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                            <MapPin size={16} className="text-gray-400" />
                            {profile.current_city}, {getCountryLabel(profile.current_country || '')}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Globe size={16} className="text-gray-400" />
                            {getCountryLabel(profile.nationality || '')}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-shrink-0">
              <div className="flex flex-col gap-2 min-w-[220px]">
                <Button
                  onClick={handleContact}
                  disabled={
                    accessLoading ||
                    actionLoading ||
                    !contactPresentation ||
                    contactPresentation.disabled
                  }
                  className={`${contactButtonClass()} text-white flex items-center gap-2 transition-colors`}
                >
                  {accessLoading || actionLoading ? (
                    <Loading size="sm" />
                  ) : contactPresentation?.tone === 'contact' ? (
                    <MessageCircle size={16} />
                  ) : contactPresentation?.tone === 'upgrade' || contactPresentation?.tone === 'danger' ? (
                    <Lock size={16} />
                  ) : contactPresentation?.tone === 'warning' ? (
                    <AlertCircle size={16} />
                  ) : (
                    <Lock size={16} />
                  )}
                  {accessLoading
                    ? tr('common.loading', 'Checking access...')
                    : tr(
                        contactPresentation?.labelKey || 'auPair.profile.contactUnavailable',
                        contactPresentation?.labelFallback || 'Contact unavailable'
                      )}
                </Button>

                {!accessLoading && contactPresentation?.helperKey && (
                  <p className="text-xs text-gray-600">
                    {tr(contactPresentation.helperKey, contactPresentation.helperFallback || '')}
                  </p>
                )}

                {isHostFamilyViewer && hostFamilySubscriptionStatus !== 'premium_active' && (
                  <Button
                    onClick={() => navigate('/au-pair/payment')}
                    className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2 transition-colors text-sm py-2"
                  >
                    <Shield size={16} />
                    {hostFamilySubscriptionStatus === 'pending_approval'
                      ? tr('auPair.payment.viewPaymentStatus', 'View Payment Status')
                      : hostFamilySubscriptionStatus === 'rejected'
                        ? tr('payment.resubmitProof', 'Resubmit Payment Proof')
                        : hostFamilySubscriptionStatus === 'premium_expired'
                          ? tr('auPair.payment.renewNow', 'Renew Subscription')
                          : tr('auPair.payment.submitProof', 'Upload Payment Proof')}
                  </Button>
                )}
              </div>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Left Column: Personal, Education, Skills */}
            <div className="space-y-6">
                
                {/* Personal Details Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <User size={16} />
                        {t('auPair.profile.personalDetails')}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.age')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.age} {t('auPair.profile.yearsOld')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.gender')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.gender ? t(`auPair.onboarding.options.gender.${profile.gender}`) : (t('common.notSpecified') || 'Not Specified')}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.nationality')}</p>
                            <p className="text-sm font-medium text-gray-900">{getCountryLabel(profile.nationality || '')}</p>
                        </div>
                    </div>
                </div>

                {/* Education Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <GraduationCap size={16} />
                        {t('auPair.education') || 'Education'}
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.educationLevel') || 'Level'}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {profile.education_level ? (t(`degree.${profile.education_level}`) || profile.education_level) : t('common.notSpecified') || 'Not Specified'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase mb-1">{t('auPair.profile.fieldOfStudy') || 'Field of Study'}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {profile.field_of_study || t('common.notSpecified') || 'Not Specified'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Languages Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Globe size={16} />
                        {t('auPair.languages') || 'Languages'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {getLanguages().map((lang, i) => (
                            <span key={i} className="px-2.5 py-1 bg-gray-50 text-gray-700 text-xs font-medium rounded border border-gray-300">
                                {lang}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Skills Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                     <h3 className="text-sm font-bold text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                        <CheckCircle size={16} />
                        {t('auPair.onboarding.steps.skills') || 'Skills'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills?.map((skill, i) => (
                            <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded border border-blue-100">
                                {t(`auPair.onboarding.options.skills.${skill.toLowerCase()}`) || skill}
                            </span>
                        ))}
                    </div>
                </div>

            </div>

            {/* Right Column: About, Experience, Preferences */}
            <div className="md:col-span-2 space-y-6">
                
                {/* About Me */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.aboutMe')}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
                        {profile.bio || t('auPair.profile.bioNotProvided')}
                    </p>
                </div>

                {/* Experience */}
                 {profile.experience_description && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.profile.experience')}</h3>
                        <div className="bg-gray-50 p-4 rounded-lg text-sm text-gray-700 italic border-l-4 border-gray-300">
                            "{profile.experience_description}"
                        </div>
                    </div>
                )}

                {/* Preferences */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">{t('auPair.preferences')}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.preferredLocation')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.preferred_countries?.map(getCountryLabel).join(', ') || 'Any'}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.duration')}</p>
                            <p className="text-sm font-medium text-gray-900">{profile.duration_months} {t('common.months')}</p>
                        </div>
                        <div>
                             <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.startDate')}</p>
                             <p className="text-sm font-medium text-gray-900">{profile.available_from}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">{t('auPair.ageGroups')}</p>
                            <p className="text-sm font-medium text-gray-900">
                                {profile.age_groups_worked?.map(g => t(`auPair.onboarding.options.ageComfort.${g}`) || g).join(', ')}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Safety Badges */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">{t('auPair.profile.safety') || 'Safety & Expertise'}</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { key: 'first_aid', label: t('auPair.profile.firstAid') || 'First Aid' },
                            { key: 'swimming_skills', label: t('auPair.profile.swimming') || 'Swimming' },
                            { key: 'drivers_license', label: t('auPair.profile.driversLicense') || 'Driving License' },
                            { key: 'special_needs_experience', label: t('auPair.profile.specialNeeds') || 'Special Needs' }
                        ].map((item, idx) => (
                            <div 
                                key={idx}
                                className={`flex flex-col items-center justify-center text-center p-3 rounded-lg border leading-tight ${
                                    profile[item.key as keyof typeof profile] 
                                    ? 'bg-green-50 border-green-100 text-green-800' 
                                    : 'bg-gray-50 border-gray-100 text-gray-500'
                                }`}
                            >
                                <ShieldCheck size={20} className="mb-2" />
                                <span className="text-xs font-bold">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
