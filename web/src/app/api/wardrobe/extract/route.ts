import { NextRequest, NextResponse } from "next/server";
import { extractClothingFromImage } from "@/lib/ai/extract";

const SUPPORTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    const indexStr = formData.get("index") as string | null;

    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const mediaType = SUPPORTED_TYPES.has(file.type)
      ? (file.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif")
      : "image/jpeg";

    const arrayBuffer = await file.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const photoIndex = indexStr ? parseInt(indexStr, 10) : 0;

    const items = await extractClothingFromImage(base64, mediaType, photoIndex);

    return NextResponse.json({ items, photoIndex });
  } catch (err) {
    console.error("Extraction error:", err);
    return NextResponse.json({ error: "Extraction failed", items: [] }, { status: 500 });
  }
}
