"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

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


type DbItem = { id: string; itemType: string; color: string | null; imageUrl: string | null };

const METHODS = [
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
  {
    id: "photograph",
    route: "/onboarding/photos",
    label: "Photograph",
    icon: (
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M19 16a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h3l2-2h4l2 2h3a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="10" cy="11" r="3" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    ),
    bg: "#F1F1F1",
    color: "#554C41",
  },
];

export default function ClosetPage() {
  const router = useRouter();
  const [items, setItems] = useState<DbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

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
      .then(async (res) => {
        if (res.ok) setItems(await res.json() as DbItem[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const isEmpty = !loading && items.length === 0;

  return (
    <div className="flex flex-col gap-4 py-2 animate-[frkFade_0.35s_ease]">
      {/* Header */}
      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
          Virtual wardrobe
        </p>
        <h1 className="text-[26px] text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          {loading ? "Loading…" : isEmpty ? "Your wardrobe" : `${items.length} piece${items.length === 1 ? "" : "s"}`}
        </h1>
      </div>

      {/* Split layout */}
      <div className="flex gap-3 items-start">

        {/* Left — wardrobe grid */}
        <div className="flex-1 min-w-0">
          {loading && (
            <div className="grid grid-cols-2 gap-1.5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="w-full rounded-xl"
                  style={{
                    aspectRatio: "3/4",
                    background: "#F0E8DB",
                    animation: "pulse 1.5s ease-in-out infinite",
                  }}
                />
              ))}
            </div>
          )}

          {isEmpty && (
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-2xl py-10 text-center"
              style={{ background: "#F8F3EB", border: "1.5px dashed rgba(32,27,21,0.15)", minHeight: 220 }}
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: "#C8B89A" }}>
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0"
                  stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-xs text-frock-muted leading-snug px-3">
                Nothing here yet.<br />Add your first piece →
              </p>
            </div>
          )}

          {!loading && items.length > 0 && (
            <div className="grid grid-cols-2 gap-1.5">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative w-full rounded-xl overflow-hidden"
                  style={{
                    aspectRatio: "3/4",
                    background: colorToHex(item.color),
                  }}
                >
                  {item.imageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  )}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(to top, rgba(32,27,21,0.6) 0%, transparent 50%)" }}
                  />
                  <p
                    className="absolute bottom-2 left-2 right-2 text-[10px] leading-tight"
                    style={{ color: "#F8F3EB", fontFamily: "var(--font-serif)", fontStyle: "italic" }}
                  >
                    {item.itemType}
                  </p>
                  <button
                    onClick={() => handleDelete(item.id)}
                    disabled={deleting === item.id}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
                    style={{ background: "rgba(32,27,21,0.60)" }}
                    aria-label="Delete item"
                  >
                    {deleting === item.id ? (
                      <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: "white", borderTopColor: "transparent", animation: "spin 0.6s linear infinite" }} />
                    ) : (
                      <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                        <path d="M1 1l7 7M8 1L1 8" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right — icon-only add panel */}
        <div className="flex flex-col gap-2.5 shrink-0" style={{ width: 52 }}>
          {METHODS.map((m) => (
            <button
              key={m.id}
              onClick={() => router.push(m.route)}
              title={m.label}
              className="w-full flex items-center justify-center rounded-2xl transition-all active:scale-[0.93] hover:opacity-90"
              style={{ background: m.bg, color: m.color, aspectRatio: "1", padding: 0 }}
            >
              {m.icon}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
