// Test Employer Onboarding and Job Posting Flow
// Run: node scripts/testEmployerOnboarding.js

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestEmployer() {
  console.log('🚀 Starting Employer Onboarding Test...\n');

  // Step 1: Create test user
  const testEmail = `test-employer-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  console.log(`1️⃣ Creating test user: ${testEmail}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: testEmail,
    password: testPassword
  });

  if (authError) {
    console.error('❌ Auth error:', authError.message);
    return null;
  }

  const userId = authData.user?.id;
  if (!userId) {
    console.error('❌ No user ID returned');
    return null;
  }

  console.log(`✅ User created: ${userId}\n`);

  // Step 2: Sign in
  console.log('2️⃣ Signing in...');
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: testEmail,
    password: testPassword
  });

  if (signInError) {
    console.error('❌ Sign in error:', signInError.message);
    return null;
  }

  console.log('✅ Signed in successfully\n');

  // Step 3: Create employer profile
  console.log('3️⃣ Creating employer profile...');
  
  const employerData = {
    user_id: userId,
    company_name: 'Tech Innovations Inc.',
    company_type: 'employer',
    industry: 'technology',
    company_size: '51-200',
    founded_year: 2015,
    company_description: 'We are a leading technology company focused on AI and machine learning solutions. Our culture emphasizes innovation, collaboration, and continuous learning.',
    
    // Location
    registration_country: 'US', // changed to use ISO code
    registration_province: 'CA', // changed to use ISO code
    registration_city: 'San Francisco',
    office_address: '123 Market Street, Suite 500',
    postal_code: '94105',
    
    // Online presence
    website: 'https://techinnovations.example.com',
    linkedin_url: 'https://linkedin.com/company/tech-innovations',
    
    // Images (URLs - in real scenario these would be uploaded first)
    company_logo: null,
    company_images: [],
    
    // Meta
    profile_completion_percent: 100,
    verified: false
  };

  const { data: profileData, error: profileError } = await supabase
    .from('profiles_employer')
    .upsert(employerData)
    .select();

  if (profileError) {
    console.error('❌ Profile creation error:', profileError.message);
    console.error('Details:', profileError);
    return null;
  }

  console.log('✅ Employer profile created:', profileData[0]?.company_name);
  console.log('Profile ID:', profileData[0]?.id, '\n');

  // Step 4: Add user_services entry
  console.log('4️⃣ Adding to user_services...');
  
  const { error: serviceError } = await supabase
    .from('user_services')
    .upsert({
      user_id: userId,
      service_type: 'jobs',
      role: 'employer'
    });

  if (serviceError) {
    console.error('❌ Service error:', serviceError.message);
  } else {
    console.log('✅ User service added\n');
  }

  // Step 5: Create a test job posting
  console.log('5️⃣ Creating test job posting...');
  
  const jobData = {
    employer_id: userId,
    title: 'Senior Full Stack Developer',
    description: 'We are looking for an experienced Full Stack Developer to join our growing team.',
    requirements: 'React, Node.js, TypeScript, 5+ years experience',
    responsibilities: 'Develop and maintain web applications, mentor junior developers',
    location_city: 'San Francisco',
    location_country: 'US',
    location_type: 'hybrid',
    employment_type: 'full_time',
    salary_min: 120000,
    salary_max: 180000,
    salary_currency: 'USD',
    category: 'technology',
    status: 'open',
    experience_level: 'senior',
    posted_at: new Date().toISOString()
  };

  const { data: jobPostData, error: jobError } = await supabase
    .from('jobs')
    .insert(jobData)
    .select();

  if (jobError) {
    console.error('❌ Job posting error:', jobError.message);
    console.error('Details:', jobError);
  } else {
    console.log('✅ Job posted:', jobPostData[0]?.title);
    console.log('Job ID:', jobPostData[0]?.id, '\n');
  }

  // Summary
  console.log('📊 TEST SUMMARY');
  console.log('================');
  console.log('Email:', testEmail);
  console.log('Password:', testPassword);
  console.log('User ID:', userId);
  console.log('Company:', employerData.company_name);
  console.log('Job Posted:', jobData.title || 'Failed');
  
  return {
    email: testEmail,
    password: testPassword,
    userId,
    profileData: profileData?.[0],
    jobData: jobPostData?.[0]
  };
}

// Run the test
createTestEmployer()
  .then(() => {
    console.log('\n✅ Test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
