"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { useState } from "react";

export default function CompletePage() {
  const store = useOnboardingStore();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFinish() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: store.profile,
          sizes: store.sizes,
          brandPreferences: store.brandPreferences,
          photoUrls: store.photoUrls,
        }),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      store.reset();
      router.push("/outfits");
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-8 pt-12 items-center text-center">
      <div className="flex flex-col gap-3">
        <span className="text-5xl">✨</span>
        <h2 className="font-serif text-3xl text-frock-ink">
          Your style profile is ready
        </h2>
        <p className="text-frock-muted leading-relaxed">
          FROCK will now start building outfit suggestions tailored to you.
          The more you add to your wardrobe, the better it gets.
        </p>
      </div>

      {error && (
        <p className="text-sm text-frock-red">{error}</p>
      )}

      <button
        onClick={handleFinish}
        disabled={saving}
        className="w-full rounded-full bg-frock-red py-4 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {saving ? "Saving..." : "See my first outfit"}
      </button>
    </div>
  );
}
