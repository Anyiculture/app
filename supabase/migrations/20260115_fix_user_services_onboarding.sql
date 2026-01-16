-- Fix user_services table schema and RLS policies

-- 1. Add onboarding_completed column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_services' AND column_name = 'onboarding_completed'
  ) THEN
    ALTER TABLE user_services ADD COLUMN onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- 2. Enable RLS on user_services
ALTER TABLE user_services ENABLE ROW LEVEL SECURITY;

-- 3. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own services" ON user_services;
DROP POLICY IF EXISTS "Users can insert their own services" ON user_services;
DROP POLICY IF EXISTS "Users can update their own services" ON user_services;

-- 4. Create comprehensive policies
CREATE POLICY "Users can view their own services"
  ON user_services FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own services"
  ON user_services FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own services"
  ON user_services FOR UPDATE
  USING (auth.uid() = user_id);

-- 5. Grant permissions to authenticated users
GRANT ALL ON user_services TO authenticated;
