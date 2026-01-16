
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

async function testInsertion() {
  console.log('Testing SIMPLE insertion into profiles_jobseeker...');

  // 1. Create a dummy user
  const email = `schema_test_simple_${Date.now()}@test.com`;
  const password = 'Password123!';

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    console.error('Error creating test user:', authError);
    return;
  }

  const userId = authData.user.id;
  console.log(`Created test user: ${userId}`);

  // 2. Insert profile with ONLY text fields
  const profileData = {
    user_id: userId,
    full_name: "Test Schema User Simple",
    bio: "This is a test bio simple",
    resume_url: "https://example.com/resume.pdf"
  };

  const { data, error } = await supabase
    .from('profiles_jobseeker')
    .upsert(profileData)
    .select();

  if (error) {
    console.error('Insertion FAILED:', JSON.stringify(error, null, 2));
  } else {
    console.log('Insertion SUCCESS! Data saved:', JSON.stringify(data[0], null, 2));
  }

  // 3. Cleanup
  console.log('Cleaning up test user...');
  await supabase.auth.admin.deleteUser(userId);
  console.log('Cleanup complete.');
}

testInsertion();
