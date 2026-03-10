# 🚀 MIGRATION EXECUTION GUIDE

**Purpose:** Apply the payment soft delete and one-time cleanup migration  
**File:** `supabase/migrations/20260311_payment_soft_delete_and_cleanup.sql`  
**Estimated Time:** 5 minutes  

---

## ⚡ QUICK START (Choose One Method)

### Method 1: Supabase Dashboard (RECOMMENDED)

**Step 1: Open Dashboard**
1. Go to https://app.supabase.com
2. Select your project
3. Click "SQL Editor" in left sidebar

**Step 2: Copy Migration SQL**
1. Open file: `supabase/migrations/20260311_payment_soft_delete_and_cleanup.sql`
2. Select ALL content (Ctrl+A)
3. Copy (Ctrl+C)

**Step 3: Execute Migration**
1. Click "New Query" button
2. Paste entire SQL content
3. Click "Run" button (or Ctrl+Enter)
4. Wait for completion message

**Expected Output:**
```
NOTICE:  KEEPING payment ID: xxx-xxx-xxx - Status: approved, Amount: ¥100, Created: 2026-03-10
NOTICE:  HARD DELETED X payment records (kept only 1 approved for POC)
NOTICE:  HARD DELETED Y non-approved payment submissions

Success! No rows returned
```

**Step 4: Verify Success**
Run this verification query:
```sql
-- Check payments count (should be 1)
SELECT COUNT(*) as remaining_payments FROM payments;

-- Check it's approved
SELECT id, status, amount, created_at 
FROM payments 
ORDER BY created_at DESC;

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN (
  'get_deleted_payments',
  'get_deleted_payment_submissions',
  'admin_delete_payment_submission'
);
```

---

### Method 2: Supabase CLI

**Prerequisites:**
- Supabase CLI installed: `npm install -g supabase`
- Logged in: `supabase login`
- Linked to project: `supabase link --project-ref YOUR_PROJECT_REF`

**Execute:**
```bash
cd "c:\Users\OMEN\OneDrive\Desktop\Anicient tech\Anyiculture_final-main\Anyiculture_final-main"
npx supabase db push
```

**Expected Output:**
```
Applying migration 20260311_payment_soft_delete_and_cleanup.sql...
NOTICE: KEEPING payment ID: xxx-xxx-xxx
NOTICE: HARD DELETED X payment records
✅ Migration applied successfully
```

---

## 🔍 DETAILED VERIFICATION STEPS

### After Migration - Run These Checks:

#### 1. Schema Verification
```sql
-- Check soft delete columns added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payments'
AND column_name IN ('deleted_at', 'deleted_by', 'deletion_reason')
ORDER BY ordinal_position;
```

**Expected Result:**
```
column_name     | data_type          | is_nullable
----------------|--------------------|-------------
deleted_at      | timestamp with tz  | YES
deleted_by      | uuid               | YES
deletion_reason | text               | YES
```

#### 2. Index Verification
```sql
-- Check indexes created
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'payments'
AND indexname LIKE 'idx_payments%'
ORDER BY indexname;
```

**Expected Result:**
```
indexname                  | indexdef
---------------------------|--------------------------------------------------
idx_payments_active        | CREATE INDEX ... WHERE (deleted_at IS NULL)
idx_payments_deleted       | CREATE INDEX ... WHERE (deleted_at IS NOT NULL)
idx_payments_deleted_at    | CREATE INDEX ON payments(deleted_at)
```

#### 3. Function Verification
```sql
-- Test get_deleted_payments function exists
SELECT oid, proname, prosrc
FROM pg_proc
WHERE proname = 'get_deleted_payments';

-- Test admin_delete_payment_submission function
SELECT oid, proname, prosrc
FROM pg_proc
WHERE proname = 'admin_delete_payment_submission';
```

#### 4. Cleanup Verification
```sql
-- How many payments remain?
SELECT COUNT(*) as total_payments FROM payments;

-- What's the status of remaining payment(s)?
SELECT 
  id,
  status,
  amount,
  plan_type,
  created_at,
  CASE 
    WHEN deleted_at IS NOT NULL THEN 'DELETED'
    ELSE 'ACTIVE'
  END as deletion_status
FROM payments
ORDER BY created_at DESC;

-- Check payment_submissions cleanup
SELECT 
  status,
  COUNT(*) as count,
  SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as deleted_count
FROM payment_submissions
GROUP BY status;
```

---

## ✅ SUCCESS CHECKLIST

After running migration, verify:

- [ ] NOTICE message shows which payment was kept
- [ ] NOTICE message shows how many records were deleted
- [ ] Only 1 payment remains in database (or small number if you had real data)
- [ ] Remaining payment has status = 'approved' or 'confirmed'
- [ ] All 3 soft delete columns exist in payments table
- [ ] All 3 indexes created successfully
- [ ] All 3 RPC functions deployed
- [ ] No error messages in SQL output

---

## 🐛 TROUBLESHOOTING

### Error: "relation does not exist"
**Cause:** Typo in table name or wrong schema

**Fix:**
```sql
-- Verify table exists
SELECT * FROM information_schema.tables 
WHERE table_name= 'payments';
```

### Error: "function already exists"
**Cause:** Migration run multiple times

**Fix:** Safe to ignore - function already deployed

### Error: "permission denied"
**Cause:** Not logged in as admin/superuser

**Fix:** Use Supabase dashboard with project owner account

### No NOTICE Messages Appear
**Cause:** PostgreSQL client may not show NOTICE level messages

**Fix:**Check actual data instead:
```sql
SELECT COUNT(*) FROM payments;
-- Should be 1 or very small number
```

### More than 1 Payment Remains
**Possible Causes:**
1. Migration didn't run completely
2. Had real production data (not test data)
3. SQL error during cleanup block

**Investigation:**
```sql
-- See what payments exist
SELECT id, status, amount, created_at, deleted_at
FROM payments
ORDER BY created_at DESC;

-- If you see test data that should have been deleted
-- Manually run the cleanup block from migration file
```

---

## 🔄 ROLLBACK PROCEDURE (If Needed)

**WARNING:** Only rollback if migration caused critical issues!

### Step 1: Remove Soft Delete Columns
```sql
ALTER TABLE payments DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE payments DROP COLUMN IF EXISTS deleted_by;
ALTER TABLE payments DROP COLUMN IF EXISTS deletion_reason;
```

### Step 2: Drop Indexes
```sql
DROP INDEX IF EXISTS idx_payments_deleted_at;
DROP INDEX IF EXISTS idx_payments_active;
DROP INDEX IF EXISTS idx_payments_deleted;
```

### Step 3: Drop Functions
```sql
DROP FUNCTION IF EXISTS public.get_deleted_payments(integer, integer);
DROP FUNCTION IF EXISTS public.get_deleted_payment_submissions(integer, integer);
DROP FUNCTION IF EXISTS public.admin_delete_payment_submission(uuid);
```

### Step 4: Restore Deleted Data (If Possible)
Unfortunately, hard deleted data cannot be recovered unless you have a backup.

**If you have a backup:**
```sql
-- Restore from backup
COPY payments FROM '/path/to/backup.csv' WITH CSV HEADER;
```

---

## 📊 POST-MIGRATION TESTING

### Test 1: Active Payments Page
1. Open browser: http://localhost:5173/
2. Login as admin
3. Navigate to Admin Portal → Sales & Payments
4. Verify active list loads correctly

**Expected:** Shows only non-deleted payments

### Test 2: Delete a Payment
1. Find a payment in active list
2. Click red "Delete" button
3. Confirm deletion

**Expected:**
- ✅ Confirmation dialog appears
- ✅ Success toast after confirming
- ✅ Record disappears from active list
- ✅ No page reload needed

### Test 3: Deleted Tab
1. Click "Deleted" tab
2. Look for the payment you just deleted

**Expected:**
- ✅ Deleted payment appears in list
- ✅ Shows deletion timestamp in red
- ✅ "Details" button visible

### Test 4: Deleted Details
1. Click "Details" on deleted payment
2. Modal opens

**Expected:**
- ✅ Red banner indicates deleted status
- ✅ All original payment details visible
- ✅ Deletion metadata shown (who, when)

---

## 📝 MIGRATION LOG TEMPLATE

Copy and fill this out after running migration:

```
## Migration Execution Log

**Date:** _______________
**Time:** _______________
**Executed By:** _______________
**Method Used:** Dashboard / CLI

### Output Messages:
```
[Paste NOTICE messages and any errors here]
```

### Verification Results:
- Payments remaining: _____
- Payment Submissions cleaned: _____
- Columns added: ☐ Yes ☐ No
- Indexes created: ☐ Yes ☐ No
- Functions deployed: ☐ Yes ☐ No

### Issues Encountered:
[Describe any problems or errors]

### Resolution:
[How issues were fixed]

### Verified By (second person): _______________
```

---

## 🎯 NEXT STEPS AFTER MIGRATION

1. **Immediate (Within 1 Hour):**
   - [ ] Verify migration applied successfully
   - [ ] Run all verification queries
   - [ ] Test frontend still works

2. **Short-Term (Within 24 Hours):**
   - [ ] Test delete workflow end-to-end
   - [ ] Verify Deleted tab shows deleted records
   - [ ] Confirm audit trail working

3. **Long-Term (Within 1 Week):**
   - [ ] Monitor performance metrics
   - [ ] Train admin team on new features
   - [ ] Document any custom procedures

---

## 📞 SUPPORT CONTACTS

**If migration fails:**
1. Check PostgreSQL logs in Supabase Dashboard
2. Review migration SQL for syntax errors
3. Verify database connection
4. Contact database administrator

**If frontend breaks:**
1. Check browser console for errors
2. Verify API calls in Network tab
3. Check TypeScript compilation
4. Review component imports

---

## ✨ EXPECTED OUTCOME

After successful migration:

**Database:**
- ✅ payments table has soft delete columns
- ✅ Performance indexes created
- ✅ RPC functions deployed
- ✅ Test data cleaned up

**Frontend:**
- ✅ Deleted tab visible and functional
- ✅ Delete workflow moves records to archive
- ✅ Audit trail displayed properly
- ✅ No breaking changes to existing features

**Admin Experience:**
- ✅ Clearer separation of active vs archived
- ✅ Better compliance and traceability
- ✅ Safer deletion with confirmation dialogs
- ✅ Ability to review deleted records anytime

---

**Status:** READY TO EXECUTE  
**Risk Level:** LOW (soft delete is reversible)  
**Impact:** HIGH (one-time hard delete is permanent)  
**Recommendation:** Execute during low-traffic period  

🚀 **Proceed with migration when ready!**
