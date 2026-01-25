-- RLS Performance Optimization - Batch 6: Admin, Visa, Analytics & Core Systems
-- Covers remaining tables not optimized in Batches 1-5.
-- Note: au_pair tables, meetings, and redemption_codes excluded due to schema verification needed

DO $$
BEGIN

  -- 1. admin_roles (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_roles' AND policyname = 'Users can view own role') THEN
    DROP POLICY "Users can view own role" ON admin_roles;
    CREATE POLICY "Users can view own role" ON admin_roles FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  -- 2. admin_audit_logs (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_audit_logs' AND policyname = 'Only admins can view audit logs') THEN
    DROP POLICY "Only admins can view audit logs" ON admin_audit_logs;
    CREATE POLICY "Only admins can view audit logs" ON admin_audit_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND role IN ('admin', 'super_admin')));
  END IF;

  -- 3. admin_activity_log (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_activity_log' AND policyname = 'Admins can view activity logs') THEN
    DROP POLICY "Admins can view activity logs" ON admin_activity_log;
    CREATE POLICY "Admins can view activity logs" ON admin_activity_log FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_activity_log' AND policyname = 'Admins can insert activity logs') THEN
    DROP POLICY "Admins can insert activity logs" ON admin_activity_log;
    CREATE POLICY "Admins can insert activity logs" ON admin_activity_log FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 4. user_presence (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Users can update own presence') THEN
    DROP POLICY "Users can update own presence" ON user_presence;
    CREATE POLICY "Users can update own presence" ON user_presence FOR UPDATE TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 5. visa_templates (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visa_templates' AND policyname = 'Admins can manage visa templates') THEN
    DROP POLICY "Admins can manage visa templates" ON visa_templates;
    CREATE POLICY "Admins can manage visa templates" ON visa_templates FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 6. visa_review_history (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visa_review_history' AND policyname = 'Users can view own application review history') THEN
    DROP POLICY "Users can view own application review history" ON visa_review_history;
    CREATE POLICY "Users can view own application review history" ON visa_review_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM visa_applications WHERE visa_applications.id = visa_review_history.application_id AND visa_applications.user_id = (select auth.uid())));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visa_review_history' AND policyname = 'Admins can view all review history') THEN
    DROP POLICY "Admins can view all review history" ON visa_review_history;
    CREATE POLICY "Admins can view all review history" ON visa_review_history FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'visa_review_history' AND policyname = 'Admins can create review history') THEN
    DROP POLICY "Admins can create review history" ON visa_review_history;
    CREATE POLICY "Admins can create review history" ON visa_review_history FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 7. notification_preferences (1 policy)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'notification_preferences' AND policyname = 'Users can manage own preferences') THEN
    DROP POLICY "Users can manage own preferences" ON notification_preferences;
    CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 8. analytics_events (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'Admins can view all analytics events') THEN
    DROP POLICY "Admins can view all analytics events" ON analytics_events;
    CREATE POLICY "Admins can view all analytics events" ON analytics_events FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_events' AND policyname = 'Users can create analytics events') THEN
    DROP POLICY "Users can create analytics events" ON analytics_events;
    CREATE POLICY "Users can create analytics events" ON analytics_events FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 9. analytics_user_activity (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_user_activity' AND policyname = 'Users can view own activity') THEN
    DROP POLICY "Users can view own activity" ON analytics_user_activity;
    CREATE POLICY "Users can view own activity" ON analytics_user_activity FOR SELECT TO authenticated USING ((select auth.uid()) = user_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'analytics_user_activity' AND policyname = 'Admins can view all activity') THEN
    DROP POLICY "Admins can view all activity" ON analytics_user_activity;
    CREATE POLICY "Admins can view all activity" ON analytics_user_activity FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  -- 10. error_logs (2 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'Admins can view all error logs') THEN
    DROP POLICY "Admins can view all error logs" ON error_logs;
    CREATE POLICY "Admins can view all error logs" ON error_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'error_logs' AND policyname = 'Users can create error logs') THEN
    DROP POLICY "Users can create error logs" ON error_logs;
    CREATE POLICY "Users can create error logs" ON error_logs FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  -- 11. events (3 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Organizers can delete own events') THEN
    DROP POLICY "Organizers can delete own events" ON events;
    CREATE POLICY "Organizers can delete own events" ON events FOR DELETE TO authenticated USING ((select auth.uid()) = organizer_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Authenticated users can create events') THEN
    DROP POLICY "Authenticated users can create events" ON events;
    CREATE POLICY "Authenticated users can create events" ON events FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = organizer_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Organizers can update own events') THEN
    DROP POLICY "Organizers can update own events" ON events;
    CREATE POLICY "Organizers can update own events" ON events FOR UPDATE TO authenticated USING ((select auth.uid()) = organizer_id) WITH CHECK ((select auth.uid()) = organizer_id);
  END IF;



  -- 13. payments (4 policies)
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admin can view all payments') THEN
    DROP POLICY "Admin can view all payments" ON payments;
    CREATE POLICY "Admin can view all payments" ON payments FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admin can insert payments') THEN
    DROP POLICY "Admin can insert payments" ON payments;
    CREATE POLICY "Admin can insert payments" ON payments FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admin can update payments') THEN
    DROP POLICY "Admin can update payments" ON payments;
    CREATE POLICY "Admin can update payments" ON payments FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true)) WITH CHECK (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Admin can delete payments') THEN
    DROP POLICY "Admin can delete payments" ON payments;
    CREATE POLICY "Admin can delete payments" ON payments FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM admin_roles WHERE user_id = (select auth.uid()) AND is_active = true));
  END IF;

END $$;

COMMENT ON TABLE public.admin_roles IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.admin_audit_logs IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.admin_activity_log IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.user_presence IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.visa_templates IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.visa_review_history IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.notification_preferences IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.analytics_events IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.analytics_user_activity IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.error_logs IS 'RLS policies optimized for performance (Batch 6)';
COMMENT ON TABLE public.events IS 'RLS policies optimized for performance (Batch 6)';


COMMENT ON TABLE public.payments IS 'RLS policies optimized for performance (Batch 6)';
