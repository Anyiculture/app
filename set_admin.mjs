
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Error: Missing env vars. ensure .env has VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const args = process.argv.slice(2);
const email = args[0];
const password = args[1];
const pin = args[2];

if (!email) {
  console.log('\nUsage: node set_admin.mjs <user_email> [new_password] [new_admin_pin]\n');
  console.log('Examples:');
  console.log('  node set_admin.mjs user@example.com             (Make admin only)');
  console.log('  node set_admin.mjs user@example.com newPass123  (Make admin + set password)');
  console.log('  node set_admin.mjs user@example.com newPass123 1234 (Make admin + set password + set PIN)');
  process.exit(1);
}

async function setAdmin() {
  try {
    console.log(`\nLooking up user: ${email}...`);
    const { data: { users }, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
    
    if (error) {
      console.error('Error listing users:', error.message);
      return;
    }

    const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

    if (!user) {
      console.error(`\u274C User with email "${email}" not found!`);
      // If user doesn't exist AND password is provided, maybe we should create them?
      // For now, let's stick to modifying existing users to be safe.
      if (users.length > 0) {
        console.log('Available users:', users.slice(0, 5).map(u => u.email).join(', ') + (users.length > 5 ? '...' : ''));
      }
      return;
    }

    console.log(`Found user ID: ${user.id}`);
    
    // 1. Update Password and PIN if provided
    const updateData = {};
    if (password) {
      if (password.length < 6) {
        console.log('\u26A0 Warning: Password should be at least 6 characters.');
      }
      updateData.password = password;
      updateData.email_confirm = true; // Auto-confirm email if we are setting password
    }

    if (pin) {
      updateData.user_metadata = {
        ...user.user_metadata,
        admin_pin: pin
      };
    }

    if (Object.keys(updateData).length > 0) {
      console.log('Updating user credentials...');
      if (updateData.password) console.log(' - Setting new password');
      if (updateData.user_metadata?.admin_pin) console.log(` - Setting Admin PIN to "${pin}"`);
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, updateData);
      
      if (updateError) {
        console.error('Failed to update user:', updateError.message);
      } else {
        console.log('\u2705 User credentials updated successfully.');
      }
    }

    // 2. Grant Admin Role
    console.log('Checking existing admin roles...');
    const { data: existing, error: fetchError } = await supabase
      .from('admin_roles')
      .select('*')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (fetchError) {
        console.error('Error fetching roles:', fetchError.message);
    }

    if (existing) {
      if (existing.is_active) {
         console.log(`\u2705 User "${email}" is ALREADY an active admin.`);
      } else {
         console.log('User has inactive admin role. Reactivating...');
         const { error: updateError } = await supabase
            .from('admin_roles')
            .update({ is_active: true })
            .eq('id', existing.id);
         
         if (updateError) {
             console.error('Failed to reactivate:', updateError.message);
         } else {
             console.log(`\u2705 User "${email}" is now an ACTIVE admin.`);
         }
      }
    } else {
      console.log('Granting admin role...');
      const { error: insertError } = await supabase
        .from('admin_roles')
        .insert({
          user_id: user.id,
          role: 'admin',
          permissions: ['all'],
          granted_by: null // System/Script
        });

      if (insertError) {
        console.error('Failed to grant role:', insertError.message);
      } else {
        console.log(`\u2705 Successfully granted admin role to "${email}"`);
      }
    }
  } catch (err) {
      console.error('Unexpected error:', err);
  }
}

setAdmin();
