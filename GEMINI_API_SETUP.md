# 🆓 Free Gemini API Setup

The app now uses **Google Gemini** instead of Anthropic Claude - it's completely **FREE** with generous limits!

## Why Gemini?

| Feature | Gemini (Free) | Anthropic Claude |
|---------|---------------|------------------|
| **Cost** | **FREE** | ~$3/month |
| **Rate Limit** | 15 requests/min | Pay per request |
| **Monthly Quota** | 1,500 requests/day | Usage-based |
| **Quality** | Excellent for bet parsing | Excellent |
| **Setup** | 2 minutes | 5 minutes |

**Result:** Your app runs at $0/month for AI! 🎉

---

## Setup Instructions (2 minutes)

### 1. Get Your Free API Key

1. Go to **https://ai.google.dev**
2. Click **"Get API key in Google AI Studio"**
3. Sign in with your Google account
4. Click **"Create API Key"**
5. Copy the key (starts with `AIza...`)

### 2. Add to Environment Variables

**Local (.env.local):**
```bash
GEMINI_API_KEY=AIzaSyC...your-key-here
```

**Vercel (Production):**
1. Go to your Vercel project
2. Settings → Environment Variables
3. Add: `GEMINI_API_KEY` = `AIzaSyC...your-key-here`
4. Apply to: Production, Preview, Development

---

## Free Tier Limits

**Gemini 1.5 Flash (what we use):**
- ✅ **Free forever**
- ✅ 15 requests per minute
- ✅ 1,500 requests per day
- ✅ No credit card required

**For your betting app:**
- 10 users creating 5 bets/day = **50 requests/day**
- Well within the 1,500/day limit!
- Even at 30 bets/day/user = 300 requests (still free)

**You'd need 1,500+ bets per day to hit limits** (unlikely for friend groups)

---

## What Changed

### Before (Anthropic)
```typescript
import Anthropic from '@anthropic-ai/sdk';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// Cost: ~$0.01 per bet
```

### After (Gemini)
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Cost: $0 per bet ✓
```

**Same quality parsing, zero cost!**

---

## Testing Your API Key

```bash
# Start dev server
npm run dev

# Try creating a bet:
# "I bet $20 the Warriors win tonight"

# If successful → API key works!
# If error → check console logs
```

---

## Troubleshooting

### Error: "API key not valid"
- Double-check you copied the full key
- Ensure no spaces before/after in .env.local
- Key should start with `AIza`

### Error: "Rate limit exceeded"
- Free tier: 15 requests/min
- Wait 1 minute and try again
- Unlikely in normal usage

### Error: "Failed to parse bet"
- Try simpler format: "I bet $10 that X happens"
- Gemini is very flexible, should work with most formats

---

## Production Deployment

When deploying to Vercel:

1. **Add GEMINI_API_KEY to Vercel:**
   - Dashboard → Project → Settings → Environment Variables
   - Add key for Production, Preview, Development

2. **Remove ANTHROPIC_API_KEY** (no longer needed):
   - Delete from Vercel environment variables
   - Delete from .env.local

3. **Redeploy:**
   ```bash
   git add .
   git commit -m "Switch to free Gemini API"
   git push
   ```

---

## API Key Security

**✅ Safe:**
- Used server-side only
- Never exposed to browser
- Encrypted in Vercel

**❌ Don't:**
- Commit .env.local to GitHub
- Share your API key publicly
- Use in client-side code

---

## Comparison: Bet Parsing Quality

Both APIs handle the same formats excellently:

**Examples that work:**
- ✅ "I bet $20 the Warriors win tonight"
- ✅ "$50 says it rains tomorrow"
- ✅ "100 bucks Biden wins re-election"
- ✅ "I'll wager $15 that crypto crashes"
- ✅ "$5 the Celtics win by 10+"

**Result:** Gemini = Claude quality at $0 cost

---

## Monthly Cost Comparison

**10 users, 300 bets/month:**

| Service | Cost |
|---------|------|
| Vercel | $0 (free tier) |
| Supabase | $0 (free tier) |
| Gemini API | **$0 (free!)** |
| **Total** | **$0/month** |

vs. Previous:
| Service | Cost |
|---------|------|
| Vercel | $0 |
| Supabase | $0 |
| Anthropic | ~$3 |
| **Total** | **~$3/month** |

**Savings: $36/year!**

---

## Advanced: Rate Limit Handling (Optional)

If you expect heavy usage (>15 bets/min), add retry logic:

```typescript
// lib/claude/parser.ts (already implemented)
try {
  const result = await model.generateContent(prompt);
  return parsed;
} catch (error) {
  if (error.message.includes('rate limit')) {
    // Wait 4 seconds and retry once
    await new Promise(resolve => setTimeout(resolve, 4000));
    const result = await model.generateContent(prompt);
    return parsed;
  }
  throw error;
}
```

*(Not needed for typical friend group usage)*

---

## Summary

✅ **Switched to Google Gemini API**  
✅ **Completely free forever**  
✅ **Same parsing quality**  
✅ **No credit card required**  
✅ **2-minute setup**  
✅ **1,500 requests/day limit**  

Your betting app now runs at **$0/month!** 🎉

**Next step:** Get your free API key at https://ai.google.dev
