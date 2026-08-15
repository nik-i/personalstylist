"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { signIn } from "next-auth/react";

// ── Types ─────────────────────────────────────────────────────────────────────

type WardrobeItem = {
  id: string;
  itemType: string;
  color: string | null;
  category: string | null;
  subcategory: string | null;
  imageUrl: string | null;
  addedAt: string;
};

type PieceSnapshot = {
  id: string;
  itemType: string;
  color: string | null;
  imageUrl: string | null;
};

type OutfitLog = {
  id: string;
  date: string; // YYYY-MM-DD
  pieces: PieceSnapshot[];
  occasion: string | null;
  note: string | null;
  createdAt: string;
};

type CalendarEvent = {
  id: string;
  title: string;
  date: string;      // YYYY-MM-DD
  endDate?: string;
  allDay: boolean;
  color?: string;
};

// ── Date helpers ──────────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function todayStr() { return toDateStr(new Date()); }

function monthLabel(year: number, month: number) {
  return new Date(year, month).toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function firstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay(); // 0 = Sun
}

function formatDayLabel(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

function monthKey(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
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
  if (!color) return "#EDE8DF";
  if (color.startsWith("#")) return color;
  return COLOR_HEX[color.toLowerCase()] ?? "#EDE8DF";
}

// ── Category + occasion constants ─────────────────────────────────────────────

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Tops: ["top", "shirt", "blouse", "tee", "t-shirt", "tank", "polo", "sweater", "knit", "sweatshirt", "hoodie", "crop", "pullover"],
  Bottoms: ["bottom", "pant", "jean", "trouser", "skirt", "short", "legging", "jogger"],
  Shoes: ["shoe", "boot", "sneaker", "sandal", "heel", "loafer", "pump", "flat", "footwear"],
  Layers: ["layer", "jacket", "blazer", "coat", "cardigan", "vest", "outerwear", "fleece", "trench"],
  Accessories: ["bag", "belt", "hat", "cap", "scarf", "jewelry", "watch", "sunglasses", "purse", "tote", "backpack", "accessory"],
};

const OCCASION_OPTIONS = ["Work", "Casual", "Event", "Date", "Travel"];

function matchesCategory(item: WardrobeItem, cat: string): boolean {
  const words = CATEGORY_KEYWORDS[cat] ?? [];
  const haystack = `${item.category ?? ""} ${item.subcategory ?? ""} ${item.itemType}`.toLowerCase();
  return words.some((w) => haystack.includes(w));
}

// ── Garment thumbnail ─────────────────────────────────────────────────────────

function GarmentThumb({
  item,
  selected,
  onToggle,
}: {
  item: WardrobeItem;
  selected: boolean;
  onToggle: (id: string) => void;
}) {
  return (
    <button
      onClick={() => onToggle(item.id)}
      className="relative rounded-xl overflow-hidden transition-all"
      style={{
        width: 72,
        height: 72,
        background: "#EDE8DF",
        border: selected ? "2.5px solid #D6402B" : "2.5px solid transparent",
        boxShadow: selected ? "0 0 0 3px rgba(214,64,43,0.12)" : "none",
        flexShrink: 0,
      }}
    >
      {item.imageUrl ? (
        <img src={item.imageUrl} alt={item.itemType} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-xs text-center px-1 leading-tight" style={{ color: "#8C8375" }}>
          {item.itemType}
        </div>
      )}
      {selected && (
        <div className="absolute top-1 right-1 flex items-center justify-center rounded-full" style={{ width: 18, height: 18, background: "#D6402B" }}>
          <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
            <path d="M2 5l2 2 4-4" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ── Garment grid ──────────────────────────────────────────────────────────────

function GarmentGrid({ items, selectedIds, onToggle }: {
  items: WardrobeItem[];
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (!items.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <GarmentThumb key={item.id} item={item} selected={selectedIds.has(item.id)} onToggle={onToggle} />
      ))}
    </div>
  );
}

// ── Log panel (slide-in drawer) ───────────────────────────────────────────────

function LogPanel({
  date,
  existingLog,
  gcalEvents,
  wardrobeItems,
  recentlyWornItems,
  recentlyAddedItems,
  onSave,
  onDelete,
  onClose,
}: {
  date: string;
  existingLog: OutfitLog | null;
  gcalEvents: CalendarEvent[];
  wardrobeItems: WardrobeItem[];
  recentlyWornItems: WardrobeItem[];
  recentlyAddedItems: WardrobeItem[];
  onSave: (log: OutfitLog) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set(existingLog?.pieces.map((p) => p.id) ?? [])
  );
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [occasion, setOccasion] = useState<string | null>(existingLog?.occasion ?? null);
  const [note, setNote] = useState(existingLog?.note ?? "");
  const [saving, setSaving] = useState(false);

  const itemMap = useMemo(() => new Map(wardrobeItems.map((i) => [i.id, i])), [wardrobeItems]);

  const isFiltering = !!(search.trim() || categoryFilter);

  const filteredItems = useMemo(() => {
    let items = wardrobeItems;
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter((i) =>
        `${i.itemType} ${i.color ?? ""} ${i.category ?? ""} ${i.subcategory ?? ""}`.toLowerCase().includes(q)
      );
    }
    if (categoryFilter) items = items.filter((i) => matchesCategory(i, categoryFilter));
    return items;
  }, [wardrobeItems, search, categoryFilter]);

  const selectedItems = useMemo(
    () => [...selectedIds].map((id) => itemMap.get(id)).filter(Boolean) as WardrobeItem[],
    [selectedIds, itemMap]
  );

  const toggleItem = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (selectedIds.size === 0 || saving) return;
    setSaving(true);
    try {
      let res: Response;
      if (existingLog) {
        res = await fetch(`/api/looks/${existingLog.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pieceIds: [...selectedIds], occasion, note: note || null }),
        });
      } else {
        res = await fetch("/api/looks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, pieceIds: [...selectedIds], occasion, note: note || null }),
        });
      }
      if (res.ok) onSave((await res.json()) as OutfitLog);
    } finally {
      setSaving(false);
    }
  }

  async function deleteLook() {
    if (!existingLog) return;
    await fetch(`/api/looks/${existingLog.id}`, { method: "DELETE" });
    onDelete(existingLog.id);
  }

  const eventsForDay = gcalEvents.filter((e) => e.date === date);

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(32,27,21,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ml-auto flex flex-col h-full overflow-hidden"
        style={{ width: 440, background: "#F8F3EB", boxShadow: "-8px 0 40px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(32,27,21,0.08)" }}>
          <div className="flex items-start justify-between mb-1">
            <p className="text-sm font-semibold" style={{ color: "#201B15" }}>{formatDayLabel(date)}</p>
            <div className="flex items-center gap-3">
              {existingLog && (
                <button onClick={deleteLook} className="text-xs font-medium" style={{ color: "#D6402B" }}>
                  Delete look
                </button>
              )}
              <button onClick={onClose} className="p-1" style={{ color: "#8C8375" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Google Calendar events for this day */}
          {eventsForDay.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {eventsForDay.map((ev) => (
                <div key={ev.id} className="flex items-center gap-1.5">
                  <span
                    className="rounded-sm shrink-0"
                    style={{ width: 8, height: 8, background: ev.color ?? "#4285F4" }}
                  />
                  <span className="text-xs truncate" style={{ color: "#8C8375" }}>{ev.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">

          {/* Search + category filters */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2.5" style={{ letterSpacing: "0.12em", color: "#8C8375" }}>
              Select pieces
            </p>
            <input
              type="text"
              placeholder="Search garments…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl text-sm mb-2.5 border outline-none"
              style={{ borderColor: "#D6C9B8", background: "#FFF", color: "#201B15" }}
            />
            <div className="flex gap-2 overflow-x-auto pb-0.5" style={{ scrollbarWidth: "none" }}>
              {Object.keys(CATEGORY_KEYWORDS).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  className="shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={categoryFilter === cat ? { background: "#201B15", color: "#F8F3EB" } : { background: "#EDE8DF", color: "#201B15" }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Garment grids */}
          {isFiltering ? (
            filteredItems.length === 0 ? (
              <p className="text-sm" style={{ color: "#8C8375" }}>No items match.</p>
            ) : (
              <GarmentGrid items={filteredItems} selectedIds={selectedIds} onToggle={toggleItem} />
            )
          ) : (
            <div className="flex flex-col gap-5">
              {recentlyWornItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "#8C8375" }}>Recently worn</p>
                  <GarmentGrid items={recentlyWornItems} selectedIds={selectedIds} onToggle={toggleItem} />
                </div>
              )}
              {recentlyAddedItems.length > 0 && (
                <div>
                  <p className="text-xs font-medium mb-2" style={{ color: "#8C8375" }}>Recently added</p>
                  <GarmentGrid items={recentlyAddedItems} selectedIds={selectedIds} onToggle={toggleItem} />
                </div>
              )}
              <div>
                <p className="text-xs font-medium mb-2" style={{ color: "#8C8375" }}>All pieces</p>
                <GarmentGrid items={wardrobeItems} selectedIds={selectedIds} onToggle={toggleItem} />
              </div>
            </div>
          )}

          {/* Occasion + note */}
          <div>
            <p className="text-xs font-semibold uppercase mb-2.5" style={{ letterSpacing: "0.12em", color: "#8C8375" }}>
              Occasion <span style={{ opacity: 0.45 }}>(optional)</span>
            </p>
            <div className="flex gap-2 flex-wrap mb-3">
              {OCCASION_OPTIONS.map((occ) => (
                <button
                  key={occ}
                  onClick={() => setOccasion(occasion === occ ? null : occ)}
                  className="px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors"
                  style={occasion === occ ? { background: "#201B15", color: "#F8F3EB" } : { background: "#EDE8DF", color: "#201B15" }}
                >
                  {occ}
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Add a note… (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={120}
              className="w-full px-4 py-2.5 rounded-xl text-sm border outline-none"
              style={{ borderColor: "#D6C9B8", background: "#FFF", color: "#201B15" }}
            />
          </div>
        </div>

        {/* Footer: tray + save */}
        <div className="px-5 py-4" style={{ borderTop: "1px solid rgba(32,27,21,0.08)", background: "#F8F3EB" }}>
          {selectedItems.length > 0 && (
            <div className="flex gap-1.5 overflow-x-auto mb-3" style={{ scrollbarWidth: "none" }}>
              {selectedItems.map((item) => (
                <div
                  key={item.id}
                  className="relative shrink-0 rounded-lg overflow-hidden"
                  style={{ width: 40, height: 40, background: "#EDE8DF" }}
                >
                  {item.imageUrl && (
                    <img src={item.imageUrl} alt={item.itemType} className="w-full h-full object-cover" />
                  )}
                  <button
                    onClick={() => toggleItem(item.id)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    style={{ background: "rgba(0,0,0,0.4)" }}
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          )}
          <button
            onClick={save}
            disabled={selectedIds.size === 0 || saving}
            className="w-full py-3 rounded-xl text-sm font-semibold transition-all"
            style={{
              background: selectedIds.size > 0 ? "#201B15" : "#EDE8DF",
              color: selectedIds.size > 0 ? "#F8F3EB" : "#8C8375",
            }}
          >
            {saving
              ? "Saving…"
              : selectedIds.size === 0
              ? "Select at least one piece"
              : existingLog
              ? `Update look · ${selectedIds.size} piece${selectedIds.size === 1 ? "" : "s"}`
              : `Log this look · ${selectedIds.size} piece${selectedIds.size === 1 ? "" : "s"}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Look view panel (read-only) ───────────────────────────────────────────────

function LookViewPanel({
  date,
  log,
  gcalEvents,
  onEdit,
  onDelete,
  onClose,
}: {
  date: string;
  log: OutfitLog;
  gcalEvents: CalendarEvent[];
  onEdit: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const eventsForDay = gcalEvents.filter((e) => e.date === date);

  async function deleteLook() {
    if (deleting) return;
    setDeleting(true);
    await fetch(`/api/looks/${log.id}`, { method: "DELETE" });
    onDelete(log.id);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex"
      style={{ background: "rgba(32,27,21,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="ml-auto flex flex-col h-full overflow-hidden"
        style={{ width: 400, background: "#F8F3EB", boxShadow: "-8px 0 40px rgba(0,0,0,0.18)" }}
      >
        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(32,27,21,0.08)" }}>
          <div className="flex items-start justify-between">
            <p className="text-sm font-semibold" style={{ color: "#201B15" }}>{formatDayLabel(date)}</p>
            <div className="flex items-center gap-3">
              <button onClick={onEdit} className="text-xs font-medium" style={{ color: "#D6402B" }}>
                Edit
              </button>
              <button onClick={onClose} className="p-1" style={{ color: "#8C8375" }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 3l10 10M13 3L3 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
          {log.occasion && (
            <span
              className="mt-2 inline-block text-xs px-2.5 py-1 rounded-full font-medium"
              style={{ background: "#EDE8DF", color: "#554C41" }}
            >
              {log.occasion}
            </span>
          )}
          {eventsForDay.length > 0 && (
            <div className="flex flex-col gap-1 mt-2">
              {eventsForDay.map((ev) => (
                <div key={ev.id} className="flex items-center gap-1.5">
                  <span className="rounded-sm shrink-0" style={{ width: 8, height: 8, background: ev.color ?? "#4285F4" }} />
                  <span className="text-xs truncate" style={{ color: "#8C8375" }}>{ev.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pieces */}
        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="text-xs font-semibold uppercase mb-4" style={{ letterSpacing: "0.12em", color: "#8C8375" }}>
            {log.pieces.length} piece{log.pieces.length === 1 ? "" : "s"}
          </p>
          <div className="grid grid-cols-2 gap-4">
            {log.pieces.map((piece, i) => (
              <div key={`${piece.id}-${i}`} className="flex flex-col gap-2">
                <div
                  className="rounded-2xl overflow-hidden w-full"
                  style={{ aspectRatio: "3/4", background: colorToHex(piece.color) }}
                >
                  {piece.imageUrl && (
                    <img src={piece.imageUrl} alt={piece.itemType} className="w-full h-full object-cover" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-semibold leading-tight" style={{ color: "#201B15" }}>{piece.itemType}</p>
                  {piece.color && (
                    <div className="flex items-center gap-1.5 mt-1">
                      <span
                        className="rounded-full shrink-0"
                        style={{ width: 8, height: 8, background: colorToHex(piece.color), border: "1px solid rgba(32,27,21,0.12)" }}
                      />
                      <span className="text-xs capitalize" style={{ color: "#8C8375" }}>{piece.color}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          {log.note && (
            <p className="mt-5 text-sm leading-relaxed italic" style={{ color: "#8C8375" }}>{log.note}</p>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ borderTop: "1px solid rgba(32,27,21,0.08)" }}
        >
          <button
            onClick={deleteLook}
            disabled={deleting}
            className="text-xs font-medium disabled:opacity-50"
            style={{ color: "#D6402B" }}
          >
            {deleting ? "Deleting…" : "Delete look"}
          </button>
          <button
            onClick={onEdit}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold"
            style={{ background: "#201B15", color: "#F8F3EB" }}
          >
            Edit look
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Calendar day cell ─────────────────────────────────────────────────────────

function DayCell({
  day,
  dateStr,
  log,
  gcalEvents,
  isToday,
  isCurrentMonth,
  onClick,
}: {
  day: number;
  dateStr: string;
  log: OutfitLog | null;
  gcalEvents: CalendarEvent[];
  isToday: boolean;
  isCurrentMonth: boolean;
  onClick: (date: string) => void;
}) {
  const pieces = log?.pieces ?? [];
  const hasLook = pieces.length > 0;
  // Show max 3 events in the cell to avoid overflow
  const visibleEvents = gcalEvents.slice(0, 3);
  const hiddenEventCount = gcalEvents.length - visibleEvents.length;

  return (
    <button
      onClick={() => onClick(dateStr)}
      className="relative flex flex-col text-left rounded-xl overflow-hidden group transition-colors hover:bg-black/[0.03]"
      style={{
        minHeight: 120,
        background: isToday ? "rgba(214,64,43,0.05)" : "transparent",
        border: isToday ? "1.5px solid rgba(214,64,43,0.22)" : "1.5px solid rgba(32,27,21,0.06)",
      }}
    >
      {/* Day number */}
      <div className="flex items-center justify-between px-2 pt-2 pb-1">
        <span
          className="text-xs font-semibold flex items-center justify-center rounded-full"
          style={{
            width: 22, height: 22,
            background: isToday ? "#D6402B" : "transparent",
            color: isToday ? "#fff" : isCurrentMonth ? "#201B15" : "#C4BDB3",
          }}
        >
          {day}
        </span>
        {hasLook && (
          <span className="text-xs leading-none" style={{ color: "#C4BDB3", fontSize: 10 }}>
            {pieces.length}p
          </span>
        )}
      </div>

      {/* Outfit thumbnails — 2×2 mosaic */}
      {hasLook && (
        <div className="flex-1 px-1.5 flex flex-wrap gap-0.5 content-start">
          {pieces.slice(0, 4).map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="rounded overflow-hidden relative"
              style={{ width: "calc(50% - 1px)", aspectRatio: "1", background: colorToHex(p.color), flexShrink: 0 }}
            >
              {p.imageUrl ? (
                <img src={p.imageUrl} alt={p.itemType} className="w-full h-full object-cover" />
              ) : (
                <span
                  className="absolute inset-0 flex items-end px-1 pb-0.5 text-white/70 font-medium"
                  style={{ fontSize: 7, lineHeight: 1.2, textShadow: "0 1px 2px rgba(0,0,0,0.4)" }}
                >
                  {p.itemType}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* "+" add hint when empty */}
      {!hasLook && !gcalEvents.length && (
        <div
          className="flex-1 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ color: "#D6C9B8" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </div>
      )}

      {/* Google Calendar events */}
      {gcalEvents.length > 0 && (
        <div className="px-1.5 pb-1.5 flex flex-col gap-0.5 mt-auto w-full">
          {visibleEvents.map((ev) => (
            <div
              key={ev.id}
              className="flex items-center gap-1 rounded px-1 py-0.5"
              style={{ background: `${ev.color ?? "#4285F4"}18` }}
            >
              <span
                className="shrink-0 rounded-full"
                style={{ width: 5, height: 5, background: ev.color ?? "#4285F4" }}
              />
              <span
                className="text-xs truncate leading-tight"
                style={{ color: ev.color ?? "#4285F4", fontSize: 10, fontWeight: 500 }}
              >
                {ev.title}
              </span>
            </div>
          ))}
          {hiddenEventCount > 0 && (
            <span className="text-xs px-1" style={{ color: "#8C8375", fontSize: 10 }}>
              +{hiddenEventCount} more
            </span>
          )}
        </div>
      )}
    </button>
  );
}

// ── Month calendar ────────────────────────────────────────────────────────────

function MonthCalendar({
  year,
  month,
  logsByDate,
  gcalByDate,
  today,
  onDayClick,
}: {
  year: number;
  month: number;
  logsByDate: Map<string, OutfitLog>;
  gcalByDate: Map<string, CalendarEvent[]>;
  today: string;
  onDayClick: (date: string) => void;
}) {
  const totalDays = daysInMonth(year, month);
  const startDow = firstDayOfWeek(year, month);

  const cells: Array<{ day: number; dateStr: string; isCurrentMonth: boolean }> = [];

  // Leading overflow from previous month
  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;
  const prevDays = daysInMonth(prevYear, prevMonth);
  for (let i = startDow - 1; i >= 0; i--) {
    const d = prevDays - i;
    const ds = `${prevYear}-${String(prevMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr: ds, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= totalDays; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, dateStr: ds, isCurrentMonth: true });
  }

  // Trailing overflow
  const remainder = cells.length % 7;
  if (remainder !== 0) {
    const nextMonth = month === 11 ? 0 : month + 1;
    const nextYear = month === 11 ? year + 1 : year;
    for (let d = 1; d <= 7 - remainder; d++) {
      const ds = `${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, dateStr: ds, isCurrentMonth: false });
    }
  }

  const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div>
      {/* Day-of-week header */}
      <div className="grid grid-cols-7 mb-1">
        {DOW.map((d) => (
          <div key={d} className="text-center py-2 text-xs font-semibold" style={{ letterSpacing: "0.08em", color: "#8C8375" }}>
            {d}
          </div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ day, dateStr, isCurrentMonth }) => (
          <DayCell
            key={dateStr}
            day={day}
            dateStr={dateStr}
            log={logsByDate.get(dateStr) ?? null}
            gcalEvents={gcalByDate.get(dateStr) ?? []}
            isToday={dateStr === today}
            isCurrentMonth={isCurrentMonth}
            onClick={onDayClick}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function MyLooksPage() {
  const today = todayStr();
  const now = new Date();

  const [currentYear, setCurrentYear] = useState(now.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(now.getMonth());

  const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
  const [looks, setLooks] = useState<OutfitLog[]>([]);
  const [gcalEvents, setGcalEvents] = useState<CalendarEvent[]>([]);
  const [gcalNeedsAuth, setGcalNeedsAuth] = useState(false);
  const [loading, setLoading] = useState(true);

  // Track which months we've already fetched GCal events for
  const fetchedGcalMonths = useRef(new Set<string>());

  // Panel
  const [panelDate, setPanelDate] = useState<string | null>(null);
  const [panelMode, setPanelMode] = useState<"view" | "edit">("view");

  function openPanel(date: string) {
    setPanelDate(date);
    setPanelMode(logsByDate.has(date) ? "view" : "edit");
  }
  function closePanel() {
    setPanelDate(null);
    setPanelMode("view");
  }

  // ── Initial data load ──────────────────────────────────────────────────────

  useEffect(() => {
    Promise.all([
      fetch("/api/wardrobe").then((r) => r.json()),
      fetch("/api/looks").then((r) => r.json()),
    ])
      .then(([items, logs]) => {
        setWardrobeItems(Array.isArray(items) ? items : []);
        setLooks(Array.isArray(logs) ? logs : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ── Fetch GCal events for the visible month ────────────────────────────────

  useEffect(() => {
    const key = monthKey(currentYear, currentMonth);
    if (fetchedGcalMonths.current.has(key)) return;
    fetchedGcalMonths.current.add(key);

    fetch(`/api/calendar/events?month=${key}`)
      .then((r) => r.json())
      .then((data: { events?: CalendarEvent[]; needsAuth?: boolean }) => {
        if (data.needsAuth) { setGcalNeedsAuth(true); return; }
        if (data.events?.length) {
          setGcalEvents((prev) => {
            const existing = new Set(prev.map((e) => e.id));
            const fresh = (data.events ?? []).filter((e) => !existing.has(e.id));
            return [...prev, ...fresh];
          });
        }
      })
      .catch(() => {});
  }, [currentYear, currentMonth]);

  // ── Derived ──────────────────────────────────────────────────────────────────

  const logsByDate = useMemo(() => new Map(looks.map((l) => [l.date, l])), [looks]);

  const gcalByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of gcalEvents) {
      const arr = map.get(ev.date) ?? [];
      arr.push(ev);
      map.set(ev.date, arr);
    }
    return map;
  }, [gcalEvents]);

  const itemMap = useMemo(() => new Map(wardrobeItems.map((i) => [i.id, i])), [wardrobeItems]);

  const recentlyWornItems = useMemo(() => {
    const seen = new Set<string>();
    const result: WardrobeItem[] = [];
    for (const look of [...looks].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10)) {
      for (const piece of look.pieces) {
        if (!seen.has(piece.id) && itemMap.has(piece.id)) {
          seen.add(piece.id);
          result.push(itemMap.get(piece.id)!);
        }
      }
    }
    return result.slice(0, 8);
  }, [looks, itemMap]);

  const recentlyAddedItems = useMemo(() => {
    const wornIds = new Set(recentlyWornItems.map((i) => i.id));
    return [...wardrobeItems]
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      .filter((i) => !wornIds.has(i.id))
      .slice(0, 8);
  }, [wardrobeItems, recentlyWornItems]);

  const mk = monthKey(currentYear, currentMonth);
  const looksThisMonth = useMemo(
    () => looks.filter((l) => l.date.startsWith(mk)).length,
    [looks, mk]
  );

  // ── Navigation ────────────────────────────────────────────────────────────────

  function prevMonth() {
    if (currentMonth === 0) { setCurrentYear((y) => y - 1); setCurrentMonth(11); }
    else setCurrentMonth((m) => m - 1);
  }
  function nextMonth() {
    if (currentMonth === 11) { setCurrentYear((y) => y + 1); setCurrentMonth(0); }
    else setCurrentMonth((m) => m + 1);
  }
  function goToday() { setCurrentYear(now.getFullYear()); setCurrentMonth(now.getMonth()); }

  // ── Panel callbacks ───────────────────────────────────────────────────────────

  function handleSave(saved: OutfitLog) {
    setLooks((prev) => [...prev.filter((l) => l.id !== saved.id && l.date !== saved.date), saved]);
    closePanel();
  }
  function handleDelete(id: string) {
    setLooks((prev) => prev.filter((l) => l.id !== id));
    closePanel();
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-sm" style={{ color: "#8C8375" }}>
        Loading…
      </div>
    );
  }

  const panelLog = panelDate ? (logsByDate.get(panelDate) ?? null) : null;
  const panelGcal = panelDate ? (gcalByDate.get(panelDate) ?? []) : [];

  return (
    <>
      <div className="flex flex-col gap-5">

        {/* ── Google Calendar connect banner ──────────────────────────────── */}
        {gcalNeedsAuth && (
          <div
            className="flex items-center justify-between px-4 py-3 rounded-xl text-sm"
            style={{ background: "#EBF3FF", border: "1px solid rgba(66,133,244,0.2)" }}
          >
            <div className="flex items-center gap-2.5">
              {/* Google Calendar icon */}
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="#4285F4" strokeWidth="1.6"/>
                <path d="M3 9h18" stroke="#4285F4" strokeWidth="1.6"/>
                <path d="M8 3v3M16 3v3" stroke="#4285F4" strokeWidth="1.6" strokeLinecap="round"/>
                <circle cx="12" cy="15" r="2" fill="#4285F4"/>
              </svg>
              <span style={{ color: "#1a73e8" }}>
                Connect Google Calendar to see your events here
              </span>
            </div>
            <button
              onClick={() => signIn("google", { callbackUrl: "/onboarding/landing?tab=my-looks" })}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ background: "#4285F4", color: "#fff" }}
            >
              Connect
            </button>
          </div>
        )}

        {/* ── Calendar header ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold" style={{ color: "#201B15" }}>
              {monthLabel(currentYear, currentMonth)}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#8C8375" }}>
              {looksThisMonth === 0
                ? "No looks logged — tap any day to start"
                : `${looksThisMonth} look${looksThisMonth === 1 ? "" : "s"} logged`}
              {!gcalNeedsAuth && gcalEvents.length > 0 && " · Google Calendar synced"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={goToday}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "#EDE8DF", color: "#201B15" }}
            >
              Today
            </button>
            <button
              onClick={prevMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: "#EDE8DF" }}
              aria-label="Previous month"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M9 2L4 7l5 5" stroke="#201B15" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg"
              style={{ background: "#EDE8DF" }}
              aria-label="Next month"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M5 2l5 5-5 5" stroke="#201B15" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* ── Month grid ─────────────────────────────────────────────────── */}
        <MonthCalendar
          year={currentYear}
          month={currentMonth}
          logsByDate={logsByDate}
          gcalByDate={gcalByDate}
          today={today}
          onDayClick={openPanel}
        />

        {/* ── Empty wardrobe hint ────────────────────────────────────────── */}
        {wardrobeItems.length === 0 && (
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm"
            style={{ background: "#EDE8DF", color: "#8C8375" }}
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="shrink-0">
              <circle cx="7.5" cy="7.5" r="6" stroke="currentColor" strokeWidth="1.4"/>
              <path d="M7.5 5v3.5M7.5 10.5v.1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Add garments to your wardrobe first — then tap any day to log what you wore.
          </div>
        )}
      </div>

      {/* ── Panels ────────────────────────────────────────────────────────────── */}
      {panelDate && panelLog && panelMode === "view" ? (
        <LookViewPanel
          date={panelDate}
          log={panelLog}
          gcalEvents={panelGcal}
          onEdit={() => setPanelMode("edit")}
          onDelete={handleDelete}
          onClose={closePanel}
        />
      ) : panelDate ? (
        <LogPanel
          date={panelDate}
          existingLog={panelLog}
          gcalEvents={panelGcal}
          wardrobeItems={wardrobeItems}
          recentlyWornItems={recentlyWornItems}
          recentlyAddedItems={recentlyAddedItems}
          onSave={handleSave}
          onDelete={handleDelete}
          onClose={closePanel}
        />
      ) : null}
    </>
  );
}
