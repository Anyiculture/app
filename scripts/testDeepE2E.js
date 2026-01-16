
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

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

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

const TS = Date.now();
const SERVICE_EMAIL = `service_${TS}@example.com`;
const EMPLOYER_EMAIL = `employer_${TS}@example.com`;
const SEEKER_EMAIL = `seeker_${TS}@example.com`;
const PASSWORD = 'password123';

async function cleanupUser(email) {
  const { data: { users }, error } = await supabase.auth.admin.listUsers();
  if (error) {
     console.error("List users error:", error);
     return;
  }
  const user = users.find(u => u.email === email);
  if (user) {
    console.log(`Cleaning up ${email} (${user.id})...`);
    await supabase.auth.admin.deleteUser(user.id);
  }
}

async function runTest() {
  console.log('Starting Comprehensive E2E Test (Service, Employer, Seeker)...');

  try {
    // 1. Cleanup
    await cleanupUser(SERVICE_EMAIL);
    await cleanupUser(EMPLOYER_EMAIL);
    await cleanupUser(SEEKER_EMAIL);

    // 2. Create Service Account (App Owner mockup)
    console.log('Creating Service Account...');
    const { data: servAuth, error: servErr } = await supabase.auth.admin.createUser({
        email: SERVICE_EMAIL,
        password: PASSWORD,
        email_confirm: true,
        user_metadata: { role: 'service' } // If you use metadata for roles
    });
    // Assuming profiles table role column handles this mainly
    if (servErr) throw servErr;
    const servId = servAuth.user.id;
    await supabase.from('profiles').upsert({ id: servId, email: SERVICE_EMAIL, role: 'admin', full_name: 'Anyi Service' });

    // 3. Create Employer
    console.log('Creating Employer Account...');
    const { data: empAuth, error: empErr } = await supabase.auth.admin.createUser({
      email: EMPLOYER_EMAIL,
      password: PASSWORD,
      email_confirm: true
    });
    if (empErr) throw empErr;
    const empId = empAuth.user.id;

    // Create Employer Profile
    await supabase.from('profiles').upsert({
      id: empId,
      email: EMPLOYER_EMAIL,
      role: 'employer',
      full_name: 'Test Employer'
    });
    await supabase.from('profiles_employer').upsert({
      user_id: empId,
      company_name: 'Global Tech Testing',
      industry: 'Technology'
    });

    // 4. Post Job (Employer Action)
    console.log('Employer posting a Job...');
    const jobData = {
      poster_id: empId,
      title: 'Senior React Developer',
      description: 'We need a React expert.',
      job_type: 'full_time',
      location: 'Beijing, China',
      location_country: 'China',
      location_city: 'Beijing',
      category: 'technology', 
      subcategory: 'frontend_development', 
      skills_required: ['React', 'TypeScript'],
      status: 'active'
    };
    
    // Attempt insert
    const { data: job, error: jobErr } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobErr) {
        if (jobErr.message.includes('column "subcategory" does not exist')) {
            throw new Error('SCHEMA INVALID: "subcategory" column missing. Please run scripts/update_jobs_schema.sql in Supabase Console.');
        }
        throw jobErr;
    }
    console.log('Job Posted Successfully:', job.id);


    // 5. Create Seeker (Job Seeker / Employee)
    console.log('Creating Job Seeker Account...');
    const { data: seekAuth, error: seekErr } = await supabase.auth.admin.createUser({
      email: SEEKER_EMAIL,
      password: PASSWORD,
      email_confirm: true
    });
    if (seekErr) throw seekErr;
    const seekId = seekAuth.user.id;

    // Create Seeker Profile
    // Create Seeker Profile
    const { error: profErr } = await supabase.from('profiles').upsert({
      id: seekId,
      email: SEEKER_EMAIL,
      full_name: 'Test Seeker'
    });
    if (profErr) { console.error('Seeker Profile Error:', profErr); throw profErr; }

    console.log('Seeker completing Onboarding...');
    const { error: jsErr } = await supabase.from('profiles_jobseeker').insert({
      user_id: seekId,
      full_name: 'Test Seeker',
      current_location_city: 'Shanghai',
      resume_url: 'https://resume.com',
    });
    if (jsErr) { console.error('Seeker Job Details Error:', jsErr); throw jsErr; }


    // 5. Apply
    console.log('Applying to Job...');
    const { data: app, error: appErr } = await supabase
      .from('job_applications')
      .insert({
        job_id: job.id,
        applicant_id: seekId,
        status: 'pending',
        resume_url: 'https://example.com/resume.pdf',
        cover_letter: 'I am perfect for this.'
      })
      .select()
      .single();

    if (appErr) throw appErr;
    console.log('Application Success:', app.id);
    console.log('E2E TEST PASSED! 🚀');

  } catch (err) {
    console.error('TEST FAILED ❌');
    console.error(err);
  }
}

runTest();
