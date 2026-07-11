"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

export default function WelcomePage() {
  const { setStep } = useOnboardingStore();
  const router = useRouter();

  function handleStart() {
    setStep(2);
    router.push("/onboarding/photos");
  }

  return (
    <div className="flex flex-col gap-8 pt-12">
      <div className="flex flex-col gap-3">
        <h1 className="font-serif text-4xl text-frock-ink">
          Your wardrobe, finally working for you.
        </h1>
        <p className="text-frock-muted leading-relaxed">
          FROCK learns your style, your wardrobe, and your life — then pulls
          together outfits you&apos;ll actually wear.
        </p>
      </div>

      <div className="flex flex-col gap-3 text-sm text-frock-muted">
        <div className="flex items-start gap-2">
          <span className="mt-0.5">✦</span>
          <span>Takes about 5 minutes to set up</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5">✦</span>
          <span>No subscription required to get started</span>
        </div>
        <div className="flex items-start gap-2">
          <span className="mt-0.5">✦</span>
          <span>Your data stays private — never sold</span>
        </div>
      </div>

      <button
        onClick={handleStart}
        className="mt-4 w-full rounded-full bg-frock-red py-4 text-white font-medium tracking-wide hover:opacity-90 transition-opacity"
      >
        Let&apos;s start
      </button>
    </div>
  );
}
