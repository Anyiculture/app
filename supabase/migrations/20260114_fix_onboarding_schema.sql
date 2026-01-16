-- Fix onboarding schema by adding missing columns
DO $$
BEGIN
  -- Add location fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'citizenship_country') THEN
    ALTER TABLE profiles ADD COLUMN citizenship_country text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'residence_country') THEN
    ALTER TABLE profiles ADD COLUMN residence_country text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'residence_province') THEN
    ALTER TABLE profiles ADD COLUMN residence_province text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'residence_city') THEN
    ALTER TABLE profiles ADD COLUMN residence_city text;
  END IF;

  -- Add user goals and intent (in case they are missing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_goals') THEN
    ALTER TABLE profiles ADD COLUMN user_goals text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'platform_intent') THEN
    ALTER TABLE profiles ADD COLUMN platform_intent text;
  END IF;
  
  -- Add consent fields (in case they are missing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'consent_data_processing') THEN
    ALTER TABLE profiles ADD COLUMN consent_data_processing boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'consent_communications') THEN
    ALTER TABLE profiles ADD COLUMN consent_communications boolean DEFAULT false;
  END IF;

  -- Add interested_modules and primary_interest (in case they are missing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'interested_modules') THEN
    ALTER TABLE profiles ADD COLUMN interested_modules text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'primary_interest') THEN
    ALTER TABLE profiles ADD COLUMN primary_interest text;
  END IF;

  -- Add date_of_birth and gender (in case they are missing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'date_of_birth') THEN
    ALTER TABLE profiles ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
    ALTER TABLE profiles ADD COLUMN gender text;
  END IF;

END $$;
