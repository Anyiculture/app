-- Ensure correct RLS for Job Management
DO $$
BEGIN
  -- 1. Ensure Admins can select all jobs
  DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
  CREATE POLICY "Admins can view all jobs" ON jobs FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true)
  );

  -- 2. Ensure Admins can delete jobs
  DROP POLICY IF EXISTS "Admins can delete jobs" ON jobs;
  CREATE POLICY "Admins can delete jobs" ON jobs FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true)
  );
  
  -- 3. Ensure Admins can update jobs
  DROP POLICY IF EXISTS "Admins can update jobs" ON jobs;
  CREATE POLICY "Admins can update jobs" ON jobs FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM admin_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin') AND is_active = true)
  );
END $$;
