-- Fix foreign key constraints for au_pair_profiles and host_family_profiles
-- They incorrectly reference 'users' (which might be missing or empty) instead of 'profiles'

-- Au Pair Profiles
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'au_pair_profiles_user_id_fkey') THEN
    ALTER TABLE au_pair_profiles DROP CONSTRAINT au_pair_profiles_user_id_fkey;
  END IF;
END $$;

ALTER TABLE au_pair_profiles
ADD CONSTRAINT au_pair_profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- Host Family Profiles
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'host_family_profiles_user_id_fkey') THEN
    ALTER TABLE host_family_profiles DROP CONSTRAINT host_family_profiles_user_id_fkey;
  END IF;
END $$;

ALTER TABLE host_family_profiles
ADD CONSTRAINT host_family_profiles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
