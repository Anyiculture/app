import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log("--- Fetching recent payment submissions ---");
  const { data: submissions, error: subError } = await supabase
    .from('payment_submissions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  if (subError) {
    console.error("Error:", subError);
  } else {
    console.log(JSON.stringify(submissions, null, 2));
  }
}

main();
