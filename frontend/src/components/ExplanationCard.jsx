export default function ExplanationCard({ explanation }) {
  if (!explanation) return null;
  return (
    <div className="card fadeUp" style={{ borderColor:'rgba(232,0,45,0.12)', background:'linear-gradient(160deg,rgba(232,0,45,0.025),#0d0d10)' }}>
      <div className="label" style={{ color:'#e8002d', borderColor:'rgba(232,0,45,0.2)', background:'rgba(232,0,45,0.05)' }}>Your Advisor Says</div>
      <div style={{ display:'flex', gap:10, alignItems:'flex-start' }}>
        <div style={{ width:24, height:24, borderRadius:6, background:'#e8002d', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:2 }}>
          <span style={{ fontFamily:'Georgia,serif', fontWeight:700, fontSize:9, color:'#fff' }}>ET</span>
        </div>
        <p style={{ fontSize:13, color:'#c8c4be', lineHeight:1.85, fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic' }}>
          {explanation}
        </p>
      </div>
    </div>
  );
}
