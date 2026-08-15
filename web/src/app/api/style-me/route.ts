// Style-me API route.
// System prompt and model come from .claude/agents/personal-stylist.md (the single source of truth).
// All wardrobe/weather tool implementations live in the MCP server.
// This route only handles: auth, building the user message, the Anthropic SDK loop,
// proxying tool calls to MCP, and intercepting suggest_outfit for structured output.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { readFile } from "fs/promises";
import path from "path";

// ── Types ─────────────────────────────────────────────────────────────────────

type StyleMeRequest = {
  freeText?: string;
  occasion?: string;
  when?: { preset?: string; date?: string; time?: string };
  indoorOutdoor?: "indoors" | "outdoors" | "mix";
  dailyContext?: { mood?: string; note?: string };
  location?: { lat: number; lon: number; city?: string };
  feedback?: string;
  previousSuggestion?: { summaries: string[] };
};

// ── Anthropic client ───────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── suggest_outfit output schema ───────────────────────────────────────────────
// This tool is NOT in the MCP server — the route adds it to the tools list so
// Claude can signal "done" with structured JSON. The route intercepts the call
// and returns the input as the API response.

const SUGGEST_OUTFIT_TOOL: Anthropic.Tool = {
  name: "suggest_outfit",
  description: "Return the final structured outfit recommendation. Call this once you have reviewed the wardrobe (and weather if available).",
  input_schema: {
    type: "object",
    properties: {
      context: {
        type: "object",
        properties: {
          season:      { type: "string", description: "summer, winter, spring, or fall" },
          formality:   { type: "string", description: "casual, smart_casual, business, or formal" },
          timeOfDay:   { type: "string", description: "morning, afternoon, or evening" },
          weatherNote: { type: "string", description: "One-line weather summary, e.g. '18–22 °C, partly cloudy'" },
        },
        required: ["season", "formality", "timeOfDay"],
      },
      outfits: {
        type: "array",
        description: "1–3 outfit combinations, best first. Every outfit must honour all explicit user constraints (requested colour, item type, occasion vibe). Return fewer outfits rather than padding with suggestions that ignore the constraint — a single perfect match is better than three where only one fits.",
        items: {
          type: "object",
          properties: {
            pieces: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id:       { type: "string", description: "Exact wardrobe item ID" },
                  itemType: { type: "string" },
                  color:    { type: "string" },
                  imageUrl: { type: "string" },
                  reason:   { type: "string", description: "Why this piece works — mention weather or occasion" },
                },
                required: ["id", "itemType", "reason"],
              },
            },
            score:   { type: "number", description: "Overall match score 1–10: sum of occasion_fit (0–3) + formality_match (0–3) + weather_appropriateness (0–2) + color_harmony (0–2). Higher = better. Sort outfits highest first." },
            summary: { type: "string", description: "e.g. 'Navy blazer + white shirt + black trousers'" },
          },
          required: ["pieces", "score", "summary"],
        },
      },
      blazerNote:       { type: "string" },
      footwearNote:     { type: "string" },
      weddingColorNote: { type: "string" },
    },
    required: ["context", "outfits"],
  },
};

// ── Load agent definition ─────────────────────────────────────────────────────

async function loadAgentDef(): Promise<{ model: string; systemPrompt: string }> {
  // .claude/agents/ lives one level above the web/ directory
  const agentPath = path.resolve(process.cwd(), "..", ".claude", "agents", "personal-stylist.md");
  const content = await readFile(agentPath, "utf-8");

  // YAML frontmatter is delimited by --- on its own line
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("personal-stylist.md: missing or malformed frontmatter");

  const frontmatter = match[1];
  const systemPrompt = match[2].trim();
  const modelLine = frontmatter.match(/^model:\s*(.+)$/m);

  return {
    model: modelLine?.[1].trim() ?? "claude-sonnet-4-6",
    systemPrompt,
  };
}

// ── MCP client factory ────────────────────────────────────────────────────────

async function connectMcp(userId: string): Promise<Client> {
  const transport = new StreamableHTTPClientTransport(
    new URL(process.env.MCP_SERVER_URL ?? "http://localhost:3001/mcp"),
    {
      requestInit: {
        headers: {
          ...(process.env.MCP_BEARER_TOKEN ? { Authorization: `Bearer ${process.env.MCP_BEARER_TOKEN}` } : {}),
          "X-User-Id": userId,
        },
      },
    }
  );
  const client = new Client({ name: "style-me", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

// ── Backfill imageUrls from DB if the agent omitted them ──────────────────────

async function backfillImages(
  userId: string,
  outfits: Array<{ pieces: Array<{ id: string; imageUrl?: string | null }> }>
) {
  const allIds = [...new Set(outfits.flatMap((o) => o.pieces.map((p) => p.id)))];
  const rows = await prisma.wardrobeItem.findMany({
    where: { id: { in: allIds }, userId, isActive: true },
    select: { id: true, imageUrl: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.id, r.imageUrl]));
  for (const outfit of outfits) {
    for (const piece of outfit.pieces) {
      if (!piece.imageUrl) piece.imageUrl = map[piece.id] ?? null;
    }
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  const rawUserId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!rawUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId: string = rawUserId;

  const body = (await req.json()) as StyleMeRequest;
  const { freeText, occasion, when, indoorOutdoor, dailyContext, location, feedback, previousSuggestion } = body;
  if (!freeText && (!occasion || !indoorOutdoor)) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const count = await prisma.wardrobeItem.count({ where: { userId, isActive: true } });
  if (count === 0) return NextResponse.json({ empty: true });

  // Load agent definition — system prompt and model live only in personal-stylist.md
  const { model, systemPrompt } = await loadAgentDef();

  // Connect to MCP server — all wardrobe/weather tool implementations live there
  const mcpClient = await connectMcp(userId);

  try {
    // Fetch tool schemas from MCP, convert inputSchema → input_schema for Anthropic
    const { tools: mcpTools } = await mcpClient.listTools();
    const tools: Anthropic.Tool[] = [
      ...mcpTools.map((t) => ({
        name: t.name,
        description: t.description ?? "",
        input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
      })),
      SUGGEST_OUTFIT_TOOL,
    ];

    // Build user message
    const locationHint = location?.city
      ? ` Location: ${location.city} (lat ${location.lat}, lon ${location.lon}).`
      : location
      ? ` Location: lat ${location.lat}, lon ${location.lon} — call get_weather.`
      : "";

    let baseMessage: string;
    if (freeText) {
      baseMessage = freeText + locationHint;
    } else {
      const whenText =
        when?.preset === "tonight"        ? "tonight"
        : when?.preset === "tomorrow"     ? "tomorrow"
        : when?.preset === "this-weekend" ? "this weekend"
        : when?.date                      ? `on ${when.date}${when.time ? ` in the ${when.time}` : ""}`
        : "soon";

      const venueText =
        indoorOutdoor === "indoors"    ? "indoors"
        : indoorOutdoor === "outdoors" ? "outdoors"
        : "both indoors and outdoors";

      const dailyParts = [
        dailyContext?.mood && `Mood: ${dailyContext.mood}`,
        dailyContext?.note && `Notes: ${dailyContext.note}`,
      ].filter(Boolean);

      baseMessage =
        `Style me for ${occasion} ${whenText}. The event will be ${venueText}.` +
        locationHint +
        (dailyParts.length ? " " + dailyParts.join(". ") + "." : "");
    }

    const userMessage = feedback
      ? baseMessage +
        (previousSuggestion?.summaries?.length
          ? `\n\nPreviously suggested: ${previousSuggestion.summaries.join("; ")}.`
          : "") +
        `\n\nUser feedback: "${feedback}". Please suggest a different outfit that addresses this. Avoid repeating the exact same combination from the previous suggestion unless no alternative exists. Recommend outfit combinations from my wardrobe only.`
      : baseMessage + " Recommend outfit combinations from my wardrobe only.";

    // ── Agentic loop ────────────────────────────────────────────────────────────

    const messages: Anthropic.MessageParam[] = [{ role: "user", content: userMessage }];
    let recommendation: Record<string, unknown> | null = null;
    const MAX_TURNS = 10;

    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const response = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        tools,
        messages,
      });

      messages.push({ role: "assistant", content: response.content });
      if (response.stop_reason !== "tool_use") break;

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      if (!toolUseBlocks.length) break;

      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const toolUse of toolUseBlocks) {
        let resultText = "";

        if (toolUse.name === "suggest_outfit") {
          // Intercept: capture the structured output, don't proxy to MCP
          recommendation = toolUse.input as Record<string, unknown>;
          resultText = "Captured.";
        } else {
          // Proxy all other tool calls through the MCP server
          const mcpResult = await mcpClient.callTool({
            name: toolUse.name,
            arguments: toolUse.input as Record<string, unknown>,
          });
          const mcpContent = mcpResult.content as Array<{ type: string; text?: string }>;
          resultText = mcpContent
            .filter((c) => c.type === "text" && c.text != null)
            .map((c) => c.text!)
            .join("\n");
          if (mcpResult.isError) resultText = `Error: ${resultText}`;
        }

        toolResults.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: resultText,
        });
      }

      messages.push({ role: "user", content: toolResults });
      if (recommendation) break;
    }

    // Safety net: if loop ended without suggest_outfit, force one final call
    if (!recommendation) {
      messages.push({
        role: "user",
        content: "You have all the information you need. Call suggest_outfit now with your best recommendation.",
      });
      const forced = await anthropic.messages.create({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        tools: [SUGGEST_OUTFIT_TOOL],
        tool_choice: { type: "tool", name: "suggest_outfit" },
        messages,
      });
      const toolUseBlocks = forced.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      for (const toolUse of toolUseBlocks) {
        if (toolUse.name === "suggest_outfit") {
          recommendation = toolUse.input as Record<string, unknown>;
          break;
        }
      }
    }

    if (!recommendation) {
      return NextResponse.json(
        { error: "Stylist could not generate a recommendation. Please try again." },
        { status: 500 }
      );
    }

    const outfits = recommendation.outfits as Array<{
      pieces: Array<{ id: string; imageUrl?: string | null }>;
    }> | undefined;
    if (outfits?.length) await backfillImages(userId, outfits);

    return NextResponse.json(recommendation);
  } finally {
    await mcpClient.close();
  }
}
