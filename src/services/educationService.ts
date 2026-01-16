import { supabase } from '../lib/supabase';

export interface ProgramType {
  id: string;
  name_en: string;
  name_zh: string;
  category: string;
  icon: string;
  color: string;
  order_index: number;
}

export interface EducationResource {
  id: string;
  creator_id: string;
  title: string;
  title_zh: string | null;
  description: string;
  description_zh: string | null;
  type: string;
  program_type: string | null;
  education_level: string | null;
  level: string;
  language: string;
  duration: string | null;
  duration_value: number | null;
  duration_unit: string | null;
  schedule_type: string | null;
  delivery_mode: string | null;
  price: number;
  tuition_fee: number | null;
  currency: string | null;
  scholarship_amount: number | null;
  financial_aid_available: boolean | null;
  institution_name: string | null;
  institution_country: string | null;
  institution_city: string | null;
  institution_website: string | null;
  institution_logo: string | null;
  start_date: string | null;
  end_date: string | null;
  application_deadline: string | null;
  eligibility_requirements: string | null;
  academic_requirements: string | null;
  language_requirements: any[] | null;
  documents_required: string[] | null;
  age_requirements: string | null;
  capacity: number | null;
  spots_remaining: number | null;
  tags: string[] | null;
  images: string[] | null;
  image_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  external_url: string | null;
  views_count: number | null;
  interest_count: number | null;
  is_featured: boolean | null;
  status: string;
  created_at: string;
  updated_at: string;
  creator?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  has_submitted_interest?: boolean;
  is_favorited?: boolean;
}

export interface EducationInterest {
  id: string;
  resource_id: string;
  user_id: string;
  status: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  nationality: string | null;
  current_location: string | null;
  current_education_level: string | null;
  current_institution: string | null;
  field_of_study: string | null;
  gpa: string | null;
  language_proficiency: any[] | null;
  work_experience: string | null;
  motivation: string | null;
  message: string | null;
  additional_info: string | null;
  preferred_start_date: string | null;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    profiles?: {
      full_name: string | null;
      avatar_url: string | null;
      phone: string | null;
    };
  };
  resource?: EducationResource;
  documents?: InterestDocument[];
  history?: InterestHistory[];
}

export interface InterestDocument {
  id: string;
  interest_id: string;
  document_type: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  mime_type: string | null;
  uploaded_at: string;
}

export interface InterestHistory {
  id: string;
  interest_id: string;
  previous_status: string | null;
  new_status: string;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
  admin?: {
    email: string;
    profiles?: {
      full_name: string | null;
    };
  };
}

export interface CreateProgramData {
  title: string;
  title_zh?: string;
  description: string;
  description_zh?: string;
  program_type: string;
  education_level?: string;
  type: string;
  level: string;
  language: string;
  duration_value?: number;
  duration_unit?: string;
  schedule_type?: string;
  delivery_mode?: string;
  tuition_fee?: number;
  currency?: string;
  scholarship_amount?: number;
  financial_aid_available?: boolean;
  institution_name?: string;
  institution_country?: string;
  institution_city?: string;
  institution_website?: string;
  institution_logo?: string;
  start_date?: string;
  end_date?: string;
  application_deadline?: string;
  eligibility_requirements?: string;
  academic_requirements?: string;
  language_requirements?: any[];
  documents_required?: string[];
  age_requirements?: string;
  capacity?: number;
  tags?: string[];
  images?: string[];
  contact_email?: string;
  contact_phone?: string;
  external_url?: string;
}

export interface SubmitInterestData {
  resource_id: string;
  full_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  nationality?: string;
  current_location?: string;
  current_education_level?: string;
  current_institution?: string;
  field_of_study?: string;
  gpa?: string;
  language_proficiency?: any[];
  work_experience?: string;
  motivation?: string;
  message?: string;
  additional_info?: string;
  preferred_start_date?: string;
}

export interface ProgramFilters {
  program_type?: string;
  education_level?: string;
  category?: string;
  country?: string;
  city?: string;
  language?: string;
  delivery_mode?: string;
  max_tuition?: number;
  deadline_after?: string;
  has_scholarship?: boolean;
  search?: string;
}

export const educationService = {
  async getProgramTypes(): Promise<ProgramType[]> {
    const { data, error } = await supabase
      .from('education_program_types')
      .select('*')
      .order('order_index');

    if (error) throw error;
    return data || [];
  },

  async getPrograms(filters?: ProgramFilters): Promise<EducationResource[]> {
    const { data: { user } } = await supabase.auth.getUser();

    let query = supabase
      .from('education_resources')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (filters?.program_type && filters.program_type !== 'all') {
      query = query.eq('program_type', filters.program_type);
    }

    if (filters?.education_level && filters.education_level !== 'all') {
      query = query.eq('education_level', filters.education_level);
    }

    if (filters?.country && filters.country !== 'all') {
      query = query.eq('institution_country', filters.country);
    }

    if (filters?.city && filters.city !== 'all') {
      query = query.eq('institution_city', filters.city);
    }

    if (filters?.language && filters.language !== 'all') {
      query = query.eq('language', filters.language);
    }

    if (filters?.delivery_mode && filters.delivery_mode !== 'all') {
      query = query.eq('delivery_mode', filters.delivery_mode);
    }

    if (filters?.max_tuition !== undefined) {
      query = query.lte('tuition_fee', filters.max_tuition);
    }

    if (filters?.deadline_after) {
      query = query.gte('application_deadline', filters.deadline_after);
    }

    if (filters?.has_scholarship) {
      query = query.gt('scholarship_amount', 0);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,title_zh.ilike.%${filters.search}%,description_zh.ilike.%${filters.search}%,institution_name.ilike.%${filters.search}%`);
    }

    const { data, error } = await query;

    if (error) throw error;

    if (user && data) {
      const resourceIds = data.map((r: any) => r.id);

      const [{ data: interests }, { data: favorites }] = await Promise.all([
        supabase
          .from('education_interests')
          .select('resource_id')
          .eq('user_id', user.id)
          .in('resource_id', resourceIds),
        supabase
          .from('education_favorites')
          .select('resource_id')
          .eq('user_id', user.id)
          .in('resource_id', resourceIds)
      ]);

      const interestIds = new Set(interests?.map((i: any) => i.resource_id) || []);
      const favoritedIds = new Set(favorites?.map((f: any) => f.resource_id) || []);

      return data.map((resource: any) => ({
        ...resource,
        has_submitted_interest: interestIds.has(resource.id),
        is_favorited: favoritedIds.has(resource.id)
      }));
    }

    return data || [];
  },

  async getProgramById(id: string): Promise<EducationResource | null> {
    const { data: { user } } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from('education_resources')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    if (!data) return null;

    if (user) {
      const [{ data: interest }, { data: favorite }] = await Promise.all([
        supabase
          .from('education_interests')
          .select('id')
          .eq('user_id', user.id)
          .eq('resource_id', id)
          .maybeSingle(),
        supabase
          .from('education_favorites')
          .select('id')
          .eq('user_id', user.id)
          .eq('resource_id', id)
          .maybeSingle()
      ]);

      return {
        ...data,
        has_submitted_interest: !!interest,
        is_favorited: !!favorite
      };
    }

    return data;
  },

  async createProgram(programData: CreateProgramData): Promise<EducationResource> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_resources')
      .insert({
        ...programData,
        creator_id: user.id,
        status: 'active',
        price: programData.tuition_fee || 0,
        currency: programData.currency || 'CAD',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateProgram(id: string, updates: Partial<CreateProgramData>): Promise<EducationResource> {
    const { data, error } = await supabase
      .from('education_resources')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProgram(id: string): Promise<void> {
    const { error } = await supabase
      .from('education_resources')
      .update({ status: 'inactive' })
      .eq('id', id);

    if (error) throw error;
  },

  async submitInterest(interestData: SubmitInterestData): Promise<EducationInterest> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_interests')
      .insert({
        ...interestData,
        user_id: user.id,
        status: 'submitted',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserInterest(resourceId: string): Promise<EducationInterest | null> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_interests')
      .select('*')
      .eq('resource_id', resourceId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async getUserInterests(): Promise<EducationInterest[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_interests')
      .select(`
        *,
        resource:education_resources(*),
        documents:education_interest_documents(*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateInterestStatus(interestId: string, status: string, adminNotes?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('education_interests')
      .update({
        status,
        admin_notes: adminNotes,
        reviewed_by: user.id,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', interestId);

    if (error) throw error;
  },

  async getInterestsForProgram(resourceId: string): Promise<EducationInterest[]> {
    const { data, error } = await supabase
      .from('education_interests')
      .select('*')
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getAllInterests(filters?: { status?: string }): Promise<EducationInterest[]> {
    let query = supabase
      .from('education_interests')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  async getLatestInterests(limit: number = 5): Promise<EducationInterest[]> {
    const { data, error } = await supabase
      .from('education_interests')
      .select(`
        *,
        resource:education_resources(title, title_zh)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async uploadDocument(interestId: string, file: File, documentType: string): Promise<InterestDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${interestId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('education-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('education-documents')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('education_interest_documents')
      .insert({
        interest_id: interestId,
        document_type: documentType,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteDocument(documentId: string): Promise<void> {
    const { error } = await supabase
      .from('education_interest_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  async toggleFavorite(resourceId: string): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('education_favorites')
      .select('id')
      .eq('user_id', user.id)
      .eq('resource_id', resourceId)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from('education_favorites')
        .delete()
        .eq('id', existing.id);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase
        .from('education_favorites')
        .insert({
          user_id: user.id,
          resource_id: resourceId,
        });

      if (error) throw error;
      return true;
    }
  },

  async getFavorites(): Promise<EducationResource[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: favorites, error } = await supabase
      .from('education_favorites')
      .select('resource_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!favorites || favorites.length === 0) return [];

    const { data: resources, error: resourcesError } = await supabase
      .from('education_resources')
      .select('*')
      .in('id', favorites.map((f: any) => f.resource_id));

    if (resourcesError) throw resourcesError;
    return resources?.map((resource: any) => ({ ...resource, is_favorited: true })) || [];
  },

  async incrementViews(resourceId: string): Promise<void> {
    const { data } = await supabase
      .from('education_resources')
      .select('views_count')
      .eq('id', resourceId)
      .single();

    if (!data) return;

    const { error } = await supabase
      .from('education_resources')
      .update({ views_count: (data.views_count || 0) + 1 })
      .eq('id', resourceId);

    if (error) console.error('Failed to increment views:', error);
  },

  async uploadImage(file: File): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('education-images')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('education-images')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  async getInterestHistory(interestId: string): Promise<InterestHistory[]> {
    const { data, error } = await supabase
      .from('education_interest_history')
      .select('*')
      .eq('interest_id', interestId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getStatistics(): Promise<any> {
    const [
      { count: totalPrograms },
      { count: totalInterests },
      { count: activeInterests },
      { count: approvedInterests }
    ] = await Promise.all([
      supabase.from('education_resources').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('education_interests').select('*', { count: 'exact', head: true }),
      supabase.from('education_interests').select('*', { count: 'exact', head: true }).eq('status', 'submitted'),
      supabase.from('education_interests').select('*', { count: 'exact', head: true }).eq('status', 'approved')
    ]);

    return {
      totalPrograms: totalPrograms || 0,
      totalInterests: totalInterests || 0,
      activeInterests: activeInterests || 0,
      approvedInterests: approvedInterests || 0
    };
  }
};
