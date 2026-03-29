export default function ChatMessage({ message, onSpeak }) {
  const isUser = message.role === 'user';
  const time = message.timestamp
    ? new Date(message.timestamp).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })
    : '';

  if (isUser) {
    return (
      <div style={{ display:'flex', justifyContent:'flex-end', animation:'fadeUp 0.25s ease' }}>
        <div style={{ maxWidth:'76%' }}>
          <div style={{
            padding:'11px 16px',
            borderRadius:'14px 14px 3px 14px',
            background:'linear-gradient(135deg,#e8002d,#c0001e)',
            boxShadow:'0 4px 16px rgba(232,0,45,0.2)',
          }}>
            <p style={{ fontSize:14, color:'#fff', lineHeight:1.65 }}>{message.content}</p>
          </div>
          <p style={{ fontSize:8, color:'#1e1e22', textAlign:'right', marginTop:4, fontFamily:"'JetBrains Mono',monospace" }}>{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display:'flex', gap:10, alignItems:'flex-start', animation:'fadeUp 0.25s ease' }}>
      {/* Avatar */}
      <div style={{
        width:30, height:30, borderRadius:8,
        background:'linear-gradient(135deg,#e8002d,#c0001e)',
        display:'flex', alignItems:'center', justifyContent:'center',
        flexShrink:0, marginTop:2,
        boxShadow:'0 4px 12px rgba(232,0,45,0.25)',
      }}>
        <span style={{ fontFamily:"'Playfair Display',Georgia,serif", fontWeight:700, fontSize:12, color:'#fff' }}>ET</span>
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        {/* Header row */}
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:6 }}>
          <span style={{ fontSize:11, fontWeight:600, color:'#444', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'0.04em' }}>ET Concierge</span>
          {message.meta?.intent && (
            <span style={{
              fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:'#22c55e',
              background:'rgba(34,197,94,0.06)', border:'1px solid rgba(34,197,94,0.14)',
              padding:'2px 7px', borderRadius:4, textTransform:'uppercase', letterSpacing:'0.08em',
            }}>
              {message.meta.intent.replace(/_/g,' ')}
            </span>
          )}
          {onSpeak && (
            <button onClick={() => onSpeak(message.content)} title="Play voice"
              style={{
                marginLeft:'auto', width:24, height:24, borderRadius:6,
                border:'1px solid #18181c', background:'transparent', cursor:'pointer',
                display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor='rgba(34,197,94,0.4)'; e.currentTarget.style.background='rgba(34,197,94,0.07)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor='#18181c'; e.currentTarget.style.background='transparent'; }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
              </svg>
            </button>
          )}
          <span style={{ fontSize:8, color:'#1e1e1e', fontFamily:"'JetBrains Mono',monospace", marginLeft:onSpeak?0:'auto' }}>{time}</span>
        </div>

        {/* Bubble */}
        <div style={{
          padding:'14px 17px',
          borderRadius:'3px 14px 14px 14px',
          background:'#0d0d10',
          border:'1px solid #18181c',
        }}>
          <p style={{
            fontSize:14, color:'#c8c4be', lineHeight:1.85,
            fontFamily:"'Playfair Display',Georgia,serif", fontStyle:'italic',
            whiteSpace:'pre-line',
          }}>
            {message.content}
          </p>
        </div>

        {/* Next action pill */}
        {message.meta?.nextAction && (
          <div style={{
            marginTop:8, padding:'7px 12px', borderRadius:9,
            background:'rgba(232,0,45,0.04)', border:'1px solid rgba(232,0,45,0.1)',
            display:'flex', alignItems:'center', gap:8,
          }}>
            <div style={{ width:4, height:4, borderRadius:'50%', background:'#e8002d', flexShrink:0, boxShadow:'0 0 6px rgba(232,0,45,0.5)' }} />
            <span style={{ fontSize:11, color:'#666', lineHeight:1.5 }}>{message.meta.nextAction}</span>
          </div>
        )}
      </div>
    </div>
  );
}
