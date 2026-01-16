-- Migration: Add foreign key from profiles_jobseeker to profiles
ALTER TABLE profiles_jobseeker
ADD COLUMN IF NOT EXISTS profile_id uuid;
ALTER TABLE profiles_jobseeker
ADD CONSTRAINT fk_profiles FOREIGN KEY (profile_id) REFERENCES profiles(id);
-- Ensure profile_id is populated for existing rows if needed
-- UPDATE profiles_jobseeker SET profile_id = ... WHERE ...;
