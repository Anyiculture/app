-- Comprehensive Admin Permissions Migration
-- Grants Admins access to view and manage all key tables.
-- Also adds the admin_delete_user function.

-- 1. Helper function for admin check (re-used for consistency)
CREATE OR REPLACE FUNCTION is_admin_internal()
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = (select auth.uid())
      AND role IN ('super_admin', 'admin')
      AND is_active = true
  );
$$;

-- 2. Admin Delete User Function (Soft delete via profile, hard delete restricted)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check authorization
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Log the action
  INSERT INTO admin_activity_log (admin_id, action, resource_type, resource_id)
  VALUES (auth.uid(), 'delete_user', 'profiles', target_user_id);

  -- Delete from public.profiles. 
  -- This effectively removes the user from the application logic.
  -- The auth.users record will remain but be orphaned/unusable for app data.
  DELETE FROM public.profiles WHERE id = target_user_id;
END;
$$;

-- 3. RLS Policies for Education
DO $$
BEGIN
  -- education_interests
  DROP POLICY IF EXISTS "Admins can view all interests" ON education_interests;
  CREATE POLICY "Admins can view all interests" ON education_interests FOR SELECT TO authenticated USING (is_admin_internal());

  DROP POLICY IF EXISTS "Admins can update interests" ON education_interests;
  CREATE POLICY "Admins can update interests" ON education_interests FOR UPDATE TO authenticated USING (is_admin_internal());

  -- education_resources
  DROP POLICY IF EXISTS "Admins can manage resources" ON education_resources;
  CREATE POLICY "Admins can manage resources" ON education_resources FOR ALL TO authenticated USING (is_admin_internal());
END $$;

-- 4. RLS Policies for Au Pair / Host Family
DO $$
BEGIN
  -- au_pair_profiles
  DROP POLICY IF EXISTS "Admins can manage au pair profiles" ON au_pair_profiles;
  CREATE POLICY "Admins can manage au pair profiles" ON au_pair_profiles FOR ALL TO authenticated USING (is_admin_internal());

  -- host_family_profiles
  DROP POLICY IF EXISTS "Admins can manage host family profiles" ON host_family_profiles;
  CREATE POLICY "Admins can manage host family profiles" ON host_family_profiles FOR ALL TO authenticated USING (is_admin_internal());
END $$;

-- 5. RLS Policies for Jobs
DO $$
BEGIN
  -- jobs
  DROP POLICY IF EXISTS "Admins can manage jobs" ON jobs;
  CREATE POLICY "Admins can manage jobs" ON jobs FOR ALL TO authenticated USING (is_admin_internal());

  -- job_applications
  DROP POLICY IF EXISTS "Admins can view all job applications" ON job_applications;
  CREATE POLICY "Admins can view all job applications" ON job_applications FOR SELECT TO authenticated USING (is_admin_internal());
  
  DROP POLICY IF EXISTS "Admins can update job applications" ON job_applications;
  CREATE POLICY "Admins can update job applications" ON job_applications FOR UPDATE TO authenticated USING (is_admin_internal());
END $$;

-- 6. RLS Policies for Marketplace
DO $$
BEGIN
  -- marketplace_items (or marketplace_listings)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_items') THEN
      DROP POLICY IF EXISTS "Admins can manage marketplace items" ON marketplace_items;
      CREATE POLICY "Admins can manage marketplace items" ON marketplace_items FOR ALL TO authenticated USING (is_admin_internal());
  END IF;
  
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_listings') THEN
      DROP POLICY IF EXISTS "Admins can manage marketplace listings" ON marketplace_listings;
      CREATE POLICY "Admins can manage marketplace listings" ON marketplace_listings FOR ALL TO authenticated USING (is_admin_internal());
  END IF;
END $$;

-- 7. RLS Policies for Events
DO $$
BEGIN
  -- events
  DROP POLICY IF EXISTS "Admins can manage events" ON events;
  CREATE POLICY "Admins can manage events" ON events FOR ALL TO authenticated USING (is_admin_internal());
END $$;

-- 8. RLS Policies for Visa (Ensure they exist)
DO $$
BEGIN
  -- visa_applications
  DROP POLICY IF EXISTS "Admins can manage visa applications" ON visa_applications;
  CREATE POLICY "Admins can manage visa applications" ON visa_applications FOR ALL TO authenticated USING (is_admin_internal());

  -- visa_documents
  DROP POLICY IF EXISTS "Admins can manage visa documents" ON visa_documents;
  CREATE POLICY "Admins can manage visa documents" ON visa_documents FOR ALL TO authenticated USING (is_admin_internal());
END $$;

-- 9. Fix Admin Stats RPC (Optimize)
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check admin permission
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT count(*) FROM profiles),
    'totalJobs', (SELECT count(*) FROM jobs WHERE status != 'archived'),
    'totalMarketplaceItems', (
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_items') 
            THEN (SELECT count(*) FROM marketplace_items WHERE status = 'active')
            ELSE 0 
        END
    ),
    'totalEvents', (SELECT count(*) FROM events WHERE status = 'published'),
    'totalEducationPrograms', (SELECT count(*) FROM education_resources WHERE status = 'active'),
    'pendingJobApplications', (SELECT count(*) FROM job_applications WHERE status = 'pending'),
    'pendingEducationInterests', (SELECT count(*) FROM education_interests WHERE status = 'submitted'),
    'pendingVisaApplications', (SELECT count(*) FROM visa_applications WHERE status = 'submitted' OR status = 'documents_requested'),
    'activeConversations', (SELECT count(*) FROM conversations)
  ) INTO v_result;

  RETURN v_result;
END;
$$;
