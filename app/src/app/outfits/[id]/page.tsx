"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const COLOR_HEX: Record<string, string> = {
  black: "#1C1C1C", white: "#F9F6F2", navy: "#1B2A4A", beige: "#D9C9A8",
  cream: "#F5EDD9", brown: "#7B4F2E", camel: "#C19A6B", tan: "#C9A96E",
  grey: "#9E9E9E", gray: "#9E9E9E", charcoal: "#4A4A4A", slate: "#6B7280",
  red: "#C0392B", burgundy: "#7B1A2B", wine: "#6B2035", rust: "#B94B2C",
  pink: "#E8A0B0", blush: "#F2D0C4", rose: "#E8A0B0", coral: "#E87B6B",
  orange: "#D4722A", yellow: "#E8C850", gold: "#C5A028", mustard: "#C5821A",
  green: "#4A7C59", olive: "#6B7345", sage: "#8FAF8A", mint: "#A8D5B0",
  blue: "#4169A0", cobalt: "#2147A0", teal: "#2A8080", turquoise: "#40B0A0",
  purple: "#7B5EA7", lavender: "#B0A0C8", lilac: "#C8A8D0", plum: "#5B2A5B",
  ivory: "#F5EDD9", chocolate: "#5C3317", khaki: "#C3B091", denim: "#4A7090",
};

function colorToHex(color?: string) {
  if (!color) return "#F0E8DB";
  if (color.startsWith("#")) return color;
  return COLOR_HEX[color.toLowerCase()] ?? "#F0E8DB";
}

type GapAnalysis = {
  ownedItemIds: string[];
  ownedItemNotes: { id: string; reason: string }[];
  gap: { description: string; confidence: "high" | "medium" | "low" };
  recommendedStyle: { pieceType: string; colorPaletteFit: string; flatteringCut: string; reasoning: string };
  products: { name: string; priceRange: "low" | "mid" | "high"; estimatedPrice: string; retailer: string; description: string; color: string }[];
  stylistNote: string;
};

type WardrobeItem = { id: string; itemType: string; color?: string };
type OutfitItem = { wardrobeItem: WardrobeItem };
type Suggestion = {
  id: string;
  vibeNote?: string;
  gapAnalysis: GapAnalysis | null;
  occasion?: { occasionType?: string; description?: string; formalityLevel?: string } | null;
  outfitItems: OutfitItem[];
  feedback: { willWear?: boolean }[];
};

const PRICE_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: "Budget", color: "#4A7C59" },
  mid: { label: "Mid", color: "#C5A028" },
  high: { label: "Higher end", color: "#D6402B" },
};

export default function OutfitResultPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [data, setData] = useState<Suggestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [sendingFeedback, setSendingFeedback] = useState(false);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/outfits/${id}`)
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function sendFeedback(willWear: boolean) {
    if (sendingFeedback || feedbackSent) return;
    setSendingFeedback(true);
    await fetch(`/api/outfits/${id}/feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ willWear, feedbackSource: "result_page" }),
    }).catch(() => {});
    setSendingFeedback(false);
    setFeedbackSent(true);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-2xl animate-pulse bg-frock-cream-2" />
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <p className="text-frock-muted text-sm">Couldn't load this suggestion.</p>
        <button onClick={() => router.push("/outfits")} className="text-sm underline text-frock-ink">
          Back to Style advice
        </button>
      </div>
    );
  }

  const ga = data.gapAnalysis;
  const confidence = ga?.gap.confidence ?? "low";
  const confidenceConfig = {
    high: { label: "High confidence", bg: "#D1FADF", color: "#166534" },
    medium: { label: "Medium confidence", bg: "#FEF3C7", color: "#92400E" },
    low: { label: "Low confidence — add more items", bg: "#FEF3C7", color: "#92400E" },
  }[confidence];

  return (
    <div className="flex flex-col gap-6 py-2">
      <button
        onClick={() => router.push("/outfits")}
        className="flex items-center gap-1 text-sm text-frock-muted self-start"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Style advice
      </button>

      {/* Goal header */}
      <div className="flex flex-col gap-2">
        {data.occasion?.occasionType && (
          <span
            className="self-start px-3 py-1 rounded-full text-xs font-medium capitalize"
            style={{ background: "#F5DCD3", color: "#D6402B" }}
          >
            {data.occasion.occasionType.replace(/-/g, " ")}
          </span>
        )}
        <h1 className="text-2xl text-frock-ink leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
          {data.occasion?.description || "Your style analysis"}
        </h1>
        {ga && (
          <span
            className="self-start px-2.5 py-0.5 rounded-full text-xs font-medium"
            style={{ background: confidenceConfig.bg, color: confidenceConfig.color }}
          >
            {confidenceConfig.label}
          </span>
        )}
      </div>

      {/* Already owned */}
      {data.outfitItems.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
            Already covered
          </p>
          <div className="flex flex-wrap gap-2">
            {data.outfitItems.map(({ wardrobeItem }) => (
              <div
                key={wardrobeItem.id}
                className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-white"
                style={{ border: "1px solid rgba(32,27,21,0.08)" }}
              >
                <span
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ background: colorToHex(wardrobeItem.color), border: "1px solid rgba(0,0,0,0.08)" }}
                />
                <span className="text-xs text-frock-ink capitalize">{wardrobeItem.itemType.replace(/_/g, " ")}</span>
                <span className="text-xs text-[#4A7C59]">✓</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-frock-muted">You already own these — no need to re-buy.</p>
        </div>
      )}

      {/* Gap */}
      {ga?.gap.description && (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
            What's actually missing
          </p>
          <p className="text-lg text-frock-ink leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
            {ga.gap.description}
          </p>
        </div>
      )}

      {/* Recommended style */}
      {ga?.recommendedStyle && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
            What to look for
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[ga.recommendedStyle.pieceType, ga.recommendedStyle.colorPaletteFit, ga.recommendedStyle.flatteringCut].filter(Boolean).map((chip) => (
              <span
                key={chip}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{ background: "#FFFFFF", border: "1.5px solid #D6402B", color: "#D6402B" }}
              >
                {chip}
              </span>
            ))}
          </div>
          {ga.recommendedStyle.reasoning && (
            <p className="text-sm text-frock-muted italic leading-relaxed">{ga.recommendedStyle.reasoning}</p>
          )}
        </div>
      )}

      {/* Products */}
      {ga?.products && ga.products.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
            Three options to consider
          </p>
          <div className="flex flex-col gap-2">
            {ga.products.map((product, i) => {
              const tier = PRICE_LABELS[product.priceRange] ?? PRICE_LABELS.mid;
              return (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-4 flex gap-3"
                  style={{ border: "1px solid rgba(32,27,21,0.08)" }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex-shrink-0"
                    style={{ background: colorToHex(product.color), border: "1px solid rgba(0,0,0,0.06)" }}
                  />
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-frock-ink leading-tight">{product.name}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full flex-shrink-0"
                        style={{ background: tier.color + "18", color: tier.color }}
                      >
                        {tier.label}
                      </span>
                    </div>
                    <p className="text-xs text-frock-muted">{product.retailer} · {product.estimatedPrice}</p>
                    <p className="text-xs text-frock-muted leading-relaxed">{product.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-xs text-frock-muted text-center">Shop links coming soon</p>
        </div>
      )}

      {/* Stylist note */}
      {ga?.stylistNote && (
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "#F5DCD3" }}
        >
          <p className="text-sm text-frock-ink italic leading-relaxed">"{ga.stylistNote}"</p>
        </div>
      )}

      {/* Feedback */}
      <div className="flex flex-col gap-3 pb-2">
        <p className="text-xs uppercase tracking-widest text-frock-muted text-center" style={{ letterSpacing: "0.12em" }}>
          Was this advice helpful?
        </p>
        {feedbackSent ? (
          <p className="text-sm text-center text-frock-muted">Thanks — I'll keep improving.</p>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => sendFeedback(true)}
              disabled={sendingFeedback}
              className="flex-1 py-3 rounded-full text-sm font-medium transition-opacity active:opacity-80"
              style={{ background: "#D1FADF", color: "#166534" }}
            >
              Yes, spot on
            </button>
            <button
              onClick={() => sendFeedback(false)}
              disabled={sendingFeedback}
              className="flex-1 py-3 rounded-full text-sm font-medium transition-opacity active:opacity-80"
              style={{ background: "rgba(32,27,21,0.06)", color: "#8C8375" }}
            >
              Not quite right
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
