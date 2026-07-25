import { z } from "zod";

export const OnboardingSchema = z.object({
  profile: z.object({
    coloring: z.string().optional(),
    bodyShape: z.string().optional(),
    styleSignals: z.string().optional(),
    highlightPrefs: z.string().optional(),
    downplayPrefs: z.string().optional(),
  }),
  sizes: z
    .array(
      z.object({
        category: z.string(),
        sizeValue: z.string(),
        region: z.string().optional(),
      })
    )
    .optional(),
  brandPreferences: z
    .array(
      z.object({
        brandId: z.string(),
        wearCategory: z.string(),
      })
    )
    .optional(),
  photoUrls: z.array(z.string().url()).optional(),
});

export type OnboardingPayload = z.infer<typeof OnboardingSchema>;
