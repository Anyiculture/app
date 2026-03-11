import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';

export type ConversationContextType =
  | 'job'
  | 'aupair'
  | 'visa'
  | 'event'
  | 'marketplace'
  | 'community'
  | 'lifestyle'
  | 'education'
  | 'support'
  | 'violation'
  | 'account'
  | 'payment'
  | 'general';

export interface Meeting {
  id: string;
  conversation_id: string;
  organizer_id: string;
  recipient_id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  meeting_link?: string;
  platform?: string;
  location?: string;
  created_at: string;
}

export interface Attachment {
  url: string;
  type: string; // 'image', 'video', 'file'
  name: string;
}

export interface Conversation {
  id: string;
  context_type: string | null;
  context_id: string | null;
  related_item_title: string | null;
  is_blocked: boolean;
  blocked_by: string | null;
  created_at: string;
  updated_at: string;
  last_message_at: string;
  other_user: {
    id: string;
    email: string;
    full_name?: string;
    avatar_url?: string;
  };
  last_message?: {
    content: string;
    created_at: string;
    sender_id: string;
    message_type: 'user' | 'system' | 'admin';
  };
  unread_count: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  message_type: 'user' | 'system' | 'admin';
  created_at: string;
  read: boolean;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  meeting_id?: string;
}

export interface CreateConversationParams {
  otherUserId?: string; // Made optional - will be resolved from profile if not provided
  contextType: ConversationContextType;
  contextId?: string;
  relatedItemTitle?: string;
  initialMessage?: string;
  messageType?: 'user' | 'system' | 'admin';
  profileType?: 'au_pair' | 'family'; // Used with contextType 'aupair' to resolve recipient
  useAdminTarget?: boolean;
}

export const messagingService = {
  getConversationErrorMessage(error: unknown, fallback = 'Failed to start conversation'): string {
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (((error as { code?: unknown }).code === 'PGRST202') ||
        ((error as { code?: unknown }).code === '42883')) &&
      'message' in error &&
      typeof (error as { message?: unknown }).message === 'string'
    ) {
      const message = (error as { message: string }).message;
      if (
        /get_or_create_direct_conversation|get_support_admin_user_id|create_new_conversation/i.test(
          message
        )
      ) {
        return 'Database migration missing for conversation creation. Run the messaging SQL and reload the Supabase schema cache.';
      }
    }

    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (error && typeof error === 'object' && 'message' in error) {
      const message = (error as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim()) {
        return message;
      }
    }

    return fallback;
  },

  isUuidLike(value?: string | null): boolean {
    if (!value) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value
    );
  },

  isMissingRpcError(error: unknown, rpcName: string): boolean {
    if (!error || typeof error !== 'object') return false;

    const code = 'code' in error ? (error as { code?: unknown }).code : undefined;
    const message = 'message' in error ? (error as { message?: unknown }).message : undefined;

    if (code !== 'PGRST202' && code !== '42883') {
      return false;
    }

    return typeof message === 'string' && new RegExp(rpcName, 'i').test(message);
  },

  async resolveSupportAdminTarget(): Promise<string> {
    const { data, error } = await supabase.rpc('get_support_admin_user_id');

    if (error) {
      if (this.isMissingRpcError(error, 'get_support_admin_user_id')) {
        throw new Error(
          'Database migration missing for support chat routing. Run the conversation creation SQL and reload the Supabase schema cache.'
        );
      }

      throw error;
    }

    if (!data || typeof data !== 'string') {
      throw new Error('No admin account is configured for support conversations');
    }

    return data;
  },

  async createConversationWithLegacyRpc(params: {
    otherUserId?: string;
    contextType: ConversationContextType;
    contextId?: string;
    relatedItemTitle?: string;
    initialMessage?: string;
    messageType?: 'user' | 'system' | 'admin';
    useAdminTarget?: boolean;
  }): Promise<{ conversationId: string; messageId?: string }> {
    let targetUserId = params.otherUserId;

    if (!targetUserId && params.useAdminTarget) {
      targetUserId = await this.resolveSupportAdminTarget();
    }

    if (!targetUserId) {
      throw new Error('Target user could not be resolved for conversation creation');
    }

    const inlineInitialMessage =
      (params.messageType || 'user') === 'user' ? params.initialMessage || null : null;

    const { data, error } = await supabase.rpc('create_new_conversation', {
      p_other_user_id: targetUserId,
      p_context_type: params.contextType,
      p_context_id: params.contextId || null,
      p_related_title: params.relatedItemTitle || null,
      p_initial_message: inlineInitialMessage,
    });

    if (error) {
      if (this.isMissingRpcError(error, 'create_new_conversation')) {
        throw new Error(
          'Database migration missing for conversation creation. Run the messaging SQL and reload the Supabase schema cache.'
        );
      }

      throw error;
    }

    const conversationId =
      data && typeof data === 'object' && 'conversation_id' in data
        ? (data as { conversation_id?: string }).conversation_id
        : undefined;

    if (!conversationId) {
      throw new Error('Legacy conversation RPC did not return a conversation ID');
    }

    let messageId =
      data && typeof data === 'object' && 'message_id' in data
        ? (data as { message_id?: string }).message_id
        : undefined;

    if (!inlineInitialMessage && params.initialMessage?.trim()) {
      const sentMessage = await this.sendMessage(
        conversationId,
        params.initialMessage.trim(),
        params.messageType || 'user'
      );
      messageId = sentMessage.id;
    }

    return { conversationId, messageId };
  },

  /**
   * Get all conversations for current user using SQL function
   */
  async getConversations(): Promise<Conversation[]> {
    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        console.warn('Auth check failed in getConversations:', authError);
        return [];
      }

      const { data, error } = await supabase.rpc('get_user_conversations', {
        user_id_param: user.id
      });

      if (error) {
        console.warn('RPC call failed, returning empty conversations:', error);
        return [];
      }

      if (!data || data.length === 0) return [];

      return data.map((row: any) => ({
        id: row.id,
        context_type: row.context_type,
        context_id: row.context_id,
        related_item_title: row.related_item_title,
        is_blocked: row.is_blocked,
        blocked_by: row.blocked_by,
        created_at: row.created_at,
        updated_at: row.updated_at,
        last_message_at: row.last_message_at,
        other_user: {
          id: row.other_user_id,
          email: row.other_user_email,
          full_name: row.other_user_full_name || undefined,
          avatar_url: row.other_user_avatar_url || undefined
        },
        last_message: row.last_message_content ? {
          content: row.last_message_content,
          created_at: row.last_message_created_at,
          sender_id: row.last_message_sender_id,
          message_type: row.last_message_type,
        } : undefined,
        unread_count: Number(row.unread_count) || 0,
      }));
    } catch (error) {
      console.error('Failed to get conversations:', error);
      return [];
    }
  },

  /**
   * Resolve the recipient user ID for a profile based on ownership
   * For admin-owned profiles, returns the owning admin ID
   * For self-owned profiles, returns the owning user ID
   */
  async resolveRecipientForProfile(profileType: 'au_pair' | 'family', profileId: string): Promise<string | null> {
    try {
      const tableName = profileType === 'au_pair' ? 'au_pair_profiles' : 'host_family_profiles';
      
      const { data, error } = await supabase
        .from(tableName)
        .select('created_by, owner_admin_id, owner_user_id, user_id')
        .eq('id', profileId)
        .maybeSingle();

      if (error || !data) {
        console.error(`Failed to resolve recipient for ${profileType} profile ${profileId}:`, error);
        return null;
      }

      // Return the appropriate owner based on created_by
      if (data.created_by === 'admin' && data.owner_admin_id) {
        return data.owner_admin_id;
      } else if (data.created_by === 'self' && data.owner_user_id) {
        return data.owner_user_id;
      }

      if (data.user_id) {
        return data.user_id;
      }

      console.warn(`Profile ${profileId} has invalid ownership data:`, data);
      return null;
    } catch (error) {
      console.error('Failed to resolve recipient:', error);
      return null;
    }
  },

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .or('is_deleted.is.null,is_deleted.eq.false')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  },

  /**
   * Start an admin conversation with a system message
   */
  async startAdminConversation(
    userId: string,
    contextType: ConversationContextType = 'support',
    systemMessage?: string
  ): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Reuse existing createConversationWithMessage logic which handles RPC
    const result = await this.createConversationWithMessage({
      otherUserId: userId,
      contextType: contextType,
      initialMessage: systemMessage,
      messageType: 'system'
    });

    return result.conversationId;
  },

  async contactAdmin(params?: {
    contextType?: ConversationContextType;
    contextId?: string;
    relatedItemTitle?: string;
    initialMessage?: string;
    messageType?: 'user' | 'system' | 'admin';
  }): Promise<string> {
    const result = await this.createConversationWithMessage({
      contextType: params?.contextType || 'support',
      contextId: params?.contextId,
      relatedItemTitle: params?.relatedItemTitle,
      initialMessage: params?.initialMessage,
      messageType: params?.messageType || 'user',
      useAdminTarget: true,
    });

    return result.conversationId;
  },

  /**
   * Create or get existing conversation using Secure RPC
   */
  async createConversationWithMessage(params: CreateConversationParams): Promise<{ conversationId: string; messageId?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let { otherUserId, contextType, contextId, relatedItemTitle, initialMessage, profileType, messageType, useAdminTarget } = params;

    const shouldResolveFromProfile =
      contextType === 'aupair' &&
      contextId &&
      profileType &&
      (!this.isUuidLike(otherUserId || null));

    // Resolve recipient if dealing with aupair profiles and recipient is missing/invalid
    if (shouldResolveFromProfile) {
      const resolvedUserId = await this.resolveRecipientForProfile(profileType, contextId);
      if (!resolvedUserId) {
        throw new Error(`Failed to resolve recipient for ${profileType} profile ${contextId}`);
      }
      otherUserId = resolvedUserId;
    }

    if (!otherUserId && !useAdminTarget) {
      throw new Error('otherUserId is required or must be resolvable from profile');
    }

    const { data, error } = await supabase.rpc('get_or_create_direct_conversation', {
      p_target_user_id: otherUserId || null,
      p_context_type: contextType,
      p_context_id: contextId || null,
      p_related_title: relatedItemTitle || null,
      p_initial_message: initialMessage || null,
      p_initial_message_type: messageType || 'user',
      p_resolve_admin_target: Boolean(useAdminTarget),
    });

    if (error) {
      console.error('RPC get_or_create_direct_conversation failed:', error);

      if (this.isMissingRpcError(error, 'get_or_create_direct_conversation')) {
        return this.createConversationWithLegacyRpc({
          otherUserId,
          contextType,
          contextId,
          relatedItemTitle,
          initialMessage,
          messageType,
          useAdminTarget,
        });
      }

      throw error;
    }

    if (!data?.conversation_id) {
      throw new Error('Conversation could not be created');
    }

    return { conversationId: data.conversation_id, messageId: data.message_id || undefined };
  },

  /**
   * Send a message
   * Uses direct insert for attachments or complex types, RPC for simple texts if needed (for now using direct insert mostly to support full feature set)
   */
  async sendMessage(
    conversationId: string,
    content: string,
    messageType: 'user' | 'system' | 'admin' = 'user',
    attachments?: Attachment[],
    meetingId?: string
  ): Promise<Message> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Prepare message object
    const messageData = {
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || (attachments?.length ? 'Sent an attachment' : 'Sent a message'),
      message_type: messageType,
      is_deleted: false,
      attachment_url: attachments?.[0]?.url || null,
      attachment_type: attachments?.[0]?.type || null,
      attachment_name: attachments?.[0]?.name || null,
      meeting_id: meetingId || null
    };

    // We use direct insert to support all columns including new ones
    const { data, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;

    // Message creation is the primary operation. Conversation activity refresh is best-effort
    // because older deployments may not expose the callable RPC signature yet.
    const { error: timestampError } = await supabase.rpc('update_conversation_timestamp', {
      conversation_id: conversationId,
    });

    if (timestampError) {
      console.warn('Non-blocking conversation timestamp refresh failed:', timestampError);
    }

    // Send notification to the recipient
    // We run this asynchronously to not block the response
    (async () => {
      try {
        const { data: participants } = await supabase
          .from('conversation_participants')
          .select('user_id')
          .eq('conversation_id', conversationId)
          .neq('user_id', user.id)
          .single();

        if (participants) {
            const notificationTitle = messageType === 'system' ? 'System Notification' : 'New Message';
            
            await notificationService.notifyUser({
              userId: participants.user_id,
              type: 'messages',
              title: notificationTitle,
              message: content.length > 50 ? content.substring(0, 50) + '...' : content,
              linkUrl: `/messages?conversation=${conversationId}`,
            });
          }
      } catch (err) {
        console.error('Failed to send message notification:', err);
      }
    })();

    return data as Message;
  },

  /**
   * Upload an attachment
   */
  async uploadAttachment(file: File): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('chat-attachments')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('chat-attachments')
      .getPublicUrl(filePath);

    return data.publicUrl;
  },

  /**
   * Create a Meeting
   */
  async createMeeting(params: {
    conversationId: string;
    recipientId: string;
    title: string;
    startTime: Date;
    endTime: Date;
    description?: string;
    platform?: string;
    location?: string;
  }): Promise<Meeting> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Fallback: Embed platform/location in description if columns don't exist yet
    // We try to insert with columns first, if that fails (schema mismatch), we fallback to description
    // BUT since we can't easily try/catch the SQL error without potentially failing the request or making it slow,
    // we will just APPEND to description for now as a safe bet, and try to insert columns too. 
    // If the columns don't exist, Supabase will ignore extra fields if we use strict: false? No, it throws error.
    
    // Safer approach: Always append to description for now to ensure data persistence without migration
    let description = params.description || '';
    if (params.platform) description += `\n\n[Platform: ${params.platform}]`;
    if (params.location) description += `\n[Location: ${params.location}]`;

    // Try to insert WITHOUT the new columns first to ensure it works
    const { data, error } = await supabase
      .from('meetings')
      .insert({
        conversation_id: params.conversationId,
        organizer_id: user.id,
        recipient_id: params.recipientId,
        title: params.title,
        description: description, // Contains the embedded data
        start_time: params.startTime.toISOString(),
        end_time: params.endTime.toISOString(),
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
        // If it was a different error, throw it
        throw error;
    }

    // Send a system message announcing the meeting
    const meetingTime = params.startTime.toLocaleString();
    const platformInfo = params.platform ? ` via ${params.platform}` : '';
    await this.sendMessage(
      params.conversationId,
      `Scheduled a meeting: ${params.title} on ${meetingTime}${platformInfo}`,
      'system',
      undefined,
      data.id
    );

    return this.unpackMeetingData(data) as Meeting;
  },

  unpackMeetingData(meeting: any): Meeting {
      let description = meeting.description || '';
      let platform = meeting.platform; // might be undefined if column doesn't exist
      let location = meeting.location;

      // Extract from description if not in columns
      if (!platform) {
          const platformMatch = description.match(/\[Platform: (.*?)\]/);
          if (platformMatch) {
              platform = platformMatch[1];
              description = description.replace(platformMatch[0], '').trim();
          }
      }

      if (!location) {
          const locationMatch = description.match(/\[Location: (.*?)\]/);
          if (locationMatch) {
              location = locationMatch[1];
              description = description.replace(locationMatch[0], '').trim();
          }
      }

      return {
          ...meeting,
          description,
          platform,
          location
      };
  },

  /**
   * Get meeting details
   */
  async getMeeting(meetingId: string): Promise<Meeting | null> {
    const { data, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', meetingId)
      .single();

    if (error) {
      console.error('Failed to get meeting:', error);
      return null;
    }

    return this.unpackMeetingData(data);
  },

  /**
   * Find existing conversation between two users
   */
  async findExistingConversation(userId: string, otherUserId: string, contextType?: string): Promise<string | null> {
    try {
      const { data: userConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userId);

      if (!userConvs || userConvs.length === 0) return null;

      const conversationIds = userConvs.map((c: any) => c.conversation_id);

      const { data: otherUserConvs } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', otherUserId)
        .in('conversation_id', conversationIds);

      if (!otherUserConvs || otherUserConvs.length === 0) return null;

      if (contextType) {
         // If context is strict, we check conversations table
         // For now, we return the first common conversation to avoid duplicates
         // In a stricter system we might filter by context_type
         return otherUserConvs[0].conversation_id;
      }

      return otherUserConvs[0].conversation_id;
    } catch (error) {
      console.error('Failed to find existing conversation:', error);
      return null;
    }
  },

  /**
   * Subscribe to new messages in a conversation
   */
  subscribeToMessages(conversationId: string, callback: (message: Message) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload: any) => {
          callback(payload.new as Message);
        }
      )
      .subscribe();
  },

  /**
   * Legacy method for backward compatibility
   */
  async getOrCreateConversation(
    otherUserId: string,
    contextType?: string,
    contextId?: string,
    relatedItemTitle?: string
  ): Promise<string> {
    const result = await this.createConversationWithMessage({
      otherUserId,
      contextType: (contextType as ConversationContextType) || 'support',
      contextId,
      relatedItemTitle,
    });
    return result.conversationId;
  },

  /**
   * Mark messages as read
   */
  async markMessagesAsRead(conversationId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .eq('read', false);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  },

  /**
   * Delete (archive) a conversation
   */
  async deleteConversation(conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    type ArchiveConversationResult = {
      success?: boolean;
      message?: string;
    };

    const { data: archiveResult, error: archiveError } = await supabase.rpc('archive_conversation', {
      conversation_id_param: conversationId,
    });

    if (!archiveError) {
      const result = (archiveResult ?? {}) as ArchiveConversationResult;
      if (result.success === false) {
        throw new Error(result.message || 'Failed to archive conversation');
      }
      return;
    }

    // Backward-compatible fallback for environments that do not yet have the RPC.
    const rpcMissing =
      archiveError.code === 'PGRST202' ||
      archiveError.code === '42883' ||
      /archive_conversation/i.test(archiveError.message || '');

    if (!rpcMissing) {
      throw archiveError;
    }

    const { data: updatedRows, error: fallbackError } = await supabase
      .from('conversation_participants')
      .update({ is_archived: true })
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .select('conversation_id');

    if (fallbackError) throw fallbackError;
    if (!updatedRows || updatedRows.length === 0) {
      throw new Error('Conversation not found or already archived');
    }
  },
};
