import { callLLMJSON } from "../llm.js";

function ruleBasedProfile(userMessage, savedProfile) {
  const msg = userMessage.toLowerCase();

  const interests = [];
  if (msg.match(/invest|stock|mutual fund|sip|nifty|sensex|equity|portfolio/)) interests.push("investing");
  if (msg.match(/sav|fd|fixed deposit|recurring|emergency fund/)) interests.push("saving");
  if (msg.match(/tax|80c|elss|deduction|itr|80d/)) interests.push("tax_planning");
  if (msg.match(/retire|pension|nps|ppf|fire/)) interests.push("retirement");
  if (msg.match(/insur|term|health cover|life cover/)) interests.push("insurance");
  if (msg.match(/learn|understand|explain|what is|how does|beginner/)) interests.push("learning");
  if (msg.match(/house|home|property|flat|real estate/)) interests.push("saving");
  if (msg.match(/trade|trading|intraday|f&o|futures|options/)) interests.push("trading");
  if (interests.length === 0) interests.push("investing");

  // Detect goal from message
  let goals = savedProfile?.goals || interests.slice(0, 2).join(", ");
  if (msg.includes("house") || msg.includes("home")) goals = "Save and invest for buying a house";
  else if (msg.includes("retire")) goals = "Build a retirement corpus";
  else if (msg.includes("tax")) goals = "Optimise tax savings";
  else if (msg.includes("child") || msg.includes("education")) goals = "Save for child's education";

  const urgency = msg.match(/urgent|now|immediately|asap|today/) ? "immediate"
    : msg.match(/long.?term|retirement|10 year|20 year/) ? "long-term"
    : "short-term";

  return {
    interests,
    goals: goals || "Grow wealth through smart investing",
    experience_level: savedProfile?.experience_level || "beginner",
    risk_appetite: savedProfile?.risk_appetite || "medium",
    urgency,
    summary: savedProfile?.summary || `${savedProfile?.experience_level || "beginner"} investor interested in ${interests.join(", ")}.`,
  };
}

export async function profilingAgent(userMessage, savedProfile = null) {
  const ruleFallback = ruleBasedProfile(userMessage, savedProfile);

  const contextHint = savedProfile
    ? `\nKnown user: experience=${savedProfile.experience_level}, income=${savedProfile.income_display}, goals=${savedProfile.goals}, risk=${savedProfile.risk_appetite}`
    : "";

  // callLLMJSON never throws — returns fallback if LLM fails
  const result = await callLLMJSON(
    `You are a financial profiling expert for Economic Times India.
Analyze this user message and extract a structured profile.${contextHint}

User Message: "${userMessage}"

Return ONLY this JSON:
{
  "interests": ["list of financial topics"],
  "goals": "primary financial goal in one sentence",
  "experience_level": "beginner|intermediate|advanced",
  "risk_appetite": "low|medium|high",
  "urgency": "immediate|short-term|long-term",
  "summary": "2-sentence profile of this user"
}`,
    ruleFallback
  );

  // Merge with saved onboarding profile (onboarding always wins)
  if (savedProfile) {
    return {
      ...result,
      income_range: savedProfile.income_range,
      income_display: savedProfile.income_display,
      experience_level: savedProfile.experience_level,
      risk_appetite: savedProfile.risk_appetite,
      primary_goals: savedProfile.primary_goals || result.interests,
      goals: result.goals || savedProfile.goals,
      time_horizon: savedProfile.time_horizon,
      time_horizon_display: savedProfile.time_horizon_display,
      onboarded: true,
      summary: result.summary || savedProfile.summary,
    };
  }

  return result;
}
