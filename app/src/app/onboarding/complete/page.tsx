"use client";

import { useEffect, useState } from "react";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

const CAPTIONS = [
  "Here's your first look — built around what you already own.",
  "The blazer carries everything. Ready to go.",
];

const BIG_SLOT   = { label: "The hero piece", tone: "#C8A47E" };
const MID_SLOT   = { label: "Underneath",     tone: "#E4D6BE" };
const LAYER_SLOT = { label: "Easy base",       tone: "#3A4256" };

const SHOES = [
  { tag: "LOAFER",  name: "Camel suede",   tone: "#B8956B" },
  { tag: "SNEAKER", name: "White leather", tone: "#F0EDE8" },
];

const BAR_DELAYS = [0, 0.15, 0.3, 0.15, 0];

export default function CompletePage() {
  const [recSpeaking, setRecSpeaking] = useState(true);
  const [recCaption,  setRecCaption]  = useState(0);
  const [selectedShoe, setSelectedShoe] = useState(0);
  const [toast, setToast] = useState(false);
  const [bigDragOver,   setBigDragOver]   = useState(false);
  const [midDragOver,   setMidDragOver]   = useState(false);
  const [layerDragOver, setLayerDragOver] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setRecCaption(1), 2700);
    const t2 = setTimeout(() => setRecSpeaking(false), 5400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  function handleLove() {
    setToast(true);
    setTimeout(() => setToast(false), 2400);
  }

  return (
    <div className="flex flex-col gap-6 py-4 animate-[frkFade_0.4s_ease]">

      {/* Mascot section */}
      <div className="flex flex-col items-center gap-3">
        <MascotAvatar size="mini" speaking={recSpeaking} />

        {/* Voice bars */}
        <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 18 }}>
          {BAR_DELAYS.map((delay, i) => (
            <span
              key={i}
              style={{
                width: 3,
                height: recSpeaking ? 18 : 6,
                borderRadius: 2,
                background: recSpeaking ? "#E60023" : "#8C8375",
                transformOrigin: "bottom",
                transition: "height 0.2s ease",
                animation: recSpeaking ? `frkBar 0.9s ${delay}s ease-in-out infinite` : undefined,
                display: "block",
              }}
            />
          ))}
        </div>

        <p
          key={recCaption}
          className="text-center animate-[frkCap_320ms_ease]"
          style={{
            fontSize: 21,
            fontWeight: 700,
            minHeight: 52,
            fontFamily: "var(--font-serif)",
            color: "#201B15",
            lineHeight: 1.25,
          }}
        >
          {CAPTIONS[recCaption]}
        </p>
      </div>

      {/* Section overline */}
      <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8C8375" }}>
        Your first look
      </p>

      {/* 3-slot outfit card */}
      <div
        style={{
          border: "1px solid #CDCDCD",
          borderRadius: 14,
          boxShadow: "0 2px 12px rgba(32,27,21,0.07)",
          minHeight: 520,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "#fff",
        }}
      >
        <div style={{ flex: 1, display: "flex", gap: 4, padding: 4, minHeight: 466 }}>

          {/* Big slot */}
          <div
            onDragOver={(e) => { e.preventDefault(); setBigDragOver(true); }}
            onDragLeave={() => setBigDragOver(false)}
            onDrop={() => setBigDragOver(false)}
            style={{
              flex: 1.35, background: BIG_SLOT.tone, borderRadius: 10,
              position: "relative", overflow: "hidden",
              outline: bigDragOver ? "2px solid #E60023" : "none",
            }}
          >
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 50%)", pointerEvents: "none" }} />
            <p style={{ position: "absolute", bottom: 10, left: 10, right: 10, color: "#fff", fontStyle: "italic", fontFamily: "var(--font-serif)", fontSize: 13, lineHeight: 1.3, pointerEvents: "none" }}>
              {BIG_SLOT.label}
            </p>
            <button
              aria-label="Remove photo"
              style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: "50%", background: "rgba(0,0,0,0.40)", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", flexShrink: 0 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2L2 8" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          {/* Right column */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setMidDragOver(true); }}
              onDragLeave={() => setMidDragOver(false)}
              onDrop={() => setMidDragOver(false)}
              style={{ flex: 1, background: MID_SLOT.tone, borderRadius: 10, position: "relative", overflow: "hidden", outline: midDragOver ? "2px solid #E60023" : "none" }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)", pointerEvents: "none" }} />
              <p style={{ position: "absolute", bottom: 8, left: 8, right: 8, color: "#fff", fontStyle: "italic", fontFamily: "var(--font-serif)", fontSize: 11, lineHeight: 1.3, pointerEvents: "none" }}>
                {MID_SLOT.label}
              </p>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setLayerDragOver(true); }}
              onDragLeave={() => setLayerDragOver(false)}
              onDrop={() => setLayerDragOver(false)}
              style={{ flex: 1, background: LAYER_SLOT.tone, borderRadius: 10, position: "relative", overflow: "hidden", outline: layerDragOver ? "2px solid #E60023" : "none" }}
            >
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)", pointerEvents: "none" }} />
              <p style={{ position: "absolute", bottom: 8, left: 8, right: 8, color: "#fff", fontStyle: "italic", fontFamily: "var(--font-serif)", fontSize: 11, lineHeight: 1.3, pointerEvents: "none" }}>
                {LAYER_SLOT.label}
              </p>
            </div>
          </div>
        </div>

        <div style={{ borderTop: "1px solid #CDCDCD", padding: "10px 14px" }}>
          <p style={{ fontSize: 13, color: "#8C8375", fontStyle: "italic", fontFamily: "var(--font-serif)", lineHeight: 1.4 }}>
            &ldquo;The blazer does the talking. All yours already — nothing to buy.&rdquo;
          </p>
        </div>
      </div>

      {/* Footwear */}
      <div className="flex flex-col gap-3">
        <p style={{ fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8C8375" }}>
          Footwear
        </p>
        <div style={{ display: "flex", gap: 12 }}>
          {SHOES.map((shoe, i) => (
            <button
              key={shoe.name}
              onClick={() => setSelectedShoe(i)}
              style={{
                flex: 1, border: selectedShoe === i ? "2px solid #E60023" : "1.5px solid #CDCDCD",
                borderRadius: 10, overflow: "hidden", background: "#fff", cursor: "pointer",
                padding: 0, textAlign: "left", transition: "border-color 0.15s",
              }}
            >
              <div style={{ height: 78, background: shoe.tone }} />
              <div style={{ padding: "8px 10px 10px" }}>
                <p style={{ fontSize: 9.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "#8C8375", marginBottom: 2 }}>
                  {shoe.tag}
                </p>
                <p style={{ fontSize: 12, fontWeight: 600, color: "#201B15" }}>{shoe.name}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer CTA */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          aria-label="Start listening"
          style={{ width: 50, height: 50, borderRadius: "50%", background: "#201B15", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer", flexShrink: 0 }}
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="7" y="2" width="6" height="10" rx="3" fill="#FFFFFF" />
            <path d="M4 10a6 6 0 0012 0" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="10" y1="16" x2="10" y2="19" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
            <line x1="7"  y1="19" x2="13" y2="19" stroke="#FFFFFF" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <button
          onClick={handleLove}
          style={{ flex: 1, height: 50, borderRadius: 25, background: "#E60023", color: "#fff", fontWeight: 600, fontSize: 15, border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", letterSpacing: "0.01em" }}
        >
          Love it — wear it
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className="animate-[frkUp_0.4s_ease]"
          style={{ position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)", background: "#201B15", color: "#fff", padding: "12px 24px", borderRadius: 30, fontSize: 14, fontWeight: 500, whiteSpace: "nowrap", zIndex: 100, pointerEvents: "none" }}
        >
          Marked as worn — très chic
        </div>
      )}
    </div>
  );
}
