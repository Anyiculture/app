import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Missing environment variables.');
  console.error('Make sure VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are in your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const email = 'admin@anyiculture.com';
  const password = 'password123';

  console.log(`\n🚀 Initializing Admin User Creation...`);
  console.log(`Target: ${email}`);

  // 1. Create Auth User
  const { data: userData, error: userError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: 'Super Admin' }
  });

  let userId;

  if (userError) {
    if (userError.message.includes('already registered')) {
       console.log('ℹ️  User already exists. Fetching ID...');
       const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
       if (listError) {
         console.error('❌ Failed to list users:', listError.message);
         return;
       }
       const found = users.find(u => u.email === email);
       if (found) {
         userId = found.id;
         console.log('✅ Found existing user ID:', userId);
       } else {
         console.error('❌ User says registered but could not be found in list.');
         return;
       }
    } else {
      console.error('❌ User creation failed:', userError.message);
      return;
    }
  } else {
    userId = userData.user.id;
    console.log('✅ Created new auth user. ID:', userId);
  }

  // 2. Ensure Profile Exists (triggers usually handle this, but for safety)
  // We skip manual profile creation as the trigger on auth.users should handle it.
  
  // 3. Insert into admin_roles
  console.log('👑 Assigning super_admin role...');
  const { error: roleError } = await supabase
    .from('admin_roles')
    .upsert({
      user_id: userId,
      role: 'super_admin',
      is_active: true
    }, { onConflict: 'user_id, role' });

  if (roleError) {
    console.error('❌ Failed to assign admin role:', roleError.message);
  } else {
    console.log('\n✅ SUCCESS! Admin user ready.');
    console.log('------------------------------------------------');
    console.log(`Login URL: http://localhost:5173/signin`); // Assuming default vite port
    console.log(`Email:     ${email}`);
    console.log(`Password:  ${password}`);
    console.log('------------------------------------------------');
  }
}

createAdmin();
