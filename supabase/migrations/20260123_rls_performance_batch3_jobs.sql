-- RLS Performance Optimization - Batch 3: Job & Service Systems
-- Standardizes auth.uid() calls with (select auth.uid()) wrapper to prevent per-row evaluation.

DO $$
BEGIN

  -- 1. user_services (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_services' AND policyname = 'Users can insert their own services') THEN
    DROP POLICY "Users can insert their own services" ON user_services;
    CREATE POLICY "Users can insert their own services" ON user_services FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_services' AND policyname = 'Users can update their own services') THEN
    DROP POLICY "Users can update their own services" ON user_services;
    CREATE POLICY "Users can update their own services" ON user_services FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_services' AND policyname = 'Users can view their own services') THEN
    DROP POLICY "Users can view their own services" ON user_services;
    CREATE POLICY "Users can view their own services" ON user_services FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 2. job_interests (Up to 9 policies identified in report)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Job seekers can create interests') THEN
    DROP POLICY "Job seekers can create interests" ON job_interests;
    CREATE POLICY "Job seekers can create interests" ON job_interests FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Users can express interest') THEN
    DROP POLICY "Users can express interest" ON job_interests;
    CREATE POLICY "Users can express interest" ON job_interests FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Users can view own interests') THEN
    DROP POLICY "Users can view own interests" ON job_interests;
    CREATE POLICY "Users can view own interests" ON job_interests FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Users can view own job interests') THEN
    DROP POLICY "Users can view own job interests" ON job_interests;
    CREATE POLICY "Users can view own job interests" ON job_interests FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Employers can view job interests') THEN
    DROP POLICY "Employers can view job interests" ON job_interests;
    CREATE POLICY "Employers can view job interests" ON job_interests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_interests.job_id AND jobs.poster_id = (select auth.uid())));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Employers can view interests on their jobs') THEN
    DROP POLICY "Employers can view interests on their jobs" ON job_interests;
    CREATE POLICY "Employers can view interests on their jobs" ON job_interests FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_interests.job_id AND jobs.poster_id = (select auth.uid())));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Users can update own interests') THEN
    DROP POLICY "Users can update own interests" ON job_interests;
    CREATE POLICY "Users can update own interests" ON job_interests FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Employers can update interest status') THEN
    DROP POLICY "Employers can update interest status" ON job_interests;
    CREATE POLICY "Employers can update interest status" ON job_interests FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_interests.job_id AND jobs.poster_id = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM jobs WHERE jobs.id = job_interests.job_id AND jobs.poster_id = (select auth.uid())));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_interests' AND policyname = 'Users can withdraw interest') THEN
    DROP POLICY "Users can withdraw interest" ON job_interests;
    CREATE POLICY "Users can withdraw interest" ON job_interests FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 3. job_views (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_views' AND policyname = 'Users can view own job views') THEN
    DROP POLICY "Users can view own job views" ON job_views;
    CREATE POLICY "Users can view own job views" ON job_views FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'job_views' AND policyname = 'Users can create job views') THEN
    DROP POLICY "Users can create job views" ON job_views;
    CREATE POLICY "Users can create job views" ON job_views FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id OR user_id IS NULL);
  END IF;

  -- 4. interviews (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interviews' AND policyname = 'Participants can view interviews') THEN
    DROP POLICY "Participants can view interviews" ON interviews;
    CREATE POLICY "Participants can view interviews" ON interviews FOR SELECT TO authenticated USING ((select auth.uid()) = interviewer_id OR (select auth.uid()) = interviewee_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interviews' AND policyname = 'Employers can create interviews') THEN
    DROP POLICY "Employers can create interviews" ON interviews;
    CREATE POLICY "Employers can create interviews" ON interviews FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = interviewer_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'interviews' AND policyname = 'Participants can update interviews') THEN
    DROP POLICY "Participants can update interviews" ON interviews;
    CREATE POLICY "Participants can update interviews" ON interviews FOR UPDATE TO authenticated USING ((select auth.uid()) = interviewer_id OR (select auth.uid()) = interviewee_id) WITH CHECK ((select auth.uid()) = interviewer_id OR (select auth.uid()) = interviewee_id);
  END IF;

  -- 5. application_pipeline_history (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'application_pipeline_history' AND policyname = 'Users can view relevant pipeline history') THEN
    DROP POLICY "Users can view relevant pipeline history" ON application_pipeline_history;
    CREATE POLICY "Users can view relevant pipeline history" ON application_pipeline_history FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM job_applications
        WHERE job_applications.id = application_pipeline_history.application_id
        AND (
          job_applications.applicant_id = (select auth.uid()) OR
          EXISTS (
            SELECT 1 FROM jobs
            WHERE jobs.id = job_applications.job_id
            AND jobs.poster_id = (select auth.uid())
          )
        )
      )
    );
  END IF;

  -- 6. user_job_preferences (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_job_preferences' AND policyname = 'Users can view own preferences') THEN
    DROP POLICY "Users can view own preferences" ON user_job_preferences;
    CREATE POLICY "Users can view own preferences" ON user_job_preferences FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_job_preferences' AND policyname = 'Users can manage own preferences') THEN
    DROP POLICY "Users can manage own preferences" ON user_job_preferences;
    CREATE POLICY "Users can manage own preferences" ON user_job_preferences FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 7. saved_jobs (3 policies identified in report)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can view own saved jobs') THEN
    DROP POLICY "Users can view own saved jobs" ON saved_jobs;
    CREATE POLICY "Users can view own saved jobs" ON saved_jobs FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can save jobs') THEN
    DROP POLICY "Users can save jobs" ON saved_jobs;
    CREATE POLICY "Users can save jobs" ON saved_jobs FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_jobs' AND policyname = 'Users can unsave jobs') THEN
    DROP POLICY "Users can unsave jobs" ON saved_jobs;
    CREATE POLICY "Users can unsave jobs" ON saved_jobs FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

END $$;

COMMENT ON TABLE public.user_services IS 'RLS policies optimized for performance (Batch 3)';
COMMENT ON TABLE public.job_interests IS 'RLS policies optimized for performance (Batch 3)';
COMMENT ON TABLE public.job_views IS 'RLS policies optimized for performance (Batch 3)';
COMMENT ON TABLE public.interviews IS 'RLS policies optimized for performance (Batch 3)';
COMMENT ON TABLE public.application_pipeline_history IS 'RLS policies optimized for performance (Batch 3)';
COMMENT ON TABLE public.user_job_preferences IS 'RLS policies optimized for performance (Batch 3)';
COMMENT ON TABLE public.saved_jobs IS 'RLS policies optimized for performance (Batch 3)';
