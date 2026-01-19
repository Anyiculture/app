-- Secure RPCs for Visa Administration
-- These functions allow admins to bypass RLS for specific actions

-- 1. Update Visa Status (Admin)
CREATE OR REPLACE FUNCTION update_visa_status_admin(
  p_application_id uuid,
  p_status text,
  p_admin_notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the function creator (admin)
AS $$
DECLARE
  v_result jsonb;
  v_admin_id uuid;
BEGIN
  -- Get current user ID
  v_admin_id := auth.uid();

  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = v_admin_id 
    AND role IN ('admin', 'super_admin') 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin permissions required';
  END IF;

  -- Update the application
  UPDATE visa_applications
  SET 
    status = p_status,
    admin_notes = COALESCE(p_admin_notes, admin_notes),
    reviewed_by = v_admin_id,
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_application_id
  RETURNING to_jsonb(visa_applications.*) INTO v_result;

  IF v_result IS NULL THEN
    RAISE EXCEPTION 'Visa application not found';
  END IF;

  -- Create history entry
  INSERT INTO visa_application_history (
    application_id,
    new_status,
    changed_by,
    notes,
    previous_status
  )
  SELECT 
    p_application_id,
    p_status,
    v_admin_id,
    COALESCE(p_admin_notes, 'Status updated by admin'),
    (v_result->>'status')
  ;

  RETURN v_result;
END;
$$;

-- 2. Delete Visa Application (Admin)
CREATE OR REPLACE FUNCTION delete_visa_application_admin(
  p_application_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_admin_id uuid;
BEGIN
  -- Get current user ID
  v_admin_id := auth.uid();

  -- Verify admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM admin_roles 
    WHERE user_id = v_admin_id 
    AND role IN ('admin', 'super_admin') 
    AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied: Admin permissions required';
  END IF;

  -- Delete the application
  DELETE FROM visa_applications
  WHERE id = p_application_id;

  -- Note: Cascading deletes should handle related records (documents, history, etc.)
  -- if foreign keys are set up correctly with ON DELETE CASCADE
END;
$$;
