"use client";

import { useEffect, useState } from "react";
import { MascotAvatar } from "@/components/ui/MascotAvatar";

type WardrobeItem = {
  id: string;
  itemType: string;
  color: string | null;
  pattern: string | null;
  fabricType: string | null;
  formalityLevel: string | null;
  season: string | null;
  warmthLevel: string | null;
  tags: string[];
  imageUrl: string | null;
  source: string | null;
  addedAt: string;
};

type SheetState =
  | null
  | { item: WardrobeItem; mode: "edit" }
  | { item: WardrobeItem; mode: "confirm-delete" };

const COLOR_HEX: Record<string, string> = {
  black: "#1a1a1a",
  white: "#f5f5f5",
  navy: "#1f3461",
  blue: "#4a7ab5",
  red: "#c0392b",
  pink: "#e8a0a8",
  green: "#4a7c59",
  olive: "#6b6b2a",
  brown: "#7b4f2e",
  tan: "#c4a882",
  beige: "#d4c5a9",
  cream: "#f0e8db",
  grey: "#8a8a8a",
  gray: "#8a8a8a",
  yellow: "#e8c840",
  orange: "#e8823a",
  purple: "#7b4fa0",
  burgundy: "#6b1f2a",
  camel: "#c4905a",
  khaki: "#b5a642",
  denim: "#3a4a6b",
  teal: "#2a7b7b",
  coral: "#e87060",
  lavender: "#b0a0d0",
  gold: "#c4a832",
  silver: "#a0a0a8",
  nude: "#d4b898",
  mint: "#90c8a8",
  mustard: "#c4942a",
  charcoal: "#3a3a3a",
  ivory: "#f0ece0",
};

function colorToHex(color: string | null): string {
  if (!color) return "#F0E8DB";
  if (color.startsWith("#")) return color;
  return COLOR_HEX[color.toLowerCase()] ?? "#F0E8DB";
}

function ItemCard({
  item,
  onTap,
}: {
  item: WardrobeItem;
  onTap: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="rounded-2xl overflow-hidden text-left transition-all active:scale-[0.98]"
      style={{
        boxShadow: "0 1px 2px rgba(46,35,22,0.06), 0 2px 8px rgba(46,35,22,0.07)",
      }}
    >
      {item.imageUrl ? (
        <img
          src={item.imageUrl}
          alt={item.itemType}
          className="w-full object-cover"
          style={{ height: 112 }}
        />
      ) : (
        <div style={{ height: 112, background: colorToHex(item.color) }} />
      )}
      <div className="px-3 py-2 bg-white">
        <p className="text-sm font-medium text-frock-ink truncate">{item.itemType}</p>
        {item.color && (
          <p className="text-xs text-frock-muted truncate mt-0.5">{item.color}</p>
        )}
      </div>
    </button>
  );
}

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-full px-3 py-1.5 text-xs font-medium transition-all shrink-0"
      style={
        active
          ? { background: "#D6402B", color: "#FFFFFF" }
          : {
              background: "#F0E8DB",
              color: "#554C41",
              border: "1px solid rgba(32,27,21,0.10)",
            }
      }
    >
      {label}
    </button>
  );
}

type FormState = {
  itemType: string;
  color: string;
  pattern: string;
  formalityLevel: string;
  season: string;
};

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-xs tracking-widest text-frock-muted uppercase"
        style={{ letterSpacing: "0.12em" }}
      >
        {label}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className="rounded-xl px-3 py-2.5 text-sm text-frock-ink outline-none transition-colors bg-white"
        style={{
          border: `1px solid ${value ? "#D6402B" : "rgba(32,27,21,0.12)"}`,
        }}
      />
    </div>
  );
}

function EditSheet({
  sheet,
  form,
  setForm,
  saving,
  onSave,
  onDelete,
  onDeleteConfirm,
  onClose,
}: {
  sheet: SheetState & { item: WardrobeItem };
  form: FormState;
  setForm: (f: FormState) => void;
  saving: boolean;
  onSave: () => void;
  onDelete: () => void;
  onDeleteConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <>
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl px-5 pt-4 pb-8"
        style={{ maxHeight: "85vh", overflowY: "auto" }}
      >
        <div
          className="w-10 h-1 rounded-full mx-auto mb-5"
          style={{ background: "#F0E8DB" }}
        />

        <p
          className="text-xs tracking-widest uppercase text-frock-muted mb-4"
          style={{ letterSpacing: "0.14em" }}
        >
          Edit item
        </p>

        {sheet.mode === "edit" ? (
          <>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <FieldInput
                label="Type"
                value={form.itemType}
                onChange={(v) => setForm({ ...form, itemType: v })}
                placeholder="e.g. Blazer"
              />
              <FieldInput
                label="Color"
                value={form.color}
                onChange={(v) => setForm({ ...form, color: v })}
                placeholder="e.g. Navy"
              />
              <FieldInput
                label="Pattern"
                value={form.pattern}
                onChange={(v) => setForm({ ...form, pattern: v })}
                placeholder="e.g. Stripe"
              />
              <FieldInput
                label="Formality"
                value={form.formalityLevel}
                onChange={(v) => setForm({ ...form, formalityLevel: v })}
                placeholder="e.g. Smart"
              />
              <FieldInput
                label="Season"
                value={form.season}
                onChange={(v) => setForm({ ...form, season: v })}
                placeholder="e.g. All year"
              />
            </div>

            <button
              onClick={onSave}
              disabled={saving || !form.itemType.trim()}
              className="w-full rounded-full py-4 font-medium text-base text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
              style={{ background: "#D6402B" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>

            <div className="h-px my-4" style={{ background: "#F5DCD3" }} />

            <button
              onClick={onDelete}
              className="w-full text-sm text-center text-frock-muted hover:text-frock-ink transition-colors py-1"
            >
              Remove from wardrobe
            </button>
          </>
        ) : (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-frock-ink font-medium text-center">
              Remove this item?
            </p>
            <p className="text-xs text-frock-muted text-center leading-relaxed">
              It will stop appearing in outfits and recommendations immediately.
            </p>
            <button
              onClick={onDeleteConfirm}
              disabled={saving}
              className="w-full rounded-full py-4 font-medium text-base text-white transition-opacity disabled:opacity-40"
              style={{ background: "#D6402B" }}
            >
              {saving ? "Removing…" : "Yes, remove"}
            </button>
            <button
              onClick={onDelete}
              className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors py-1"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </>
  );
}

export default function WardrobePage() {
  const [items, setItems] = useState<WardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("All");
  const [sheet, setSheet] = useState<SheetState>(null);
  const [form, setForm] = useState<FormState>({
    itemType: "",
    color: "",
    pattern: "",
    formalityLevel: "",
    season: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/wardrobe")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setItems(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map((i) => i.itemType)))];
  const visible = filter === "All" ? items : items.filter((i) => i.itemType === filter);

  function openSheet(item: WardrobeItem) {
    setForm({
      itemType: item.itemType,
      color: item.color ?? "",
      pattern: item.pattern ?? "",
      formalityLevel: item.formalityLevel ?? "",
      season: item.season ?? "",
    });
    setSheet({ item, mode: "edit" });
  }

  function closeSheet() {
    if (saving) return;
    setSheet(null);
  }

  async function handleSave() {
    if (!sheet) return;
    setSaving(true);
    try {
      await fetch(`/api/wardrobe/${sheet.item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: form.itemType || undefined,
          color: form.color || undefined,
          pattern: form.pattern || undefined,
          formalityLevel: form.formalityLevel || undefined,
          season: form.season || undefined,
        }),
      });
      setItems((prev) =>
        prev.map((i) =>
          i.id === sheet.item.id
            ? {
                ...i,
                itemType: form.itemType || i.itemType,
                color: form.color || i.color,
                pattern: form.pattern || i.pattern,
                formalityLevel: form.formalityLevel || i.formalityLevel,
                season: form.season || i.season,
              }
            : i
        )
      );
      setSheet(null);
    } finally {
      setSaving(false);
    }
  }

  function promptDelete() {
    if (!sheet) return;
    setSheet({ item: sheet.item, mode: "confirm-delete" });
  }

  function cancelDelete() {
    if (!sheet) return;
    setSheet({ item: sheet.item, mode: "edit" });
  }

  async function handleDeleteConfirm() {
    if (!sheet) return;
    setSaving(true);
    try {
      await fetch(`/api/wardrobe/${sheet.item.id}`, { method: "DELETE" });
      setItems((prev) => prev.filter((i) => i.id !== sheet.item.id));
      setSheet(null);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1
            className="text-3xl text-frock-ink leading-tight"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            My wardrobe
          </h1>
          <p className="text-sm text-frock-muted">
            {loading ? "Loading…" : `${items.length} item${items.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <MascotAvatar size="badge" />
      </div>

{!loading && items.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5">
          {categories.map((cat) => (
            <FilterPill
              key={cat}
              label={cat}
              active={filter === cat}
              onClick={() => setFilter(cat)}
            />
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden"
              style={{ boxShadow: "0 1px 2px rgba(46,35,22,0.06)" }}
            >
              <div className="animate-pulse bg-frock-cream-2" style={{ height: 112 }} />
              <div className="px-3 py-2 bg-white">
                <div className="h-3 bg-frock-cream-2 rounded animate-pulse w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ background: "#F0E8DB" }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 7h12l-1.5 11a1 1 0 0 1-1 .9H8.5a1 1 0 0 1-1-.9L6 7z"
                stroke="#8C8375"
                strokeWidth="1.5"
              />
              <path d="M3 7h18" stroke="#8C8375" strokeWidth="1.5" strokeLinecap="round" />
              <path
                d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"
                stroke="#8C8375"
                strokeWidth="1.5"
              />
            </svg>
          </div>
          <h2
            className="text-xl text-frock-ink"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            {filter === "All" ? "Nothing here yet" : `No ${filter} items`}
          </h2>
          <p className="text-sm text-frock-muted leading-relaxed max-w-xs">
            {filter === "All"
              ? "Add items from your camera roll or photograph them one by one to get started."
              : "Try a different category or add more items to your wardrobe."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {visible.map((item) => (
            <ItemCard key={item.id} item={item} onTap={() => openSheet(item)} />
          ))}
        </div>
      )}

      {sheet && (
        <EditSheet
          sheet={sheet as SheetState & { item: WardrobeItem }}
          form={form}
          setForm={setForm}
          saving={saving}
          onSave={handleSave}
          onDelete={sheet.mode === "confirm-delete" ? cancelDelete : promptDelete}
          onDeleteConfirm={handleDeleteConfirm}
          onClose={closeSheet}
        />
      )}
    </div>
  );
}
