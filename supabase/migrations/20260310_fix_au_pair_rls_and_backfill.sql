-- Fix Au Pair RLS and ensure ownership data is backfilled
-- This migration ensures owner_user_id is backfilled and updates the RLS policy 
-- to allow users with a valid user_id to update their own profiles as a fallback.

-- 1. Ensure owner_user_id is backfilled for all existing profiles that have a user_id
-- We only backfill if both ownership columns are NULL, to avoid violating the single_owner constraint.
UPDATE au_pair_profiles 
SET owner_user_id = user_id, created_by = 'self'
WHERE owner_user_id IS NULL AND owner_admin_id IS NULL AND user_id IS NOT NULL;

UPDATE host_family_profiles 
SET owner_user_id = user_id, created_by = 'self'
WHERE owner_user_id IS NULL AND owner_admin_id IS NULL AND user_id IS NOT NULL;

-- 2. Update RLS policies to be more robust
-- We add (user_id = auth.uid()) as a fallback to (owner_user_id = auth.uid())

DROP POLICY IF EXISTS "Au pairs can update own profile" ON au_pair_profiles;
CREATE POLICY "Au pairs can update own profile"
  ON au_pair_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR owner_user_id = auth.uid())
  WITH CHECK (auth.uid() = user_id OR owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Host families can update own profile" ON host_family_profiles;
CREATE POLICY "Host families can update own profile"
  ON host_family_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR owner_user_id = auth.uid())
  WITH CHECK (auth.uid() = user_id OR owner_user_id = auth.uid());

-- 3. Add an INSERT policy if missing (though usually handled by admin or initial creation)
-- This ensures users can insert their own profile if they don't have one yet.
DROP POLICY IF EXISTS "Users can insert own au pair profile" ON au_pair_profiles;
CREATE POLICY "Users can insert own au pair profile"
  ON au_pair_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own host family profile" ON host_family_profiles;
CREATE POLICY "Users can insert own host family profile"
  ON host_family_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
