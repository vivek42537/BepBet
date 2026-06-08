# BepBet Deployment Guide

## ✅ Application Complete

All features have been implemented:
- ✅ Authentication (login, register, logout)
- ✅ Bet creation with Claude AI parsing
- ✅ Multi-taker betting system
- ✅ Settlement by any participant
- ✅ Dual ledger system (lifetime + monthly)
- ✅ Debt simplification algorithm
- ✅ Consensus-based monthly reset
- ✅ Lifetime leaderboard
- ✅ Mobile-responsive dark UI
- ✅ Build passes (19 routes generated)

## Step 1: Create Supabase Database

1. Go to https://supabase.com and sign in/create account
2. Click "New Project"
3. Fill in project details:
   - Name: `bepbet`
   - Database Password: (generate strong password and save it)
   - Region: Choose closest to you
4. Wait ~2 minutes for project to provision

5. Get connection strings:
   - Go to Project Settings → Database
   - Find "Connection string" section
   - **Transaction Pooler** (for DATABASE_URL):
     ```
     postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres
     ```
   - **Direct connection** (for DIRECT_URL):
     ```
     postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.compute.amazonaws.com:5432/postgres
     ```

## Step 2: Update Environment Variables

Edit `.env.local`:

```bash
# Replace with your Supabase connection strings
DATABASE_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT]:[PASSWORD]@aws-0-us-west-1.compute.amazonaws.com:5432/postgres

# Generate secure secrets
SESSION_SECRET=$(openssl rand -base64 32)
CRON_SECRET=$(openssl rand -base64 32)

# Set your group passcode
GROUP_PASSCODE=yourSecretPasscode2026

# Add your FREE Gemini API key from https://ai.google.dev (takes 2 minutes!)
GEMINI_API_KEY=AIzaSyC...your-key-here

NODE_ENV=development
```

**Generate secrets on Mac/Linux:**
```bash
echo "SESSION_SECRET=$(openssl rand -base64 32)" >> .env.local
echo "CRON_SECRET=$(openssl rand -base64 32)" >> .env.local
```

## Step 3: Run Database Migrations

```bash
# Generate migration SQL from schema
npm run db:generate

# Apply migrations to Supabase
npm run db:push
```

You should see output confirming tables were created:
- users
- bets
- bet_takers
- lifetime_transactions
- monthly_transactions
- monthly_ledger_meta
- ledger_votes

## Step 4: Test Locally

```bash
# Start development server
npm run dev
```

Open http://localhost:3000 and test:

1. **Register** (you'll need the GROUP_PASSCODE)
2. **Create a bet**: "I bet $20 the Warriors win tonight"
3. **Login with another user** (register a second account)
4. **Take the bet** from user 2
5. **Settle the bet** (click "Creator Won" or "Takers Won")
6. **Check ledger** - view simplified payouts
7. **Vote to settle** - both users vote
8. **Reset monthly** - when 100% voted

## Step 5: Deploy to Vercel

### Option A: GitHub (Recommended)

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: BepBet complete"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/bepbet.git
   git push -u origin main
   ```

2. **Deploy on Vercel:**
   - Go to https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository
   - Vercel will auto-detect Next.js

3. **Add Environment Variables in Vercel:**
   - Go to Project Settings → Environment Variables
   - Add each variable from `.env.local`:
     - `DATABASE_URL` (production Supabase URL)
     - `DIRECT_URL` (production direct connection)
     - `SESSION_SECRET`
     - `GROUP_PASSCODE`
     - `GEMINI_API_KEY`
     - `CRON_SECRET`
   - Set environment: Production, Preview, Development (all three)

4. **Deploy:**
   - Click "Deploy"
   - Wait ~2 minutes for build
   - Visit your production URL

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Add environment variables
vercel env add DATABASE_URL
vercel env add DIRECT_URL
vercel env add SESSION_SECRET
vercel env add GROUP_PASSCODE
vercel env add GEMINI_API_KEY
vercel env add CRON_SECRET

# Deploy to production
vercel --prod
```

## Step 6: Verify Production

1. Visit your Vercel URL
2. Register an account (use GROUP_PASSCODE)
3. Create a test bet
4. Check that keepalive cron is running:
   - Go to Vercel Dashboard → Project → Cron Jobs
   - Should see `/api/cron/keepalive` running every 5 minutes

## Troubleshooting

### Database Connection Errors

**Error:** "connection timeout"
- Check DATABASE_URL has `?pgbouncer=true` appended
- Verify Supabase project is not paused
- Check password is correct (no special characters that need URL encoding)

**Error:** "prepared statement not supported"
- Make sure you're using transaction pooler (port 6543)
- Verify `prepare: false` in `lib/db/client.ts`

### Authentication Issues

**Error:** "Invalid group passcode"
- Verify GROUP_PASSCODE in Vercel matches your .env.local
- Check for trailing spaces in environment variable

**Error:** "Session not persisting"
- In production, ensure SESSION_SECRET is set
- Check cookies are enabled in browser
- Verify `secure: true` in production

### Gemini API Errors

**Error:** "Failed to parse bet"
- Check GEMINI_API_KEY is valid (starts with AIza)
- Get free key from https://ai.google.dev
- Test with simpler bet: "I bet $10 it rains"
- Free tier: 1,500 requests/day (plenty for friend groups!)

### Build Errors

**Error:** "Type error in ..."
- Run `npm run build` locally first
- Check TypeScript version matches
- Verify all imports are correct

### Cron Job Not Running

- Verify `vercel.json` is committed to git
- Check Vercel Dashboard → Cron Jobs
- Ensure CRON_SECRET matches in environment

## Monitoring

**Vercel Dashboard:**
- Analytics → Track page views, API calls
- Logs → Real-time function logs
- Deployments → View deployment history

**Supabase Dashboard:**
- Table Editor → View/edit data manually
- Database → Monitor connections
- Logs → Database query logs

## Cost Estimates

**Free Tier (suitable for small groups):**
- Vercel: 100GB bandwidth, unlimited functions
- Supabase: 500MB database, 2GB bandwidth
- Gemini: FREE forever - 1,500 requests/day (no credit card!)

**Expected monthly costs for 10 users:**
- Vercel: $0 (within free tier)
- Supabase: $0 (within free tier)
- Gemini: **$0 (completely free!)**
- **Total: $0/month** 🎉

*Even at 300 bets/day, still free with Gemini!*

## Security Checklist

- ✅ Passwords hashed with bcrypt
- ✅ Session cookies encrypted and httpOnly
- ✅ GROUP_PASSCODE required for registration
- ✅ API keys server-side only
- ✅ SQL injection prevented (Drizzle ORM)
- ✅ CRON_SECRET protects keepalive endpoint
- ✅ HTTPS enforced in production

## Maintenance

**Weekly:**
- Check Vercel logs for errors
- Monitor Supabase database size

**Monthly:**
- Review Anthropic API usage
- Check cron job execution logs

**As Needed:**
- Rotate SESSION_SECRET if compromised
- Update GROUP_PASSCODE when new users join
- Backup database (Supabase → Settings → Backups)

## Support

- Vercel Issues: https://vercel.com/help
- Supabase Issues: https://supabase.com/docs
- Anthropic API: https://docs.anthropic.com

## Next Steps (Optional Enhancements)

- Add bet categories/tags
- Real-time updates with Supabase subscriptions
- Push notifications for bet activity
- Export monthly reports to CSV
- Mobile app with React Native
- Bet history and statistics
- User avatars
- Dark/light mode toggle
- Bet comments/discussion

Your betting app is production-ready! 🎉
