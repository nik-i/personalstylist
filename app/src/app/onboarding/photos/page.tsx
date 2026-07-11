"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { useRef } from "react";

export default function PhotosPage() {
  const { photoBlobs, setPhotoBlobs, goNext } = useOnboardingStore();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    const next = [...photoBlobs, ...Array.from(files)].slice(0, 5);
    setPhotoBlobs(next);
  }

  function handleContinue() {
    goNext();
    router.push("/onboarding/style-quiz");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-frock-ink">
          Show us your best outfits
        </h2>
        <p className="text-frock-muted text-sm">
          Upload 3–5 photos of outfits you love. This helps FROCK learn your
          aesthetic. (A1.1)
        </p>
      </div>

      <div
        className="border-2 border-dashed border-frock-blush rounded-2xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-frock-red transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <span className="text-3xl">📸</span>
        <span className="text-frock-muted text-sm text-center">
          Tap to choose from your camera roll, or drag photos here
        </span>
        <span className="text-xs text-frock-muted">
          {photoBlobs.length}/5 photos added
        </span>
      </div>

      {photoBlobs.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {photoBlobs.map((file, i) => (
            <div key={i} className="relative w-16 h-16">
              <img
                src={URL.createObjectURL(file)}
                alt=""
                className="w-full h-full object-cover rounded-lg"
              />
              <button
                onClick={() =>
                  setPhotoBlobs(photoBlobs.filter((_, j) => j !== i))
                }
                className="absolute -top-1 -right-1 w-5 h-5 bg-frock-ink text-white text-xs rounded-full flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 mt-2">
        <button
          onClick={handleContinue}
          disabled={photoBlobs.length < 1}
          className="w-full rounded-full bg-frock-red py-4 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
        >
          Continue
        </button>
        <button
          onClick={handleContinue}
          className="text-sm text-frock-muted text-center hover:text-frock-ink"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
