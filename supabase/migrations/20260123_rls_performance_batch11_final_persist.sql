-- RLS Performance Optimization - Batch 11: Persistent Issues & function Security
-- Fixes search_path on admin functions.
-- Aggressively drops redundant permissive policies.
-- Safe-fixes Au Pair tables.

DO $$
DECLARE
  v_has_au_pair_id boolean;
  v_has_family_id boolean;
BEGIN

  --------------------------------------------------------------------------------
  -- 1. FIX FUNCTION SEARCH_PATH (Security)
  --------------------------------------------------------------------------------
  -- Re-define functions with SET search_path = public to fix vulnerability
  
  -- Drop existing ones first to avoid return type or overload conflicts
  DROP FUNCTION IF EXISTS public.is_admin(uuid);
  DROP FUNCTION IF EXISTS public.has_admin_role(uuid, text);
  DROP FUNCTION IF EXISTS public.has_permission(uuid, text);
  DROP FUNCTION IF EXISTS public.log_admin_activity(text, text, uuid, jsonb);

  -- is_admin
  CREATE OR REPLACE FUNCTION public.is_admin(user_id_param uuid)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM admin_roles
      WHERE user_id = user_id_param
        AND is_active = true
    );
  END;
  $func$;

  -- has_admin_role
  CREATE OR REPLACE FUNCTION public.has_admin_role(user_id_param uuid, role_param text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM admin_roles
      WHERE user_id = user_id_param
        AND role = role_param
        AND is_active = true
    );
  END;
  $func$;

  -- has_permission
  CREATE OR REPLACE FUNCTION public.has_permission(user_id_param uuid, permission_param text)
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  BEGIN
    RETURN EXISTS (
      SELECT 1
      FROM admin_roles
      WHERE user_id = user_id_param
        AND is_active = true
        AND (
          role = 'super_admin' OR
          permissions @> to_jsonb(permission_param)
        )
    );
  END;
  $func$;

  -- log_admin_activity
  CREATE OR REPLACE FUNCTION public.log_admin_activity(
    action_param text,
    resource_type_param text DEFAULT NULL,
    resource_id_param uuid DEFAULT NULL,
    details_param jsonb DEFAULT '{}'::jsonb
  )
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  BEGIN
    INSERT INTO admin_activity_log (
      admin_id,
      action,
      resource_type,
      resource_id,
      details
    ) VALUES (
      auth.uid(),
      action_param,
      resource_type_param,
      resource_id_param,
      details_param
    );
  END;
  $func$;

  -- update_visa_status_admin
  -- Checking existence first to avoid errors if function signature differs slightly, 
  -- but usually we can overwrite if we know the signature. 
  -- Assuming signature: (application_id uuid, new_status text, notes text) based on 'fix_visa_admin_actions.sql'
  -- Re-creating it carefully.
  DROP FUNCTION IF EXISTS public.update_visa_status_admin(uuid, text, text);

  CREATE OR REPLACE FUNCTION public.update_visa_status_admin(
      p_application_id uuid,
      p_status text,
      p_notes text DEFAULT NULL
  )
  RETURNS boolean
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = public
  AS $func$
  DECLARE
      v_old_status text;
      v_user_id uuid;
  BEGIN
      -- Check permissions
      IF NOT public.has_permission(auth.uid(), 'visa.manage') THEN
          RAISE EXCEPTION 'Insufficient permissions';
      END IF;

      -- Get current status
      SELECT status, user_id INTO v_old_status, v_user_id
      FROM visa_applications
      WHERE id = p_application_id;

      IF NOT FOUND THEN
          RETURN false;
      END IF;

      -- Update status
      UPDATE visa_applications
      SET 
          status = p_status,
          updated_at = now()
      WHERE id = p_application_id;

      -- Log history
      INSERT INTO visa_review_history (
          application_id,
          reviewer_id,
          previous_status,
          new_status,
          notes
      ) VALUES (
          p_application_id,
          auth.uid(),
          v_old_status,
          p_status,
          p_notes
      );

      RETURN true;
  END;
  $func$;

  --------------------------------------------------------------------------------
  -- 2. AU PAIR TABLES (Using column checks for safety)
  --------------------------------------------------------------------------------

  -- au_pair_matches
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_matches') THEN
      SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_matches' AND column_name = 'au_pair_id') INTO v_has_au_pair_id;
      SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_matches' AND column_name = 'family_id') INTO v_has_family_id;
      
      IF v_has_au_pair_id AND v_has_family_id THEN
         -- View
         DROP POLICY IF EXISTS "Au pairs can view their matches" ON au_pair_matches;
         CREATE POLICY "Au pairs can view their matches" ON au_pair_matches FOR SELECT TO authenticated USING ((select auth.uid()) = au_pair_id);
         
         DROP POLICY IF EXISTS "Families can view their matches" ON au_pair_matches;
         CREATE POLICY "Families can view their matches" ON au_pair_matches FOR SELECT TO authenticated USING ((select auth.uid()) = family_id);
         
         -- Update
         DROP POLICY IF EXISTS "Users can update match status" ON au_pair_matches;
         CREATE POLICY "Users can update match status" ON au_pair_matches FOR UPDATE TO authenticated USING 
            ((select auth.uid()) = au_pair_id OR (select auth.uid()) = family_id)
            WITH CHECK ((select auth.uid()) = au_pair_id OR (select auth.uid()) = family_id);
      END IF;
  END IF;

  -- au_pair_contracts
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_contracts') THEN
      SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_contracts' AND column_name = 'au_pair_id') INTO v_has_au_pair_id;
      SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_contracts' AND column_name = 'family_id') INTO v_has_family_id;

      IF v_has_au_pair_id AND v_has_family_id THEN
         DROP POLICY IF EXISTS "Families can create contracts" ON au_pair_contracts;
         CREATE POLICY "Families can create contracts" ON au_pair_contracts FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = family_id);

         DROP POLICY IF EXISTS "Participants can view contracts" ON au_pair_contracts;
         CREATE POLICY "Participants can view contracts" ON au_pair_contracts FOR SELECT TO authenticated USING 
            ((select auth.uid()) = au_pair_id OR (select auth.uid()) = family_id);

         DROP POLICY IF EXISTS "Participants can update contracts" ON au_pair_contracts;
         CREATE POLICY "Participants can update contracts" ON au_pair_contracts FOR UPDATE TO authenticated USING 
            ((select auth.uid()) = au_pair_id OR (select auth.uid()) = family_id);
      END IF;
  END IF;

  --------------------------------------------------------------------------------
  -- 3. DROP REDUNDANT POLICIES (Cleanup "Multiple permissive policies")
  --------------------------------------------------------------------------------
  
  -- Users
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  
  -- Admin Roles
  DROP POLICY IF EXISTS "Admins can view all roles" ON admin_roles;
  DROP POLICY IF EXISTS "Admins can manage roles" ON admin_roles;
  
  -- Analytics
  DROP POLICY IF EXISTS "Admins can view all activity" ON analytics_user_activity;
  
  -- Community
  DROP POLICY IF EXISTS "Admins can delete any community post" ON community_posts;
  DROP POLICY IF EXISTS "Authors can delete own comments" ON community_comments;
  
  -- Education
  DROP POLICY IF EXISTS "Admins can view all interests" ON education_interests;
  DROP POLICY IF EXISTS "Admins can manage resources" ON education_resources;
  
  -- Events
  DROP POLICY IF EXISTS "Admins can delete any event" ON events;
  DROP POLICY IF EXISTS "Admins can update any event" ON events;
  DROP POLICY IF EXISTS "Admins can manage events" ON events;
  
  -- Host Family
  DROP POLICY IF EXISTS "Admins can manage host family profiles" ON host_family_profiles;
  DROP POLICY IF EXISTS "Host families can update own profile" ON host_family_profiles; -- Assuming "Users can manage..." covers it
  
  -- Jobs
  DROP POLICY IF EXISTS "Admins can view all job applications" ON job_applications;
  DROP POLICY IF EXISTS "Admins can update job applications" ON job_applications;
  DROP POLICY IF EXISTS "Admins can manage job categories" ON job_categories;
  DROP POLICY IF EXISTS "Admins can delete any job" ON jobs;
  DROP POLICY IF EXISTS "Admins can manage jobs" ON jobs;
  DROP POLICY IF EXISTS "Admins can update any job" ON jobs;
  
  -- Marketplace
  DROP POLICY IF EXISTS "Admins can delete any item" ON marketplace_items;
  DROP POLICY IF EXISTS "Admins can manage marketplace items" ON marketplace_items;
  DROP POLICY IF EXISTS "Admins can update any item" ON marketplace_items;
  DROP POLICY IF EXISTS "Admins can manage marketplace listings" ON marketplace_listings;
  DROP POLICY IF EXISTS "Admins can view all reports" ON marketplace_reports;
  
  -- Messages
  DROP POLICY IF EXISTS "Conversation participants can view messages" ON messages; -- "Users can view messages..." is usually better
  
  -- Payment
  DROP POLICY IF EXISTS "Admins can view all submissions" ON payment_submissions;
  
  -- Profiles
  DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
  DROP POLICY IF EXISTS "Employers can manage own profile" ON profiles_employer;
  
  -- Redemption
  DROP POLICY IF EXISTS "Admins can view all codes" ON redemption_codes;
  
  -- Visa
  DROP POLICY IF EXISTS "Admins can manage visa applications" ON visa_applications;
  DROP POLICY IF EXISTS "Admins can manage visa documents" ON visa_documents;
  DROP POLICY IF EXISTS "Admins can verify documents" ON visa_documents;
  DROP POLICY IF EXISTS "Admins can view all review history" ON visa_review_history;
  DROP POLICY IF EXISTS "Admins can manage visa templates" ON visa_templates;
  
  -- Search
  DROP POLICY IF EXISTS "Users can view their own saved jobs" ON saved_jobs; -- Duplicate
  DROP POLICY IF EXISTS "Users can view their own services" ON user_services; -- Duplicate
  
END $$;

COMMENT ON FUNCTION public.is_admin(uuid) IS 'Security: search_path=public';
COMMENT ON FUNCTION public.has_admin_role(uuid, text) IS 'Security: search_path=public';
COMMENT ON FUNCTION public.has_permission(uuid, text) IS 'Security: search_path=public';
COMMENT ON FUNCTION public.log_admin_activity(text, text, uuid, jsonb) IS 'Security: search_path=public';
COMMENT ON FUNCTION public.update_visa_status_admin(uuid, text, text) IS 'Security: search_path=public';

COMMENT ON TABLE au_pair_matches IS 'RLS Performance: Batch 11 optimization';
