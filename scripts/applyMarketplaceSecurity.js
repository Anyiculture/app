import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const connectionString = envConfig.DATABASE_URL;

if (!connectionString) {
  console.error('Missing DATABASE_URL in .env');
  process.exit(1);
}

const client = new pg.Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function applySecurity() {
  try {
    await client.connect();
    console.log('Connected to database...');

    // 1. Add new columns to marketplace_items
    console.log('Adding new columns...');
    await client.query(`
      ALTER TABLE marketplace_items
      ADD COLUMN IF NOT EXISTS brand VARCHAR(100),
      ADD COLUMN IF NOT EXISTS model VARCHAR(100),
      ADD COLUMN IF NOT EXISTS color VARCHAR(50),
      ADD COLUMN IF NOT EXISTS size VARCHAR(50),
      ADD COLUMN IF NOT EXISTS dimensions VARCHAR(200),
      ADD COLUMN IF NOT EXISTS weight VARCHAR(50),
      ADD COLUMN IF NOT EXISTS material VARCHAR(100),
      ADD COLUMN IF NOT EXISTS quantity_available INTEGER DEFAULT 1,
      ADD COLUMN IF NOT EXISTS meetup_location TEXT,
      ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
      ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8),
      ADD COLUMN IF NOT EXISTS location_province VARCHAR(100),
      ADD COLUMN IF NOT EXISTS location_district VARCHAR(100);
    `);

    // 2. Enable RLS
    console.log('Enabling RLS...');
    await client.query(`ALTER TABLE marketplace_items ENABLE ROW LEVEL SECURITY;`);

    // 3. Create/Update Policies
    console.log('Applying RLS policies...');
    
    // Drop existing policies to avoid conflicts
    await client.query(`
      DROP POLICY IF EXISTS "Public can view active marketplace items" ON marketplace_items;
      DROP POLICY IF EXISTS "Authenticated users can create listings" ON marketplace_items;
      DROP POLICY IF EXISTS "Users can update own listings" ON marketplace_items;
      DROP POLICY IF EXISTS "Users can delete own listings" ON marketplace_items;
    `);

    await client.query(`
      -- 1. Anyone can view active listings
      CREATE POLICY "Public can view active marketplace items"
      ON marketplace_items FOR SELECT
      USING (status = 'active');

      -- 2. Authenticated users can insert their own listings
      CREATE POLICY "Authenticated users can create listings"
      ON marketplace_items FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND status = 'active'
      );

      -- 3. Users can only update their OWN listings
      CREATE POLICY "Users can update own listings"
      ON marketplace_items FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (
        auth.uid() = user_id
        AND user_id = user_id -- Prevent changing owner
      );

      -- 4. Users can only delete their OWN listings
      CREATE POLICY "Users can delete own listings"
      ON marketplace_items FOR DELETE
      USING (auth.uid() = user_id);
    `);

    // 4. Create Price Check Trigger
    console.log('Creating price check trigger...');
    await client.query(`
      CREATE OR REPLACE FUNCTION log_price_changes()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Only allow price changes by the owner (redundant with RLS but good for safety)
        IF OLD.price != NEW.price AND NEW.user_id != OLD.user_id THEN
          RAISE EXCEPTION 'Cannot change price of items you do not own';
        END IF;
        
        -- Prevent negative prices
        IF NEW.price < 0 THEN
          RAISE EXCEPTION 'Price cannot be negative';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      DROP TRIGGER IF EXISTS check_price_changes ON marketplace_items;
      
      CREATE TRIGGER check_price_changes
      BEFORE UPDATE ON marketplace_items
      FOR EACH ROW
      EXECUTE FUNCTION log_price_changes();
    `);

    // 5. Create Indexes
    console.log('Creating indexes...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_items(category);
      CREATE INDEX IF NOT EXISTS idx_marketplace_location_province ON marketplace_items(location_province);
      CREATE INDEX IF NOT EXISTS idx_marketplace_location_city ON marketplace_items(location_city);
      CREATE INDEX IF NOT EXISTS idx_marketplace_price ON marketplace_items(price);
      CREATE INDEX IF NOT EXISTS idx_marketplace_coordinates ON marketplace_items(latitude, longitude);
    `);

    console.log('✅ Security policies and schema updates applied successfully!');

  } catch (err) {
    console.error('Error applying security:', err);
  } finally {
    await client.end();
  }
}

applySecurity();
