/*
  # Radical Fix for Messaging RLS - Security Definer Functions
  
  The previous approach with recursive policies on `conversation_participants` caused infinite recursion (Error 42P17).
  The radical solution is to use SECURITY DEFINER functions for all sensitive operations.
  This bypasses RLS for the function's execution, allowing us to perform complex logic safely without recursion.
  
  1. Disable RLS on tables where we will rely solely on Functions (or keep basic RLS but use functions for complex ops).
  2. Create `create_conversation` function.
  3. Create `send_message` function.
  4. Simplify RLS policies for simple SELECTs.
  5. FIX AMBIGUOUS COLUMNS in get_user_conversations
*/

-- 1. Simplify Conversation Participants Policy (Avoid Recursion)
-- Just allow users to see their own participant rows.
-- For seeing OTHER participants, we will rely on the `get_user_conversations` RPC which is already SECURITY DEFINER.

DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
DROP POLICY IF EXISTS "Users can view own participant rows" ON conversation_participants;
CREATE POLICY "Users can view own participant rows"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 2. Function to Create Conversation
-- This handles inserting into `conversations` AND `conversation_participants` atomically and securely.
CREATE OR REPLACE FUNCTION create_new_conversation(
  p_other_user_id uuid,
  p_context_type text DEFAULT NULL,
  p_context_id uuid DEFAULT NULL,
  p_related_title text DEFAULT NULL,
  p_initial_message text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of creator (postgres/admin)
SET search_path = public
AS $$
DECLARE
  v_conv_id uuid;
  v_msg_id uuid;
  v_current_user_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  
  -- Check if conversation already exists
  SELECT cp1.conversation_id INTO v_conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_current_user_id
    AND cp2.user_id = p_other_user_id
    AND (p_context_type IS NULL OR EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = cp1.conversation_id 
      AND c.context_type = p_context_type
      AND (p_context_id IS NULL OR c.context_id = p_context_id)
    ))
  LIMIT 1;

  -- If exists, just return it
  IF v_conv_id IS NOT NULL THEN
    -- Optional: Send initial message if provided and conversation exists
    IF p_initial_message IS NOT NULL THEN
       PERFORM send_message_secure(v_conv_id, p_initial_message);
    END IF;
    
    RETURN json_build_object('conversation_id', v_conv_id, 'is_new', false);
  END IF;

  -- Create new conversation
  INSERT INTO conversations (context_type, context_id, related_item_title)
  VALUES (p_context_type, p_context_id, p_related_title)
  RETURNING id INTO v_conv_id;

  -- Ensure user exists in local users table before adding as participant
  -- This handles the "Key (user_id) is not present in table users" error
  
  -- Force sync for other user
  INSERT INTO users (id, email, created_at, updated_at)
  SELECT id, email, created_at, updated_at
  FROM auth.users
  WHERE id = p_other_user_id
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email; -- Update email just in case

  -- Force sync for current user
  INSERT INTO users (id, email, created_at, updated_at)
  SELECT id, email, created_at, updated_at
  FROM auth.users
  WHERE id = v_current_user_id
  ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email;

  -- Add participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conv_id, v_current_user_id),
    (v_conv_id, p_other_user_id);

  -- Send initial message if provided
  IF p_initial_message IS NOT NULL THEN
    PERFORM send_message_secure(v_conv_id, p_initial_message);
  END IF;

  RETURN json_build_object('conversation_id', v_conv_id, 'is_new', true);
END;
$$;

-- 3. Function to Send Message Securely
CREATE OR REPLACE FUNCTION send_message_secure(
  p_conversation_id uuid,
  p_content text,
  p_message_type text DEFAULT 'user'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_msg_id uuid;
  v_sender_id uuid;
BEGIN
  v_sender_id := auth.uid();

  -- Verify participation
  IF NOT EXISTS (
    SELECT 1 FROM conversation_participants 
    WHERE conversation_id = p_conversation_id AND user_id = v_sender_id
  ) THEN
    RAISE EXCEPTION 'User is not a participant in this conversation';
  END IF;

  INSERT INTO messages (conversation_id, sender_id, content, message_type)
  VALUES (p_conversation_id, v_sender_id, p_content, p_message_type::message_type)
  RETURNING id INTO v_msg_id;

  -- Update conversation timestamp
  UPDATE conversations 
  SET last_message_at = now() 
  WHERE id = p_conversation_id;

  RETURN v_msg_id;
END;
$$;

-- 4. Grant Permissions
GRANT EXECUTE ON FUNCTION create_new_conversation TO authenticated;
GRANT EXECUTE ON FUNCTION send_message_secure TO authenticated;

-- 5. FIX get_user_conversations AMBIGUITY
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
    SELECT m.content, m.created_at, m.sender_id, m.message_type
    FROM messages m
    WHERE m.conversation_id = c.id AND m.is_deleted = false
    ORDER BY m.created_at DESC
    LIMIT 1
  ) lm ON true
  ORDER BY c.last_message_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_user_conversations(uuid) TO authenticated;
