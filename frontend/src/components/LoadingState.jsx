const STATES = {
  profile:     { text:'Analysing your financial profile', sub:'Extracting goals, experience & risk appetite', pct:16, color:'#a78bfa' },
  intent:      { text:'Detecting your intent',            sub:'Understanding what you need right now',         pct:33, color:'#22c55e' },
  recommend:   { text:'Curating personalised content',    sub:'Matching ET articles to your profile',          pct:50, color:'#60a5fa' },
  crosssell:   { text:'Finding ET products for you',      sub:'Matching ecosystem products to your goals',     pct:66, color:'#f59e0b' },
  marketplace: { text:'Scanning financial services',      sub:'SIPs, insurance, credit cards and more',        pct:83, color:'#22c55e' },
  explain:     { text:'Crafting your personalised plan',  sub:'Synthesising all agents into one clear answer', pct:95, color:'#e8002d' },
};

function hexRgb(hex) {
  if (!hex) return '232,0,45';
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
}

export default function LoadingState({ activeAgent }) {
  const s = STATES[activeAgent] || { text:'Pipeline running', sub:'Multiple agents working in sequence', pct:10, color:'#e8002d' };
  const r = hexRgb(s.color);

  return (
    <div className="card fadeUp" style={{ borderColor:`rgba(${r},0.12)`, background:`rgba(${r},0.02)` }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
        <div style={{
          width:36, height:36, borderRadius:10,
          background:`rgba(${r},0.08)`, border:`1px solid rgba(${r},0.18)`,
          display:'flex', alignItems:'center', justifyContent:'center',
          flexShrink:0,
        }}>
          <div style={{
            width:16, height:16, border:`2px solid rgba(${r},0.2)`,
            borderTopColor:s.color, borderRadius:'50%',
            animation:'spin 0.8s linear infinite',
          }} />
        </div>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:12, fontWeight:500, color:'#c8c4be', marginBottom:3 }}>{s.text}</p>
          <p style={{ fontSize:10, color:'#444' }}>{s.sub}</p>
        </div>
        <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:s.color }}>{s.pct}%</span>
      </div>

      {/* Progress bar */}
      <div style={{ height:2, borderRadius:2, background:'rgba(255,255,255,0.04)', overflow:'hidden' }}>
        <div style={{
          height:'100%', borderRadius:2,
          background:`linear-gradient(90deg,${s.color},rgba(${r},0.5))`,
          width:`${s.pct}%`,
          transition:'width 0.6s ease',
          boxShadow:`0 0 8px rgba(${r},0.5)`,
        }} />
      </div>
    </div>
  );
}
