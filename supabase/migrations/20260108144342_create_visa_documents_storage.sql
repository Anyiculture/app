/*
  # Create Visa Documents Storage Bucket

  1. Storage Bucket
    - Create bucket for visa document uploads
    - Enable public access with RLS

  2. Security
    - Users can upload to own folders only
    - Users can view own documents
    - Public URLs enabled for download
*/

-- Create storage bucket for visa documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('visa-documents', 'visa-documents', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload documents to their own folder
CREATE POLICY "Users can upload own visa documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'visa-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own documents
CREATE POLICY "Users can view own visa documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'visa-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own documents
CREATE POLICY "Users can delete own visa documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'visa-documents' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
