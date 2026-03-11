-- =====================================================
-- PRE-MIGRATION VERIFICATION SCRIPT
-- Run this FIRST to see current state before applying migration
-- =====================================================

-- Check 1: How many payments exist currently?
SELECT '=== PAYMENTS TABLE STATUS ===' as section;
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
  COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count
FROM payments;

-- Check 2: Show all payments (to see what will be kept/deleted)
SELECT 
  id,
  status,
  amount,
  plan_type,
  created_at,
  CASE 
    WHEN deleted_at IS NOT NULL THEN 'ALREADY DELETED'
    ELSE 'ACTIVE'
  END as deletion_status
FROM payments
ORDER BY created_at DESC;

-- Check 3: Payment submissions status
SELECT '=== PAYMENT SUBMISSIONS STATUS ===' as section;
SELECT 
  status,
  COUNT(*) as total,
  COUNT(CASE WHEN deleted_at IS NOT NULL THEN 1 END) as already_deleted
FROM payment_submissions
GROUP BY status;

-- Check 4: Verify if soft delete columns already exist
SELECT '=== CHECKING EXISTING COLUMNS ===' as section;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('deleted_at', 'deleted_by', 'deletion_reason')
ORDER BY ordinal_position;

-- Check 5: Verify if functions already exist
SELECT '=== CHECKING EXISTING FUNCTIONS ===' as section;
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_deleted_payments',
  'get_deleted_payment_submissions',
  'admin_delete_payment_submission'
)
ORDER BY routine_name;

-- Check 6: Show which payment would be kept (most recent approved)
SELECT '=== PAYMENT THAT WILL BE KEPT ===' as section;
SELECT 
  id,
  status,
  amount,
  plan_type,
  created_at,
  '✅ THIS WILL BE KEPT' as action
FROM payments
WHERE status IN ('approved', 'confirmed')
ORDER BY created_at DESC
LIMIT 1;

-- =====================================================
-- POST-MIGRATION VERIFICATION (Run AFTER applying migration)
-- =====================================================

-- After migration, run this to verify success:
/*
SELECT '=== POST-MIGRATION STATUS ===' as section;

-- Should show only 1 payment remaining
SELECT COUNT(*) as remaining_payments FROM payments;

-- Verify soft delete columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'payments' 
AND column_name IN ('deleted_at', 'deleted_by', 'deletion_reason');

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_name IN (
  'get_deleted_payments',
  'get_deleted_payment_submissions',
  'admin_delete_payment_submission'
);

-- Test get_deleted_payments function
SELECT * FROM get_deleted_payments(10, 0);
*/
