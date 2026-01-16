import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load env vars
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
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function inspectJobsTable() {
  console.log('Checking jobs table structure...\n');
  
  try {
    // Try to insert with minimal fields to see what's required
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        poster_id: '00000000-0000-0000-0000-000000000000',
        title: 'Test',
        description: 'Test'
      })
      .select()
      .single();
    
    if (error) {
      console.log('Error (this helps us see what fields are missing):');
      console.log(error.message);
      console.log('\nHint:', error.hint || 'N/A');
      console.log('Details:', error.details || 'N/A');
    } else {
      console.log('Unexpected success - deleting test job');
      await supabase.from('jobs').delete().eq('id', data.id);
    }
  } catch (err) {
    console.error('Caught error:', err);
  }
}

inspectJobsTable();
