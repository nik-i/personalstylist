import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildContext, suggestOutfit, StyleMeItem } from "@/lib/ai/styleme";

type DailyContext = {
  mood?: string;
  note?: string;
};

type StyleMeRequest = {
  occasion: string;
  when: { preset?: string; date?: string; time?: string };
  indoorOutdoor: "indoors" | "outdoors" | "mix";
  dailyContext?: DailyContext;
};

export async function POST(req: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id ?? process.env.MCP_USER_ID;
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json()) as StyleMeRequest;
  const { occasion, when, indoorOutdoor, dailyContext } = body;

  if (!occasion || !indoorOutdoor) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const rows = await prisma.wardrobeItem.findMany({
    where: { userId, isActive: true },
    select: { id: true, itemType: true, color: true, pattern: true, formalityLevel: true, season: true, warmthLevel: true, tags: true, imageUrl: true },
  });

  if (rows.length === 0) {
    return NextResponse.json({ empty: true });
  }

  const items: StyleMeItem[] = rows.map((r) => {
    let tags: string[] = [];
    try { tags = JSON.parse(r.tags); } catch { /* empty default */ }
    return { ...r, tags };
  });

  const ctx = buildContext(occasion, when ?? {}, indoorOutdoor);
  if (dailyContext?.mood) ctx.mood = `${ctx.mood}, ${dailyContext.mood}`;
  if (dailyContext?.note) ctx.mood = `${ctx.mood}, ${dailyContext.note}`;
  const result = suggestOutfit(ctx, items);

  // Wedding guest color rule: never lead with white/cream/ivory as the dominant piece.
  // Skip violating outfits; if nothing else exists, add an honest note instead of filtering everything.
  let weddingColorNote: string | null = null;
  if (result.context.formality === "formal" && result.outfits.length > 0) {
    const BRIDAL_COLORS = /\b(white|cream|ivory|off-white|off white)\b/i;
    const DOMINANT_TYPES = /dress|gown|jumpsuit|skirt|top|shirt|blouse|romper|playsuit/i;
    const isViolating = (o: typeof result.outfits[0]) =>
      o.pieces.some((p) => DOMINANT_TYPES.test(p.itemType) && BRIDAL_COLORS.test(p.color ?? ""));
    const clean = result.outfits.filter((o) => !isViolating(o));
    if (clean.length > 0) {
      result.outfits = clean;
    } else {
      weddingColorNote = "Your top options include cream or white pieces — as a guest you may want to pair it with a bold accessory or consider borrowing something for this one.";
    }
  }

  // Blazer rule for business formality
  const isBusinessOccasion = result.context.formality === "business";
  let blazerNote: string | null = null;
  if (isBusinessOccasion && result.outfits.length > 0) {
    const topOutfit = result.outfits[0];
    const hasBlazer = topOutfit.pieces.some((p) =>
      /blazer|structured jacket|tailored jacket/i.test(p.itemType)
    );
    if (!hasBlazer) {
      const blazerInWardrobe = items.find((i) =>
        /blazer|structured jacket|tailored jacket/i.test(i.itemType)
      );
      blazerNote = blazerInWardrobe
        ? `Throw your ${blazerInWardrobe.color ? blazerInWardrobe.color + " " : ""}${blazerInWardrobe.itemType.toLowerCase()} over this for an extra layer of polish.`
        : "One thing your wardrobe is missing for office days — a blazer would pull this together instantly.";
    }
  }

  // Footwear gap check
  let footwearNote: string | null = null;
  if (result.outfits.length > 0) {
    const hasFootwear = result.outfits[0].pieces.some((p) =>
      /shoes|boots|sneakers|heels|sandals|flats|loafers|mules|oxfords|pumps|trainers/i.test(p.itemType)
    );
    if (!hasFootwear) {
      footwearNote = "I couldn't find shoes in your wardrobe that match this occasion — pair it with something that fits the vibe.";
    }
  }

  return NextResponse.json({ ...result, blazerNote, footwearNote, weddingColorNote });
}
