export default function NextActionCard({ nextAction, riskInsight }) {
  if (!nextAction && !riskInsight) return null;
  return (
    <div className="card fadeUp" style={{ borderColor:'rgba(232,0,45,0.12)', background:'linear-gradient(135deg,rgba(232,0,45,0.03),#0d0d10)' }}>
      <div className="label" style={{ color:'#e8002d', borderColor:'rgba(232,0,45,0.2)', background:'rgba(232,0,45,0.05)' }}>Action & Insight</div>
      {nextAction && (
        <div style={{ marginBottom: riskInsight ? 10 : 0, padding:'10px 12px', borderRadius:9, background:'rgba(232,0,45,0.05)', border:'1px solid rgba(232,0,45,0.12)' }}>
          <div style={{ fontSize:8, fontFamily:'monospace', color:'#e8002d', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:4 }}>Next Best Action</div>
          <p style={{ fontSize:12, color:'#c8c4be', lineHeight:1.65 }}>{nextAction}</p>
        </div>
      )}
      {riskInsight && (
        <div style={{ padding:'10px 12px', borderRadius:9, background:'rgba(245,158,11,0.04)', border:'1px solid rgba(245,158,11,0.12)' }}>
          <div style={{ fontSize:8, fontFamily:'monospace', color:'#f59e0b', textTransform:'uppercase', letterSpacing:'0.09em', marginBottom:4 }}>Risk Insight</div>
          <p style={{ fontSize:12, color:'#b8b4ae', lineHeight:1.65 }}>{riskInsight}</p>
        </div>
      )}
    </div>
  );
}
