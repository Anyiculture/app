import { supabase } from '../lib/supabase';

export interface PaymentSubmission {
  id: string;
  user_id: string;
  image_url: string;
  plan_type: 'au_pair_premium_monthly' | 'au_pair_premium_yearly' | 'job_posting' | 'featured_listing';
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export const paymentService = {
  async submitPaymentProof(file: File, planType: string, amount?: number): Promise<PaymentSubmission> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Upload Image
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment-proofs')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('payment-proofs')
      .getPublicUrl(fileName);

    // 2. Create Submission Record
    const { data, error } = await supabase
      .from('payment_submissions')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        plan_type: planType,
        amount: amount,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMySubmissions(): Promise<PaymentSubmission[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
