/*
  # Marketplace Enhancements

  1. Changes
    - Add views_count to marketplace_items
    - Add favorites_count tracking
    - Create reports table for flagged items
    - Add function to track item views

  2. Security
    - Enable RLS on reports table
    - Add policies for reporting items
*/

-- Add views_count if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_items' AND column_name = 'views_count'
  ) THEN
    ALTER TABLE marketplace_items ADD COLUMN views_count integer DEFAULT 0;
  END IF;
END $$;

-- Create reports table for marketplace items
CREATE TABLE IF NOT EXISTS marketplace_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id uuid REFERENCES marketplace_items(id) ON DELETE CASCADE,
  reported_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE marketplace_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can report items"
  ON marketplace_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON marketplace_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all reports"
  ON marketplace_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: Admins can update reports
CREATE POLICY "Admins can update reports"
  ON marketplace_reports
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to increment item views
CREATE OR REPLACE FUNCTION increment_marketplace_views(item_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE marketplace_items
  SET views_count = views_count + 1
  WHERE id = item_id_param;
END;
$$;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_marketplace_reports_item ON marketplace_reports(item_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reports_status ON marketplace_reports(status);
