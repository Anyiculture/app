-- RLS Performance Optimization - Batch 4: Marketplace, Events & Reports
-- Standardizes auth.uid() calls with (select auth.uid()) wrapper to prevent per-row evaluation.

DO $$
BEGIN

  -- 1. marketplace_items (4 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_items' AND policyname = 'Anyone can view active listings') THEN
    DROP POLICY "Anyone can view active listings" ON marketplace_items;
    CREATE POLICY "Anyone can view active listings" ON marketplace_items FOR SELECT TO public USING (status = 'active' OR user_id = (select auth.uid()));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_items' AND policyname = 'Authenticated users can create listings') THEN
    DROP POLICY "Authenticated users can create listings" ON marketplace_items;
    CREATE POLICY "Authenticated users can create listings" ON marketplace_items FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_items' AND policyname = 'Users can update own listings') THEN
    DROP POLICY "Users can update own listings" ON marketplace_items;
    CREATE POLICY "Users can update own listings" ON marketplace_items FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_items' AND policyname = 'Users can delete own listings') THEN
    DROP POLICY "Users can delete own listings" ON marketplace_items;
    CREATE POLICY "Users can delete own listings" ON marketplace_items FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 2. marketplace_favorites (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_favorites' AND policyname = 'Users can view own favorites') THEN
    DROP POLICY "Users can view own favorites" ON marketplace_favorites;
    CREATE POLICY "Users can view own favorites" ON marketplace_favorites FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_favorites' AND policyname = 'Users can add favorites') THEN
    DROP POLICY "Users can add favorites" ON marketplace_favorites;
    CREATE POLICY "Users can add favorites" ON marketplace_favorites FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_favorites' AND policyname = 'Users can remove favorites') THEN
    DROP POLICY "Users can remove favorites" ON marketplace_favorites;
    CREATE POLICY "Users can remove favorites" ON marketplace_favorites FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 3. marketplace_reviews (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_reviews' AND policyname = 'Users can create reviews') THEN
    DROP POLICY "Users can create reviews" ON marketplace_reviews;
    CREATE POLICY "Users can create reviews" ON marketplace_reviews FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = reviewer_id);
  END IF;

  -- 4. marketplace_reports (4 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_reports' AND policyname = 'Users can report items') THEN
    DROP POLICY "Users can report items" ON marketplace_reports;
    CREATE POLICY "Users can report items" ON marketplace_reports FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = reported_by);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_reports' AND policyname = 'Users can view own reports') THEN
    DROP POLICY "Users can view own reports" ON marketplace_reports;
    CREATE POLICY "Users can view own reports" ON marketplace_reports FOR SELECT TO authenticated USING ((select auth.uid()) = reported_by);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_reports' AND policyname = 'Admins can view all reports') THEN
    DROP POLICY "Admins can view all reports" ON marketplace_reports;
    CREATE POLICY "Admins can view all reports" ON marketplace_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_reports' AND policyname = 'Admins can update reports') THEN
    DROP POLICY "Admins can update reports" ON marketplace_reports;
    CREATE POLICY "Admins can update reports" ON marketplace_reports FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 5. marketplace_listings (Legacy or redundant table name in some policies)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'marketplace_listings') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_listings' AND policyname = 'Authenticated users can create listings') THEN
      DROP POLICY "Authenticated users can create listings" ON marketplace_listings;
      CREATE POLICY "Authenticated users can create listings" ON marketplace_listings FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = seller_id);
    END IF;

    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'marketplace_listings' AND policyname = 'Sellers can manage own listings') THEN
      DROP POLICY "Sellers can manage own listings" ON marketplace_listings;
      CREATE POLICY "Sellers can manage own listings" ON marketplace_listings FOR ALL TO authenticated USING ((select auth.uid()) = seller_id) WITH CHECK ((select auth.uid()) = seller_id);
    END IF;
  END IF;

  -- 6. event_favorites (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_favorites' AND policyname = 'Users can view own favorites') THEN
    DROP POLICY "Users can view own favorites" ON event_favorites;
    CREATE POLICY "Users can view own favorites" ON event_favorites FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_favorites' AND policyname = 'Users can add favorites') THEN
    DROP POLICY "Users can add favorites" ON event_favorites;
    CREATE POLICY "Users can add favorites" ON event_favorites FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_favorites' AND policyname = 'Users can remove favorites') THEN
    DROP POLICY "Users can remove favorites" ON event_favorites;
    CREATE POLICY "Users can remove favorites" ON event_favorites FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 7. event_comments (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_comments' AND policyname = 'Users can create comments') THEN
    DROP POLICY "Users can create comments" ON event_comments;
    CREATE POLICY "Users can create comments" ON event_comments FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_comments' AND policyname = 'Users can update own comments') THEN
    DROP POLICY "Users can update own comments" ON event_comments;
    CREATE POLICY "Users can update own comments" ON event_comments FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_comments' AND policyname = 'Users can delete own comments') THEN
    DROP POLICY "Users can delete own comments" ON event_comments;
    CREATE POLICY "Users can delete own comments" ON event_comments FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 8. event_reviews (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_reviews' AND policyname = 'Users can create reviews') THEN
    DROP POLICY "Users can create reviews" ON event_reviews;
    CREATE POLICY "Users can create reviews" ON event_reviews FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_reviews' AND policyname = 'Users can update own reviews') THEN
    DROP POLICY "Users can update own reviews" ON event_reviews;
    CREATE POLICY "Users can update own reviews" ON event_reviews FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 9. event_updates (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_updates' AND policyname = 'Organizers can create updates') THEN
    DROP POLICY "Organizers can create updates" ON event_updates;
    CREATE POLICY "Organizers can create updates" ON event_updates FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = (select auth.uid())));
  END IF;

  -- 10. community_reports (4 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_reports' AND policyname = 'Users can report content') THEN
    DROP POLICY "Users can report content" ON community_reports;
    CREATE POLICY "Users can report content" ON community_reports FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = reported_by);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_reports' AND policyname = 'Users can view own reports') THEN
    DROP POLICY "Users can view own reports" ON community_reports;
    CREATE POLICY "Users can view own reports" ON community_reports FOR SELECT TO authenticated USING ((select auth.uid()) = reported_by);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_reports' AND policyname = 'Admins can view all community reports') THEN
    DROP POLICY "Admins can view all community reports" ON community_reports;
    CREATE POLICY "Admins can view all community reports" ON community_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_reports' AND policyname = 'Admins can update community reports') THEN
    DROP POLICY "Admins can update community reports" ON community_reports;
    CREATE POLICY "Admins can update community reports" ON community_reports FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

END $$;

COMMENT ON TABLE public.marketplace_items IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.marketplace_favorites IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.marketplace_reviews IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.marketplace_reports IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.event_favorites IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.event_comments IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.event_reviews IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.event_updates IS 'RLS policies optimized for performance (Batch 4)';
COMMENT ON TABLE public.community_reports IS 'RLS policies optimized for performance (Batch 4)';
