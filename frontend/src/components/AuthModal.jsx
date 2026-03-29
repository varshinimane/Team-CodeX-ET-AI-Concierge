import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function AuthModal({ onClose, onSuccess }) {
  const { login, signup } = useAuth();
  const [mode, setMode]   = useState("login"); // "login" | "signup"
  const [email, setEmail] = useState("");
  const [pass, setPass]   = useState("");
  const [err, setErr]     = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone]   = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email || !pass) return setErr("Email and password required");
    setErr(""); setLoading(true);
    try {
      if (mode === "login") {
        await login(email, pass);
        onSuccess?.("login");
        onClose();
      } else {
        const data = await signup(email, pass);
        if (!data.session) { setDone(true); } // needs email confirm
        else { onSuccess?.("signup"); onClose(); }
      }
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.85)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ width:"100%", maxWidth:380, background:"#0d0d10", border:"1px solid #1e1e22", borderRadius:16, overflow:"hidden", boxShadow:"0 32px 80px rgba(0,0,0,0.8)" }}>

        {/* Header */}
        <div style={{ padding:"20px 24px 0", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:28, height:28, borderRadius:7, background:"#e8002d", display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"Georgia,serif", fontWeight:700, fontSize:12, color:"#fff" }}>ET</span>
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:"#f0ede8" }}>{mode === "login" ? "Sign in" : "Create account"}</div>
              <div style={{ fontSize:10, color:"#444", fontFamily:"monospace" }}>Your profile stays saved</div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#444", fontSize:18, cursor:"pointer", padding:4, lineHeight:1 }}
            onMouseEnter={e => e.currentTarget.style.color="#e8002d"} onMouseLeave={e => e.currentTarget.style.color="#444"}>✕</button>
        </div>

        {done ? (
          <div style={{ padding:"24px 24px 28px", textAlign:"center" }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📬</div>
            <div style={{ fontSize:14, fontWeight:600, color:"#f0ede8", marginBottom:6 }}>Check your inbox</div>
            <div style={{ fontSize:12, color:"#666", lineHeight:1.65 }}>We've sent a confirmation link to <strong style={{color:"#aaa"}}>{email}</strong>. Click it to activate your account.</div>
            <button onClick={onClose} style={{ marginTop:20, padding:"9px 24px", borderRadius:8, border:"1px solid #1e1e22", background:"transparent", color:"#888", fontSize:12, cursor:"pointer" }}>Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ padding:"20px 24px 24px" }}>
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:16 }}>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email address"
                style={{ padding:"11px 14px", borderRadius:9, border:"1px solid #252528", background:"#0a0a0c", color:"#e8e6e1", fontSize:13, outline:"none", fontFamily:"system-ui,sans-serif" }}
                onFocus={e=>e.target.style.borderColor="rgba(232,0,45,0.4)"} onBlur={e=>e.target.style.borderColor="#252528"} />
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password"
                style={{ padding:"11px 14px", borderRadius:9, border:"1px solid #252528", background:"#0a0a0c", color:"#e8e6e1", fontSize:13, outline:"none", fontFamily:"system-ui,sans-serif" }}
                onFocus={e=>e.target.style.borderColor="rgba(232,0,45,0.4)"} onBlur={e=>e.target.style.borderColor="#252528"} />
            </div>

            {err && <div style={{ marginBottom:12, padding:"8px 12px", borderRadius:7, background:"rgba(239,68,68,0.07)", border:"1px solid rgba(239,68,68,0.2)", fontSize:11, color:"#f87171" }}>{err}</div>}

            <button type="submit" disabled={loading}
              style={{ width:"100%", padding:"12px", borderRadius:9, border:"none", background: loading ? "#1a1a1e" : "#e8002d", color: loading ? "#555" : "#fff", fontSize:13, fontWeight:600, cursor: loading ? "not-allowed" : "pointer", transition:"all 0.2s" }}>
              {loading ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>

            <div style={{ marginTop:14, textAlign:"center" }}>
              <span style={{ fontSize:12, color:"#555" }}>{mode === "login" ? "No account? " : "Already have one? "}</span>
              <button type="button" onClick={() => { setMode(mode==="login"?"signup":"login"); setErr(""); }}
                style={{ fontSize:12, color:"#e8002d", background:"none", border:"none", cursor:"pointer", fontWeight:500 }}>
                {mode === "login" ? "Create one" : "Sign in"}
              </button>
            </div>

            <div style={{ marginTop:14, padding:"10px 12px", borderRadius:7, background:"rgba(255,255,255,0.02)", border:"1px solid #1a1a1e" }}>
              <div style={{ fontSize:9, color:"#333", fontFamily:"monospace", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:3 }}>Anonymous mode</div>
              <div style={{ fontSize:10, color:"#555", lineHeight:1.5 }}>The app works without an account. Login saves your profile permanently and syncs across devices.</div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
