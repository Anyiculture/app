/*
  # Fix Foreign Key References to auth.users
  
  ## Problem
  Multiple tables have foreign keys referencing a custom `users` table that's empty.
  This breaks posting functionality as inserts fail foreign key constraints.
  
  ## Solution
  1. Drop incorrect foreign key constraints
  2. Recreate them pointing to auth.users (the actual Supabase auth users table)
  3. Sync data from auth.users to local users table for reference
  
  ## Affected Tables
  - community_posts (author_id)
  - community_comments (author_id)
  - community_likes (user_id)
  - jobs (poster_id)
  - events (organizer_id)
  - education_resources (creator_id)
  
  ## Security
  All RLS policies remain unchanged
*/

-- First, populate the users table from auth.users
INSERT INTO users (id, email, created_at, updated_at)
SELECT id, email, created_at, updated_at
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Drop and recreate foreign keys for community_posts
ALTER TABLE community_posts DROP CONSTRAINT IF EXISTS community_posts_author_id_fkey;
ALTER TABLE community_posts 
  ADD CONSTRAINT community_posts_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate foreign keys for community_comments
ALTER TABLE community_comments DROP CONSTRAINT IF EXISTS community_comments_author_id_fkey;
ALTER TABLE community_comments 
  ADD CONSTRAINT community_comments_author_id_fkey 
  FOREIGN KEY (author_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate foreign keys for community_likes
ALTER TABLE community_likes DROP CONSTRAINT IF EXISTS community_likes_user_id_fkey;
ALTER TABLE community_likes 
  ADD CONSTRAINT community_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate foreign keys for jobs
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_poster_id_fkey;
ALTER TABLE jobs 
  ADD CONSTRAINT jobs_poster_id_fkey 
  FOREIGN KEY (poster_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate foreign keys for events
ALTER TABLE events DROP CONSTRAINT IF EXISTS events_organizer_id_fkey;
ALTER TABLE events 
  ADD CONSTRAINT events_organizer_id_fkey 
  FOREIGN KEY (organizer_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop and recreate foreign keys for education_resources
ALTER TABLE education_resources DROP CONSTRAINT IF EXISTS education_resources_creator_id_fkey;
ALTER TABLE education_resources 
  ADD CONSTRAINT education_resources_creator_id_fkey 
  FOREIGN KEY (creator_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create a trigger to keep users table in sync with auth.users
CREATE OR REPLACE FUNCTION sync_users_from_auth()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO users (id, email, created_at, updated_at)
    VALUES (NEW.id, NEW.email, NEW.created_at, NOW())
    ON CONFLICT (id) DO UPDATE
    SET email = EXCLUDED.email, updated_at = NOW();
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE users 
    SET email = NEW.email, updated_at = NOW()
    WHERE id = NEW.id;
  ELSIF TG_OP = 'DELETE' THEN
    DELETE FROM users WHERE id = OLD.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS sync_users_trigger ON auth.users;
CREATE TRIGGER sync_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION sync_users_from_auth();
