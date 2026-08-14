import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateDailyOutfits } from "@/lib/ai/stylist";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const [wardrobe, profile] = await Promise.all([
    prisma.wardrobeItem.findMany({
      where: { userId, isActive: true },
      select: { id: true, itemType: true, color: true, formalityLevel: true, season: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
  ]);

  if (wardrobe.length < 3) {
    return NextResponse.json({ error: "not_enough_items" }, { status: 422 });
  }

  let highlightPrefs: string[] = [];
  let downplayPrefs: string[] = [];
  try {
    if (profile?.highlightPrefs) highlightPrefs = JSON.parse(profile.highlightPrefs);
    if (profile?.downplayPrefs) downplayPrefs = JSON.parse(profile.downplayPrefs);
  } catch {}

  const aiResult = await generateDailyOutfits({
    profile: { coloring: profile?.coloring, bodyShape: profile?.bodyShape, highlightPrefs, downplayPrefs },
    wardrobe,
  });

  const validIds = new Set(wardrobe.map((w) => w.id));

  const suggestions = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const outfit of aiResult.outfits) {
      const safeItemIds = outfit.wardrobeItemIds.filter((id) => validIds.has(id));
      if (safeItemIds.length < 2) continue;

      const suggestion = await tx.outfitSuggestion.create({
        data: {
          userId,
          vibeNote: outfit.occasion,
          gapAnalysis: JSON.stringify({ dailyStylingNote: outfit.stylingNote }),
        },
      });

      await tx.outfitItem.createMany({
        data: safeItemIds.map((wardrobeItemId) => ({
          outfitSuggestionId: suggestion.id,
          wardrobeItemId,
        })),
      });

      created.push({
        id: suggestion.id,
        occasion: outfit.occasion,
        stylingNote: outfit.stylingNote,
        itemIds: safeItemIds,
      });
    }
    return created;
  });

  return NextResponse.json({ suggestions });
}
