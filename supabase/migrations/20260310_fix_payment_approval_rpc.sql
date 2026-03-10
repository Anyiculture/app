-- Fix review_payment_submission RPC to:
-- 1. Handle host_family plan types (not only au_pair plans)
-- 2. Start monthly subscription timer for host families upon approval
-- 3. Use correct is_admin_internal() check instead of user_roles table

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
  -- Get current user (admin)
  v_admin_id := auth.uid();
  IF v_admin_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Verify Admin Role using admin_roles table (the correct table for this project)
  IF NOT EXISTS (
    SELECT 1 FROM admin_roles
    WHERE user_id = v_admin_id
      AND is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'message', 'Not authorized');
  END IF;

  -- Find the submission
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

  -- Process Approval
  IF new_status = 'approved' THEN

    -- Handle Au Pair Premium monthly/yearly plans
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

    -- Handle Host Family monthly/yearly plans
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

      -- Also update host_family_profiles so they can initiate conversations
      UPDATE host_family_profiles
      SET 
          profile_status = 'active',
          updated_at = now()
      WHERE user_id = v_submission.user_id;

      v_message := 'Payment approved and host family subscription activated. They can now contact au pairs.';

    ELSE
      -- Generic approval for other plan types (job_posting, featured_listing etc.)
      v_message := 'Payment approved.';
    END IF;

    v_success := true;

  ELSIF new_status = 'rejected' THEN
    v_success := true;
    v_message := 'Payment rejected.';
  ELSE
    RETURN json_build_object('success', false, 'message', 'Invalid status');
  END IF;

  -- Update Submission Record
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

-- Ensure profiles table has host_family subscription columns
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS host_family_subscription_status text DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS host_family_subscription_start timestamptz,
  ADD COLUMN IF NOT EXISTS host_family_subscription_end timestamptz;

-- Ensure profiles table has au_pair subscription timing columns  
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS au_pair_subscription_start timestamptz,
  ADD COLUMN IF NOT EXISTS au_pair_subscription_end timestamptz;
