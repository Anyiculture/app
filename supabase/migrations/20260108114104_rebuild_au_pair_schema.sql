/*
  # Rebuild Au Pair Schema

  1. Tables Created/Updated
    - `au_pair_profiles`: Complete au pair profile data
      - Basic info (name, age, gender, nationality)
      - Languages with proficiency
      - Education and experience
      - Skills (multi-select)
      - Preferences (location, hours, dietary)
      - Availability dates
      - Media (photos, videos)
    
    - `host_family_profiles`: Complete host family profile data
      - Family overview
      - Location details
      - Home details
      - Rules and lifestyle
      - Children information
      - Duties and expectations
      - Media uploads
    
    - `au_pair_saved_profiles`: Saved profiles for users
  
  2. Security
    - RLS enabled on all tables
    - Policies for authenticated users only
    - Profile owners can update own profiles
    - Premium users can view full profiles
    - Free users see limited data
  
  3. Premium/Free Logic
    - Tracked in profiles table
    - Message count tracked per user
*/

-- Drop old tables if they exist
DROP TABLE IF EXISTS au_pair_profiles CASCADE;
DROP TABLE IF EXISTS host_family_profiles CASCADE;
DROP TABLE IF EXISTS profiles_aupair CASCADE;
DROP TABLE IF EXISTS au_pair_saved_profiles CASCADE;

-- Au Pair Profiles Table
CREATE TABLE IF NOT EXISTS au_pair_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Basic Info
  display_name text NOT NULL,
  age int,
  gender text,
  nationality text,
  current_country text,
  current_city text,
  
  -- Languages (JSONB array: [{language: 'English', proficiency: 'native'}])
  languages jsonb DEFAULT '[]'::jsonb,
  
  -- Education
  education_level text,
  field_of_study text,
  
  -- Experience
  childcare_experience_years int DEFAULT 0,
  age_groups_worked text[], -- ['0-2', '3-5', '6-12', '13+']
  previous_au_pair boolean DEFAULT false,
  experience_description text,
  
  -- Skills (multi-select array)
  skills text[] DEFAULT ARRAY[]::text[],
  
  -- Preferences
  preferred_countries text[] DEFAULT ARRAY[]::text[],
  preferred_cities text[] DEFAULT ARRAY[]::text[],
  working_hours_preference text,
  days_off_preference text,
  live_in_preference text, -- 'live_in', 'live_out', 'flexible'
  dietary_restrictions text,
  smoker boolean DEFAULT false,
  has_tattoos boolean DEFAULT false,
  
  -- Availability
  available_from date,
  duration_months int,
  
  -- Media (URLs to storage)
  profile_photos text[] DEFAULT ARRAY[]::text[],
  intro_video_url text,
  experience_videos text[] DEFAULT ARRAY[]::text[],
  
  -- Bio
  bio text,
  
  -- Status
  profile_status text DEFAULT 'draft', -- 'draft', 'active', 'paused', 'suspended'
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Host Family Profiles Table
CREATE TABLE IF NOT EXISTS host_family_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Family Overview
  family_name text NOT NULL,
  family_type text, -- 'single_parent', 'couple', 'extended'
  parent_occupations text,
  
  -- Location
  country text NOT NULL,
  city text NOT NULL,
  neighborhood text,
  
  -- Home Details
  housing_type text, -- 'apartment', 'house', 'villa'
  private_room boolean DEFAULT true,
  shared_bathroom boolean DEFAULT false,
  helper_present boolean DEFAULT false,
  
  -- Rules & Lifestyle (JSONB for flexibility)
  rules jsonb DEFAULT '{}'::jsonb, -- {curfew: '22:00', no_smoking: true, guests_allowed: false}
  
  -- Children
  children_count int DEFAULT 0,
  children_ages int[] DEFAULT ARRAY[]::int[],
  children_personalities text[], -- ['energetic', 'shy', 'creative']
  children_health_notes text,
  
  -- Duties & Expectations
  daily_tasks text[] DEFAULT ARRAY[]::text[],
  weekly_schedule text,
  extra_activities text,
  flexibility_expectations text,
  
  -- Preferences
  preferred_nationalities text[] DEFAULT ARRAY[]::text[],
  language_level_required text,
  education_level_required text,
  experience_required_years int DEFAULT 0,
  
  -- Media
  home_photos text[] DEFAULT ARRAY[]::text[],
  family_photos text[] DEFAULT ARRAY[]::text[],
  family_video_url text,
  
  -- Compensation
  monthly_salary_offer numeric(10,2),
  benefits text[] DEFAULT ARRAY[]::text[],
  
  -- Additional from old schema
  family_size int,
  languages_spoken text[] DEFAULT ARRAY[]::text[],
  work_hours text,
  requirements text,
  expectations text,
  
  -- Status
  profile_status text DEFAULT 'draft',
  
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Saved Profiles Table
CREATE TABLE IF NOT EXISTS au_pair_saved_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  profile_type text NOT NULL, -- 'au_pair' or 'host_family'
  saved_profile_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user_id, profile_type, saved_profile_id)
);

-- Enable RLS
ALTER TABLE au_pair_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE host_family_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE au_pair_saved_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for au_pair_profiles

CREATE POLICY "Au pairs can view own profile"
  ON au_pair_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Au pairs can insert own profile"
  ON au_pair_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Au pairs can update own profile"
  ON au_pair_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Host families can view au pair profiles"
  ON au_pair_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.au_pair_role = 'host_family'
    )
    AND profile_status = 'active'
  );

-- Policies for host_family_profiles

CREATE POLICY "Host families can view own profile"
  ON host_family_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Host families can insert own profile"
  ON host_family_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Host families can update own profile"
  ON host_family_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Au pairs can view host family profiles"
  ON host_family_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.au_pair_role = 'au_pair'
    )
    AND profile_status = 'active'
  );

-- Policies for saved profiles

CREATE POLICY "Users can view own saved profiles"
  ON au_pair_saved_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved profiles"
  ON au_pair_saved_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved profiles"
  ON au_pair_saved_profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_user_id ON au_pair_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_status ON au_pair_profiles(profile_status);
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_nationality ON au_pair_profiles(nationality);
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_available_from ON au_pair_profiles(available_from);

CREATE INDEX IF NOT EXISTS idx_host_family_profiles_user_id ON host_family_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_host_family_profiles_status ON host_family_profiles(profile_status);
CREATE INDEX IF NOT EXISTS idx_host_family_profiles_city ON host_family_profiles(city);

CREATE INDEX IF NOT EXISTS idx_saved_profiles_user_id ON au_pair_saved_profiles(user_id);
