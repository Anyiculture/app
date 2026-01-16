import { supabase } from '../lib/supabase';

export interface Job {
  id: string;
  poster_id: string;
  title: string;
  company_name?: string;
  description: string;
  image_urls?: string[];
  job_type: 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
  location: string; // Combined location string (required by DB)
  location_country?: string;
  location_province?: string;
  location_city?: string;
  salary_min?: number;
  salary_max?: number;
  salary_currency: string;
  salary_period?: string;
  category_id?: string;
  status: 'draft' | 'published' | 'closed' | 'archived' | 'active' | 'inactive';
  application_email?: string;
  application_url?: string;
  remote_type?: 'on_site' | 'remote' | 'hybrid';
  experience_level?: 'entry' | 'mid' | 'senior' | 'executive';
  education_required?: string;
  skills_required: string[];
  language_requirements?: any[];
  benefits: string[];
  application_deadline?: string;
  views_count: number;
  applications_count: number;
  featured: boolean;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  applicant_id: string;
  status: 'pending' | 'reviewed' | 'shortlisted' | 'rejected' | 'withdrawn';
  cover_letter?: string;
  resume_url?: string;
  portfolio_url?: string;
  additional_documents?: Record<string, any>;
  reviewed_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id: string;
  created_at: string;
}

export interface JobPreferences {
  id: string;
  user_id: string;
  preferred_job_types: string[];
  preferred_categories: string[];
  preferred_locations: Array<{ country?: string; province?: string; city?: string }>;
  salary_min?: number;
  salary_currency: string;
  remote_preference: 'on_site' | 'remote' | 'hybrid' | 'any';
  experience_levels: string[];
  notification_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Jobs Service
export const jobsService = {
  // Get paginated published jobs with filters
  async getJobs(
    page = 1,
    limit = 20,
    filters?: {
      category?: string;
      location?: string;
      location_city?: string;
      job_type?: string | string[];
      remote_type?: string | string[];
      salary_min?: number;
      salary_max?: number;
      experience_level?: string | string[];
      search?: string;
      sort?: 'newest' | 'salary_desc' | 'salary_asc';
      status?: string;
    }
  ) {
    let query = supabase
      .from('jobs')
      .select('*', { count: 'exact' })
      .order('published_at', { ascending: false });

    if (filters?.status) {
        if (filters.status !== 'all') {
             query = query.eq('status', filters.status);
        }
    } else {
        query = query.eq('status', 'active');
    }

    if (filters?.search) {
      query = query.or(
        `title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
      );
    }

    if (filters?.category) {
      query = query.eq('category_id', filters.category);
    }

    if (filters?.job_type) {
      if (Array.isArray(filters.job_type) && filters.job_type.length > 0) {
        query = query.in('job_type', filters.job_type);
      } else if (typeof filters.job_type === 'string' && filters.job_type) {
        query = query.eq('job_type', filters.job_type);
      }
    }

    if (filters?.remote_type) {
      if (Array.isArray(filters.remote_type) && filters.remote_type.length > 0) {
        query = query.in('remote_type', filters.remote_type);
      } else if (typeof filters.remote_type === 'string' && filters.remote_type) {
        query = query.eq('remote_type', filters.remote_type);
      }
    }

    if (filters?.location_city) {
      query = query.eq('location_city', filters.location_city);
    }

    if (filters?.experience_level) {
      if (Array.isArray(filters.experience_level) && filters.experience_level.length > 0) {
        query = query.in('experience_level', filters.experience_level);
      } else if (typeof filters.experience_level === 'string' && filters.experience_level) {
        query = query.eq('experience_level', filters.experience_level);
      }
    }

    if (filters?.salary_min) {
      query = query.gte('salary_max', filters.salary_min);
    }

    if (filters?.salary_max) {
      query = query.lte('salary_min', filters.salary_max);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    if (filters?.sort === 'salary_desc') {
      query = query.order('salary_max', { ascending: false });
    } else if (filters?.sort === 'salary_asc') {
      query = query.order('salary_min', { ascending: true });
    }

    const { data, error, count } = await query;
    if (error) throw error;

    return {
      jobs: (data as Job[]) || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  },

  // Get single job by ID
  async getJobById(id: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;

    if (data && data.status === 'published') {
      await supabase
        .from('jobs')
        .update({ views_count: (data.views_count || 0) + 1 })
        .eq('id', id);
    }

    return data as Job | null;
  },

  // Create new job
  async createJob(job: Omit<Job, 'id' | 'created_at' | 'updated_at' | 'views_count' | 'applications_count'>) {
    const { data, error } = await supabase
      .from('jobs')
      .insert([job])
      .select()
      .single();

    if (error) throw error;
    return data as Job;
  },

  // Update job
  async updateJob(id: string, updates: Partial<Job>) {
    const { data, error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Job;
  },

  // Publish job
  async publishJob(id: string) {
    return this.updateJob(id, {
      status: 'published',
      published_at: new Date().toISOString(),
    });
  },

  // Delete job (soft delete)
  async deleteJob(id: string) {
    return this.updateJob(id, { status: 'archived' });
  },

  // Get user's jobs
  async getUserJobs(userId: string, status?: string) {
    let query = supabase
      .from('jobs')
      .select('*')
      .eq('poster_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Job[]) || [];
  },
};

// Job Applications Service
export const applicationsService = {
  // Get applications for a job
  async getJobApplications(jobId: string) {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as JobApplication[]) || [];
  },

  // Get user's applications
  async getUserApplications(userId: string, status?: string) {
    let query = supabase
      .from('job_applications')
      .select('*')
      .eq('applicant_id', userId);

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return (data as JobApplication[]) || [];
  },

  // Create application
  // Note: This now relies on the user's profile data being complete (Onboarding).
  // The 'cover_letter' and 'portfolio_url' fields are optional or omitted in the simplified flow.
  async createApplication(application: Omit<JobApplication, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('job_applications')
      .insert([application])
      .select()
      .single();

    if (error) throw error;
    return data as JobApplication;
  },

  // Update application status
  async updateApplicationStatus(
    id: string,
    status: JobApplication['status'],
    notes?: string
  ) {
    const updates: any = { status };
    if (notes !== undefined) {
      updates.notes = notes;
    }
    if (status !== 'pending') {
      updates.reviewed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('job_applications')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as JobApplication;
  },

  // Withdraw application
  async withdrawApplication(id: string) {
    return this.updateApplicationStatus(id, 'withdrawn');
  },
};

// Saved Jobs Service
export const savedJobsService = {
  // Get user's saved jobs
  async getSavedJobs(userId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('*, jobs(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as (SavedJob & { jobs: Job })[]) || [];
  },

  // Check if job is saved
  async isJobSaved(userId: string, jobId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  // Save job
  async saveJob(userId: string, jobId: string) {
    const { data, error } = await supabase
      .from('saved_jobs')
      .insert([{ user_id: userId, job_id: jobId }])
      .select()
      .single();

    if (error && error.code !== 'UNIQUE_VIOLATION') {
      throw error;
    }
    return data as SavedJob;
  },

  // Unsave job
  async unsaveJob(userId: string, jobId: string) {
    const { error } = await supabase
      .from('saved_jobs')
      .delete()
      .eq('user_id', userId)
      .eq('job_id', jobId);

    if (error) throw error;
  },
};

// Job Preferences Service
export const preferencesService = {
  // Get job preferences
  async getPreferences(userId: string) {
    const { data, error } = await supabase
      .from('job_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return (data as JobPreferences) || null;
  },

  // Create or update preferences
  async savePreferences(userId: string, preferences: Omit<JobPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>) {
    const existing = await this.getPreferences(userId);

    if (existing) {
      const { data, error } = await supabase
        .from('job_preferences')
        .update(preferences)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      return data as JobPreferences;
    } else {
      const { data, error } = await supabase
        .from('job_preferences')
        .insert([{ user_id: userId, ...preferences }])
        .select()
        .single();

      if (error) throw error;
      return data as JobPreferences;
    }
  },
};

// Candidate Service
export const candidateService = {
  async searchCandidates(filters: any = {}) {
    let query = supabase
      .from('profiles_jobseeker')
      .select('*');
      // .eq('status', 'active'); // Removed status check as column doesn't exist

    if (filters.skills && filters.skills.length > 0) {
      query = query.contains('skills', filters.skills);
    }

    if (filters.availability) {
      query = query.eq('availability', filters.availability);
    }

    if (filters.current_location_country) {
        query = query.eq('current_location_country', filters.current_location_country);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }
};