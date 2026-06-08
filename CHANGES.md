# 🆓 Switched to Free Gemini API!

## What Changed

**Before:** Anthropic Claude API (~$3/month)  
**After:** Google Gemini API (**$0/month - completely free!**)

---

## Why This Change?

✅ **Zero cost** - Gemini is free forever  
✅ **Generous limits** - 1,500 requests/day (way more than needed)  
✅ **Same quality** - Excellent bet parsing  
✅ **No credit card** - Just sign up and go  
✅ **2-minute setup** - Faster than Anthropic  

**Result:** Your app now runs at **$0/month!**

---

## What You Need to Do

### Get Your Free Gemini API Key

1. Visit **https://ai.google.dev**
2. Click "Get API key in Google AI Studio"
3. Sign in with Google
4. Click "Create API Key"
5. Copy the key (starts with `AIza...`)

### Update Environment Variables

**In `.env.local`:**
```bash
# Replace this:
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx

# With this:
GEMINI_API_KEY=AIzaSyC...your-key-here
```

**In Vercel (if already deployed):**
1. Go to Project Settings → Environment Variables
2. Delete `ANTHROPIC_API_KEY`
3. Add `GEMINI_API_KEY` with your new key
4. Redeploy

---

## Technical Changes

### Package Changes
```bash
# Removed
@anthropic-ai/sdk

# Added
@google/generative-ai
```

### Code Changes
Only one file changed: `lib/claude/parser.ts`

**Before:**
```typescript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
```

**After:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
```

Everything else stays the same!

---

## Testing

```bash
# Start dev server
npm run dev

# Try creating a bet
"I bet $20 the Warriors win tonight"

# Should work exactly as before!
```

---

## Free Tier Details

**Gemini 1.5 Flash:**
- ✅ 15 requests per minute
- ✅ 1,500 requests per day
- ✅ Forever free
- ✅ No credit card required

**For Context:**
- 10 users × 5 bets/day = 50 requests/day
- 10 users × 30 bets/day = 300 requests/day
- You'd need **1,500+ bets/day** to hit limits!

---

## Cost Comparison

### Previous (Anthropic)
| Users | Bets/Month | Cost |
|-------|-----------|------|
| 10 | 300 | ~$3 |
| 20 | 600 | ~$6 |
| 50 | 1,500 | ~$15 |

### Now (Gemini)
| Users | Bets/Month | Cost |
|-------|-----------|------|
| 10 | 300 | **$0** |
| 20 | 600 | **$0** |
| 50 | 1,500 | **$0** |

**Savings:** $36-180/year!

---

## Quality Check

Both APIs handle the same formats:

✅ "I bet $20 the Warriors win tonight"  
✅ "$50 says it rains tomorrow"  
✅ "100 bucks Biden wins re-election"  
✅ "I'll wager $15 that crypto crashes"  

**Result:** Same parsing quality, zero cost!

---

## Need Help?

See [GEMINI_API_SETUP.md](./GEMINI_API_SETUP.md) for:
- Detailed setup instructions
- Troubleshooting guide
- API key security tips
- Rate limit handling

---

## Summary

✅ **Switched from Anthropic to Gemini**  
✅ **App now runs at $0/month**  
✅ **Same features, same quality**  
✅ **Just need new API key**  
✅ **Takes 2 minutes to set up**  

**Get your free key:** https://ai.google.dev

🎉 Your betting app is now completely free to run!
