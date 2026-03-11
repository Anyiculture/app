import { supabase } from '../lib/supabase';

export type HostFamilySubscriptionStatus =
  | 'free'
  | 'pending_approval'
  | 'premium_active'
  | 'premium_expired'
  | 'rejected';

export type HostFamilyPaymentStatus = 'not_submitted' | 'pending' | 'approved' | 'rejected';

export interface HostFamilySubscriptionState {
  user_id: string;
  role: 'host_family' | 'general';
  subscription_plan: 'free' | 'premium';
  subscription_status: HostFamilySubscriptionStatus;
  payment_status: HostFamilyPaymentStatus;
  approved_at: string | null;
  expires_at: string | null;
  last_payment_request_id: string | null;
  renewal_required: boolean;
  contact_access_enabled: boolean;
  rejection_reason: string | null;
}

const DEFAULT_STATE = (userId: string): HostFamilySubscriptionState => ({
  user_id: userId,
  role: 'general',
  subscription_plan: 'free',
  subscription_status: 'free',
  payment_status: 'not_submitted',
  approved_at: null,
  expires_at: null,
  last_payment_request_id: null,
  renewal_required: false,
  contact_access_enabled: false,
  rejection_reason: null,
});

const normalizeState = (raw: any, userId: string): HostFamilySubscriptionState => {
  if (!raw || typeof raw !== 'object') return DEFAULT_STATE(userId);

  const role = raw.role === 'host_family' ? 'host_family' : 'general';
  const status = raw.subscription_status as HostFamilySubscriptionStatus;
  const paymentStatus = raw.payment_status as HostFamilyPaymentStatus;

  return {
    user_id: raw.user_id || userId,
    role,
    subscription_plan: raw.subscription_plan === 'premium' ? 'premium' : 'free',
    subscription_status:
      status === 'pending_approval' ||
      status === 'premium_active' ||
      status === 'premium_expired' ||
      status === 'rejected'
        ? status
        : 'free',
    payment_status:
      paymentStatus === 'pending' ||
      paymentStatus === 'approved' ||
      paymentStatus === 'rejected'
        ? paymentStatus
        : 'not_submitted',
    approved_at: raw.approved_at || null,
    expires_at: raw.expires_at || null,
    last_payment_request_id: raw.last_payment_request_id || null,
    renewal_required: Boolean(raw.renewal_required),
    contact_access_enabled: Boolean(raw.contact_access_enabled),
    rejection_reason: raw.rejection_reason || null,
  };
};

export const hostFamilySubscriptionService = {
  async getState(userId?: string): Promise<HostFamilySubscriptionState> {
    const { data: authData } = await supabase.auth.getUser();
    const currentUserId = userId || authData.user?.id;

    if (!currentUserId) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase.rpc('get_host_family_subscription_state', {
      p_user_id: currentUserId,
    });

    if (error) {
      throw error;
    }

    return normalizeState(data, currentUserId);
  },

  async submitPaymentProof(file: File): Promise<{ submissionId: string; status: string }> {
    const { data: authData } = await supabase.auth.getUser();
    const userId = authData.user?.id;
    if (!userId) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: publicUrlResult } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(fileName);

    const imageUrl = publicUrlResult.publicUrl;

    const { data, error } = await supabase.rpc('submit_host_family_payment_proof', {
      p_image_url: imageUrl,
      p_amount: 100,
      p_plan_type: 'host_family_premium',
    });

    if (error) {
      throw error;
    }

    return {
      submissionId: data?.submission_id || '',
      status: data?.status || 'pending',
    };
  },
};
