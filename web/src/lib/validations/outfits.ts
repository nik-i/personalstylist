import { z } from "zod";

export const GoalFormSchema = z.object({
  goalType: z.string(),
  description: z.string().optional(),
  frustration: z.string().optional(),
  formalityLevel: z.string().optional(),
  eventDate: z.string().datetime().optional(),
});

export const FeedbackSchema = z.object({
  willWear: z.boolean().optional(),
  freeText: z.string().optional(),
  feedbackSource: z.string().default("manual"),
});

export type GoalForm = z.infer<typeof GoalFormSchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
