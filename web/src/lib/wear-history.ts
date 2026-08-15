// Wear-history query helpers — backed by the OutfitLog table.
// pieces is stored as JSON: PieceSnapshot[] where PieceSnapshot.id is the garment ID.
import { prisma } from "@/lib/db";

type PieceSnapshot = { id: string; itemType: string; color: string | null };

function parsePieces(raw: string): PieceSnapshot[] {
  try { return JSON.parse(raw); } catch { return []; }
}

// How many distinct outfit logs contain this garment.
export async function getWearCount(userId: string, garmentId: string): Promise<number> {
  const logs = await prisma.outfitLog.findMany({
    where: { userId },
    select: { pieces: true },
  });
  return logs.filter((l) => parsePieces(l.pieces).some((p) => p.id === garmentId)).length;
}

// The most recent date (YYYY-MM-DD) this garment appeared in a log, or null.
export async function getLastWorn(userId: string, garmentId: string): Promise<string | null> {
  const logs = await prisma.outfitLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true, pieces: true },
  });
  const found = logs.find((l) => parsePieces(l.pieces).some((p) => p.id === garmentId));
  return found?.date ?? null;
}

export type WearStat = {
  id: string;
  itemType: string;
  color: string | null;
  wearCount: number;
  lastWornDate: string | null;
};

// Per-garment wear stats for the whole wardrobe (or a single category), sorted by wearCount desc.
export async function getWearStatsByCategory(
  userId: string,
  category?: string
): Promise<WearStat[]> {
  const whereItem: { userId: string; isActive: boolean; category?: string } = {
    userId,
    isActive: true,
  };
  if (category) whereItem.category = category;

  const [garments, logs] = await Promise.all([
    prisma.wardrobeItem.findMany({
      where: whereItem,
      select: { id: true, itemType: true, color: true, colorPrimary: true },
    }),
    prisma.outfitLog.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      select: { date: true, pieces: true },
    }),
  ]);

  return garments
    .map((g) => {
      const matching = logs.filter((l) => parsePieces(l.pieces).some((p) => p.id === g.id));
      return {
        id: g.id,
        itemType: g.itemType,
        color: g.color ?? (g as { colorPrimary?: string | null }).colorPrimary ?? null,
        wearCount: matching.length,
        lastWornDate: matching[0]?.date ?? null,
      };
    })
    .sort((a, b) => b.wearCount - a.wearCount);
}

// IDs of active wardrobe items that have never appeared in any outfit log.
export async function getNeverWornGarments(userId: string): Promise<string[]> {
  const [garments, logs] = await Promise.all([
    prisma.wardrobeItem.findMany({
      where: { userId, isActive: true },
      select: { id: true },
    }),
    prisma.outfitLog.findMany({
      where: { userId },
      select: { pieces: true },
    }),
  ]);

  const wornIds = new Set<string>();
  for (const log of logs) {
    for (const p of parsePieces(log.pieces)) wornIds.add(p.id);
  }
  return garments.filter((g) => !wornIds.has(g.id)).map((g) => g.id);
}
