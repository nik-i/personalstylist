import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const suggestion = await prisma.outfitSuggestion.findFirst({
    where: { id, userId: session.user.id },
    include: {
      occasion: true,
      outfitItems: { include: { wardrobeItem: true } },
      feedback: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  if (!suggestion) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let gapAnalysis = null;
  try {
    if (suggestion.gapAnalysis) gapAnalysis = JSON.parse(suggestion.gapAnalysis);
  } catch {}

  return NextResponse.json({ ...suggestion, gapAnalysis });
}
