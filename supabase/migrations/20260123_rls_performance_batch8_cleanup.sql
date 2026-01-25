-- RLS Performance Optimization - Batch 8: Cleanup & Duplicate Indexes
-- Covers Community, Stripe, Education, and remaining Admin/Profile policies.
-- Also drops duplicate indexes reported by Supabase Advisor.

DO $$
BEGIN

  -- 1. community_posts (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Users can delete own posts') THEN
    DROP POLICY "Users can delete own posts" ON community_posts;
    CREATE POLICY "Users can delete own posts" ON community_posts FOR DELETE TO authenticated USING ((select auth.uid()) = author_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_posts' AND policyname = 'Users can update own posts') THEN
    DROP POLICY "Users can update own posts" ON community_posts;
    CREATE POLICY "Users can update own posts" ON community_posts FOR UPDATE TO authenticated USING ((select auth.uid()) = author_id) WITH CHECK ((select auth.uid()) = author_id);
  END IF;

  -- 2. community_comments (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_comments' AND policyname = 'Users can delete own comments') THEN
    DROP POLICY "Users can delete own comments" ON community_comments;
    CREATE POLICY "Users can delete own comments" ON community_comments FOR DELETE TO authenticated USING ((select auth.uid()) = author_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_comments' AND policyname = 'Users can update own comments') THEN
    DROP POLICY "Users can update own comments" ON community_comments;
    CREATE POLICY "Users can update own comments" ON community_comments FOR UPDATE TO authenticated USING ((select auth.uid()) = author_id) WITH CHECK ((select auth.uid()) = author_id);
  END IF;

  -- 3. event_registrations (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'event_registrations' AND policyname = 'Organizers can check in attendees') THEN
    DROP POLICY "Organizers can check in attendees" ON event_registrations;
    CREATE POLICY "Organizers can check in attendees" ON event_registrations FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = (select auth.uid()))) WITH CHECK (EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = (select auth.uid())));
  END IF;

  -- 4. stripe_subscriptions (1 policy)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_subscriptions') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_subscriptions' AND policyname = 'Users can view their own subscription data') THEN
        DROP POLICY "Users can view their own subscription data" ON stripe_subscriptions;
        CREATE POLICY "Users can view their own subscription data" ON stripe_subscriptions FOR SELECT TO authenticated USING (
          EXISTS (
            SELECT 1 FROM stripe_customers 
            WHERE stripe_customers.customer_id = stripe_subscriptions.customer_id 
            AND stripe_customers.user_id = (select auth.uid()) 
            AND stripe_customers.deleted_at IS NULL
          )
          AND deleted_at IS NULL
        );
    END IF;
  END IF;

  -- 5. stripe_orders (1 policy)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'stripe_orders') THEN
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'stripe_orders' AND policyname = 'Users can view their own order data') THEN
        DROP POLICY "Users can view their own order data" ON stripe_orders;
        CREATE POLICY "Users can view their own order data" ON stripe_orders FOR SELECT TO authenticated USING (
          EXISTS (
            SELECT 1 FROM stripe_customers 
            WHERE stripe_customers.customer_id = stripe_orders.customer_id 
            AND stripe_customers.user_id = (select auth.uid()) 
            AND stripe_customers.deleted_at IS NULL
          )
          AND deleted_at IS NULL
        );
    END IF;
  END IF;

  -- 6. conversation_reports (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'conversation_reports' AND policyname = 'Admins can view all reports') THEN
    DROP POLICY "Admins can view all reports" ON conversation_reports;
    CREATE POLICY "Admins can view all reports" ON conversation_reports FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 7. au_pair_profiles (1 missed view policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'au_pair_profiles' AND policyname = 'Host families can view au pair profiles') THEN
    DROP POLICY "Host families can view au pair profiles" ON au_pair_profiles;
    CREATE POLICY "Host families can view au pair profiles" ON au_pair_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.au_pair_role = 'host_family') AND profile_status = 'active');
  END IF;
  
  -- 8. host_family_profiles (1 missed view policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'host_family_profiles' AND policyname = 'Au pairs can view host family profiles') THEN
    DROP POLICY "Au pairs can view host family profiles" ON host_family_profiles;
    CREATE POLICY "Au pairs can view host family profiles" ON host_family_profiles FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = (select auth.uid()) AND profiles.au_pair_role = 'au_pair') AND profile_status = 'active');
  END IF;

  -- 9. visa_documents (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visa_documents' AND policyname = 'Admins can verify documents') THEN
    DROP POLICY "Admins can verify documents" ON visa_documents;
    CREATE POLICY "Admins can verify documents" ON visa_documents FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 10. education_interest_documents (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_interest_documents' AND policyname = 'Users can upload documents') THEN
    DROP POLICY "Users can upload documents" ON education_interest_documents;
    CREATE POLICY "Users can upload documents" ON education_interest_documents FOR INSERT TO authenticated WITH CHECK (
      EXISTS (
        SELECT 1 FROM education_interests 
        WHERE education_interests.id = interest_id 
        AND education_interests.user_id = (select auth.uid())
      )
    );
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_interest_documents' AND policyname = 'Users can view own documents') THEN
    DROP POLICY "Users can view own documents" ON education_interest_documents;
    CREATE POLICY "Users can view own documents" ON education_interest_documents FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM education_interests 
        WHERE education_interests.id = interest_id 
        AND education_interests.user_id = (select auth.uid())
      )
    );
  END IF;

  -- 11. education_interest_history (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_interest_history' AND policyname = 'Users can view own history') THEN
    DROP POLICY "Users can view own history" ON education_interest_history;
    CREATE POLICY "Users can view own history" ON education_interest_history FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM education_interests 
        WHERE education_interests.id = interest_id 
        AND education_interests.user_id = (select auth.uid())
      )
    );
  END IF;

  -- 12. education_favorites (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_favorites' AND policyname = 'Users can add favorites') THEN
    DROP POLICY "Users can add favorites" ON education_favorites;
    CREATE POLICY "Users can add favorites" ON education_favorites FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_favorites' AND policyname = 'Users can remove favorites') THEN
    DROP POLICY "Users can remove favorites" ON education_favorites;
    CREATE POLICY "Users can remove favorites" ON education_favorites FOR DELETE TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'education_favorites' AND policyname = 'Users can view own favorites') THEN
    DROP POLICY "Users can view own favorites" ON education_favorites;
    CREATE POLICY "Users can view own favorites" ON education_favorites FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 13. Drop Duplicate Indexes
  DROP INDEX IF EXISTS idx_education_interests_resource; -- Keeping idx_education_interests_resource_id
  DROP INDEX IF EXISTS idx_education_interests_user; -- Keeping idx_education_interests_user_id
  DROP INDEX IF EXISTS idx_host_family_profiles_user; -- Keeping idx_host_family_profiles_user_id
  DROP INDEX IF EXISTS idx_applications_applicant_id; -- Keeping idx_job_applications_applicant_id if exists/preferred
  DROP INDEX IF EXISTS idx_applications_job_id;
  DROP INDEX IF EXISTS idx_applications_status;
  DROP INDEX IF EXISTS idx_saved_jobs_job;
  DROP INDEX IF EXISTS idx_saved_jobs_user;
  -- Note: Checking only the ones reported. "idx_job_applications_*" seem to be the standard we want.

END $$;

COMMENT ON TABLE public.community_posts IS 'RLS policies optimized for performance (Batch 8)';
COMMENT ON TABLE public.event_registrations IS 'RLS policies optimized for performance (Batch 8)';
COMMENT ON TABLE public.education_interest_documents IS 'RLS policies optimized for performance (Batch 8)';
