/*
  # General Onboarding Fields

  ## Overview
  Adds comprehensive onboarding fields to the profiles table for user safety,
  personalization, and better platform experience.

  ## Changes

  ### 1. Profile Extensions
  Adds fields to existing profiles table:
  - `first_name`: User's first name (collected at signup)
  - `last_name`: User's last name (collected at signup)
  - `display_name`: Public name used across platform
  - `phone`: Phone number for platform safety
  - `current_city`: Current city in China
  - `interested_modules`: Array of modules user is interested in
  - `primary_interest`: User's main interest/priority module
  - `date_of_birth`: User's date of birth for age verification
  - `gender`: User's gender (optional)
  - `nationality`: User's nationality
  - `emergency_contact_name`: Emergency contact name
  - `emergency_contact_phone`: Emergency contact phone
  - `emergency_contact_relationship`: Relationship to emergency contact
  - `consent_data_processing`: Whether user consents to data processing
  - `consent_communications`: Whether user consents to platform communications
  - `last_login_at`: Timestamp of last login
  - `is_first_login`: Whether this is user's first login

  ## Security
  - All fields are optional except those required for platform safety
  - Emergency contact info enhances user safety
  - Consent fields ensure GDPR/privacy compliance
*/

-- Add general onboarding fields to profiles
DO $$
BEGIN
  -- Basic name fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN display_name text;
  END IF;

  -- Contact and location
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'current_city'
  ) THEN
    ALTER TABLE profiles ADD COLUMN current_city text;
  END IF;

  -- Module interests
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'interested_modules'
  ) THEN
    ALTER TABLE profiles ADD COLUMN interested_modules text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'primary_interest'
  ) THEN
    ALTER TABLE profiles ADD COLUMN primary_interest text;
  END IF;

  -- Personal information
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'date_of_birth'
  ) THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'gender'
  ) THEN
    ALTER TABLE profiles ADD COLUMN gender text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'nationality'
  ) THEN
    ALTER TABLE profiles ADD COLUMN nationality text;
  END IF;

  -- Emergency contact
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact_phone'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact_phone text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'emergency_contact_relationship'
  ) THEN
    ALTER TABLE profiles ADD COLUMN emergency_contact_relationship text;
  END IF;

  -- Consent fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_data_processing'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_data_processing boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'consent_communications'
  ) THEN
    ALTER TABLE profiles ADD COLUMN consent_communications boolean DEFAULT false;
  END IF;

  -- Login tracking
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login_at'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'is_first_login'
  ) THEN
    ALTER TABLE profiles ADD COLUMN is_first_login boolean DEFAULT true;
  END IF;

  -- Personalization fields
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'user_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN user_goals text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'platform_intent'
  ) THEN
    ALTER TABLE profiles ADD COLUMN platform_intent text;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_display_name ON profiles(display_name);
CREATE INDEX IF NOT EXISTS idx_profiles_current_city ON profiles(current_city);
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_completed ON profiles(onboarding_completed);
CREATE INDEX IF NOT EXISTS idx_profiles_is_first_login ON profiles(is_first_login);
