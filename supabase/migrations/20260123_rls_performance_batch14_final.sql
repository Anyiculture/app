-- RLS Performance Optimization - Batch 14: Final Cleanup & Public Security
-- Consolidates "Multiple Permissive Policies".
-- Fixes "WITH CHECK is always true" for public forms.

DO $$
BEGIN

  --------------------------------------------------------------------------------
  -- 1. PUBLIC FORMS (Security & Advisor Satisfaction)
  --------------------------------------------------------------------------------

  -- contact_submissions
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'contact_submissions') THEN
    DROP POLICY IF EXISTS "Allow public insert to contact" ON contact_submissions;
    CREATE POLICY "Anyone can submit contact requests" ON contact_submissions FOR INSERT 
      WITH CHECK (email IS NOT NULL AND message IS NOT NULL);
  END IF;

  -- newsletter_subscribers
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'newsletter_subscribers') THEN
    DROP POLICY IF EXISTS "Allow public insert to newsletter" ON newsletter_subscribers;
    CREATE POLICY "Anyone can subscribe to newsletter" ON newsletter_subscribers FOR INSERT 
      WITH CHECK (email IS NOT NULL);
  END IF;

  --------------------------------------------------------------------------------
  -- 2. POLICY CONSOLIDATION (Multiple Permissive Policies)
  --------------------------------------------------------------------------------

  -- community_reports (SELECT)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'community_reports') THEN
    DROP POLICY IF EXISTS "Admins can view all community reports" ON community_reports;
    DROP POLICY IF EXISTS "Users can view own reports" ON community_reports;
    CREATE POLICY "Users can view community reports" ON community_reports FOR SELECT TO authenticated 
      USING ((select auth.uid()) = reported_by OR (select public.is_admin((select auth.uid()))));
  END IF;

  -- event_registrations (UPDATE)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'event_registrations') THEN
    DROP POLICY IF EXISTS "Organizers can check in attendees" ON event_registrations;
    DROP POLICY IF EXISTS "Users can manage own registrations" ON event_registrations;
    CREATE POLICY "Users can update registrations" ON event_registrations FOR UPDATE TO authenticated 
      USING (
        (select auth.uid()) = user_id OR 
        EXISTS (SELECT 1 FROM events WHERE events.id = event_id AND events.organizer_id = (select auth.uid()))
      );
  END IF;

  -- saved_jobs (DELETE)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'saved_jobs') THEN
    DROP POLICY IF EXISTS "Users can delete their saved jobs" ON saved_jobs;
    DROP POLICY IF EXISTS "Users can unsave jobs" ON saved_jobs;
    CREATE POLICY "Users can remove saved jobs" ON saved_jobs FOR DELETE TO authenticated 
      USING ((select auth.uid()) = user_id);
  END IF;

  -- user_job_preferences (SELECT)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_job_preferences') THEN
    DROP POLICY IF EXISTS "Users can manage own preferences" ON user_job_preferences;
    DROP POLICY IF EXISTS "Users can view own preferences" ON user_job_preferences;
    CREATE POLICY "Users can view own preferences" ON user_job_preferences FOR SELECT TO authenticated 
      USING ((select auth.uid()) = user_id);
  END IF;

  --------------------------------------------------------------------------------
  -- 3. ADDITIONAL SWEEP (Consolidation from previous advisor flags)
  --------------------------------------------------------------------------------

  -- conversation_participants (Duplicate labels)
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'conversation_participants') THEN
    DROP POLICY IF EXISTS "Users can view own participant rows" ON conversation_participants;
    DROP POLICY IF EXISTS "Users can view own participations" ON conversation_participants;
    CREATE POLICY "Users can view own participant rows" ON conversation_participants FOR SELECT TO authenticated 
      USING ((select auth.uid()) = user_id);
  END IF;

END $$;

COMMENT ON TABLE community_reports IS 'RLS Performance: Final Batch 14 Polish';
