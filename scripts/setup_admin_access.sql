-- ==========================================
-- FIX ADMIN DASHBOARD ISSUES & SETUP ACCESS
-- ==========================================

-- 1. FIX INFINITE RECURSION IN ADMIN_ROLES
-- We create a secure function to check admin status without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.check_is_admin(user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE admin_roles.user_id = $1
    AND role IN ('admin', 'super_admin', 'moderator', 'education_admin', 'jobs_admin', 'marketplace_admin', 'events_admin')
    AND is_active = true
  );
END;
$$;

-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "Admins can view all roles" ON admin_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON admin_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON admin_roles;
DROP POLICY IF EXISTS "Users can see own admin roles" ON admin_roles; -- Old one

-- Recreate policies using the secure function
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all roles"
ON admin_roles FOR SELECT
USING (
  auth.uid() = user_id -- User can see their own
  OR
  check_is_admin(auth.uid()) -- Admin can see all
);

CREATE POLICY "Super admins can manage roles"
ON admin_roles FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = auth.uid()
    AND role = 'super_admin'
  )
);


-- 2. FIX CONVERSATION CONSTRAINTS (Start Conversation Error)
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_context_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_context_type_check
  CHECK (context_type IN ('job_application', 'interview', 'support', 'general', 'event', 'job', 'visa', 'education', 'marketplace', 'aupair'));


-- 3. FIX MISSING FOREIGN KEYS (Data Loading Errors)

-- For payment_submissions -> profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payment_submissions_user_id_fkey_profiles'
  ) THEN
    -- Only add if profiles table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE payment_submissions
        ADD CONSTRAINT payment_submissions_user_id_fkey_profiles
        FOREIGN KEY (user_id) REFERENCES profiles(id);
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN RAISE NOTICE 'Could not add FK for payment_submissions';
END $$;

-- For jobs -> profiles_employer
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'employer_id') THEN
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'jobs_employer_id_fkey_profiles_employer'
      ) THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles_employer') THEN
            ALTER TABLE jobs
            ADD CONSTRAINT jobs_employer_id_fkey_profiles_employer
            FOREIGN KEY (employer_id) REFERENCES profiles_employer(id);
        END IF;
      END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN RAISE NOTICE 'Could not add FK for jobs';
END $$;


-- 4. GRANT ADMIN ACCESS & UPDATE PASSWORD (OPTIONAL)
-- Uncomment and edit to grant access to a specific user
/*
DO $$
DECLARE
  target_email TEXT := 'admin@anyiculture.com'; -- <--- CHANGE THIS
  new_password TEXT := 'NewSecurePassword123!'; -- <--- CHANGE THIS
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = target_email;
  
  IF target_user_id IS NOT NULL THEN
    -- A. Grant Admin Role
    INSERT INTO public.admin_roles (user_id, role, permissions)
    VALUES (target_user_id, 'super_admin', '["all"]'::jsonb)
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- B. Update Password
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;
    
    RAISE NOTICE 'Success! Admin access granted.';
  ELSE
    RAISE NOTICE 'User not found.';
  END IF;
END
$$;
*/
