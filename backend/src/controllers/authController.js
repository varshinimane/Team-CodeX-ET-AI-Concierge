import { getSupabase, linkSessionToUser, mergeAnonymousData, getUserProfile } from "../db.js";

// POST /auth/signup
export async function handleSignup(req, res) {
  const { email, password, sessionId } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const db = getSupabase();
  if (!db) return res.status(503).json({ error: "Supabase not configured" });

  try {
    const { data, error } = await db.auth.signUp({ email, password });
    if (error) return res.status(400).json({ error: error.message });

    const userId = data.user?.id;

    // Merge anonymous session data into the new account
    if (sessionId && userId) {
      await mergeAnonymousData(sessionId, userId);
    }

    return res.json({
      user: { id: userId, email: data.user?.email, emailConfirmed: data.user?.email_confirmed_at != null },
      session: data.session ? { accessToken: data.session.access_token, expiresAt: data.session.expires_at } : null,
      merged: !!sessionId,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /auth/login
export async function handleLogin(req, res) {
  const { email, password, sessionId } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password required" });

  const db = getSupabase();
  if (!db) return res.status(503).json({ error: "Supabase not configured" });

  try {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) return res.status(401).json({ error: error.message });

    const userId = data.user?.id;

    // Merge anonymous session data into this account
    if (sessionId && userId) {
      await mergeAnonymousData(sessionId, userId);
    }

    // Fetch merged profile
    const profile = await getUserProfile(sessionId);

    return res.json({
      user: { id: userId, email: data.user?.email },
      session: { accessToken: data.session.access_token, expiresAt: data.session.expires_at },
      profile,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// POST /auth/link-session — Link existing session to already-authed user
export async function handleLinkSession(req, res) {
  const { sessionId, userId } = req.body;
  if (!sessionId || !userId) return res.status(400).json({ error: "sessionId and userId required" });

  try {
    await linkSessionToUser(sessionId, userId);
    return res.json({ success: true, linked: { sessionId, userId } });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

// GET /auth/user?sessionId=...
export async function handleGetUser(req, res) {
  const { sessionId } = req.query;
  if (!sessionId) return res.status(400).json({ error: "sessionId required" });

  try {
    const profile = await getUserProfile(sessionId);
    return res.json({ profile, sessionId });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
