"use client";

import { create } from "zustand";

export type SizeEntry = { category: string; sizeValue: string; region?: string };
export type BrandPrefEntry = { brandId: string; wearCategory: string };

interface OnboardingState {
  currentStep: number;
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
  setPhotoBlobs: (blobs: File[]) => void;
  setProfile: (profile: Partial<OnboardingState["profile"]>) => void;
  setSizes: (sizes: SizeEntry[]) => void;
  setBrandPreferences: (prefs: BrandPrefEntry[]) => void;
  setPhotoUrls: (urls: string[]) => void;
  reset: () => void;
}

const TOTAL_STEPS = 8;

export const useOnboardingStore = create<OnboardingState>((set) => ({
  currentStep: 1,
  photoBlobs: [],
  profile: {},
  sizes: [],
  brandPreferences: [],
  photoUrls: [],

  setStep: (step) => set({ currentStep: step }),
  goNext: () =>
    set((s) => ({ currentStep: Math.min(s.currentStep + 1, TOTAL_STEPS) })),
  goBack: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  setPhotoBlobs: (photoBlobs) => set({ photoBlobs }),
  setProfile: (profile) =>
    set((s) => ({ profile: { ...s.profile, ...profile } })),
  setSizes: (sizes) => set({ sizes }),
  setBrandPreferences: (brandPreferences) => set({ brandPreferences }),
  setPhotoUrls: (photoUrls) => set({ photoUrls }),
  reset: () =>
    set({
      currentStep: 1,
      photoBlobs: [],
      profile: {},
      sizes: [],
      brandPreferences: [],
      photoUrls: [],
    }),
}));
