
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars['VITE_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY'], {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function probe() {
  console.log('Probing profiles table schema...');
  // Attempt insert with minimal fields
  // Using a random UUID to avoid conflict with real users (though creating a profile for non-existent user might violate FK constraint on auth.users?)
  // Profile id usually references auth.users(id).
  // So we MUST create a fake user first?
  // But creating a user TRIGGERS the broken function! catch-22.
  
  // Actually, we can try to insert a profile with a random ID. 
  // If FK constraint exists, it will say "insert or update on table "profiles" violates foreign key constraint".
  // This CONFIRMS the FK exists.
  // If it says "null value in column "username" violates not-null constraint", that's what we want.
  
  const fakeId = '00000000-0000-0000-0000-000000000000'; // Invalid UUID? No, valid UUID format.
  
  const { error } = await supabase.from('profiles').insert({
    id: fakeId,
    email: 'probe@test.com'
  });

  if (error) {
    console.log('Insert Error:', error.message);
    if (error.message.includes('violates foreign key constraint')) {
       console.log('Constraint: Foreign Key to auth.users exists (Good).');
    }
    if (error.message.includes('violates not-null constraint')) {
       console.log('Constraint: Missing required column!');
    }
  } else {
    console.log('Insert Success (unexpected if FK exists).');
    // Cleanup
    await supabase.from('profiles').delete().eq('id', fakeId);
  }
}

probe();
