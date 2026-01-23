/*
  # Add Listing Ownership Support

  This migration adds ownership tracking to au_pair_profiles and host_family_profiles
  to distinguish between self-created listings and admin-created listings.

  ## Changes
  1. Add ownership columns to both profile tables
  2. Add constraints ensuring exactly one owner is set
  3. Backfill existing records with self-ownership
  4. Add indexes for ownership queries
  5. Update RLS policies to support admin ownership
*/

-- Add ownership columns to au_pair_profiles
ALTER TABLE au_pair_profiles
ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'self' CHECK (created_by IN ('self', 'admin')),
ADD COLUMN IF NOT EXISTS owner_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Add ownership columns to host_family_profiles
ALTER TABLE host_family_profiles
ADD COLUMN IF NOT EXISTS created_by text DEFAULT 'self' CHECK (created_by IN ('self', 'admin')),
ADD COLUMN IF NOT EXISTS owner_admin_id uuid REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS owner_user_id uuid REFERENCES users(id) ON DELETE CASCADE;

-- Backfill existing records with self-ownership (owner_user_id = user_id)
UPDATE au_pair_profiles 
SET owner_user_id = user_id, created_by = 'self'
WHERE owner_user_id IS NULL;

UPDATE host_family_profiles 
SET owner_user_id = user_id, created_by = 'self'
WHERE owner_user_id IS NULL;

-- Add constraint: exactly one owner must be set
-- We use a CHECK constraint to ensure either owner_admin_id OR owner_user_id is set, but not both
ALTER TABLE au_pair_profiles
ADD CONSTRAINT au_pair_profiles_single_owner CHECK (
  (owner_admin_id IS NOT NULL AND owner_user_id IS NULL) OR
  (owner_admin_id IS NULL AND owner_user_id IS NOT NULL)
);

ALTER TABLE host_family_profiles
ADD CONSTRAINT host_family_profiles_single_owner CHECK (
  (owner_admin_id IS NOT NULL AND owner_user_id IS NULL) OR
  (owner_admin_id IS NULL AND owner_user_id IS NOT NULL)
);

-- Add indexes for ownership queries
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_owner_admin 
  ON au_pair_profiles(owner_admin_id) 
  WHERE owner_admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_owner_user 
  ON au_pair_profiles(owner_user_id) 
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_created_by 
  ON au_pair_profiles(created_by);

CREATE INDEX IF NOT EXISTS idx_host_family_profiles_owner_admin 
  ON host_family_profiles(owner_admin_id) 
  WHERE owner_admin_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_host_family_profiles_owner_user 
  ON host_family_profiles(owner_user_id) 
  WHERE owner_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_host_family_profiles_created_by 
  ON host_family_profiles(created_by);

-- Update RLS policies to support admin ownership
-- Drop and recreate admin policies to support admin-owned listings

DROP POLICY IF EXISTS "Admins can manage au pair profiles" ON au_pair_profiles;
CREATE POLICY "Admins can manage au pair profiles" 
  ON au_pair_profiles FOR ALL 
  TO authenticated 
  USING (
    is_admin_internal() AND (
      owner_admin_id = auth.uid() OR 
      owner_admin_id IS NOT NULL OR
      owner_user_id IS NOT NULL
    )
  );

DROP POLICY IF EXISTS "Admins can manage host family profiles" ON host_family_profiles;
CREATE POLICY "Admins can manage host family profiles" 
  ON host_family_profiles FOR ALL 
  TO authenticated 
  USING (
    is_admin_internal() AND (
      owner_admin_id = auth.uid() OR 
      owner_admin_id IS NOT NULL OR
      owner_user_id IS NOT NULL
    )
  );

-- Ensure users can only edit their own self-owned profiles
DROP POLICY IF EXISTS "Au pairs can update own profile" ON au_pair_profiles;
CREATE POLICY "Au pairs can update own profile"
  ON au_pair_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND owner_user_id = auth.uid())
  WITH CHECK (auth.uid() = user_id AND owner_user_id = auth.uid());

DROP POLICY IF EXISTS "Host families can update own profile" ON host_family_profiles;
CREATE POLICY "Host families can update own profile"
  ON host_family_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND owner_user_id = auth.uid())
  WITH CHECK (auth.uid() = user_id AND owner_user_id = auth.uid());

-- Add comments for documentation
COMMENT ON COLUMN au_pair_profiles.created_by IS 'Indicates whether the profile was created by the user themselves (self) or by an admin (admin)';
COMMENT ON COLUMN au_pair_profiles.owner_admin_id IS 'If admin-owned, points to the admin user who owns this listing. Mutually exclusive with owner_user_id.';
COMMENT ON COLUMN au_pair_profiles.owner_user_id IS 'If self-owned, points to the user who owns this listing. Mutually exclusive with owner_admin_id.';

COMMENT ON COLUMN host_family_profiles.created_by IS 'Indicates whether the profile was created by the user themselves (self) or by an admin (admin)';
COMMENT ON COLUMN host_family_profiles.owner_admin_id IS 'If admin-owned, points to the admin user who owns this listing. Mutually exclusive with owner_user_id.';
COMMENT ON COLUMN host_family_profiles.owner_user_id IS 'If self-owned, points to the user who owns this listing. Mutually exclusive with owner_admin_id.';
