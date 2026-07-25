"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

type PhotoEntry = { id: string; url: string; file: File };

const MAX_PHOTOS = 20;

export default function ImportPage() {
  const router = useRouter();
  const { setImportPhotosCount, setPhotoBlobs, setExtractedItems } = useOnboardingStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<PhotoEntry[]>([]);

  const remaining = MAX_PHOTOS - photos.length;
  const atMax = photos.length === MAX_PHOTOS;

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const toAdd = Array.from(files).slice(0, remaining);
    const newEntries: PhotoEntry[] = toAdd.map((f) => ({
      id: `${f.name}-${f.size}-${Date.now()}-${Math.random()}`,
      url: URL.createObjectURL(f),
      file: f,
    }));
    setPhotos((prev) => [...prev, ...newEntries]);
  }

  function removePhoto(id: string) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function handleExtract() {
    setImportPhotosCount(photos.length);
    setPhotoBlobs(photos.map((p) => p.file));
    setExtractedItems([]); // clear any previous extraction
    router.push("/onboarding/closet/import/scan");
  }

  function openPicker() {
    // Reset input so the same files can be re-selected after removal
    if (fileRef.current) fileRef.current.value = "";
    fileRef.current?.click();
  }

  return (
    <div className="flex flex-col gap-5 py-2 animate-[frkFade_0.35s_ease]">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <p className="text-xs tracking-widest uppercase text-frock-muted" style={{ letterSpacing: "0.14em" }}>
          Import · camera roll
        </p>
        {photos.length === 0 ? (
          <>
            <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
              Pick your photos
            </h1>
            <p className="text-sm text-frock-muted leading-relaxed">
              Up to {MAX_PHOTOS} at a time — I'll pull the clothes out and tag them.
            </p>
          </>
        ) : (
          <>
            <h1 className="text-3xl text-frock-ink leading-tight" style={{ fontFamily: "var(--font-serif)" }}>
              {photos.length} photo{photos.length !== 1 ? "s" : ""} selected
            </h1>
            <p className="text-sm text-frock-muted">
              {atMax ? "Maximum reached" : `You can add ${remaining} more`}
            </p>
          </>
        )}
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

      {/* Max reached banner */}
      {atMax && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: "#F5DCD3", color: "#D6402B" }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.4" />
            <path d="M8 5v3.5M8 11h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Maximum 20 photos reached
        </div>
      )}

      {/* Photo grid or empty state */}
      {photos.length === 0 ? (
        <button
          onClick={openPicker}
          className="flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-16 text-center transition-colors hover:border-frock-rouge hover:bg-frock-blush/20"
          style={{ borderColor: "rgba(32,27,21,0.20)" }}
        >
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: "#F8F3EB" }}>
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <rect x="2" y="5" width="24" height="18" rx="3" stroke="#554C41" strokeWidth="1.6" />
              <circle cx="10" cy="13" r="2.5" stroke="#554C41" strokeWidth="1.4" />
              <path d="M2 20l6-5.5 5 4.5 4.5-5.5 8.5 6" stroke="#554C41" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M22 9V5M20 7h4" stroke="#D6402B" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-frock-ink">Choose photos from your gallery</p>
            <p className="text-xs text-frock-muted mt-1">Pick one or several at once</p>
          </div>
        </button>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <div
              key={p.id}
              className="relative aspect-square rounded-xl overflow-hidden"
              style={{ border: "2px solid #D6402B" }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.url} alt="" className="w-full h-full object-cover" />
              <button
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                style={{ background: "rgba(32,27,21,0.65)" }}
                onClick={() => removePhoto(p.id)}
                aria-label="Remove photo"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          ))}

          {/* Add more tile */}
          {!atMax && (
            <button
              onClick={openPicker}
              className="aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 text-frock-muted hover:border-frock-rouge hover:text-frock-rouge transition-colors"
              style={{ borderColor: "rgba(32,27,21,0.20)" }}
              aria-label="Add more photos"
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
              <span className="text-[10px]">{remaining} left</span>
            </button>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3 mt-2">
        <button
          onClick={handleExtract}
          disabled={photos.length === 0}
          className="w-full rounded-full py-4 text-white font-medium text-base transition-opacity hover:opacity-90 active:opacity-80 disabled:opacity-40"
          style={{ background: "#D6402B" }}
        >
          {photos.length === 0
            ? "Select photos to continue"
            : `Extract ${photos.length} photo${photos.length !== 1 ? "s" : ""} →`}
        </button>
        <button
          onClick={() => router.push("/onboarding/closet")}
          className="text-sm text-center text-frock-muted hover:text-frock-ink transition-colors underline underline-offset-2"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
