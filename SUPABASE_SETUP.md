# Supabase Setup Guide

Follow these steps to connect Iroshi Dress Maker to Supabase.

## Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click **New Project**
3. Give it a name: `iroshi-dress-maker`
4. Choose a region close to Sri Lanka (e.g. **Singapore**)
5. Set a strong database password
6. Wait for the project to initialize (~2 min)

---

## Step 2 — Get Your API Keys

In your Supabase project dashboard:

1. Go to **Project Settings → API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

---

## Step 3 — Configure Environment Variables

Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

⚠️ **NEVER commit `.env.local` to git.**  
The `.gitignore` already excludes it.

---

## Step 4 — Run the Database Migration

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Paste the contents of `supabase/migrations/001_initial_schema.sql`
4. Click **Run**

This creates:
- `categories` table (pre-seeded with Bridal, Rental)
- `dresses` table
- `dress_images` table
- `site_settings` table (pre-seeded with default row)
- Row Level Security (RLS) policies

---

## Step 4b — Seed Initial Dresses & Multi-Angle Photos (Recommended)

1. In **SQL Editor**, click **New Query**
2. Paste the contents of `supabase/migrations/002_seed_sample_dresses.sql`
3. Click **Run**

This populates:
- 4 Haute-Couture Bridal Gowns (`BR001` through `BR004`)
- 4 Evening & Reception Rental Gowns (`RN001` through `RN004`)
- Multi-angle high-resolution dress photographs in `dress_images`
- Atelier contact coordinates and WhatsApp number in `site_settings`

---

## Step 5 — Create Storage Buckets

In your Supabase project:

1. Go to **Storage**
2. Click **New Bucket**
3. Create: `dress-images`
   - Public: ✅ Yes
4. Create: `360-sequence`
   - Public: ✅ Yes

---

## Step 6 — Create the Admin User

1. Go to **Authentication → Users**
2. Click **Add User → Create New User**
3. Enter:
   - Email: (your admin email)
   - Password: (strong password)
4. This user will have access to the admin dashboard

---

## Step 7 — Test the Connection

Restart the dev server:

```bash
npm run dev
```

The application should now connect to Supabase.

---

## Storage Buckets

| Bucket | Contents | Public |
|--------|---------|--------|
| `dress-images` | Collection dress photos | Yes |
| `360-sequence` | 300 frame images (ezgif-frame-001.webp ... ezgif-frame-300.webp) | Yes |

---

## Upload 360 Frames

1. In Supabase Storage, open the `360-sequence` bucket
2. Upload all 300 frames named exactly:
   ```
   ezgif-frame-001.webp
   ezgif-frame-002.webp
   ...
   ezgif-frame-300.webp
   ```
3. The 360° animation will work automatically once all frames are uploaded

---

## Troubleshooting

**Error: NEXT_PUBLIC_SUPABASE_URL is not set**  
→ Make sure `.env.local` exists and has the correct values. Restart the dev server.

**Error: relation "dresses" does not exist**  
→ Run the SQL migration (Step 4).

**Error: new row violates row-level security policy**  
→ Make sure you are logged in as an admin user in the admin dashboard.
