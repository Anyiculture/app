/*
  # Rebuild Visa Center Schema

  1. Changes
    - Drop existing visa tables
    - Create new comprehensive visa center schema
    - Add proper RLS policies
    - Add indexes for performance

  2. Tables
    - visa_applications: Main application data
    - visa_documents: Document uploads
    - visa_application_history: Audit trail
    - visa_document_requests: Admin document requests
*/

-- Drop existing tables
DROP TABLE IF EXISTS visa_document_requests CASCADE;
DROP TABLE IF EXISTS visa_application_history CASCADE;
DROP TABLE IF EXISTS visa_documents CASCADE;
DROP TABLE IF EXISTS visa_applications CASCADE;

-- Visa applications table
CREATE TABLE visa_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  visa_type text NOT NULL CHECK (visa_type IN ('work_z', 'student_x', 'family_q', 'family_s', 'business_m', 'other')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'in_review', 'documents_requested', 'approved', 'rejected')),
  
  -- Personal information
  full_name text,
  nationality_country text,
  nationality_province text,
  nationality_city text,
  date_of_birth date,
  passport_number text,
  passport_expiry date,
  current_country text,
  current_province text,
  current_city text,
  
  -- Purpose and background (JSON for flexibility)
  purpose_data jsonb DEFAULT '{}'::jsonb,
  
  -- Admin notes and decision
  admin_notes text,
  decision_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  
  -- Conversation reference
  conversation_id uuid,
  
  -- Timestamps
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Visa documents table
CREATE TABLE visa_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES visa_applications(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL CHECK (document_type IN ('passport', 'photo', 'invitation_letter', 'work_permit', 'admission_letter', 'police_record', 'other')),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  is_required boolean DEFAULT true,
  uploaded_at timestamptz DEFAULT now()
);

-- Application history for audit trail
CREATE TABLE visa_application_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES visa_applications(id) ON DELETE CASCADE NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Document requests from admin
CREATE TABLE visa_document_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid REFERENCES visa_applications(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  description text NOT NULL,
  requested_by uuid REFERENCES profiles(id) NOT NULL,
  fulfilled boolean DEFAULT false,
  fulfilled_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE visa_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_application_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE visa_document_requests ENABLE ROW LEVEL SECURITY;

-- Policies for visa_applications
CREATE POLICY "Users can view own applications"
  ON visa_applications FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own applications"
  ON visa_applications FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft applications"
  ON visa_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft')
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update documents_requested applications"
  ON visa_applications FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'documents_requested')
  WITH CHECK (auth.uid() = user_id AND status = 'documents_requested');

-- Policies for visa_documents
CREATE POLICY "Users can view own documents"
  ON visa_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visa_applications
      WHERE visa_applications.id = visa_documents.application_id
      AND visa_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own documents"
  ON visa_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM visa_applications
      WHERE visa_applications.id = visa_documents.application_id
      AND visa_applications.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own documents"
  ON visa_documents FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visa_applications
      WHERE visa_applications.id = visa_documents.application_id
      AND visa_applications.user_id = auth.uid()
      AND visa_applications.status IN ('draft', 'documents_requested')
    )
  );

-- Policies for visa_application_history
CREATE POLICY "Users can view own history"
  ON visa_application_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visa_applications
      WHERE visa_applications.id = visa_application_history.application_id
      AND visa_applications.user_id = auth.uid()
    )
  );

-- Policies for visa_document_requests
CREATE POLICY "Users can view own document requests"
  ON visa_document_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM visa_applications
      WHERE visa_applications.id = visa_document_requests.application_id
      AND visa_applications.user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX idx_visa_applications_user_id ON visa_applications(user_id);
CREATE INDEX idx_visa_applications_status ON visa_applications(status);
CREATE INDEX idx_visa_documents_application_id ON visa_documents(application_id);
CREATE INDEX idx_visa_application_history_application_id ON visa_application_history(application_id);
CREATE INDEX idx_visa_document_requests_application_id ON visa_document_requests(application_id);
