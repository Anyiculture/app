/*
  # Fix Conversations Schema and RLS
  
  1. Changes
     - Revert schema to use `conversation_participants` table instead of `participant1_id`/`participant2_id` columns to match the `messagingService` logic.
     - Update RLS policies to check the `conversation_participants` table.
*/

-- 1. Revert/Fix RLS Policies for Conversations to use conversation_participants

-- Allow users to view own conversations (checking participants table)
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow authenticated users to create ANY conversation (initial insert)
-- The participants will be added immediately after, securing it.
DROP POLICY IF EXISTS "Users can create conversations" ON conversations;
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow participants to update their conversations (e.g. last_message_at)
DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;
CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
      AND conversation_participants.user_id = auth.uid()
    )
  );


-- 2. Fix RLS Policies for Conversation Participants

ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Allow viewing participants if you are in the conversation
DROP POLICY IF EXISTS "Users can view conversation participants" ON conversation_participants;
CREATE POLICY "Users can view conversation participants"
  ON conversation_participants FOR SELECT
  TO authenticated
  USING (
    -- You can see rows for conversations you are part of
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid()
    )
    -- OR you can see your own row (needed for recursion base case)
    OR user_id = auth.uid()
  );

-- Allow inserting participants (needed when creating a new conversation)
DROP POLICY IF EXISTS "Users can add participants" ON conversation_participants;
CREATE POLICY "Users can add participants"
  ON conversation_participants FOR INSERT
  TO authenticated
  WITH CHECK (true);


-- 3. Fix RLS Policies for Messages

-- Allow viewing messages if you are a participant
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON messages;
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow sending messages if you are a participant
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
      AND conversation_participants.user_id = auth.uid()
    )
  );
