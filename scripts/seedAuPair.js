
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const auPairs = [
  {
    display_name: "Sarah Jenkins",
    nationality: "American",
    languages: ["English", "Spanish"],
    childcare_experience_years: 3,
    available_from: "2026-03-01",
    bio: "Experienced au pair looking for a lovely family in China. I love teaching English and playing sports.",
    profile_status: "active",
    current_city: "New York",
    current_country: "USA",
    skills: ["Teaching", "Sports", "First Aid"],
    education_level: "Bachelor's Degree",
    field_of_study: "Education",
    age: 24,
    experience_description: "3 years of babysitting and 1 year as a camp counselor.",
    preferred_countries: ["China"],
    duration_months: 12,
    age_groups_worked: ["3-5 years", "6-12 years"]
  },
  {
    display_name: "Elena Rossi",
    nationality: "Italian",
    languages: ["Italian", "English", "French"],
    childcare_experience_years: 5,
    available_from: "2026-04-01",
    bio: "Passionate about childcare and cultural exchange. I have a degree in Early Childhood Education.",
    profile_status: "active",
    current_city: "Milan",
    current_country: "Italy",
    skills: ["Cooking", "Arts & Crafts", "Swimming"],
    education_level: "Master's Degree",
    field_of_study: "Early Childhood Education",
    age: 27,
    experience_description: "Worked as a kindergarten teacher for 2 years.",
    preferred_countries: ["China", "Japan"],
    duration_months: 6,
    age_groups_worked: ["0-2 years", "3-5 years"]
  },
  {
    display_name: "Hanna Müller",
    nationality: "German",
    languages: ["German", "English"],
    childcare_experience_years: 2,
    available_from: "2026-02-01",
    bio: "Gap year student looking to experience Chinese culture. I am responsible, organized, and love kids.",
    profile_status: "active",
    current_city: "Berlin",
    current_country: "Germany",
    skills: ["Tutoring", "Driving", "Music"],
    education_level: "High School",
    field_of_study: "N/A",
    age: 19,
    experience_description: "Babysitting for neighbors and younger cousins.",
    preferred_countries: ["China"],
    duration_months: 10,
    age_groups_worked: ["6-12 years"]
  }
];

const families = [
  {
    family_name: "The Wang Family",
    location_country: "China",
    location_city: "Shanghai",
    number_of_children: 2,
    languages_spoken: ["Chinese", "English"],
    start_date: "2026-02-15",
    profile_status: "active",
    expectations: "We are looking for an energetic au pair to help with our 2 boys. We want them to learn English naturally.",
    children_ages: [5, 8],
    children_personalities: ["Energetic", "Curious"],
    daily_tasks: ["School pickup", "English practice", "Playtime"],
    weekly_schedule: "Mon-Fri 3pm-8pm, Sat 10am-2pm",
    monthly_salary_offer: 4500,
    private_room: true,
    experience_required_years: 1,
    benefits: ["Gym membership", "Chinese lessons", "Travel with family"],
    housing_type: "Apartment",
    expectations_description: "We are a friendly family living in downtown Shanghai. We love travel and food."
  },
  {
    family_name: "The Li Family",
    location_country: "China",
    location_city: "Beijing",
    number_of_children: 1,
    languages_spoken: ["Chinese", "English", "French"],
    start_date: "2026-03-01",
    profile_status: "active",
    expectations: "Seeking a French-speaking au pair for our daughter.",
    children_ages: [4],
    children_personalities: ["Shy", "Creative"],
    daily_tasks: ["Teaching French", "Arts & Crafts", "Bedtime routine"],
    weekly_schedule: "Flexible, approx 25 hours/week",
    monthly_salary_offer: 5000,
    private_room: true,
    experience_required_years: 2,
    benefits: ["Private bathroom", "Language exchange"],
    housing_type: "Villa",
    expectations_description: "We live in a quiet international community in Beijing."
  }
];

async function seed() {
  console.log('🌱 Seeding Au Pair and Host Family data...');

  try {
    // 1. Create dummy users for Au Pairs
    for (const auPair of auPairs) {
      const email = `aupair.${auPair.display_name.split(' ')[0].toLowerCase()}@example.com`;
      const password = 'password123';

      console.log(`Creating user for ${auPair.display_name}...`);
      
      // Create user
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: auPair.display_name }
      });

      if (userError) {
        console.warn(`User creation failed (might exist): ${userError.message}`);
        // Try to get user if exists
        // This part is tricky without direct DB access or listUsers permission
        continue; 
      }

      if (userData?.user) {
        const userId = userData.user.id;
        
        // Insert Profile
        const { error: profileError } = await supabase
          .from('au_pair_profiles')
          .insert({
            user_id: userId,
            ...auPair
          });

        if (profileError) {
          console.error(`Failed to insert profile for ${auPair.display_name}:`, profileError.message);
        } else {
          console.log(`✅ Created profile for ${auPair.display_name}`);
        }
      }
    }

    // 2. Create dummy users for Families
    for (const family of families) {
      const email = `family.${family.family_name.split(' ')[1].toLowerCase()}@example.com`;
      const password = 'password123';

      console.log(`Creating user for ${family.family_name}...`);

      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: family.family_name }
      });

      if (userError) {
        console.warn(`User creation failed (might exist): ${userError.message}`);
        continue;
      }

      if (userData?.user) {
        const userId = userData.user.id;

        const { error: profileError } = await supabase
          .from('host_family_profiles')
          .insert({
            user_id: userId,
            ...family
          });

        if (profileError) {
          console.error(`Failed to insert profile for ${family.family_name}:`, profileError.message);
        } else {
          console.log(`✅ Created profile for ${family.family_name}`);
        }
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

seed();
