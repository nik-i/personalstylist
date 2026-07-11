"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { useState } from "react";

const BUDGET_TIERS = [
  { id: "low", symbol: "£", label: "High street", sub: "Zara, H&M, Uniqlo" },
  { id: "mid", symbol: "££", label: "Mid-range", sub: "COS, Reiss, Arket" },
  { id: "high", symbol: "£££", label: "Investment", sub: "Reformation, Theory" },
];

const SHOP_CONTEXTS = [
  {
    id: "day",
    title: "Day-to-day",
    suggestions: ["Zara", "COS", "Uniqlo", "Arket", "H&M"],
  },
  {
    id: "office",
    title: "Office",
    suggestions: ["COS", "Reiss", "Massimo Dutti", "Banana Republic", "Theory"],
  },
  {
    id: "occasion",
    title: "Occasion",
    suggestions: ["Reformation", "Ganni", "Rixo", "Self-Portrait", "Ghost"],
  },
  {
    id: "athletic",
    title: "Athletic & activewear",
    suggestions: ["Lululemon", "Nike", "Alo", "Gymshark", "Sweaty Betty"],
  },
];

export default function ShopsPage() {
  const router = useRouter();
  const { budget, setBudget, brands, toggleBrand, setHubDone } = useOnboardingStore();
  const [openContext, setOpenContext] = useState<string | null>("day");

  function handleSave() {
    setHubDone("shops", true);
    router.push("/onboarding/hub");
  }

  return (
    <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-1">
        <h1
          className="text-3xl text-frock-ink leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Where you shop + budget
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          Shapes every recommendation FROCK makes for you.
        </p>
      </div>

      {/* Budget */}
      <div className="flex flex-col gap-2">
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.12em" }}>
          Budget
        </p>
        <div className="flex gap-2">
          {BUDGET_TIERS.map((tier) => {
            const sel = budget === tier.id;
            return (
              <button
                key={tier.id}
                onClick={() => setBudget(sel ? null : tier.id)}
                className="flex-1 flex flex-col items-center gap-0.5 rounded-2xl border py-3 px-2 transition-all active:scale-[0.97]"
                style={{
                  background: sel ? "#F5DCD3" : "#FFFFFF",
                  borderColor: sel ? "#D6402B" : "rgba(32,27,21,0.10)",
                }}
              >
                <span
                  className="text-lg font-semibold"
                  style={{ color: sel ? "#D6402B" : "#201B15", fontFamily: "var(--font-serif)" }}
                >
                  {tier.symbol}
                </span>
                <span className="text-xs font-medium" style={{ color: sel ? "#D6402B" : "#201B15" }}>
                  {tier.label}
                </span>
                <span className="text-[10px]" style={{ color: sel ? "#D6402B" : "#8C8375" }}>
                  {tier.sub}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Brand sections */}
      <div className="flex flex-col gap-2">
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.12em" }}>
          Favourite brands
        </p>
        <div
          className="rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(32,27,21,0.10)" }}
        >
          {SHOP_CONTEXTS.map((ctx, i) => {
            const isOpen = openContext === ctx.id;
            const picks = brands[ctx.id] ?? [];
            const isLast = i === SHOP_CONTEXTS.length - 1;

            return (
              <div
                key={ctx.id}
                style={{ borderBottom: isLast ? "none" : "1px solid rgba(32,27,21,0.07)" }}
              >
                {/* Section header */}
                <button
                  className="w-full flex items-center justify-between px-4 py-3 text-left"
                  style={{ background: isOpen ? "#FDFAF6" : "#FFFFFF" }}
                  onClick={() => setOpenContext(isOpen ? null : ctx.id)}
                >
                  <div>
                    <span className="text-sm font-medium text-frock-ink">{ctx.title}</span>
                    {picks.length > 0 && (
                      <span className="ml-2 text-xs text-frock-muted">{picks.join(" · ")}</span>
                    )}
                  </div>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="text-frock-muted shrink-0 transition-transform duration-200"
                    style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                  >
                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {/* Brand chips */}
                {isOpen && (
                  <div
                    className="px-4 pb-4 flex flex-wrap gap-2"
                    style={{ background: "#FDFAF6" }}
                  >
                    {ctx.suggestions.map((brand) => {
                      const on = picks.includes(brand);
                      return (
                        <button
                          key={brand}
                          onClick={() => toggleBrand(ctx.id, brand)}
                          className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
                          style={{
                            background: on ? "#D6402B" : "#F8F3EB",
                            color: on ? "#FFFFFF" : "#554C41",
                            border: on ? "none" : "1px solid rgba(32,27,21,0.12)",
                          }}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={handleSave}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: "#D6402B" }}
        >
          Save shops
        </button>
        <button
          onClick={() => { setHubDone("shops", false); router.push("/onboarding/hub"); }}
          className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
