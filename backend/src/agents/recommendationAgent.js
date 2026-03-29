import { callLLMJSON } from "../llm.js";

const ET_CONTENT = {
  INVESTING: [
    { id:"i1", title:"Top 5 Stocks to Watch This Week", type:"article", tag:"Stocks", readTime:"4 min" },
    { id:"i2", title:"How to Build a Diversified Portfolio in 2026", type:"guide", tag:"Portfolio", readTime:"7 min" },
    { id:"i3", title:"Smallcap vs Largecap: Which Suits You?", type:"analysis", tag:"Mutual Funds", readTime:"5 min" },
    { id:"i4", title:"NIFTY 50 Outlook: Expert Predictions Q2 2026", type:"market-report", tag:"Market", readTime:"6 min" },
    { id:"i5", title:"Beginner's Guide to Buying Stocks on NSE/BSE", type:"tutorial", tag:"Beginners", readTime:"8 min" },
  ],
  SAVING: [
    { id:"s1", title:"Best FD Rates in India — April 2026 Comparison", type:"comparison", tag:"Fixed Deposit", readTime:"3 min" },
    { id:"s2", title:"Beginner's Guide to SIP — Start with ₹500/month", type:"guide", tag:"SIP", readTime:"6 min" },
    { id:"s3", title:"How to Build an Emergency Fund in 6 Months", type:"plan", tag:"Emergency Fund", readTime:"5 min" },
    { id:"s4", title:"RD vs SIP: Which is Better for Monthly Savers?", type:"comparison", tag:"Comparison", readTime:"4 min" },
    { id:"s5", title:"Top Liquid Funds for Parking Your Idle Cash", type:"list", tag:"Liquid Funds", readTime:"4 min" },
  ],
  LEARNING: [
    { id:"l1", title:"What is Compound Interest and Why It's Your Best Friend", type:"explainer", tag:"Basics", readTime:"5 min" },
    { id:"l2", title:"Stock Market Crash vs Correction: Know the Difference", type:"explainer", tag:"Market", readTime:"4 min" },
    { id:"l3", title:"Glossary: 50 Financial Terms Every Investor Must Know", type:"reference", tag:"Education", readTime:"10 min" },
    { id:"l4", title:"How Mutual Funds Work: A Visual Explainer", type:"visual", tag:"Mutual Funds", readTime:"6 min" },
    { id:"l5", title:"Understanding P/E Ratio: When Is a Stock Cheap?", type:"tutorial", tag:"Analysis", readTime:"5 min" },
  ],
  TAX_PLANNING: [
    { id:"t1", title:"Budget 2026: Key Tax Changes You Must Know", type:"analysis", tag:"Budget", readTime:"7 min" },
    { id:"t2", title:"Best ELSS Funds to Save Tax in FY 2026-27", type:"list", tag:"ELSS", readTime:"5 min" },
    { id:"t3", title:"Section 80C Deductions: Complete Guide for FY2026", type:"guide", tag:"Tax", readTime:"8 min" },
    { id:"t4", title:"New Tax Regime vs Old: Which One Saves More?", type:"comparison", tag:"Tax Regime", readTime:"6 min" },
    { id:"t5", title:"HRA, LTA, NPS: All Exemptions Explained Simply", type:"explainer", tag:"Exemptions", readTime:"5 min" },
  ],
  RETIREMENT: [
    { id:"r1", title:"NPS vs PPF: Where Should You Invest for Retirement?", type:"comparison", tag:"Retirement", readTime:"6 min" },
    { id:"r2", title:"How Much to Save for Retirement? Use the 25x Rule", type:"guide", tag:"Planning", readTime:"5 min" },
    { id:"r3", title:"EPF vs VPF: Maximizing Your Provident Fund Returns", type:"analysis", tag:"EPF", readTime:"4 min" },
    { id:"r4", title:"Senior Citizen Savings Scheme — Full Details 2026", type:"guide", tag:"SCSS", readTime:"4 min" },
    { id:"r5", title:"Retire Early with FIRE: Is It Possible in India?", type:"feature", tag:"FIRE", readTime:"8 min" },
  ],
  TRADING: [
    { id:"tr1", title:"F&O Basics: Futures and Options for Beginners", type:"tutorial", tag:"F&O", readTime:"9 min" },
    { id:"tr2", title:"Top Technical Analysis Patterns Every Trader Knows", type:"guide", tag:"Technical", readTime:"7 min" },
    { id:"tr3", title:"Intraday Trading Strategies That Actually Work", type:"strategy", tag:"Intraday", readTime:"6 min" },
    { id:"tr4", title:"Risk Management: Never Lose More Than 2% Per Trade", type:"strategy", tag:"Risk", readTime:"5 min" },
    { id:"tr5", title:"Best Discount Brokers in India: Fee Comparison 2026", type:"comparison", tag:"Brokers", readTime:"4 min" },
  ],
  MARKET_NEWS: [
    { id:"mn1", title:"SENSEX Breaches 80,000: What's Driving the Rally?", type:"news", tag:"Market", readTime:"3 min" },
    { id:"mn2", title:"RBI Policy Meeting: Rate Decision & Impact on Markets", type:"analysis", tag:"RBI", readTime:"5 min" },
    { id:"mn3", title:"FII vs DII: Follow the Smart Money in 2026", type:"analysis", tag:"FII/DII", readTime:"4 min" },
    { id:"mn4", title:"Global Cues: How US Fed Rate Affects Indian Markets", type:"explainer", tag:"Global", readTime:"5 min" },
    { id:"mn5", title:"Nifty Midcap 150: Sectors Leading the Charge", type:"sector", tag:"Midcap", readTime:"4 min" },
  ],
  INSURANCE: [
    { id:"in1", title:"Term Insurance vs Endowment: Why Term Wins Every Time", type:"comparison", tag:"Term", readTime:"5 min" },
    { id:"in2", title:"Health Insurance 2026: Top Plans for Families", type:"list", tag:"Health", readTime:"6 min" },
    { id:"in3", title:"How Much Life Cover Do You Actually Need?", type:"guide", tag:"Cover", readTime:"4 min" },
    { id:"in4", title:"Critical Illness Riders: Are They Worth It?", type:"analysis", tag:"Riders", readTime:"5 min" },
    { id:"in5", title:"ULIP vs Mutual Fund + Term: The Real Comparison", type:"comparison", tag:"ULIP", readTime:"7 min" },
  ],
  BUDGET_PLANNING: [
    { id:"b1", title:"50/30/20 Rule: The Simplest Budget You'll Ever Need", type:"guide", tag:"Budgeting", readTime:"4 min" },
    { id:"b2", title:"Best Personal Finance Apps for Indians in 2026", type:"list", tag:"Tools", readTime:"3 min" },
    { id:"b3", title:"How to Cut Monthly Expenses Without Feeling the Pinch", type:"tips", tag:"Savings", readTime:"5 min" },
    { id:"b5", title:"Budget 2026: Impact on Middle-Class Households", type:"analysis", tag:"Budget", readTime:"6 min" },
  ],
  CRYPTO: [
    { id:"c1", title:"Crypto Taxation in India 2026: Complete Guide", type:"guide", tag:"Tax", readTime:"6 min" },
    { id:"c2", title:"Bitcoin ETF Approval: What It Means for Indian Investors", type:"analysis", tag:"Bitcoin", readTime:"5 min" },
    { id:"c3", title:"Top 5 Crypto Exchanges in India: Fees & Safety", type:"comparison", tag:"Exchange", readTime:"4 min" },
    { id:"c5", title:"Should You Invest in Crypto? Risk vs Reward Analysis", type:"analysis", tag:"Risk", readTime:"5 min" },
  ],
};

// Rule-based relevance scoring
function scoreArticle(article, profile, intent) {
  let score = 0.6; // base
  const exp = profile.experience_level;

  if (exp === "beginner" && ["tutorial", "guide", "explainer", "plan"].includes(article.type)) score += 0.2;
  if (exp === "advanced" && ["analysis", "market-report", "strategy"].includes(article.type)) score += 0.2;
  if (intent.user_stage === "awareness" && ["explainer", "guide", "visual"].includes(article.type)) score += 0.1;
  if (intent.user_stage === "action" && ["comparison", "list", "market-report"].includes(article.type)) score += 0.1;

  return Math.min(score, 0.98);
}

const RISK_INSIGHT = {
  low:    "Your conservative profile is best served by debt funds, FDs, and sovereign bonds — avoid direct equity until you have an emergency fund.",
  medium: "A balanced allocation of 60% equity and 40% debt suits your risk profile — large-cap index funds are your best equity entry point.",
  high:   "Your aggressive profile can handle higher equity concentration — consider small-cap and mid-cap funds for wealth creation over a 5+ year horizon.",
};

export async function recommendationAgent(intent, profile) {
  const key = intent.primary_intent || "LEARNING";
  const pool = ET_CONTENT[key] || ET_CONTENT["LEARNING"];

  // Rule-based fallback with scoring
  const scoredPool = pool.map(a => ({
    ...a,
    relevance_score: scoreArticle(a, profile, intent),
    why_relevant: `Matched to your ${profile.experience_level} level and ${key.toLowerCase().replace("_", " ")} focus`,
  })).sort((a, b) => b.relevance_score - a.relevance_score);

  const ruleFallback = {
    recommendations: scoredPool.slice(0, 4),
    primary_action: intent.next_best_action || "Start your financial journey with ET's curated content",
    risk_insight: RISK_INSIGHT[profile.risk_appetite] || RISK_INSIGHT.medium,
  };

  return await callLLMJSON(
    `You are the ET content recommendation engine for Economic Times India.
Pick and rank the TOP 4 most relevant articles for this specific user.

User: experience=${profile.experience_level}, goals=${profile.goals}, risk=${profile.risk_appetite}, income=${profile.income_display || "not specified"}, horizon=${profile.time_horizon || "medium_term"}
Intent: ${intent.primary_intent} (${intent.confidence} confidence, ${intent.user_stage} stage)

Articles to choose from:
${JSON.stringify(pool.map(a => ({ id:a.id, title:a.title, type:a.type, tag:a.tag, readTime:a.readTime })))}

Return ONLY this JSON:
{
  "recommendations": [
    { "id":"...", "title":"...", "type":"...", "tag":"...", "readTime":"...", "relevance_score":0.0, "why_relevant":"one personalised sentence for THIS user" }
  ],
  "primary_action": "the single most important thing this user should do right now — specific and actionable",
  "risk_insight": "1-sentence insight about their risk profile and what investment strategy suits them"
}`,
    ruleFallback
  );
}
