"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOnboardingStore } from "@/store/onboarding";
import type { ExtractedItem } from "@/types/extraction";

// Fallback demo items when extraction returned nothing
const DEMO_ITEMS: ExtractedItem[] = [
  { itemType: "navy blazer",      color: "navy",   pattern: null,     fabricType: "wool",   formalityLevel: "smart-casual", season: "all-season", warmthLevel: "mid",   confidence: "high",   sourcePhotoIndex: 0 },
  { itemType: "camel coat",       color: "camel",  pattern: null,     fabricType: "wool",   formalityLevel: "smart-casual", season: "autumn",     warmthLevel: "warm",  confidence: "high",   sourcePhotoIndex: 0 },
  { itemType: "cream knit",       color: "cream",  pattern: null,     fabricType: "knit",   formalityLevel: "casual",       season: "all-season", warmthLevel: "mid",   confidence: "high",   sourcePhotoIndex: 0 },
  { itemType: "straight-leg jeans", color: "denim", pattern: null,    fabricType: "denim",  formalityLevel: "casual",       season: "all-season", warmthLevel: "mid",   confidence: "high",   sourcePhotoIndex: 0 },
  { itemType: "rust skirt",       color: "rust",   pattern: null,     fabricType: null,     formalityLevel: "smart-casual", season: "autumn",     warmthLevel: "light", confidence: "medium", sourcePhotoIndex: 0 },
  { itemType: "blush trousers",   color: "pink",   pattern: null,     fabricType: null,     formalityLevel: "smart-casual", season: "spring",     warmthLevel: "light", confidence: "medium", sourcePhotoIndex: 0 },
];

const COLOR_HEX: Record<string, string> = {
  black: "#1C1C1C",   white: "#F9F6F2",   navy: "#1B2A4A",    beige: "#D9C9A8",
  cream: "#F5EDD9",   brown: "#7B4F2E",   camel: "#C19A6B",   tan: "#C9A96E",
  grey: "#9E9E9E",    gray: "#9E9E9E",    charcoal: "#4A4A4A", slate: "#6B7280",
  red: "#C0392B",     burgundy: "#7B1A2B", wine: "#6B2035",   rust: "#B94B2C",
  pink: "#E8A0B0",    blush: "#F2D0C4",   rose: "#E8A0B0",    coral: "#E87B6B",
  orange: "#D4722A",  yellow: "#E8C850",  gold: "#C5A028",    mustard: "#C5821A",
  green: "#4A7C59",   olive: "#6B7345",   sage: "#8FAF8A",    mint: "#A8D5B0",
  blue: "#4169A0",    cobalt: "#2147A0",  teal: "#2A8080",    denim: "#4A7090",
  purple: "#7B5EA7",  lavender: "#B0A0C8", ivory: "#F5EDD9",  khaki: "#C3B091",
};

function colorToHex(color: string | null): string {
  if (!color) return "#C8A47E";
  return COLOR_HEX[color.toLowerCase()] ?? "#C8A47E";
}

// Vary tile heights for the masonry layout
const HEIGHTS = [128, 96, 112, 138, 104, 122, 96, 130];

export default function ImportReviewPage() {
  const router = useRouter();
  const { extractedItems, closetCount, setClosetCount } = useOnboardingStore();

  const items = extractedItems.length > 0 ? extractedItems : DEMO_ITEMS;

  // Low-confidence items are deselected by default (Story 14)
  const [deselected, setDeselected] = useState<Set<number>>(() => {
    const s = new Set<number>();
    items.forEach((item, i) => { if (item.confidence === "low") s.add(i); });
    return s;
  });
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedCount = items.length - deselected.size;
  const selectedItems = useMemo(
    () => items.filter((_, i) => !deselected.has(i)),
    [items, deselected]
  );

  function toggleItem(i: number) {
    setDeselected((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  async function handleAdd() {
    if (selectedCount === 0 || saving) return;
    setSaving(true);
    try {
      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          selectedItems.map(({ sourcePhotoIndex: _, confidence: __, ...item }) => item)
        ),
      });

      if (res.ok) {
        setClosetCount(closetCount + selectedItems.length);
        toast.success(`${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""} added to your wardrobe`);
        router.push("/onboarding/wardrobe-preview");
      } else if (res.status === 401) {
        // Not signed in — save locally and continue
        setClosetCount(closetCount + selectedItems.length);
        toast.success(`${selectedItems.length} item${selectedItems.length !== 1 ? "s" : ""} saved locally`);
        router.push("/onboarding/wardrobe-preview");
      } else {
        toast.error("Couldn't save items. Please try again.");
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
        {/* Header */}
        <div className="flex flex-col gap-1">
          <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
            Import · review
          </p>
          <h1 className="text-[28px] text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            {items.length} piece{items.length !== 1 ? "s" : ""} found
          </h1>
          <p className="text-sm text-frock-muted leading-relaxed">
            All selected by default — tap any to leave it out.
            {items.some((i) => i.confidence === "low") && (
              <> Uncertain items are unselected.</>
            )}
          </p>
        </div>

        {/* Masonry 2-column grid */}
        <div style={{ columns: 2, columnGap: 8 }}>
          {items.map((item, i) => {
            const included = !deselected.has(i);
            const h = HEIGHTS[i % HEIGHTS.length];
            const bg = colorToHex(item.color);
            return (
              <button
                key={i}
                onClick={() => toggleItem(i)}
                className="relative block w-full rounded-xl overflow-hidden text-left transition-all active:scale-[0.97]"
                style={{
                  height: h,
                  // Use cream for bg-removed PNGs (transparent bg looks better on neutral)
                  // Fall back to colour swatch when no crop available
                  background: item.cropUrl ? "#F5EDD9" : bg,
                  breakInside: "avoid",
                  marginBottom: 8,
                  opacity: included ? 1 : 0.4,
                }}
              >
                {/* Extracted garment image — contains or object-contain so isolated item shows fully */}
                {item.cropUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.cropUrl}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain p-2"
                  />
                )}
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(to top, rgba(32,27,21,0.6) 0%, transparent 55%)" }}
                />

                {/* Item label */}
                <p
                  className="absolute bottom-2 left-2.5 right-6 text-xs leading-tight"
                  style={{ color: "#F8F3EB", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                >
                  {item.itemType}
                </p>

                {/* Confidence flag for uncertain items */}
                {item.confidence === "low" && (
                  <span
                    className="absolute top-2 left-2 text-[9px] px-1.5 py-0.5 rounded-full"
                    style={{ background: "rgba(214,64,43,0.85)", color: "white" }}
                  >
                    Not sure
                  </span>
                )}

                {/* Select/deselect indicator */}
                <div
                  className="absolute top-2 right-2 flex items-center justify-center rounded-full transition-all"
                  style={{
                    width: 22, height: 22,
                    background: included ? "#D6402B" : "rgba(255,255,255,0.20)",
                    border: included ? "none" : "1.5px solid rgba(255,255,255,0.5)",
                  }}
                >
                  {included && (
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 mt-1">
          <p className="text-xs text-center text-frock-muted">
            {selectedCount === 0
              ? "Select at least one piece to continue"
              : `${selectedCount} of ${items.length} selected`}
          </p>

          <button
            onClick={handleAdd}
            disabled={selectedCount === 0 || saving}
            className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
            style={{ background: "#D6402B" }}
          >
            {saving ? "Saving…" : `Add ${selectedCount > 0 ? selectedCount : ""} to my wardrobe →`}
          </button>

          <button
            onClick={() => setShowExitDialog(true)}
            className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors underline underline-offset-2 py-1"
          >
            Discard and exit
          </button>
        </div>
      </div>

      {/* Exit confirmation */}
      {showExitDialog && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40" onClick={() => setShowExitDialog(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-10 animate-[frkSheet_0.25s_ease]">
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: "#F0E8DB" }} />
            <p className="text-base font-medium text-frock-ink text-center mb-2">Discard these results?</p>
            <p className="text-sm text-frock-muted text-center leading-relaxed mb-6">
              The {items.length} piece{items.length !== 1 ? "s" : ""} found won&apos;t be added. You can always import again.
            </p>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => router.push("/onboarding/closet")}
                className="w-full rounded-full py-4 font-medium text-base text-white"
                style={{ background: "#D6402B" }}
              >
                Yes, discard
              </button>
              <button
                onClick={() => setShowExitDialog(false)}
                className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors py-1"
              >
                Keep reviewing
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
