import { supabase } from '../lib/supabase';

export interface UserPresence {
  user_id: string;
  last_seen_at: string;
  is_online: boolean;
  updated_at: string;
}

class PresenceService {
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private readonly HEARTBEAT_INTERVAL = 30000; // 30 seconds
  private isActive = false;

  /**
   * Initialize presence tracking for the current user
   */
  async initialize(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mark user as online
      await this.updatePresence(true);

      // Start heartbeat
      this.startHeartbeat();

      // Mark offline on page unload
      if (typeof window !== 'undefined') {
        window.addEventListener('beforeunload', () => {
          this.cleanup();
        });

        // Handle visibility changes (tab switching)
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) {
            this.pauseHeartbeat();
          } else {
            this.resumeHeartbeat();
          }
        });
      }

      this.isActive = true;
    } catch (error) {
      console.error('Failed to initialize presence:', error);
    }
  }

  /**
   * Update user's presence status
   */
  async updatePresence(isOnline: boolean = true): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          is_online: isOnline,
          last_seen_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Failed to update presence:', error);
      }
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  /**
   * Mark user as offline
   */
  async markOffline(): Promise<void> {
    await this.updatePresence(false);
  }

  /**
   * Get presence status for a specific user
   */
  async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Failed to get user presence:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting user presence:', error);
      return null;
    }
  }

  /**
   * Subscribe to presence changes for a specific user
   */
  subscribeToPresence(userId: string, callback: (presence: UserPresence) => void) {
    return supabase
      .channel(`presence:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_presence',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          if (payload.new) {
            callback(payload.new as UserPresence);
          }
        }
      )
      .subscribe();
  }

  /**
   * Start heartbeat to keep user marked as online
   */
  private startHeartbeat(): void {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      this.updatePresence(true);
    }, this.HEARTBEAT_INTERVAL);
  }

  /**
   * Pause heartbeat (when tab is hidden)
   */
  private pauseHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Resume heartbeat and mark as online
   */
  private resumeHeartbeat(): void {
    this.updatePresence(true);
    this.startHeartbeat();
  }

  /**
   * Cleanup and mark user as offline
   */
  cleanup(): void {
    if (!this.isActive) return;

    this.pauseHeartbeat();
    
    // Mark offline - fire and forget
    this.markOffline().catch(err => {
      console.error('Failed to mark offline on cleanup:', err);
    });

    this.isActive = false;
  }
}

export const presenceService = new PresenceService();
