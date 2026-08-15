// Local-only dev MCP server (port 3001). NOT deployed — production uses the Next.js
// API route at /api/mcp (app/src/app/api/[transport]/route.ts) instead.
// Unique tools here: search_garments, get_groupings, save_feedback.
import express, { Request, Response, NextFunction } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { z } from "zod";
import {
  CategoryEnum,
  UndertoneEnum,
  PatternEnum,
  FabricEnum,
  FitEnum,
  FormalityEnum,
  SeasonWeightEnum,
  ReactionEnum,
  GroupingDimensionEnum,
  PatchSchema,
  SearchFiltersSchema,
} from "./enums.js";
import { logToolCall } from "./logger.js";

const PORT = parseInt(process.env.MCP_PORT ?? "3001");
const USER_ID = process.env.MCP_USER_ID ?? "";
const BEARER = process.env.MCP_BEARER_TOKEN ?? "";

function createPrismaClient(): PrismaClient {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter, log: ["error"] });
}

const readDb = createPrismaClient();
const writeDb = createPrismaClient();

function requireBearer(req: Request, res: Response, next: NextFunction): void {
  if (!BEARER) {
    next();
    return;
  }
  const raw = (req.headers["authorization"] ?? "") as string;
  const token = raw.startsWith("Bearer ") ? raw.slice(7) : "";
  if (token !== BEARER) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
}

function safeParseFit(raw: string | null | undefined): string[] {
  try { return JSON.parse(raw ?? "[]"); } catch { return []; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatGarment(item: any) {
  return {
    id: item.id,
    itemType: item.itemType ?? null,
    imageUrl: item.imageUrl ?? null,
    thumbnailPath: item.thumbnailPath ?? null,
    category: item.category ?? null,
    subcategory: item.subcategory ?? null,
    colorPrimary: item.colorPrimary ?? item.color ?? null,
    colorSecondary: item.colorSecondary ?? null,
    undertone: item.undertone ?? null,
    fabric: item.fabric ?? item.fabricType ?? null,
    fit: safeParseFit(item.fit),
    formality: item.formality ?? item.formalityLevel ?? null,
    seasonWeight: item.seasonWeight ?? item.warmthLevel ?? null,
    pattern: item.pattern ?? null,
    neckline: item.neckline ?? null,
    sleeveLength: item.sleeveLength ?? null,
    rise: item.rise ?? null,
    hemLength: item.hemLength ?? null,
    // Styling metadata
    aesthetic: item.aesthetic ?? null,
    occasionTags: (() => { try { return JSON.parse(item.occasionTags ?? "[]"); } catch { return []; } })(),
    isStatement: item.isStatement ?? false,
    colorGroup: item.colorGroup ?? null,
    textureFinish: item.textureFinish ?? null,
    layeringRole: item.layeringRole ?? null,
    printScale: item.printScale ?? null,
    legOpening: item.legOpening ?? null,
  };
}

function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildMcpServer(userId: string): McpServer {
  const server = new McpServer({ name: "wardrobe-stylist", version: "1.0.0" });
  const uid = userId || USER_ID;

  server.tool(
    "search_garments",
    "Search the user's wardrobe by attributes. All filters optional. Returns id, imageUrl, all classification fields (including aesthetic, occasionTags, colorGroup, textureFinish, layeringRole, printScale, legOpening, isStatement), and past feedback reactions.",
    SearchFiltersSchema.shape,
    async (args) => {
      logToolCall("search_garments", args);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const where: any = { userId: uid, isActive: true };
      if (args.category) where.category = args.category;
      if (args.formality) where.formality = args.formality;
      if (args.season_weight) where.seasonWeight = args.season_weight;
      if (args.pattern) where.pattern = args.pattern;
      if (args.fabric) where.fabric = args.fabric;
      if (args.color_primary) {
        where.OR = [
          { colorPrimary: { contains: args.color_primary, mode: "insensitive" } },
          { color: { contains: args.color_primary, mode: "insensitive" } },
        ];
      }
      if (args.undertone) where.undertone = args.undertone;
      if (args.fit) where.fit = { contains: `"${args.fit}"` };
      if (args.aesthetic) where.aesthetic = args.aesthetic;
      if (args.color_group) where.colorGroup = args.color_group;
      if (args.layering_role) where.layeringRole = args.layering_role;
      if (args.is_statement !== undefined) where.isStatement = args.is_statement;
      if (args.occasion_tag) where.occasionTags = { contains: `"${args.occasion_tag}"` };

      const items = await readDb.wardrobeItem.findMany({
        where,
        include: { feedback: { orderBy: { createdAt: "desc" }, take: 5 } },
      });
      const shuffled = shuffleArray(items);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(shuffled.map((item) => ({
            ...formatGarment(item),
            feedback: item.feedback.map((f) => ({ reaction: f.reaction, note: f.note ?? null, date: f.createdAt })),
          }))),
        }],
      };
    }
  );

  server.tool(
    "get_garment",
    "Get a single garment by ID.",
    { id: z.string() },
    async (args) => {
      logToolCall("get_garment", args);
      const item = await readDb.wardrobeItem.findFirst({
        where: { id: args.id, userId: uid, isActive: true },
      });
      if (!item) {
        return {
          content: [{ type: "text" as const, text: "Garment not found" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify(formatGarment(item)) }],
      };
    }
  );

  server.tool(
    "get_groupings",
    "Get garments grouped by a dimension: color, formality, weather, or aesthetic. Weather maps season_weight: lightweight→warm, midweight→mild, heavy→cold.",
    { dimension: GroupingDimensionEnum },
    async (args) => {
      logToolCall("get_groupings", args);
      const items = await readDb.wardrobeItem.findMany({
        where: { userId: uid, isActive: true },
      });

      const grouped: Record<string, ReturnType<typeof formatGarment>[]> = {};
      const WEIGHT_MAP: Record<string, string> = {
        lightweight: "warm",
        midweight: "mild",
        heavy: "cold",
      };

      for (const item of items) {
        let key: string;
        if (args.dimension === "color") {
          key = item.colorPrimary ?? item.color ?? "unknown";
        } else if (args.dimension === "formality") {
          key = item.formality ?? item.formalityLevel ?? "unknown";
        } else if (args.dimension === "aesthetic") {
          key = item.aesthetic ?? "unknown";
        } else {
          const weight = item.seasonWeight ?? item.warmthLevel ?? "";
          key = WEIGHT_MAP[weight] ?? "unknown";
        }
        grouped[key] = grouped[key] ?? [];
        grouped[key].push(formatGarment(item));
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(grouped) }],
      };
    }
  );

  server.tool(
    "update_garment_attributes",
    "Update whitelisted attributes of a garment. Allowed patch keys: fit, undertone, formality, color_primary, color_secondary, season_weight. Unknown keys are rejected.",
    {
      id: z.string(),
      patch: z.object({
        fit: z.array(FitEnum).optional(),
        undertone: UndertoneEnum.optional(),
        formality: FormalityEnum.optional(),
        color_primary: z.string().optional(),
        color_secondary: z.string().nullable().optional(),
        season_weight: SeasonWeightEnum.optional(),
      }),
    },
    async (args) => {
      logToolCall("update_garment_attributes", args);
      // Strict parse to reject unknown keys
      const parsed = PatchSchema.safeParse(args.patch);
      if (!parsed.success) {
        const msg = parsed.error.issues.map((i) => i.message).join("; ");
        return {
          content: [{ type: "text" as const, text: `Validation error: ${msg}` }],
          isError: true,
        };
      }

      const patch = parsed.data;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = {};
      if (patch.fit !== undefined) data.fit = JSON.stringify(patch.fit);
      if (patch.undertone !== undefined) data.undertone = patch.undertone;
      if (patch.formality !== undefined) data.formality = patch.formality;
      if (patch.color_primary !== undefined) data.colorPrimary = patch.color_primary;
      if (patch.color_secondary !== undefined) data.colorSecondary = patch.color_secondary;
      if (patch.season_weight !== undefined) data.seasonWeight = patch.season_weight;

      const result = await writeDb.wardrobeItem.updateMany({
        where: { id: args.id, userId: uid, isActive: true },
        data,
      });

      if (result.count === 0) {
        return {
          content: [{ type: "text" as const, text: "Garment not found" }],
          isError: true,
        };
      }
      return {
        content: [{ type: "text" as const, text: JSON.stringify({ success: true }) }],
      };
    }
  );

  server.tool(
    "save_feedback",
    "Save feedback about a garment recommendation. Reaction must be one of: liked, disliked, too_formal, too_casual, wrong_fit, wrong_weather, other.",
    {
      garment_id: z.string(),
      reaction: ReactionEnum,
      note: z.string().nullable().optional(),
    },
    async (args) => {
      logToolCall("save_feedback", args);
      try {
        const feedback = await writeDb.feedback.create({
          data: {
            garmentId: args.garment_id,
            reaction: args.reaction,
            note: args.note ?? null,
          },
        });
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ success: true, id: feedback.id }) }],
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Database error";
        return { content: [{ type: "text" as const, text: `Error: ${msg}` }], isError: true };
      }
    }
  );

  server.tool(
    "wardrobe_get_profile",
    "Get the user's style profile: coloring (season), body shape, undertone, highlight/downplay preferences. Call this first before browsing garments.",
    {},
    async () => {
      logToolCall("wardrobe_get_profile", {});
      const profile = await readDb.userProfile.findUnique({ where: { userId: uid } });
      if (!profile) {
        return { content: [{ type: "text" as const, text: "No style profile found. Proceed without profile context." }] };
      }
      return { content: [{ type: "text" as const, text: JSON.stringify(profile) }] };
    }
  );

  // ── Wear history helpers (inline — MCP server has its own Prisma clients) ──────

  function parsePiecesLocal(raw: string): Array<{ id: string }> {
    try { return JSON.parse(raw); } catch { return []; }
  }

  server.tool(
    "get_wear_history",
    "Get wear history for a single garment: how many times it has been logged in an outfit, the last date it was worn, the last 10 worn dates, and the occasions associated with those logs. Returns a clear 'never worn' shape when the garment has no history. Use this after search_garments finds similar owned items.",
    { garment_id: z.string().describe("The wardrobe item ID to look up") },
    async (args) => {
      logToolCall("get_wear_history", args);

      // Verify garment belongs to this user
      const garment = await readDb.wardrobeItem.findFirst({
        where: { id: args.garment_id, userId: uid, isActive: true },
        select: { id: true },
      });
      if (!garment) {
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: "unknown_garment", garmentId: args.garment_id }) }],
          isError: true,
        };
      }

      const logs = await readDb.outfitLog.findMany({
        where: { userId: uid },
        orderBy: { date: "desc" },
        select: { date: true, pieces: true, occasion: true },
      });

      const matching = logs.filter((l) => parsePiecesLocal(l.pieces).some((p) => p.id === args.garment_id));

      if (matching.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              garmentId: args.garment_id,
              neverWorn: true,
              wearCount: 0,
              lastWornDate: null,
              wornDates: [],
              occasions: [],
            }),
          }],
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            garmentId: args.garment_id,
            neverWorn: false,
            wearCount: matching.length,
            lastWornDate: matching[0].date,
            wornDates: matching.slice(0, 10).map((l) => l.date),
            occasions: matching.map((l) => l.occasion).filter(Boolean),
          }),
        }],
      };
    }
  );

  server.tool(
    "get_wear_stats",
    "Get per-garment wear counts for the whole wardrobe, or filtered to one category (e.g. 'tops', 'bottoms', 'outerwear'). Returns items sorted by wearCount descending. Use this to find the user's most-worn pieces for outfit pairing, or to see if a whole category is rarely worn.",
    { category: z.string().optional().describe("Prisma category value to filter by (e.g. 'tops'). Omit for whole wardrobe.") },
    async (args) => {
      logToolCall("get_wear_stats", args);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const whereItem: any = { userId: uid, isActive: true };
      if (args.category) whereItem.category = args.category;

      const [garments, logs] = await Promise.all([
        readDb.wardrobeItem.findMany({
          where: whereItem,
          select: { id: true, itemType: true, color: true, colorPrimary: true, category: true },
        }),
        readDb.outfitLog.findMany({
          where: { userId: uid },
          orderBy: { date: "desc" },
          select: { date: true, pieces: true },
        }),
      ]);

      const stats = garments
        .map((g) => {
          const worn = logs.filter((l) => parsePiecesLocal(l.pieces).some((p) => p.id === g.id));
          return {
            id: g.id,
            itemType: g.itemType,
            color: g.color ?? g.colorPrimary ?? null,
            category: g.category ?? null,
            wearCount: worn.length,
            lastWornDate: worn[0]?.date ?? null,
          };
        })
        .sort((a, b) => b.wearCount - a.wearCount);

      return {
        content: [{ type: "text" as const, text: JSON.stringify(stats) }],
      };
    }
  );

  server.tool(
    "get_weather",
    "Get the weather forecast for a location on a specific day. Returns temp_min_c, temp_max_c, condition, and precipitation_probability_pct.",
    {
      lat: z.number().describe("Latitude"),
      lon: z.number().describe("Longitude"),
      day_offset: z.number().int().min(0).max(6).default(0).describe("0 = today, 1 = tomorrow, …, 6 = 6 days out"),
    },
    async (args) => {
      logToolCall("get_weather", args);
      try {
        const params = new URLSearchParams({
          latitude: String(args.lat),
          longitude: String(args.lon),
          daily: "temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max",
          timezone: "auto",
          forecast_days: "7",
        });
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
        if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`);
        const data = await res.json() as {
          daily: {
            time: string[];
            temperature_2m_max: number[];
            temperature_2m_min: number[];
            weather_code: number[];
            precipitation_probability_max: number[];
          };
        };
        const d = data.daily;
        const idx = Math.max(0, Math.min(6, args.day_offset ?? 0));
        const code = d.weather_code[idx];
        const condition =
          code === 0 || code === 1 ? "clear" :
          code <= 3 ? "cloudy" :
          code <= 49 ? "fog" :
          code <= 69 ? "rain" :
          code <= 79 ? "snow" : "rain";
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              date: d.time[idx],
              temp_min_c: Math.round(d.temperature_2m_min[idx]),
              temp_max_c: Math.round(d.temperature_2m_max[idx]),
              condition,
              precipitation_probability_pct: d.precipitation_probability_max[idx] ?? 0,
            }),
          }],
        };
      } catch {
        return { content: [{ type: "text" as const, text: "Weather unavailable — proceed without weather guidance." }] };
      }
    }
  );

  return server;
}

const app = express();
// Do NOT use express.json() globally — the MCP StreamableHTTPServerTransport
// uses @hono/node-server to read the raw request body stream. Pre-parsing via
// express.json() consumes the stream before Hono can read it, causing parse errors.

app.post("/mcp", requireBearer, async (req: Request, res: Response) => {
  const userId = (req.headers["x-user-id"] as string) || USER_ID;
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  const mcpServer = buildMcpServer(userId);
  await mcpServer.connect(transport);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await transport.handleRequest(req as any, res as any);
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Wardrobe MCP server listening on port ${PORT}`);
  if (!USER_ID) console.warn("Warning: MCP_USER_ID not set — tool calls will return empty results");
  if (!BEARER) console.warn("Warning: MCP_BEARER_TOKEN not set — all requests accepted (no auth)");
});
