import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OnboardingSchema } from "@/lib/validations/onboarding";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = OnboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 });
  }

  const { profile, sizes, brandPreferences, photoUrls } = parsed.data;
  const userId = session.user.id;

  await prisma.$transaction(async (tx) => {
    await tx.userProfile.upsert({
      where: { userId },
      update: profile,
      create: { userId, ...profile },
    });

    if (sizes?.length) {
      await Promise.all(
        sizes.map((s) =>
          tx.size.upsert({
            where: { userId_category: { userId, category: s.category } },
            update: { sizeValue: s.sizeValue, region: s.region },
            create: { userId, ...s },
          })
        )
      );
    }

    if (brandPreferences?.length) {
      await tx.brandPreference.createMany({
        data: brandPreferences.map((bp) => ({ userId, ...bp })),
      });
    }

    if (photoUrls?.length) {
      await tx.bestOutfitPhoto.createMany({
        data: photoUrls.map((url) => ({ userId, photoUrl: url })),
      });
    }
  });

  return NextResponse.json({ success: true });
}
