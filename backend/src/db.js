import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config();

const supabaseUrl  = process.env.SUPABASE_URL;
const supabaseKey  = process.env.SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // for admin ops

let supabase = null;
let supabaseAdmin = null;

export function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null;
  if (!supabase) supabase = createClient(supabaseUrl, supabaseKey);
  return supabase;
}

function getSupabaseAdmin() {
  if (!supabaseUrl || !supabaseServiceKey) return getSupabase();
  if (!supabaseAdmin) supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
  return supabaseAdmin;
}

// ── Schema ────────────────────────────────────────────────────
export const SCHEMA_SQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (works for both anon + auth users)
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      TEXT UNIQUE NOT NULL,
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  income_range    TEXT,
  income_display  TEXT,
  experience_level TEXT CHECK (experience_level IN ('beginner','intermediate','advanced')),
  primary_goals   TEXT[],
  goals           TEXT,
  risk_appetite   TEXT CHECK (risk_appetite IN ('low','medium','high')),
  time_horizon    TEXT,
  interests       TEXT[],
  summary         TEXT,
  onboarded       BOOLEAN DEFAULT FALSE,
  onboarded_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Chats table
CREATE TABLE IF NOT EXISTS chats (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  role        TEXT CHECK (role IN ('user','assistant')) NOT NULL,
  content     TEXT NOT NULL,
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Product clicks tracking
CREATE TABLE IF NOT EXISTS product_clicks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id  TEXT NOT NULL,
  product_name TEXT,
  action_type TEXT CHECK (action_type IN ('view','click','cta','modal_open')) DEFAULT 'click',
  metadata    JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_session    ON users(session_id);
CREATE INDEX IF NOT EXISTS idx_users_user_id    ON users(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_session    ON chats(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_session   ON product_clicks(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_clicks_product   ON product_clicks(product_id, created_at DESC);
`;

// ── User Profile Operations ───────────────────────────────────

export async function saveUserProfile(sessionId, profile, userId = null) {
  const db = getSupabase();
  if (!db) { console.log("  Supabase not configured — using local only"); return profile; }

  try {
    const { data, error } = await db.from("users").upsert({
      session_id:      sessionId,
      user_id:         userId || null,
      income_range:    profile.income_range,
      income_display:  profile.income_display,
      experience_level:profile.experience_level,
      primary_goals:   profile.primary_goals || [],
      goals:           profile.goals,
      risk_appetite:   profile.risk_appetite,
      time_horizon:    profile.time_horizon,
      interests:       profile.interests || [],
      summary:         profile.summary,
      onboarded:       true,
      onboarded_at:    profile.onboarded_at || new Date().toISOString(),
      updated_at:      new Date().toISOString(),
    }, { onConflict: "session_id" }).select().single();

    if (error) { console.error("  saveUserProfile:", error.message); return profile; }
    return data;
  } catch (err) { console.error("  saveUserProfile:", err.message); return profile; }
}

export async function getUserProfile(sessionId) {
  const db = getSupabase();
  if (!db || !sessionId) return null;
  try {
    const { data, error } = await db.from("users").select("*").eq("session_id", sessionId).single();
    if (error || !data) return null;
    return data;
  } catch { return null; }
}

export async function linkSessionToUser(sessionId, userId) {
  const db = getSupabaseAdmin();
  if (!db || !sessionId || !userId) return;
  try {
    await db.from("users").update({ user_id: userId, updated_at: new Date().toISOString() }).eq("session_id", sessionId);
    await db.from("chats").update({ user_id: userId }).eq("session_id", sessionId);
    await db.from("product_clicks").update({ user_id: userId }).eq("session_id", sessionId);
    console.log(`  Linked session ${sessionId.slice(0,8)} → user ${userId.slice(0,8)}`);
  } catch (err) { console.error("  linkSessionToUser:", err.message); }
}

export async function mergeAnonymousData(anonymousSessionId, userId) {
  const db = getSupabaseAdmin();
  if (!db) return null;
  try {
    // Get anon profile
    const anonProfile = await getUserProfile(anonymousSessionId);
    if (!anonProfile) return null;

    // Check if user already has a profile
    const { data: existingUser } = await db.from("users").select("*").eq("user_id", userId).single();

    if (existingUser) {
      // Merge: keep onboarded profile data from anon session
      if (anonProfile.onboarded && !existingUser.onboarded) {
        await db.from("users").update({
          income_range:     anonProfile.income_range,
          income_display:   anonProfile.income_display,
          experience_level: anonProfile.experience_level,
          primary_goals:    anonProfile.primary_goals,
          goals:            anonProfile.goals,
          risk_appetite:    anonProfile.risk_appetite,
          time_horizon:     anonProfile.time_horizon,
          interests:        anonProfile.interests,
          summary:          anonProfile.summary,
          onboarded:        true,
          onboarded_at:     anonProfile.onboarded_at,
          updated_at:       new Date().toISOString(),
        }).eq("user_id", userId);
      }
      return existingUser;
    } else {
      // Link anon session to this user
      await linkSessionToUser(anonymousSessionId, userId);
      return anonProfile;
    }
  } catch (err) { console.error("  mergeAnonymousData:", err.message); return null; }
}

// ── Chat History ──────────────────────────────────────────────

export async function saveChatMessage(sessionId, role, content, metadata = {}, userId = null) {
  const db = getSupabase();
  if (!db) return;
  try {
    await db.from("chats").insert({
      session_id: sessionId, user_id: userId || null,
      role, content, metadata, created_at: new Date().toISOString(),
    });
  } catch (err) { console.error("  saveChatMessage:", err.message); }
}

export async function getChatHistory(sessionId, limit = 10) {
  const db = getSupabase();
  if (!db) return [];
  try {
    const { data } = await db.from("chats").select("role,content,created_at")
      .eq("session_id", sessionId).order("created_at", { ascending: false }).limit(limit);
    return (data || []).reverse();
  } catch { return []; }
}

// ── Product Click Tracking ────────────────────────────────────

export async function trackProductClick(sessionId, productId, productName, actionType = "click", metadata = {}, userId = null) {
  const db = getSupabase();
  if (!db) return;
  try {
    await db.from("product_clicks").insert({
      session_id: sessionId, user_id: userId || null,
      product_id: productId, product_name: productName,
      action_type: actionType, metadata,
      created_at: new Date().toISOString(),
    });
    console.log(`  Tracked: ${actionType} on ${productId}`);
  } catch (err) { console.error("  trackProductClick:", err.message); }
}

export async function getClickStats(productId) {
  const db = getSupabase();
  if (!db) return null;
  try {
    const { data } = await db.from("product_clicks").select("product_id, action_type")
      .eq("product_id", productId).order("created_at", { ascending: false }).limit(1000);
    if (!data) return null;
    return {
      productId,
      total: data.length,
      byType: data.reduce((acc, r) => { acc[r.action_type] = (acc[r.action_type]||0)+1; return acc; }, {}),
    };
  } catch { return null; }
}

export function getSupabaseStatus() {
  const db = getSupabase();
  return {
    connected: !!db,
    url: supabaseUrl ? supabaseUrl.split("//")[1]?.split(".")[0] + ".*" : null,
  };
}
