import { supabase } from '../lib/supabase';

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
  otherUserId: string;
  contextType: 'job' | 'aupair' | 'visa' | 'event' | 'marketplace' | 'community' | 'lifestyle' | 'education' | 'support';
  contextId?: string;
  relatedItemTitle?: string;
  initialMessage?: string;
  messageType?: 'user' | 'system';
}

export const messagingService = {
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
   * Get messages for a conversation
   */
  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  },

  /**
   * Create or get existing conversation using Secure RPC
   */
  async createConversationWithMessage(params: CreateConversationParams): Promise<{ conversationId: string; messageId?: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { otherUserId, contextType, contextId, relatedItemTitle, initialMessage } = params;

    // First, check if conversation already exists
    const existingConvId = await this.findExistingConversation(user.id, otherUserId, contextType);
    
    if (existingConvId) {
      // If there's an initial message, send it to the existing conversation
      if (initialMessage) {
        try {
          const message = await this.sendMessage(existingConvId, initialMessage);
          return { conversationId: existingConvId, messageId: message.id };
        } catch (err) {
          console.error('Failed to send message to existing conversation:', err);
        }
      }
      return { conversationId: existingConvId };
    }

    // Use the new Secure RPC function to create new conversation
    const { data, error } = await supabase.rpc('create_new_conversation', {
      p_other_user_id: otherUserId,
      p_context_type: contextType,
      p_context_id: contextId,
      p_related_title: relatedItemTitle,
      p_initial_message: initialMessage
    });

    if (error) {
      console.error('RPC create_new_conversation failed:', error);
      throw error;
    }

    return { conversationId: data.conversation_id };
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

    // Trigger update on conversation (last_message_at)
    // We do this to ensure conversation list is updated
    await supabase.rpc('update_conversation_timestamp', { conversation_id: conversationId });

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
      contextType: (contextType as any) || 'support',
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
};
