"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore, WardrobeItem } from "@/store/onboarding";

const TWINS = [
  { id: 0, tone: "#2E3A55", label: "Boxy notch lapel" },
  { id: 1, tone: "#3A4256", label: "Slim two-button" },
  { id: 2, tone: "#232E45", label: "Double-breasted" },
];

export default function DescribeMatchPage() {
  const router = useRouter();
  const { describeText, closetCount, setClosetCount, setDescribePick, addWardrobeItems } = useOnboardingStore();
  const [pick, setPick] = useState<number | null>(null);

  function handleAdd() {
    if (pick === null) return;
    setDescribePick(pick);
    const item: WardrobeItem = {
      id: `describe-${Date.now()}`,
      tone: TWINS[pick].tone,
      label: describeText || TWINS[pick].label,
    };
    setClosetCount(closetCount + 1);
    addWardrobeItems([item]);
    router.push("/onboarding/wardrobe-preview");
  }

  return (
    <div className="flex flex-col gap-6 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-1">
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
          Describe · confirm the twin
        </p>
        <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          Tap the closest match
        </h1>
        {describeText && (
          <p className="text-sm text-frock-muted leading-relaxed">
            Best guesses for &ldquo;{describeText}&rdquo;
          </p>
        )}
      </div>

      {/* Twin tiles */}
      <div className="grid grid-cols-3 gap-2">
        {TWINS.map((twin) => {
          const sel = pick === twin.id;
          return (
            <button
              key={twin.id}
              onClick={() => setPick(twin.id)}
              className="relative rounded-xl overflow-hidden transition-all active:scale-[0.96]"
              style={{
                height: 118,
                background: twin.tone,
                border: sel ? "2px solid #D6402B" : "2px solid transparent",
              }}
            >
              {/* Gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(to top, rgba(32,27,21,0.6) 0%, transparent 55%)",
                }}
              />
              {/* Label */}
              <p
                className="absolute bottom-2 left-2 right-2 text-[10.5px] leading-tight"
                style={{
                  color: "#F8F3EB",
                  fontFamily: "var(--font-serif)",
                  fontStyle: "italic",
                }}
              >
                {twin.label}
              </p>
              {/* Checkmark */}
              {sel && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-frock-rouge flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Maya tip */}
      <div
        className="rounded-2xl px-4 py-3"
        style={{ background: "#F0E8DB" }}
      >
        <p className="text-xs text-frock-ink-2 leading-snug" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
          "Confirming the twin keeps your tags honest — no guessed gaps later."
        </p>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3">
        <button
          onClick={handleAdd}
          disabled={pick === null}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
          style={{ background: "#D6402B" }}
        >
          Add to wardrobe
        </button>
        <button
          onClick={() => router.push("/onboarding/closet/describe")}
          className="w-full rounded-full py-3 text-sm font-medium text-frock-ink transition-all hover:bg-frock-blush/30"
          style={{
            border: "1px solid rgba(32,27,21,0.14)",
            background: "#FFFFFF",
          }}
        >
          None of these
        </button>
      </div>
    </div>
  );
}
