"use client";

import { useState, useEffect } from "react";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "occasion" | "loading" | "result";

type StyleMePiece = {
  id: string;
  itemType: string;
  color?: string | null;
  imageUrl?: string | null;
  reason: string;
};

type StyleMeResult = {
  empty?: boolean;
  context?: { season: string; formality: string; timeOfDay: string; weatherNote?: string };
  outfits?: Array<{ pieces: StyleMePiece[]; score: number; summary: string }>;
  blazerNote?: string | null;
  footwearNote?: string | null;
  weddingColorNote?: string | null;
};

type GeoState = { lat: number; lon: number; city: string } | null;
type WeatherState = { tempMin: number; tempMax: number; description: string } | null;

// ── Weather helpers ───────────────────────────────────────────────────────────

const WMO_DESCRIPTIONS: [number, string][] = [
  [0,  "Clear sky"],   [3,  "Partly cloudy"], [48, "Foggy"],
  [57, "Drizzle"],     [67, "Rain"],           [77, "Snow"],
  [82, "Showers"],     [86, "Snow showers"],   [99, "Thunderstorms"],
];

function wmoToDescription(code: number): string {
  for (const [max, label] of [...WMO_DESCRIPTIONS].reverse()) {
    if (code >= max) return label;
  }
  return "Cloudy";
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a", white: "#f5f5f5", navy: "#1f3461", blue: "#4a7ab5",
  red: "#c0392b", pink: "#e8a0a8", green: "#4a7c59", olive: "#6b6b2a",
  brown: "#7b4f2e", tan: "#c4a882", beige: "#d4c5a9", cream: "#f0e8db",
  grey: "#8a8a8a", gray: "#8a8a8a", yellow: "#e8c840", orange: "#e8823a",
  purple: "#7b4fa0", burgundy: "#6b1f2a", camel: "#c4905a", khaki: "#b5a642",
  denim: "#3a4a6b", teal: "#2a7b7b", coral: "#e87060", lavender: "#b0a0d0",
  gold: "#c4a832", silver: "#a0a0a8", nude: "#d4b898", mint: "#90c8a8",
  mustard: "#c4942a", charcoal: "#3a3a3a", ivory: "#f0ece0",
};

function colorToHex(color?: string | null): string {
  if (!color) return "#E8DDD2";
  if (color.startsWith("#")) return color;
  return COLOR_HEX[color.toLowerCase()] ?? "#E8DDD2";
}

// ── Step heading ─────────────────────────────────────────────────────────────

function StepHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-10">
      <MascotAvatar size="badge" />
      <h1
        className="text-3xl text-frock-ink leading-tight"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {children}
      </h1>
    </div>
  );
}

// ── Piece card ────────────────────────────────────────────────────────────────

function PieceCard({ piece }: { piece: StyleMePiece }) {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-white"
      style={{ boxShadow: "0 1px 4px rgba(46,35,22,0.07), 0 4px 16px rgba(46,35,22,0.06)" }}
    >
      {piece.imageUrl ? (
        <img
          src={piece.imageUrl}
          alt={piece.itemType}
          className="w-full object-cover"
          style={{ height: 200 }}
        />
      ) : (
        <div style={{ height: 200, background: colorToHex(piece.color) }} />
      )}
      <div className="px-4 py-3">
        <p className="text-sm font-semibold text-frock-ink">{piece.itemType}</p>
        {piece.color && (
          <p className="text-xs text-frock-muted mt-0.5 capitalize">{piece.color}</p>
        )}
        <p className="text-xs text-frock-muted mt-2 leading-relaxed line-clamp-3">
          {piece.reason}
        </p>
      </div>
    </div>
  );
}

// ── Note pill ─────────────────────────────────────────────────────────────────

function NotePill({ text, icon }: { text: string; icon: string }) {
  return (
    <div
      className="flex gap-3 rounded-2xl px-4 py-3"
      style={{ background: "#FDF6F0", border: "1px solid rgba(214,64,43,0.15)" }}
    >
      <span className="text-base shrink-0">{icon}</span>
      <p className="text-sm text-frock-ink leading-relaxed">{text}</p>
    </div>
  );
}

// ── Confidence bar ────────────────────────────────────────────────────────────

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round((Math.min(10, Math.max(0, score)) / 10) * 100);
  const label =
    pct >= 80 ? "Strong match" : pct >= 60 ? "Good match" : "Partial match";
  return (
    <div className="flex items-center gap-2.5">
      <div
        className="flex-1 h-1 rounded-full overflow-hidden"
        style={{ background: "rgba(32,27,21,0.09)" }}
      >
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 80 ? "#D6402B" : pct >= 60 ? "#C4942A" : "#8C8375",
          }}
        />
      </div>
      <span className="text-xs text-frock-muted shrink-0 tabular-nums">
        {score}/10
      </span>
      <span
        className="text-xs shrink-0"
        style={{
          color: pct >= 80 ? "#D6402B" : pct >= 60 ? "#C4942A" : "#8C8375",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// ── Hint tags ─────────────────────────────────────────────────────────────────

const HINT_TAGS = [
  "Location",
  "Type of event",
  "Indoors or outdoors",
  "Day & time of day",
  "How you want to feel",
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function StyleMePage() {
  const [step, setStep]               = useState<Step>("occasion");
  const [contextText, setContextText] = useState("");
  const [result, setResult]           = useState<StyleMeResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [geo, setGeo]                 = useState<GeoState>(null);
  const [weather, setWeather]         = useState<WeatherState>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [isRefining, setIsRefining]   = useState(false);
  const [suggestionHistory, setSuggestionHistory] = useState<string[]>([]);
  const [outfitIndex, setOutfitIndex]             = useState(0);

  // Request location silently on mount; reverse-geocode for city name
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const r = await fetch(
          `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
          { headers: { "User-Agent": "WardrobeCollective/1.0" } }
        );
        const d = await r.json();
        const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || "";
        setGeo({ lat, lon, city });
      } catch {
        setGeo({ lat, lon, city: "" });
      }
    }, () => { /* denied — weather just won't show */ });
  }, []);

  const canSubmit = contextText.trim() !== "";

  async function submitWithDailyContext() {
    setStep("loading");
    setError(null);

    try {
      const [data] = await Promise.all([
        fetch("/api/style-me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            freeText: contextText.trim(),
            location: geo ? { lat: geo.lat, lon: geo.lon, city: geo.city } : undefined,
          }),
        }).then((r) => r.json() as Promise<StyleMeResult>),

        geo
          ? fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
              `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=7`
            )
              .then((r) => r.json())
              .then((w) => {
                const daily = w?.daily;
                const tMin = daily?.temperature_2m_min?.[0];
                const tMax = daily?.temperature_2m_max?.[0];
                const code = daily?.weathercode?.[0] ?? daily?.weather_code?.[0];
                if (tMin != null && tMax != null && !isNaN(tMin) && !isNaN(tMax)) {
                  setWeather({
                    tempMin: Math.round(tMin),
                    tempMax: Math.round(tMax),
                    description: code != null ? wmoToDescription(code) : "Weather unavailable",
                  });
                }
              })
              .catch(() => {})
          : Promise.resolve(),
      ]);

      const firstSummary = data.outfits?.[0]?.summary;
      if (firstSummary) setSuggestionHistory([firstSummary]);
      setOutfitIndex(0);
      setResult(data);
      setStep("result");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("occasion");
    }
  }

  function reset() {
    setStep("occasion");
    setContextText("");
    setResult(null);
    setError(null);
    setWeather(null);
    setFeedbackText("");
    setIsRefining(false);
    setSuggestionHistory([]);
    setOutfitIndex(0);
  }

  async function submitFeedback() {
    const text = feedbackText.trim();
    if (!text || isRefining) return;
    setIsRefining(true);
    setFeedbackText("");

    try {
      const data = await fetch("/api/style-me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          freeText: contextText.trim(),
          location: geo ? { lat: geo.lat, lon: geo.lon, city: geo.city } : undefined,
          feedback: text,
          previousSuggestion: suggestionHistory.length > 0 ? { summaries: suggestionHistory } : undefined,
        }),
      }).then((r) => r.json() as Promise<StyleMeResult>);

      const newSummary = data.outfits?.[0]?.summary;
      if (newSummary) setSuggestionHistory((h) => [...h, newSummary]);
      setOutfitIndex(0);
      setResult(data);
    } catch {
      setFeedbackText(text);
    } finally {
      setIsRefining(false);
    }
  }

  // ── Renders ─────────────────────────────────────────────────────────────────

  if (step === "occasion") {
    return (
      <div className="max-w-xl animate-[frkFade_0.3s_ease]">
        <StepHeading>Plan your look</StepHeading>

        <textarea
          autoFocus
          rows={6}
          value={contextText}
          onChange={(e) => setContextText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && canSubmit) {
              e.preventDefault();
              submitWithDailyContext();
            }
          }}
          placeholder="Describe your event — the more detail, the better the outfit."
          className="w-full rounded-2xl px-5 py-4 text-sm text-frock-ink bg-white outline-none resize-none leading-relaxed"
          style={{ border: "1px solid rgba(32,27,21,0.12)" }}
        />

        <p className="text-xs text-frock-muted mt-3 mb-2">Include details like:</p>
        <div className="flex flex-wrap gap-2 mb-8">
          {HINT_TAGS.map((hint) => (
            <span
              key={hint}
              className="rounded-full px-3 py-1.5 text-xs text-frock-muted"
              style={{ background: "#F5EDE5", border: "1px solid rgba(32,27,21,0.07)" }}
            >
              {hint}
            </span>
          ))}
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: "#D6402B" }}>{error}</p>
        )}

        <button
          onClick={submitWithDailyContext}
          disabled={!canSubmit}
          className="rounded-full px-10 py-3.5 text-sm font-medium text-white transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{ background: "#D6402B" }}
        >
          Style me
        </button>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center gap-6 py-24 animate-[frkFade_0.3s_ease]">
        <MascotAvatar size="badge" />
        <p
          className="text-2xl text-frock-ink text-center"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          Checking your wardrobe…
        </p>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                background: "#D6402B",
                opacity: 0.4,
                animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
              }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── Result ──────────────────────────────────────────────────────────────────

  if (step === "result" && result) {
    if (result.empty) {
      return (
        <div className="flex flex-col items-center gap-4 py-24 text-center animate-[frkFade_0.3s_ease]">
          <MascotAvatar size="badge" />
          <p className="text-2xl text-frock-ink" style={{ fontFamily: "var(--font-serif)" }}>
            Your wardrobe is empty
          </p>
          <p className="text-sm text-frock-muted leading-relaxed max-w-xs">
            Add some items first and I&rsquo;ll be able to suggest an outfit.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-full px-8 py-3 text-sm font-medium text-frock-ink"
            style={{ border: "1px solid rgba(32,27,21,0.15)" }}
          >
            Go back
          </button>
        </div>
      );
    }

    const topOutfit = result.outfits?.[outfitIndex] ?? result.outfits?.[0];

    if (!topOutfit || topOutfit.pieces.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-24 text-center animate-[frkFade_0.3s_ease]">
          <MascotAvatar size="badge" />
          <p className="text-2xl text-frock-ink" style={{ fontFamily: "var(--font-serif)" }}>
            Not quite enough pieces yet
          </p>
          <p className="text-sm text-frock-muted leading-relaxed max-w-xs">
            Your wardrobe doesn&rsquo;t have enough items for this occasion. Add a few more and I&rsquo;ll be able to style you properly.
          </p>
          <button
            onClick={reset}
            className="mt-4 rounded-full px-8 py-3 text-sm font-medium text-frock-ink"
            style={{ border: "1px solid rgba(32,27,21,0.15)" }}
          >
            Try again
          </button>
        </div>
      );
    }

    const seasonDisplay = result.context?.season ?? "";
    const formality = result.context?.formality ?? "";
    const totalOutfits = result.outfits?.length ?? 1;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_3fr] gap-12 animate-[frkFade_0.3s_ease]">

        {/* ── Left panel: context + feedback ─────────────────────────── */}
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <MascotAvatar size="badge" />
              <h2
                className="text-2xl text-frock-ink leading-snug"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                Here&rsquo;s your look
              </h2>
            </div>

            {(result.context?.weatherNote || seasonDisplay) && (
              <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.14em" }}>
                {result.context?.weatherNote ?? `${seasonDisplay} · ${formality.replace("_", " ")}`}
              </p>
            )}

            {(geo?.city || weather) && (
              <div
                className="self-start flex items-center gap-2 rounded-full px-3 py-1.5"
                style={{ background: "#F5EDE5", border: "1px solid rgba(32,27,21,0.08)" }}
              >
                {geo?.city && (
                  <span className="text-xs text-frock-muted flex items-center gap-1">
                    <svg width="10" height="12" viewBox="0 0 10 12" fill="none">
                      <path d="M5 0C2.79 0 1 1.79 1 4c0 3 4 8 4 8s4-5 4-8c0-2.21-1.79-4-4-4zm0 5.5A1.5 1.5 0 1 1 5 2.5a1.5 1.5 0 0 1 0 3z" fill="#8C8375"/>
                    </svg>
                    {geo.city}
                  </span>
                )}
                {geo?.city && weather && <span className="text-frock-muted/40 text-xs">·</span>}
                {weather && (
                  <span className="text-xs text-frock-muted">
                    {weather.tempMin}–{weather.tempMax}°C · {weather.description}
                  </span>
                )}
              </div>
            )}
          </div>

          {totalOutfits === 1 && topOutfit.score != null && (
            <ConfidenceBar score={topOutfit.score} />
          )}

          {(result.blazerNote || result.footwearNote || result.weddingColorNote) && (
            <div className="flex flex-col gap-2">
              {result.weddingColorNote && <NotePill icon="🤍" text={result.weddingColorNote} />}
              {result.blazerNote && <NotePill icon="👔" text={result.blazerNote} />}
              {result.footwearNote && <NotePill icon="👟" text={result.footwearNote} />}
            </div>
          )}

          {totalOutfits > 1 && (
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOutfitIndex((i) => Math.max(0, i - 1))}
                  disabled={outfitIndex === 0}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-opacity disabled:opacity-25 hover:opacity-70"
                  style={{ background: "#F0E8DB", color: "#554C41" }}
                >
                  ←
                </button>
                <div className="flex gap-1.5">
                  {result.outfits!.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setOutfitIndex(i)}
                      className="rounded-full transition-all"
                      style={{
                        width: i === outfitIndex ? 20 : 7,
                        height: 7,
                        background: i === outfitIndex ? "#D6402B" : "rgba(32,27,21,0.15)",
                      }}
                    />
                  ))}
                </div>
                <button
                  onClick={() => setOutfitIndex((i) => Math.min(totalOutfits - 1, i + 1))}
                  disabled={outfitIndex === totalOutfits - 1}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm transition-opacity disabled:opacity-25 hover:opacity-70"
                  style={{ background: "#F0E8DB", color: "#554C41" }}
                >
                  →
                </button>
                <span className="text-xs text-frock-muted">
                  Look {outfitIndex + 1} of {totalOutfits}
                </span>
              </div>
              {topOutfit.summary && (
                <p className="text-xs text-frock-muted leading-relaxed italic">{topOutfit.summary}</p>
              )}
              {topOutfit.score != null && (
                <ConfidenceBar score={topOutfit.score} />
              )}
            </div>
          )}

          {/* Feedback chat */}
          <div className="flex flex-col gap-3 mt-auto pt-4">
            {isRefining ? (
              <div
                className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                style={{ background: "#F5EDE5", border: "1px solid rgba(214,64,43,0.12)" }}
              >
                <div className="flex gap-1 shrink-0">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: "#D6402B",
                        opacity: 0.5,
                        animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
                <p className="text-sm text-frock-muted">Finding something new…</p>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      submitFeedback();
                    }
                  }}
                  placeholder="Not quite right? Tell me what to change…"
                  className="flex-1 rounded-2xl px-4 py-3 text-sm text-frock-ink bg-white outline-none"
                  style={{ border: "1px solid rgba(32,27,21,0.12)" }}
                />
                <button
                  onClick={submitFeedback}
                  disabled={!feedbackText.trim()}
                  className="rounded-full px-4 text-sm font-medium text-white transition-opacity disabled:opacity-30"
                  style={{ background: "#D6402B", minWidth: 44 }}
                >
                  ↑
                </button>
              </div>
            )}

            <button
              onClick={reset}
              className="self-start text-sm text-frock-muted hover:text-frock-ink transition-colors"
            >
              ← Start over
            </button>
          </div>
        </div>

        {/* ── Right panel: outfit cards ───────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4 content-start">
          {topOutfit.pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      </div>
    );
  }

  return null;
}
