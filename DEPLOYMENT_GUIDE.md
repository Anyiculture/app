# 🚀 Supabase Deployment Guide

## Prerequisites

- Supabase account: https://supabase.com
- Project ID: `rxeymolxjcudkpbfyruq`
- Supabase CLI installed

## Option 1: Install Supabase CLI (Recommended)

### For Windows (using PowerShell as Administrator):

```powershell
# Method 1: Using npm (if you have Node.js)
npm install -g supabase

# Method 2: Using Scoop (Windows package manager)
# First install Scoop if you don't have it:
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
irm get.scoop.sh | iex

# Then install Supabase CLI:
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase

# Method 3: Direct download from GitHub
# Download from: https://github.com/supabase/cli/releases
# Extract the executable and add to PATH
```

### Verify Installation:

```bash
supabase --version
```

## Option 2: Deploy Without CLI (Manual Method)

If CLI installation fails, you can deploy manually via the Supabase Dashboard.

---

## Deployment Steps

### 1. Link Your Local Project to Supabase

```bash
# Login to Supabase
supabase login

# Link to your existing project
supabase link --project-ref rxeymolxjcudkpbfyruq
```

When prompted, enter your database password.

### 2. Deploy Database Migrations

```bash
# Push all migrations to Supabase
supabase db push
```

This will apply all 75+ migration files in your `supabase/migrations` folder.

### 3. Deploy Edge Functions

```bash
# Deploy all Edge Functions
supabase functions deploy scrape-url
supabase functions deploy analyze-content
supabase functions deploy generate-content
supabase functions deploy generate-images
supabase functions deploy send-notification-email
supabase functions deploy stripe-checkout
supabase functions deploy stripe-webhook

# Or deploy all at once:
supabase functions deploy
```

### 4. Set Environment Secrets for Edge Functions

```bash
# Google AI API Key (for generate-content, generate-images)
supabase secrets set GOOGLE_AI_API_KEY=your_google_ai_api_key_here

# Groq API Key (for analyze-content)
supabase secrets set GROQ_API_KEY=your_groq_api_key_here

# Stripe Keys (for stripe-checkout, stripe-webhook)
supabase secrets set STRIPE_SECRET_KEY=your_stripe_secret_key_here
supabase secrets set STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret_here
```

### 5. Deploy Frontend Application

Your frontend needs to be deployed separately. Common options:

#### Option A: Deploy to Vercel (Recommended)

1. Go to https://vercel.com
2. Import your GitHub repository
3. Configure environment variables:
   - `VITE_SUPABASE_URL=https://rxeymolxjcudkpbfyruq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=your_anon_key_from_env_file`
4. Click "Deploy"

#### Option B: Deploy to Netlify

1. Go to https://netlify.com
2. Import your repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables
6. Click "Deploy"

---

## Manual Deployment (If CLI Fails)

### A. Deploy Migrations Manually

1. **Go to**: https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq/editor
2. **Click** "New Query"
3. **Copy and paste** each migration file from `supabase/migrations` folder
4. **Run** them in chronological order (sorted by filename)

### B. Deploy Edge Functions Manually

Edge Functions can only be deployed via CLI or GitHub Actions. If CLI isn't working:

1. **Enable GitHub integration** in Supabase Dashboard
2. **Push your code** to GitHub
3. **Set up GitHub Actions** to auto-deploy functions

---

## Verify Deployment

### Check Migrations:

```bash
# List applied migrations
supabase migration list
```

Or check in Dashboard: https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq/database/migrations

### Check Edge Functions:

Go to: https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq/functions

You should see all 7 functions deployed.

### Test Edge Functions:

```bash
# Test a function
curl -i --location --request POST \
  'https://rxeymolxjcudkpbfyruq.supabase.co/functions/v1/generate-content' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"contentType":"jobs","category":"Software Engineer"}'
```

---

## Troubleshooting

### Issue: "supabase: command not found"

**Solution**: CLI is not installed or not in PATH. Try the installation methods above.

### Issue: "Database password incorrect"

**Solution**: Get your database password from Supabase Dashboard > Settings > Database > Connection string

### Issue: "Migrations already applied"

**Solution**: Use `supabase db reset` to reset database (CAUTION: This deletes all data!)

### Issue: Edge Functions not deploying

**Solution**: 
- Ensure you're logged in: `supabase login`
- Check you're linked to the project: `supabase status`
- Verify function files exist in `supabase/functions/`

---

## Production Checklist

- [ ] All migrations deployed
- [ ] All Edge Functions deployed
- [ ] Environment secrets set
- [ ] Frontend deployed (Vercel/Netlify)
- [ ] RLS policies enabled
- [ ] Storage buckets created
- [ ] Test critical user flows
- [ ] Update `.env` in frontend to use production Supabase URL
- [ ] Remove `USE_MOCK_MODE = true` from `src/lib/supabase.ts`

---

## Important: Disable Mock Mode

Before deploying frontend, update `src/lib/supabase.ts`:

```typescript
const USE_MOCK_MODE = false; // Change from true to false
```

This ensures your production app connects to the real Supabase backend, not mock data.

---

## Support Resources

- Supabase CLI Docs: https://supabase.com/docs/guides/cli
- Edge Functions Docs: https://supabase.com/docs/guides/functions
- Deployment Guide: https://supabase.com/docs/guides/getting-started/tutorials/with-react

---

**Need Help?** If CLI installation continues to fail, you can:
1. Use GitHub Actions for automated deployment
2. Deploy migrations manually via SQL Editor
3. Contact Supabase support for CLI installation issues
