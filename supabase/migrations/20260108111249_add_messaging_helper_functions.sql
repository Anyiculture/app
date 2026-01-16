/*
  # Add Messaging Helper Functions
  
  1. New Functions
    - get_user_conversations: Efficiently fetch all conversations for a user with participant details
    - get_conversation_messages: Fetch messages for a conversation
    
  2. Purpose
    - Replace complex nested queries with efficient SQL functions
    - Improve performance and reliability
    - Simplify frontend code
*/

-- Function to get all conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_id_param uuid)
RETURNS TABLE (
  id uuid,
  context_type text,
  context_id uuid,
  related_item_title text,
  is_blocked boolean,
  blocked_by uuid,
  created_at timestamptz,
  updated_at timestamptz,
  last_message_at timestamptz,
  other_user_id uuid,
  other_user_email text,
  other_user_full_name text,
  last_message_content text,
  last_message_created_at timestamptz,
  last_message_sender_id uuid,
  last_message_type text,
  unread_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.context_type,
    c.context_id,
    c.related_item_title,
    c.is_blocked,
    c.blocked_by,
    c.created_at,
    c.updated_at,
    c.last_message_at,
    ou.id as other_user_id,
    ou.email as other_user_email,
    COALESCE(op.full_name, op.display_name) as other_user_full_name,
    lm.content as last_message_content,
    lm.created_at as last_message_created_at,
    lm.sender_id as last_message_sender_id,
    lm.message_type::text as last_message_type,
    COALESCE(
      (SELECT COUNT(*)::bigint 
       FROM messages m2 
       WHERE m2.conversation_id = c.id 
         AND m2.sender_id != user_id_param
         AND m2.read = false 
         AND m2.is_deleted = false),
      0
    ) as unread_count
  FROM conversations c
  INNER JOIN conversation_participants cp ON cp.conversation_id = c.id AND cp.user_id = user_id_param
  INNER JOIN conversation_participants ocp ON ocp.conversation_id = c.id AND ocp.user_id != user_id_param
  INNER JOIN users ou ON ou.id = ocp.user_id
  LEFT JOIN profiles op ON op.id = ou.id
  LEFT JOIN LATERAL (
    SELECT content, created_at, sender_id, message_type
    FROM messages
    WHERE conversation_id = c.id AND is_deleted = false
    ORDER BY created_at DESC
    LIMIT 1
  ) lm ON true
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_user_conversations(uuid) TO authenticated;
