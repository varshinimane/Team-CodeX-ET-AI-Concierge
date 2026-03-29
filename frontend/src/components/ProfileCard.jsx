function rgb(hex) {
  if (!hex||hex[0]!=='#') return '167,139,250';
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
}

const RISK_C = { low:'#22c55e', medium:'#f59e0b', high:'#ef4444' };
const EXP_C  = { beginner:'#60a5fa', intermediate:'#f59e0b', advanced:'#a78bfa' };

export default function ProfileCard({ profile }) {
  if (!profile) return null;
  const rc = RISK_C[profile.risk_appetite]||'#f59e0b';
  const ec = EXP_C[profile.experience_level]||'#60a5fa';

  return (
    <div className="card fadeUp">
      <div className="label" style={{ color:'#a78bfa', borderColor:'rgba(167,139,250,0.2)', background:'rgba(167,139,250,0.05)' }}>Profile</div>
      {profile.summary && <p style={{ fontSize:11, color:'#555', lineHeight:1.65, marginBottom:12, fontStyle:'italic' }}>{profile.summary}</p>}

      <div style={{ display:'flex', flexWrap:'wrap', gap:5, marginBottom:12 }}>
        {[
          [profile.experience_level, ec],
          [`${profile.risk_appetite} risk`, rc],
          profile.income_display && [profile.income_display, '#22c55e'],
          profile.time_horizon_display && [profile.time_horizon_display, '#888'],
        ].filter(Boolean).map(([label, color], i) => (
          <span key={i} className="tag" style={{ background:`rgba(${rgb(color)},0.08)`, color, border:`1px solid rgba(${rgb(color)},0.2)` }}>{label}</span>
        ))}
      </div>

      {profile.goals && (
        <div style={{ marginBottom:10 }}>
          <div style={{ fontSize:8, fontFamily:'monospace', color:'#333', textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Goals</div>
          <p style={{ fontSize:12, color:'#888', lineHeight:1.55 }}>{profile.goals}</p>
        </div>
      )}

      <div style={{ padding:'8px 10px', borderRadius:8, background:`rgba(${rgb(rc)},0.04)`, borderLeft:`2px solid rgba(${rgb(rc)},0.35)` }}>
        <div style={{ fontSize:8, fontFamily:'monospace', color:rc, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Risk Insight</div>
        <p style={{ fontSize:11, color:'#666', lineHeight:1.6 }}>
          {profile.risk_appetite === 'low' && 'Capital preservation first — FDs, sovereign bonds, and debt funds are your best friends.'}
          {profile.risk_appetite === 'medium' && 'Balanced approach — hybrid funds and large-cap equities suit your risk-return expectations well.'}
          {profile.risk_appetite === 'high' && 'Growth-oriented — small/mid-cap and sectoral funds can maximise your long-term wealth creation.'}
        </p>
      </div>
    </div>
  );
}
