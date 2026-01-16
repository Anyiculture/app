/*
  # Create Personalization System

  1. New Tables
    - `user_personalization` - Core personalization preferences
    - `user_role_assignments` - Multi-role support
    - `user_content_interactions` - Interaction tracking
    - `user_module_engagement` - Engagement metrics
    - `user_recommendations` - Cached recommendations

  2. Helper Functions
    - get_user_primary_role()
    - update_module_engagement()
    - set_primary_role()
    - track_content_interaction()

  3. Security
    - Enable RLS on all tables
    - Users access only their own data
*/

-- Create user_personalization table
CREATE TABLE IF NOT EXISTS user_personalization (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  primary_role text,
  favorite_modules text[] DEFAULT '{}',
  preferred_language text DEFAULT 'en',
  preferred_currency text DEFAULT 'CAD',
  show_recommendations boolean DEFAULT true,
  auto_match_enabled boolean DEFAULT true,
  email_digest_frequency text DEFAULT 'weekly' CHECK (email_digest_frequency IN ('daily', 'weekly', 'never')),
  last_visited_module text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  role_type text NOT NULL,
  is_primary boolean DEFAULT false,
  activated_at timestamptz DEFAULT now(),
  last_used_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module, role_type)
);

-- Create user_content_interactions table
CREATE TABLE IF NOT EXISTS user_content_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  interaction_type text NOT NULL CHECK (interaction_type IN ('view', 'save', 'apply', 'message', 'click', 'share')),
  interaction_data jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create user_module_engagement table
CREATE TABLE IF NOT EXISTS user_module_engagement (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  module text NOT NULL,
  engagement_score integer DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  views_count integer DEFAULT 0,
  actions_count integer DEFAULT 0,
  last_engaged_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, module)
);

-- Create user_recommendations table
CREATE TABLE IF NOT EXISTS user_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL,
  recommended_items jsonb NOT NULL DEFAULT '[]',
  relevance_scores jsonb DEFAULT '{}',
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '1 hour'),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, recommendation_type)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_primary ON user_role_assignments(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_user_content_interactions_user ON user_content_interactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_content_interactions_content ON user_content_interactions(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_user_module_engagement_user ON user_module_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_user_recommendations_user ON user_recommendations(user_id, recommendation_type);

-- Enable RLS
ALTER TABLE user_personalization ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_content_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_module_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own personalization" ON user_personalization FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own personalization" ON user_personalization FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own personalization" ON user_personalization FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own roles" ON user_role_assignments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own roles" ON user_role_assignments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own roles" ON user_role_assignments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own interactions" ON user_content_interactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON user_content_interactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own engagement" ON user_module_engagement FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own engagement" ON user_module_engagement FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own engagement" ON user_module_engagement FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own recommendations" ON user_recommendations FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON user_recommendations FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON user_recommendations FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Helper Functions
CREATE OR REPLACE FUNCTION get_user_primary_role(p_user_id uuid)
RETURNS TABLE(module text, role_type text) AS $$
BEGIN
  RETURN QUERY
  SELECT ura.module, ura.role_type
  FROM user_role_assignments ura
  WHERE ura.user_id = p_user_id AND ura.is_primary = true
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_module_engagement(p_user_id uuid, p_module text, p_action_type text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_module_engagement (user_id, module, engagement_score, views_count, actions_count, last_engaged_at)
  VALUES (p_user_id, p_module, CASE WHEN p_action_type = 'action' THEN 2 ELSE 1 END, CASE WHEN p_action_type = 'view' THEN 1 ELSE 0 END, CASE WHEN p_action_type = 'action' THEN 1 ELSE 0 END, now())
  ON CONFLICT (user_id, module)
  DO UPDATE SET engagement_score = LEAST(100, user_module_engagement.engagement_score + CASE WHEN p_action_type = 'action' THEN 2 ELSE 1 END),
    views_count = user_module_engagement.views_count + CASE WHEN p_action_type = 'view' THEN 1 ELSE 0 END,
    actions_count = user_module_engagement.actions_count + CASE WHEN p_action_type = 'action' THEN 1 ELSE 0 END,
    last_engaged_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION set_primary_role(p_user_id uuid, p_module text, p_role_type text)
RETURNS void AS $$
BEGIN
  UPDATE user_role_assignments SET is_primary = false WHERE user_id = p_user_id;
  INSERT INTO user_role_assignments (user_id, module, role_type, is_primary, last_used_at)
  VALUES (p_user_id, p_module, p_role_type, true, now())
  ON CONFLICT (user_id, module, role_type) DO UPDATE SET is_primary = true, last_used_at = now();
  INSERT INTO user_personalization (user_id, primary_role)
  VALUES (p_user_id, p_module || ':' || p_role_type)
  ON CONFLICT (user_id) DO UPDATE SET primary_role = p_module || ':' || p_role_type, updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION track_content_interaction(p_user_id uuid, p_content_type text, p_content_id uuid, p_interaction_type text, p_interaction_data jsonb DEFAULT '{}')
RETURNS void AS $$
BEGIN
  INSERT INTO user_content_interactions (user_id, content_type, content_id, interaction_type, interaction_data)
  VALUES (p_user_id, p_content_type, p_content_id, p_interaction_type, p_interaction_data);
  PERFORM update_module_engagement(p_user_id, p_content_type, CASE WHEN p_interaction_type IN ('apply', 'message', 'share') THEN 'action' ELSE 'view' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION update_user_personalization_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_user_personalization_timestamp
  BEFORE UPDATE ON user_personalization
  FOR EACH ROW
  EXECUTE FUNCTION update_user_personalization_timestamp();
