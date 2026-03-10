import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  try {
    const sql = fs.readFileSync('supabase/migrations/20260310_add_payment_stats_to_rpc.sql', 'utf8');
    
    // We have to use a workaround since supabase-js doesn't have a direct raw SQL execution method
    // If pg is installed, we can use that instead. Let's try RPC first.
    console.log('Attempting to apply migration via RPC...');
    
    // As a fallback, since we can't reliably run raw SQL via the JS client without a specific RPC,
    // we'll try to use pg directly if it's in node_modules, or just output instructions.
    
    // Check if pg is available
    let Client;
    try {
       const pg = await import('pg');
       Client = pg.Client;
    } catch (e) {
       console.log('pg module not found. Please run the SQL manually or fix the supabase CLI.');
       process.exit(1);
    }
    
    // This assumes local postgres running on 54322, password postgres
    const client = new Client({
      connectionString: 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
    });
    
    await client.connect();
    await client.query(sql);
    await client.end();
    
    console.log('Migration applied successfully via pg client.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
