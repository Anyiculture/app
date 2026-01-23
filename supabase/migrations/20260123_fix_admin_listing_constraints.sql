-- Relax user_id constraints to allow multiple admin-owned listings
-- Admin-owned listings will have user_id = null (or a placeholder) 
-- while self-owned listings must have a user_id.

DO $$ 
BEGIN
  -- 1. Drop the existing UNIQUE constraint on user_id as it prevents multiple NULLs or multiple admin entries
  -- Note: In Postgres, multiple NULLs are allowed in a UNIQUE constraint, 
  -- but our current code was inserting the admin's user_id as a placeholder, causing the conflict.
  
  -- We'll modify the tables to allow user_id to be NULL for admin-owned listings.
  ALTER TABLE au_pair_profiles ALTER COLUMN user_id DROP NOT NULL;
  ALTER TABLE host_family_profiles ALTER COLUMN user_id DROP NOT NULL;

  -- 2. Add a check constraint to ensure self-owned listings have a user_id
  ALTER TABLE au_pair_profiles DROP CONSTRAINT IF EXISTS check_self_owned_has_user;
  ALTER TABLE au_pair_profiles ADD CONSTRAINT check_self_owned_has_user 
    CHECK (created_by != 'self' OR user_id IS NOT NULL);

  ALTER TABLE host_family_profiles DROP CONSTRAINT IF EXISTS check_self_owned_has_user;
  ALTER TABLE host_family_profiles ADD CONSTRAINT check_self_owned_has_user 
    CHECK (created_by != 'self' OR user_id IS NOT NULL);

END $$;
