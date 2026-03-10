import { supabase } from '../lib/supabase';

export interface PaymentSubmission {
  id: string;
  user_id: string;
  image_url: string;
  plan_type: 'au_pair_premium_monthly' | 'au_pair_premium_yearly' | 'host_family_premium' | 'job_posting' | 'featured_listing';
  amount?: number;
  status: 'pending' | 'approved' | 'rejected';
  admin_notes?: string;
  created_at: string;
}

export const paymentService = {
  async submitPaymentProof(file: File, planType: string, amount: number): Promise<PaymentSubmission> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Upload Image - Using correct bucket name 'payment_proofs'
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading payment proof image:', uploadError);
      throw uploadError;
    }
    console.log('Payment proof image uploaded successfully.');

    const { data: { publicUrl } } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(fileName);

      // Create payment submission record
      console.log('Creating payment submission record for user:', user.id, 'Plan:', planType);
      const { data, error: submissionError } = await supabase
        .from('payment_submissions')
        .insert({
          user_id: user.id,
          plan_type: planType,
          amount: amount,
          image_url: publicUrl,
          status: 'pending'
        })
        .select()
        .single();

      if (submissionError) {
        console.error('Error creating payment submission:', submissionError);
        throw submissionError;
      }

      console.log('Payment submission created successfully:', data.id);

      // If it's a host family premium payment, we need to update the profile status
      if (planType === 'host_family_premium') {
        console.log('Updating host family profile status to pending_approval...');
        const { error: profileError } = await supabase
          .from('host_family_profiles')
          .update({ profile_status: 'pending_approval' })
          .eq('user_id', user.id);

        if (profileError) {
          console.error('Error updating profile status:', profileError);
          // Don't throw here as the payment record was created
        } else {
          console.log('Host family profile status updated successfully');
        }
      }

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
