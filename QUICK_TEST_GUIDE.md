# 🧪 TESTING GUIDE - Admin Dashboard Fixes

**Server:** ✅ Running at http://localhost:5173/  
**Date:** 2026-03-11  

---

## ⚡ Quick Start

1. **Open your browser:** http://localhost:5173/
2. **Login as admin** (use your admin account)
3. **Clear cache:** Press `Ctrl + Shift + Delete` if needed
4. **Follow the test scenarios below**

---

## 📋 Test Scenarios

### ✅ Test #1: Dashboard Stats Accuracy (3 minutes)

**Goal:**Verify dashboard only counts active users

**Steps:**
1. Go to Admin Portal → Overview
2. Look at the stats cards:
   - Total Users
   - Total Au Pairs
   - Total Host Families
3. Note down the current numbers
4. Go to Admin Portal → Users
5. Find an active user
6. Click the **Ban** button(orange icon with ban symbol)
7. Confirm in dialog
8. Go back to Overview page
9. Refresh the page

**Expected Result:**
- ✅ "Total Users" count should decrease by 1
- ✅ "Total Au Pairs" or "Total Host Families" should decrease by 1 (depending on user type)
- ✅ Banned user no longer counted in active stats

---

### ✅ Test #2: Ban User Functionality (3 minutes)

**Goal:**Verify ban button works and updates UI immediately

**Steps:**
1. Go to Admin Portal → Users
2. Find any active user
3. Click the **Ban** button (orange circle with slash icon)
4. A confirmation dialog should appear
5. Click "Confirm" or "Ban User"
6. Watch for success toast notification

**Expected Result:**
- ✅ Success toast appears: "User banned successfully"
- ✅ User status badge changes from "Active" (green) to "Banned" (red)
- ✅ UI updates immediately without page refresh
- ✅ Ban button changes to Unban button (green with checkmark)

**Unban Test:**
1. Click the **Unban** button (green icon) on the same user
2. Confirm unban
3. **Expected:** User restored to "Active" status

---

### ✅ Test #3: Delete User Functionality (5 minutes)

**Goal:**Verify delete button works and blocks re-signup

**Steps:**
1. Go to Admin Portal → Users
2. Find a user to delete (preferably a test account)
3. Click the **Delete** button (red trash icon)
4. Confirmation dialog appears
5. Click "Delete" to confirm
6. Watch for success toast

**Expected Result:**
- ✅ Success toast: "User deleted successfully"
- ✅ User disappears from the users list immediately
- ✅ Cannot find user by scrolling through pagination

**Re-signup Prevention Test:**
1. Note the deleted user's email address
2. Log out from admin account
3. Go to signup page
4. Try to create new account with the same email
5. **Expected:** Signup should be blocked with appropriate message

---

### ✅ Test #4: Payment Deletion(3 minutes)

**Goal:**Verify admins can delete payment submissions

**Steps:**
1. Go to Admin Portal → Sales & Payments
2. You should see two tabs: "Requests" and "History"
3. Find any payment submission (preferably a test one)
4. Look for the **Delete** button (trash icon) in the Actions column
5. Click the delete button
6. Confirmation dialog appears
7. Click "Delete" to confirm

**Expected Result:**
- ✅ Confirmation dialog shows payment details
- ✅ After confirming, payment disappears from the list
- ✅ Success toast appears
- ✅ List refreshes immediately
- ✅ If you switch between "Requests" and "History" tabs, deleted payment remains hidden

**Test in Modal:**
1. Click "View Proof" on any payment
2. In the modal that opens, look for delete button
3. Click delete and confirm
4. **Expected:** Modal closes, payment deleted

---

### ✅ Test #5: Email Blocking Verification (2 minutes)

**Goal:**Verify deleted user emails are blocked

**Prerequisites:** Complete Test #3 first

**Steps:**
1. After deleting a user in Test #3, note their email
2. Open Supabase Dashboard (separate tab)
3. Go to SQL Editor
4. Run this query:
   ```sql
   SELECT email, reason, blocked_at 
   FROM blocked_emails 
   ORDER BY blocked_at DESC 
   LIMIT 5;
   ```

**Expected Result:**
- ✅ The deleted user's email appears in `blocked_emails` table
- ✅ Reason shows "admin_deleted"
- ✅ Blocked timestamp is recent

---

### ✅ Test #6: Dashboard Stats Real-time Update (3 minutes)

**Goal:**Verify stats update after multiple actions

**Steps:**
1. Go to Admin Portal → Overview
2. Note initial stats:
   - Total Users: ___
   - Total Au Pairs: ___
   - Total Host Families: ___
3. Go to Users panel
4. Ban one au pair
5. Delete one host family
6. Go back to Overview
7. Refresh page

**Expected Result:**
- ✅ Total Users decreased by 2
- ✅ Total Au Pairs decreased by 1
- ✅ Total Host Families decreased by 1
- ✅ All counts match expected values

---

## 🔍 What to Look For

### ✅ Good Signs:
- Toast notifications appear for all actions
- UI updates immediately without manual refresh
- No error messages in browser console (F12)
- Stats exclude banned/deleted users
- Deleted users cannot re-signup

### ❌ Red Flags:
- Error toasts with red background
- Console errors in browser DevTools
- Stats don't update after actions
- Can still sign up with deleted email
- Buttons don't respond when clicked

---

## 🐛 Troubleshooting

### If Ban/Delete buttons don't work:
1. Check browser console (F12) for errors
2. Verify you're logged in as admin
3. Check network tab for failed API calls
4. Make sure database migration was applied

### If stats don't update:
1. Hard refresh the page (Ctrl + F5)
2. Clear browser cache
3. Verify migration was applied:
   ```sql
   SELECT get_admin_dashboard_stats();
   ```

### If payment delete button missing:
1. Make sure you're on latest code (git pull)
2. Hard refresh browser
3. Check if you're viewing "Requests" vs "History" tab

---

## 📊 Test Results Template

Copy and fill this out as you test:

```
## Test Results - [DATE]

### Test #1: Dashboard Stats
- [ ] PASS / FAIL
- Notes: _______________

### Test #2: Ban User
- [ ] PASS / FAIL
- Notes: _______________

### Test #3: Delete User
- [ ] PASS / FAIL
- Notes: _______________

### Test #4: Payment Delete
- [ ] PASS / FAIL
- Notes: _______________

### Test #5: Email Blocking
- [ ] PASS / FAIL
- Notes: _______________

### Test #6: Real-time Updates
- [ ] PASS / FAIL
- Notes: _______________

## Overall Status:
[ ] ALL PASS - Ready for production
[ ] ISSUES FOUND - See notes above
```

---

## 🎯 Success Criteria

All tests should pass before deploying to production:

✅ **Must Have:**
- Ban button works with proper cascade
- Delete button removes user and blocks email
- Dashboard stats exclude banned/deleted
- Payment deletion works
- No console errors

❌ **Blockers (Do Not Deploy):**
- Any test consistently fails
- Data corruption observed
- Security issues found
- Major UI bugs

---

## 📞 Next Steps After Testing

1. **If all tests pass:**
   - Document results
   - Prepare for production deployment
   - Monitor logs after deployment

2. **If tests fail:**
   - Document exact error messages
   - Check browser console logs
   - Verify database migration applied correctly
   - Report issues with steps to reproduce

---

**Happy Testing! 🚀**

Remember: These fixes improve platform security and data quality. Thorough testing ensures everything works perfectly before production deployment.
