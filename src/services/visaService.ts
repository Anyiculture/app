import { supabase } from '../lib/supabase';
import { messagingService } from './messagingService';

export type VisaType = 'work_z' | 'student_x' | 'family_q' | 'family_s' | 'business_m' | 'other';
export type VisaStatus = 'draft' | 'submitted' | 'in_review' | 'documents_requested' | 'approved' | 'rejected';
export type DocumentType = 'passport' | 'photo' | 'invitation_letter' | 'work_permit' | 'admission_letter' | 'police_record' | 'other';

export interface VisaApplication {
  id: string;
  user_id: string;
  visa_type: VisaType;
  status: VisaStatus;
  full_name?: string;
  nationality_country?: string;
  nationality_province?: string;
  nationality_city?: string;
  date_of_birth?: string;
  passport_number?: string;
  passport_expiry?: string;
  current_country?: string;
  current_province?: string;
  current_city?: string;
  purpose_data: any;
  admin_notes?: string;
  decision_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
  conversation_id?: string;
  submitted_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VisaDocument {
  id: string;
  application_id: string;
  document_type: DocumentType;
  file_name: string;
  file_url: string;
  file_size?: number;
  mime_type?: string;
  is_required: boolean;
  uploaded_at: string;
}

export interface VisaApplicationHistory {
  id: string;
  application_id: string;
  previous_status?: string;
  new_status: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

export interface VisaDocumentRequest {
  id: string;
  application_id: string;
  document_type: string;
  description: string;
  requested_by: string;
  fulfilled: boolean;
  fulfilled_at?: string;
  created_at: string;
}

export const visaService = {
  async createApplication(visaType: VisaType): Promise<VisaApplication> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('visa_applications')
      .insert({
        user_id: user.id,
        visa_type: visaType,
        status: 'draft',
        purpose_data: {}
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getApplications(): Promise<VisaApplication[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getApplication(id: string): Promise<VisaApplication | null> {
    const { data, error } = await supabase
      .from('visa_applications')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async updateApplication(id: string, updates: Partial<VisaApplication>): Promise<VisaApplication> {
    const { data, error } = await supabase
      .from('visa_applications')
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

  async submitApplication(id: string): Promise<VisaApplication> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Update status to submitted
    const { data, error } = await supabase
      .from('visa_applications')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Create history entry
    await supabase
      .from('visa_application_history')
      .insert({
        application_id: id,
        previous_status: 'draft',
        new_status: 'submitted',
        changed_by: user.id,
        notes: 'Application submitted by user'
      });

    // Create conversation with admin using messagingService
    try {
      const { conversationId } = await messagingService.createConversationWithMessage({
        otherUserId: '00000000-0000-0000-0000-000000000000', // Admin system ID
        contextType: 'visa',
        contextId: id,
        relatedItemTitle: `Visa: ${data.visa_type}`,
        initialMessage: `Visa application (${data.visa_type}) has been submitted and is awaiting review.`
      });

      if (conversationId) {
        await supabase
          .from('visa_applications')
          .update({ conversation_id: conversationId })
          .eq('id', id);
      }
    } catch (err) {
      console.error('Failed to create conversation for visa application:', err);
      // Don't fail the whole submission if chat creation fails
    }

    return data;
  },

  async uploadDocument(
    applicationId: string,
    file: File,
    documentType: DocumentType
  ): Promise<VisaDocument> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${applicationId}/${documentType}_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('visa-documents')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('visa-documents')
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from('visa_documents')
      .insert({
        application_id: applicationId,
        document_type: documentType,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        mime_type: file.type,
        is_required: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getDocuments(applicationId: string): Promise<VisaDocument[]> {
    const { data, error } = await supabase
      .from('visa_documents')
      .select('*')
      .eq('application_id', applicationId)
      .order('uploaded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async deleteDocument(id: string): Promise<void> {
    const { error } = await supabase
      .from('visa_documents')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async deleteApplication(id: string): Promise<void> {
    const { error } = await supabase
      .from('visa_applications')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getAllApplications(filters?: { status?: VisaStatus }): Promise<VisaApplication[]> {
    // Use RPC to bypass RLS and get full details including profile info
    const { data, error } = await supabase.rpc('get_admin_visa_applications');
    
    if (error) {
      console.error('Error fetching visa applications via RPC:', error);
      throw error;
    }

    let applications = data || [];

    // Apply filters client-side since the RPC returns everything (it's efficient enough for now)
    if (filters?.status) {
      applications = applications.filter((app: any) => app.status === filters.status);
    }

    return applications;
  },

  async updateApplicationStatus(id: string, status: VisaStatus, notes?: string): Promise<VisaApplication> {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Update application
    const { data, error } = await supabase
      .from('visa_applications')
      .update({ 
        status, 
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id,
        admin_notes: notes,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update status error:', error);
      throw error;
    }

    // Create history entry
    const { error: historyError } = await supabase.from('visa_application_history').insert({
      application_id: id,
      new_status: status,
      changed_by: user?.id,
      notes: notes || `Status updated to ${status} by admin`
    });

    if (historyError) {
      console.error('Create history error:', historyError);
      // Don't throw, as status update succeeded
    }

    return data;
  },

  async verifyDocument(id: string, status: 'verified' | 'rejected', reason?: string): Promise<void> {
    const { error } = await supabase
      .from('visa_documents')
      .update({ 
        verified: status === 'verified',
        rejection_reason: reason 
      })
      .eq('id', id);

    if (error) throw error;
  },

  async getReviewHistory(applicationId: string): Promise<VisaApplicationHistory[]> {
    return this.getApplicationHistory(applicationId);
  },

  async getApplicationHistory(applicationId: string): Promise<VisaApplicationHistory[]> {
    const { data, error } = await supabase
      .from('visa_application_history')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getDocumentRequests(applicationId: string): Promise<VisaDocumentRequest[]> {
    const { data, error } = await supabase
      .from('visa_document_requests')
      .select('*')
      .eq('application_id', applicationId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  getRequiredDocuments(visaType: VisaType): DocumentType[] {
    const common: DocumentType[] = ['passport', 'photo'];

    switch (visaType) {
      case 'work_z':
        return [...common, 'work_permit', 'invitation_letter', 'police_record'];
      case 'student_x':
        return [...common, 'admission_letter', 'invitation_letter'];
      case 'family_q':
      case 'family_s':
        return [...common, 'invitation_letter'];
      case 'business_m':
        return [...common, 'invitation_letter'];
      default:
        return common;
    }
  }
};
