
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
  console.log('Testing insertion into profiles_jobseeker with new columns...');

  // 1. Create a dummy user
  const email = `schema_test_${Date.now()}@test.com`;
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

  // 1.5 Create public.profiles row (REQUIRED since we removed the trigger)
  const { error: profileError } = await supabase.from('profiles').insert({
    id: userId,
    email: email,
    role: 'job_seeker',
    first_name: 'Test',
    last_name: 'User'
  });

  if (profileError) {
    console.error('Error creating public profile:', profileError);
    // Continue anyway to see if that was the blocker, but it likely will fail next
  } else {
    console.log('Created public.profiles row.');
  }

  // 2. Insert profile with new complex fields
  const profileData = {
    user_id: userId,
    full_name: "Test Schema User",
    current_location_country: "China",
    current_location_city: "Shanghai",
    phone: "1234567890",
    bio: "This is a test bio",
    resume_url: "https://example.com/resume.pdf",
    availability: "immediate",
    education_history: [
      {
        school: "Test University",
        degree: "Bachelor",
        field_of_study: "Computer Science",
        start_date: "2015-09-01",
        end_date: "2019-06-01",
        current: false
      }
    ],
    certifications: [
      {
        name: "Test Cert",
        issuer: "Test Org",
        issue_date: "2020-01-01"
      }
    ],
    work_history: [
       {
        title: "Developer",
        company: "Test Corp",
        location: "Remote",
        start_date: "2020-01-01",
        end_date: "2022-01-01",
        current: false,
        description: "Coding"
      }
    ],
    skills: ["React", "Node"],
    profile_completion_percent: 100
  };

  const { data, error } = await supabase
    .from('profiles_jobseeker')
    .upsert(profileData)
    .select();

  if (error) {
    console.error('Insertion FAILED:', error);
  } else {
    console.log('Insertion SUCCESS! Data saved:', JSON.stringify(data[0], null, 2));
  }

  // 3. Cleanup
  console.log('Cleaning up test user...');
  await supabase.auth.admin.deleteUser(userId);
  console.log('Cleanup complete.');
}

testInsertion();
