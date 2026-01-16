-- Add missing fields to host_family_profiles
DO $$
BEGIN
  -- Check and add 'province'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'province') THEN
    ALTER TABLE host_family_profiles ADD COLUMN province text;
  END IF;

  -- Check and add 'home_type'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'home_type') THEN
    ALTER TABLE host_family_profiles ADD COLUMN home_type text;
  END IF;

  -- Check and add 'household_vibe'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'household_vibe') THEN
    ALTER TABLE host_family_profiles ADD COLUMN household_vibe text[] DEFAULT '{}';
  END IF;

  -- Check and add 'cleanliness_level'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'cleanliness_level') THEN
    ALTER TABLE host_family_profiles ADD COLUMN cleanliness_level int DEFAULT 3;
  END IF;

  -- Check and add 'guests_frequency'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'guests_frequency') THEN
    ALTER TABLE host_family_profiles ADD COLUMN guests_frequency text;
  END IF;

  -- Check and add 'parenting_styles'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'parenting_styles') THEN
    ALTER TABLE host_family_profiles ADD COLUMN parenting_styles text[] DEFAULT '{}';
  END IF;

  -- Check and add 'discipline_approach'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'discipline_approach') THEN
    ALTER TABLE host_family_profiles ADD COLUMN discipline_approach text;
  END IF;

  -- Check and add 'house_rules_details'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'house_rules_details') THEN
    ALTER TABLE host_family_profiles ADD COLUMN house_rules_details text;
  END IF;

  -- Check and add 'preferred_traits'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'preferred_traits') THEN
    ALTER TABLE host_family_profiles ADD COLUMN preferred_traits text[] DEFAULT '{}';
  END IF;

  -- Check and add 'deal_breakers'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'deal_breakers') THEN
    ALTER TABLE host_family_profiles ADD COLUMN deal_breakers text[] DEFAULT '{}';
  END IF;

  -- Check and add 'flexibility_level'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'flexibility_level') THEN
    ALTER TABLE host_family_profiles ADD COLUMN flexibility_level text;
  END IF;

  -- Check and add 'start_date'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'start_date') THEN
    ALTER TABLE host_family_profiles ADD COLUMN start_date date;
  END IF;

  -- Check and add 'end_date'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'end_date') THEN
    ALTER TABLE host_family_profiles ADD COLUMN end_date date;
  END IF;

END $$;
