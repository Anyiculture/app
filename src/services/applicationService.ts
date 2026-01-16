import { supabase } from '../lib/supabase';

export type ApplicationStatus =
  | 'applied'
  | 'screening'
  | 'interview_scheduled'
  | 'interviewed'
  | 'offer_extended'
  | 'hired'
  | 'rejected';

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  status: ApplicationStatus;
  notes: string | null;
  resume_url: string | null;
  cover_letter: string | null;
  applied_at: string;
  updated_at: string;
}

export interface JobApplicationWithDetails extends JobApplication {
  job?: {
    id: string;
    title: string;
    location_city?: string;
    employment_type?: string;
  };
  applicant?: {
    id: string;
    full_name?: string;
    email: string;
    phone?: string;
  };
}

export interface ApplicationPipelineHistory {
  id: string;
  application_id: string;
  from_status: string | null;
  to_status: string;
  changed_by: string | null;
  changed_at: string;
  notes: string | null;
}

export const applicationService = {
  /**
   * Apply for a job
   */
  async apply(
    jobId: string,
    data: {
      resume_url?: string;
      cover_letter?: string;
    }
  ): Promise<JobApplication> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: application, error } = await supabase
      .from('job_applications')
      .insert({
        job_id: jobId,
        applicant_id: user.id,
        resume_url: data.resume_url || null,
        cover_letter: data.cover_letter || null,
        status: 'applied'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('You have already applied for this job');
      }
      throw error;
    }

    return application;
  },

  /**
   * Get all applications for a job (employer view)
   */
  async getJobApplications(jobId: string): Promise<JobApplicationWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        applicant:profiles!job_applications_applicant_id_fkey(
          full_name,
          email,
          phone
        ),
        job:jobs!job_applications_job_id_fkey(
          id,
          title,
          employer_id
        )
      `)
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });

    if (error) throw error;

    // Verify user is the employer
    if (data.length > 0 && (data[0] as any).job?.employer_id !== user.id) {
      throw new Error('Unauthorized');
    }

    return data as any;
  },

  /**
   * Get all applications by status (employer view - for pipeline)
   */
  async getApplicationsByStatus(
    jobId: string,
    status?: ApplicationStatus
  ): Promise<Record<ApplicationStatus, JobApplicationWithDetails[]>> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('job_applications')
      .select(`
        *,
        applicant:profiles!job_applications_applicant_id_fkey(
          full_name,
          email,
          phone
        )
      `)
      .eq('job_id', jobId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('updated_at', { ascending: false });

    if (error) throw error;

    // Group by status
    const grouped: Record<ApplicationStatus, JobApplicationWithDetails[]> = {
      applied: [],
      screening: [],
      interview_scheduled: [],
      interviewed: [],
      offer_extended: [],
      hired: [],
      rejected: []
    };

    (data as any[]).forEach(app => {
      grouped[app.status as ApplicationStatus].push(app);
    });

    return grouped;
  },

  /**
   * Get user's own applications (job seeker view)
   */
  async getMyApplications(): Promise<JobApplicationWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('job_applications')
      .select(`
        *,
        job:jobs!job_applications_job_id_fkey(
          id,
          title,
          location_city,
          employment_type
        )
      `)
      .eq('applicant_id', user.id)
      .order('applied_at', { ascending: false });

    if (error) throw error;
    return data as any;
  },

  /**
   * Check if user has applied to a job
   */
  async hasApplied(jobId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('job_applications')
      .select('id')
      .eq('job_id', jobId)
      .eq('applicant_id', user.id)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  /**
   * Update application status (employer only)
   */
  async updateStatus(
    applicationId: string,
    newStatus: ApplicationStatus,
    notes?: string
  ): Promise<void> {
    const updateData: any = {
      status: newStatus,
      updated_at: new Date().toISOString()
    };

    if (notes) {
      updateData.notes = notes;
    }

    const { error } = await supabase
      .from('job_applications')
      .update(updateData)
      .eq('id', applicationId);

    if (error) throw error;
  },

  /**
   * Get application pipeline history
   */
  async getApplicationHistory(applicationId: string): Promise<ApplicationPipelineHistory[]> {
    const { data, error } = await supabase
      .from('application_pipeline_history')
      .select('*')
      .eq('application_id', applicationId)
      .order('changed_at', { ascending: true });

    if (error) throw error;
    return data;
  },

  /**
   * Withdraw application (job seeker)
   */
  async withdrawApplication(applicationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('job_applications')
      .delete()
      .eq('id', applicationId)
      .eq('applicant_id', user.id);

    if (error) throw error;
  }
};
