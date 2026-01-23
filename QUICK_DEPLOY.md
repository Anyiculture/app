# 🚀 Quick Manual Deployment Steps

## 📌 TL;DR - What You Need to Do

### 1️⃣ Deploy Database (5-10 minutes)

1. **Open**: https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq
2. **Click**: SQL Editor (left sidebar)
3. **Click**: "+ New Query"
4. **Open**: `combined_migrations.sql` (in your project root)
5. **Copy/Paste** entire file into SQL Editor
6. **Click**: "Run" button
7. **Wait** for completion (may take 1-2 minutes)

### 2️⃣ Create Storage Buckets (2 minutes)

**Go to**: Storage → Create new bucket

Create these buckets:

```
✅ profile-photos (Public, 10MB limit)
✅ ai-generated-images (Public, 10MB limit)
✅ marketplace-images (Public, 10MB limit)
✅ event-images (Public, 10MB limit)
✅ education-images (Public, 10MB limit)
✅ visa-documents (Private, 50MB limit)
```

### 3️⃣ Update Frontend Code (1 minute)

**Edit**: `src/lib/supabase.ts`

Change this line:
```typescript
const USE_MOCK_MODE = true; // ❌ Change to false
```

To:
```typescript
const USE_MOCK_MODE = false; // ✅ Now it connects to real Supabase
```

### 4️⃣ Deploy Frontend (5 minutes)

**Option A - Vercel (Easiest):**

1. Go to: https://vercel.com
2. Click"Import Project" → Connect GitHub
3. Select your repository
4. Add environment variables:
   - `VITE_SUPABASE_URL` = `https://rxeymolxjcudkpbfyruq.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = (get from Supabase → Settings → API)
5. Click "Deploy"

**Option B - Netlify:**

1. Go to: https://netlify.com
2. Click "Add new site" → Import from Git
3. Select your repository
4. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add same environment variables as Vercel
6. Click "Deploy"

### 5️⃣ Test Your Deployment (2 minutes)

1. **Visit** your deployed URL
2. **Try** to sign up/sign in
3. **Check** that you can view marketplace/events/jobs

---

## ⚡ Super Quick Steps (Copy-Paste Ready)

```bash
# Step 1: Open Supabase
https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq/editor

# Step 2: Run combined_migrations.sql in SQL Editor

# Step 3: Create storage buckets (click Storage → New bucket)

# Step 4: Update src/lib/supabase.ts
USE_MOCK_MODE = false

# Step 5: Deploy to Vercel
https://vercel.com
```

---

## 🎯 Your Deployment URLs

**Supabase Dashboard**: https://supabase.com/dashboard/project/rxeymolxjcudkpbfyruq
- SQL Editor: Add `/editor` to URL
- Storage: Add `/storage/buckets` to URL  
- API Settings: Add `/settings/api` to URL

**Deployment Platforms**:
- Vercel: https://vercel.com
- Netlify: https://netlify.com

---

## 🔑 Important Values to Copy

**Get these from**: Supabase Dashboard → Settings → API

```
Project URL: https://rxeymolxjcudkpbfyruq.supabase.co
anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (copy from dashboard)
```

---

## ✅ Verification Checklist

After deployment, check:

- [ ] Can view tables in Supabase → Table Editor
- [ ] Can sign up for a new account
- [ ] Can sign in with credentials
- [ ] Can see marketplace/events/jobs pages
- [ ] No red errors in browser console
- [ ] Profile photo upload works

---

## ❌ Skip This (Optional/Advanced)

These are optional and require CLI:
- ~~Edge Functions deployment~~ (AI features won't work without these, but app still runs)
- ~~GitHub Actions setup~~

---

## 🆘 Quick Troubleshooting

**Problem**: "Relation does not exist"  
**Fix**: Re-run combined_migrations.sql

**Problem**: Frontend shows "Failed to fetch"  
**Fix**: Check USE_MOCK_MODE = false and env variables are correct

**Problem**: Can't upload images  
**Fix**: Create all storage buckets

**Problem**: "RLS policy violation"  
**Fix**: Migrations should have created policies automatically. Check they ran successfully.

---

## 📞 Need More Help?

See the full guide: `MANUAL_DEPLOYMENT.md`

---

**Total Time**: ~15-20 minutes for full deployment! 🚀
