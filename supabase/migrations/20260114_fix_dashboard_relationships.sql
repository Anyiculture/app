-- Fix foreign key relationships to allow joining with profiles table
-- This is required for dashboard widgets to display user information (name, avatar)

-- 1. Fix Marketplace Items FK
DO $$
BEGIN
  -- Drop existing constraint if it exists
  ALTER TABLE marketplace_items DROP CONSTRAINT IF EXISTS marketplace_items_user_id_fkey;
  
  -- Add new constraint referencing profiles
  ALTER TABLE marketplace_items
    ADD CONSTRAINT marketplace_items_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
    
  RAISE NOTICE 'Updated marketplace_items foreign key';
END $$;

-- 2. Fix Community Posts FK
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_author_id_fkey;
  
  -- Add new constraint referencing profiles
  ALTER TABLE community_posts
    ADD CONSTRAINT community_posts_author_id_fkey
    FOREIGN KEY (author_id) REFERENCES profiles(id) ON DELETE CASCADE;

  RAISE NOTICE 'Updated community_posts foreign key';
END $$;

-- 3. Fix Events FK
DO $$
BEGIN
  -- Drop existing constraint
  ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
  
  -- Add new constraint referencing profiles
  ALTER TABLE events
    ADD CONSTRAINT events_organizer_id_fkey
    FOREIGN KEY (organizer_id) REFERENCES profiles(id) ON DELETE CASCADE;

  RAISE NOTICE 'Updated events foreign key';
END $$;
