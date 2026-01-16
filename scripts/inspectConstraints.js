
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env vars
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.join('=').trim();
  }
});

const client = new Client({
  connectionString: envConfig.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to DB');
    
    const query = `
      SELECT conname, pg_get_constraintdef(oid) 
      FROM pg_constraint 
      WHERE conrelid = 'public.jobs'::regclass 
      AND contype = 'c';
    `;
    
    const res = await client.query(query);
    console.log('Check Constraints on jobs table:');
    res.rows.forEach(r => {
        console.log(`- ${r.conname}: ${r.pg_get_constraintdef}`);
    });
    
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

run();
