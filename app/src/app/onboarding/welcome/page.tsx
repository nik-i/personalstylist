"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const CAPTIONS = [
  "Hey — I'm Maya, your stylist.",
  "I'll learn what you love and build looks you'll actually reach for.",
  "Let's start with your closet.",
];

function MayaAvatar({ speaking }: { speaking: boolean }) {
  return (
    <svg
      viewBox="0 0 100 100"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        width: 120,
        height: 120,
        animation: "frkFloat 3.2s ease-in-out infinite",
      }}
    >
      {/* Hat brim */}
      <path d="M34 24 h32 v-3 a16 8 0 0 0 -32 0 z" fill="#201B15" />
      {/* Hat body */}
      <rect x="38" y="10" width="24" height="14" rx="3" fill="#201B15" />
      {/* Bow / beret detail */}
      <ellipse cx="42" cy="17" rx="14" ry="6" fill="#D6402B" transform="rotate(-14 42 17)" />
      {/* Face */}
      <ellipse cx="50" cy="52" rx="18" ry="17" fill="#F5DCD3" stroke="#201B15" strokeWidth="1.5" />
      {/* Eyes with blink */}
      <ellipse
        cx="44"
        cy="49"
        rx="2"
        ry="2"
        fill="#201B15"
        style={{ animation: "frkBlink 4s ease-in-out infinite" }}
      />
      <ellipse
        cx="56"
        cy="49"
        rx="2"
        ry="2"
        fill="#201B15"
        style={{ animation: "frkBlink 4s ease-in-out infinite" }}
      />
      {/* Mouth */}
      <path
        d="M45 58 q5 5 10 0"
        fill="none"
        stroke="#D6402B"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* Speaking dots */}
      {speaking && (
        <>
          <circle cx="42" cy="78" r="2.5" fill="#D6402B" style={{ animation: "frkBar 0.8s ease-in-out infinite" }} />
          <circle cx="50" cy="78" r="2.5" fill="#D6402B" style={{ animation: "frkBar 0.8s ease-in-out 0.2s infinite" }} />
          <circle cx="58" cy="78" r="2.5" fill="#D6402B" style={{ animation: "frkBar 0.8s ease-in-out 0.4s infinite" }} />
        </>
      )}
    </svg>
  );
}

function VoiceBars({ active }: { active: boolean }) {
  const bars = [0.4, 0.9, 0.6, 1, 0.7, 0.5, 0.85];
  return (
    <div className="flex items-end gap-1 h-8">
      {bars.map((h, i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-frock-rouge"
          style={{
            height: `${h * 100}%`,
            opacity: active ? 1 : 0.25,
            animation: active ? `frkBar ${0.6 + i * 0.08}s ease-in-out ${i * 0.07}s infinite` : "none",
            transformOrigin: "bottom",
          }}
        />
      ))}
    </div>
  );
}

export default function WelcomePage() {
  const router = useRouter();
  const [captionIdx, setCaptionIdx] = useState(0);
  const [speaking, setSpeaking] = useState(true);
  const [listening, setListening] = useState(false);
  const [heard, setHeard] = useState(false);

  // Cycle through captions automatically
  useEffect(() => {
    if (listening) return;
    if (captionIdx >= CAPTIONS.length - 1) {
      const t = setTimeout(() => setSpeaking(false), 800);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCaptionIdx((i) => i + 1), 2700);
    return () => clearTimeout(t);
  }, [captionIdx, listening]);

  function handleMic() {
    if (listening) return;
    setListening(true);
    setSpeaking(true);
    setHeard(false);
    const t1 = setTimeout(() => setHeard(true), 1700);
    const t2 = setTimeout(() => router.push("/onboarding/closet"), 3100);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }

  function handleStart() {
    router.push("/onboarding/closet");
  }

  const captionText = listening
    ? heard
      ? '"Let\'s start with my closet."'
      : "Listening…"
    : CAPTIONS[captionIdx];

  const captionColor = listening
    ? heard
      ? "var(--color-frock-rouge)"
      : "var(--color-frock-muted)"
    : "var(--color-frock-ink)";

  return (
    <div className="flex flex-col items-center gap-8 pt-6 pb-8 animate-[frkFade_0.4s_ease]">
      {/* Avatar */}
      <MayaAvatar speaking={speaking || listening} />

      {/* Caption */}
      <div
        className="text-center text-base leading-relaxed min-h-[56px] px-2 transition-colors duration-300"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 18,
          color: captionColor,
          animation: "frkUp 0.3s ease",
        }}
        key={captionIdx + (listening ? "l" : "")}
      >
        {captionText}
      </div>

      {/* Caption dots */}
      {!listening && (
        <div className="flex items-center gap-2">
          {CAPTIONS.map((_, i) => (
            <div
              key={i}
              className="rounded-full transition-all duration-300 bg-frock-rouge"
              style={{
                width: i === captionIdx ? 18 : 5,
                height: 5,
                opacity: i === captionIdx ? 1 : 0.3,
              }}
            />
          ))}
        </div>
      )}

      {/* Voice bars + mic */}
      <div className="flex flex-col items-center gap-3">
        <VoiceBars active={speaking || listening} />
        <button
          onClick={handleMic}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-frock-blush text-frock-ink-2 text-sm hover:border-frock-rouge hover:text-frock-rouge transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="5" y="1" width="6" height="8" rx="3" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 8a6 6 0 0 0 12 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="8" y1="14" x2="8" y2="15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          {listening ? (heard ? "Got it…" : "Listening…") : "Tap to talk"}
        </button>
      </div>

      {/* Primary CTA */}
      <div className="w-full flex flex-col gap-3 mt-2">
        <button
          onClick={handleStart}
          className="w-full rounded-full py-4 text-white font-medium text-base tracking-wide transition-opacity hover:opacity-90 active:opacity-80"
          style={{ background: "#D6402B" }}
        >
          Build my closet →
        </button>
        <p className="text-xs text-center text-frock-muted">Takes about 3 minutes · nothing leaves your device</p>
      </div>
    </div>
  );
}
