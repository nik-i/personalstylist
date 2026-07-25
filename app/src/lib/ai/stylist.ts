import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type WardrobeItemInput = {
  id: string;
  itemType: string;
  color?: string | null;
  pattern?: string | null;
  formalityLevel?: string | null;
  season?: string | null;
};

export type ProfileInput = {
  coloring?: string | null;
  bodyShape?: string | null;
  highlightPrefs?: string[];
  downplayPrefs?: string[];
};

export type BrandPrefInput = {
  brand: string;
  category: string;
};

export type GapAnalysisInput = {
  goal: { type: string; description?: string; frustration?: string };
  profile: ProfileInput;
  wardrobe: WardrobeItemInput[];
  brandPrefs: BrandPrefInput[];
};

export type GapProduct = {
  name: string;
  priceRange: "low" | "mid" | "high";
  estimatedPrice: string;
  retailer: string;
  description: string;
  color: string;
};

export type GapAnalysisOutput = {
  ownedItemIds: string[];
  ownedItemNotes: { id: string; reason: string }[];
  gap: { description: string; confidence: "high" | "medium" | "low" };
  recommendedStyle: {
    pieceType: string;
    colorPaletteFit: string;
    flatteringCut: string;
    reasoning: string;
  };
  products: GapProduct[];
  stylistNote: string;
};

export type DailyOutfitInput = {
  profile: ProfileInput;
  wardrobe: WardrobeItemInput[];
};

export type DailyOutfit = {
  wardrobeItemIds: string[];
  occasion: string;
  stylingNote: string;
};

export type DailyOutfitOutput = {
  outfits: DailyOutfit[];
};

export async function generateGapAnalysis(
  input: GapAnalysisInput
): Promise<GapAnalysisOutput> {
  const wardrobeText = input.wardrobe
    .map(
      (item) =>
        `- ID:${item.id} | ${item.itemType}${item.color ? ` (${item.color})` : ""}${item.pattern ? `, ${item.pattern}` : ""}${item.formalityLevel ? `, formality: ${item.formalityLevel}` : ""}${item.season ? `, season: ${item.season}` : ""}`
    )
    .join("\n");

  const profileText = [
    input.profile.coloring && `Colouring: ${input.profile.coloring}`,
    input.profile.bodyShape && `Body shape: ${input.profile.bodyShape}`,
    input.profile.highlightPrefs?.length &&
      `Likes to highlight: ${input.profile.highlightPrefs.join(", ")}`,
    input.profile.downplayPrefs?.length &&
      `Prefers to downplay: ${input.profile.downplayPrefs.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const brandText = input.brandPrefs.length
    ? input.brandPrefs
        .map((b) => `${b.brand} (${b.category})`)
        .join(", ")
    : "No brand preferences set — use 3 price tiers";

  const systemPrompt = `You are a personal stylist AI. You give honest, grounded advice.
CRITICAL RULE — HONESTY GUARDRAIL: Never recommend buying something the user already owns or a near-duplicate. The ownedItemIds and ownedItemNotes fields are mandatory — always list items from the wardrobe that cover the goal. If the user already owns what they need, say so clearly.

User profile:
${profileText || "No profile data"}

Wardrobe (${input.wardrobe.length} items):
${wardrobeText || "No items"}

Brand preferences: ${brandText}

Respond ONLY with valid JSON matching this exact schema — no extra text, no markdown:
{
  "ownedItemIds": ["<wardrobe item ID>"],
  "ownedItemNotes": [{"id": "<wardrobe item ID>", "reason": "<why it covers the goal>"}],
  "gap": {"description": "<what is genuinely missing>", "confidence": "high|medium|low"},
  "recommendedStyle": {"pieceType": "<type>", "colorPaletteFit": "<colour advice>", "flatteringCut": "<cut advice>", "reasoning": "<why>"},
  "products": [
    {"name": "<product name>", "priceRange": "low|mid|high", "estimatedPrice": "<e.g. £45>", "retailer": "<retailer name>", "description": "<1 sentence>", "color": "<colour name>"}
  ],
  "stylistNote": "<overall friendly stylist note>"
}
Products must have exactly 3 items, one per price tier. If confidence is low (sparse wardrobe), say so in the gap description.`;

  const userPrompt = `Goal: ${input.goal.type}${input.goal.description ? ` — ${input.goal.description}` : ""}${input.goal.frustration ? `\nBiggest wardrobe frustration: ${input.goal.frustration}` : ""}`;

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 1200,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as GapAnalysisOutput;
}

export async function generateDailyOutfits(
  input: DailyOutfitInput
): Promise<DailyOutfitOutput> {
  if (input.wardrobe.length < 3) {
    return { outfits: [] };
  }

  const wardrobeText = input.wardrobe
    .map(
      (item) =>
        `- ID:${item.id} | ${item.itemType}${item.color ? ` (${item.color})` : ""}${item.formalityLevel ? `, formality: ${item.formalityLevel}` : ""}`
    )
    .join("\n");

  const profileText = [
    input.profile.coloring && `Colouring: ${input.profile.coloring}`,
    input.profile.bodyShape && `Body shape: ${input.profile.bodyShape}`,
    input.profile.highlightPrefs?.length &&
      `Likes to highlight: ${input.profile.highlightPrefs.join(", ")}`,
    input.profile.downplayPrefs?.length &&
      `Prefers to downplay: ${input.profile.downplayPrefs.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const systemPrompt = `You are a personal stylist AI. Create 2-3 complete outfit combinations using ONLY items from the user's wardrobe. Each outfit needs at least 2 items, ideally 3-4. Never suggest buying anything.

User profile:
${profileText || "No profile data"}

Wardrobe:
${wardrobeText}

Respond ONLY with valid JSON — no extra text, no markdown:
{
  "outfits": [
    {
      "wardrobeItemIds": ["<exact ID from wardrobe>"],
      "occasion": "<occasion e.g. Smart casual work day>",
      "stylingNote": "<1-2 sentence styling tip>"
    }
  ]
}
Use exact IDs from the wardrobe list above. Each outfit must use different combinations.`;

  const response = await client.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 800,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: "Create 2-3 outfit combinations for today from my wardrobe.",
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text) as DailyOutfitOutput;
}
