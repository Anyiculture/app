import { supabase } from '../lib/supabase';

export interface Profile {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  full_name: string | null;
  profile_image_url: string | null;
  avatar_url: string | null;
  current_city: string | null;
  location: string | null;
  phone: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  citizenship_country: string | null;
  residence_country: string | null;
  residence_province: string | null;
  residence_city: string | null;
  role: string | null;
  interested_modules: string[];
  primary_interest: string | null;
  user_goals: string | null;
  platform_intent: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relationship: string | null;
  consent_data_processing: boolean;
  consent_communications: boolean;
  preferred_language: string;
  onboarding_completed: boolean;
  is_first_login: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileData {
  first_name?: string;
  last_name?: string;
  display_name?: string;
  full_name?: string;
  profile_image_url?: string;
  avatar_url?: string;
  current_city?: string;
  location?: string;
  phone?: string;
  bio?: string;
  date_of_birth?: string;
  gender?: string;
  nationality?: string;
  citizenship_country?: string;
  residence_country?: string;
  residence_province?: string;
  residence_city?: string;
  role?: string;
  interested_modules?: string[];
  primary_interest?: string;
  user_goals?: string;
  platform_intent?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  consent_data_processing?: boolean;
  consent_communications?: boolean;
  preferred_language?: string;
  onboarding_completed?: boolean;
  is_first_login?: boolean;
  last_login_at?: string;
}

export const profileService = {
  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getCurrentUserProfile(): Promise<Profile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    return this.getProfile(user.id);
  },

  async createProfile(userId: string, email: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        email,
        preferred_language: 'en',
        onboarding_completed: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: UpdateProfileData): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async ensureProfileExists(userId: string, email: string): Promise<Profile> {
    const existing = await this.getProfile(userId);
    if (existing) return existing;
    return this.createProfile(userId, email);
  },

  async completeModuleOnboarding(module: 'jobs' | 'education' | 'events' | 'marketplace' | 'community' | 'visa'): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const updates: Record<string, any> = {};
    updates[`${module}_onboarding_completed`] = true;
    updates[`${module}_onboarding_completed_at`] = new Date().toISOString();
    updates['updated_at'] = new Date().toISOString();

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;
  },

  async getModuleOnboardingStatus(module: 'jobs' | 'education' | 'events' | 'marketplace' | 'community' | 'visa'): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('profiles')
      .select(`${module}_onboarding_completed`)
      .eq('id', user.id)
      .maybeSingle();

    if (error) return false;
    return (data as any)?.[`${module}_onboarding_completed`] || false;
  },
};