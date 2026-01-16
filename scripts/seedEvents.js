import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables. Ensure VITE_SUPABASE_URL and SUPABASE_SERVICE_KEY are set.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper to get future dates
const getFutureDate = (daysFromNow) => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

const events = [
  {
    title: 'Shanghai Tech Meetup: AI & Machine Learning',
    date: getFutureDate(7),
    location: 'WeWork Xintiandi, Shanghai',
    category: 'Technology',
    description: 'Monthly meetup for tech professionals interested in AI and ML. Networking, presentations, and discussions about the latest trends.',
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
    attendee_count: 45,
    max_attendees: 80,
    status: 'published',
  },
  {
    title: 'Chinese New Year Cultural Celebration',
    date: getFutureDate(14),
    location: 'Yu Garden, Shanghai',
    category: 'Culture',
    description: 'Join us for a traditional Chinese New Year celebration with lion dances, calligraphy workshops, and authentic cuisine.',
    image_url: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=80',
    attendee_count: 120,
    max_attendees: 200,
    status: 'published',
  },
  {
    title: 'Startup Pitch Night Beijing',
    date: getFutureDate(21),
    location: 'Zhongguancun Innovation Hub, Beijing',
    category: 'Business',
    description: 'Startups pitch to investors and industry experts. Great networking opportunity for entrepreneurs and investors.',
    image_url: 'https://images.unsplash.com/photo-1475721027767-4d06cdddf43d?auto=format&fit=crop&w=800&q=80',
    attendee_count: 67,
    max_attendees: 100,
    status: 'published',
  },
  {
    title: 'Expat Hiking Trip: Great Wall Adventure',
    date: getFutureDate(28),
    location: 'Mutianyu Great Wall, Beijing',
    category: 'Outdoor',
    description: 'Day trip hiking the less-crowded sections of the Great Wall. Transportation and lunch included.',
    image_url: 'https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=800&q=80',
    attendee_count: 32,
    max_attendees: 40,
    status: 'published',
  },
  {
    title: 'International Food Festival',
    date: getFutureDate(35),
    location: 'Century Park, Shanghai',
    category: 'Food & Drink',
    description: 'Taste cuisines from around the world prepared by expat chefs and local restaurants. Live music and cultural performances.',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80',
    attendee_count: 203,
    max_attendees: 500,
    status: 'published',
  },
  {
    title: 'Professional Women\'s Network Brunch',
    date: getFutureDate(42),
    location: 'The Westin Bund Center, Shanghai',
    category: 'Networking',
    description: 'Monthly brunch for professional women working in China. Guest speaker on career development in international markets.',
    image_url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
    attendee_count: 28,
    max_attendees: 50,
    status: 'published',
  },
];

async function seedEvents() {
  console.log('🌱 Seeding events...');
  
  const { data, error } = await supabase
    .from('events')
    .insert(events)
    .select();

  if (error) {
    console.error('❌ Error seeding events:', error.message);
  } else {
    console.log(`✅ Successfully seeded ${data.length} events`);
  }
}

seedEvents();
