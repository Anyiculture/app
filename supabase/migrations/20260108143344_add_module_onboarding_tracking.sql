/*
  # Module Onboarding Completion Tracking

  1. Changes
    - Add module-specific onboarding completion fields to profiles table
    - Track completion status for: Jobs, Education, Events, Marketplace, Community, Visa modules
    - Add timestamps for when each module onboarding was completed

  2. Purpose
    - Enable granular tracking of onboarding progress per module
    - Hide "Complete Setup" prompts once module onboarding is finished
    - Improve user experience by not showing completed onboarding flows
*/

-- Add module onboarding completion fields
DO $$
BEGIN
  -- Jobs module onboarding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'jobs_onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN jobs_onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'jobs_onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN jobs_onboarding_completed_at timestamptz;
  END IF;

  -- Education module onboarding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'education_onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN education_onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'education_onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN education_onboarding_completed_at timestamptz;
  END IF;

  -- Events module onboarding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'events_onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN events_onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'events_onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN events_onboarding_completed_at timestamptz;
  END IF;

  -- Marketplace module onboarding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketplace_onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketplace_onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'marketplace_onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN marketplace_onboarding_completed_at timestamptz;
  END IF;

  -- Community module onboarding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'community_onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN community_onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'community_onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN community_onboarding_completed_at timestamptz;
  END IF;

  -- Visa module onboarding
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'visa_onboarding_completed'
  ) THEN
    ALTER TABLE profiles ADD COLUMN visa_onboarding_completed boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'visa_onboarding_completed_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN visa_onboarding_completed_at timestamptz;
  END IF;
END $$;