-- RLS Performance Optimization - Batch 7: Meetings System
-- Corrects and optimizes policies for the meetings table using verified schema (organizer_id, recipient_id).

DO $$
BEGIN

  -- meetings table (3 policies)
  -- Verified columns: organizer_id, recipient_id
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Users can view meetings they are part of') THEN
    DROP POLICY "Users can view meetings they are part of" ON meetings;
    CREATE POLICY "Users can view meetings they are part of" ON meetings FOR SELECT TO authenticated USING ((select auth.uid()) = organizer_id OR (select auth.uid()) = recipient_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Users can create meetings') THEN
    DROP POLICY "Users can create meetings" ON meetings;
    CREATE POLICY "Users can create meetings" ON meetings FOR INSERT TO authenticated WITH CHECK ((select auth.uid()) = organizer_id);
  END IF;

  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meetings' AND policyname = 'Users can update meetings they are part of') THEN
    DROP POLICY "Users can update meetings they are part of" ON meetings;
    CREATE POLICY "Users can update meetings they are part of" ON meetings FOR UPDATE TO authenticated USING ((select auth.uid()) = organizer_id OR (select auth.uid()) = recipient_id) WITH CHECK ((select auth.uid()) = organizer_id OR (select auth.uid()) = recipient_id);
  END IF;

END $$;

COMMENT ON TABLE public.meetings IS 'RLS policies optimized for performance (Batch 7)';
