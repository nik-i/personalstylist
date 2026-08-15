// Should-I-Buy API route — SSE streaming.
// System prompt and model come from .claude/agents/shopping-advisor.md.
// Streams { type: "step", text } events while the agent works, then { type: "result", data }.
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Anthropic from "@anthropic-ai/sdk";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { readFile } from "fs/promises";
import path from "path";
import { z } from "zod";

// ── Types ─────────────────────────────────────────────────────────────────────

type ShouldIBuyRequest = {
  productUrl?: string;
  description?: string;
  imageBase64?: string;
  priceNote?: string;
  followUp?: string;
  previousVerdict?: Record<string, unknown>;
};

// ── Verdict schema ────────────────────────────────────────────────────────────

const OwnedItemSchema = z.object({
  id: z.string(),
  itemType: z.string(),
  color: z.string().optional(),
  note: z.string(),
});

const OutfitPieceSchema = z.object({
  id: z.string(),
  itemType: z.string(),
  color: z.string().optional(),
});

const VerdictSchema = z.object({
  verdict: z.enum(["buy", "skip", "buy_instead_consider_owned"]),
  confidence: z.number().int().min(1).max(10),
  reasoning: z.string(),
  similarOwnedItems: z.array(OwnedItemSchema),
  outfitsItEnables: z.array(
    z.object({
      pieces: z.array(OutfitPieceSchema),
      summary: z.string(),
    })
  ),
  colorFitNote: z.string(),
  versatilityScore: z.number().int().min(1).max(10),
  redFlags: z.array(z.string()),
  wearInsight: z.string().default(""),
});

type VerdictResult = z.infer<typeof VerdictSchema>;

type ToolTrailEntry = {
  tool: string;
  argsSummary: string;
  durationMs: number;
};

// ── Tool definitions ──────────────────────────────────────────────────────────

const STATUS_UPDATE_TOOL: Anthropic.Tool = {
  name: "status_update",
  description: "Emit a short status message to the user while you work. Call this twice at the start — once after understanding the product, once after your wardrobe finding.",
  input_schema: {
    type: "object",
    properties: {
      message: {
        type: "string",
        description: "One short sentence, under 12 words. E.g. 'Olive bomber — checking if you own something similar'",
      },
    },
    required: ["message"],
  },
};

const BUY_VERDICT_TOOL: Anthropic.Tool = {
  name: "buy_verdict",
  description:
    "Return the final structured shopping verdict. Call this once you have searched the wardrobe, checked the profile, and assessed versatility.",
  input_schema: {
    type: "object",
    properties: {
      verdict: {
        type: "string",
        enum: ["buy", "skip", "buy_instead_consider_owned"],
        description:
          "buy = genuinely worth it; skip = redundant or unsuitable; buy_instead_consider_owned = the user already owns something equivalent",
      },
      confidence: { type: "number", description: "Confidence in the verdict, 1–10" },
      reasoning: { type: "string", description: "2–4 sentences explaining the verdict clearly" },
      similarOwnedItems: {
        type: "array",
        description: "Items already in the wardrobe that overlap with the product",
        items: {
          type: "object",
          properties: {
            id:       { type: "string", description: "Exact wardrobe item ID" },
            itemType: { type: "string" },
            color:    { type: "string" },
            note:     { type: "string", description: "Why this overlaps / how it compares" },
          },
          required: ["id", "itemType", "note"],
        },
      },
      outfitsItEnables: {
        type: "array",
        description: "Complete, coherent outfits the new item would enable with owned pieces",
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
                },
                required: ["id", "itemType"],
              },
            },
            summary: { type: "string", description: "e.g. 'Navy blazer + white tee + black jeans'" },
          },
          required: ["pieces", "summary"],
        },
      },
      colorFitNote: {
        type: "string",
        description: "How the item's color works for the user's undertone/coloring, and whether its silhouette suits their body shape",
      },
      versatilityScore: {
        type: "number",
        description: "How many distinct outfits this item enables with owned pieces, 1–10",
      },
      redFlags: {
        type: "array",
        items: { type: "string" },
        description: "Concerns: duplicate, low wear likelihood, wrong season, orphan piece, etc.",
      },
      wearInsight: {
        type: "string",
        description: "One sentence summarising what the wear history showed (e.g. 'Similar khaki bomber worn once in the last month'). Empty string if wear history was not consulted or not relevant.",
      },
    },
    required: [
      "verdict", "confidence", "reasoning", "similarOwnedItems",
      "outfitsItEnables", "colorFitNote", "versatilityScore", "redFlags",
      "wearInsight",
    ],
  },
};

const FETCH_PRODUCT_PAGE_TOOL: Anthropic.Tool = {
  name: "fetch_product_page",
  description:
    "Fetch a product page by URL and return its text content and key metadata (title, description). Use this when a productUrl was provided to understand what the product is.",
  input_schema: {
    type: "object",
    properties: {
      url: { type: "string", description: "The product page URL to fetch" },
    },
    required: ["url"],
  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function loadAgentDef(): Promise<{ model: string; systemPrompt: string }> {
  const agentPath = path.resolve(process.cwd(), "..", ".claude", "agents", "shopping-advisor.md");
  const content = await readFile(agentPath, "utf-8");
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) throw new Error("shopping-advisor.md: missing or malformed frontmatter");
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
  const client = new Client({ name: "should-i-buy", version: "1.0.0" });
  await client.connect(transport);
  return client;
}

async function fetchProductPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; WardrobeCollective/1.0)",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return `Failed to fetch page (HTTP ${response.status}). Rely on description/image.`;

    const html = await response.text();
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const metaDesc = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']description["']/i);
    const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
    const ogDesc  = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i);
    const ogPrice = html.match(/<meta[^>]+property=["']product:price:amount["'][^>]+content=["']([^"']+)["']/i);

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, " ")
      .trim();

    const meta = [
      ogTitle?.[1]    && `Title: ${ogTitle[1]}`,
      titleMatch?.[1] && `Page title: ${titleMatch[1]}`,
      ogDesc?.[1]     && `Description: ${ogDesc[1]}`,
      metaDesc?.[1]   && `Meta description: ${metaDesc[1]}`,
      ogPrice?.[1]    && `Price: ${ogPrice[1]}`,
    ]
      .filter(Boolean)
      .join("\n");

    return `${meta}\n\nPage content:\n${text.slice(0, 4500)}`.trim().slice(0, 5000);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return `Could not fetch page (${message}). Rely on the description and image provided.`;
  }
}

async function backfillVerdictImages(userId: string, verdict: VerdictResult) {
  const allIds = [
    ...verdict.similarOwnedItems.map((i) => i.id),
    ...verdict.outfitsItEnables.flatMap((o) => o.pieces.map((p) => p.id)),
  ];
  if (!allIds.length) return;
  const rows = await prisma.wardrobeItem.findMany({
    where: { id: { in: [...new Set(allIds)] }, userId, isActive: true },
    select: { id: true, imageUrl: true },
  });
  const map = Object.fromEntries(rows.map((r) => [r.id, r.imageUrl]));
  for (const item of verdict.similarOwnedItems) {
    (item as Record<string, unknown>).imageUrl = map[item.id] ?? null;
  }
  for (const outfit of verdict.outfitsItEnables) {
    for (const piece of outfit.pieces) {
      (piece as Record<string, unknown>).imageUrl = map[piece.id] ?? null;
    }
  }
}

async function verifyGarmentIds(userId: string, verdict: VerdictResult): Promise<string | null> {
  const allIds = [
    ...verdict.similarOwnedItems.map((i) => i.id),
    ...verdict.outfitsItEnables.flatMap((o) => o.pieces.map((p) => p.id)),
  ];
  if (!allIds.length) return null;
  const uniqueIds = [...new Set(allIds)];
  const found = await prisma.wardrobeItem.findMany({
    where: { id: { in: uniqueIds }, userId, isActive: true },
    select: { id: true },
  });
  const foundSet = new Set(found.map((r) => r.id));
  const missing = uniqueIds.filter((id) => !foundSet.has(id));
  return missing.length > 0
    ? `These garment IDs do not exist in the wardrobe: ${missing.join(", ")}. Only use IDs returned by search_garments.`
    : null;
}

function toolStepText(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "fetch_product_page":    return "Reading the product page";
    case "wardrobe_get_profile":  return "Reading your style profile";
    case "search_garments": {
      const q = String(input.query ?? input.category ?? "").trim();
      return q ? `Searching wardrobe for "${q}"` : "Scanning your wardrobe";
    }
    case "get_garment":         return "Inspecting a garment";
    case "get_groupings":       return "Reviewing your saved groupings";
    case "get_wear_history":    return "Checking how often a similar item gets worn";
    case "get_wear_stats":      return "Reviewing your wear patterns";
    case "buy_verdict":         return "Forming my verdict";
    default:                    return name.replace(/_/g, " ");
  }
}

function argsSummary(name: string, input: Record<string, unknown>): string {
  switch (name) {
    case "search_garments":  return String(input.category ?? input.query ?? "").slice(0, 60) || "all";
    case "get_garment":      return String(input.id ?? "").slice(0, 30);
    case "get_wear_history": return String(input.garment_id ?? "").slice(0, 30);
    case "get_wear_stats":   return input.category ? String(input.category).slice(0, 30) : "all";
    case "fetch_product_page": return String(input.url ?? "").slice(0, 60);
    default:                 return "";
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  const rawUserId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!rawUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const userId: string = rawUserId;

  const body = (await req.json()) as ShouldIBuyRequest;
  const { productUrl, description, imageBase64, priceNote, followUp, previousVerdict } = body;

  if (!productUrl && !description && !imageBase64) {
    return NextResponse.json(
      { error: "Provide at least one of: productUrl, description, or imageBase64" },
      { status: 400 }
    );
  }

  let model: string, systemPrompt: string;
  try {
    ({ model, systemPrompt } = await loadAgentDef());
  } catch {
    return NextResponse.json({ error: "Shopping advisor unavailable" }, { status: 500 });
  }

  const mcpClient = await connectMcp(userId);
  const encoder = new TextEncoder();
  const sseHeaders = {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    "X-Accel-Buffering": "no",
  };

  const stream = new ReadableStream({
    async start(controller) {
      function emit(event: object) {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch { /* client disconnected */ }
      }

      // 60-second timeout
      const abortCtrl = new AbortController();
      const timeoutId = setTimeout(() => abortCtrl.abort(), 60_000);

      try {
        const { tools: mcpTools } = await mcpClient.listTools();
        const tools: Anthropic.Tool[] = [
          ...mcpTools.map((t) => ({
            name: t.name,
            description: t.description ?? "",
            input_schema: t.inputSchema as Anthropic.Tool["input_schema"],
          })),
          FETCH_PRODUCT_PAGE_TOOL,
          STATUS_UPDATE_TOOL,
          BUY_VERDICT_TOOL,
        ];

        // Build user message
        const textParts: string[] = [];
        if (productUrl)   textParts.push(`Product URL: ${productUrl} (call fetch_product_page to understand this product)`);
        if (description)  textParts.push(`Product description: ${description}`);
        if (priceNote)    textParts.push(`Price: ${priceNote}`);

        let userContent: Anthropic.MessageParam["content"];
        if (imageBase64) {
          const mimeMatch = imageBase64.match(/^data:(image\/[a-z]+);base64,/);
          const mediaType = (mimeMatch?.[1] as "image/jpeg" | "image/png" | "image/gif" | "image/webp") ?? "image/jpeg";
          const base64Data = imageBase64.replace(/^data:image\/[a-z]+;base64,/, "");
          userContent = [
            { type: "image", source: { type: "base64", media_type: mediaType, data: base64Data } },
            { type: "text", text: textParts.join("\n") || "Please evaluate this product for my wardrobe." },
          ];
        } else {
          userContent = textParts.join("\n") || "Please evaluate this product for my wardrobe.";
        }

        // Pre-fetch wardrobe context + product page in parallel before the first LLM
        // call. Injecting as synthetic tool history lets the model call buy_verdict
        // immediately instead of spending a roundtrip fetching data.
        const prefetchLabel = productUrl
          ? "Reading the product page and scanning your wardrobe"
          : "Scanning your wardrobe";
        emit({ type: "step", text: prefetchLabel });

        function extractMcpText(r: Awaited<ReturnType<typeof mcpClient.callTool>>): string {
          return (r.content as Array<{ type: string; text?: string }>)
            .filter((c) => c.type === "text" && c.text)
            .map((c) => c.text!)
            .join("\n");
        }

        const [profileText, wardrobeText, productPageText] = await Promise.all([
          mcpClient.callTool({ name: "wardrobe_get_profile", arguments: {} }).then(extractMcpText),
          mcpClient.callTool({ name: "search_garments",      arguments: {} }).then(extractMcpText),
          productUrl ? fetchProductPage(productUrl) : Promise.resolve(""),
        ]);

        const prefetched = [
          { id: "pre_0", name: "wardrobe_get_profile",  input: {},                   text: profileText   },
          { id: "pre_1", name: "search_garments",        input: {},                   text: wardrobeText  },
          ...(productUrl ? [{ id: "pre_2", name: "fetch_product_page", input: { url: productUrl }, text: productPageText }] : []),
        ];

        let messages: Anthropic.MessageParam[];
        if (followUp && previousVerdict) {
          // Follow-up: keep existing history, no pre-fetch injection needed
          messages = [
            { role: "user", content: userContent },
            { role: "assistant", content: `Here is my previous assessment:\n${JSON.stringify(previousVerdict, null, 2)}` },
            { role: "user", content: `Follow-up question: ${followUp}. Please re-evaluate and call buy_verdict again with your updated assessment.` },
          ];
        } else {
          messages = [
            { role: "user", content: userContent },
            { role: "assistant", content: prefetched.map((p) => ({ type: "tool_use" as const, id: p.id, name: p.name, input: p.input })) },
            { role: "user",      content: prefetched.map((p) => ({ type: "tool_result" as const, tool_use_id: p.id, content: p.text })) },
          ];
        }

        let rawVerdict: Record<string, unknown> | null = null;
        const toolTrail: ToolTrailEntry[] = [];
        const MAX_TURNS = 10;

        for (let turn = 0; turn < MAX_TURNS; turn++) {
          const statusTurn = turn < 2 && !rawVerdict;
          const response = await anthropic.messages.create(
            {
              model,
              max_tokens: statusTurn ? 256 : 4096,
              system: systemPrompt,
              tools,
              tool_choice: statusTurn
                ? ({ type: "tool", name: "status_update" } as Anthropic.ToolChoiceTool)
                : ({ type: "auto" } as Anthropic.ToolChoiceAuto),
              messages,
            },
            { signal: abortCtrl.signal }
          );

          messages.push({ role: "assistant", content: response.content });
          if (response.stop_reason !== "tool_use") break;

          const toolUseBlocks = response.content.filter(
            (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
          );
          if (!toolUseBlocks.length) break;

          // Run all tool calls for this turn in parallel
          const toolResults = await Promise.all(
            toolUseBlocks.map(async (toolUse) => {
              const input = toolUse.input as Record<string, unknown>;
              const t0 = Date.now();
              let resultText = "";
              if (toolUse.name === "status_update") {
                const msg = (input as { message?: string }).message ?? "";
                if (msg) emit({ type: "step", text: msg });
                resultText = "ok";
              } else if (toolUse.name === "buy_verdict") {
                emit({ type: "step", text: toolStepText(toolUse.name, input) });
                rawVerdict = input;
                resultText = "Captured.";
              } else if (toolUse.name === "fetch_product_page") {
                const url = (input as { url?: string }).url ?? "";
                resultText = await fetchProductPage(url);
              } else {
                emit({ type: "step", text: toolStepText(toolUse.name, input) });
                const mcpResult = await mcpClient.callTool({ name: toolUse.name, arguments: input });
                const mcpContent = mcpResult.content as Array<{ type: string; text?: string }>;
                resultText = mcpContent
                  .filter((c) => c.type === "text" && c.text != null)
                  .map((c) => c.text!)
                  .join("\n");
                if (mcpResult.isError) resultText = `Error: ${resultText}`;
              }
              if (toolUse.name !== "status_update") {
                toolTrail.push({ tool: toolUse.name, argsSummary: argsSummary(toolUse.name, input), durationMs: Date.now() - t0 });
              }
              return { type: "tool_result" as const, tool_use_id: toolUse.id, content: resultText };
            })
          );

          messages.push({ role: "user", content: toolResults });
          if (rawVerdict) break;
        }

        // Safety net
        if (!rawVerdict) {
          emit({ type: "step", text: "Forming my verdict" });
          messages.push({
            role: "user",
            content: "You have all the information you need. Call buy_verdict now with your best assessment.",
          });
          const forced = await anthropic.messages.create(
            {
              model,
              max_tokens: 4096,
              system: systemPrompt,
              tools: [BUY_VERDICT_TOOL],
              tool_choice: { type: "tool", name: "buy_verdict" },
              messages,
            },
            { signal: abortCtrl.signal }
          );
          for (const block of forced.content) {
            if (block.type === "tool_use" && block.name === "buy_verdict") {
              rawVerdict = block.input as Record<string, unknown>;
              break;
            }
          }
        }

        if (!rawVerdict) {
          emit({ type: "error", message: "Shopping advisor could not generate a verdict. Please try again." });
          return;
        }

        // Validate + backfill, retry once on error
        async function validateAndBackfill(raw: Record<string, unknown>, _retryError?: string): Promise<{ verdict: VerdictResult; error?: string }> {
          const parsed = VerdictSchema.safeParse(raw);
          if (!parsed.success) {
            return { verdict: raw as unknown as VerdictResult, error: JSON.stringify(parsed.error.issues) };
          }
          const verdict = parsed.data;
          const idError = await verifyGarmentIds(userId, verdict);
          if (idError) return { verdict, error: idError };
          await backfillVerdictImages(userId, verdict);
          return { verdict };
        }

        const firstAttempt = await validateAndBackfill(rawVerdict);

        if (firstAttempt.error) {
          emit({ type: "step", text: "Verifying garment references" });
          messages.push({
            role: "user",
            content: `The previous buy_verdict had an error: ${firstAttempt.error}. Please call buy_verdict again with corrected data, using only valid garment IDs from the wardrobe.`,
          });
          const retry = await anthropic.messages.create(
            {
              model,
              max_tokens: 4096,
              system: systemPrompt,
              tools: [BUY_VERDICT_TOOL],
              tool_choice: { type: "tool", name: "buy_verdict" },
              messages,
            },
            { signal: abortCtrl.signal }
          );
          for (const block of retry.content) {
            if (block.type === "tool_use" && block.name === "buy_verdict") {
              rawVerdict = block.input as Record<string, unknown>;
              break;
            }
          }
          const secondAttempt = await validateAndBackfill(rawVerdict!);
          emit({ type: "result", data: { ...secondAttempt.verdict, toolTrail } });
          return;
        }

        emit({ type: "result", data: { ...firstAttempt.verdict, toolTrail } });
      } catch (err) {
        emit({ type: "error", message: err instanceof Error ? err.message : "Something went wrong. Please try again." });
      } finally {
        clearTimeout(timeoutId);
        await mcpClient.close();
        try { controller.close(); } catch { /* already closed */ }
      }
    },
  });

  return new Response(stream, { headers: sseHeaders });
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
