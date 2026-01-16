import { supabase } from '../lib/supabase';

export type InterviewStatus =
  | 'scheduled'
  | 'confirmed'
  | 'rescheduled'
  | 'cancelled'
  | 'completed';

export type InterviewLocation = 'zoom' | 'teams' | 'phone' | 'office' | 'other';

export interface Interview {
  id: string;
  application_id: string | null;
  job_id: string | null;
  interviewer_id: string;
  interviewee_id: string;
  scheduled_at: string;
  duration_minutes: number;
  location: string;
  meeting_url: string | null;
  status: InterviewStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewWithDetails extends Interview {
  job?: {
    id: string;
    title: string;
  };
  interviewer?: {
    id: string;
    full_name?: string;
    email: string;
  };
  interviewee?: {
    id: string;
    full_name?: string;
    email: string;
  };
}

export const interviewService = {
  /**
   * Schedule an interview
   */
  async scheduleInterview(data: {
    applicationId?: string;
    jobId?: string;
    intervieweeId: string;
    scheduledAt: string;
    durationMinutes?: number;
    location: InterviewLocation;
    meetingUrl?: string;
    notes?: string;
  }): Promise<Interview> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: interview, error } = await supabase
      .from('interviews')
      .insert({
        application_id: data.applicationId || null,
        job_id: data.jobId || null,
        interviewer_id: user.id,
        interviewee_id: data.intervieweeId,
        scheduled_at: data.scheduledAt,
        duration_minutes: data.durationMinutes || 60,
        location: data.location,
        meeting_url: data.meetingUrl || null,
        notes: data.notes || null,
        status: 'scheduled'
      })
      .select()
      .single();

    if (error) throw error;
    return interview;
  },

  /**
   * Get all interviews for current user
   */
  async getMyInterviews(): Promise<InterviewWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        job:jobs!interviews_job_id_fkey(
          id,
          title
        ),
        interviewer:profiles!interviews_interviewer_id_fkey(
          full_name,
          email
        ),
        interviewee:profiles!interviews_interviewee_id_fkey(
          full_name,
          email
        )
      `)
      .or(`interviewer_id.eq.${user.id},interviewee_id.eq.${user.id}`)
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data as any;
  },

  /**
   * Get upcoming interviews
   */
  async getUpcomingInterviews(): Promise<InterviewWithDetails[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const now = new Date().toISOString();

    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        job:jobs!interviews_job_id_fkey(
          id,
          title
        ),
        interviewer:profiles!interviews_interviewer_id_fkey(
          full_name,
          email
        ),
        interviewee:profiles!interviews_interviewee_id_fkey(
          full_name,
          email
        )
      `)
      .or(`interviewer_id.eq.${user.id},interviewee_id.eq.${user.id}`)
      .gte('scheduled_at', now)
      .in('status', ['scheduled', 'confirmed', 'rescheduled'])
      .order('scheduled_at', { ascending: true });

    if (error) throw error;
    return data as any;
  },

  /**
   * Get interviews for a specific application
   */
  async getApplicationInterviews(applicationId: string): Promise<InterviewWithDetails[]> {
    const { data, error } = await supabase
      .from('interviews')
      .select(`
        *,
        interviewer:profiles!interviews_interviewer_id_fkey(
          full_name,
          email
        ),
        interviewee:profiles!interviews_interviewee_id_fkey(
          full_name,
          email
        )
      `)
      .eq('application_id', applicationId)
      .order('scheduled_at', { ascending: false });

    if (error) throw error;
    return data as any;
  },

  /**
   * Update interview
   */
  async updateInterview(
    interviewId: string,
    updates: {
      scheduledAt?: string;
      durationMinutes?: number;
      location?: InterviewLocation;
      meetingUrl?: string;
      status?: InterviewStatus;
      notes?: string;
    }
  ): Promise<void> {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.scheduledAt) updateData.scheduled_at = updates.scheduledAt;
    if (updates.durationMinutes) updateData.duration_minutes = updates.durationMinutes;
    if (updates.location) updateData.location = updates.location;
    if (updates.meetingUrl !== undefined) updateData.meeting_url = updates.meetingUrl;
    if (updates.status) updateData.status = updates.status;
    if (updates.notes !== undefined) updateData.notes = updates.notes;

    const { error } = await supabase
      .from('interviews')
      .update(updateData)
      .eq('id', interviewId);

    if (error) throw error;
  },

  /**
   * Confirm interview (interviewee)
   */
  async confirmInterview(interviewId: string): Promise<void> {
    await this.updateInterview(interviewId, { status: 'confirmed' });
  },

  /**
   * Cancel interview
   */
  async cancelInterview(interviewId: string, notes?: string): Promise<void> {
    await this.updateInterview(interviewId, {
      status: 'cancelled',
      notes
    });
  },

  /**
   * Mark interview as completed
   */
  async completeInterview(interviewId: string, notes?: string): Promise<void> {
    await this.updateInterview(interviewId, {
      status: 'completed',
      notes
    });
  }
};
