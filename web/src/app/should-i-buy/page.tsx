"use client";

import { useState, useRef } from "react";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = "form" | "loading" | "result";

type OwnedItem = {
  id: string;
  itemType: string;
  color?: string;
  note: string;
  imageUrl?: string | null;
};

type OutfitPiece = {
  id: string;
  itemType: string;
  color?: string;
  imageUrl?: string | null;
};

type EnabledOutfit = {
  pieces: OutfitPiece[];
  summary: string;
};

type ToolTrailEntry = {
  tool: string;
  argsSummary: string;
  durationMs: number;
};

type VerdictResult = {
  verdict: "buy" | "skip" | "buy_instead_consider_owned";
  confidence: number;
  reasoning: string;
  similarOwnedItems: OwnedItem[];
  outfitsItEnables: EnabledOutfit[];
  colorFitNote: string;
  versatilityScore: number;
  redFlags: string[];
  wearInsight?: string;
  toolTrail?: ToolTrailEntry[];
};

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

// ── Verdict config ────────────────────────────────────────────────────────────

const VERDICT_CONFIG = {
  buy: { bg: "#E3EDE4", border: "rgba(79,123,88,0.3)", text: "#4F7B58", label: "Buy it", icon: "✓" },
  skip: { bg: "#FDF0EF", border: "rgba(214,64,43,0.25)", text: "#D6402B", label: "Skip it", icon: "✕" },
  buy_instead_consider_owned: {
    bg: "#FDF7EC", border: "rgba(196,148,42,0.3)", text: "#C4942A",
    label: "You already own something like this", icon: "→",
  },
};

// ── Tool trail helpers ────────────────────────────────────────────────────────

function toolTrailLabel(tool: string): string {
  const labels: Record<string, string> = {
    fetch_product_page:   "Read product page",
    wardrobe_get_profile: "Checked style profile",
    search_garments:      "Searched your wardrobe",
    get_garment:          "Inspected a garment",
    get_groupings:        "Reviewed groupings",
    get_wear_history:     "Checked wear history",
    get_wear_stats:       "Reviewed wear patterns",
    buy_verdict:          "Formed verdict",
  };
  return labels[tool] ?? tool.replace(/_/g, " ");
}

// ── Reasoning step UI ─────────────────────────────────────────────────────────

function StepRow({ text, active }: { text: string; active: boolean }) {
  return (
    <div className="flex items-center gap-3 animate-[frkFade_0.25s_ease]">
      {active ? (
        <span
          className="w-5 h-5 rounded-none shrink-0 flex items-center justify-center"
          style={{ background: "#D6402B" }}
        >
          <span
            className="w-2 h-2 rounded-none bg-white"
            style={{ animation: "frkPulse 1.2s ease-in-out infinite" }}
          />
        </span>
      ) : (
        <span
          className="w-5 h-5 rounded-none shrink-0 flex items-center justify-center"
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
          className="w-3.5 h-3.5 rounded-none shrink-0 flex items-center justify-center"
          style={{ background: "#D6402B" }}
        >
          <span
            className="w-1.5 h-1.5 rounded-none bg-white"
            style={{ animation: "frkPulse 1.2s ease-in-out infinite" }}
          />
        </span>
      ) : (
        <span
          className="w-3.5 h-3.5 rounded-none shrink-0 flex items-center justify-center"
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

async function fetchShouldIBuySSE(
  body: object,
  onStep: (text: string) => void
): Promise<VerdictResult> {
  const res = await fetch("/api/should-i-buy", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let data: VerdictResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      let ev: { type: string; text?: string; data?: VerdictResult; message?: string };
      try { ev = JSON.parse(line.slice(6)); } catch { continue; }
      if (ev.type === "step" && ev.text) onStep(ev.text);
      else if (ev.type === "result" && ev.data) data = ev.data;
      else if (ev.type === "error") throw new Error(ev.message ?? "Advisor error");
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
      <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
        {children}
      </h1>
    </div>
  );
}

function GarmentThumb({ imageUrl, color, size = 56 }: { imageUrl?: string | null; color?: string; size?: number }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className="rounded-xl object-cover shrink-0"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="rounded-none shrink-0"
      style={{ width: size, height: size, background: colorToHex(color) }}
    />
  );
}

function VersatilityBar({ score }: { score: number }) {
  const pct = Math.min(10, Math.max(0, score)) / 10;
  const color = pct >= 0.7 ? "#4F7B58" : pct >= 0.4 ? "#C4942A" : "#D6402B";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 rounded-none overflow-hidden" style={{ height: 6, background: "rgba(32,27,21,0.10)" }}>
        <div
          className="h-full rounded-none transition-all"
          style={{ width: `${pct * 100}%`, background: color }}
        />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color, minWidth: 32 }}>
        {score}/10
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ShouldIBuyPage() {
  const [step, setStep]               = useState<Step>("form");
  const [productUrl, setProductUrl]   = useState("");
  const [description, setDescription] = useState("");
  const [priceNote, setPriceNote]     = useState("");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [result, setResult]           = useState<VerdictResult | null>(null);
  const [error, setError]             = useState<string | null>(null);
  const [followUp, setFollowUp]       = useState("");
  const [isFollowingUp, setIsFollowingUp] = useState(false);
  const [reasoningSteps, setReasoningSteps] = useState<string[]>([]);
  const [followUpSteps, setFollowUpSteps]   = useState<string[]>([]);
  const [trailOpen, setTrailOpen]           = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSubmit = productUrl.trim() !== "" || description.trim() !== "" || imageBase64 !== null;

  function handleImageFile(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result as string;
      setImageBase64(data);
      setImagePreview(data);
    };
    reader.readAsDataURL(file);
  }

  function clearImage() {
    setImageBase64(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function submit(opts?: { followUpText?: string }) {
    const isFollowUp = !!opts?.followUpText;
    if (isFollowUp) {
      setIsFollowingUp(true);
      setFollowUpSteps([]);
    } else {
      setStep("loading");
      setReasoningSteps([]);
      setError(null);
    }

    const body = {
      productUrl:      productUrl.trim() || undefined,
      description:     description.trim() || undefined,
      imageBase64:     imageBase64 ?? undefined,
      priceNote:       priceNote.trim() || undefined,
      followUp:        opts?.followUpText,
      previousVerdict: isFollowUp ? result : undefined,
    };

    try {
      const data = await fetchShouldIBuySSE(
        body,
        (text) => {
          if (isFollowUp) {
            setFollowUpSteps((s) => [...s, text]);
          } else {
            setReasoningSteps((s) => [...s, text]);
          }
        }
      );
      setResult(data);
      setStep("result");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(msg);
      if (!isFollowUp) setStep("form");
    } finally {
      if (isFollowUp) {
        setIsFollowingUp(false);
        setFollowUpSteps([]);
      }
    }
  }

  async function submitFollowUp() {
    const text = followUp.trim();
    if (!text || isFollowingUp) return;
    setFollowUp("");
    await submit({ followUpText: text });
  }

  function reset() {
    setStep("form");
    setProductUrl("");
    setDescription("");
    setPriceNote("");
    clearImage();
    setResult(null);
    setError(null);
    setFollowUp("");
    setIsFollowingUp(false);
    setReasoningSteps([]);
    setFollowUpSteps([]);
    setTrailOpen(false);
  }

  // ── Form ──────────────────────────────────────────────────────────────────

  if (step === "form") {
    return (
      <div className="max-w-xl animate-[frkFade_0.3s_ease]">
        <StepHeading>Should I buy this?</StepHeading>

        {/* URL */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-frock-muted uppercase tracking-widest mb-2" style={{ letterSpacing: "0.12em" }}>
            Product URL
          </label>
          <input
            type="url"
            value={productUrl}
            onChange={(e) => setProductUrl(e.target.value)}
            placeholder="https://..."
            className="w-full rounded-none px-5 py-3.5 text-sm text-frock-ink bg-white outline-none"
            style={{ border: "1px solid rgba(32,27,21,0.12)" }}
          />
        </div>

        {/* Description */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-frock-muted uppercase tracking-widest mb-2" style={{ letterSpacing: "0.12em" }}>
            Description <span className="normal-case font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the item — color, style, fabric, where you'd wear it…"
            className="w-full rounded-none px-5 py-3.5 text-sm text-frock-ink bg-white outline-none resize-none leading-relaxed"
            style={{ border: "1px solid rgba(32,27,21,0.12)" }}
          />
        </div>

        {/* Price */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-frock-muted uppercase tracking-widest mb-2" style={{ letterSpacing: "0.12em" }}>
            Price <span className="normal-case font-normal">(optional)</span>
          </label>
          <input
            type="text"
            value={priceNote}
            onChange={(e) => setPriceNote(e.target.value)}
            placeholder="e.g. £85 or $120 on sale"
            className="w-full rounded-none px-5 py-3.5 text-sm text-frock-ink bg-white outline-none"
            style={{ border: "1px solid rgba(32,27,21,0.12)" }}
          />
        </div>

        {/* Image upload */}
        <div className="mb-8">
          <label className="block text-xs font-semibold text-frock-muted uppercase tracking-widest mb-2" style={{ letterSpacing: "0.12em" }}>
            Photo <span className="normal-case font-normal">(optional)</span>
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Product preview"
                className="rounded-none object-cover"
                style={{ maxHeight: 160, maxWidth: "100%" }}
              />
              <button
                onClick={clearImage}
                className="absolute top-2 right-2 w-7 h-7 rounded-none flex items-center justify-center text-xs font-semibold"
                style={{ background: "rgba(32,27,21,0.7)", color: "#F8F3EB" }}
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-3 rounded-none px-5 py-3.5 text-sm text-frock-muted transition-colors hover:text-frock-ink"
              style={{ border: "1.5px dashed rgba(32,27,21,0.18)", width: "100%" }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1v10M3 6l5-5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M1 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
              Upload a photo of the item
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageFile(file);
            }}
          />
        </div>

        {error && (
          <p className="text-sm mb-4" style={{ color: "#D6402B" }}>{error}</p>
        )}

        <button
          onClick={() => submit()}
          disabled={!canSubmit}
          className="rounded-none px-10 py-3.5 text-sm font-medium text-white transition-opacity disabled:opacity-40 hover:opacity-90"
          style={{ background: "#D6402B" }}
        >
          Evaluate this item
        </button>
      </div>
    );
  }

  // ── Loading with live reasoning steps ─────────────────────────────────────

  if (step === "loading") {
    return (
      <div className="flex flex-col gap-8 py-16 animate-[frkFade_0.3s_ease]">
        <div className="flex items-center gap-3">
          <MascotAvatar size="badge" />
          <p className="text-2xl text-frock-ink text-center" style={{ fontFamily: "var(--font-serif)" }}>
            Checking your wardrobe
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

  // ── Result ────────────────────────────────────────────────────────────────

  if (step === "result" && result) {
    const vc = VERDICT_CONFIG[result.verdict];

    return (
      <div className="flex flex-col gap-6 max-w-2xl animate-[frkFade_0.3s_ease]">

        {/* Verdict banner */}
        <div
          className="rounded-none px-7 py-6 flex items-start gap-5"
          style={{ background: vc.bg, border: `1.5px solid ${vc.border}` }}
        >
          <div
            className="w-12 h-12 rounded-none flex items-center justify-center text-xl font-bold shrink-0 mt-0.5"
            style={{ background: vc.text, color: "#fff" }}
          >
            {vc.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-2xl font-semibold" style={{ fontFamily: "var(--font-serif)", color: vc.text }}>
                {vc.label}
              </span>
              <span
                className="rounded-none px-3 py-0.5 text-xs font-semibold"
                style={{ background: vc.text, color: "#fff", opacity: 0.85 }}
              >
                {result.confidence}/10 confidence
              </span>
            </div>
            <p className="text-sm text-frock-ink leading-relaxed">{result.reasoning}</p>
          </div>
        </div>

        {result.wearInsight && (
          <div
            className="rounded-none px-5 py-4 flex gap-3"
            style={{ background: "#F0F4F8", border: "1px solid rgba(32,27,21,0.08)" }}
          >
            <span className="text-base shrink-0">📊</span>
            <p className="text-sm text-frock-ink leading-relaxed">{result.wearInsight}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* Left column */}
          <div className="flex flex-col gap-4">

            {result.similarOwnedItems.length > 0 && (
              <div className="rounded-none bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(46,35,22,0.07)" }}>
                <p className="text-xs font-semibold text-frock-muted uppercase tracking-widest mb-3" style={{ letterSpacing: "0.12em" }}>
                  You already own
                </p>
                <div className="flex flex-col gap-3">
                  {result.similarOwnedItems.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <GarmentThumb imageUrl={item.imageUrl} color={item.color} size={52} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-frock-ink capitalize">{item.itemType}</p>
                        {item.color && <p className="text-xs text-frock-muted capitalize">{item.color}</p>}
                        <p className="text-xs text-frock-muted mt-1 leading-relaxed">{item.note}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.colorFitNote && (
              <div
                className="rounded-none px-5 py-4 flex gap-3"
                style={{ background: "#FDF6F0", border: "1px solid rgba(214,64,43,0.12)" }}
              >
                <span className="text-base shrink-0">🎨</span>
                <p className="text-sm text-frock-ink leading-relaxed">{result.colorFitNote}</p>
              </div>
            )}

            <div className="rounded-none bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(46,35,22,0.07)" }}>
              <p className="text-xs font-semibold text-frock-muted uppercase tracking-widest mb-3" style={{ letterSpacing: "0.12em" }}>
                Versatility
              </p>
              <VersatilityBar score={result.versatilityScore} />
              <p className="text-xs text-frock-muted mt-2">
                {result.versatilityScore >= 7 ? "Pairs with many things you own"
                  : result.versatilityScore >= 4 ? "Works with a few pieces you own"
                  : "Limited pairing options in your wardrobe"}
              </p>
            </div>

            {result.redFlags.length > 0 && (
              <div className="rounded-none bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(46,35,22,0.07)" }}>
                <p className="text-xs font-semibold text-frock-muted uppercase tracking-widest mb-3" style={{ letterSpacing: "0.12em" }}>
                  Red flags
                </p>
                <ul className="flex flex-col gap-2">
                  {result.redFlags.map((flag, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-frock-ink">
                      <span className="shrink-0 mt-0.5" style={{ color: "#D6402B" }}>⚠</span>
                      {flag}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-4">
            {result.outfitsItEnables.length > 0 ? (
              <div className="rounded-none bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(46,35,22,0.07)" }}>
                <p className="text-xs font-semibold text-frock-muted uppercase tracking-widest mb-3" style={{ letterSpacing: "0.12em" }}>
                  Outfits this enables
                </p>
                <div className="flex flex-col gap-5">
                  {result.outfitsItEnables.map((outfit, i) => (
                    <div key={i}>
                      <div className="flex gap-2 flex-wrap mb-2">
                        {outfit.pieces.map((piece) => (
                          <GarmentThumb key={piece.id} imageUrl={piece.imageUrl} color={piece.color} size={44} />
                        ))}
                      </div>
                      <p className="text-xs text-frock-muted leading-relaxed italic">{outfit.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-none bg-white p-5" style={{ boxShadow: "0 1px 4px rgba(46,35,22,0.07)" }}>
                <p className="text-xs font-semibold text-frock-muted uppercase tracking-widest mb-2" style={{ letterSpacing: "0.12em" }}>
                  Outfits this enables
                </p>
                <p className="text-sm text-frock-muted">
                  No complete outfits identified with your current wardrobe.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Follow-up input */}
        <div className="flex flex-col gap-3">
          {isFollowingUp ? (
            <div
              className="rounded-none px-4 py-4"
              style={{ background: "#F5EDE5", border: "1px solid rgba(214,64,43,0.12)" }}
            >
              <p className="text-xs text-frock-muted mb-3 font-medium uppercase tracking-wider" style={{ letterSpacing: "0.1em" }}>
                Reconsidering
              </p>
              <div className="flex flex-col gap-2.5">
                {followUpSteps.length === 0 ? (
                  <CompactStepRow text="Getting started…" active />
                ) : (
                  followUpSteps.map((text, i) => (
                    <CompactStepRow key={i} text={text} active={i === followUpSteps.length - 1} />
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex gap-2">
              <input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitFollowUp(); } }}
                placeholder="Ask a follow-up — e.g. 'what if it were black?' or 'what if it's on sale?'"
                className="flex-1 rounded-none px-4 py-3 text-sm text-frock-ink bg-white outline-none"
                style={{ border: "1px solid rgba(32,27,21,0.12)" }}
              />
              <button
                onClick={submitFollowUp}
                disabled={!followUp.trim()}
                className="rounded-none px-4 text-sm font-medium text-white transition-opacity disabled:opacity-30"
                style={{ background: "#D6402B", minWidth: 44 }}
              >
                ↑
              </button>
            </div>
          )}
          {result.toolTrail && result.toolTrail.length > 0 && (
            <div className="rounded-none overflow-hidden" style={{ border: "1px solid rgba(32,27,21,0.08)" }}>
              <button
                onClick={() => setTrailOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-frock-muted uppercase tracking-widest hover:text-frock-ink transition-colors"
                style={{ letterSpacing: "0.12em", background: "rgba(32,27,21,0.03)" }}
              >
                <span>How I decided</span>
                <svg
                  width="12" height="12" viewBox="0 0 12 12" fill="none"
                  style={{ transform: trailOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                >
                  <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              {trailOpen && (
                <ol className="flex flex-col px-4 py-3 gap-2">
                  {result.toolTrail.map((entry, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-frock-muted">
                      <span
                        className="mt-0.5 shrink-0 w-4 h-4 rounded-none flex items-center justify-center text-white text-[9px] font-bold"
                        style={{ background: "#8a8a8a" }}
                      >
                        {i + 1}
                      </span>
                      <span>
                        <span className="font-medium text-frock-ink">{toolTrailLabel(entry.tool)}</span>
                        {entry.argsSummary && <span className="text-frock-muted"> — {entry.argsSummary}</span>}
                        <span className="text-frock-muted opacity-60"> ({entry.durationMs}ms)</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
          <button onClick={reset} className="self-start text-sm text-frock-muted hover:text-frock-ink transition-colors">
            ← Evaluate another item
          </button>
        </div>
      </div>
    );
  }

  return null;
}
