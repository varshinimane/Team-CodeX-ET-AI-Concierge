const SECTIONS = [
  { key:'strategy',        label:'Strategy',         color:'#60a5fa', icon:'◈', desc:'Your personalised allocation' },
  { key:'immediateAction', label:'Immediate Action', color:'#e8002d', icon:'▶', desc:'What to do today' },
  { key:'investmentPlan',  label:'Investment Plan',  color:'#22c55e', icon:'📅', desc:'Month-by-month roadmap' },
  { key:'whatToAvoid',     label:'What to Avoid',    color:'#f59e0b', icon:'⚠', desc:'Products to skip' },
];

function hexRgb(hex) {
  if (!hex || hex[0] !== '#') return '34,197,94';
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
}

export default function StructuredResponse({ structured }) {
  if (!structured || typeof structured === 'string') return null;
  const hasContent = SECTIONS.some(s => structured[s.key]);
  if (!hasContent) return null;

  return (
    <div className="card fadeUp" style={{ borderColor:'rgba(96,165,250,0.12)', background:'linear-gradient(160deg,rgba(96,165,250,0.02),#0d0d10)' }}>
      <div className="label" style={{ color:'#60a5fa', borderColor:'rgba(96,165,250,0.2)', background:'rgba(96,165,250,0.06)' }}>
        ◈ Personalised Financial Plan
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
        {SECTIONS.map((section, idx) => {
          const content = structured[section.key];
          if (!content) return null;
          const r = hexRgb(section.color);

          return (
            <div key={section.key}
              style={{
                padding:'12px 13px', borderRadius:10,
                background:`rgba(${r},0.04)`,
                border:`1px solid rgba(${r},0.12)`,
                animation:`fadeUp 0.35s ${idx * 0.08}s both`,
                transition:'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor=`rgba(${r},0.25)`}
              onMouseLeave={e => e.currentTarget.style.borderColor=`rgba(${r},0.12)`}
            >
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:7 }}>
                <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                  <div style={{
                    width:20, height:20, borderRadius:5,
                    background:`rgba(${r},0.12)`, border:`1px solid rgba(${r},0.2)`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontSize:10, flexShrink:0,
                  }}>
                    <span style={{ color:section.color }}>{section.icon}</span>
                  </div>
                  <div>
                    <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:700, color:section.color, textTransform:'uppercase', letterSpacing:'0.09em' }}>{section.label}</span>
                    <div style={{ fontSize:8, color:'#2a2a2a', fontFamily:"'JetBrains Mono',monospace", marginTop:1 }}>{section.desc}</div>
                  </div>
                </div>
              </div>
              <p style={{ fontSize:12.5, color:'#b8b4ae', lineHeight:1.8 }}>{content}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
