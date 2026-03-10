-- Add pending payment submissions count to admin dashboard stats
CREATE OR REPLACE FUNCTION get_admin_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result json;
BEGIN
  -- Check admin permission
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT json_build_object(
    'totalUsers', (SELECT count(*) FROM profiles),
    -- Jobs: Filter by status != archived and status != draft
    'totalJobs', (SELECT count(*) FROM jobs WHERE status != 'archived' AND status != 'draft'),
    -- Marketplace: Filter by active status
    'totalMarketplaceItems', (
        CASE 
            WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_items') 
            THEN (SELECT count(*) FROM marketplace_items WHERE status = 'active')
            ELSE 0 
        END
    ),
    -- Events: Filter by published status
    'totalEvents', (SELECT count(*) FROM events WHERE status = 'published'),
    -- Education: Filter by active status
    'totalEducationPrograms', (SELECT count(*) FROM education_resources WHERE status = 'active'),
    
    'pendingJobApplications', (SELECT count(*) FROM job_applications WHERE status = 'pending'),
    'pendingEducationInterests', (SELECT count(*) FROM education_interests WHERE status = 'submitted'),
    'pendingVisaApplications', (SELECT count(*) FROM visa_applications WHERE status = 'submitted' OR status = 'documents_requested'),
    'activeConversations', (SELECT count(*) FROM conversations),
    
    -- Au Pairs: Filter by active profile status
    'totalAuPairs', (SELECT count(*) FROM au_pair_profiles WHERE profile_status = 'active'),
    -- Host Families: Filter by active profile status
    'totalHostFamilies', (SELECT count(*) FROM host_family_profiles WHERE profile_status = 'active'),
    
    -- Payments: Count pending submissions
    'pendingPaymentSubmissions', (SELECT count(*) FROM payment_submissions WHERE status = 'pending')
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- Fix notifications table schema to match frontend service and trigger expectations
DO $$
BEGIN
    -- Rename link to link_url if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'link') THEN
        ALTER TABLE notifications RENAME COLUMN link TO link_url;
    END IF;

    -- Rename read to is_read if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read') THEN
        ALTER TABLE notifications RENAME COLUMN read TO is_read;
    END IF;

    -- Add metadata column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'metadata') THEN
        ALTER TABLE notifications ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;
    END IF;

    -- Add read_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'notifications' AND column_name = 'read_at') THEN
        ALTER TABLE notifications ADD COLUMN read_at timestamptz;
    END IF;
END $$;

-- Allow admins to insert notifications (needed for adminService.updatePaymentSubmissionStatus)
DROP POLICY IF EXISTS "Admins can insert notifications" ON notifications;
CREATE POLICY "Admins can insert notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
        AND is_active = true
    )
  );

-- Allow users to insert notifications for themselves (e.g. for certain automated workflows)
DROP POLICY IF EXISTS "Users can insert own notifications" ON notifications;
CREATE POLICY "Users can insert own notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);
