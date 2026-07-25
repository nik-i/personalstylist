import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { GoalFormSchema } from "@/lib/validations/outfits";
import { generateGapAnalysis } from "@/lib/ai/stylist";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const suggestions = await prisma.outfitSuggestion.findMany({
    where: { userId: session.user.id },
    orderBy: { generatedAt: "desc" },
    include: {
      occasion: true,
      outfitItems: { include: { wardrobeItem: true } },
    },
  });

  return NextResponse.json(
    suggestions.map((s) => {
      let gapAnalysis = null;
      try {
        if (s.gapAnalysis) gapAnalysis = JSON.parse(s.gapAnalysis);
      } catch {}
      return { ...s, gapAnalysis };
    })
  );
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = GoalFormSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const userId = session.user.id;

  const [wardrobe, profile, brandPrefs] = await Promise.all([
    prisma.wardrobeItem.findMany({
      where: { userId, isActive: true },
      select: { id: true, itemType: true, color: true, pattern: true, formalityLevel: true, season: true },
    }),
    prisma.userProfile.findUnique({ where: { userId } }),
    prisma.brandPreference.findMany({
      where: { userId },
      include: { brand: true },
    }),
  ]);

  if (wardrobe.length === 0) {
    return NextResponse.json({ error: "empty_wardrobe" }, { status: 422 });
  }

  let highlightPrefs: string[] = [];
  let downplayPrefs: string[] = [];
  try {
    if (profile?.highlightPrefs) highlightPrefs = JSON.parse(profile.highlightPrefs);
    if (profile?.downplayPrefs) downplayPrefs = JSON.parse(profile.downplayPrefs);
  } catch {}

  const aiResult = await generateGapAnalysis({
    goal: {
      type: parsed.data.goalType,
      description: parsed.data.description,
      frustration: parsed.data.frustration,
    },
    profile: {
      coloring: profile?.coloring,
      bodyShape: profile?.bodyShape,
      highlightPrefs,
      downplayPrefs,
    },
    wardrobe,
    brandPrefs: brandPrefs.map((bp) => ({ brand: bp.brand.name, category: bp.wearCategory })),
  });

  // Honesty guardrail: verify ownedItemIds are real, active, and belong to this user
  const validOwnedIds = new Set(wardrobe.map((w) => w.id));
  const safeOwnedItemIds = aiResult.ownedItemIds.filter((id) => validOwnedIds.has(id));

  const suggestion = await prisma.$transaction(async (tx) => {
    const occasion = await tx.occasion.create({
      data: {
        userId,
        occasionType: parsed.data.goalType,
        description: parsed.data.description,
        formalityLevel: parsed.data.formalityLevel,
        eventDate: parsed.data.eventDate ? new Date(parsed.data.eventDate) : null,
      },
    });

    const outfitSuggestion = await tx.outfitSuggestion.create({
      data: {
        userId,
        occasionId: occasion.id,
        vibeNote: aiResult.stylistNote,
        gapAnalysis: JSON.stringify(aiResult),
      },
    });

    if (safeOwnedItemIds.length > 0) {
      await tx.outfitItem.createMany({
        data: safeOwnedItemIds.map((wardrobeItemId) => ({
          outfitSuggestionId: outfitSuggestion.id,
          wardrobeItemId,
        })),
      });
    }

    return outfitSuggestion;
  });

  return NextResponse.json({ id: suggestion.id });
}
