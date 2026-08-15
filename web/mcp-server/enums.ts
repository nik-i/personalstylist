import { z } from "zod";

export const CategoryEnum = z.enum([
  "top", "bottom", "dress", "outerwear", "footwear", "accessory",
]);

export const UndertoneEnum = z.enum(["warm", "cool", "neutral"]);

export const PatternEnum = z.enum(["solid", "stripe", "floral", "plaid", "print"]);

export const FabricEnum = z.enum([
  "denim", "knit", "silk_like", "leather", "linen", "cotton", "wool", "synthetic", "other",
]);

export const FitEnum = z.enum([
  "oversized", "tailored", "relaxed", "slim", "cropped",
  "high_waisted", "a_line", "straight", "flowy",
]);

export const FormalityEnum = z.enum(["casual", "smart_casual", "business", "formal"]);

export const SeasonWeightEnum = z.enum(["lightweight", "midweight", "heavy"]);

export const AestheticEnum = z.enum([
  "minimalist", "bohemian", "preppy", "streetwear", "classic", "romantic", "edgy", "athleisure",
]);

export const OccasionTagEnum = z.enum([
  "office", "date_night", "gym", "beach", "brunch", "travel",
  "cocktail", "casual_day", "evening_out", "wedding_guest",
]);

export const ColorGroupEnum = z.enum([
  "neutral", "earth_tone", "pastel", "jewel_tone", "bright", "black_white", "denim_wash",
]);

export const TextureFinishEnum = z.enum([
  "matte", "shiny", "sheer", "chunky_knit", "smooth", "ribbed", "washed",
]);

export const LayeringRoleEnum = z.enum(["base", "mid", "outer"]);

export const PrintScaleEnum = z.enum(["small", "medium", "large"]);

export const LegOpeningEnum = z.enum(["wide", "straight", "tapered"]);

export const ReactionEnum = z.enum([
  "liked", "disliked", "too_formal", "too_casual", "wrong_fit", "wrong_weather", "other",
]);

export const GroupingDimensionEnum = z.enum(["color", "formality", "weather", "aesthetic"]);

// Filters accepted by search_garments
export const SearchFiltersSchema = z.object({
  category: CategoryEnum.optional(),
  formality: FormalityEnum.optional(),
  season_weight: SeasonWeightEnum.optional(),
  pattern: PatternEnum.optional(),
  fabric: FabricEnum.optional(),
  color_primary: z.string().optional(),
  undertone: UndertoneEnum.optional(),
  fit: FitEnum.optional(),
  aesthetic: AestheticEnum.optional(),
  occasion_tag: OccasionTagEnum.optional(),
  color_group: ColorGroupEnum.optional(),
  layering_role: LayeringRoleEnum.optional(),
  is_statement: z.boolean().optional(),
});

// Patch accepted by update_garment_attributes — strict() rejects unknown keys
export const PatchSchema = z.object({
  fit: z.array(FitEnum).optional(),
  undertone: UndertoneEnum.optional(),
  formality: FormalityEnum.optional(),
  color_primary: z.string().optional(),
  color_secondary: z.string().nullable().optional(),
  season_weight: SeasonWeightEnum.optional(),
  aesthetic: AestheticEnum.optional(),
  occasion_tags: z.array(OccasionTagEnum).optional(),
  is_statement: z.boolean().optional(),
  color_group: ColorGroupEnum.optional(),
  layering_role: LayeringRoleEnum.nullable().optional(),
}).strict();
