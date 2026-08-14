import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json() as {
    itemType: string;
    color?: string | null;
    pattern?: string | null;
    fabricType?: string | null;
    formalityLevel?: string | null;
    season?: string | null;
    warmthLevel?: string | null;
    imageUrl?: string | null;
  }[];

  if (!Array.isArray(body) || body.length === 0) {
    return NextResponse.json({ error: "Expected non-empty array of items" }, { status: 400 });
  }

  const created = await prisma.$transaction(
    body.map((item) =>
      prisma.wardrobeItem.create({
        data: {
          userId,
          itemType: item.itemType,
          color: item.color ?? null,
          pattern: item.pattern ?? null,
          fabricType: item.fabricType ?? null,
          formalityLevel: item.formalityLevel ?? null,
          season: item.season ?? null,
          warmthLevel: item.warmthLevel ?? null,
          source: "import",
          tags: "[]",
          imageUrl: item.imageUrl ?? null,
        },
      })
    )
  );

  return NextResponse.json({ created: created.length, items: created }, { status: 201 });
}

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.wardrobeItem.findMany({
    where: { userId, isActive: true },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json(
    items.map((item) => {
      let tags: string[] = [];
      try { tags = JSON.parse(item.tags); } catch { /* malformed — default to empty */ }
      return { ...item, tags };
    })
  );
}
