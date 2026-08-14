"use client";

import { useRouter } from "next/navigation";
import { ProfileMenu } from "@/components/ui/ProfileMenu";

export default function StyleMeLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col bg-frock-cream">
      <header className="bg-frock-cream border-b border-[#EDE5DB]">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => router.push("/onboarding/landing")}
            className="flex items-center gap-2 text-sm text-frock-muted hover:text-frock-ink transition-colors"
            aria-label="Back"
          >
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            The Wardrobe Collective
          </button>

          <span
            className="text-xs font-semibold uppercase text-frock-ink"
            style={{ letterSpacing: "0.18em" }}
          >
            Style Me Now
          </span>

          <ProfileMenu />
        </div>
      </header>

      <main className="flex-1 py-12 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
