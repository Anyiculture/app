# 🚀 Supabase CLI Deployment Guide

## Prerequisites

You need Supabase CLI installed. Install it using one of these methods:

### Method 1: Using PowerShell as Administrator

```powershell
# Using Chocolatey
choco install supabase

# OR using Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### Method 2: Direct Download
1. Download from: https://github.com/supabase/cli/releases
2. Extract to a folder (e.g., `C:\supabase`)
3. Add to PATH

### Verify Installation
```bash
supabase --version
```

---

## 🎯 Complete Deployment Steps

### Step 1: Login to Supabase

```bash
supabase login
```

This will open your browser and ask you to authorize the CLI.

**Expected output:**
```
✔ Finished supabase login.
```

---

### Step 2: Link Your Project

```bash
supabase link --project-ref rxeymolxjcudkpbfyruq
```

**You'll be asked for:**
- Database password (from Supabase Dashboard → Settings → Database)

**Expected output:**
```
✔ Linked to project rxeymolxjcudkpbfyruq
```

---

### Step 3: Check Status

```bash
supabase status
```

This shows your current connection status.

---

### Step 4: Deploy Database Migrations

```bash
supabase db push
```

This will apply all 75 migrations from your `supabase/migrations/` folder.

**Expected output:**
```
Applying migration 20260107090124_add_missing_module_tables.sql...
Applying migration 20260107104859_update_messaging_system.sql...
... (all 75 migrations)
✔ Applied all migrations successfully.
```

**If you get errors:**
```bash
# Reset and try again (WARNING: This deletes all data!)
supabase db reset

# Or check which migrations were applied:
supabase migration list
```

---

### Step 5: Deploy Edge Functions

Deploy all 7 Edge Functions:

```bash
# Deploy all at once
supabase functions deploy

# OR deploy individually:
supabase functions deploy scrape-url
supabase functions deploy analyze-content
supabase functions deploy generate-content
supabase functions deploy generate-images
supabase functions deploy send-notification-email
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook
```

**Expected output for each function:**
```
Deploying Function (scrape-url)...
✔ Deployed Function scrape-url
Function URL: https://rxeymolxjcudkpbfyruq.supabase.co/functions/v1/scrape-url
```

---

### Step 6: Set Environment Secrets

Edge Functions need API keys. Set them as secrets:

```bash
# Google AI API Key (for generate-content, generate-images)
supabase secrets set GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Groq API Key (for analyze-content)
supabase secrets set GROQ_API_KEY=your_groq_api_key_here

# Stripe Keys (for stripe-checkout, stripe-webhook)
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

**To list current secrets:**
```bash
supabase secrets list
```

**Expected output:**
```
GOOGLE_AI_API_KEY
GROQ_API_KEY
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
```

---

### Step 7: Verify Deployment

#### Check Migrations:
```bash
supabase migration list
```

You should see all 75 migrations with ✓ marks.

#### Check Functions:
Go to: https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq/functions

You should see all 7 functions listed.

#### Test a Function:
```bash
# Test scrape-url function
curl -i --location --request POST \
  'https://rxeymolxjcudkpbfyruq.supabase.co/functions/v1/scrape-url' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"url":"https://example.com"}'
```

---

### Step 8: Create Storage Buckets

Storage buckets can be created via CLI or Dashboard.

#### Via CLI:
```bash
# This requires additional setup, easier via Dashboard
```

#### Via Dashboard (Recommended):
1. Go to: https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq/storage
2. Create these buckets:
   - `profile-photos` (Public, 10MB)
   - `ai-generated-images` (Public, 10MB)
   - `marketplace-images` (Public, 10MB)
   - `event-images` (Public, 10MB)
   - `education-images` (Public, 10MB)
   - `visa-documents` (Private, 50MB)

---

### Step 9: Update Frontend Code

**Edit**: `src/lib/supabase.ts`

```typescript
const USE_MOCK_MODE = false; // ✅ Change from true to false
```

---

### Step 10: Deploy Frontend

#### Option A: Vercel
1. Go to: https://vercel.com
2. Import your GitHub repository
3. Add environment variables:
   - `VITE_SUPABASE_URL` = `https://rxeymolxjcudkpbfyruq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (from Supabase Dashboard → Settings → API)
4. Deploy

#### Option B: Netlify
1. Go to: https://netlify.com
2. Import repository
3. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add same environment variables
5. Deploy

---

## 🎯 Quick Command Reference

```bash
# Login
supabase login

# Link project
supabase link --project-ref rxeymolxjcudkpbfyruq

# Check status
supabase status

# Deploy migrations
supabase db push

# Deploy all functions
supabase functions deploy

# Set secrets
supabase secrets set KEY_NAME=value

# List secrets
supabase secrets list

# View logs (useful for debugging)
supabase functions logs scrape-url

# Generate TypeScript types (optional)
supabase gen types typescript --project-id rxeymolxjcudkpbfyruq > src/types/supabase.ts
```

---

## 🔍 Verification Checklist

After deployment:

- [ ] `supabase status` shows "Linked to project"
- [ ] `supabase migration list` shows 75 migrations ✓
- [ ] All 7 functions visible in Dashboard → Functions
- [ ] `supabase secrets list` shows all required secrets
- [ ] Storage buckets created (check Dashboard → Storage)
- [ ] Frontend deployed and accessible
- [ ] Can sign up/sign in on deployed site
- [ ] Can create/view data (marketplace, events, etc.)

---

## 🆘 Troubleshooting

### "Database password incorrect"

**Solution:**
1. Go to: Dashboard → Settings → Database → Reset password
2. Copy new password
3. Run `supabase link` again with new password

### "Migration already applied"

**Solution:**
```bash
# Check which migrations are applied
supabase migration list

# If needed, reset database (WARNING: Deletes all data!)
supabase db reset
```

### "Function deployment failed"

**Solution:**
1. Check function syntax: `supabase functions serve scrape-url`
2. View deployment logs
3. Ensure all dependencies are in function folder

### "Secrets not working"

**Solution:**
```bash
# Unset and reset
supabase secrets unset KEY_NAME
supabase secrets set KEY_NAME=new_value

# Redeploy functions after updating secrets
supabase functions deploy
```

---

## 📝 Complete Deployment Script

Save this as `deploy.sh` or run line by line:

```bash
#!/bin/bash

# Login
supabase login

# Link project
supabase link --project-ref rxeymolxjcudkpbfyruq

# Deploy migrations
supabase db push

# Deploy all functions
supabase functions deploy

# Set secrets (replace with your actual keys)
supabase secrets set GOOGLE_AI_API_KEY=sk-...
supabase secrets set GROQ_API_KEY=gsk_...
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...

# Verify
supabase status
supabase migration list
supabase secrets list

echo "✅ Deployment complete!"
echo "Next steps:"
echo "1. Create storage buckets in Dashboard"
echo "2. Update src/lib/supabase.ts (USE_MOCK_MODE = false)"
echo "3. Deploy frontend to Vercel/Netlify"
```

---

## 🚀 Next Steps After CLI Deployment

1. ✅ Create storage buckets (Dashboard)
2. ✅ Update `USE_MOCK_MODE = false`
3. ✅ Deploy frontend to Vercel/Netlify
4. ✅ Test the live application
5. ✅ Monitor logs: `supabase functions logs`

---

**Total Deployment Time**: ~10 minutes with CLI (vs ~30+ minutes manually!)

**Need help?** Check the Supabase docs: https://supabase.com/docs/guides/cli
