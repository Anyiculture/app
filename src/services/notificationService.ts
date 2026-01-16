import { supabase } from '../lib/supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link_url?: string;
  metadata: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_messages: boolean;
  email_applications: boolean;
  email_events: boolean;
  email_marketplace: boolean;
  email_visa_updates: boolean;
  email_au_pair_matches: boolean;
  in_app_messages: boolean;
  in_app_applications: boolean;
  in_app_events: boolean;
  in_app_marketplace: boolean;
  in_app_visa_updates: boolean;
  in_app_au_pair_matches: boolean;
  created_at: string;
  updated_at: string;
}

export interface Channel {
  unsubscribe: () => void;
  [key: string]: any;
}

export const notificationService = {
  async getNotifications(limit?: number): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getUnreadNotifications(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_read', false)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase.rpc('get_unread_count');

    if (error) {
      console.error('Failed to get unread count:', error);
      return 0;
    }

    return data || 0;
  },

  async markAsRead(notificationId: string): Promise<void> {
    const { error } = await supabase.rpc('mark_notification_read', {
      notification_id: notificationId
    });

    if (error) throw error;
  },

  async markAllAsRead(): Promise<void> {
    const { error } = await supabase.rpc('mark_all_notifications_read');

    if (error) throw error;
  },

  async createNotification(
    userId: string,
    type: string,
    title: string,
    message: string,
    linkUrl?: string,
    metadata?: any
  ): Promise<void> {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link_url: linkUrl,
        metadata: metadata || {},
      });

    if (error) throw error;
  },

  async getPreferences(): Promise<NotificationPreferences | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return this.createDefaultPreferences();
    }

    return data;
  },

  async createDefaultPreferences(): Promise<NotificationPreferences> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert({
        user_id: user.id,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        user_id: user.id,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  async deleteNotification(notificationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  subscribeToNotifications(callback: (payload: any) => void) {
    return supabase.auth.getUser().then(({ data: { user } }: any) => {
      if (!user) return null;

      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          },
          callback
        )
        .subscribe();

      return channel;
    });
  },

  unsubscribeFromNotifications(channel: Channel | null) {
    if (channel) {
      supabase.removeChannel(channel as any);
    }
  },

  async notifyUser(params: {
    userId: string;
    type: string;
    title: string;
    message: string;
    linkUrl?: string;
    metadata?: any;
    sendEmail?: boolean;
    userEmail?: string;
  }): Promise<void> {
    const { data: prefs } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', params.userId)
      .maybeSingle();

    const shouldSendInApp = !prefs || (prefs as any)[`in_app_${params.type}`] !== false;
    const shouldSendEmail = params.sendEmail && params.userEmail &&
                           (!prefs || (prefs as any)[`email_${params.type}`] !== false);

    if (shouldSendInApp) {
      await this.createNotification(
        params.userId,
        params.type,
        params.title,
        params.message,
        params.linkUrl,
        params.metadata
      );
    }

    if (shouldSendEmail) {
      try {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-notification-email`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: params.userEmail,
            subject: params.title,
            text: params.message,
          }),
        });
      } catch (error) {
        console.error('Failed to send email notification:', error);
      }
    }
  },
};
