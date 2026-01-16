import { supabase } from '../lib/supabase';

export interface JobsUserRole {
  hasRole: boolean;
  role: 'job_seeker' | 'employer' | null;
  profileCompleted: boolean;
}

export const jobsRoleService = {
  async checkUserRole(userId: string): Promise<JobsUserRole> {
    // Select * to avoid error if onboarding_completed column is missing
    const { data: userService, error: serviceError } = await supabase
      .from('user_services')
      .select('*')
      .eq('user_id', userId)
      .eq('service_type', 'jobs')
      .maybeSingle();

    if (serviceError) {
      console.error('Error checking user role:', serviceError);
      return { hasRole: false, role: null, profileCompleted: false };
    }

    if (!userService) {
      return { hasRole: false, role: null, profileCompleted: false };
    }

    const role = userService.role as 'job_seeker' | 'employer';
    // Handle case where column might be missing
    const serviceOnboardingCompleted = (userService as any).onboarding_completed === true;

    if (role === 'job_seeker') {
      const { data: profile } = await supabase
        .from('profiles_jobseeker')
        .select('profile_completion_percent')
        .eq('user_id', userId)
        .maybeSingle();

      const profilePercent = profile?.profile_completion_percent || 0;

      return {
        hasRole: true,
        role: 'job_seeker',
        profileCompleted: serviceOnboardingCompleted || profilePercent >= 100,
      };
    }

    if (role === 'employer') {
      const { data: profile } = await supabase
        .from('profiles_employer')
        .select('profile_completion_percent')
        .eq('user_id', userId)
        .maybeSingle();

      const profilePercent = profile?.profile_completion_percent || 0;

      return {
        hasRole: true,
        role: 'employer',
        profileCompleted: serviceOnboardingCompleted || profilePercent >= 100,
      };
    }

    return { hasRole: false, role: null, profileCompleted: false };
  },

  async setUserRole(userId: string, role: 'job_seeker' | 'employer'): Promise<void> {
    // Try upsert with explicit onConflict to avoid 409 when unique constraint exists
    try {
      const { error } = await supabase
        .from('user_services')
        .upsert(
          {
            user_id: userId,
            service_type: 'jobs',
            role,
          },
          { onConflict: 'user_id,service_type' }
        )
        .select();

      if (error) {
        // If upsert failed due to conflict or other reason, attempt a fallback update
        console.warn('Upsert returned error, attempting update:', error);
        const { error: updateError } = await supabase
          .from('user_services')
          .update({ role })
          .eq('user_id', userId)
          .eq('service_type', 'jobs');

        if (updateError) {
          console.error('Error setting user role (update fallback):', updateError);
          throw updateError;
        }
      }

      // success
      return;
    } catch (e) {
      console.error('Unhandled error setting user role:', e);
      throw e;
    }
  },

  async clearUserRole(userId: string): Promise<void> {
    const { error } = await supabase
      .from('user_services')
      .delete()
      .eq('user_id', userId)
      .eq('service_type', 'jobs');

    if (error) {
      console.error('Error clearing user role:', error);
      throw error;
    }
  },

  async getUserJobsRole(userId: string): Promise<'job_seeker' | 'employer' | null> {
    const result = await this.checkUserRole(userId);
    return result.role;
  },
};
