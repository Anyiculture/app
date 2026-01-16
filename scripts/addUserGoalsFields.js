import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.join('=').trim();
  }
});

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function addUserGoalsFields() {
  console.log('Adding user_goals and platform_intent fields to profiles table...');

  try {
    // Check if columns already exist
    const { data: columns, error: checkError } = await supabase
      .rpc('get_table_columns', { table_name: 'profiles' });

    if (checkError) {
      console.error('Error checking columns:', checkError);
      return;
    }

    const columnNames = columns?.map(col => col.column_name) || [];

    if (!columnNames.includes('user_goals')) {
      console.log('Adding user_goals column...');
      const { error: addGoalsError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'profiles',
        column_name: 'user_goals',
        column_type: 'text'
      });

      if (addGoalsError) {
        console.error('Error adding user_goals:', addGoalsError);
      } else {
        console.log('✅ user_goals column added');
      }
    } else {
      console.log('user_goals column already exists');
    }

    if (!columnNames.includes('platform_intent')) {
      console.log('Adding platform_intent column...');
      const { error: addIntentError } = await supabase.rpc('add_column_if_not_exists', {
        table_name: 'profiles',
        column_name: 'platform_intent',
        column_type: 'text'
      });

      if (addIntentError) {
        console.error('Error adding platform_intent:', addIntentError);
      } else {
        console.log('✅ platform_intent column added');
      }
    } else {
      console.log('platform_intent column already exists');
    }

    console.log('Migration completed!');

  } catch (error) {
    console.error('Migration failed:', error);
  }
}

addUserGoalsFields();