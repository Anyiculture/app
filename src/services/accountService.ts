import { supabase } from '../lib/supabase';
import { auPairService, type UserSubscriptionStatus } from './auPairService';
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
  roles: AccountRole[];
  roleProfiles: AccountRoleProfiles;
  userServices: string[];
  subscription: UserSubscriptionStatus | null;
  latestPaymentSubmission: Record<string, any> | null;
  stripeSubscription: Record<string, any> | null;
  messagingAccess: {
    allowed: boolean;
    reason?: 'not_premium' | 'onboarding_incomplete' | 'not_authenticated' | 'payment_pending' | 'payment_rejected';
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

const toIsoFromEpochSeconds = (value: number | string | null | undefined): string | null => {
  if (typeof value !== 'number') return null;
  if (!Number.isFinite(value)) return null;
  return new Date(value * 1000).toISOString();
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
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from('stripe_user_subscriptions')
        .select('*')
        .limit(1)
        .maybeSingle(),
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
    let messagingAccess: AccountState['messagingAccess'] = null;

    try {
      subscription = await auPairService.getUserSubscriptionStatus();
    } catch (error) {
      console.warn('Failed to load subscription status for account page:', error);
    }

    try {
      messagingAccess = await auPairService.canSendMessage();
    } catch (error) {
      console.warn('Failed to load messaging access for account page:', error);
    }

    const hostFamilyStatus = hostFamilyProfile?.profile_status ?? null;
    const auPairStatus = auPairProfile?.profile_status ?? null;
    const approvalStatus = orderedRoles.includes('host_family') ? hostFamilyStatus : orderedRoles.includes('au_pair') ? auPairStatus : null;

    const subscriptionStatus =
      subscription?.subscriptionStatus ??
      (orderedRoles.includes('host_family') ? (profile?.host_family_subscription_status ?? null) : null);

    const currentPlan: 'free' | 'premium' | null = subscriptionStatus === 'premium' ? 'premium' : subscriptionStatus === 'free' ? 'free' : null;

    const subscriptionStartDate =
      profile?.host_family_subscription_start ??
      toIsoFromEpochSeconds(stripeSubscription?.current_period_start) ??
      null;

    const subscriptionEndDate =
      profile?.host_family_subscription_end ??
      subscription?.subscriptionExpiresAt ??
      toIsoFromEpochSeconds(stripeSubscription?.current_period_end) ??
      null;

    const renewalDate =
      stripeSubscription?.subscription_status === 'active'
        ? toIsoFromEpochSeconds(stripeSubscription?.current_period_end)
        : subscriptionEndDate;

    const paymentStatus =
      latestPaymentSubmission?.status ??
      (hostFamilyStatus === 'pending_payment' ? 'pending' : null);

    const approvalDate =
      latestPaymentSubmission?.status === 'approved'
        ? (latestPaymentSubmission.reviewed_at ?? latestPaymentSubmission.updated_at ?? null)
        : null;

    const pendingPayment =
      hostFamilyStatus === 'pending_payment' ||
      paymentStatus === 'pending';

    const pendingApproval =
      hostFamilyStatus === 'pending_approval' ||
      (hostFamilyStatus !== 'pending_payment' && paymentStatus === 'pending');

    return {
      profile,
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
        currentPlan,
        paymentStatus,
        subscriptionStatus,
        subscriptionStartDate,
        subscriptionEndDate,
        renewalDate,
        approvalDate,
        contactAccessEnabled: messagingAccess?.allowed ?? false,
        pendingApproval,
        pendingPayment,
      },
    };
  },
};
