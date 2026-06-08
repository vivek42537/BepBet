# BepBet Deployment Checklist

## 🔧 Fixes Applied

- [x] Fixed `get_lifetime_stats()` database function with explicit column aliasing
- [x] Added real-time Supabase subscriptions to all pages:
  - [x] Home page (bets, entries, user balance)
  - [x] Standings page (user balances, settlement status)
  - [x] Users page (users, transactions, entries)
- [x] Updated `supabase-functions.sql` with corrected function
- [x] Created `supabase-update.sql` for easy database updates
- [x] Build verified successful
- [x] Created troubleshooting guide

## 📋 Pre-Deployment Steps

### 1. Update Supabase Database
⚠️ **IMPORTANT: Do this FIRST before deploying frontend**

1. Open Supabase SQL Editor:
   - Go to: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/sql
   
2. Run the update script:
   - Open `supabase-update.sql` in your editor
   - Copy ALL the SQL
   - Paste into Supabase SQL Editor
   - Click **RUN**
   
3. Verify success:
   - Should see "Success. No rows returned" or query results
   - Check bottom section shows test results (user_count, bet_count)

### 2. Verify Vercel Environment Variables

Check that these environment variables are set in Vercel:

```bash
VITE_SUPABASE_URL=https://eghyysutzvnwjavafbuu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaHl5c3V0enZud2phdmFmYnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTE0MDIsImV4cCI6MjA5NDE4NzQwMn0.kSBI_FQx2Jpt1RbqB2nHij_OvvgPv3yoVCQOf2WvdoI
```

Visit: https://vercel.com/your-account/bet/settings/environment-variables

Or via CLI:
```bash
vercel env ls
```

### 3. Enable Realtime in Supabase

1. Go to: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/database/replication
2. Make sure these tables have Realtime enabled:
   - ✅ users
   - ✅ bets
   - ✅ entries
   - ✅ transactions
   - ✅ settlements

## 🚀 Deployment Steps

### Option A: Via Git (Recommended)

```bash
cd /Users/vivek.khanolkar/Documents/CODĘ/bet

# Check what's changed
git status

# Stage all changes
git add .

# Commit
git commit -m "Fix Standings page loading and add real-time table syncing

- Fixed get_lifetime_stats() function with explicit column aliasing
- Added real-time Supabase subscriptions for live data updates
- Updated Home, Standings, and Users pages with realtime channels
- Added troubleshooting guide and deployment documentation"

# Push to current branch (al)
git push origin al

# If you want to deploy to production:
# Merge to main and push
git checkout main
git merge al
git push origin main
```

Vercel will automatically deploy when you push to `main`.

### Option B: Via Vercel CLI

```bash
cd /Users/vivek.khanolkar/Documents/CODĘ/bet/frontend

# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

### Option C: Manual Deploy via Vercel Dashboard

1. Go to: https://vercel.com/your-account/bet
2. Click "Deploy"
3. Select the branch: `al` or `main`
4. Click "Deploy"

## ✅ Post-Deployment Verification

### 1. Test Standings Page
- [ ] Visit: https://frontend-one-xi-43.vercel.app/standings
- [ ] Should load and show user standings
- [ ] Should show settlement status card
- [ ] No "Loading..." stuck state
- [ ] Check browser console for errors (F12 → Console)

### 2. Test Users Page
- [ ] Visit: https://frontend-one-xi-43.vercel.app/users
- [ ] Should show all users with lifetime stats
- [ ] Should display: wagered, won, P/L, record
- [ ] Check browser console for errors

### 3. Test Real-time Syncing
- [ ] Open app in **two different browsers** (or incognito + regular)
- [ ] Log in to both
- [ ] In Browser 1: Create a new bet
- [ ] In Browser 2: Should see the bet appear automatically within 2-3 seconds
- [ ] In Browser 1: Enter a bet
- [ ] In Browser 2: Check Users page - balance should update automatically

### 4. Check Browser Console Logs
Open DevTools (F12) → Console. You should see logs like:
```
[Home] Bet change detected: {...}
[Standings] User change detected: {...}
[Users] Entry change detected: {...}
```

If you see these, real-time subscriptions are working! ✅

### 5. Check Network Tab
Open DevTools (F12) → Network → WS (WebSocket)
- [ ] Should see a WebSocket connection to Supabase
- [ ] Status should be "101 Switching Protocols" or connected

## 🐛 If Things Don't Work

### Standings Page Still Shows "Loading..."
1. Open browser console (F12)
2. Check for errors
3. Look for failed API calls in Network tab
4. Verify you ran `supabase-update.sql` in Supabase

### Users Page Shows Error
Run this in Supabase SQL Editor:
```sql
SELECT * FROM get_lifetime_stats();
```
If it errors, the function wasn't updated correctly.

### Real-time Not Working
Check:
1. Realtime is enabled for tables in Supabase
2. Browser console shows subscription messages
3. WebSocket connection in Network tab

See `TROUBLESHOOTING.md` for detailed debugging steps.

## 📊 Monitor After Deployment

### Vercel Deployment Logs
- https://vercel.com/your-account/bet/deployments

### Supabase Logs
- https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/logs

### Check for Errors
```bash
# If you have Vercel CLI
vercel logs https://frontend-one-xi-43.vercel.app
```

## 🎯 Expected Behavior After Fix

### Before (Broken)
- ❌ Standings page stuck on "Loading..."
- ❌ Users page shows errors
- ❌ Changes don't appear without manual refresh
- ❌ Have to refresh page to see new bets

### After (Fixed)
- ✅ Standings page loads immediately
- ✅ Users page shows all stats correctly
- ✅ New bets appear automatically across all sessions
- ✅ Balance updates appear live
- ✅ Entry counts update in real-time
- ✅ No manual refresh needed

## 📞 Support

If you encounter issues:
1. Check browser console for errors
2. Check Supabase logs
3. Check Vercel deployment logs
4. Refer to `TROUBLESHOOTING.md`
5. Verify all environment variables are set

---

**Time to deploy:** ~10 minutes  
**Complexity:** Low  
**Risk:** Low (all changes are additive, no breaking changes)
