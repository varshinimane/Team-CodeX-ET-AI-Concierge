import { callLLMJSON } from "../llm.js";

const ET_PRODUCTS = {
  ET_PRIME: {
    id: "et_prime", name: "ET Prime", icon: "👑", color: "#f59e0b",
    tagline: "India's #1 Business Intelligence Platform",
    description: "Exclusive in-depth analysis, expert opinions, premium market insights — ad-free",
    price: "₹999/year", badge: "Most Popular",
    url: "https://economictimes.indiatimes.com/prime",
    features: ["Ad-free reading", "Exclusive reports", "Expert webinars", "Portfolio tracker"],
    bestFor: ["intermediate", "advanced"],
    intents: ["INVESTING", "MARKET_NEWS", "TRADING", "TAX_PLANNING", "RETIREMENT"],
  },
  ET_MARKETS: {
    id: "et_markets", name: "ET Markets", icon: "📈", color: "#10b981",
    tagline: "Real-Time Market Intelligence",
    description: "Live NSE/BSE data, advanced charts, portfolio tracking, smart price alerts",
    price: "Free · Pro ₹199/month", badge: "Investor Favourite",
    url: "https://economictimes.indiatimes.com/markets",
    features: ["Live quotes", "Advanced charts", "Portfolio tracker", "Price alerts"],
    bestFor: ["intermediate", "advanced"],
    intents: ["INVESTING", "TRADING", "MARKET_NEWS"],
  },
  ET_MASTERCLASS: {
    id: "et_masterclass", name: "ET Masterclasses", icon: "🎓", color: "#8b5cf6",
    tagline: "Learn from India's Best Financial Minds",
    description: "Structured courses on investing, trading and personal finance by verified experts",
    price: "₹1,499–₹4,999/course", badge: "Best for Beginners",
    url: "https://economictimes.indiatimes.com/masterclass",
    features: ["Expert instructors", "Live Q&A", "Certificate", "Lifetime access"],
    bestFor: ["beginner", "intermediate"],
    intents: ["LEARNING", "INVESTING", "SAVING", "BUDGET_PLANNING"],
  },
  ET_WEALTH: {
    id: "et_wealth", name: "ET Wealth", icon: "💎", color: "#e8002d",
    tagline: "Your Complete Personal Finance Guide",
    description: "Weekly magazine + digital content on wealth building, tax planning, money management",
    price: "₹299/year", badge: "Family Favourite",
    url: "https://economictimes.indiatimes.com/wealth",
    features: ["Weekly edition", "Tax calculators", "Expert advice column", "Goal planners"],
    bestFor: ["beginner", "intermediate"],
    intents: ["SAVING", "TAX_PLANNING", "RETIREMENT", "BUDGET_PLANNING", "INSURANCE"],
  },
  ET_BFSI: {
    id: "et_bfsi", name: "ET BFSI", icon: "🏦", color: "#0ea5e9",
    tagline: "Banking & Finance Sector Intelligence",
    description: "Deep dives into banking, insurance, and fintech — sector reports and regulatory updates",
    price: "Free", badge: "Industry Insider",
    url: "https://bfsi.economictimes.indiatimes.com",
    features: ["Sector analysis", "Regulatory updates", "Industry interviews", "Data reports"],
    bestFor: ["intermediate", "advanced"],
    intents: ["INSURANCE", "MARKET_NEWS", "INVESTING"],
  },
};

export async function crossSellAgent(profile, intent) {
  const experience = profile.experience_level || "beginner";
  const primaryIntent = intent.primary_intent || "LEARNING";

  // Rule-based pre-filter
  const candidates = Object.values(ET_PRODUCTS).filter(
    (p) => p.bestFor.includes(experience) || p.intents.includes(primaryIntent)
  );
  const pool = candidates.length >= 2 ? candidates : Object.values(ET_PRODUCTS).slice(0, 3);

  const result = await callLLMJSON(
    `You are the ET cross-sell engine. Select the TOP 3 ET products for this user.

User: experience=${experience}, goals=${profile.goals}, income=${profile.income_display || "n/a"}, risk=${profile.risk_appetite}, intent=${primaryIntent}

Products:
${JSON.stringify(pool.map(p => ({ id: p.id, name: p.name, description: p.description, price: p.price })), null, 2)}

Return this exact JSON:
{
  "crossSell": [
    {
      "productId": "product id from list",
      "relevance_score": 0.0,
      "pitch": "1-sentence personalised pitch for THIS user specifically",
      "urgency": "why they need this NOW (1 sentence)"
    }
  ],
  "topPickId": "single best product id"
}`,
    {
      crossSell: pool.slice(0, 3).map((p, i) => ({
        productId: p.id,
        relevance_score: 0.9 - i * 0.1,
        pitch: `Perfect for your ${experience} level and ${primaryIntent.toLowerCase()} goals`,
        urgency: "Start today to accelerate your financial journey",
      })),
      topPickId: pool[0]?.id,
    }
  );

  // Enrich with full product data
  const enriched = (result.crossSell || []).map((item) => {
    const product = Object.values(ET_PRODUCTS).find(
      (p) => p.id === item.productId || p.id === item.productId?.toLowerCase()
    ) || pool[0];
    return {
      ...product,
      relevance_score: item.relevance_score,
      pitch: item.pitch,
      urgency: item.urgency,
      isTopPick: item.productId === result.topPickId || item.productId === pool[0]?.id,
    };
  });

  return { crossSell: enriched.filter(Boolean), topPickId: result.topPickId };
}
