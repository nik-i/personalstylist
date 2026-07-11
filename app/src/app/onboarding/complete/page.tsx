"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { useState } from "react";

const LOOK_ITEMS = [
  { name: "Camel blazer", tone: "#C8A47E", note: "The hero piece" },
  { name: "Cream knit", tone: "#E4D6BE", note: "Underneath" },
  { name: "Straight-leg denim", tone: "#3A4256", note: "Easy base" },
];

export default function CompletePage() {
  const router = useRouter();
  const { closetCount, country, taste, hubDone, reset } = useOnboardingStore();
  const [saving, setSaving] = useState(false);

  const tasteCount = Object.values(taste).filter(Boolean).length;
  const doneCount = Object.values(hubDone).filter(Boolean).length;

  async function handleFinish() {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    reset();
    router.push("/");
  }

  return (
    <div className="flex flex-col gap-8 py-4 animate-[frkFade_0.4s_ease]">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "#E3EDE4" }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8l3 3L13 4" stroke="#4F7B58" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="text-sm font-medium text-frock-success">Profile complete</span>
        </div>
        <h1
          className="text-4xl text-frock-ink leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Your style profile is ready.
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          FROCK will now suggest outfits built around what you own, what you love, and where you're going.
        </p>
      </div>

      {/* Profile summary */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ border: "1px solid rgba(32,27,21,0.10)" }}
      >
        {[
          { label: "Closet", value: `${closetCount} items` },
          { label: "Country", value: country },
          {
            label: "Taste",
            value: tasteCount ? `${tasteCount} mood${tasteCount > 1 ? "s" : ""} saved` : "—",
          },
          {
            label: "Style sections",
            value: doneCount ? `${doneCount} of 3 done` : "—",
          },
        ].map((row, i, arr) => (
          <div
            key={row.label}
            className="flex items-center justify-between px-4 py-3"
            style={{
              background: "#FFFFFF",
              borderBottom: i < arr.length - 1 ? "1px solid rgba(32,27,21,0.07)" : "none",
            }}
          >
            <span className="text-sm text-frock-muted">{row.label}</span>
            <span className="text-sm font-medium text-frock-ink">{row.value}</span>
          </div>
        ))}
      </div>

      {/* First look preview */}
      <div className="flex flex-col gap-3">
        <p
          className="text-xs tracking-widest uppercase text-frock-muted"
          style={{ letterSpacing: "0.14em" }}
        >
          Your first look
        </p>
        <div className="flex gap-2">
          {LOOK_ITEMS.map((item) => (
            <div key={item.name} className="flex-1 flex flex-col gap-1.5">
              <div
                className="w-full rounded-xl"
                style={{ height: 80, background: item.tone }}
              />
              <p className="text-xs text-frock-ink font-medium leading-tight">{item.name}</p>
              <p className="text-[10px] text-frock-muted">{item.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-frock-muted italic" style={{ fontFamily: "var(--font-serif)" }}>
          "The blazer does the talking. Easy all day."
        </p>
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-2">
        <button
          onClick={handleFinish}
          disabled={saving}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-60"
          style={{ background: "#D6402B" }}
        >
          {saving ? "Opening FROCK…" : "See my wardrobe →"}
        </button>
        <p className="text-xs text-center text-frock-muted">
          Taste and fit can be updated any time from your profile
        </p>
      </div>
    </div>
  );
}
