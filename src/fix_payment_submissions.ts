import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env and .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL exists:", !!supabaseUrl);
console.log("Supabase Key exists:", !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in environment variables.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  try {
    console.log("--- Migration Started ---");
    
    // 1. Get Host Family IDs
    const { data: hfProfiles, error: hfError } = await supabase
      .from('host_family_profiles')
      .select('id');
    
    if (hfError) throw hfError;
    const hfIds = hfProfiles?.map(p => p.id) || [];
    console.log(`Found ${hfIds.length} host families.`);

    if (hfIds.length === 0) return;

    // 2. Fix payment_submissions plan_type
    const { data: subs, error: subError } = await supabase
      .from('payment_submissions')
      .select('id, user_id, plan_type')
      .in('user_id', hfIds)
      .eq('plan_type', 'au_pair_premium_monthly');
    
    if (subError) throw subError;
    console.log(`Found ${subs?.length || 0} host family submissions with wrong plan_type.`);

    for (const sub of (subs || [])) {
      console.log(`Updating submission ${sub.id}...`);
      await supabase.from('payment_submissions').update({ plan_type: 'host_family_premium' }).eq('id', sub.id);
    }

    // 3. Update profile_status to pending_approval if they have a pending submission
    const { data: pendingSubs, error: pError } = await supabase
      .from('payment_submissions')
      .select('user_id')
      .in('user_id', hfIds)
      .eq('status', 'pending');
    
    if (pError) throw pError;
    const pendingUserIds = [...new Set(pendingSubs?.map(s => s.user_id) || [])];
    console.log(`Updating ${pendingUserIds.length} host families to 'pending_approval' status.`);

    for (const userId of pendingUserIds) {
      await supabase.from('host_family_profiles').update({ profile_status: 'pending_approval' }).eq('id', userId);
    }

    console.log("--- Migration Completed Successfully ---");
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
