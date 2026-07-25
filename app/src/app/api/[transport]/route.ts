import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { prisma } from "@/lib/db";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getUserId(): string {
  const userId = process.env.MCP_USER_ID;
  if (!userId) {
    throw new Error(
      "MCP_USER_ID environment variable is not set. " +
      "Set it to your user ID to authenticate MCP requests."
    );
  }
  return userId;
}

function parseTags(raw: string): string[] {
  try { return JSON.parse(raw); } catch { return []; }
}

function formatItem(item: {
  id: string;
  userId: string;
  itemType: string;
  color: string | null;
  pattern: string | null;
  fabricType: string | null;
  formalityLevel: string | null;
  season: string | null;
  warmthLevel: string | null;
  tags: string;
  imageUrl: string | null;
  source: string | null;
  isActive: boolean;
  addedAt: Date;
}) {
  return { ...item, tags: parseTags(item.tags) };
}

// ─── MCP Handler ──────────────────────────────────────────────────────────────

const handler = createMcpHandler(
  (server) => {

    // ── wardrobe_list_items ──────────────────────────────────────────────────
    server.registerTool(
      "wardrobe_list_items",
      {
        title: "List Wardrobe Items",
        description: `List the user's active wardrobe items with optional filters.

Returns a paginated list of clothing items from the user's wardrobe.

Args:
  - itemType (string, optional): Filter by clothing type (e.g. "shirt", "dress", "jacket")
  - color (string, optional): Filter by color (case-insensitive partial match)
  - season (string, optional): Filter by season (e.g. "summer", "winter", "all")
  - formalityLevel (string, optional): Filter by formality (e.g. "casual", "formal", "business")
  - limit (number, optional): Max results to return, 1-100 (default: 50)
  - offset (number, optional): Results to skip for pagination (default: 0)
  - response_format (string, optional): "markdown" or "json" (default: "markdown")

Returns:
  List of wardrobe items with fields: id, itemType, color, pattern, fabricType,
  formalityLevel, season, warmthLevel, tags, imageUrl, source, addedAt`,
        inputSchema: {
          itemType: z.string().optional().describe("Filter by item type (e.g. 'shirt', 'dress')"),
          color: z.string().optional().describe("Filter by color (partial match)"),
          season: z.string().optional().describe("Filter by season (e.g. 'summer', 'winter')"),
          formalityLevel: z.string().optional().describe("Filter by formality level"),
          limit: z.number().int().min(1).max(100).default(50).describe("Max results"),
          offset: z.number().int().min(0).default(0).describe("Results to skip"),
          response_format: z.enum(["markdown", "json"]).default("markdown"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ itemType, color, season, formalityLevel, limit, offset, response_format }) => {
        try {
          const userId = getUserId();

          const where: Record<string, unknown> = { userId, isActive: true };
          if (itemType) where.itemType = { contains: itemType, mode: "insensitive" };
          if (color) where.color = { contains: color, mode: "insensitive" };
          if (season) where.season = { contains: season, mode: "insensitive" };
          if (formalityLevel) where.formalityLevel = { contains: formalityLevel, mode: "insensitive" };

          const [total, items] = await Promise.all([
            prisma.wardrobeItem.count({ where }),
            prisma.wardrobeItem.findMany({
              where,
              orderBy: { addedAt: "desc" },
              take: limit,
              skip: offset,
            }),
          ]);

          const formatted = items.map(formatItem);
          const hasMore = total > offset + items.length;

          if (response_format === "json") {
            return {
              content: [{
                type: "text",
                text: JSON.stringify({ total, count: items.length, offset, has_more: hasMore, items: formatted }, null, 2),
              }],
            };
          }

          const lines = [
            `# Wardrobe Items (${items.length} of ${total})`,
            "",
          ];
          if (items.length === 0) {
            lines.push("_No items found matching your filters._");
          } else {
            for (const item of formatted) {
              lines.push(`## ${item.itemType} — \`${item.id}\``);
              if (item.color) lines.push(`- **Color**: ${item.color}`);
              if (item.pattern) lines.push(`- **Pattern**: ${item.pattern}`);
              if (item.fabricType) lines.push(`- **Fabric**: ${item.fabricType}`);
              if (item.formalityLevel) lines.push(`- **Formality**: ${item.formalityLevel}`);
              if (item.season) lines.push(`- **Season**: ${item.season}`);
              if (item.warmthLevel) lines.push(`- **Warmth**: ${item.warmthLevel}`);
              if (item.tags.length) lines.push(`- **Tags**: ${item.tags.join(", ")}`);
              if (item.imageUrl) lines.push(`- **Image**: ${item.imageUrl}`);
              lines.push(`- **Added**: ${item.addedAt.toLocaleDateString()}`);
              lines.push("");
            }
            if (hasMore) lines.push(`_${total - offset - items.length} more items — use offset=${offset + items.length} to continue._`);
          }
          return { content: [{ type: "text", text: lines.join("\n") }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

    // ── wardrobe_get_item ────────────────────────────────────────────────────
    server.registerTool(
      "wardrobe_get_item",
      {
        title: "Get Wardrobe Item",
        description: `Get a single wardrobe item by its ID.

Args:
  - id (string, required): The wardrobe item ID
  - response_format (string, optional): "markdown" or "json" (default: "markdown")

Returns full details of the wardrobe item.`,
        inputSchema: {
          id: z.string().describe("Wardrobe item ID"),
          response_format: z.enum(["markdown", "json"]).default("markdown"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ id, response_format }) => {
        try {
          const userId = getUserId();
          const item = await prisma.wardrobeItem.findFirst({
            where: { id, userId, isActive: true },
          });
          if (!item) {
            return { content: [{ type: "text", text: `Error: Item '${id}' not found or not accessible.` }] };
          }
          const formatted = formatItem(item);
          if (response_format === "json") {
            return { content: [{ type: "text", text: JSON.stringify(formatted, null, 2) }] };
          }
          const lines = [
            `# ${item.itemType} — \`${item.id}\``,
            "",
            ...(item.color ? [`- **Color**: ${item.color}`] : []),
            ...(item.pattern ? [`- **Pattern**: ${item.pattern}`] : []),
            ...(item.fabricType ? [`- **Fabric**: ${item.fabricType}`] : []),
            ...(item.formalityLevel ? [`- **Formality**: ${item.formalityLevel}`] : []),
            ...(item.season ? [`- **Season**: ${item.season}`] : []),
            ...(item.warmthLevel ? [`- **Warmth**: ${item.warmthLevel}`] : []),
            ...(formatted.tags.length ? [`- **Tags**: ${formatted.tags.join(", ")}`] : []),
            ...(item.imageUrl ? [`- **Image**: ${item.imageUrl}`] : []),
            ...(item.source ? [`- **Source**: ${item.source}`] : []),
            `- **Added**: ${item.addedAt.toLocaleDateString()}`,
          ];
          return { content: [{ type: "text", text: lines.join("\n") }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

    // ── wardrobe_add_item ────────────────────────────────────────────────────
    server.registerTool(
      "wardrobe_add_item",
      {
        title: "Add Wardrobe Item",
        description: `Add a new item to the user's wardrobe.

Args:
  - itemType (string, required): Type of clothing (e.g. "shirt", "dress", "jeans", "jacket")
  - color (string, optional): Primary color of the item
  - pattern (string, optional): Pattern (e.g. "solid", "striped", "floral", "plaid")
  - fabricType (string, optional): Fabric material (e.g. "cotton", "silk", "wool")
  - formalityLevel (string, optional): Formality (e.g. "casual", "business", "formal")
  - season (string, optional): Best season to wear (e.g. "summer", "winter", "all")
  - warmthLevel (string, optional): Warmth level (e.g. "light", "medium", "heavy")
  - tags (array of strings, optional): Additional descriptive tags
  - imageUrl (string, optional): URL to a photo of the item
  - source (string, optional): Where the item came from (e.g. "Zara", "thrifted")

Returns: The created item's ID on success.`,
        inputSchema: {
          itemType: z.string().min(1).describe("Type of clothing item"),
          color: z.string().optional().describe("Primary color"),
          pattern: z.string().optional().describe("Pattern (e.g. solid, striped)"),
          fabricType: z.string().optional().describe("Fabric material"),
          formalityLevel: z.string().optional().describe("Formality level"),
          season: z.string().optional().describe("Best season to wear"),
          warmthLevel: z.string().optional().describe("Warmth level"),
          tags: z.array(z.string()).optional().describe("Descriptive tags"),
          imageUrl: z.string().url().optional().describe("Photo URL"),
          source: z.string().optional().describe("Where the item came from"),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: false,
          openWorldHint: false,
        },
      },
      async ({ itemType, color, pattern, fabricType, formalityLevel, season, warmthLevel, tags, imageUrl, source }) => {
        try {
          const userId = getUserId();
          const item = await prisma.wardrobeItem.create({
            data: {
              userId,
              itemType,
              color,
              pattern,
              fabricType,
              formalityLevel,
              season,
              warmthLevel,
              tags: JSON.stringify(tags ?? []),
              imageUrl,
              source,
            },
          });
          return {
            content: [{
              type: "text",
              text: `Successfully added ${itemType} to wardrobe. Item ID: \`${item.id}\``,
            }],
          };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

    // ── wardrobe_update_item ─────────────────────────────────────────────────
    server.registerTool(
      "wardrobe_update_item",
      {
        title: "Update Wardrobe Item",
        description: `Update an existing wardrobe item's details.

Args:
  - id (string, required): The wardrobe item ID to update
  - itemType (string, optional): New item type
  - color (string, optional): New color
  - pattern (string, optional): New pattern
  - fabricType (string, optional): New fabric type
  - formalityLevel (string, optional): New formality level
  - season (string, optional): New season
  - warmthLevel (string, optional): New warmth level
  - tags (array of strings, optional): New tags (replaces existing)
  - imageUrl (string, optional): New image URL
  - source (string, optional): New source

Only provided fields are updated. Returns success confirmation.`,
        inputSchema: {
          id: z.string().describe("Wardrobe item ID to update"),
          itemType: z.string().optional(),
          color: z.string().optional(),
          pattern: z.string().optional(),
          fabricType: z.string().optional(),
          formalityLevel: z.string().optional(),
          season: z.string().optional(),
          warmthLevel: z.string().optional(),
          tags: z.array(z.string()).optional().describe("Replaces existing tags"),
          imageUrl: z.string().url().optional(),
          source: z.string().optional(),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ id, tags, ...rest }) => {
        try {
          const userId = getUserId();
          const data = {
            ...rest,
            ...(tags !== undefined && { tags: JSON.stringify(tags) }),
          };
          const result = await prisma.wardrobeItem.updateMany({
            where: { id, userId, isActive: true },
            data,
          });
          if (result.count === 0) {
            return { content: [{ type: "text", text: `Error: Item '${id}' not found or not accessible.` }] };
          }
          return { content: [{ type: "text", text: `Successfully updated item \`${id}\`.` }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

    // ── wardrobe_remove_item ─────────────────────────────────────────────────
    server.registerTool(
      "wardrobe_remove_item",
      {
        title: "Remove Wardrobe Item",
        description: `Remove an item from the wardrobe (soft delete — marks as inactive).

Args:
  - id (string, required): The wardrobe item ID to remove

The item is not permanently deleted — it is marked inactive and will no longer
appear in wardrobe_list_items results. Returns success confirmation.`,
        inputSchema: {
          id: z.string().describe("Wardrobe item ID to remove"),
        },
        annotations: {
          readOnlyHint: false,
          destructiveHint: true,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ id }) => {
        try {
          const userId = getUserId();
          const result = await prisma.wardrobeItem.updateMany({
            where: { id, userId, isActive: true },
            data: { isActive: false },
          });
          if (result.count === 0) {
            return { content: [{ type: "text", text: `Error: Item '${id}' not found or already removed.` }] };
          }
          return { content: [{ type: "text", text: `Successfully removed item \`${id}\` from wardrobe.` }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

    // ── wardrobe_get_profile ─────────────────────────────────────────────────
    server.registerTool(
      "wardrobe_get_profile",
      {
        title: "Get Style Profile",
        description: `Get the user's style profile including body characteristics and style preferences.

Returns:
  - coloring: Skin tone / coloring description
  - bodyShape: Body shape descriptor
  - styleSignals: Style personality signals
  - highlightPrefs: Body areas the user likes to highlight
  - downplayPrefs: Body areas the user prefers to downplay
  - response_format (string, optional): "markdown" or "json" (default: "markdown")`,
        inputSchema: {
          response_format: z.enum(["markdown", "json"]).default("markdown"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ response_format }) => {
        try {
          const userId = getUserId();
          const profile = await prisma.userProfile.findUnique({ where: { userId } });
          if (!profile) {
            return { content: [{ type: "text", text: "No style profile found. Complete onboarding to create one." }] };
          }
          if (response_format === "json") {
            return { content: [{ type: "text", text: JSON.stringify(profile, null, 2) }] };
          }
          const lines = [
            "# Style Profile",
            "",
            ...(profile.coloring ? [`- **Coloring**: ${profile.coloring}`] : []),
            ...(profile.bodyShape ? [`- **Body Shape**: ${profile.bodyShape}`] : []),
            ...(profile.styleSignals ? [`- **Style Signals**: ${profile.styleSignals}`] : []),
            ...(profile.highlightPrefs ? [`- **Highlights**: ${profile.highlightPrefs}`] : []),
            ...(profile.downplayPrefs ? [`- **Downplays**: ${profile.downplayPrefs}`] : []),
          ];
          return { content: [{ type: "text", text: lines.join("\n") }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

    // ── wardrobe_get_sizes ───────────────────────────────────────────────────
    server.registerTool(
      "wardrobe_get_sizes",
      {
        title: "Get User Sizes",
        description: `Get the user's clothing sizes across categories.

Returns a list of size entries, each with:
  - category: Clothing category (e.g. "tops", "bottoms", "shoes", "dresses")
  - sizeValue: The size value (e.g. "M", "32", "8")
  - region: Size region/standard (e.g. "US", "EU", "UK")

Args:
  - response_format (string, optional): "markdown" or "json" (default: "markdown")`,
        inputSchema: {
          response_format: z.enum(["markdown", "json"]).default("markdown"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ response_format }) => {
        try {
          const userId = getUserId();
          const sizes = await prisma.size.findMany({ where: { userId } });
          if (!sizes.length) {
            return { content: [{ type: "text", text: "No sizes recorded yet." }] };
          }
          if (response_format === "json") {
            return { content: [{ type: "text", text: JSON.stringify(sizes, null, 2) }] };
          }
          const lines = ["# Clothing Sizes", ""];
          for (const s of sizes) {
            lines.push(`- **${s.category}**: ${s.sizeValue}${s.region ? ` (${s.region})` : ""}`);
          }
          return { content: [{ type: "text", text: lines.join("\n") }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

    // ── wardrobe_get_brand_preferences ───────────────────────────────────────
    server.registerTool(
      "wardrobe_get_brand_preferences",
      {
        title: "Get Brand Preferences",
        description: `Get the user's preferred clothing brands by wear category.

Returns a list of brand preferences, each with:
  - brand name and website
  - wearCategory: The clothing category this preference applies to

Args:
  - response_format (string, optional): "markdown" or "json" (default: "markdown")`,
        inputSchema: {
          response_format: z.enum(["markdown", "json"]).default("markdown"),
        },
        annotations: {
          readOnlyHint: true,
          destructiveHint: false,
          idempotentHint: true,
          openWorldHint: false,
        },
      },
      async ({ response_format }) => {
        try {
          const userId = getUserId();
          const prefs = await prisma.brandPreference.findMany({
            where: { userId },
            include: { brand: true },
          });
          if (!prefs.length) {
            return { content: [{ type: "text", text: "No brand preferences recorded yet." }] };
          }
          if (response_format === "json") {
            return {
              content: [{
                type: "text",
                text: JSON.stringify(
                  prefs.map(p => ({ brandId: p.brandId, name: p.brand.name, website: p.brand.websiteUrl, wearCategory: p.wearCategory })),
                  null, 2
                ),
              }],
            };
          }
          const lines = ["# Brand Preferences", ""];
          for (const p of prefs) {
            const website = p.brand.websiteUrl ? ` — ${p.brand.websiteUrl}` : "";
            lines.push(`- **${p.wearCategory}**: ${p.brand.name}${website}`);
          }
          return { content: [{ type: "text", text: lines.join("\n") }] };
        } catch (error) {
          return { content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }] };
        }
      }
    );

  },
  {},
  {
    basePath: "/api",
    maxDuration: 60,
  }
);

export { handler as GET, handler as POST };
