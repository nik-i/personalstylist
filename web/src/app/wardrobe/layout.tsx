"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function WardrobeLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isUploadPage = pathname === "/wardrobe/upload";

  return (
    <div className="min-h-screen flex flex-col bg-frock-cream">
      <header className="px-5 py-4 flex items-center justify-between">
        {isUploadPage ? (
          <Link
            href="/wardrobe"
            className="w-9 h-9 flex items-center justify-center rounded-full text-frock-ink hover:bg-frock-blush transition-colors"
            aria-label="Back to wardrobe"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <Link
            href="/onboarding/landing"
            className="w-9 h-9 flex items-center justify-center rounded-full text-frock-ink hover:bg-frock-blush transition-colors"
            aria-label="Back to home"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M11 14L6 9l5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        )}
        <span
          className="text-sm font-semibold tracking-widest uppercase text-frock-ink"
          style={{ letterSpacing: "0.18em" }}
        >
          The Wardrobe Collective
        </span>
        <div className="w-9" />
      </header>
      <main className="flex-1 px-5 pb-8 w-full max-w-sm mx-auto">
        {children}
      </main>
    </div>
  );
}
