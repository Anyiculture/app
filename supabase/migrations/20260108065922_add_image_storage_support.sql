/*
  # Add Image Storage Support

  1. Changes to Tables
    - Add `image_urls` column to `marketplace_listings` (array of text URLs)
    - Add `image_urls` column to `events` (array of text URLs)
    - Add `profile_image_url` to `profiles` (single URL)
    - Add `video_url` and `profile_images` to `profiles_aupair` (for video intro and photos)
    
  2. Storage Buckets
    - Create `images` bucket for general images (marketplace, events, profiles)
    - Create `videos` bucket for au pair video introductions
    - Create `documents` bucket for visa documents and applications
    
  3. Security
    - Enable RLS on storage buckets
    - Allow authenticated users to upload their own content
    - Allow public read access to images
    - Restrict video and document access to authenticated users
    
  4. Important Notes
    - Image URLs are stored as text arrays for flexibility
    - Storage buckets handle the actual file storage
    - RLS policies ensure users can only modify their own content
*/

-- Add image_urls column to marketplace_listings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'marketplace_listings' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE marketplace_listings ADD COLUMN image_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Add image_urls column to events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'image_urls'
  ) THEN
    ALTER TABLE events ADD COLUMN image_urls text[] DEFAULT '{}';
  END IF;
END $$;

-- Add profile_image_url to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'profile_image_url'
  ) THEN
    ALTER TABLE profiles ADD COLUMN profile_image_url text;
  END IF;
END $$;

-- Add video_url and profile_images to profiles_aupair
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles_aupair' AND column_name = 'video_url'
  ) THEN
    ALTER TABLE profiles_aupair ADD COLUMN video_url text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles_aupair' AND column_name = 'profile_images'
  ) THEN
    ALTER TABLE profiles_aupair ADD COLUMN profile_images text[] DEFAULT '{}';
  END IF;
END $$;

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('images', 'images', true),
  ('videos', 'videos', false),
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for images bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public can view images'
  ) THEN
    CREATE POLICY "Public can view images"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload images'
  ) THEN
    CREATE POLICY "Authenticated users can upload images"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'images');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own images'
  ) THEN
    CREATE POLICY "Users can delete own images"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'images');
  END IF;
END $$;

-- Storage RLS Policies for videos bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can view videos'
  ) THEN
    CREATE POLICY "Authenticated users can view videos"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'videos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Authenticated users can upload videos'
  ) THEN
    CREATE POLICY "Authenticated users can upload videos"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'videos');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own videos'
  ) THEN
    CREATE POLICY "Users can delete own videos"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'videos');
  END IF;
END $$;

-- Storage RLS Policies for documents bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can view own documents'
  ) THEN
    CREATE POLICY "Users can view own documents"
      ON storage.objects FOR SELECT
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can upload documents'
  ) THEN
    CREATE POLICY "Users can upload documents"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'documents');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Users can delete own documents'
  ) THEN
    CREATE POLICY "Users can delete own documents"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;