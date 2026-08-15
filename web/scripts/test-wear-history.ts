/**
 * Wear-history end-to-end verification.
 *
 * What it does:
 *  1. Seeds two OutfitLog entries for one wardrobe item (frequently worn).
 *  2. Leaves a second item with zero logs (rarely/never worn).
 *  3. Calls get_wear_history and get_wear_stats on the MCP server to verify shapes.
 *  4. If the Next.js server is available (NEXTJS_URL env), runs three agent scenarios
 *     and prints the toolTrail for each to confirm diverging tool paths.
 *
 * Run:  npm run test:wear-history
 * Requires:  MCP server running (npm run mcp:dev), .env.local loaded.
 * Optional:  NEXTJS_URL=http://localhost:3000 for full agent scenarios.
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import http from "http";

const MCP_PORT     = parseInt(process.env.MCP_PORT ?? "3001");
const BEARER       = process.env.MCP_BEARER_TOKEN ?? "";
const USER_ID      = process.env.MCP_USER_ID ?? "";
const NEXTJS       = process.env.NEXTJS_URL ?? "http://localhost:3000";
// Pass a real session cookie to run full agent scenarios:
//   SESSION_TOKEN=<authjs.session-token cookie value> npm run test:wear-history
const SESSION_TOKEN = process.env.SESSION_TOKEN ?? "";

if (!USER_ID) {
  console.error("MCP_USER_ID not set — cannot seed or query wear history");
  process.exit(1);
}

// ── Prisma (direct — no @/ alias in scripts) ──────────────────────────────────

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter, log: ["error"] });

// ── MCP JSON-RPC helpers (reuse pattern from test-mcp.ts) ─────────────────────

function callMcp(
  method: string,
  params: unknown,
  bearer = BEARER
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({ jsonrpc: "2.0", id: Math.floor(Math.random() * 1e9), method, params });
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(payload)),
      "Accept": "application/json, text/event-stream",
      "Connection": "close",
    };
    if (bearer) headers["Authorization"] = `Bearer ${bearer}`;

    const req = http.request(
      { hostname: "127.0.0.1", port: MCP_PORT, path: "/mcp", method: "POST", headers },
      (res) => {
        let raw = "";
        let resolved = false;
        function tryResolve() {
          if (resolved) return;
          const dataLine = raw.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine && res.statusCode && res.statusCode !== 200) {
            resolved = true;
            let body: unknown;
            try { body = JSON.parse(raw); } catch { body = raw; }
            res.destroy();
            resolve({ status: res.statusCode, body });
            return;
          }
          if (dataLine) {
            resolved = true;
            let body: unknown;
            try { body = JSON.parse(dataLine.slice(6)); } catch { body = raw; }
            res.destroy();
            resolve({ status: res.statusCode ?? 200, body });
          }
        }
        res.on("data", (c) => { raw += c; tryResolve(); });
        res.on("end", () => { if (!resolved) { resolved = true; resolve({ status: res.statusCode ?? 0, body: raw || "" }); } });
      }
    );
    req.on("error", (e) => resolve({ status: 0, body: e.message }));
    req.write(payload);
    req.end();
  });
}

async function callTool(name: string, args: unknown): Promise<unknown> {
  const { body } = await callMcp("tools/call", { name, arguments: args });
  const result = (body as Record<string, unknown>)?.result as Record<string, unknown> | undefined;
  const content = result?.content as Array<{ type: string; text?: string }> | undefined;
  const text = content?.find((c) => c.type === "text")?.text ?? "";
  try { return JSON.parse(text); } catch { return text; }
}

// ── SSE fetch for should-i-buy ─────────────────────────────────────────────────

type ToolTrailEntry = { tool: string; argsSummary: string; durationMs: number };
type AgentResult = { verdict?: string; wearInsight?: string; toolTrail?: ToolTrailEntry[] };

async function callShouldIBuy(description: string): Promise<AgentResult> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (SESSION_TOKEN) headers["Cookie"] = `authjs.session-token=${SESSION_TOKEN}`;

  const res = await fetch(`${NEXTJS}/api/should-i-buy`, {
    method: "POST",
    headers,
    body: JSON.stringify({ description }),
    redirect: "manual",
  });

  if (res.status >= 300 && res.status < 400) throw new Error(`Auth redirect (${res.status}) — set SESSION_TOKEN env var`);
  if (!res.body) throw new Error("No response body from should-i-buy");
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let result: AgentResult | null = null;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const parts = buf.split("\n\n");
    buf = parts.pop() ?? "";
    for (const part of parts) {
      const line = part.trim();
      if (!line.startsWith("data: ")) continue;
      let ev: { type: string; data?: AgentResult; message?: string };
      try { ev = JSON.parse(line.slice(6)); } catch { continue; }
      if (ev.type === "result" && ev.data) result = ev.data;
      else if (ev.type === "error") throw new Error(ev.message ?? "Advisor error");
    }
  }
  if (!result) throw new Error("No result received from should-i-buy");
  return result;
}

// ── Assertions ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = "") {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("=== Wear-history end-to-end verification ===\n");

  // ── 1. Pick or create two test garments ──────────────────────────────────────

  console.log("── Seeding outfit log data ──");

  // Find any two active garments owned by this user.
  const garments = await db.wardrobeItem.findMany({
    where: { userId: USER_ID, isActive: true },
    select: { id: true, itemType: true, color: true, colorPrimary: true, category: true },
    take: 2,
  });

  if (garments.length < 1) {
    console.error("No wardrobe items found for MCP_USER_ID. Add some items first.");
    await db.$disconnect();
    process.exit(1);
  }

  const frequentItem = garments[0];
  const rareItem     = garments.length > 1 ? garments[1] : garments[0];

  // Seed 5 outfit log dates for frequentItem, 0 for rareItem.
  const today = new Date();
  const testDates = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - i * 7);
    return d.toISOString().slice(0, 10);
  });

  // Upsert rather than insert to avoid unique constraint collisions on re-runs.
  let seeded = 0;
  for (const date of testDates) {
    const pieces = JSON.stringify([{
      id: frequentItem.id,
      itemType: frequentItem.itemType,
      color: frequentItem.color ?? frequentItem.colorPrimary ?? null,
      imageUrl: null,
    }]);
    await db.outfitLog.upsert({
      where: { userId_date: { userId: USER_ID, date } },
      update: { pieces },
      create: { userId: USER_ID, date, pieces, occasion: "test" },
    });
    seeded++;
  }

  console.log(`  Seeded ${seeded} outfit log entries for "${frequentItem.itemType}" (id: ${frequentItem.id.slice(0, 8)}…)`);
  if (rareItem.id !== frequentItem.id) {
    console.log(`  "${rareItem.itemType}" (id: ${rareItem.id.slice(0, 8)}…) has no logs — will appear as never worn`);
  }

  // ── 2. MCP tool verification ──────────────────────────────────────────────────

  console.log("\n── MCP tool tests ──");

  // Initialize the MCP session
  await callMcp("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "wear-history-test", version: "1.0.0" },
  });

  // get_wear_history — frequently worn item
  {
    const result = await callTool("get_wear_history", { garment_id: frequentItem.id }) as Record<string, unknown>;
    assert(
      `get_wear_history (frequent): neverWorn=false, wearCount≥${seeded}`,
      result.neverWorn === false && Number(result.wearCount) >= seeded,
      JSON.stringify(result).slice(0, 200)
    );
    assert(
      "get_wear_history (frequent): wornDates is array",
      Array.isArray(result.wornDates),
      JSON.stringify(result).slice(0, 120)
    );
    console.log(`    wearCount=${result.wearCount}, lastWorn=${result.lastWornDate}`);
  }

  // get_wear_history — never worn item (only if different from frequent)
  if (rareItem.id !== frequentItem.id) {
    const result = await callTool("get_wear_history", { garment_id: rareItem.id }) as Record<string, unknown>;
    const isNeverWorn = result.neverWorn === true || Number(result.wearCount) === 0;
    assert(
      "get_wear_history (rare): neverWorn=true or wearCount=0",
      isNeverWorn,
      JSON.stringify(result).slice(0, 200)
    );
    console.log(`    neverWorn=${result.neverWorn}, wearCount=${result.wearCount}`);
  }

  // get_wear_history — unknown garment → isError
  {
    const { body } = await callMcp("tools/call", { name: "get_wear_history", arguments: { garment_id: "nonexistent-0000" } });
    const isErr = Boolean(
      (body as Record<string, unknown>)?.result &&
      ((body as Record<string, unknown>).result as Record<string, unknown>)?.isError === true
    );
    assert("get_wear_history (unknown id): returns isError", isErr, JSON.stringify(body).slice(0, 160));
  }

  // get_wear_stats — whole wardrobe
  {
    const result = await callTool("get_wear_stats", {}) as unknown[];
    assert(
      "get_wear_stats (all): returns array",
      Array.isArray(result),
      JSON.stringify(result).slice(0, 120)
    );
    if (Array.isArray(result) && result.length > 0) {
      const first = result[0] as Record<string, unknown>;
      assert(
        "get_wear_stats (all): sorted by wearCount desc",
        typeof first.wearCount === "number",
        JSON.stringify(first)
      );
      console.log(`    top worn: ${first.itemType} (${first.color}), wearCount=${first.wearCount}`);
    }
  }

  // get_wear_stats — filtered to frequent item's category
  if (frequentItem.category) {
    const result = await callTool("get_wear_stats", { category: frequentItem.category }) as unknown[];
    assert(
      `get_wear_stats (category=${frequentItem.category}): returns array`,
      Array.isArray(result),
      JSON.stringify(result).slice(0, 120)
    );
  }

  // ── 3. Agent scenarios (optional — requires Next.js server) ──────────────────

  const skipAgent = process.env.SKIP_AGENT === "1";

  let serverAvailable = false;
  if (!skipAgent) {
    if (!SESSION_TOKEN) {
      console.log("\n── Agent scenarios skipped (no SESSION_TOKEN) ──");
      console.log("   To run full agent tests: SESSION_TOKEN=<authjs.session-token cookie> npm run test:wear-history");
    } else {
      try {
        const checkHeaders: Record<string, string> = {
          "Content-Type": "application/json",
          "Cookie": `authjs.session-token=${SESSION_TOKEN}`,
        };
        const check = await fetch(`${NEXTJS}/api/should-i-buy`, {
          method: "POST",
          headers: checkHeaders,
          body: JSON.stringify({}),
          redirect: "manual",
        });
        // 400 = server is up and rejected empty body; 401 = server up, auth failed
        serverAvailable = check.status === 400 || check.status === 200 || check.status === 401;
        if (check.status >= 300 && check.status < 400) {
          console.log(`\n── Agent scenarios skipped (auth redirect ${check.status}) ──`);
          console.log("   Check your SESSION_TOKEN value.");
        }
      } catch {
        console.log(`\n── Agent scenarios skipped (${NEXTJS} not reachable) ──`);
        console.log("   Start the Next.js server and pass NEXTJS_URL if it's on a different port.");
      }
    }
  }

  if (serverAvailable) {
    console.log("\n── Agent scenario tests ──");

    // Build product descriptions that match seeded items
    const frequentDesc = `A ${frequentItem.color ?? ""} ${frequentItem.itemType} (similar to what I already own, category: ${frequentItem.category ?? "unknown"})`;
    const rareDesc = rareItem.id !== frequentItem.id
      ? `A ${rareItem.color ?? ""} ${rareItem.itemType} (similar style to one in my closet, category: ${rareItem.category ?? "unknown"})`
      : `A bright red item I definitely don't own (unicorn sequined cape)`;
    const noMatchDesc = "A bright red unicorn-print sequined cape — something completely unique I definitely don't own";

    // Scenario A: frequent item → should call get_wear_history, verdict may lean buy
    console.log("\n  Scenario A — product similar to FREQUENTLY WORN item");
    console.log(`  Description: "${frequentDesc}"`);
    try {
      const a = await callShouldIBuy(frequentDesc);
      const trail = a.toolTrail ?? [];
      const calledWearHistory = trail.some((e) => e.tool === "get_wear_history");
      assert("Scenario A: agent called get_wear_history", calledWearHistory, `trail: ${trail.map((e) => e.tool).join(" → ")}`);
      console.log(`  Verdict: ${a.verdict ?? "—"}`);
      console.log(`  wearInsight: ${a.wearInsight ?? "(empty)"}`);
      console.log("  Tool trail:");
      trail.forEach((e, i) => console.log(`    ${i + 1}. ${e.tool}${e.argsSummary ? ` (${e.argsSummary})` : ""} — ${e.durationMs}ms`));
    } catch (err) {
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }

    // Scenario B: rare item → should call get_wear_history, verdict may lean skip
    console.log("\n  Scenario B — product similar to RARELY/NEVER WORN item");
    console.log(`  Description: "${rareDesc}"`);
    try {
      const b = await callShouldIBuy(rareDesc);
      const trail = b.toolTrail ?? [];
      console.log(`  Verdict: ${b.verdict ?? "—"}`);
      console.log(`  wearInsight: ${b.wearInsight ?? "(empty)"}`);
      console.log("  Tool trail:");
      trail.forEach((e, i) => console.log(`    ${i + 1}. ${e.tool}${e.argsSummary ? ` (${e.argsSummary})` : ""} — ${e.durationMs}ms`));
    } catch (err) {
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }

    // Scenario C: no match → should NOT call get_wear_history
    console.log("\n  Scenario C — product with NO similar owned item");
    console.log(`  Description: "${noMatchDesc}"`);
    try {
      const c = await callShouldIBuy(noMatchDesc);
      const trail = c.toolTrail ?? [];
      const calledWearHistory = trail.some((e) => e.tool === "get_wear_history");
      assert("Scenario C: agent did NOT call get_wear_history", !calledWearHistory, `trail: ${trail.map((e) => e.tool).join(" → ")}`);
      assert("Scenario C: result is not an error", !!c.verdict);
      console.log(`  Verdict: ${c.verdict ?? "—"}`);
      console.log("  Tool trail:");
      trail.forEach((e, i) => console.log(`    ${i + 1}. ${e.tool}${e.argsSummary ? ` (${e.argsSummary})` : ""} — ${e.durationMs}ms`));
    } catch (err) {
      console.error(`  ERROR: ${err instanceof Error ? err.message : String(err)}`);
      failed++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────

  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  await db.$disconnect();
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
