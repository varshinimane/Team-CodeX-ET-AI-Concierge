import { useState, useEffect } from "react";
import { getProductModal, trackClick } from "../utils/api.js";

export default function ProductModal({ product, userProfile, onClose }) {
  const [explanation, setExplanation] = useState("");
  const [loading, setLoading]         = useState(true);
  const [gen, setGen]                 = useState("...");

  useEffect(() => {
    if (!product) return;
    setLoading(true);
    getProductModal(product, userProfile)
      .then(data => { setExplanation(data.explanation); setGen(data.generatedBy); })
      .catch(() => setExplanation(`${product.name} matches your profile. ${product.description}`))
      .finally(() => setLoading(false));
  }, [product?.id]);

  if (!product) return null;

  function hexRgb(hex) {
    if (!hex||hex[0]!=='#') return '232,0,45';
    return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
  }

  const r = hexRgb(product.color);

  function handleCTA() {
    trackClick(product.id, product.name, "cta");
    if (product.url) window.open(product.url, "_blank", "noopener");
    onClose();
  }

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.87)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:150, padding:20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div style={{ width:"100%", maxWidth:420, background:"#0d0d10", border:`1px solid rgba(${r},0.2)`, borderRadius:16, overflow:"hidden", boxShadow:`0 32px 80px rgba(0,0,0,0.8), 0 0 60px rgba(${r},0.06)`, animation:"fadeUp 0.25s ease" }}>

        {/* Product header */}
        <div style={{ padding:"20px 20px 0", display:"flex", alignItems:"flex-start", gap:12 }}>
          <div style={{ width:44, height:44, borderRadius:11, background:`rgba(${r},0.1)`, border:`1px solid rgba(${r},0.2)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:20, flexShrink:0 }}>
            {product.icon || "●"}
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <div style={{ fontSize:15, fontWeight:700, color:"#f0ede8" }}>{product.name}</div>
              <button onClick={onClose} style={{ background:"none", border:"none", color:"#333", fontSize:16, cursor:"pointer", padding:2, lineHeight:1 }}
                onMouseEnter={e => e.currentTarget.style.color="#aaa"} onMouseLeave={e => e.currentTarget.style.color="#333"}>✕</button>
            </div>
            <div style={{ fontSize:11, color:product.color||"#888", marginTop:2 }}>{product.tagline}</div>
          </div>
        </div>

        {/* "Why this is for you" section */}
        <div style={{ margin:"16px 20px 0", padding:"14px", borderRadius:10, background:`rgba(${r},0.04)`, border:`1px solid rgba(${r},0.12)` }}>
          <div style={{ fontSize:9, fontFamily:"monospace", color:product.color||"#888", textTransform:"uppercase", letterSpacing:"0.1em", marginBottom:8, display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:4, height:4, borderRadius:"50%", background:product.color||"#888" }} />
            Why this is right for you
          </div>
          {loading ? (
            <div style={{ display:"flex", gap:5, alignItems:"center", padding:"4px 0" }}>
              {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:"50%", background:"#333", animation:`dotPulse 1s ${i*0.15}s infinite` }} />)}
            </div>
          ) : (
            <p style={{ fontSize:13, color:"#b8b4ae", lineHeight:1.75, fontFamily:"'Playfair Display',Georgia,serif", fontStyle:"italic" }}>
              {explanation}
            </p>
          )}
        </div>

        {/* Features */}
        {product.features?.length > 0 && (
          <div style={{ padding:"12px 20px 0" }}>
            <div style={{ fontSize:9, fontFamily:"monospace", color:"#333", textTransform:"uppercase", letterSpacing:"0.08em", marginBottom:8 }}>What you get</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:5 }}>
              {product.features.map((f,i) => (
                <span key={i} style={{ fontSize:10, padding:"3px 8px", borderRadius:4, background:"rgba(255,255,255,0.03)", border:"1px solid #1e1e22", color:"#666" }}>{f}</span>
              ))}
            </div>
          </div>
        )}

        {/* Price + CTA */}
        <div style={{ padding:"16px 20px 20px", display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:4 }}>
          <div>
            <div style={{ fontSize:11, color:"#444", marginBottom:2 }}>Pricing</div>
            <div style={{ fontSize:13, fontWeight:600, color:product.color||"#888" }}>{product.price}</div>
          </div>
          <button onClick={handleCTA}
            style={{ padding:"10px 20px", borderRadius:9, border:"none", background:`rgba(${r},0.9)`, color:"#fff", fontSize:13, fontWeight:600, cursor:"pointer", transition:"all 0.2s", display:"flex", alignItems:"center", gap:6 }}
            onMouseEnter={e => { e.currentTarget.style.background=`rgba(${r},1)`; e.currentTarget.style.transform="translateY(-1px)"; }}
            onMouseLeave={e => { e.currentTarget.style.background=`rgba(${r},0.9)`; e.currentTarget.style.transform="none"; }}>
            {product.ctaText || "Explore"} →
          </button>
        </div>

        <div style={{ padding:"0 20px 12px", fontSize:9, color:"#252528", fontFamily:"monospace" }}>
          Personalised by AI · {gen === "llm" ? "LLM-generated" : "Profile-matched"}
        </div>
      </div>

      <style>{`
        @keyframes dotPulse { 0%,100%{transform:translateY(0);opacity:0.3} 50%{transform:translateY(-4px);opacity:1} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      `}</style>
    </div>
  );
}
