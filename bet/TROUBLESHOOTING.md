# BepBet Troubleshooting Guide

## Current Issues Fixed

### Issue 1: Standings Tab Not Loading
**Problem:** The Standings page was not displaying data  
**Root Cause:** Database query errors and missing real-time subscriptions  
**Fix Applied:**
- Updated `get_lifetime_stats()` function with explicit column aliasing
- Added real-time Supabase subscriptions to auto-refresh data
- Added proper error handling in frontend

### Issue 2: Tables Not Syncing
**Problem:** Data changes weren't reflected across different tabs/users  
**Root Cause:** No real-time subscriptions configured  
**Fix Applied:**
- Added Supabase real-time channels for all pages:
  - Home: listens to bets, entries, and user changes
  - Standings: listens to user changes
  - Users: listens to users, transactions, and entries changes
- Enabled realtime publication for all tables in database

## Deployment Steps

### 1. Update Database Functions
Run the SQL script in your Supabase SQL Editor:

```bash
# Navigate to: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/sql
# Copy and paste contents of supabase-update.sql
# Click "Run" button
```

Or via command line (if you have supabase CLI):
```bash
cd /Users/vivek.khanolkar/Documents/CODĘ/bet
supabase db push
```

### 2. Verify Environment Variables in Vercel
Make sure these are set in your Vercel project settings:

```bash
VITE_SUPABASE_URL=https://eghyysutzvnwjavafbuu.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVnaHl5c3V0enZud2phdmFmYnV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MTE0MDIsImV4cCI6MjA5NDE4NzQwMn0.kSBI_FQx2Jpt1RbqB2nHij_OvvgPv3yoVCQOf2WvdoI
```

Check with:
```bash
# If you have Vercel CLI installed
vercel env ls
```

### 3. Deploy Frontend Changes
```bash
cd /Users/vivek.khanolkar/Documents/CODĘ/bet
git add .
git commit -m "Fix Standings page and add real-time table syncing"
git push origin al
```

Then merge to main and deploy:
```bash
git checkout main
git merge al
git push origin main
```

Vercel will auto-deploy on push to main.

### 4. Verify Fixes
After deployment, test:

1. **Standings Page:**
   - Visit https://frontend-one-xi-43.vercel.app/standings
   - Should show all users with their balances
   - Should update automatically when balances change

2. **Users Page:**
   - Visit https://frontend-one-xi-43.vercel.app/users
   - Should show lifetime stats for all users
   - Should auto-refresh when data changes

3. **Real-time Sync:**
   - Open the app in two browser windows
   - Create a bet in one window
   - Should appear in the other window within seconds

## Common Issues & Solutions

### "Loading..." appears forever on Standings
**Cause:** Database function error or RLS policy blocking access  
**Fix:**
```sql
-- Run in Supabase SQL Editor
SELECT * FROM get_lifetime_stats();
-- If this errors, check the error message
```

### Data doesn't update in real-time
**Cause:** Realtime not enabled for tables  
**Fix:**
```sql
-- Verify realtime is enabled
SELECT tablename FROM pg_publication_tables 
WHERE pubname = 'supabase_realtime';

-- Should show: users, bets, entries, transactions, settlements
```

### "ambiguous column name" error
**Cause:** Database function has column name conflicts  
**Fix:** Already fixed in `supabase-update.sql` - run that script

### User balance shows $0 but should have money
**Cause:** `update_balance` function not working  
**Debug:**
```sql
-- Check user balance
SELECT id, name, balance FROM users WHERE email = 'your@email.com';

-- Check transactions
SELECT * FROM transactions WHERE user_id = 'YOUR_USER_ID' ORDER BY created_at DESC;

-- Manually recalculate (if needed)
UPDATE users 
SET balance = (
  SELECT COALESCE(SUM(amount), 0) 
  FROM transactions 
  WHERE user_id = users.id
)
WHERE id = 'YOUR_USER_ID';
```

### Realtime subscriptions not working
**Check browser console:**
```javascript
// Should see messages like:
[Home] Bet change detected: {...}
[Standings] User change detected: {...}
```

**If not seeing these messages:**
1. Check Supabase realtime is enabled in project settings
2. Verify network tab shows WebSocket connection to Supabase
3. Check for console errors about subscription failures

## Database Health Checks

### Check all functions exist:
```sql
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_name IN ('get_lifetime_stats', 'update_balance');
```

### Check RLS is enabled:
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
-- All should show 't' (true)
```

### Check indexes:
```sql
SELECT indexname, tablename 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;
```

## Performance Monitoring

### Slow queries:
```sql
-- Check for slow running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active' AND now() - pg_stat_activity.query_start > interval '5 seconds';
```

### Connection count:
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity WHERE state = 'active';
```

## Support

If issues persist:
1. Check Supabase logs: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/logs
2. Check Vercel deployment logs: https://vercel.com/your-project/deployments
3. Check browser console for JavaScript errors
4. Check network tab for failed API requests

## Useful Supabase Links
- Project Dashboard: https://eghyysutzvnwjavafbuu.supabase.co
- SQL Editor: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/sql
- Table Editor: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/editor
- Authentication: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/auth/users
- Logs: https://eghyysutzvnwjavafbuu.supabase.co/project/eghyysutzvnwjavafbuu/logs
