"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const AESTHETICS = [
  "Classic & polished",
  "Relaxed & minimalist",
  "Bold & expressive",
  "Bohemian & relaxed",
  "Edgy & contemporary",
  "Romantic & feminine",
];

export default function StyleQuizPage() {
  const { profile, setProfile, goNext } = useOnboardingStore();
  const router = useRouter();
  const selected = profile.styleSignals?.split(",").filter(Boolean) ?? [];

  function toggle(label: string) {
    const next = selected.includes(label)
      ? selected.filter((s) => s !== label)
      : [...selected, label];
    setProfile({ styleSignals: next.join(",") });
  }

  function handleContinue() {
    goNext();
    router.push("/onboarding/sizes");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-frock-ink">
          What words describe your style?
        </h2>
        <p className="text-frock-muted text-sm">Pick all that feel like you.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {AESTHETICS.map((label) => (
          <button
            key={label}
            onClick={() => toggle(label)}
            className={`rounded-2xl border px-4 py-3 text-sm text-left transition-colors ${
              selected.includes(label)
                ? "border-frock-red bg-frock-blush text-frock-ink"
                : "border-frock-blush text-frock-muted hover:border-frock-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        className="w-full rounded-full bg-frock-red py-4 text-white font-medium hover:opacity-90 transition-opacity"
      >
        Continue
      </button>
    </div>
  );
}
