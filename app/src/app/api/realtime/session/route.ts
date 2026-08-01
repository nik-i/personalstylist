import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

function getInstructions(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "styling-instructions.md"), "utf-8");
  } catch {
    return "You are a personal stylist. Help the user find outfits from their wardrobe.";
  }
}

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const mcpUrl = process.env.MCP_SERVER_URL;
  const mcpToken = process.env.MCP_BEARER_TOKEN;
  if (!mcpUrl || !mcpToken) {
    return NextResponse.json({ error: "MCP_SERVER_URL or MCP_BEARER_TOKEN not configured" }, { status: 500 });
  }

  const instructions = getInstructions();

  const body = {
    model: "gpt-4o-realtime-preview",
    voice: "shimmer",
    instructions,
    tools: [
      {
        type: "mcp",
        server_label: "wardrobe",
        server_url: mcpUrl,
        headers: { Authorization: `Bearer ${mcpToken}` },
        require_approval: "never",
      },
    ],
  };

  const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("OpenAI session error:", text);
    return NextResponse.json({ error: "Failed to create realtime session", detail: text }, { status: 502 });
  }

  const data = await response.json();
  return NextResponse.json(data);
}
