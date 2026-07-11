"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const SECTIONS = [
  {
    id: "taste" as const,
    title: "Your visual taste",
    detail: "3 photos",
    doneMeta: "3 photos in — taste noted",
    time: "2 min",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="7" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="3" width="7" height="5" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="11" y="10" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
        <rect x="2" y="14" width="7" height="3" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
    ),
    route: "/onboarding/taste",
  },
  {
    id: "fit" as const,
    title: "Sizes, shape & fit",
    detail: "1 min",
    doneMeta: "Saved — editable anytime",
    time: "1 min",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 2a4 4 0 0 1 4 4v1h2l1 3h-1l-1 8H5L4 10H3L4 7h2V6a4 4 0 0 1 4-4z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>
    ),
    route: "/onboarding/fit",
  },
  {
    id: "shops" as const,
    title: "Where you shop + budget",
    detail: "1 min",
    doneMeta: "Saved — feeds every rec",
    time: "1 min",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M3 5h14l-1.5 9a1 1 0 0 1-1 .9H5.5a1 1 0 0 1-1-.9L3 5z" stroke="currentColor" strokeWidth="1.4" />
        <path d="M1 3h18" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8" cy="17.5" r="1" fill="currentColor" />
        <circle cx="14" cy="17.5" r="1" fill="currentColor" />
      </svg>
    ),
    route: "/onboarding/shops",
  },
];

function CheckDot({ done }: { done: boolean }) {
  return (
    <div
      className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
      style={{
        background: done ? "#E3EDE4" : "transparent",
        border: done ? "none" : "1.5px solid rgba(32,27,21,0.28)",
      }}
    >
      {done && (
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
          <path d="M2 5.5l2.5 2.5L9 3" stroke="#4F7B58" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </div>
  );
}

export default function HubPage() {
  const router = useRouter();
  const { closetCount, country, hubDone } = useOnboardingStore();

  const total = closetCount;
  const doneCount = Object.values(hubDone).filter(Boolean).length;
  const allDone = doneCount === 3;

  const ledger = [
    { label: `Closet`, note: `${total} items added`, done: true },
    { label: "Country", note: country, done: true },
    { label: "Taste · fit · shops", note: doneCount ? `${doneCount} of 3 done` : "all optional — do any time", done: allDone },
  ];

  return (
    <div className="flex flex-col gap-6 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-1">
        <p
          className="text-xs tracking-widest uppercase text-frock-muted"
          style={{ letterSpacing: "0.14em" }}
        >
          Step 2 of 2
        </p>
        <h1
          className="text-3xl text-frock-ink leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Your style hub
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          Fill in what you can — everything here makes your recommendations sharper.
        </p>
      </div>

      {/* Ledger */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(32,27,21,0.10)" }}
      >
        {ledger.map((l, i) => (
          <div
            key={l.label}
            className="flex items-center gap-3 px-4 py-3"
            style={{
              background: "#FFFFFF",
              borderBottom: i < ledger.length - 1 ? "1px solid rgba(32,27,21,0.07)" : "none",
            }}
          >
            <CheckDot done={l.done} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-frock-ink">{l.label}</p>
            </div>
            <p className="text-xs text-frock-muted">{l.note}</p>
          </div>
        ))}
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-3">
        {SECTIONS.map((s) => {
          const done = hubDone[s.id];
          return (
            <button
              key={s.id}
              onClick={() => router.push(s.route)}
              className="flex items-center gap-4 rounded-2xl border px-4 py-4 text-left transition-all active:scale-[0.98] hover:shadow-sm"
              style={{
                background: done ? "#F8F3EB" : "#FFFFFF",
                borderColor: done ? "rgba(32,27,21,0.10)" : "rgba(32,27,21,0.12)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: done ? "#E3EDE4" : "#F8F3EB",
                  color: done ? "#4F7B58" : "#554C41",
                }}
              >
                {s.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-frock-ink">{s.title}</p>
                <p
                  className="text-xs mt-0.5"
                  style={{ color: done ? "#4F7B58" : "#8C8375" }}
                >
                  {done ? s.doneMeta : s.time}
                </p>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-frock-muted shrink-0"
              >
                <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          );
        })}
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2 mt-1">
        <button
          onClick={() => router.push("/onboarding/complete")}
          className="w-full rounded-full py-4 font-medium text-base transition-all hover:opacity-90 active:opacity-80"
          style={{
            background: allDone ? "#D6402B" : "#201B15",
            color: "#FFF8F0",
          }}
        >
          {allDone ? "Go to my stylist →" : "Take me to FROCK →"}
        </button>
        {!allDone && (
          <p className="text-xs text-center text-frock-muted">
            You can complete the remaining sections any time from your profile
          </p>
        )}
      </div>
    </div>
  );
}
