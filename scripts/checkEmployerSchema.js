const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkSchema() {
  try {
    // Get one record to see structure
    const { data, error } = await supabase
      .from('profiles_employer')
      .select('*')
      .limit(1);

    if (error) {
      console.log('Error:', error.message);
      console.log('Table might not exist or need columns added');
    } else if (data && data.length > 0) {
      console.log('Current columns:', Object.keys(data[0]));
    } else {
      console.log('No data in table yet');
    }
  } catch (err) {
    console.error('Failed:', err.message);
  }
}

checkSchema();
