import { supabase } from '../lib/supabase';

export interface AdminRole {
  id: string;
  user_id: string;
  role: string;
  permissions: string[];
  granted_by: string | null;
  granted_at: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export interface AdminActivityLog {
  id: string;
  admin_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  admin?: {
    email: string;
    profiles?: {
      full_name: string | null;
    };
  };
}

export interface AdminStats {
  totalUsers: number;
  totalJobs: number;
  totalMarketplaceItems: number;
  totalEvents: number;
  totalEducationPrograms: number;
  pendingJobApplications: number;
  pendingEducationInterests: number;
  pendingVisaApplications: number;
  activeConversations: number;
  totalAuPairs: number;
  totalHostFamilies: number;
}

export const adminService = {
  async checkIsAdmin(): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('is_admin', {
        user_id_param: user.id
      });

      if (error) {
        console.error('Error checking admin status:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  },

  async checkHasRole(role: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase.rpc('has_admin_role', {
        user_id_param: user.id,
        role_param: role
      });

      if (error) {
        console.error('Error checking role:', error);
        return false;
      }

      return data || false;
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  },

  async getUserRoles(userId?: string): Promise<AdminRole[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const targetUserId = userId || user.id;

    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true);

    if (error) throw error;
    return data || [];
  },

  async getAllAdminUsers(): Promise<AdminRole[]> {
    const { data, error } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async grantRole(userId: string, role: string, permissions: string[] = []): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('admin_roles')
      .insert({
        user_id: userId,
        role,
        permissions,
        granted_by: user.id,
      });

    if (error) throw error;

    await this.logActivity('grant_role', 'admin_roles', userId, { role, permissions });
  },

  async revokeRole(roleId: string): Promise<void> {
    const { error } = await supabase
      .from('admin_roles')
      .update({ is_active: false })
      .eq('id', roleId);

    if (error) throw error;

    await this.logActivity('revoke_role', 'admin_roles', roleId);
  },

  async updateRolePermissions(roleId: string, permissions: string[]): Promise<void> {
    const { error } = await supabase
      .from('admin_roles')
      .update({ permissions })
      .eq('id', roleId);

    if (error) throw error;

    await this.logActivity('update_permissions', 'admin_roles', roleId, { permissions });
  },

  async getActivityLogs(limit: number = 50): Promise<AdminActivityLog[]> {
    const { data, error } = await supabase
      .from('admin_activity_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async logActivity(
    action: string,
    resourceType?: string,
    resourceId?: string,
    details?: any
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('log_admin_activity', {
        action_param: action,
        resource_type_param: resourceType || null,
        resource_id_param: resourceId || null,
        details_param: details || {}
      });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  },

  async getAdminStats(): Promise<AdminStats> {
    try {
      console.log('Fetching admin stats via RPC...');
      const { data, error } = await supabase.rpc('get_admin_dashboard_stats');

      if (error) {
        console.warn('RPC get_admin_dashboard_stats failed, using manual fallback:', error);
        return this.getAdminStatsFallback();
      }

      // Handle both single object and array responses (common Supabase Edge Case)
      const statsData = Array.isArray(data) ? data[0] : data;

      if (!statsData) {
        console.warn('RPC returned no data, using zeroed stats');
        return {
          totalUsers: 0,
          totalJobs: 0,
          totalMarketplaceItems: 0,
          totalEvents: 0,
          totalEducationPrograms: 0,
          pendingJobApplications: 0,
          pendingEducationInterests: 0,
          pendingVisaApplications: 0,
          activeConversations: 0,
          totalAuPairs: 0,
          totalHostFamilies: 0,
        };
      }

      console.log('Admin stats fetched successfully:', statsData);
      return {
        totalUsers: statsData.totalUsers ?? statsData.user_count ?? 0,
        totalJobs: statsData.totalJobs ?? statsData.job_count ?? 0,
        totalMarketplaceItems: statsData.totalMarketplaceItems ?? statsData.marketplace_count ?? 0,
        totalEvents: statsData.totalEvents ?? statsData.event_count ?? 0,
        totalEducationPrograms: statsData.totalEducationPrograms ?? statsData.education_count ?? 0,
        pendingJobApplications: statsData.pendingJobApplications ?? statsData.pending_job_apps ?? 0,
        pendingEducationInterests: statsData.pendingEducationInterests ?? statsData.pending_education_interests ?? 0,
        pendingVisaApplications: statsData.pendingVisaApplications ?? statsData.pending_visa_apps ?? 0,
        activeConversations: statsData.activeConversations ?? statsData.active_conversations ?? 0,
        totalAuPairs: statsData.totalAuPairs ?? statsData.au_pair_count ?? 0,
        totalHostFamilies: statsData.totalHostFamilies ?? statsData.host_family_count ?? 0,
      };
    } catch (err) {
      console.error('Error in getAdminStats, attempting fallback:', err);
      return this.getAdminStatsFallback();
    }
  },

  /**
   * Manual fallback for when the RPC fails or is missing.
   * Performs individual count queries for each metric.
   */
  async getAdminStatsFallback(): Promise<AdminStats> {
    console.log('Executing manual stats fallback...');
    try {
      // Execute queries in parallel but handle failures individually
      const results = await Promise.allSettled([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('jobs').select('*', { count: 'exact', head: true }).neq('status', 'archived').neq('status', 'draft'),
        supabase.from('marketplace_items').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('events').select('*', { count: 'exact', head: true }).eq('status', 'published'),
        supabase.from('education_resources').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        supabase.from('job_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('education_interests').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('visa_applications').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
        supabase.from('conversations').select('*', { count: 'exact', head: true }).neq('is_blocked', true),
        supabase.from('au_pair_profiles').select('*', { count: 'exact', head: true }).eq('profile_status', 'active'),
        supabase.from('host_family_profiles').select('*', { count: 'exact', head: true }).eq('profile_status', 'active')
      ]);

      const getCount = (result: PromiseSettledResult<any>, label: string) => {
        if (result.status === 'fulfilled') {
          if (result.value.error) {
            console.error(`Error counting ${label}:`, result.value.error);
            return 0;
          }
          return result.value.count || 0;
        } else {
          console.error(`Promise rejected for ${label}:`, result.reason);
          return 0;
        }
      };

      const stats = {
        totalUsers: getCount(results[0], 'users'),
        totalJobs: getCount(results[1], 'jobs'),
        totalMarketplaceItems: getCount(results[2], 'marketplace'),
        totalEvents: getCount(results[3], 'events'),
        totalEducationPrograms: getCount(results[4], 'education'),
        pendingJobApplications: getCount(results[5], 'job_apps'),
        pendingEducationInterests: getCount(results[6], 'edu_interests'),
        pendingVisaApplications: getCount(results[7], 'visa_apps'),
        activeConversations: getCount(results[8], 'conversations'),
        totalAuPairs: getCount(results[9], 'au_pairs'),
        totalHostFamilies: getCount(results[10], 'host_families'),
      };

      console.log('Manual fallback stats completed:', stats);
      return stats;
    } catch (error) {
      console.error('Fatal error fetching fallback stats:', error);
      return {
        totalUsers: 0,
        totalJobs: 0,
        totalMarketplaceItems: 0,
        totalEvents: 0,
        totalEducationPrograms: 0,
        pendingJobApplications: 0,
        pendingEducationInterests: 0,
        pendingVisaApplications: 0,
        activeConversations: 0,
        totalAuPairs: 0,
        totalHostFamilies: 0,
      };
    }
  },

  async getAllUsers(limit: number = 100, offset: number = 0) {
    const { data, error, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return {
      users: data || [],
      total: count || 0,
    };
  },

  async searchUsers(query: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`full_name.ilike.%${query}%`)
      .limit(20);

    if (error) throw error;
    return data || [];
  },

  async deleteUser(userId: string): Promise<void> {
    // Use the custom RPC for safe deletion
    const { error } = await supabase.rpc('admin_delete_user', { target_user_id: userId });

    if (error) {
        console.error('Error deleting user:', error);
        throw error;
    }
    
    await this.logActivity('delete_user', 'profiles', userId);
  },

  async updateUserStatus(userId: string, banned: boolean): Promise<void> {
    const { error } = await supabase
      .from('profiles')
      .update({ is_banned: banned })
      .eq('id', userId);

    if (error) throw error;

    await this.logActivity(
      banned ? 'ban_user' : 'unban_user',
      'profiles',
      userId
    );
  },

  async getContactSubmissions(status?: 'new' | 'read' | 'replied') {
    let query = supabase
      .from('contact_submissions')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async updateContactSubmissionStatus(id: string, status: 'new' | 'read' | 'replied') {
    const { error } = await supabase
      .from('contact_submissions')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    await this.logActivity('update_contact_status', 'contact_submissions', id, { status });
  },

  async assignAdminToConversation(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Check if the current user is already a participant
    const { data: conversation, error: getError } = await supabase
      .from('conversations')
      .select('participant1_id, participant2_id')
      .eq('id', conversationId)
      .single();

    if (getError) throw getError;

    if (conversation.participant1_id === user.id || conversation.participant2_id === user.id) {
      return; // Already a participant
    }

    // Assign current admin as participant2
    const { error: updateError } = await supabase
      .from('conversations')
      .update({ participant2_id: user.id })
      .eq('id', conversationId);

    if (updateError) throw updateError;
    
    await this.logActivity('join_conversation', 'conversations', conversationId);
  },

  // --- Events Management ---
  async getEvents(limit: number = 20, offset: number = 0, status?: string) {
    let query = supabase
      .from('events')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Manual join to avoid missing FK issues
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.organizer_id || i.user_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const eventsWithProfiles = data.map((item: any) => ({
                ...item,
                organizer: profiles?.find((p: any) => p.id === (item.organizer_id || item.user_id))
            }));
            return { data: eventsWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  },

  async updateEventStatus(id: string, status: string) {
    const { error } = await supabase.from('events').update({ status }).eq('id', id);
    if (error) throw error;
    await this.logActivity('update_event_status', 'events', id, { status });
  },

  async deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
    await this.logActivity('delete_event', 'events', id);
  },

  // --- Marketplace Management ---
  async getMarketplaceItems(limit: number = 20, offset: number = 0, status?: string) {
    let query = supabase
      .from('marketplace_items')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Manual join
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.seller_id || i.user_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const itemsWithProfiles = data.map((item: any) => ({
                ...item,
                seller: profiles?.find((p: any) => p.id === (item.seller_id || item.user_id))
            }));
            return { data: itemsWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  },

  async updateMarketplaceItemStatus(id: string, status: string) {
    const { error } = await supabase.from('marketplace_items').update({ status }).eq('id', id);
    if (error) throw error;
    await this.logActivity('update_marketplace_status', 'marketplace_items', id, { status });
  },

  async deleteMarketplaceItem(id: string) {
    const { error } = await supabase.from('marketplace_items').delete().eq('id', id);
    if (error) throw error;
    await this.logActivity('delete_marketplace_item', 'marketplace_items', id);
  },

  async searchMarketplaceItems(query: string) {
    const { data, error, count } = await supabase
      .from('marketplace_items')
      .select('*', { count: 'exact' })
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    // Manual join
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.seller_id || i.user_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const itemsWithProfiles = data.map((item: any) => ({
                ...item,
                seller: profiles?.find((p: any) => p.id === (item.seller_id || item.user_id))
            }));
            return { data: itemsWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  },

  // --- Job Management ---
  async getJobs(limit: number = 20, offset: number = 0, status?: string) {
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Manual join
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.poster_id || i.employer_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const jobsWithProfiles = data.map((item: any) => ({
                ...item,
                employer: profiles?.find((p: any) => p.id === (item.poster_id || item.employer_id))
            }));
            return { data: jobsWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  },

  async updateJobStatus(id: string, status: string) {
    const { error } = await supabase.from('jobs').update({ status }).eq('id', id);
    if (error) throw error;
    await this.logActivity('update_job_status', 'jobs', id, { status });
  },

  async deleteJob(id: string) {
    const { error } = await supabase.from('jobs').delete().eq('id', id);
    if (error) throw error;
    await this.logActivity('delete_job', 'jobs', id);
  },

  // --- Education Management ---
  async getEducationResources(limit: number = 20, offset: number = 0, status?: string) {
    let query = supabase
      .from('education_resources')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Manual join
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.provider_id || i.creator_id || i.user_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const resourcesWithProfiles = data.map((item: any) => ({
                ...item,
                provider: profiles?.find((p: any) => p.id === (item.provider_id || item.creator_id || item.user_id))
            }));
            return { data: resourcesWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  },

  async updateEducationProgramStatus(id: string, status: string) {
    const { error } = await supabase.from('education_resources').update({ status }).eq('id', id);
    if (error) throw error;
    await this.logActivity('update_education_status', 'education_resources', id, { status });
  },

  async deleteEducationProgram(id: string) {
    const { error } = await supabase.from('education_resources').delete().eq('id', id);
    if (error) throw error;
    await this.logActivity('delete_education_program', 'education_resources', id);
  },

  // --- Community Management ---
  async getCommunityPosts(limit: number = 20, offset: number = 0) {
    const { data, error, count } = await supabase
      .from('community_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Manual join
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.author_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const postsWithProfiles = data.map((item: any) => ({
                ...item,
                author: profiles?.find((p: any) => p.id === item.author_id)
            }));
            return { data: postsWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  },

  async deleteCommunityPost(id: string) {
    const { error } = await supabase.from('community_posts').delete().eq('id', id);
    if (error) throw error;
    await this.logActivity('delete_community_post', 'community_posts', id);
  },

  // --- Payment Management ---
  async getPaymentSubmissions(limit: number = 20, offset: number = 0, status?: string) {
    let query = supabase
      .from('payment_submissions')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query;
    if (error) throw error;

    // Manual join
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.user_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const submissionsWithProfiles = data.map((item: any) => ({
                ...item,
                user: profiles?.find((p: any) => p.id === item.user_id)
            }));
            return { data: submissionsWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  },

  async updatePaymentSubmissionStatus(id: string, status: string, notes?: string) {
    // Use the RPC function for safe processing (updating subscription etc.)
    const { data, error } = await supabase.rpc('review_payment_submission', {
      submission_id: id,
      new_status: status,
      notes: notes
    });

    if (error) throw error;
    if (data && !data.success) throw new Error(data.message);
    
    await this.logActivity('review_payment', 'payment_submissions', id, { status, notes });
  },

  async getTransactions(limit: number = 20, offset: number = 0) {
    const { data, error, count } = await supabase
      .from('payments')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Manual join
    if (data && data.length > 0) {
        const userIds = [...new Set(data.map((i: any) => i.user_id))];
        if (userIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .in('id', userIds);
            
            const transactionsWithProfiles = data.map((item: any) => ({
                ...item,
                user: profiles?.find((p: any) => p.id === item.user_id)
            }));
            return { data: transactionsWithProfiles, total: count || 0 };
        }
    }

    return { data: data || [], total: count || 0 };
  }
};
