const INTENT = {
  INVESTING:      { color:'#22c55e', label:'Investing' },
  SAVING:         { color:'#60a5fa', label:'Saving' },
  LEARNING:       { color:'#a78bfa', label:'Learning' },
  TAX_PLANNING:   { color:'#f59e0b', label:'Tax Planning' },
  RETIREMENT:     { color:'#14b8a6', label:'Retirement' },
  TRADING:        { color:'#ef4444', label:'Trading' },
  MARKET_NEWS:    { color:'#0ea5e9', label:'Market News' },
  BUDGET_PLANNING:{ color:'#8b5cf6', label:'Budgeting' },
  CRYPTO:         { color:'#f97316', label:'Crypto' },
  INSURANCE:      { color:'#6366f1', label:'Insurance' },
};

function rgb(hex) {
  if (!hex||hex[0]!=='#') return '34,197,94';
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
}

export default function IntentCard({ intent }) {
  if (!intent) return null;
  const m = INTENT[intent.primary_intent] || { color:'#e8002d', label: intent.primary_intent };
  const pct = { high:90, medium:65, low:40 }[intent.confidence] || 65;

  return (
    <div className="card fadeUp">
      <div className="label" style={{ color:'#22c55e', borderColor:'rgba(34,197,94,0.2)', background:'rgba(34,197,94,0.05)' }}>Intent</div>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:10 }}>
        <div>
          <div style={{ fontSize:18, fontWeight:700, color:m.color, fontFamily:'Georgia,serif', marginBottom:2 }}>{m.label}</div>
          <div style={{ fontSize:9, fontFamily:'monospace', color:'#333', letterSpacing:'0.06em' }}>
            {intent.confidence} confidence · {intent.user_stage}
          </div>
        </div>
        {/* Confidence bar */}
        <div style={{ marginLeft:'auto', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3 }}>
          <span style={{ fontSize:9, fontFamily:'monospace', color:m.color }}>{pct}%</span>
          <div style={{ width:60, height:3, borderRadius:2, background:'rgba(255,255,255,0.05)' }}>
            <div style={{ width:`${pct}%`, height:'100%', borderRadius:2, background:m.color, transition:'width 0.6s ease' }} />
          </div>
        </div>
      </div>
      {intent.content_focus && (
        <p style={{ fontSize:11, color:'#555', lineHeight:1.55, padding:'7px 10px', borderRadius:7, background:`rgba(${rgb(m.color)},0.04)`, borderLeft:`2px solid rgba(${rgb(m.color)},0.3)`, marginBottom:intent.sub_intents?.length?8:0 }}>
          {intent.content_focus}
        </p>
      )}
      {intent.sub_intents?.length > 0 && (
        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
          {intent.sub_intents.map((s,i) => <span key={i} className="chip">{s}</span>)}
        </div>
      )}
    </div>
  );
}
