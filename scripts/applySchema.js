
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars manually
const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.join('=').trim();
  }
});

const dbUrl = envConfig.DATABASE_URL;

if (!dbUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

const { Client } = pg;
const client = new Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database.');

    const sqlPath = path.join(__dirname, 'update_jobs_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('Executing SQL from:', sqlPath);
    console.log('-------------------');
    console.log(sql);
    console.log('-------------------');

    await client.query(sql);
    console.log('Schema update applied successfully!');

  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await client.end();
  }
}

run();
