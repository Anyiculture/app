-- Fix broken policies and functions that referenced non-existent 'user_roles' table
-- Updates payment_submissions and redemption_codes to use 'admin_roles' instead.
-- Also ensures tables exist if previous migrations failed due to the 'user_roles' error.

-- 0. Ensure tables exist (in case previous migrations failed)

-- redemption_codes
CREATE TABLE IF NOT EXISTS redemption_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('au_pair_premium', 'job_posting', 'featured_listing')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  created_by uuid REFERENCES auth.users(id),
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- payment_submissions
CREATE TABLE IF NOT EXISTS payment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  image_url text NOT NULL,
  plan_type text NOT NULL CHECK (plan_type IN ('au_pair_premium_monthly', 'au_pair_premium_yearly', 'job_posting', 'featured_listing')),
  amount decimal(10, 2),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

DO $$
BEGIN
  -- Enable RLS if not already enabled
  ALTER TABLE payment_submissions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- 1. Fix payment_submissions policies
DO $$
BEGIN
  -- Drop old broken policies if they managed to get created
  DROP POLICY IF EXISTS "Admins can view all submissions" ON payment_submissions;
  DROP POLICY IF EXISTS "Admins can update submissions" ON payment_submissions;
  DROP POLICY IF EXISTS "Users can insert own submissions" ON payment_submissions;
  DROP POLICY IF EXISTS "Users can view own submissions" ON payment_submissions;
  
  -- Re-create User policies (safe to re-run)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Users can insert own submissions') THEN
    CREATE POLICY "Users can insert own submissions"
      ON payment_submissions FOR INSERT
      TO authenticated
      WITH CHECK ((select auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'payment_submissions' AND policyname = 'Users can view own submissions') THEN
    CREATE POLICY "Users can view own submissions"
      ON payment_submissions FOR SELECT
      TO authenticated
      USING ((select auth.uid()) = user_id);
  END IF;
  
  -- Create new correct Admin policies using admin_roles
  CREATE POLICY "Admins can view all submissions"
    ON payment_submissions FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = (select auth.uid())
          AND ar.role = 'admin'
          AND ar.is_active = true
      )
    );

  CREATE POLICY "Admins can update submissions"
    ON payment_submissions FOR UPDATE
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = (select auth.uid())
          AND ar.role = 'admin'
          AND ar.is_active = true
      )
    );
END $$;

-- 2. Fix review_payment_submission function
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

  -- Verify Admin Role (Corrected to use admin_roles)
  IF NOT EXISTS (
    SELECT 1 FROM admin_roles ar
    WHERE ar.user_id = v_admin_id 
      AND ar.role = 'admin'
      AND ar.is_active = true
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

-- 3. Fix redemption_codes policies
DO $$
BEGIN
  -- Drop old broken policies
  DROP POLICY IF EXISTS "Admins can view all codes" ON redemption_codes;
  DROP POLICY IF EXISTS "Admins can insert codes" ON redemption_codes;
  
  -- Create new correct policies using admin_roles
  CREATE POLICY "Admins can view all codes"
    ON redemption_codes FOR SELECT
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = (select auth.uid())
          AND ar.role = 'admin'
          AND ar.is_active = true
      )
    );

  CREATE POLICY "Admins can insert codes"
    ON redemption_codes FOR INSERT
    TO authenticated
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM admin_roles ar
        WHERE ar.user_id = (select auth.uid())
          AND ar.role = 'admin'
          AND ar.is_active = true
      )
    );
END $$;

-- 4. Fix redeem_code function (also referenced user_roles likely, or needs to be safe)
CREATE OR REPLACE FUNCTION redeem_code(code_input text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id uuid;
  v_code_record redemption_codes%ROWTYPE;
  v_success boolean := false;
  v_message text;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Not authenticated');
  END IF;

  -- Find the code
  SELECT * INTO v_code_record
  FROM redemption_codes
  WHERE code = code_input
  FOR UPDATE; -- Lock the row to prevent race conditions

  -- Validation Checks
  IF v_code_record.id IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Invalid code');
  END IF;

  IF v_code_record.status != 'active' THEN
    RETURN json_build_object('success', false, 'message', 'Code has already been used or is inactive');
  END IF;

  IF v_code_record.expires_at IS NOT NULL AND v_code_record.expires_at < now() THEN
    RETURN json_build_object('success', false, 'message', 'Code has expired');
  END IF;

  -- Apply Benefits based on Code Type
  IF v_code_record.type = 'au_pair_premium' THEN
    -- Update profile subscription status
    UPDATE profiles
    SET au_pair_subscription_status = 'premium',
        updated_at = now()
    WHERE id = v_user_id;
    
    v_success := true;
    v_message := 'Successfully upgraded to Au Pair Premium!';
  ELSE
    v_success := false;
    v_message := 'Unknown code type';
  END IF;

  -- Mark Code as Used if successful
  IF v_success THEN
    UPDATE redemption_codes
    SET status = 'used',
        used_by = v_user_id,
        used_at = now(),
        updated_at = now()
    WHERE id = v_code_record.id;
  END IF;

  RETURN json_build_object('success', v_success, 'message', v_message);
END;
$$;
