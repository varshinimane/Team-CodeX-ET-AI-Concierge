import { useState } from "react";
import { trackClick } from "../utils/api.js";
import ProductModal from "./ProductModal.jsx";

function rgb(hex) {
  if (!hex) return '245,158,11';
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
}

function ProductCard({ product, userProfile, onModalOpen }) {
  const [hovered, setHovered] = useState(false);
  const r = rgb(product.color);

  function handleCardClick() {
    trackClick(product.id, product.name, "view");
    onModalOpen(product);
  }

  function handleCTA(e) {
    e.stopPropagation();
    trackClick(product.id, product.name, "cta");
    if (product.url) window.open(product.url, "_blank", "noopener");
  }

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:"12px 13px", borderRadius:11, cursor:"pointer",
        background: hovered ? `rgba(${r},0.07)` : product.isTopPick ? `rgba(${r},0.04)` : "rgba(255,255,255,0.015)",
        border:`1px solid ${hovered ? `rgba(${r},0.3)` : product.isTopPick ? `rgba(${r},0.18)` : "rgba(255,255,255,0.05)"}`,
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? `0 8px 24px rgba(${r},0.1)` : "none",
        transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)", position:"relative",
      }}>

      {product.isTopPick && (
        <div style={{ position:"absolute", top:0, right:10, fontSize:7, fontFamily:"monospace", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", background:product.color||"#f59e0b", color:"#0a0a0a", padding:"2px 6px", borderRadius:"0 0 5px 5px" }}>
          Top pick
        </div>
      )}

      <div style={{ display:"flex", alignItems:"flex-start", gap:10 }}>
        <div style={{ width:34, height:34, borderRadius:9, background:`rgba(${r},0.1)`, border:`1px solid rgba(${r},0.15)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:15, flexShrink:0, transition:"transform 0.2s", transform: hovered ? "scale(1.05)" : "scale(1)" }}>
          {product.icon || "●"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:2 }}>
            <span style={{ fontSize:12, fontWeight:600, color: hovered ? "#f0ede8" : "#d8d4ce", transition:"color 0.2s" }}>{product.name}</span>
            {product.badge && <span style={{ fontSize:7, fontFamily:"monospace", background:`rgba(${r},0.12)`, color:product.color, padding:"1px 5px", borderRadius:3 }}>{product.badge}</span>}
          </div>
          <p style={{ fontSize:10, color:"#666", lineHeight:1.45, marginBottom:6 }}>{product.pitch || product.tagline}</p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:10, color:product.color||"#f59e0b", fontWeight:500 }}>{product.price}</span>
            <button
              onClick={handleCTA}
              style={{ padding:"4px 10px", borderRadius:5, border:`1px solid rgba(${r},0.3)`, background:`rgba(${r},0.08)`, color:product.color||"#f59e0b", fontSize:9, fontFamily:"monospace", fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => { e.currentTarget.style.background=`rgba(${r},0.18)`; }}
              onMouseLeave={e => { e.currentTarget.style.background=`rgba(${r},0.08)`; }}
            >
              {product.ctaText || "Explore"} →
            </button>
          </div>
        </div>
      </div>

      {product.urgency && hovered && (
        <div style={{ marginTop:8, padding:"5px 8px", borderRadius:5, background:`rgba(${r},0.05)`, fontSize:9, color:"#666", lineHeight:1.4, animation:"fadeUp 0.15s ease" }}>
          {product.urgency}
        </div>
      )}
    </div>
  );
}

export default function CrossSellCard({ crossSell, userProfile }) {
  const [modalProduct, setModalProduct] = useState(null);
  if (!crossSell?.crossSell?.length) return null;

  return (
    <>
      <div className="card fadeUp">
        <div className="label" style={{ color:"#f59e0b", borderColor:"rgba(245,158,11,0.2)", background:"rgba(245,158,11,0.05)" }}>
          ET Products for You
        </div>
        <div style={{ fontSize:9, color:"#333", fontFamily:"monospace", marginBottom:10 }}>Click any card to see why it's right for you</div>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {crossSell.crossSell.slice(0,3).map((p, i) => (
            <ProductCard key={p.id||i} product={p} userProfile={userProfile} onModalOpen={setModalProduct} />
          ))}
        </div>
      </div>

      {modalProduct && (
        <ProductModal product={modalProduct} userProfile={userProfile} onClose={() => setModalProduct(null)} />
      )}
    </>
  );
}
