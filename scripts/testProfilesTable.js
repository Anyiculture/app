
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

async function testProfiles() {
  console.log('Testing profiles table insertion...');
  
  // Create user
  const email = `profiles_test_${Date.now()}@example.com`;
  const { data: { user }, error: uErr } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });
  
  if (uErr) { console.error('Create User Error:', uErr); return; }
  
  // Insert Profile
  console.log(`Inserting profile for ${user.id}...`);
  const { data, error } = await supabase.from('profiles').insert({
    id: user.id,
    email: email,
    role: 'job_seeker',
    full_name: 'Profiles Test'
  }).select();
  
  if (error) {
    console.error('Profiles Insert Error:', error);
  } else {
    console.log('Success:', data);
  }
  
  // Cleanup
  await supabase.auth.admin.deleteUser(user.id);
}

testProfiles();
