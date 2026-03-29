const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";
const SESSION_KEY = "et_session_id";
const PROFILE_KEY = "et_profile";
const AUTH_KEY    = "et_auth";

export function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (typeof crypto !== "undefined" && crypto.randomUUID)
      ? crypto.randomUUID()
      : "s-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export function clearSession() {
  [SESSION_KEY, PROFILE_KEY, AUTH_KEY].forEach(k => localStorage.removeItem(k));
}

export function saveProfileLocally(p)  { localStorage.setItem(PROFILE_KEY, JSON.stringify(p)); }
export function loadProfileLocally()   { try { const d=localStorage.getItem(PROFILE_KEY); return d ? JSON.parse(d) : null; } catch { return null; } }
export function saveAuthLocally(auth)  { localStorage.setItem(AUTH_KEY, JSON.stringify(auth)); }
export function loadAuthLocally()      { try { const d=localStorage.getItem(AUTH_KEY); return d ? JSON.parse(d) : null; } catch { return null; } }
export function clearAuth()            { localStorage.removeItem(AUTH_KEY); }

async function post(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) {
    const e = await r.json().catch(() => ({}));
    throw new Error(e.message || e.error || `HTTP ${r.status}`);
  }
  return r.json();
}

// ── Chat & Onboarding ─────────────────────────────────────────
export const sendMessage    = (msg, profile)              => post("/chat",       { message: msg, userProfile: profile, sessionId: getSessionId() });
export const sendOnboarding = (step, answers, msg)        => post("/onboarding", { step, answers, message: msg, sessionId: getSessionId() });

// ── Product Tracking ──────────────────────────────────────────
export const trackClick     = (productId, productName, actionType = "click", metadata = {}) =>
  post("/api/track-click", { session_id: getSessionId(), product_id: productId, product_name: productName, action_type: actionType, metadata });

export const getProductModal = (product, userProfile)     => post("/api/product-modal", { product, userProfile, sessionId: getSessionId() });

// ── Auth ───────────────────────────────────────────────────────
export const authSignup = (email, password) => post("/auth/signup", { email, password, sessionId: getSessionId() });
export const authLogin  = (email, password) => post("/auth/login",  { email, password, sessionId: getSessionId() });
