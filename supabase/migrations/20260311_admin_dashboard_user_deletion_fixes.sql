-- Admin Dashboard, User Deletion, and Payment Management Fixes
-- Created: 2026-03-11
-- Fixes issues:
-- 1. Admin dashboard stats counting deleted/banned users
-- 2. Delete and ban buttons not working
-- 3. Deleted users remaining as active profiles
-- 4. Sales and Payments missing delete capability

-- =====================================================
-- ISSUE #1: Fix Admin Dashboard Stats to Exclude Deleted/Banned Users
-- =====================================================

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
    -- Only count active, non-banned users
    'totalUsers', (
      SELECT count(*) 
      FROM profiles 
      WHERE is_banned IS NOT TRUE 
      AND deleted_at IS NULL
    ),
    
    -- Jobs: Filter by active status
    'totalJobs', (
      SELECT count(*) 
      FROM jobs 
      WHERE status != 'archived' 
      AND status != 'draft'
    ),
    
    -- Marketplace: Only active items
    'totalMarketplaceItems', (
      CASE 
        WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'marketplace_items') 
        THEN (SELECT count(*) FROM marketplace_items WHERE status = 'active')
        ELSE 0 
      END
    ),
    
    -- Events: Only published
    'totalEvents', (
      SELECT count(*) 
      FROM events 
      WHERE status = 'published'
    ),
    
    -- Education: Only active programs
    'totalEducationPrograms', (
      SELECT count(*) 
      FROM education_resources 
      WHERE status = 'active'
    ),
    
    'pendingJobApplications', (
      SELECT count(*) 
      FROM job_applications 
      WHERE status = 'pending'
    ),
    
    'pendingEducationInterests', (
      SELECT count(*) 
      FROM education_interests 
      WHERE status = 'submitted'
    ),
    
    'pendingVisaApplications', (
      SELECT count(*) 
      FROM visa_applications 
      WHERE status = 'submitted' OR status = 'documents_requested'
    ),
    
    -- Only active conversations (not blocked)
    'activeConversations', (
      SELECT count(*) 
      FROM conversations 
      WHERE is_blocked IS NOT TRUE
    ),
    
    -- Au Pairs: Only active profiles (exclude deleted, banned, pending)
    'totalAuPairs', (
      SELECT count(*) 
      FROM au_pair_profiles 
      WHERE profile_status = 'active'
    ),
    
    -- Host Families: Only active profiles
    'totalHostFamilies', (
      SELECT count(*) 
      FROM host_family_profiles 
      WHERE profile_status = 'active'
    ),
    
    -- Payments: Only pending submissions
    'pendingPaymentSubmissions', (
      SELECT count(*) 
      FROM payment_submissions 
      WHERE status = 'pending'
      AND deleted_at IS NULL
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- =====================================================
-- ISSUE #3: Create blocked_emails table for signup prevention
-- =====================================================

-- Create table to store blocked email addresses
CREATE TABLE IF NOT EXISTS blocked_emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  email_hash text GENERATED ALWAYS AS (lower(trim(email))) STORED,
  reason text DEFAULT 'admin_deleted',
  blocked_at timestamptz DEFAULT now(),
  blocked_by uuid REFERENCES auth.users(id),
  original_user_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create index for fast email lookup
CREATE INDEX IF NOT EXISTS idx_blocked_emails_hash ON blocked_emails(email_hash);
CREATE INDEX IF NOT EXISTS idx_blocked_emails_email ON blocked_emails(email);

-- Add RLS policies
ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check if their email is blocked (for signup flow)
DROP POLICY IF EXISTS "Users can check blocked status" ON blocked_emails;
CREATE POLICY "Users can check blocked status"
  ON blocked_emails FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can insert/delete from blocked_emails
DROP POLICY IF EXISTS "Admins can manage blocked emails" ON blocked_emails;
CREATE POLICY "Admins can manage blocked emails"
  ON blocked_emails FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- =====================================================
-- ISSUE #3: Update admin_delete_user to properly handle deletion
-- =====================================================

DROP FUNCTION IF EXISTS public.admin_delete_user(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_user(target_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
  v_success boolean := false;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent self-deletion
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot delete your own account via admin function';
  END IF;

  -- Get user email before deletion
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = target_user_id;

  -- Soft delete the user profile instead of hard delete
  -- Mark as deleted in profiles table
  UPDATE profiles
  SET 
    deleted_at = now(),
    is_banned = true,
    updated_at = now()
  WHERE id = target_user_id;

  -- Delete or anonymize au_pair_profile
  UPDATE au_pair_profiles
  SET 
    profile_status = 'deleted',
    updated_at = now()
  WHERE user_id = target_user_id;

  -- Delete or anonymize host_family_profile
  UPDATE host_family_profiles
  SET 
    profile_status = 'deleted',
    updated_at = now()
  WHERE user_id = target_user_id;

  -- Add email to blocked_emails table to prevent re-signup
  IF v_email IS NOT NULL THEN
    INSERT INTO blocked_emails (email, original_user_id, reason, blocked_by)
    VALUES (v_email, target_user_id, 'admin_deleted', auth.uid())
    ON CONFLICT (email_hash) DO UPDATE
    SET 
      blocked_at = now(),
      reason = 'admin_deleted',
      blocked_by = auth.uid(),
      original_user_id = target_user_id,
      metadata = blocked_emails.metadata || jsonb_build_object('redeleted_at', now());
  END IF;

  -- Delete the auth user (this is irreversible)
  DELETE FROM auth.users WHERE id = target_user_id;

  v_success := true;

  RETURN json_build_object(
    'success', v_success, 
    'user_id', target_user_id,
    'email_blocked', v_email IS NOT NULL
  );
END;
$$;

-- =====================================================
-- ISSUE #2: Add ban_user function
-- =====================================================

DROP FUNCTION IF EXISTS public.admin_ban_user(uuid, boolean);
CREATE OR REPLACE FUNCTION public.admin_ban_user(target_user_id uuid, should_ban boolean)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email text;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Prevent self-banning
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot ban yourself';
  END IF;

  -- Get user email
  SELECT email INTO v_email
  FROM auth.users
  WHERE id = target_user_id;

  -- Update ban status
  UPDATE profiles
  SET 
    is_banned = should_ban,
    updated_at = now()
  WHERE id = target_user_id;

  -- If banning, also ban associated profiles
  IF should_ban THEN
    UPDATE au_pair_profiles
    SET profile_status = 'banned', updated_at = now()
    WHERE user_id = target_user_id;

    UPDATE host_family_profiles
    SET profile_status = 'banned', updated_at = now()
    WHERE user_id = target_user_id;

    -- Add to blocked emails
    IF v_email IS NOT NULL THEN
      INSERT INTO blocked_emails (email, original_user_id, reason, blocked_by)
      VALUES (v_email, target_user_id, 'admin_banned', auth.uid())
      ON CONFLICT (email_hash) DO NOTHING;
    END IF;
  ELSE
    -- If unbanning, remove from blocked emails
    DELETE FROM blocked_emails
    WHERE original_user_id = target_user_id
    AND reason = 'admin_banned';

    -- Restore profile statuses to active
    UPDATE au_pair_profiles
    SET profile_status = 'active', updated_at = now()
    WHERE user_id = target_user_id;

    UPDATE host_family_profiles
    SET profile_status = 'active', updated_at = now()
    WHERE user_id = target_user_id;
  END IF;

  RETURN json_build_object(
    'success', true, 
    'user_id', target_user_id,
    'banned', should_ban
  );
END;
$$;

-- =====================================================
-- ISSUE #4: Add delete_payment_submission function
-- =====================================================

DROP FUNCTION IF EXISTS public.admin_delete_payment_submission(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_payment_submission(submission_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_image_url text;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get image URL for cleanup
  SELECT image_url INTO v_image_url
  FROM payment_submissions
  WHERE id = submission_id;

  -- Soft delete the payment submission
  UPDATE payment_submissions
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  WHERE id = submission_id;

  -- Note: Storage cleanup can be handled separately if needed
  -- For now, we keep the file but mark the record as deleted

  RETURN json_build_object(
    'success', true, 
    'submission_id', submission_id,
    'deleted', true
  );
END;
$$;

-- =====================================================
-- ISSUE #3: Add function to check if email is blocked
-- =====================================================

DROP FUNCTION IF EXISTS public.is_email_blocked(text);
CREATE OR REPLACE FUNCTION public.is_email_blocked(check_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_blocked boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM blocked_emails
    WHERE email_hash = lower(trim(check_email))
  ) INTO v_is_blocked;

  RETURN v_is_blocked;
END;
$$;

-- Grant execute permissions to authenticated users (for signup flow)
GRANT EXECUTE ON FUNCTION public.is_email_blocked TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_ban_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_user TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_payment_submission TO authenticated;

-- =====================================================
-- ISSUE #1: Add indexes for better performance on stats queries
-- =====================================================

-- Index for active user counts
CREATE INDEX IF NOT EXISTS idx_profiles_banned_deleted 
  ON profiles(is_banned, deleted_at) 
  WHERE is_banned IS NOT TRUE AND deleted_at IS NULL;

-- Index for active au pair profiles
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_status 
  ON au_pair_profiles(profile_status) 
  WHERE profile_status = 'active';

-- Index for active host family profiles
CREATE INDEX IF NOT EXISTS idx_host_family_profiles_status 
  ON host_family_profiles(profile_status) 
  WHERE profile_status = 'active';

-- Index for pending payments
CREATE INDEX IF NOT EXISTS idx_payment_submissions_pending_deleted 
  ON payment_submissions(status, deleted_at) 
  WHERE status = 'pending' AND deleted_at IS NULL;

-- =====================================================
-- ISSUE #2: Add trigger to auto-update updated_at timestamps
-- =====================================================

-- Ensure updated_at is set on blocked_emails
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_blocked_emails_updated_at ON blocked_emails;
CREATE TRIGGER update_blocked_emails_updated_at
  BEFORE UPDATE ON blocked_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Summary of Changes
-- =====================================================

-- 1. Fixed get_admin_dashboard_stats() to exclude deleted/banned users
-- 2. Created blocked_emails table to prevent re-signup
-- 3. Updated admin_delete_user() to:
--    - Soft delete profiles instead of just hard deleting
--    - Add email to blocked_emails table
--    - Mark profiles as deleted/banned
-- 4. Added admin_ban_user() function for banning/unbanning
-- 5. Added admin_delete_payment_submission() for payment deletion
-- 6. Added is_email_blocked() function for signup validation
-- 7. Added performance indexes for dashboard stats queries
-- 8. All functions include proper admin permission checks
