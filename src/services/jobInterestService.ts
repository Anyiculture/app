import { supabase } from '../lib/supabase';

export interface JobInterest {
  id: string;
  job_id: string;
  user_id: string;
  greeting_message: string | null;
  status: 'pending' | 'viewed' | 'responded' | 'ignored';
  created_at: string;
  viewed_at: string | null;
  responded_at: string | null;
}

export interface JobInterestWithDetails extends JobInterest {
  job?: {
    id: string;
    title: string;
    company_name?: string;
  };
  user?: {
    id: string;
    full_name?: string;
    email: string;
  };
}

export const GREETING_TEMPLATES = [
  {
    id: 'professional',
    label: 'Professional',
    text: "Hello! I'm very  interested in this position and believe my skills align well with the requirements. I'd love to discuss this opportunity further."
  },
  {
    id: 'enthusiastic',
    label: 'Enthusiastic',
    text: "Hi! This role looks perfect for me! I'm excited about the opportunity and would love to learn more about your team and the position."
  },
  {
    id: 'experienced',
    label: 'Experienced',
    text: "Greetings! I have extensive relevant experience in this field and am very interested in this opportunity. I'd appreciate the chance to discuss how I can contribute to your team."
  },
  {
    id: 'custom',
    label: 'Write Your Own',
    text: ''
  }
];

export const jobInterestService = {
  /**
   * Express interest in a job (Say Hi)
   */
  async sayHi(jobId: string, greetingMessage?: string): Promise<JobInterest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_interests')
      .insert({
        job_id: jobId,
        user_id: user.id,
        greeting_message: greetingMessage || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('You have already expressed interest in this job');
      }
      throw error;
    }

    return data;
  },

  /**
   * Get all interests for a specific job (for employers)
   */
  async getJobInterests(jobId: string): Promise<JobInterestWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Verify user is the employer for this job
    const { data: job } = await supabase
      .from('jobs')
      .select('employer_id')
      .eq('id', jobId)
      .single();

    if (!job || job.employer_id !== user.id) {
      throw new Error('Unauthorized');
    }

    const { data, error } = await supabase
      .from('job_interests')
      .select(`
        *,
        user:profiles!job_interests_user_id_fkey(
          full_name,
          email
        )
      `)
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
  },

  /**
   * Get interest count for a job (public)
   */
  async getInterestCount(jobId: string): Promise<number> {
    const { count, error } = await supabase
      .from('job_interests')
      .select('*', { count: 'exact', head: true })
      .eq('job_id', jobId);

    if (error) throw error;
    return count || 0;
  },

  /**
   * Get user's own job interests (job seeker view)
   */
  async getMyInterests(): Promise<JobInterestWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_interests')
      .select(`
        *,
        job:jobs!job_interests_job_id_fkey(
          id,
          title,
          location_city
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as any;
  },

  /**
   * Check if user has expressed interest in a job
   */
  async hasExpressedInterest(jobId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('job_interests')
      .select('id')
      .eq('job_id', jobId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  /**
   * Update interest status (for employers)
   */
  async updateInterestStatus(
    interestId: string,
    status: 'viewed' | 'responded' | 'ignored'
  ): Promise<void> {
    const updateData: any = { status };
    
    if (status === 'viewed' && !updateData.viewed_at) {
      updateData.viewed_at = new Date().toISOString();
    } else if (status === 'responded' && !updateData.responded_at) {
      updateData.responded_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('job_interests')
      .update(updateData)
      .eq('id', interestId);

    if (error) throw error;
  },

  /**
   * Delete interest (withdraw interest)
   */
  async withdrawInterest(jobId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('job_interests')
      .delete()
      .eq('job_id', jobId)
      .eq('user_id', user.id);

    if (error) throw error;
  }
};
