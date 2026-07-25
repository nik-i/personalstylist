"use client";

import { useRouter } from "next/navigation";
import { useOnboardingStore } from "@/store/onboarding";
import { useState, useEffect } from "react";

const WEAR_CATEGORIES = ["day-to-day", "office", "occasion", "athletic"];

type Brand = { id: string; name: string };

export default function BrandsPage() {
  const { brandPreferences, setBrandPreferences, goNext } = useOnboardingStore();
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [activeCategory, setActiveCategory] = useState(WEAR_CATEGORIES[0]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch(`/api/brands?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then(setBrands)
      .catch(() => {});
  }, [query]);

  function isSelected(brandId: string) {
    return brandPreferences.some(
      (bp) => bp.brandId === brandId && bp.wearCategory === activeCategory
    );
  }

  function toggleBrand(brandId: string) {
    if (isSelected(brandId)) {
      setBrandPreferences(
        brandPreferences.filter(
          (bp) => !(bp.brandId === brandId && bp.wearCategory === activeCategory)
        )
      );
    } else {
      setBrandPreferences([
        ...brandPreferences,
        { brandId, wearCategory: activeCategory },
      ]);
    }
  }

  function handleContinue() {
    goNext();
    router.push("/onboarding/complete");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="font-serif text-2xl text-frock-ink">
          Which brands do you love? (A1.5)
        </h2>
        <p className="text-frock-muted text-sm">
          Select brands you already own or aspire to wear.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {WEAR_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`shrink-0 rounded-full border px-4 py-1.5 text-sm capitalize transition-colors ${
              activeCategory === cat
                ? "border-frock-red bg-frock-red text-white"
                : "border-frock-blush text-frock-muted"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <input
        type="search"
        placeholder="Search brands..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="rounded-xl border border-frock-blush px-4 py-2 text-sm outline-none focus:border-frock-red"
      />

      <div className="flex flex-wrap gap-2">
        {brands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => toggleBrand(brand.id)}
            className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
              isSelected(brand.id)
                ? "border-frock-red bg-frock-blush text-frock-ink"
                : "border-frock-blush text-frock-muted hover:border-frock-muted"
            }`}
          >
            {brand.name}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 pt-2">
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
