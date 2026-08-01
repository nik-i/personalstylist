/**
 * Quick validation test for the Wardrobe MCP server.
 * Run with: npm run test:mcp  (requires the MCP server to be running on MCP_PORT/3001)
 */
import http from "http";

const MCP_PORT = parseInt(process.env.MCP_PORT ?? "3001");
const BEARER = process.env.MCP_BEARER_TOKEN ?? "";

let passed = 0;
let failed = 0;

// ── MCP JSON-RPC helpers ──────────────────────────────────────────────────────

function callMcp(
  method: string,
  params: unknown,
  bearer?: string
): Promise<{ status: number; body: unknown }> {
  return new Promise((resolve) => {
    const payload = JSON.stringify({
      jsonrpc: "2.0",
      id: Math.floor(Math.random() * 1e9),
      method,
      params,
    });
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(payload)),
      "Accept": "application/json, text/event-stream",
      "Connection": "close", // prevent SSE connection reuse
    };
    if (bearer !== undefined) headers["Authorization"] = `Bearer ${bearer}`;

    const req = http.request(
      { hostname: "127.0.0.1", port: MCP_PORT, path: "/mcp", method: "POST", headers },
      (res) => {
        let raw = "";
        let resolved = false;

        function tryResolve() {
          if (resolved) return;
          // Parse SSE message when the data line arrives
          const dataLine = raw.split("\n").find((l) => l.startsWith("data: "));
          if (!dataLine && res.statusCode && res.statusCode !== 200) {
            // Non-200 might return plain JSON (e.g., auth errors)
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
            res.destroy(); // close SSE stream immediately after receiving message
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

async function callTool(
  name: string,
  args: unknown,
  bearer = BEARER
): Promise<{ status: number; body: unknown }> {
  return callMcp("tools/call", { name, arguments: args }, bearer);
}

// ── Assertions ────────────────────────────────────────────────────────────────

function assert(label: string, condition: boolean, detail?: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ ${label}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

function isMcpError(body: unknown): boolean {
  const b = body as Record<string, unknown>;
  if (b?.error) return true;
  const result = b?.result as Record<string, unknown> | undefined;
  return result?.isError === true;
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function runTests() {
  console.log(`Testing MCP server at http://127.0.0.1:${MCP_PORT}/mcp\n`);

  // 1. Missing bearer token (no Authorization header) → 401
  {
    const label = "Missing bearer token → 401";
    // Call callMcp directly with bearer=undefined so NO Authorization header is sent
    const { status } = await callMcp("tools/call", { name: "search_garments", arguments: {} }, undefined);
    assert(label, status === 401, `got ${status}`);
  }

  // 2. Wrong bearer token → 401
  {
    const label = "Wrong bearer token → 401";
    const { status } = await callTool("search_garments", {}, "wrong-token");
    assert(label, status === 401, `got ${status}`);
  }

  // Initialize (required for stateless mode — some clients need this)
  await callMcp("initialize", {
    protocolVersion: "2025-03-26",
    capabilities: {},
    clientInfo: { name: "test-client", version: "1.0.0" },
  });

  // 3. search_garments with invalid category enum → MCP error
  {
    const label = "search_garments invalid category → MCP error";
    const { status, body } = await callTool("search_garments", { category: "pants" });
    assert(label, status === 200 && isMcpError(body), `status=${status} body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 4. search_garments with valid filters → array result
  {
    const label = "search_garments valid filters → array";
    const { status, body } = await callTool("search_garments", { category: "top" });
    const result = (body as Record<string, unknown>)?.result;
    const content = (result as Record<string, unknown>)?.content;
    const text = (content as Array<Record<string, unknown>>)?.[0]?.text as string;
    let isArray = false;
    try { isArray = Array.isArray(JSON.parse(text)); } catch { /* */ }
    assert(label, status === 200 && !isMcpError(body) && isArray, `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 5. search_garments with invalid formality → MCP error
  {
    const label = "search_garments invalid formality → MCP error";
    const { status, body } = await callTool("search_garments", { formality: "ultra_formal" });
    assert(label, status === 200 && isMcpError(body), `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 6. get_garment with a dummy ID → not found error
  {
    const label = "get_garment non-existent ID → error";
    const { status, body } = await callTool("get_garment", { id: "nonexistent-garment-id" });
    assert(label, status === 200 && isMcpError(body), `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 7. get_groupings with valid dimension → grouped object
  {
    const label = "get_groupings color → grouped object";
    const { status, body } = await callTool("get_groupings", { dimension: "color" });
    const result = (body as Record<string, unknown>)?.result;
    const content = (result as Record<string, unknown>)?.content;
    const text = (content as Array<Record<string, unknown>>)?.[0]?.text as string;
    let isObj = false;
    try { const parsed = JSON.parse(text); isObj = typeof parsed === "object" && !Array.isArray(parsed); } catch { /* */ }
    assert(label, status === 200 && !isMcpError(body) && isObj, `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 8. get_groupings with invalid dimension → MCP error
  {
    const label = "get_groupings invalid dimension → MCP error";
    const { status, body } = await callTool("get_groupings", { dimension: "size" });
    assert(label, status === 200 && isMcpError(body), `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 9. update_garment_attributes with non-whitelisted key → rejected
  {
    const label = "update_garment_attributes non-whitelisted key → rejected";
    const { status, body } = await callTool("update_garment_attributes", {
      id: "some-id",
      patch: { imagePath: "/uploads/secret.jpg" },
    });
    assert(label, status === 200 && isMcpError(body), `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 10. update_garment_attributes with invalid enum value → rejected
  {
    const label = "update_garment_attributes invalid enum value → rejected";
    const { status, body } = await callTool("update_garment_attributes", {
      id: "some-id",
      patch: { formality: "ultra_formal" },
    });
    assert(label, status === 200 && isMcpError(body), `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 11. save_feedback with invalid reaction → rejected
  {
    const label = "save_feedback invalid reaction → rejected";
    const { status, body } = await callTool("save_feedback", {
      garment_id: "some-id",
      reaction: "meh",
    });
    assert(label, status === 200 && isMcpError(body), `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // 12. save_feedback with missing garment_id → error (FK violation or MCP validation)
  {
    const label = "save_feedback missing garment_id → error";
    const { status, body } = await callTool("save_feedback", { reaction: "liked" });
    assert(label, status === 200 && isMcpError(body), `body=${JSON.stringify(body).slice(0, 120)}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

runTests().catch((err) => {
  console.error("Test runner error:", err);
  process.exit(1);
});
