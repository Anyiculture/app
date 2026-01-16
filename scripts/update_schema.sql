-- Add new columns for "Indeed-style" onboarding
ALTER TABLE profiles_jobseeker 
ADD COLUMN IF NOT EXISTS education_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS certifications JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS resume_url TEXT,
ADD COLUMN IF NOT EXISTS availability TEXT;

-- Verify columns (Optional, for debugging)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles_jobseeker';
