import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

type PieceSnapshot = {
  id: string;
  itemType: string;
  color: string | null;
  imageUrl: string | null;
};

function parsePieces(raw: string): PieceSnapshot[] {
  try { return JSON.parse(raw); } catch { return []; }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = (await req.json()) as {
    pieceIds?: string[];
    occasion?: string | null;
    note?: string | null;
  };

  const existing = await prisma.outfitLog.findFirst({ where: { id, userId } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const updateData: Record<string, unknown> = {
    occasion: body.occasion ?? null,
    note: body.note ?? null,
  };

  if (body.pieceIds && body.pieceIds.length > 0) {
    const garments = await prisma.wardrobeItem.findMany({
      where: { id: { in: body.pieceIds }, userId, isActive: true },
      select: { id: true, itemType: true, color: true, imageUrl: true },
    });
    const garmentMap = new Map(garments.map((g) => [g.id, g]));
    const pieces: PieceSnapshot[] = body.pieceIds
      .filter((pid) => garmentMap.has(pid))
      .map((pid) => garmentMap.get(pid)!);
    if (pieces.length > 0) updateData.pieces = JSON.stringify(pieces);
  }

  const updated = await prisma.outfitLog.update({ where: { id }, data: updateData });
  return NextResponse.json({ ...updated, pieces: parsePieces(updated.pieces) });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const result = await prisma.outfitLog.deleteMany({ where: { id, userId } });
  if (result.count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
