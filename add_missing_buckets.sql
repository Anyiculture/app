-- Add missing storage buckets
-- Run this in Supabase SQL Editor

-- 1. Create ai-generated-images bucket (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ai-generated-images',
  'ai-generated-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Create profile-photos bucket if needed (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 3. Create education-images bucket if needed (Public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'education-images',
  'education-images',
  true,
  10485760, -- 10MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for ai-generated-images bucket
CREATE POLICY "Public can view AI images" ON storage.objects
FOR SELECT USING (bucket_id = 'ai-generated-images');

CREATE POLICY "Authenticated users can upload AI images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'ai-generated-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update AI images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'ai-generated-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete AI images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'ai-generated-images' AND
  auth.role() = 'authenticated'
);

-- Create RLS policies for profile-photos bucket
CREATE POLICY "Public can view profile photos" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-photos');

CREATE POLICY "Authenticated users can upload profile photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update profile photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete profile photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile-photos' AND
  auth.role() = 'authenticated'
);

-- Create RLS policies for education-images bucket
CREATE POLICY "Public can view education images" ON storage.objects
FOR SELECT USING (bucket_id = 'education-images');

CREATE POLICY "Authenticated users can upload education images" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'education-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can update education images" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'education-images' AND
  auth.role() = 'authenticated'
);

CREATE POLICY "Users can delete education images" ON storage.objects
FOR DELETE USING (
  bucket_id = 'education-images' AND
  auth.role() = 'authenticated'
);

-- Verify all buckets
SELECT id, name, public, file_size_limit 
FROM storage.buckets 
WHERE id IN ('ai-generated-images', 'profile-photos', 'education-images')
ORDER BY name;
