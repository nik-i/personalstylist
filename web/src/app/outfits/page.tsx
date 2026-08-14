"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

const COLOR_HEX: Record<string, string> = {
  black: "#1C1C1C", white: "#F9F6F2", navy: "#1B2A4A", beige: "#D9C9A8",
  cream: "#F5EDD9", brown: "#7B4F2E", camel: "#C19A6B", tan: "#C9A96E",
  grey: "#9E9E9E", gray: "#9E9E9E", charcoal: "#4A4A4A", slate: "#6B7280",
  red: "#C0392B", burgundy: "#7B1A2B", wine: "#6B2035", rust: "#B94B2C",
  pink: "#E8A0B0", blush: "#F2D0C4", rose: "#E8A0B0", coral: "#E87B6B",
  orange: "#D4722A", yellow: "#E8C850", gold: "#C5A028", mustard: "#C5821A",
  green: "#4A7C59", olive: "#6B7345", sage: "#8FAF8A", mint: "#A8D5B0",
  blue: "#4169A0", cobalt: "#2147A0", teal: "#2A8080", turquoise: "#40B0A0",
  purple: "#7B5EA7", lavender: "#B0A0C8", lilac: "#C8A8D0", plum: "#5B2A5B",
  ivory: "#F5EDD9", chocolate: "#5C3317", khaki: "#C3B091", denim: "#4A7090",
};

function colorToHex(color?: string) {
  if (!color) return "#F0E8DB";
  if (color.startsWith("#")) return color;
  return COLOR_HEX[color.toLowerCase()] ?? "#F0E8DB";
}

type WardrobeItem = { id: string; itemType: string; color?: string };
type OutfitItem = { wardrobeItem: WardrobeItem };
type GapAnalysis = { gap?: { description?: string } } | null;
type Suggestion = {
  id: string;
  vibeNote?: string;
  createdAt: string;
  gapAnalysis: GapAnalysis;
  occasion?: { occasionType?: string; description?: string } | null;
  outfitItems: OutfitItem[];
};

export default function OutfitsPage() {
  const router = useRouter();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingDaily, setGeneratingDaily] = useState(false);
  const [dailyError, setDailyError] = useState("");

  const daily = suggestions.filter((s) => !s.occasion);
  const goalBased = suggestions.filter((s) => !!s.occasion);

  useEffect(() => {
    fetch("/api/outfits")
      .then((r) => r.json())
      .then((d) => Array.isArray(d) && setSuggestions(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function generateDaily() {
    setGeneratingDaily(true);
    setDailyError("");
    try {
      const res = await fetch("/api/outfits/daily", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setDailyError("Couldn't generate outfits. Try again.");
        return;
      }
      if (Array.isArray(data.suggestions)) {
        setSuggestions((prev) => [...data.suggestions, ...prev]);
      }
    } catch {
      setDailyError("Something went wrong. Try again.");
    } finally {
      setGeneratingDaily(false);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-5 py-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 rounded-2xl animate-pulse bg-frock-cream-2" />
        ))}
      </div>
    );
  }

  const isEmpty = suggestions.length === 0;

  if (isEmpty) {
    return (
      <div className="flex flex-col gap-6 py-2">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            My looks
          </h1>
        </div>
        <div className="flex flex-col items-center gap-5 py-16 text-center">
          <MascotAvatar size="mini" />
          <div className="flex flex-col gap-1">
            <p className="text-xl text-frock-ink" style={{ fontFamily: "var(--font-serif)" }}>Nothing here yet</p>
            <p className="text-sm text-frock-muted">Get personalised advice based on your wardrobe</p>
          </div>
          <Link
            href="/outfits/new"
            className="w-full rounded-full py-4 font-medium text-base text-white text-center block transition-opacity hover:opacity-90"
            style={{ background: "#D6402B" }}
          >
            Get your first style recommendation →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-2">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          My looks
        </h1>
        <div className="flex items-center gap-2">
          <MascotAvatar size="badge" />
          <Link
            href="/outfits/new"
            className="text-sm font-medium px-3 py-1.5 rounded-full"
            style={{ background: "#D6402B", color: "#FFFFFF" }}
          >
            + New
          </Link>
        </div>
      </div>

      {/* Daily outfits section */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
          Today's outfits
        </p>
        {daily.length === 0 ? (
          <div className="flex flex-col gap-2">
            <button
              onClick={generateDaily}
              disabled={generatingDaily}
              className="w-full rounded-2xl py-4 text-sm font-medium transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-50"
              style={{ background: "#FFFFFF", border: "1.5px solid #D6402B", color: "#D6402B" }}
            >
              {generatingDaily ? "Building your outfits…" : "Get today's outfits →"}
            </button>
            {dailyError && <p className="text-xs text-center" style={{ color: "#D6402B" }}>{dailyError}</p>}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-1">
            {daily.map((s) => (
              <div
                key={s.id}
                className="flex-shrink-0 w-48 bg-white rounded-2xl p-3 flex flex-col gap-2"
                style={{ border: "1px solid rgba(32,27,21,0.08)" }}
              >
                <div className="flex gap-1">
                  {s.outfitItems.slice(0, 4).map(({ wardrobeItem }) => (
                    <div
                      key={wardrobeItem.id}
                      className="w-8 h-8 rounded-lg flex-shrink-0"
                      style={{ background: colorToHex(wardrobeItem.color), border: "1px solid rgba(0,0,0,0.06)" }}
                    />
                  ))}
                </div>
                <p className="text-xs font-medium text-frock-ink leading-tight">{s.vibeNote || "Outfit suggestion"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Divider */}
      {goalBased.length > 0 && (
        <div style={{ height: 1, background: "rgba(32,27,21,0.08)" }} />
      )}

      {/* Goal-based analyses */}
      {goalBased.length > 0 && (
        <div className="flex flex-col gap-3">
          <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
            Style advice
          </p>
          <div className="flex flex-col gap-2">
            {goalBased.map((s) => {
              const gapDesc = s.gapAnalysis?.gap?.description;
              const date = new Date(s.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
              return (
                <Link
                  key={s.id}
                  href={`/outfits/${s.id}`}
                  className="bg-white rounded-2xl p-4 flex gap-3 active:opacity-80"
                  style={{ border: "1px solid rgba(32,27,21,0.08)" }}
                >
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {s.occasion?.occasionType && (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full capitalize"
                          style={{ background: "#F5DCD3", color: "#D6402B" }}
                        >
                          {s.occasion.occasionType.replace(/-/g, " ")}
                        </span>
                      )}
                      <span className="text-xs text-frock-muted">{date}</span>
                    </div>
                    {s.occasion?.description && (
                      <p className="text-sm font-medium text-frock-ink truncate">{s.occasion.description}</p>
                    )}
                    {gapDesc && (
                      <p className="text-xs text-frock-muted leading-relaxed line-clamp-2">{gapDesc}</p>
                    )}
                  </div>
                  <svg className="flex-shrink-0 self-center text-frock-muted" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
