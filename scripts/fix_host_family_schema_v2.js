
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const sql = `
-- Add missing fields to host_family_profiles
DO $$
BEGIN
  -- Check and add 'province'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'province') THEN
    ALTER TABLE host_family_profiles ADD COLUMN province text;
    RAISE NOTICE 'Added province column';
  END IF;

  -- Check and add 'home_type'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'home_type') THEN
    ALTER TABLE host_family_profiles ADD COLUMN home_type text;
    RAISE NOTICE 'Added home_type column';
  END IF;

  -- Check and add 'household_vibe'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'household_vibe') THEN
    ALTER TABLE host_family_profiles ADD COLUMN household_vibe text[] DEFAULT '{}';
    RAISE NOTICE 'Added household_vibe column';
  END IF;

  -- Check and add 'cleanliness_level'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'cleanliness_level') THEN
    ALTER TABLE host_family_profiles ADD COLUMN cleanliness_level int DEFAULT 3;
    RAISE NOTICE 'Added cleanliness_level column';
  END IF;

  -- Check and add 'guests_frequency'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'guests_frequency') THEN
    ALTER TABLE host_family_profiles ADD COLUMN guests_frequency text;
    RAISE NOTICE 'Added guests_frequency column';
  END IF;

  -- Check and add 'parenting_styles'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'parenting_styles') THEN
    ALTER TABLE host_family_profiles ADD COLUMN parenting_styles text[] DEFAULT '{}';
    RAISE NOTICE 'Added parenting_styles column';
  END IF;

  -- Check and add 'discipline_approach'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'discipline_approach') THEN
    ALTER TABLE host_family_profiles ADD COLUMN discipline_approach text;
    RAISE NOTICE 'Added discipline_approach column';
  END IF;

  -- Check and add 'house_rules_details'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'house_rules_details') THEN
    ALTER TABLE host_family_profiles ADD COLUMN house_rules_details text;
    RAISE NOTICE 'Added house_rules_details column';
  END IF;

  -- Check and add 'preferred_traits'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'preferred_traits') THEN
    ALTER TABLE host_family_profiles ADD COLUMN preferred_traits text[] DEFAULT '{}';
    RAISE NOTICE 'Added preferred_traits column';
  END IF;

  -- Check and add 'deal_breakers'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'deal_breakers') THEN
    ALTER TABLE host_family_profiles ADD COLUMN deal_breakers text[] DEFAULT '{}';
    RAISE NOTICE 'Added deal_breakers column';
  END IF;

  -- Check and add 'flexibility_level'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'flexibility_level') THEN
    ALTER TABLE host_family_profiles ADD COLUMN flexibility_level text;
    RAISE NOTICE 'Added flexibility_level column';
  END IF;

  -- Check and add 'start_date'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'start_date') THEN
    ALTER TABLE host_family_profiles ADD COLUMN start_date date;
    RAISE NOTICE 'Added start_date column';
  END IF;

  -- Check and add 'end_date'
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'host_family_profiles' AND column_name = 'end_date') THEN
    ALTER TABLE host_family_profiles ADD COLUMN end_date date;
    RAISE NOTICE 'Added end_date column';
  END IF;

END $$;
`;

async function runMigration() {
  console.log('Running migration to fix host_family_profiles schema...');
  
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
  
  // If exec_sql RPC is not available, we can't run this directly from client unless we use a different method.
  // But usually in these environments we might not have direct SQL access except via RPC if configured.
  // However, the user asked to "run an exQO schema".
  
  // If exec_sql fails or doesn't exist, we might need to rely on the user running it in their Supabase dashboard SQL editor.
  // But let's try to simulate what ApplySchema.js does if it exists.
  
  if (error) {
    console.error('Error running migration via RPC:', error);
    console.log('If exec_sql is not defined, please run the following SQL in your Supabase SQL Editor:');
    console.log(sql);
  } else {
    console.log('Migration completed successfully.');
  }
}

// Check if we can use the postgres connection directly if 'pg' is available, but usually we use supabase-js here.
// Let's assume the user has the 'exec_sql' function or we just output the SQL for them if it fails.

runMigration();
