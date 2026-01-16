
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

const supabaseUrl = envVars['VITE_SUPABASE_URL'];
const serviceRoleKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkTable(tableName) {
  const { error } = await supabase.from(tableName).select('count', { count: 'exact', head: true });
  if (error) {
    if (error.code === '42P01') { // undefined_table
       console.log(`[MISSING] Table '${tableName}' does not exist.`);
       return false;
    }
    console.log(`[ERROR] Accessing '${tableName}':`, error.message);
    return false;
  }
  console.log(`[OK] Table '${tableName}' exists.`);
  return true;
}

async function verifyBackend() {
  console.log('--- STARTING BACKEND DIAGNOSIS ---');

  // Check Tables
  const tables = ['profiles', 'profiles_jobseeker', 'jobs', 'job_applications', 'saved_jobs', 'job_preferences'];
  let missingTables = [];
  
  for (const t of tables) {
    const exists = await checkTable(t);
    if (!exists) missingTables.push(t);
  }

  if (missingTables.length > 0) {
    console.error(`\nCRITICAL: The following tables are MISSING: ${missingTables.join(', ')}`);
    console.log('\nYou likely need to run the initial migration SQL script to create the database schema.');
  } else {
    console.log('\nAll core tables appear to exist.');
  }

  // Test User Creation
  console.log('\n--- TESTING ADMIN USER CREATION ---');
  const testEmail = 'tadiwanashechitsva7@gmail.com';
  const testPass = 'qwertyuiop';
  
  // First delete if exists
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const existing = users.find(u => u.email === testEmail);
  if (existing) {
     console.log(`Deleting existing user ${testEmail}...`);
     await supabase.auth.admin.deleteUser(existing.id);
  }

  console.log(`Creating user ${testEmail}...`);
  const { data: userData, error: createError } = await supabase.auth.admin.createUser({
    email: testEmail,
    password: testPass,
    email_confirm: true,
    user_metadata: { full_name: 'Diagnosis Test User' }
  });

  if (createError) {
    console.error('FAILED to create user:', JSON.stringify(createError, null, 2));
  } else {
    console.log(`SUCCESS: User created via Admin API. ID: ${userData.user.id}`);
  }

  console.log('\n--- DIAGNOSIS COMPLETE ---');
}

verifyBackend();
