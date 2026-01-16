/*
  # Comprehensive Education System

  ## Overview
  Complete education platform for programs from kindergarten to PhD, scholarships, with interest tracking and admin management.

  ## New Tables

  ### `education_program_types`
  - `id` (uuid, primary key)
  - `name_en` (text) - Type name in English
  - `name_zh` (text) - Type name in Chinese
  - `category` (text) - Main category (early_childhood, primary, secondary, higher_education, professional, scholarship)
  - `icon` (text) - Icon name
  - `color` (text) - Display color
  - `order_index` (integer) - Display order
  - `created_at` (timestamptz)

  ### Enhanced `education_resources` (programs)
  - Add comprehensive program details
  - Institution information
  - Requirements and eligibility
  - Application deadlines
  - Document requirements
  - Contact information

  ### Enhanced `education_interests` (applications)
  - Add application status tracking
  - Personal information
  - Academic background
  - Document uploads
  - Admin notes
  - Status history

  ### `education_interest_documents`
  - `id` (uuid, primary key)
  - `interest_id` (uuid, foreign key)
  - `document_type` (text) - Type of document
  - `file_name` (text) - Original filename
  - `file_url` (text) - Storage URL
  - `file_size` (integer) - File size in bytes
  - `uploaded_at` (timestamptz)

  ### `education_interest_history`
  - `id` (uuid, primary key)
  - `interest_id` (uuid, foreign key)
  - `previous_status` (text)
  - `new_status` (text)
  - `changed_by` (uuid, foreign key to users)
  - `notes` (text)
  - `created_at` (timestamptz)

  ### `education_favorites`
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key)
  - `resource_id` (uuid, foreign key)
  - `created_at` (timestamptz)

  ## Security
  - Enable RLS on all tables
  - Public can view active programs
  - Authenticated users can submit interests
  - Admins can manage interests and update status
  - Users can view their own submissions
*/

-- Create education_program_types table
CREATE TABLE IF NOT EXISTS education_program_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en text NOT NULL,
  name_zh text NOT NULL,
  category text NOT NULL,
  icon text NOT NULL DEFAULT 'graduation-cap',
  color text NOT NULL DEFAULT 'blue',
  order_index integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT valid_category CHECK (category IN ('early_childhood', 'primary', 'secondary', 'higher_education', 'professional', 'scholarship', 'language'))
);

-- Enhance education_resources table
DO $$
BEGIN
  -- Program details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'title_zh') THEN
    ALTER TABLE education_resources ADD COLUMN title_zh text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'description_zh') THEN
    ALTER TABLE education_resources ADD COLUMN description_zh text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'program_type') THEN
    ALTER TABLE education_resources ADD COLUMN program_type text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'education_level') THEN
    ALTER TABLE education_resources ADD COLUMN education_level text;
  END IF;
  
  -- Institution information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'institution_name') THEN
    ALTER TABLE education_resources ADD COLUMN institution_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'institution_country') THEN
    ALTER TABLE education_resources ADD COLUMN institution_country text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'institution_city') THEN
    ALTER TABLE education_resources ADD COLUMN institution_city text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'institution_website') THEN
    ALTER TABLE education_resources ADD COLUMN institution_website text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'institution_logo') THEN
    ALTER TABLE education_resources ADD COLUMN institution_logo text;
  END IF;
  
  -- Program details
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'start_date') THEN
    ALTER TABLE education_resources ADD COLUMN start_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'end_date') THEN
    ALTER TABLE education_resources ADD COLUMN end_date date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'application_deadline') THEN
    ALTER TABLE education_resources ADD COLUMN application_deadline date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'duration_value') THEN
    ALTER TABLE education_resources ADD COLUMN duration_value integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'duration_unit') THEN
    ALTER TABLE education_resources ADD COLUMN duration_unit text DEFAULT 'months';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'schedule_type') THEN
    ALTER TABLE education_resources ADD COLUMN schedule_type text DEFAULT 'full_time';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'delivery_mode') THEN
    ALTER TABLE education_resources ADD COLUMN delivery_mode text DEFAULT 'in_person';
  END IF;
  
  -- Pricing
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'tuition_fee') THEN
    ALTER TABLE education_resources ADD COLUMN tuition_fee decimal(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'currency') THEN
    ALTER TABLE education_resources ADD COLUMN currency text DEFAULT 'CAD';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'scholarship_amount') THEN
    ALTER TABLE education_resources ADD COLUMN scholarship_amount decimal(10,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'financial_aid_available') THEN
    ALTER TABLE education_resources ADD COLUMN financial_aid_available boolean DEFAULT false;
  END IF;
  
  -- Requirements
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'eligibility_requirements') THEN
    ALTER TABLE education_resources ADD COLUMN eligibility_requirements text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'academic_requirements') THEN
    ALTER TABLE education_resources ADD COLUMN academic_requirements text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'language_requirements') THEN
    ALTER TABLE education_resources ADD COLUMN language_requirements jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'documents_required') THEN
    ALTER TABLE education_resources ADD COLUMN documents_required text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'age_requirements') THEN
    ALTER TABLE education_resources ADD COLUMN age_requirements text;
  END IF;
  
  -- Additional info
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'capacity') THEN
    ALTER TABLE education_resources ADD COLUMN capacity integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'spots_remaining') THEN
    ALTER TABLE education_resources ADD COLUMN spots_remaining integer;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'tags') THEN
    ALTER TABLE education_resources ADD COLUMN tags text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'images') THEN
    ALTER TABLE education_resources ADD COLUMN images text[] DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'contact_email') THEN
    ALTER TABLE education_resources ADD COLUMN contact_email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'contact_phone') THEN
    ALTER TABLE education_resources ADD COLUMN contact_phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'external_url') THEN
    ALTER TABLE education_resources ADD COLUMN external_url text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'views_count') THEN
    ALTER TABLE education_resources ADD COLUMN views_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'interest_count') THEN
    ALTER TABLE education_resources ADD COLUMN interest_count integer DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_resources' AND column_name = 'is_featured') THEN
    ALTER TABLE education_resources ADD COLUMN is_featured boolean DEFAULT false;
  END IF;
END $$;

-- Enhance education_interests table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'status') THEN
    ALTER TABLE education_interests ADD COLUMN status text DEFAULT 'submitted';
  END IF;
  
  -- Personal information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'full_name') THEN
    ALTER TABLE education_interests ADD COLUMN full_name text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'email') THEN
    ALTER TABLE education_interests ADD COLUMN email text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'phone') THEN
    ALTER TABLE education_interests ADD COLUMN phone text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'date_of_birth') THEN
    ALTER TABLE education_interests ADD COLUMN date_of_birth date;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'nationality') THEN
    ALTER TABLE education_interests ADD COLUMN nationality text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'current_location') THEN
    ALTER TABLE education_interests ADD COLUMN current_location text;
  END IF;
  
  -- Academic background
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'current_education_level') THEN
    ALTER TABLE education_interests ADD COLUMN current_education_level text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'current_institution') THEN
    ALTER TABLE education_interests ADD COLUMN current_institution text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'field_of_study') THEN
    ALTER TABLE education_interests ADD COLUMN field_of_study text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'gpa') THEN
    ALTER TABLE education_interests ADD COLUMN gpa text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'language_proficiency') THEN
    ALTER TABLE education_interests ADD COLUMN language_proficiency jsonb DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'work_experience') THEN
    ALTER TABLE education_interests ADD COLUMN work_experience text;
  END IF;
  
  -- Application specifics
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'motivation') THEN
    ALTER TABLE education_interests ADD COLUMN motivation text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'additional_info') THEN
    ALTER TABLE education_interests ADD COLUMN additional_info text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'preferred_start_date') THEN
    ALTER TABLE education_interests ADD COLUMN preferred_start_date date;
  END IF;
  
  -- Admin management
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'admin_notes') THEN
    ALTER TABLE education_interests ADD COLUMN admin_notes text;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'reviewed_by') THEN
    ALTER TABLE education_interests ADD COLUMN reviewed_by uuid REFERENCES auth.users(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'reviewed_at') THEN
    ALTER TABLE education_interests ADD COLUMN reviewed_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'education_interests' AND column_name = 'updated_at') THEN
    ALTER TABLE education_interests ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Create education_interest_documents table
CREATE TABLE IF NOT EXISTS education_interest_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id uuid REFERENCES education_interests(id) ON DELETE CASCADE NOT NULL,
  document_type text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_size integer,
  mime_type text,
  uploaded_at timestamptz DEFAULT now()
);

-- Create education_interest_history table
CREATE TABLE IF NOT EXISTS education_interest_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  interest_id uuid REFERENCES education_interests(id) ON DELETE CASCADE NOT NULL,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES auth.users(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Create education_favorites table
CREATE TABLE IF NOT EXISTS education_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  resource_id uuid REFERENCES education_resources(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, resource_id)
);

-- Enable RLS
ALTER TABLE education_program_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_interest_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_interest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE education_favorites ENABLE ROW LEVEL SECURITY;

-- RLS for education_program_types
DROP POLICY IF EXISTS "Anyone can view program types" ON education_program_types;
CREATE POLICY "Anyone can view program types"
  ON education_program_types FOR SELECT
  TO public
  USING (true);

-- RLS for education_interest_documents
DROP POLICY IF EXISTS "Users can view own documents" ON education_interest_documents;
CREATE POLICY "Users can view own documents"
  ON education_interest_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM education_interests 
      WHERE education_interests.id = interest_id 
      AND education_interests.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can upload documents" ON education_interest_documents;
CREATE POLICY "Users can upload documents"
  ON education_interest_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM education_interests 
      WHERE education_interests.id = interest_id 
      AND education_interests.user_id = auth.uid()
    )
  );

-- RLS for education_interest_history
DROP POLICY IF EXISTS "Users can view own history" ON education_interest_history;
CREATE POLICY "Users can view own history"
  ON education_interest_history FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM education_interests 
      WHERE education_interests.id = interest_id 
      AND education_interests.user_id = auth.uid()
    )
  );

-- RLS for education_favorites
DROP POLICY IF EXISTS "Users can view own favorites" ON education_favorites;
CREATE POLICY "Users can view own favorites"
  ON education_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON education_favorites;
CREATE POLICY "Users can add favorites"
  ON education_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove favorites" ON education_favorites;
CREATE POLICY "Users can remove favorites"
  ON education_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_education_resources_program_type ON education_resources(program_type) WHERE program_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_education_resources_education_level ON education_resources(education_level) WHERE education_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_education_resources_institution ON education_resources(institution_name) WHERE institution_name IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_education_resources_deadline ON education_resources(application_deadline) WHERE application_deadline IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_education_interests_status ON education_interests(status) WHERE status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_education_interests_resource ON education_interests(resource_id);
CREATE INDEX IF NOT EXISTS idx_education_interests_user ON education_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_education_interest_documents_interest ON education_interest_documents(interest_id);
CREATE INDEX IF NOT EXISTS idx_education_favorites_user ON education_favorites(user_id);

-- Insert program types
INSERT INTO education_program_types (name_en, name_zh, category, icon, color, order_index) VALUES
  ('Kindergarten', '幼儿园', 'early_childhood', 'baby', 'pink', 1),
  ('Pre-School', '学前班', 'early_childhood', 'users', 'rose', 2),
  ('Primary School', '小学', 'primary', 'book-open', 'blue', 3),
  ('Middle School', '初中', 'secondary', 'book', 'green', 4),
  ('High School', '高中', 'secondary', 'graduation-cap', 'purple', 5),
  ('Undergraduate', '本科', 'higher_education', 'award', 'orange', 6),
  ('Master''s Degree', '硕士', 'higher_education', 'trophy', 'red', 7),
  ('PhD', '博士', 'higher_education', 'crown', 'yellow', 8),
  ('Scholarship', '奖学金', 'scholarship', 'dollar-sign', 'teal', 9),
  ('Language Course', '语言课程', 'language', 'globe', 'cyan', 10),
  ('Professional Training', '职业培训', 'professional', 'briefcase', 'gray', 11),
  ('Certificate Program', '证书课程', 'professional', 'file-text', 'slate', 12)
ON CONFLICT DO NOTHING;

-- Function to update interest count
CREATE OR REPLACE FUNCTION update_education_interest_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE education_resources
    SET interest_count = COALESCE(interest_count, 0) + 1
    WHERE id = NEW.resource_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE education_resources
    SET interest_count = GREATEST(0, COALESCE(interest_count, 0) - 1)
    WHERE id = OLD.resource_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for interest count
DROP TRIGGER IF EXISTS education_interest_count_trigger ON education_interests;
CREATE TRIGGER education_interest_count_trigger
  AFTER INSERT OR DELETE ON education_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_education_interest_count();

-- Function to track status changes
CREATE OR REPLACE FUNCTION track_interest_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO education_interest_history (interest_id, previous_status, new_status, changed_by, notes)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), NEW.admin_notes);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for status tracking
DROP TRIGGER IF EXISTS track_interest_status_trigger ON education_interests;
CREATE TRIGGER track_interest_status_trigger
  AFTER UPDATE ON education_interests
  FOR EACH ROW
  EXECUTE FUNCTION track_interest_status_change();