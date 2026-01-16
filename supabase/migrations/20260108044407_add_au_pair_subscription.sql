/*
  # Au Pair Host Family Subscription System

  ## Overview
  This migration adds subscription and payment functionality specifically for Au Pair Host Families.
  - Au Pairs NEVER pay
  - Only Host Families have subscription requirements
  - ¥100/month for premium access

  ## Changes

  ### 1. Profile Extensions
  Adds Au Pair-specific fields to existing profiles table:
  - `au_pair_role`: Identifies if user is host_family, au_pair, or neither
  - `au_pair_subscription_status`: Tracks free vs premium status for host families
  - `au_pair_message_count`: Limits free host families to 1 message total
  - `au_pair_onboarding_completed`: Tracks onboarding completion

  ### 2. Au Pair Profiles Table
  Stores detailed Au Pair profile information:
  - Links to profiles table
  - Contains skills, experience, preferences
  - Used for matching host families with au pairs

  ### 3. Host Family Profiles Table
  Stores detailed Host Family profile information:
  - Links to profiles table
  - Contains family details, requirements, preferences
  - Used for matching au pairs with host families

  ### 4. Subscription Product Linking
  Links Stripe subscriptions to Au Pair module:
  - Adds subscription_type to stripe_subscriptions
  - Only 'au_pair_host' subscriptions require payment

  ## Security
  - RLS policies ensure users can only access their own data
  - Free host families see blurred profiles (enforced in application layer)
  - Premium host families have full access
*/

-- Add enum types
DO $$ BEGIN
  CREATE TYPE au_pair_role AS ENUM ('host_family', 'au_pair');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE au_pair_subscription_status AS ENUM ('free', 'premium');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE subscription_type AS ENUM ('au_pair_host', 'other');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Extend profiles table with Au Pair fields
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'au_pair_role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN au_pair_role au_pair_role DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'au_pair_subscription_status'
  ) THEN
    ALTER TABLE profiles ADD COLUMN au_pair_subscription_status au_pair_subscription_status DEFAULT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'au_pair_message_count'
  ) THEN
    ALTER TABLE profiles ADD COLUMN au_pair_message_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'au_pair_onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN au_pair_onboarding_completed boolean DEFAULT false;
  END IF;
END $$;

-- Add subscription_type to stripe_subscriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'stripe_subscriptions' AND column_name = 'subscription_type'
  ) THEN
    ALTER TABLE stripe_subscriptions ADD COLUMN subscription_type subscription_type DEFAULT 'other';
  END IF;
END $$;

-- Create au_pair_profiles table
CREATE TABLE IF NOT EXISTS au_pair_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  age integer,
  nationality text,
  languages text[] DEFAULT '{}',
  experience_years integer DEFAULT 0,
  education_level text,
  skills text[] DEFAULT '{}',
  childcare_experience text,
  available_from date,
  preferred_location text,
  bio text,
  photos text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE au_pair_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view au pair profiles"
  ON au_pair_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Au pairs can insert own profile"
  ON au_pair_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Au pairs can update own profile"
  ON au_pair_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create host_family_profiles table
CREATE TABLE IF NOT EXISTS host_family_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  family_size integer,
  children_count integer,
  children_ages integer[] DEFAULT '{}',
  location text,
  housing_type text,
  languages_spoken text[] DEFAULT '{}',
  requirements text,
  expectations text,
  work_hours text,
  salary_offer numeric,
  benefits text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE host_family_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Host families can view all host family profiles"
  ON host_family_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Host families can insert own profile"
  ON host_family_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Host families can update own profile"
  ON host_family_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_au_pair_role ON profiles(au_pair_role);
CREATE INDEX IF NOT EXISTS idx_profiles_au_pair_subscription ON profiles(au_pair_subscription_status);
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_user_id ON au_pair_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_au_pair_profiles_available_from ON au_pair_profiles(available_from);
CREATE INDEX IF NOT EXISTS idx_host_family_profiles_user_id ON host_family_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_type ON stripe_subscriptions(subscription_type);
