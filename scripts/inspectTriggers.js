
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Client } = pg;

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const connectionString = envVars['DATABASE_URL'];

if (!connectionString) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false } // Required for Supabase in some environments
});

async function inspect() {
  await client.connect();
  console.log('Connected to DB.');

  try {
    // 1. Find Triggers on auth.users
    const triggersRes = await client.query(`
      SELECT trigger_name, event_manipulation, action_statement, action_orientation, t.tgname
      FROM pg_trigger t
      JOIN pg_class c ON t.tgrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'auth' AND c.relname = 'users';
    `);
    
    console.log('\n--- Triggers on auth.users ---');
    triggersRes.rows.forEach(r => console.log(r));

    // 2. We often look for 'on_auth_user_created' or similar logic.
    // Let's list functions in public schema to find the handler.
    const funcRes = await client.query(`
       SELECT routines.routine_name, routines.routine_definition
       FROM information_schema.routines
       WHERE routines.specific_schema = 'public'
       ORDER BY routines.routine_name;
    `);
    
    console.log('\n--- Public Functions ---');
    funcRes.rows.forEach(r => {
        if (r.routine_definition) { // Some might be null if no permissions (but we are postgres)
             console.log(`Function: ${r.routine_name}`);
             console.log(r.routine_definition.substring(0, 100) + '...'); 
        } else {
             console.log(`Function: ${r.routine_name} (No definition visible via info_schema)`);
        }
    });

    // 3. Try to get definition via pg_get_functiondef for likely culprits
    const likelyNames = ['handle_new_user', 'on_auth_user_created', 'create_user_profile'];
    for (const name of likelyNames) {
        try {
            const defRes = await client.query(`
                SELECT pg_get_functiondef(p.oid)
                FROM pg_proc p
                JOIN pg_namespace n ON p.pronamespace = n.oid
                WHERE n.nspname = 'public' AND p.proname = $1
            `, [name]);
            
            if (defRes.rows.length > 0) {
                console.log(`\n--- DEFINITION OF ${name} ---`);
                console.log(defRes.rows[0].pg_get_functiondef);
            }
        } catch (e) {
            // ignore
        }
    }

  } catch (err) {
    console.error('Inspection Error:', err);
  } finally {
    await client.end();
  }
}

inspect();
