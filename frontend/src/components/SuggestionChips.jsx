const SUGGESTIONS = [
  { text:'How do I start a SIP with ₹1,000 per month?', icon:'📈' },
  { text:'Best tax-saving options under 80C for ₹12L income', icon:'🧾' },
  { text:'Should I buy term insurance at 28?', icon:'🛡️' },
  { text:'Nifty 50 index fund vs actively managed fund', icon:'📊' },
  { text:'How to build a 6-month emergency fund?', icon:'🏦' },
  { text:'NPS vs PPF — which is better for retirement?', icon:'🔐' },
];

export default function SuggestionChips({ onSelect, disabled }) {
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:8, justifyContent:'center' }}>
      {SUGGESTIONS.map((s, i) => (
        <button key={i} disabled={disabled} onClick={() => onSelect(s.text)}
          style={{
            padding:'8px 15px', borderRadius:22,
            background:'transparent', border:'1px solid #18181c',
            color:'#444', fontSize:12, cursor:disabled?'not-allowed':'pointer',
            transition:'all 0.2s cubic-bezier(0.4,0,0.2,1)',
            fontFamily:"'DM Sans',system-ui,sans-serif", lineHeight:1.4,
            display:'flex', alignItems:'center', gap:7,
            animation:`fadeUp 0.4s ${i * 0.06}s both`,
          }}
          onMouseEnter={e => { if(!disabled){
            e.currentTarget.style.borderColor='rgba(232,0,45,0.35)';
            e.currentTarget.style.color='#c8c4be';
            e.currentTarget.style.background='rgba(232,0,45,0.05)';
            e.currentTarget.style.transform='translateY(-2px)';
            e.currentTarget.style.boxShadow='0 4px 16px rgba(232,0,45,0.08)';
          }}}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor='#18181c';
            e.currentTarget.style.color='#444';
            e.currentTarget.style.background='transparent';
            e.currentTarget.style.transform='none';
            e.currentTarget.style.boxShadow='none';
          }}
        >
          <span style={{ fontSize:13 }}>{s.icon}</span>
          {s.text}
        </button>
      ))}
    </div>
  );
}
