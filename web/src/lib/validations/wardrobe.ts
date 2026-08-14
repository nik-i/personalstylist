import { z } from "zod";

export const WardrobeItemCreateSchema = z.object({
  itemType: z.string(),
  color: z.string().optional(),
  pattern: z.string().optional(),
  fabricType: z.string().optional(),
  formalityLevel: z.string().optional(),
  season: z.string().optional(),
  warmthLevel: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imageUrl: z.string().url().optional(),
  source: z.string().optional(),
});

export const WardrobeItemUpdateSchema = WardrobeItemCreateSchema.partial();

export type WardrobeItemCreate = z.infer<typeof WardrobeItemCreateSchema>;
export type WardrobeItemUpdate = z.infer<typeof WardrobeItemUpdateSchema>;
