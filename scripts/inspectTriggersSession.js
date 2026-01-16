
import pg from 'pg';

const { Client } = pg;

// Pooler URL with Port 6543 (Session Mode)
const connectionString = 'postgresql://postgres.rxeymolxjcudkpbfyruq:HTpFUzy51y4pp2B9@aws-0-us-east-1.pooler.supabase.com:6543/postgres';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function inspect() {
  console.log('Connecting to Pooler (Port 6543)...');
  await client.connect();
  console.log('Connected.');

  try {
     // Check for handle_new_user definition
     const defRes = await client.query(`
        SELECT pg_get_functiondef(p.oid)
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'handle_new_user'
     `);
            
     if (defRes.rows.length > 0) {
        console.log(`\n--- DEFINITION OF handle_new_user ---`);
        console.log(defRes.rows[0].pg_get_functiondef);
     } else {
        console.log('Function handle_new_user not found.');
     }
  } catch (err) {
    console.error('Inspection Error:', err);
  } finally {
    await client.end();
  }
}

inspect();
