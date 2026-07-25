"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";

const CATEGORIES = ["tops", "bottoms", "dresses", "shoes"];

const SIZE_OPTIONS: Record<string, string[]> = {
  tops: ["XS", "S", "M", "L", "XL", "XXL"],
  bottoms: ["XS", "S", "M", "L", "XL", "XXL", "24", "26", "28", "30", "32", "34"],
  dresses: ["XS", "S", "M", "L", "XL", "XXL"],
  shoes: ["5", "5.5", "6", "6.5", "7", "7.5", "8", "8.5", "9", "9.5", "10", "11"],
};

export default function SizesPage() {
  const { sizes, setSizes, goNext } = useOnboardingStore();
  const router = useRouter();

  function getSize(cat: string) {
    return sizes.find((s) => s.category === cat)?.sizeValue ?? "";
  }

  function setSize(category: string, sizeValue: string) {
    const next = sizes.filter((s) => s.category !== category);
    if (sizeValue) next.push({ category, sizeValue });
    setSizes(next);
  }

  function handleContinue() {
    goNext();
    router.push("/onboarding/body-shape");
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-frock-ink">
          What sizes do you wear? (A1.2)
        </h2>
        <p className="text-frock-muted text-sm">
          Skip any category you don&apos;t shop for.
        </p>
      </div>

      <div className="flex flex-col gap-5">
        {CATEGORIES.map((cat) => (
          <div key={cat} className="flex flex-col gap-2">
            <label className="text-sm font-medium capitalize text-frock-ink">
              {cat}
            </label>
            <div className="flex flex-wrap gap-2">
              {SIZE_OPTIONS[cat].map((val) => (
                <button
                  key={val}
                  onClick={() =>
                    setSize(cat, getSize(cat) === val ? "" : val)
                  }
                  className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                    getSize(cat) === val
                      ? "border-frock-red bg-frock-red text-white"
                      : "border-frock-blush text-frock-muted hover:border-frock-muted"
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={handleContinue}
          className="w-full rounded-full bg-frock-red py-4 text-white font-medium hover:opacity-90 transition-opacity"
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
