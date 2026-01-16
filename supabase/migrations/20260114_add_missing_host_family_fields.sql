-- Add missing fields to host_family_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'home_type') THEN
    ALTER TABLE host_family_profiles ADD COLUMN home_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'household_vibe') THEN
    ALTER TABLE host_family_profiles ADD COLUMN household_vibe text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'cleanliness_level') THEN
    ALTER TABLE host_family_profiles ADD COLUMN cleanliness_level int DEFAULT 3;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'guests_frequency') THEN
    ALTER TABLE host_family_profiles ADD COLUMN guests_frequency text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'parenting_styles') THEN
    ALTER TABLE host_family_profiles ADD COLUMN parenting_styles text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'discipline_approach') THEN
    ALTER TABLE host_family_profiles ADD COLUMN discipline_approach text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'house_rules_details') THEN
    ALTER TABLE host_family_profiles ADD COLUMN house_rules_details text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'preferred_traits') THEN
    ALTER TABLE host_family_profiles ADD COLUMN preferred_traits text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'deal_breakers') THEN
    ALTER TABLE host_family_profiles ADD COLUMN deal_breakers text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'flexibility_level') THEN
    ALTER TABLE host_family_profiles ADD COLUMN flexibility_level text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'start_date') THEN
    ALTER TABLE host_family_profiles ADD COLUMN start_date date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'end_date') THEN
    ALTER TABLE host_family_profiles ADD COLUMN end_date date;
  END IF;
END $$;

-- Add missing fields to au_pair_profiles
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'personality_traits') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN personality_traits text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'work_style') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN work_style text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'child_age_comfort') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN child_age_comfort text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'skills_examples') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN skills_examples text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'rules_comfort') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN rules_comfort text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'preferred_family_type') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN preferred_family_type text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'deal_breakers') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN deal_breakers text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'au_pair_profiles' AND column_name = 'introduction') THEN
    ALTER TABLE au_pair_profiles ADD COLUMN introduction text;
  END IF;
END $$;
