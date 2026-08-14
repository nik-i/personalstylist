import { z } from "zod";

export const OccasionCreateSchema = z.object({
  occasionType: z.string(),
  description: z.string().optional(),
  eventDate: z.string().datetime().optional(),
  formalityLevel: z.string().optional(),
});

export type OccasionCreate = z.infer<typeof OccasionCreateSchema>;
