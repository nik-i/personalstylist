"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GarmentDetailPanel } from "@/components/wardrobe/GarmentDetailSheet";

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

function colorToHex(color: string | null) {
  if (!color) return "#C8A47E";
  return COLOR_HEX[color.toLowerCase()] ?? "#C8A47E";
}

function fmt(s: string | null) {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export type DbItem = {
  id: string;
  itemType: string;
  color: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  undertone: string | null;
  pattern: string | null;
  fabricType: string | null;
  fabric: string | null;
  formalityLevel: string | null;
  formality: string | null;
  warmthLevel: string | null;
  seasonWeight: string | null;
  season: string | null;
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
  imageUrl: string | null;
  thumbnailPath: string | null;
  status: string | null;
};

type GroupMode = "none" | "color" | "formality" | "weather";

function effectiveColor(i: DbItem) { return i.colorPrimary ?? i.color; }
function effectiveFormality(i: DbItem) { return i.formality ?? i.formalityLevel; }
function effectiveWeather(i: DbItem): string {
  const sw = i.seasonWeight;
  if (sw === "lightweight") return "Warm weather";
  if (sw === "midweight")   return "Mild weather";
  if (sw === "heavy")       return "Cold weather";
  const wl = i.warmthLevel;
  if (wl === "light") return "Warm weather";
  if (wl === "mid")   return "Mild weather";
  if (wl === "warm")  return "Cold weather";
  return "Any weather";
}

export const ADD_METHODS = [
  {
    id: "import",
    route: "/onboarding/closet/import",
    label: "Import photos",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="7" cy="9" r="1.5" fill="currentColor" />
        <path d="M2 14l4-3.5 3.5 3 3-3.5 5.5 4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    bg: "#F5DCD3",
    color: "#D6402B",
  },
  {
    id: "manual",
    route: "/onboarding/closet/manual",
    label: "Add manually",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="3" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 7v4M6 9h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M14 7h2a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    bg: "#E3EDE4",
    color: "#4F7B58",
  },
  {
    id: "describe",
    route: "/onboarding/closet/describe",
    label: "Describe it",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M18 13a2 2 0 0 1-2 2H6l-3 3V4a2 2 0 0 1 2-2h11a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    bg: "#F0E8DB",
    color: "#8C6A3F",
  },
];

function TogglePill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-all shrink-0"
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

function FilterPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-2.5 py-1 text-[11px] font-medium transition-all shrink-0"
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

function ItemTile({ item, deleting, selected, onDelete, onTap }: { item: DbItem; deleting: boolean; selected?: boolean; onDelete: () => void; onTap: () => void }) {
  const img = item.thumbnailPath ?? item.imageUrl;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onTap}
      onKeyDown={(e) => e.key === "Enter" && onTap()}
      className="relative w-full rounded-xl overflow-hidden cursor-pointer"
      style={{
        aspectRatio: "3/4",
        background: colorToHex(effectiveColor(item)),
        outline: selected ? "2.5px solid #D6402B" : "none",
        outlineOffset: "2px",
      }}
    >
      {img && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={img} alt="" className="absolute inset-0 w-full h-full object-cover" />
      )}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to top, rgba(32,27,21,0.6) 0%, transparent 50%)" }} />
      <p className="absolute bottom-2 left-2 right-6 text-[10px] leading-tight truncate"
        style={{ color: "#F8F3EB", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
        {fmt(item.subcategory ?? item.itemType)}
      </p>
      {item.status === "pending_classification" && (
        <span className="absolute top-2 left-2 w-2 h-2 rounded-full" style={{ background: "#e8c840" }} />
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        disabled={deleting}
        className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center hover:opacity-80"
        style={{ background: "rgba(32,27,21,0.60)" }}
        aria-label="Remove"
      >
        {deleting
          ? <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "white", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
          : <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" /></svg>
        }
      </button>
    </div>
  );
}

export function ClosetContent({ compact }: { compact?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [groupMode, setGroupMode] = useState<GroupMode>("none");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [patternFilter, setPatternFilter] = useState("All");
  const [fabricFilter, setFabricFilter] = useState("All");
  const [selectedItem, setSelectedItem] = useState<DbItem | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  async function handleDeleteFromSheet() {
    if (!selectedItem) return;
    const id = selectedItem.id;
    await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((it) => it.id !== id));
    setSelectedItem(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const res = await fetch(`/api/wardrobe/${id}`, { method: "DELETE" });
      if (res.ok) setItems((prev) => prev.filter((it) => it.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  useEffect(() => {
    fetch("/api/wardrobe")
      .then(async (res) => { if (res.ok) setItems(await res.json() as DbItem[]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!items.some((i) => i.status === "pending_classification")) return;
    const t = setTimeout(async () => {
      const res = await fetch("/api/wardrobe");
      if (res.ok) setItems(await res.json() as DbItem[]);
    }, 5000);
    return () => clearTimeout(t);
  }, [items]);

  const isEmpty = !loading && items.length === 0;

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.category ?? i.itemType).filter(Boolean)))];
  const patterns   = ["All", ...Array.from(new Set(items.map((i) => i.pattern).filter(Boolean) as string[]))];
  const fabrics    = ["All", ...Array.from(new Set(items.map((i) => i.fabric ?? i.fabricType).filter(Boolean) as string[]))];

  const filtered = items.filter((i) => {
    if (categoryFilter !== "All" && (i.category ?? i.itemType) !== categoryFilter) return false;
    if (patternFilter  !== "All" && i.pattern !== patternFilter) return false;
    if (fabricFilter   !== "All" && (i.fabric ?? i.fabricType) !== fabricFilter) return false;
    return true;
  });

  function buildGroups(): Array<{ key: string; items: DbItem[] }> {
    if (groupMode === "none") return [{ key: "__all__", items: filtered }];
    const map = new Map<string, DbItem[]>();
    for (const item of filtered) {
      const key =
        groupMode === "color"     ? fmt(effectiveColor(item)) :
        groupMode === "formality" ? fmt(effectiveFormality(item)) :
        effectiveWeather(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries()).map(([key, items]) => ({ key, items })).sort((a, b) => a.key.localeCompare(b.key));
  }

  const groups = buildGroups();
  const cols = "grid-cols-4";

  return (
    <div className="flex flex-col gap-3 animate-[frkFade_0.35s_ease]">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div className="flex flex-col gap-0.5">
          <p className="text-[11px] uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>Virtual wardrobe</p>
          <h2 className="text-[26px] text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
            {loading ? "Loading…" : isEmpty ? "Your wardrobe" : `${items.length} piece${items.length === 1 ? "" : "s"}`}
          </h2>
        </div>

        {/* Add methods row */}
        <div className="flex gap-2">
          {ADD_METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(m.route)}
              title={m.label}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all hover:opacity-80 active:scale-[0.97]"
              style={{ background: m.bg, color: m.color }}
            >
              {m.icon}
              <span>{m.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Controls: group toggles + filter button in one row */}
      {!loading && items.length > 1 && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            {/* Group pills */}
            <div className="flex gap-1.5">
              <TogglePill label="All"          active={groupMode === "none"}      onClick={() => setGroupMode("none")} />
              <TogglePill label="By colour"    active={groupMode === "color"}     onClick={() => setGroupMode("color")} />
              <TogglePill label="By formality" active={groupMode === "formality"} onClick={() => setGroupMode("formality")} />
              <TogglePill label="By weather"   active={groupMode === "weather"}   onClick={() => setGroupMode("weather")} />
            </div>

            {/* Filter button */}
            {(categories.length > 2 || patterns.length > 2 || fabrics.length > 2) && (() => {
              const active = [categoryFilter, patternFilter, fabricFilter].filter(v => v !== "All").length;
              return (
                <button
                  onClick={() => setShowFilters((s) => !s)}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all shrink-0"
                  style={active > 0
                    ? { background: "#D6402B", color: "#fff" }
                    : { background: "white", color: "#554C41", border: "1px solid rgba(32,27,21,0.15)" }}
                >
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Filter{active > 0 ? ` · ${active}` : ""}
                </button>
              );
            })()}
          </div>

          {/* Collapsible filter panel */}
          {showFilters && (
            <div className="rounded-xl px-3 py-2.5 flex flex-col gap-2.5"
              style={{ background: "white", border: "1px solid rgba(32,27,21,0.08)", boxShadow: "0 2px 8px rgba(32,27,21,0.06)" }}>
              {categories.length > 2 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-frock-muted mb-1.5" style={{ letterSpacing: "0.12em" }}>Category</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {categories.map((c) => <FilterPill key={c} label={fmt(c)} active={categoryFilter === c} onClick={() => setCategoryFilter(c)} />)}
                  </div>
                </div>
              )}
              {patterns.length > 2 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-frock-muted mb-1.5" style={{ letterSpacing: "0.12em" }}>Pattern</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {patterns.map((p) => <FilterPill key={p} label={fmt(p)} active={patternFilter === p} onClick={() => setPatternFilter(p)} />)}
                  </div>
                </div>
              )}
              {fabrics.length > 2 && (
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-frock-muted mb-1.5" style={{ letterSpacing: "0.12em" }}>Fabric</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {fabrics.map((f) => <FilterPill key={f} label={fmt(f)} active={fabricFilter === f} onClick={() => setFabricFilter(f)} />)}
                  </div>
                </div>
              )}
              {[categoryFilter, patternFilter, fabricFilter].some(v => v !== "All") && (
                <button
                  onClick={() => { setCategoryFilter("All"); setPatternFilter("All"); setFabricFilter("All"); }}
                  className="text-[11px] text-frock-muted hover:text-frock-ink self-start transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Item grid */}
      {loading && (
        <div className={`grid ${cols} gap-2`}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="w-full rounded-xl" style={{ aspectRatio: "3/4", background: "#F0E8DB", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {isEmpty && (
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl py-16 text-center"
          style={{ background: "#F0E8DB", border: "1.5px dashed rgba(32,27,21,0.15)", minHeight: 260 }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" style={{ color: "#C8B89A" }}>
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="text-sm text-frock-muted leading-snug">Nothing here yet.<br />Use the buttons above to add your first piece.</p>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <div className="flex gap-3 items-start">
          {/* Left: 4-column grid, always 4/6 of width */}
          <div style={{ flex: "0 0 66.667%", minWidth: 0 }}>
            {groupMode === "none" ? (
              <div className={`grid ${cols} gap-2`}>
                {filtered.map((item) => (
                  <ItemTile key={item.id} item={item} deleting={deleting === item.id} selected={selectedItem?.id === item.id} onDelete={() => handleDelete(item.id)} onTap={() => setSelectedItem(item)} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-5">
                {groups.map((g) => (
                  <div key={g.key}>
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-frock-muted mb-2" style={{ letterSpacing: "0.12em" }}>
                      {g.key} <span className="font-normal">({g.items.length})</span>
                    </p>
                    <div className={`grid ${cols} gap-2`}>
                      {g.items.map((item) => (
                        <ItemTile key={item.id} item={item} deleting={deleting === item.id} selected={selectedItem?.id === item.id} onDelete={() => handleDelete(item.id)} onTap={() => setSelectedItem(item)} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: always 2/6 reserved — shows selected item */}
          <div style={{ flex: "0 0 33.333%", minWidth: 0 }}>
            {selectedItem && (
              <div className="sticky top-4">
                <GarmentDetailPanel
                  item={selectedItem}
                  onClose={() => setSelectedItem(null)}
                  onDelete={handleDeleteFromSheet}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && items.length > 0 && filtered.length === 0 && (
        <p className="text-xs text-frock-muted text-center py-10">No items match — try clearing a filter.</p>
      )}
    </div>
  );
}
