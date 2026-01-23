# 📋 Manual Supabase Deployment Guide

## Overview
This guide will walk you through deploying your application manually via the Supabase Dashboard (no CLI required).

---

## ⚠️ Important Note About Edge Functions
**Edge Functions cannot be deployed manually** through the dashboard. They require either:
- Supabase CLI
- GitHub Actions integration

If you need Edge Functions, you'll need to set up GitHub Actions or install the CLI later.

---

## Step 1: Access Your Supabase Project

1. **Go to**: https://supabase.com/dashboard
2. **Sign in** with your Supabase account
3. **Select your project**: `bolt-native-database-61634897` (Project ID: `rxeymolxjcudkpbfyruq`)

---

## Step 2: Deploy Database Migrations

### 2.1 Navigate to SQL Editor

1. In the left sidebar, click **"SQL Editor"**
2. Click **"+ New Query"** button

### 2.2 Apply Migrations in Order

You have **75 migration files** in `supabase/migrations/`. You need to run them in chronological order.

**IMPORTANT:** Migrations must be run in alphabetical order (by filename) to avoid errors.

#### Method A: Create a Combined Migration Script

I'll create a single SQL file that combines all migrations for you:

1. **Copy all migration files** from `supabase/migrations/`
2. **Concatenate them** in order
3. **Run as one large SQL query**

**Pros**: Faster, single execution
**Cons**: If one fails, entire batch might fail

#### Method B: Run Each Migration Individually

**Pros**: Can identify exactly which migration fails
**Cons**: Very time-consuming (75 files!)

**Recommended: Use Method A** (I'll create the combined script below)

### 2.3 Check Migration Status

After running migrations, verify in:
- **Dashboard → Database → Migrations** section

You should see all your tables listed under:
- **Dashboard → Table Editor**

---

## Step 3: Create Storage Buckets

### 3.1 Navigate to Storage

1. Click **"Storage"** in the left sidebar
2. Click **"Create a new bucket"**

### 3.2 Create Required Buckets

Create these buckets (check your migrations for exact names needed):

| Bucket Name | Public? | File Size Limit | Allowed MIME Types |
|-------------|---------|-----------------|-------------------|
| `profile-photos` | Yes | 10 MB | image/* |
| `ai-generated-images` | Yes | 10 MB | image/* |
| `marketplace-images` | Yes | 10 MB | image/* |
| `event-images` | Yes | 10 MB | image/* |
| `education-images` | Yes | 10 MB | image/* |
| `visa-documents` | No (Private) | 50 MB | application/pdf, image/* |

**Steps for each bucket:**
1. Click **"New bucket"**
2. Enter **Bucket name**
3. Check/uncheck **"Public bucket"** as needed
4. Click **"Create bucket"**
5. Click the bucket → **Settings** → Configure policies if needed

---

## Step 4: Configure Row Level Security (RLS)

### 4.1 Enable RLS on All Tables

1. Go to **"Authentication"** → **"Policies"**
2. For each table, ensure RLS is enabled
3. Your migration files should have created the policies automatically

### 4.2 Verify Policies

Check that these tables have RLS policies:
- `profiles`
- `conversations`
- `messages`
- `jobs`
- `marketplace_items`
- `events`
- `education_programs`
- `host_families`
- `au_pairs`

---

## Step 5: Set Up Authentication

### 5.1 Configure Auth Settings

1. Go to **"Authentication"** → **"Settings"**
2. **Site URL**: Set to your production URL (e.g., `https://yourdomain.com`)
3. **Redirect URLs**: Add:
   - `http://localhost:5173/*` (for local development)
   - `https://yourdomain.com/*` (for production)

### 5.2 Enable Email Auth

1. **Authentication** → **"Providers"**
2. Ensure **"Email"** is enabled
3. Configure email templates if needed

---

## Step 6: Verify Database Tables

### 6.1 Check Tables Were Created

Go to **"Table Editor"** in the left sidebar.

You should see these tables (at minimum):
- ✅ `profiles`
- ✅ `conversations`
- ✅ `messages`
- ✅ `jobs`
- ✅ `marketplace_items`
- ✅ `events`
- ✅ `education_programs`
- ✅ `host_families`
- ✅ `au_pairs`
- ✅ `visa_applications`
- ✅ `job_applications`
- ✅ And many more...

If tables are missing, migrations didn't run correctly.

---

## Step 7: Get Your Production Credentials

### 7.1 Copy Connection Details

1. Go to **"Settings"** → **"API"**
2. Copy these values:

```
Project URL: https://rxeymolxjcudkpbfyruq.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key: [Keep this secret! Only for backend/Edge Functions]
```

### 7.2 Update Your Frontend `.env`

Update your `.env` file with production values:

```bash
VITE_SUPABASE_URL=https://rxeymolxjcudkpbfyruq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## Step 8: Disable Mock Mode

**CRITICAL:** Update `src/lib/supabase.ts`:

```typescript
const USE_MOCK_MODE = false; // Change from true to false
```

This connects your app to the real Supabase backend instead of mock data.

---

## Step 9: Deploy Your Frontend

### Option A: Deploy to Vercel

1. **Go to**: https://vercel.com
2. **Sign up/Login** with GitHub
3. **Import your repository**
4. **Configure Build Settings**:
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. **Add Environment Variables**:
   - `VITE_SUPABASE_URL` = `https://rxeymolxjcudkpbfyruq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `your_anon_key`
6. **Click "Deploy"**

### Option B: Deploy to Netlify

1. **Go to**: https://netlify.com
2. **Sign up/Login**
3. **Click "Add new site"** → **"Import an existing project"**
4. **Connect to GitHub** and select your repository
5. **Build Settings**:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Add Environment Variables** (same as Vercel)
7. **Click "Deploy"**

---

## Step 10: Test Your Deployment

### 10.1 Test Authentication

1. **Visit your deployed URL**
2. Try to **sign up** for a new account
3. Check your email for confirmation
4. Try to **sign in**

### 10.2 Test Database Operations

1. **Create a profile**
2. **Browse marketplace/events/jobs**
3. **Test messaging** (if applicable)

### 10.3 Check Supabase Dashboard

1. Go to **"Table Editor"** → **"profiles"**
2. You should see your test user's profile
3. Check **"Authentication"** → **"Users"** to see registered users

---

## Troubleshooting

### Issue: "Relation does not exist" errors

**Solution**: Migrations didn't run correctly. Re-run all migrations in order.

### Issue: "RLS policy violation"

**Solution**: 
1. Check **"Authentication"** → **"Policies"**
2. Ensure policies exist for the table
3. Verify you're authenticated when accessing data

### Issue: "Storage bucket not found"

**Solution**: Create the required storage buckets manually (see Step 3)

### Issue: Frontend can't connect to Supabase

**Solution**:
1. Verify `.env` has correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
2. Ensure `USE_MOCK_MODE = false` in `src/lib/supabase.ts`
3. Rebuild and redeploy frontend

---

## What About Edge Functions?

Edge Functions **cannot be deployed manually**. You have two options:

### Option 1: Skip Edge Functions (Simplest)
Your app will work without them, but AI features (content generation, image scraping) won't be available.

### Option 2: Set Up GitHub Actions (Advanced)

1. Push your code to GitHub
2. Create `.github/workflows/deploy-functions.yml`
3. Configure Supabase GitHub integration
4. Functions will deploy automatically on push

### Option 3: Install Supabase CLI Later

When you have admin access on your computer, install the CLI and deploy functions then.

---

## Production Checklist

Before going live, verify:

- [ ] All migrations applied successfully
- [ ] All tables visible in Table Editor
- [ ] Storage buckets created
- [ ] RLS policies enabled on all tables
- [ ] Authentication configured
- [ ] Frontend `.env` updated with production credentials
- [ ] `USE_MOCK_MODE = false` in `src/lib/supabase.ts`
- [ ] Frontend deployed to Vercel/Netlify
- [ ] Test sign up/login flow
- [ ] Test creating data (profiles, posts, etc.)
- [ ] Storage uploads working

---

## Need Help?

If you encounter issues:
1. Check the Supabase Dashboard **"Logs"** section
2. Check browser console for frontend errors
3. Verify all environment variables are correct
4. Review migration order and re-run if needed

---

**Next Step:** I'll help you create a combined migration script to make running all migrations easier!
