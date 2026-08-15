import OpenAI from "openai";

export type GarmentCategory =
  | "top" | "bottom" | "dress" | "outerwear" | "footwear" | "accessory";

export type GarmentAttributes = {
  category: GarmentCategory;
  subcategory: string;
  color_primary: string;
  color_secondary: string | null;
  undertone: "warm" | "cool" | "neutral";
  pattern: "solid" | "stripe" | "floral" | "plaid" | "print";
  fabric: "denim" | "knit" | "silk_like" | "leather" | "linen" | "cotton" | "wool" | "synthetic" | "other";
  fit: Array<"oversized" | "tailored" | "relaxed" | "slim" | "cropped" | "high_waisted" | "a_line" | "straight" | "flowy">;
  formality: "casual" | "smart_casual" | "business" | "formal";
  season_weight: "lightweight" | "midweight" | "heavy";
  neckline: "crew" | "v_neck" | "scoop" | "collared" | "turtleneck" | "square" | "off_shoulder" | "halter" | null;
  sleeve_length: "sleeveless" | "short" | "three_quarter" | "long" | null;
  rise: "low" | "mid" | "high" | null;
  hem_length: "cropped" | "hip" | "knee" | "midi" | "maxi" | "ankle" | "full" | null;
  // Styling metadata
  aesthetic: "minimalist" | "bohemian" | "preppy" | "streetwear" | "classic" | "romantic" | "edgy" | "athleisure";
  occasion_tags: Array<"office" | "date_night" | "gym" | "beach" | "brunch" | "travel" | "cocktail" | "casual_day" | "evening_out" | "wedding_guest">;
  is_statement: boolean;
  color_group: "neutral" | "earth_tone" | "pastel" | "jewel_tone" | "bright" | "black_white" | "denim_wash";
  texture_finish: "matte" | "shiny" | "sheer" | "chunky_knit" | "smooth" | "ribbed" | "washed" | null;
  layering_role: "base" | "mid" | "outer" | null;
  print_scale: "small" | "medium" | "large" | null;
  leg_opening: "wide" | "straight" | "tapered" | null;
};

const SYSTEM_PROMPT = `You are a garment classification assistant.
You receive a photo of a single garment (not a person wearing it — judge the garment only).
Return a JSON object matching the strict schema exactly.
Rules:
- Set fields that don't apply to the garment category to null (e.g., rise for a blazer, neckline for shoes).
- Judge only what is clearly visible. For the "fit" array, return [] when fit cannot be confidently determined from the garment alone; never guess from context.
- Do not infer season or formality from context around the garment — classify the garment itself.

Styling metadata rules:
- aesthetic: the dominant style vibe — "classic" (timeless/traditional), "minimalist" (clean/understated), "preppy" (collegiate/structured), "streetwear" (urban/casual), "bohemian" (free-flowing/artsy), "romantic" (feminine/soft/delicate), "edgy" (dark/rebellious/unconventional), "athleisure" (sporty/functional).
- occasion_tags: every context this garment suits — include at least one. Use all that apply from: office, date_night, gym, beach, brunch, travel, cocktail, casual_day, evening_out, wedding_guest.
- is_statement: true if this garment would be the focal/hero piece of an outfit (bold color, distinctive print, unusual silhouette); false if it functions as a wardrobe basic that supports other pieces.
- color_group: bucket the primary color — "neutral" (black, white, grey, beige, camel, navy, ivory, cream), "earth_tone" (brown, rust, olive, terracotta, mustard, khaki), "pastel" (soft pink, lavender, mint, baby blue, peach), "jewel_tone" (emerald, sapphire, burgundy, deep purple, teal), "bright" (red, orange, yellow, cobalt, hot pink, lime), "black_white" (true black or true white), "denim_wash" (any denim shade from light to dark).
- texture_finish: surface quality — "smooth" (flat even surface), "matte" (non-reflective), "shiny" (lustrous/satin/metallic), "sheer" (translucent/see-through), "chunky_knit" (thick visible knit texture), "ribbed" (ribbed knit or textured ribbing), "washed" (distressed or faded finish). Set null if indeterminate.
- layering_role: "base" (worn directly against skin), "mid" (over a base but under outerwear), "outer" (the outermost layer). Set null for footwear and accessories.
- print_scale: size of the pattern when not solid — "small" (ditsy/micro prints), "medium" (standard scale), "large" (bold/oversized). Set null when pattern is solid.
- leg_opening: for bottoms and dresses only — "wide" (palazzo/wide-leg), "straight" (straight-leg/A-line), "tapered" (slim/skinny/tapered). Set null for all other categories.`;

const SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["top", "bottom", "dress", "outerwear", "footwear", "accessory"] },
    subcategory: { type: "string" },
    color_primary: { type: "string" },
    color_secondary: { anyOf: [{ type: "string" }, { type: "null" }] },
    undertone: { type: "string", enum: ["warm", "cool", "neutral"] },
    pattern: { type: "string", enum: ["solid", "stripe", "floral", "plaid", "print"] },
    fabric: { type: "string", enum: ["denim", "knit", "silk_like", "leather", "linen", "cotton", "wool", "synthetic", "other"] },
    fit: {
      type: "array",
      items: { type: "string", enum: ["oversized", "tailored", "relaxed", "slim", "cropped", "high_waisted", "a_line", "straight", "flowy"] },
    },
    formality: { type: "string", enum: ["casual", "smart_casual", "business", "formal"] },
    season_weight: { type: "string", enum: ["lightweight", "midweight", "heavy"] },
    neckline: { anyOf: [{ type: "string", enum: ["crew", "v_neck", "scoop", "collared", "turtleneck", "square", "off_shoulder", "halter"] }, { type: "null" }] },
    sleeve_length: { anyOf: [{ type: "string", enum: ["sleeveless", "short", "three_quarter", "long"] }, { type: "null" }] },
    rise: { anyOf: [{ type: "string", enum: ["low", "mid", "high"] }, { type: "null" }] },
    hem_length: { anyOf: [{ type: "string", enum: ["cropped", "hip", "knee", "midi", "maxi", "ankle", "full"] }, { type: "null" }] },
    // Styling metadata
    aesthetic: { type: "string", enum: ["minimalist", "bohemian", "preppy", "streetwear", "classic", "romantic", "edgy", "athleisure"] },
    occasion_tags: {
      type: "array",
      items: { type: "string", enum: ["office", "date_night", "gym", "beach", "brunch", "travel", "cocktail", "casual_day", "evening_out", "wedding_guest"] },
    },
    is_statement: { type: "boolean" },
    color_group: { type: "string", enum: ["neutral", "earth_tone", "pastel", "jewel_tone", "bright", "black_white", "denim_wash"] },
    texture_finish: { anyOf: [{ type: "string", enum: ["matte", "shiny", "sheer", "chunky_knit", "smooth", "ribbed", "washed"] }, { type: "null" }] },
    layering_role: { anyOf: [{ type: "string", enum: ["base", "mid", "outer"] }, { type: "null" }] },
    print_scale: { anyOf: [{ type: "string", enum: ["small", "medium", "large"] }, { type: "null" }] },
    leg_opening: { anyOf: [{ type: "string", enum: ["wide", "straight", "tapered"] }, { type: "null" }] },
  },
  required: [
    "category", "subcategory", "color_primary", "color_secondary",
    "undertone", "pattern", "fabric", "fit", "formality", "season_weight",
    "neckline", "sleeve_length", "rise", "hem_length",
    "aesthetic", "occasion_tags", "is_statement", "color_group",
    "texture_finish", "layering_role", "print_scale", "leg_opening",
  ],
  additionalProperties: false,
};

function getClient() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY is not set");
  return new OpenAI({ apiKey: key });
}

export async function classifyGarment(
  base64Image: string,
  mimeType: string,
): Promise<GarmentAttributes> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "garment_classification",
        strict: true,
        schema: SCHEMA,
      },
    },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: "auto" },
          },
          { type: "text", text: "Classify this garment." },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from OpenAI");
  return JSON.parse(text) as GarmentAttributes;
}
