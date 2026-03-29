
import React from 'react';

const AGENTS = [
  { id:'profile',     label:'Profile',   icon:'P', color:'#a78bfa' },
  { id:'intent',      label:'Intent',    icon:'I', color:'#22c55e' },
  { id:'recommend',   label:'Content',   icon:'C', color:'#60a5fa' },
  { id:'crosssell',   label:'Products',  icon:'Pr',color:'#f59e0b' },
  { id:'marketplace', label:'Services',  icon:'S', color:'#22c55e' },
  { id:'explain',     label:'Explain',   icon:'E', color:'#e8002d' },
];

export default function AgentPipeline({ activeAgent }) {
  const order = AGENTS.map(a => a.id);

  const getStatus = id => {
    if (activeAgent === 'done') return 'done';
    const ai = order.indexOf(activeAgent);
    const ii = order.indexOf(id);
    if (ai === -1) return 'idle';
    if (ii < ai) return 'done';
    if (ii === ai) return 'active';
    return 'idle';
  };

  return (
    <div style={{ display:'flex', alignItems:'center', gap:2 }}>
      {AGENTS.map((agent, idx) => {
        const st = getStatus(agent.id);
        const isActive = st === 'active', isDone = st === 'done';
        const col = isDone ? '#22c55e' : isActive ? agent.color : '#1e1e22';

        return (
          <React.Fragment key={agent.id}>
            <div style={{
              display:'flex', flexDirection:'column', alignItems:'center', gap:3,
              minWidth:46, padding:'7px 2px', borderRadius:8, transition:'all 0.35s',
              background: isActive ? `rgba(${hexRgb(agent.color)},0.08)` : isDone ? 'rgba(34,197,94,0.05)' : 'rgba(255,255,255,0.01)',
              border: isActive ? `1px solid rgba(${hexRgb(agent.color)},0.3)` : isDone ? '1px solid rgba(34,197,94,0.18)' : '1px solid rgba(255,255,255,0.03)',
              transform: isActive ? 'scale(1.06)' : 'scale(1)',
              boxShadow: isActive ? `0 0 16px rgba(${hexRgb(agent.color)},0.12)` : 'none',
              position:'relative', flexShrink:0,
            }}>
              <div style={{ position:'relative' }}>
                <div style={{
                  width:20, height:20, borderRadius:5,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:8, fontWeight:700, fontFamily:"'JetBrains Mono',monospace",
                  transition:'all 0.35s',
                  background: isActive ? agent.color : isDone ? '#22c55e' : '#141418',
                  color: isActive || isDone ? '#fff' : '#2a2a2a',
                  boxShadow: isActive ? `0 0 10px rgba(${hexRgb(agent.color)},0.4)` : 'none',
                }}>
                  {isDone ? '✓' : agent.icon}
                </div>
                {isActive && (
                  <div style={{
                    position:'absolute', top:-2, right:-2, width:6, height:6,
                    borderRadius:'50%', background: agent.color,
                    animation:'pingRed 1s infinite',
                    boxShadow: `0 0 6px ${agent.color}`,
                  }} />
                )}
              </div>
              <span style={{
                fontSize:7, fontFamily:"'JetBrains Mono',monospace", fontWeight:600,
                letterSpacing:'0.04em', textTransform:'uppercase', whiteSpace:'nowrap',
                color: isActive ? agent.color : isDone ? '#22c55e' : '#252528',
                transition:'color 0.35s',
              }}>
                {isActive ? `${agent.label}...` : agent.label}
              </span>
            </div>

            {idx < AGENTS.length - 1 && (
              <div style={{
                flex:1, height:1, minWidth:3,
                background: getStatus(AGENTS[idx+1].id) !== 'idle' || activeAgent === 'done'
                  ? 'linear-gradient(90deg,rgba(34,197,94,0.4),rgba(34,197,94,0.15))'
                  : 'rgba(255,255,255,0.03)',
                transition:'background 0.5s',
                position:'relative',
              }}>
                {getStatus(AGENTS[idx+1].id) === 'active' && (
                  <div style={{
                    position:'absolute', top:-1, left:0, height:3, width:'60%',
                    background: `linear-gradient(90deg,${AGENTS[idx+1].color},transparent)`,
                    borderRadius:2, animation:'breathe 0.8s infinite',
                    opacity:0.7,
                  }} />
                )}
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

function hexRgb(hex) {
  if (!hex || hex[0] !== '#') return '232,0,45';
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
}
