/*
  # Create Marketplace Images Storage Bucket

  ## Overview
  Creates a public storage bucket for marketplace item images.

  ## Storage Buckets
  - `marketplace-images` - Public bucket for marketplace listing photos

  ## Security
  - Public read access for all images
  - Authenticated users can upload images
  - Users can update/delete their own images
*/

-- Create marketplace-images bucket if it doesn't exist
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public)
  VALUES ('marketplace-images', 'marketplace-images', true)
  ON CONFLICT (id) DO NOTHING;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public read access for marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own marketplace images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own marketplace images" ON storage.objects;

-- Allow public read access
CREATE POLICY "Public read access for marketplace images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'marketplace-images');

-- Allow authenticated users to upload
CREATE POLICY "Authenticated users can upload marketplace images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'marketplace-images');

-- Allow users to update their own images
CREATE POLICY "Users can update own marketplace images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own marketplace images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'marketplace-images' AND auth.uid()::text = (storage.foldername(name))[1]);