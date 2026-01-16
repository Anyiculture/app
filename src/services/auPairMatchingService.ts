import { supabase } from '../lib/supabase';

export interface AuPairProfile {
  id: string;
  user_id: string;
  display_name: string;
  nationality: string;
  languages: string[];
  childcare_experience_years: number;
  available_from: string;
  bio?: string;
  profile_status: string;
  profile_photos?: string[];
  current_city?: string;
  current_country?: string;
}

export interface HostFamilyProfile {
  id: string;
  user_id: string;
  family_name: string;
  location_country: string;
  location_city: string;
  number_of_children: number;
  languages_spoken: string[];
  family_photos?: string[];
  home_photos?: string[];
  start_date?: string;
  profile_status: string;
}

export const auPairMatchingService = {
  async getAuPairProfile(userId?: string): Promise<AuPairProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    if (!targetUserId) {
      console.warn('[auPairMatchingService] No userId found for getAuPairProfile');
      return null;
    }

    const { data, error } = await supabase
      .from('au_pair_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) {
      console.error('[auPairMatchingService] Error fetching au pair profile:', error);
      throw error;
    }
    console.log('[auPairMatchingService] getAuPairProfile result:', data);
    return data;
  },

  async getHostFamilyProfile(userId?: string): Promise<HostFamilyProfile | null> {
    const { data: { user } } = await supabase.auth.getUser();
    const targetUserId = userId || user?.id;
    if (!targetUserId) return null;

    const { data, error } = await supabase
      .from('host_family_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async searchAuPairs(filters?: any): Promise<AuPairProfile[]> {
    let query = supabase
      .from('au_pair_profiles')
      .select('*')
      .eq('profile_status', 'active');

    if (filters) {
      // Nationality
      if (filters.nationality && filters.nationality !== 'all') {
        query = query.eq('nationality', filters.nationality);
      }
      
      // Search (Name or Bio)
      if (filters.search) {
        query = query.or(`display_name.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`);
      }

      // Experience
      const experience = filters.experience_years_min || filters.childcare_experience_years;
      if (experience) {
        const years = parseInt(experience);
        if (!isNaN(years)) {
          query = query.gte('childcare_experience_years', years);
        }
      }

      // Languages
      if (filters.languages && filters.languages !== 'all') {
        const langArray = Array.isArray(filters.languages) ? filters.languages : [filters.languages];
        query = query.contains('languages', langArray);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async searchHostFamilies(filters?: any): Promise<HostFamilyProfile[]> {
    let query = supabase
      .from('host_family_profiles')
      .select('*')
      .eq('profile_status', 'active');

    if (filters) {
      // Country
      if (filters.location_country && filters.location_country !== 'all') {
        query = query.eq('location_country', filters.location_country);
      }
      
      // City
      if (filters.location_city && filters.location_city !== 'all') {
        query = query.eq('location_city', filters.location_city);
      }

      // Search (Name or City)
      if (filters.search) {
        query = query.or(`family_name.ilike.%${filters.search}%,location_city.ilike.%${filters.search}%`);
      }

      // Children Count
      const children = filters.children_count_min || filters.children || filters.childrenCount || filters.number_of_children;
      if (children) {
        const count = parseInt(children);
        if (!isNaN(count)) {
          query = query.gte('number_of_children', count);
        }
      }
      
      // Languages
      if (filters.languages && filters.languages !== 'all') {
         const langArray = Array.isArray(filters.languages) ? filters.languages : [filters.languages];
         query = query.contains('languages_spoken', langArray);
      }
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getSavedProfiles(): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('au_pair_saved_profiles')
      .select('*')
      .eq('user_id', user.id);

    if (error) throw error;
    return data || [];
  },

  async saveProfile(profileType: string, profileId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('au_pair_saved_profiles')
      .insert({
        user_id: user.id,
        profile_type: profileType,
        profile_id: profileId,
      });

    if (error) throw error;
  },

  async removeSavedProfile(savedProfileId: string): Promise<void> {
    const { error } = await supabase
      .from('au_pair_saved_profiles')
      .delete()
      .eq('id', savedProfileId);

    if (error) throw error;
  },
};
