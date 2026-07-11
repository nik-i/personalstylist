"use client";

import { useOnboardingStore } from "@/store/onboarding";
import { useRouter } from "next/navigation";

const STEPS = [
  "welcome",
  "photos",
  "style-quiz",
  "sizes",
  "body-shape",
  "highlights",
  "brands",
  "complete",
];

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currentStep, goBack } = useOnboardingStore();
  const router = useRouter();
  const progress = (currentStep / STEPS.length) * 100;

  function handleBack() {
    if (currentStep <= 1) return;
    goBack();
    router.push(`/onboarding/${STEPS[currentStep - 2]}`);
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-6 py-4">
        {currentStep > 1 && currentStep < STEPS.length ? (
          <button
            onClick={handleBack}
            className="text-sm text-frock-muted hover:text-frock-ink"
          >
            ← Back
          </button>
        ) : (
          <div />
        )}
        <span className="font-serif text-xl tracking-wide text-frock-ink">
          FROCK
        </span>
        <span className="text-sm text-frock-muted">
          {currentStep < STEPS.length ? `${currentStep} / ${STEPS.length - 1}` : ""}
        </span>
      </header>

      <div className="h-1 bg-frock-blush">
        <div
          className="h-full bg-frock-red transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center px-6 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}
