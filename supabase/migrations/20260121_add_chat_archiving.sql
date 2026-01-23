-- Add is_archived column to conversation_participants for soft delete/archiving of chats
ALTER TABLE conversation_participants ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Update RLS policies if necessary (assuming users can update their own participation)
-- Existing policies likely allow update based on user_id.
-- If not, we might need to add a policy for updating is_archived.

-- Example policy update (if needed, but usually basic valid user policy covers it):
-- CREATE POLICY "Users can update their own participation" ON conversation_participants FOR UPDATE USING (auth.uid() = user_id);
