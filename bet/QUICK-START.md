# 🚀 Quick Start Guide

## ⏱️ 10-Minute Setup

### 1. Supabase (5 min)
```bash
# 1. Go to supabase.com → New Project
# 2. Copy Project URL and anon key
# 3. In SQL Editor, paste and run:
cat supabase-schema.sql
cat supabase-functions.sql
```

### 2. Google Auth - Optional (2 min)
```bash
# Supabase: Authentication → Providers → Google → Enable
# Add OAuth credentials from console.cloud.google.com
```

### 3. Frontend Deploy (3 min)
```bash
cd frontend

# Update .env with your Supabase credentials
echo "VITE_SUPABASE_URL=https://xxx.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=eyJhb..." >> .env

# Deploy
npx vercel
```

### 4. Make Yourself Admin
```sql
-- Run in Supabase SQL Editor after signing in
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

## 🎉 Done!

Your app is live. Test it:
- Sign in with Google
- Create a bet
- View standings

## 📚 Detailed Guides

- **Full deployment:** See `DEPLOY.md`
- **What changed:** See `MIGRATION-SUMMARY.md`
- **Setup details:** See `SETUP.md`
- **Main docs:** See `README.md`

## 🆘 Common Issues

**Build fails?**
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

**Auth not working?**
- Check environment variables in Vercel dashboard
- Verify redirect URLs in Supabase
- Clear browser cache

**Database errors?**
- Verify both SQL files ran successfully
- Check RLS policies are enabled
- Ensure user exists in users table

## 🔧 Local Development

```bash
cd frontend
npm run dev
# Visit http://localhost:5173
```

**Note:** You need Supabase credentials in `.env` even for local dev!

## 📝 Project Structure

```
bet/
├── frontend/           # React app (deploy this)
│   ├── src/
│   │   ├── lib/       # Supabase client + API
│   │   ├── pages/     # Routes
│   │   └── components/
│   └── .env           # Add Supabase credentials here
├── supabase-schema.sql     # Run this first in Supabase
├── supabase-functions.sql  # Run this second in Supabase
├── DEPLOY.md               # Detailed deployment guide
└── README.md               # Full documentation
```

## ✅ Deployment Checklist

- [ ] Supabase project created
- [ ] `supabase-schema.sql` executed
- [ ] `supabase-functions.sql` executed
- [ ] `.env` file updated with Supabase credentials
- [ ] Deployed to Vercel with environment variables
- [ ] Redirect URLs configured in Supabase
- [ ] First user made admin
- [ ] Tested creating a bet
- [ ] Tested Google sign-in (if enabled)

---

**Questions?** Check the other docs or open an issue!
