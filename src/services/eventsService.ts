import { supabase } from '../lib/supabase';
import { translationService } from './translationService';

export interface EventCategory {
  id: string;
  name_en: string;
  name_zh: string;
  icon: string;
  color: string;
  order_index: number;
}

export interface Event {
  id: string;
  organizer_id: string;
  title: string;
  title_zh: string | null;
  description: string;
  description_zh: string | null;
  category: string | null;
  event_type: string | null;
  start_date: string | null;
  end_date: string | null;
  timezone: string | null;
  location_city: string | null;
  location_address: string | null;
  location_venue: string | null;
  online_link: string | null;
  image_urls: string[];
  capacity: number | null;
  registration_deadline: string | null;
  price: number | null;
  currency: string | null;
  status: string;
  is_featured: boolean | null;
  tags: string[] | null;
  requirements: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  external_link: string | null;
  views_count: number | null;
  attendee_count: number | null;
  created_at: string;
  updated_at: string;
  organizer?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
      phone: string | null;
    } | null;
  };
  is_registered?: boolean;
  registration_status?: string | null;
  is_favorited?: boolean;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_id: string;
  status: string;
  attendee_name: string;
  attendee_email: string;
  attendee_phone: string | null;
  additional_guests: number;
  dietary_restrictions: string | null;
  special_requirements: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  registered_at?: string;
  user?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export interface EventComment {
  id: string;
  event_id: string;
  user_id: string;
  comment: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export interface EventReview {
  id: string;
  event_id: string;
  user_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  user?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export interface EventUpdate {
  id: string;
  event_id: string;
  title: string;
  message: string;
  created_at: string;
}

export interface CreateEventData {
  title: string;
  title_zh?: string;
  description: string;
  description_zh?: string;
  category: string;
  event_type: 'in_person' | 'online' | 'hybrid';
  start_date: string;
  end_date?: string;
  timezone?: string;
  location_city?: string;
  location_address?: string;
  location_venue?: string;
  online_link?: string;
  image_urls?: string[];
  capacity?: number;
  registration_deadline?: string;
  price?: number;
  tags?: string[];
  requirements?: string;
  contact_email?: string;
  contact_phone?: string;
  external_link?: string;
}

export interface UpdateEventData {
  title?: string;
  title_zh?: string;
  description?: string;
  description_zh?: string;
  category?: string;
  event_type?: string;
  start_date?: string;
  end_date?: string;
  timezone?: string;
  location_city?: string;
  location_address?: string;
  location_venue?: string;
  online_link?: string;
  image_urls?: string[];
  capacity?: number;
  registration_deadline?: string;
  price?: number;
  status?: string;
  tags?: string[];
  requirements?: string;
  contact_email?: string;
  contact_phone?: string;
  external_link?: string;
  is_featured?: boolean;
}

export interface EventFilters {
  category?: string;
  event_type?: string;
  city?: string;
  start_date?: string;
  end_date?: string;
  price_max?: number;
  search?: string;
  tags?: string[];
  status?: string;
}

export interface RegisterForEventData {
  attendee_name: string;
  attendee_email: string;
  attendee_phone?: string;
  additional_guests?: number;
  dietary_restrictions?: string;
  special_requirements?: string;
}

export const eventsService = {
  async getCategories(): Promise<EventCategory[]> {
    const { data, error } = await supabase
      .from('event_categories')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getEvents(filters?: EventFilters): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true });

    if (filters?.status) {
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
    } else {
      query = query.eq('status', 'published');
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.event_type && filters.event_type !== 'all') {
      query = query.eq('event_type', filters.event_type);
    }

    if (filters?.city && filters.city !== 'all') {
      query = query.eq('location_city', filters.city);
    }

    if (filters?.start_date) {
      query = query.gte('start_date', filters.start_date);
    }

    if (filters?.end_date) {
      query = query.lte('start_date', filters.end_date);
    }

    if (filters?.price_max !== undefined) {
      query = query.lte('price', filters.price_max);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,title_zh.ilike.%${filters.search}%,description_zh.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (user && data) {
      const eventIds = data.map((event: any) => event.id);

      const [{ data: registrations }, { data: favorites }] = await Promise.all([
        supabase
          .from('event_registrations')
          .select('event_id, status')
          .eq('user_id', user.id)
          .in('event_id', eventIds),
        supabase
          .from('event_favorites')
          .select('event_id')
          .eq('user_id', user.id)
          .in('event_id', eventIds)
      ]);

      const registrationMap = new Map(registrations?.map((r: any) => [r.event_id, r.status]) || []);
      const favoritedIds = new Set(favorites?.map((f: any) => f.event_id) || []);

      return data.map((event: any) => ({
        ...event,
        is_registered: registrationMap.has(event.id),
        registration_status: registrationMap.get(event.id) || null,
        is_favorited: favoritedIds.has(event.id)
      }));
    }

    return data || [];
  },

  async getMyEvents(userId: string): Promise<Event[]> {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getEventById(id: string): Promise<Event | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (user) {
      const [{ data: registration }, { data: favorite }] = await Promise.all([
        supabase
          .from('event_registrations')
          .select('status')
          .eq('user_id', user.id)
          .eq('event_id', id)
          .maybeSingle(),
        supabase
          .from('event_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('event_id', id)
          .maybeSingle()
      ]);

      return {
        ...data,
        is_registered: !!registration,
        registration_status: registration?.status || null,
        is_favorited: !!favorite
      };
    }

    return data;
  },

  async createEvent(eventData: CreateEventData): Promise<Event> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const finalData = { ...eventData };

    // Handle Title Translation
    if (!finalData.title_zh) {
      if (translationService.hasChinese(finalData.title)) {
        finalData.title_zh = finalData.title;
        finalData.title = await translationService.translateText(finalData.title, 'en');
      } else {
        finalData.title_zh = await translationService.translateText(finalData.title, 'zh');
      }
    }

    // Handle Description Translation
    if (!finalData.description_zh) {
      if (translationService.hasChinese(finalData.description)) {
        finalData.description_zh = finalData.description;
        finalData.description = await translationService.translateText(finalData.description, 'en');
      } else {
        finalData.description_zh = await translationService.translateText(finalData.description, 'zh');
      }
    }

    const { data, error } = await supabase
      .from('events')
      .insert({
        ...finalData,
        organizer_id: user.id,
        status: 'published',
        currency: 'CAD',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateEvent(id: string, updates: UpdateEventData): Promise<Event> {
    const { data, error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async cancelEvent(id: string): Promise<void> {
    const { error } = await supabase
      .from('events')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (error) throw error;
  },

  async registerForEvent(eventId: string, data: RegisterForEventData): Promise<EventRegistration> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: registration, error } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        user_id: user.id,
        status: 'going',
        ...data,
      })
      .select()
      .single();

    if (error) throw error;
    return registration;
  },

  async unregisterFromEvent(eventId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('event_registrations')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async updateRegistration(eventId: string, status: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('event_registrations')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async cancelRegistration(eventId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('event_registrations')
      .update({
        status: 'not_going',
        cancelled_at: new Date().toISOString()
      })
      .eq('event_id', eventId)
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async getEventAttendees(eventId: string): Promise<EventRegistration[]> {
    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'going')
      .order('created_at');

    if (error) throw error;
    return data || [];
  },

  async toggleFavorite(eventId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('event_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('event_id', eventId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('event_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('event_favorites')
        .insert({
          user_id: user.id,
          event_id: eventId,
        });

      if (error) throw error;
      return true;
    }
  },

  async getFavorites(): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: favorites, error } = await supabase
      .from('event_favorites')
      .select('event_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!favorites || favorites.length === 0) return [];

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', favorites.map((f: any) => f.event_id));

    if (eventsError) throw eventsError;
    return events?.map((event: any) => ({ ...event, is_favorited: true })) || [];
  },

  async getComments(eventId: string): Promise<EventComment[]> {
    const { data, error } = await supabase
      .from('event_comments')
      .select('*')
      .eq('event_id', eventId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createComment(eventId: string, comment: string, parentId?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('event_comments')
      .insert({
        event_id: eventId,
        user_id: user.id,
        comment,
        parent_id: parentId || null,
      });

    if (error) throw error;
  },

  async getReviews(eventId: string): Promise<EventReview[]> {
    const { data, error } = await supabase
      .from('event_reviews')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createReview(eventId: string, rating: number, comment?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('event_reviews')
      .insert({
        event_id: eventId,
        user_id: user.id,
        rating,
        comment,
      });

    if (error) throw error;
  },

  async getUpdates(eventId: string): Promise<EventUpdate[]> {
    const { data, error } = await supabase
      .from('event_updates')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createUpdate(eventId: string, title: string, message: string): Promise<void> {
    const { error } = await supabase
      .from('event_updates')
      .insert({
        event_id: eventId,
        title,
        message,
      });

    if (error) throw error;
  },

  async incrementViews(eventId: string): Promise<void> {
    const { error } = await supabase.rpc('increment', {
      row_id: eventId,
      table_name: 'events',
      column_name: 'views_count'
    });

    if (error) {
      console.error('Failed to increment views using RPC, fallback failed:', error);
    }
  },

  async uploadImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('event-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('event-images')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  async getUserRegisteredEvents(): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: registrations, error } = await supabase
      .from('event_registrations')
      .select('event_id')
      .eq('user_id', user.id)
      .eq('status', 'going')
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!registrations || registrations.length === 0) return [];

    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .in('id', registrations.map((r: any) => r.event_id));

    if (eventsError) throw eventsError;
    return events?.map((event: any) => ({ ...event, is_registered: true })) || [];
  },

  async getUserOrganizedEvents(): Promise<Event[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', user.id)
      .order('start_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAttendeeList(eventId: string): Promise<any[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (event?.organizer_id !== user.id) {
      throw new Error('Only event organizers can view attendee list');
    }

    const { data, error } = await supabase
      .from('event_registrations')
      .select('*')
      .eq('event_id', eventId)
      .eq('status', 'confirmed')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async checkInAttendee(eventId: string, registrationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: event } = await supabase
      .from('events')
      .select('organizer_id')
      .eq('id', eventId)
      .single();

    if (event?.organizer_id !== user.id) {
      throw new Error('Only event organizers can check in attendees');
    }

    const { error } = await supabase
      .from('event_registrations')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString(),
        checked_in_by: user.id,
      })
      .eq('id', registrationId)
      .eq('event_id', eventId);

    if (error) throw error;
  },

  async isEventFull(eventId: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('is_event_full', {
      event_id_param: eventId
    });

    if (error) {
      console.error('Failed to check if event is full:', error);
      return false;
    }

    return data || false;
  },
};
