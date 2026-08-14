"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col gap-6 py-2 animate-[frkFade_0.35s_ease]">
      {/* Header section */}
      <div className="flex flex-col gap-2">
        <h1
          className="text-frock-ink leading-tight"
          style={{
            fontFamily: "var(--font-serif)",
            fontSize: 30,
            fontWeight: 700,
          }}
        >
          What are we
          <br />
          <em style={{ color: "#E60023", fontStyle: "italic" }}>doing today</em>?
        </h1>
        <p className="text-sm text-frock-muted">
          Pick one — you can always switch later.
        </p>
      </div>

      {/* Action cards */}
      <div className="flex flex-col gap-3">
        {/* Card 1 — Virtual wardrobe (ACTIVE) */}
        <button
          onClick={() => router.push("/onboarding/closet")}
          className="flex items-center gap-4 w-full rounded-2xl border shadow-sm p-4 text-left transition-all active:scale-[0.98]"
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(32,27,21,0.10)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#F8F3EB", color: "#554C41" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M3 7h16l-1.5 11H4.5L3 7z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M8 7V5a3 3 0 0 1 6 0v2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-frock-ink">Virtual wardrobe</p>
            <p className="text-xs text-frock-muted mt-0.5 leading-snug">
              Import, describe, or fix your pieces
            </p>
          </div>
          <span className="text-frock-muted shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {/* Card 2 — Style me now (ACTIVE) */}
        <button
          onClick={() => router.push("/style-me")}
          className="flex items-center gap-4 w-full rounded-2xl border shadow-sm p-4 text-left transition-all active:scale-[0.98]"
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(32,27,21,0.10)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#F5DCD3", color: "#554C41" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 2L2 7l9 5 9-5-9-5z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
              <path d="M2 12l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M2 17l9 5 9-5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-frock-ink">Style me now</p>
            <p className="text-xs text-frock-muted mt-0.5 leading-snug">
              Tell me the occasion, I&apos;ll build a fit
            </p>
          </div>
          <span className="text-frock-muted shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>

        {/* Card 3 — Fine-tune my profile (ACTIVE) */}
        <button
          onClick={() => router.push("/profile")}
          className="flex items-center gap-4 w-full rounded-2xl border shadow-sm p-4 text-left transition-all active:scale-[0.98]"
          style={{
            background: "#FFFFFF",
            borderColor: "rgba(32,27,21,0.10)",
          }}
        >
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#F1F1F1", color: "#554C41" }}
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <circle cx="11" cy="11" r="3" stroke="currentColor" strokeWidth="1.6" />
              <path
                d="M11 2v2M11 18v2M2 11h2M18 11h2M4.22 4.22l1.42 1.42M16.36 16.36l1.42 1.42M4.22 17.78l1.42-1.42M16.36 5.64l1.42-1.42"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-frock-ink" style={{ fontSize: 15.5 }}>Fine-tune my profile</p>
            <p className="mt-0.5 leading-snug" style={{ fontSize: 12.5, color: "#767676" }}>
              Taste, fit, and preferred shops
            </p>
          </div>
          <span className="text-frock-muted shrink-0">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M7 4l5 5-5 5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </span>
        </button>
      </div>
    </div>
  );
}
