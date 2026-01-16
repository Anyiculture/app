import { supabase } from '../lib/supabase';

const STOCK_IMAGES = {
  jobs: [
    'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3182773/pexels-photo-3182773.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3183197/pexels-photo-3183197.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  marketplace: [
    'https://images.pexels.com/photos/276517/pexels-photo-276517.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/404280/pexels-photo-404280.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1682103/pexels-photo-1682103.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/210126/pexels-photo-210126.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1240892/pexels-photo-1240892.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1616403/pexels-photo-1616403.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  events: [
    'https://images.pexels.com/photos/1190297/pexels-photo-1190297.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/3321793/pexels-photo-3321793.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1709003/pexels-photo-1709003.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg?auto=compress&cs=tinysrgb&w=800'
  ],
  education: [
    'https://images.pexels.com/photos/256455/pexels-photo-256455.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/267507/pexels-photo-267507.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/301920/pexels-photo-301920.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg?auto=compress&cs=tinysrgb&w=800',
    'https://images.pexels.com/photos/207691/pexels-photo-207691.jpeg?auto=compress&cs=tinysrgb&w=800'
  ]
};

export async function seedAllData() {
  console.log('Starting to seed all data...');

  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('No user logged in. Please sign in first.');
      return false;
    }

    const userId = user.id;
    console.log('Using user ID:', userId);

    // Seed Education Resources
    console.log('Seeding education resources...');
    const educationData = [
      {
        creator_id: userId,
        title: 'Chinese Language Basics',
        description: 'Learn fundamental Chinese characters and pronunciation with native speakers',
        type: 'course',
        level: 'beginner',
        language: 'en',
        duration: '4 weeks',
        price: 0,
        status: 'active',
        thumbnail_url: STOCK_IMAGES.education[0]
      },
      {
        creator_id: userId,
        title: 'Business Chinese Workshop',
        description: 'Professional Chinese for business meetings, negotiations, and corporate communication',
        type: 'workshop',
        level: 'intermediate',
        language: 'en',
        duration: '2 days',
        price: 299,
        status: 'active',
        thumbnail_url: STOCK_IMAGES.education[1]
      },
      {
        creator_id: userId,
        title: 'HSK Preparation Course',
        description: 'Comprehensive preparation for HSK levels 4-6 with practice tests',
        type: 'course',
        level: 'advanced',
        language: 'en',
        duration: '12 weeks',
        price: 499,
        status: 'active',
        thumbnail_url: STOCK_IMAGES.education[2]
      },
      {
        creator_id: userId,
        title: 'Chinese Cooking Webinar',
        description: 'Learn to cook authentic Chinese dishes from experienced chefs',
        type: 'webinar',
        level: 'beginner',
        language: 'zh',
        duration: '1 hour',
        price: 0,
        status: 'active',
        thumbnail_url: STOCK_IMAGES.education[3]
      },
      {
        creator_id: userId,
        title: 'Chinese Calligraphy for Beginners',
        description: 'Master the art of traditional Chinese calligraphy',
        type: 'course',
        level: 'beginner',
        language: 'en',
        duration: '6 weeks',
        price: 199,
        status: 'active',
        thumbnail_url: STOCK_IMAGES.education[4]
      },
      {
        creator_id: userId,
        title: 'Tech Interview Preparation',
        description: 'Prepare for technical interviews at top Chinese tech companies',
        type: 'course',
        level: 'intermediate',
        language: 'en',
        duration: '8 weeks',
        price: 399,
        status: 'active',
        thumbnail_url: STOCK_IMAGES.education[5]
      },
    ];

    for (const edu of educationData) {
      await supabase.from('education_resources').insert(edu);
    }
    console.log('Education resources seeded!');

    // Seed Events
    console.log('Seeding events...');
    const now = new Date();
    const eventsData = [
      {
        title: 'Language Exchange Meetup',
        description: 'Practice your Chinese and English with native speakers in a friendly environment. All levels welcome!',
        event_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Sanlitun, Beijing',
        organizer_id: userId,
        status: 'published',
        image_url: STOCK_IMAGES.events[0],
        max_attendees: 50
      },
      {
        title: 'Tech Networking Event',
        description: 'Connect with tech professionals, startup founders, and developers in Beijing',
        event_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Zhongguancun, Beijing',
        organizer_id: userId,
        status: 'published',
        image_url: STOCK_IMAGES.events[1],
        max_attendees: 100
      },
      {
        title: 'Cultural Festival',
        description: 'Celebrate traditional Chinese culture with food, music, dance, and cultural performances',
        event_date: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Chaoyang Park, Beijing',
        organizer_id: userId,
        status: 'published',
        image_url: STOCK_IMAGES.events[2],
        max_attendees: 200
      },
      {
        title: 'Hiking Adventure',
        description: 'Group hike to the Great Wall with experienced guides. Transportation included.',
        event_date: new Date(now.getTime() + 21 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Mutianyu, Beijing',
        organizer_id: userId,
        status: 'published',
        image_url: STOCK_IMAGES.events[3],
        max_attendees: 30
      },
      {
        title: 'Professional Photography Workshop',
        description: 'Learn photography techniques from award-winning photographers',
        event_date: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        location: '798 Art District, Beijing',
        organizer_id: userId,
        status: 'published',
        image_url: STOCK_IMAGES.events[4],
        max_attendees: 25
      },
      {
        title: 'Startup Pitch Night',
        description: 'Watch entrepreneurs pitch their ideas and network with investors',
        event_date: new Date(now.getTime() + 18 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Beijing Startup Hub',
        organizer_id: userId,
        status: 'published',
        image_url: STOCK_IMAGES.events[5],
        max_attendees: 80
      },
    ];

    for (const event of eventsData) {
      await supabase.from('events').insert(event);
    }
    console.log('Events seeded!');

    // Seed Marketplace Listings
    console.log('Seeding marketplace listings...');
    const marketplaceData = [
      {
        user_id: userId,
        title: 'IKEA Desk - Like New',
        category: 'furniture',
        location_city: 'Beijing',
        price: 800,
        currency: 'CNY',
        condition: 'like_new',
        description: 'Barely used IKEA desk, perfect for home office. Moving sale! Great condition.',
        status: 'active',
        images: [STOCK_IMAGES.marketplace[0]]
      },
      {
        user_id: userId,
        title: 'iPhone 13 Pro',
        category: 'electronics',
        location_city: 'Shanghai',
        price: 4500,
        currency: 'CNY',
        condition: 'good',
        description: '256GB, battery health 89%, comes with original box and accessories',
        status: 'active',
        images: [STOCK_IMAGES.marketplace[1]]
      },
      {
        user_id: userId,
        title: 'Mountain Bike',
        category: 'sports',
        location_city: 'Beijing',
        price: 1200,
        currency: 'CNY',
        condition: 'used',
        description: 'Great condition, perfect for weekend rides. Recently serviced.',
        status: 'active',
        images: [STOCK_IMAGES.marketplace[2]]
      },
      {
        user_id: userId,
        title: 'Rice Cooker',
        category: 'home',
        location_city: 'Shenzhen',
        price: 200,
        currency: 'CNY',
        condition: 'like_new',
        description: 'Xiaomi smart rice cooker, barely used. App-controlled.',
        status: 'active',
        images: [STOCK_IMAGES.marketplace[3]]
      },
      {
        user_id: userId,
        title: 'English Textbooks Set',
        category: 'books',
        location_city: 'Guangzhou',
        price: 150,
        currency: 'CNY',
        condition: 'good',
        description: 'Complete set of Cambridge English textbooks for all levels',
        status: 'active',
        images: [STOCK_IMAGES.marketplace[4]]
      },
      {
        user_id: userId,
        title: 'Air Purifier',
        category: 'home',
        location_city: 'Beijing',
        price: 600,
        currency: 'CNY',
        condition: 'good',
        description: 'Xiaomi air purifier, works perfectly. Filter recently replaced.',
        status: 'active',
        images: [STOCK_IMAGES.marketplace[5]]
      },
    ];

    for (const item of marketplaceData) {
      await supabase.from('marketplace_items').insert(item);
    }
    console.log('Marketplace listings seeded!');

    // Seed Community Posts
    console.log('Seeding community posts...');
    const communityData = [
      {
        author_id: userId,
        content: 'Just moved to Beijing! Any recommendations for good cafes with WiFi where I can work remotely? Looking for places in Chaoyang district.',
        category: 'recommendations',
        likes_count: 5,
        comments_count: 3,
      },
      {
        author_id: userId,
        content: 'Looking for language exchange partners to practice Chinese. I can help with English! Intermediate level, prefer meeting in person.',
        category: 'language',
        likes_count: 12,
        comments_count: 8,
      },
      {
        author_id: userId,
        content: 'Anyone interested in forming a weekend hiking group? Planning to explore mountains around Beijing. All fitness levels welcome!',
        category: 'activities',
        likes_count: 18,
        comments_count: 15,
      },
      {
        author_id: userId,
        content: 'What are the best apps for ordering food delivery in China? New here and need recommendations. Also, which one has English interface?',
        category: 'tips',
        likes_count: 7,
        comments_count: 11,
      },
      {
        author_id: userId,
        content: 'Successfully renewed my visa today! Happy to share my experience if anyone needs help with the process.',
        category: 'visa',
        likes_count: 24,
        comments_count: 6,
      },
      {
        author_id: userId,
        content: 'Found an amazing vegetarian restaurant in Sanlitun. Highly recommend "Green Leaf"! Great atmosphere and reasonable prices.',
        category: 'food',
        likes_count: 9,
        comments_count: 4,
      },
    ];

    for (const post of communityData) {
      await supabase.from('community_posts').insert(post);
    }
    console.log('Community posts seeded!');

    // Seed Messages
    console.log('Seeding messages...');
    const conversationsData = [
      {
        user1_id: userId,
        user2_id: userId,
        last_message: 'Hey! Are you still selling the desk?',
        last_message_at: new Date().toISOString()
      }
    ];

    for (const conv of conversationsData) {
      const { data: conversation } = await supabase
        .from('conversations')
        .insert(conv)
        .select()
        .single();

      if (conversation) {
        const messagesData = [
          {
            conversation_id: conversation.id,
            sender_id: userId,
            content: 'Hey! Are you still selling the desk?',
            created_at: new Date(Date.now() - 3600000).toISOString()
          },
          {
            conversation_id: conversation.id,
            sender_id: userId,
            content: 'Yes, it is still available! Would you like to come see it?',
            created_at: new Date(Date.now() - 1800000).toISOString()
          },
          {
            conversation_id: conversation.id,
            sender_id: userId,
            content: 'Perfect! What time works for you this weekend?',
            created_at: new Date(Date.now() - 900000).toISOString()
          }
        ];

        for (const msg of messagesData) {
          await supabase.from('messages').insert(msg);
        }
      }
    }
    console.log('Messages seeded!');

    console.log('✅ All data seeded successfully!');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
}
