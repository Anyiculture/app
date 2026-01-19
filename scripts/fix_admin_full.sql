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
    AND role IN ('super_admin', 'admin', 'moderator', 'education_admin', 'jobs_admin', 'marketplace_admin', 'events_admin')
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

-- 4. FIX CONVERSATION CONSTRAINTS (Start Conversation Error)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_context_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_context_type_check
  CHECK (context_type IN ('job_application', 'interview', 'support', 'general', 'event', 'job', 'visa', 'education', 'marketplace', 'aupair'));

-- 5. Create helper for admin visa updates if it doesn't exist
CREATE OR REPLACE FUNCTION admin_update_visa_status(
  application_id UUID, 
  new_status TEXT, 
  admin_notes TEXT DEFAULT NULL,
  admin_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSONB;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND is_active = true) THEN
      RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE visa_applications
  SET 
    status = new_status,
    admin_notes = COALESCE(admin_update_visa_status.admin_notes, visa_applications.admin_notes),
    reviewed_at = NOW(),
    reviewed_by = COALESCE(admin_id, auth.uid()),
    updated_at = NOW()
  WHERE id = application_id
  RETURNING to_jsonb(visa_applications.*) INTO result;

  RETURN result;
END;
$$;
