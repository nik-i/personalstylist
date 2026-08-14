import OpenAI from "openai";
import type { ExtractedItem } from "@/types/extraction";

function getClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

type SupportedMediaType = "image/jpeg" | "image/png" | "image/webp" | "image/gif";

export type { ExtractedItem };

export async function extractClothingFromImage(
  base64: string,
  mediaType: SupportedMediaType,
  sourcePhotoIndex: number
): Promise<ExtractedItem[]> {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: `data:${mediaType};base64,${base64}` },
          },
          {
            type: "text",
            text: `Identify the clothing items in this photo. Focus on garments only — ignore accessories, faces, and backgrounds unless a garment is the sole subject.

For each clothing item, return a JSON object with these fields:
- itemType: specific garment name (e.g. "blazer", "midi skirt", "straight-leg jeans", "crew-neck knit")
- color: primary colour as a single word (e.g. "navy", "camel", "cream", "black") or null
- pattern: pattern if present (e.g. "stripe", "check", "floral") or null if solid/plain
- fabricType: fabric if determinable (e.g. "wool", "denim", "silk", "cotton") or null
- formalityLevel: one of "casual", "smart-casual", "business", "formal" or null
- season: one of "spring", "summer", "autumn", "winter", "all-season" or null
- warmthLevel: one of "light", "mid", "warm" or null
- confidence: "high" if clearly visible, "medium" if partially visible or ambiguous, "low" if very uncertain
- bbox: bounding box of the garment as {"x":0.1,"y":0.05,"w":0.8,"h":0.6} where x,y is the top-left corner and w,h are width/height — all as fractions of the image dimensions from 0 to 1

If no clothing is present, return [].
Return ONLY a valid JSON array — no markdown, no explanation:
[{"itemType":"...","color":"...","pattern":null,"fabricType":null,"formalityLevel":"...","season":"...","warmthLevel":"...","confidence":"high","bbox":{"x":0.1,"y":0.05,"w":0.8,"h":0.6}}]`,
          },
        ],
      },
    ],
  });

  const text = response.choices[0]?.message?.content?.trim() ?? "[]";
  // Strip markdown code fences GPT sometimes wraps around JSON
  const clean = text.replace(/^```(?:json)?\n?/i, "").replace(/\n?```$/i, "").trim();
  const raw = JSON.parse(clean) as Omit<ExtractedItem, "sourcePhotoIndex">[];
  return raw.map((item) => ({ ...item, sourcePhotoIndex }));
}
