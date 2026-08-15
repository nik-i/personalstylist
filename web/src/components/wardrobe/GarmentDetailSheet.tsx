"use client";

import { useState } from "react";

export type GarmentDetail = {
  id: string;
  itemType: string;
  status: string | null;
  imageUrl: string | null;
  thumbnailPath: string | null;
  category: string | null;
  subcategory: string | null;
  colorPrimary: string | null;
  colorSecondary: string | null;
  color: string | null;
  undertone: string | null;
  pattern: string | null;
  fabric: string | null;
  fabricType: string | null;
  fit: string | string[] | null;
  formality: string | null;
  formalityLevel: string | null;
  seasonWeight: string | null;
  warmthLevel: string | null;
  neckline: string | null;
  sleeveLength: string | null;
  rise: string | null;
  hemLength: string | null;
  aesthetic: string | null;
  occasionTags: string | string[] | null;
  isStatement: boolean | null;
  colorGroup: string | null;
  textureFinish: string | null;
  layeringRole: string | null;
  printScale: string | null;
  legOpening: string | null;
};

export type EditFormData = {
  itemType: string;
  color: string;
  pattern: string;
  formalityLevel: string;
  season: string;
};

function fmt(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function parseTags(val: string | string[] | null | undefined): string[] {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  try { return JSON.parse(val); } catch { return []; }
}

function Row({ label, value }: { label: string; value: string }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex justify-between items-start py-2" style={{ borderBottom: "1px solid rgba(32,27,21,0.06)" }}>
      <span className="text-xs text-frock-muted shrink-0">{label}</span>
      <span className="text-xs font-medium text-frock-ink text-right ml-4 leading-snug">{value}</span>
    </div>
  );
}

function Section({ title }: { title: string }) {
  return (
    <p className="text-[10px] uppercase font-semibold text-frock-muted mt-5 mb-1" style={{ letterSpacing: "0.14em" }}>
      {title}
    </p>
  );
}

function FieldInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs tracking-widest text-frock-muted uppercase" style={{ letterSpacing: "0.12em" }}>{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? label}
        className="rounded-xl px-3 py-2.5 text-sm text-frock-ink outline-none transition-colors bg-white"
        style={{ border: `1px solid ${value ? "#D6402B" : "rgba(32,27,21,0.12)"}` }}
      />
    </div>
  );
}

type Mode = "view" | "edit" | "confirm-delete";

type Props = {
  item: GarmentDetail;
  onClose: () => void;
  onSave?: (data: EditFormData) => Promise<void>;
  onDelete?: () => Promise<void>;
  onRetryClassify?: () => void;
};

export function GarmentDetailSheet({ item, onClose, onSave, onDelete, onRetryClassify }: Props) {
  const [mode, setMode] = useState<Mode>("view");
  const [form, setForm] = useState<EditFormData>({
    itemType: item.itemType ?? "",
    color: (item.colorPrimary ?? item.color) ?? "",
    pattern: item.pattern ?? "",
    formalityLevel: (item.formality ?? item.formalityLevel) ?? "",
    season: "",
  });
  const [saving, setSaving] = useState(false);

  const img = item.thumbnailPath ?? item.imageUrl;
  const name = fmt(item.subcategory ?? item.itemType);
  const fit = parseTags(item.fit);
  const occasions = parseTags(item.occasionTags);

  const colorLabel = fmt(item.colorPrimary ?? item.color);
  const subtitle = [
    colorLabel !== "—" ? colorLabel : null,
    item.pattern ? fmt(item.pattern) : null,
  ].filter(Boolean).join(" · ") || fmt(item.category);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave?.(form);
      setMode("view");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await onDelete?.();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl"
        style={{ maxHeight: "92vh", overflowY: "auto" }}
      >
        {/* Photo */}
        <div className="relative" style={{ height: 260 }}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img} alt={name} className="w-full h-full object-cover rounded-t-3xl" />
          ) : (
            <div className="w-full h-full rounded-t-3xl flex items-center justify-center" style={{ background: "#F0E8DB" }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
                  stroke="#C8B89A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          )}
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-3xl"
            style={{ height: 80, background: "linear-gradient(to top, rgba(255,255,255,0.95), transparent)" }}
          />
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(32,27,21,0.5)" }}
            aria-label="Close"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.5)" }} />
        </div>

        <div className="px-5 pb-10">
          {/* Name */}
          <div className="mt-3 mb-1">
            <h2 className="text-2xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
              {name}
            </h2>
            {subtitle && subtitle !== "—" && (
              <p className="text-sm text-frock-muted mt-0.5">{subtitle}</p>
            )}
          </div>

          {/* Status banners */}
          {item.status === "pending_classification" && (
            <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center gap-2" style={{ background: "#F9F6E8" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#e8c840" }} />
              <span className="text-xs" style={{ color: "#8C6A3F" }}>Analysing your item…</span>
            </div>
          )}
          {item.status === "failed" && (
            <div className="mt-3 rounded-xl px-3 py-2.5 flex items-center justify-between" style={{ background: "#FFF4F2" }}>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D6402B" }} />
                <span className="text-xs" style={{ color: "#D6402B" }}>Classification failed</span>
              </div>
              {onRetryClassify && (
                <button onClick={onRetryClassify} className="text-xs font-semibold" style={{ color: "#D6402B" }}>Retry →</button>
              )}
            </div>
          )}

          {/* VIEW — all attributes */}
          {mode === "view" && item.status === "classified" && (
            <>
              <Section title="Classification" />
              <Row label="Category" value={fmt(item.category)} />
              <Row label="Subcategory" value={fmt(item.subcategory)} />
              <Row label="Primary colour" value={fmt(item.colorPrimary ?? item.color)} />
              {item.colorSecondary && <Row label="Secondary colour" value={fmt(item.colorSecondary)} />}
              {item.undertone && <Row label="Undertone" value={fmt(item.undertone)} />}
              <Row label="Pattern" value={fmt(item.pattern)} />
              <Row label="Fabric" value={fmt(item.fabric ?? item.fabricType)} />
              <Row label="Formality" value={fmt(item.formality ?? item.formalityLevel)} />
              <Row label="Season weight" value={fmt(item.seasonWeight)} />
              {fit.length > 0 && <Row label="Fit" value={fit.map(s => fmt(s)).join(", ")} />}

              {(item.neckline || item.sleeveLength || item.hemLength || item.rise || item.legOpening) && (
                <>
                  <Section title="Silhouette" />
                  {item.neckline && <Row label="Neckline" value={fmt(item.neckline)} />}
                  {item.sleeveLength && <Row label="Sleeve length" value={fmt(item.sleeveLength)} />}
                  {item.hemLength && <Row label="Hem length" value={fmt(item.hemLength)} />}
                  {item.rise && <Row label="Rise" value={fmt(item.rise)} />}
                  {item.legOpening && <Row label="Leg opening" value={fmt(item.legOpening)} />}
                </>
              )}

              {(item.aesthetic || occasions.length > 0 || item.colorGroup || item.textureFinish || item.layeringRole || item.printScale || item.isStatement != null) && (
                <>
                  <Section title="Style" />
                  {item.aesthetic && <Row label="Aesthetic" value={fmt(item.aesthetic)} />}
                  {item.colorGroup && <Row label="Colour group" value={fmt(item.colorGroup)} />}
                  {item.textureFinish && <Row label="Texture / finish" value={fmt(item.textureFinish)} />}
                  {item.layeringRole && <Row label="Layering role" value={fmt(item.layeringRole)} />}
                  {item.printScale && <Row label="Print scale" value={fmt(item.printScale)} />}
                  {occasions.length > 0 && <Row label="Occasions" value={occasions.map(s => fmt(s)).join(", ")} />}
                  {item.isStatement != null && <Row label="Statement piece" value={item.isStatement ? "Yes" : "No"} />}
                </>
              )}
            </>
          )}

          {/* EDIT mode */}
          {mode === "edit" && (
            <div className="mt-4">
              <div className="grid grid-cols-2 gap-3 mb-5">
                <FieldInput label="Type" value={form.itemType} onChange={(v) => setForm({ ...form, itemType: v })} placeholder="e.g. Blazer" />
                <FieldInput label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="e.g. Navy" />
                <FieldInput label="Pattern" value={form.pattern} onChange={(v) => setForm({ ...form, pattern: v })} placeholder="e.g. Stripe" />
                <FieldInput label="Formality" value={form.formalityLevel} onChange={(v) => setForm({ ...form, formalityLevel: v })} placeholder="e.g. Smart casual" />
                <FieldInput label="Season" value={form.season} onChange={(v) => setForm({ ...form, season: v })} placeholder="e.g. All year" />
              </div>
              <button
                onClick={handleSave}
                disabled={saving || !form.itemType.trim()}
                className="w-full rounded-full py-4 font-medium text-base text-white transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
                style={{ background: "#D6402B" }}
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              <button
                onClick={() => setMode("view")}
                className="w-full text-sm text-center text-frock-muted hover:text-frock-ink transition-colors py-3"
              >
                Cancel
              </button>
            </div>
          )}

          {/* CONFIRM DELETE mode */}
          {mode === "confirm-delete" && (
            <div className="mt-4 flex flex-col gap-3">
              <p className="text-sm text-frock-ink font-medium text-center">Remove this item?</p>
              <p className="text-xs text-frock-muted text-center leading-relaxed">
                It will stop appearing in outfits and recommendations.
              </p>
              <button
                onClick={handleDelete}
                disabled={saving}
                className="w-full rounded-full py-4 font-medium text-base text-white disabled:opacity-40"
                style={{ background: "#D6402B" }}
              >
                {saving ? "Removing…" : "Yes, remove"}
              </button>
              <button
                onClick={() => setMode("view")}
                className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors py-1"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Action bar (view mode only) */}
          {mode === "view" && (
            <div className="flex gap-3 mt-6">
              {onSave && (
                <button
                  onClick={() => setMode("edit")}
                  className="flex-1 rounded-full py-3.5 text-sm font-medium transition-colors"
                  style={{ background: "#F0E8DB", color: "#554C41" }}
                >
                  Edit details
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => setMode("confirm-delete")}
                  className="flex-1 rounded-full py-3.5 text-sm font-medium transition-colors"
                  style={{ background: "#F5DCD3", color: "#D6402B" }}
                >
                  Remove
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Right-panel variant (no overlay, renders as an inline card) ───────────────

export function GarmentDetailPanel({ item, onClose, onSave, onDelete, onRetryClassify }: Props) {
  type Mode = "view" | "edit" | "confirm-delete";
  const [mode, setMode] = useState<Mode>("view");
  const [form, setForm] = useState<EditFormData>({
    itemType: item.itemType ?? "",
    color: (item.colorPrimary ?? item.color) ?? "",
    pattern: item.pattern ?? "",
    formalityLevel: (item.formality ?? item.formalityLevel) ?? "",
    season: "",
  });
  const [saving, setSaving] = useState(false);

  const img = item.thumbnailPath ?? item.imageUrl;
  const name = fmt(item.subcategory ?? item.itemType);
  const fit = parseTags(item.fit);
  const occasions = parseTags(item.occasionTags);
  const colorLabel = fmt(item.colorPrimary ?? item.color);
  const subtitle = [
    colorLabel !== "—" ? colorLabel : null,
    item.pattern ? fmt(item.pattern) : null,
  ].filter(Boolean).join(" · ") || fmt(item.category);

  async function handleSave() {
    setSaving(true);
    try { await onSave?.(form); setMode("view"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    setSaving(true);
    try { await onDelete?.(); onClose(); }
    finally { setSaving(false); }
  }

  return (
    <div
      className="rounded-2xl bg-white flex flex-col overflow-hidden"
      style={{
        boxShadow: "0 2px 20px rgba(46,35,22,0.10)",
        border: "1px solid rgba(32,27,21,0.07)",
        maxHeight: "calc(100vh - 100px)",
      }}
    >
      {/* Scrollable content */}
      <div className="overflow-y-auto flex-1 px-4 pb-6 pt-4 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(32,27,21,0.10)" }}
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1 1l8 8M9 1L1 9" stroke="#554C41" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>
        <h2 className="text-xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          {name}
        </h2>
        {subtitle && subtitle !== "—" && (
          <p className="text-sm text-frock-muted mt-0.5 mb-2">{subtitle}</p>
        )}

        {item.status === "pending_classification" && (
          <div className="mt-2 mb-3 rounded-xl px-3 py-2 flex items-center gap-2" style={{ background: "#F9F6E8" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#e8c840" }} />
            <span className="text-xs" style={{ color: "#8C6A3F" }}>Analysing…</span>
          </div>
        )}
        {item.status === "failed" && (
          <div className="mt-2 mb-3 rounded-xl px-3 py-2 flex items-center justify-between" style={{ background: "#FFF4F2" }}>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D6402B" }} />
              <span className="text-xs" style={{ color: "#D6402B" }}>Classification failed</span>
            </div>
            {onRetryClassify && (
              <button onClick={onRetryClassify} className="text-xs font-semibold" style={{ color: "#D6402B" }}>Retry →</button>
            )}
          </div>
        )}

        {mode === "view" && item.status === "classified" && (
          <>
            <Section title="Classification" />
            <Row label="Category" value={fmt(item.category)} />
            <Row label="Subcategory" value={fmt(item.subcategory)} />
            <Row label="Primary colour" value={fmt(item.colorPrimary ?? item.color)} />
            {item.colorSecondary && <Row label="Secondary colour" value={fmt(item.colorSecondary)} />}
            {item.undertone && <Row label="Undertone" value={fmt(item.undertone)} />}
            <Row label="Pattern" value={fmt(item.pattern)} />
            <Row label="Fabric" value={fmt(item.fabric ?? item.fabricType)} />
            <Row label="Formality" value={fmt(item.formality ?? item.formalityLevel)} />
            <Row label="Season weight" value={fmt(item.seasonWeight)} />
            {fit.length > 0 && <Row label="Fit" value={fit.map(s => fmt(s)).join(", ")} />}

            {(item.neckline || item.sleeveLength || item.hemLength || item.rise || item.legOpening) && (
              <>
                <Section title="Silhouette" />
                {item.neckline && <Row label="Neckline" value={fmt(item.neckline)} />}
                {item.sleeveLength && <Row label="Sleeve length" value={fmt(item.sleeveLength)} />}
                {item.hemLength && <Row label="Hem length" value={fmt(item.hemLength)} />}
                {item.rise && <Row label="Rise" value={fmt(item.rise)} />}
                {item.legOpening && <Row label="Leg opening" value={fmt(item.legOpening)} />}
              </>
            )}

            {(item.aesthetic || occasions.length > 0 || item.colorGroup || item.textureFinish || item.layeringRole || item.printScale || item.isStatement != null) && (
              <>
                <Section title="Style" />
                {item.aesthetic && <Row label="Aesthetic" value={fmt(item.aesthetic)} />}
                {item.colorGroup && <Row label="Colour group" value={fmt(item.colorGroup)} />}
                {item.textureFinish && <Row label="Texture" value={fmt(item.textureFinish)} />}
                {item.layeringRole && <Row label="Layering" value={fmt(item.layeringRole)} />}
                {item.printScale && <Row label="Print scale" value={fmt(item.printScale)} />}
                {occasions.length > 0 && <Row label="Occasions" value={occasions.map(s => fmt(s)).join(", ")} />}
                {item.isStatement != null && <Row label="Statement piece" value={item.isStatement ? "Yes" : "No"} />}
              </>
            )}
          </>
        )}

        {mode === "edit" && (
          <div className="mt-2">
            <div className="flex flex-col gap-3 mb-4">
              <FieldInput label="Type" value={form.itemType} onChange={(v) => setForm({ ...form, itemType: v })} placeholder="e.g. Blazer" />
              <FieldInput label="Color" value={form.color} onChange={(v) => setForm({ ...form, color: v })} placeholder="e.g. Navy" />
              <FieldInput label="Pattern" value={form.pattern} onChange={(v) => setForm({ ...form, pattern: v })} placeholder="e.g. Stripe" />
              <FieldInput label="Formality" value={form.formalityLevel} onChange={(v) => setForm({ ...form, formalityLevel: v })} placeholder="e.g. Smart casual" />
              <FieldInput label="Season" value={form.season} onChange={(v) => setForm({ ...form, season: v })} placeholder="e.g. All year" />
            </div>
            <button
              onClick={handleSave}
              disabled={saving || !form.itemType.trim()}
              className="w-full rounded-full py-3.5 font-medium text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              style={{ background: "#D6402B" }}
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button onClick={() => setMode("view")} className="w-full text-sm text-center text-frock-muted hover:text-frock-ink py-2.5">
              Cancel
            </button>
          </div>
        )}

        {mode === "confirm-delete" && (
          <div className="mt-3 flex flex-col gap-3">
            <p className="text-sm text-frock-ink font-medium text-center">Remove this item?</p>
            <p className="text-xs text-frock-muted text-center leading-relaxed">It will stop appearing in outfits.</p>
            <button
              onClick={handleDelete}
              disabled={saving}
              className="w-full rounded-full py-3.5 font-medium text-sm text-white disabled:opacity-40"
              style={{ background: "#D6402B" }}
            >
              {saving ? "Removing…" : "Yes, remove"}
            </button>
            <button onClick={() => setMode("view")} className="text-sm text-center text-frock-muted py-1">Cancel</button>
          </div>
        )}

        {mode === "view" && (
          <div className="flex gap-2 mt-5">
            {onSave && (
              <button
                onClick={() => setMode("edit")}
                className="flex-1 rounded-full py-3 text-sm font-medium"
                style={{ background: "#F0E8DB", color: "#554C41" }}
              >
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => setMode("confirm-delete")}
                className="flex-1 rounded-full py-3 text-sm font-medium"
                style={{ background: "#F5DCD3", color: "#D6402B" }}
              >
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
