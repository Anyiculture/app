/*
  # Add Company License Upload Support

  1. Storage
    - Create 'company-licenses' bucket for storing business licenses
    - Set up RLS policies for secure access

  2. Schema Changes
    - Add 'company_license_url' column to 'profiles_employer' table
*/

-- Create company-licenses storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('company-licenses', 'company-licenses', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for company-licenses

-- Public view (needed for admin verification)
DROP POLICY IF EXISTS "Public View company-licenses" ON storage.objects;
CREATE POLICY "Public View company-licenses" ON storage.objects FOR SELECT USING ( bucket_id = 'company-licenses' );

-- Authenticated users can upload
DROP POLICY IF EXISTS "Auth Upload company-licenses" ON storage.objects;
CREATE POLICY "Auth Upload company-licenses" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'company-licenses' );

-- Users can only update/delete their own uploads
DROP POLICY IF EXISTS "Owner Update company-licenses" ON storage.objects;
CREATE POLICY "Owner Update company-licenses" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'company-licenses' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete company-licenses" ON storage.objects;
CREATE POLICY "Owner Delete company-licenses" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'company-licenses' AND auth.uid() = owner );

-- Add company_license_url to profiles_employer
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles_employer' AND column_name = 'company_license_url') THEN
        ALTER TABLE profiles_employer ADD COLUMN company_license_url text;
    END IF;
END $$;
