"use client";

import { useState, useEffect } from "react";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "occasion" | "when" | "venue" | "daily" | "loading" | "result";

type StyleMePiece = {
  id: string;
  itemType: string;
  color?: string | null;
  imageUrl?: string | null;
  reason: string;
};

type StyleMeResult = {
  empty?: boolean;
  context?: { season: string; formality: string; timeOfDay: string };
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

function occasionDayIndex(preset: string, date: string): number {
  if (preset === "tonight") return 0;
  if (preset === "tomorrow") return 1;
  if (preset === "this-weekend") {
    const day = new Date().getDay();
    const daysToSat = (6 - day + 7) % 7;
    return Math.min(daysToSat, 6);
  }
  if (date) {
    const diff = Math.round((new Date(date).getTime() - new Date().setHours(0, 0, 0, 0)) / 86400000);
    return Math.max(0, Math.min(6, diff));
  }
  return 0;
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

// ── Chip component ────────────────────────────────────────────────────────────

function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-4 py-2.5 text-sm font-medium transition-all active:scale-[0.97]"
      style={
        selected
          ? { background: "#D6402B", color: "#FFFFFF" }
          : {
              background: "#FFFFFF",
              color: "#201B15",
              border: "1px solid rgba(32,27,21,0.12)",
            }
      }
    >
      {label}
    </button>
  );
}

// ── Maya speech bubble ────────────────────────────────────────────────────────

function MayaBubble({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-4 mb-8">
      <MascotAvatar size="badge" />
      <p
        className="text-2xl text-frock-ink text-center leading-snug"
        style={{ fontFamily: "var(--font-serif)" }}
      >
        {children}
      </p>
    </div>
  );
}

// ── Piece card ────────────────────────────────────────────────────────────────

function PieceCard({ piece }: { piece: StyleMePiece }) {
  return (
    <div
      className="rounded-2xl overflow-hidden bg-white"
      style={{ boxShadow: "0 1px 3px rgba(46,35,22,0.08), 0 2px 8px rgba(46,35,22,0.06)" }}
    >
      {piece.imageUrl ? (
        <img
          src={piece.imageUrl}
          alt={piece.itemType}
          className="w-full object-cover"
          style={{ height: 120 }}
        />
      ) : (
        <div style={{ height: 120, background: colorToHex(piece.color) }} />
      )}
      <div className="px-3 py-2.5">
        <p className="text-sm font-semibold text-frock-ink truncate">{piece.itemType}</p>
        {piece.color && (
          <p className="text-xs text-frock-muted mt-0.5 truncate">{piece.color}</p>
        )}
        <p className="text-xs text-frock-muted mt-1.5 leading-relaxed line-clamp-2">
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

// ── Main page ─────────────────────────────────────────────────────────────────

const OCCASION_OPTIONS = [
  { label: "Work",    value: "work"    },
  { label: "Casual",  value: "casual"  },
  { label: "Dinner",  value: "dinner"  },
  { label: "Wedding", value: "wedding" },
  { label: "Party",   value: "party"   },
  { label: "Brunch",  value: "brunch"  },
];

const WHEN_PRESETS = [
  { label: "Tonight",      value: "tonight"      },
  { label: "Tomorrow",     value: "tomorrow"     },
  { label: "This weekend", value: "this-weekend" },
];

const VENUE_OPTIONS = [
  { label: "Indoors",     value: "indoors" as const },
  { label: "Outdoors",    value: "outdoors" as const },
  { label: "Mix of both", value: "mix" as const },
];

const DAILY_MOODS = ["Fresh & ready", "Low-effort", "Bold", "Confident", "Cozy"];

const OCCASION_LABELS: Record<string, string> = {
  work: "work", casual: "a casual day", dinner: "dinner",
  wedding: "a wedding", party: "a party", brunch: "brunch",
};

export default function StyleMePage() {
  const [step, setStep]               = useState<Step>("occasion");
  const [occasion, setOccasion]       = useState("");
  const [occasionText, setOccasionText] = useState("");
  const [showOther, setShowOther]     = useState(false);
  const [whenPreset, setWhenPreset]   = useState("");
  const [whenDate, setWhenDate]       = useState("");
  const [whenTime, setWhenTime]       = useState("afternoon");
  const [showCustomDate, setShowCustomDate] = useState(false);
  const [venue, setVenue]             = useState<"indoors" | "outdoors" | "mix">("indoors");
  const [pendingVenue, setPendingVenue] = useState<"indoors" | "outdoors" | "mix">("indoors");
  const [dailyMood, setDailyMood]     = useState("");
  const [dailyNote, setDailyNote]     = useState("");
  const [result, setResult]           = useState<StyleMeResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [geo, setGeo]                 = useState<GeoState>(null);
  const [weather, setWeather]         = useState<WeatherState>(null);

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

  // ── Step handlers ───────────────────────────────────────────────────────────

  function selectOccasion(value: string) {
    setOccasion(value);
    setShowOther(false);
    setStep("when");
  }

  function submitOther() {
    if (!occasionText.trim()) return;
    setOccasion(occasionText.trim());
    setStep("when");
  }

  function selectWhenPreset(value: string) {
    setWhenPreset(value);
    setShowCustomDate(false);
    setStep("venue");
  }

  function submitCustomDate() {
    if (!whenDate) return;
    setWhenPreset("");
    setStep("venue");
  }

  function selectVenue(value: "indoors" | "outdoors" | "mix") {
    setPendingVenue(value);
    setVenue(value);
    setStep("daily");
  }

  async function submitWithDailyContext() {
    setStep("loading");
    setError(null);

    const effectiveOccasion = occasion || occasionText;
    const when: { preset?: string; date?: string; time?: string } = {};
    if (whenPreset) when.preset = whenPreset;
    if (whenDate)   when.date   = whenDate;
    if (whenTime)   when.time   = whenTime;

    const dailyContext: { mood?: string; note?: string } = {};
    if (dailyMood) dailyContext.mood = dailyMood;
    if (dailyNote.trim()) dailyContext.note = dailyNote.trim();

    try {
      const [data] = await Promise.all([
        fetch("/api/style-me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occasion: effectiveOccasion,
            when,
            indoorOutdoor: pendingVenue,
            dailyContext: Object.keys(dailyContext).length > 0 ? dailyContext : undefined,
          }),
        }).then((r) => r.json() as Promise<StyleMeResult>),

        geo
          ? fetch(
              `https://api.open-meteo.com/v1/forecast?latitude=${geo.lat}&longitude=${geo.lon}` +
              `&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&forecast_days=7`
            )
              .then((r) => r.json())
              .then((w) => {
                const idx = occasionDayIndex(whenPreset, whenDate);
                const daily = w?.daily;
                const tMin = daily?.temperature_2m_min?.[idx];
                const tMax = daily?.temperature_2m_max?.[idx];
                const code = daily?.weathercode?.[idx] ?? daily?.weather_code?.[idx];
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

      setResult(data);
      setStep("result");
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("daily");
    }
  }

  function reset() {
    setStep("occasion");
    setOccasion("");
    setOccasionText("");
    setShowOther(false);
    setWhenPreset("");
    setWhenDate("");
    setWhenTime("afternoon");
    setShowCustomDate(false);
    setVenue("indoors");
    setPendingVenue("indoors");
    setDailyMood("");
    setDailyNote("");
    setResult(null);
    setError(null);
    setWeather(null);
  }

  // ── Renders ─────────────────────────────────────────────────────────────────

  if (step === "occasion") {
    return (
      <div className="flex flex-col animate-[frkFade_0.3s_ease]">
        <MayaBubble>What&rsquo;s the occasion?</MayaBubble>

        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {OCCASION_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              label={opt.label}
              selected={occasion === opt.value}
              onClick={() => selectOccasion(opt.value)}
            />
          ))}
        </div>

        {!showOther ? (
          <button
            onClick={() => setShowOther(true)}
            className="text-sm text-frock-muted text-center py-2 hover:text-frock-ink transition-colors"
          >
            + Other occasion
          </button>
        ) : (
          <div className="flex flex-col gap-2 mt-1">
            <input
              autoFocus
              value={occasionText}
              onChange={(e) => setOccasionText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitOther()}
              placeholder="e.g. Job interview, Birthday dinner…"
              className="rounded-2xl px-4 py-3 text-sm text-frock-ink outline-none bg-white"
              style={{ border: "1px solid rgba(32,27,21,0.15)" }}
            />
            <button
              onClick={submitOther}
              disabled={!occasionText.trim()}
              className="rounded-full py-3 text-sm font-medium text-white transition-opacity disabled:opacity-40"
              style={{ background: "#D6402B" }}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    );
  }

  if (step === "when") {
    return (
      <div className="flex flex-col animate-[frkFade_0.3s_ease]">
        <MayaBubble>When is it?</MayaBubble>

        <div className="flex flex-col gap-2.5 mb-4">
          {WHEN_PRESETS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectWhenPreset(opt.value)}
              className="rounded-2xl px-5 py-4 text-sm font-medium text-left transition-all active:scale-[0.98] bg-white"
              style={{ border: "1px solid rgba(32,27,21,0.12)" }}
            >
              {opt.label}
            </button>
          ))}

          {!showCustomDate ? (
            <button
              onClick={() => setShowCustomDate(true)}
              className="rounded-2xl px-5 py-4 text-sm font-medium text-left text-frock-muted transition-all bg-white"
              style={{ border: "1px solid rgba(32,27,21,0.08)" }}
            >
              Another time…
            </button>
          ) : (
            <div
              className="rounded-2xl px-4 py-3 bg-white flex flex-col gap-3"
              style={{ border: "1px solid rgba(32,27,21,0.12)" }}
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
                  Date
                </label>
                <input
                  type="date"
                  value={whenDate}
                  onChange={(e) => setWhenDate(e.target.value)}
                  className="text-sm text-frock-ink bg-transparent outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
                  Time of day
                </label>
                <div className="flex gap-2">
                  {(["morning", "afternoon", "evening"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setWhenTime(t)}
                      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all capitalize"
                      style={
                        whenTime === t
                          ? { background: "#D6402B", color: "#fff" }
                          : { background: "#F0E8DB", color: "#554C41" }
                      }
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={submitCustomDate}
                disabled={!whenDate}
                className="rounded-full py-3 text-sm font-medium text-white transition-opacity disabled:opacity-40"
                style={{ background: "#D6402B" }}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (step === "venue") {
    return (
      <div className="flex flex-col animate-[frkFade_0.3s_ease]">
        <MayaBubble>Indoors or outdoors?</MayaBubble>

        <div className="flex flex-col gap-2.5">
          {VENUE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => selectVenue(opt.value)}
              className="rounded-2xl px-5 py-5 text-base font-medium text-left transition-all active:scale-[0.98] bg-white"
              style={{ border: "1px solid rgba(32,27,21,0.12)" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (step === "daily") {
    return (
      <div className="flex flex-col animate-[frkFade_0.3s_ease]">
        <MayaBubble>Anything to know before I style you?</MayaBubble>

        {error && (
          <p className="text-sm text-center mb-4" style={{ color: "#D6402B" }}>{error}</p>
        )}

        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
              How are you feeling today?
            </p>
            <div className="flex flex-wrap gap-2">
              {DAILY_MOODS.map((mood) => (
                <Chip
                  key={mood}
                  label={mood}
                  selected={dailyMood === mood}
                  onClick={() => setDailyMood(dailyMood === mood ? "" : mood)}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.12em" }}>
              Agenda or constraints
            </p>
            <textarea
              rows={3}
              value={dailyNote}
              onChange={(e) => setDailyNote(e.target.value)}
              placeholder="e.g. board meeting at 2pm, grey blazer in the wash, need the navy shoes…"
              className="rounded-2xl px-4 py-3 text-sm text-frock-ink bg-white outline-none resize-none leading-relaxed"
              style={{ border: "1px solid rgba(32,27,21,0.12)" }}
            />
          </div>

          <button
            onClick={submitWithDailyContext}
            className="w-full rounded-full py-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: "#D6402B" }}
          >
            Style me
          </button>

          <button
            onClick={submitWithDailyContext}
            className="text-sm text-frock-muted text-center py-1 hover:text-frock-ink transition-colors"
          >
            Skip
          </button>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="flex flex-col items-center gap-6 py-16 animate-[frkFade_0.3s_ease]">
        <MascotAvatar size="badge" />
        <p
          className="text-xl text-frock-ink text-center"
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
        <div className="flex flex-col items-center gap-4 py-16 text-center animate-[frkFade_0.3s_ease]">
          <MascotAvatar size="badge" />
          <p className="text-xl text-frock-ink" style={{ fontFamily: "var(--font-serif)" }}>
            Your wardrobe is empty
          </p>
          <p className="text-sm text-frock-muted leading-relaxed">
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

    const topOutfit = result.outfits?.[0];

    if (!topOutfit || topOutfit.pieces.length === 0) {
      return (
        <div className="flex flex-col items-center gap-4 py-16 text-center animate-[frkFade_0.3s_ease]">
          <MascotAvatar size="badge" />
          <p className="text-xl text-frock-ink" style={{ fontFamily: "var(--font-serif)" }}>
            Not quite enough pieces yet
          </p>
          <p className="text-sm text-frock-muted leading-relaxed">
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

    const occasionDisplay = OCCASION_LABELS[occasion] ?? occasion;
    const seasonDisplay = result.context?.season ?? "";
    const formality = result.context?.formality ?? "";
    const altCount = (result.outfits?.length ?? 1) - 1;

    return (
      <div className="flex flex-col gap-5 animate-[frkFade_0.3s_ease]">
        <div className="flex flex-col items-center gap-3 text-center">
          <MascotAvatar size="badge" />
          <h2
            className="text-2xl text-frock-ink leading-snug"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            Here&rsquo;s your look for {occasionDisplay}
          </h2>
          {seasonDisplay && (
            <p className="text-xs uppercase tracking-widest text-frock-muted" style={{ letterSpacing: "0.14em" }}>
              {seasonDisplay} · {formality.replace("_", " ")}
            </p>
          )}

          {(geo?.city || weather) && (
            <div
              className="flex items-center gap-2 rounded-full px-3 py-1.5"
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

        <div className="grid grid-cols-2 gap-3">
          {topOutfit.pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>

        {(result.blazerNote || result.footwearNote || result.weddingColorNote) && (
          <div className="flex flex-col gap-2">
            {result.weddingColorNote && <NotePill icon="🤍" text={result.weddingColorNote} />}
            {result.blazerNote && <NotePill icon="👔" text={result.blazerNote} />}
            {result.footwearNote && <NotePill icon="👟" text={result.footwearNote} />}
          </div>
        )}

        {altCount > 0 && (
          <p className="text-xs text-frock-muted text-center leading-relaxed">
            I also found {altCount} other combination{altCount > 1 ? "s" : ""} from your wardrobe if you want to see them.
          </p>
        )}

        <button
          onClick={reset}
          className="rounded-full py-4 text-sm font-medium text-frock-ink transition-opacity hover:opacity-80"
          style={{ border: "1px solid rgba(32,27,21,0.15)" }}
        >
          Style me again
        </button>
      </div>
    );
  }

  return null;
}
