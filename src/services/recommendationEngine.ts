import { supabase } from '../lib/supabase';
import { personalizationService } from './personalizationService';

interface RecommendationResult<T> {
  item: T;
  score: number;
  reasons: string[];
}

interface JobRecommendation {
  id: string;
  title: string;
  company_name: string;
  location_city: string;
  job_type: string;
  salary_min?: number;
  salary_max?: number;
}

interface FamilyRecommendation {
  id: string;
  family_name: string;
  location: string;
  children_count: number;
  children_ages: string;
}

interface EventRecommendation {
  id: string;
  title: string;
  event_date: string;
  location: string;
  category?: string;
}

interface ListingRecommendation {
  id: string;
  title: string;
  price: number;
  category: string;
  condition: string;
}

class RecommendationEngine {
  private readonly CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

  async getRecommendations<T>(
    userId: string,
    recommendationType: string,
    generator: () => Promise<RecommendationResult<T>[]>,
    limit = 10
  ): Promise<T[]> {
    const cached = await this.getCachedRecommendations<T>(userId, recommendationType);

    if (cached && cached.length > 0) {
      return cached.slice(0, limit);
    }

    const recommendations = await generator();
    const sortedRecommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    await this.cacheRecommendations(
      userId,
      recommendationType,
      sortedRecommendations.map(r => r.item)
    );

    return sortedRecommendations.map(r => r.item);
  }

  private async getCachedRecommendations<T>(
    userId: string,
    recommendationType: string
  ): Promise<T[] | null> {
    const { data, error } = await supabase
      .from('user_recommendations')
      .select('recommended_items, expires_at')
      .eq('user_id', userId)
      .eq('recommendation_type', recommendationType)
      .maybeSingle();

    if (error || !data) return null;

    const expiresAt = new Date(data.expires_at);
    if (expiresAt < new Date()) {
      return null;
    }

    return data.recommended_items as T[];
  }

  private async cacheRecommendations<T>(
    userId: string,
    recommendationType: string,
    items: T[]
  ): Promise<void> {
    const expiresAt = new Date(Date.now() + this.CACHE_DURATION_MS);

    await supabase
      .from('user_recommendations')
      .upsert({
        user_id: userId,
        recommendation_type: recommendationType,
        recommended_items: items as any,
        generated_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      });
  }

  async getJobRecommendations(userId: string, limit = 10): Promise<JobRecommendation[]> {
    return this.getRecommendations(
      userId,
      'jobs',
      () => this.generateJobRecommendations(userId),
      limit
    );
  }

  private async generateJobRecommendations(userId: string): Promise<RecommendationResult<JobRecommendation>[]> {
    const { data: profile } = await supabase
      .from('profiles_jobseeker')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) return [];

    const { data: preferences } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    const interactions = await personalizationService.getContentInteractions(userId, 'jobs', 50);
    const viewedJobIds = interactions
      .filter(i => i.interaction_type === 'view')
      .map(i => i.content_id);

    let query = supabase
      .from('jobs')
      .select('id, title, company_name, location_city, job_type, salary_min, salary_max, required_skills, status')
      .eq('status', 'active')
      .limit(50);

    if (viewedJobIds.length > 0) {
      query = query.not('id', 'in', `(${viewedJobIds.join(',')})`);
    }

    const { data: jobs } = await query;
    if (!jobs) return [];

    const scoredJobs = jobs.map((job: any) => {
      let score = 0;
      const reasons: string[] = [];

      if (preferences?.preferred_job_types?.includes(job.job_type)) {
        score += 30;
        reasons.push('Matches preferred job type');
      }

      if (preferences?.preferred_locations?.includes(job.location_city)) {
        score += 25;
        reasons.push('In preferred location');
      }

      if (profile.current_location_city === job.location_city) {
        score += 20;
        reasons.push('Near your location');
      }

      if (job.salary_min && preferences?.salary_min) {
        if (job.salary_min >= preferences.salary_min) {
          score += 15;
          reasons.push('Meets salary expectations');
        }
      }

      if (profile.skills && job.required_skills) {
        const matchingSkills = profile.skills.filter((skill: string) =>
          job.required_skills?.includes(skill)
        );
        if (matchingSkills.length > 0) {
          score += matchingSkills.length * 5;
          reasons.push(`${matchingSkills.length} matching skills`);
        }
      }

      score += Math.random() * 5;

      return {
        item: job as JobRecommendation,
        score,
        reasons,
      };
    });

    return scoredJobs.filter((sj: any) => sj.score > 0);
  }

  async getFamilyRecommendations(userId: string, limit = 10): Promise<FamilyRecommendation[]> {
    return this.getRecommendations(
      userId,
      'families',
      () => this.generateFamilyRecommendations(userId),
      limit
    );
  }

  private async generateFamilyRecommendations(userId: string): Promise<RecommendationResult<FamilyRecommendation>[]> {
    const { data: auPairProfile } = await supabase
      .from('au_pair_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (!auPairProfile) return [];

    const { data: families } = await supabase
      .from('host_family_profiles')
      .select('id, user_id, family_name, location_country, location_city, children_count, children_ages, start_date_preference, languages_spoken')
      .eq('status', 'active')
      .limit(50);

    if (!families) return [];

    const scoredFamilies = families.map((family: any) => {
      let score = 0;
      const reasons: string[] = [];

      if (auPairProfile.preferred_locations?.includes(family.location_country)) {
        score += 40;
        reasons.push('Preferred country');
      }

      if (auPairProfile.preferred_child_ages) {
        const preferredAges = auPairProfile.preferred_child_ages;
        const familyAges = family.children_ages;
        if (preferredAges && familyAges) {
          score += 25;
          reasons.push('Children age match');
        }
      }

      if (auPairProfile.available_from && family.start_date_preference) {
        const availableFrom = new Date(auPairProfile.available_from);
        const preferredStart = new Date(family.start_date_preference);
        const daysDiff = Math.abs((availableFrom.getTime() - preferredStart.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff <= 30) {
          score += 20;
          reasons.push('Start date aligned');
        }
      }

      if (auPairProfile.languages_spoken && family.languages_spoken) {
        const commonLanguages = auPairProfile.languages_spoken.filter((lang: string) =>
          family.languages_spoken?.includes(lang)
        );
        if (commonLanguages.length > 0) {
          score += commonLanguages.length * 10;
          reasons.push(`${commonLanguages.length} shared languages`);
        }
      }

      score += Math.random() * 5;

      return {
        item: {
          id: family.id,
          family_name: family.family_name || 'Anonymous Family',
          location: `${family.location_city}, ${family.location_country}`,
          children_count: family.children_count || 0,
          children_ages: family.children_ages || 'Not specified',
        },
        score,
        reasons,
      };
    });

    return scoredFamilies.filter((sf: any) => sf.score > 0);
  }

  async getEventRecommendations(userId: string, limit = 10): Promise<EventRecommendation[]> {
    return this.getRecommendations(
      userId,
      'events',
      () => this.generateEventRecommendations(userId),
      limit
    );
  }

  private async generateEventRecommendations(userId: string): Promise<RecommendationResult<EventRecommendation>[]> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_city, interested_modules')
      .eq('id', userId)
      .maybeSingle();

    const interactions = await personalizationService.getContentInteractions(userId, 'events', 50);
    const attendedEventIds = interactions
      .filter(i => i.interaction_type === 'apply')
      .map(i => i.content_id);

    const { data: events } = await supabase
      .from('events')
      .select('id, title, event_date, location, category, status')
      .eq('status', 'published')
      .gte('event_date', new Date().toISOString())
      .limit(50);

    if (!events) return [];

    const scoredEvents = events.map((event: any) => {
      let score = 0;
      const reasons: string[] = [];

      if (profile?.current_city && event.location?.includes(profile.current_city)) {
        score += 40;
        reasons.push('In your city');
      }

      if (attendedEventIds.includes(event.id)) {
        score -= 100;
      }

      const eventDate = new Date(event.event_date);
      const daysUntil = (eventDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

      if (daysUntil >= 3 && daysUntil <= 30) {
        score += 20;
        reasons.push('Coming soon');
      }

      if (event.category && profile?.interested_modules?.includes(event.category)) {
        score += 30;
        reasons.push('Matches your interests');
      }

      score += Math.random() * 10;

      return {
        item: {
          id: event.id,
          title: event.title,
          event_date: event.event_date,
          location: event.location,
          category: event.category,
        },
        score,
        reasons,
      };
    });

    return scoredEvents.filter((se: any) => se.score > 0);
  }

  async getMarketplaceRecommendations(userId: string, limit = 10): Promise<ListingRecommendation[]> {
    return this.getRecommendations(
      userId,
      'marketplace',
      () => this.generateMarketplaceRecommendations(userId),
      limit
    );
  }

  private async generateMarketplaceRecommendations(userId: string): Promise<RecommendationResult<ListingRecommendation>[]> {
    const interactions = await personalizationService.getContentInteractions(userId, 'marketplace', 100);

    const viewedCategories = interactions
      .filter(i => i.interaction_type === 'view')
      .map(i => i.interaction_data?.category)
      .filter(Boolean);

    const categoryFrequency: Record<string, number> = {};
    viewedCategories.forEach(cat => {
      categoryFrequency[cat as string] = (categoryFrequency[cat as string] || 0) + 1;
    });

    const topCategories = Object.entries(categoryFrequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat]) => cat);

    const viewedListingIds = interactions
      .filter(i => i.interaction_type === 'view')
      .map(i => i.content_id);

    let query = supabase
      .from('marketplace_items')
      .select('id, title, price, currency, category, condition, status')
      .eq('status', 'active')
      .limit(50);

    if (viewedListingIds.length > 0) {
      query = query.not('id', 'in', `(${viewedListingIds.join(',')})`);
    }

    const { data: listings } = await query;
    if (!listings) return [];

    const scoredListings = listings.map((listing: any) => {
      let score = 0;
      const reasons: string[] = [];

      if (topCategories.includes(listing.category)) {
        const categoryRank = topCategories.indexOf(listing.category);
        score += (3 - categoryRank) * 20;
        reasons.push('Based on your interests');
      }

      if (listing.condition === 'new' || listing.condition === 'like_new') {
        score += 10;
        reasons.push('Great condition');
      }

      const priceScore = Math.max(0, 20 - (listing.price / 100));
      score += priceScore;

      score += Math.random() * 10;

      return {
        item: {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          category: listing.category,
          condition: listing.condition,
        },
        score,
        reasons,
      };
    });

    return scoredListings.filter((sl: any) => sl.score > 0);
  }

  async clearRecommendationCache(userId: string, recommendationType?: string): Promise<void> {
    let query = supabase
      .from('user_recommendations')
      .delete()
      .eq('user_id', userId);

    if (recommendationType) {
      query = query.eq('recommendation_type', recommendationType);
    }

    await query;
  }
}

export const recommendationEngine = new RecommendationEngine();
