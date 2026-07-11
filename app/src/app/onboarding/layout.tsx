"use client";

import { usePathname, useRouter } from "next/navigation";

const STEPS = ["welcome", "closet", "hub", "taste", "fit", "shops", "complete"];
const HUB_CHILDREN = new Set(["taste", "fit", "shops"]);

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const slug = pathname.split("/").at(-1) ?? "";
  const isHubChild = HUB_CHILDREN.has(slug);
  const stepIndex = STEPS.indexOf(slug);

  // Hub children are visually "inside" hub, so show hub's progress (index 2)
  const progressIndex = isHubChild ? 2 : stepIndex;
  const progress = progressIndex >= 0 ? ((progressIndex + 1) / STEPS.length) * 100 : 0;
  const showBack = stepIndex > 0 || isHubChild;

  function handleBack() {
    if (isHubChild) {
      router.push("/onboarding/hub");
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

        <span
          className="font-serif text-xl tracking-widest text-frock-ink"
          style={{ fontFamily: "var(--font-serif)", letterSpacing: "0.12em" }}
        >
          FROCK
        </span>

        <div className="w-9 text-right">
          {stepIndex >= 0 && stepIndex < STEPS.length - 1 && !isHubChild && (
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
