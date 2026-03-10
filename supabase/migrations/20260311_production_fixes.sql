-- Production fixes: notifications, subscriptions, messaging, payment deletion
-- Created: 2026-03-11
-- Fixes issues: 
-- 1) Approval notifications in navbar
-- 2) Stale profile state  
-- 3) Contact failures
-- 4) Subscription display
-- 5) Payment deletion

-- =====================================================
-- ISSUE #1: Automatic approval notifications
-- =====================================================

-- Create trigger function to notify users when payment is approved
CREATE OR REPLACE FUNCTION notify_user_payment_approved()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger on status change to 'approved'
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        -- Insert English notification
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            link_url,
            metadata,
            is_read
        ) VALUES (
            NEW.user_id,
            'payment_update',
            'Your host family account has been approved',
            'Your host family account has been approved. You can now contact au pairs.',
            '/au-pairs',
            jsonb_build_object('submission_id', NEW.id, 'plan_type', NEW.plan_type),
            false
        );
        
        -- Insert Chinese notification for zh-language users
        INSERT INTO notifications (
            user_id,
            type,
            title,
            message,
            link_url,
            metadata,
            is_read
        ) VALUES (
            NEW.user_id,
            'payment_update_zh',
            '您的寄宿家庭账户已通过审核',
            '您的寄宿家庭账户已通过审核。您现在可以联系互惠生。',
            '/au-pairs',
            jsonb_build_object('submission_id', NEW.id, 'plan_type', NEW.plan_type),
            false
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_payment_approved ON payment_submissions;
CREATE TRIGGER on_payment_approved
    AFTER UPDATE ON payment_submissions
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status AND NEW.status = 'approved')
    EXECUTE FUNCTION notify_user_payment_approved();

-- =====================================================
-- ISSUE #4 & #5: Subscription tracking and payment deletion
-- =====================================================

-- Add soft delete columns for payment submissions
ALTER TABLE payment_submissions 
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);

-- Ensure subscription timing columns exist in profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS host_family_subscription_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS host_family_subscription_start timestamptz,
  ADD COLUMN IF NOT EXISTS host_family_subscription_end timestamptz;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS au_pair_subscription_start timestamptz,
  ADD COLUMN IF NOT EXISTS au_pair_subscription_end timestamptz;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread 
  ON notifications(user_id, is_read) 
  WHERE is_read = false;

CREATE INDEX IF NOT EXISTS idx_payment_submissions_deleted 
  ON payment_submissions(deleted_at) 
  WHERE deleted_at IS NOT NULL;

-- Update RLS policies for payment deletion
DROP POLICY IF EXISTS "Admins can delete payment submissions" ON payment_submissions;
CREATE POLICY "Admins can delete payment submissions"
  ON payment_submissions FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Admins can archive payment submissions" ON payment_submissions;
CREATE POLICY "Admins can archive payment submissions"
  ON payment_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- Create view excluding deleted payments by default
CREATE OR REPLACE VIEW active_payment_submissions AS
SELECT * FROM payment_submissions
WHERE deleted_at IS NULL;

-- =====================================================
-- Fix review_payment_submission to set proper subscription dates
-- =====================================================

CREATE OR REPLACE FUNCTION review_payment_submission(
  submission_id uuid,
  new_status text,
  notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
  v_submission payment_submissions%ROWTYPE;
  v_success boolean := false;
  v_message text;
BEGIN
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = v_admin_id
      AND is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Not authorized');
  END IF;

  SELECT * INTO v_submission
  FROM payment_submissions
  WHERE id = submission_id
  FOR UPDATE;

  IF v_submission.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Submission not found');
  END IF;

  IF v_submission.status != 'pending' THEN
    RETURN json_build_object('success', false, 'message', 'Submission already reviewed');
  END IF;

  IF new_status = 'approved' THEN
    IF v_submission.plan_type LIKE 'au_pair_premium%' THEN
      UPDATE profiles
      SET au_pair_subscription_status = 'premium',
          au_pair_subscription_start = now(),
          au_pair_subscription_end = CASE
            WHEN v_submission.plan_type = 'au_pair_premium_yearly'
              THEN now() + interval '1 year'
            ELSE now() + interval '1 month'
          END,
          updated_at = now()
      WHERE id = v_submission.user_id;

      v_message := 'Payment approved and au pair subscription activated.';

    ELSIF v_submission.plan_type LIKE 'host_family%' THEN
      UPDATE profiles
      SET 
          host_family_subscription_status = 'premium',
          host_family_subscription_start = now(),
          host_family_subscription_end = CASE
            WHEN v_submission.plan_type = 'host_family_premium_yearly'
              THEN now() + interval '1 year'
            ELSE now() + interval '1 month'
          END,
          updated_at = now()
      WHERE id = v_submission.user_id;

      UPDATE host_family_profiles
      SET 
         profile_status = 'active',
          updated_at = now()
      WHERE user_id = v_submission.user_id;

      v_message := 'Payment approved and host family subscription activated. They can now contact au pairs.';

    ELSE
      v_message := 'Payment approved.';
    END IF;

    v_success := true;

  ELSIF new_status = 'rejected' THEN
    v_success := true;
    v_message := 'Payment rejected.';
  ELSE
    RETURN json_build_object('success', false, 'message', 'Invalid status');
  END IF;

  IF v_success THEN
    UPDATE payment_submissions
    SET status = new_status,
        admin_notes = notes,
      reviewed_by = v_admin_id,
      reviewed_at = now(),
        updated_at = now()
    WHERE id = submission_id;
  END IF;

  RETURN json_build_object('success', v_success, 'message', v_message);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION review_payment_submission TO authenticated;
GRANT EXECUTE ON FUNCTION notify_user_payment_approved TO authenticated;
