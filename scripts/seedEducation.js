import { createClient } from '@supabase/supabase-js';

// Load from environment
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // Service role for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const educationPrograms = [
  {
    title: 'MBA in International Business',
    institution: 'Fudan University',
    program_type: 'masters',
    location: 'Shanghai, China',
    description: 'Top-ranked MBA program focusing on global business strategies and cross-cultural management. Students gain practical experience through internships with Fortune 500 companies.',
    image_url: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=800&q=80',
    duration: '2 years',
    tuition_rmb: 280000,
    status: 'published',
  },
  {
    title: 'Chinese Language & Culture Program',
    institution: 'Beijing Language and Culture University',
    program_type: 'certificate',
    location: 'Beijing, China',
    description: 'Intensive Mandarin language program with cultural immersion. Includes homestay options and cultural excursions to historical sites.',
    image_url: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?auto=format&fit=crop&w=800&q=80',
    duration: '1 semester',
    tuition_rmb: 25000,
    status: 'published',
  },
  {
    title: 'Computer Science Bachelor Scholarship',
    institution: 'Tsinghua University',
    program_type: 'scholarship',
    location: 'Beijing, China',
    description: 'Full scholarship for international students pursuing undergraduate degrees in Computer Science. Covers tuition, accommodation, and monthly stipend.',
    image_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=800&q=80',
    duration: '4 years',
    tuition_rmb: 0,
    status: 'published',
  },
  {
    title: 'Executive MBA Program',
    institution: 'Shanghai Jiao Tong University',
    program_type: 'masters',
    location: 'Shanghai, China',
    description: 'Part-time EMBA program designed for working professionals. Weekend classes with industry leaders and networking opportunities.',
    image_url: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=800&q=80',
    duration: '18 months',
    tuition_rmb: 420000,
    status: 'published',
  },
  {
    title: 'Data Science & AI Bootcamp',
    institution: 'Tech Academy Shanghai',
    program_type: 'certificate',
    location: 'Shanghai, China',
    description: 'Intensive 12-week bootcamp covering Python, machine learning, and AI applications. Job placement assistance included.',
    image_url: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80',
    duration: '12 weeks',
    tuition_rmb: 48000,
    status: 'published',
  },
  {
    title: 'International Relations Master Program',
    institution: 'Peking University',
    program_type: 'masters',
    location: 'Beijing, China',
    description: 'Graduate program in international relations with focus on China-Global relations. Taught in English with guest lectures from diplomats.',
    image_url: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=800&q=80',
    duration: '2 years',
    tuition_rmb: 180000,
    status: 'published',
  },
];

async function seedEducation() {
  console.log('🌱 Seeding education_resources...');
  
  const { data, error } = await supabase
    .from('education_resources')
    .insert(educationPrograms)
    .select();

  if (error) {
    console.error('❌ Error seeding education:', error.message);
  } else {
    console.log(`✅ Successfully seeded ${data.length} education programs`);
  }
}

seedEducation();
