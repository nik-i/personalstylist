"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { AppShell } from "@/components/layout/AppShell";

// Status mirrors what the server sets on WardrobeItem.status
type ItemStatus = "uploading" | "pending_classification" | "classified" | "error";

type ManualItem = {
  localId: string;       // client-only key
  garmentId: string | null; // DB id once saved
  file: File;
  preview: string;       // object URL for display
  status: ItemStatus;
  label: string | null;  // subcategory returned after classification
};

const ACCEPTED = "image/jpeg,image/png,image/webp,image/heic";

export default function ManualAddPage() {
  const router = useRouter();
  const { setClosetCount, closetCount } = useOnboardingStore();

  const [items, setItems] = useState<ManualItem[]>([]);

  function updateItem(localId: string, patch: Partial<ManualItem>) {
    setItems((prev) => prev.map((it) => it.localId === localId ? { ...it, ...patch } : it));
  }

  async function processFile(entry: ManualItem) {
    const fd = new FormData();
    fd.append("image", entry.file);

    try {
      // POST /api/garments: saves to disk, creates DB row, fires classification in background
      const res = await fetch("/api/garments", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const { id } = await res.json() as { id: string };
      updateItem(entry.localId, { garmentId: id, status: "pending_classification" });

      // Poll until classification finishes (max ~60 s, every 3 s)
      for (let i = 0; i < 20; i++) {
        await new Promise((r) => setTimeout(r, 3000));
        const check = await fetch(`/api/garments/${id}`);
        if (!check.ok) break;
        const data = await check.json() as { status: string; subcategory?: string; itemType?: string };
        if (data.status === "classified") {
          updateItem(entry.localId, {
            status: "classified",
            label: data.subcategory ?? data.itemType ?? null,
          });
          return;
        }
        if (data.status === "failed") {
          updateItem(entry.localId, { status: "error" });
          return;
        }
      }
      // Timed out — still saved, just no rich label yet
      updateItem(entry.localId, { status: "pending_classification" });
    } catch {
      updateItem(entry.localId, { status: "error" });
    }
  }

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const newEntries: ManualItem[] = Array.from(files).map((f) => ({
      localId: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      garmentId: null,
      file: f,
      preview: URL.createObjectURL(f),
      status: "uploading",
      label: null,
    }));
    setItems((prev) => [...prev, ...newEntries]);
    newEntries.forEach(processFile);
  }

  function removeItem(localId: string) {
    setItems((prev) => {
      const entry = prev.find((it) => it.localId === localId);
      if (entry) {
        URL.revokeObjectURL(entry.preview);
        // Soft-delete from DB if already saved
        if (entry.garmentId) {
          fetch(`/api/wardrobe/${entry.garmentId}`, { method: "DELETE" }).catch(() => {});
        }
      }
      return prev.filter((it) => it.localId !== localId);
    });
  }

  function handleDone() {
    const saved = items.filter((it) => it.garmentId).length;
    setClosetCount(closetCount + saved);
    router.push("/onboarding/closet");
  }

  const busyCount = items.filter((it) => it.status === "uploading" || it.status === "pending_classification").length;
  const savedCount = items.filter((it) => it.garmentId).length;

  return (
    <AppShell activeView="wardrobe" topLabel="Add pieces" onNavClick={(id) => router.push(id === "wardrobe" ? "/onboarding/landing" : `/onboarding/landing?tab=${id}`)}>
    <div className="flex flex-col gap-5 max-w-lg animate-[frkFade_0.35s_ease]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
          Wardrobe · manual add
        </p>
        <h1 className="text-[28px] text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
          Add your pieces
        </h1>
        <p className="text-sm text-frock-muted leading-relaxed">
          One item per photo — each is saved and classified automatically.
        </p>
      </div>

      {/* File input — visually hidden but not display:none so Safari label-click works */}
      <input
        id="garment-file-input"
        type="file"
        accept={ACCEPTED}
        multiple
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Item grid */}
      {items.length === 0 ? (
        <label
          htmlFor="garment-file-input"
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-14 text-center transition-colors cursor-pointer hover:border-frock-rouge hover:bg-frock-blush/20"
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
        </label>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <div key={item.localId} className="relative aspect-square rounded-xl overflow-hidden bg-[#F8F3EB]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.preview} alt="" className="w-full h-full object-cover" />

                {/* Uploading overlay */}
                {(item.status === "uploading" || item.status === "pending_classification") && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1"
                    style={{ background: "rgba(248,243,235,0.80)" }}>
                    <div className="w-6 h-6 rounded-full border-2"
                      style={{ borderColor: "#D6402B", borderTopColor: "transparent", animation: "spin 0.7s linear infinite" }} />
                    <span className="text-[9px] text-frock-muted">
                      {item.status === "uploading" ? "Saving…" : "Classifying…"}
                    </span>
                  </div>
                )}

                {/* Error overlay */}
                {item.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center"
                    style={{ background: "rgba(255,240,240,0.85)" }}>
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <circle cx="10" cy="10" r="8" stroke="#D6402B" strokeWidth="1.6" />
                      <path d="M10 6v5M10 13h.01" stroke="#D6402B" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                  </div>
                )}

                {/* Label strip (classified) */}
                {item.status === "classified" && item.label && (
                  <div className="absolute bottom-0 inset-x-0 px-1.5 py-1"
                    style={{ background: "rgba(32,27,21,0.62)" }}>
                    <p className="text-[10px] leading-tight truncate"
                      style={{ color: "#F8F3EB", fontFamily: "var(--font-serif)", fontStyle: "italic" }}>
                      {item.label}
                    </p>
                  </div>
                )}

                {/* Saved-but-still-classifying indicator */}
                {item.status === "pending_classification" && item.garmentId && (
                  <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full" style={{ background: "#e8c840" }} />
                )}

                {/* Remove button */}
                <button
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(32,27,21,0.60)" }}
                  onClick={() => removeItem(item.localId)}
                  aria-label="Remove"
                >
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1 1l7 7M8 1L1 8" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            ))}

            {/* Add more tile */}
            <label
              htmlFor="garment-file-input"
              className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-frock-muted hover:border-frock-rouge hover:text-frock-rouge transition-colors cursor-pointer"
              style={{ borderColor: "rgba(32,27,21,0.20)" }}
              aria-label="Add more"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="text-[10px]">Add more</span>
            </label>
          </div>

          {busyCount > 0 && (
            <p className="text-xs text-center text-frock-muted">
              {busyCount} photo{busyCount !== 1 ? "s" : ""} being classified…
            </p>
          )}
        </>
      )}

      {/* CTA — shown once at least one item is saved */}
      {savedCount > 0 && (
        <div className="flex flex-col gap-2 mt-1">
          <button
            onClick={handleDone}
            className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80"
            style={{ background: "#D6402B" }}
          >
            {busyCount > 0
              ? `View wardrobe (${savedCount} saved, ${busyCount} classifying…)`
              : `View my wardrobe →`}
          </button>
          <p className="text-xs text-center text-frock-muted">
            Items are already in your wardrobe — you can leave any time
          </p>
        </div>
      )}
    </div>
    </AppShell>
  );
}
