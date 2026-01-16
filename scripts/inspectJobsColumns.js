
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
  console.log('Inspecting jobs table...');
  // Trigger a loose select to see what returns, or use rpc/admin if possible. 
  // Since we are checking what works via API, let's just insert a dummy with minimal fields to see error, 
  // or fetch one and print keys.
  
  const { data, error } = await supabase.from('jobs').select('*').limit(1);
  if (error) {
    console.error('Error selecting:', error);
  } else {
    if (data.length > 0) {
        console.log('Existing columns:', Object.keys(data[0]));
    } else {
        console.log('No rows found. Attempting to insert dummy to checking schema error...');
        const { error: insertErr } = await supabase.from('jobs').insert({
            title: 'Test Schema',
            poster_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
            // Minimal fields
        });
        if (insertErr) {
             console.log('Insert Error (reveals schema issues):', insertErr);
        }
    }
  }
}

inspect();
