"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const HIGHLIGHT_OPTIONS = [
  "Shoulders",
  "Décolletage",
  "Waist",
  "Legs",
  "Arms",
  "Back",
];

const DOWNPLAY_OPTIONS = [
  "Hips",
  "Tummy",
  "Upper arms",
  "Thighs",
  "Bust",
  "Shoulders",
];

export default function HighlightsPage() {
  const { profile, setProfile, goNext } = useOnboardingStore();
  const router = useRouter();

  const highlights = profile.highlightPrefs?.split(",").filter(Boolean) ?? [];
  const downplays = profile.downplayPrefs?.split(",").filter(Boolean) ?? [];

  function toggleHighlight(label: string) {
    const next = highlights.includes(label)
      ? highlights.filter((h) => h !== label)
      : [...highlights, label];
    setProfile({ highlightPrefs: next.join(",") });
  }

  function toggleDownplay(label: string) {
    const next = downplays.includes(label)
      ? downplays.filter((h) => h !== label)
      : [...downplays, label];
    setProfile({ downplayPrefs: next.join(",") });
  }

  function handleContinue() {
    goNext();
    router.push("/onboarding/brands");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-frock-ink">
          What do you love to show off? (A1.4)
        </h2>
        <p className="text-frock-muted text-sm">
          Pick areas you want to highlight, and any you&apos;d rather draw
          attention away from.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm font-medium text-frock-ink mb-2">Highlight</p>
          <div className="flex flex-wrap gap-2">
            {HIGHLIGHT_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => toggleHighlight(opt)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  highlights.includes(opt)
                    ? "border-frock-red bg-frock-blush text-frock-ink"
                    : "border-frock-blush text-frock-muted"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-frock-ink mb-2">Draw attention away from</p>
          <div className="flex flex-wrap gap-2">
            {DOWNPLAY_OPTIONS.map((opt) => (
              <button
                key={opt}
                onClick={() => toggleDownplay(opt)}
                className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                  downplays.includes(opt)
                    ? "border-frock-red bg-frock-blush text-frock-ink"
                    : "border-frock-blush text-frock-muted"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleContinue}
          className="w-full rounded-full bg-frock-red py-4 text-white font-medium hover:opacity-90 transition-opacity"
        >
          Continue
        </button>
        <button
          onClick={handleContinue}
          className="text-sm text-frock-muted text-center hover:text-frock-ink"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
