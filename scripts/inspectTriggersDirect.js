
import pg from 'pg';

const { Client } = pg;

// Reconstruct Direct URL
// User provided: 
// URL: https://rxeymolxjcudkpbfyruq.supabase.co
// Password: HTpFUzy51y4pp2B9
// Direct Host: db.rxeymolxjcudkpbfyruq.supabase.co (Standard Supabase Direct Host)

const connectionString = 'postgresql://postgres:HTpFUzy51y4pp2B9@db.rxeymolxjcudkpbfyruq.supabase.co:5432/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  console.log('Connecting to Direct DB...');
  await client.connect();
  console.log('Connected.');

  try {
    // 3. Try to get definition via pg_get_functiondef for likely culprits
    const likelyNames = ['handle_new_user', 'on_auth_user_created', 'create_user_profile', 'public.handle_new_user'];
    
    // First, list all triggers on auth.users to see WHAT function is called
    const triggersRes = await client.query(`
      SELECT tgname, pg_get_triggerdef(oid) as def
      FROM pg_trigger
      WHERE tgrelid = 'auth.users'::regclass
    `);
    
    console.log('\n--- Triggers on auth.users ---');
    triggersRes.rows.forEach(r => {
        console.log(`Trigger: ${r.tgname}`);
        console.log(`Definition: ${r.def}`);
    });
    
    // Extract function names from trigger defs if possible, or just search likely ones
    // Usually 'EXECUTE FUNCTION handle_new_user()'
    
    console.log('\n--- Checking common function definitions ---');
    for (const name of likelyNames) {
        try {
            const defRes = await client.query(`
                SELECT pg_get_functiondef(p.oid)
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE p.proname = $1
            `, [name.split('.').pop()]); // simplistic check
            
            if (defRes.rows.length > 0) {
                console.log(`\n--- DEFINITION OF ${name} ---`);
                console.log(defRes.rows[0].pg_get_functiondef);
            }
        } catch (e) {
             // console.log(`Could not find/get ${name}`);
        }
    }

  } catch (err) {
    console.error('Inspection Error:', err);
  } finally {
    await client.end();
  }
}

inspect();
