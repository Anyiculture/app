import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const communityPosts = [
  {
    title: 'Best neighborhoods for expats in Shanghai?',
    category: 'Living in China',
    content: 'Moving to Shanghai next month and looking for recommendations on expat-friendly neighborhoods. Considering Jing\'an, Xujiahui, or Hongqiao. What are your experiences?',
    author_id: null, // Will need to be set to a real user ID or handled via trigger
    reply_count: 15,
    view_count: 234,
    status: 'published',
  },
  {
    title: 'How to open a Chinese bank account as a foreigner',
    category: 'Finance',
    content: 'Step-by-step guide based on my recent experience opening an account at ICBC. Here\'s what documents you\'ll need...',
    author_id: null,
    reply_count: 8,
    view_count: 156,
    status: 'published',
  },
  {
    title: 'Looking for language exchange partners',
    category: 'Language Learning',
    content: 'Native English speaker (American) looking for Mandarin language exchange partners in Beijing. Happy to help with English conversation!',
    author_id: null,
    reply_count: 23,
    view_count: 189,
    status: 'published',
  },
  {
    title: 'VPN recommendations for 2024',
    category: 'Technology',
    content: 'Which VPNs are currently working reliably in China? Looking for fast speeds for video calls and streaming.',
    author_id: null,
    reply_count: 42,
    view_count: 567,
    status: 'published',
  },
  {
    title: 'Weekend trip ideas from Shanghai',
    category: 'Travel',
    content: 'Looking for weekend getaway suggestions within 2-3 hours of Shanghai. Already been to Hangzhou and Suzhou. What else is worth visiting?',
    author_id: null,
    reply_count: 19,
    view_count: 298,
    status: 'published',
  },
  {
    title: 'Networking events for tech professionals',
    category: 'Networking',
    content: 'Are there regular meetups or networking events for people working in tech/startups in Shanghai? Would love to connect with the community.',
    author_id: null,
    reply_count: 12,
    view_count: 145,
    status: 'published',
  },
];

async function seedCommunity() {
  console.log('🌱 Seeding community_posts...');
  
  // Note: author_id will need to be set or handled via database trigger
  const { data, error } = await supabase
    .from('community_posts')
    .insert(communityPosts)
    .select();

  if (error) {
    console.error('❌ Error seeding community:', error.message);
  } else {
    console.log(`✅ Successfully seeded ${data.length} community posts`);
  }
}

seedCommunity();
