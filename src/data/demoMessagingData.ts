import { Conversation, Message } from '../services/messagingService';

export interface DemoConversation extends Omit<Conversation, 'id'> {
  id: string;
}

export interface DemoMessage extends Omit<Message, 'id' | 'conversation_id'> {
  id: string;
  conversation_id: string;
  attachment?: {
    type: 'image' | 'file' | 'link' | 'meeting';
    url?: string;
    filename?: string;
    title?: string;
    domain?: string;
    meetingDetails?: {
      date: string;
      time: string;
      location: string;
      notes: string;
    };
  };
  edited?: boolean;
}

const CURRENT_USER_ID = 'demo-user-id';

export const demoConversations: DemoConversation[] = [
  {
    id: 'conv-1',
    context_type: 'aupair',
    context_id: 'aupair-1',
    related_item_title: 'Au Pair Position',
    is_blocked: false,
    blocked_by: null,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    last_message_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    other_user: {
      id: 'user-liwei',
      email: 'liwei@example.com',
      full_name: 'Li Wei (Au Pair)'
    },
    last_message: {
      content: "I'm very interested in this position! I have 3 years of childcare experience.",
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      sender_id: 'user-liwei',
      message_type: 'user'
    },
    unread_count: 2
  },
  {
    id: 'conv-2',
    context_type: 'aupair',
    context_id: 'aupair-2',
    related_item_title: 'Host Family',
    is_blocked: false,
    blocked_by: null,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    last_message_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    other_user: {
      id: 'user-chitra',
      email: 'chitra.family@example.com',
      full_name: 'Chitra Family (Host Family)'
    },
    last_message: {
      content: 'Thanks for your application. Could we schedule a video call?',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      sender_id: 'user-chitra',
      message_type: 'user'
    },
    unread_count: 1
  },
  {
    id: 'conv-3',
    context_type: 'job',
    context_id: 'job-123',
    related_item_title: 'Bilingual Teacher Position',
    is_blocked: false,
    blocked_by: null,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    last_message_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    other_user: {
      id: 'user-hr-school',
      email: 'hr@shanghaibilingual.com',
      full_name: 'Shanghai Bilingual School HR'
    },
    last_message: {
      content: 'We would like to invite you for an interview next week.',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      sender_id: 'user-hr-school',
      message_type: 'user'
    },
    unread_count: 0
  },
  {
    id: 'conv-4',
    context_type: 'visa',
    context_id: 'visa-1',
    related_item_title: 'Work Visa Application',
    is_blocked: false,
    blocked_by: null,
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    last_message_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    other_user: {
      id: 'user-visa-admin',
      email: 'admin@visacenter.com',
      full_name: 'Visa Center Admin'
    },
    last_message: {
      content: 'Your documents have been received. Processing time is 2-3 weeks.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sender_id: 'user-visa-admin',
      message_type: 'system'
    },
    unread_count: 0
  },
  {
    id: 'conv-5',
    context_type: 'event',
    context_id: 'event-1',
    related_item_title: 'Pudong Expat Meetup',
    is_blocked: false,
    blocked_by: null,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    last_message_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    other_user: {
      id: 'user-event-organizer',
      email: 'events@pudongmeetup.com',
      full_name: 'Event Organizer: Pudong Meetup'
    },
    last_message: {
      content: 'Looking forward to seeing you at the event!',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      sender_id: 'user-event-organizer',
      message_type: 'user'
    },
    unread_count: 0
  }
];

export const demoMessages: Record<string, DemoMessage[]> = {
  'conv-1': [
    {
      id: 'msg-1-1',
      conversation_id: 'conv-1',
      sender_id: CURRENT_USER_ID,
      content: 'Hello! I saw your au pair profile and I think you would be a great fit for our family.',
      message_type: 'user',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-1-2',
      conversation_id: 'conv-1',
      sender_id: 'user-liwei',
      content: "Thank you so much! I'm very excited about this opportunity.",
      message_type: 'user',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-1-3',
      conversation_id: 'conv-1',
      sender_id: CURRENT_USER_ID,
      content: 'Could you tell me more about your experience with toddlers?',
      message_type: 'user',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-1-4',
      conversation_id: 'conv-1',
      sender_id: 'user-liwei',
      content: "I worked with twin 3-year-olds for 2 years. Here are some photos from activities we did together:",
      message_type: 'user',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      attachment: {
        type: 'image',
        url: 'https://images.pexels.com/photos/8613089/pexels-photo-8613089.jpeg?auto=compress&cs=tinysrgb&w=400',
        filename: 'activities.jpg'
      }
    },
    {
      id: 'msg-1-5',
      conversation_id: 'conv-1',
      sender_id: CURRENT_USER_ID,
      content: 'That looks wonderful! Could you share your resume?',
      message_type: 'user',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-1-6',
      conversation_id: 'conv-1',
      sender_id: 'user-liwei',
      content: 'Of course! Here is my complete resume with references.',
      message_type: 'user',
      created_at: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
      read: true,
      attachment: {
        type: 'file',
        url: '#',
        filename: 'LiWei_Resume_2024.pdf'
      }
    },
    {
      id: 'msg-1-7',
      conversation_id: 'conv-1',
      sender_id: CURRENT_USER_ID,
      content: 'Thank you! I found this helpful article about au pair integration: https://aupairguide.com/successful-placement',
      message_type: 'user',
      created_at: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
      read: true,
      attachment: {
        type: 'link',
        url: 'https://aupairguide.com/successful-placement',
        title: 'Tips for Successful Au Pair Placement',
        domain: 'aupairguide.com'
      }
    },
    {
      id: 'msg-1-8',
      conversation_id: 'conv-1',
      sender_id: 'user-liwei',
      content: "I'm very interested in this position! I have 3 years of childcare experience.",
      message_type: 'user',
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      read: false
    }
  ],
  'conv-2': [
    {
      id: 'msg-2-1',
      conversation_id: 'conv-2',
      sender_id: 'user-chitra',
      content: 'Hello! We received your application. Your profile looks great!',
      message_type: 'user',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-2-2',
      conversation_id: 'conv-2',
      sender_id: CURRENT_USER_ID,
      content: 'Thank you! I would love to learn more about your family.',
      message_type: 'user',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-2-3',
      conversation_id: 'conv-2',
      sender_id: 'user-chitra',
      content: 'We have two children, ages 5 and 7. We live in Pudong, Shanghai.',
      message_type: 'user',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-2-4',
      conversation_id: 'conv-2',
      sender_id: 'user-chitra',
      content: "Let's schedule a video call to discuss further details.",
      message_type: 'user',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      attachment: {
        type: 'meeting',
        meetingDetails: {
          date: '2024-02-15',
          time: '14:00',
          location: 'Zoom Call',
          notes: 'Initial interview to discuss expectations and answer questions'
        }
      }
    },
    {
      id: 'msg-2-5',
      conversation_id: 'conv-2',
      sender_id: 'user-chitra',
      content: 'Thanks for your application. Could we schedule a video call?',
      message_type: 'user',
      created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    }
  ],
  'conv-3': [
    {
      id: 'msg-3-1',
      conversation_id: 'conv-3',
      sender_id: CURRENT_USER_ID,
      content: 'I am interested in the Bilingual Teacher position at your school.',
      message_type: 'user',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-3-2',
      conversation_id: 'conv-3',
      sender_id: 'user-hr-school',
      content: 'Thank you for your interest! Could you send your teaching credentials?',
      message_type: 'user',
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-3-3',
      conversation_id: 'conv-3',
      sender_id: CURRENT_USER_ID,
      content: 'Certainly! Here are my teaching certificates and experience letters.',
      message_type: 'user',
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      read: true,
      attachment: {
        type: 'file',
        url: '#',
        filename: 'Teaching_Credentials.pdf'
      }
    },
    {
      id: 'msg-3-4',
      conversation_id: 'conv-3',
      sender_id: 'user-hr-school',
      content: 'We would like to invite you for an interview next week.',
      message_type: 'user',
      created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ],
  'conv-4': [
    {
      id: 'msg-4-1',
      conversation_id: 'conv-4',
      sender_id: CURRENT_USER_ID,
      content: 'I would like to apply for a work visa. What documents do I need?',
      message_type: 'user',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-4-2',
      conversation_id: 'conv-4',
      sender_id: 'user-visa-admin',
      content: 'Work Visa Application Started',
      message_type: 'system',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-4-3',
      conversation_id: 'conv-4',
      sender_id: 'user-visa-admin',
      content: 'Please submit: passport copy, employment contract, health certificate, and police clearance.',
      message_type: 'user',
      created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-4-4',
      conversation_id: 'conv-4',
      sender_id: CURRENT_USER_ID,
      content: 'All documents submitted. Please find them attached.',
      message_type: 'user',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-4-5',
      conversation_id: 'conv-4',
      sender_id: 'user-visa-admin',
      content: 'Your documents have been received. Processing time is 2-3 weeks.',
      message_type: 'system',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ],
  'conv-5': [
    {
      id: 'msg-5-1',
      conversation_id: 'conv-5',
      sender_id: CURRENT_USER_ID,
      content: 'Hi! I would like to join the Pudong meetup next weekend.',
      message_type: 'user',
      created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-5-2',
      conversation_id: 'conv-5',
      sender_id: 'user-event-organizer',
      content: "Great! You're registered. Here are the event details:",
      message_type: 'user',
      created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    },
    {
      id: 'msg-5-3',
      conversation_id: 'conv-5',
      sender_id: 'user-event-organizer',
      content: 'Event: Pudong Expat Meetup - Saturday 2PM at Century Park',
      message_type: 'user',
      created_at: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      read: true,
      attachment: {
        type: 'meeting',
        meetingDetails: {
          date: '2024-02-10',
          time: '14:00',
          location: 'Century Park, Pudong',
          notes: 'Bring your friends! Food and drinks provided.'
        }
      }
    },
    {
      id: 'msg-5-4',
      conversation_id: 'conv-5',
      sender_id: 'user-event-organizer',
      content: 'Looking forward to seeing you at the event!',
      message_type: 'user',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: true
    }
  ]
};

export function getDemoConversations(): DemoConversation[] {
  return demoConversations;
}

export function getDemoMessages(conversationId: string): DemoMessage[] {
  return demoMessages[conversationId] || [];
}

export function getCurrentUserId(): string {
  return CURRENT_USER_ID;
}
