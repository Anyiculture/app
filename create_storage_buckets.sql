-- Create Storage Buckets for Anyiculture App
-- Run this in Supabase SQL Editor

-- 1. Create profile-photos bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create ai-generated-images bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-generated-images',
  'ai-generated-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create marketplace-images bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'marketplace-images',
  'marketplace-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Create event-images bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'event-images',
  'event-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 5. Create education-images bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'education-images',
  'education-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 6. Create visa-documents bucket (Private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'visa-documents',
  'visa-documents',
  false, -- Private bucket
  52428800, -- 50MB in bytes
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for storage buckets

-- Profile photos: Anyone can view, only authenticated users can upload their own
CREATE POLICY "Public can view profile photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update their own profile photos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete their own profile photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated'
);

-- AI Generated Images: Public read, authenticated upload
CREATE POLICY "Public can view AI images"
ON storage.objects FOR SELECT
USING (bucket_id = 'ai-generated-images');

CREATE POLICY "Authenticated users can upload AI images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ai-generated-images' AND
  auth.role() = 'authenticated'
);

-- Marketplace Images: Public read, authenticated upload
CREATE POLICY "Public can view marketplace images"
ON storage.objects FOR SELECT
USING (bucket_id = 'marketplace-images');

CREATE POLICY "Authenticated users can upload marketplace images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'marketplace-images' AND
  auth.role() = 'authenticated'
);

-- Event Images: Public read, authenticated upload
CREATE POLICY "Public can view event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

CREATE POLICY "Authenticated users can upload event images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'event-images' AND
  auth.role() = 'authenticated'
);

-- Education Images: Public read, authenticated upload
CREATE POLICY "Public can view education images"
ON storage.objects FOR SELECT
USING (bucket_id = 'education-images');

CREATE POLICY "Authenticated users can upload education images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'education-images' AND
  auth.role() = 'authenticated'
);

-- Visa Documents: Private - only owner can access
CREATE POLICY "Users can view their own visa documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'visa-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload their own visa documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'visa-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own visa documents"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'visa-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own visa documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'visa-documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Verify buckets were created
SELECT id, name, public, file_size_limit, created_at
FROM storage.buckets
ORDER BY name;
