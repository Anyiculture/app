const { Client } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing DATABASE_URL in .env");
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
});

async function migrate() {
  try {
    await client.connect();
    console.log("Connected to database.");

    // 1. Update plan_type for Host Families
    console.log("Updating payment_submissions plan_type for Host Families...");
    const updateSubmissionsQuery = `
      UPDATE payment_submissions
      SET plan_type = 'host_family_premium'
      WHERE user_id IN (SELECT id FROM host_family_profiles)
      AND plan_type = 'au_pair_premium_monthly'
      RETURNING id, user_id;
    `;
    const res = await client.query(updateSubmissionsQuery);
    console.log(`Updated ${res.rowCount} submissions.`);

    // 2. Update profile_status to 'pending_approval' for Host Families with pending payments
    console.log("Updating host_family_profiles status to 'pending_approval' for pending payments...");
    const updateProfilesQuery = `
      UPDATE host_family_profiles
      SET profile_status = 'pending_approval'
      WHERE id IN (
        SELECT user_id FROM payment_submissions 
        WHERE status = 'pending'
      )
      AND profile_status != 'pending_approval'
      RETURNING id;
    `;
    const res2 = await client.query(updateProfilesQuery);
    console.log(`Updated ${res2.rowCount} host family profiles.`);

    console.log("Migration finished successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.end();
  }
}

migrate();
