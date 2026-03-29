import { callLLMJSON } from "../llm.js";
import { saveUserProfile } from "../db.js";

const ONBOARDING_QUESTIONS = [
  {
    id: "income",
    field: "income_range",
    question: "Welcome to ET AI Concierge. I'm your personal Economic Times financial advisor.\n\nLet me ask you 5 quick questions to set up your profile.\n\nQuestion 1 of 5 — What is your approximate annual income?\n\nA) Under ₹5 Lakh\nB) ₹5 to 15 Lakh\nC) ₹15 to 50 Lakh\nD) Above ₹50 Lakh",
  },
  {
    id: "experience",
    field: "experience_level",
    question: "Question 2 of 5 — How would you describe your investing experience?\n\nA) Complete beginner, just starting out\nB) Intermediate, know the basics, have invested some\nC) Advanced, actively manage my own portfolio",
  },
  {
    id: "goals",
    field: "primary_goals",
    question: "Question 3 of 5 — What are your primary financial goals? You can pick multiple.\n\nA) Grow wealth through investing\nB) Save for a specific goal like home, education, or travel\nC) Learn about personal finance\nD) Build passive income or retire early\nE) Tax optimisation",
  },
  {
    id: "risk",
    field: "risk_appetite",
    question: "Question 4 of 5 — What is your risk appetite?\n\nA) Conservative, capital safety over high returns\nB) Moderate, comfortable with some market ups and downs\nC) Aggressive, willing to take high risk for high reward",
  },
  {
    id: "time_horizon",
    field: "time_horizon",
    question: "Question 5 of 5 — What is your investment time horizon?\n\nA) Short term, less than 1 year\nB) Medium term, 1 to 5 years\nC) Long term, 5 or more years",
  },
];

const INCOME_MAP = {
  under_5l: "Under ₹5 Lakh",
  "5l_15l": "₹5–15 Lakh",
  "15l_50l": "₹15–50 Lakh",
  above_50l: "Above ₹50 Lakh",
};

// ── Rule-based parser (no LLM needed) ─────────────────────
function parseAnswerRuleBased(answer, questionId) {
  const a = answer.toLowerCase().trim();

  if (questionId === "income") {
    if (a.includes("a") || a.includes("under") || a.includes("5 lakh") || a.includes("5l") || a.includes("below")) return { value: "under_5l" };
    if (a.includes("b") || a.includes("5-15") || a.includes("5 to 15") || a.includes("10") || a.includes("12")) return { value: "5l_15l" };
    if (a.includes("c") || a.includes("15-50") || a.includes("15 to 50") || a.includes("20") || a.includes("30") || a.includes("40")) return { value: "15l_50l" };
    if (a.includes("d") || a.includes("above 50") || a.includes("50+") || a.includes("crore") || a.includes("50 lakh")) return { value: "above_50l" };
    return { value: "5l_15l" }; // default
  }

  if (questionId === "experience") {
    if (a.includes("a") || a.includes("beginner") || a.includes("new") || a.includes("start") || a.includes("never")) return { value: "beginner" };
    if (a.includes("b") || a.includes("intermediate") || a.includes("some") || a.includes("basic") || a.includes("little")) return { value: "intermediate" };
    if (a.includes("c") || a.includes("advanced") || a.includes("active") || a.includes("expert") || a.includes("manage")) return { value: "advanced" };
    return { value: "beginner" };
  }

  if (questionId === "goals") {
    const goals = [];
    if (a.includes("a") || a.includes("invest") || a.includes("wealth") || a.includes("grow") || a.includes("stocks") || a.includes("market")) goals.push("investing");
    if (a.includes("b") || a.includes("save") || a.includes("saving") || a.includes("home") || a.includes("house") || a.includes("education") || a.includes("travel")) goals.push("saving");
    if (a.includes("c") || a.includes("learn") || a.includes("understand") || a.includes("knowledge")) goals.push("learning");
    if (a.includes("d") || a.includes("retire") || a.includes("passive") || a.includes("fire")) goals.push("retirement");
    if (a.includes("e") || a.includes("tax") || a.includes("80c") || a.includes("elss")) goals.push("tax_planning");
    // check for "investment for a house" type answers
    if (a.includes("house") || a.includes("flat") || a.includes("property") || a.includes("home")) {
      if (!goals.includes("saving")) goals.push("saving");
      if (!goals.includes("investing")) goals.push("investing");
    }
    return { value: goals.length > 0 ? goals : ["investing"] };
  }

  if (questionId === "risk") {
    if (a.includes("a") || a.includes("conservative") || a.includes("safe") || a.includes("low") || a.includes("careful")) return { value: "low" };
    if (a.includes("b") || a.includes("moderate") || a.includes("medium") || a.includes("balanced") || a.includes("middle")) return { value: "medium" };
    if (a.includes("c") || a.includes("aggressive") || a.includes("high") || a.includes("risk") || a.includes("bold")) return { value: "high" };
    return { value: "medium" };
  }

  if (questionId === "time_horizon") {
    if (a.includes("a") || a.includes("short") || a.includes("1 year") || a.includes("less than") || a.includes("6 month")) return { value: "short_term" };
    if (a.includes("b") || a.includes("medium") || a.includes("1-5") || a.includes("3 year") || a.includes("5 year") || a.includes("few")) return { value: "medium_term" };
    if (a.includes("c") || a.includes("long") || a.includes("10") || a.includes("15") || a.includes("20") || a.includes("retirement") || a.includes("more than 5")) return { value: "long_term" };
    return { value: "medium_term" };
  }

  return { value: answer };
}

async function parseAnswer(answer, questionId) {
  // Try rule-based first (instant, no LLM cost)
  const ruleResult = parseAnswerRuleBased(answer, questionId);
  
  // If we have a reasonable parse, return it immediately
  const validParse = (
    (questionId === "income" && ["under_5l","5l_15l","15l_50l","above_50l"].includes(ruleResult.value)) ||
    (questionId === "experience" && ["beginner","intermediate","advanced"].includes(ruleResult.value)) ||
    (questionId === "goals" && Array.isArray(ruleResult.value) && ruleResult.value.length > 0) ||
    (questionId === "risk" && ["low","medium","high"].includes(ruleResult.value)) ||
    (questionId === "time_horizon" && ["short_term","medium_term","long_term"].includes(ruleResult.value))
  );

  if (validParse) return ruleResult;

  // Only call LLM for ambiguous free-text answers
  try {
    const prompts = {
      income: `Parse this income answer into one of: "under_5l","5l_15l","15l_50l","above_50l". Answer: "${answer}". Return JSON: {"value":"..."}`,
      experience: `Parse this investing experience into one of: "beginner","intermediate","advanced". Answer: "${answer}". Return JSON: {"value":"..."}`,
      goals: `Parse financial goals into array from ["investing","saving","learning","retirement","tax_planning"]. Answer: "${answer}". Return JSON: {"value":["..."]}`,
      risk: `Parse risk appetite into one of: "low","medium","high". Answer: "${answer}". Return JSON: {"value":"..."}`,
      time_horizon: `Parse investment horizon into one of: "short_term","medium_term","long_term". Answer: "${answer}". Return JSON: {"value":"..."}`,
    };
    const result = await callLLMJSON(prompts[questionId], ruleResult);
    return result;
  } catch {
    return ruleResult;
  }
}

export function buildUserProfileFromOnboarding(answers) {
  const income = answers.income_range || "5l_15l";
  const experience = answers.experience_level || "beginner";
  const goals = Array.isArray(answers.primary_goals) ? answers.primary_goals : [answers.primary_goals || "learning"];
  const risk = answers.risk_appetite || "medium";
  const horizon = answers.time_horizon || "medium_term";

  const horizonDisplay = { short_term: "< 1 year", medium_term: "1–5 years", long_term: "5+ years" }[horizon] || horizon;

  return {
    income_range: income,
    income_display: INCOME_MAP[income] || income,
    experience_level: experience,
    primary_goals: goals,
    goals: goals.join(", "),
    risk_appetite: risk,
    time_horizon: horizon,
    time_horizon_display: horizonDisplay,
    interests: goals,
    urgency: horizon === "short_term" ? "immediate" : horizon === "long_term" ? "long-term" : "short-term",
    onboarded: true,
    onboarded_at: new Date().toISOString(),
    summary: `${experience.charAt(0).toUpperCase() + experience.slice(1)} investor · ${INCOME_MAP[income] || income} · ${goals.slice(0, 2).join(" & ")} · ${risk} risk · ${horizonDisplay}`,
  };
}

export async function onboardingAgent(state) {
  const { step = 0, answers = {}, lastUserMessage = "", sessionId = null } = state;

  if (step === 0) {
    return {
      complete: false, step: 1, answers: {},
      message: ONBOARDING_QUESTIONS[0].question,
      questionId: ONBOARDING_QUESTIONS[0].id,
      field: ONBOARDING_QUESTIONS[0].field,
      progress: 0, totalSteps: ONBOARDING_QUESTIONS.length,
    };
  }

  const prevQ = ONBOARDING_QUESTIONS[step - 1];
  const parsed = await parseAnswer(lastUserMessage, prevQ.id);
  const updatedAnswers = { ...answers, [prevQ.field]: parsed.value };

  if (step < ONBOARDING_QUESTIONS.length) {
    const nextQ = ONBOARDING_QUESTIONS[step];
    return {
      complete: false, step: step + 1, answers: updatedAnswers,
      message: nextQ.question,
      questionId: nextQ.id, field: nextQ.field,
      progress: Math.round((step / ONBOARDING_QUESTIONS.length) * 100),
      totalSteps: ONBOARDING_QUESTIONS.length,
    };
  }

  const userProfile = buildUserProfileFromOnboarding(updatedAnswers);

  if (sessionId) {
    saveUserProfile(sessionId, userProfile).catch((e) => console.error("Supabase save:", e.message));
  }

  return {
    complete: true,
    step: ONBOARDING_QUESTIONS.length + 1,
    answers: updatedAnswers,
    profile: userProfile,
    message: `Your profile is ready.\n\nExperience: ${userProfile.experience_level}\nIncome: ${userProfile.income_display}\nGoals: ${userProfile.goals}\nRisk: ${userProfile.risk_appetite}\nHorizon: ${userProfile.time_horizon_display}\n\nAsk me anything — every answer will be tailored to your exact profile.`,
    progress: 100,
    totalSteps: ONBOARDING_QUESTIONS.length,
  };
}
