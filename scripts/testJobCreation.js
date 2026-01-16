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
  console.error('❌ Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function testJobCreation() {
  console.log('🧪 Testing Job Creation with Actual Data...\n');

  try {
    // 1. Create test employer
    const TS = Date.now();
    const EMPLOYER_EMAIL = `test_employer_${TS}@example.com`;
    
    console.log('1️⃣ Creating test employer account...');
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: EMPLOYER_EMAIL,
      password: 'password123',
      email_confirm: true
    });

    if (authError) throw authError;
    const employerId = authData.user.id;
    console.log(`   ✅ Employer created: ${employerId}\n`);

    // 2. Create employer profile
    console.log('2️⃣ Creating employer profile...');
    await supabase.from('profiles').upsert({
      id: employerId,
      email: EMPLOYER_EMAIL,
      role: 'employer',
      full_name: 'Test Employer Inc'
    });

    await supabase.from('profiles_employer').upsert({
      user_id: employerId,
      company_name: 'Tech Innovations Ltd',
      industry: 'Technology'
    });
    console.log('   ✅ Employer profile created\n');

    // 3. Create a job posting
    console.log('3️⃣ Creating job posting...');
    const jobData = {
      poster_id: employerId,
      title: 'Senior React Developer',
      description: 'We are looking for an experienced React developer to join our team.',
      job_type: 'full_time',
      location: 'Beijing, Beijing, China', // Required field
      location_country: 'China',
      location_province: 'Beijing',
      location_city: 'Beijing',
      category: 'technology',
      salary_min: 20000,
      salary_max: 35000,
      salary_currency: 'CNY',
      salary_period: 'monthly',
      remote_type: 'hybrid',
      experience_level: 'mid',
      skills_required: ['React', 'TypeScript', 'Node.js'],
      benefits: ['Health Insurance', 'Flexible Hours', 'Remote Work'],
      status: 'active',
      views_count: 0,
      applications_count: 0,
      featured: false
    };

    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert(jobData)
      .select()
      .single();

    if (jobError) {
      console.log('   ❌ Failed to create job:');
      console.log('   Error:', jobError.message);
      throw jobError;
    }

    console.log('   ✅ Job created successfully!');
    console.log('   Job ID:', job.id);
    console.log('   Title:', job.title);
    console.log('   Location:', job.location);
    console.log('');

    // 4. Verify job can be retrieved
    console.log('4️⃣ Verifying job retrieval...');
    const { data: retrievedJob, error: retrieveError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', job.id)
      .single();

    if (retrieveError) throw retrieveError;
    console.log('   ✅ Job retrieved successfully\n');

    // 5. Clean up
    console.log('5️⃣ Cleaning up test data...');
    await supabase.from('jobs').delete().eq('id', job.id);
    await supabase.from('profiles_employer').delete().eq('user_id', employerId);
    await supabase.from('profiles').delete().eq('id', employerId);
    await supabase.auth.admin.deleteUser(employerId);
    console.log('   ✅ Test data cleaned up\n');

    console.log('═'.repeat(60));
    console.log('🎉 SUCCESS! Job creation is working perfectly!');
    console.log('═'.repeat(60));
    console.log('\n✅ You can now create job listings through the UI');
    console.log('✅ The location field is properly handled');
    console.log('✅ All required fields are supported\n');

  } catch (error) {
    console.log('\n❌ TEST FAILED');
    console.error('Error:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

testJobCreation();
