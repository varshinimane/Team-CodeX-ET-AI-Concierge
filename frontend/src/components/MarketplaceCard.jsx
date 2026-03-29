import { useState } from "react";
import { trackClick } from "../utils/api.js";
import ProductModal from "./ProductModal.jsx";

function rgb(hex) {
  if (!hex) return '34,197,94';
  return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)].join(',');
}

const PC = {
  high:   { label:"High priority", color:"#ef4444", bg:"rgba(239,68,68,0.06)", border:"rgba(239,68,68,0.18)" },
  medium: { label:"Recommended",   color:"#f59e0b", bg:"rgba(245,158,11,0.05)", border:"rgba(245,158,11,0.15)" },
  low:    { label:"Consider",      color:"#555",    bg:"rgba(255,255,255,0.02)", border:"rgba(255,255,255,0.06)" },
};

function ServiceCard({ service, userProfile, onModalOpen }) {
  const [hovered, setHovered] = useState(false);
  const pc = PC[service.priority] || PC.medium;
  const r  = rgb(service.color);

  function handleClick() {
    trackClick(service.id, service.name, "view");
    onModalOpen(service);
  }

  function handleCTA(e) {
    e.stopPropagation();
    trackClick(service.id, service.name, "cta");
    if (service.url) window.open(service.url, "_blank", "noopener");
  }

  return (
    <div
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding:"10px 11px", borderRadius:10, cursor:"pointer",
        background: hovered ? `rgba(${r},0.07)` : pc.bg,
        border:`1px solid ${hovered ? `rgba(${r},0.28)` : pc.border}`,
        transform: hovered ? "translateY(-1px)" : "none",
        boxShadow: hovered ? `0 6px 20px rgba(${r},0.08)` : "none",
        transition:"all 0.2s cubic-bezier(0.4,0,0.2,1)",
      }}>

      <div style={{ display:"flex", alignItems:"flex-start", gap:9 }}>
        <div style={{ width:30, height:30, borderRadius:8, background:`rgba(${r},0.09)`, border:`1px solid rgba(${r},0.15)`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, flexShrink:0, transition:"transform 0.2s", transform: hovered ? "scale(1.05)" : "scale(1)" }}>
          {service.icon || "·"}
        </div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:2 }}>
            <span style={{ fontSize:12, fontWeight:600, color: hovered ? "#f0ede8" : "#c8c4be", transition:"color 0.2s" }}>{service.name}</span>
            <span style={{ fontSize:7, fontFamily:"monospace", color:pc.color }}>{pc.label}</span>
          </div>
          <p style={{ fontSize:10, color:"#555", marginBottom:5, lineHeight:1.45 }}>{service.reason}</p>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <div style={{ display:"flex", alignItems:"center", gap:6 }}>
              <span style={{ fontSize:10, color:service.color||"#22c55e", fontWeight:500 }}>From {service.minAmount}</span>
              {service.tag && <span style={{ fontSize:8, fontFamily:"monospace", color:"#333" }}>{service.tag}</span>}
            </div>
            <button
              onClick={handleCTA}
              style={{ padding:"4px 10px", borderRadius:5, border:`1px solid rgba(${r},0.3)`, background:`rgba(${r},0.08)`, color:service.color||"#22c55e", fontSize:9, fontFamily:"monospace", fontWeight:700, cursor:"pointer", transition:"all 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.background=`rgba(${r},0.18)`}
              onMouseLeave={e => e.currentTarget.style.background=`rgba(${r},0.08)`}
            >
              Start →
            </button>
          </div>
        </div>
      </div>

      {service.action && hovered && (
        <div style={{ marginTop:7, padding:"5px 8px", borderRadius:5, background:`rgba(${r},0.04)`, fontSize:9, color:"#666", fontStyle:"italic", animation:"fadeUp 0.15s ease" }}>
          {service.action}
        </div>
      )}
    </div>
  );
}

export default function MarketplaceCard({ marketplace, userProfile }) {
  const [modalProduct, setModalProduct] = useState(null);
  if (!marketplace?.services?.length) return null;

  return (
    <>
      <div className="card fadeUp">
        <div className="label" style={{ color:"#22c55e", borderColor:"rgba(34,197,94,0.2)", background:"rgba(34,197,94,0.05)" }}>
          Services You May Need
        </div>
        <div style={{ fontSize:9, color:"#333", fontFamily:"monospace", marginBottom:10 }}>Click any card to see a personalised explanation</div>
        <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
          {marketplace.services.slice(0,4).map((s, i) => (
            <ServiceCard key={s.id||i} service={s} userProfile={userProfile} onModalOpen={setModalProduct} />
          ))}
        </div>
      </div>

      {modalProduct && (
        <ProductModal product={modalProduct} userProfile={userProfile} onClose={() => setModalProduct(null)} />
      )}
    </>
  );
}
