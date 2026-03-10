-- Fix conversation creation to allow host families to start aupair conversations
-- and add database indexes for fast payment_submissions queries

-- 1. Add missing indexes on payment_submissions for faster admin queries
CREATE INDEX IF NOT EXISTS idx_payment_submissions_status 
  ON payment_submissions(status);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_user_id 
  ON payment_submissions(user_id);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_created_at 
  ON payment_submissions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_payment_submissions_status_created 
  ON payment_submissions(status, created_at DESC);

-- 2. Ensure conversations table RLS allows approved host families to create conversations
-- Drop and recreate to ensure correctness

-- Allow authenticated users to insert into conversations
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow participants to view their conversations
DROP POLICY IF EXISTS "Participants can view conversations" ON conversations;
CREATE POLICY "Participants can view conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Allow participants to update conversations (e.g., last_message_at)
DROP POLICY IF EXISTS "Participants can update conversations" ON conversations;
CREATE POLICY "Participants can update conversations"
  ON conversations FOR UPDATE
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants 
      WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 3. Allow any authenticated user to insert into conversation_participants
DROP POLICY IF EXISTS "Users can add conversation participants" ON conversation_participants;
CREATE POLICY "Users can add conversation participants"
  ON conversation_participants FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow participants to see their own participant records
DROP POLICY IF EXISTS "Users can view own participant records" ON conversation_participants;
CREATE POLICY "Users can view own participant records"
  ON conversation_participants FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- 4. Ensure create_new_conversation RPC exists and allows aupair context type
-- This RPC runs as SECURITY DEFINER so it bypasses RLS for the inserts
CREATE OR REPLACE FUNCTION create_new_conversation(
  p_other_user_id uuid,
  p_context_type text DEFAULT 'support',
  p_context_id uuid DEFAULT NULL,
  p_related_title text DEFAULT NULL,
  p_initial_message text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_user_id uuid;
  v_conversation_id uuid;
  v_message_id uuid;
  v_existing_conv_id uuid;
BEGIN
  v_current_user_id := auth.uid();
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if conversation already exists between these two users
  SELECT cp1.conversation_id INTO v_existing_conv_id
  FROM conversation_participants cp1
  JOIN conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_current_user_id
    AND cp2.user_id = p_other_user_id
  LIMIT 1;

  IF v_existing_conv_id IS NOT NULL THEN
    -- Reuse existing conversation
    v_conversation_id := v_existing_conv_id;
  ELSE
    -- Create new conversation
    INSERT INTO conversations (context_type, context_id, related_item_title)
    VALUES (p_context_type, p_context_id, p_related_title)
    RETURNING id INTO v_conversation_id;

    -- Add both participants
    INSERT INTO conversation_participants (conversation_id, user_id)
    VALUES 
      (v_conversation_id, v_current_user_id),
      (v_conversation_id, p_other_user_id)
    ON CONFLICT DO NOTHING;
  END IF;

  -- Send initial message if provided
  IF p_initial_message IS NOT NULL AND p_initial_message != '' THEN
    INSERT INTO messages (conversation_id, sender_id, content, message_type)
    VALUES (v_conversation_id, v_current_user_id, p_initial_message, 'user')
    RETURNING id INTO v_message_id;

    -- Update last_message_at
    UPDATE conversations SET last_message_at = now(), updated_at = now()
    WHERE id = v_conversation_id;
  END IF;

  RETURN json_build_object(
    'conversation_id', v_conversation_id,
    'message_id', v_message_id
  );
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION create_new_conversation TO authenticated;
