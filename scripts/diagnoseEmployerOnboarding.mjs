// Diagnose Employer Onboarding Issues
// Run: node scripts/diagnoseEmployerOnboarding.mjs

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 Diagnosing Employer Onboarding Issues\n');

  // 1. Check profiles_employer table columns directly
  console.log('1️⃣ Checking profiles_employer table schema...');
  const { data: tableData, error: tableError } = await supabase
    .from('profiles_employer')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('❌ Table check failed:', tableError.message);
    console.error('   This might mean the table doesn\'t exist or RLS is blocking access');
  } else {
    console.log('✅ Table exists and is accessible');
    if (tableData && tableData.length > 0) {
      console.log('   Sample columns:', Object.keys(tableData[0]).join(', '));
    } else {
      console.log('   Table is empty - no existing profiles');
    }
  }

  // 2. Check for required columns by attempting an insert with all fields
  console.log('\n2️⃣ Checking for required columns...');
  const requiredFields = {
    user_id: '00000000-0000-0000-0000-000000000000',
    company_name: 'Test Company',
    company_type: 'employer',
    industry: 'technology',
    company_size: '51-200',
    founded_year: 2020,
    company_description: 'Test description',
    registration_country: 'US',
    registration_province: 'CA',
    registration_city: 'San Francisco',
    office_address: '123 Test St',
    postal_code: '94105',
    company_logo: null,
    company_images: [],
    website: 'https://test.com',
    linkedin_url: 'https://linkedin.com/company/test'
  };

  const { error: testError } = await supabase
    .from('profiles_employer')
    .insert(requiredFields);

  if (testError) {
    console.error('❌ Column validation failed:', testError.message);
    console.error('   Code:', testError.code);
    
    if (testError.code === '42703') {
      console.error('\n   ⚠️  MISSING COLUMN DETECTED');
      console.error('   Action: Run scripts/update_employer_schema.sql in Supabase SQL Editor');
    } else if (testError.code === '42501') {
      console.error('\n   ⚠️  RLS POLICY BLOCKING INSERT');
      console.error('   Action: Check Supabase RLS policies for profiles_employer table');
    } else {
      console.error('   Details:', testError.details);
      console.error('   Hint:', testError.hint);
    }
  } else {
    console.log('✅ All required columns exist');
    console.log('   (Cleaning up test record...)');
    // Clean up the test record
    await supabase
      .from('profiles_employer')
      .delete()
      .eq('user_id', '00000000-0000-0000-0000-000000000000');
  }

  // 3. Check storage buckets
  console.log('\n3️⃣ Checking storage buckets...');
  const requiredBuckets = ['company-logos', 'company-images', 'resumes'];
  
  const { data: buckets, error: bucketError } = await supabase
    .storage
    .listBuckets();

  if (bucketError) {
    console.error('❌ Bucket check failed:', bucketError.message);
  } else {
    console.log(`Found ${buckets.length} total buckets`);
    const existingBuckets = buckets.map(b => b.id);
    const missingBuckets = requiredBuckets.filter(b => !existingBuckets.includes(b));

    if (missingBuckets.length > 0) {
      console.error('\n❌ Missing buckets:', missingBuckets.join(', '));
      console.error('   Action: Run supabase/migrations/20260112_create_onboarding_storage_buckets.sql');
    } else {
      console.log('✅ All required buckets exist:');
      requiredBuckets.forEach(bucketId => {
        const bucket = buckets.find(b => b.id === bucketId);
        console.log(`   ✓ ${bucketId} (${bucket?.public ? 'public' : 'private'})`);
      });
    }
  }

  // 4. Test actual user flow
  console.log('\n4️⃣ Testing user authentication flow...');
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    console.warn('⚠️  No authenticated user');
    console.log('   Sign in to the app to test with an actual user account');
  } else {
    console.log('✅ Current user:', user.email);
    
    // Try to fetch their profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles_employer')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('❌ Profile fetch failed:', profileError.message);
    } else if (!profile) {
      console.log('   📝 No existing profile (normal for new users)');
    } else {
      console.log('   ✅ Existing profile found:', profile.company_name);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 DIAGNOSIS COMPLETE');
  console.log('='.repeat(50));
  console.log('\nReview the output above for any ❌ errors');
  console.log('\n📋 REQUIRED ACTIONS:');
  console.log('1. If columns missing → Run scripts/update_employer_schema.sql in Supabase');
  console.log('2. If buckets missing → Run migrations/20260112_create_onboarding_storage_buckets.sql');
  console.log('3. If RLS errors → Check Supabase Dashboard > Authentication > Policies');
}

diagnose()
  .then(() => {
    console.log('\n✅ Diagnosis completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Diagnosis failed with error:', error);
    process.exit(1);
  });
