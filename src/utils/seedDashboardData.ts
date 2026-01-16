import { supabase } from '../lib/supabase';
import { seedDummyJobs } from './seedJobs';

export async function seedDashboardData() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.log('User not logged in, cannot seed data');
      return;
    }

    await seedDummyJobs(user.id);
    await seedMarketplace();
    await seedEvents();
    await seedEducation();
    await seedCommunity();
    console.log('Dashboard data seeded successfully');
  } catch (error) {
    console.error('Failed to seed dashboard data:', error);
  }
}

async function seedMarketplace() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('User not logged in, skipping marketplace seed');
    return;
  }

  const dummyItems = [
    {
      user_id: user.id,
      title: 'IKEA Desk - Like New',
      description: 'Barely used IKEA desk, perfect condition',
      price: 500,
      currency: 'CNY',
      category: 'furniture',
      condition: 'like_new',
      location_city: 'Beijing',
      status: 'active'
    },
    {
      user_id: user.id,
      title: 'iPhone 13 Pro',
      description: '128GB, Space Gray, excellent condition',
      price: 4500,
      currency: 'CNY',
      category: 'electronics',
      condition: 'excellent',
      location_city: 'Shanghai',
      status: 'active'
    },
    {
      user_id: user.id,
      title: 'Bicycle - Mountain Bike',
      description: '21-speed mountain bike, great for city riding',
      price: 800,
      currency: 'CNY',
      category: 'sports',
      condition: 'good',
      location_city: 'Shenzhen',
      status: 'active'
    },
    {
      user_id: user.id,
      title: 'Winter Coat - North Face',
      description: 'Size M, worn once, original price ¥2000',
      price: 1200,
      currency: 'CNY',
      category: 'clothing',
      condition: 'like_new',
      location_city: 'Beijing',
      status: 'active'
    },
    {
      user_id: user.id,
      title: 'Coffee Machine - Nespresso',
      description: 'Includes 20 capsules, works perfectly',
      price: 600,
      currency: 'CNY',
      category: 'home',
      condition: 'good',
      location_city: 'Guangzhou',
      status: 'active'
    },
    {
      user_id: user.id,
      title: 'Textbooks - Business Management',
      description: 'Complete set for MBA program',
      price: 300,
      currency: 'CNY',
      category: 'books',
      condition: 'good',
      location_city: 'Chengdu',
      status: 'active'
    }
  ];

  for (const item of dummyItems) {
    const { error } = await supabase
      .from('marketplace_items')
      .insert(item);

    if (error && error.code !== '23505') {
      console.error('Error seeding marketplace item:', error);
    }
  }
}

async function seedEvents() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('User not logged in, skipping events seed');
    return;
  }

  const today = new Date();
  const dummyEvents = [
    {
      organizer_id: user.id,
      title: 'International Food Festival',
      description: 'Experience cuisines from around the world',
      event_date: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Beijing Olympic Park',
      status: 'published'
    },
    {
      organizer_id: user.id,
      title: 'Chinese Language Exchange',
      description: 'Practice Chinese with native speakers',
      event_date: new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Shanghai Library',
      status: 'published'
    },
    {
      organizer_id: user.id,
      title: 'Tech Networking Mixer',
      description: 'Connect with professionals in tech industry',
      event_date: new Date(today.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Shenzhen Tech Hub',
      status: 'published'
    },
    {
      organizer_id: user.id,
      title: 'Hiking Trip to Great Wall',
      description: 'Full day hiking adventure',
      event_date: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Mutianyu Great Wall',
      status: 'published'
    },
    {
      organizer_id: user.id,
      title: 'Photography Workshop',
      description: 'Learn professional photography techniques',
      event_date: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Guangzhou Art Center',
      status: 'published'
    },
    {
      organizer_id: user.id,
      title: 'Board Games Night',
      description: 'Play board games and meet new friends',
      event_date: new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: 'Chengdu Community Center',
      status: 'published'
    }
  ];

  for (const event of dummyEvents) {
    const { error } = await supabase
      .from('events')
      .insert(event);

    if (error && error.code !== '23505') {
      console.error('Error seeding event:', error);
    }
  }
}

async function seedEducation() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('User not logged in, skipping education seed');
    return;
  }

  const dummyCourses = [
    {
      creator_id: user.id,
      title: 'Mandarin Chinese for Beginners',
      description: 'Start your Chinese language journey',
      type: 'course',
      level: 'beginner',
      language: 'en',
      duration: '12 weeks',
      price: 0,
      status: 'active'
    },
    {
      creator_id: user.id,
      title: 'Chinese Business Culture',
      description: 'Understanding business practices in China',
      type: 'course',
      level: 'intermediate',
      language: 'en',
      duration: '8 weeks',
      price: 0,
      status: 'active'
    },
    {
      creator_id: user.id,
      title: 'Introduction to Calligraphy',
      description: 'Learn the art of Chinese calligraphy',
      type: 'workshop',
      level: 'beginner',
      language: 'en',
      duration: '10 weeks',
      price: 0,
      status: 'active'
    },
    {
      creator_id: user.id,
      title: 'Chinese Cooking Essentials',
      description: 'Master classic Chinese dishes',
      type: 'workshop',
      level: 'beginner',
      language: 'en',
      duration: '6 weeks',
      price: 0,
      status: 'active'
    },
    {
      creator_id: user.id,
      title: 'HSK Preparation Course',
      description: 'Prepare for Chinese proficiency test',
      type: 'course',
      level: 'intermediate',
      language: 'en',
      duration: '16 weeks',
      price: 0,
      status: 'active'
    },
    {
      creator_id: user.id,
      title: 'Traditional Chinese Medicine Basics',
      description: 'Introduction to TCM principles',
      type: 'course',
      level: 'beginner',
      language: 'en',
      duration: '8 weeks',
      price: 0,
      status: 'active'
    }
  ];

  for (const course of dummyCourses) {
    const { error } = await supabase
      .from('education_resources')
      .insert(course);

    if (error && error.code !== '23505') {
      console.error('Error seeding course:', error);
    }
  }
}

async function seedCommunity() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.log('User not logged in, skipping community seed');
    return;
  }

  const dummyPosts = [
    {
      author_id: user.id,
      content: 'Best restaurants in Beijing for vegetarians? Looking for recommendations for vegetarian-friendly restaurants',
      category: 'food'
    },
    {
      author_id: user.id,
      content: 'Tips for finding apartment in Shanghai - Moving to Shanghai next month, any advice on finding good apartments?',
      category: 'housing'
    },
    {
      author_id: user.id,
      content: 'Language exchange partner wanted - Native English speaker looking for Chinese language exchange partner',
      category: 'language'
    },
    {
      author_id: user.id,
      content: 'Weekend trip recommendations near Shenzhen - What are some good weekend getaway destinations from Shenzhen?',
      category: 'travel'
    },
    {
      author_id: user.id,
      content: 'How to get work visa in China? Need guidance on work visa application process',
      category: 'visa'
    },
    {
      author_id: user.id,
      content: 'Best gyms in Guangzhou? Looking for recommendations for gyms with English-speaking trainers',
      category: 'fitness'
    }
  ];

  for (const post of dummyPosts) {
    const { error } = await supabase
      .from('community_posts')
      .insert(post);

    if (error && error.code !== '23505') {
      console.error('Error seeding community post:', error);
    }
  }
}
