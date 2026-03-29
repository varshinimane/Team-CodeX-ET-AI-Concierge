import { useState, useEffect, useRef, useCallback } from 'react';
import { sendOnboarding } from '../utils/api.js';

const STEPS = ['Income', 'Experience', 'Goals', 'Risk', 'Horizon'];

const QUICK_REPLIES = {
  income:       ['Under ₹5L', '₹5–15L', '₹15–50L', 'Above ₹50L'],
  experience:   ['Just starting out', 'Know the basics', 'Actively invest'],
  goals:        ['Grow wealth', 'Save for home/goal', 'Learn finance', 'Retire early', 'Tax saving'],
  risk:         ['Conservative', 'Moderate', 'Aggressive'],
  time_horizon: ['Less than 1 year', '1 to 5 years', '5+ years'],
};

const STEP_ICONS = ['₹', '📊', '🎯', '⚡', '📅'];

function speak(text) {
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const clean = text.replace(/[*_`#]/g, '').replace(/\n+/g, '. ').slice(0, 300);
  const utt = new SpeechSynthesisUtterance(clean);
  utt.lang = 'en-IN'; utt.rate = 0.92;
  window.speechSynthesis.speak(utt);
}

// Mini sparkline header decoration
function MiniChart() {
  return (
    <svg width="80" height="28" viewBox="0 0 80 28" fill="none" style={{ opacity:0.35 }}>
      <polyline points="2,22 12,16 22,19 32,10 42,14 52,7 62,11 72,4 78,8"
        stroke="#e8002d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray:200, animation:'chartDraw 2s ease forwards' }} />
      <polyline points="2,26 12,24 22,25 32,22 42,23 52,20 62,21 72,18 78,19"
        stroke="#22c55e" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.5"
        style={{ strokeDasharray:200, animation:'chartDraw 2.5s 0.2s ease forwards' }} />
      <style>{`@keyframes chartDraw{from{stroke-dashoffset:200}to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep]           = useState(0);
  const [answers, setAnswers]     = useState({});
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [loading, setLoading]     = useState(false);
  const [progress, setProgress]   = useState(0);
  const [currentQId, setCurrentQId] = useState('income');
  const [done, setDone]           = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);

  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const recRef    = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = 'en-IN';
    r.onresult = (e) => { setInput(e.results[0][0].transcript); setListening(false); };
    r.onerror = r.onend = () => setListening(false);
    recRef.current = r;
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);
  useEffect(() => { start(); }, []);

  async function start() {
    setLoading(true);
    try {
      const r = await sendOnboarding(0, {}, '');
      setStep(r.step); setCurrentQId(r.questionId || 'income');
      addAssistant(r.message);
    } catch {
      addAssistant("Welcome to ET AI Concierge. I'm your personal Economic Times financial advisor.\n\nQuestion 1 of 5 — What is your approximate annual income?");
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }

  function addAssistant(text) {
    setMessages(prev => [...prev, { role:'assistant', content:text, id:Date.now() }]);
    if (voiceEnabled) speak(text);
  }

  async function handleSend(text) {
    const msg = (text || input).trim();
    if (!msg || loading || done) return;
    setInput('');
    setMessages(prev => [...prev, { role:'user', content:msg, id:Date.now() }]);
    setLoading(true);
    try {
      const r = await sendOnboarding(step, answers, msg);
      setStep(r.step);
      setAnswers(r.answers || answers);
      setProgress(r.progress || 0);
      if (r.questionId) setCurrentQId(r.questionId);
      setTimeout(() => {
        addAssistant(r.message);
        setLoading(false);
        if (r.complete) {
          setDone(true);
          setTimeout(() => onComplete(r.profile), 2000);
        } else {
          setTimeout(() => inputRef.current?.focus(), 100);
        }
      }, 400);
    } catch {
      addAssistant('There was an issue connecting to the server. Please ensure the backend is running on port 5000 and OPENROUTER_API_KEY is set in backend/.env');
      setLoading(false);
    }
  }

  const toggleVoice = () => {
    if (!recRef.current) return;
    if (listening) { recRef.current.stop(); setListening(false); }
    else { recRef.current.start(); setListening(true); }
  };

  const doneStep = Math.floor((progress / 100) * STEPS.length);
  const replies = QUICK_REPLIES[currentQId] || [];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px', background:'#060608', position:'relative', overflow:'hidden' }}>

      {/* Background grid */}
      <div style={{ position:'fixed', inset:0, backgroundImage:'linear-gradient(rgba(232,0,45,0.012) 1px,transparent 1px),linear-gradient(90deg,rgba(232,0,45,0.012) 1px,transparent 1px)', backgroundSize:'44px 44px', maskImage:'radial-gradient(ellipse 80% 80% at 50% 40%,black 5%,transparent 80%)', pointerEvents:'none' }} />
      {/* Top glow */}
      <div style={{ position:'fixed', width:'600px', height:'400px', borderRadius:'50%', background:'radial-gradient(circle,rgba(232,0,45,0.07) 0%,transparent 65%)', top:'-200px', left:'50%', transform:'translateX(-50%)', pointerEvents:'none', animation:'orbFloat 10s ease-in-out infinite' }} />

      {/* Header */}
      <div style={{ textAlign:'center', marginBottom:28, position:'relative', animation:'fadeUp 0.5s ease' }}>
        <div style={{ display:'inline-flex', alignItems:'center', gap:14, marginBottom:14 }}>
          <div style={{ width:46, height:46, borderRadius:12, background:'linear-gradient(135deg,#e8002d,#c0001e)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 0 24px rgba(232,0,45,0.3)' }}>
            <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontWeight:700, fontSize:20, color:'#fff' }}>ET</span>
          </div>
          <div style={{ textAlign:'left' }}>
            <div style={{ fontFamily:"'Playfair Display',Georgia,serif", fontSize:18, fontWeight:700, color:'#f0ede8', letterSpacing:'-0.01em' }}>AI Concierge</div>
            <div style={{ fontSize:9, color:'#333', letterSpacing:'0.14em', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>Economic Times · Profile Setup</div>
          </div>
          <MiniChart />
        </div>
        <p style={{ color:'#333', fontSize:12, maxWidth:320, margin:'0 auto', lineHeight:1.75, fontFamily:"'DM Sans',system-ui,sans-serif" }}>
          Answer 5 questions to unlock personalised financial advice with real ₹ numbers
        </p>
      </div>

      {/* Progress stepper */}
      {progress > 0 && (
        <div style={{ width:'100%', maxWidth:480, marginBottom:20, display:'flex', alignItems:'center', gap:0, animation:'fadeUp 0.4s ease' }}>
          {STEPS.map((label, i) => (
            <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', position:'relative' }}>
              {i > 0 && <div style={{ position:'absolute', left:0, top:12, width:'50%', height:1, background:i<=doneStep?'#e8002d':'#1a1a1e', transition:'background 0.4s' }} />}
              {i < STEPS.length-1 && <div style={{ position:'absolute', right:0, top:12, width:'50%', height:1, background:i<doneStep?'#e8002d':'#1a1a1e', transition:'background 0.4s' }} />}
              <div style={{
                width:24, height:24, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:i < doneStep ? 10 : 11, fontWeight:700, zIndex:1, transition:'all 0.4s',
                background: i<doneStep?'#e8002d':i===doneStep?'rgba(232,0,45,0.12)':'#0d0d10',
                border: i<doneStep?'1px solid #e8002d':i===doneStep?'1px solid rgba(232,0,45,0.5)':'1px solid #1e1e22',
                color: i<doneStep?'#fff':i===doneStep?'#e8002d':'#2a2a2a',
                boxShadow: i===doneStep?'0 0 10px rgba(232,0,45,0.2)':'none',
              }}>
                {i < doneStep ? '✓' : STEP_ICONS[i]}
              </div>
              <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", textTransform:'uppercase', color:i<=doneStep?'#555':'#1e1e22', marginTop:5, letterSpacing:'0.04em' }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chat panel */}
      <div style={{ width:'100%', maxWidth:480, background:'#0c0c0f', border:'1px solid #18181c', borderRadius:18, overflow:'hidden', boxShadow:'0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(232,0,45,0.05)' }}>

        {/* Messages */}
        <div style={{ padding:'20px 18px 0', maxHeight:360, overflowY:'auto', display:'flex', flexDirection:'column', gap:10 }}>
          {messages.map((msg) => (
            <div key={msg.id} style={{ display:'flex', justifyContent:msg.role==='user'?'flex-end':'flex-start', animation:'fadeSlide 0.25s ease' }}>
              {msg.role === 'assistant' && (
                <div style={{ maxWidth:'92%' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                    <div style={{ width:18, height:18, borderRadius:5, background:'linear-gradient(135deg,#e8002d,#c0001e)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 8px rgba(232,0,45,0.3)' }}>
                      <span style={{ fontSize:7, fontFamily:"'Playfair Display',Georgia,serif", fontWeight:700, color:'#fff' }}>ET</span>
                    </div>
                    <span style={{ fontSize:9, color:'#2a2a2a', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.08em', textTransform:'uppercase' }}>Concierge</span>
                  </div>
                  <div style={{ padding:'13px 15px', borderRadius:'3px 13px 13px 13px', background:'#141418', border:'1px solid #1e1e22', whiteSpace:'pre-line', lineHeight:1.85, fontSize:13, color:'#b8b4ae' }}>
                    {msg.content}
                  </div>
                </div>
              )}
              {msg.role === 'user' && (
                <div style={{ maxWidth:'78%', padding:'11px 15px', borderRadius:'13px 13px 3px 13px', background:'linear-gradient(135deg,#e8002d,#c0001e)', fontSize:13, color:'#fff', lineHeight:1.65, boxShadow:'0 4px 14px rgba(232,0,45,0.2)' }}>
                  {msg.content}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 0' }}>
              <div style={{ width:18, height:18, borderRadius:5, background:'linear-gradient(135deg,#e8002d,#c0001e)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <span style={{ fontSize:7, fontFamily:"'Playfair Display',Georgia,serif", fontWeight:700, color:'#fff' }}>ET</span>
              </div>
              <div style={{ display:'flex', gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#2a2a2a', animation:`dotBounce 1s ${i*0.15}s infinite` }} />)}
              </div>
            </div>
          )}

          {done && (
            <div style={{ padding:'12px 0', display:'flex', alignItems:'center', gap:8 }}>
              <div style={{ width:7, height:7, borderRadius:'50%', background:'#22c55e', boxShadow:'0 0 8px rgba(34,197,94,0.5)', animation:'breathe 1s infinite' }} />
              <span style={{ fontSize:11, color:'#22c55e', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.04em' }}>Profile complete — loading your dashboard</span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Quick replies */}
        {!done && !loading && replies.length > 0 && (
          <div style={{ padding:'12px 16px 0', display:'flex', flexWrap:'wrap', gap:6 }}>
            {replies.map((r, i) => (
              <button key={i} onClick={() => handleSend(r)}
                style={{
                  padding:'6px 13px', borderRadius:22, background:'transparent',
                  border:'1px solid #1e1e22', color:'#444', fontSize:11, cursor:'pointer',
                  transition:'all 0.15s', fontFamily:"'DM Sans',system-ui,sans-serif",
                  animation:`fadeUp 0.3s ${i*0.05}s both`,
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor='#e8002d'; e.currentTarget.style.color='#e8002d'; e.currentTarget.style.background='rgba(232,0,45,0.06)'; e.currentTarget.style.transform='translateY(-1px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#1e1e22'; e.currentTarget.style.color='#444'; e.currentTarget.style.background='transparent'; e.currentTarget.style.transform='none'; }}
              >{r}</button>
            ))}
          </div>
        )}

        {/* Input bar */}
        {!done && (
          <div style={{ padding:'12px 14px', borderTop:'1px solid #14141a', display:'flex', gap:8, alignItems:'center', marginTop:12 }}>
            {recRef.current && (
              <button onClick={toggleVoice} title={listening?'Stop':'Voice input'}
                style={{ width:32, height:32, borderRadius:8, border:`1px solid ${listening?'rgba(232,0,45,0.5)':'#1e1e22'}`, background:listening?'rgba(232,0,45,0.1)':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', animation:listening?'pulseBorder 1.5s infinite':'none' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={listening?'#e8002d':'#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                  <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                </svg>
              </button>
            )}
            <button onClick={() => setVoiceEnabled(v => !v)} title={voiceEnabled?'Mute AI':'Enable AI voice'}
              style={{ width:32, height:32, borderRadius:8, border:`1px solid ${voiceEnabled?'rgba(34,197,94,0.4)':'#1e1e22'}`, background:voiceEnabled?'rgba(34,197,94,0.08)':'transparent', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={voiceEnabled?'#22c55e':'#555'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                {voiceEnabled
                  ? <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></>
                  : <><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></>
                }
              </svg>
            </button>
            <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key==='Enter' && handleSend()}
              placeholder={listening?'Listening...':'Type or pick an option above'}
              disabled={loading || done}
              style={{ flex:1, background:'transparent', border:'none', outline:'none', color:'#e0dcd6', fontSize:13, fontFamily:"'DM Sans',system-ui,sans-serif" }}
            />
            <button onClick={() => handleSend()} disabled={!input.trim() || loading}
              style={{ width:32, height:32, borderRadius:9, border:'none', background:input.trim()&&!loading?'linear-gradient(135deg,#e8002d,#c0001e)':'#141418', color:input.trim()?'#fff':'#252525', cursor:input.trim()?'pointer':'not-allowed', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, transition:'all 0.2s', boxShadow:input.trim()&&!loading?'0 4px 12px rgba(232,0,45,0.25)':'none' }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2L15 22 11 13 2 9l20-7z"/></svg>
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fadeSlide { from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)} }
        @keyframes dotBounce { 0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)} }
        @keyframes breathe { 0%,100%{opacity:1}50%{opacity:0.3} }
        @keyframes pulseBorder { 0%,100%{box-shadow:0 0 0 0 rgba(232,0,45,0.3)}50%{box-shadow:0 0 0 4px rgba(232,0,45,0)} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)} }
        @keyframes orbFloat { 0%,100%{transform:translateX(-50%) translateY(0)}50%{transform:translateX(-50%) translateY(-18px)} }
        @keyframes spin { to{transform:rotate(360deg)} }
      `}</style>
    </div>
  );
}
