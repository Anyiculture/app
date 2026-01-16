import { supabase } from '../lib/supabase';

export interface UserRole {
  id: string;
  module: string;
  role_type: string;
  is_primary: boolean;
  activated_at: string;
  last_used_at: string;
}

export interface UserPersonalization {
  id: string;
  user_id: string;
  primary_role: string | null;
  favorite_modules: string[];
  preferred_language: string;
  preferred_currency: string;
  show_recommendations: boolean;
  auto_match_enabled: boolean;
  email_digest_frequency: 'daily' | 'weekly' | 'never';
  last_visited_module: string | null;
  created_at: string;
  updated_at: string;
}

export interface ModuleEngagement {
  module: string;
  engagement_score: number;
  views_count: number;
  actions_count: number;
  last_engaged_at: string;
}

export interface ContentInteraction {
  content_type: string;
  content_id: string;
  interaction_type: 'view' | 'save' | 'apply' | 'message' | 'click' | 'share';
  interaction_data?: Record<string, any>;
}

class PersonalizationService {
  async getUserPersonalization(userId: string): Promise<UserPersonalization | null> {
    const { data, error } = await supabase
      .from('user_personalization')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user personalization:', error);
      return null;
    }

    return data;
  }

  async getUserRoles(userId: string): Promise<UserRole[]> {
    const { data, error } = await supabase
      .from('user_role_assignments')
      .select('*')
      .eq('user_id', userId)
      .order('last_used_at', { ascending: false });

    if (error) {
      console.error('Error fetching user roles:', error);
      return [];
    }

    return data || [];
  }

  async getPrimaryRole(userId: string): Promise<UserRole | null> {
    const { data, error } = await supabase
      .from('user_role_assignments')
      .select('*')
      .eq('user_id', userId)
      .eq('is_primary', true)
      .maybeSingle();

    if (error) {
      console.error('Error fetching primary role:', error);
      return null;
    }

    return data;
  }

  async setPrimaryRole(userId: string, module: string, roleType: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('set_primary_role', {
        p_user_id: userId,
        p_module: module,
        p_role_type: roleType,
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error setting primary role:', error);
      return false;
    }
  }

  async addUserRole(userId: string, module: string, roleType: string, isPrimary = false): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_role_assignments')
        .insert({
          user_id: userId,
          module,
          role_type: roleType,
          is_primary: isPrimary,
        });

      if (error) throw error;

      if (isPrimary) {
        await this.setPrimaryRole(userId, module, roleType);
      }

      return true;
    } catch (error) {
      console.error('Error adding user role:', error);
      return false;
    }
  }

  async getModuleEngagement(userId: string): Promise<ModuleEngagement[]> {
    const { data, error } = await supabase
      .from('user_module_engagement')
      .select('*')
      .eq('user_id', userId)
      .order('engagement_score', { ascending: false });

    if (error) {
      console.error('Error fetching module engagement:', error);
      return [];
    }

    return data || [];
  }

  async getMostEngagedModule(userId: string): Promise<string | null> {
    const engagements = await this.getModuleEngagement(userId);
    return engagements.length > 0 ? engagements[0].module : null;
  }

  async trackModuleEngagement(userId: string, module: string, actionType: 'view' | 'action'): Promise<void> {
    try {
      await supabase.rpc('update_module_engagement', {
        p_user_id: userId,
        p_module: module,
        p_action_type: actionType,
      });
    } catch (error) {
      console.error('Error tracking module engagement:', error);
    }
  }

  async trackContentInteraction(userId: string, interaction: ContentInteraction): Promise<void> {
    try {
      await supabase.rpc('track_content_interaction', {
        p_user_id: userId,
        p_content_type: interaction.content_type,
        p_content_id: interaction.content_id,
        p_interaction_type: interaction.interaction_type,
        p_interaction_data: interaction.interaction_data || {},
      });
    } catch (error) {
      console.error('Error tracking content interaction:', error);
    }
  }

  async updatePersonalizationPreferences(
    userId: string,
    preferences: Partial<UserPersonalization>
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_personalization')
        .upsert({
          user_id: userId,
          ...preferences,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating personalization preferences:', error);
      return false;
    }
  }

  async updateLastVisitedModule(userId: string, module: string): Promise<void> {
    try {
      await this.updatePersonalizationPreferences(userId, {
        last_visited_module: module,
      });
    } catch (error) {
      console.error('Error updating last visited module:', error);
    }
  }

  async addFavoriteModule(userId: string, module: string): Promise<boolean> {
    const personalization = await this.getUserPersonalization(userId);
    const currentFavorites = personalization?.favorite_modules || [];

    if (currentFavorites.includes(module)) {
      return true;
    }

    return this.updatePersonalizationPreferences(userId, {
      favorite_modules: [...currentFavorites, module],
    });
  }

  async removeFavoriteModule(userId: string, module: string): Promise<boolean> {
    const personalization = await this.getUserPersonalization(userId);
    const currentFavorites = personalization?.favorite_modules || [];

    return this.updatePersonalizationPreferences(userId, {
      favorite_modules: currentFavorites.filter(m => m !== module),
    });
  }

  async getContentInteractions(
    userId: string,
    contentType?: string,
    limit = 50
  ): Promise<ContentInteraction[]> {
    let query = supabase
      .from('user_content_interactions')
      .select('content_type, content_id, interaction_type, interaction_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (contentType) {
      query = query.eq('content_type', contentType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching content interactions:', error);
      return [];
    }

    return data || [];
  }

  async initializePersonalization(userId: string): Promise<boolean> {
    try {
      const existing = await this.getUserPersonalization(userId);
      if (existing) return true;

      const { error } = await supabase
        .from('user_personalization')
        .insert({
          user_id: userId,
          show_recommendations: true,
          auto_match_enabled: true,
          email_digest_frequency: 'weekly',
          preferred_language: 'en',
          preferred_currency: 'CAD',
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error initializing personalization:', error);
      return false;
    }
  }

  getRoleHomeRoute(role: UserRole | null): string {
    if (!role) return '/home';

    const roleRoutes: Record<string, string> = {
      'jobs:job_seeker': '/jobs',
      'jobs:employer': '/my-jobs',
      'au_pair:au_pair': '/au-pair/families',
      'au_pair:host_family': '/au-pair/browse',
      'events:attendee': '/events',
      'events:organizer': '/events/my-events',
      'marketplace:buyer': '/marketplace',
      'marketplace:seller': '/marketplace/my-listings',
      'education:student': '/education',
      'education:educator': '/education/my-programs',
      'visa:applicant': '/visa',
      'visa:consultant': '/visa/dashboard',
      'community:member': '/community',
      'community:moderator': '/admin/community',
    };

    const key = `${role.module}:${role.role_type}`;
    return roleRoutes[key] || `/${role.module}`;
  }

  async determinePostOnboardingRoute(userId: string): Promise<string> {
    const personalization = await this.getUserPersonalization(userId);
    const primaryRole = await this.getPrimaryRole(userId);

    if (primaryRole) {
      return this.getRoleHomeRoute(primaryRole);
    }

    if (personalization?.last_visited_module) {
      return `/${personalization.last_visited_module}`;
    }

    const mostEngagedModule = await this.getMostEngagedModule(userId);
    if (mostEngagedModule) {
      return `/${mostEngagedModule}`;
    }

    return '/home';
  }

  async hasCompletedModuleOnboarding(userId: string, module: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('profiles')
      .select(`${module}_onboarding_completed`)
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return false;
    const profileData = data as Record<string, any>;
    return profileData[`${module}_onboarding_completed`] === true;
  }
}

export const personalizationService = new PersonalizationService();
