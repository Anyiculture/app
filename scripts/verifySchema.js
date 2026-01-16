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
const supabaseKey = envConfig.SUPABASE_SERVICE_ROLE_KEY || envConfig.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase URL or Key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySchema() {
  console.log('Verifying profiles_jobseeker schema...');
  
  // Try to select the new columns. If they don't exist, this should error or return nulls.
  const { data, error } = await supabase
    .from('profiles_jobseeker')
    .select('education_history, certifications, bio, resume_url, availability')
    .limit(1);

  if (error) {
    console.error('Schema verification FAILED:', error.message);
    if (error.message.includes('does not exist')) {
        console.log('\n[ACTION REQUIRED] The new columns do NOT exist yet. Please run the SQL script in your Supabase Dashboard.');
    }
    process.exit(1);
  } else {
    console.log('Schema verification PASSED. Columns exist.');
    process.exit(0);
  }
}

verifySchema();
