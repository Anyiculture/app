import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars manually or assume they are in process.env if run with --env-file
// but standard node doesn't load .env by default without --env-file flag (Node 20+).
// We'll try to read it manually to be safe if dotenv isn't installed.
// Actually, package.json didn't have dotenv, so we'll read .env manually.

import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const emailToDelete = 'tadiwanashechitsva7@gmail.com';

async function cleanupUser() {
  console.log(`Attempting to delete user: ${emailToDelete}`);
  
  // 1. Get User ID
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
  
  if (listError) {
    console.error('Error listing users:', listError);
    return;
  }

  const user = users.find(u => u.email === emailToDelete);
  
  if (!user) {
    console.log('User not found. Nothing to delete.');
    return;
  }

  // 2. Delete User
  const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
  
  if (deleteError) {
    console.error('Error deleting user:', deleteError);
  } else {
    console.log(`Successfully deleted user ${emailToDelete} (${user.id})`);
  }
}

cleanupUser();
