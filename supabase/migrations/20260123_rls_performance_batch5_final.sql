-- RLS Performance Optimization - Batch 5: Personalization, Au Pair & Admin Systems
-- Final batch to standardize auth.uid() calls with (select auth.uid()) wrapper.

DO $$
BEGIN

  -- 1. user_personalization (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_personalization' AND policyname = 'Users can view own personalization') THEN
    DROP POLICY "Users can view own personalization" ON user_personalization;
    CREATE POLICY "Users can view own personalization" ON user_personalization FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_personalization' AND policyname = 'Users can insert own personalization') THEN
    DROP POLICY "Users can insert own personalization" ON user_personalization;
    CREATE POLICY "Users can insert own personalization" ON user_personalization FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_personalization' AND policyname = 'Users can update own personalization') THEN
    DROP POLICY "Users can update own personalization" ON user_personalization;
    CREATE POLICY "Users can update own personalization" ON user_personalization FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 2. user_role_assignments (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_role_assignments' AND policyname = 'Users can view own roles') THEN
    DROP POLICY "Users can view own roles" ON user_role_assignments;
    CREATE POLICY "Users can view own roles" ON user_role_assignments FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_role_assignments' AND policyname = 'Users can insert own roles') THEN
    DROP POLICY "Users can insert own roles" ON user_role_assignments;
    CREATE POLICY "Users can insert own roles" ON user_role_assignments FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_role_assignments' AND policyname = 'Users can update own roles') THEN
    DROP POLICY "Users can update own roles" ON user_role_assignments;
    CREATE POLICY "Users can update own roles" ON user_role_assignments FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 3. user_content_interactions (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_content_interactions' AND policyname = 'Users can view own interactions') THEN
    DROP POLICY "Users can view own interactions" ON user_content_interactions;
    CREATE POLICY "Users can view own interactions" ON user_content_interactions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_content_interactions' AND policyname = 'Users can insert own interactions') THEN
    DROP POLICY "Users can insert own interactions" ON user_content_interactions;
    CREATE POLICY "Users can insert own interactions" ON user_content_interactions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 4. user_module_engagement (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_module_engagement' AND policyname = 'Users can view own engagement') THEN
    DROP POLICY "Users can view own engagement" ON user_module_engagement;
    CREATE POLICY "Users can view own engagement" ON user_module_engagement FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_module_engagement' AND policyname = 'Users can insert own engagement') THEN
    DROP POLICY "Users can insert own engagement" ON user_module_engagement;
    CREATE POLICY "Users can insert own engagement" ON user_module_engagement FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_module_engagement' AND policyname = 'Users can update own engagement') THEN
    DROP POLICY "Users can update own engagement" ON user_module_engagement;
    CREATE POLICY "Users can update own engagement" ON user_module_engagement FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 5. user_recommendations (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_recommendations' AND policyname = 'Users can view own recommendations') THEN
    DROP POLICY "Users can view own recommendations" ON user_recommendations;
    CREATE POLICY "Users can view own recommendations" ON user_recommendations FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_recommendations' AND policyname = 'Users can insert own recommendations') THEN
    DROP POLICY "Users can insert own recommendations" ON user_recommendations;
    CREATE POLICY "Users can insert own recommendations" ON user_recommendations FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_recommendations' AND policyname = 'Users can update own recommendations') THEN
    DROP POLICY "Users can update own recommendations" ON user_recommendations;
    CREATE POLICY "Users can update own recommendations" ON user_recommendations FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 6. au_pair_profiles & host_family_profiles (ownership-based policies from 20260121_add_listing_ownership.sql)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_profiles' AND policyname = 'Au pairs can update own profile') THEN
    DROP POLICY "Au pairs can update own profile" ON au_pair_profiles;
    CREATE POLICY "Au pairs can update own profile" ON au_pair_profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id AND owner_user_id = (select auth.uid())) WITH CHECK ((select auth.uid()) = user_id AND owner_user_id = (select auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'host_family_profiles' AND policyname = 'Host families can update own profile') THEN
    DROP POLICY "Host families can update own profile" ON host_family_profiles;
    CREATE POLICY "Host families can update own profile" ON host_family_profiles FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id AND owner_user_id = (select auth.uid())) WITH CHECK ((select auth.uid()) = user_id AND owner_user_id = (select auth.uid()));
  END IF;

  -- 7. payment_submissions (4 policies from 20260118_fix_payment_and_roles.sql)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Users can view own submissions') THEN
    DROP POLICY "Users can view own submissions" ON payment_submissions;
    CREATE POLICY "Users can view own submissions" ON payment_submissions FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Users can insert own submissions') THEN
    DROP POLICY "Users can insert own submissions" ON payment_submissions;
    CREATE POLICY "Users can insert own submissions" ON payment_submissions FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Admins can view all submissions') THEN
    DROP POLICY "Admins can view all submissions" ON payment_submissions;
    CREATE POLICY "Admins can view all submissions" ON payment_submissions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Admins can update submissions') THEN
    DROP POLICY "Admins can update submissions" ON payment_submissions;
    CREATE POLICY "Admins can update submissions" ON payment_submissions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 8. Search and Analytics (if they exist and have unoptimized policies)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_history') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users can view own search history') THEN
      DROP POLICY "Users can view own search history" ON search_history;
      CREATE POLICY "Users can view own search history" ON search_history FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users can insert own search history') THEN
      DROP POLICY "Users can insert own search history" ON search_history;
      CREATE POLICY "Users can insert own search history" ON search_history FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_searches') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'Users can view own saved searches') THEN
      DROP POLICY "Users can view own saved searches" ON saved_searches;
      CREATE POLICY "Users can view own saved searches" ON saved_searches FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'Users can manage own saved searches') THEN
      DROP POLICY "Users can manage own saved searches" ON saved_searches;
      CREATE POLICY "Users can manage own saved searches" ON saved_searches FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
    END IF;
  END IF;

END $$;

COMMENT ON TABLE public.user_personalization IS 'RLS policies optimized for performance (Batch 5)';
COMMENT ON TABLE public.user_role_assignments IS 'RLS policies optimized for performance (Batch 5)';
COMMENT ON TABLE public.user_content_interactions IS 'RLS policies optimized for performance (Batch 5)';
COMMENT ON TABLE public.user_module_engagement IS 'RLS policies optimized for performance (Batch 5)';
COMMENT ON TABLE public.user_recommendations IS 'RLS policies optimized for performance (Batch 5)';
COMMENT ON TABLE public.au_pair_profiles IS 'RLS policies optimized for performance (Batch 5)';
COMMENT ON TABLE public.host_family_profiles IS 'RLS policies optimized for performance (Batch 5)';
COMMENT ON TABLE public.payment_submissions IS 'RLS policies optimized for performance (Batch 5)';
