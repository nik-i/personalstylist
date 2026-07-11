"use client";

import { create } from "zustand";

export type SizeEntry = { category: string; sizeValue: string; region?: string };
export type BrandPrefEntry = { brandId: string; wearCategory: string };

export interface OnboardingState {
  currentStep: number;
  closetCount: number;
  country: string;
  taste: Record<number, boolean>;
  hubDone: { taste: boolean; fit: boolean; shops: boolean };
  sizeInputs: { tops: string; bottoms: string; dresses: string; shoes: string };
  shape: string | null;
  emphasis: Record<string, "show" | "down" | null>;
  budget: string | null;
  brands: Record<string, string[]>;

  // kept for API compatibility
  photoBlobs: File[];
  profile: {
    coloring?: string;
    bodyShape?: string;
    styleSignals?: string;
    highlightPrefs?: string;
    downplayPrefs?: string;
  };
  sizes: SizeEntry[];
  brandPreferences: BrandPrefEntry[];
  photoUrls: string[];

  setStep: (step: number) => void;
  goNext: () => void;
  goBack: () => void;
  setClosetCount: (n: number) => void;
  setCountry: (c: string) => void;
  toggleTaste: (id: number) => void;
  setHubDone: (key: keyof OnboardingState["hubDone"], val: boolean) => void;
  setSizeInput: (key: keyof OnboardingState["sizeInputs"], val: string) => void;
  setShape: (s: string | null) => void;
  setEmphasis: (area: string, mode: "show" | "down" | null) => void;
  setBudget: (b: string | null) => void;
  toggleBrand: (context: string, brand: string) => void;
  setPhotoBlobs: (blobs: File[]) => void;
  setProfile: (profile: Partial<OnboardingState["profile"]>) => void;
  setSizes: (sizes: SizeEntry[]) => void;
  setBrandPreferences: (prefs: BrandPrefEntry[]) => void;
  setPhotoUrls: (urls: string[]) => void;
  reset: () => void;
}

const TOTAL_STEPS = 7;

const initialState = {
  currentStep: 1,
  closetCount: 0,
  country: "United Kingdom",
  taste: {} as Record<number, boolean>,
  hubDone: { taste: false, fit: false, shops: false },
  sizeInputs: { tops: "", bottoms: "", dresses: "", shoes: "" },
  shape: null,
  emphasis: {} as Record<string, "show" | "down" | null>,
  budget: null,
  brands: { day: ["Zara", "COS"], office: [], occasion: [], athletic: ["Lululemon"] },
  photoBlobs: [],
  profile: {},
  sizes: [],
  brandPreferences: [],
  photoUrls: [],
};

export const useOnboardingStore = create<OnboardingState>((set) => ({
  ...initialState,

  setStep: (step) => set({ currentStep: step }),
  goNext: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, TOTAL_STEPS) })),
  goBack: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),

  setClosetCount: (n) => set({ closetCount: n }),
  setCountry: (country) => set({ country }),
  toggleTaste: (id) =>
    set((s) => ({ taste: { ...s.taste, [id]: !s.taste[id] } })),
  setHubDone: (key, val) =>
    set((s) => ({ hubDone: { ...s.hubDone, [key]: val } })),
  setSizeInput: (key, val) =>
    set((s) => ({ sizeInputs: { ...s.sizeInputs, [key]: val } })),
  setShape: (shape) => set({ shape }),
  setEmphasis: (area, mode) =>
    set((s) => ({ emphasis: { ...s.emphasis, [area]: mode } })),
  setBudget: (budget) => set({ budget }),
  toggleBrand: (context, brand) =>
    set((s) => {
      const cur = s.brands[context] ?? [];
      const next = cur.includes(brand) ? cur.filter((b) => b !== brand) : [...cur, brand];
      return { brands: { ...s.brands, [context]: next } };
    }),

  setPhotoBlobs: (photoBlobs) => set({ photoBlobs }),
  setProfile: (profile) => set((s) => ({ profile: { ...s.profile, ...profile } })),
  setSizes: (sizes) => set({ sizes }),
  setBrandPreferences: (brandPreferences) => set({ brandPreferences }),
  setPhotoUrls: (photoUrls) => set({ photoUrls }),
  reset: () => set(initialState),
}));
