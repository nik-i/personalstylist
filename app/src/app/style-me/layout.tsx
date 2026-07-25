"use client";

import { useRouter } from "next/navigation";

export default function StyleMeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-frock-cream">
      <header className="flex items-center justify-between px-5 py-4">
        <button
          onClick={() => router.push("/onboarding/landing")}
          className="w-9 h-9 flex items-center justify-center rounded-full text-frock-ink hover:bg-frock-blush transition-colors"
          aria-label="Back"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M11 14L6 9l5-5"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <span
          className="text-xs font-semibold uppercase text-frock-ink"
          style={{ letterSpacing: "0.18em" }}
        >
          Style Me Now
        </span>

        <div className="w-9" />
      </header>

      <div className="h-px" style={{ background: "#EDE5DB" }} />

      <main className="flex-1 flex flex-col items-center px-5 py-6 overflow-y-auto">
        <div className="w-full max-w-sm">{children}</div>
      </main>
    </div>
  );
}
