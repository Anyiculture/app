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

async function checkUserServices() {
  console.log('Checking user_services table...\n');
  
  // Try to query the table
  const { data, error } = await supabase
    .from('user_services')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Error accessing user_services table:');
    console.log('Message:', error.message);
    console.log('Code:', error.code);
    console.log('Details:', error.details);
    console.log('\n📋 This table may not exist or RLS policies are blocking access.');
  } else {
    console.log('✅ user_services table exists!');
    console.log('Sample data:', data);
    
    // Check RLS policies
    const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
        FROM pg_policies
        WHERE tablename = 'user_services';
      `
    });
    
    if (!policyError && policies) {
      console.log('\n🔒 RLS Policies:');
      console.log(JSON.stringify(policies, null, 2));
    }
  }
}

checkUserServices();
