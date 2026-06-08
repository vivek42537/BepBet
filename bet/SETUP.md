# BepBet - Simplified Setup with Vercel + Supabase

## 🎯 What Changed
- ❌ Removed: FastAPI backend, Render deployment, SQLAlchemy, custom auth
- ✅ Added: Direct Supabase integration, Vercel hosting, magic link auth

## Setup Instructions

### 1. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the SQL Editor, run these files in order:
   - First: `supabase-schema.sql` (creates tables and RLS policies)
   - Second: `supabase-functions.sql` (creates helper functions)
3. Get your project credentials:
   - Go to Project Settings → API
   - Copy the "Project URL" and "anon public" key

### 2. Configure Frontend

Update `frontend/.env`:
```bash
VITE_SUPABASE_URL=your_project_url_here
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

### 3. Deploy to Vercel

```bash
cd frontend
npm install
npx vercel
```

Follow the prompts:
- Link to your Vercel account
- Set environment variables when prompted
- Deploy!

### 4. Configure Auth Redirect

In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add your Vercel URL to "Site URL" (e.g., `https://yourapp.vercel.app`)
3. Add to "Redirect URLs": `https://yourapp.vercel.app/**`

## How It Works Now

### Authentication
- Users enter email + name
- Supabase sends a magic link to their email
- Click link → auto signed in
- No passwords, no JWT tokens to manage!

### Data Flow
```
Frontend (React) → Supabase Client → Postgres Database
```

That's it! No backend server needed.

### Row Level Security (RLS)
Supabase enforces data access rules at the database level:
- Users can only see their own transactions
- Only admins can settle bets
- Everyone can view bets and standings

## Development

```bash
cd frontend
npm run dev
```

Visit http://localhost:5173

## What You Can Delete

You can safely delete:
- `/backend` folder (entire FastAPI app)
- `/api` folder (if exists)
- `requirements.txt`
- Any Render config files

Keep:
- `/frontend` folder
- `supabase-schema.sql`
- `supabase-functions.sql`
- This README

## Adding an Admin

After first login, run this in Supabase SQL Editor:

```sql
UPDATE users
SET is_admin = true
WHERE email = 'your@email.com';
```

## Need Help?

- Supabase Docs: https://supabase.com/docs
- Vercel Docs: https://vercel.com/docs
- Check browser console for errors
