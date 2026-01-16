/*
  # Update Messaging System

  ## Overview
  This migration enhances the existing messaging system by adding missing columns
  needed for a complete messaging experience.

  ## Changes
  
  ### messages table
  - Add `read` column (boolean) - Track if message has been read
  
  ### conversations table
  - Add `related_item_title` column (text) - Store title of related item for display

  ## Indexes
  - Add index on updated_at for sorting conversations
  - Add index on read status for unread message queries
*/

-- Add missing columns to messages table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'read'
  ) THEN
    ALTER TABLE messages ADD COLUMN read boolean DEFAULT false;
  END IF;
END $$;

-- Add missing columns to conversations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'conversations' AND column_name = 'related_item_title'
  ) THEN
    ALTER TABLE conversations ADD COLUMN related_item_title text;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Function to automatically update conversation updated_at timestamp when a message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function
DROP TRIGGER IF EXISTS update_conversation_timestamp_trigger ON messages;
CREATE TRIGGER update_conversation_timestamp_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();