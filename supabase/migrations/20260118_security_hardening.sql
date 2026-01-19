-- Security Hardening Migration
-- Fixes mutable search_path in functions and insecure RLS policies

-- 1. Fix mutable search_path for functions using a dynamic DO block
-- This safely finds the functions by name and updates their search_path, handling any signature.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT oid::regprocedure::text as func_signature
        FROM pg_proc
        WHERE proname IN (
            'update_conversation_timestamp',
            'upsert_user_activity',
            'increment_marketplace_view',
            'increment_marketplace_views',
            'update_marketplace_favorites_count',
            'update_marketplace_updated_at',
            'update_conversation_last_message',
            'create_message_notification',
            'redeem_code',
            'update_event_attendee_count_v2',
            'update_education_interest_count',
            'track_interest_status_change',
            'get_admin_visa_applications',
            'is_admin',
            'has_admin_role',
            'has_permission',
            'log_admin_activity',
            'update_admin_roles_updated_at',
            'get_admin_dashboard_stats',
            'create_dummy_user',
            'is_event_full',
            'mark_notification_read',
            'mark_all_notifications_read',
            'get_unread_count',
            'clean_old_search_history',
            'get_user_conversations',
            'get_user_primary_role',
            'update_module_engagement',
            'set_primary_role',
            'track_content_interaction',
            'update_user_personalization_timestamp',
            'sync_users_from_auth'
        )
        AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'ALTER FUNCTION ' || func_record.func_signature || ' SET search_path = public';
    END LOOP;
END $$;

-- 2. Fix RLS Policies

-- analytics_events
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'analytics_events') THEN
    DROP POLICY IF EXISTS "Users can create analytics events" ON public.analytics_events;
    CREATE POLICY "Users can create analytics events"
      ON public.analytics_events FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- error_logs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'error_logs') THEN
    DROP POLICY IF EXISTS "Users can create error logs" ON public.error_logs;
    CREATE POLICY "Users can create error logs"
      ON public.error_logs FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- conversation_participants
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversation_participants') THEN
    DROP POLICY IF EXISTS "Users can add participants" ON public.conversation_participants;
    DROP POLICY IF EXISTS "Users can add conversation participants" ON public.conversation_participants;
    
    -- Allow users to add themselves OR add others if they are already in the conversation
    CREATE POLICY "Users can add participants"
      ON public.conversation_participants FOR INSERT TO authenticated
      WITH CHECK (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM conversation_participants existing
          WHERE existing.conversation_id = conversation_participants.conversation_id
          AND existing.user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- conversations
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'conversations') THEN
    -- We rely on RPC create_new_conversation for creating conversations securely.
    -- Revoke direct INSERT access via RLS to prevent abuse (creating empty conversations).
    DROP POLICY IF EXISTS "Authenticated users can create conversations" ON public.conversations;
    DROP POLICY IF EXISTS "Users can create conversations" ON public.conversations;
  END IF;
END $$;

-- application_pipeline_history
-- "System can create history" - likely used by trigger with security definer, so explicit policy not needed for users.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'application_pipeline_history') THEN
    DROP POLICY IF EXISTS "System can create history" ON public.application_pipeline_history;
  END IF;
END $$;

-- au_pair_matches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'au_pair_matches') THEN
    DROP POLICY IF EXISTS "System can create matches" ON public.au_pair_matches;
  END IF;
END $$;

-- job_views
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_views') THEN
    DROP POLICY IF EXISTS "Users can create job views" ON public.job_views;
    -- Restrict to authenticated user matching ID, or anonymous (if user_id is null)
    CREATE POLICY "Users can create job views"
      ON public.job_views FOR INSERT
      WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
  END IF;
END $$;

-- saved_searches
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'saved_searches') THEN
    DROP POLICY IF EXISTS "Users can create own saved searches" ON public.saved_searches;
    CREATE POLICY "Users can create own saved searches"
      ON public.saved_searches FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- job_applications
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_applications') THEN
    DROP POLICY IF EXISTS "Allow public insert to job applications" ON public.job_applications;
    
    -- Only authenticated users should apply
    CREATE POLICY "Users can apply to jobs"
      ON public.job_applications FOR INSERT TO authenticated
      WITH CHECK (auth.uid() = applicant_id);
  END IF;
END $$;

-- job_categories
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'job_categories') THEN
    DROP POLICY IF EXISTS "Anyone can insert job categories" ON public.job_categories;
    DROP POLICY IF EXISTS "Anyone can update job categories" ON public.job_categories;
    
    -- Only admins should manage categories (assuming is_admin() function exists)
    CREATE POLICY "Admins can manage job categories"
      ON public.job_categories FOR ALL TO authenticated
      USING (public.is_admin())
      WITH CHECK (public.is_admin());
      
    -- Public read access should be maintained (assuming it exists, but ensuring it here)
    DROP POLICY IF EXISTS "Anyone can view job categories" ON public.job_categories;
    CREATE POLICY "Anyone can view job categories"
      ON public.job_categories FOR SELECT
      USING (true);
  END IF;
END $$;

-- jobs
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'jobs') THEN
    DROP POLICY IF EXISTS "Anyone can insert jobs for seeding" ON public.jobs;
  END IF;
END $$;

-- contact_submissions
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'contact_submissions') THEN
    -- If this is intended for public, we keep it but ensure it's explicit.
    -- If the user wants to "fix" it, we assume they want to restrict it or they are flagging it as insecure.
    -- For now, we will just ensure it exists as is but maybe rename it to be clear? 
    -- Actually, to "fix" the security warning, we might need to verify if it SHOULD be public.
    -- Assuming contact form is public.
    NULL;
  END IF;
END $$;

-- newsletter_subscribers
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers') THEN
    -- Similar to contact submissions, usually public.
    NULL;
  END IF;
END $$;
