# ET AI Concierge v4.0
### Economic Times · OpenRouter · Supabase Auth · 7-Agent Pipeline

---

## Quick Start

```bash
# Backend
cd backend
npm install
cp .env.example .env
# Add OPENROUTER_API_KEY (required) + Supabase keys (optional)
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

Open: http://localhost:5173

---

## What's New in v4.0

### Feature 1 — Supabase Auth
- Email + password signup/login via Supabase Auth
- Anonymous session data automatically merged on login
- `user_id` linked across users, chats, product_clicks tables
- App works fully without login (anonymous mode)

### Feature 2 — Interactive Product Cards
- Every card is clickable with hover animations (scale + glow)
- Click tracking stored in `product_clicks` Supabase table
- `POST /api/track-click` endpoint with action types: view, click, cta, modal_open
- "Why this is for you" modal with LLM-generated personalised explanation
- CTA buttons that open external links in new tab

### Feature 3 — Non-Generic AI Responses
The explanation agent now returns a **4-section structured JSON** instead of a generic paragraph:

```json
{
  "strategy": "Specific allocation for their exact risk+income",
  "immediateAction": "What to do TODAY with app names + ₹ amounts",
  "investmentPlan": "Month-by-month breakdown with real numbers",
  "whatToAvoid": "Specific products to avoid given their profile"
}
```

Rules enforced:
- Income-calibrated amounts (₹500/mo for <5L, ₹2k/mo for 5-15L, ₹5k/mo for 15-50L)
- Risk-appropriate strategy (low → debt-first, high → equity-heavy)
- Experience-appropriate complexity (beginner → no F&O, no jargon)
- Time-horizon aware (short-term → no NPS lock-ins)
- Specific Indian products: Mirae, Axis, Parag Parikh, Zerodha, Groww, NPS, ELSS

### Feature 4 — Product Explanation Modal
- Click any product/service card → modal opens
- AI generates "Why this is right for you" explanation using full user profile
- Rule-based fallback if LLM unavailable
- Tracks modal_open events in Supabase

---

## Architecture

```
User Input
  ↓
[onboardingAgent]   ← 5-question profile setup (rule-based, no LLM needed)
  ↓
[profilingAgent]    ← Extract intent from message + merge with DB profile
  ↓
[intentAgent]       ← Detect financial intent + next_best_action
  ↓
[recommendationAgent] ← Curate ET content + risk_insight
  ↓
[crossSellAgent]    ← Match ET ecosystem products
  ↓
[marketplaceAgent]  ← Suggest financial services (SIP, insurance, NPS etc.)
  ↓
[explanationAgent]  ← 4-section structured plan with real ₹ numbers
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat` | Full pipeline → structured response |
| POST | `/onboarding` | Multi-turn profile setup |
| POST | `/api/track-click` | Log product interaction |
| POST | `/api/product-modal` | AI "why for you" explanation |
| POST | `/auth/signup` | Create account + merge session |
| POST | `/auth/login` | Login + merge session |
| GET | `/history?sessionId=...` | Chat history |
| GET | `/schema` | Supabase SQL to run |
| GET | `/health` | Status check |

---

## Supabase Setup (Optional)

1. Create project at https://supabase.com
2. Add to `backend/.env`:
   ```
   SUPABASE_URL=https://xxx.supabase.co
   SUPABASE_ANON_KEY=eyJ...
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   ```
3. Run schema: `curl http://localhost:5000/schema` → paste into SQL Editor → Run
4. Enable Auth: Supabase dashboard → Authentication → Enable email provider

### DB Tables
- `users` — profile per session, linked to auth.users via user_id
- `chats` — full conversation history
- `product_clicks` — interaction tracking with action_type

---

## Sample Response

```json
{
  "structured": {
    "strategy": "With your balanced risk profile, use a 60:40 equity-to-debt split. Put ₹1,500/month in Mirae Asset Nifty 50 index fund, ₹500 in Parag Parikh Flexi Cap, and ₹1,000 in HDFC Short Duration debt fund.",
    "immediateAction": "Open a Zerodha account today (free, 10 minutes). Set up a ₹2,000/month SIP auto-debit starting next month so investing becomes automatic.",
    "investmentPlan": "Month 1: Emergency fund target ₹1.5L in liquid fund. Month 2-6: Start ₹2,000 SIP. Month 6+: Add ₹500/month ELSS for 80C tax saving before March 31.",
    "whatToAvoid": "Avoid F&O, direct stock picking, and any ULIP plans from insurance agents — their charges eat 2-3% annually. Skip smallcap funds until you have ₹5L+ invested."
  },
  "nextBestAction": "Start a ₹2,000/month SIP in a Nifty 50 index fund on ET Money today",
  "riskInsight": "A 60:40 equity-debt split suits your moderate risk profile — index funds for growth, debt funds for stability",
  "meta": {
    "agentsRun": 6,
    "isPersonalized": true,
    "supabaseConnected": true
  }
}
```
