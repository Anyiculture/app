-- =====================================================
-- ADMIN PAYMENT MANAGEMENT - SOFT DELETE & CLEANUP
-- Date: 2026-03-11
-- Purpose:
-- 1. Add soft delete support to payments table
-- 2. Create indexes for efficient filtering
-- 3. Perform one-time hard delete cleanup of test data
-- 4. Keep only ONE approved transaction for POC
-- =====================================================

-- =====================================================
-- PART 1: Add soft delete columns to payments table
-- =====================================================

ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES auth.users(id);
ALTER TABLE payments ADD COLUMN IF NOT EXISTS deletion_reason text;

-- Create indexes for efficient active/deleted filtering
CREATE INDEX IF NOT EXISTS idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX IF NOT EXISTS idx_payments_active ON payments(created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_payments_deleted ON payments(deleted_at DESC) WHERE deleted_at IS NOT NULL;

-- =====================================================
-- PART 2: One-time hard delete cleanup
-- IMPORTANT: This keeps ONLY ONE approved transaction
-- =====================================================

-- First, identify which approved transaction to keep (most recent one)
DO $$
DECLARE
  v_keep_id uuid;
  v_deleted_count integer;
  v_kept_record record;
BEGIN
  -- Find the most recent approved payment to keep
  SELECT id INTO v_keep_id
  FROM payments
  WHERE status = 'approved' OR status = 'confirmed'
  ORDER BY created_at DESC
  LIMIT 1;

  -- Log what we're keeping
  IF v_keep_id IS NOT NULL THEN
    SELECT * INTO v_kept_record
    FROM payments
    WHERE id = v_keep_id;
    
    RAISE NOTICE 'KEEPING payment ID: % - Status: %, Amount: %, Created: %', 
      v_keep_id, 
      v_kept_record.status, 
      v_kept_record.amount,
      v_kept_record.created_at;
  ELSE
    RAISE NOTICE 'No approved payments found to keep';
  END IF;

  -- Hard delete ALL payments EXCEPT the one we're keeping
  WITH deleted AS (
    DELETE FROM payments
    WHERE id != COALESCE(v_keep_id, '00000000-0000-0000-0000-000000000000'::uuid)
    RETURNING id, status, amount
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted;

  RAISE NOTICE 'HARD DELETED % payment records (kept only 1 approved for POC)', v_deleted_count;

  -- Also clean up payment_submissions that are not needed
  -- Keep only submissions with status='approved' if any exist
  WITH deleted_submissions AS (
    DELETE FROM payment_submissions
    WHERE status != 'approved'
    AND deleted_at IS NULL  -- Only delete non-approved active ones
    RETURNING id
  )
  SELECT COUNT(*) INTO v_deleted_count FROM deleted_submissions;

  RAISE NOTICE 'HARD DELETED % non-approved payment submissions', v_deleted_count;
END $$;

-- =====================================================
-- PART 3: Update admin_delete_payment_submission function
-- to properly handle soft delete with audit trail
-- =====================================================

DROP FUNCTION IF EXISTS public.admin_delete_payment_submission(uuid);
CREATE OR REPLACE FUNCTION public.admin_delete_payment_submission(submission_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_image_url text;
  v_user_id uuid;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin_internal() THEN
    RAISE EXCEPTION 'Unauthorized: Admin access required';
  END IF;

  -- Get submission details for audit trail
  SELECT image_url, user_id INTO v_image_url, v_user_id
  FROM payment_submissions
  WHERE id = submission_id;

  -- Soft delete the payment submission (mark as deleted)
  UPDATE payment_submissions
  SET 
    deleted_at = now(),
    deleted_by = auth.uid(),
    updated_at = now()
  WHERE id = submission_id;

  -- Return success with audit info
  RETURN json_build_object(
    'success', true, 
    'submission_id', submission_id,
    'deleted', true,
    'deleted_at', now(),
    'deleted_by', auth.uid()
  );
END;
$$;

-- =====================================================
-- PART 4: Add function to get deleted payments
-- =====================================================

DROP FUNCTION IF EXISTS public.get_deleted_payments(integer, integer);
CREATE OR REPLACE FUNCTION public.get_deleted_payments(
  page_size integer DEFAULT 20,
  page_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  amount numeric,
  status text,
  plan_type text,
  method text,
  proof_url text,
  created_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  deletion_reason text,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offset integer;
BEGIN
  v_offset := page_offset;

  RETURN QUERY
  WITH deleted_data AS (
    SELECT 
      p.id,
      p.user_id,
      COALESCE(
        pr.full_name,
        hf.father_name || ' ' || hf.mother_name,
        ap.display_name,
        'Unknown User'
      )::text as full_name,
      COALESCE(pr.email, 'No Email')::text as email,
      p.amount,
      p.status,
      p.plan_type,
      p.method,
      p.proof_url,
      p.created_at,
      p.deleted_at,
      p.deleted_by,
      p.deletion_reason,
      COUNT(*) OVER()::bigint as total_count
    FROM payments p
    LEFT JOIN profiles pr ON p.user_id = pr.id
    LEFT JOIN host_family_profiles hf ON p.user_id = hf.user_id
    LEFT JOIN au_pair_profiles ap ON p.user_id = ap.user_id
    WHERE p.deleted_at IS NOT NULL
    ORDER BY p.deleted_at DESC
    LIMIT page_size
    OFFSET v_offset
  )
  SELECT * FROM deleted_data;
END;
$$;

-- =====================================================
-- PART 5: Add function to get deleted payment submissions
-- =====================================================

DROP FUNCTION IF EXISTS public.get_deleted_payment_submissions(integer, integer);
CREATE OR REPLACE FUNCTION public.get_deleted_payment_submissions(
  page_size integer DEFAULT 20,
  page_offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  amount numeric,
  status text,
  plan_type text,
  image_url text,
  created_at timestamptz,
  deleted_at timestamptz,
  deleted_by uuid,
  total_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_offset integer;
BEGIN
  v_offset := page_offset;

  RETURN QUERY
  WITH deleted_submissions AS (
    SELECT 
      ps.id,
      ps.user_id,
      COALESCE(
        pr.full_name,
        hf.father_name || ' ' || hf.mother_name,
        ap.display_name,
        'Unknown User'
      )::text as full_name,
      COALESCE(pr.email, 'No Email')::text as email,
      ps.amount,
      ps.status,
      ps.plan_type,
      ps.image_url,
      ps.created_at,
      ps.deleted_at,
      ps.deleted_by,
      COUNT(*) OVER()::bigint as total_count
    FROM payment_submissions ps
    LEFT JOIN profiles pr ON ps.user_id = pr.id
    LEFT JOIN host_family_profiles hf ON ps.user_id = hf.user_id
    LEFT JOIN au_pair_profiles ap ON ps.user_id = ap.user_id
    WHERE ps.deleted_at IS NOT NULL
    ORDER BY ps.deleted_at DESC
    LIMIT page_size
    OFFSET v_offset
  )
  SELECT * FROM deleted_submissions;
END;
$$;

-- =====================================================
-- PART 6: Update existing queries to exclude deleted
-- =====================================================

-- Note: The frontend service already filters by checking deleted_at IS NULL
-- in getPaymentSubmissions and getTransactions queries.
-- No additional changes needed as the existing SQL handles it.

-- =====================================================
-- SUMMARY
-- =====================================================
-- ✅ Added deleted_at, deleted_by, deletion_reason to payments table
-- ✅ Created indexes for efficient filtering
-- ✅ Performed one-time hard delete (kept only 1 approved payment)
-- ✅ Updated admin_delete_payment_submission for proper soft delete
-- ✅ Added get_deleted_payments function
-- ✅ Added get_deleted_payment_submissions function
-- ✅ Maintains full audit trail for deleted records
