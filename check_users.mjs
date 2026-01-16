
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function checkUsers() {
  console.log('Checking connection to:', supabaseUrl);
  
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  console.log(`Found ${users.length} users.`);
  const adminUser = users.find(u => u.email?.includes('admin'));
  
  if (adminUser) {
    console.log('Admin user found:', adminUser.email, '(ID:', adminUser.id, ')');
  } else {
    console.log('No user with "admin" in email found.');
    console.log('Available users:', users.map(u => u.email).join(', '));
  }
}

checkUsers();
