/*
  # Community Enhancements

  1. Changes
    - Add edited tracking for posts and comments
    - Create reports table for posts and comments
    - Add soft delete capability
    - Add image attachments support

  2. Security
    - Enable RLS on reports table
    - Add policies for editing/deleting own content
    - Add policies for reporting content
*/

-- Add edited tracking to community_posts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN edited_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_posts' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE community_posts ADD COLUMN image_urls text[];
  END IF;
END $$;

-- Add edited tracking to community_comments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_comments' AND column_name = 'edited_at'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN edited_at timestamptz;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'community_comments' AND column_name = 'is_deleted'
  ) THEN
    ALTER TABLE community_comments ADD COLUMN is_deleted boolean DEFAULT false;
  END IF;
END $$;

-- Create reports table for community content
CREATE TABLE IF NOT EXISTS community_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL CHECK (content_type IN ('post', 'comment')),
  content_id uuid NOT NULL,
  reported_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE community_reports ENABLE ROW LEVEL SECURITY;

-- Policy: Users can create reports
CREATE POLICY "Users can report content"
  ON community_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reported_by);

-- Policy: Users can view their own reports
CREATE POLICY "Users can view own reports"
  ON community_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = reported_by);

-- Policy: Admins can view all reports
CREATE POLICY "Admins can view all community reports"
  ON community_reports
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Policy: Admins can update reports
CREATE POLICY "Admins can update community reports"
  ON community_reports
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

-- Policy: Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON community_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Policy: Users can delete (soft delete) their own posts
CREATE POLICY "Users can delete own posts"
  ON community_posts
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND NOT is_deleted)
  WITH CHECK (auth.uid() = author_id);

-- Policy: Users can update their own comments
CREATE POLICY "Users can update own comments"
  ON community_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- Policy: Users can delete (soft delete) their own comments
CREATE POLICY "Users can delete own comments"
  ON community_comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id AND NOT is_deleted)
  WITH CHECK (auth.uid() = author_id);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_reports_content ON community_reports(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_community_reports_status ON community_reports(status);
CREATE INDEX IF NOT EXISTS idx_community_posts_deleted ON community_posts(is_deleted);
CREATE INDEX IF NOT EXISTS idx_community_comments_deleted ON community_comments(is_deleted);
