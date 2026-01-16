-- Add proof_url to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS proof_url TEXT;

-- Update payments status check to include 'unverified' if needed, or just use 'pending'
-- Existing checks: status IN ('pending', 'confirmed', 'failed')
-- Pending is fine for "Unverified".

-- Allow authenticated users to insert their own payments
DROP POLICY IF EXISTS "Users can insert own payments" ON payments;
CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own payments
DROP POLICY IF EXISTS "Users can view own payments" ON payments;
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Create storage bucket for payment proofs if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment_proofs', 'payment_proofs', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Users can upload payment proofs" ON storage.objects;
CREATE POLICY "Users can upload payment proofs" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'payment_proofs' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

DROP POLICY IF EXISTS "Users can view own payment proofs" ON storage.objects;
CREATE POLICY "Users can view own payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment_proofs' AND
        auth.uid() = (storage.foldername(name))[1]::uuid
    );

-- Admin can view all proofs
DROP POLICY IF EXISTS "Admins can view all payment proofs" ON storage.objects;
CREATE POLICY "Admins can view all payment proofs" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'payment_proofs' AND
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
    );
