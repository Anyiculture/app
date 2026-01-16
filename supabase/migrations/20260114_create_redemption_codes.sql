-- Create a table for managing redemption codes (manual payments/gift codes)
CREATE TABLE IF NOT EXISTS redemption_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  type text NOT NULL CHECK (type IN ('au_pair_premium', 'job_posting', 'featured_listing')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'used', 'expired')),
  
  -- Tracking usage
  created_by uuid REFERENCES auth.users(id),
  used_by uuid REFERENCES auth.users(id),
  used_at timestamptz,
  expires_at timestamptz,
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE redemption_codes ENABLE ROW LEVEL SECURITY;

-- Policies
-- Only admins can create/view codes
CREATE POLICY "Admins can view all codes"
  ON redemption_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

CREATE POLICY "Admins can insert codes"
  ON redemption_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      JOIN roles r ON ur.role_id = r.id 
      WHERE ur.user_id = auth.uid() AND r.name = 'admin'
    )
  );

-- RPC Function to Redeem a Code
-- This function securely checks and redeems a code in a single transaction
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

-- Seed some initial codes for testing (since we can't easily use the admin panel yet)
-- In production, you would generate these via an admin dashboard
INSERT INTO redemption_codes (code, type, status)
VALUES 
  ('WELCOME2026', 'au_pair_premium', 'active'),
  ('ANYI-VIP-001', 'au_pair_premium', 'active'),
  ('ANYI-VIP-002', 'au_pair_premium', 'active'),
  ('ANYI-VIP-003', 'au_pair_premium', 'active')
ON CONFLICT (code) DO NOTHING;
