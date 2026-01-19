-- =================================================================
-- CORRECTED SCRIPT: FIX ADMIN PERMISSIONS & VISA UPDATES
-- =================================================================

-- 1. FIX ADMIN CHECK FUNCTION
-- Create a secure function to check admin status that bypasses RLS
CREATE OR REPLACE FUNCTION public.check_is_admin()
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
    AND role IN ('super_admin', 'admin', 'moderator', 'education_admin', 'jobs_admin', 'marketplace_admin', 'events_admin')
  );
$$;

-- 2. RESET ADMIN_ROLES POLICIES (Fixing "Already Exists" Error)
-- We drop EVERY possible variation of the policy names to be safe
DROP POLICY IF EXISTS "Users can view own role" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can see own role" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view own admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can see own admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Allow read access for authenticated users" ON public.admin_roles;

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Re-create clean policies
CREATE POLICY "Users can view own role"
ON public.admin_roles FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all roles"
ON public.admin_roles FOR SELECT
TO authenticated
USING (check_is_admin());

CREATE POLICY "Admins can manage roles"
ON public.admin_roles FOR ALL
TO authenticated
USING (check_is_admin())
WITH CHECK (check_is_admin());

-- 3. FIX CONVERSATION CONSTRAINTS (To allow 'visa', 'job' etc.)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_context_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_context_type_check
  CHECK (context_type IN ('job_application', 'interview', 'support', 'general', 'event', 'job', 'visa', 'education', 'marketplace', 'aupair'));

-- 4. CREATE VISA UPDATE HELPER (Bypasses RLS for Status Updates)
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
  -- Check if user is admin using our secure function
  IF NOT check_is_admin() THEN
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
