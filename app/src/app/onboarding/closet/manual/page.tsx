"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useOnboardingStore } from "@/store/onboarding";
import type { ExtractedItem } from "@/types/extraction";

type ItemStatus = "processing" | "ready" | "error";

type ManualItem = {
  id: string;
  file: File;
  url: string;
  status: ItemStatus;
  meta: ExtractedItem | null;
  imageUrl: string | null; // persisted server path after upload
};

export default function ManualAddPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { setClosetCount, closetCount } = useOnboardingStore();

  const [items, setItems] = useState<ManualItem[]>([]);
  const [saving, setSaving] = useState(false);

  const readyItems = items.filter((it) => it.status === "ready" && it.meta);

  async function processFile(entry: ManualItem) {
    try {
      const fd = new FormData();
      fd.append("image", entry.file);
      fd.append("index", "0");

      // Run extract and image upload in parallel
      const [extractRes, uploadRes] = await Promise.all([
        fetch("/api/wardrobe/extract", { method: "POST", body: fd }),
        (async () => {
          const ufd = new FormData();
          ufd.append("image", entry.file);
          return fetch("/api/wardrobe/upload-image", { method: "POST", body: ufd });
        })(),
      ]);

      const meta = extractRes.ok
        ? ((await extractRes.json() as { items: ExtractedItem[] }).items?.[0] ?? null)
        : null;

      const imageUrl = uploadRes.ok
        ? ((await uploadRes.json() as { url: string }).url ?? null)
        : null;

      setItems((prev) =>
        prev.map((it) =>
          it.id === entry.id
            ? { ...it, status: meta ? "ready" : "error", meta, imageUrl }
            : it
        )
      );
    } catch {
      setItems((prev) =>
        prev.map((it) => (it.id === entry.id ? { ...it, status: "error" } : it))
      );
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newEntries: ManualItem[] = Array.from(files).map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      file: f,
      url: URL.createObjectURL(f),
      status: "processing",
      meta: null,
      imageUrl: null,
    }));
    setItems((prev) => [...prev, ...newEntries]);
    newEntries.forEach(processFile);
  }

  function removeItem(id: string) {
    setItems((prev) => {
      const entry = prev.find((it) => it.id === id);
      if (entry) URL.revokeObjectURL(entry.url);
      return prev.filter((it) => it.id !== id);
    });
  }

  async function handleAdd() {
    if (readyItems.length === 0 || saving) return;
    setSaving(true);
    try {
      const payload = readyItems.map(({ meta, imageUrl }) => ({
        itemType: meta!.itemType,
        color: meta!.color,
        pattern: meta!.pattern,
        fabricType: meta!.fabricType,
        formalityLevel: meta!.formalityLevel,
        season: meta!.season,
        warmthLevel: meta!.warmthLevel,
        imageUrl: imageUrl ?? null,
      }));

      const res = await fetch("/api/wardrobe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setClosetCount(closetCount + readyItems.length);
        toast.success(`${readyItems.length} item${readyItems.length !== 1 ? "s" : ""} added to your wardrobe`);
        router.push("/onboarding/wardrobe-preview");
      } else {
        toast.error("Couldn't save. Please try again.");
      }
    } catch {
      toast.error("Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
          Wardrobe · manual add
        </p>
        <h1 className="text-[28px] text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          Add your pieces
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          One item per photo — I'll tag each one automatically.
        </p>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Item grid */}
      {items.length === 0 ? (
        <button
          onClick={() => fileRef.current?.click()}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-14 text-center transition-colors hover:border-frock-rouge hover:bg-frock-blush/20"
          style={{ borderColor: "rgba(32,27,21,0.20)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#F8F3EB" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="5" width="24" height="18" rx="3" stroke="#554C41" strokeWidth="1.6" />
              <path d="M14 10v8M10 14h8" stroke="#D6402B" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-frock-ink">Choose photos</p>
            <p className="text-xs text-frock-muted mt-1">One garment per photo</p>
          </div>
        </button>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <div key={item.id} className="relative aspect-square rounded-xl overflow-hidden bg-[#F8F3EB]">
                {/* Photo thumbnail */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt="" className="w-full h-full object-cover" />

                {/* Status overlay */}
                {item.status === "processing" && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(248,243,235,0.75)" }}>
                    <div className="w-6 h-6 rounded-full border-2"
                      style={{ borderColor: "#D6402B", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                  </div>
                )}

                {item.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(255,240,240,0.85)" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#D6402B" strokeWidth="1.6" />
                      <path d="M10 6v5M10 13h.01" stroke="#D6402B" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Label strip */}
                {item.status === "ready" && item.meta && (
                  <div className="absolute bottom-0 inset-x-0 px-1.5 py-1"
                    style={{ background: "rgba(32,27,21,0.62)" }}>
                    <p className="text-[10px] leading-tight truncate"
                      style={{ color: "#F8F3EB", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                      {item.meta.itemType}
                    </p>
                  </div>
                )}

                {/* Remove button */}
                <button
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(32,27,21,0.60)" }}
                  onClick={() => removeItem(item.id)}
                  aria-label="Remove"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1 1l7 7M8 1L1 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add more tile */}
            <button
              onClick={() => fileRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-frock-muted hover:border-frock-rouge hover:text-frock-rouge transition-colors"
              style={{ borderColor: "rgba(32,27,21,0.20)" }}
              aria-label="Add more"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="text-[10px]">Add more</span>
            </button>
          </div>

          {/* Status summary */}
          {items.some((it) => it.status === "processing") && (
            <p className="text-xs text-center text-frock-muted">
              Tagging {items.filter((it) => it.status === "processing").length} photo{items.filter((it) => it.status === "processing").length !== 1 ? "s" : ""}…
            </p>
          )}
        </>
      )}

      {/* CTA */}
      {items.length > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={handleAdd}
            disabled={readyItems.length === 0 || saving}
            className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
            style={{ background: "#D6402B" }}
          >
            {saving
              ? "Saving…"
              : readyItems.length === 0
              ? "Tagging items…"
              : `Add ${readyItems.length} item${readyItems.length !== 1 ? "s" : ""} to wardrobe →`}
          </button>
          <button
            onClick={() => router.push("/onboarding/landing")}
            className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors underline underline-offset-2 py-1"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
