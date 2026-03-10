-- Verification Script for Admin Dashboard Fixes
-- Run this AFTER applying the migration to verify everything works correctly

-- =====================================================
-- 1. Verify blocked_emails table was created
-- =====================================================

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocked_emails')
        THEN '✅ blocked_emails table exists'
        ELSE '❌ blocked_emails table MISSING'
    END AS check_result;

-- Check columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'blocked_emails'
ORDER BY ordinal_position;

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'blocked_emails';

-- =====================================================
-- 2. Verify updated functions exist
-- =====================================================

SELECT 
    routine_name,
    CASE 
        WHEN routine_name = 'get_admin_dashboard_stats' THEN '✅ Stats function updated'
        WHEN routine_name = 'admin_delete_user' THEN '✅ Delete user function updated'
        WHEN routine_name= 'admin_ban_user' THEN '✅ Ban user function created'
        WHEN routine_name = 'admin_delete_payment_submission' THEN '✅ Delete payment function created'
        WHEN routine_name = 'is_email_blocked' THEN '✅ Email blocked check created'
        ELSE 'Function check'
    END AS status
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
    'get_admin_dashboard_stats',
    'admin_delete_user',
    'admin_ban_user',
    'admin_delete_payment_submission',
    'is_email_blocked'
)
ORDER BY routine_name;

-- =====================================================
-- 3. Test get_admin_dashboard_stats function
-- =====================================================

-- This should return JSON with all stats
SELECT get_admin_dashboard_stats() as dashboard_stats;

-- Extract individual counts from the JSON
SELECT 
    get_admin_dashboard_stats()->>'totalUsers' as total_users,
    get_admin_dashboard_stats()->>'totalAuPairs' as total_au_pairs,
    get_admin_dashboard_stats()->>'totalHostFamilies' as total_host_families,
    get_admin_dashboard_stats()->>'pendingPaymentSubmissions' as pending_payments;

-- =====================================================
-- 4. Verify RLS policies on blocked_emails
-- =====================================================

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'blocked_emails'
ORDER BY policyname;

-- =====================================================
-- 5. Check performance indexes were created
-- =====================================================

SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes
WHERE tablename IN ('profiles', 'au_pair_profiles', 'host_family_profiles', 'payment_submissions')
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- =====================================================
-- 6. Manual count verification (compare with dashboard stats)
-- =====================================================

-- Active users count (should match dashboard)
SELECT count(*) as active_users_count
FROM profiles
WHERE is_banned IS NOT TRUE
AND deleted_at IS NULL;

-- Active au pairs count
SELECT count(*) as active_au_pairs_count
FROM au_pair_profiles
WHERE profile_status = 'active';

-- Active host families count
SELECT count(*) as active_host_families_count
FROM host_family_profiles
WHERE profile_status = 'active';

-- Pending payments(not deleted)
SELECT count(*) as pending_payments_count
FROM payment_submissions
WHERE status = 'pending'
AND deleted_at IS NULL;

-- =====================================================
-- 7. Test email blocking functions
-- =====================================================

-- Test is_email_blocked function(should return false for non-blocked email)
SELECT is_email_blocked('test@example.com') as is_blocked;

-- Insert a test blocked email
INSERT INTO blocked_emails (email, reason, blocked_by, original_user_id)
VALUES ('blocked@example.com', 'test_block', auth.uid(), NULL)
ON CONFLICT (email_hash) DO NOTHING;

-- Test again (should return true now)
SELECT is_email_blocked('blocked@example.com') as is_now_blocked;

-- Clean up test
DELETE FROM blocked_emails WHERE email = 'blocked@example.com';

-- =====================================================
-- 8. Test admin_ban_user function(optional - use test user)
-- =====================================================

-- Uncomment to test (replace WITH_A_TEST_USER_ID)
/*
SELECT admin_ban_user('YOUR_TEST_USER_ID', true) as ban_result;
-- Should return: {"success": true, "user_id": "...", "banned": true}

-- Check if user was banned
SELECT id, is_banned FROM profiles WHERE id = 'YOUR_TEST_USER_ID';

-- Check if email was added to blocked list
SELECT * FROM blocked_emails WHERE original_user_id = 'YOUR_TEST_USER_ID';

-- To unban:
SELECT admin_ban_user('YOUR_TEST_USER_ID', false) as unban_result;
*/

-- =====================================================
-- 9. Summary checks
-- =====================================================

SELECT 
    'blocked_emails table' as component,
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'blocked_emails')
         THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'get_admin_dashboard_stats' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_admin_dashboard_stats')
         THEN '✅ Updated' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'admin_ban_user function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname= 'admin_ban_user')
         THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'admin_delete_user function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_delete_user')
         THEN '✅ Updated' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'admin_delete_payment_submission function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'admin_delete_payment_submission')
         THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'is_email_blocked function' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_email_blocked')
         THEN '✅ Created' ELSE '❌ Missing' END as status
UNION ALL
SELECT 
    'Performance indexes' as component,
    CASE WHEN EXISTS (SELECT 1 FROM pg_indexes WHERE indexname= 'idx_profiles_banned_deleted')
         THEN '✅ Created' ELSE '❌ Missing' END as status;

-- =====================================================
-- End of Verification Script
-- =====================================================
