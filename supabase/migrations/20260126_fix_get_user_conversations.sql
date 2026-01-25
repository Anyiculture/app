-- Fix get_user_conversations RPC
-- 1. Uses DISTINCT ON (c.id) to prevent duplicate conversations (fixes React key warning)
-- 2. Improved name resolution using COALESCE with display_name and fallback to email
-- 3. Ensures correct joining with profiles

-- Drop first to allow return type change
DROP FUNCTION IF EXISTS get_user_conversations(uuid);

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
  SELECT DISTINCT ON (c.id)
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
    -- Fallback chain for name: full_name -> display_name -> email
    COALESCE(op.full_name, op.display_name, ou.email) as other_user_full_name,
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
  -- Filter out archived conversations for this user
  INNER JOIN conversation_participants cp ON cp.conversation_id = c.id 
    AND cp.user_id = user_id_param
    AND (cp.is_archived IS FALSE OR cp.is_archived IS NULL)
  -- Join other participants
  INNER JOIN conversation_participants ocp ON ocp.conversation_id = c.id AND ocp.user_id != user_id_param
  INNER JOIN users ou ON ou.id = ocp.user_id
  LEFT JOIN profiles op ON op.id = ou.id
  LEFT JOIN LATERAL (
    SELECT m.content, m.created_at, m.sender_id, m.message_type
    FROM messages m
    WHERE m.conversation_id = c.id AND m.is_deleted = false
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  -- Order by conversation ID for DISTINCT ON, then by last message time
  ORDER BY c.id, c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
