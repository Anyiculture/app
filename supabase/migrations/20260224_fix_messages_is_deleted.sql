-- Fix is_deleted column on messages table
-- Make sure it defaults to false and update existing nulls to false

DO $$
BEGIN
  -- Add column if it doesn't somehow exist, though it likely does
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'messages' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE messages ADD COLUMN is_deleted boolean DEFAULT false;
  ELSE
    -- If it does exist, ensure it has the correct default
    ALTER TABLE messages ALTER COLUMN is_deleted SET DEFAULT false;
  END IF;
END $$;

-- Update any existing messages where is_deleted is null
UPDATE messages SET is_deleted = false WHERE is_deleted IS NULL;
