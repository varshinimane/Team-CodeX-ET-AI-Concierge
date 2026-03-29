import { onboardingAgent }     from "../agents/onboardingAgent.js";
import { profilingAgent }      from "../agents/profilingAgent.js";
import { intentAgent }         from "../agents/intentAgent.js";
import { recommendationAgent } from "../agents/recommendationAgent.js";
import { crossSellAgent }      from "../agents/crossSellAgent.js";
import { marketplaceAgent }    from "../agents/marketplaceAgent.js";
import { explanationAgent }    from "../agents/explanationAgent.js";
import { getUserProfile, saveUserProfile, saveChatMessage, getChatHistory } from "../db.js";

export async function handleOnboarding(req, res) {
  const { step = 0, answers = {}, message = "", sessionId = null } = req.body;
  console.log(`\n[Onboarding] Step ${step}`);
  try {
    const result = await onboardingAgent({ step, answers, lastUserMessage: message, sessionId });
    if (result.complete && result.profile && sessionId) {
      await saveUserProfile(sessionId, result.profile);
    }
    return res.json(result);
  } catch (error) {
    return res.status(500).json({ error: "Onboarding failed", message: error.message });
  }
}

export async function handleChat(req, res) {
  const { message, userProfile: clientProfile, sessionId = null } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: "Message required" });

  console.log(`\n${"─".repeat(50)}\nChat: "${message.slice(0, 70)}"\nSession: ${sessionId?.slice(0, 8) || "none"}`);

  try {
    let savedProfile = sessionId ? await getUserProfile(sessionId) : null;
    const resolvedProfile = savedProfile || clientProfile || null;

    if (sessionId) saveChatMessage(sessionId, "user", message).catch(() => {});

    // ── Agents ──────────────────────────────────────────────
    let profile;
    try { profile = await profilingAgent(message, resolvedProfile); }
    catch { profile = { interests:["investing"], goals: message.slice(0,80), experience_level:"beginner", risk_appetite:"medium", urgency:"short-term", summary:"User seeking advice.", ...(resolvedProfile||{}) }; }

    let intent;
    try { intent = await intentAgent(profile); }
    catch { intent = { primary_intent:"INVESTING", confidence:"medium", sub_intents:[], content_focus:"General financial guidance", user_stage:"awareness", next_best_action:"Start a SIP in a Nifty 50 index fund" }; }

    let recommendations;
    try { recommendations = await recommendationAgent(intent, profile); }
    catch { recommendations = { recommendations:[], primary_action: intent.next_best_action, risk_insight:"" }; }

    let crossSellResult;
    try { crossSellResult = await crossSellAgent(profile, intent); }
    catch { crossSellResult = { crossSell:[], topPickId:null }; }

    let marketplaceResult;
    try { marketplaceResult = await marketplaceAgent(profile, intent); }
    catch { marketplaceResult = { services:[] }; }

    // explanationAgent now returns structured object {strategy, immediateAction, investmentPlan, whatToAvoid}
    let structured;
    try { structured = await explanationAgent(profile, intent, recommendations, crossSellResult, marketplaceResult); }
    catch { structured = { strategy:"Focus on capital-protected instruments first.", immediateAction: intent.next_best_action, investmentPlan:"Start with ₹500/month SIP in Nifty 50 index fund.", whatToAvoid:"Avoid complex products until you have a foundation." }; }

    // backward-compat: also expose flat "final" string for chat bubble
    const finalText = typeof structured === "string"
      ? structured
      : `${structured.strategy} ${structured.immediateAction}`;

    if (sessionId) saveChatMessage(sessionId, "assistant", finalText, { intent: intent.primary_intent }).catch(() => {});

    return res.json({
      steps: { profile, intent, recommendations, crossSell: crossSellResult, marketplace: marketplaceResult },
      final: finalText,
      structured,                      // 4-section structured response
      nextBestAction: intent.next_best_action || recommendations.primary_action,
      riskInsight: recommendations.risk_insight || "",
      meta: {
        timestamp: new Date().toISOString(),
        agentsRun: 6,
        sessionId,
        isPersonalized: !!resolvedProfile?.onboarded,
        supabaseConnected: !!savedProfile,
      },
    });
  } catch (error) {
    console.error("Pipeline error:", error.message);
    return res.status(500).json({ error: "Pipeline failed", message: error.message, hint: "Check OPENROUTER_API_KEY in backend/.env" });
  }
}

export async function handleHistory(req, res) {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });
  try {
    const [history, profile] = await Promise.all([getChatHistory(sessionId, 20), getUserProfile(sessionId)]);
    return res.json({ history, profile, sessionId });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
