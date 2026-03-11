import { supabase } from '../lib/supabase';
import { adminService } from './adminService';
import {
  hostFamilySubscriptionService,
  type HostFamilySubscriptionState,
} from './hostFamilySubscriptionService';

export type EffectiveAccessRole = 'admin' | 'host_family' | 'au_pair' | 'general';

export type MessagingAccessState =
  | 'allowed'
  | 'admin_access'
  | 'pending_approval'
  | 'free_requires_payment'
  | 'rejected_resubmit'
  | 'expired_renew'
  | 'onboarding_incomplete'
  | 'unauthorized';

export type MessagingDeniedReason =
  | 'not_premium'
  | 'onboarding_incomplete'
  | 'not_authenticated'
  | 'payment_pending'
  | 'payment_rejected'
  | 'subscription_expired';

export type AuPairContactActionState =
  | 'loading'
  | 'admin_access'
  | 'premium_active_can_contact'
  | 'pending_approval'
  | 'free_requires_payment'
  | 'rejected_resubmit'
  | 'expired_renew'
  | 'unauthorized'
  | 'own_profile_or_invalid_state';

export interface AccessContext {
  userId: string;
  isAdmin: boolean;
  roles: string[];
  effectiveRole: EffectiveAccessRole;
  onboardingCompleted: boolean;
  hostFamilyState: HostFamilySubscriptionState | null;
}

export interface MessagingAccessResolution {
  allowed: boolean;
  state: MessagingAccessState;
  context: AccessContext | null;
  redirectTo?: string;
  reason?: MessagingDeniedReason;
}

export interface AuPairContactAccessResolution {
  allowed: boolean;
  state: AuPairContactActionState;
  context: AccessContext | null;
  redirectTo?: string;
}

export interface AuPairContactActionPresentation {
  state: AuPairContactActionState;
  tone: 'contact' | 'upgrade' | 'warning' | 'danger' | 'neutral';
  disabled: boolean;
  primaryAction: 'start_conversation' | 'navigate' | 'none';
  redirectTo?: string;
  labelKey: string;
  labelFallback: string;
  helperKey?: string;
  helperFallback?: string;
}

const HOST_FAMILY_PAYMENT_ROUTE = '/au-pair/payment';

const deriveEffectiveRole = (roles: Set<string>, isAdmin: boolean): EffectiveAccessRole => {
  if (isAdmin) return 'admin';
  if (roles.has('host_family')) return 'host_family';
  if (roles.has('au_pair')) return 'au_pair';
  return 'general';
};

const mapHostFamilyStatusToAction = (
  state: HostFamilySubscriptionState | null
): Omit<AuPairContactAccessResolution, 'context'> => {
  const status = state?.subscription_status ?? 'free';
  if (status === 'premium_active') {
    return { allowed: true, state: 'premium_active_can_contact' };
  }
  if (status === 'pending_approval') {
    return {
      allowed: false,
      state: 'pending_approval',
      redirectTo: `${HOST_FAMILY_PAYMENT_ROUTE}?state=pending_approval`,
    };
  }
  if (status === 'rejected') {
    return {
      allowed: false,
      state: 'rejected_resubmit',
      redirectTo: `${HOST_FAMILY_PAYMENT_ROUTE}?state=rejected`,
    };
  }
  if (status === 'premium_expired') {
    return {
      allowed: false,
      state: 'expired_renew',
      redirectTo: `${HOST_FAMILY_PAYMENT_ROUTE}?state=premium_expired`,
    };
  }
  return {
    allowed: false,
    state: 'free_requires_payment',
    redirectTo: `${HOST_FAMILY_PAYMENT_ROUTE}?state=free`,
  };
};

const mapMessagingStateToReason = (
  state: MessagingAccessState,
  hasContext: boolean
): MessagingDeniedReason | undefined => {
  if (!hasContext || state === 'unauthorized') return 'not_authenticated';
  if (state === 'pending_approval') return 'payment_pending';
  if (state === 'rejected_resubmit') return 'payment_rejected';
  if (state === 'expired_renew') return 'subscription_expired';
  if (state === 'onboarding_incomplete') return 'onboarding_incomplete';
  if (state === 'free_requires_payment') return 'not_premium';
  return undefined;
};

export const accessControlService = {
  async isAdmin(userId?: string): Promise<boolean> {
    if (userId) {
      const { data, error } = await supabase.rpc('is_admin', { user_id_param: userId });
      if (error) {
        console.error('Failed to resolve admin status by user id:', error);
        return false;
      }
      return Boolean(data);
    }

    return adminService.checkIsAdmin();
  },

  async getCurrentUserAccessContext(userId?: string): Promise<AccessContext | null> {
    const { data: authData } = await supabase.auth.getUser();
    const resolvedUserId = userId || authData.user?.id;
    if (!resolvedUserId) return null;

    const [isAdmin, profileResult, userServicesResult, hostFamilyProfileResult, auPairProfileResult] =
      await Promise.all([
        this.isAdmin(resolvedUserId),
        supabase
          .from('profiles')
          .select('au_pair_role, au_pair_onboarding_completed')
          .eq('id', resolvedUserId)
          .maybeSingle(),
        supabase.from('user_services').select('role').eq('user_id', resolvedUserId),
        supabase.from('host_family_profiles').select('id').eq('user_id', resolvedUserId).maybeSingle(),
        supabase.from('au_pair_profiles').select('id').eq('user_id', resolvedUserId).maybeSingle(),
      ]);

    if (profileResult.error) throw profileResult.error;
    if (userServicesResult.error) throw userServicesResult.error;
    if (hostFamilyProfileResult.error && hostFamilyProfileResult.error.code !== 'PGRST116') {
      throw hostFamilyProfileResult.error;
    }
    if (auPairProfileResult.error && auPairProfileResult.error.code !== 'PGRST116') {
      throw auPairProfileResult.error;
    }

    const roleSet = new Set<string>();
    if (profileResult.data?.au_pair_role) {
      roleSet.add(profileResult.data.au_pair_role);
    }

    for (const service of userServicesResult.data ?? []) {
      if (service.role) roleSet.add(service.role);
    }

    if (hostFamilyProfileResult.data) roleSet.add('host_family');
    if (auPairProfileResult.data) roleSet.add('au_pair');

    const effectiveRole = deriveEffectiveRole(roleSet, isAdmin);

    let hostFamilyState: HostFamilySubscriptionState | null = null;
    if (!isAdmin && effectiveRole === 'host_family') {
      try {
        hostFamilyState = await hostFamilySubscriptionService.getState(resolvedUserId);
      } catch (error) {
        console.error('Failed to resolve host family subscription state:', error);
      }
    }

    return {
      userId: resolvedUserId,
      isAdmin,
      roles: Array.from(roleSet),
      effectiveRole,
      onboardingCompleted: Boolean(profileResult.data?.au_pair_onboarding_completed),
      hostFamilyState,
    };
  },

  async canBypassSubscriptionChecks(userId?: string): Promise<boolean> {
    const context = await this.getCurrentUserAccessContext(userId);
    return Boolean(context?.isAdmin);
  },

  async resolveMessagingAccess(userId?: string): Promise<MessagingAccessResolution> {
    const context = await this.getCurrentUserAccessContext(userId);
    if (!context) {
      return {
        allowed: false,
        state: 'unauthorized',
        context: null,
        reason: mapMessagingStateToReason('unauthorized', false),
      };
    }

    if (context.isAdmin) {
      return { allowed: true, state: 'admin_access', context, reason: undefined };
    }

    if (context.effectiveRole === 'host_family') {
      const mapped = mapHostFamilyStatusToAction(context.hostFamilyState);
      const state = mapped.allowed ? 'allowed' : (mapped.state as MessagingAccessState);
      return {
        allowed: mapped.allowed,
        state,
        context,
        redirectTo: mapped.redirectTo,
        reason: mapMessagingStateToReason(state, true),
      };
    }

    if (context.effectiveRole === 'au_pair' && !context.onboardingCompleted) {
      return {
        allowed: false,
        state: 'onboarding_incomplete',
        context,
        redirectTo: '/onboarding',
        reason: mapMessagingStateToReason('onboarding_incomplete', true),
      };
    }

    return { allowed: true, state: 'allowed', context, reason: undefined };
  },

  async resolveAuPairContactAccess(params?: {
    userId?: string;
    targetUserId?: string | null;
  }): Promise<AuPairContactAccessResolution> {
    const context = await this.getCurrentUserAccessContext(params?.userId);
    if (!context) {
      return { allowed: false, state: 'unauthorized', context: null, redirectTo: '/signin' };
    }

    if (params?.targetUserId && params.targetUserId === context.userId) {
      return { allowed: false, state: 'own_profile_or_invalid_state', context };
    }

    if (context.isAdmin) {
      return { allowed: true, state: 'admin_access', context };
    }

    if (context.effectiveRole === 'host_family') {
      const mapped = mapHostFamilyStatusToAction(context.hostFamilyState);
      return { ...mapped, context };
    }

    return {
      allowed: false,
      state: 'unauthorized',
      context,
      redirectTo: '/au-pair/select-role',
    };
  },

  getAuPairContactActionPresentation(
    result: AuPairContactAccessResolution
  ): AuPairContactActionPresentation {
    switch (result.state) {
      case 'admin_access':
      case 'premium_active_can_contact':
        return {
          state: result.state,
          tone: 'contact',
          disabled: false,
          primaryAction: 'start_conversation',
          labelKey: 'auPair.profile.contactAuPair',
          labelFallback: 'Contact Au Pair',
          helperKey: 'account.messaging.enabled',
          helperFallback: 'Messaging and contact access enabled',
        };

      case 'pending_approval':
        return {
          state: result.state,
          tone: 'warning',
          disabled: true,
          primaryAction: 'none',
          redirectTo: result.redirectTo,
          labelKey: 'auPair.payment.pending',
          labelFallback: 'Pending Approval',
          helperKey: 'payment.pendingApprovalDescription',
          helperFallback: 'Payment submitted, awaiting admin approval.',
        };

      case 'rejected_resubmit':
        return {
          state: result.state,
          tone: 'danger',
          disabled: false,
          primaryAction: 'navigate',
          redirectTo: result.redirectTo || `${HOST_FAMILY_PAYMENT_ROUTE}?state=rejected`,
          labelKey: 'payment.resubmitProof',
          labelFallback: 'Resubmit Payment Proof',
          helperKey: 'payment.rejectedDescription',
          helperFallback: 'Your payment proof was rejected. Please submit a new proof.',
        };

      case 'expired_renew':
        return {
          state: result.state,
          tone: 'danger',
          disabled: false,
          primaryAction: 'navigate',
          redirectTo: result.redirectTo || `${HOST_FAMILY_PAYMENT_ROUTE}?state=premium_expired`,
          labelKey: 'payment.renewNow',
          labelFallback: 'Renew Subscription',
          helperKey: 'payment.expiredDescription',
          helperFallback: 'Renew to continue contacting au pairs.',
        };

      case 'free_requires_payment':
        return {
          state: result.state,
          tone: 'upgrade',
          disabled: false,
          primaryAction: 'navigate',
          redirectTo: result.redirectTo || `${HOST_FAMILY_PAYMENT_ROUTE}?state=free`,
          labelKey: 'auPair.profile.unlockContact',
          labelFallback: 'Unlock Contact Details',
          helperKey: 'payment.freeDescription',
          helperFallback: 'Submit payment proof to activate Premium Plan and contact au pairs.',
        };

      case 'own_profile_or_invalid_state':
        return {
          state: result.state,
          tone: 'neutral',
          disabled: true,
          primaryAction: 'none',
          labelKey: 'auPair.profile.contactUnavailable',
          labelFallback: 'Contact unavailable',
          helperKey: 'auPair.profile.ownProfile',
          helperFallback: 'You cannot contact your own profile.',
        };

      default:
        return {
          state: result.state,
          tone: 'neutral',
          disabled: false,
          primaryAction: 'navigate',
          redirectTo: result.redirectTo || '/signin',
          labelKey: 'auth.signIn',
          labelFallback: 'Sign in',
          helperKey: 'common.signInRequired',
          helperFallback: 'Please sign in to continue.',
        };
    }
  },

  mapMessagingStateToReason,
};
