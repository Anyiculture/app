-- Migration: Ensure profiles_jobseeker links to profiles and add unique constraint to user_services

-- Add profile_id to profiles_jobseeker and populate it from user_id if appropriate
ALTER TABLE profiles_jobseeker ADD COLUMN IF NOT EXISTS profile_id uuid;

-- Populate profile_id assuming profile.id == user_id
UPDATE profiles_jobseeker SET profile_id = user_id WHERE profile_id IS NULL AND user_id IS NOT NULL;

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'profiles_jobseeker_profile_id_fkey') THEN
    ALTER TABLE profiles_jobseeker
      ADD CONSTRAINT profiles_jobseeker_profile_id_fkey
      FOREIGN KEY (profile_id) REFERENCES profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add unique constraint on user_services (user_id, service_type) to support upserts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_services_user_service_unique') THEN
    ALTER TABLE user_services
      ADD CONSTRAINT user_services_user_service_unique UNIQUE (user_id, service_type);
  END IF;
END $$;

-- Note: Verify that the assumptions (profile_id = user_id) are correct for your schema before applying.
