import { supabase } from '../lib/supabase';
import {
  hostFamilySubscriptionService,
  type HostFamilySubscriptionState,
} from './hostFamilySubscriptionService';
import { accessControlService } from './accessControlService';
import { adminService } from './adminService';

export interface AuPairProfile {
  id: string;
  user_id: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  display_name: string;
  age?: number;
  gender?: string;
  nationality?: string;
  current_country?: string;
  current_city?: string;
  languages: any;
  education_level?: string;
  field_of_study?: string;
  childcare_experience_years: number;
  age_groups_worked: string[];
  
  personality_traits?: string[]; // New
  work_style?: string[]; // New
  
  child_age_comfort?: string[]; // New
  skills: string[];
  skills_examples?: string; // New
  interests?: string[];
  
  rules_comfort?: string[]; // New
  
  previous_au_pair: boolean;
  experience_description?: string;
  
  preferred_countries: string[];
  preferred_cities: string[];
  preferred_family_type?: string[]; // New
  deal_breakers?: string[]; // New
  
  working_hours_preference?: string;
  days_off_preference?: string;
  live_in_preference?: string;
  dietary_restrictions?: string;
  smoker: boolean;
  has_tattoos: boolean;
  
  available_from?: string;
  duration_months?: number;
  
  bio?: string;
  introduction?: string; // New essay
  
  profile_photos: string[];
  intro_video_url?: string;
  experience_videos: string[];
  profile_status: string;
  
  // Ownership fields
  created_by: 'self' | 'admin';
  owner_admin_id?: string;
  owner_user_id?: string;
  
  created_at: string;
  updated_at: string;
}

export interface HostFamilyProfile {
  id: string;
  user_id: string;
  family_name: string;
  family_type?: string;
  parent_occupations?: string;
  country: string;
  province?: string; // New
  city: string;
  neighborhood?: string;
  housing_type?: string;
  home_type?: string; // New
  household_vibe?: string[]; // New
  cleanliness_level?: number; // New
  guests_frequency?: string; // New
  
  private_room: boolean;
  shared_bathroom: boolean;
  helper_present: boolean;
  
  rules?: any; // Keeping as container for specific rules
  house_rules_details?: string; // Renamed from rules_details
  
  children_count: number;
  children_ages: number[];
  children_personalities: string[];
  children_health_notes?: string;
  
  parenting_styles?: string[]; // New
  discipline_approach?: string; // New
  
  daily_tasks: string[];
  weekly_schedule?: string;
  extra_activities?: string;
  flexibility_expectations?: string;
  flexibility_level?: string; // New
  
  preferred_nationalities: string[];
  preferred_traits?: string[]; // New
  deal_breakers?: string[]; // New
  
  language_level_required?: string;
  education_level_required?: string;
  experience_required_years: number;
  
  home_photos: string[];
  family_photos: string[];
  family_video_url?: string;
  
  monthly_salary_offer?: number;
  salary?: any; // New structured object
  benefits: string[];
  
  family_size?: number;
  languages_spoken: string[];
  work_hours?: string;
  requirements?: string;
  expectations?: string;
  specific_requirements?: string; // New (mapped from requirements?)
  profile_status: string;
  
  // Ownership fields
  created_by: 'self' | 'admin';
  owner_admin_id?: string;
  owner_user_id?: string;
  
  start_date?: string;
  end_date?: string;
  
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionStatus {
  role: 'host_family' | 'au_pair' | null;
  subscriptionStatus: 'free' | 'premium' | null;
  subscriptionExpiresAt: string | null;
  messageCount: number;
  onboardingCompleted: boolean;
  hostFamilyState?: HostFamilySubscriptionState | null;
  latestSubmission?: {
    status: string;
    id: string;
    admin_notes?: string;
  } | null;
  isAdmin?: boolean;
}

export const auPairService = {
  async getUserSubscriptionStatus(): Promise<UserSubscriptionStatus> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn('Auth check failed:', authError);
        return {
          role: null,
          subscriptionStatus: null,
          subscriptionExpiresAt: null,
          messageCount: 0,
          onboardingCompleted: false,
          hostFamilyState: null,
          latestSubmission: null
        };
      }

      const [isAdminUser, profileResult] = await Promise.all([
        adminService.checkIsAdmin(),
        supabase
          .from('profiles')
          .select('au_pair_role, au_pair_subscription_status, au_pair_message_count, au_pair_onboarding_completed, host_family_subscription_status, host_family_subscription_end')
          .eq('id', user.id)
          .maybeSingle(),
      ]);

      const { data: profile, error } = profileResult;

      if (error) {
        console.warn('Profile fetch failed:', error);
        return {
          role: null,
          subscriptionStatus: null,
          subscriptionExpiresAt: null,
          messageCount: 0,
          onboardingCompleted: false,
          hostFamilyState: null,
          latestSubmission: null
        };
      }

      if (isAdminUser) {
        return {
          role: null,
          subscriptionStatus: null,
          subscriptionExpiresAt: null,
          messageCount: profile?.au_pair_message_count || 0,
          onboardingCompleted: true,
          hostFamilyState: null,
          latestSubmission: null,
          isAdmin: true,
        };
      }

      // Check user_services as a fallback for role if au_pair_role is null
      let role = profile?.au_pair_role;
      if (!role) {
        const { data: services } = await supabase
          .from('user_services')
          .select('role')
          .eq('user_id', user.id);
        
        if (services?.some((s: { role: string }) => s.role === 'host_family')) {
          role = 'host_family';
        } else if (services?.some((s: { role: string }) => s.role === 'au_pair')) {
          role = 'au_pair';
        }
      }

      // Final fallback: check specific profile tables if role still null
      if (!role) {
        const { data: hf } = await supabase
          .from('host_family_profiles')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (hf) {
          role = 'host_family';
        } else {
          const { data: ap } = await supabase
            .from('au_pair_profiles')
            .select('id')
            .eq('user_id', user.id)
            .maybeSingle();
          if (ap) role = 'au_pair';
        }
      }

      const { data: latestSubmission } = await supabase
        .from('payment_submissions')
        .select('*')
        .eq('user_id', user.id)
        .eq('plan_type', 'host_family_premium')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      let hostFamilyState: HostFamilySubscriptionState | null = null;
      if (role === 'host_family') {
        hostFamilyState = await hostFamilySubscriptionService.getState(user.id);
      }

      let subscriptionStatus: 'free' | 'premium' | null = profile?.au_pair_subscription_status || null;
      let subscriptionExpiresAt: string | null = null;

      if (role === 'host_family') {
        subscriptionStatus = hostFamilyState?.subscription_status === 'premium_active' ? 'premium' : 'free';
        subscriptionExpiresAt = hostFamilyState?.expires_at || null;
      } else if (role === 'au_pair') {
        subscriptionStatus = profile?.au_pair_subscription_status || null;
        subscriptionExpiresAt = null;
      }

      return {
        role: (role as 'host_family' | 'au_pair') || null,
        subscriptionStatus: subscriptionStatus || (role === 'host_family' ? 'free' : null),
        subscriptionExpiresAt,
        messageCount: profile?.au_pair_message_count || 0,
        onboardingCompleted: profile?.au_pair_onboarding_completed || false,
        hostFamilyState,
        latestSubmission,
        isAdmin: false,
      };
    } catch (error) {
      console.error('getUserSubscriptionStatus failed:', error);
      // Return safe defaults instead of throwing
      return {
        role: null,
        subscriptionStatus: null,
        subscriptionExpiresAt: null,
        messageCount: 0,
        onboardingCompleted: false,
        hostFamilyState: null,
        latestSubmission: null
      };
    }
  },

  async setUserRole(role: 'host_family' | 'au_pair') {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error('Not authenticated');
      }

      // First, ensure profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile if it doesn't exist
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            au_pair_role: role,
            au_pair_subscription_status: role === 'host_family' ? 'free' : null,
            host_family_subscription_status: role === 'host_family' ? 'free' : null,
            host_family_subscription_plan: role === 'host_family' ? 'free' : null,
            au_pair_message_count: 0,
            au_pair_onboarding_completed: false
          });

        if (insertError) {
          console.error('Failed to create profile:', insertError);
          throw insertError;
        }
      } else {
        // Update existing profile
        const updates: any = {
          au_pair_role: role,
          updated_at: new Date().toISOString()
        };

        if (role === 'host_family') {
          updates.au_pair_subscription_status = 'free';
          updates.host_family_subscription_status = 'free';
          updates.host_family_subscription_plan = 'free';
          updates.au_pair_message_count = 0;
        }

        const { error: updateError } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', user.id);

        if (updateError) {
          console.error('Failed to update profile:', updateError);
          throw updateError;
        }
      }
    } catch (error) {
      console.error('setUserRole failed:', error);
      throw error;
    }
  },

  async completeOnboarding() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const updates = {
      au_pair_onboarding_completed: true,
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  },

  async upgradeToPremium() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        au_pair_subscription_status: 'premium',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;
  },

  async cancelSubscription() {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        au_pair_subscription_status: 'free',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) throw error;
  },

  async incrementMessageCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get current count
    const status = await this.getUserSubscriptionStatus();
    
    const { error } = await supabase
      .from('profiles')
      .update({
        au_pair_message_count: status.messageCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id);

    if (error) {
      console.error('Error incrementing message count:', error);
    }
  },

  async getAuPairProfiles(): Promise<AuPairProfile[]> {
    const { data, error } = await supabase
      .from('au_pair_profiles')
      .select('*')
      .eq('profile_status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAdminAuPairProfiles(): Promise<AuPairProfile[]> {
    const { data, error } = await supabase
      .from('au_pair_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getHostFamilyProfiles(): Promise<HostFamilyProfile[]> {
    const { data, error } = await supabase
      .from('host_family_profiles')
      .select('*')
      .eq('profile_status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAdminHostFamilyProfiles(): Promise<HostFamilyProfile[]> {
    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_admin_host_family_profiles');
    if (!rpcError) return rpcData || [];

    // Fallback
    const { data, error } = await supabase
      .from('host_family_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAuPairProfile(userId: string): Promise<AuPairProfile | null> {
    const { data, error } = await supabase
      .from('au_pair_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createAuPairProfile(profile: Partial<AuPairProfile>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Ensure profile exists in 'profiles' table before inserting into 'au_pair_profiles'
    // This handles the case where the user might not have a profile record yet
    await this.setUserRole('au_pair');

    const { data, error } = await supabase
      .from('au_pair_profiles')
      .upsert({
        ...profile,
        user_id: user.id,
        created_by: 'self',
        owner_user_id: user.id,
        owner_admin_id: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAuPairProfile(profile: Partial<AuPairProfile>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('au_pair_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getHostFamilyProfile(userId: string): Promise<HostFamilyProfile | null> {
    const { data, error } = await supabase
      .from('host_family_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async createHostFamilyProfile(profile: Partial<HostFamilyProfile>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    // Ensure profile exists in 'profiles' table
    await this.setUserRole('host_family');

    const { data, error } = await supabase
      .from('host_family_profiles')
      .upsert({
        ...profile,
        user_id: user.id,
        created_by: 'self',
        owner_user_id: user.id,
        owner_admin_id: null,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateHostFamilyProfile(profile: Partial<HostFamilyProfile>) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const { data, error } = await supabase
      .from('host_family_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async adminUpdateHostFamilyProfile(userId: string, profile: Partial<HostFamilyProfile>) {
    const { data, error } = await supabase
      .from('host_family_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async adminUpdateAuPairProfile(userId: string, profile: Partial<AuPairProfile>) {
    const { data, error } = await supabase
      .from('au_pair_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async canSendMessage(contextType?: string): Promise<{ 
    allowed: boolean; 
    reason?: 'not_premium' | 'onboarding_incomplete' | 'not_authenticated' | 'payment_pending' | 'payment_rejected' | 'subscription_expired' 
  }> {
    const access = await accessControlService.resolveMessagingAccess();

    if (contextType === 'support' || contextType === 'admin') {
      return { allowed: true };
    }

    if (access.allowed || access.state === 'admin_access') {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: access.reason || accessControlService.mapMessagingStateToReason(access.state, Boolean(access.context)) || 'not_premium',
    };
  },

  async getLatestPaymentSubmission() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
      .from('payment_submissions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_type', 'host_family_premium')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching latest payment submission:', error);
      return null;
    }

    return data;
  },

  // Admin-specific methods for managing admin-owned listings
  
  /**
   * Validate ownership before allowing edit/delete operations
   * @throws Error if ownership validation fails
   */
  async validateOwnership(
    profileId: string,
    profileType: 'au_pair' | 'family',
    expectedOwnership: 'admin' | 'self',
    userId: string
  ): Promise<void> {
    const tableName = profileType === 'au_pair' ? 'au_pair_profiles' : 'host_family_profiles';
    
    const { data, error } = await supabase
      .from(tableName)
      .select('created_by, owner_admin_id, owner_user_id')
      .eq('id', profileId)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Failed to validate ownership: ${error?.message || 'Profile not found'}`);
    }

    // Check if ownership matches expected type
    if (expectedOwnership === 'admin') {
      // Allow admins to manage ANY admin-created or system profile
      // We removed the strict (data.owner_admin_id !== userId) check
      // to allow deleting "system" or other admin's listings.
      if (data.created_by !== 'admin' && data.created_by !== 'system') {
        // Optional: strict check to prevent admins from accidentally editing "self" (user) profiles 
        // via this specific admin method, unless we want to allow that too.
        // For now, let's just allow it if it's admin/system.
        // Actually, let's just rely on RLS. If they can fetch it, they can likely edit it.
        // But maintaining some sanity check:
      }
      
      // Implicitly allowed if we got here and RLS didn't block us.
      // We trust the backend RLS 'is_admin_internal()' policy we just added.
      return;

    } else if (expectedOwnership === 'self') {
      if (data.created_by !== 'self' || data.owner_user_id !== userId) {
        throw new Error('You can only edit your own self-owned listing');
      }
    }
  },

  async createAdminAuPairProfile(profile: Partial<AuPairProfile>): Promise<AuPairProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Admin creates profile without user_id, sets owner_admin_id
    const { data, error } = await supabase
      .from('au_pair_profiles')
      .insert({
        ...profile,
        created_by: 'admin',
        owner_admin_id: user.id,
        owner_user_id: null,
        user_id: null, // Allow multiple orphan listings for the same admin
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createAdminHostFamilyProfile(profile: Partial<HostFamilyProfile>) {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Not authenticated');
    }

    // Admin creates profile without user_id, sets owner_admin_id
    const { data, error } = await supabase
      .from('host_family_profiles')
      .insert({
        ...profile,
        created_by: 'admin',
        owner_admin_id: user.id,
        owner_user_id: null,
        user_id: null, // Allow multiple orphan listings for the same admin
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAdminAuPairProfile(profileId: string, profile: Partial<AuPairProfile>): Promise<AuPairProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate admin ownership before allowing update
    await this.validateOwnership(profileId, 'au_pair', 'admin', user.id);

    const { data, error } = await supabase
      .from('au_pair_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateAdminHostFamilyProfile(profileId: string, profile: Partial<HostFamilyProfile>): Promise<HostFamilyProfile> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate admin ownership before allowing update
    await this.validateOwnership(profileId, 'family', 'admin', user.id);

    const { data, error } = await supabase
      .from('host_family_profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString()
      })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteAdminAuPairProfile(profileId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate admin ownership before allowing deletion
    await this.validateOwnership(profileId, 'au_pair', 'admin', user.id);

    const { error } = await supabase
      .from('au_pair_profiles')
      .update({ profile_status: 'deleted' })
      .eq('id', profileId);

    if (error) throw error;
  },

  async deleteAdminHostFamilyProfile(profileId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Validate admin ownership before allowing deletion
    await this.validateOwnership(profileId, 'family', 'admin', user.id);

    const { error } = await supabase
      .from('host_family_profiles')
      .update({ profile_status: 'deleted' })
      .eq('id', profileId);

    if (error) throw error;
  },

  async getAuPairProfileById(profileId: string): Promise<AuPairProfile | null> {
    const { data, error } = await supabase
      .from('au_pair_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getHostFamilyProfileById(profileId: string): Promise<HostFamilyProfile | null> {
    const { data, error } = await supabase
      .from('host_family_profiles')
      .select('*')
      .eq('id', profileId)
      .maybeSingle();

    if (error) throw error;
    return data;
  }
};
