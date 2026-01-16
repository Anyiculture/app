-- Update Profiles table for global name split
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT;

-- Update Au Pair profiles table with new onboarding fields
ALTER TABLE au_pair_profiles 
ADD COLUMN IF NOT EXISTS first_name TEXT,
ADD COLUMN IF NOT EXISTS middle_name TEXT,
ADD COLUMN IF NOT EXISTS last_name TEXT,
ADD COLUMN IF NOT EXISTS current_province TEXT,
ADD COLUMN IF NOT EXISTS nationality_country TEXT,
ADD COLUMN IF NOT EXISTS nationality_province TEXT,
ADD COLUMN IF NOT EXISTS nationality_city TEXT,
ADD COLUMN IF NOT EXISTS personality_traits TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS work_style TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS child_age_comfort TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS rules_comfort TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS preferred_family_type TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS deal_breakers TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS skills_examples TEXT,
ADD COLUMN IF NOT EXISTS introduction TEXT;

-- Add indexes for common filter fields
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_first_name ON au_pair_profiles(first_name);
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_last_name ON au_pair_profiles(last_name);
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_current_province ON au_pair_profiles(current_province);

-- Comment explaining the changes
COMMENT ON COLUMN au_pair_profiles.personality_traits IS 'Flattened list of individual personality traits';
COMMENT ON COLUMN au_pair_profiles.work_style IS 'Preferred working styles selected by au pair';
