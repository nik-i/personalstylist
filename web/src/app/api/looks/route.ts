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

function formatLog(log: { id: string; userId: string; date: string; pieces: string; occasion: string | null; note: string | null; createdAt: Date }) {
  return { ...log, pieces: parsePieces(log.pieces) };
}

export async function GET(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "YYYY-MM" or null for all

  const where = month
    ? { userId, date: { startsWith: month } }
    : { userId };

  const logs = await prisma.outfitLog.findMany({
    where,
    orderBy: { date: "desc" },
    take: 200,
  });

  return NextResponse.json(logs.map(formatLog));
}

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as {
    date: string;
    pieceIds: string[];
    occasion?: string | null;
    note?: string | null;
  };

  const { date, pieceIds, occasion, note } = body;
  if (!date || !Array.isArray(pieceIds) || pieceIds.length === 0) {
    return NextResponse.json({ error: "date and at least one pieceId are required" }, { status: 400 });
  }

  // Fetch garment snapshots for the provided IDs
  const garments = await prisma.wardrobeItem.findMany({
    where: { id: { in: pieceIds }, userId, isActive: true },
    select: { id: true, itemType: true, color: true, imageUrl: true },
  });

  const garmentMap = new Map(garments.map((g) => [g.id, g]));
  const pieces: PieceSnapshot[] = pieceIds
    .filter((id) => garmentMap.has(id))
    .map((id) => garmentMap.get(id)!);

  if (pieces.length === 0) {
    return NextResponse.json({ error: "No valid garments found" }, { status: 400 });
  }

  const log = await prisma.outfitLog.upsert({
    where: { userId_date: { userId, date } },
    create: {
      userId,
      date,
      pieces: JSON.stringify(pieces),
      occasion: occasion ?? null,
      note: note ?? null,
    },
    update: {
      pieces: JSON.stringify(pieces),
      occasion: occasion ?? null,
      note: note ?? null,
    },
  });

  return NextResponse.json(formatLog(log), { status: 201 });
}
