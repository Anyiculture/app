/*
  # Global Search and Analytics System

  ## Search System
  
  1. New Tables
    - `search_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `query` (text) - The search query
      - `filters` (jsonb) - Applied filters
      - `result_count` (integer) - Number of results
      - `created_at` (timestamptz)
    
    - `saved_searches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text) - User-defined name for the search
      - `query` (text) - The search query
      - `filters` (jsonb) - Saved filters
      - `notification_enabled` (boolean) - Alert on new matches
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  ## Analytics System
  
  2. New Tables
    - `analytics_events`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable for anonymous)
      - `event_type` (text) - Type of event (page_view, click, search, etc.)
      - `event_name` (text) - Specific event name
      - `properties` (jsonb) - Event metadata
      - `session_id` (uuid) - User session identifier
      - `created_at` (timestamptz)
    
    - `analytics_user_activity`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date) - Activity date
      - `page_views` (integer) - Number of page views
      - `events_count` (integer) - Number of events
      - `session_duration_minutes` (integer) - Total session time
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `error_logs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users, nullable)
      - `error_type` (text) - Type of error
      - `error_message` (text) - Error message
      - `stack_trace` (text) - Stack trace
      - `url` (text) - URL where error occurred
      - `user_agent` (text) - Browser user agent
      - `metadata` (jsonb) - Additional context
      - `created_at` (timestamptz)

  3. Security
    - Enable RLS on all tables
    - Users can only access their own search history and saved searches
    - Analytics events are write-only for users, read for admins
    - Error logs are write-only for users, read for admins

  4. Indexes
    - Index on search queries for performance
    - Index on event types and timestamps
    - Index on user_id for fast lookups
*/

-- Search History Table
CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  query text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  result_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own search history"
  ON search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own search history"
  ON search_history FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history"
  ON search_history FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

-- Saved Searches Table
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  query text NOT NULL,
  filters jsonb DEFAULT '{}'::jsonb,
  notification_enabled boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own saved searches"
  ON saved_searches FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user_id ON saved_searches(user_id);

-- Analytics Events Table
CREATE TABLE IF NOT EXISTS analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  event_name text NOT NULL,
  properties jsonb DEFAULT '{}'::jsonb,
  session_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create analytics events"
  ON analytics_events FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all analytics events"
  ON analytics_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);

-- Analytics User Activity Table
CREATE TABLE IF NOT EXISTS analytics_user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  date date NOT NULL,
  page_views integer DEFAULT 0,
  events_count integer DEFAULT 0,
  session_duration_minutes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

ALTER TABLE analytics_user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity"
  ON analytics_user_activity FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all activity"
  ON analytics_user_activity FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_analytics_activity_user_date ON analytics_user_activity(user_id, date DESC);

-- Error Logs Table
CREATE TABLE IF NOT EXISTS error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  error_type text NOT NULL,
  error_message text NOT NULL,
  stack_trace text,
  url text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create error logs"
  ON error_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all error logs"
  ON error_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin', 'admin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);

-- Function to clean old search history (keep last 100 per user)
CREATE OR REPLACE FUNCTION clean_old_search_history()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM search_history
  WHERE id IN (
    SELECT id FROM (
      SELECT id, ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY created_at DESC) as rn
      FROM search_history
    ) t
    WHERE rn > 100
  );
END;
$$;
