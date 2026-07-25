import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "REMOVE_BG_API_KEY not configured" }, { status: 503 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const body = new FormData();
    body.append("image_file", file);
    body.append("size", "auto");

    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": apiKey },
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Remove.bg error:", res.status, err);
      return NextResponse.json({ error: "Remove.bg request failed" }, { status: 502 });
    }

    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    return NextResponse.json({ dataUrl: `data:image/png;base64,${base64}` });
  } catch (err) {
    console.error("Remove.bg error:", err);
    return NextResponse.json({ error: "Background removal failed" }, { status: 500 });
  }
}
