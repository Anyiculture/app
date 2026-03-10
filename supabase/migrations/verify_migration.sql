-- Verify Migration Applied Successfully
-- Run this in Supabase SQL Editor to confirm all changes are in place

-- 1. Check if trigger exists
SELECT 
    tgname as trigger_name,
    CASE WHEN tgname = 'on_payment_approved' THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_trigger 
WHERE tgname = 'on_payment_approved';

-- 2. Check payment_submissions columns
SELECT 
    column_name,
    data_type,
    '✅ EXISTS' as status
FROM information_schema.columns 
WHERE table_name = 'payment_submissions' 
AND column_name IN ('deleted_at', 'deleted_by')
ORDER BY column_name;

-- 3. Check profiles columns
SELECT 
    column_name,
    data_type,
    '✅ EXISTS' as status
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN (
    'host_family_subscription_status',
    'host_family_subscription_start',
    'host_family_subscription_end',
    'au_pair_subscription_start',
    'au_pair_subscription_end'
)
ORDER BY column_name;

-- 4. Check indexes
SELECT 
    indexname,
    '✅ EXISTS' as status
FROM pg_indexes 
WHERE tablename IN ('notifications', 'payment_submissions')
AND indexname IN ('idx_notifications_user_unread', 'idx_payment_submissions_deleted');

-- 5. Check RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    '✅ EXISTS' as status
FROM pg_policies 
WHERE tablename = 'payment_submissions'
AND policyname LIKE '%delete%' OR policyname LIKE '%archive%';

-- 6. Check if function exists
SELECT 
    routine_name,
    '✅ EXISTS' as status
FROM information_schema.routines 
WHERE routine_name IN ('notify_user_payment_approved', 'review_payment_submission');

-- Summary
SELECT 'Migration Verification Complete' as status;
