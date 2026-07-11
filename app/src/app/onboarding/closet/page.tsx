"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const METHODS = [
  {
    id: "import",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="8.5" cy="10.5" r="1.5" fill="currentColor" />
        <path d="M3 16l4.5-4 4 3.5 3.5-4 6 4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    title: "Import from camera roll",
    detail: "We scan photos for clothes — fast, private",
    cta: "Choose photos",
    accent: true,
  },
  {
    id: "photograph",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.6" />
        <circle cx="12" cy="13" r="4" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
    title: "Photograph an item",
    detail: "Point your camera at anything in your wardrobe",
    cta: "Open camera",
    accent: false,
  },
  {
    id: "describe",
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.6" />
      </svg>
    ),
    title: "Describe to add",
    detail: "Type or say “navy blazer, size 12” and we’ll match it",
    cta: "Describe an item",
    accent: false,
  },
];

export default function ClosetPage() {
  const router = useRouter();
  const { closetCount, setClosetCount } = useOnboardingStore();

  function handleMethod(id: string) {
    // Simulate adding items (5–8 items for import, 1 for others)
    if (id === "import") {
      const added = Math.floor(Math.random() * 4) + 5;
      setClosetCount(closetCount + added);
    } else {
      setClosetCount(closetCount + 1);
    }
  }

  function handleContinue() {
    router.push("/onboarding/hub");
  }

  return (
    <div className="flex flex-col gap-6 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-2">
        <p
          className="text-xs tracking-widest uppercase text-frock-muted"
          style={{ letterSpacing: "0.14em" }}
        >
          Step 1 of 2
        </p>
        <h1
          className="text-3xl text-frock-ink leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Build your closet
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          Add items you already own. The more you add, the better FROCK's suggestions get.
        </p>
      </div>

      {/* Method tiles */}
      <div className="flex flex-col gap-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            onClick={() => handleMethod(m.id)}
            className="flex items-center gap-4 rounded-2xl border p-4 text-left transition-all active:scale-[0.98]"
            style={{
              background: m.accent ? "#F5DCD3" : "#FFFFFF",
              borderColor: m.accent ? "#D6402B" : "rgba(32,27,21,0.10)",
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: m.accent ? "#D6402B" : "#F8F3EB",
                color: m.accent ? "#FFF" : "#554C41",
              }}
            >
              {m.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="font-medium text-sm text-frock-ink"
                style={{ fontFamily: "var(--font-sans)" }}
              >
                {m.title}
              </p>
              <p className="text-xs text-frock-muted mt-0.5 leading-snug">{m.detail}</p>
            </div>
            <span
              className="text-xs font-medium shrink-0"
              style={{ color: m.accent ? "#D6402B" : "#8C8375" }}
            >
              {m.cta} →
            </span>
          </button>
        ))}
      </div>

      {/* Item counter */}
      {closetCount > 0 && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm text-frock-success"
          style={{ background: "#E3EDE4" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 8l3.5 3.5L13 4.5" stroke="#4F7B58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>
            <strong>{closetCount}</strong> {closetCount === 1 ? "piece" : "pieces"} in your closet · progress saved
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={handleContinue}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: "#D6402B" }}
        >
          {closetCount > 0 ? "Continue to your hub →" : "Skip for now →"}
        </button>
        {closetCount === 0 && (
          <p className="text-xs text-center text-frock-muted">
            You can add items later from your wardrobe
          </p>
        )}
      </div>
    </div>
  );
}
