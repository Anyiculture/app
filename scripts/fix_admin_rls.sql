-- Fix infinite recursion in admin_roles RLS

-- 1. Create a secure function to check admin status that bypasses RLS
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER -- This is key! It runs as the function creator (superuser)
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

-- 2. Drop ALL existing policies on admin_roles to ensure no recursive ones remain
DROP POLICY IF EXISTS "Users can see own admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view own admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow all access for super_admin" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can grant roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can modify roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can delete roles" ON public.admin_roles;

-- 3. Create clean, non-recursive policies

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can ALWAYS see their own role (No recursion, direct ID check)
CREATE POLICY "Users can view own role"
ON public.admin_roles
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
);

-- Policy 2: Admins can view ALL roles (Uses SECURITY DEFINER function to avoid recursion)
CREATE POLICY "Admins can view all roles"
ON public.admin_roles
FOR SELECT
TO authenticated
USING (
  check_is_admin()
);

-- Policy 3: Admins can manage roles (insert/update/delete)
CREATE POLICY "Admins can manage roles"
ON public.admin_roles
FOR ALL
TO authenticated
USING (
  check_is_admin()
)
WITH CHECK (
  check_is_admin()
);
