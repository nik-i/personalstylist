// Style-me API route — SSE streaming.
// System prompt and model come from .claude/agents/personal-stylist.md.
// Streams { type: "step", text } events while the agent works, then { type: "result", data }.
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

// ── status_update tool ────────────────────────────────────────────────────────

const STATUS_UPDATE_TOOL: Anthropic.Tool = {
  name: "status_update",
  description: "Emit a short status message to the user while you work. Call this once before suggest_outfit to share what you noticed.",
  input_schema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "One short sentence, under 12 words. E.g. 'You have 3 dresses — finding the best for a warm evening'",
      },
    },
    required: ["message"],
  },
};

// ── suggest_outfit tool ────────────────────────────────────────────────────────

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
        description: "1–3 outfit combinations, best first. Every outfit must honour all explicit user constraints. Return fewer outfits rather than padding — a single perfect match is better than three where only one fits.",
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
            score:   { type: "number", description: "Overall match score 1–10. Sort outfits highest first." },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadAgentDef(): Promise<{ model: string; systemPrompt: string }> {
  const agentPath = path.resolve(process.cwd(), ".claude", "agents", "personal-stylist.md");
  const content = await readFile(agentPath, "utf-8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("personal-stylist.md: missing or malformed frontmatter");
  const frontmatter = match[1];
  const systemPrompt = match[2].trim();
  const modelLine = frontmatter.match(/^model:\s*(.+)$/m);
  return { model: modelLine?.[1].trim() ?? "claude-sonnet-4-6", systemPrompt };
}

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

function toolStepText(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "wardrobe_get_profile": return "Reading your style profile";
    case "search_garments": {
      const q = String(input.query ?? input.category ?? "").trim();
      return q ? `Searching wardrobe for "${q}"` : "Scanning your wardrobe";
    }
    case "get_garment":               return "Inspecting a garment";
    case "get_groupings":             return "Reviewing your saved groupings";
    case "get_weather":               return "Checking the weather";
    case "update_garment_attributes": return "Updating garment details";
    case "save_feedback":             return "Saving your feedback";
    case "suggest_outfit":            return "Assembling your outfit";
    default:                          return name.replace(/_/g, " ");
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

  const encoder = new TextEncoder();
  const sseHeaders = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  };

  // Empty wardrobe — return immediately via SSE
  const count = await prisma.wardrobeItem.count({ where: { userId, isActive: true } });
  if (count === 0) {
    return new Response(
      new ReadableStream({
        start(ctrl) {
          ctrl.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "result", data: { empty: true } })}\n\n`));
          ctrl.close();
        },
      }),
      { headers: sseHeaders }
    );
  }

  let model: string, systemPrompt: string;
  try {
    ({ model, systemPrompt } = await loadAgentDef());
  } catch {
    return NextResponse.json({ error: "Stylist agent unavailable" }, { status: 500 });
  }

  const mcpClient = await connectMcp(userId);

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* client disconnected */ }
      }

      try {
        const { tools: mcpTools } = await mcpClient.listTools();
        const tools: Anthropic.Tool[] = [
          ...mcpTools.map((t) => ({
            name: t.name,
            description: t.description ?? "",
            input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
          })),
          STATUS_UPDATE_TOOL,
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

        // Pre-fetch wardrobe profile + all garments + weather in parallel before the
        // first LLM call. Injecting as synthetic tool history lets the model call
        // suggest_outfit immediately instead of spending a roundtrip fetching them.
        const prefetchLabel = location
          ? "Reading your wardrobe and checking the weather"
          : "Reading your wardrobe";
        emit({ type: "step", text: prefetchLabel });

        function extractMcpText(r: Awaited<ReturnType<typeof mcpClient.callTool>>): string {
          return (r.content as Array<{ type: string; text?: string }>)
            .filter((c) => c.type === "text" && c.text)
            .map((c) => c.text!)
            .join("\n");
        }

        const [profileText, wardrobeText, weatherText] = await Promise.all([
          mcpClient.callTool({ name: "wardrobe_get_profile", arguments: {} }).then(extractMcpText),
          mcpClient.callTool({ name: "search_garments",      arguments: {} }).then(extractMcpText),
          location
            ? mcpClient.callTool({ name: "get_weather", arguments: { lat: location.lat, lon: location.lon, day_offset: 0 } }).then(extractMcpText)
            : Promise.resolve(""),
        ]);

        const prefetched = [
          { id: "pre_0", name: "wardrobe_get_profile", input: {},                                                              text: profileText },
          { id: "pre_1", name: "search_garments",      input: {},                                                              text: wardrobeText },
          ...(location ? [{ id: "pre_2", name: "get_weather", input: { lat: location.lat, lon: location.lon, day_offset: 0 }, text: weatherText }] : []),
        ];

        // Remove pre-fetched tools so the model doesn't call them again
        const prefetchedNames = new Set(prefetched.map((p) => p.name));
        const agentTools = tools.filter((t) => !prefetchedNames.has(t.name));

        const messages: Anthropic.MessageParam[] = [
          { role: "user", content: userMessage },
          { role: "assistant", content: prefetched.map((p) => ({ type: "tool_use" as const, id: p.id, name: p.name, input: p.input })) },
          { role: "user",      content: prefetched.map((p) => ({ type: "tool_result" as const, tool_use_id: p.id, content: p.text })) },
        ];

        let recommendation: Record<string, unknown> | null = null;
        const MAX_TURNS = 10;

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const statusTurn = turn < 2 && !recommendation;
          const response = await anthropic.messages.create({
            model,
            max_tokens: statusTurn ? 256 : 4096,
            system: systemPrompt,
            tools: agentTools,
            tool_choice: statusTurn
              ? ({ type: "tool", name: "status_update" } as Anthropic.ToolChoiceTool)
              : ({ type: "auto" } as Anthropic.ToolChoiceAuto),
            messages,
          });

          messages.push({ role: "assistant", content: response.content });
          if (response.stop_reason !== "tool_use") break;

          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          if (!toolUseBlocks.length) break;

          // Run all tool calls for this turn in parallel
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (toolUse) => {
              let resultText = "";
              if (toolUse.name === "status_update") {
                const msg = (toolUse.input as { message?: string }).message ?? "";
                if (msg) emit({ type: "step", text: msg });
                resultText = "ok";
              } else if (toolUse.name === "suggest_outfit") {
                emit({ type: "step", text: toolStepText(toolUse.name, toolUse.input as Record<string, unknown>) });
                recommendation = toolUse.input as Record<string, unknown>;
                resultText = "Captured.";
              } else {
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
              return { type: "tool_result" as const, tool_use_id: toolUse.id, content: resultText };
            })
          );

          messages.push({ role: "user", content: toolResults });
          if (recommendation) break;
        }

        // Safety net
        if (!recommendation) {
          emit({ type: "step", text: "Finalising your look" });
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
          for (const block of forced.content) {
            if (block.type === "tool_use" && block.name === "suggest_outfit") {
              recommendation = block.input as Record<string, unknown>;
              break;
            }
          }
        }

        if (!recommendation) {
          emit({ type: "error", message: "Stylist could not generate a recommendation. Please try again." });
          return;
        }

        const outfits = recommendation.outfits as Array<{
          pieces: Array<{ id: string; imageUrl?: string | null }>;
        }> | undefined;
        if (outfits?.length) await backfillImages(userId, outfits);

        emit({ type: "result", data: recommendation });
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : "Something went wrong. Please try again." });
      } finally {
        await mcpClient.close();
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}
