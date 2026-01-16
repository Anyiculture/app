import { supabase } from '../lib/supabase';
import { translationService } from './translationService';

export interface MarketplaceCategory {
  id: string;
  name_en: string;
  name_zh: string;
  icon: string;
  order_index: number;
}

export interface MarketplaceItem {
  id: string;
  user_id: string;
  title: string;
  title_zh: string | null;
  description: string;
  description_zh: string | null;
  category: string;
  subcategory: string | null;
  price: number;
  currency: string;
  negotiable: boolean;
  condition: string;
  // Product Details
  brand?: string | null;
  model?: string | null;
  color?: string | null;
  size?: string | null;
  dimensions?: string | null; // e.g., "L50cm x W30cm x H20cm"
  weight?: string | null;
  material?: string | null;
  quantity_available?: number;
  // Location (China-specific)
  location_province?: string | null;
  location_city: string;
  location_area: string | null; // District/Area
  location_district?: string | null; // Same as location_area but alternative naming
  meetup_location?: string | null; // Preferred meetup spot
  latitude?: number | null;
  longitude?: number | null;
  // Images & Media
  images: string[];
  video_url: string | null;
  // Contact
  contact_method: string;
  contact_wechat: string | null;
  // Status & Stats
  status: string;
  views_count: number;
  favorites_count: number;
  featured_until: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
  // Seller Info
  seller?: {
    email: string;
    created_at?: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
      phone: string | null;
      wechat_id: string | null;
      email_verified?: boolean;
      phone_verified?: boolean;
      total_sales?: number;
      average_rating?: number;
    } | null;
  };
  is_favorited?: boolean;
}

export interface CreateMarketplaceItemData {
  title: string;
  title_zh?: string;
  description: string;
  description_zh?: string;
  price: number;
  negotiable?: boolean;
  category: string;
  subcategory?: string;
  condition: string;
  
  // Product Details
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  weight?: string;
  material?: string;
  quantity_available?: number;
  
  // Location
  location_province: string;
  location_city: string;
  location_area?: string;
  meetup_location?: string;
  latitude?: number;
  longitude?: number;
  
  // Media
  images: string[];
  
  // Contact
  contact_options?: string[];
  contact_wechat?: string;
  contact_email?: string;
  contact_phone?: string;
}

export interface UpdateMarketplaceItemData {
  title?: string;
  title_zh?: string;
  description?: string;
  description_zh?: string;
  price?: number;
  negotiable?: boolean;
  category?: string;
  subcategory?: string;
  condition?: string;
  status?: 'active' | 'sold' | 'deleted';
  
  brand?: string;
  model?: string;
  color?: string;
  size?: string;
  dimensions?: string;
  weight?: string;
  material?: string;
  quantity_available?: number;
  
  location_province?: string;
  location_city?: string;
  location_area?: string;
  meetup_location?: string;
  latitude?: number;
  longitude?: number;
  
  images?: string[];
  
  contact_options?: string[];
  contact_method?: string;
  contact_wechat?: string;
  contact_email?: string;
  contact_phone?: string;
  video_url?: string;
}

export interface MarketplaceFilters {
  category?: string;
  subcategory?: string;
  city?: string;
  condition?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  location_province?: string;
  location_city?: string;
  status?: string;
}

export interface MarketplaceReview {
  id: string;
  item_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
}

export const marketplaceService = {
  async getCategories(): Promise<MarketplaceCategory[]> {
    const { data, error } = await supabase
      .from('marketplace_categories')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getItems(filters?: MarketplaceFilters): Promise<MarketplaceItem[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('marketplace_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status) {
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
    } else {
      query = query.eq('status', 'active');
    }

    if (filters?.category && filters.category !== 'all') {
      query = query.eq('category', filters.category);
    }

    if (filters?.subcategory && filters.subcategory !== 'all') {
      query = query.eq('subcategory', filters.subcategory);
    }

    if (filters?.location_province && filters.location_province !== 'all') {
      query = query.eq('location_province', filters.location_province);
    }

    if (filters?.location_city && filters.location_city !== 'all') {
      query = query.eq('location_city', filters.location_city);
    }

    if (filters?.city && filters.city !== 'all') {
      query = query.eq('location_city', filters.city);
    }

    if (filters?.condition && filters.condition !== 'all') {
      query = query.eq('condition', filters.condition);
    }

    if (filters?.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }

    if (filters?.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,title_zh.ilike.%${filters.search}%,description_zh.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (user && data) {
      const itemIds = data.map((item: any) => item.id);
      const { data: favorites } = await supabase
        .from('marketplace_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .in('item_id', itemIds);

      const favoritedIds = new Set(favorites?.map((f: any) => f.item_id) || []);
      return data.map((item: any) => ({
        ...item,
        images: item.images || [],
        is_favorited: favoritedIds.has(item.id)
      }));
    }

    return data?.map((item: any) => ({
        ...item,
        images: item.images || []
    })) || [];
  },

  async getItemById(id: string): Promise<MarketplaceItem | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    // Ensure images property is populated
    const item = {
      ...data,
      images: data.images || []
    };

    if (user) {
      const { data: favorite } = await supabase
        .from('marketplace_favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('item_id', id)
        .maybeSingle();

      return {
        ...item,
        is_favorited: !!favorite
      };
    }

    return item;
  },

  async createItem(itemData: CreateMarketplaceItemData): Promise<MarketplaceItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { images, price, ...restData } = itemData;
    
    // Auto-translation logic
    const finalData = { ...restData };

    // Handle Title Translation
    if (!finalData.title_zh) {
      if (translationService.hasChinese(finalData.title)) {
        // Input is Chinese
        finalData.title_zh = finalData.title;
        // Translate to English for the main title field
        finalData.title = await translationService.translateText(finalData.title, 'en');
      } else {
        // Input is English/Other -> Translate to Chinese
        finalData.title_zh = await translationService.translateText(finalData.title, 'zh');
      }
    }

    // Handle Description Translation
    if (!finalData.description_zh) {
      if (translationService.hasChinese(finalData.description)) {
        // Input is Chinese
        finalData.description_zh = finalData.description;
        // Translate to English for the main description field
        finalData.description = await translationService.translateText(finalData.description, 'en');
      } else {
        // Input is English/Other -> Translate to Chinese
        finalData.description_zh = await translationService.translateText(finalData.description, 'zh');
      }
    }

    const { data, error } = await supabase
      .from('marketplace_items')
      .insert({
        ...finalData,
        price: price,
        images: images || [],
        user_id: user.id,
        status: 'active',
        currency: 'CNY',
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      price: data.price,
      images: data.images || []
    };
  },

  async updateItem(id: string, updates: UpdateMarketplaceItemData): Promise<MarketplaceItem> {
    const { images, price, ...restUpdates } = updates;
    
    // Map fields to DB column names (marketplace_items table)
    const dbUpdates: any = { ...restUpdates };
    if (images) dbUpdates.images = images;
    if (price !== undefined) dbUpdates.price = price;

    const { data, error } = await supabase
      .from('marketplace_items')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Return mapped data
    return {
      ...data,
      price: data.price,
      images: data.images || []
    } as MarketplaceItem;
  },

  async deleteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async markAsSold(id: string): Promise<void> {
    const { error } = await supabase
      .from('marketplace_items')
      .update({ status: 'sold' })
      .eq('id', id);

    if (error) throw error;
  },

  async getUserItems(userId: string): Promise<MarketplaceItem[]> {
    const { data, error } = await supabase
      .from('marketplace_items')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async toggleFavorite(itemId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('marketplace_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('item_id', itemId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('marketplace_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('marketplace_favorites')
        .insert({
          user_id: user.id,
          item_id: itemId,
        });

      if (error) throw error;
      return true;
    }
  },

  async getFavorites(): Promise<MarketplaceItem[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: favorites, error } = await supabase
      .from('marketplace_favorites')
      .select('item_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!favorites || favorites.length === 0) return [];

    const { data: items, error: itemsError } = await supabase
      .from('marketplace_items')
      .select('*')
      .in('id', favorites.map((f: any) => f.item_id));

    if (itemsError) throw itemsError;
    return items?.map((item: any) => ({ ...item, is_favorited: true })) || [];
  },

  async incrementViews(itemId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_marketplace_views', {
      item_id_param: itemId
    });

    if (error) console.error('Failed to increment views:', error);
  },

  async reportItem(itemId: string, reason: string, description?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('marketplace_reports')
      .insert({
        item_id: itemId,
        reported_by: user.id,
        reason,
        description,
      });

    if (error) throw error;
  },

  async getItemReports(itemId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('marketplace_reports')
      .select('*')
      .eq('item_id', itemId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getReviews(userId: string): Promise<MarketplaceReview[]> {
    const { data, error } = await supabase
      .from('marketplace_reviews')
      .select('*')
      .eq('reviewee_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createReview(itemId: string, revieweeId: string, rating: number, comment?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('marketplace_reviews')
      .insert({
        item_id: itemId,
        reviewer_id: user.id,
        reviewee_id: revieweeId,
        rating,
        comment,
      });

    if (error) throw error;
  },

  async uploadImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('marketplace-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('marketplace-images')
      .getPublicUrl(fileName);

    return publicUrl;
  },
};
