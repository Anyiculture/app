-- RLS Performance Optimization - Batch 12: Comprehensive Cleanup & Aggressive Optimization
-- Consolidates redundant policies and applies final optimizations to missed tables.

DO $$
DECLARE
  -- Helper for au_pair tables
  v_col_au_pair_id text;
  v_col_family_id text;
BEGIN

  --------------------------------------------------------------------------------
  -- 1. CONSOLIDATION (Removing Redundant Policies)
  --------------------------------------------------------------------------------
  
  -- Job Applications
  DROP POLICY IF EXISTS "Applicants can create applications" ON job_applications;
  DROP POLICY IF EXISTS "Job seekers can create applications" ON job_applications;
  -- Keep "Users can apply to jobs" (optimized in earlier batch)

  -- Job Interests
  DROP POLICY IF EXISTS "Job seekers can create interests" ON job_interests;
  -- Keep "Users can express interest"

  -- Messages
  DROP POLICY IF EXISTS "Users can insert own messages" ON messages;
  -- Keep "Users can send messages"

  -- Onboarding
  DROP POLICY IF EXISTS "Users can view own onboarding" ON onboarding_sessions;
  -- Keep "Users can manage own onboarding"

  -- Services
  DROP POLICY IF EXISTS "Users can view own services" ON user_services;
  DROP POLICY IF EXISTS "Users can view their own services" ON user_services;
  -- Keep "Users can manage own services"

  -- Saved Jobs
  DROP POLICY IF EXISTS "Users can insert saved jobs" ON saved_jobs;
  DROP POLICY IF EXISTS "Users can view their own saved jobs" ON saved_jobs;
  -- Keep "Users can save jobs" and "Users can view own saved jobs"
  
  -- Profiles
  DROP POLICY IF EXISTS "Users can select own employer profile" ON profiles_employer;
  -- Keep "Employers can manage own profile"
  
  -- Community
  DROP POLICY IF EXISTS "Authors can delete own comments" ON community_comments;
  
  -- Conversations
  DROP POLICY IF EXISTS "Users can view own participations" ON conversation_participants;
  DROP POLICY IF EXISTS "Users can update own conversations" ON conversations;

  --------------------------------------------------------------------------------
  -- 2. FORCE OPTIMIZATION (Fixing "re-evaluates" warnings)
  --------------------------------------------------------------------------------

  -- user_content_interactions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_content_interactions') THEN
    DROP POLICY IF EXISTS "Users can view own interactions" ON user_content_interactions;
    CREATE POLICY "Users can view own interactions" ON user_content_interactions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can insert own interactions" ON user_content_interactions;
    CREATE POLICY "Users can insert own interactions" ON user_content_interactions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- user_module_engagement
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_module_engagement') THEN
    DROP POLICY IF EXISTS "Users can view own engagement" ON user_module_engagement;
    CREATE POLICY "Users can view own engagement" ON user_module_engagement FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can insert own engagement" ON user_module_engagement;
    CREATE POLICY "Users can insert own engagement" ON user_module_engagement FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can update own engagement" ON user_module_engagement;
    CREATE POLICY "Users can update own engagement" ON user_module_engagement FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- user_recommendations
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_recommendations') THEN
    DROP POLICY IF EXISTS "Users can view own recommendations" ON user_recommendations;
    CREATE POLICY "Users can view own recommendations" ON user_recommendations FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can insert own recommendations" ON user_recommendations;
    CREATE POLICY "Users can insert own recommendations" ON user_recommendations FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can update own recommendations" ON user_recommendations;
    CREATE POLICY "Users can update own recommendations" ON user_recommendations FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- au_pair_profiles & host_family_profiles Final Polish
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_profiles') THEN
    DROP POLICY IF EXISTS "Au pairs can update own profile" ON au_pair_profiles;
    CREATE POLICY "Au pairs can update own profile" ON au_pair_profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'host_family_profiles') THEN
    DROP POLICY IF EXISTS "Host families can update own profile" ON host_family_profiles;
    CREATE POLICY "Host families can update own profile" ON host_family_profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  --------------------------------------------------------------------------------
  -- 3. AU PAIR TABLES (Runtime column inspection for safety)
  --------------------------------------------------------------------------------

  -- Interviews (Finding the link column)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_interviews') THEN
    -- Try to find a column that looks like a user link
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_interviews' AND column_name = 'au_pair_id') THEN
      v_col_au_pair_id := 'au_pair_id';
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_interviews' AND column_name = 'user_id') THEN
      v_col_au_pair_id := 'user_id';
    END IF;

    IF v_col_au_pair_id IS NOT NULL THEN
      DROP POLICY IF EXISTS "Participants can manage interviews" ON au_pair_interviews;
      EXECUTE format('CREATE POLICY "Participants can manage interviews" ON au_pair_interviews FOR ALL TO authenticated USING ((select auth.uid()) = %I OR EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true))', v_col_au_pair_id);
    END IF;
  END IF;

  --------------------------------------------------------------------------------
  -- 4. FUNCTION SECURITY HARDENING
  --------------------------------------------------------------------------------
  -- Re-fixing any function search_path that might have been missed or overwritten
  DECLARE
    func_record RECORD;
  BEGIN
    FOR func_record IN 
      SELECT oid::regprocedure::text as func_signature
      FROM pg_proc
      WHERE proname IN ('is_admin', 'has_admin_role', 'has_permission', 'get_user_primary_role', 'update_module_engagement', 'set_primary_role', 'track_content_interaction')
      AND pronamespace = 'public'::regnamespace
    LOOP
      EXECUTE 'ALTER FUNCTION ' || func_record.func_signature || ' SET search_path = public';
    END LOOP;
  END;
END $$;

COMMENT ON TABLE user_content_interactions IS 'RLS Performance: Final Batch 12 optimization';
COMMENT ON TABLE user_module_engagement IS 'RLS Performance: Final Batch 12 optimization';
COMMENT ON TABLE user_recommendations IS 'RLS Performance: Final Batch 12 optimization';
