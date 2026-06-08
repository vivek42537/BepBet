# BepBet 🎲

A sleek, free betting platform for closed friend groups. Place bets on anything, track balances, and settle monthly!

![React](https://img.shields.io/badge/React-18+-blue)
![Supabase](https://img.shields.io/badge/Supabase-Postgres-green)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

## ✨ Features

- 🎨 **Sleek UI** - Modern dark theme with purple/pink gradient branding
- 🎲 **Fun Memes** - Random meme assigned to every bet
- 🔐 **Google Auth** - Sign in with Google (optional magic link too)
- 💰 **Smart Balances** - Start at $0, go negative = IOUs
- 📊 **Live Odds** - American odds calculator when multiple people bet
- 🏆 **Standings** - Real-time tracking of who owes what
- 👥 **User Stats** - Lifetime statistics with auto-refresh
- 🤝 **Monthly Settlement** - Everyone confirms, then reset to $0
- 📈 **Transaction History** - Full audit trail of all bets

## 🚀 Quick Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) → New Project
2. Copy your project URL and anon key (Settings → API)
3. In SQL Editor, run:
   - `supabase-schema.sql` (creates tables)
   - `supabase-functions.sql` (creates helper functions)

### 2. Enable Google Auth (Optional)

In Supabase Dashboard:
1. **Authentication → Providers → Google**
2. Enable the toggle
3. Add your Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 Client ID
   - Add authorized redirect: `https://[your-project].supabase.co/auth/v1/callback`
   - Copy Client ID & Secret to Supabase

That's it! Google Sign-In will automatically appear in your app.

### 3. Configure Frontend

```bash
cd frontend
npm install
```

Update `frontend/.env`:
```bash
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 4. Deploy to Vercel

```bash
npx vercel
```

Set environment variables when prompted. Done!

### 5. Make First User Admin

After signing in, run in Supabase SQL Editor:
```sql
UPDATE users SET is_admin = true WHERE email = 'your@email.com';
```

## 🛠️ Tech Stack

**Frontend:**
- React 18 + Vite
- React Router
- Supabase JS Client

**Backend:**
- Supabase (Postgres + Auth + RLS)

**Infrastructure:**
- Vercel (hosting)
- Supabase (database & auth)

## 📖 How It Works

### Creating Bets
Anyone can create a bet with:
- Custom title & description
- Entry fee amount
- Random meme auto-assigned!

### Entering Bets
- Pay entry fee → balance goes negative (you owe money)
- Submit your prediction
- Watch live odds update as more people enter

### Settling Bets
- Admin marks winners
- Winners' balances increase by their share of the pool
- Losers stay negative
- Check **Standings** to see who owes what

### Monthly Settlement
1. View standings (positive = collect, negative = owe)
2. Settle via Venmo/Zelle outside the app
3. Everyone clicks "I've Settled"
4. When all ready, admin clicks "Settle & Reset"
5. All balances → $0, start fresh!

## 🎯 Example Flow

**Scenario:** Golf bet, $10 entry

```
1. Alice creates: "Will John shoot above 90?"
2. Three people enter:
   - Alice: "Yes, above 90" → Balance: -$10
   - Bob: "Yes, above 90" → Balance: -$10  
   - Charlie: "No, 90 or below" → Balance: -$10
   
3. Pool: $30

4. John shoots 95 (above 90!)

5. Admin settles → Alice & Bob win
   - Alice: -$10 + $15 = +$5 ✅
   - Bob: -$10 + $15 = +$5 ✅
   - Charlie: -$10 (lost) ❌

6. Month end:
   - Alice collects $5
   - Bob collects $5
   - Charlie pays $10
   - Reset all to $0
```

## 📱 Pages

- **Home** - List all active/settled bets
- **Users** - Lifetime statistics table (live updates)
- **Standings** - Current balances + settlement flow
- **Profile** - Your transaction history
- **Bet Details** - Meme, odds, entries, settle option

## 🎨 Branding

BepBet uses a custom dark theme with:
- Primary: Purple (#6366f1)
- Accent: Pink (#ec4899)
- Success: Green (#10b981)
- Danger: Red (#ef4444)
- Gradient navigation and buttons
- Dice emoji (🎲) in logo

## 📊 Statistics Tracked

**Per User:**
- Current balance (resets monthly)
- Lifetime wagered
- Lifetime won  
- Lifetime profit/loss
- Win/loss record
- Win percentage

## 🔒 Security

- Google OAuth + Magic Link auth
- Row Level Security (RLS) enforced at database
- JWT tokens managed by Supabase
- HTTPS enforced
- No real money handled
- Virtual balances only

## 📂 Project Structure

```
bet/
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── lib/
│   │   │   ├── supabase.js    # Supabase client
│   │   │   └── api.js         # API functions
│   │   ├── components/         # Reusable components
│   │   └── pages/              # Route pages
│   ├── package.json
│   └── .env.example
├── supabase-schema.sql         # Database schema + RLS
├── supabase-functions.sql      # Helper functions
└── README.md
```

## 🌐 Local Development

```bash
cd frontend
npm run dev
```

Visit: http://localhost:5173

## 🤝 Contributing

This is a personal project for friends, but feel free to fork and customize for your group!

## 📄 License

MIT License - feel free to use and modify!

## 🎉 Credits

Built with ❤️ using:
- React + Vite
- Supabase
- Vercel
- Claude Code (AI pair programmer)

---

**Questions?** Check `SETUP.md` for detailed setup instructions!
