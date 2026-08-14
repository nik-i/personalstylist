import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getWeather } from "@/lib/weather";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Prisma helpers (mirrors api/style-me pattern) ─────────────────────────────

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

async function dbGetProfile(userId: string): Promise<string> {
  const p = await prisma.userProfile.findUnique({ where: { userId } });
  if (!p) return "No style profile found.";
  return JSON.stringify(p, null, 2);
}

async function dbListItems(userId: string, input: Record<string, unknown>): Promise<string> {
  const where: Record<string, unknown> = { userId, isActive: true };
  if (input.itemType)       where.itemType       = { contains: input.itemType,       mode: "insensitive" };
  if (input.color)          where.color          = { contains: input.color,          mode: "insensitive" };
  if (input.season)         where.season         = { contains: input.season,         mode: "insensitive" };
  if (input.formalityLevel) where.formalityLevel = { contains: input.formalityLevel, mode: "insensitive" };

  const limit = Math.min(Number(input.limit ?? 50), 100);
  const rows = await prisma.wardrobeItem.findMany({
    where,
    orderBy: { addedAt: "desc" },
    take: limit,
  });

  const items = rows.map((r) => ({
    id: r.id, itemType: r.itemType, color: r.color, pattern: r.pattern,
    fabricType: r.fabricType, formalityLevel: r.formalityLevel,
    season: r.season, warmthLevel: r.warmthLevel,
    tags: parseTags(r.tags), imageUrl: r.imageUrl,
  }));

  return JSON.stringify({ count: items.length, items }, null, 2);
}

// ── Wardrobe-analyst subagent ─────────────────────────────────────────────────
// Receives gathered wardrobe data and constructs a spoken outfit recommendation.

async function runWardrobeAnalyst(profile: string, items: string, request: string): Promise<string> {
  const response = await anthropic.messages.create({
    model: "claude-sonnet-5",
    max_tokens: 300,
    system: `You are Maya, a warm personal stylist. You give brief spoken outfit suggestions — natural and friendly, like advice from a knowledgeable friend. Write 2–4 sentences maximum. No bullet points or lists. Reference items warmly and specifically ("your navy blazer", "those dark trousers"). Tie the suggestion to the occasion.`,
    messages: [
      {
        role: "user",
        content: `Styling request: "${request}"

User profile:
${profile}

Available wardrobe items:
${items}

Give a warm, specific spoken outfit recommendation. Be concrete about which items to combine and why they work for this occasion.`,
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

// ── Primary agent tool definitions ───────────────────────────────────────────

const AGENT_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_wardrobe_profile",
    description: "Get the user's style profile: coloring, body shape, style signals, and preferences. Call this first.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  {
    name: "list_wardrobe_items",
    description: "List the user's wardrobe items. Use filters to narrow results if the request mentions specific clothing types or formality.",
    input_schema: {
      type: "object",
      properties: {
        itemType:       { type: "string", description: "Filter by type, e.g. 'dress', 'blazer', 'jeans'" },
        formalityLevel: { type: "string", description: "Filter by formality: casual, smart_casual, business, formal" },
        season:         { type: "string", description: "Filter by season: summer, winter, spring, fall" },
        limit:          { type: "number", description: "Max results (default 50)" },
      },
      required: [],
    },
  },
  {
    name: "analyze_and_suggest",
    description: "Delegate to the wardrobe-analyst subagent to construct the final spoken outfit recommendation. Call this once you have gathered the profile and wardrobe items.",
    input_schema: {
      type: "object",
      properties: {
        profile: { type: "string", description: "Profile JSON as a string" },
        items:   { type: "string", description: "Wardrobe items JSON as a string" },
        request: { type: "string", description: "The original styling request" },
      },
      required: ["profile", "items", "request"],
    },
  },
];

// ── Primary agent loop ────────────────────────────────────────────────────────
// Gathers wardrobe data, then delegates to the wardrobe-analyst subagent.

async function runStyleMeAgent(userId: string, request: string): Promise<string> {
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Styling request: "${request}"\n\nSteps: 1) get_wardrobe_profile, 2) list_wardrobe_items (use filters if helpful for the request), 3) analyze_and_suggest with all gathered data.`,
    },
  ];

  for (let turn = 0; turn < 6; turn++) {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: `You are a wardrobe data gatherer for a personal stylist. Collect the user's style profile and relevant wardrobe items, then delegate to analyze_and_suggest. Do not suggest outfits yourself — let the subagent handle that.`,
      tools: AGENT_TOOLS,
      tool_choice: { type: "auto" },
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") break;

    const toolResults: Anthropic.ToolResultBlockParam[] = [];

    for (const block of response.content) {
      if (block.type !== "tool_use") continue;

      const input = block.input as Record<string, unknown>;
      let result = "";

      switch (block.name) {
        case "get_wardrobe_profile":
          result = await dbGetProfile(userId);
          console.log(`[voice/tool] get_wardrobe_profile → ${result.slice(0, 80)}`);
          break;

        case "list_wardrobe_items":
          result = await dbListItems(userId, input);
          console.log(`[voice/tool] list_wardrobe_items → ${result.slice(0, 80)}`);
          break;

        case "analyze_and_suggest": {
          const spoken = await runWardrobeAnalyst(
            String(input.profile ?? ""),
            String(input.items ?? ""),
            String(input.request ?? request),
          );
          console.log(`[voice/tool] wardrobe-analyst subagent → ${spoken}`);
          return spoken;
        }

        default:
          result = `Unknown tool: ${block.name}`;
      }

      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
    }

    messages.push({ role: "user", content: toolResults });
  }

  return "I had trouble putting together a recommendation. Could you try asking again?";
}

// ── Route handler ─────────────────────────────────────────────────────────────

type ToolRequest = {
  tool: string;
  callId: string;
  args: Record<string, unknown>;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const rawUserId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!rawUserId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId: string = rawUserId;

  const { tool, args } = (await req.json()) as ToolRequest;
  console.log(`[voice/tool] tool=${tool} args=${JSON.stringify(args).slice(0, 120)}`);

  if (tool === "get_weather") {
    const lat = Number(args.lat);
    const lon = Number(args.lon);
    if (!lat || !lon) {
      return NextResponse.json({ output: "No location provided — I can't check the weather without coordinates." });
    }
    try {
      const weather = await getWeather(lat, lon);
      const output = `It's currently ${weather.temperature_c}°C (feels like ${weather.feels_like_c}°C), ${weather.condition}, ${weather.humidity_pct}% humidity.`;
      console.log(`[voice/tool] get_weather → ${output}`);
      return NextResponse.json({ output });
    } catch {
      return NextResponse.json({ output: "Weather data isn't available right now." });
    }
  }

  if (tool === "style_me") {
    const request = String(args.request ?? "").trim();
    if (!request) {
      return NextResponse.json({ output: "I didn't catch what you're looking for — could you describe the occasion?" });
    }

    const TIMEOUT_MS = 12_000;
    const TIMEOUT_SENTINEL = "__timeout__";

    const result = await Promise.race([
      runStyleMeAgent(userId, request),
      new Promise<string>((resolve) => setTimeout(() => resolve(TIMEOUT_SENTINEL), TIMEOUT_MS)),
    ]);

    if (result === TIMEOUT_SENTINEL) {
      console.log("[voice/tool] style_me timed out after 12s");
      return NextResponse.json({ output: "I'm still checking your wardrobe — give me just a moment." });
    }

    return NextResponse.json({ output: result });
  }

  return NextResponse.json({ output: `I don't know how to handle the "${tool}" tool.` });
}
