-- Fix infinite recursion in admin_roles RLS

-- 1. Create a secure function to check admin status
-- SECURITY DEFINER allows this function to run with the privileges of the creator (usually postgres/superuser)
-- This bypasses RLS on the admin_roles table when executed, breaking the recursion loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = auth.uid()
    AND is_active = true
    AND role IN ('super_admin', 'admin')
  );
$$;

-- 2. Drop existing policies on admin_roles to start fresh
DROP POLICY IF EXISTS "Admins can view all roles" ON admin_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON admin_roles;
-- Drop any other potential policies causing recursion
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON admin_roles;
DROP POLICY IF EXISTS "Allow all access for super_admin" ON admin_roles;

-- 3. Create new, non-recursive policies

-- Policy: Users can view their own role
CREATE POLICY "Users can view their own role"
ON admin_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy: Admins can view all roles (uses the secure function)
CREATE POLICY "Admins can view all roles"
ON admin_roles
FOR SELECT
TO authenticated
USING (
  is_admin()
);

-- Policy: Admins can insert/update/delete roles (uses the secure function)
CREATE POLICY "Admins can manage roles"
ON admin_roles
FOR ALL
TO authenticated
USING (
  is_admin()
)
WITH CHECK (
  is_admin()
);

-- Ensure RLS is enabled
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
