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
};

const SYSTEM_PROMPT = `You are a garment classification assistant.
You receive a photo of a single garment (not a person wearing it — judge the garment only).
Return a JSON object matching the strict schema exactly.
Rules:
- Set fields that don't apply to the garment category to null (e.g., rise for a blazer, neckline for shoes).
- Judge only what is clearly visible. For the "fit" array, return [] when fit cannot be confidently determined from the garment alone; never guess from context.
- Do not infer season or formality from context around the garment — classify the garment itself.`;

const SCHEMA = {
  type: "object",
  properties: {
    category: { type: "string", enum: ["top", "bottom", "dress", "outerwear", "footwear", "accessory"] },
    subcategory: { type: "string" },
    color_primary: { type: "string" },
    color_secondary: { type: ["string", "null"] },
    undertone: { type: "string", enum: ["warm", "cool", "neutral"] },
    pattern: { type: "string", enum: ["solid", "stripe", "floral", "plaid", "print"] },
    fabric: { type: "string", enum: ["denim", "knit", "silk_like", "leather", "linen", "cotton", "wool", "synthetic", "other"] },
    fit: {
      type: "array",
      items: { type: "string", enum: ["oversized", "tailored", "relaxed", "slim", "cropped", "high_waisted", "a_line", "straight", "flowy"] },
    },
    formality: { type: "string", enum: ["casual", "smart_casual", "business", "formal"] },
    season_weight: { type: "string", enum: ["lightweight", "midweight", "heavy"] },
    neckline: { type: ["string", "null"], enum: ["crew", "v_neck", "scoop", "collared", "turtleneck", "square", "off_shoulder", "halter", null] },
    sleeve_length: { type: ["string", "null"], enum: ["sleeveless", "short", "three_quarter", "long", null] },
    rise: { type: ["string", "null"], enum: ["low", "mid", "high", null] },
    hem_length: { type: ["string", "null"], enum: ["cropped", "hip", "knee", "midi", "maxi", "ankle", "full", null] },
  },
  required: [
    "category", "subcategory", "color_primary", "color_secondary",
    "undertone", "pattern", "fabric", "fit", "formality", "season_weight",
    "neckline", "sleeve_length", "rise", "hem_length",
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
