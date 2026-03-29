import { callLLMJSON } from "../llm.js";

const INTENT_KEYWORDS = {
  INVESTING:      ["invest", "stock", "mutual fund", "sip", "equity", "portfolio", "nifty", "shares", "house", "home", "property"],
  SAVING:         ["save", "saving", "fd", "fixed deposit", "rd", "recurring", "emergency fund", "goal"],
  TAX_PLANNING:   ["tax", "80c", "elss", "deduction", "itr", "exemption", "80d", "nps tax"],
  RETIREMENT:     ["retire", "retirement", "pension", "nps", "ppf", "fire", "passive income"],
  INSURANCE:      ["insur", "term plan", "health cover", "life cover", "premium", "policy"],
  LEARNING:       ["learn", "explain", "what is", "how does", "beginner", "understand", "basics"],
  TRADING:        ["trade", "trading", "intraday", "f&o", "futures", "options", "technical"],
  MARKET_NEWS:    ["market", "sensex", "nifty", "rbi", "interest rate", "inflation", "budget"],
  BUDGET_PLANNING:["budget", "expense", "spend", "monthly", "50/30/20", "cash flow"],
  CRYPTO:         ["crypto", "bitcoin", "ethereum", "web3", "blockchain", "defi"],
};

function detectIntentFromKeywords(profile) {
  const text = `${profile.goals || ""} ${(profile.interests || []).join(" ")}`.toLowerCase();

  let best = "LEARNING", bestScore = 0;
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    const score = keywords.filter(k => text.includes(k)).length;
    if (score > bestScore) { best = intent; bestScore = score; }
  }

  const stage = profile.experience_level === "advanced" ? "action"
    : profile.experience_level === "intermediate" ? "decision"
    : profile.urgency === "immediate" ? "consideration"
    : "awareness";

  const nextActions = {
    INVESTING: "Open a demat account and start a ₹1,000 SIP in a Nifty 50 index fund today",
    SAVING:    "Set up an auto-transfer of 20% of your income to a separate savings account",
    TAX_PLANNING: "Invest ₹1.5L in ELSS before March 31 to exhaust your 80C limit",
    RETIREMENT: "Start an NPS Tier 1 account for an extra ₹50,000 tax deduction beyond 80C",
    INSURANCE:  "Buy a term plan with ₹1 Cr cover — costs less than ₹1,000/month at your age",
    LEARNING:   "Read ET's 'Basics of Investing' series — builds foundation in 30 minutes",
    TRADING:    "Paper trade for 30 days before risking real capital — use Zerodha Varsity",
    MARKET_NEWS:"Set up ET Markets alerts for your watchlist stocks",
    BUDGET_PLANNING: "Track every expense for 30 days using the 50/30/20 rule",
    CRYPTO:     "Limit crypto to under 5% of portfolio — start with Bitcoin on a regulated exchange",
  };

  return {
    primary_intent: best,
    confidence: bestScore >= 2 ? "high" : bestScore === 1 ? "medium" : "low",
    sub_intents: profile.interests?.slice(0, 2) || [],
    content_focus: `ET ${best.toLowerCase().replace("_", " ")} content tailored for ${profile.experience_level} investors`,
    user_stage: stage,
    next_best_action: nextActions[best] || "Start with ET's personalised financial planning guide",
  };
}

export async function intentAgent(profile) {
  const ruleFallback = detectIntentFromKeywords(profile);

  return await callLLMJSON(
    `You are a financial intent detection engine for Economic Times India.
Based on this user profile, detect their financial intent.

User Profile:
- Experience: ${profile.experience_level}
- Goals: ${profile.goals}
- Risk: ${profile.risk_appetite}
- Interests: ${(profile.interests || []).join(", ")}
- Time Horizon: ${profile.time_horizon || "medium_term"}

Intent categories: INVESTING | SAVING | LEARNING | TAX_PLANNING | RETIREMENT | TRADING | MARKET_NEWS | BUDGET_PLANNING | CRYPTO | INSURANCE

Return ONLY this JSON:
{
  "primary_intent": "ONE category from the list above",
  "confidence": "high|medium|low",
  "sub_intents": ["1-2 secondary intents"],
  "content_focus": "what specific ET content would help this user most",
  "user_stage": "awareness|consideration|decision|action",
  "next_best_action": "single most impactful and specific step this user should take TODAY"
}`,
    ruleFallback
  );
}
