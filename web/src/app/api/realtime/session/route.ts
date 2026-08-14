import { NextRequest, NextResponse } from "next/server";

const VOICE_SYSTEM_PROMPT = `You are Maya, Frock's warm and friendly personal stylist. You help users figure out what to wear from their own wardrobe.

Keep responses natural and conversational — brief, spoken-friendly, like chatting with a knowledgeable friend. No bullet points or lists.

IMPORTANT — speak before acting: Before calling any tool, always say something first so there is no dead air. For example:
- "Let me take a look at your wardrobe..."
- "Give me just a second to check that..."
- "Let me pull that up for you..."
Never go silent without first acknowledging what you are about to do.

When talking about outfits, reference items warmly and specifically — "your navy blazer", "those dark trousers" — and keep the suggestion to 2–3 sentences.

You have two tools:
- style_me: call this when the user wants outfit suggestions or style advice for any occasion
- get_weather: call this when the user asks about the weather, or when knowing current conditions would help with outfit advice`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OPENAI_API_KEY not configured" }, { status: 500 });
  }

  const reqBody = await req.json().catch(() => ({})) as { lat?: number; lon?: number };

  let instructions = VOICE_SYSTEM_PROMPT;
  if (reqBody.lat != null && reqBody.lon != null) {
    instructions += `\n\nUser's current coordinates: ${reqBody.lat.toFixed(4)}, ${reqBody.lon.toFixed(4)}. Pass these to get_weather when weather context would help.`;
  }

  const body = {
    model: "gpt-4o-realtime-preview",
    voice: "shimmer",
    instructions,
    tools: [
      {
        type: "function",
        name: "style_me",
        description: "Get a personalized outfit suggestion from the user's real wardrobe for any occasion or need",
        parameters: {
          type: "object",
          properties: {
            request: {
              type: "string",
              description: "The user's full styling request, e.g. 'something smart for a dinner date tonight' or 'a casual look for the park this weekend'",
            },
          },
          required: ["request"],
        },
      },
      {
        type: "function",
        name: "get_weather",
        description: "Get current weather conditions for a location",
        parameters: {
          type: "object",
          properties: {
            lat: { type: "number", description: "Latitude" },
            lon: { type: "number", description: "Longitude" },
          },
          required: ["lat", "lon"],
        },
      },
    ],
    turn_detection: {
      type: "server_vad",
      threshold: 0.5,
      prefix_padding_ms: 300,
      silence_duration_ms: 500,
      create_response: true,
      interrupt_response: true,
    },
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
