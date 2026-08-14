#!/usr/bin/env node
/**
 * Fetch the current user's wardrobe from the database.
 *
 * Reads DATABASE_URL and MCP_USER_ID from .env.local (three levels up from
 * this file, i.e. the app/ root).
 *
 * Outputs a JSON array of wardrobe items compatible with the outfit-suggester
 * engine, or exits with code 1 if the wardrobe can't be fetched.
 *
 * Usage (from anywhere):
 *   node app/.claude/skills/style-me/fetch-wardrobe.cjs
 */

const path = require("path");
const fs   = require("fs");

// ── Load .env.local from app/ root ───────────────────────────────────────────

const envPath = path.join(__dirname, "../../../.env.local");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

// ── Validate ──────────────────────────────────────────────────────────────────

const userId = process.env.MCP_USER_ID;
if (!userId) {
  console.error("MCP_USER_ID is not set in .env.local — cannot identify which user's wardrobe to fetch.");
  process.exit(1);
}

// ── Query Prisma (uses PrismaPg adapter, matching app/src/lib/db.ts) ──────────

const { PrismaClient } = require("@prisma/client");
const { PrismaPg }     = require("@prisma/adapter-pg");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma  = new PrismaClient({ adapter, log: ["error"] });

async function main() {
  const rows = await prisma.wardrobeItem.findMany({
    where: { userId, isActive: true },
    orderBy: { addedAt: "desc" },
    select: {
      id:             true,
      itemType:       true,
      color:          true,
      pattern:        true,
      formalityLevel: true,
      season:         true,
      warmthLevel:    true,
      tags:           true,
      imageUrl:       true,
    },
  });

  const items = rows.map((item) => ({
    ...item,
    tags: (() => { try { return JSON.parse(item.tags); } catch { return []; } })(),
  }));

  console.log(JSON.stringify(items));
}

main()
  .catch((e) => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
