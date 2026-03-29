import { trackProductClick } from "../db.js";
import { callLLM } from "../llm.js";

// POST /api/track-click
export async function handleTrackClick(req, res) {
  const { session_id, product_id, product_name, action_type = "click", metadata = {} } = req.body;

  if (!session_id || !product_id) {
    return res.status(400).json({ error: "session_id and product_id required" });
  }

  try {
    await trackProductClick(session_id, product_id, product_name, action_type, metadata);
    return res.json({ success: true, tracked: { session_id, product_id, action_type } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /api/product-modal — LLM-generated "Why this is for you" explanation
export async function handleProductModal(req, res) {
  const { product, userProfile, sessionId } = req.body;

  if (!product || !userProfile) {
    return res.status(400).json({ error: "product and userProfile required" });
  }

  // Track modal open
  if (sessionId && product.id) {
    trackProductClick(sessionId, product.id, product.name, "modal_open").catch(() => {});
  }

  // Rule-based explanation (works without LLM)
  const ruleExplanation = buildRuleExplanation(product, userProfile);

  try {
    const exp    = userProfile.experience_level || "beginner";
    const risk   = userProfile.risk_appetite || "medium";
    const goals  = userProfile.goals || "financial growth";
    const income = userProfile.income_display || "your income range";

    const prompt = `You are a financial advisor for Economic Times. 
A user is viewing "${product.name}" (${product.tagline || product.description}).

User profile:
- Experience: ${exp} investor
- Income: ${income}
- Goals: ${goals}  
- Risk: ${risk}

Write 2-3 sentences explaining SPECIFICALLY why this product suits THIS user.
Rules:
- Be concrete about their profile (mention their experience/income/goals explicitly)
- Include 1 specific benefit relevant to their situation
- End with one clear action they should take
- No generic marketing language
- No "as a ${exp}" opener`;

    const aiText = await callLLM(prompt, { temperature: 0.5 });
    const explanation = aiText.trim() || ruleExplanation;

    return res.json({ explanation, product, generatedBy: "llm" });
  } catch {
    return res.json({ explanation: ruleExplanation, product, generatedBy: "rule" });
  }
}

function buildRuleExplanation(product, profile) {
  const exp   = profile.experience_level || "beginner";
  const risk  = profile.risk_appetite || "medium";
  const goals = profile.goals || "growing wealth";
  const income = profile.income_display || "";

  const productMap = {
    et_prime:       `With your focus on ${goals}, ET Prime's exclusive analysis cuts through noise to give you actionable signals — especially valuable for a ${exp} investor building conviction. The expert webinars alone are worth the ₹999/year if you apply even one insight. Start your 30-day trial today.`,
    et_markets:     `ET Markets gives you the live NSE/BSE data and portfolio tracker you need to act on your ${goals} goals in real time. The price alerts mean you never miss an entry point. Set up your watchlist with 5 stocks or funds today.`,
    et_masterclass: `Given your ${exp} level and ${goals} focus, ET Masterclasses fill exactly the knowledge gaps holding you back. The courses are structured so you learn fundamentals before moving to execution. Enrol in the "Basics of Investing" course this week.`,
    et_wealth:      `ET Wealth's weekly edition covers tax planning, insurance, and savings — the three pillars that matter most at your income level (${income}). The tax calculators alone can save you hours every March. Subscribe and read the latest issue today.`,
    et_bfsi:        `For your ${goals} goals, understanding banking and insurance sector trends gives you an edge in picking financial stocks and products. ET BFSI's regulatory updates are particularly valuable for ${exp} investors. Read this week's top story.`,
    sip_starter:    `A SIP is the most efficient way to put your money to work given your ${risk} risk appetite — it averages out market volatility automatically. With ${income} income, even ₹500/month compounds significantly over ${profile.time_horizon_display || "your horizon"}. Set up your first SIP on ET Money today.`,
    term_insurance: `At your stage, a term plan is non-negotiable before you invest — it protects your financial plan if anything happens to you. With your income, you need at least ₹1 Cr cover. Get a quote on Policybazaar in 5 minutes.`,
    health_insurance:`Medical costs are the #1 reason people derail their investment plans. A family floater policy ensures one hospital bill doesn't wipe out months of savings. Compare plans on ET Insurance now.`,
    elss_fund:      `ELSS gives you market returns while saving up to ₹46,800 in tax annually under Section 80C — exactly what someone with ${income} needs before March 31. It has only a 3-year lock-in, the shortest among all 80C instruments. Start a ₹500/month ELSS SIP today.`,
    nps:            `NPS gives you an extra ₹50,000 deduction under 80CCD(1B) beyond your 80C limit — pure tax saving with decent 8-10% returns. Ideal given your ${profile.time_horizon_display || "long-term"} horizon. Open NPS on HDFC Pension app in 15 minutes.`,
  };

  return productMap[product.id] || `${product.name} is well-suited to your profile given your ${goals} goals and ${risk} risk appetite. ${product.description} Take the next step and explore this option today.`;
}
