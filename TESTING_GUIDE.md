# 🧪 Testing Guide - Production Fixes 2026-03-11

## ✅ Migration Applied
SQL migration file has been executed. Now test the following:

---

## Test 1: Contact Au Pair (FIXED) ⭐

**Steps:**
1. Login as a **host family** account
2. Ensure payment status is **approved** by admin
3. Go to Browse Au Pairs
4. Click on any au pair profile
5. Click "Contact Au Pair" button

**Expected Result:**
- ✅ Conversation opens or creates successfully
- ✅ Redirects to messaging page
- ✅ Can send messages immediately
- ✅ No error messages

**If it fails, check:**
- Browser Console (F12) for error messages
- Check if payment submission status is 'approved' in database
- Verify subscription status shows 'premium'

---

## Test 2: Approval Notifications (FIXED) ⭐

**Steps:**
1. Login as host family with **pending** payment
2. Login as admin in another browser/incognito
3. Go to Admin Portal → Sales & Payments
4. Approve the payment
5. Switch back to host family browser
6. Refresh the page
7. Check notification bell (top right)

**Expected Result:**
- ✅ Bell icon shows unread indicator (red dot/badge)
- ✅ Click bell → See notification: "Your host family account has been approved..."
- ✅ Chinese language users see: "您的寄宿家庭账户已通过审核..."
- ✅ Notification marked as unread until clicked
- ✅ Clicking notification navigates to /au-pairs page

**Database Check:**
```sql
SELECT * FROM notifications 
WHERE user_id = 'YOUR_USER_ID' 
ORDER BY created_at DESC 
LIMIT 5;
```

---

## Test 3: Subscription End Date Display (FIXED) ⭐

**Steps:**
1. Login as any user with subscription
2. Go to Settings → Billing Plans
3. View subscription card

**Expected Result:**
- ✅ Shows "Current Plan: Premium" or "Free"
- ✅ Shows "Subscription Started: [date]"
- ✅ Shows "Next Renewal Date: [date]" or "Expired On: [date]"
- ✅ Shows "Days Remaining: X days" (if active)
- ✅ Dates come from database, not hardcoded
- ✅ Supports English and Chinese

**Database Check:**
```sql
SELECT 
    host_family_subscription_status,
    host_family_subscription_start,
    host_family_subscription_end
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

---

## Test 4: Delete Test Payments (FIXED) ⭐

**Steps:**
1. Login as **admin**
2. Go to Admin Portal → Sales & Payments
3. Find a test payment
4. Click the trash icon (Delete button)
5. Confirm deletion

**Expected Result:**
- ✅ Delete button appears for each payment
- ✅ Clicking opens confirmation dialog
- ✅ Dialog says: "Are you sure you want to delete..."
- ✅ After confirming, payment disappears from list
- ✅ Soft-deleted (deleted_at column set)
- ✅ Can still see in database with deleted_at timestamp

**Database Check:**
```sql
SELECT id, plan_type, status, deleted_at, deleted_by
FROM payment_submissions 
WHERE deleted_at IS NOT NULL;
```

---

## Test 5: No Stale Profile Flash (FIXED) ⭐

**Steps:**
1. Go to any au pair profile page
2. Watch the loading behavior carefully
3. Check if old/broken state flashes before new content

**Expected Result:**
- ✅ Shows loading spinner initially
- ✅ Content appears all at once when ready
- ✅ No flash of old locked state
- ✅ No broken translation keys showing
- ✅ Contact button shows correct state immediately

---

## Test 6: Bilingual Support (FIXED) ⭐

**Steps:**
1. Switch language to Chinese (top right)
2. Test all above features again

**Expected Result:**
- ✅ All system text translated to Chinese
- ✅ Notifications show Chinese text
- ✅ Billing page in Chinese
- ✅ Admin panel in Chinese
- ✅ No broken i18n keys (no `translation.key.here` showing)

**Known Limitation:**
- ❌ User-generated content (bio, hobbies) still in original language
- This is expected - requires separate fix (multi-language fields)

---

## 🐛 Troubleshooting

### If Contact Au Pair Still Fails:

**1. Check User Role:**
```sql
SELECT 
    au_pair_role,
    host_family_subscription_status,
    au_pair_subscription_status
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

Should show:
- `au_pair_role`: 'host_family'
- `host_family_subscription_status`: 'premium' (if approved)

**2. Check Payment Submission:**
```sql
SELECT 
    id,
    status,
    plan_type,
    reviewed_at
FROM payment_submissions 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC
LIMIT 1;
```

Should show:
- `status`: 'approved'
- `reviewed_at`: has a timestamp

**3. Check RLS Policies:**
```sql
SELECT 
    policyname,
    cmd
FROM pg_policies 
WHERE tablename = 'conversations'
ORDER BY policyname;
```

Should have policies allowing authenticated users to INSERT.

**4. Browser Console Check:**
- Open DevTools (F12)
- Go to Network tab
- Click "Contact Au Pair"
- Look for failed API calls
- Check error message in Console

### If Notifications Don't Appear:

**1. Check Trigger:**
```sql
SELECT 
    tgname,
    tgenabled
FROM pg_trigger 
WHERE tgname = 'on_payment_approved';
```

Should return 1 row with `tgenabled = true`.

**2. Check Notifications Table:**
```sql
SELECT 
    user_id,
    type,
    title,
    message,
    is_read,
    created_at
FROM notifications 
WHERE user_id = 'YOUR_USER_ID'
ORDER BY created_at DESC;
```

Should show approval notification.

### If Subscription Dates Don't Show:

**1. Check Columns Exist:**
```sql
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name LIKE '%subscription%';
```

Should show all subscription timing columns.

**2. Check Data:**
```sql
SELECT 
    id,
    host_family_subscription_status,
    host_family_subscription_start,
    host_family_subscription_end
FROM profiles 
WHERE id = 'YOUR_USER_ID';
```

Should have timestamps if payment was approved.

---

## ✅ Expected Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Contact Au Pair | ✅ Should Pass | Uses createConversationWithMessage RPC |
| Approval Notifications | ✅ Should Pass | DB trigger creates notifications automatically |
| Subscription Display | ✅ Should Pass | Fetches from profiles table |
| Delete Payments | ✅ Should Pass | Soft delete with admin confirmation |
| No Stale Flash | ✅ Should Pass | Proper loading states |
| Bilingual Support | ✅ Should Pass | All system text translated |

---

## 📝 Report Template

After testing, report back with:

```
Test Results:
1. Contact Au Pair: PASS / FAIL - [any errors]
2. Notifications: PASS / FAIL - [any errors]
3. Subscription Display: PASS / FAIL - [any errors]
4. Delete Payments: PASS / FAIL - [any errors]
5. No Stale Flash: PASS / FAIL - [any errors]
6. Bilingual: PASS / FAIL - [any errors]

Browser Console Errors:
[paste any errors from F12 Console]

Database Check Results:
[paste results from SQL queries above]
```

---

## 🚀 Next Steps After Testing

**If all tests pass:**
- ✅ Deployment complete!
- ✅ Changes are live in production
- ✅ Users can now contact au pairs
- ✅ Notifications working
- ✅ Subscription tracking working

**If any tests fail:**
- Share error messages and console output
- I'll help debug and fix the specific issue
- May need to check RLS policies or RPC functions
