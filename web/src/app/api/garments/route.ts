import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storage } from "@/lib/storage";
import { classifyGarment } from "@/lib/classify";

const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
]);
const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

function getUserId(session: { user?: { id?: string } } | null): string | null {
  return session?.user?.id ?? process.env.MCP_USER_ID ?? null;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("image") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No image provided" }, { status: 400 });
  }
  if (!SUPPORTED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: "Unsupported type. Use jpeg, png, webp, or heic." },
      { status: 415 }
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File exceeds 10 MB limit" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { imagePath, thumbnailPath } = await storage.save(buffer, file.type);

  // Create the DB record immediately so the UI can show it
  const garment = await prisma.wardrobeItem.create({
    data: {
      userId,
      itemType: "unknown",
      imageUrl: imagePath,
      thumbnailPath,
      source: "upload",
      status: "pending_classification",
    },
  });

  // Classify synchronously — fire-and-forget is unreliable on scale-to-zero containers
  const base64 = buffer.toString("base64");
  let classifyStatus: "classified" | "failed" = "classified";
  try {
    const attrs = await classifyGarment(base64, file.type);
    await prisma.wardrobeItem.update({
      where: { id: garment.id },
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
      },
    });
  } catch {
    classifyStatus = "failed";
    await prisma.wardrobeItem.update({
      where: { id: garment.id },
      data: { status: "failed" },
    });
  }

  return NextResponse.json({ id: garment.id, imagePath, thumbnailPath, status: classifyStatus }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  const userId = getUserId(session);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.wardrobeItem.findMany({
    where: { userId, isActive: true, source: "upload" },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(items.map((i) => ({
    ...i,
    fit: (() => { try { return JSON.parse(i.fit); } catch { return []; } })(),
    tags: (() => { try { return JSON.parse(i.tags); } catch { return []; } })(),
  })));
}
