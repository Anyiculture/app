
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
  console.log('Inspecting profiles_jobseeker table...');
  const { data, error } = await supabase.from('profiles_jobseeker').select('*').limit(1);
  if (error) {
    console.error('Error selecting:', error);
  } else {
    if (data.length > 0) {
        console.log('Existing columns:', Object.keys(data[0]));
    } else {
        const { error: insErr } = await supabase.from('profiles_jobseeker').insert({
            // Dummy to force schema error
            user_id: '00000000-0000-0000-0000-000000000000'
        });
        console.log('Insert Error:', insErr);
    }
  }
}

inspect();
