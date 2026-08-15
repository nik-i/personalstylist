import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { classifyGarment } from "@/lib/classify";
import fs from "fs/promises";
import path from "path";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const item = await prisma.wardrobeItem.findFirst({
    where: { id, userId, isActive: true },
  });
  if (!item || !item.imageUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reset to pending so the UI reflects the retry
  await prisma.wardrobeItem.update({
    where: { id },
    data: { status: "pending_classification" },
  });

  // Read the stored image file
  const filePath = path.join(process.cwd(), "public", item.imageUrl);
  let buffer: Buffer;
  try {
    buffer = await fs.readFile(filePath);
  } catch {
    return NextResponse.json({ error: "Image file not found on disk" }, { status: 404 });
  }

  const ext = path.extname(item.imageUrl).slice(1).toLowerCase();
  const mimeMap: Record<string, string> = {
    jpg: "image/jpeg", jpeg: "image/jpeg",
    png: "image/png", webp: "image/webp", heic: "image/heic",
  };
  const mimeType = mimeMap[ext] ?? "image/jpeg";

  try {
    const attrs = await classifyGarment(buffer.toString("base64"), mimeType);
    await prisma.wardrobeItem.update({
      where: { id },
      data: {
        status: "classified",
        category: attrs.category,
        subcategory: attrs.subcategory,
        itemType: attrs.subcategory,
        colorPrimary: attrs.color_primary,
        colorSecondary: attrs.color_secondary,
        color: attrs.color_primary,
        undertone: attrs.undertone,
        pattern: attrs.pattern,
        fabric: attrs.fabric,
        fabricType: attrs.fabric,
        fit: JSON.stringify(attrs.fit),
        formality: attrs.formality,
        formalityLevel: attrs.formality,
        seasonWeight: attrs.season_weight,
        neckline: attrs.neckline,
        sleeveLength: attrs.sleeve_length,
        rise: attrs.rise,
        hemLength: attrs.hem_length,
        aesthetic: attrs.aesthetic,
        occasionTags: JSON.stringify(attrs.occasion_tags),
        isStatement: attrs.is_statement,
        colorGroup: attrs.color_group,
        textureFinish: attrs.texture_finish,
        layeringRole: attrs.layering_role,
        printScale: attrs.print_scale,
        legOpening: attrs.leg_opening,
      },
    });
    return NextResponse.json({ status: "classified", attrs });
  } catch (err) {
    console.error("[classify] failed for garment", id, err);
    await prisma.wardrobeItem.update({
      where: { id },
      data: { status: "failed" },
    });
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "Classification failed", detail: message }, { status: 502 });
  }
}
