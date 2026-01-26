-- Allow creators to delete their own education resources
DROP POLICY IF EXISTS "Creators can delete own resources" ON education_resources;
CREATE POLICY "Creators can delete own resources"
  ON education_resources FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);

-- Update is_admin_internal to include email domain check for easier dev/admin access
-- This ensures that users with @anyiculture.com emails are treated as admins for RLS policies
CREATE OR REPLACE FUNCTION is_admin_internal()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    -- Check admin options:
    -- 1. Exists in admin_roles table (active)
    (EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = (select auth.uid())
        AND role IN ('super_admin', 'admin')
        AND is_active = true
    ))
    OR
    -- 2. Email domain check (for Anyiculture staff/admins)
    (EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = (select auth.uid())
      AND (email LIKE '%@anyiculture.com' OR email = 'admin@anyiculture.com')
    ));
$$;
