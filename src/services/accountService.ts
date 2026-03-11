import { supabase } from '../lib/supabase';
import { auPairService, type UserSubscriptionStatus } from './auPairService';
import { hostFamilySubscriptionService, type HostFamilySubscriptionState } from './hostFamilySubscriptionService';
import { accessControlService, type EffectiveAccessRole, type MessagingDeniedReason } from './accessControlService';
import type { Profile } from './profileService';

export type AccountRole = 'general' | 'host_family' | 'au_pair' | 'employer' | 'job_seeker';

export interface AccountRoleProfiles {
  host_family: Record<string, any> | null;
  au_pair: Record<string, any> | null;
  employer: Record<string, any> | null;
  job_seeker: Record<string, any> | null;
}

export interface AccountBillingState {
  currentPlan: 'free' | 'premium' | null;
  paymentStatus: string | null;
  subscriptionStatus: string | null;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  renewalDate: string | null;
  approvalDate: string | null;
  contactAccessEnabled: boolean;
  pendingApproval: boolean;
  pendingPayment: boolean;
}

export interface AccountState {
  profile: (Profile & Record<string, any>) | null;
  isAdmin: boolean;
  effectiveRole: EffectiveAccessRole | null;
  roles: AccountRole[];
  roleProfiles: AccountRoleProfiles;
  userServices: string[];
  subscription: UserSubscriptionStatus | null;
  latestPaymentSubmission: Record<string, any> | null;
  stripeSubscription: Record<string, any> | null;
  messagingAccess: {
    allowed: boolean;
    reason?: MessagingDeniedReason;
  } | null;
  profileCompletion: number | null;
  approvalStatus: string | null;
  billing: AccountBillingState;
}

const ROLE_ORDER: AccountRole[] = ['general', 'host_family', 'au_pair', 'employer', 'job_seeker'];

const normalizeRole = (value: string | null | undefined): AccountRole | null => {
  if (!value) return null;
  if (value === 'host_family') return 'host_family';
  if (value === 'au_pair') return 'au_pair';
  if (value === 'employer') return 'employer';
  if (value === 'job_seeker') return 'job_seeker';
  if (value === 'general') return 'general';
  return null;
};

const computeProfileCompletion = (profile: (Profile & Record<string, any>) | null): number | null => {
  if (!profile) return null;
  if (typeof profile.profile_completion_percent === 'number') {
    return Math.max(0, Math.min(100, Math.round(profile.profile_completion_percent)));
  }

  const fields = [
    profile.first_name,
    profile.last_name,
    profile.display_name || profile.full_name,
    profile.phone,
    profile.date_of_birth,
    profile.gender,
    profile.nationality,
    profile.citizenship_country,
    profile.residence_country,
    profile.residence_city,
    profile.bio,
  ];

  const filled = fields.filter((field) => {
    if (field === null || field === undefined) return false;
    if (typeof field === 'string') return field.trim().length > 0;
    return true;
  }).length;

  return Math.round((filled / fields.length) * 100);
};

const isNoRowsError = (error: { code?: string } | null) => error?.code === 'PGRST116';

export const accountService = {
  async getAccountState(userId: string): Promise<AccountState> {
    const [
      profileResult,
      userServicesResult,
      auPairProfileResult,
      hostFamilyProfileResult,
      employerProfileResult,
      jobSeekerProfileResult,
      latestPaymentSubmissionResult,
      stripeSubscriptionResult,
      accessContext,
      messagingAccessResolution,
    ] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('user_services').select('role, service_type').eq('user_id', userId),
      supabase.from('au_pair_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('host_family_profiles').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles_employer').select('*').eq('user_id', userId).maybeSingle(),
      supabase.from('profiles_jobseeker').select('*').eq('user_id', userId).maybeSingle(),
      supabase
        .from('payment_submissions')
        .select('*')
        .eq('user_id', userId)
        .eq('plan_type', 'host_family_premium')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .limit(1)
        .maybeSingle(),
      accessControlService.getCurrentUserAccessContext(userId).catch((error) => {
        console.warn('Failed to resolve access context for account page:', error);
        return null;
      }),
      accessControlService.resolveMessagingAccess(userId).catch((error) => {
        console.warn('Failed to resolve messaging access for account page:', error);
        return { allowed: false, state: 'unauthorized' as const, context: null, reason: 'not_authenticated' as const };
      }),
    ]);

    if (profileResult.error && !isNoRowsError(profileResult.error)) throw profileResult.error;
    if (userServicesResult.error) throw userServicesResult.error;
    if (auPairProfileResult.error && !isNoRowsError(auPairProfileResult.error)) throw auPairProfileResult.error;
    if (hostFamilyProfileResult.error && !isNoRowsError(hostFamilyProfileResult.error)) throw hostFamilyProfileResult.error;
    if (employerProfileResult.error && !isNoRowsError(employerProfileResult.error)) throw employerProfileResult.error;
    if (jobSeekerProfileResult.error && !isNoRowsError(jobSeekerProfileResult.error)) throw jobSeekerProfileResult.error;
    if (latestPaymentSubmissionResult.error && !isNoRowsError(latestPaymentSubmissionResult.error)) throw latestPaymentSubmissionResult.error;
    if (stripeSubscriptionResult.error && !isNoRowsError(stripeSubscriptionResult.error)) throw stripeSubscriptionResult.error;

    const profile = (profileResult.data as (Profile & Record<string, any>) | null) ?? null;
    const userServices = (userServicesResult.data ?? []) as Array<{ role: string; service_type: string }>;
    const auPairProfile = (auPairProfileResult.data as Record<string, any> | null) ?? null;
    const hostFamilyProfile = (hostFamilyProfileResult.data as Record<string, any> | null) ?? null;
    const employerProfile = (employerProfileResult.data as Record<string, any> | null) ?? null;
    const jobSeekerProfile = (jobSeekerProfileResult.data as Record<string, any> | null) ?? null;
    const latestPaymentSubmission = (latestPaymentSubmissionResult.data as Record<string, any> | null) ?? null;
    const stripeSubscription = (stripeSubscriptionResult.data as Record<string, any> | null) ?? null;
    const isAdmin = Boolean(accessContext?.isAdmin);

    const roles = new Set<AccountRole>(['general']);
    const addRole = (value: string | null | undefined) => {
      const role = normalizeRole(value);
      if (role) roles.add(role);
    };

    addRole(profile?.role);
    addRole(profile?.au_pair_role);

    userServices.forEach((service) => addRole(service.role));
    if (auPairProfile) roles.add('au_pair');
    if (hostFamilyProfile) roles.add('host_family');
    if (employerProfile) roles.add('employer');
    if (jobSeekerProfile) roles.add('job_seeker');

    const orderedRoles = ROLE_ORDER.filter((role) => roles.has(role));

    let subscription: UserSubscriptionStatus | null = null;
    let messagingAccess: AccountState['messagingAccess'] = {
      allowed: messagingAccessResolution.allowed,
      reason: messagingAccessResolution.reason,
    };
    let hostFamilySubscriptionState: HostFamilySubscriptionState | null = null;

    try {
      subscription = await auPairService.getUserSubscriptionStatus();
    } catch (error) {
      console.warn('Failed to load subscription status for account page:', error);
    }

    if (orderedRoles.includes('host_family') && !isAdmin) {
      hostFamilySubscriptionState = accessContext?.hostFamilyState ?? null;
      if (!hostFamilySubscriptionState) {
        try {
          hostFamilySubscriptionState = await hostFamilySubscriptionService.getState(userId);
        } catch (error) {
          console.warn('Failed to load host family subscription state for account page:', error);
        }
      }
    }

    const isHostFamilyUser = orderedRoles.includes('host_family') && !isAdmin;
    const hostFamilyStatus = hostFamilySubscriptionState?.subscription_status ?? hostFamilyProfile?.profile_status ?? null;
    const auPairStatus = auPairProfile?.profile_status ?? null;
    const approvalStatus = isAdmin
      ? 'admin_access'
      : isHostFamilyUser
        ? hostFamilyStatus
        : orderedRoles.includes('au_pair')
          ? auPairStatus
          : null;

    const subscriptionStatus =
      isHostFamilyUser
        ? (hostFamilySubscriptionState?.subscription_status ?? profile?.host_family_subscription_status ?? null)
        : null;

    const currentPlan: 'free' | 'premium' | null = isHostFamilyUser
      ? (hostFamilySubscriptionState?.subscription_plan === 'premium' ? 'premium' : 'free')
      : null;

    const subscriptionStartDate =
      hostFamilySubscriptionState?.approved_at ??
      profile?.host_family_subscription_start ??
      null;

    const subscriptionEndDate =
      hostFamilySubscriptionState?.expires_at ??
      profile?.host_family_subscription_end ??
      null;

    const renewalDate = subscriptionEndDate;

    const paymentStatus =
      isHostFamilyUser
        ? (hostFamilySubscriptionState?.payment_status ?? latestPaymentSubmission?.status ?? 'not_submitted')
        : null;

    const approvalDate =
      isHostFamilyUser
        ? (hostFamilySubscriptionState?.approved_at ??
          (latestPaymentSubmission?.status === 'approved'
            ? (latestPaymentSubmission.reviewed_at ?? latestPaymentSubmission.updated_at ?? null)
            : null))
        : null;

    const pendingPayment = Boolean(isHostFamilyUser && paymentStatus === 'not_submitted');

    const pendingApproval = Boolean(isHostFamilyUser && subscriptionStatus === 'pending_approval');

    return {
      profile,
      isAdmin,
      effectiveRole: accessContext?.effectiveRole ?? null,
      roles: orderedRoles,
      roleProfiles: {
        host_family: hostFamilyProfile,
        au_pair: auPairProfile,
        employer: employerProfile,
        job_seeker: jobSeekerProfile,
      },
      userServices: userServices.map((service) => service.role),
      subscription,
      latestPaymentSubmission,
      stripeSubscription,
      messagingAccess,
      profileCompletion: computeProfileCompletion(profile),
      approvalStatus,
      billing: {
        currentPlan: isAdmin ? null : currentPlan,
        paymentStatus: isAdmin ? null : paymentStatus,
        subscriptionStatus: isAdmin ? null : subscriptionStatus,
        subscriptionStartDate: isAdmin ? null : subscriptionStartDate,
        subscriptionEndDate: isAdmin ? null : subscriptionEndDate,
        renewalDate: isAdmin ? null : renewalDate,
        approvalDate: isAdmin ? null : approvalDate,
        contactAccessEnabled: isAdmin
          ? true
          : isHostFamilyUser
            ? Boolean(hostFamilySubscriptionState?.contact_access_enabled)
            : (messagingAccess?.allowed ?? false),
        pendingApproval: isAdmin ? false : pendingApproval,
        pendingPayment: isAdmin ? false : pendingPayment,
      },
    };
  },
};
