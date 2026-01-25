-- RLS Performance Optimization - Batch 9: Final Sweep
-- Addresses remaining issues in Search, Redemption, and re-applies Batch 5 fixes that persisted.

DO $$
BEGIN

  -- 1. redemption_codes (1 policy)
  -- Schema Verified: uses 'used_by' column for ownership
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'redemption_codes') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'redemption_codes' AND policyname = 'Users can view own redeemed codes') THEN
      DROP POLICY "Users can view own redeemed codes" ON redemption_codes;
      CREATE POLICY "Users can view own redeemed codes" ON redemption_codes FOR SELECT TO authenticated USING ((select auth.uid()) = used_by);
    END IF;
  END IF;

  -- 2. search_history (3 policies)
  -- Schema Verified: uses 'user_id'
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'search_history') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users can view own search history') THEN
      DROP POLICY "Users can view own search history" ON search_history;
      CREATE POLICY "Users can view own search history" ON search_history FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users can create own search history') THEN
      DROP POLICY "Users can create own search history" ON search_history;
      CREATE POLICY "Users can create own search history" ON search_history FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'search_history' AND policyname = 'Users can delete own search history') THEN
      DROP POLICY "Users can delete own search history" ON search_history;
      CREATE POLICY "Users can delete own search history" ON search_history FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
    END IF;
  END IF;

  -- 3. saved_searches (4 policies)
  -- Schema Verified: uses 'user_id'
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_searches') THEN
    -- View
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'Users can view own saved searches') THEN
      DROP POLICY "Users can view own saved searches" ON saved_searches;
      CREATE POLICY "Users can view own saved searches" ON saved_searches FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
    END IF;

    -- Create/Insert
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'Users can create own saved searches') THEN
      DROP POLICY "Users can create own saved searches" ON saved_searches;
      CREATE POLICY "Users can create own saved searches" ON saved_searches FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
    END IF;
    
    -- Update
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'Users can update own saved searches') THEN
      DROP POLICY "Users can update own saved searches" ON saved_searches;
      CREATE POLICY "Users can update own saved searches" ON saved_searches FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
    END IF;

    -- Delete
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'saved_searches' AND policyname = 'Users can delete own saved searches') THEN
      DROP POLICY "Users can delete own saved searches" ON saved_searches;
      CREATE POLICY "Users can delete own saved searches" ON saved_searches FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
    END IF;
  END IF;

  -- 4. user_personalization (Re-applying Batch 5 fixes)
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

  -- 5. user_role_assignments (Re-applying Batc 5 fixes)
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

END $$;

COMMENT ON TABLE public.redemption_codes IS 'RLS policies optimized for performance (Batch 9)';
COMMENT ON TABLE public.search_history IS 'RLS policies optimized for performance (Batch 9)';
COMMENT ON TABLE public.saved_searches IS 'RLS policies optimized for performance (Batch 9)';
