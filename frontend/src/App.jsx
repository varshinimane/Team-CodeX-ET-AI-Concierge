import { useState, useRef, useEffect, useCallback } from "react";
import { sendMessage, getSessionId, clearSession, saveProfileLocally, loadProfileLocally } from "./utils/api.js";
import { useAuth } from "./context/AuthContext.jsx";
import AgentPipeline     from "./components/AgentPipeline.jsx";
import ProfileCard       from "./components/ProfileCard.jsx";
import IntentCard        from "./components/IntentCard.jsx";
import RecommendationsCard from "./components/RecommendationsCard.jsx";
import CrossSellCard     from "./components/CrossSellCard.jsx";
import MarketplaceCard   from "./components/MarketplaceCard.jsx";
import StructuredResponse from "./components/StructuredResponse.jsx";
import ExplanationCard   from "./components/ExplanationCard.jsx";
import NextActionCard    from "./components/NextActionCard.jsx";
import LoadingState      from "./components/LoadingState.jsx";
import ChatMessage       from "./components/ChatMessage.jsx";
import SuggestionChips   from "./components/SuggestionChips.jsx";
import OnboardingFlow    from "./components/OnboardingFlow.jsx";
import AuthModal         from "./components/AuthModal.jsx";

const AGENT_SEQ    = ["profile","intent","recommend","crosssell","marketplace","explain"];
const AGENT_DELAYS = [400,1100,1900,2700,3500,4300];

// ── Ticker data ──────────────────────────────────────────────
const TICKER_ITEMS = [
  { sym:"SENSEX", val:"74,572.14", chg:"+0.47%", up:true },
  { sym:"NIFTY 50", val:"22,519.40", chg:"+0.38%", up:true },
  { sym:"BANK NIFTY", val:"48,223.55", chg:"-0.12%", up:false },
  { sym:"GOLD", val:"₹72,145", chg:"+0.61%", up:true },
  { sym:"USD/INR", val:"83.42", chg:"-0.08%", up:false },
  { sym:"RELIANCE", val:"2,934.80", chg:"+1.14%", up:true },
  { sym:"HDFC BANK", val:"1,648.25", chg:"+0.55%", up:true },
  { sym:"INFOSYS", val:"1,789.60", chg:"-0.33%", up:false },
  { sym:"TCS", val:"3,912.45", chg:"+0.22%", up:true },
  { sym:"NIFTY IT", val:"38,412.70", chg:"+0.89%", up:true },
  { sym:"CRUDE OIL", val:"$86.34", chg:"-0.44%", up:false },
  { sym:"NIFTY MID", val:"44,218.60", chg:"+0.71%", up:true },
];

// ── Floating particles config ─────────────────────────────
const FLOATERS = ["₹", "+", "%", "↑", "∞", "SIP", "NAV", "₹", "↗", "%", "SIP", "12%"];

function LiveTicker() {
  const doubled = [...TICKER_ITEMS, ...TICKER_ITEMS];
  return (
    <div className="ticker-wrap">
      <div className="ticker-track">
        {doubled.map((t, i) => (
          <div key={i} className="ticker-item">
            <span className="sym">{t.sym}</span>
            <span className="val">{t.val}</span>
            <span className={t.up ? "up" : "dn"}>{t.chg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Background candlestick SVG animation
function CandleBackground() {
  const candles = Array.from({ length: 18 }, (_, i) => {
    const x = (i / 18) * 100;
    const h = 20 + Math.random() * 55;
    const open = 10 + Math.random() * 20;
    const close = open + (Math.random() > 0.48 ? 1 : -1) * (5 + Math.random() * 20);
    const isUp = close > open;
    const delay = i * 0.08;
    return { x, h, open, close, isUp, delay };
  });

  return (
    <div style={{
      position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0,
      opacity: 0.07, overflow: "hidden",
    }}>
      <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        {candles.map((c, i) => {
          const barH = Math.abs(c.close - c.open);
          const barY = 100 - Math.max(c.open, c.close) - 5;
          const wickTop = 100 - c.h - 5;
          const wickBot = 100 - Math.min(c.open, c.close) - 5;
          return (
            <g key={i}>
              {/* Wick */}
              <line
                x1={c.x + 2.5} y1={wickTop} x2={c.x + 2.5} y2={wickBot}
                stroke={c.isUp ? "#22c55e" : "#ef4444"} strokeWidth="0.3"
                style={{ animation: `candleRise 0.6s ${c.delay}s ease-out both` }}
              />
              {/* Body */}
              <rect
                x={c.x + 1} y={barY} width={3} height={Math.max(barH, 0.5)}
                fill={c.isUp ? "#22c55e" : "#ef4444"}
                style={{
                  transformOrigin: `${c.x + 2.5}px ${barY + barH}px`,
                  animation: `candleRise 0.5s ${c.delay + 0.05}s ease-out both`,
                }}
              />
            </g>
          );
        })}
        {/* Sparkline */}
        <polyline
          points="0,70 10,65 20,68 30,58 40,62 50,52 60,48 70,54 80,44 90,38 100,42"
          fill="none" stroke="rgba(232,0,45,0.6)" strokeWidth="0.4"
          strokeDasharray="1000" strokeDashoffset="1000"
          style={{ animation: "chartDraw 2.5s 0.3s ease forwards" }}
        />
      </svg>
    </div>
  );
}

// Floating finance particles
function FloatingParticles() {
  const items = Array.from({ length: 12 }, (_, i) => ({
    sym: FLOATERS[i % FLOATERS.length],
    left: `${5 + (i * 8.3) % 90}%`,
    delay: `${(i * 1.7) % 8}s`,
    dur: `${6 + (i * 1.3) % 6}s`,
    size: 9 + (i % 3) * 2,
  }));
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {items.map((p, i) => (
        <div key={i} style={{
          position: "absolute",
          bottom: "-20px",
          left: p.left,
          fontSize: p.size,
          color: i % 3 === 0 ? "rgba(232,0,45,0.12)" : i % 3 === 1 ? "rgba(34,197,94,0.08)" : "rgba(96,165,250,0.08)",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 700,
          animation: `floatUp ${p.dur} ${p.delay} ease-in infinite`,
          userSelect: "none",
        }}>
          {p.sym}
        </div>
      ))}
      <style>{`
        @keyframes floatUp {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 0.5; }
          100% { transform: translateY(-100vh) rotate(15deg); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

// Mini sparkline for header
function HeaderSparkline() {
  return (
    <svg width="52" height="18" viewBox="0 0 52 18" fill="none">
      <polyline
        points="2,14 8,10 14,12 20,6 26,9 32,4 38,7 44,2 50,5"
        stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
        style={{ strokeDasharray: 120, animation: "chartDraw 1.5s ease forwards" }}
      />
    </svg>
  );
}

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_`#"]/g,"").replace(/\n+/g,". ").slice(0,350);
  const u = new SpeechSynthesisUtterance(clean);
  u.lang="en-IN"; u.rate=0.9;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v=>v.lang.startsWith("en")&&v.localService);
  if (preferred) u.voice=preferred;
  window.speechSynthesis.speak(u);
}

function useChatVoice(onResult) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);
  const supported = !!(window.SpeechRecognition||window.webkitSpeechRecognition);
  useEffect(() => {
    const SR = window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR(); r.continuous=false; r.interimResults=false; r.lang="en-IN";
    r.onresult = e => { onResult(e.results[0][0].transcript); setListening(false); };
    r.onerror = r.onend = () => setListening(false);
    recRef.current=r;
  }, [onResult]);
  const toggle = useCallback(() => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); }
    else { recRef.current.start(); setListening(true); }
  }, [listening]);
  return { listening, supported, toggle };
}

export default function App() {
  const { user, isLoggedIn, logout } = useAuth();
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [activeAgent, setAgent] = useState(null);
  const [response, setResponse] = useState(null);
  const [error, setError]       = useState(null);
  const [history, setHistory]   = useState([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [profile, setProfile]   = useState(null);
  const [voiceOut, setVoiceOut] = useState(false);

  const chatEnd  = useRef(null); const panelEnd = useRef(null);
  const inputRef = useRef(null); const timers   = useRef([]);

  const { listening, supported: voiceIn, toggle: toggleVoice } = useChatVoice(
    useCallback(t => { setInput(t); setTimeout(()=>inputRef.current?.focus(),50); },[])
  );

  useEffect(() => { const p=loadProfileLocally(); if (p) setProfile(p); getSessionId(); }, []);
  useEffect(() => { chatEnd.current?.scrollIntoView({behavior:"smooth"}); }, [history,loading]);
  useEffect(() => { if (response) setTimeout(()=>panelEnd.current?.scrollIntoView({behavior:"smooth"}),200); }, [response]);

  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current=[]; };
  const animateAgents = useCallback(() => {
    clearTimers();
    AGENT_SEQ.forEach((a,i) => { const t=setTimeout(()=>setAgent(a),AGENT_DELAYS[i]); timers.current.push(t); });
  }, []);

  const onOnboardingDone = useCallback(p => {
    setProfile(p); setShowOnboarding(false); saveProfileLocally(p);
    setHistory([{ role:"assistant", content:`Welcome. Your profile is set — ${p.experience_level} investor, ${p.income_display}, focused on ${p.goals}.\n\nAsk me anything about investing, saving, or tax planning.`, timestamp:new Date() }]);
    setTimeout(()=>inputRef.current?.focus(),200);
  }, []);

  const resetProfile = useCallback(() => { clearSession(); setProfile(null); setHistory([]); setResponse(null); setError(null); setAgent(null); clearTimers(); }, []);

  const submit = useCallback(async text => {
    const msg=(text||input).trim();
    if (!msg||loading) return;
    setInput(""); setError(null); setResponse(null); setAgent(null); setLoading(true);
    setHistory(prev=>[...prev,{role:"user",content:msg,timestamp:new Date()}]);
    animateAgents();
    try {
      const data = await sendMessage(msg, profile);
      clearTimers(); setAgent("done"); setResponse(data);
      if (data.steps?.profile && profile) {
        const merged={...profile,...data.steps.profile,onboarded:true,income_display:profile.income_display,income_range:profile.income_range,primary_goals:profile.primary_goals,time_horizon:profile.time_horizon,time_horizon_display:profile.time_horizon_display};
        setProfile(merged); saveProfileLocally(merged);
      }
      const txt = data.final || "";
      setHistory(prev=>[...prev,{role:"assistant",content:txt,timestamp:new Date(),meta:{intent:data.steps?.intent?.primary_intent,nextAction:data.nextBestAction}}]);
      if (voiceOut&&txt) speak(txt);
    } catch (err) { clearTimers(); setAgent(null); setError(err.message||"Pipeline failed. Check backend."); }
    finally { setLoading(false); setTimeout(()=>inputRef.current?.focus(),100); }
  }, [input,loading,profile,animateAgents,voiceOut]);

  if (showOnboarding) return <OnboardingFlow onComplete={onOnboardingDone} />;
  const showPanel = loading||!!response;
  const hasHistory = history.length>0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%}
        body{background:#060608;color:#e2ddd8;font-family:'DM Sans',system-ui,sans-serif;-webkit-font-smoothing:antialiased}
        ::-webkit-scrollbar{width:3px} ::-webkit-scrollbar-track{background:transparent} ::-webkit-scrollbar-thumb{background:#222226;border-radius:3px}
        textarea,input{font-family:'DM Sans',system-ui,sans-serif}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
        @keyframes dotPulse{0%,100%{transform:translateY(0);opacity:0.4}50%{transform:translateY(-4px);opacity:1}}
        @keyframes pingRed{0%{transform:scale(1);opacity:1}75%,100%{transform:scale(2.2);opacity:0}}
        @keyframes breathe{0%,100%{opacity:1}50%{opacity:0.3}}
        @keyframes voiceRing{0%,100%{box-shadow:0 0 0 0 rgba(232,0,45,0.35)}50%{box-shadow:0 0 0 7px rgba(232,0,45,0)}}
        @keyframes borderGlow{0%,100%{border-color:rgba(232,0,45,0.2);box-shadow:none}50%{border-color:rgba(232,0,45,0.55);box-shadow:0 0 20px rgba(232,0,45,0.1)}}
        @keyframes chartDraw{from{stroke-dashoffset:1000}to{stroke-dashoffset:0}}
        @keyframes candleRise{from{transform:scaleY(0);opacity:0}to{transform:scaleY(1);opacity:1}}
        @keyframes orbFloat{0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-18px)}}
        @keyframes tickerScroll{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
        @keyframes floatUp{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:0.8}90%{opacity:0.3}100%{transform:translateY(-100vh) rotate(15deg);opacity:0}}
        @keyframes panelSlide{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}
        @keyframes inputGlow{0%,100%{box-shadow:0 0 0 0 rgba(232,0,45,0)}50%{box-shadow:0 0 0 4px rgba(232,0,45,0.07)}}
        .fadeUp{animation:fadeUp 0.3s ease both}
        .card{background:#0d0d10;border:1px solid #18181c;border-radius:12px;padding:14px;transition:border-color 0.2s}
        .label{display:inline-flex;align-items:center;gap:5px;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:0.1em;text-transform:uppercase;padding:3px 8px;border-radius:99px;border:1px solid;margin-bottom:11px}
        .tag{display:inline-flex;align-items:center;font-size:9px;font-family:'JetBrains Mono',monospace;font-weight:600;letter-spacing:0.07em;text-transform:uppercase;padding:2px 8px;border-radius:99px}
        .chip{display:inline-flex;align-items:center;font-size:10px;padding:3px 8px;border-radius:99px;background:#0e0e12;border:1px solid #1e1e22;color:#555}
        .panel-animate{animation:panelSlide 0.4s cubic-bezier(0.4,0,0.2,1) both}
      `}</style>

      {/* ── BACKGROUND LAYERS ───────────────────────────────── */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
        {/* Grid */}
        <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(232,0,45,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(232,0,45,0.012) 1px,transparent 1px)",backgroundSize:"44px 44px",maskImage:"radial-gradient(ellipse 90% 90% at 50% 40%,black 5%,transparent 80%)"}} />
        {/* Top glow */}
        <div style={{position:"absolute",width:"700px",height:"500px",borderRadius:"50%",background:"radial-gradient(circle,rgba(232,0,45,0.06) 0%,transparent 65%)",top:"-250px",left:"50%",transform:"translateX(-50%)",animation:"orbFloat 10s ease-in-out infinite"}} />
        {/* Bottom right accent */}
        <div style={{position:"absolute",width:"350px",height:"350px",borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,0.04) 0%,transparent 70%)",bottom:"-100px",right:"-80px"}} />
        {/* Candlestick background */}
        <CandleBackground />
        {/* Floating particles */}
        <FloatingParticles />
      </div>

      {showAuth && <AuthModal onClose={()=>setShowAuth(false)} onSuccess={()=>{}} />}

      <div style={{minHeight:"100vh",display:"flex",flexDirection:"column",background:"transparent",position:"relative",zIndex:1}}>

        {/* ── LIVE TICKER ─────────────────────────────────────── */}
        <LiveTicker />

        {/* ── NAV ─────────────────────────────────────────────── */}
        <header style={{borderBottom:"1px solid #111115",background:"rgba(6,6,8,0.94)",backdropFilter:"blur(20px)",position:"sticky",top:0,zIndex:100}}>
          <div style={{maxWidth:1400,margin:"0 auto",padding:"0 24px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between"}}>

            {/* Logo + status */}
            <div style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:34,height:34,borderRadius:8,background:"linear-gradient(135deg,#e8002d,#c0001e)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 16px rgba(232,0,45,0.3)"}}>
                <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:15,color:"#fff",letterSpacing:"-0.02em"}}>ET</span>
              </div>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:"#f0ede8",lineHeight:1.2,letterSpacing:"-0.01em"}}>AI Concierge</div>
                <div style={{fontSize:8,color:"#2a2a2a",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.12em",textTransform:"uppercase"}}>Economic Times</div>
              </div>
              <div style={{width:1,height:20,background:"#18181c",margin:"0 6px"}} />
              {/* Sparkline */}
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                <HeaderSparkline />
                <div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 8px",borderRadius:6,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.14)"}}>
                  <div style={{width:5,height:5,borderRadius:"50%",background:"#22c55e",animation:"breathe 2s infinite"}} />
                  <span style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#22c55e",letterSpacing:"0.1em"}}>LIVE</span>
                </div>
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:7}}>
              {/* Auth */}
              {isLoggedIn ? (
                <div style={{display:"flex",alignItems:"center",gap:6}}>
                  <div style={{padding:"3px 9px",borderRadius:7,background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.16)"}}>
                    <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:"#22c55e"}}>● {user.email.split("@")[0]}</span>
                  </div>
                  <button onClick={logout} style={{fontSize:9,color:"#333",fontFamily:"'JetBrains Mono',monospace",background:"none",border:"none",cursor:"pointer",transition:"color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.color="#888"} onMouseLeave={e=>e.currentTarget.style.color="#333"}>SIGN OUT</button>
                </div>
              ) : (
                <button onClick={()=>setShowAuth(true)}
                  style={{height:28,padding:"0 13px",borderRadius:7,border:"1px solid #252528",background:"transparent",color:"#555",fontSize:10,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",letterSpacing:"0.06em",transition:"all 0.2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor="rgba(232,0,45,0.35)";e.currentTarget.style.color="#e8002d"}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor="#252528";e.currentTarget.style.color="#555"}}>
                  SIGN IN
                </button>
              )}

              {/* Profile chip */}
              {profile?.onboarded && (
                <div style={{display:"flex",alignItems:"center",gap:7,padding:"4px 11px",borderRadius:8,background:"#0d0d10",border:"1px solid #1a1a1e"}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end"}}>
                    <span style={{fontSize:10,fontWeight:600,color:"#b8b4ae",lineHeight:1.2}}>{profile.experience_level.charAt(0).toUpperCase()+profile.experience_level.slice(1)} investor</span>
                    <span style={{fontSize:8,color:"#333",fontFamily:"'JetBrains Mono',monospace"}}>{profile.income_display} · {profile.risk_appetite} risk</span>
                  </div>
                  <button onClick={resetProfile} style={{fontSize:11,color:"#2a2a2a",background:"none",border:"none",cursor:"pointer",padding:"2px",lineHeight:1,transition:"color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.color="#e8002d"} onMouseLeave={e=>e.currentTarget.style.color="#2a2a2a"}>✕</button>
                </div>
              )}

              {/* Voice output */}
              <button onClick={()=>setVoiceOut(v=>!v)} title={voiceOut?"Mute AI":"Enable AI voice"}
                style={{height:28,padding:"0 11px",borderRadius:7,border:`1px solid ${voiceOut?"rgba(34,197,94,0.35)":"#1e1e22"}`,background:voiceOut?"rgba(34,197,94,0.07)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",gap:5,transition:"all 0.2s"}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={voiceOut?"#22c55e":"#444"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  {voiceOut?<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>:<><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>}
                </svg>
                <span style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:voiceOut?"#22c55e":"#444",letterSpacing:"0.08em"}}>{voiceOut?"VOICE ON":"VOICE"}</span>
              </button>

              {/* Profile setup */}
              {!profile?.onboarded
                ? <button onClick={()=>setShowOnboarding(true)}
                    style={{height:28,padding:"0 13px",borderRadius:7,border:"1px solid rgba(232,0,45,0.35)",background:"rgba(232,0,45,0.07)",color:"#e8002d",fontSize:10,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",letterSpacing:"0.06em",transition:"all 0.2s",animation:"borderGlow 3s infinite"}}
                    onMouseEnter={e=>e.currentTarget.style.background="rgba(232,0,45,0.14)"} onMouseLeave={e=>e.currentTarget.style.background="rgba(232,0,45,0.07)"}>SETUP PROFILE</button>
                : <button onClick={()=>setShowOnboarding(true)}
                    style={{height:28,padding:"0 13px",borderRadius:7,border:"1px solid #1e1e22",background:"transparent",color:"#444",fontSize:10,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.2s"}}
                    onMouseEnter={e=>e.currentTarget.style.color="#777"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>REDO PROFILE</button>
              }

              {hasHistory && (
                <button onClick={()=>{setHistory([]);setResponse(null);setError(null);setAgent(null);clearTimers();}}
                  style={{height:28,padding:"0 12px",borderRadius:7,border:"1px solid #1e1e22",background:"transparent",color:"#444",fontSize:10,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",transition:"all 0.2s"}}
                  onMouseEnter={e=>e.currentTarget.style.color="#777"} onMouseLeave={e=>e.currentTarget.style.color="#444"}>NEW CHAT</button>
              )}
            </div>
          </div>
        </header>

        {/* ── BODY ─────────────────────────────────────────────── */}
        <div style={{flex:1,maxWidth:1400,margin:"0 auto",width:"100%",padding:"20px 24px",display:"flex",gap:20,alignItems:"flex-start",position:"relative",zIndex:1}}>

          {/* ── CHAT ─────────────────────────────────────────── */}
          <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column",height:"calc(100vh - 112px)"}}>

            {/* Empty state with enhanced visuals */}
            {!hasHistory && (
              <div className="fadeUp" style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",padding:"20px 0"}}>
                {/* ET logo with glow */}
                <div style={{position:"relative",marginBottom:24}}>
                  <div style={{position:"absolute",inset:-16,borderRadius:"50%",background:"radial-gradient(circle,rgba(232,0,45,0.15) 0%,transparent 70%)",animation:"breathe 3s infinite"}} />
                  <div style={{width:72,height:72,borderRadius:18,background:"linear-gradient(135deg,#e8002d,#c0001e)",display:"flex",alignItems:"center",justifyContent:"center",boxShadow:"0 0 40px rgba(232,0,45,0.25)",position:"relative"}}>
                    <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:30,color:"#fff",letterSpacing:"-0.02em"}}>ET</span>
                  </div>
                </div>

                <h1 style={{fontFamily:"'Playfair Display',Georgia,serif",fontSize:"clamp(24px,3vw,34px)",fontWeight:700,color:"#f0ede8",lineHeight:1.15,marginBottom:10,letterSpacing:"-0.02em"}}>
                  {profile?.onboarded ? "Good to have you back" : "Your Personal Finance Advisor"}
                </h1>

                {profile?.onboarded ? (
                  <div style={{marginBottom:22,padding:"14px 20px",borderRadius:12,background:"#0d0d10",border:"1px solid #18181c",textAlign:"left",maxWidth:400}}>
                    <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#333",textTransform:"uppercase",letterSpacing:"0.12em",marginBottom:9}}>Your Profile</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px 18px"}}>
                      {[["Experience",profile.experience_level],["Income",profile.income_display],["Risk",profile.risk_appetite],["Horizon",profile.time_horizon_display||profile.time_horizon],["Goals",profile.goals]].map(([k,v])=>(
                        <div key={k} style={{gridColumn:k==="Goals"?"1 / -1":"auto"}}>
                          <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#252525",textTransform:"uppercase",letterSpacing:"0.1em"}}>{k}</div>
                          <div style={{fontSize:12,color:"#777",marginTop:1}}>{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    <p style={{color:"#333",fontSize:13,maxWidth:380,lineHeight:1.8,marginBottom:22}}>
                      6-agent AI pipeline · OpenRouter · Supabase · Structured financial plans with real ₹ numbers
                    </p>
                    {/* Animated stat pills */}
                    <div style={{display:"flex",gap:10,marginBottom:26,flexWrap:"wrap",justifyContent:"center"}}>
                      {[["6","Agents"],["4","Plan Sections"],["∞","Products"],["100%","Personalised"]].map(([n,l])=>(
                        <div key={l} style={{padding:"8px 16px",borderRadius:10,background:"#0d0d10",border:"1px solid #18181c",textAlign:"center"}}>
                          <div style={{fontSize:18,fontWeight:700,color:"#e8002d",fontFamily:"'JetBrains Mono',monospace",lineHeight:1}}>{n}</div>
                          <div style={{fontSize:8,color:"#333",fontFamily:"'JetBrains Mono',monospace",textTransform:"uppercase",letterSpacing:"0.08em",marginTop:3}}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <button onClick={()=>setShowOnboarding(true)}
                      style={{marginBottom:30,padding:"12px 30px",borderRadius:10,border:"1px solid rgba(232,0,45,0.4)",background:"rgba(232,0,45,0.09)",color:"#e8002d",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all 0.25s",fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.06em",animation:"borderGlow 3s infinite"}}
                      onMouseEnter={e=>{e.currentTarget.style.background="rgba(232,0,45,0.16)";e.currentTarget.style.transform="translateY(-2px)";e.currentTarget.style.boxShadow="0 8px 24px rgba(232,0,45,0.15)"}}
                      onMouseLeave={e=>{e.currentTarget.style.background="rgba(232,0,45,0.09)";e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow="none"}}>
                      SETUP YOUR PROFILE →
                    </button>
                  </>
                )}

                <div style={{width:"100%",maxWidth:640}}>
                  <p style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#1e1e1e",textTransform:"uppercase",letterSpacing:"0.14em",marginBottom:14}}>Quick questions</p>
                  <SuggestionChips onSelect={submit} disabled={loading} />
                </div>
              </div>
            )}

            {/* Messages */}
            {hasHistory && (
              <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:16,paddingBottom:12,paddingRight:2}}>
                {history.map((msg,i)=><ChatMessage key={i} message={msg} onSpeak={voiceOut?speak:null} />)}
                {loading && (
                  <div style={{display:"flex",alignItems:"center",gap:9}}>
                    <div style={{width:30,height:30,borderRadius:8,background:"linear-gradient(135deg,#e8002d,#c0001e)",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:"0 0 12px rgba(232,0,45,0.25)"}}>
                      <span style={{fontFamily:"'Playfair Display',Georgia,serif",fontWeight:700,fontSize:12,color:"#fff"}}>ET</span>
                    </div>
                    <div style={{padding:"11px 15px",borderRadius:"3px 12px 12px 12px",background:"#0d0d10",border:"1px solid #18181c",display:"flex",gap:5,alignItems:"center"}}>
                      {[0,1,2].map(j=><div key={j} style={{width:6,height:6,borderRadius:"50%",background:"#2a2a2a",animation:`dotPulse 1s ${j*0.15}s infinite ease-in-out`}} />)}
                    </div>
                  </div>
                )}
                <div ref={chatEnd} />
              </div>
            )}

            {/* ── INPUT ──────────────────────────────────────── */}
            <div style={{marginTop:"auto",paddingTop:14,background:"transparent",position:"sticky",bottom:0}}>
              {error && (
                <div className="fadeUp" style={{marginBottom:10,padding:"12px 14px",borderRadius:10,background:"rgba(239,68,68,0.04)",border:"1px solid rgba(239,68,68,0.14)"}}>
                  <div style={{fontSize:11,fontWeight:600,color:"#ef4444",marginBottom:3}}>Pipeline Error</div>
                  <div style={{fontSize:11,color:"#777",lineHeight:1.65,marginBottom:(error.includes("model")||error.includes("LLM"))?6:0}}>{error}</div>
                  {(error.includes("model")||error.includes("LLM")||error.includes("OpenRouter")) && (
                    <div style={{fontSize:10,color:"#555",lineHeight:1.6,padding:"7px 10px",borderRadius:7,background:"rgba(255,255,255,0.015)",border:"1px solid #1a1a1a"}}>
                      Fix: Add <code style={{background:"#1a0505",padding:"1px 4px",borderRadius:3,color:"#f87171"}}>OPENROUTER_API_KEY=sk-or-...</code> to <code style={{background:"#1a0505",padding:"1px 4px",borderRadius:3,color:"#f87171"}}>backend/.env</code>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{display:"flex",gap:8,alignItems:"flex-end",padding:"8px 10px 8px 14px",borderRadius:14,background:"#0d0d10",border:`1px solid ${listening?"rgba(232,0,45,0.5)":"#1a1a1e"}`,transition:"border-color 0.2s, box-shadow 0.2s"}}
                onFocusCapture={e=>{if(!listening){e.currentTarget.style.borderColor="rgba(232,0,45,0.35)";e.currentTarget.style.boxShadow="0 0 0 4px rgba(232,0,45,0.05)";}}}
                onBlurCapture={e=>{if(!listening){e.currentTarget.style.borderColor="#1a1a1e";e.currentTarget.style.boxShadow="none";}}}
              >
                {voiceIn && (
                  <button onClick={toggleVoice}
                    style={{width:34,height:34,borderRadius:8,border:`1px solid ${listening?"rgba(232,0,45,0.55)":"#252528"}`,background:listening?"rgba(232,0,45,0.1)":"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",animation:listening?"voiceRing 1.5s infinite":"none"}}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={listening?"#e8002d":"#555"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                      <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                    </svg>
                  </button>
                )}

                <textarea ref={inputRef} value={input} onChange={e=>setInput(e.target.value)}
                  onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();submit();}}}
                  placeholder={listening?"Listening...":profile?.onboarded?`Ask about investing, tax, insurance — tailored to your ${profile.experience_level} profile`:"Ask about investing, saving, tax planning, or any financial goal"}
                  disabled={loading} rows={1}
                  style={{flex:1,background:"transparent",border:"none",outline:"none",color:"#e2ddd8",fontSize:14,resize:"none",padding:"6px 4px",maxHeight:120,lineHeight:1.65}}
                  onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,120)+"px";}} />

                <button onClick={()=>submit()} disabled={!input.trim()||loading}
                  style={{width:38,height:38,borderRadius:10,border:"none",background:input.trim()&&!loading?"linear-gradient(135deg,#e8002d,#c0001e)":"#141418",color:input.trim()&&!loading?"#fff":"#2a2a2e",cursor:input.trim()&&!loading?"pointer":"not-allowed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,transition:"all 0.2s",boxShadow:input.trim()&&!loading?"0 4px 12px rgba(232,0,45,0.3)":"none"}}
                  onMouseEnter={e=>{if(input.trim()&&!loading){e.currentTarget.style.transform="scale(1.05)";}}}
                  onMouseLeave={e=>{e.currentTarget.style.transform="scale(1)";}}>
                  {loading
                    ?<div style={{width:14,height:14,border:"2px solid rgba(255,255,255,0.15)",borderTopColor:"#fff",borderRadius:"50%",animation:"spin 0.7s linear infinite"}} />
                    :<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
                  }
                </button>
              </div>

              <div style={{textAlign:"center",fontSize:8,color:"#1a1a1a",marginTop:6,fontFamily:"'JetBrains Mono',monospace",letterSpacing:"0.06em"}}>
                ENTER TO SEND · SHIFT+ENTER NEWLINE{voiceIn?" · MIC FOR VOICE":""}
              </div>
            </div>
          </div>

          {/* ── SIDE PANEL ────────────────────────────────────── */}
          <div style={{width:showPanel?"min(440px,40%)":0,flexShrink:0,overflow:"hidden",transition:"width 0.45s cubic-bezier(0.4,0,0.2,1),opacity 0.35s ease",opacity:showPanel?1:0}}>
            <div className={showPanel?"panel-animate":""} style={{display:"flex",flexDirection:"column",gap:10,maxHeight:"calc(100vh - 112px)",overflowY:"auto",paddingRight:2}}>

              {/* Agent pipeline card */}
              <div className="card fadeUp" style={{borderColor:loading?"rgba(232,0,45,0.15)":"#18181c",transition:"border-color 0.3s",background:loading?"rgba(13,13,16,0.95)":"#0d0d10"}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
                  <div style={{width:7,height:7,borderRadius:"50%",background:loading?"#e8002d":"#22c55e",animation:loading?"breathe 0.9s infinite":"none",boxShadow:loading?"0 0 8px rgba(232,0,45,0.5)":"0 0 6px rgba(34,197,94,0.4)"}} />
                  <span style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#333",textTransform:"uppercase",letterSpacing:"0.12em"}}>
                    {loading?`Pipeline running`:`Complete · ${response?.meta?.agentsRun||6} agents`}
                  </span>
                  {response?.meta?.isPersonalized&&<span style={{marginLeft:"auto",fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#22c55e",background:"rgba(34,197,94,0.06)",border:"1px solid rgba(34,197,94,0.16)",padding:"2px 7px",borderRadius:4}}>PERSONALISED</span>}
                </div>
                <AgentPipeline activeAgent={activeAgent} />
              </div>

              {loading && <LoadingState activeAgent={activeAgent} />}

              {response && (<>
                <ProfileCard   profile={response.steps?.profile} />
                <IntentCard    intent={response.steps?.intent} />
                {(response.nextBestAction||response.riskInsight) && <NextActionCard nextAction={response.nextBestAction} riskInsight={response.riskInsight} />}
                <StructuredResponse structured={response.structured} />
                <RecommendationsCard recommendations={response.steps?.recommendations} />
                <CrossSellCard   crossSell={response.steps?.crossSell}     userProfile={response.steps?.profile} />
                <MarketplaceCard marketplace={response.steps?.marketplace} userProfile={response.steps?.profile} />
                {(!response.structured || typeof response.structured === "string") && <ExplanationCard explanation={response.final} />}
                <div style={{padding:"7px 10px",borderRadius:8,background:"#080808",border:"1px solid #0e0e10",display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#1e1e1e"}}>openrouter · 6 agents · {response.meta?.supabaseConnected?"supabase":"local"}</span>
                  <span style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:"#1e1e1e"}}>{response.meta?.timestamp?new Date(response.meta.timestamp).toLocaleTimeString("en-IN"):""}</span>
                </div>
              </>)}

              <div ref={panelEnd} />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
