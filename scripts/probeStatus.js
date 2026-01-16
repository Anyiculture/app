
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');
const envFile = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envFile.split('\n').forEach(line => {
  const [key, ...value] = line.split('=');
  if (key && value) {
    envConfig[key.trim()] = value.join('=').trim();
  }
});

const supabase = createClient(envConfig.VITE_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

const statuses = [
  'open', 'OPEN', 
  'published', 'PUBLISHED', 
  'active', 'ACTIVE', 
  'draft', 'DRAFT', 
  'pending', 'PENDING',
  'closed', 'CLOSED',
  'filled', 'FILLED',
  'expired', 'EXPIRED',
  'archived', 'ARCHIVED',
  'reviewing', 'REVIEWING',
  'hiring', 'HIRING'
];

async function probe() {
  console.log('Probing valid status values...');
  
  // We need a valid dummy insert
  const dummy = {
      title: 'Status Probe',
      description: 'Probe',
      job_type: 'full_time',
      location_country: 'China',
      location_city: 'Beijing',
      location: 'Beijing, China',
      category: 'technology', 
      subcategory: 'frontend_development', 
      skills_required: ['React'],
      poster_id: '00000000-0000-0000-0000-000000000000', // Need a valid user normally, but let's try. 
      // If FK fails, we know status passed? 
      // Actually, check constraint runs before FK? Not always.
      // Better to use an admin function or just try to interpret the error.
  };

  // We need a valid user ID for poster_id usually.
  // Use a random UUID might fail FK.
  // Let's first get a user if possible, or create one. 
  // We can reuse the service user from env or list users.
  
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const userId = users[0]?.id;
  if(!userId) {
      console.log('No users found to use as poster_id.');
      return;
  }
  dummy.poster_id = userId;

  for (const status of statuses) {
    process.stdout.write(`Trying status: '${status}' ... `);
    const { error } = await supabase.from('jobs').insert({ ...dummy, status });
    
    if (!error) {
      console.log('SUCCESS! Valid status found:', status);
      // Clean up
      await supabase.from('jobs').delete().eq('title', 'Status Probe');
      return;
    } else {
      if (error.message.includes('jobs_status_check')) {
        console.log('Failed (Constraint)');
      } else {
        console.log('Failed (Other):', error.message);
        // If other error (like FK), it might mean status was valid?
        // But usually check constraints are checked early.
      }
    }
  }
}

probe();
