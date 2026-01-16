import { supabase } from '../lib/supabase';

export interface SearchResult {
  id: string;
  type: 'job' | 'event' | 'marketplace' | 'education' | 'community' | 'au_pair' | 'visa';
  title: string;
  description: string;
  url: string;
  metadata: any;
  relevance?: number;
}

export interface SearchFilters {
  modules?: string[];
  location?: string;
  dateFrom?: string;
  dateTo?: string;
  priceMin?: number;
  priceMax?: number;
  [key: string]: any;
}

export interface SearchHistory {
  id: string;
  query: string;
  filters: SearchFilters;
  result_count: number;
  created_at: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export const searchService = {
  async globalSearch(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    const results: SearchResult[] = [];
    const modules = filters?.modules || ['job', 'event', 'marketplace', 'education', 'community'];

    const searchPromises = [];

    if (modules.includes('job')) {
      searchPromises.push(this.searchJobs(query, filters));
    }
    if (modules.includes('event')) {
      searchPromises.push(this.searchEvents(query, filters));
    }
    if (modules.includes('marketplace')) {
      searchPromises.push(this.searchMarketplace(query, filters));
    }
    if (modules.includes('education')) {
      searchPromises.push(this.searchEducation(query, filters));
    }
    if (modules.includes('community')) {
      searchPromises.push(this.searchCommunity(query, filters));
    }

    const allResults = await Promise.all(searchPromises);
    allResults.forEach(moduleResults => results.push(...moduleResults));

    await this.saveSearchHistory(query, filters || {}, results.length);

    return results.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));
  },

  async searchJobs(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    let queryBuilder = supabase
      .from('jobs')
      .select('*')
      .eq('status', 'open')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,company_name.ilike.%${query}%`);

    if (filters?.location) {
      queryBuilder = queryBuilder.ilike('location', `%${filters.location}%`);
    }

    const { data, error } = await queryBuilder.limit(20);
    if (error) {
      console.error('Job search error:', error);
      return [];
    }

    return (data || []).map((job: any) => ({
      id: job.id,
      type: 'job' as const,
      title: job.title,
      description: job.description,
      url: `/jobs/${job.id}`,
      metadata: {
        company: job.company_name,
        location: job.location,
        salary: job.salary_range,
      },
      relevance: this.calculateRelevance(query, job.title + ' ' + job.description),
    }));
  },

  async searchEvents(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    let queryBuilder = supabase
      .from('events')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%`);

    if (filters?.dateFrom) {
      queryBuilder = queryBuilder.gte('event_date', filters.dateFrom);
    }
    if (filters?.dateTo) {
      queryBuilder = queryBuilder.lte('event_date', filters.dateTo);
    }

    const { data, error } = await queryBuilder.limit(20);
    if (error) {
      console.error('Event search error:', error);
      return [];
    }

    return (data || []).map((event: any) => ({
      id: event.id,
      type: 'event' as const,
      title: event.title,
      description: event.description,
      url: `/events/${event.id}`,
      metadata: {
        date: event.event_date,
        location: event.location,
      },
      relevance: this.calculateRelevance(query, event.title + ' ' + event.description),
    }));
  },

  async searchMarketplace(query: string, filters?: SearchFilters): Promise<SearchResult[]> {
    let queryBuilder = supabase
      .from('marketplace_items')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);

    if (filters?.priceMin) {
      queryBuilder = queryBuilder.gte('price', filters.priceMin);
    }
    if (filters?.priceMax) {
      queryBuilder = queryBuilder.lte('price', filters.priceMax);
    }

    const { data, error } = await queryBuilder.limit(20);
    if (error) {
      console.error('Marketplace search error:', error);
      return [];
    }

    return (data || []).map((listing: any) => ({
      id: listing.id,
      type: 'marketplace' as const,
      title: listing.title,
      description: listing.description,
      url: `/marketplace/${listing.id}`,
      metadata: {
        price: listing.price,
        category: listing.category,
      },
      relevance: this.calculateRelevance(query, listing.title + ' ' + listing.description),
    }));
  },

  async searchEducation(query: string, _filters?: SearchFilters): Promise<SearchResult[]> {
    const queryBuilder = supabase
      .from('education_programs')
      .select('*')
      .eq('status', 'active')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,institution.ilike.%${query}%`);

    const { data, error } = await queryBuilder.limit(20);
    if (error) {
      console.error('Education search error:', error);
      return [];
    }

    return (data || []).map((program: any) => ({
      id: program.id,
      type: 'education' as const,
      title: program.title,
      description: program.description,
      url: `/education/${program.id}`,
      metadata: {
        institution: program.institution,
        level: program.level,
      },
      relevance: this.calculateRelevance(query, program.title + ' ' + program.description),
    }));
  },

  async searchCommunity(query: string, _filters?: SearchFilters): Promise<SearchResult[]> {
    const queryBuilder = supabase
      .from('community_posts')
      .select('*')
      .or(`title.ilike.%${query}%,content.ilike.%${query}%`);

    const { data, error } = await queryBuilder.limit(20);
    if (error) {
      console.error('Community search error:', error);
      return [];
    }

    return (data || []).map((post: any) => ({
      id: post.id,
      type: 'community' as const,
      title: post.title,
      description: post.content.substring(0, 200),
      url: `/community`,
      metadata: {
        author: post.author_name,
      },
      relevance: this.calculateRelevance(query, post.title + ' ' + post.content),
    }));
  },

  calculateRelevance(query: string, text: string): number {
    const lowerQuery = query.toLowerCase();
    const lowerText = text.toLowerCase();

    if (lowerText.includes(lowerQuery)) {
      const position = lowerText.indexOf(lowerQuery);
      return 1000 - position;
    }

    const queryWords = lowerQuery.split(' ');
    let matchCount = 0;
    queryWords.forEach(word => {
      if (lowerText.includes(word)) matchCount++;
    });

    return (matchCount / queryWords.length) * 100;
  },

  async getSearchHistory(limit = 20): Promise<SearchHistory[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to get search history:', error);
      return [];
    }

    return data || [];
  },

  async clearSearchHistory(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('search_history')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;
  },

  async saveSearchHistory(query: string, filters: SearchFilters, resultCount: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('search_history')
      .insert({
        user_id: user.id,
        query,
        filters,
        result_count: resultCount,
      });

    if (error) {
      console.error('Failed to save search history:', error);
    }
  },

  async getSavedSearches(): Promise<SavedSearch[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to get saved searches:', error);
      return [];
    }

    return data || [];
  },

  async saveSearch(name: string, query: string, filters: SearchFilters, notificationEnabled = false): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('saved_searches')
      .insert({
        user_id: user.id,
        name,
        query,
        filters,
        notification_enabled: notificationEnabled,
      });

    if (error) throw error;
  },

  async updateSavedSearch(id: string, updates: Partial<SavedSearch>): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  },

  async deleteSavedSearch(id: string): Promise<void> {
    const { error } = await supabase
      .from('saved_searches')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
