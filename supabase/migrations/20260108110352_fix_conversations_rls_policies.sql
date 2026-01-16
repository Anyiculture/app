/*
  # Fix Conversations RLS Policies

  1. Changes
    - Drop incorrect conversation SELECT policy
    - Create correct conversation SELECT policy (was comparing wrong columns)
    - Add INSERT policies for conversations and conversation_participants
    - Add UPDATE policy for messages (to mark as read)
    - Add UPDATE policy for conversations (to update last_message_at)
    
  2. Security
    - Users can only view conversations they participate in
    - Users can create conversations and add participants
    - Users can mark messages as read
    - System can update conversation timestamps
*/

-- Drop incorrect policy
DROP POLICY IF EXISTS "Conversation participants can view" ON conversations;

-- Create correct policy
CREATE POLICY "Users can view own conversations"
  ON conversations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow creating conversations
CREATE POLICY "Authenticated users can create conversations"
  ON conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow updating conversations (for last_message_at, etc.)
CREATE POLICY "Participants can update conversations"
  ON conversations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversation_participants
      WHERE conversation_participants.conversation_id = conversations.id
        AND conversation_participants.user_id = auth.uid()
    )
  );

-- Allow adding conversation participants
CREATE POLICY "Users can add conversation participants"
  ON conversation_participants
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow updating messages (for marking as read)
CREATE POLICY "Users can update messages in their conversations"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM conversation_participants
      WHERE conversation_participants.conversation_id = messages.conversation_id
        AND conversation_participants.user_id = auth.uid()
    )
  );
