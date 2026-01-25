-- RLS Performance Optimization - Batch 13: Final Polish & Index Cleanup
-- Consolidates "Multiple Permissive Policies" into single policies.
-- Fixes remaining "re-evaluates auth.uid()" warnings.
-- Removes redundant indexes.

DO $$
BEGIN

  --------------------------------------------------------------------------------
  -- 1. AU PAIR TABLES (Consolidation & performance)
  --------------------------------------------------------------------------------

  -- au_pair_matches
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_matches') THEN
    DROP POLICY IF EXISTS "Au pairs can view their matches" ON au_pair_matches;
    DROP POLICY IF EXISTS "Families can view their matches" ON au_pair_matches;
    DROP POLICY IF EXISTS "Users can view matches" ON au_pair_matches;
    -- Consolidate SELECT to one policy to fix "Multiple Permissive" warning
    CREATE POLICY "Users can view matches" ON au_pair_matches FOR SELECT TO authenticated 
      USING ((select auth.uid()) IN (au_pair_id, host_family_id));
    
    DROP POLICY IF EXISTS "Users can update match status" ON au_pair_matches;
    CREATE POLICY "Users can update match status" ON au_pair_matches FOR UPDATE TO authenticated 
      USING ((select auth.uid()) IN (au_pair_id, host_family_id))
      WITH CHECK ((select auth.uid()) IN (au_pair_id, host_family_id));
  END IF;

  -- au_pair_profiles
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_profiles') THEN
    DROP POLICY IF EXISTS "Au pairs can view own profile" ON au_pair_profiles;
    DROP POLICY IF EXISTS "Host families can view au pair profiles" ON au_pair_profiles;
    DROP POLICY IF EXISTS "Authenticated users can view au pair profiles" ON au_pair_profiles;
    -- Consolidate SELECT
    CREATE POLICY "Authenticated users can view au pair profiles" ON au_pair_profiles FOR SELECT TO authenticated 
      USING (
        (select auth.uid()) = user_id OR 
        (profile_status = 'active' AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (select auth.uid()) AND au_pair_role = 'host_family'
        ))
      );
      
    DROP POLICY IF EXISTS "Au pairs can update own profile" ON au_pair_profiles;
    CREATE POLICY "Au pairs can update own profile" ON au_pair_profiles FOR UPDATE TO authenticated 
      USING ((select auth.uid()) = user_id) 
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- au_pair_contracts
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_contracts') THEN
    DROP POLICY IF EXISTS "Families can create contracts" ON au_pair_contracts;
    CREATE POLICY "Families can create contracts" ON au_pair_contracts FOR INSERT TO authenticated 
      WITH CHECK ((select auth.uid()) = host_family_id);
    
    DROP POLICY IF EXISTS "Participants can view contracts" ON au_pair_contracts;
    CREATE POLICY "Participants can view contracts" ON au_pair_contracts FOR SELECT TO authenticated 
      USING ((select auth.uid()) IN (au_pair_id, host_family_id));
      
    DROP POLICY IF EXISTS "Participants can update contracts" ON au_pair_contracts;
    CREATE POLICY "Participants can update contracts" ON au_pair_contracts FOR UPDATE TO authenticated 
      USING ((select auth.uid()) IN (au_pair_id, host_family_id));
  END IF;

  -- au_pair_interviews
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'au_pair_interviews') THEN
    DROP POLICY IF EXISTS "Participants can manage interviews" ON au_pair_interviews;
    CREATE POLICY "Participants can manage interviews" ON au_pair_interviews FOR ALL TO authenticated 
      USING ((select auth.uid()) IN (au_pair_id, host_family_id));
  END IF;

  --------------------------------------------------------------------------------
  -- 2. HOST FAMILY PROFILES (Consolidation)
  --------------------------------------------------------------------------------

  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'host_family_profiles') THEN
    DROP POLICY IF EXISTS "Host families can insert own profile" ON host_family_profiles;
    DROP POLICY IF EXISTS "Users can manage own family profile" ON host_family_profiles;
    CREATE POLICY "Users can insert own host family profile" ON host_family_profiles FOR INSERT TO authenticated 
      WITH CHECK ((select auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Au pairs can view host family profiles" ON host_family_profiles;
    DROP POLICY IF EXISTS "Families can view active profiles" ON host_family_profiles;
    DROP POLICY IF EXISTS "Host families can view own profile" ON host_family_profiles;
    CREATE POLICY "Authenticated users can view host family profiles" ON host_family_profiles FOR SELECT TO authenticated 
      USING (
        (select auth.uid()) = user_id OR 
        (profile_status = 'active' AND EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = (select auth.uid()) AND au_pair_role = 'au_pair'
        ))
      );

    DROP POLICY IF EXISTS "Host families can update own profile" ON host_family_profiles;
    CREATE POLICY "Host families can update own profile" ON host_family_profiles FOR UPDATE TO authenticated 
      USING ((select auth.uid()) = user_id) 
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  --------------------------------------------------------------------------------
  -- 3. REMAINING CONSOLIDATIONS
  --------------------------------------------------------------------------------

  -- job_applications (SELECT)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'job_applications') THEN
    DROP POLICY IF EXISTS "Allow auth view job applications" ON job_applications;
    DROP POLICY IF EXISTS "Applicants can view own applications" ON job_applications;
    DROP POLICY IF EXISTS "Employers can view applications for their jobs" ON job_applications;
    DROP POLICY IF EXISTS "Users can view own applications" ON job_applications;
    DROP POLICY IF EXISTS "Users can view job applications" ON job_applications;
    CREATE POLICY "Users can view job applications" ON job_applications FOR SELECT TO authenticated 
      USING (
        (select auth.uid()) = applicant_id OR 
        EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.poster_id = (select auth.uid())) OR
        EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)
      );
  END IF;

  -- job_interests (SELECT/UPDATE)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'job_interests') THEN
    DROP POLICY IF EXISTS "Employers can view interests on their jobs" ON job_interests;
    DROP POLICY IF EXISTS "Employers can view job interests" ON job_interests;
    DROP POLICY IF EXISTS "Users can view own interests" ON job_interests;
    DROP POLICY IF EXISTS "Users can view own job interests" ON job_interests;
    DROP POLICY IF EXISTS "Users can view job interests" ON job_interests;
    CREATE POLICY "Users can view job interests" ON job_interests FOR SELECT TO authenticated 
      USING (
        (select auth.uid()) = user_id OR 
        EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.poster_id = (select auth.uid()))
      );

    DROP POLICY IF EXISTS "Employers can update interest status" ON job_interests;
    DROP POLICY IF EXISTS "Users can update own interests" ON job_interests;
    DROP POLICY IF EXISTS "Users can update job interests" ON job_interests;
    CREATE POLICY "Users can update job interests" ON job_interests FOR UPDATE TO authenticated 
      USING (
        (select auth.uid()) = user_id OR 
        EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_id AND jobs.poster_id = (select auth.uid()))
      );
  END IF;

  -- user_services (INSERT/UPDATE)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_services') THEN
    DROP POLICY IF EXISTS "Users can insert their own services" ON user_services;
    DROP POLICY IF EXISTS "Users can manage own services" ON user_services;
    CREATE POLICY "Users can insert own services" ON user_services FOR INSERT TO authenticated 
      WITH CHECK ((select auth.uid()) = user_id);

    DROP POLICY IF EXISTS "Users can update their own services" ON user_services;
    CREATE POLICY "Users can update own services" ON user_services FOR UPDATE TO authenticated 
      USING ((select auth.uid()) = user_id);
  END IF;

  -- visa_applications (UPDATE)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'visa_applications') THEN
    DROP POLICY IF EXISTS "Users can update documents_requested applications" ON visa_applications;
    DROP POLICY IF EXISTS "Users can update own applications" ON visa_applications;
    DROP POLICY IF EXISTS "Users can update own draft applications" ON visa_applications;
    CREATE POLICY "Users can update own visa applications" ON visa_applications FOR UPDATE TO authenticated 
      USING ((select auth.uid()) = user_id)
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- user_content_interactions (performance)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_content_interactions') THEN
    DROP POLICY IF EXISTS "Users can insert own interactions" ON user_content_interactions;
    CREATE POLICY "Users can insert own interactions" ON user_content_interactions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can view own interactions" ON user_content_interactions;
    CREATE POLICY "Users can view own interactions" ON user_content_interactions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- user_module_engagement (performance)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_module_engagement') THEN
    DROP POLICY IF EXISTS "Users can insert own engagement" ON user_module_engagement;
    CREATE POLICY "Users can insert own engagement" ON user_module_engagement FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can update own engagement" ON user_module_engagement;
    CREATE POLICY "Users can update own engagement" ON user_module_engagement FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can view own engagement" ON user_module_engagement;
    CREATE POLICY "Users can view own engagement" ON user_module_engagement FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- user_recommendations (performance)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_recommendations') THEN
    DROP POLICY IF EXISTS "Users can insert own recommendations" ON user_recommendations;
    CREATE POLICY "Users can insert own recommendations" ON user_recommendations FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can update own recommendations" ON user_recommendations;
    CREATE POLICY "Users can update own recommendations" ON user_recommendations FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
    DROP POLICY IF EXISTS "Users can view own recommendations" ON user_recommendations;
    CREATE POLICY "Users can view own recommendations" ON user_recommendations FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  --------------------------------------------------------------------------------
  -- 4. INDEX CLEANUP
  --------------------------------------------------------------------------------
  
  -- Drop identical index on saved_jobs
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_saved_jobs_user_job_unique') THEN
    DROP INDEX idx_saved_jobs_user_job_unique;
  END IF;

END $$;

COMMENT ON TABLE au_pair_matches IS 'RLS Performance: Final Batch 13 Polish';
