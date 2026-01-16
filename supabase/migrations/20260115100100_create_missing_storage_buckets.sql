-- Create storage buckets for onboarding flows if they don't exist
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('host-family-photos', 'host-family-photos', true),
  ('host-family-videos', 'host-family-videos', true),
  ('au-pair-photos', 'au-pair-photos', true),
  ('au-pair-videos', 'au-pair-videos', true),
  ('company-logos', 'company-logos', true),
  ('company-images', 'company-images', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for host-family-photos
DROP POLICY IF EXISTS "Public View host-family-photos" ON storage.objects;
CREATE POLICY "Public View host-family-photos" ON storage.objects FOR SELECT USING ( bucket_id = 'host-family-photos' );

DROP POLICY IF EXISTS "Auth Upload host-family-photos" ON storage.objects;
CREATE POLICY "Auth Upload host-family-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'host-family-photos' );

DROP POLICY IF EXISTS "Owner Update host-family-photos" ON storage.objects;
CREATE POLICY "Owner Update host-family-photos" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'host-family-photos' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete host-family-photos" ON storage.objects;
CREATE POLICY "Owner Delete host-family-photos" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'host-family-photos' AND auth.uid() = owner );

-- RLS Policies for host-family-videos
DROP POLICY IF EXISTS "Public View host-family-videos" ON storage.objects;
CREATE POLICY "Public View host-family-videos" ON storage.objects FOR SELECT USING ( bucket_id = 'host-family-videos' );

DROP POLICY IF EXISTS "Auth Upload host-family-videos" ON storage.objects;
CREATE POLICY "Auth Upload host-family-videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'host-family-videos' );

DROP POLICY IF EXISTS "Owner Update host-family-videos" ON storage.objects;
CREATE POLICY "Owner Update host-family-videos" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'host-family-videos' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete host-family-videos" ON storage.objects;
CREATE POLICY "Owner Delete host-family-videos" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'host-family-videos' AND auth.uid() = owner );

-- RLS Policies for au-pair-photos
DROP POLICY IF EXISTS "Public View au-pair-photos" ON storage.objects;
CREATE POLICY "Public View au-pair-photos" ON storage.objects FOR SELECT USING ( bucket_id = 'au-pair-photos' );

DROP POLICY IF EXISTS "Auth Upload au-pair-photos" ON storage.objects;
CREATE POLICY "Auth Upload au-pair-photos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'au-pair-photos' );

DROP POLICY IF EXISTS "Owner Update au-pair-photos" ON storage.objects;
CREATE POLICY "Owner Update au-pair-photos" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'au-pair-photos' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete au-pair-photos" ON storage.objects;
CREATE POLICY "Owner Delete au-pair-photos" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'au-pair-photos' AND auth.uid() = owner );

-- RLS Policies for au-pair-videos
DROP POLICY IF EXISTS "Public View au-pair-videos" ON storage.objects;
CREATE POLICY "Public View au-pair-videos" ON storage.objects FOR SELECT USING ( bucket_id = 'au-pair-videos' );

DROP POLICY IF EXISTS "Auth Upload au-pair-videos" ON storage.objects;
CREATE POLICY "Auth Upload au-pair-videos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'au-pair-videos' );

DROP POLICY IF EXISTS "Owner Update au-pair-videos" ON storage.objects;
CREATE POLICY "Owner Update au-pair-videos" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'au-pair-videos' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete au-pair-videos" ON storage.objects;
CREATE POLICY "Owner Delete au-pair-videos" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'au-pair-videos' AND auth.uid() = owner );

-- RLS Policies for company-logos
DROP POLICY IF EXISTS "Public View company-logos" ON storage.objects;
CREATE POLICY "Public View company-logos" ON storage.objects FOR SELECT USING ( bucket_id = 'company-logos' );

DROP POLICY IF EXISTS "Auth Upload company-logos" ON storage.objects;
CREATE POLICY "Auth Upload company-logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'company-logos' );

DROP POLICY IF EXISTS "Owner Update company-logos" ON storage.objects;
CREATE POLICY "Owner Update company-logos" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'company-logos' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete company-logos" ON storage.objects;
CREATE POLICY "Owner Delete company-logos" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'company-logos' AND auth.uid() = owner );

-- RLS Policies for company-images
DROP POLICY IF EXISTS "Public View company-images" ON storage.objects;
CREATE POLICY "Public View company-images" ON storage.objects FOR SELECT USING ( bucket_id = 'company-images' );

DROP POLICY IF EXISTS "Auth Upload company-images" ON storage.objects;
CREATE POLICY "Auth Upload company-images" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'company-images' );

DROP POLICY IF EXISTS "Owner Update company-images" ON storage.objects;
CREATE POLICY "Owner Update company-images" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'company-images' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete company-images" ON storage.objects;
CREATE POLICY "Owner Delete company-images" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'company-images' AND auth.uid() = owner );
