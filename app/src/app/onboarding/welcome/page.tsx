"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

const CAPTIONS = [
  "Hey — I'm Maya, your stylist.",
  "I'll learn what you love and build looks you'll actually reach for.",
];

const CONSTELLATION = [
  { top: "8%",  left: "7%",  width: 48, height: 32, bg: "#B9C4C9", rotate: -18, opacity: 0.42, dur: "3.8s", delay: "0s" },
  { top: "14%", left: "82%", width: 36, height: 22, bg: "#C7A98B", rotate:  12, opacity: 0.50, dur: "4.4s", delay: "0.6s" },
  { top: "55%", left: "4%",  width: 28, height: 40, bg: "#8E9BB0", rotate:  -8, opacity: 0.35, dur: "5.1s", delay: "1.1s" },
  { top: "62%", left: "75%", width: 44, height: 28, bg: "#C58C82", rotate:  22, opacity: 0.45, dur: "4.8s", delay: "0.3s" },
  { top: "35%", left: "1%",  width: 22, height: 36, bg: "#A8A093", rotate: -25, opacity: 0.38, dur: "5.6s", delay: "0.9s" },
  { top: "78%", left: "12%", width: 38, height: 24, bg: "#7C8A76", rotate:  15, opacity: 0.40, dur: "4.2s", delay: "0.5s" },
];

function VoiceBars({ active }: { active: boolean }) {
  const count = active ? 9 : 7;
  const bars = Array.from({ length: count }, (_, i) => i);
  return (
    <div className="flex items-end gap-[3px] h-8">
      {bars.map((i) => (
        <div
          key={i}
          className="rounded-full"
          style={{
            width: "3.5px",
            height: active ? "26px" : "7px",
            backgroundColor: active ? "#E60023" : "#767676",
            animation: active
              ? `frkBar ${0.6 + i * 0.08}s ease-in-out ${i * 0.07}s infinite`
              : "none",
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

  useEffect(() => {
    if (captionIdx >= CAPTIONS.length - 1) {
      const t = setTimeout(() => router.push("/onboarding/landing"), 1400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCaptionIdx((i) => i + 1), 2700);
    return () => clearTimeout(t);
  }, [captionIdx, router]);

  return (
    <div className="relative flex flex-col items-center gap-8 pt-6 pb-8 min-h-[80vh] animate-[frkFade_0.4s_ease]">

      {/* Constellation background */}
      {CONSTELLATION.map((c, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: "absolute",
            top: c.top,
            left: c.left,
            width: c.width,
            height: c.height,
            background: c.bg,
            borderRadius: 12,
            opacity: c.opacity,
            transform: `rotate(${c.rotate}deg)`,
            animation: `frkFloat ${c.dur} ease-in-out ${c.delay} infinite`,
            zIndex: 0,
          }}
        />
      ))}

      {/* Avatar */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <MascotAvatar size="full" speaking={true} />
      </div>

      {/* Presence badge */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative", zIndex: 1 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", backgroundColor: "#008753", flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--color-frock-ink)" }}>
          Maya · your stylist
        </span>
      </div>

      {/* Caption */}
      <div
        className="text-center px-2"
        style={{
          fontFamily: "var(--font-serif)",
          fontSize: 27,
          fontWeight: 700,
          minHeight: 78,
          maxWidth: 300,
          color: "var(--color-frock-ink)",
          animation: "frkCap 0.32s ease",
          position: "relative",
          zIndex: 1,
        }}
        key={captionIdx}
      >
        {CAPTIONS[captionIdx]}
      </div>

      {/* Caption progress dots */}
      <div
        key={`dots-${captionIdx}`}
        className="flex items-center gap-2"
        style={{ position: "relative", zIndex: 1, animation: "frkCap 0.32s ease" }}
      >
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

      {/* Voice bars */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <VoiceBars active={true} />
      </div>
    </div>
  );
}
