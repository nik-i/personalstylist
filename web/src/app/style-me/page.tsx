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
};

type GeoState = { lat: number; lon: number; city: string } | null;
type WeatherState = { tempMin: number; tempMax: number; description: string } | null;
type SaveState = "idle" | "saving" | "saved" | "error";

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

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

// ── Color helpers ─────────────────────────────────────────────────────────────

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

// ── Reasoning step UI ─────────────────────────────────────────────────────────

function StepRow({ text, active }: { text: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3 animate-[frkFade_0.25s_ease]">
      {active ? (
        <span
          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
          style={{ background: "#D6402B" }}
        >
          <span
            className="w-2 h-2 rounded-full bg-white"
            style={{ animation: "frkPulse 1.2s ease-in-out infinite" }}
          />
        </span>
      ) : (
        <span
          className="w-5 h-5 rounded-full shrink-0 flex items-center justify-center"
          style={{ background: "#E3EDE4" }}
        >
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4l2.5 2.5L9 1" stroke="#4F7B58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <p className={`text-sm ${active ? "text-frock-ink font-medium" : "text-frock-muted"}`}>{text}</p>
    </div>
  );
}

function CompactStepRow({ text, active }: { text: string; active: boolean }) {
  return (
    <div className="flex items-center gap-2 animate-[frkFade_0.25s_ease]">
      {active ? (
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center"
          style={{ background: "#D6402B" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-white"
            style={{ animation: "frkPulse 1.2s ease-in-out infinite" }}
          />
        </span>
      ) : (
        <span
          className="w-3.5 h-3.5 rounded-full shrink-0 flex items-center justify-center"
          style={{ background: "#E3EDE4" }}
        >
          <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
            <path d="M1 3l1.8 1.8 4-3.8" stroke="#4F7B58" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      )}
      <span className={`text-xs ${active ? "text-frock-ink font-medium" : "text-frock-muted"}`}>{text}</span>
    </div>
  );
}

// ── SSE fetch helper ──────────────────────────────────────────────────────────

async function fetchStyleMeSSE(
  body: object,
  onStep: (text: string) => void
): Promise<StyleMeResult> {
  const res = await fetch("/api/style-me", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let data: StyleMeResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      let ev: { type: string; text?: string; data?: StyleMeResult; message?: string };
      try { ev = JSON.parse(line.slice(6)); } catch { continue; }
      if (ev.type === "step" && ev.text) onStep(ev.text);
      else if (ev.type === "result" && ev.data) data = ev.data;
      else if (ev.type === "error") throw new Error(ev.message ?? "Stylist error");
    }
  }

  if (!data) throw new Error("No result received");
  return data;
}

// ── Other helpers ─────────────────────────────────────────────────────────────

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

function GarmentImage({ piece }: { piece: StyleMePiece }) {
  if (piece.imageUrl) {
    return (
      <img
        src={piece.imageUrl}
        alt={piece.itemType}
        className="rounded-2xl block mx-auto"
        style={{ maxHeight: 300, width: "auto" }}
      />
    );
  }
  return (
    <div
      className="rounded-2xl"
      style={{ height: 300, background: colorToHex(piece.color) }}
    />
  );
}

function ScoreRing({ score }: { score: number }) {
  const pct = Math.min(10, Math.max(0, score)) / 10;
  const r = 22;
  const size = 58;
  const cx = size / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);
  const color = pct >= 0.8 ? "#D6402B" : pct >= 0.6 ? "#C4942A" : "#8C8375";
  const label = pct >= 0.8 ? "Strong match" : pct >= 0.6 ? "Good match" : "Partial match";

  return (
    <div className="flex items-center gap-3">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cx} r={r} fill="none" stroke="rgba(32,27,21,0.08)" strokeWidth={5} />
          <circle
            cx={cx} cy={cx} r={r} fill="none"
            stroke={color} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold tabular-nums" style={{ color }}>{score}</span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-medium" style={{ color }}>{label}</span>
        <span className="text-xs text-frock-muted">out of 10</span>
      </div>
    </div>
  );
}

const HINT_TAGS = [
  "Place / venue",
  "Date & time",
  "Type of event",
  "Indoors or outdoors",
  "How you want to feel",
];

// ── Session persistence ───────────────────────────────────────────────────────

const STYLE_ME_STORAGE_KEY = "style-me-result-state";

type PersistedStyleMeState = {
  contextText: string;
  result: StyleMeResult;
  weather: WeatherState;
  suggestionHistory: string[];
  outfitIndex: number;
  saveState: SaveState;
  saveDate: string;
};

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
  const [saveState, setSaveState]     = useState<SaveState>("idle");
  const [saveDate, setSaveDate]       = useState(todayStr);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [refineSteps, setRefineSteps]       = useState<string[]>([]);

  // Restore result state if the user navigated away and came back
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STYLE_ME_STORAGE_KEY);
      if (!raw) return;
      const saved: PersistedStyleMeState = JSON.parse(raw);
      if (saved.result) {
        setContextText(saved.contextText ?? "");
        setResult(saved.result);
        setWeather(saved.weather ?? null);
        setSuggestionHistory(saved.suggestionHistory ?? []);
        setOutfitIndex(saved.outfitIndex ?? 0);
        setSaveState(saved.saveState === "saving" ? "idle" : (saved.saveState ?? "idle"));
        setSaveDate(saved.saveDate ?? todayStr());
        setStep("result");
      }
    } catch { /* ignore corrupted storage */ }
  }, []);

  // Persist to sessionStorage whenever the result view changes
  useEffect(() => {
    if (step !== "result" || !result) return;
    try {
      const state: PersistedStyleMeState = {
        contextText, result, weather, suggestionHistory, outfitIndex,
        saveState: saveState === "saving" ? "idle" : saveState,
        saveDate,
      };
      sessionStorage.setItem(STYLE_ME_STORAGE_KEY, JSON.stringify(state));
    } catch { /* ignore quota errors */ }
  }, [step, result, contextText, weather, suggestionHistory, outfitIndex, saveState, saveDate]);

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
    }, () => { /* denied */ });
  }, []);

  const canSubmit = contextText.trim() !== "";

  async function submitWithDailyContext() {
    setStep("loading");
    setReasoningSteps([]);
    setError(null);

    // Fetch weather concurrently while the agent streams
    const weatherPromise = geo
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
      : Promise.resolve();

    try {
      const data = await fetchStyleMeSSE(
        {
          freeText: contextText.trim(),
          location: geo ? { lat: geo.lat, lon: geo.lon, city: geo.city } : undefined,
        },
        (text) => setReasoningSteps((s) => [...s, text])
      );
      await weatherPromise;
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
    try { sessionStorage.removeItem(STYLE_ME_STORAGE_KEY); } catch { /* ignore */ }
    setStep("occasion");
    setContextText("");
    setResult(null);
    setError(null);
    setWeather(null);
    setFeedbackText("");
    setIsRefining(false);
    setSuggestionHistory([]);
    setOutfitIndex(0);
    setSaveState("idle");
    setSaveDate(todayStr());
    setReasoningSteps([]);
    setRefineSteps([]);
  }

  async function saveLook(pieces: StyleMePiece[]) {
    if (saveState === "saving" || saveState === "saved") return;
    setSaveState("saving");
    try {
      const res = await fetch("/api/looks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: saveDate,
          pieceIds: pieces.map((p) => p.id),
          occasion: contextText.trim().slice(0, 120) || null,
          note: null,
        }),
      });
      setSaveState(res.ok ? "saved" : "error");
    } catch {
      setSaveState("error");
    }
  }

  async function submitFeedback() {
    const text = feedbackText.trim();
    if (!text || isRefining) return;
    setIsRefining(true);
    setFeedbackText("");
    setRefineSteps([]);

    try {
      const data = await fetchStyleMeSSE(
        {
          freeText: contextText.trim(),
          location: geo ? { lat: geo.lat, lon: geo.lon, city: geo.city } : undefined,
          feedback: text,
          previousSuggestion: suggestionHistory.length > 0 ? { summaries: suggestionHistory } : undefined,
        },
        (stepText) => setRefineSteps((s) => [...s, stepText])
      );
      const newSummary = data.outfits?.[0]?.summary;
      if (newSummary) setSuggestionHistory((h) => [...h, newSummary]);
      setOutfitIndex(0);
      setResult(data);
    } catch {
      setFeedbackText(text);
    } finally {
      setIsRefining(false);
      setRefineSteps([]);
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
          placeholder="Where are you going, when, and what's the vibe? e.g. 'rooftop drinks in the city tomorrow evening, smart-casual'"
          className="w-full rounded-2xl px-5 py-4 text-sm text-frock-ink bg-white outline-none resize-none leading-relaxed"
          style={{ border: "1px solid rgba(32,27,21,0.12)" }}
        />

        {/* Location context — shows what the system will use and nudges specificity */}
        <div className="flex items-start gap-1.5 mt-2.5 mb-4">
          <svg width="9" height="11" viewBox="0 0 9 11" fill="none" className="shrink-0 mt-0.5">
            <path d="M4.5 0C2.29 0 .5 1.79.5 4c0 3 4 7 4 7s4-4 4-7c0-2.21-1.79-4-4-4zm0 5.5A1.5 1.5 0 1 1 4.5 2.5a1.5 1.5 0 0 1 0 3z" fill="#8C8375"/>
          </svg>
          <p className="text-xs text-frock-muted leading-relaxed">
            {geo?.city
              ? <>Using <span className="font-medium" style={{ color: "#554C41" }}>{geo.city}</span> and today&rsquo;s weather by default — mention a specific place or date in your description for a more accurate suggestion.</>
              : <>Add a place and date in your description — the system will match the weather and occasion more precisely.</>
            }
          </p>
        </div>

        <p className="text-xs text-frock-muted mb-2">Include details like:</p>
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

  // ── Loading with live reasoning steps ────────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="flex flex-col gap-8 py-16 animate-[frkFade_0.3s_ease]">
        <div className="flex items-center gap-3">
          <MascotAvatar size="badge" />
          <p className="text-2xl text-frock-ink" style={{ fontFamily: "var(--font-serif)" }}>
            Styling you now
          </p>
        </div>
        <div className="flex flex-col gap-3 max-w-xs">
          {reasoningSteps.length === 0 ? (
            <StepRow text="Getting started…" active />
          ) : (
            reasoningSteps.map((text, i) => (
              <StepRow key={i} text={text} active={i === reasoningSteps.length - 1} />
            ))
          )}
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
    const piecesWithImages = topOutfit.pieces.filter((p) => p.imageUrl);
    const imagesToShow = piecesWithImages.length > 0 ? piecesWithImages : topOutfit.pieces.slice(0, 1);

    const NavArrow = ({ dir, onClick, disabled }: { dir: "left" | "right"; onClick: () => void; disabled: boolean }) => (
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-all disabled:opacity-25 hover:opacity-80 active:scale-95 shrink-0"
        style={{ background: "#EDE4DA", border: "1.5px solid rgba(32,27,21,0.18)", boxShadow: "0 1px 4px rgba(32,27,21,0.10)", color: "#554C41" }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          {dir === "left"
            ? <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
            : <path d="M5 2L10 7L5 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
          }
        </svg>
      </button>
    );

    return (
      <div className="flex flex-col gap-5 animate-[frkFade_0.3s_ease]">

        {/* Header */}
        <div className="flex flex-col gap-2">
          {(geo?.city || weather) && (
            <div className="self-start flex items-center gap-2 rounded-full px-3 py-1.5" style={{ background: "#F5EDE5", border: "1px solid rgba(32,27,21,0.08)" }}>
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
                <span className="text-xs text-frock-muted">{weather.tempMin}–{weather.tempMax}°C · {weather.description}</span>
              )}
            </div>
          )}
          <div className="flex items-center gap-3">
            <MascotAvatar size="badge" />
            <h2 className="text-2xl text-frock-ink leading-snug" style={{ fontFamily: "var(--font-serif)" }}>
              Here&rsquo;s your look
            </h2>
          </div>
          {(result.context?.weatherNote || seasonDisplay) && (
            <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.14em" }}>
              {result.context?.weatherNote ?? `${seasonDisplay} · ${formality.replace("_", " ")}`}
            </p>
          )}
        </div>

        {/* Two-column body */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

          {/* Left: images + nav */}
          <div className="flex flex-col gap-4">
            <div className={`grid gap-3 ${imagesToShow.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
              {imagesToShow.map((piece) => (
                <GarmentImage key={piece.id} piece={piece} />
              ))}
            </div>

            <div className="flex items-center gap-3">
              <NavArrow
                dir="left"
                onClick={() => { setOutfitIndex((i) => Math.max(0, i - 1)); setSaveState("idle"); }}
                disabled={totalOutfits <= 1 || outfitIndex === 0}
              />
              <div className="flex-1 flex items-center justify-center gap-2">
                {totalOutfits > 1 && (
                  <>
                    <div className="flex gap-1.5">
                      {result.outfits!.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setOutfitIndex(i)}
                          className="rounded-full transition-all"
                          style={{ width: i === outfitIndex ? 20 : 7, height: 7, background: i === outfitIndex ? "#D6402B" : "rgba(32,27,21,0.15)" }}
                        />
                      ))}
                    </div>
                    <span className="text-xs text-frock-muted">Look {outfitIndex + 1} of {totalOutfits}</span>
                  </>
                )}
              </div>
              <NavArrow
                dir="right"
                onClick={() => { setOutfitIndex((i) => Math.min(totalOutfits - 1, i + 1)); setSaveState("idle"); }}
                disabled={totalOutfits <= 1 || outfitIndex === totalOutfits - 1}
              />
              {topOutfit.score != null && (
                <div className="ml-1 pl-3" style={{ borderLeft: "1px solid rgba(32,27,21,0.10)" }}>
                  <ScoreRing score={topOutfit.score} />
                </div>
              )}
            </div>

            {topOutfit.summary && (
              <p className="text-xs text-frock-muted leading-relaxed italic">{topOutfit.summary}</p>
            )}
          </div>

          {/* Right: piece cards + actions */}
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {topOutfit.pieces.map((piece) => (
                <div key={piece.id} className="rounded-2xl px-4 py-3 bg-white" style={{ boxShadow: "0 1px 4px rgba(46,35,22,0.07)" }}>
                  <p className="text-sm font-semibold text-frock-ink">{piece.itemType}</p>
                  {piece.color && <p className="text-xs text-frock-muted mt-0.5 capitalize">{piece.color}</p>}
                  <p className="text-xs text-frock-muted mt-2 leading-relaxed">{piece.reason}</p>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-3 mt-auto pt-2">

              {/* Feedback / refine */}
              {isRefining ? (
                <div
                  className="rounded-2xl px-4 py-4"
                  style={{ background: "#F5EDE5", border: "1px solid rgba(214,64,43,0.12)" }}
                >
                  <p className="text-xs text-frock-muted mb-3 font-medium uppercase tracking-wider" style={{ letterSpacing: "0.1em" }}>
                    Refining your look
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {refineSteps.length === 0 ? (
                      <CompactStepRow text="Getting started…" active />
                    ) : (
                      refineSteps.map((text, i) => (
                        <CompactStepRow key={i} text={text} active={i === refineSteps.length - 1} />
                      ))
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitFeedback(); } }}
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

              {/* Save look */}
              {saveState === "saved" ? (
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
                  style={{ background: "#F0FBF4", border: "1px solid rgba(52,168,83,0.25)" }}
                >
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="shrink-0">
                    <circle cx="9" cy="9" r="8" fill="#34A853" />
                    <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium" style={{ color: "#1a5c2e" }}>Saved to your looks!</p>
                    <p className="text-xs" style={{ color: "#4a8a5e" }}>
                      Logged for {new Date(saveDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <a
                    href="/onboarding/landing?tab=my-looks"
                    className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: "#34A853", color: "#fff" }}
                  >
                    View calendar →
                  </a>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 rounded-2xl px-4 py-3"
                  style={{ background: "#F8F3EB", border: "1px solid rgba(32,27,21,0.10)" }}
                >
                  <span className="text-xs text-frock-muted shrink-0">Wear on</span>
                  <input
                    type="date"
                    value={saveDate}
                    onChange={(e) => { setSaveDate(e.target.value); setSaveState("idle"); }}
                    className="text-xs rounded-lg px-2 py-1 outline-none"
                    style={{ border: "1px solid rgba(32,27,21,0.14)", background: "#fff", color: "#201B15" }}
                  />
                  <button
                    onClick={() => saveLook(topOutfit.pieces)}
                    disabled={saveState === "saving"}
                    className="ml-auto shrink-0 rounded-full px-4 py-2 text-xs font-semibold text-white transition-opacity disabled:opacity-50 hover:opacity-90"
                    style={{ background: "#201B15" }}
                  >
                    {saveState === "saving" ? "Saving…" : saveState === "error" ? "Try again" : "I'll wear this"}
                  </button>
                </div>
              )}

              <button onClick={reset} className="self-start text-sm text-frock-muted hover:text-frock-ink transition-colors">
                ← Start over
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
