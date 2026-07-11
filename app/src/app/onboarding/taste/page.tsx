"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const TASTE_TILES = [
  { id: 1, tone: "#C8A47E", label: "Sat · brunch" },
  { id: 2, tone: "#8A4A52", label: "Dinner out" },
  { id: 3, tone: "#3A4256", label: "Office day" },
  { id: 4, tone: "#E4D6BE", label: "Weekend" },
  { id: 5, tone: "#A65B38", label: "Gallery day" },
  { id: 6, tone: "#8A8B6C", label: "Travel" },
];

export default function TastePage() {
  const router = useRouter();
  const { taste, toggleTaste, setHubDone } = useOnboardingStore();

  const selectedCount = TASTE_TILES.filter((t) => taste[t.id]).length;

  function handleSave() {
    setHubDone("taste", true);
    router.push("/onboarding/hub");
  }

  return (
    <div className="flex flex-col gap-6 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-2">
        <h1
          className="text-3xl text-frock-ink leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Your visual taste
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          Pick the moods that feel most like you. Pick two or more — the mix matters.
        </p>
      </div>

      {/* Tiles grid */}
      <div className="grid grid-cols-2 gap-3">
        {TASTE_TILES.map((tile) => {
          const selected = !!taste[tile.id];
          return (
            <button
              key={tile.id}
              onClick={() => toggleTaste(tile.id)}
              className="flex flex-col rounded-2xl overflow-hidden text-left transition-all active:scale-[0.97]"
              style={{
                border: selected ? "2.5px solid #D6402B" : "2px solid transparent",
                boxShadow: selected
                  ? "0 0 0 0 transparent"
                  : "0 1px 2px rgba(46,35,22,0.06), 0 4px 14px rgba(46,35,22,0.07)",
                outline: "none",
              }}
            >
              {/* Color swatch */}
              <div
                className="w-full relative"
                style={{
                  height: 110,
                  background: tile.tone,
                }}
              >
                {/* Subtle texture overlay */}
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0px, rgba(255,255,255,0.05) 1px, transparent 1px, transparent 8px)",
                  }}
                />
                {selected && (
                  <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-frock-rouge flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l2.5 2.5L10 3.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>
              {/* Label */}
              <div
                className="px-3 py-2.5"
                style={{ background: selected ? "#F5DCD3" : "#FFFFFF" }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: selected ? "#D6402B" : "#201B15" }}
                >
                  {tile.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selection count */}
      {selectedCount > 0 && (
        <p className="text-xs text-frock-muted text-center">
          {selectedCount} selected · private to you, never shared
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={handleSave}
          disabled={selectedCount === 0}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
          style={{ background: "#D6402B" }}
        >
          {selectedCount > 0
            ? `Save taste — ${selectedCount} photo${selectedCount > 1 ? "s" : ""}`
            : "Pick a photo or two"}
        </button>
        <button
          onClick={() => { setHubDone("taste", false); router.push("/onboarding/hub"); }}
          className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
