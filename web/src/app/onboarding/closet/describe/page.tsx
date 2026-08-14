"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const SAMPLE_DESCRIPTION = "A navy wool blazer, kind of boxy, notch lapel";

function MiniMaya() {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: 48, height: 48, animation: "frkFloat 3.5s ease-in-out infinite", flexShrink: 0 }}
    >
      <path d="M34 24 h32 v-3 a16 8 0 0 0 -32 0 z" fill="#201B15" />
      <rect x="38" y="10" width="24" height="14" rx="3" fill="#201B15" />
      <ellipse cx="42" cy="17" rx="14" ry="6" fill="#D6402B" transform="rotate(-14 42 17)" />
      <ellipse cx="50" cy="52" rx="18" ry="17" fill="#F5DCD3" stroke="#201B15" strokeWidth="1.5" />
      <ellipse cx="44" cy="49" rx="2" ry="2" fill="#201B15" style={{ animation: "frkBlink 4s ease-in-out infinite" }} />
      <ellipse cx="56" cy="49" rx="2" ry="2" fill="#201B15" style={{ animation: "frkBlink 4s ease-in-out infinite" }} />
      <path d="M45 58 q5 4 10 0" fill="none" stroke="#D6402B" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export default function DescribePage() {
  const router = useRouter();
  const { setDescribeText, setDescribePick } = useOnboardingStore();
  const [text, setText] = useState("");
  const [listening, setListening] = useState(false);

  function handleMic() {
    if (listening) return;
    setListening(true);
    setTimeout(() => {
      setText(SAMPLE_DESCRIPTION);
      setListening(false);
    }, 1600);
  }

  function handleFindMatches() {
    setDescribeText(text);
    setDescribePick(null);
    router.push("/onboarding/closet/describe/match");
  }

  return (
    <div className="flex flex-col gap-6 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex flex-col gap-1">
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
          Describe · tell me
        </p>
        <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          Describe a piece
        </h1>
      </div>

      {/* Maya tip */}
      <div className="flex items-start gap-3">
        <MiniMaya />
        <div
          className="flex-1 rounded-2xl rounded-tl-none px-4 py-3"
          style={{ background: "#F0E8DB" }}
        >
          <p className="text-sm text-frock-ink-2 leading-snug" style={{ fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
            "Just describe your clothes one by one!"
          </p>
        </div>
      </div>

      {/* Textarea + mic */}
      <div className="relative">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. A navy wool blazer, kind of boxy, notch lapel…"
          rows={4}
          className="w-full rounded-2xl border px-4 py-3 pr-14 text-sm text-frock-ink placeholder-frock-muted/60 outline-none resize-none transition-colors leading-relaxed"
          style={{
            background: "#FFFFFF",
            borderColor: text ? "#D6402B" : "rgba(32,27,21,0.14)",
          }}
        />
        {/* Mic button */}
        <button
          onClick={handleMic}
          disabled={listening}
          className="absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
          style={{
            background: listening ? "#F5DCD3" : "#201B15",
            animation: listening ? "frkPulse 1.4s ease-in-out infinite" : "none",
          }}
          aria-label="Voice input"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="1" width="6" height="8" rx="3" stroke={listening ? "#D6402B" : "white"} strokeWidth="1.4" />
            <path d="M2 8a6 6 0 0 0 12 0" stroke={listening ? "#D6402B" : "white"} strokeWidth="1.4" strokeLinecap="round" />
            <line x1="8" y1="14" x2="8" y2="15.5" stroke={listening ? "#D6402B" : "white"} strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <p className="text-xs text-frock-muted -mt-3">
        One piece at a time. Belts and shoes count too.
      </p>

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-1">
        <button
          onClick={handleFindMatches}
          disabled={!text.trim()}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
          style={{ background: "#D6402B" }}
        >
          Find matches
        </button>
        <button
          onClick={() => router.push("/onboarding/closet")}
          className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors underline underline-offset-2"
        >
          Back to wardrobe
        </button>
      </div>
    </div>
  );
}
