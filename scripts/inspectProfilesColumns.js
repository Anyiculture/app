
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

async function inspect() {
  console.log('Inspecting profiles table...');
  const { data, error } = await supabase.from('profiles').select('*').limit(1);
  if (error) {
    console.error('Error selecting profiles:', error);
  } else {
    if (data.length > 0) {
        console.log('Existing columns:', Object.keys(data[0]));
    } else {
       console.log('No rows in profiles. Trying to insert to see error...');
       // Use a dummy UUID that likely doesn't exist in auth.users, expecting FK error, 
       // but hopefully revealing schema issues first.
       const { error: insErr } = await supabase.from('profiles').insert({
           id: '00000000-0000-0000-0000-000000000000',
           email: 'dummy@test.com'
       });
       console.log('Insert error:', insErr);
    }
  }
}

inspect();
