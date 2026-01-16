import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual .env parsing
const envPath = path.resolve(process.cwd(), '.env');
const envConfig = fs.readFileSync(envPath, 'utf8');
const envVars = {};
envConfig.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars['VITE_SUPABASE_URL'], envVars['SUPABASE_SERVICE_ROLE_KEY'], {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testOnboardingFlows() {
  console.log('🧪 Testing All Onboarding Flows\n');
  console.log('=' .repeat(60));
  
  const results = {
    employer: { tested: false, success: false, errors: [] },
    jobSeeker: { tested: false, success: false, errors: [] },
    auPair: { tested: false, success: false, errors: [] },
    hostFamily: { tested: false, success: false, errors: [] }
  };
  
  // Test 1: Check if employer profile exists
  console.log('\n📋 Test 1: Employer Profile Check');
  console.log('-'.repeat(60));
  try {
    const { data: employerProfiles, error } = await supabase
      .from('profiles_employer')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    results.employer.tested = true;
    results.employer.success = true;
    console.log('✅ profiles_employer table accessible');
    console.log(`   Found ${employerProfiles.length} employer profiles`);
    
    if (employerProfiles.length > 0) {
      const latest = employerProfiles[0];
      console.log('   Latest profile:');
      console.log(`   - Company: ${latest.company_name}`);
      console.log(`   - Industry: ${latest.industry}`);
      console.log(`   - Completion: ${latest.profile_completion_percent}%`);
    }
  } catch (error) {
    results.employer.errors.push(error.message);
    console.log('❌ Error:', error.message);
  }
  
  // Test 2: Check if job seeker profile exists
  console.log('\n📋 Test 2: Job Seeker Profile Check');
  console.log('-'.repeat(60));
  try {
    const { data: jobSeekerProfiles, error } = await supabase
      .from('profiles_jobseeker')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    results.jobSeeker.tested = true;
    results.jobSeeker.success = true;
    console.log('✅ profiles_jobseeker table accessible');
    console.log(`   Found ${jobSeekerProfiles.length} job seeker profiles`);
    
    if (jobSeekerProfiles.length > 0) {
      const latest = jobSeekerProfiles[0];
      console.log('   Latest profile:');
      console.log(`   - Full Name: ${latest.full_name || 'N/A'}`);
      console.log(`   - Title: ${latest.current_title || 'N/A'}`);
      console.log(`   - Completion: ${latest.profile_completion_percent}%`);
    }
  } catch (error) {
    results.jobSeeker.errors.push(error.message);
    console.log('❌ Error:', error.message);
  }
  
  // Test 3: Check if au pair profile exists
  console.log('\n📋 Test 3: Au Pair Profile Check');
  console.log('-'.repeat(60));
  try {
    const { data: auPairProfiles, error } = await supabase
      .from('au_pair_profiles')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    results.auPair.tested = true;
    results.auPair.success = true;
    console.log('✅ au_pair_profiles table accessible');
    console.log(`   Found ${auPairProfiles.length} au pair profiles`);
    
    if (auPairProfiles.length > 0) {
      const latest = auPairProfiles[0];
      console.log('   Latest profile:');
      console.log(`   - Full Name: ${latest.full_name || 'N/A'}`);
      console.log(`   - Age: ${latest.age || 'N/A'}`);
      console.log(`   - Status: ${latest.status || 'N/A'}`);
    }
  } catch (error) {
    results.auPair.errors.push(error.message);
    console.log('❌ Error:', error.message);
  }
  
  // Test 4: Check if host family profile exists
  console.log('\n📋 Test 4: Host Family Profile Check');
  console.log('-'.repeat(60));
  try {
    const { data: hostFamilyProfiles, error } = await supabase
      .from('host_family_profiles')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    
    results.hostFamily.tested = true;
    results.hostFamily.success = true;
    console.log('✅ host_family_profiles table accessible');
    console.log(`   Found ${hostFamilyProfiles.length} host family profiles`);
    
    if (hostFamilyProfiles.length > 0) {
      const latest = hostFamilyProfiles[0];
      console.log('   Latest profile:');
      console.log(`   - Family Name: ${latest.family_name || 'N/A'}`);
      console.log(`   - Location: ${latest.city || 'N/A'}, ${latest.country || 'N/A'}`);
      console.log(`   - Status: ${latest.status || 'N/A'}`);
    }
  } catch (error) {
    results.hostFamily.errors.push(error.message);
    console.log('❌ Error:', error.message);
  }
  
  // Summary
  console.log('\n');
  console.log('=' .repeat(60));
  console.log('📊 SUMMARY');
  console.log('=' .repeat(60));
  
  const totalTests = Object.keys(results).length;
  const successfulTests = Object.values(results).filter(r => r.success).length;
  
  console.log(`\nTests Run: ${totalTests}`);
  console.log(`Successful: ${successfulTests}`);
  console.log(`Failed: ${totalTests - successfulTests}\n`);
  
  Object.entries(results).forEach(([name, result]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`${status} ${name.padEnd(15)} - ${result.tested ? 'Tested' : 'Not tested'}`);
    if (result.errors.length > 0) {
      result.errors.forEach(err => console.log(`   └─ ${err}`));
    }
  });
  
  console.log('\n' + '='.repeat(60));
}

testOnboardingFlows();
