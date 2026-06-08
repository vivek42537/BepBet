# BepBet - Casual Betting Web App 🎲

A serverless betting application for close friend groups, built with Next.js 15, Supabase, and Claude AI.

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)

## ✨ Features

- **🤖 Natural Language Bet Creation** - "I bet $20 the Warriors win tonight"
- **👥 Multi-Taker System** - Multiple users can take opposing sides
- **⚖️ Flexible Settlement** - Any participant can settle bets
- **📊 Dual Ledger System** - Permanent history + monthly working ledger
- **💰 Debt Simplification** - Minimizes Venmo transactions
- **🗳️ Consensus Reset** - 100% vote required for monthly settlement
- **🏆 Lifetime Leaderboard** - Track all-time performance
- **🔒 Private Access** - Group passcode protection
- **🌙 Dark Mode** - Beautiful, mobile-responsive UI

## 🚀 Quick Start

```bash
# Install dependencies
- Install dependencies: drizzle-orm, postgres, iron-session, bcryptjs, @anthropic-ai/sdk, zod, shadcn/ui
npm install

# Set up environment variables (see .env.example)
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
- Generate migration SQL from Drizzle schema
npm run db:generate
- Apply migrations to Supabase database using DIRECT_URL
npm run db:push

# Start development server on port 3000
npm run dev
```

## 📋 Prerequisites

1. **Supabase Account** (free tier) - https://supabase.com
   - Create project and get connection strings
   - Transaction pooler (port 6543) + Direct (port 5432)

2. **Google Gemini API Key** (FREE!) - https://ai.google.dev
   - Sign up and get API key (takes 2 minutes)
   - Completely free - 1,500 requests/day
   - See [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) for details

3. **Environment Variables** - Required in `.env.local`:
   ```bash
   DATABASE_URL=postgresql://...pooler.supabase.com:6543/...?pgbouncer=true
   DIRECT_URL=postgresql://...compute.amazonaws.com:5432/...
   SESSION_SECRET=$(openssl rand -base64 32)
   GROUP_PASSCODE=yourSecretPasscode
   GEMINI_API_KEY=AIzaSyC...your-key-here
   CRON_SECRET=$(openssl rand -base64 32)
   ```

## 📖 User Flow

```
1. Register → Requires GROUP_PASSCODE
2. Create Bet → "I bet $50 the Lakers win"
3. Wait for Takers → Others join the bet
4. Settle → Any participant marks winner
5. Check Ledger → View simplified payouts
6. Monthly Reset → All users vote, ledger resets
```

## 🏗️ Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Database | Supabase Postgres |
| ORM | Drizzle (serverless-optimized) |
| Auth | iron-session (cookie-based) |
| AI | Google Gemini (FREE!) |
| Styling | Tailwind CSS v4 |
| UI | shadcn/ui components |
| Deployment | Vercel |

## 📁 Project Structure

```
BepBet/
├── app/
│   ├── (auth)/              # Login, Register pages
│   ├── (authenticated)/     # Feed, Ledger pages
│   └── api/                 # All API routes
├── components/ui/           # shadcn components
├── lib/
│   ├── algorithms/          # Debt simplification
│   ├── auth/                # Session management
│   ├── claude/              # AI bet parsing
│   ├── db/                  # Database & schema
│   └── utils/               # Helpers
├── middleware.ts            # Route protection
└── vercel.json             # Cron config
```

## 🎮 API Routes

### Auth
- `POST /api/auth/register` - Create account with GROUP_PASSCODE
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Bets
- `GET /api/bets` - List all bets
- `POST /api/bets` - Create bet (Claude AI parsing)
- `POST /api/bets/[id]/take` - Take bet
- `POST /api/bets/[id]/settle` - Settle (CREATOR_WON | TAKERS_WON)

### Ledger
- `GET /api/ledger/monthly` - Current month transactions
- `GET /api/ledger/simplified` - Optimized payouts
- `POST /api/ledger/vote` - Vote for reset
- `POST /api/ledger/reset` - Reset month (100% consensus)

### Users
- `GET /api/users` - List with lifetime stats

## 🔐 Security Features

- ✅ Bcrypt password hashing (10 rounds)
- ✅ Encrypted session cookies (iron-session)
- ✅ GROUP_PASSCODE registration protection
- ✅ Serverless connection pooling (prevents exhaustion)
- ✅ SQL injection prevention (Drizzle ORM)
- ✅ CRON_SECRET endpoint protection

## 🌐 Deployment

Full deployment guide: [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Quick Deploy:**
```bash
# Push to GitHub
git init && git add . && git commit -m "Initial commit"
git remote add origin https://github.com/YOU/bepbet.git
git push -u origin main

# Deploy to Vercel
- Install Vercel CLI globally
npm i -g vercel
- Login to Vercel account
vercel login
- Deploy project to Vercel
vercel --prod

# Add environment variables in Vercel dashboard
```

## 🧪 Testing

```bash
# Build for production (type checking)
npm run build

# Run locally
npm run dev
```

**Test Flow:**
1. Register 2-3 users (use GROUP_PASSCODE)
2. User 1 creates bet
3. User 2 takes bet → Status changes to ACTIVE
4. User 1 or 2 settles → Transactions created
5. Check ledger → Simplified payouts shown
6. All users vote → Reset becomes available

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection timeout | Add `?pgbouncer=true` to DATABASE_URL |
| Invalid passcode | Check GROUP_PASSCODE in .env.local |
| Bet not parsing | Simplify: "I bet $10 that X happens" |
| Votes not resetting | Ensure all users voted (check count) |

## 💡 How It Works

### Bet Lifecycle
```
CREATE (OPEN) → TAKE (≥1 taker → ACTIVE) → SETTLE (WON/VOID)
```

### Debt Simplification
**Example:**
- A owes B $50, B owes C $30, C owes A $20
- **Simplified:** A → B $20, A → C $10 (2 transactions instead of 3)

### Monthly Reset
1. Bets accumulate → Transactions in `monthly_transactions`
2. All users vote "Confirm Settlement"
3. At 100%: Update `lifetime_wins`/`lifetime_losses`, delete `monthly_transactions`

## 📊 Database Schema

**Key Tables:**
- `users` - Accounts + lifetime stats
- `bets` - Individual bets with status
- `bet_takers` - Participants (many-to-many)
- `lifetime_transactions` - Permanent audit trail
- `monthly_transactions` - Working ledger (cleared monthly)
- `monthly_ledger_meta` - Period tracking
- `ledger_votes` - Consensus mechanism

## 📚 Documentation

- [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Development progress
- [.env.example](./.env.example) - Environment variable template

## 🛠️ Development

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:generate  # Generate migration SQL
npm run db:push      # Apply migrations
npm run db:studio    # Open Drizzle Studio GUI
```

## 💰 Estimated Costs

**For 10 users, ~300 bets/month:**
- Vercel: $0 (free tier)
- Supabase: $0 (free tier)
- Gemini API: **$0 (free tier - 1,500 requests/day!)**
- **Total: $0/month** 🎉

## 🎯 Key Features Explained

### Serverless Optimization
- Global singleton DB client
- `max: 1` connection per function
- `prepare: false` for PgBouncer
- No connection exhaustion

### Settlement Authorization
- Any participant (creator OR taker) can settle
- Promotes trust in friend groups
- Prevents deadlocks

### Dual Ledger System
- **Lifetime**: Never deleted, permanent audit
- **Monthly**: Working ledger, cleared on reset
- Best of both worlds

## 🚧 Future Enhancements

- [ ] Real-time updates (Supabase subscriptions)
- [ ] Bet categories/tags
- [ ] Push notifications
- [ ] CSV export
- [ ] Mobile app (React Native)
- [ ] Bet comments
- [ ] User avatars

## 📄 License

MIT

## 🙏 Credits

Built with:
- [Next.js](https://nextjs.org) - React framework
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Drizzle ORM](https://orm.drizzle.team) - Database toolkit
- [Anthropic Claude](https://anthropic.com) - AI parsing
- [Supabase](https://supabase.com) - Database hosting
- [Vercel](https://vercel.com) - Deployment platform

---

**Ready to deploy?** → [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

**Need help?** → Check troubleshooting section above
