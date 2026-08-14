"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import type { ExtractedItem } from "@/types/extraction";

type TileStatus = "queued" | "processing" | "done" | "error";

function cropImageToDataUrl(file: File, bbox: { x: number; y: number; w: number; h: number }): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const sw = Math.round(img.naturalWidth * bbox.w);
      const sh = Math.round(img.naturalHeight * bbox.h);
      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(
          img,
          Math.round(img.naturalWidth * bbox.x),
          Math.round(img.naturalHeight * bbox.y),
          sw, sh,
          0, 0, sw, sh
        );
      }
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.88));
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(""); };
    img.src = url;
  });
}

async function removeBackground(cropDataUrl: string): Promise<string> {
  try {
    const fetchRes = await fetch(cropDataUrl);
    const blob = await fetchRes.blob();
    const fd = new FormData();
    fd.append("image", blob, "crop.jpg");
    const res = await fetch("/api/wardrobe/remove-bg", { method: "POST", body: fd });
    if (res.ok) {
      const data = await res.json() as { dataUrl: string };
      return data.dataUrl || cropDataUrl;
    }
  } catch {
    // fall through to return original crop
  }
  return cropDataUrl;
}

export default function ImportScanPage() {
  const router = useRouter();
  const { photoBlobs, importPhotosCount, setExtractedItems } = useOnboardingStore();

  const count = Math.max(photoBlobs.length || importPhotosCount, 1);
  const [statuses, setStatuses] = useState<TileStatus[]>(() => Array(count).fill("queued"));
  const [doneCount, setDoneCount] = useState(0);
  const [allDone, setAllDone] = useState(false);
  const ran = useRef(false);

  useEffect(() => {
    // Strict-mode guard — only run extraction once
    if (ran.current) return;
    ran.current = true;

    async function runExtraction() {
      const accumulated: ExtractedItem[] = [];

      for (let i = 0; i < count; i++) {
        setStatuses((prev) => {
          const next = [...prev];
          next[i] = "processing";
          return next;
        });

        let photoOk = false;
        try {
          const file = photoBlobs[i];
          if (file) {
            const fd = new FormData();
            fd.append("image", file);
            fd.append("index", String(i));

            const res = await fetch("/api/wardrobe/extract", { method: "POST", body: fd });
            if (res.ok) {
              const data = await res.json() as { items: ExtractedItem[] };
              const items = data.items ?? [];
              // Crop each item's bbox, then remove background
              const withCrops = await Promise.all(
                items.map(async (item) => {
                  if (item.bbox) {
                    const crop = await cropImageToDataUrl(file, item.bbox);
                    if (!crop) return item;
                    const cropUrl = await removeBackground(crop);
                    return { ...item, cropUrl };
                  }
                  return item;
                })
              );
              accumulated.push(...withCrops);
              photoOk = true;
            }
          } else {
            photoOk = true; // no blob = placeholder tile, not an error
          }
        } catch {
          // Individual photo failure is non-fatal — continue
        }

        setStatuses((prev) => {
          const next = [...prev];
          next[i] = photoOk ? "done" : "error";
          return next;
        });
        setDoneCount(i + 1);
      }

      setExtractedItems(accumulated);
      setAllDone(true);
      setTimeout(() => router.push("/onboarding/closet/import/review"), 600);
    }

    runExtraction();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex flex-col items-center gap-8 py-10 animate-[frkFade_0.3s_ease]">
      {/* Header */}
      <div className="flex flex-col items-center gap-2 text-center">
        <h1
          className="text-2xl text-frock-ink leading-tight"
          style={{ fontFamily: "var(--font-serif)" }}
        >
          {allDone ? "Done — checking results…" : "Analysing your clothes…"}
        </h1>
        <p className="text-sm text-frock-muted px-4">
          {allDone
            ? "Found the pieces, putting them together."
            : "Tagging colours, cuts, and fabric as I go."}
        </p>
      </div>

      {/* Per-photo tile grid */}
      <div className="flex flex-wrap justify-center gap-2" style={{ maxWidth: 280 }}>
        {statuses.map((status, i) => (
          <div
            key={i}
            className="w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300"
            style={{
              background:
                status === "done" || status === "error"
                  ? status === "error" ? "#FFF0F0" : "#E3EDE4"
                  : status === "processing"
                  ? "#F5DCD3"
                  : "#F0E8DB",
              border: status === "processing" ? "2px solid #D6402B" : "2px solid transparent",
            }}
          >
            {status === "done" && (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8l3.5 3.5L13 4.5" stroke="#4F7B58" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
            {status === "error" && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 4v4M7 10h.01" stroke="#D6402B" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            )}
            {status === "processing" && (
              <div
                className="w-4 h-4 rounded-full border-2"
                style={{
                  borderColor: "#D6402B",
                  borderTopColor: "transparent",
                  animation: "spin 0.7s linear infinite",
                }}
              />
            )}
            {status === "queued" && (
              <span style={{ fontSize: 10, color: "#8C8375" }}>{i + 1}</span>
            )}
          </div>
        ))}
      </div>

      {/* Overall progress */}
      <p className="text-sm text-frock-muted">
        {doneCount} of {count} photo{count !== 1 ? "s" : ""} analysed
      </p>

      {/* Progress bar */}
      <div className="rounded-full overflow-hidden" style={{ width: 200, height: 4, background: "#F0E8DB" }}>
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ background: "#D6402B", width: `${(doneCount / count) * 100}%` }}
        />
      </div>
    </div>
  );
}
