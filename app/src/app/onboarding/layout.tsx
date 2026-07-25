"use client";

import { usePathname, useRouter } from "next/navigation";

const STEPS = ["welcome", "landing", "closet", "wardrobe-preview", "complete"];
const COUNTER_HIDDEN = new Set(["landing", "wardrobe-preview"]);

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  // Parse nested paths: /onboarding/<primary>/<sub>/<subsub>
  const onboardingSegments = pathname.replace(/^\/onboarding\/?/, "").split("/").filter(Boolean);
  const primarySlug = onboardingSegments[0] ?? "";
  const subSlug = onboardingSegments[1] ?? "";
  const subSubSlug = onboardingSegments[2] ?? "";

  const isClosetChild = primarySlug === "closet" && subSlug !== "";
  const isWardrobePreview = primarySlug === "wardrobe-preview";
  const isScanScreen = subSlug === "import" && subSubSlug === "scan";

  const activeSlug = isClosetChild ? "closet" : primarySlug;
  const stepIndex = STEPS.indexOf(activeSlug);

  const progressIndex = isWardrobePreview ? 2 : stepIndex;
  const progress = progressIndex >= 0 ? ((progressIndex + 1) / STEPS.length) * 100 : 0;
  const showBack = (stepIndex > 0 || isClosetChild) && !isScanScreen;

  function handleBack() {
    if (isWardrobePreview) {
      router.push("/onboarding/landing");
      return;
    }
    if (isClosetChild) {
      if (subSubSlug) {
        router.push(`/onboarding/closet/${subSlug}`);
      } else {
        router.push("/onboarding/closet");
      }
    } else if (stepIndex > 0) {
      router.push(`/onboarding/${STEPS[stepIndex - 1]}`);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-frock-cream">
      <header className="flex items-center justify-between px-5 py-4">
        {showBack ? (
          <button
            onClick={handleBack}
            className="w-9 h-9 flex items-center justify-center rounded-full text-frock-ink-2 hover:bg-frock-blush transition-colors"
            aria-label="Back"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        ) : (
          <div className="w-9" />
        )}

        {primarySlug === "welcome" ? (
          <span
            className="font-sans text-xs font-semibold uppercase text-frock-ink"
            style={{ letterSpacing: "0.18em" }}
          >
            THE WARDROBE COLLECTIVE
          </span>
        ) : (
          <span
            className="text-xs font-semibold uppercase text-frock-ink"
            style={{ letterSpacing: "0.18em" }}
          >
            The Wardrobe Collective
          </span>
        )}

        <div className="w-9 text-right">
          {stepIndex >= 0 && stepIndex < STEPS.length - 1 && !isClosetChild && !COUNTER_HIDDEN.has(activeSlug) && (
            <span className="text-xs text-frock-muted">{stepIndex + 1}/{STEPS.length - 1}</span>
          )}
        </div>
      </header>

      <div className="h-px bg-frock-blush">
        <div
          className="h-full bg-frock-rouge transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center px-5 py-6 overflow-y-auto">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
