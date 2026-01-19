import { supabase } from '../lib/supabase';

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
  created_at: string;
  updated_at: string;
}

export interface UserSubscriptionStatus {
  role: 'host_family' | 'au_pair' | null;
  subscriptionStatus: 'free' | 'premium' | null;
  messageCount: number;
  onboardingCompleted: boolean;
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
          messageCount: 0,
          onboardingCompleted: false
        };
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('au_pair_role, au_pair_subscription_status, au_pair_message_count, au_pair_onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (error) {
        console.warn('Profile fetch failed:', error);
        return {
          role: null,
          subscriptionStatus: null,
          messageCount: 0,
          onboardingCompleted: false
        };
      }

      return {
        role: profile?.au_pair_role || null,
        subscriptionStatus: profile?.au_pair_subscription_status || null,
        messageCount: profile?.au_pair_message_count || 0,
        onboardingCompleted: profile?.au_pair_onboarding_completed || false
      };
    } catch (error) {
      console.error('getUserSubscriptionStatus failed:', error);
      // Return safe defaults instead of throwing
      return {
        role: null,
        subscriptionStatus: null,
        messageCount: 0,
        onboardingCompleted: false
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

  async completeOnboarding(profileUpdates?: { full_name?: string; current_city?: string }) {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    const updates: any = {
      au_pair_onboarding_completed: true,
      updated_at: new Date().toISOString()
    };

    if (profileUpdates?.full_name) updates.full_name = profileUpdates.full_name;
    if (profileUpdates?.current_city) updates.current_city = profileUpdates.current_city;

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

  async canSendMessage(): Promise<{ allowed: boolean; reason?: string }> {
    const status = await this.getUserSubscriptionStatus();

    if (status.role !== 'host_family') {
      return { allowed: true };
    }

    if (status.subscriptionStatus === 'premium') {
      return { allowed: true };
    }

    if (status.messageCount >= 1) {
      return { allowed: false, reason: 'Message limit reached. Upgrade to premium for unlimited messaging.' };
    }

    return { allowed: true };
  },

  async submitPaymentProof(file: File, amount: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // 1. Upload file
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}_proof.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from('payment_proofs')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('payment_proofs')
      .getPublicUrl(fileName);

    // 2. Create payment submission record
    const { error: paymentError } = await supabase
      .from('payment_submissions')
      .insert({
        user_id: user.id,
        image_url: publicUrl,
        plan_type: 'au_pair_premium_monthly', // Defaulting to monthly based on UI
        amount: amount,
        status: 'pending'
      });

    if (paymentError) throw paymentError;

    // 3. User remains free until admin approves the submission
    // The admin review process will trigger the upgrade via review_payment_submission RPC
  }
};
