-- 1. Fix get_unread_count RPC
-- The error "column is_read does not exist" indicates the function is using `is_read` but the table uses `read`.
CREATE OR REPLACE FUNCTION get_unread_count()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT count(*)::integer
    FROM notifications
    WHERE user_id = auth.uid()
    AND read = false -- Fixed: using 'read' instead of 'is_read'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION get_unread_count TO authenticated;

-- 2. Fix conversations table
-- The error "Could not find the 'last_message' column" indicates this column is missing.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'conversations' 
        AND column_name = 'last_message'
    ) THEN
        ALTER TABLE conversations ADD COLUMN last_message text;
    END IF;
END $$;

-- 3. Fix visa_applications update error
-- The error PGRST116 (The result contains 0 rows) during update usually means the RLS policy is preventing the return of the updated row.
-- We need to ensure the user has SELECT permission on the row they just updated.

-- Drop existing restrictive policies if any
DROP POLICY IF EXISTS "Users can view own applications" ON visa_applications;
DROP POLICY IF EXISTS "Users can update own applications" ON visa_applications;

-- Re-create permissive policies
CREATE POLICY "Users can view own applications"
  ON visa_applications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own applications"
  ON visa_applications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Ensure Admin can also view/update (if needed for the specific flow failing)
CREATE POLICY "Admins can view all applications"
  ON visa_applications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
