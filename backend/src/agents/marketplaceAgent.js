import { callLLMJSON } from "../llm.js";

const FINANCIAL_SERVICES = {
  SIP_STARTER: {
    id: "sip_starter", category: "investing", icon: "📊", color: "#10b981",
    name: "SIP — Systematic Investment Plan", tag: "Most Recommended",
    provider: "Multiple AMCs via ET Money",
    tagline: "Start investing from ₹500/month",
    description: "Disciplined monthly equity investments with auto-debit and compounding",
    minAmount: "₹500/month", expectedReturn: "12–15% p.a. (historical)", riskLevel: "low-medium",
    bestForIncome: ["under_5l", "5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["investing", "saving", "retirement"],
    bestForExperience: ["beginner", "intermediate"],
  },
  TERM_INSURANCE: {
    id: "term_insurance", category: "insurance", icon: "🛡️", color: "#6366f1",
    name: "Term Life Insurance", tag: "Essential Cover",
    provider: "LIC, HDFC Life, ICICI Pru",
    tagline: "₹1 Crore cover from ₹500/month",
    description: "Pure protection — maximum life cover at the lowest possible premium",
    minAmount: "₹500/month", expectedReturn: "Pure protection", riskLevel: "none",
    bestForIncome: ["5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["saving", "retirement", "investing"],
    bestForExperience: ["beginner", "intermediate", "advanced"],
  },
  HEALTH_INSURANCE: {
    id: "health_insurance", category: "insurance", icon: "❤️‍🩹", color: "#ef4444",
    name: "Health Insurance", tag: "Tax Benefit u/s 80D",
    provider: "Star Health, Niva Bupa, HDFC ERGO",
    tagline: "Family floater from ₹8,000/year",
    description: "Cashless hospitalisation at 10,000+ hospitals, up to ₹25 Lakh cover",
    minAmount: "₹8,000/year", expectedReturn: "Up to ₹25L cover", riskLevel: "none",
    bestForIncome: ["under_5l", "5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["saving", "retirement"],
    bestForExperience: ["beginner", "intermediate", "advanced"],
  },
  ELSS_FUND: {
    id: "elss_fund", category: "tax", icon: "💰", color: "#f59e0b",
    name: "ELSS Tax-Saving Mutual Fund", tag: "Section 80C",
    provider: "Axis, Mirae, Parag Parikh via ET Money",
    tagline: "Save ₹46,800 in taxes + grow wealth",
    description: "3-year lock-in, 80C deduction up to ₹1.5L, equity-linked market returns",
    minAmount: "₹500/month", expectedReturn: "12–16% p.a. (historical)", riskLevel: "medium",
    bestForIncome: ["5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["investing", "tax_planning", "saving"],
    bestForExperience: ["beginner", "intermediate", "advanced"],
  },
  CREDIT_CARD_CASHBACK: {
    id: "credit_card_cashback", category: "credit", icon: "💳", color: "#0ea5e9",
    name: "Cashback Credit Card", tag: "Zero Fee Options",
    provider: "Axis Ace, HDFC Millennia, SBI Cashback",
    tagline: "Earn 2–5% cashback on every spend",
    description: "Zero annual fee cards with flat cashback on all purchases and UPI",
    minAmount: "No minimum", expectedReturn: "2–5% cashback", riskLevel: "none",
    bestForIncome: ["5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["saving", "investing"],
    bestForExperience: ["beginner", "intermediate", "advanced"],
  },
  NPS: {
    id: "nps", category: "retirement", icon: "🏖️", color: "#14b8a6",
    name: "NPS — National Pension System", tag: "80CCD(1B) Extra Benefit",
    provider: "HDFC Pension, SBI Pension, ICICI Pru",
    tagline: "Extra ₹50,000 deduction beyond 80C",
    description: "Government-backed retirement — additional tax break over 80C limit",
    minAmount: "₹500/year", expectedReturn: "8–10% p.a. (market-linked)", riskLevel: "low-medium",
    bestForIncome: ["5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["retirement", "tax_planning"],
    bestForExperience: ["beginner", "intermediate", "advanced"],
  },
  DIGITAL_GOLD: {
    id: "digital_gold", category: "investing", icon: "🥇", color: "#fbbf24",
    name: "Digital Gold / Sovereign Gold Bond", tag: "Inflation Hedge",
    provider: "RBI Sovereign Gold Bonds, ET Money Gold",
    tagline: "Invest in gold from ₹10",
    description: "Safe-haven asset — Sovereign Gold Bonds pay 2.5% interest on top of gold returns",
    minAmount: "₹10 (digital)", expectedReturn: "Gold returns + 2.5% interest (SGB)", riskLevel: "low",
    bestForIncome: ["under_5l", "5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["saving", "investing", "retirement"],
    bestForExperience: ["beginner", "intermediate"],
  },
  PERSONAL_LOAN: {
    id: "personal_loan", category: "credit", icon: "🏛️", color: "#ec4899",
    name: "Personal Loan / Balance Transfer", tag: "Low Rate Options",
    provider: "HDFC, Bajaj Finserv, Navi via ET Money",
    tagline: "Instant approval from 10.5% p.a.",
    description: "Quick personal loans for emergencies or goal funding with minimal documentation",
    minAmount: "₹10,000 min loan", expectedReturn: "N/A (loan)", riskLevel: "none",
    bestForIncome: ["5l_15l", "15l_50l", "above_50l"],
    bestForGoals: ["saving"],
    bestForExperience: ["beginner", "intermediate", "advanced"],
  },
};

export async function marketplaceAgent(profile, intent) {
  const income = profile.income_range || "5l_15l";
  const goals = Array.isArray(profile.primary_goals) ? profile.primary_goals : [profile.goals || "investing"];
  const experience = profile.experience_level || "beginner";
  const primaryIntent = intent.primary_intent || "LEARNING";

  const candidates = Object.values(FINANCIAL_SERVICES).filter(
    (s) =>
      (s.bestForIncome.includes(income) || s.bestForGoals.some((g) => goals.includes(g))) &&
      s.bestForExperience.includes(experience)
  );
  const pool = candidates.length >= 3 ? candidates : Object.values(FINANCIAL_SERVICES).slice(0, 4);

  const result = await callLLMJSON(
    `You are the ET Marketplace advisor. Select TOP 4 financial services for this user.

User: income=${income}, experience=${experience}, goals=${goals.join(", ")}, risk=${profile.risk_appetite}, horizon=${profile.time_horizon || "medium_term"}, intent=${primaryIntent}

Available Services:
${JSON.stringify(pool.map(s => ({ id: s.id, name: s.name, category: s.category, description: s.description, minAmount: s.minAmount })), null, 2)}

Return this exact JSON:
{
  "services": [
    {
      "serviceId": "service id from list",
      "relevance_score": 0.0,
      "reason": "1-sentence personalised reason this fits THIS user's exact profile",
      "action": "specific next step (e.g. 'Start a ₹2,000/month SIP in Nifty 50 index fund')",
      "priority": "high|medium|low"
    }
  ]
}

Rank by urgency and relevance. High = needs this immediately.`,
    {
      services: pool.slice(0, 4).map((s, i) => ({
        serviceId: s.id,
        relevance_score: 0.9 - i * 0.1,
        reason: `Ideal for your ${experience} level and ${goals[0]} goals`,
        action: `Get started with ${s.name} today`,
        priority: i === 0 ? "high" : i === 1 ? "medium" : "low",
      })),
    }
  );

  const enriched = (result.services || []).map((item) => {
    const service = Object.values(FINANCIAL_SERVICES).find(
      (s) => s.id === item.serviceId || s.id === item.serviceId?.toLowerCase()
    ) || pool[0];
    return service
      ? { ...service, relevance_score: item.relevance_score, reason: item.reason, action: item.action, priority: item.priority }
      : null;
  }).filter(Boolean);

  return { services: enriched };
}
