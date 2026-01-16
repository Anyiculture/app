
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

async function checkSchema() {
  console.log('Checking jobs table schema...');
  const { data, error } = await supabase
    .from('jobs')
    .select('*')
    .limit(1);

  if (error) {
    console.error('Error selecting from jobs:', error);
  } else if (data && data.length > 0) {
    console.log('Existing columns:', Object.keys(data[0]));
  } else {
    console.log('No jobs found to inspect columns. Trying to insert a dummy to see errors if we add unknown cols.');
  }

  // Also check if we can insert 'subcategory'
  console.log('Attempting dry-run insert with subcategory...');
  const { error: insertError } = await supabase
    .from('jobs')
    .insert({
      poster_id: '00000000-0000-0000-0000-000000000000', // invalid ID likely, but checks schema
      title: 'Schema Test',
      job_type: 'full_time',
      location_country: 'Test',
      location_city: 'Test',
      category: 'test',
      subcategory: 'test', // THIS IS THE TEST
      skills_required: []
    })
    .select();

  if (insertError) {
    console.log('Insert Error (expected if subcategory missing):', insertError.message);
  }
}

checkSchema();
