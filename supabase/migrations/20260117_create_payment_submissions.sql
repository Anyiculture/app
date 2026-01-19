-- Create a table for managing manual payment proofs (QR scan uploads)
CREATE TABLE IF NOT EXISTS payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('au_pair_premium_monthly', 'au_pair_premium_yearly', 'job_posting', 'featured_listing')),
  amount decimal(10, 2), -- Optional, admin can fill this in or it can be inferred from plan_type
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Admin Review
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can insert their own submissions
CREATE POLICY "Users can insert own submissions"
  ON payment_submissions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own submissions
CREATE POLICY "Users can view own submissions"
  ON payment_submissions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
  ON payment_submissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- Admins can update submissions (approve/reject)
CREATE POLICY "Admins can update submissions"
  ON payment_submissions FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- RPC Function to Review Payment
-- This function handles the approval logic (updating subscription) and status change transactionally
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

  -- Verify Admin Role (Double check inside function for security)
  IF NOT EXISTS (
    SELECT 1 FROM user_roles ur 
    JOIN roles r ON ur.role_id = r.id 
    WHERE ur.user_id = v_admin_id AND r.name = 'admin'
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
    -- Update User Profile based on plan_type
    IF v_submission.plan_type LIKE 'au_pair_premium%' THEN
      UPDATE profiles
      SET au_pair_subscription_status = 'premium',
          updated_at = now()
      WHERE id = v_submission.user_id;
      
      v_message := 'Payment approved and subscription activated.';
    ELSE
      -- Handle other types if needed
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
