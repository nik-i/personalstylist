import { NextRequest, NextResponse } from "next/server";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const SUPPORTED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 });
    }

    const mimeType = SUPPORTED.has(file.type) ? file.type : "image/jpeg";
    const ext = EXT[mimeType] ?? "jpg";
    const filename = `${randomUUID()}.${ext}`;
    const dest = join(process.cwd(), "public", "wardrobe-images", filename);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(dest, buffer);

    return NextResponse.json({ url: `/wardrobe-images/${filename}` });
  } catch (err) {
    console.error("Image upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
