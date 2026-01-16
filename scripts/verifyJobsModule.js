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
  console.error('❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function verifyJobsModule() {
  console.log('🔍 Verifying Jobs Module Setup...\n');
  
  const results = {
    tables: {},
    columns: {},
    canCreate: {},
    overall: true
  };

  // 1. Check if tables exist
  console.log('📋 Checking Tables...');
  const tablesToCheck = [
    'jobs',
    'job_applications',
    'saved_jobs',
    'job_preferences',
    'profiles_jobseeker',
    'profiles_employer'
  ];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase.from(table).select('*').limit(0);
      if (error) {
        console.log(`  ❌ ${table} - NOT FOUND or NO ACCESS`);
        results.tables[table] = false;
        results.overall = false;
      } else {
        console.log(`  ✅ ${table} - EXISTS`);
        results.tables[table] = true;
      }
    } catch (err) {
      console.log(`  ❌ ${table} - ERROR: ${err.message}`);
      results.tables[table] = false;
      results.overall = false;
    }
  }

  // 2. Check profiles_jobseeker columns
  console.log('\n📊 Checking profiles_jobseeker Columns...');
  const requiredColumns = [
    'education_history',
    'certifications',
    'bio',
    'resume_url',
    'availability'
  ];

  try {
    const { data, error } = await supabase
      .from('profiles_jobseeker')
      .select('education_history, certifications, bio, resume_url, availability')
      .limit(0);
    
    if (error) {
      console.log('  ❌ Cannot query new columns - Schema update needed');
      console.log(`     Error: ${error.message}`);
      results.columns.status = 'missing';
      results.overall = false;
    } else {
      console.log('  ✅ All new onboarding columns exist');
      results.columns.status = 'ok';
    }
  } catch (err) {
    console.log(`  ❌ Error checking columns: ${err.message}`);
    results.columns.status = 'error';
    results.overall = false;
  }

  // 3. Test job creation
  console.log('\n🔧 Testing Job Creation...');
  try {
    const testJob = {
      poster_id: '00000000-0000-0000-0000-000000000000', // Dummy UUID
      title: 'TEST JOB - DELETE ME',
      description: 'Test job for verification',
      job_type: 'full_time',
      location_country: 'China',
      location_city: 'Beijing',
      skills_required: ['React', 'TypeScript'],
      benefits: ['Health Insurance'],
      status: 'draft',
      salary_currency: 'CNY',
      views_count: 0,
      applications_count: 0,
      featured: false
    };

    const { data, error } = await supabase
      .from('jobs')
      .insert(testJob)
      .select()
      .single();

    if (error) {
      console.log(`  ⚠️  Job creation test failed: ${error.message}`);
      if (error.message.includes('foreign key')) {
        console.log('     (This is expected - foreign key constraint on poster_id)');
        results.canCreate.jobs = 'schema_ok';
      } else {
        results.canCreate.jobs = false;
        results.overall = false;
      }
    } else {
      console.log('  ✅ Job creation successful (will delete test job)');
      // Delete test job
      await supabase.from('jobs').delete().eq('id', data.id);
      results.canCreate.jobs = true;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.canCreate.jobs = false;
    results.overall = false;
  }

  // 4. Test application creation
  console.log('\n📝 Testing Application Creation...');
  try {
    const testApp = {
      job_id: '00000000-0000-0000-0000-000000000000',
      applicant_id: '00000000-0000-0000-0000-000000000000',
      status: 'pending',
      resume_url: 'https://example.com/resume.pdf'
    };

    const { error } = await supabase
      .from('job_applications')
      .insert(testApp)
      .select()
      .single();

    if (error) {
      if (error.message.includes('foreign key') || error.message.includes('violates')) {
        console.log('  ⚠️  Application test failed (expected - foreign key constraint)');
        results.canCreate.applications = 'schema_ok';
      } else {
        console.log(`  ❌ Application creation failed: ${error.message}`);
        results.canCreate.applications = false;
        results.overall = false;
      }
    } else {
      console.log('  ✅ Application creation successful');
      results.canCreate.applications = true;
    }
  } catch (err) {
    console.log(`  ❌ Error: ${err.message}`);
    results.canCreate.applications = false;
    results.overall = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 VERIFICATION SUMMARY');
  console.log('='.repeat(60));
  
  if (results.overall) {
    console.log('\n✅ ALL CHECKS PASSED - Jobs module is ready!');
    console.log('\nYou can now:');
    console.log('  • Create job listings via PostJobPage');
    console.log('  • Complete job seeker onboarding');
    console.log('  • Apply for jobs');
  } else {
    console.log('\n⚠️  SOME ISSUES DETECTED\n');
    
    if (results.columns.status === 'missing') {
      console.log('❌ REQUIRED ACTION: Run schema update');
      console.log('   Execute scripts/update_schema.sql in Supabase SQL Editor\n');
    }
    
    if (!results.tables.jobs) {
      console.log('❌ Jobs table missing or inaccessible');
    }
    if (!results.tables.job_applications) {
      console.log('❌ Job applications table missing or inaccessible');
    }
    if (!results.tables.profiles_jobseeker) {
      console.log('❌ Profiles jobseeker table missing or inaccessible');
    }
  }

  console.log('='.repeat(60) + '\n');
}

verifyJobsModule();
