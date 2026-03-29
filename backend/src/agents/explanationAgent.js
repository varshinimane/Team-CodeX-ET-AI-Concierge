import { callLLM } from "../llm.js";

function buildStructuredFallback(profile, intent, recommendations, crossSell, marketplace) {
  const exp   = profile.experience_level || "beginner";
  const risk  = profile.risk_appetite || "medium";
  const goals = profile.goals || "financial growth";
  const income = profile.income_display || "";
  const horizon = profile.time_horizon_display || "medium term";
  const intent_type = intent.primary_intent || "INVESTING";
  const nextAction = intent.next_best_action || "start a SIP in a Nifty 50 index fund";
  const topRec  = recommendations?.recommendations?.[0]?.title;
  const service = marketplace?.services?.[0];

  // Income-aware amounts
  const incomeCode = profile.income_range || "5l_15l";
  const sipAmount = incomeCode === "under_5l" ? "₹500" : incomeCode === "5l_15l" ? "₹2,000" : incomeCode === "15l_50l" ? "₹5,000" : "₹10,000";
  const emergencyFund = incomeCode === "under_5l" ? "₹30,000" : incomeCode === "5l_15l" ? "₹1.5L" : "₹3L";

  // Risk-aware strategy
  const strategyMap = {
    low:    `With your conservative risk profile, prioritise capital protection: park 60% in debt mutual funds/FDs, 30% in large-cap index funds (Nifty 50), and keep 10% liquid. Avoid sectoral bets and direct equity until you have ₹1L+ invested and feel comfortable.`,
    medium: `Your balanced risk profile suits a 60:40 equity-to-debt allocation. Put 40% in a Nifty 50 index fund, 20% in a mid-cap fund, 20% in debt/liquid funds, and 20% in an FD for safety. Review and rebalance every 6 months.`,
    high:   `Your aggressive profile can handle equity-heavy allocation: 50% Nifty 50 + Nifty Next 50 index funds, 30% mid/small-cap funds, 10% international funds (Motilal Oswal Nasdaq), 10% gold/silver ETF as hedge. Rebalance annually.`,
  };

  const avoidMap = {
    low:    "Avoid: direct stocks, F&O, small-cap funds, crypto, ULIPs, and any product with lock-in > 3 years. Say no to LIC endowment plans.",
    medium: "Avoid: F&O trading, thematic/sectoral funds as core holding, leveraged investments, and any ULIPs. Keep crypto under 2% if at all.",
    high:   "Avoid: putting > 10% in any single stock, F&O without stop-losses, trading on tips, and investing money you need within 1 year.",
  };

  const investPlan = incomeCode === "under_5l"
    ? `Start with: ₹500/month SIP in a Nifty 50 index fund (Mirae/Axis). Build a ₹30,000 emergency fund first in a liquid fund or savings account. Then add ₹200/month ELSS for tax savings under 80C.`
    : incomeCode === "5l_15l"
    ? `Allocate ${sipAmount}/month to SIP: ₹1,500 Nifty 50 index, ₹500 mid-cap. Build ${emergencyFund} emergency fund (6 months expenses) in a liquid fund. Add ₹500/month ELSS for 80C. Get a ₹1 Cr term plan if you don't have one.`
    : `Allocate ${sipAmount}/month: ₹2,000 Nifty 50, ₹1,500 Flexi-cap, ₹1,000 mid-cap, ₹500 international. Max out NPS (₹50,000 extra deduction under 80CCD). Build ${emergencyFund} in liquid funds. Consider SGB for 5% gold allocation.`;

  return {
    strategy: strategyMap[risk] || strategyMap.medium,
    immediateAction: `${nextAction}. Open a free demat + trading account on Zerodha or Groww (takes 10 minutes). Set up a monthly auto-debit SIP of ${sipAmount} so you never miss an investment.`,
    investmentPlan: investPlan,
    whatToAvoid: avoidMap[risk] || avoidMap.medium,
  };
}

// ── Main agent ────────────────────────────────────────────────
export async function explanationAgent(profile, intent, recommendations, crossSell, marketplace) {
  const fallback = buildStructuredFallback(profile, intent, recommendations, crossSell, marketplace);

  const exp    = profile.experience_level || "beginner";
  const risk   = profile.risk_appetite || "medium";
  const goals  = profile.goals || "investing";
  const income = profile.income_display || "undisclosed";
  const horizon = profile.time_horizon_display || "medium term";
  const incomeCode = profile.income_range || "5l_15l";

  // Income-calibrated amounts
  const sipAmt = incomeCode === "under_5l" ? "₹500/month" : incomeCode === "5l_15l" ? "₹2,000/month" : incomeCode === "15l_50l" ? "₹5,000/month" : "₹15,000/month";
  const emergencyAmt = incomeCode === "under_5l" ? "₹30,000" : incomeCode === "5l_15l" ? "₹1.5 lakh" : "₹3 lakh";

  const topRecs = (recommendations?.recommendations || []).slice(0, 3).map(r => `- ${r.title}`).join("\n");
  const topService = marketplace?.services?.[0]?.name || "SIP";

  const PROMPT = `You are a senior Indian financial advisor writing for Economic Times.
Write a STRUCTURED, PERSONALISED financial response. Use REAL Indian numbers and products.

=== USER PROFILE (USE EVERYTHING BELOW) ===
- Experience: ${exp}
- Income: ${income} (use this to calibrate ₹ amounts)
- Goals: ${goals}
- Risk appetite: ${risk}  
- Investment horizon: ${horizon}
- Suggested SIP amount for their income: ${sipAmt}
- Emergency fund target: ${emergencyAmt}

=== CONTEXT ===
Intent detected: ${intent.primary_intent}
Next best action: ${intent.next_best_action}
Top service recommended: ${topService}
Recommended content:
${topRecs}

=== STRICT RULES ===
1. NEVER say "as a beginner" or restate their profile
2. NEVER give generic advice — every line must reflect THEIR income/risk/goals
3. Use specific ₹ numbers calibrated to their income (${sipAmt} SIP etc.)
4. Mention specific Indian products: Mirae Asset, Axis, Parag Parikh, Zerodha, Groww, NPS, ELSS etc.
5. Short-term horizon → NO NPS (locked till 60), NO long lock-ins
6. Low income → NO suggestions above ₹1,000/month to start
7. Low risk → NO direct equity, NO mid/small-cap as primary recommendation
8. Beginner → NO F&O, NO direct stocks, NO jargon without brief explanation

=== OUTPUT FORMAT (return EXACTLY this JSON, no markdown) ===
{
  "strategy": "2-3 sentences: specific allocation strategy for THEIR exact risk+income combo. Include % splits.",
  "immediateAction": "1-2 sentences: what to do TODAY. Include app names, ₹ amounts, specific steps.",
  "investmentPlan": "2-3 sentences: month-by-month or allocation breakdown with real ₹ numbers matching their income.",
  "whatToAvoid": "1-2 sentences: specific products/behaviours to avoid given THEIR risk+experience. Not generic warnings."
}`;

  try {
    const raw = await callLLM(PROMPT, { temperature: 0.4 });
    const cleaned = raw.replace(/```json\n?/gi,"").replace(/```\n?/g,"").trim();
    const start = cleaned.indexOf("{");
    const end   = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) return fallback;
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    // Validate all 4 fields present
    if (parsed.strategy && parsed.immediateAction && parsed.investmentPlan && parsed.whatToAvoid) {
      return parsed;
    }
    return fallback;
  } catch {
    return fallback;
  }
}
