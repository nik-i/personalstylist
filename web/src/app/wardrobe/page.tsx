"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MascotAvatar } from "@/components/ui/MascotAvatar";
import { GarmentDetailPanel, EditFormData } from "@/components/wardrobe/GarmentDetailSheet";

type WardrobeItem = {
  id: string;
  itemType: string;
  status: string | null;
  color: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  undertone: string | null;
  pattern: string | null;
  fabricType: string | null;
  fabric: string | null;
  formalityLevel: string | null;
  formality: string | null;
  season: string | null;
  warmthLevel: string | null;
  seasonWeight: string | null;
  category: string | null;
  subcategory: string | null;
  fit: string | null;
  neckline: string | null;
  sleeveLength: string | null;
  rise: string | null;
  hemLength: string | null;
  aesthetic: string | null;
  occasionTags: string | null;
  isStatement: boolean | null;
  colorGroup: string | null;
  textureFinish: string | null;
  layeringRole: string | null;
  printScale: string | null;
  legOpening: string | null;
  tags: string[];
  imageUrl: string | null;
  thumbnailPath: string | null;
  source: string | null;
  addedAt: string;
};

type GroupMode = "none" | "color" | "formality" | "weather";

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

function colorToHex(c: string | null): string {
  if (!c) return "#F0E8DB";
  if (c.startsWith("#")) return c;
  return COLOR_HEX[c.toLowerCase()] ?? "#F0E8DB";
}

function effectiveColor(item: WardrobeItem) {
  return item.colorPrimary ?? item.color;
}
function effectiveFormality(item: WardrobeItem) {
  return item.formality ?? item.formalityLevel;
}
function effectiveWeather(item: WardrobeItem): string {
  const sw = item.seasonWeight;
  if (sw === "lightweight") return "Warm weather";
  if (sw === "midweight") return "Mild weather";
  if (sw === "heavy") return "Cold weather";
  const wl = item.warmthLevel;
  if (wl === "light") return "Warm weather";
  if (wl === "mid") return "Mild weather";
  if (wl === "warm") return "Cold weather";
  return "Any weather";
}

function formatLabel(s: string | null): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0"
      style={
        active
          ? { background: "#D6402B", color: "#FFFFFF" }
          : { background: "#F0E8DB", color: "#554C41", border: "1px solid rgba(32,27,21,0.10)" }
      }
    >
      {label}
    </button>
  );
}

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1 text-xs font-medium transition-all shrink-0"
      style={
        active
          ? { background: "#1f3461", color: "#FFFFFF" }
          : { background: "white", color: "#554C41", border: "1px solid rgba(32,27,21,0.15)" }
      }
    >
      {label}
    </button>
  );
}

function StatusDot({ status }: { status: string | null }) {
  if (!status || status === "classified") return null;
  const colors: Record<string, string> = {
    pending_classification: "#e8c840",
    failed: "#D6402B",
  };
  const col = colors[status] ?? "#8a8a8a";
  return (
    <span
      className="absolute top-2 left-2 w-2 h-2 rounded-full"
      style={{ background: col }}
    />
  );
}

function ItemCard({ item, onTap }: { item: WardrobeItem; onTap: () => void }) {
  const img = item.thumbnailPath ?? item.imageUrl;
  return (
    <button
      onClick={onTap}
      className="relative rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
      style={{ boxShadow: "0 1px 2px rgba(46,35,22,0.06), 0 2px 8px rgba(46,35,22,0.07)" }}
    >
      {img ? (
        <img src={img} alt={item.itemType} className="w-full object-cover" style={{ height: 80 }} />
      ) : (
        <div style={{ height: 80, background: colorToHex(effectiveColor(item)) }} />
      )}
      <StatusDot status={item.status} />
      <div className="px-3 py-2 bg-white">
        <p className="text-sm font-medium text-frock-ink truncate">{formatLabel(item.subcategory ?? item.itemType)}</p>
        {effectiveColor(item) && (
          <p className="text-xs text-frock-muted truncate mt-0.5">{formatLabel(effectiveColor(item))}</p>
        )}
      </div>
    </button>
  );
}

function GroupSection({ title, items, onTap }: { title: string; items: WardrobeItem[]; onTap: (i: WardrobeItem) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <p className="text-xs font-semibold text-frock-muted uppercase tracking-wider" style={{ letterSpacing: "0.12em" }}>
          {title}
        </p>
        <span className="text-xs text-frock-muted">({items.length})</span>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => <ItemCard key={item.id} item={item} onTap={() => onTap(item)} />)}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [patternFilter, setPatternFilter] = useState("All");
  const [fabricFilter, setFabricFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState<WardrobeItem | null>(null);

  useEffect(() => {
    fetch("/api/wardrobe")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setItems(data as WardrobeItem[]); })
      .finally(() => setLoading(false));
  }, []);

  // Poll for pending items so the UI updates when classification finishes
  useEffect(() => {
    const hasPending = items.some((i) => i.status === "pending_classification");
    if (!hasPending) return;
    const t = setTimeout(async () => {
      const res = await fetch("/api/wardrobe");
      if (res.ok) {
        const data = await res.json() as WardrobeItem[];
        if (Array.isArray(data)) setItems(data);
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [items]);

  // Derive filter options
  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category ?? i.itemType).filter(Boolean)))];
  const patterns = ["All", ...Array.from(new Set(items.map((i) => i.pattern).filter(Boolean) as string[]))];
  const fabrics = ["All", ...Array.from(new Set(items.map((i) => i.fabric ?? i.fabricType).filter(Boolean) as string[]))];

  // Apply filters
  const filtered = items.filter((i) => {
    const cat = i.category ?? i.itemType;
    if (categoryFilter !== "All" && cat !== categoryFilter) return false;
    if (patternFilter !== "All" && i.pattern !== patternFilter) return false;
    if (fabricFilter !== "All" && (i.fabric ?? i.fabricType) !== fabricFilter) return false;
    return true;
  });

  // Group
  function groupItems(): Array<{ key: string; items: WardrobeItem[] }> {
    if (groupMode === "none") return [{ key: "__all__", items: filtered }];
    const map = new Map<string, WardrobeItem[]>();
    for (const item of filtered) {
      let key: string;
      if (groupMode === "color") key = formatLabel(effectiveColor(item)) ?? "Unknown";
      else if (groupMode === "formality") key = formatLabel(effectiveFormality(item)) ?? "Unknown";
      else key = effectiveWeather(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items })).sort((a, b) => a.key.localeCompare(b.key));
  }

  const groups = groupItems();

  async function handleSave(data: EditFormData) {
    if (!selectedItem) return;
    await fetch(`/api/wardrobe/${selectedItem.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemType: data.itemType || undefined,
        color: data.color || undefined,
        pattern: data.pattern || undefined,
        formalityLevel: data.formalityLevel || undefined,
        season: data.season || undefined,
      }),
    });
    const updated = {
      ...selectedItem,
      itemType: data.itemType || selectedItem.itemType,
      color: data.color || selectedItem.color,
      pattern: data.pattern || selectedItem.pattern,
      formalityLevel: data.formalityLevel || selectedItem.formalityLevel,
      season: data.season || selectedItem.season,
    };
    setItems((prev) => prev.map((i) => i.id === selectedItem.id ? updated : i));
    setSelectedItem(updated);
  }

  async function handleDelete() {
    if (!selectedItem) return;
    await fetch(`/api/wardrobe/${selectedItem.id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i.id !== selectedItem.id));
    setSelectedItem(null);
  }

  function handleRetryClassify() {
    if (!selectedItem) return;
    const id = selectedItem.id;
    setSelectedItem(null);
    fetch(`/api/garments/${id}/classify`, { method: "POST" });
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status: "pending_classification" } : i));
  }

  return (
    <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>My wardrobe</h1>
          <p className="text-sm text-frock-muted">
            {loading ? "Loading…" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/wardrobe/upload"
            className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-frock-blush"
            style={{ background: "#F5DCD3" }}
            aria-label="Add clothes"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 3v10M3 8h10" stroke="#D6402B" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </Link>
          <MascotAvatar size="badge" />
        </div>
      </div>

      {/* Group toggles */}
      {!loading && items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          <TogglePill label="All" active={groupMode === "none"} onClick={() => setGroupMode("none")} />
          <TogglePill label="By colour" active={groupMode === "color"} onClick={() => setGroupMode("color")} />
          <TogglePill label="By formality" active={groupMode === "formality"} onClick={() => setGroupMode("formality")} />
          <TogglePill label="By weather" active={groupMode === "weather"} onClick={() => setGroupMode("weather")} />
        </div>
      )}

      {/* Filters */}
      {!loading && items.length > 0 && (
        <div className="flex flex-col gap-2">
          {categories.length > 2 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              {categories.map((c) => (
                <FilterPill key={c} label={formatLabel(c)} active={categoryFilter === c} onClick={() => setCategoryFilter(c)} />
              ))}
            </div>
          )}
          {patterns.length > 2 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              {patterns.map((p) => (
                <FilterPill key={p} label={formatLabel(p)} active={patternFilter === p} onClick={() => setPatternFilter(p)} />
              ))}
            </div>
          )}
          {fabrics.length > 2 && (
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
              {fabrics.map((f) => (
                <FilterPill key={f} label={formatLabel(f)} active={fabricFilter === f} onClick={() => setFabricFilter(f)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Content: always 4/6 grid + 2/6 detail panel */}
      <div className="flex gap-3 items-start">
        {/* Left: 4-column grid (4/6 of width) */}
        <div style={{ flex: "0 0 66.667%", minWidth: 0 }}>
          {loading ? (
            <div className="grid grid-cols-4 gap-2">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(46,35,22,0.06)" }}>
                  <div className="animate-pulse bg-frock-cream-2" style={{ height: 80 }} />
                  <div className="px-3 py-2 bg-white"><div className="h-3 bg-frock-cream-2 rounded animate-pulse w-3/4" /></div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: "#F0E8DB" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path d="M6 7h12l-1.5 11a1 1 0 0 1-1 .9H8.5a1 1 0 0 1-1-.9L6 7z" stroke="#8C8375" strokeWidth="1.5" />
                  <path d="M3 7h18" stroke="#8C8375" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="#8C8375" strokeWidth="1.5" />
                </svg>
              </div>
              <h2 className="text-xl text-frock-ink" style={{ fontFamily: "var(--font-serif)" }}>
                {items.length === 0 ? "Nothing here yet" : "No items match"}
              </h2>
              <p className="text-sm text-frock-muted leading-relaxed max-w-xs">
                {items.length === 0
                  ? "Upload photos one garment at a time to get started."
                  : "Try clearing some filters."}
              </p>
              {items.length === 0 && (
                <Link href="/wardrobe/upload" className="mt-2 rounded-full px-5 py-3 text-sm font-medium text-white" style={{ background: "#D6402B" }}>
                  Add clothes →
                </Link>
              )}
            </div>
          ) : groupMode === "none" ? (
            <div className="grid grid-cols-4 gap-2">
              {filtered.map((item) => <ItemCard key={item.id} item={item} onTap={() => setSelectedItem(item)} />)}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {groups.map((g) => (
                <GroupSection key={g.key} title={g.key} items={g.items} onTap={(item) => setSelectedItem(item)} />
              ))}
            </div>
          )}
        </div>

        {/* Right: 2/6 always reserved — shows selected item */}
        <div style={{ flex: "0 0 33.333%", minWidth: 0 }}>
          {selectedItem && (
            <div className="sticky top-4">
              <GarmentDetailPanel
                item={selectedItem}
                onClose={() => setSelectedItem(null)}
                onSave={handleSave}
                onDelete={handleDelete}
                onRetryClassify={handleRetryClassify}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
