-- Restore the expected jobs policies.
-- Batch 10 dropped owner management on jobs and later cleanup batches left the
-- table without a reliable policy set for posting and deleting.

DO $$
BEGIN
  ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

  DROP POLICY IF EXISTS "Authenticated users can view active jobs" ON public.jobs;
  CREATE POLICY "Authenticated users can view active jobs"
    ON public.jobs
    FOR SELECT
    TO authenticated
    USING (status = 'active');

  DROP POLICY IF EXISTS "Job posters can view own jobs" ON public.jobs;
  CREATE POLICY "Job posters can view own jobs"
    ON public.jobs
    FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = poster_id);

  DROP POLICY IF EXISTS "Job posters can create own jobs" ON public.jobs;
  CREATE POLICY "Job posters can create own jobs"
    ON public.jobs
    FOR INSERT
    TO authenticated
    WITH CHECK ((select auth.uid()) = poster_id);

  DROP POLICY IF EXISTS "Job posters can update own jobs" ON public.jobs;
  CREATE POLICY "Job posters can update own jobs"
    ON public.jobs
    FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = poster_id)
    WITH CHECK ((select auth.uid()) = poster_id);

  DROP POLICY IF EXISTS "Job posters can delete own jobs" ON public.jobs;
  CREATE POLICY "Job posters can delete own jobs"
    ON public.jobs
    FOR DELETE
    TO authenticated
    USING ((select auth.uid()) = poster_id);

  DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
  CREATE POLICY "Admins can view all jobs"
    ON public.jobs
    FOR SELECT
    TO authenticated
    USING (is_admin_internal());

  DROP POLICY IF EXISTS "Admins can update jobs" ON public.jobs;
  CREATE POLICY "Admins can update jobs"
    ON public.jobs
    FOR UPDATE
    TO authenticated
    USING (is_admin_internal())
    WITH CHECK (is_admin_internal());

  DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
  CREATE POLICY "Admins can delete jobs"
    ON public.jobs
    FOR DELETE
    TO authenticated
    USING (is_admin_internal());
END $$;
