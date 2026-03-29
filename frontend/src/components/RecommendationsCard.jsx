export default function RecommendationsCard({ recommendations }) {
  if (!recommendations?.recommendations?.length) return null;
  const items = recommendations.recommendations.slice(0,4);
  return (
    <div className="card fadeUp">
      <div className="label" style={{ color:'#60a5fa', borderColor:'rgba(96,165,250,0.2)', background:'rgba(96,165,250,0.05)' }}>Recommended for You</div>
      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {items.map((rec, i) => (
          <div key={rec.id||i} style={{ padding:'9px 10px', borderRadius:9, background:'rgba(255,255,255,0.015)', border:'1px solid rgba(255,255,255,0.04)', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(96,165,250,0.05)'; e.currentTarget.style.borderColor='rgba(96,165,250,0.15)'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.015)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.04)'; }}
          >
            <p style={{ fontSize:12, fontWeight:500, color:'#c0bbb5', lineHeight:1.45, marginBottom:3 }}>{rec.title}</p>
            <p style={{ fontSize:10, color:'#444', lineHeight:1.4, marginBottom:5 }}>{rec.why_relevant}</p>
            <div style={{ display:'flex', alignItems:'center', gap:5 }}>
              <span style={{ fontSize:8, fontFamily:'monospace', background:'rgba(96,165,250,0.08)', color:'#60a5fa', padding:'1px 5px', borderRadius:3 }}>{rec.tag}</span>
              <span style={{ fontSize:8, color:'#2e2e2e', fontFamily:'monospace' }}>{rec.readTime}</span>
              {rec.relevance_score && <span style={{ fontSize:8, color:'#22c55e', fontFamily:'monospace', marginLeft:'auto' }}>{Math.round(rec.relevance_score*100)}% match</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
