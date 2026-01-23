# 🔐 Fixing Git Push Block Due to API Key in History

## Problem
GitHub detected a Groq API key in your git history and is blocking the push for security.

## ✅ What We've Done
- Removed the hardcoded Groq API key from `supabase/functions/analyze-content/index.ts`
- Verified no Google/Gemini API keys are hardcoded
- Verified no Stripe keys are hardcoded
- All API keys now properly use environment variables

## Solution Options

### Option 1: Allow the Push (Recommended - Easiest)

Since you've already removed the key from the current code, you can bypass GitHub's protection:

1. **Go to the URL GitHub provided**:
   ```
   https://github.com/Anyiculture/app/security/secret-scanning/unblock-secret/38dvzC86YAkukzuAd1jw0MxZkuYorking-with-push-protection-from-the-command-line#resolving-a-blo
   ```

2. **Click "Allow this secret"** or **"I'll fix it later"**

3. **Then push again**:
   ```powershell
   git push
   ```

4. **Immediately deactivate the old Groq API key**:
   - Go to your Groq console
   - Delete or regenerate the API key: `gsk_REDACTED`
   - Generate a new one for use in Supabase secrets

### Option 2: Rewrite Git History (Advanced - Clean but Complex)

This completely removes the key from git history:

```powershell
# Use BFG Repo Cleaner to remove the secret from history
# Download from: https://rtyley.github.io/bfg-repo-cleaner/

# OR use git filter-branch (slower)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch supabase/functions/analyze-content/index.ts" \
  --prune-empty --tag-name-filter cat -- --all

# Force push (WARNING: This rewrites history)
git push origin --force --all
```

⚠️ **Warning**: This rewrites git history and can cause issues for collaborators.

### Option 3: Create Fresh Repository (Nuclear Option)

1. **Create a new GitHub repository**
2. **Copy code** (without .git folder)
3. **Initialize fresh git** and push

---

## 🎯 Recommended Steps (Easiest Path)

1. ✅ **API key is already removed from code** (we did this)
2. **Allow the push** via GitHub's web interface (Option 1)
3. **Invalidate the old key** in Groq console
4. **Set new key** as Supabase secret when deploying Edge Functions
5. **Continue with Vercel deployment**

---

## 📝 After Push Succeeds

### Set up environment variables in Supabase:

```bash
# When you deploy Edge Functions later with CLI:
supabase secrets set GROQ_API_KEY=your_new_groq_key
supabase secrets set GOOGLE_AI_API_KEY=your_google_ai_key
supabase secrets set STRIPE_SECRET_KEY=your_stripe_key
supabase secrets set STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

---

## ✅ Security Checklist

- ✅ Groq API key removed from code
- ✅ Google AI API key uses env vars only
- ✅ Stripe keys use env vars only  
- ✅ All Edge Functions use `Deno.env.get()` for secrets
- ⏳ Old Groq key needs to be invalidated (do this after push succeeds)

---

## Next Step

**Go to the GitHub URL** (check your terminal output or the error message) and click **"Allow this secret"**, then push again.

After successful push, we'll continue with Vercel deployment! 🚀
