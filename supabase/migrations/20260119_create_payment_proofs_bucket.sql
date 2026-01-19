-- Create payment_proofs storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for payment_proofs
-- Public view (needed for admin panel to view images easily via public URL)
DROP POLICY IF EXISTS "Public View payment_proofs" ON storage.objects;
CREATE POLICY "Public View payment_proofs" ON storage.objects FOR SELECT USING ( bucket_id = 'payment_proofs' );

-- Authenticated users can upload
DROP POLICY IF EXISTS "Auth Upload payment_proofs" ON storage.objects;
CREATE POLICY "Auth Upload payment_proofs" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'payment_proofs' );

-- Users can only update/delete their own uploads
DROP POLICY IF EXISTS "Owner Update payment_proofs" ON storage.objects;
CREATE POLICY "Owner Update payment_proofs" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'payment_proofs' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Owner Delete payment_proofs" ON storage.objects;
CREATE POLICY "Owner Delete payment_proofs" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'payment_proofs' AND auth.uid() = owner );
