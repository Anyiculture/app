-- Add new columns to profiles_employer table for comprehensive company information

-- Company images and branding
ALTER TABLE profiles_employer
ADD COLUMN IF NOT EXISTS company_logo TEXT,
ADD COLUMN IF NOT EXISTS company_images TEXT[] DEFAULT '{}',

-- Company size and details
ADD COLUMN IF NOT EXISTS company_size TEXT CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5000+')),
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS employee_count INTEGER,

-- Detailed location
ADD COLUMN IF NOT EXISTS office_address TEXT,
ADD COLUMN IF NOT EXISTS office_building TEXT,
ADD COLUMN IF NOT EXISTS postal_code TEXT,

-- Technologies and systems
ADD COLUMN IF NOT EXISTS technologies TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS tech_stack TEXT,

-- Additional info
ADD COLUMN IF NOT EXISTS company_description TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS company_culture TEXT,
ADD COLUMN IF NOT EXISTS linkedin_url TEXT,
ADD COLUMN IF NOT EXISTS facebook_url TEXT,
ADD COLUMN IF NOT EXISTS twitter_url TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_employer_company_size ON profiles_employer(company_size);
CREATE INDEX IF NOT EXISTS idx_employer_location ON profiles_employer(registration_city, registration_province);

-- Verify the changes
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'profiles_employer'
ORDER BY ordinal_position;
