-- Add explicit FK with CASCADE for saved_profile_id if not exists or replace it
ALTER TABLE au_pair_saved_profiles
DROP CONSTRAINT IF EXISTS au_pair_saved_profiles_saved_profile_id_fkey;

ALTER TABLE au_pair_saved_profiles
ADD CONSTRAINT au_pair_saved_profiles_saved_profile_id_fkey
FOREIGN KEY (saved_profile_id)
REFERENCES au_pair_profiles(id)
ON DELETE CASCADE;
