"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const SHAPES = [
  { id: "hourglass", label: "Hourglass", description: "Shoulders and hips are roughly equal, defined waist" },
  { id: "pear", label: "Pear", description: "Hips wider than shoulders" },
  { id: "apple", label: "Apple", description: "Fuller through the middle, narrower hips" },
  { id: "rectangle", label: "Rectangle", description: "Shoulders, waist and hips roughly the same width" },
  { id: "inverted-triangle", label: "Inverted triangle", description: "Shoulders wider than hips" },
];

export default function BodyShapePage() {
  const { profile, setProfile, goNext } = useOnboardingStore();
  const router = useRouter();

  function handleContinue() {
    goNext();
    router.push("/onboarding/highlights");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-frock-ink">
          What&apos;s your body shape? (A1.3)
        </h2>
        <p className="text-frock-muted text-sm">
          This helps FROCK suggest silhouettes that flatter you.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {SHAPES.map((shape) => (
          <button
            key={shape.id}
            onClick={() => setProfile({ bodyShape: shape.id })}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              profile.bodyShape === shape.id
                ? "border-frock-red bg-frock-blush"
                : "border-frock-blush hover:border-frock-muted"
            }`}
          >
            <div className="font-medium text-frock-ink">{shape.label}</div>
            <div className="text-sm text-frock-muted mt-0.5">
              {shape.description}
            </div>
          </button>
        ))}
        <button
          onClick={() => setProfile({ bodyShape: "not-sure" })}
          className={`rounded-2xl border p-4 text-left transition-colors ${
            profile.bodyShape === "not-sure"
              ? "border-frock-red bg-frock-blush"
              : "border-frock-blush hover:border-frock-muted"
          }`}
        >
          <div className="font-medium text-frock-muted">Not sure</div>
        </button>
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
