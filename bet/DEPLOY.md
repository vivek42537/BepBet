# 🚀 Deployment Checklist

## 1️⃣ Supabase Setup (5 minutes)

### Create Project
- [ ] Go to [supabase.com](https://supabase.com)
- [ ] Click "New Project"
- [ ] Choose org, name it (e.g., "bepbet"), set password
- [ ] Wait for provisioning (~2 mins)

### Run SQL Scripts
- [ ] Navigate to SQL Editor in dashboard
- [ ] Create new query, paste `supabase-schema.sql`, run it
- [ ] Create another query, paste `supabase-functions.sql`, run it

### Get Credentials
- [ ] Go to Settings → API
- [ ] Copy **Project URL**
- [ ] Copy **anon/public key**

## 2️⃣ Enable Google Auth (Optional - 5 minutes)

### Google Cloud Console
- [ ] Go to [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Create new project or select existing
- [ ] Navigate to APIs & Services → Credentials
- [ ] Create OAuth 2.0 Client ID (Application type: Web application)
- [ ] Add authorized redirect URI:
  ```
  https://[your-project-ref].supabase.co/auth/v1/callback
  ```
  (Replace `[your-project-ref]` with your actual Supabase project ref from URL)
- [ ] Copy Client ID and Client Secret

### Supabase Dashboard
- [ ] Go to Authentication → Providers
- [ ] Enable **Google**
- [ ] Paste Client ID and Client Secret
- [ ] Save

**Result:** Users will see "Sign in with Google" button automatically!

## 3️⃣ Deploy Frontend to Vercel (2 minutes)

### Configure Environment
```bash
cd frontend
```

Update `.env` with your Supabase credentials:
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

### Deploy
```bash
npx vercel
```

Follow prompts:
- [ ] Link to Vercel account (first time only)
- [ ] Accept project name
- [ ] **IMPORTANT:** Add environment variables when prompted:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

### Update Supabase Redirect URLs
- [ ] Copy your Vercel URL (e.g., `https://bet-abc123.vercel.app`)
- [ ] In Supabase: Authentication → URL Configuration
- [ ] Set **Site URL**: `https://your-app.vercel.app`
- [ ] Add to **Redirect URLs**: `https://your-app.vercel.app/**`

## 4️⃣ Make First User Admin

- [ ] Sign in to your deployed app
- [ ] In Supabase SQL Editor, run:
  ```sql
  UPDATE users SET is_admin = true WHERE email = 'your@email.com';
  ```

## ✅ Done!

Your app is live at: `https://your-app.vercel.app`

### Test These Features:
- [ ] Sign in with Google (if enabled)
- [ ] Create a bet (as admin)
- [ ] View standings
- [ ] Check your profile

---

## 🔄 Future Deployments

After initial setup, deploying updates is just:

```bash
cd frontend
git add .
git commit -m "Your changes"
git push
```

Vercel auto-deploys on push! 🎉

---

## 🆘 Troubleshooting

### "Failed to fetch" errors
- Check environment variables in Vercel dashboard
- Verify Supabase project is active
- Check browser console for CORS errors

### Google Auth not showing
- Verify Google OAuth credentials are correct
- Check authorized redirect URI matches exactly
- Try signing out of Supabase dashboard and back in

### RLS policy errors
- Make sure you ran both SQL scripts
- Check user exists in `users` table
- Verify you're signed in

### Users can't sign up
- Check if email confirmations are required (Authentication → Providers → Email)
- For testing, disable email confirmation in Supabase

---

## 📊 Monitoring

### Supabase Dashboard
- Database → Tables: View all data
- Authentication → Users: See who's signed up
- Logs: Debug API requests

### Vercel Dashboard
- Analytics: Traffic stats
- Deployments: Roll back if needed
- Logs: View runtime errors
